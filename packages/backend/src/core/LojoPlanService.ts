/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { RegistryApiService } from '@/core/RegistryApiService.js';
import { LojoAppsService } from '@/core/LojoAppsService.js';
import type { MiMeta } from '@/models/_.js';
import { planText } from '@/misc/lojo-plan-text.js';
import type { PlanText } from '@/misc/lojo-plan-text.js';
import { learnerUiLang } from '@/misc/lojo-ui-lang.js';
import type Logger from '@/logger.js';
import {
	addDays, ANSWER_APPS, autoCheck, checkinsOn, computeStages, dayProblem, dayTally, delayDays, diffDays, fillDays, isDate, lastDayOfMonth,
	hourIn, maxDate, mondayOf, planListProblems, PLAN_APPS, rollover, stageOn, startOfDay, streak, tasksOn, todayIn, typingReport, validTz, weekday,
} from '@/misc/lojo-plan.js';
import type { AnswerApp, AnswerTally, CheckinRow, DayCtx, PlanAutoDone, PlanList, PlanRow, TaskDraft, TaskRow, TaskStatus } from '@/misc/lojo-plan.js';

// 私信「任务」标签 (2026-11-15): one exam plan per learner, made and changed by Vibi's tools and by the learner on the
// task tab of the chat with Vibi. Both go through here, so the rules are the same. Everything is program: no model
// is called. Rules: src/misc/lojo-plan.ts. Design: 冲刺1111/社区工程/私信任务标签/需求-社区工程.md (Vibes workspace).

type Q = { query: (sql: string, params?: unknown[]) => Promise<any> };
type Snap = { plan?: PlanRow | null; tasks: TaskRow[]; checkins: CheckinRow[] };
export type PlanWho = 'self' | 'vibi' | 'planner';
type PlanEventRow = { userId: string; tz: string; notifyWeekly: boolean; seenAt: Date | null; createdAt: Date };
export type PlanEvent = { userId: string; kind: 'weekPlanned' | 'overdue' | 'replanOffer'; today: string; summary: string; tasks: { id?: string; title: string; date?: string; delayDays?: number }[]; seenAt?: string };
export type PlanResult = { ok: true; changeId: string; summary: string; [k: string]: unknown } | { ok: false; reason: string; code?: 'alreadyUndone' };

const ADMIN_SCOPE = ['lojo', 'planAdmin'];
const LIST_KEY = 'list:ielts';
const APP_ID = /^[a-z][a-z0-9-]{1,30}$/;
const UNDO_DAYS = 30;
const REST_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export const restDayNo = (d: unknown): number | null => (typeof d === 'number' ? d : REST_DAYS.indexOf(d as typeof REST_DAYS[number]) >= 0 ? REST_DAYS.indexOf(d as typeof REST_DAYS[number]) : null);

const TASK_COLS = ['id', 'userId', 'title', 'kind', 'stage', 'origDate', 'date', 'endDate', 'minutes', 'app', 'ref', 'autoDone', 'itemId', 'status', 'doneBy', 'doneAt', 'by', 'pinned', 'askedAt', 'offDate', 'createdAt'] as const;
const PLAN_COLS = ['userId', 'examDate', 'examTentative', 'dailyMinutes', 'target', 'current', 'restDay', 'tz', 'stages', 'focus', 'notifyWeekly', 'plannedUntil', 'seenAt', 'createdAt', 'updatedAt'] as const;
const JSON_COLS = new Set(['autoDone', 'stages']);

function upsertSql(table: string, cols: readonly string[], key: string) {
	const q = (c: string) => `"${c}"`;
	return `INSERT INTO "${table}" (${cols.map(q).join(',')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')})
		ON CONFLICT (${key}) DO UPDATE SET ${cols.filter(c => !key.includes(`"${c}"`)).map(c => `${q(c)}=EXCLUDED.${q(c)}`).join(',')}`;
}

const values = (row: Record<string, any>, cols: readonly string[]) => cols.map(c => (JSON_COLS.has(c) ? (row[c] == null ? null : JSON.stringify(row[c])) : row[c] ?? null));

function cleanAutoDone(v: unknown): PlanAutoDone {
	if (v == null || typeof v !== 'object') return null;
	const o = v as Record<string, unknown>;
	if (Number.isInteger(o.answered) && (o.answered as number) >= 1 && (o.answered as number) <= 500) return { answered: o.answered as number };
	if (o.report === true) return { report: true };
	return null;
}

@Injectable()
export class LojoPlanService {
	private logger: Logger;
	private listCache: { at: number; value: PlanList | null } | null = null;

	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.meta)
		private meta: MiMeta,

		private idService: IdService,
		private registryApiService: RegistryApiService,
		private lojoAppsService: LojoAppsService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('lojo-plan');
	}

	// ---------- the list (攻略's ielts-tasks.json, in the root account's registry; never in this repository) ----------

	public async list(): Promise<PlanList | null> {
		if (this.listCache && Date.now() - this.listCache.at < 60_000) return this.listCache.value;
		const rootId = this.meta.rootUserId;
		const item = rootId != null ? await this.registryApiService.getItem(rootId, null, ADMIN_SCOPE, LIST_KEY) : null;
		const value = item?.value != null && planListProblems(item.value).length === 0 ? item.value as PlanList : null;
		this.listCache = { at: Date.now(), value };
		return value;
	}

	public async importList(raw: unknown): Promise<{ ok: boolean; problems: string[]; stages?: number; items?: number }> {
		const problems = planListProblems(raw);
		if (problems.length > 0) return { ok: false, problems };
		const rootId = this.meta.rootUserId;
		if (rootId == null) return { ok: false, problems: ['站点没有 root 账号'] };
		const l = raw as PlanList;
		await this.registryApiService.set(rootId, null, ADMIN_SCOPE, LIST_KEY, { ...l, importedAt: new Date().toISOString() });
		this.listCache = null;
		return { ok: true, problems: [], stages: l.stages.length, items: l.stages.reduce((n, s) => n + s.items.length, 0) };
	}

	// ---------- reading ----------

	private async planOf(m: Q, userId: string): Promise<PlanRow | null> {
		return (await m.query('SELECT * FROM "lojo_plan" WHERE "userId" = $1', [userId]))[0] ?? null;
	}

	private async tasksOf(m: Q, userId: string): Promise<TaskRow[]> {
		return await m.query('SELECT * FROM "lojo_plan_task" WHERE "userId" = $1 AND "status" <> \'removed\' ORDER BY "date", "createdAt", "id"', [userId]);
	}

	private async checkinsOf(m: Q, userId: string, since: string): Promise<CheckinRow[]> {
		return await m.query('SELECT * FROM "lojo_plan_checkin" WHERE "userId" = $1 AND "date" >= $2', [userId, since]);
	}

	// The words for this learner's reasons and change summaries, in their interface language (misc/lojo-plan-text.ts).
	private async text(userId: string): Promise<PlanText> {
		return planText(await learnerUiLang(this.registryApiService, userId));
	}

	private ctx(plan: PlanRow): DayCtx {
		return { restDay: plan.restDay, dailyMinutes: plan.dailyMinutes, lastDay: addDays(plan.examDate, -1) };
	}

	public today(plan: Pick<PlanRow, 'tz'> | null): string {
		return todayIn(plan?.tz ?? 'Asia/Shanghai');
	}

	// One writer per learner at a time (the page, Vibi and the hourly check may come together).
	private async locked<T>(userId: string, fn: (m: Q) => Promise<T>): Promise<T> {
		return await this.db.transaction(async em => {
			await em.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`lojo_plan:${userId}`]);
			return await fn(em);
		});
	}

	// Before anything reads the plan: unfinished tasks from before today move to today, and this week (to Sunday) is
	// filled from the list once. Neither writes a change (they are the program's own housekeeping).
	private async prepare(m: Q, userId: string, tz?: string | null): Promise<{ plan: PlanRow; today: string; tasks: TaskRow[] } | null> {
		const plan = await this.planOf(m, userId);
		if (plan == null) return null;
		if (tz != null && validTz(tz) && tz !== plan.tz) {
			await m.query('UPDATE "lojo_plan" SET "tz" = $2 WHERE "userId" = $1', [userId, tz]);
			plan.tz = tz;
		}
		const today = todayIn(plan.tz);
		let tasks = await this.tasksOf(m, userId);
		const moves = rollover(tasks, today, plan.restDay);
		if (moves.length > 0) {
			await m.query('UPDATE "lojo_plan_task" SET "date" = $2 WHERE "id" = ANY($1)', [moves.map(x => x.id), moves[0].date]);
			tasks = tasks.map(t => { const x = moves.find(y => y.id === t.id); return x ? { ...t, date: x.date } : t; });
		}
		const sunday = addDays(mondayOf(today), 6);
		const from = plan.plannedUntil != null && plan.plannedUntil >= today ? addDays(plan.plannedUntil, 1) : today;
		if (from <= sunday) {
			const list = await this.list();
			if (list != null) {
				const drafts = fillDays(list, plan, plan.stages, tasks, from, sunday);
				tasks = [...tasks, ...await this.insertDrafts(m, userId, drafts, 'planner', false)];
			}
			await m.query('UPDATE "lojo_plan" SET "plannedUntil" = $2 WHERE "userId" = $1', [userId, sunday]);
			plan.plannedUntil = sunday;
		}
		return { plan, today, tasks };
	}

	private async insertDrafts(m: Q, userId: string, drafts: TaskDraft[], by: PlanWho, pinned: boolean): Promise<TaskRow[]> {
		const out: TaskRow[] = [];
		for (const d of drafts) {
			const row: TaskRow = { ...d, id: this.idService.gen(), userId, origDate: d.date, status: 'todo', doneBy: null, doneAt: null, by, pinned, askedAt: null, offDate: null, createdAt: new Date() };
			await m.query(upsertSql('lojo_plan_task', TASK_COLS, '"id"'), values(row, TASK_COLS));
			out.push(row);
		}
		return out;
	}

	private async putTask(m: Q, row: TaskRow) {
		await m.query(upsertSql('lojo_plan_task', TASK_COLS, '"id"'), values(row, TASK_COLS));
	}

	private async putPlan(m: Q, row: PlanRow) {
		await m.query(upsertSql('lojo_plan', PLAN_COLS, '"userId"'), values(row, PLAN_COLS));
	}

	private async putCheckin(m: Q, row: CheckinRow) {
		await m.query(`INSERT INTO "lojo_plan_checkin" ("taskId","date","userId","doneAt","doneBy") VALUES ($1,$2,$3,$4,$5)
			ON CONFLICT ("taskId","date") DO UPDATE SET "doneAt"=EXCLUDED."doneAt","doneBy"=EXCLUDED."doneBy"`, [row.taskId, row.date, row.userId, row.doneAt, row.doneBy]);
	}

	private async record(m: Q, userId: string, who: PlanWho, summary: string, before: Snap, after: Snap): Promise<string> {
		const id = this.idService.gen();
		await m.query('INSERT INTO "lojo_plan_change" ("id","userId","who","at","summary","before","after") VALUES ($1,$2,$3,now(),$4,$5,$6)',
			[id, userId, who, summary.slice(0, 512), JSON.stringify(before), JSON.stringify(after)]);
		await m.query('UPDATE "lojo_plan" SET "updatedAt" = now() WHERE "userId" = $1', [userId]);
		return id;
	}

	// ---------- what the task tab and Vibi's `plan` read ----------

	public async show(userId: string, opts: { tz?: string | null; weekOf?: string | null; seen?: boolean; board?: boolean } = {}) {
		return await this.locked(userId, async m => {
			const p = await this.prepare(m, userId, opts.tz);
			if (p == null) return { plan: null };
			const { plan, today } = p;
			if (opts.seen) await m.query('UPDATE "lojo_plan" SET "seenAt" = now() WHERE "userId" = $1', [userId]);
			return await this.view(m, plan, today, p.tasks, opts.weekOf != null && isDate(opts.weekOf) ? opts.weekOf : today, opts.board === true);
		});
	}

	private async view(m: Q, plan: PlanRow, today: string, tasks: TaskRow[], weekOf: string, board = false) {
		const userId = plan.userId;
		const checkins = await this.checkinsOf(m, userId, addDays(today, -400));
		const doneSet = new Set(checkins.filter(c => c.doneAt != null).map(c => `${c.taskId}|${c.date}`));
		const ws = mondayOf(weekOf);
		const daily = plan.dailyMinutes;
		const taskView = (t: TaskRow) => {
			const ci = checkinsOn(tasks, t.date, plan.restDay).reduce((n, x) => n + x.minutes, 0);
			return {
				id: t.id, title: t.title, kind: t.kind, stage: t.stage, date: t.date, origDate: t.origDate, minutes: t.minutes,
				app: t.app, appName: t.app ? PLAN_APPS[t.app] ?? t.app : null, ref: t.ref, autoDone: t.autoDone,
				status: t.status, doneBy: t.doneBy, by: t.by, pinned: t.pinned,
				delayDays: delayDays(t, today), asked: t.askedAt != null, long: t.minutes > daily - ci,
			};
		};
		const dayOf = (d: string) => {
			const ts = tasksOn(tasks, d);
			const cs = checkinsOn(tasks, d, plan.restDay);
			return {
				date: d, rest: weekday(d) === plan.restDay, past: d < today, ...dayTally(tasks, checkins, d, plan.restDay),
				minutes: ts.reduce((n, t) => n + t.minutes, 0) + cs.reduce((n, t) => n + t.minutes, 0),
				tasks: ts.map(taskView),
				checkins: cs.map(t => {
					const row = checkins.find(x => x.taskId === t.id && x.date === d);
					return { id: t.id, title: t.title, app: t.app, appName: t.app ? PLAN_APPS[t.app] ?? t.app : null, ref: t.ref, autoDone: t.autoDone, minutes: t.minutes, done: row?.doneAt != null, doneBy: row?.doneBy ?? null };
				}),
			};
		};
		const changes = await m.query('SELECT "id","who","at","summary","undoneAt" FROM "lojo_plan_change" WHERE "userId" = $1 ORDER BY "at" DESC LIMIT 10', [userId]);
		const all = await m.query('SELECT "stage", "kind", "status", count(*)::int AS "n" FROM "lojo_plan_task" WHERE "userId" = $1 AND "status" <> \'removed\' AND "kind" = \'task\' GROUP BY 1, 2, 3', [userId]);
		const since = plan.createdAt instanceof Date ? todayIn(plan.tz, plan.createdAt) : String(plan.createdAt).slice(0, 10);
		const now = stageOn(plan.stages, today);
		return {
			plan: {
				examDate: plan.examDate, examTentative: plan.examTentative, dailyMinutes: daily, target: plan.target, current: plan.current,
				restDay: plan.restDay, tz: plan.tz, focus: plan.focus, notifyWeekly: plan.notifyWeekly,
				stages: plan.stages.map(s => ({
					...s,
					done: all.filter((r: any) => r.stage === s.no && r.status === 'done').reduce((n: number, r: any) => n + r.n, 0),
					total: all.filter((r: any) => r.stage === s.no).reduce((n: number, r: any) => n + r.n, 0),
				})),
			},
			today, daysToExam: diffDays(plan.examDate, today), stageNow: now?.no ?? null,
			diagnostic: plan.stages.length > 0 && plan.stages.every(s => s.no === 0),
			streak: streak(today, since, plan.restDay, tasks, doneSet),
			weekStart: ws,
			days: [...Array(7).keys()].map(i => dayOf(addDays(ws, i))),
			todayView: ws === mondayOf(today) ? null : dayOf(today),
			// 看板: every task by status (the latest 60 done); only when the page asks for it
			board: board ? {
				todo: tasks.filter(t => t.kind === 'task' && t.status === 'todo').map(taskView),
				doing: tasks.filter(t => t.kind === 'task' && t.status === 'doing').map(taskView),
				done: tasks.filter(t => t.kind === 'task' && t.status === 'done')
					.sort((a, b) => new Date(b.doneAt ?? 0).getTime() - new Date(a.doneAt ?? 0).getTime()).slice(0, 60).map(taskView),
			} : null,
			recentChanges: changes.map((c: any) => ({ id: c.id, who: c.who, at: new Date(c.at).toISOString(), summary: c.summary, undone: c.undoneAt != null })),
		};
	}

	// ---------- ticking by itself (the page calls this after the plan shows; Vibi's `plan` too) ----------

	// Reads today's dictation and vocab answers (1.5 s at most, kept 30 s) and ticks what is done. Auto ticks write no
	// change. autoCheck 'skipped' when an app that has open things today did not answer: those are not ticked, and the
	// learner can still tick by hand.
	public async sync(userId: string, opts: { tz?: string | null } = {}) {
		const pr = await this.locked(userId, async m => {
			const p = await this.prepare(m, userId, opts.tz);
			return p ? { ...p, checkins: await this.checkinsOf(m, userId, p.today) } : null;
		});
		if (pr == null) return { plan: false, autoCheck: 'ok', ticked: [], progress: {}, asks: [] };
		const { plan, today } = pr;
		const want = new Set<AnswerApp>();
		for (const t of tasksOn(pr.tasks, today)) if ((t.status === 'todo' || t.status === 'doing') && (ANSWER_APPS as readonly string[]).includes(t.app ?? '')) want.add(t.app as AnswerApp);
		for (const c of checkinsOn(pr.tasks, today, plan.restDay)) if ((ANSWER_APPS as readonly string[]).includes(c.app ?? '')) want.add(c.app as AnswerApp);
		const since = startOfDay(today, plan.tz);
		const answers: Partial<Record<AnswerApp, AnswerTally | null>> = {};
		await Promise.all([...want].map(async app => {
			answers[app] = await this.lojoAppsService.answersToday(userId, app, since);
			if (answers[app] == null) this.logger.warn(`answers of ${app} did not come for ${userId}`);
		}));
		const r = autoCheck(today, plan.restDay, pr.tasks, pr.checkins, answers);
		const ticked: string[] = [];
		if (r.tick.length + r.tickCheckins.length > 0) {
			await this.locked(userId, async m => {
				const tasks = await this.tasksOf(m, userId);
				const now = new Date();
				for (const id of r.tick) {
					const t = tasks.find(x => x.id === id);
					if (t == null || t.status === 'done' || t.status === 'removed' || t.offDate === today) continue;
					await this.putTask(m, { ...t, status: 'done', doneBy: 'auto', doneAt: now, askedAt: null });
					ticked.push(id);
				}
				const rows: CheckinRow[] = await m.query('SELECT * FROM "lojo_plan_checkin" WHERE "userId" = $1 AND "date" = $2', [userId, today]);
				for (const id of r.tickCheckins) {
					const row = rows.find(x => x.taskId === id);
					if (row != null && (row.doneAt != null || row.doneBy === 'off')) continue;
					await this.putCheckin(m, { taskId: id, userId, date: today, doneAt: now, doneBy: 'auto' });
					ticked.push(id);
				}
			});
		}
		// 「勾上这件吗？」: dictation/vocab things that name no real group, and typing reports that fit two tasks
		const asks: { app: string; appName: string; taskIds: string[] }[] = [];
		const typing = pr.tasks.filter(t => t.app === 'typing' && t.date === today && (t.status === 'todo' || t.status === 'doing') && t.askedAt != null && todayIn(plan.tz, new Date(t.askedAt)) === today);
		for (const [app, ids] of [...Object.entries(r.asks), ...(typing.length ? [['typing', typing.map(t => t.id)] as [string, string[]]] : [])]) {
			const left = ids.filter(id => !ticked.includes(id));
			if (left.length) asks.push({ app, appName: PLAN_APPS[app] ?? app, taskIds: left });
		}
		const skipped = [...want].some(app => answers[app] == null);
		return { plan: true, today, autoCheck: skipped ? 'skipped' : 'ok', ticked, progress: r.progress, asks };
	}

	// The typing app reported a finished practice (lojo/apps/report). Never throws: the report itself is already saved.
	public async typingReported(userId: string) {
		try {
			await this.locked(userId, async m => {
				const pr = await this.prepare(m, userId);
				if (pr == null) return;
				const { plan, today, tasks } = pr;
				const checkins = await this.checkinsOf(m, userId, today);
				const r = typingReport(today, plan.restDay, tasks, checkins);
				const now = new Date();
				for (const id of r.tick) await this.putTask(m, { ...tasks.find(t => t.id === id)!, status: 'done', doneBy: 'auto', doneAt: now, askedAt: null });
				for (const id of r.ask) await m.query('UPDATE "lojo_plan_task" SET "askedAt" = $2 WHERE "id" = $1', [id, now]);
				for (const id of r.tickCheckins) await this.putCheckin(m, { taskId: id, userId, date: today, doneAt: now, doneBy: 'auto' });
			});
		} catch (e) {
			this.logger.warn(`typing tick failed for ${userId}: ${(e as Error).message}`);
		}
	}

	// ---------- writes (each writes one change, so it can be undone) ----------

	public async setPlan(userId: string, who: PlanWho, p: { examDate?: string | null; dailyMinutes?: number | null; target?: string | null; current?: string | null; restDay?: number | null; focus?: string | null; tz?: string | null }): Promise<PlanResult> {
		const tx = await this.text(userId);
		const missing = (['examDate', 'dailyMinutes', 'target', 'current'] as const).filter(k => p[k] == null || p[k] === '');
		if (missing.length > 0) return { ok: false, reason: tx.reason.missing(missing) };
		const list = await this.list();
		if (list == null) return { ok: false, reason: tx.reason.noList };
		let examDate = String(p.examDate); let tentative = false;
		if (/^\d{4}-\d{2}$/.test(examDate)) { examDate = lastDayOfMonth(`${examDate}-01`); tentative = true; }
		if (!isDate(examDate)) return { ok: false, reason: tx.reason.examDateFormat };
		const daily = Number(p.dailyMinutes);
		if (!Number.isInteger(daily) || daily < 15 || daily > 600) return { ok: false, reason: tx.reason.dailyMinutes };
		const restDay = p.restDay ?? 0;
		if (!Number.isInteger(restDay) || restDay < 0 || restDay > 6) return { ok: false, reason: tx.reason.restDay };
		const current = String(p.current).slice(0, 16);
		return await this.locked(userId, async m => {
			const old = await this.planOf(m, userId);
			const tz = p.tz != null && validTz(p.tz) ? p.tz : old?.tz ?? 'Asia/Shanghai';
			const today = todayIn(tz);
			if (examDate <= today) return { ok: false, reason: tx.reason.examPast };
			if (diffDays(examDate, today) > 730) return { ok: false, reason: tx.reason.examFar };
			const stages = computeStages(list, today, examDate, current);
			const tasks = old ? await this.tasksOf(m, userId) : [];
			const before: Snap = { plan: old, tasks: [], checkins: [] };
			const kept = await this.clearFrom(m, tasks, today, before, true);
			const plan: PlanRow = {
				userId, examDate, examTentative: tentative, dailyMinutes: daily, target: String(p.target).slice(0, 16), current, restDay, tz, stages,
				focus: p.focus !== undefined ? (p.focus ? String(p.focus).slice(0, 64) : null) : old?.focus ?? null,
				notifyWeekly: old?.notifyWeekly ?? true, plannedUntil: null, seenAt: old?.seenAt ?? null, createdAt: old?.createdAt ?? new Date(), updatedAt: new Date(),
			};
			const until = this.fillEnd(today);
			const made = await this.insertDrafts(m, userId, fillDays(list, plan, stages, kept, today, until), 'planner', false);
			plan.plannedUntil = until;
			await this.putPlan(m, plan);
			const after: Snap = { plan, tasks: [...before.tasks.map(t => ({ ...t, ...this.cleared(t, today) })), ...made], checkins: [] };
			const exam = tx.summary.exam(tx.date(examDate), tentative);
			const summary = stages.length === 0 ? tx.summary.saved(exam)
				: stages[0].no === 0 ? tx.summary.placement(tx.date(stages[0].start), tx.date(stages[0].end), exam)
				: tx.summary.full(stages.map(s => ({ name: s.name, start: tx.date(s.start) })), exam);
			const changeId = await this.record(m, userId, who, summary, before, after);
			return { ok: true, changeId, summary, stages, thisWeek: made.filter(t => t.kind === 'task').length };
		});
	}

	// The last day a (re)plan fills: this Sunday, or next Sunday from Saturday on (so the new week is not empty).
	private fillEnd(today: string) {
		const sunday = addDays(mondayOf(today), 6);
		return weekday(today) === 6 || weekday(today) === 0 ? addDays(sunday, weekday(today) === 0 ? 0 : 7) : sunday;
	}

	private cleared(t: TaskRow, today: string): Partial<TaskRow> {
		return t.kind === 'checkin' && t.date < today ? { endDate: addDays(today, -1) } : { status: 'removed' };
	}

	// From today on, take out what the program planned and the learner has not touched (not pinned, not done). Planner
	// check-ins that began earlier end yesterday, so the past days keep their check-ins. Returns what stays.
	private async clearFrom(m: Q, tasks: TaskRow[], today: string, before: Snap, all: boolean): Promise<TaskRow[]> {
		const out: TaskRow[] = [];
		for (const t of tasks) {
			const replaceable = !t.pinned && t.status !== 'done' && (all || t.by === 'planner') && (
				t.kind === 'task' ? t.date >= today : t.by === 'planner' && (t.endDate == null || t.endDate >= today));
			if (!replaceable) { out.push(t); continue; }
			before.tasks.push(t);
			const c = this.cleared(t, today);
			if (c.status === 'removed') {
				await m.query('UPDATE "lojo_plan_task" SET "status" = \'removed\' WHERE "id" = $1', [t.id]);
			} else {
				await m.query('UPDATE "lojo_plan_task" SET "endDate" = $2 WHERE "id" = $1', [t.id, c.endDate]);
				out.push({ ...t, ...c });
			}
		}
		return out;
	}

	public async addTask(userId: string, who: PlanWho, p: { title: string; date?: string | null; minutes: number; kind?: string | null; app?: string | null; ref?: string | null; autoDone?: unknown }): Promise<PlanResult> {
		const tx = await this.text(userId);
		const title = String(p.title ?? '').trim().slice(0, 128);
		if (title === '') return { ok: false, reason: tx.reason.noTitle };
		const minutes = Number(p.minutes);
		if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) return { ok: false, reason: tx.reason.minutes };
		const kind = p.kind === 'checkin' ? 'checkin' : 'task';
		if (p.app != null && !APP_ID.test(p.app)) return { ok: false, reason: tx.reason.noApp(p.app) };
		return await this.locked(userId, async m => {
			const pr = await this.prepare(m, userId);
			if (pr == null) return { ok: false, reason: tx.reason.noPlanYet };
			const { plan, today, tasks } = pr;
			const date = p.date ?? today;
			if (!isDate(date)) return { ok: false, reason: tx.reason.dateFormat('2026-11-20') };
			const why = dayProblem(this.ctx(plan), tasks, date, today, minutes, kind, undefined, tx.lang);
			if (why) return { ok: false, reason: why };
			const stage = stageOn(plan.stages, date)?.no ?? plan.stages.at(-1)?.no ?? 0;
			const [row] = await this.insertDrafts(m, userId, [{
				title, kind, stage, date, endDate: null, minutes, app: p.app ?? null, ref: p.ref ? String(p.ref).slice(0, 32) : null, autoDone: cleanAutoDone(p.autoDone), itemId: null,
			}], who, true);
			const summary = kind === 'checkin' ? tx.summary.addCheckin(title, tx.date(date)) : tx.summary.addTask(title, tx.date(date));
			const changeId = await this.record(m, userId, who, summary, { tasks: [], checkins: [] }, { tasks: [row], checkins: [] });
			return { ok: true, changeId, summary, taskId: row.id };
		});
	}

	public async moveTask(userId: string, who: PlanWho, p: { taskId: string; toDate: string }): Promise<PlanResult> {
		const tx = await this.text(userId);
		if (!isDate(p.toDate)) return { ok: false, reason: tx.reason.dateFormat('2026-11-20') };
		return await this.locked(userId, async m => {
			const pr = await this.prepare(m, userId);
			if (pr == null) return { ok: false, reason: tx.reason.noPlan };
			const { plan, today, tasks } = pr;
			const t = tasks.find(x => x.id === p.taskId);
			if (t == null) return { ok: false, reason: tx.reason.noTask };
			if (t.kind !== 'task') return { ok: false, reason: tx.reason.checkinNoMove };
			if (t.status === 'done') return { ok: false, reason: tx.reason.taskDone };
			if (t.date === p.toDate) return { ok: false, reason: tx.reason.alreadyOn(tx.date(p.toDate)) };
			const why = dayProblem(this.ctx(plan), tasks, p.toDate, today, t.minutes, 'task', t.id, tx.lang);
			if (why) return { ok: false, reason: why };
			const moved = { ...t, date: p.toDate, pinned: true };
			await this.putTask(m, moved);
			const summary = tx.summary.move(t.title, tx.date(p.toDate));
			const changeId = await this.record(m, userId, who, summary, { tasks: [t], checkins: [] }, { tasks: [moved], checkins: [] });
			return { ok: true, changeId, summary };
		});
	}

	public async setStatus(userId: string, who: PlanWho, p: { taskId: string; status: string; date?: string | null; via?: string | null }): Promise<PlanResult> {
		const tx = await this.text(userId);
		if (!['todo', 'doing', 'done', 'removed'].includes(p.status)) return { ok: false, reason: tx.reason.status };
		const status = p.status as TaskStatus;
		return await this.locked(userId, async m => {
			const pr = await this.prepare(m, userId);
			if (pr == null) return { ok: false, reason: tx.reason.noPlan };
			const { plan, today, tasks } = pr;
			const t = tasks.find(x => x.id === p.taskId);
			if (t == null) return { ok: false, reason: tx.reason.noTask };
			// 「勾上这件吗？」 → 勾上: the learner's own tick, shown as 「刚练完，你勾上的」
			const doneBy = who === 'vibi' ? 'vibi' : p.via === 'ask' ? 'ask' : 'self';
			if (t.kind === 'checkin' && status !== 'removed') {
				const date = p.date ?? today;
				if (!isDate(date) || date > today) return { ok: false, reason: tx.reason.checkinPast };
				if (!checkinsOn([t], date, plan.restDay).length) return { ok: false, reason: tx.reason.noCheckinOn(tx.date(date)) };
				const old: CheckinRow | undefined = (await m.query('SELECT * FROM "lojo_plan_checkin" WHERE "taskId" = $1 AND "date" = $2', [t.id, date]))[0];
				// unticked by hand: kept as a row without doneAt, so it is not ticked back automatically today
				const row: CheckinRow = { taskId: t.id, userId, date, doneAt: status === 'done' ? new Date() : null, doneBy: status === 'done' ? doneBy : 'off' };
				await this.putCheckin(m, row);
				const summary = tx.summary.checkin(t.title, status === 'done');
				const changeId = await this.record(m, userId, who, summary, { tasks: [], checkins: old ? [old] : [] }, { tasks: [], checkins: [row] });
				return { ok: true, changeId, summary };
			}
			if (t.status === status) return { ok: false, reason: tx.reason.sameStatus };
			const next: TaskRow = { ...t, status };
			if (status === 'done') Object.assign(next, { doneBy, doneAt: new Date(), offDate: null, askedAt: null });
			else if (t.status === 'done') Object.assign(next, { doneBy: null, doneAt: null, offDate: today });
			await this.putTask(m, next);
			const summary = tx.summary.status(status, t.title, t.kind === 'checkin');
			const changeId = await this.record(m, userId, who, summary, { tasks: [t], checkins: [] }, { tasks: [next], checkins: [] });
			return { ok: true, changeId, summary };
		});
	}

	public async planWeek(userId: string, who: PlanWho, p: { weekStart?: string | null }): Promise<PlanResult> {
		const tx = await this.text(userId);
		if (p.weekStart != null && !isDate(p.weekStart)) return { ok: false, reason: tx.reason.dateFormat('2026-11-17') };
		const list = await this.list();
		if (list == null) return { ok: false, reason: tx.reason.noList };
		return await this.locked(userId, async m => {
			const pr = await this.prepare(m, userId);
			if (pr == null) return { ok: false, reason: tx.reason.noPlanYet };
			const { plan, today, tasks } = pr;
			const ws = p.weekStart != null ? mondayOf(p.weekStart) : addDays(mondayOf(today), 7);
			const from = maxDate(ws, today); const to = addDays(ws, 6);
			if (to < today) return { ok: false, reason: tx.reason.weekPast };
			const before: Snap = { tasks: [], checkins: [] };
			const kept: TaskRow[] = [];
			for (const t of tasks) {
				if (t.kind === 'task' && t.by === 'planner' && !t.pinned && t.status === 'todo' && t.date >= from && t.date <= to) {
					before.tasks.push(t);
					await m.query('UPDATE "lojo_plan_task" SET "status" = \'removed\' WHERE "id" = $1', [t.id]);
				} else kept.push(t);
			}
			const made = await this.insertDrafts(m, userId, fillDays(list, plan, plan.stages, kept, from, to), 'planner', false);
			if (plan.plannedUntil == null || plan.plannedUntil < to) await m.query('UPDATE "lojo_plan" SET "plannedUntil" = $2 WHERE "userId" = $1', [userId, to]);
			const n = made.filter(t => t.kind === 'task').length;
			if (n === 0 && before.tasks.length === 0) return { ok: false, reason: plan.stages.every(s => s.no === 0) ? tx.reason.onlyPlacement : tx.reason.nothingThisWeek };
			const summary = tx.summary.week(tx.date(ws), n);
			const after: Snap = { tasks: [...before.tasks.map(t => ({ ...t, status: 'removed' as const })), ...made], checkins: [] };
			const changeId = await this.record(m, userId, who, summary, before, after);
			const days = [...Array(7).keys()].map(i => addDays(ws, i)).map(d => ({ date: d, tasks: tasksOn([...kept, ...made], d).map(t => t.title) }));
			return { ok: true, changeId, summary, days };
		});
	}

	public async replanFromToday(userId: string, who: PlanWho): Promise<PlanResult> {
		const tx = await this.text(userId);
		const list = await this.list();
		if (list == null) return { ok: false, reason: tx.reason.noList };
		return await this.locked(userId, async m => {
			const pr = await this.prepare(m, userId);
			if (pr == null) return { ok: false, reason: tx.reason.noPlanYet };
			const { plan, today, tasks } = pr;
			const stages = computeStages(list, today, plan.examDate, plan.current);
			const before: Snap = { plan: { ...plan }, tasks: [], checkins: [] };
			const kept = await this.clearFrom(m, tasks, today, before, true);
			const until = this.fillEnd(today);
			const next: PlanRow = { ...plan, stages, plannedUntil: until, updatedAt: new Date() };
			const made = await this.insertDrafts(m, userId, fillDays(list, next, stages, kept, today, until), 'planner', false);
			await this.putPlan(m, next);
			const n = made.filter(t => t.kind === 'task').length;
			const last = stages.at(-1);
			const where = stages.length > 1 && last ? tx.summary.replanStage(last.name, tx.date(last.start)) : last?.no === 3 ? tx.summary.replanSprint : '';
			const summary = tx.summary.replan(n, where);
			const after: Snap = { plan: next, tasks: [...before.tasks.map(t => ({ ...t, ...this.cleared(t, today) })), ...made], checkins: [] };
			const changeId = await this.record(m, userId, who, summary, before, after);
			return { ok: true, changeId, summary };
		});
	}

	// Writes `before` back. Tasks the change made are taken out (status removed, never deleted).
	public async undo(userId: string, who: PlanWho, p: { changeId: string }): Promise<PlanResult> {
		const tx = await this.text(userId);
		return await this.locked(userId, async m => {
			const c = (await m.query('SELECT * FROM "lojo_plan_change" WHERE "id" = $1 AND "userId" = $2', [p.changeId, userId]))[0];
			if (c == null) return { ok: false, reason: tx.reason.noChange };
			// code: the web app tells 「already undone」 apart by this, not by the words (they follow the language)
			if (c.undoneAt != null) return { ok: false, reason: tx.reason.alreadyUndone, code: 'alreadyUndone' };
			if (Date.now() - new Date(c.at).getTime() > UNDO_DAYS * 86400_000) return { ok: false, reason: tx.reason.tooOld(UNDO_DAYS) };
			const before = c.before as Snap; const after = c.after as Snap;
			const now: Snap = { tasks: [], checkins: [] };
			if ('plan' in before) {
				now.plan = await this.planOf(m, userId);
				if (before.plan == null) await m.query('DELETE FROM "lojo_plan" WHERE "userId" = $1', [userId]);
				else await this.putPlan(m, before.plan);
			}
			const ids = [...new Set([...before.tasks, ...after.tasks].map(t => t.id))];
			if (ids.length > 0) now.tasks = await m.query('SELECT * FROM "lojo_plan_task" WHERE "id" = ANY($1) AND "userId" = $2', [ids, userId]);
			for (const t of before.tasks) await this.putTask(m, { ...t, userId });
			for (const t of after.tasks) {
				if (!before.tasks.some(x => x.id === t.id)) await m.query('UPDATE "lojo_plan_task" SET "status" = \'removed\' WHERE "id" = $1 AND "userId" = $2', [t.id, userId]);
			}
			for (const k of after.checkins) {
				const old = (await m.query('SELECT * FROM "lojo_plan_checkin" WHERE "taskId" = $1 AND "date" = $2 AND "userId" = $3', [k.taskId, k.date, userId]))[0];
				if (old) now.checkins.push(old);
				const b = before.checkins.find(x => x.taskId === k.taskId && x.date === k.date);
				if (b) await this.putCheckin(m, { ...b, userId });
				else await m.query('DELETE FROM "lojo_plan_checkin" WHERE "taskId" = $1 AND "date" = $2 AND "userId" = $3', [k.taskId, k.date, userId]);
			}
			await m.query('UPDATE "lojo_plan_change" SET "undoneAt" = now() WHERE "id" = $1', [c.id]);
			const summary = tx.summary.undo(c.summary);
			const changeId = await this.record(m, userId, who, summary, now, before);
			return { ok: true, changeId, summary };
		});
	}

	// ---------- Vibi's `plan` tool (lojo/tutor/pilot-tool; the shape of prototypes/mia-mastra/tools/fake-plan.mjs) ----------

	// Ticks what is done first (as the page does), then today and the next two weeks, today's check-ins and the last 10
	// changes, the learner's own on the page included. answeredToday only for today's dictation and vocab things;
	// pendingAsk is a 「勾上这件吗？」 waiting for the learner (Vibi only sees it, never answers it for them).
	public async vibiPlan(userId: string) {
		const s = await this.sync(userId);
		if (!s.plan) return { plan: null, note: '还没有计划' };
		const progress = s.progress as Record<string, { answered: number; need: number } | undefined>;
		const asking = new Set(s.asks.flatMap(a => a.taskIds));
		return await this.locked(userId, async m => {
			const p = await this.prepare(m, userId);
			if (p == null) return { plan: null, note: '还没有计划' };
			const { plan, today, tasks } = p;
			const checkins = await this.checkinsOf(m, userId, today);
			const until = addDays(mondayOf(today), 13);
			const num = (x: string | null) => (x != null && /^\d+(\.\d+)?$/.test(x) ? Number(x) : x);
			const changes = await m.query('SELECT "id","who","at","summary","undoneAt" FROM "lojo_plan_change" WHERE "userId" = $1 ORDER BY "at" DESC LIMIT 10', [userId]);
			return {
				examDate: plan.examDate, examTentative: plan.examTentative, dailyMinutes: plan.dailyMinutes, target: num(plan.target), current: num(plan.current),
				restDay: REST_DAYS[plan.restDay], tz: plan.tz, focus: plan.focus,
				stages: plan.stages.map(st => ({ stageNo: st.no, name: st.name, goal: st.goal, from: st.start, to: st.end })),
				today,
				tasks: tasks.filter(t => t.kind === 'task' && t.status !== 'removed' && t.date >= today && t.date <= until)
					.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
					.map(t => ({
						id: t.id, title: t.title, date: t.date, stage: t.stage, minutes: t.minutes, app: t.app, ref: t.ref, autoDone: t.autoDone,
						status: t.status, doneBy: t.doneBy, by: t.by, pinned: t.pinned, delayDays: delayDays(t, today),
						...(t.date === today && progress[t.id] ? { answeredToday: progress[t.id]!.answered, need: progress[t.id]!.need } : {}),
						pendingAsk: asking.has(t.id),
					})),
				checkins: checkinsOn(tasks, today, plan.restDay).map(c => {
					const row = checkins.find(x => x.taskId === c.id && x.date === today);
					return { id: c.id, title: c.title, app: c.app, ref: c.ref, doneToday: row?.doneAt != null, ...(progress[c.id] ? { answeredToday: progress[c.id]!.answered, need: progress[c.id]!.need } : {}) };
				}),
				autoCheck: s.autoCheck,
				recentChanges: changes.map((c: any) => ({ changeId: c.id, summary: c.summary, by: c.who, at: new Date(c.at).toISOString(), undone: c.undoneAt != null })),
			};
		});
	}

	// Vibi's changes in this reply, for the change cards under it in the chat (LojoTutorService).
	public async changesSince(userId: string, who: PlanWho, since: Date): Promise<{ id: string; summary: string }[]> {
		return await this.db.query('SELECT "id","summary" FROM "lojo_plan_change" WHERE "userId" = $1 AND "who" = $2 AND "at" >= $3 ORDER BY "at"', [userId, who, since]);
	}

	// ---------- the hourly check (LojoTutorService runs it; it decides whether Vibi may write) ----------

	// For each plan, in the learner's own time zone: Sunday 20:00 plans next week (the program; weekPlanned if they want
	// to hear), 09:00 the tasks three days late or more (overdue; the caller asks about each task once), 10:00 no visit to
	// the task tab for three days (replanOffer; the caller checks the chat too and offers once).
	public async hourly(now: Date = new Date()): Promise<PlanEvent[]> {
		const rows: PlanEventRow[] = await this.db.query('SELECT "userId","tz","notifyWeekly","seenAt","createdAt" FROM "lojo_plan"');
		const out: PlanEvent[] = [];
		for (const r of rows) {
			const tz = validTz(r.tz) ? r.tz : 'Asia/Shanghai';
			const hour = hourIn(tz, now);
			const kind = weekday(todayIn(tz, now)) === 0 && hour === 20 ? 'weekPlanned' : hour === 9 ? 'overdue' : hour === 10 ? 'replanOffer' : null;
			if (kind == null) continue;
			try {
				const ev = await this.eventOf(r, kind, now, false);
				if (ev != null) out.push(ev);
			} catch (e) {
				this.logger.warn(`hourly plan check failed for ${r.userId}: ${(e as Error).message}`);
			}
		}
		return out;
	}

	// One learner's event now, for the admin endpoint lojo/tutor/plan-poke (force: weekPlanned plans next week even on a
	// weekday and with 「周日排完告诉我」 off; replanOffer even if they opened the tab lately). overdue still needs a task
	// three days late or more. null: no plan, or nothing to say.
	public async eventFor(userId: string, kind: PlanEvent['kind'], now: Date = new Date()): Promise<PlanEvent | null> {
		const rows: PlanEventRow[] = await this.db.query('SELECT "userId","tz","notifyWeekly","seenAt","createdAt" FROM "lojo_plan" WHERE "userId" = $1', [userId]);
		return rows.length === 0 ? null : await this.eventOf(rows[0], kind, now, true);
	}

	private async eventOf(r: PlanEventRow, kind: PlanEvent['kind'], now: Date, force: boolean): Promise<PlanEvent | null> {
		const tz = validTz(r.tz) ? r.tz : 'Asia/Shanghai';
		const today = todayIn(tz, now);
		if (kind === 'weekPlanned') {
			const res = await this.planWeek(r.userId, 'planner', {});
			if (!res.ok || !(r.notifyWeekly || force)) return null;
			const days = (res.days as { date: string; tasks: string[] }[] | undefined) ?? [];
			return { userId: r.userId, kind, today, summary: res.summary, tasks: days.flatMap(d => d.tasks.map(title => ({ title, date: d.date }))).slice(0, 8) };
		}
		if (kind === 'overdue') {
			const late = await this.locked(r.userId, async m => {
				const p = await this.prepare(m, r.userId);
				return p ? p.tasks.filter(t => t.kind === 'task' && (t.status === 'todo' || t.status === 'doing') && delayDays(t, p.today) >= 3) : [];
			});
			if (late.length === 0) return null;
			return { userId: r.userId, kind, today, summary: `${late.length} 件拖了 3 天以上`, tasks: late.slice(0, 8).map(t => ({ id: t.id, title: t.title, date: t.origDate, delayDays: delayDays(t, today) })) };
		}
		const last = r.seenAt ?? r.createdAt;
		if (!force && now.getTime() - new Date(last).getTime() < 3 * 86400_000) return null;
		return { userId: r.userId, kind, today, summary: '3 天没打开任务页，也没来私信聊天', tasks: [], seenAt: new Date(last).toISOString() };
	}

	// Page settings: the learner's time zone (read from the browser) and 「周日排完告诉我」. Not a change.
	public async settings(userId: string, p: { tz?: string | null; notifyWeekly?: boolean | null }) {
		if (p.tz != null && !validTz(p.tz)) return { ok: false, reason: (await this.text(userId)).reason.timezone };
		await this.db.query('UPDATE "lojo_plan" SET "tz" = coalesce($2, "tz"), "notifyWeekly" = coalesce($3, "notifyWeekly") WHERE "userId" = $1', [userId, p.tz ?? null, p.notifyWeekly ?? null]);
		return { ok: true };
	}
}
