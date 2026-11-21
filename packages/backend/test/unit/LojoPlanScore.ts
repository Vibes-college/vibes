/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 学习计划第一版 (2026-11-20): scores, the weak skill, the stage mocks every 14 days and the list's new fields.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { cleanSkillMap, ieltsOverall, judgeWeak, s1Skills, skillMapProblem, skillState, weekDone } from '@/misc/lojo-plan-score.js';
import { addDays, aloneOn, cadenceDates, computeStages, dayOffAlone, fillDays, guideOf, planListProblems } from '@/misc/lojo-plan.js';
import type { ScoreRow, SkillState, Weak } from '@/misc/lojo-plan-score.js';
import type { PlanList, PlanStage, TaskDraft, TaskRow } from '@/misc/lojo-plan.js';

const row = (o: Partial<ScoreRow>): ScoreRow => ({
	id: 's', userId: 'u', date: '2026-11-15', source: 'mock', listening: null, reading: null, writing: null, speaking: null, overall: null,
	estimated: [], taskId: null, by: 'self', removedAt: null, createdAt: new Date('2026-11-15T10:00:00Z'), ...o,
});

// A skill now: target 7 unless given (the overall target), no school minimum.
const S = (current: number | null, o: Partial<SkillState> = {}): SkillState => ({
	target: 7, min: null, current, estimated: false, date: current == null ? null : '2026-11-15', source: current == null ? null : 'mock', prev: null, ...o,
});
const st = (listening: SkillState, reading: SkillState, writing: SkillState, speaking: SkillState) => ({ listening, reading, writing, speaking });

describe('scores', () => {
	test('IELTS overall: .25 up to .5, .75 up to the next band, nothing without all four', () => {
		expect(ieltsOverall({ listening: 6, reading: 6.5, writing: 6, speaking: 6 })).toBe(6);
		expect(ieltsOverall({ listening: 6, reading: 6.5, writing: 6.5, speaking: 6 })).toBe(6.5);
		expect(ieltsOverall({ listening: 6.5, reading: 6.5, writing: 6.5, speaking: 7 })).toBe(6.5);
		expect(ieltsOverall({ listening: 6.5, reading: 7, writing: 7, speaking: 7 })).toBe(7);
		expect(ieltsOverall({ listening: 6.5, reading: 7, writing: 7 })).toBeNull();
	});

	test('each skill: the latest that counts; speaking from a mock never counts; which were estimated', () => {
		const s = skillState([
			row({ id: 'a', date: '2026-11-01', listening: 6, reading: 6.5, writing: 5.5, speaking: 6, estimated: ['writing'] }),
			row({ id: 't', date: '2026-11-10', source: 'teacher', speaking: 6 }),
			row({ id: 'b', date: '2026-11-15', listening: 6.5, reading: 6.5, writing: 6, speaking: 7, estimated: ['writing', 'speaking'] }),
			row({ id: 'gone', date: '2026-11-16', listening: 9, removedAt: new Date() }),
		], 7, { writing: 6.5 }, { speaking: 6.5 });
		expect(s.listening).toMatchObject({ current: 6.5, prev: 6, target: 7, source: 'mock' });
		expect(s.writing).toMatchObject({ current: 6, prev: 5.5, estimated: true, target: 6.5 });
		expect(s.speaking).toMatchObject({ current: 6, prev: null, source: 'teacher', min: 6.5, date: '2026-11-10' });
	});

	test('per-skill maps from outside: only the four skills, only bands; {} clears', () => {
		expect(skillMapProblem({ writing: 6.5, speaking: null })).toBeNull();
		expect(skillMapProblem(null)).toBeNull();
		expect(skillMapProblem({ math: 6 })).toContain('math');
		expect(skillMapProblem({ writing: 6.3 })).toContain('writing');
		expect(skillMapProblem([6])).not.toBeNull();
		expect(cleanSkillMap({ writing: 6, reading: null })).toEqual({ writing: 6 });
		expect(cleanSkillMap({})).toBeNull();
	});

	test('this week\'s done tasks per skill', () => {
		const t = (skill: string | null, status = 'done', date = '2026-11-17', kind = 'task') => ({ kind, status, date, skill });
		const n = weekDone([t('listening'), t('listening'), t('writing'), t('writing', 'todo'), t('reading', 'done', '2026-11-23'), t('vocab', 'done', '2026-11-17', 'checkin'), t(null)], '2026-11-16', '2026-11-22');
		expect(n).toMatchObject({ listening: 2, writing: 1, reading: 0, vocab: 0, mixed: 0 });
	});
});

describe('the weak skill', () => {
	test('below the school\'s minimum goes first, whatever the gaps', () => {
		const w = judgeWeak(st(S(7), S(7), S(5.5), S(6, { min: 6.5 })), '2026-11-20', 'x');
		expect(w).toMatchObject({ skill: 'speaking', second: 'writing', keep: false });
		expect(judgeWeak(st(S(7), S(5, { min: 6 }), S(5.5, { min: 6 }), S(null)), '2026-11-20', 'x')).toMatchObject({ skill: 'reading', second: 'writing' });
	});

	test('else the largest gap; a second one only with a gap of 0.5 or more', () => {
		expect(judgeWeak(st(S(6.5), S(7), S(6), S(null)), '2026-11-20', 'x')).toMatchObject({ skill: 'writing', second: 'listening' });
		expect(judgeWeak(st(S(7), S(7), S(6), S(null)), '2026-11-20', 'x')).toMatchObject({ skill: 'writing', second: null });
	});

	test('ties: the one that did not rise, then 听 → 读 → 写 → 说', () => {
		expect(judgeWeak(st(S(6, { prev: 5.5 }), S(7), S(6, { prev: 6 }), S(7)), '2026-11-20', 'x')).toMatchObject({ skill: 'writing', second: 'listening' });
		expect(judgeWeak(st(S(6), S(6), S(7), S(7)), '2026-11-20', 'x')).toMatchObject({ skill: 'listening', second: 'reading' });
	});

	test('a skill\'s own target counts instead of the overall one', () => {
		expect(judgeWeak(st(S(6.5), S(7), S(6, { target: 6 }), S(7)), '2026-11-20', 'x')).toMatchObject({ skill: 'listening', second: null });
	});

	test('every skill at target: 保持, the lowest gets two; no score at all: nothing', () => {
		expect(judgeWeak(st(S(7), S(7.5), S(7), S(7)), '2026-11-20', 'x')).toMatchObject({ skill: null, second: null, keep: true, lowest: 'listening' });
		expect(judgeWeak(st(S(7), S(7), S(6, { target: 6 }), S(7)), '2026-11-20', 'x')).toMatchObject({ keep: true, lowest: 'writing' });
		expect(judgeWeak(st(S(null), S(null), S(null), S(null)), '2026-11-20', null)).toBeNull();
	});

	test('the six S1 a week: all to the weak skill, 4 : 2 with a second, 保持 round the four', () => {
		const w = (o: Partial<Weak>): Weak => ({ skill: null, second: null, keep: false, lowest: null, judgedAt: '2026-11-20', scoreId: null, ...o });
		expect(s1Skills(w({ skill: 'writing', second: 'listening' }), 0)).toEqual(['writing', 'writing', 'listening', 'writing', 'writing', 'listening']);
		expect(s1Skills(w({ skill: 'writing' }), 3)).toEqual(Array(6).fill('writing'));
		const keep = w({ keep: true, lowest: 'reading' });
		expect(s1Skills(keep, 0)).toEqual(['listening', 'reading', 'reading', 'writing', 'speaking', 'listening']);
		expect([1, 2, 3, 4].map(n => s1Skills(keep, n)?.[5])).toEqual(['reading', 'writing', 'speaking', 'listening']);
		expect(s1Skills(null, 0)).toBeNull();
		expect(s1Skills(w({}), 0)).toBeNull();
	});
});

const G = (slug: string) => ({ slug, section: '一节' });
const LIST2: PlanList = {
	track: 'test',
	stages: [
		{ stageNo: 0, name: '摸底', goal: '', lengthDays: 7, items: [
			{ id: 'M1', name: '摸底模考', minutes: 120, kind: 'task', app: null, ref: null, perWeek: 'once', priority: 1, autoDone: 'manual', skill: 'mixed', mock: true, guide: G('ielts-listening') },
		] },
		{ stageNo: 1, name: '打底', goal: '', share: 0.3, items: [
			{ id: 'B7', name: '语法一节', minutes: 20, kind: 'task', app: 'grammar', ref: null, perWeek: 1, priority: 3, autoDone: 'manual', skill: 'grammar' },
		] },
		{ stageNo: 2, name: '练专项', goal: '', share: 0.5, items: [
			{ id: 'C1', name: '背单词', minutes: 10, kind: 'checkin', app: 'vocab', ref: null, perWeek: 6, priority: 0, autoDone: { answered: 15 }, skill: 'vocab', guide: G('ielts-reading') },
			{ id: 'S1', name: '弱项专项一组：{focus}', minutes: 45, kind: 'task', app: null, ref: null, perWeek: 6, priority: 1, autoDone: 'manual', skill: 'mixed', fillFrom: 'weak', fallbackName: '弱项专项一组',
				guide: { listening: G('ielts-listening'), reading: G('ielts-reading'), writing: G('ielts-writing'), speaking: G('ielts-speaking') } },
			{ id: 'S4', name: '写一篇作文', minutes: 30, kind: 'task', app: null, ref: null, perWeek: 2, priority: 2, autoDone: 'manual', skill: 'writing', note: '和 S1 写作专项不重复排', guide: G('ielts-writing') },
			{ id: 'P1', name: '阶段模考', minutes: 170, kind: 'task', app: null, ref: null, priority: 1, autoDone: 'manual', skill: 'mixed', mock: true, alone: true,
				cadence: { everyDays: 14, startDay: 14, skipWithinDaysOfNextStage: 7 } },
			{ id: 'P2', name: '阶段模考复盘', minutes: 60, kind: 'task', app: null, ref: null, priority: 2, autoDone: 'manual', skill: 'mixed', after: 'P1', offsetDays: 1, guide: G('ielts-reading') },
			{ id: 'P3', name: '口语录一整套', minutes: 20, kind: 'task', app: null, ref: null, priority: 3, autoDone: 'manual', skill: 'speaking', after: 'P1', offsetDays: 1 },
		] },
		{ stageNo: 3, name: '冲刺', goal: '', share: 0.2, items: [
			{ id: 'R1', name: '整套模考', minutes: 170, kind: 'task', app: null, ref: null, perWeek: 2, priority: 1, autoDone: 'manual', skill: 'mixed', mock: true, alone: true },
			{ id: 'R2', name: '模考复盘', minutes: 60, kind: 'task', app: null, ref: null, priority: 2, autoDone: 'manual', skill: 'mixed', after: 'R1', offsetDays: 1 },
			{ id: 'R3', name: '口语模拟', minutes: 20, kind: 'task', app: null, ref: null, perWeek: 2, priority: 3, autoDone: 'manual', skill: 'speaking' },
		] },
	],
};

// 2026-11-16 is a Monday; Sunday is the rest day.
const C = { restDay: 0, dailyMinutes: 120, lastDay: '2027-01-09' };
const stage = (no: number, start: string, end: string): PlanStage => ({ no, name: '', goal: '', start, end });
const P1 = LIST2.stages[2].items.find(x => x.id === 'P1')!.cadence!;

describe('the list\'s new fields', () => {
	test('pass the import check; wrong ones are named', () => {
		expect(planListProblems(LIST2)).toEqual([]);
		const bad = structuredClone(LIST2);
		const items = bad.stages[2].items;
		items.push({ id: 'X1', name: 'x', minutes: 10, kind: 'task', app: null, ref: null, priority: 1, autoDone: 'manual' });
		items.push({ id: 'X2', name: 'x', minutes: 10, kind: 'task', app: null, ref: null, priority: 1, autoDone: 'manual', after: 'Q9' });
		items.push({ id: 'X3', name: 'x', minutes: 10, kind: 'task', app: null, ref: null, perWeek: 1, priority: 1, autoDone: 'manual', cadence: { everyDays: 14, startDay: 14 } });
		items.push({ id: 'X4', name: 'x', minutes: 10, kind: 'task', app: null, ref: null, perWeek: 1, priority: 1, autoDone: 'manual', guide: { slug: 'Bad Slug' } });
		items.push({ id: 'X5', name: 'x', minutes: 10, kind: 'task', app: null, ref: null, perWeek: 1, priority: 1, autoDone: 'manual', skill: 'math' as never });
		const p = planListProblems(bad).join('\n');
		for (const id of ['X1', 'X2', 'X3', 'X4', 'X5']) expect(p).toContain(id);
	});

	test('a guide for the skill trained that day', () => {
		const s1 = LIST2.stages[2].items.find(x => x.id === 'S1')!;
		expect(guideOf(s1, 'reading')).toEqual({ slug: 'ielts-reading', section: '一节', block: null });
		expect(guideOf(s1, 'mixed')).toBeNull();
		expect(guideOf({ guide: G('ielts-writing') }, null)?.slug).toBe('ielts-writing');
		expect(guideOf({}, 'writing')).toBeNull();
	});
});

describe('stage mocks every 14 days', () => {
	test('first on day 14 (moved off the rest day); none within 7 days of the sprint', () => {
		const s = stage(2, '2026-11-16', '2026-12-18'); // 33 days; day 28 (12-13, a Sunday → 12-14) is 5 days before the sprint
		expect(cadenceDates(P1, s, C)).toEqual(['2026-11-30']);
		expect(cadenceDates({ ...P1, skipWithinDaysOfNextStage: 0 }, s, C)).toEqual(['2026-11-30', '2026-12-14']);
	});
	test('a stage under 14 days has none', () => {
		expect(cadenceDates(P1, stage(2, '2026-11-16', '2026-11-28'), C)).toEqual([]);
		expect(cadenceDates(P1, stage(2, '2026-11-16', '2026-11-29'), C)).toEqual([]);
	});
	test('a real exam counts as one: the next is 14 days after it', () => {
		const s = stage(2, '2026-11-16', '2027-01-10');
		expect(cadenceDates(P1, s, C)).toEqual(['2026-11-30', '2026-12-14', '2026-12-28']);
		expect(cadenceDates(P1, s, C, ['2026-11-25'])).toEqual(['2026-12-09', '2026-12-23']);
		expect(cadenceDates(P1, s, C, ['2026-12-02'])).toEqual(['2026-11-30', '2026-12-16', '2026-12-30']);
		expect(cadenceDates(P1, s, C, ['2026-10-01'])).toEqual(['2026-11-30', '2026-12-14', '2026-12-28']);
	});
});

describe('filling 练专项 and 冲刺', () => {
	const plan = { restDay: 0, dailyMinutes: 120, examDate: '2027-01-10', focus: '论证展开' };
	const stages = [stage(2, '2026-11-16', '2026-12-18'), stage(3, '2026-12-19', '2027-01-09')];
	const on = (out: TaskDraft[], d: string) => out.filter(t => t.kind === 'task' && t.date === d);
	const weak: Weak = { skill: 'writing', second: 'listening', keep: false, lowest: null, judgedAt: '2026-11-15', scoreId: 's' };
	const out = fillDays(LIST2, plan, stages, [], '2026-11-16', '2026-12-02', { weak });

	test('the stage mock alone on its day; the review and speaking the day after, whatever the minutes', () => {
		expect(on(out, '2026-11-30').map(t => [t.itemId, t.mock])).toEqual([['P1', true]]);
		expect(on(out, '2026-12-01').map(t => t.itemId).sort()).toEqual(['P2', 'P3']);
		expect(on(out, '2026-12-01').find(t => t.itemId === 'P3')?.skill).toBe('speaking');
		expect(out.filter(t => t.itemId === 'P1')).toHaveLength(1);
	});

	test('S1 4 : 2 between the weak skill and the second; the weak one carries the focus; its guide', () => {
		const s1 = out.filter(t => t.itemId === 'S1' && t.date <= '2026-11-21');
		expect(s1.map(t => t.skill)).toEqual(['writing', 'writing', 'listening', 'writing', 'writing', 'listening']);
		expect(s1[0].title).toBe('弱项专项一组：写作 · 论证展开');
		expect(s1[2].title).toBe('弱项专项一组：听力');
		expect(s1.map(t => t.guide?.slug)).toEqual(['ielts-writing', 'ielts-writing', 'ielts-listening', 'ielts-writing', 'ielts-writing', 'ielts-listening']);
		expect(s1.every(t => t.mock == null)).toBe(true);
	});

	test('「和 S1 写作专项不重复排」: the essay moves to a day S1 is not writing', () => {
		expect(out.filter(t => t.itemId === 'S4' && t.date <= '2026-11-21').map(t => t.date)).toEqual(['2026-11-18', '2026-11-21']);
		const only = fillDays(LIST2, plan, stages, [], '2026-11-16', '2026-11-21', { weak: { ...weak, second: null } });
		expect(only.filter(t => t.itemId === 'S4')).toHaveLength(0);
	});

	test('no score yet: S1 is the fallback name, the essay on its own days', () => {
		const none = fillDays(LIST2, { ...plan, focus: null }, stages, [], '2026-11-16', '2026-11-21');
		expect(none.filter(t => t.itemId === 'S1').map(t => [t.title, t.skill, t.guide])[0]).toEqual(['弱项专项一组', 'mixed', null]);
		// a focus Vibi set before there were scores still shows, as before
		expect(fillDays(LIST2, plan, stages, [], '2026-11-16', '2026-11-16').find(t => t.itemId === 'S1')?.title).toBe('弱项专项一组：论证展开');
		expect(none.filter(t => t.itemId === 'S4').map(t => t.date)).toEqual(['2026-11-17', '2026-11-20']);
	});

	test('保持: the lowest twice, the others once, no focus in the title', () => {
		const keep = fillDays(LIST2, plan, stages, [], '2026-11-16', '2026-11-21', { weak: { ...weak, skill: null, second: null, keep: true, lowest: 'reading' } });
		expect(keep.filter(t => t.itemId === 'S1').map(t => t.title.replace('弱项专项一组：', ''))).toEqual(['听力', '阅读', '阅读', '写作', '口语', '听力']);
	});

	test('check-ins carry their skill and guide', () => {
		expect(out.filter(t => t.kind === 'checkin').map(t => [t.itemId, t.skill, t.guide?.slug, t.mock])).toEqual([['C1', 'vocab', 'ielts-reading', null]]);
	});

	test('冲刺: R1 alone twice a week, R2 the day after; R3 moves off R1\'s days', () => {
		const sprint = fillDays(LIST2, plan, [stage(3, '2026-11-16', '2026-12-05')], [], '2026-11-16', '2026-11-21');
		const days = (id: string) => sprint.filter(t => t.itemId === id).map(t => t.date);
		expect(days('R1')).toEqual(['2026-11-17', '2026-11-20']);
		expect(on(sprint, '2026-11-17')).toHaveLength(1);
		expect(days('R2')).toEqual(['2026-11-18', '2026-11-21']);
		expect(days('R3')).toEqual(['2026-11-18', '2026-11-21']);
	});
});

// 学习计划第一版补 (2026-11-20, AI tutor): one-off things are never lost to a full mock day (only the mock and check-ins).
describe('one-off things off the full mock days', () => {
	// LIST2 with a once item in 冲刺 (R4), like 攻略's list
	const LIST3: PlanList = { ...LIST2, stages: LIST2.stages.map(s => (s.stageNo !== 3 ? s : { ...s, items: [...s.items,
		{ id: 'R4', name: '打字机考模拟', minutes: 20, kind: 'task' as const, app: null, ref: null, perWeek: 'once' as const, priority: 4, autoDone: 'manual' as const, skill: 'mixed' as const }] })) };
	const ids = (out: TaskDraft[], d: string) => out.filter(t => t.kind === 'task' && t.date === d).map(t => t.itemId);
	const days = (out: TaskDraft[], id: string) => out.filter(t => t.itemId === id).map(t => t.date);

	test('a once item due on an R1 day goes to the next study day; R2 after the week\'s last R1 goes to next week', () => {
		// 冲刺 from Thursday: that week has 3 study days, R1 on Thu and Sat; R4's day (the 3rd) is Saturday
		const plan = { restDay: 0, dailyMinutes: 120, examDate: '2026-12-12', focus: null };
		const out = fillDays(LIST3, plan, [stage(3, '2026-11-19', '2026-12-11')], [], '2026-11-19', '2026-11-28');
		expect(days(out, 'R1')).toEqual(['2026-11-19', '2026-11-21', '2026-11-24', '2026-11-27']);
		for (const d of days(out, 'R1')) expect(ids(out, d)).toEqual(['R1']);
		expect(days(out, 'R4')).toEqual(['2026-11-23']);
		expect(days(out, 'R2')).toEqual(['2026-11-20', '2026-11-23', '2026-11-25', '2026-11-28']);
		// filled a few days at a time, the same days
		const parts = [['2026-11-19', '2026-11-21'], ['2026-11-22', '2026-11-28']].reduce<TaskDraft[]>((acc, [a, b]) =>
			[...acc, ...fillDays(LIST3, plan, [stage(3, '2026-11-19', '2026-12-11')], acc.map((t, i) => ({ ...t, id: `p${i}`, userId: 'u', origDate: t.date, status: 'todo', doneBy: null, doneAt: null, by: 'planner', pinned: false, askedAt: null, offDate: null, createdAt: new Date() }) as TaskRow), a, b)], []);
		expect(days(parts, 'R4')).toEqual(['2026-11-23']);
		expect(days(parts, 'R2')).toEqual(days(out, 'R2'));
	});

	test('冲刺\'s last days: nothing free later, so the nearest earlier day; a review never goes before its mock', () => {
		// three study days before the exam, R1 on the first and the last; R4's day is the last
		const plan = { restDay: 0, dailyMinutes: 120, examDate: '2026-11-22', focus: null };
		const out = fillDays(LIST3, plan, [stage(3, '2026-11-19', '2026-11-21')], [], '2026-11-19', '2026-11-21');
		expect(days(out, 'R1')).toEqual(['2026-11-19', '2026-11-21']);
		expect(days(out, 'R4')).toEqual(['2026-11-20']);
		expect(days(out, 'R2')).toEqual(['2026-11-20']);
		expect(ids(out, '2026-11-21')).toEqual(['R1']);
	});

	test('what follows an R1 onto another R1 day moves on to the next free day', () => {
		// 冲刺 from Friday: Fri and Sat both R1; both reviews would be Saturday or later, so Monday
		const plan = { restDay: 0, dailyMinutes: 120, examDate: '2026-12-12', focus: null };
		const out = fillDays(LIST3, plan, [stage(3, '2026-11-20', '2026-12-11')], [], '2026-11-20', '2026-11-23');
		expect(days(out, 'R1')).toEqual(['2026-11-20', '2026-11-21']);
		expect(ids(out, '2026-11-21')).toEqual(['R1']);
		expect(days(out, 'R2')).toEqual(['2026-11-23']);
	});

	test('addTask\'s day: alone when the mock is on it, or (not planned yet) when the list will put one there', () => {
		const plan = { restDay: 0, dailyMinutes: 150, examDate: '2026-12-12', focus: null, stages: [stage(3, '2026-11-16', '2026-12-11')], plannedUntil: '2026-11-22' };
		const r1 = (date: string, o: Partial<TaskRow> = {}) => ({ id: `r${date}`, userId: 'u', title: '整套模考', kind: 'task', stage: 3, origDate: date, date, endDate: null, minutes: 170, app: null, ref: null,
			autoDone: null, itemId: 'R1', status: 'todo', doneBy: null, doneAt: null, by: 'planner', pinned: false, askedAt: null, offDate: null, createdAt: new Date(), skill: 'mixed', guide: null, mock: true, ...o }) as TaskRow;
		const tasks = [r1('2026-11-17'), r1('2026-11-21', { date: '2026-11-19' })]; // the learner moved Saturday's mock to Thursday
		expect(aloneOn(LIST3, plan, tasks, '2026-11-17')).toBe(true);
		expect(aloneOn(LIST3, plan, tasks, '2026-11-19')).toBe(true);
		expect(aloneOn(LIST3, plan, tasks, '2026-11-20')).toBe(false); // the list's day, but planned already and no mock on it
		expect(aloneOn(LIST3, plan, tasks, '2026-11-18')).toBe(false);
		expect(aloneOn(LIST3, plan, tasks, '2026-11-24')).toBe(true); // next week, not planned yet: R1 on Tuesday
		expect(aloneOn(LIST3, plan, [{ ...tasks[0], status: 'removed' }], '2026-11-17')).toBe(false);
		const c = { restDay: 0, dailyMinutes: 150, lastDay: '2026-12-11' };
		const isAlone = (x: string) => aloneOn(LIST3, plan, tasks, x);
		expect(dayOffAlone(c, tasks, '2026-11-17', '2026-11-16', 30, isAlone)).toBe('2026-11-18');
		expect(dayOffAlone(c, tasks, '2026-11-19', '2026-11-16', 30, isAlone)).toBe('2026-11-20');
		// the next day is full: the one after; nothing later up to the exam: the nearest earlier one, not before today
		const full = [...tasks, ...[...Array(5).keys()].map(i => ({ ...tasks[0], id: `f${i}`, itemId: null, minutes: 10, date: '2026-11-18' }))];
		expect(dayOffAlone(c, full, '2026-11-17', '2026-11-16', 30, x => aloneOn(LIST3, plan, full, x))).toBe('2026-11-20'); // 18th has 5 things, 19th has the moved mock
		expect(dayOffAlone({ ...c, lastDay: '2026-11-19' }, tasks, '2026-11-19', '2026-11-16', 30, isAlone)).toBe('2026-11-18');
		expect(dayOffAlone({ ...c, lastDay: '2026-11-19' }, tasks, '2026-11-19', '2026-11-19', 30, isAlone)).toBeNull();
	});
});

// Drafts as the rows the next filling sees.
const asRows = (drafts: TaskDraft[], tag = 'p') => drafts.map((t, i) => ({ ...t, id: `${tag}${i}`, userId: 'u', origDate: t.date, status: 'todo', doneBy: null, doneAt: null, by: 'planner', pinned: false, askedAt: null, offDate: null, createdAt: new Date() }) as TaskRow);
// Filled a week at a time (Monday to Sunday), as the plan page does.
const byWeek = (list: PlanList, plan: Parameters<typeof fillDays>[1], stages: PlanStage[], from: string, to: string, ex: Parameters<typeof fillDays>[6] = {}) => {
	let acc: TaskDraft[] = [];
	for (let a = from; a <= to;) {
		const b = addDays(a, (7 - new Date(`${a}T00:00:00Z`).getUTCDay()) % 7);
		acc = [...acc, ...fillDays(list, plan, stages, asRows(acc), a, b < to ? b : to, ex)];
		a = addDays(b, 1);
	}
	return acc;
};

// 学习计划第一版补 2 (2026-11-20, AI tutor): a one-off thing cut for time waits for a day with room, never pushing anything out.
describe('one-off things cut for time', () => {
	const LIST4: PlanList = { track: 'test', stages: [{ stageNo: 2, name: '练专项', goal: '', share: 1, items: [
		{ id: 'C1', name: '背单词', minutes: 10, kind: 'checkin', app: 'vocab', ref: null, perWeek: 6, priority: 0, autoDone: 'manual' },
		{ id: 'S1', name: '专项一组', minutes: 45, kind: 'task', app: null, ref: null, perWeek: 6, priority: 1, autoDone: 'manual' },
		{ id: 'X1', name: '打字「边听边打」', minutes: 20, kind: 'task', app: 'typing', ref: 'listen', perWeek: 'once', priority: 5, autoDone: 'manual' },
	] }] };
	// 100 a day: 90 after the check-in, 45 after S1; X1 is due on Wednesday (the stage's 3rd study day)
	const plan = { restDay: 0, dailyMinutes: 100, examDate: '2026-12-31', focus: null };
	const stages = [stage(2, '2026-11-16', '2026-11-21')];
	const mine = (date: string, minutes: number, i = 0) => ({ ...asRows([{ title: '我自己的', kind: 'task', stage: 2, date, endDate: null, minutes, app: null, ref: null, autoDone: null, itemId: null, skill: null, guide: null, mock: null }], `m${date}-${i}`)[0], by: 'learner' });
	const days = (out: TaskDraft[], id: string) => out.filter(t => t.itemId === id).map(t => t.date);

	test('cut on its day: the next day with room, after that day\'s own things', () => {
		expect(days(fillDays(LIST4, plan, stages, [], '2026-11-16', '2026-11-21'), 'X1')).toEqual(['2026-11-18']);
		const out = fillDays(LIST4, plan, stages, [mine('2026-11-18', 30), mine('2026-11-19', 30)], '2026-11-16', '2026-11-21');
		expect(days(out, 'X1')).toEqual(['2026-11-20']); // 18th: 30 + 45 + 20 > 90; 19th the same
		expect(days(out, 'S1')).toHaveLength(6); // nothing pushed out
	});

	test('cut on the last day filled: the day after is worked out, and the next filling keeps it there', () => {
		const first = fillDays(LIST4, plan, stages, [mine('2026-11-18', 30)], '2026-11-16', '2026-11-18');
		expect(days(first, 'X1')).toEqual(['2026-11-19']);
		expect(first.filter(t => t.date > '2026-11-18').map(t => t.itemId)).toEqual(['X1']);
		const next = fillDays(LIST4, plan, stages, [mine('2026-11-18', 30), ...asRows(first)], '2026-11-19', '2026-11-21');
		expect(days(next, 'X1')).toEqual([]);
		expect(days(next, 'S1')).toEqual(['2026-11-19', '2026-11-20', '2026-11-21']);
	});

	test('no room later in the stage: the nearest earlier day; no room anywhere: left out, and heard of', () => {
		const later = ['2026-11-19', '2026-11-20', '2026-11-21'].map(d => mine(d, 30));
		const out = fillDays(LIST4, plan, stages, [mine('2026-11-18', 30), ...later], '2026-11-16', '2026-11-21');
		expect(days(out, 'X1')).toEqual(['2026-11-17']);
		const dropped: unknown[] = [];
		const all = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21'].map(d => mine(d, 30));
		expect(days(fillDays(LIST4, plan, stages, all, '2026-11-16', '2026-11-21', { onDrop: x => dropped.push(x) }), 'X1')).toEqual([]);
		expect(dropped).toEqual([{ itemId: 'X1', title: '打字「边听边打」', stage: 2, date: '2026-11-18' }]);
		// earlier only as far back as the filling starts
		const late: unknown[] = [];
		expect(days(fillDays(LIST4, plan, stages, [mine('2026-11-18', 30), ...later], '2026-11-18', '2026-11-21', { onDrop: x => late.push(x) }), 'X1')).toEqual([]);
		expect(late).toHaveLength(1);
	});

	test('a review with no free one of the 5 moves on, never before its mock', () => {
		// 冲刺 Monday to Saturday: R1 on Tuesday and Friday, R2 the days after; Wednesday and Saturday have 5 things already
		const p = { restDay: 0, dailyMinutes: 300, examDate: '2026-11-22', focus: null };
		const full = ['2026-11-18', '2026-11-21'].flatMap(d => [...Array(5).keys()].map(i => mine(d, 10, i)));
		const dropped: unknown[] = [];
		const out = fillDays(LIST2, p, [stage(3, '2026-11-16', '2026-11-21')], full, '2026-11-16', '2026-11-21', { onDrop: x => dropped.push(x) });
		expect(days(out, 'R1')).toEqual(['2026-11-17', '2026-11-20']);
		expect(days(out, 'R2')).toEqual(['2026-11-19']); // Tuesday's review on Thursday; Friday's: nothing after it, and not back before its mock
		expect(dropped).toEqual([{ itemId: 'R2', title: '模考复盘', stage: 3, date: '2026-11-21' }]);
	});
});

// 攻略's list from v0.4 on (stage mocks, skills, guides). Lives in the Vibes workspace (PLAN_LIST_FILE, or AI tutor's export).
// Only defined when that list is v0.4 or later: with an older list (or none) these tests do not exist, rather than being
// counted as skipped (the pre-release check allows no skipped tests).
const LIST_FILE = process.env.PLAN_LIST_FILE ?? new URL('../../../../../../../prototypes/mia-mastra/plans/ielts-tasks.json', import.meta.url).pathname;
const REAL: PlanList | null = existsSync(LIST_FILE) ? JSON.parse(readFileSync(LIST_FILE, 'utf8')) as PlanList : null;
const V04 = REAL?.stages.some(s => s.items.some(i => i.cadence != null)) ?? false;

if (V04) describe('the real list from v0.4', () => {
	const days = (out: TaskDraft[], id: string) => out.filter(t => t.itemId === id).map(t => t.date);
	const S5_AT_150 = '2026-12-31'; // due Wednesday 12-30, an S4 day (125 of the 130 minutes left); Thursday has room
	test('a whole plan: stage mocks alone, review the next day, R3 kept, never over 5 a day', () => {
		expect(planListProblems(REAL)).toEqual([]);
		const plan = { restDay: 0, dailyMinutes: 150, examDate: '2027-02-27', focus: null };
		const stages = computeStages(REAL!, '2026-11-16', plan.examDate, '5.5');
		const weak: Weak = { skill: 'writing', second: 'listening', keep: false, lowest: null, judgedAt: '2026-11-15', scoreId: 's' };
		const out = fillDays(REAL!, plan, stages, [], '2026-11-16', '2027-02-26', { weak });
		const on = (d: string) => out.filter(t => t.kind === 'task' && t.date === d);
		const p1 = out.filter(t => t.itemId === 'P1');
		expect(p1.length).toBeGreaterThan(0);
		for (const t of p1) {
			expect(on(t.date).map(x => x.itemId)).toEqual(['P1']);
			expect(t.mock).toBe(true);
			const next = on(addDays(t.date, 1)).length ? addDays(t.date, 1) : addDays(t.date, 2);
			expect(on(next).map(x => x.itemId)).toEqual(expect.arrayContaining(['P2', 'P3']));
		}
		for (const t of out.filter(x => x.itemId === 'R1')) expect(on(t.date)).toHaveLength(1);
		expect(out.filter(t => t.itemId === 'R3').length).toBeGreaterThan(0);
		// 2026-11-20: no one-off thing is lost, to a mock day (R4's day is an R1 day in this plan) or for time: at 150 a
		// day S5 (priority 5) is cut on its day (an S4 day) and goes on the next day with room. Each comes exactly once,
		// filled at once or a week at a time (as the plan page does), on the same days. 摸底 is only for a learner with no
		// level yet.
		const once = REAL!.stages.filter(s => stages.some(x => x.no === s.stageNo)).flatMap(s => s.items.filter(x => x.perWeek === 'once'));
		expect(once.map(x => x.id)).toEqual(expect.arrayContaining(['B5', 'S5', 'R4']));
		const dropped: unknown[] = [];
		const weekly = byWeek(REAL!, plan, stages, '2026-11-16', '2027-02-26', { weak, onDrop: x => dropped.push(x) });
		for (const it of once) {
			expect(out.filter(t => t.itemId === it.id), it.id).toHaveLength(1);
			expect(days(weekly, it.id), it.id).toEqual(days(out, it.id));
		}
		expect(dropped).toEqual([]);
		expect(days(out, 'S5')).toEqual([S5_AT_150]);
		const roomy = fillDays(REAL!, { ...plan, dailyMinutes: 200 }, stages, [], '2026-11-16', '2027-02-26', { weak });
		for (const it of once) expect(roomy.filter(t => t.itemId === it.id), it.id).toHaveLength(1);
		expect(new Set(out.filter(t => t.itemId === 'S1').map(t => t.skill))).toEqual(new Set(['writing', 'listening']));
		for (const d of new Set(out.map(t => t.date))) expect(on(d).length).toBeLessThanOrEqual(5);
		expect(out.filter(t => t.guide != null).every(t => /^ielts-[a-z0-9-]+$/.test(t.guide!.slug))).toBe(true);
	});
});
