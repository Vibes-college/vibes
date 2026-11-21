/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 学习计划第一版 (founder 2026-11-20): the learner's IELTS scores per skill and which skill is weakest, as pure
// functions. The rules are 攻略's (任务清单 v0.4 S1 note, and AI tutor's mock-rules 2026-11-20):
// - each skill's target is the learner's own per-skill requirement, else the overall target;
// - weak: first a skill below the school's per-skill minimum; else the largest gap to target; ties: the one that did
//   not rise since the last score, then 听 → 读 → 写 → 说; a second weak skill is another with a gap of 0.5 or more
//   (at most one); every skill at target: 「保持」 (no weak skill);
// - speaking counts only from a real exam or a teacher, never a mock (the learner cannot score it alone);
// - the weak skill changes only when a new score comes in, not between mocks.
// Kept free of misc/lojo-plan.ts (which imports this file).

export const SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const;
export type Skill = typeof SKILLS[number];
export const isSkill = (x: unknown): x is Skill => typeof x === 'string' && (SKILLS as readonly string[]).includes(x);

// What a task trains (攻略's list, field skill): the four skills, or vocab / grammar / mixed.
export const TASK_SKILLS = [...SKILLS, 'vocab', 'grammar', 'mixed'] as const;
export type TaskSkill = typeof TASK_SKILLS[number];
export const isTaskSkill = (x: unknown): x is TaskSkill => typeof x === 'string' && (TASK_SKILLS as readonly string[]).includes(x);

export const SCORE_SOURCES = ['mock', 'real', 'teacher'] as const;
export type ScoreSource = typeof SCORE_SOURCES[number];
export const isScoreSource = (x: unknown): x is ScoreSource => typeof x === 'string' && (SCORE_SOURCES as readonly string[]).includes(x);

export type SkillMap<T> = Partial<Record<Skill, T>>;

export type ScoreRow = {
	id: string; userId: string; date: string; source: ScoreSource;
	listening: number | null; reading: number | null; writing: number | null; speaking: number | null; overall: number | null;
	estimated: Skill[]; taskId: string | null; by: string; removedAt: Date | null; createdAt: Date;
};

// The last judgement, kept on the plan (lojo_plan.weak). skill null and keep false: not enough scores yet.
export type Weak = { skill: Skill | null; second: Skill | null; keep: boolean; lowest: Skill | null; judgedAt: string; scoreId: string | null };

// A band: 0–9 in half steps.
export const isBand = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 9 && Number.isInteger(x * 2);

// IELTS overall: the mean of the four, .25 rounds up to .5 and .75 up to the next whole band. null unless all four.
export function ieltsOverall(s: SkillMap<number | null>): number | null {
	const v = SKILLS.map(k => s[k]);
	if (v.some(x => x == null)) return null;
	const mean = (v as number[]).reduce((a, b) => a + b, 0) / 4;
	return Math.floor(mean * 2 + 0.5 + 1e-9) / 2;
}

// Speaking from a mock is the learner's own guess: it never counts.
export const counts = (r: Pick<ScoreRow, 'source'>, k: Skill) => k !== 'speaking' || r.source !== 'mock';

export type SkillState = { target: number | null; min: number | null; current: number | null; estimated: boolean; date: string | null; source: ScoreSource | null; prev: number | null };

// Each skill now: the latest score that counts (date, then when it was entered) and the one before it.
export function skillState(scores: ScoreRow[], overallTarget: number | null, targets: SkillMap<number> | null, minimums: SkillMap<number> | null): Record<Skill, SkillState> {
	const live = scores.filter(r => r.removedAt == null)
		.sort((a, b) => a.date.localeCompare(b.date) || +new Date(a.createdAt) - +new Date(b.createdAt));
	const out = {} as Record<Skill, SkillState>;
	for (const k of SKILLS) {
		const had = live.filter(r => r[k] != null && counts(r, k));
		const last = had.at(-1); const before = had.at(-2);
		out[k] = {
			target: targets?.[k] ?? overallTarget, min: minimums?.[k] ?? null,
			current: last ? last[k] : null, estimated: last ? last.estimated.includes(k) : false,
			date: last?.date ?? null, source: last?.source ?? null, prev: before ? before[k] : null,
		};
	}
	return out;
}

// Which skill to train most for the next two weeks. null: no score for any skill yet (the list's fallbackName).
export function judgeWeak(st: Record<Skill, SkillState>, judgedAt: string, scoreId: string | null): Weak | null {
	const known = SKILLS.filter(k => st[k].current != null);
	if (known.length === 0) return null;
	const below = (k: Skill) => (st[k].min != null && (st[k].current as number) < (st[k].min as number) ? (st[k].min as number) - (st[k].current as number) : 0);
	const gap = (k: Skill) => (st[k].target == null ? 0 : (st[k].target as number) - (st[k].current as number));
	const rose = (k: Skill) => (st[k].prev != null && (st[k].current as number) > st[k].prev! ? 1 : 0);
	const ranked = [...known].sort((a, b) =>
		(below(a) > 0 ? 0 : 1) - (below(b) > 0 ? 0 : 1) || below(b) - below(a) || gap(b) - gap(a) || rose(a) - rose(b) || SKILLS.indexOf(a) - SKILLS.indexOf(b));
	const short = (k: Skill) => below(k) > 0 || gap(k) > 0;
	if (!short(ranked[0])) {
		// 「保持」: everything at target. The lowest score gets two of the six.
		const lowest = [...known].sort((a, b) => (st[a].current as number) - (st[b].current as number) || rose(a) - rose(b) || SKILLS.indexOf(a) - SKILLS.indexOf(b))[0];
		return { skill: null, second: null, keep: true, lowest, judgedAt, scoreId };
	}
	const second = ranked.slice(1).find(k => below(k) > 0 || gap(k) >= 0.5) ?? null;
	return { skill: ranked[0], second, keep: false, lowest: null, judgedAt, scoreId };
}

// The six 「弱项专项一组」 of week weekNo (counted from the stage's first Monday), in order. null: no judgement yet.
// - one weak skill: all six; with a second: 4 : 2 (w w s w w s);
// - 保持: the lowest twice and the other three once (听 → 读 → 写 → 说), the sixth goes round one skill a week.
export function s1Skills(w: Weak | null, weekNo: number): Skill[] | null {
	if (w == null) return null;
	if (w.skill && w.second) return [w.skill, w.skill, w.second, w.skill, w.skill, w.second];
	if (w.skill) return Array(6).fill(w.skill);
	if (!w.keep || w.lowest == null) return null;
	const out: Skill[] = [];
	for (const k of SKILLS) { out.push(k); if (k === w.lowest) out.push(k); }
	out.push(SKILLS[((weekNo % 4) + 4) % 4]);
	return out;
}

// 「本周做完」: done tasks per skill on the days from..to (check-ins not counted; tasks without a skill neither).
export function weekDone(tasks: { kind: string; status: string; date: string; skill: string | null }[], from: string, to: string): Record<TaskSkill, number> {
	const out = Object.fromEntries(TASK_SKILLS.map(k => [k, 0])) as Record<TaskSkill, number>;
	for (const t of tasks) {
		if (t.kind !== 'task' || t.status !== 'done' || t.date < from || t.date > to || !isTaskSkill(t.skill)) continue;
		out[t.skill]++;
	}
	return out;
}

// A per-skill map from outside (Momo, the page): only the four skills, only bands. null = not given; {} = clear.
export function skillMapProblem(raw: unknown): string | null {
	if (raw == null) return null;
	if (typeof raw !== 'object' || Array.isArray(raw)) return 'not an object';
	for (const [k, v] of Object.entries(raw)) {
		if (!isSkill(k)) return `unknown skill ${k}`;
		if (v != null && !isBand(v)) return `${k} is not a band (0–9, half steps)`;
	}
	return null;
}
export function cleanSkillMap(raw: unknown): SkillMap<number> | null {
	if (raw == null || typeof raw !== 'object') return null;
	const out: SkillMap<number> = {};
	for (const k of SKILLS) { const v = (raw as Record<string, unknown>)[k]; if (isBand(v)) out[k] = v; }
	return Object.keys(out).length ? out : null;
}
