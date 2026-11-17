/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 私信「任务」标签 (2026-11-15): the plan's rules as pure functions, so they can be unit-tested without a database.
// Dates are the learner's own calendar days, 'YYYY-MM-DD' in the learner's time zone (lojo_plan.tz). The list of what
// each stage holds (攻略's ielts-tasks.json) is not in this repository: it is imported into the site's registry.
// Design: 冲刺1111/社区工程/私信任务标签/需求-社区工程.md in the Vibes workspace.

export type PlanAutoDone = { answered?: number; report?: boolean } | null;

export type PlanItem = {
	id: string; name: string; minutes: number; kind: 'task' | 'checkin'; app: string | null;
	ref: string | string[] | null; perWeek: number | 'once' | 'rotate'; priority: number;
	autoDone: PlanAutoDone | 'manual'; fillFrom?: string; fallbackName?: string; note?: string;
};
export type PlanStageDef = { stageNo: number; name: string; goal: string; share?: number; lengthDays?: number; items: PlanItem[] };
export type PlanList = { track: string; from?: string; stages: PlanStageDef[] };

export type PlanStage = { no: number; name: string; goal: string; start: string; end: string };

export type PlanRow = {
	userId: string; examDate: string; examTentative: boolean; dailyMinutes: number; target: string; current: string | null;
	restDay: number; tz: string; stages: PlanStage[]; focus: string | null; notifyWeekly: boolean; plannedUntil: string | null;
	seenAt: Date | null; createdAt: Date; updatedAt: Date;
};

export type TaskStatus = 'todo' | 'doing' | 'done' | 'removed';
export type TaskRow = {
	id: string; userId: string; title: string; kind: 'task' | 'checkin'; stage: number; origDate: string; date: string;
	endDate: string | null; minutes: number; app: string | null; ref: string | null; autoDone: PlanAutoDone; itemId: string | null;
	status: TaskStatus; doneBy: string | null; doneAt: Date | null; by: string; pinned: boolean; askedAt: Date | null;
	offDate: string | null; createdAt: Date;
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

const WEEK_CN = '日一二三四五六';
// 「11 月 20 日（周四）」: how the learner reads a date (never 2026-11-20).
export const cnDate = (d: string) => `${Number(d.slice(5, 7))} 月 ${Number(d.slice(8, 10))} 日（周${WEEK_CN[weekday(d)]}）`;
export const cnDay = (d: string) => `周${WEEK_CN[weekday(d)]}`;

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
			if (!(typeof it.perWeek === 'number' || it.perWeek === 'once' || it.perWeek === 'rotate')) out.push(`${at}：perWeek 不对`);
			if (!Number.isInteger(it.priority)) out.push(`${at}：priority 不对`);
			if (/\{(?!ref\}|focus\}|setName\})[^}]*\}/.test(it.name)) out.push(`${at}：事名里有认不得的 {}`);
			if (/\{(focus|setName)\}/.test(it.name) && !it.fallbackName) out.push(`${at}：有 {} 但没有 fallbackName`);
		}
	}
	if (!l.stages.some(s => s.stageNo === 3)) out.push('没有冲刺段');
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

// Why a task of `minutes` does not fit on day d (null = it fits). `except` is the task being moved.
export function dayProblem(c: DayCtx, tasks: TaskRow[], d: string, today: string, minutes: number, kind: 'task' | 'checkin', except?: string): string | null {
	if (d < today) return '不能排到已经过去的日子';
	if (d > c.lastDay) return `${cnDate(d)}已经过了考试日`;
	if (weekday(d) === c.restDay) return `${cnDay(d)}是休息日`;
	const others = tasks.filter(t => t.id !== except);
	if (kind === 'checkin') {
		return checkinsOn(others, d, c.restDay).length >= MAX_CHECKINS_PER_DAY ? `打卡最多 ${MAX_CHECKINS_PER_DAY} 项，已经有 ${MAX_CHECKINS_PER_DAY} 项了` : null;
	}
	const day = tasksOn(others, d);
	if (day.length >= MAX_TASKS_PER_DAY) return `${cnDate(d)}已经排满 ${MAX_TASKS_PER_DAY} 件了`;
	const used = day.reduce((n, t) => n + t.minutes, 0) + checkinsOn(others, d, c.restDay).reduce((n, t) => n + t.minutes, 0);
	if (used + minutes > c.dailyMinutes) return `这天已经 ${used + minutes} 分钟，超出你每天的 ${c.dailyMinutes} 分钟`;
	return null;
}

// ---------- filling days from the list ----------

export type TaskDraft = Pick<TaskRow, 'title' | 'kind' | 'stage' | 'date' | 'endDate' | 'minutes' | 'app' | 'ref' | 'autoDone' | 'itemId'>;

type Candidate = { item: PlanItem; ref: string | null; title: string };

const refsOf = (it: PlanItem): (string | null)[] => (Array.isArray(it.ref) ? it.ref : [it.ref ?? null]);

function titleOf(it: PlanItem, ref: string | null, focus: string | null): string {
	let t = it.name;
	if (t.includes('{ref}')) t = t.replace('{ref}', ref ?? '');
	if (t.includes('{focus}')) t = focus ? t.replace('{focus}', focus) : (it.fallbackName ?? t.replace('{focus}', ''));
	if (t.includes('{setName}')) t = ref && DICTATION_SETS[ref] ? t.replace('{setName}', DICTATION_SETS[ref]) : (it.fallbackName ?? t.replace('{setName}', ''));
	return t.slice(0, 128);
}

// What the list puts on day d. Deterministic: the same day of the same stage always gets the same things.
export function dueOn(def: PlanStageDef, stage: PlanStage, c: DayCtx, d: string, focus: string | null): Candidate[] {
	const studyInStage = daysBetween(stage.start, stage.end).filter(x => isStudyDay(c, x));
	const nth = studyInStage.indexOf(d);
	if (nth < 0) return [];
	const week = daysBetween(mondayOf(d), addDays(mondayOf(d), 6)).filter(x => x >= stage.start && x <= stage.end && isStudyDay(c, x));
	const k = week.length; const i = week.indexOf(d);
	const weekNo = Math.floor(diffDays(mondayOf(d), mondayOf(stage.start)) / 7);
	const tasks = def.items.filter(it => it.kind === 'task');
	const slotsOf = (it: PlanItem): number[] => {
		const n = typeof it.perWeek === 'number' ? it.perWeek : 0;
		if (it.note && /每周最后一个学习日/.test(it.note)) return [k - 1];
		const after = it.note?.match(/排在 ([A-Z]\d+) 第二天/);
		if (after) {
			const first = tasks.find(x => x.id === after[1]);
			return first ? slotsOf(first).map(s => s + 1).filter(s => s < k) : [];
		}
		if (n >= k) return [...Array(k).keys()];
		return [...new Set([...Array(n).keys()].map(j => Math.floor((j + 0.5) * k / n)))];
	};
	const out: Candidate[] = [];
	// 'rotate': one a day per mini app, taking turns (B1 through 5.1–5.9; B2–B4 through the three dictation sets)
	const rotating = new Map<string, { it: PlanItem; ref: string | null }[]>();
	for (const it of tasks.filter(x => x.perWeek === 'rotate')) {
		const g = rotating.get(it.app ?? it.id) ?? [];
		for (const ref of refsOf(it)) g.push({ it, ref });
		rotating.set(it.app ?? it.id, g);
	}
	for (const g of rotating.values()) {
		const pick = g[nth % g.length];
		out.push({ item: pick.it, ref: pick.ref, title: titleOf(pick.it, pick.ref, focus) });
	}
	// 'once': the 摸底 tests on the last study days of the week; the rest early in the stage, two days apart
	const once = tasks.filter(x => x.perWeek === 'once');
	once.forEach((it, j) => {
		const at = stage.no === 0 ? studyInStage.length - once.length + j : Math.min(2 + 2 * j, studyInStage.length - 1);
		if (at === nth) { const ref = refsOf(it)[0]; out.push({ item: it, ref, title: titleOf(it, ref, focus) }); }
	});
	for (const it of tasks.filter(x => typeof x.perWeek === 'number')) {
		if (!slotsOf(it).includes(i)) continue;
		const refs = refsOf(it); const ref = refs[weekNo % refs.length];
		out.push({ item: it, ref, title: titleOf(it, ref, focus) });
	}
	return out;
}

// The new things for days from..to. Keeps what is already there (counts toward the 5 and the minutes) and adds the
// stage check-ins (one row per stage, not one per day). Too much for a day: cut from the largest priority number;
// check-ins are never cut. A single thing longer than a day (R1 170 minutes): that day only it and the check-ins.
export function fillDays(list: PlanList, plan: Pick<PlanRow, 'restDay' | 'dailyMinutes' | 'examDate' | 'focus'>, stages: PlanStage[], existing: TaskRow[], from: string, to: string): TaskDraft[] {
	const c: DayCtx = { restDay: plan.restDay, dailyMinutes: plan.dailyMinutes, lastDay: addDays(plan.examDate, -1) };
	const out: TaskDraft[] = [];
	const asRow = (t: TaskDraft) => ({ ...t, id: `new${out.length}`, status: 'todo', origDate: t.date } as TaskRow);
	const all = () => [...existing, ...out.map(asRow)];
	for (const s of stages) {
		if (s.end < from || s.start > to) continue;
		const def = list.stages.find(x => x.stageNo === s.no);
		for (const it of def?.items.filter(x => x.kind === 'checkin') ?? []) {
			if (existing.some(t => t.kind === 'checkin' && active(t) && t.itemId === it.id && t.stage === s.no && (t.endDate == null || t.endDate >= maxDate(s.start, from)))) continue;
			const ref = refsOf(it)[0];
			out.push({ title: titleOf(it, ref, plan.focus), kind: 'checkin', stage: s.no, date: maxDate(s.start, from), endDate: s.end, minutes: it.minutes, app: it.app, ref, autoDone: it.autoDone === 'manual' ? null : it.autoDone, itemId: it.id });
		}
	}
	for (const d of daysBetween(from, to)) {
		if (!isStudyDay(c, d)) continue;
		const s = stageOn(stages, d);
		const def = s && list.stages.find(x => x.stageNo === s.no);
		if (s == null || def == null) continue;
		const now = all();
		const onDay = tasksOn(now, d);
		const fresh = c.dailyMinutes - checkinsOn(now, d, c.restDay).reduce((n, t) => n + t.minutes, 0);
		let slots = MAX_TASKS_PER_DAY - onDay.length;
		let budget = fresh - onDay.reduce((n, t) => n + t.minutes, 0);
		const taken = new Set(onDay.map(t => `${t.app}|${t.ref}`));
		const cands = dueOn(def, s, c, d, plan.focus)
			.filter(x => !(x.item.perWeek === 'once' && now.some(t => active(t) && t.itemId === x.item.id && t.stage === s.no)))
			.sort((a, b) => a.item.priority - b.item.priority);
		const add = (x: Candidate) => {
			out.push({ title: x.title, kind: 'task', stage: s.no, date: d, endDate: null, minutes: x.item.minutes, app: x.item.app, ref: x.ref, autoDone: x.item.autoDone === 'manual' ? null : x.item.autoDone, itemId: x.item.id });
			slots--; budget -= x.item.minutes; if (x.item.app) taken.add(`${x.item.app}|${x.ref}`);
		};
		const long = cands.find(x => x.item.minutes > fresh);
		if (long && onDay.length === 0) { add(long); continue; }
		for (const x of cands) {
			if (x.item.minutes > fresh || slots <= 0 || x.item.minutes > budget) continue;
			if (x.item.app && taken.has(`${x.item.app}|${x.ref}`)) continue;
			add(x);
		}
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
