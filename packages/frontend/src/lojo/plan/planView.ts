/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The small calculations of the private-message 「任务」 tab (PlanTab.vue) that touch neither the server nor the page's
// state, moved out of PlanTab.vue on 2026-11-16 (splitting big files, no change in behavior): the shapes of
// lojo/plan/show and lojo/plan/sync, dates, colors, mini app names and links, 「勾上这件吗？」, each stage's lists,
// 「今天多了 N 件」, the 7 days of 「挪到哪天」 and what Vibi says. The page calls these.

import { miniAppHref } from '@/lojo/miniapps/roster.js';
import { planAppNames, planStrings as S } from '@/lojo/plan/strings.js';

export type PTask = {
	id: string; title: string; kind: 'task'; stage: number; date: string; origDate: string; minutes: number;
	app: string | null; appName: string | null; ref: string | null; status: 'todo' | 'doing' | 'done'; doneBy: string | null;
	by: string; pinned: boolean; delayDays: number; asked: boolean; long: boolean;
	// 学习计划第一版 (2026-11-20): what it trains, the guide that says how, and for a full mock 「记分」 and its score
	skill: PTaskSkill | null; guide: PGuide | null; mock: boolean; score: PScore | null;
};
export type PCheckin = {
	id: string; title: string; app: string | null; appName: string | null; ref: string | null; minutes: number; done: boolean; doneBy: string | null;
	skill: PTaskSkill | null; guide: PGuide | null;
};
export type PDay = { date: string; rest: boolean; past: boolean; total: number; done: number; minutes: number; tasks: PTask[]; checkins: PCheckin[] };
export type PStage = { no: number; name: string; goal: string; start: string; end: string; done: number; total: number };
export type PBoard = { todo: PTask[]; doing: PTask[]; done: PTask[] };
export type PShow = {
	plan: null | {
		examDate: string; examTentative: boolean; dailyMinutes: number; restDay: number; tz: string; notifyWeekly: boolean; stages: PStage[];
		target: string; current: string | null; focus: string | null;
		// per skill: the learner's own target and the school's minimum (null: the overall target, no minimum), the scores now
		// and which skill to train most (judged when a score comes in)
		targets: PSkillMap | null; minimums: PSkillMap | null; weak: PWeak | null; skills: Record<PSkill, PSkillState>;
	};
	today: string; daysToExam: number; stageNow: number | null; diagnostic: boolean; streak: number; weekStart: string;
	days: PDay[]; todayView: PDay | null; board: PBoard | null;
	// 「本周做完」: tasks done per skill in the week shown; the last 5 scores, newest first
	weekDone: Record<PTaskSkill, number>; scores: PScore[];
};
export const P_SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const;
export type PSkill = typeof P_SKILLS[number];
export const P_TASK_SKILLS = [...P_SKILLS, 'vocab', 'grammar', 'mixed'] as const;
export type PTaskSkill = typeof P_TASK_SKILLS[number];
export type PSkillMap = Partial<Record<PSkill, number>>;
export type PGuide = { slug: string; section: string | null; block: string | null };
export type PScoreSource = 'mock' | 'real' | 'teacher';
export type PScore = {
	id: string; date: string; source: PScoreSource; listening: number | null; reading: number | null; writing: number | null; speaking: number | null;
	overall: number | null; estimated: PSkill[]; taskId: string | null;
};
export type PSkillState = { target: number | null; min: number | null; current: number | null; estimated: boolean; date: string | null; source: PScoreSource | null; prev: number | null };
export type PWeak = { skill: PSkill | null; second: PSkill | null; keep: boolean; lowest: PSkill | null; judgedAt: string };
export type PSync = { autoCheck: 'ok' | 'skipped'; ticked: string[]; progress: Record<string, { answered: number; need: number }>; asks: { app: string; appName: string; taskIds: string[] }[] };
export type PView = 'today' | 'week' | 'all' | 'board';

// Vibi's line (founder 11-16: the mascot on this page, with a nudge or a choice from the plan and what is done).
// Vibi's voice: short, no red, no 「逾期」, no guilt. A chip opens something here, opens the mini app, or goes back to
// the messages with a sentence in the box (not sent). 「不用」 hides that line on this device.
export type VibiChip = { label: string; main?: boolean; href?: string; action?: () => void };
export type VibiSay = { id: string; text: string; strong?: string; chips: VibiChip[] };
// What the chips do on the page: open 「挪到哪天」 for a task, go back to the messages with a sentence, hide a line.
export type VibiHooks = { move: (t: PTask) => unknown; talk: (text: string) => void; dismiss: (id: string) => void };

export function dayDiff(a: string, b: string) {
	return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);
}

export function addDays(d: string, n: number) {
	const x = new Date(`${d}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + n);
	return x.toISOString().slice(0, 10);
}

export function lineColor(stage: number) {
	return stage === 0 ? 'var(--ink)' : `var(--l${stage})`;
}

export function ringClass(d: PDay) {
	if (d.rest) return 'rest';
	if (d.total === 0) return 'none';
	if (d.done === d.total) return 'full';
	return d.done > 0 ? 'part' : 'zero';
}

export function appName(app: string | null) {
	return app ? planAppNames[app] ?? app : '';
}

export function appHref(app: string, ref: string | null) {
	if (app === 'vocab' && ref) return `/apps/vocab/${encodeURIComponent(ref)}`;
	// where the 小程序 roster opens it (vocab and grammar open their first stop); before the roster is read, the app's home
	return miniAppHref(app) ?? `/apps/${app}/`;
}

// 「怎么做」: the guide page (by slug; the section is said in the link's title, the page has no jump to it yet)
export function guideHref(g: PGuide) {
	return `/guides/${encodeURIComponent(g.slug)}`;
}

// A score's skills in order, as 「听力 6.5 · 写作 6（估）」; speaking from a mock is shown but marked as not counted.
export function scoreParts(s: PScore) {
	return P_SKILLS.filter(k => s[k] != null).map(k => S.scorePart(S.skills[k], s[k] as number, s.estimated.includes(k), k === 'speaking' && s.source === 'mock'));
}

// 「本周做完」: the skills with something done this week, in the list's order (听 读 写 说, then 词汇 语法 综合)
export function weekDoneParts(w: PShow['weekDone'] | undefined) {
	if (w == null) return [];
	return P_TASK_SKILLS.filter(k => (w[k] ?? 0) > 0).map(k => S.weekDonePart(S.skills[k], w[k]));
}

// The weak-skill line under the week: which skill gets the most practice, or 「保持」, or how to find out.
export function weakLine(plan: NonNullable<PShow['plan']>) {
	const w = plan.weak;
	if (w?.skill) return S.weakLine(S.skills[w.skill], w.second ? S.skills[w.second] : null);
	if (w?.keep) return S.keepLine;
	return S.noWeakYet;
}

// 「记分」 bands: 9 down to 1 in half steps
export const BANDS = [...Array(17).keys()].map(i => 9 - i / 2);

// 「大概」 minutes: to the nearest 5 past 10
export function about(m: number) {
	return m <= 10 ? m : Math.round(m / 5) * 5;
}

// 「勾上这件吗？」: the first of today's tasks an app just practised may be, not done yet and not turned down (off).
export function planAsk(today: PDay, asks: PSync['asks'], off: (id: string) => boolean): { app: string; task: PTask } | null {
	for (const a of asks) {
		for (const id of a.taskIds) {
			const task = today.tasks.find(t => t.id === id && t.status !== 'done');
			if (task && !off(id)) return { app: a.app, task };
		}
	}
	return null;
}

// 全程, per stage: what comes next (by date) and what was done last, from the board's lists
export function planStageLists(b: PBoard, stages: PStage[]) {
	const out: Record<number, { next: PTask[]; more: number; done: PTask[] }> = {};
	for (const st of stages) {
		const next = [...b.doing, ...b.todo].filter(t => t.stage === st.no).sort((x, y) => x.date.localeCompare(y.date));
		out[st.no] = { next: next.slice(0, 5), more: Math.max(0, next.length - 5), done: b.done.filter(t => t.stage === st.no).slice(0, 3) };
	}
	return out;
}

// 今天多了 N 件: tasks past the learner's minutes (the program never plans that; it comes from rollover or Vibi).
export function planOverCount(d: PDay, plan: { dailyMinutes: number }) {
	let minutes = d.minutes; let n = 0;
	const open = d.tasks.filter(t => t.status !== 'done');
	for (let i = open.length - 1; i >= 0 && minutes > plan.dailyMinutes && open.length - n > 1; i--) { minutes -= open[i].minutes; n++; }
	return n;
}

// 挪到哪天: today and the next 6 days for task t; the rest day, full days and days from the exam on can't be picked.
// d has a plan; nextWeek is next week's days when the 7 days reach into it.
export function planMoveOptions(d: PShow, t: PTask, nextWeek: PDay[]) {
	const known = [...d.days, ...(d.todayView ? [d.todayView] : []), ...nextWeek];
	return [...Array(7).keys()].map(i => addDays(d.today, i)).map(date => {
		const k = known.find(x => x.date === date);
		const rest = new Date(`${date}T00:00:00Z`).getUTCDay() === d.plan!.restDay;
		const others = k?.tasks.filter(x => x.id !== t.id) ?? [];
		const used = k ? k.minutes - (k.tasks.some(x => x.id === t.id) ? t.minutes : 0) : 0;
		const full = k != null && (others.length >= 5 || used + t.minutes > d.plan!.dailyMinutes);
		const afterExam = date >= d.plan!.examDate;
		return { date, rest, full: full || afterExam, ok: !rest && !full && !afterExam };
	});
}

// 今天: td is the day shown, allDone whether its card says all done.
export function vibiToday(d: PShow, td: PDay | null, allDone: boolean, on: VibiHooks): VibiSay | null {
	if (td == null || allDone) return null;
	if (td.rest) return { id: `rest:${d.today}`, text: S.vibiRest, chips: [] };
	const open = td.tasks.filter(t => t.status !== 'done');
	// dragged on to a third day: ask once whether to do it another way (design notes: 拖到第 3 天 Vibi 问一句)
	const late = [...open].sort((a, b) => b.delayDays - a.delayDays)[0];
	if (late != null && late.delayDays >= 2) {
		const id = `late:${late.id}:${d.today}`;
		return { id, text: S.vibiLate(late.title, late.delayDays), strong: S.vibiLateAsk, chips: [
			{ label: S.vibiMove, main: true, action: () => on.move(late) },
			{ label: S.vibiOtherWay, action: () => on.talk(S.vibiOtherWayPrefill(late.title)) },
			{ label: S.vibiNo, action: () => on.dismiss(id) },
		] };
	}
	if (open.length === 0) {
		const left = td.checkins.filter(c => !c.done);
		if (td.tasks.length > 0 && left.length > 0) {
			return { id: `ci:${d.today}`, text: S.vibiTasksDone, strong: S.vibiCheckinsLeft(left.map(c => c.appName ? appName(c.app) : c.title)), chips: [] };
		}
		if (td.tasks.length === 0 && td.checkins.length === 0) return { id: `none:${d.today}`, text: S.vibiNothing, chips: [] };
		return null;
	}
	const mins = about(open.reduce((n, t) => n + t.minutes, 0));
	const auto = [...td.tasks].reverse().find(t => t.status === 'done' && (t.doneBy === 'auto' || t.doneBy === 'vibi'));
	if (auto) return { id: `auto:${auto.id}`, text: S.vibiAuto(auto.app ? appName(auto.app) : auto.title), strong: S.vibiLeft(open.length, mins), chips: [] };
	const doneN = td.tasks.length - open.length;
	if (doneN > 0) return { id: `some:${d.today}`, text: S.vibiDoneSome(doneN), strong: S.vibiLeft(open.length, mins), chips: [] };
	const first = open[0];
	return {
		id: `start:${d.today}`, text: S.vibiStart(open.length, mins), strong: S.vibiStartWith(first.title),
		chips: first.app ? [{ label: S.vibiGo(appName(first.app)), main: true, href: appHref(first.app, first.ref) }] : [],
	};
}

export function vibiWeek(d: PShow, on: VibiHooks): VibiSay | null {
	const plan = d.plan;
	if (plan == null) return null;
	const id = `week:${d.weekStart}`;
	return { id, text: S.vibiWeek(plan.notifyWeekly), strong: S.vibiRestDay(S.restDayName(plan.restDay)), chips: [
		{ label: S.vibiChangeRest, action: () => on.talk(S.vibiChangeRestPrefill) },
		{ label: S.vibiNo, action: () => on.dismiss(id) },
	] };
}

// 全程: the stage now (st) against the days gone in it; 「慢了一点」 only past 3 days in and more than a bit behind
export function vibiAll(d: PShow, st: PStage | null): VibiSay | null {
	if (st == null || st.total === 0) return null;
	const days = Math.max(1, dayDiff(st.end, st.start) + 1);
	const gone = Math.min(days, Math.max(0, dayDiff(d.today, st.start)));
	if (gone >= 3 && st.done / st.total + 0.15 < gone / days) {
		return { id: `behind:${st.no}:${d.today}`, text: S.vibiBehind(S.stage(st.name)), strong: S.vibiBehindAsk, chips: [] };
	}
	return { id: `on:${st.no}:${d.today}`, text: S.vibiOnTrack(S.stage(st.name), st.done, st.total), strong: S.vibiOnTrackTail, chips: [] };
}
