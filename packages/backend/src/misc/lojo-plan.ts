/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 私信「任务」标签 (2026-11-15): the plan's rules as pure functions, so they can be unit-tested without a database.
// Dates are the learner's own calendar days, 'YYYY-MM-DD' in the learner's time zone (lojo_plan.tz). The list of what
// each stage holds (攻略's ielts-tasks.json) is not in this repository: it is imported into the site's registry.
// Design: 冲刺1111/社区工程/私信任务标签/需求-社区工程.md in the Vibes workspace.

import { planText } from '@/misc/lojo-plan-text.js';
import { isSkill, isTaskSkill, s1Skills } from '@/misc/lojo-plan-score.js';
import type { Skill, SkillMap, TaskSkill, Weak } from '@/misc/lojo-plan-score.js';
import type { UiLang } from '@/misc/lojo-ui-lang.js';

export type PlanAutoDone = { answered?: number; report?: boolean } | null;

// The guide that says how to do a task: /guides/<slug>; section is only shown on the card (a page cannot jump to it),
// block is the section's number in the article. S1 has one per skill and takes the one of the skill it trains that day.
export type PlanGuide = { slug: string; section?: string | null; block?: string | null };

// 学习计划第一版 (2026-11-20) added: skill, guide, mock (a full mock: the card offers 「记分」), alone (that day only it
// and the check-ins), cadence (every N days of the stage instead of perWeek: the stage mocks P1), after + offsetDays
// (the day after another item, before the day's minutes are counted: P2, P3, R2), fillFrom 'weak' (S1, see
// misc/lojo-plan-score.ts). perWeek is left out when cadence or after is given.
export type PlanCadence = { everyDays: number; startDay: number; skipWithinDaysOfNextStage?: number };
export type PlanItem = {
	id: string; name: string; minutes: number; kind: 'task' | 'checkin'; app: string | null;
	ref: string | string[] | null; perWeek?: number | 'once' | 'rotate'; priority: number;
	autoDone: PlanAutoDone | 'manual'; fillFrom?: string; fallbackName?: string; note?: string;
	skill?: TaskSkill; guide?: PlanGuide | SkillMap<PlanGuide>; mock?: boolean; alone?: boolean;
	cadence?: PlanCadence; after?: string; offsetDays?: number;
};
export type PlanStageDef = { stageNo: number; name: string; goal: string; share?: number; lengthDays?: number; items: PlanItem[] };
export type PlanList = { track: string; from?: string; stages: PlanStageDef[] };

export type PlanStage = { no: number; name: string; goal: string; start: string; end: string };

export type PlanRow = {
	userId: string; examDate: string; examTentative: boolean; dailyMinutes: number; target: string; current: string | null;
	restDay: number; tz: string; stages: PlanStage[]; focus: string | null; notifyWeekly: boolean; plannedUntil: string | null;
	seenAt: Date | null; createdAt: Date; updatedAt: Date;
	// per skill: the learner's own target and the school's minimum (null: the overall target, no minimum); the weak skill
	targets: SkillMap<number> | null; minimums: SkillMap<number> | null; weak: Weak | null;
};

export type TaskStatus = 'todo' | 'doing' | 'done' | 'removed';
export type TaskRow = {
	id: string; userId: string; title: string; kind: 'task' | 'checkin'; stage: number; origDate: string; date: string;
	endDate: string | null; minutes: number; app: string | null; ref: string | null; autoDone: PlanAutoDone; itemId: string | null;
	status: TaskStatus; doneBy: string | null; doneAt: Date | null; by: string; pinned: boolean; askedAt: Date | null;
	offDate: string | null; createdAt: Date;
	skill: TaskSkill | null; guide: PlanGuide | null; mock: boolean | null;
};
export type CheckinRow = { taskId: string; userId: string; date: string; doneAt: Date | null; doneBy: string | null };

export const MAX_TASKS_PER_DAY = 5;
export const MAX_CHECKINS_PER_DAY = 2;
export const DICTATION_SETS: Record<string, string> = { spelling: '单词拼写', numbers: '数字和日期', plural: '单复数' };
export const PLAN_APPS: Record<string, string> = { dictation: '听写', vocab: '词汇线', typing: '打字', grammar: '语法', wordbook: '生词本' };

// ---------- calendar days ----------

const DAY = 86400_000;
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ms = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));

export function isDate(d: unknown): d is string {
	if (typeof d !== 'string' || !RE_DATE.test(d)) return false;
	return new Date(ms(d)).toISOString().slice(0, 10) === d;
}
export const addDays = (d: string, n: number) => new Date(ms(d) + n * DAY).toISOString().slice(0, 10);
// a − b in days
export const diffDays = (a: string, b: string) => Math.round((ms(a) - ms(b)) / DAY);
// 0 = Sunday … 6 = Saturday
export const weekday = (d: string) => new Date(ms(d)).getUTCDay();
export const mondayOf = (d: string) => addDays(d, -((weekday(d) + 6) % 7));
export const minDate = (a: string, b: string) => (a < b ? a : b);
export const maxDate = (a: string, b: string) => (a > b ? a : b);
export function lastDayOfMonth(d: string): string {
	const y = Number(d.slice(0, 4)); const m = Number(d.slice(5, 7));
	return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}
export function daysBetween(from: string, to: string): string[] {
	const out: string[] = [];
	for (let d = from; d <= to && out.length < 800; d = addDays(d, 1)) out.push(d);
	return out;
}

export function validTz(tz: unknown): tz is string {
	if (typeof tz !== 'string' || tz.length === 0 || tz.length > 64) return false;
	try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
}

function parts(tz: string, at: Date) {
	const p: Record<string, string> = {};
	for (const x of new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(at)) p[x.type] = x.value;
	return p;
}

export function todayIn(tz: string, at: Date = new Date()): string {
	const p = parts(tz, at);
	return `${p.year}-${p.month}-${p.day}`;
}
export function hourIn(tz: string, at: Date = new Date()): number {
	return Number(parts(tz, at).hour);
}
// The instant the learner's day starts (00:00 in their time zone), for asking the mini apps "what since midnight".
export function startOfDay(d: string, tz: string): Date {
	let guess = ms(d);
	for (let i = 0; i < 2; i++) {
		const p = parts(tz, new Date(guess));
		const shown = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
		guess += ms(d) - shown;
	}
	return new Date(guess);
}

// 「11 月 20 日（周四）」: how the learner reads a date (never 2026-11-20). English and the other words: misc/lojo-plan-text.ts.
export const cnDate = planText('zh').date;

// ---------- the list ----------

// Problems with an imported list (empty = fine). Checked once, at import.
export function planListProblems(raw: unknown): string[] {
	const out: string[] = [];
	const l = raw as PlanList | null;
	if (l == null || typeof l !== 'object' || !Array.isArray(l.stages)) return ['没有 stages'];
	for (const s of l.stages) {
		if (![0, 1, 2, 3].includes(s.stageNo)) out.push(`段号 ${s.stageNo} 不对`);
		if (typeof s.name !== 'string' || s.name === '') out.push(`段 ${s.stageNo} 没有名字`);
		if (!Array.isArray(s.items)) { out.push(`段 ${s.stageNo} 没有 items`); continue; }
		for (const it of s.items) {
			const at = `段 ${s.stageNo} ${it.id}`;
			if (typeof it.id !== 'string' || it.id === '') out.push(`${at}：没有 id`);
			if (typeof it.name !== 'string' || it.name === '') out.push(`${at}：没有 name`);
			if (!Number.isInteger(it.minutes) || it.minutes < 1 || it.minutes > 600) out.push(`${at}：minutes 不对`);
			if (it.kind !== 'task' && it.kind !== 'checkin') out.push(`${at}：kind 不对`);
			const timed = it.cadence != null || it.after != null;
			if (it.perWeek == null ? !timed : !(typeof it.perWeek === 'number' || it.perWeek === 'once' || it.perWeek === 'rotate')) out.push(`${at}：perWeek 不对`);
			if (!Number.isInteger(it.priority)) out.push(`${at}：priority 不对`);
			if (/\{(?!ref\}|focus\}|setName\})[^}]*\}/.test(it.name)) out.push(`${at}：事名里有认不得的 {}`);
			if (/\{(focus|setName)\}/.test(it.name) && !it.fallbackName) out.push(`${at}：有 {} 但没有 fallbackName`);
			out.push(...itemProblems(it, s.items).map(p => `${at}：${p}`));
		}
	}
	if (!l.stages.some(s => s.stageNo === 3)) out.push('没有冲刺段');
	return out;
}

function guideProblem(g: unknown): string | null {
	const one = (x: unknown) => x != null && typeof x === 'object' && typeof (x as PlanGuide).slug === 'string' && /^[a-z0-9-]{1,64}$/.test((x as PlanGuide).slug)
		&& ['section', 'block'].every(k => (x as Record<string, unknown>)[k] == null || typeof (x as Record<string, unknown>)[k] === 'string');
	if (g == null || one(g)) return null;
	if (typeof g !== 'object' || Array.isArray(g)) return 'guide 不对';
	for (const [k, v] of Object.entries(g)) if (!isSkill(k) || !one(v)) return `guide 的 ${k} 不对（要 {slug, section}，按科写只能是 listening/reading/writing/speaking）`;
	return null;
}

// The fields of 学习计划第一版 (one item; `items` = its stage's items).
function itemProblems(it: PlanItem, items: PlanItem[]): string[] {
	const out: string[] = [];
	if (it.skill != null && !isTaskSkill(it.skill)) out.push('skill 不对（listening/speaking/reading/writing/vocab/grammar/mixed）');
	const g = guideProblem(it.guide); if (g) out.push(g);
	for (const k of ['mock', 'alone'] as const) if (it[k] != null && typeof it[k] !== 'boolean') out.push(`${k} 要写 true 或 false`);
	if (it.cadence != null) {
		const c = it.cadence;
		if (!Number.isInteger(c.everyDays) || c.everyDays < 1 || c.everyDays > 90) out.push('cadence.everyDays 不对');
		if (!Number.isInteger(c.startDay) || c.startDay < 1 || c.startDay > 365) out.push('cadence.startDay 不对');
		if (c.skipWithinDaysOfNextStage != null && (!Number.isInteger(c.skipWithinDaysOfNextStage) || c.skipWithinDaysOfNextStage < 0 || c.skipWithinDaysOfNextStage > 90)) out.push('cadence.skipWithinDaysOfNextStage 不对');
		if (it.perWeek != null || it.after != null) out.push('写了 cadence 就不写 perWeek、after');
	}
	if (it.after != null) {
		const a = items.find(x => x.id === it.after);
		if (a == null) out.push(`after 的 ${it.after} 不在这一段`);
		else if (a.cadence == null && typeof a.perWeek !== 'number') out.push(`after 的 ${it.after} 要是按天数（cadence）或每周几次（perWeek 数字）排的`);
		if (it.offsetDays != null && (!Number.isInteger(it.offsetDays) || it.offsetDays < 0 || it.offsetDays > 14)) out.push('offsetDays 不对');
		if (it.perWeek != null) out.push('写了 after 就不写 perWeek');
	}
	if (it.fillFrom === 'weak' && typeof it.perWeek !== 'number') out.push('fillFrom weak 要配每周几次（perWeek 数字）');
	return out;
}

// ---------- stages ----------

// The stages from today to the day before the exam. Not taken an exam yet (current 'unknown'): only the 7-day 摸底;
// the whole plan comes once the score is in (setPlan again). Under 21 days: only 冲刺.
export function computeStages(list: PlanList, today: string, examDate: string, current: string | null): PlanStage[] {
	const last = addDays(examDate, -1);
	if (last < today) return [];
	const def = (n: number) => list.stages.find(s => s.stageNo === n);
	const stage = (n: number, start: string, end: string): PlanStage => ({ no: n, name: def(n)?.name ?? '', goal: def(n)?.goal ?? '', start, end });
	if (current == null || current === 'unknown') {
		return [stage(0, today, minDate(addDays(today, (def(0)?.lengthDays ?? 7) - 1), last))];
	}
	const days = diffDays(examDate, today);
	if (days < 21) return [stage(3, today, last)];
	const share = [1, 2, 3].map(n => def(n)?.share ?? [0.3, 0.4, 0.3][n - 1]);
	const total = share.reduce((a, b) => a + b, 0) || 1;
	const n1 = Math.max(1, Math.round(days * share[0] / total));
	const n2 = Math.max(1, Math.round(days * share[1] / total));
	const s2 = addDays(today, n1);
	const s3 = addDays(s2, n2);
	return [stage(1, today, addDays(s2, -1)), stage(2, s2, addDays(s3, -1)), stage(3, s3, last)];
}

export const stageOn = (stages: PlanStage[], d: string) => stages.find(s => s.start <= d && d <= s.end) ?? null;

// ---------- one day ----------

export type DayCtx = { restDay: number; dailyMinutes: number; lastDay: string };
export const isStudyDay = (c: DayCtx, d: string) => weekday(d) !== c.restDay && d <= c.lastDay;

const active = (t: TaskRow) => t.status !== 'removed';
export const checkinsOn = (tasks: TaskRow[], d: string, restDay: number) =>
	weekday(d) === restDay ? [] : tasks.filter(t => t.kind === 'checkin' && active(t) && t.date <= d && (t.endDate == null || d <= t.endDate));
export const tasksOn = (tasks: TaskRow[], d: string) => tasks.filter(t => t.kind === 'task' && active(t) && t.date === d);

// Why a task of `minutes` does not fit on day d (null = it fits), in the learner's interface language. `except` is the
// task being moved.
export function dayProblem(c: DayCtx, tasks: TaskRow[], d: string, today: string, minutes: number, kind: 'task' | 'checkin', except?: string, lang: UiLang = 'zh'): string | null {
	const t = planText(lang);
	if (d < today) return t.reason.dayPast;
	if (d > c.lastDay) return t.reason.afterExam(t.date(d));
	if (weekday(d) === c.restDay) return t.reason.restDayOn(t.day(d));
	const others = tasks.filter(x => x.id !== except);
	if (kind === 'checkin') {
		return checkinsOn(others, d, c.restDay).length >= MAX_CHECKINS_PER_DAY ? t.reason.checkinsFull(MAX_CHECKINS_PER_DAY) : null;
	}
	const day = tasksOn(others, d);
	if (day.length >= MAX_TASKS_PER_DAY) return t.reason.dayFull(t.date(d), MAX_TASKS_PER_DAY);
	const used = day.reduce((n, x) => n + x.minutes, 0) + checkinsOn(others, d, c.restDay).reduce((n, x) => n + x.minutes, 0);
	if (used + minutes > c.dailyMinutes) return t.reason.overMinutes(used + minutes, c.dailyMinutes);
	return null;
}

// 学习计划第一版补 (2026-11-20, AI tutor): a day only an `alone` item (P1, R1: a full mock) and the check-ins go on.
// Up to plannedUntil what is on the day counts (the learner may have moved or removed the mock); after it, what the
// list will put there.
export function aloneOn(list: PlanList, plan: Pick<PlanRow, 'restDay' | 'dailyMinutes' | 'examDate' | 'focus' | 'stages' | 'plannedUntil'>, tasks: TaskRow[], d: string, ex: FillExtra = {}): boolean {
	const ids = new Set(list.stages.flatMap(s => s.items.filter(x => x.alone === true).map(x => x.id)));
	if (tasksOn(tasks, d).some(t => t.itemId != null && ids.has(t.itemId))) return true;
	if (plan.plannedUntil != null && d <= plan.plannedUntil) return false;
	const s = stageOn(plan.stages, d);
	const def = s && list.stages.find(x => x.stageNo === s.no);
	if (s == null || def == null) return false;
	const c: DayCtx = { restDay: plan.restDay, dailyMinutes: plan.dailyMinutes, lastDay: addDays(plan.examDate, -1) };
	return dueOn(def, s, c, d, plan.focus, ex).some(x => x.item.alone === true);
}

// Where a task asked for on such a day goes instead: the next day it fits (not alone, and dayProblem has nothing);
// with none up to the exam (冲刺's last days), the nearest earlier one from today. null: nowhere.
export function dayOffAlone(c: DayCtx, tasks: TaskRow[], d: string, today: string, minutes: number, isAlone: (x: string) => boolean): string | null {
	const fits = (x: string) => !isAlone(x) && dayProblem(c, tasks, x, today, minutes, 'task') == null;
	for (let x = addDays(d, 1); x <= c.lastDay; x = addDays(x, 1)) if (fits(x)) return x;
	for (let x = addDays(d, -1); x >= today; x = addDays(x, -1)) if (fits(x)) return x;
	return null;
}

// ---------- filling days from the list ----------

export type TaskDraft = Pick<TaskRow, 'title' | 'kind' | 'stage' | 'date' | 'endDate' | 'minutes' | 'app' | 'ref' | 'autoDone' | 'itemId' | 'skill' | 'guide' | 'mock'>;

type Candidate = { item: PlanItem; ref: string | null; title: string; skill: TaskSkill | null };

// What the filling needs besides the list: the dates of real exams the learner reported (a real exam counts as a stage
// mock, the next one 14 days later) and the weak skill (S1). onDrop hears of a one-off thing no day of its stage had
// room for (fillDays).
export type FillExtra = { realDates?: string[]; weak?: Weak | null; onDrop?: (x: { itemId: string; title: string; stage: number; date: string }) => void };

const refsOf = (it: PlanItem): (string | null)[] => (Array.isArray(it.ref) ? it.ref : [it.ref ?? null]);

export const SKILL_ZH: Record<Skill, string> = { listening: '听力', reading: '阅读', writing: '写作', speaking: '口语' };

function titleOf(it: PlanItem, ref: string | null, focus: string | null): string {
	let t = it.name;
	if (t.includes('{ref}')) t = t.replace('{ref}', ref ?? '');
	if (t.includes('{focus}')) t = focus ? t.replace('{focus}', focus) : (it.fallbackName ?? t.replace('{focus}', ''));
	if (t.includes('{setName}')) t = ref && DICTATION_SETS[ref] ? t.replace('{setName}', DICTATION_SETS[ref]) : (it.fallbackName ?? t.replace('{setName}', ''));
	return t.slice(0, 128);
}

// The guide of an item for the skill it trains that day (S1 has one per skill).
export function guideOf(it: Pick<PlanItem, 'guide'>, skill: TaskSkill | null): PlanGuide | null {
	const g = it.guide;
	if (g == null) return null;
	const one = 'slug' in g ? g as PlanGuide : (skill && isSkill(skill) ? (g as SkillMap<PlanGuide>)[skill] : null);
	return one ? { slug: one.slug, section: one.section ?? null, block: one.block ?? null } : null;
}

const nextStudyDay = (c: DayCtx, d: string, end: string) => {
	let x = d;
	while (x <= end && !isStudyDay(c, x)) x = addDays(x, 1);
	return x <= end ? x : null;
};

// The days of a stage an every-N-days item (P1, the stage mock) falls on: the stage's day startDay, then every
// everyDays days, each moved to the next study day; none within skipWithinDaysOfNextStage days before the next stage
// starts (the first sprint mock takes its place), so none when the stage is shorter than startDay. A real exam counts as
// one: the next comes everyDays days after it.
export function cadenceDates(cad: PlanCadence, stage: PlanStage, c: DayCtx, realDates: string[] = []): string[] {
	const out: string[] = [];
	const nextStage = addDays(stage.end, 1);
	const reals = realDates.filter(r => r >= stage.start && r <= stage.end).sort();
	let prev = addDays(stage.start, -1);
	let next = addDays(stage.start, cad.startDay - 1);
	for (let guard = 0; guard < 60; guard++) {
		const real = reals.find(r => r > prev && r <= next);
		if (real) { prev = real; next = addDays(real, cad.everyDays); continue; }
		if (next > stage.end) break;
		const d = nextStudyDay(c, next, stage.end);
		if (d == null || diffDays(nextStage, d) < (cad.skipWithinDaysOfNextStage ?? 0)) break;
		out.push(d);
		prev = d; next = addDays(next, cad.everyDays);
	}
	return out;
}

// What the list puts on day d. Deterministic: the same day of the same stage always gets the same things.
export function dueOn(def: PlanStageDef, stage: PlanStage, c: DayCtx, d: string, focus: string | null, ex: FillExtra = {}): Candidate[] {
	const studyInStage = daysBetween(stage.start, stage.end).filter(x => isStudyDay(c, x));
	const nth = studyInStage.indexOf(d);
	if (nth < 0) return [];
	const week = daysBetween(mondayOf(d), addDays(mondayOf(d), 6)).filter(x => x >= stage.start && x <= stage.end && isStudyDay(c, x));
	const k = week.length; const i = week.indexOf(d);
	const weekNo = Math.floor(diffDays(mondayOf(d), mondayOf(stage.start)) / 7);
	const tasks = def.items.filter(it => it.kind === 'task');
	// The slots (0 = the week's first study day) of a weekly item in a week of kk study days.
	const slotsIn = (it: PlanItem, kk: number): number[] => {
		const n = typeof it.perWeek === 'number' ? it.perWeek : 0;
		if (it.note && /每周最后一个学习日/.test(it.note)) return [kk - 1];
		const after = it.after ?? it.note?.match(/排在 ([A-Z]\d+) 第二天/)?.[1];
		if (after) {
			const first = tasks.find(x => x.id === after);
			const off = it.after ? (it.offsetDays ?? 1) : 1;
			return first && first.cadence == null ? slotsIn(first, kk).map(s => s + off).filter(s => s < kk) : [];
		}
		if (n >= kk) return [...Array(kk).keys()];
		return [...new Set([...Array(n).keys()].map(j => Math.floor((j + 0.5) * kk / n)))];
	};
	const slotsOf = (it: PlanItem): number[] => slotsIn(it, k);
	// Every day of the stage a weekly item falls on, and every day an `alone` item (P1, R1: a full mock) falls on.
	const weeklyDays = (it: PlanItem): string[] => {
		const out: string[] = [];
		for (let w = mondayOf(stage.start); w <= stage.end; w = addDays(w, 7)) {
			const wk = daysBetween(w, addDays(w, 6)).filter(x => x >= stage.start && x <= stage.end && isStudyDay(c, x));
			for (const s of slotsIn(it, wk.length)) if (wk[s] != null) out.push(wk[s]);
		}
		return out;
	};
	const aloneDays = new Set(tasks.filter(x => x.alone === true)
		.flatMap(x => (x.cadence != null ? cadenceDates(x.cadence, stage, c, ex.realDates) : weeklyDays(x))));
	// 学习计划第一版补 (2026-11-20, AI tutor): a one-off thing (once; what follows another item: P2, P3, R2) is never lost
	// to an alone day: it moves to the stage's next study day that is not one; with none later (冲刺's last days),
	// to the nearest earlier one, except what must follow (back false: a review before its mock means nothing).
	const offAlone = (x: string | null | undefined, back = true): string | null => {
		if (x == null || !aloneDays.has(x)) return x ?? null;
		const later = studyInStage.find(y => y > x && !aloneDays.has(y));
		if (later != null || !back) return later ?? null;
		return studyInStage.filter(y => y < x && !aloneDays.has(y)).at(-1) ?? null;
	};
	const out: Candidate[] = [];
	const cand = (it: PlanItem, ref: string | null, skill: TaskSkill | null = it.skill ?? null, title = titleOf(it, ref, focus)): Candidate => ({ item: it, ref, title, skill });
	// 'rotate': one a day per mini app, taking turns (B1 through 5.1–5.9; B2–B4 through the three dictation sets)
	const rotating = new Map<string, { it: PlanItem; ref: string | null }[]>();
	for (const it of tasks.filter(x => x.perWeek === 'rotate')) {
		const g = rotating.get(it.app ?? it.id) ?? [];
		for (const ref of refsOf(it)) g.push({ it, ref });
		rotating.set(it.app ?? it.id, g);
	}
	for (const g of rotating.values()) {
		const pick = g[nth % g.length];
		out.push(cand(pick.it, pick.ref));
	}
	// 'once': the 摸底 tests on the last study days of the week; the rest early in the stage, two days apart
	const once = tasks.filter(x => x.perWeek === 'once');
	once.forEach((it, j) => {
		const at = stage.no === 0 ? studyInStage.length - once.length + j : Math.min(2 + 2 * j, studyInStage.length - 1);
		if (offAlone(studyInStage[at]) === d) out.push(cand(it, refsOf(it)[0]));
	});
	// every N days (P1), and what follows such an item (P2, P3: offsetDays later, moved to the next study day)
	for (const it of tasks.filter(x => x.cadence != null)) {
		if (cadenceDates(it.cadence!, stage, c, ex.realDates).includes(d)) out.push(cand(it, refsOf(it)[0]));
	}
	// (R2 after a weekly R1 is worked out the same way, so an R1 on the week's last study day gets its review on the
	// next week's first one, not none)
	for (const it of tasks.filter(x => x.after != null)) {
		const first = tasks.find(x => x.id === it.after);
		if (first == null) continue;
		const firstDays = first.cadence != null ? cadenceDates(first.cadence, stage, c, ex.realDates) : weeklyDays(first);
		const days = firstDays.map(x => offAlone(nextStudyDay(c, addDays(x, it.offsetDays ?? 1), stage.end), false));
		if (days.includes(d)) out.push(cand(it, refsOf(it)[0]));
	}
	const s1 = s1Skills(ex.weak ?? null, weekNo);
	// Where a weekly item does not go: the day of an `alone` item (R1: that day only it and the check-ins), or
	// (「和 S1 写作专项不重复排」) a day that other item trains the same skill. Such a slot moves to the nearest free day of
	// the week (later first); none free: left out that week.
	const aloneSlots = new Set(tasks.filter(x => x.alone === true && x.cadence == null).flatMap(x => slotsOf(x)));
	const slotsFor = (it: PlanItem, withNote = true): number[] => {
		const base = slotsOf(it);
		if (it.alone === true || it.after != null) return base;
		const otherId = withNote ? it.note?.match(/和 ([A-Z]\d+) \S*?专项不重复/)?.[1] : null;
		const other = otherId ? tasks.find(x => x.id === otherId) : null;
		const blocked = (x: number) => aloneSlots.has(x) || (other != null && it.skill != null && skillAt(other, x) === it.skill);
		const out = base.filter(x => !blocked(x));
		for (const x of base.filter(blocked)) {
			const alt = [...Array(k).keys()].filter(y => !blocked(y) && !out.includes(y))
				.sort((a, b) => Math.abs(a - x) - Math.abs(b - x) || b - a)[0];
			if (alt != null) out.push(alt);
		}
		return out;
	};
	// The skill an item trains on slot s of this week (S1: the split above).
	const skillAt = (other: PlanItem, s: number): TaskSkill | null => {
		const j = slotsFor(other, false).indexOf(s);
		if (j < 0) return null;
		return other.fillFrom === 'weak' && s1 ? s1[j % s1.length] : (other.skill ?? null);
	};
	for (const it of tasks.filter(x => typeof x.perWeek === 'number' && x.after == null)) {
		const slots = slotsFor(it);
		if (!slots.includes(i)) continue;
		const refs = refsOf(it); const ref = refs[weekNo % refs.length];
		if (it.fillFrom === 'weak' && s1) {
			// S1: the skill of this slot (6 a week: the weak skill, 4 : 2 with a second one, or 保持); the weak skill's slots
			// also carry the question type to work on (plan.focus, from the P2 review)
			const skill = s1[slots.indexOf(i) % s1.length];
			const name = ex.weak?.skill === skill && focus ? `${SKILL_ZH[skill]} · ${focus}` : SKILL_ZH[skill];
			out.push(cand(it, ref, skill, titleOf(it, ref, name)));
			continue;
		}
		out.push(cand(it, ref));
	}
	return out;
}

// The new things for days from..to. Keeps what is already there (counts toward the 5 and the minutes) and adds the
// stage check-ins (one row per stage, not one per day). Too much for a day: cut from the largest priority number;
// check-ins are never cut. An `alone` item (P1, R1: a full mock) or a single thing longer than a day: that day only it
// and the check-ins. What follows another item (`after`: P2, P3, R2) goes in first, whatever the day's minutes.
// 学习计划第一版补 2 (2026-11-20, AI tutor): a one-off thing this leaves out (once; what follows another item) is not
// lost: it goes on the next study day of its stage that still has room once that day's own things are in (a free one
// of the 5, and the minutes; what follows needs only the free one, as on its own day), not a full mock's day and not a
// day it is on already, so it never pushes out anything. The days after `to` are worked out (not returned: the next
// filling puts the same things there) only to find that day. None up to the stage's end: the nearest earlier day from
// `from` with room, except what follows (a review before its mock means nothing). None either: left out, and
// ex.onDrop hears of it. Weekly things are cut as before.
export function fillDays(list: PlanList, plan: Pick<PlanRow, 'restDay' | 'dailyMinutes' | 'examDate' | 'focus'>, stages: PlanStage[], existing: TaskRow[], from: string, to: string, ex: FillExtra = {}): TaskDraft[] {
	const c: DayCtx = { restDay: plan.restDay, dailyMinutes: plan.dailyMinutes, lastDay: addDays(plan.examDate, -1) };
	const out: TaskDraft[] = [];
	const shadow: TaskDraft[] = []; // the days after `to`, worked out to find where a waiting one-off thing goes
	const asRow = (t: TaskDraft, id: string) => ({ ...t, id, status: 'todo', origDate: t.date } as TaskRow);
	const all = () => [...existing, ...out.map((t, i) => asRow(t, `new${i}`)), ...shadow.map((t, i) => asRow(t, `ahead${i}`))];
	const aloneIds = new Set(list.stages.flatMap(s => s.items.filter(x => x.alone === true).map(x => x.id)));
	const draft = (x: Candidate, s: PlanStage, d: string): TaskDraft => ({ title: x.title, kind: 'task', stage: s.no, date: d, endDate: null, minutes: x.item.minutes, app: x.item.app, ref: x.ref, autoDone: x.item.autoDone === 'manual' ? null : x.item.autoDone, itemId: x.item.id, skill: x.skill, guide: guideOf(x.item, x.skill), mock: x.item.mock === true ? true : null });
	for (const s of stages) {
		if (s.end < from || s.start > to) continue;
		const def = list.stages.find(x => x.stageNo === s.no);
		for (const it of def?.items.filter(x => x.kind === 'checkin') ?? []) {
			if (existing.some(t => t.kind === 'checkin' && active(t) && t.itemId === it.id && t.stage === s.no && (t.endDate == null || t.endDate >= maxDate(s.start, from)))) continue;
			const ref = refsOf(it)[0];
			out.push({ title: titleOf(it, ref, plan.focus), kind: 'checkin', stage: s.no, date: maxDate(s.start, from), endDate: s.end, minutes: it.minutes, app: it.app, ref, autoDone: it.autoDone === 'manual' ? null : it.autoDone, itemId: it.id, skill: it.skill ?? null, guide: guideOf(it, it.skill ?? null), mock: null });
		}
	}
	type Wait = { x: Candidate; s: PlanStage; cut: string };
	// One day from the list into `sink`; the one-off things it left out.
	const fillDay = (d: string, sink: TaskDraft[]): Wait[] => {
		if (!isStudyDay(c, d)) return [];
		const s = stageOn(stages, d);
		const def = s && list.stages.find(x => x.stageNo === s.no);
		if (s == null || def == null) return [];
		const now = all();
		const onDay = tasksOn(now, d);
		const fresh = c.dailyMinutes - checkinsOn(now, d, c.restDay).reduce((n, t) => n + t.minutes, 0);
		let slots = MAX_TASKS_PER_DAY - onDay.length;
		let budget = fresh - onDay.reduce((n, t) => n + t.minutes, 0);
		const taken = new Set(onDay.map(t => `${t.app}|${t.ref}`));
		const cands = dueOn(def, s, c, d, plan.focus, ex)
			.filter(x => !(x.item.perWeek === 'once' && now.some(t => active(t) && t.itemId === x.item.id && t.stage === s.no)))
			.filter(x => !((x.item.cadence != null || x.item.after != null) && onDay.some(t => t.itemId === x.item.id)))
			.sort((a, b) => a.item.priority - b.item.priority);
		const added = new Set<Candidate>();
		const left = () => cands.filter(x => !added.has(x) && (x.item.perWeek === 'once' || x.item.after != null)).map(x => ({ x, s, cut: d }));
		const add = (x: Candidate) => {
			sink.push(draft(x, s, d)); added.add(x);
			slots--; budget -= x.item.minutes; if (x.item.app) taken.add(`${x.item.app}|${x.ref}`);
		};
		const alone = cands.find(x => x.item.alone === true);
		if (alone) { if (slots > 0 && !onDay.some(t => t.itemId === alone.item.id)) add(alone); return left(); }
		const must = cands.filter(x => x.item.after != null);
		for (const x of must) if (slots > 0) add(x);
		const long = cands.find(x => x.item.minutes > fresh && x.item.after == null);
		if (must.length === 0 && long && onDay.length === 0) { add(long); return left(); }
		for (const x of cands) {
			if (x.item.after != null) continue;
			if (x.item.minutes > fresh || slots <= 0 || x.item.minutes > budget) continue;
			if (x.item.app && taken.has(`${x.item.app}|${x.ref}`)) continue;
			add(x);
		}
		return left();
	};
	// Whether a waiting one-off thing fits on day d as it is now.
	const roomFor = (w: Wait, d: string): boolean => {
		if (d < w.s.start || d > w.s.end || !isStudyDay(c, d)) return false;
		const now = all();
		const day = tasksOn(now, d);
		const fresh = c.dailyMinutes - checkinsOn(now, d, c.restDay).reduce((n, t) => n + t.minutes, 0);
		if (day.length >= MAX_TASKS_PER_DAY) return false;
		if (day.some(t => (t.itemId != null && aloneIds.has(t.itemId)) || t.minutes > fresh || t.itemId === w.x.item.id)) return false;
		if (w.x.item.app && day.some(t => t.app === w.x.item.app && t.ref === w.x.ref)) return false;
		return w.x.item.after != null || day.reduce((n, t) => n + t.minutes, 0) + w.x.item.minutes <= fresh;
	};
	let waiting: Wait[] = [];
	let end = to;
	for (let d = from; d <= end; d = addDays(d, 1)) {
		const left = fillDay(d, d <= to ? out : shadow);
		waiting = waiting.filter(w => {
			if (!roomFor(w, d)) return true;
			out.push(draft(w.x, w.s, d));
			return false;
		});
		if (d <= to) waiting.push(...left);
		// its stage is over: back from the day it was cut, then left out
		waiting = waiting.filter(w => {
			if (d < w.s.end) return true;
			if (w.x.item.after == null) {
				for (let y = addDays(w.cut, -1); y >= maxDate(from, w.s.start); y = addDays(y, -1)) {
					if (roomFor(w, y)) { out.push(draft(w.x, w.s, y)); return false; }
				}
			}
			ex.onDrop?.({ itemId: w.x.item.id, title: w.x.title, stage: w.s.no, date: w.cut });
			return false;
		});
		if (d === to) end = waiting.reduce((e, w) => maxDate(e, w.s.end), to);
	}
	return out;
}

// ---------- every day ----------

// Unfinished tasks from before today move to today (or the day after, if today is the rest day). Check-ins do not.
export function rollover(tasks: TaskRow[], today: string, restDay: number): { id: string; date: string }[] {
	const to = weekday(today) === restDay ? addDays(today, 1) : today;
	return tasks.filter(t => t.kind === 'task' && (t.status === 'todo' || t.status === 'doing') && t.date < today).map(t => ({ id: t.id, date: to }));
}

export const delayDays = (t: TaskRow, today: string) => (t.kind === 'task' && (t.status === 'todo' || t.status === 'doing') ? Math.max(0, diffDays(today, t.origDate)) : 0);

// 「连续 N 天」: days in a row whose check-ins were all done. Rest days and days without check-ins do not break it;
// today counts once done and does not break it while not done yet.
export function streak(today: string, since: string, restDay: number, tasks: TaskRow[], done: Set<string>): number {
	let n = 0;
	for (let d = today; d >= since && diffDays(today, d) < 400; d = addDays(d, -1)) {
		const cs = checkinsOn(tasks, d, restDay);
		if (cs.length === 0) continue;
		const all = cs.every(t => done.has(`${t.id}|${d}`));
		if (all) n++; else if (d !== today) break;
	}
	return n;
}

// The week strip: per day how many things (tasks + check-ins) and how many done.
export function dayTally(tasks: TaskRow[], checkins: CheckinRow[], d: string, restDay: number) {
	const ts = tasksOn(tasks, d); const cs = checkinsOn(tasks, d, restDay);
	const done = ts.filter(t => t.status === 'done').length + cs.filter(t => checkins.some(x => x.taskId === t.id && x.date === d && x.doneAt != null)).length;
	return { total: ts.length + cs.length, done };
}

// ---------- ticking by itself (§6 of the design) ----------

export type AnswerTally = { total: number; by: Record<string, number> };
export const ANSWER_APPS = ['dictation', 'vocab'] as const;
export type AnswerApp = typeof ANSWER_APPS[number];
export const isAnswerApp = (a: string | null): a is AnswerApp => a === 'dictation' || a === 'vocab';

// The groups or stations a task counts: a list may name several ("spelling,numbers"). null when one of them is not a
// real group (dictation) or does not look like a station (vocab, like 5.2): then the page asks instead.
export function answerRefs(app: AnswerApp, ref: string | null): string[] | null {
	if (ref == null || ref.trim() === '') return null;
	const refs = ref.split(',').map(r => r.trim()).filter(Boolean);
	if (refs.length === 0) return null;
	const ok = app === 'dictation' ? (r: string) => r in DICTATION_SETS : (r: string) => /^\d{1,2}\.\d{1,2}$/.test(r);
	return refs.every(ok) ? refs : null;
}

export type AutoCheck = {
	tick: string[]; // tasks to tick (doneBy auto)
	tickCheckins: string[]; // check-ins to tick today
	progress: Record<string, { answered: number; need: number }>; // what the second line says: 「今天答了 12 / 20」
	asks: Record<string, string[]>; // app → open tasks of today that could be what the learner just practised
};

// Today's open dictation and vocab things against today's answers. `answers[app]` is null when the app did not answer:
// nothing of that app is ticked or asked. Rules:
// - a task needs a real ref and autoDone.answered; two tasks on the same ref: the one waiting longer counts first, the
//   second needs both amounts (one answer never counts for two tasks);
// - a check-in with a ref counts that ref, without a ref the whole app; it needs autoDone.answered, or 1;
// - tasks and check-ins count on their own (one answer may tick a task and a check-in);
// - never what the learner unticked by hand today (task.offDate, check-in row doneBy 'off').
export function autoCheck(today: string, restDay: number, tasks: TaskRow[], checkins: CheckinRow[], answers: Partial<Record<AnswerApp, AnswerTally | null>>): AutoCheck {
	const out: AutoCheck = { tick: [], tickCheckins: [], progress: {}, asks: {} };
	const count = (a: AnswerTally, refs: string[] | null) => (refs == null ? a.total : refs.reduce((n, r) => n + (a.by[r] ?? 0), 0));
	const open = tasksOn(tasks, today).filter(t => (t.status === 'todo' || t.status === 'doing') && isAnswerApp(t.app))
		.sort((a, b) => a.origDate.localeCompare(b.origDate) || a.id.localeCompare(b.id));
	const used = new Map<string, number>(); // app|refs → answers already given to an earlier task
	for (const t of open) {
		const app = t.app as AnswerApp;
		const a = answers[app];
		if (a == null) continue;
		const refs = answerRefs(app, t.ref);
		if (refs == null) {
			if (a.total > 0) (out.asks[app] ??= []).push(t.id);
			continue;
		}
		const need = t.autoDone?.answered;
		if (need == null) continue;
		const key = `${app}|${[...refs].sort().join(',')}`;
		const before = used.get(key) ?? 0;
		const answered = Math.max(0, count(a, refs) - before);
		used.set(key, before + need);
		out.progress[t.id] = { answered: Math.min(answered, need), need };
		if (answered >= need && t.offDate !== today) out.tick.push(t.id);
	}
	for (const c of checkinsOn(tasks, today, restDay)) {
		if (!isAnswerApp(c.app)) continue;
		const a = answers[c.app];
		if (a == null) continue;
		const row = checkins.find(x => x.taskId === c.id && x.date === today);
		if (row?.doneAt != null) continue;
		const refs = c.ref ? answerRefs(c.app, c.ref) : null;
		if (c.ref && refs == null) continue;
		const need = c.autoDone?.answered ?? 1;
		const answered = count(a, refs);
		out.progress[c.id] = { answered: Math.min(answered, need), need };
		if (answered >= need && row?.doneBy !== 'off') out.tickCheckins.push(c.id);
	}
	return out;
}

// A typing report (the typing app saves progress → one line). One open typing task today: tick it; two or more: ask
// which; a typing check-in today: tick it.
export function typingReport(today: string, restDay: number, tasks: TaskRow[], checkins: CheckinRow[]) {
	const open = tasksOn(tasks, today).filter(t => (t.status === 'todo' || t.status === 'doing') && t.app === 'typing' && t.offDate !== today);
	const cs = checkinsOn(tasks, today, restDay).filter(c => c.app === 'typing' && !checkins.some(x => x.taskId === c.id && x.date === today && (x.doneAt != null || x.doneBy === 'off')));
	return { tick: open.length === 1 ? [open[0].id] : [], ask: open.length > 1 ? open.map(t => t.id) : [], tickCheckins: cs.map(c => c.id) };
}
