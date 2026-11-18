/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
	addDays, autoCheck, computeStages, dayProblem, delayDays, fillDays, lastDayOfMonth, mondayOf, planListProblems, answerRefs, rollover, startOfDay, streak, todayIn, typingReport, weekday,
} from '@/misc/lojo-plan.js';
import type { PlanList, TaskRow } from '@/misc/lojo-plan.js';
import { planText } from '@/misc/lojo-plan-text.js';

// The list lives in the Vibes workspace (not in this repository); the tests that need it are skipped where it is not.
const LIST_FILE = process.env.PLAN_LIST_FILE ?? new URL('../../../../../../../prototypes/mia-mastra/plans/ielts-tasks.json', import.meta.url).pathname;
const REAL: PlanList | null = existsSync(LIST_FILE) ? JSON.parse(readFileSync(LIST_FILE, 'utf8')) as PlanList : null;

const LIST: PlanList = {
	track: 'test',
	stages: [
		{ stageNo: 0, name: '摸底', goal: '', lengthDays: 7, items: [
			{ id: 'P1', name: '摸底听力', minutes: 40, kind: 'task', app: null, ref: null, perWeek: 'once', priority: 1, autoDone: 'manual' } as any,
		] },
		{ stageNo: 1, name: '打底', goal: '', share: 0.4, items: [
			{ id: 'C1', name: '背单词', minutes: 15, kind: 'checkin', app: 'vocab', ref: null, perWeek: 7, priority: 0, autoDone: { answered: 15 } } as any,
			{ id: 'B1', name: '词汇 {ref}', minutes: 20, kind: 'task', app: 'vocab', ref: ['5.1', '5.2', '5.3'], perWeek: 'rotate', priority: 1, autoDone: { answered: 20 } } as any,
			{ id: 'W1', name: '写一篇', minutes: 60, kind: 'task', app: null, ref: null, perWeek: 1, priority: 2, autoDone: 'manual', note: '排在每周最后一个学习日' } as any,
		] },
		{ stageNo: 2, name: '强化', goal: '', share: 0.4, items: [
			{ id: 'R1', name: '整套模考', minutes: 170, kind: 'task', app: null, ref: null, perWeek: 1, priority: 1, autoDone: 'manual' } as any,
		] },
		{ stageNo: 3, name: '冲刺', goal: '', share: 0.2, items: [
			{ id: 'S1', name: '冲刺听力', minutes: 30, kind: 'task', app: null, ref: null, perWeek: 6, priority: 1, autoDone: 'manual' } as any,
		] },
	],
};

const task = (o: Partial<TaskRow>): TaskRow => ({
	id: 'x', userId: 'u', title: 't', kind: 'task', stage: 1, origDate: '2026-11-16', date: '2026-11-16', endDate: null, minutes: 20, app: null, ref: null,
	autoDone: null, itemId: null, status: 'todo', doneBy: null, doneAt: null, by: 'planner', pinned: false, askedAt: null, offDate: null, createdAt: new Date(), ...o,
});

describe('dates', () => {
	test('month end and year boundary', () => {
		expect(lastDayOfMonth('2026-02-10')).toBe('2026-02-28');
		expect(lastDayOfMonth('2028-02-01')).toBe('2028-02-29');
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
		expect(mondayOf('2027-01-01')).toBe('2026-12-28');
		expect(weekday('2026-11-15')).toBe(0);
	});
	test('time zone near midnight', () => {
		const at = new Date('2026-11-15T16:30:00Z'); // 00:30 in Shanghai on the 16th, 08:30 in LA on the 15th
		expect(todayIn('Asia/Shanghai', at)).toBe('2026-11-16');
		expect(todayIn('America/Los_Angeles', at)).toBe('2026-11-15');
		expect(startOfDay('2026-11-16', 'Asia/Shanghai').toISOString()).toBe('2026-11-15T16:00:00.000Z');
	});
});

describe('stages', () => {
	test('no score yet: only the 7-day 摸底', () => {
		const s = computeStages(LIST, '2026-11-16', '2027-03-01', 'unknown');
		expect(s).toHaveLength(1);
		expect(s[0]).toMatchObject({ no: 0, start: '2026-11-16', end: '2026-11-22' });
	});
	test('20 days left: only 冲刺, ending the day before the exam', () => {
		const s = computeStages(LIST, '2026-11-16', '2026-12-06', '5.5');
		expect(s).toEqual([expect.objectContaining({ no: 3, start: '2026-11-16', end: '2026-12-05' })]);
	});
	test('three stages cover every day up to the day before the exam', () => {
		const s = computeStages(LIST, '2026-11-16', '2027-01-25', '5.5');
		expect(s.map(x => x.no)).toEqual([1, 2, 3]);
		expect(s[0].start).toBe('2026-11-16');
		expect(addDays(s[0].end, 1)).toBe(s[1].start);
		expect(addDays(s[1].end, 1)).toBe(s[2].start);
		expect(s[2].end).toBe('2027-01-24');
	});
	test('exam already past: nothing', () => {
		expect(computeStages(LIST, '2026-11-16', '2026-11-16', '5.5')).toEqual([]);
	});
});

describe('filling', () => {
	const plan = { restDay: 0, dailyMinutes: 120, examDate: '2027-01-25', focus: null };
	const stages = computeStages(LIST, '2026-11-16', '2027-01-25', '5.5');
	const week = fillDays(LIST, plan, stages, [], '2026-11-16', '2026-11-22');
	test('one check-in row for the stage, nothing on the rest day', () => {
		expect(week.filter(t => t.kind === 'checkin')).toHaveLength(1);
		expect(week.filter(t => t.date === '2026-11-22')).toHaveLength(0);
	});
	test('rotate takes turns; the essay goes on the last study day', () => {
		const vocab = week.filter(t => t.itemId === 'B1').map(t => t.ref);
		expect(vocab.slice(0, 4)).toEqual(['5.1', '5.2', '5.3', '5.1']);
		expect(week.filter(t => t.itemId === 'W1').map(t => t.date)).toEqual(['2026-11-21']);
	});
	test('never over the day\'s minutes or 5 things', () => {
		for (const d of ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21']) {
			const day = week.filter(t => t.kind === 'task' && t.date === d);
			expect(day.length).toBeLessThanOrEqual(5);
			expect(day.reduce((n, t) => n + t.minutes, 0) + 15).toBeLessThanOrEqual(plan.dailyMinutes);
		}
	});
	test('filling again adds no second check-in', () => {
		const rows = week.map((t, i) => task({ ...t, id: `r${i}`, origDate: t.date }));
		expect(fillDays(LIST, plan, stages, rows, '2026-11-23', '2026-11-29').filter(t => t.kind === 'checkin')).toHaveLength(0);
	});
	test('a task longer than a day gets that day alone', () => {
		const s2 = [{ no: 2, name: '强化', goal: '', start: '2026-11-16', end: '2026-11-29' }];
		const out = fillDays(LIST, plan, s2, [], '2026-11-16', '2026-11-22');
		expect(out.filter(t => t.itemId === 'R1')).toHaveLength(1);
	});
});

describe('every day', () => {
	const c = { restDay: 0, dailyMinutes: 60, lastDay: '2026-12-05' };
	test('day problems', () => {
		expect(dayProblem(c, [], '2026-11-15', '2026-11-16', 20, 'task')).toContain('过去');
		expect(dayProblem(c, [], '2026-11-22', '2026-11-16', 20, 'task')).toContain('休息日');
		expect(dayProblem(c, [], '2026-12-06', '2026-11-16', 20, 'task')).toContain('考试日');
		expect(dayProblem(c, [task({ minutes: 50 })], '2026-11-16', '2026-11-16', 20, 'task')).toContain('超出');
		expect(dayProblem(c, [...Array(5).keys()].map(i => task({ id: `t${i}`, minutes: 1 })), '2026-11-16', '2026-11-16', 1, 'task')).toContain('5 件');
		expect(dayProblem(c, [], '2026-11-16', '2026-11-16', 20, 'task')).toBeNull();
	});
	test('day problems in English for an English interface (界面语言第②批)', () => {
		expect(dayProblem(c, [], '2026-11-15', '2026-11-16', 20, 'task', undefined, 'en')).toBe('You cannot plan for a day that has passed');
		expect(dayProblem(c, [], '2026-11-22', '2026-11-16', 20, 'task', undefined, 'en')).toBe('Sun is your rest day');
		expect(dayProblem(c, [], '2026-12-06', '2026-11-16', 20, 'task', undefined, 'en')).toBe('Sun, Dec 6 is after the exam');
		expect(dayProblem(c, [task({ minutes: 50 })], '2026-11-16', '2026-11-16', 20, 'task', undefined, 'en')).toBe('That day would come to 70 minutes, more than your 60 a day');
		expect(dayProblem(c, [...Array(5).keys()].map(i => task({ id: `t${i}`, minutes: 1 })), '2026-11-16', '2026-11-16', 1, 'task', undefined, 'en')).toBe('Mon, Nov 16 already has 5 tasks');
	});
	test('the plan\'s own words: Chinese as before, English with no Chinese in it', () => {
		const zh = planText('zh');
		const en = planText('en');
		expect(zh.date('2026-11-20')).toBe('11 月 20 日（周五）');
		expect(en.date('2026-11-20')).toBe('Fri, Nov 20');
		expect(en.date('2026-01-04')).toBe('Sun, Jan 4');
		expect(zh.reason.alreadyUndone).toBe('这次改动已经撤销过了');
		expect(en.reason.missing(['examDate', 'dailyMinutes'])).toBe('Still missing: examDate, dailyMinutes. All four are needed to make a plan');
		expect(en.summary.week('Mon, Nov 16', 1)).toBe('Planned the week from Mon, Nov 16: 1 task');
		expect(en.summary.replan(3, '')).toBe('Replanned 3 tasks from today');
		expect(en.summary.status('removed', 'Read', true)).toBe('Removed check-in: Read');
		const han = /[\u3400-\u9fff]/;
		const leaves = (o: object): string[] => Object.values(o).flatMap(v => typeof v === 'string' ? [v]
			: typeof v === 'function' ? [String((v as (...a: unknown[]) => unknown)('2026-11-20', 2, 3))]
			: typeof v === 'object' && v != null ? leaves(v) : []);
		const enWords = leaves({ reason: { ...en.reason, missing: en.reason.missing(['examDate']) }, summary: { ...en.summary, full: en.summary.full([{ name: 'Base', start: 'Mon, Nov 16' }], 'exam') } });
		expect(enWords.length).toBeGreaterThan(40);
		expect(enWords.filter(w => han.test(w))).toEqual([]);
		expect(Object.keys(en.reason).sort()).toEqual(Object.keys(zh.reason).sort());
		expect(Object.keys(en.summary).sort()).toEqual(Object.keys(zh.summary).sort());
	});
	test('rollover moves unfinished tasks to today, past the rest day', () => {
		const ts = [task({ id: 'a', date: '2026-11-13' }), task({ id: 'b', date: '2026-11-13', status: 'done' })];
		expect(rollover(ts, '2026-11-14', 0)).toEqual([{ id: 'a', date: '2026-11-14' }]);
		expect(rollover(ts, '2026-11-15', 0)).toEqual([{ id: 'a', date: '2026-11-16' }]);
		expect(delayDays(task({ origDate: '2026-11-13', date: '2026-11-16' }), '2026-11-16')).toBe(3);
	});
	test('streak skips the rest day and does not break on today', () => {
		const ci = task({ id: 'c', kind: 'checkin', date: '2026-11-10', endDate: null });
		const done = new Set(['c|2026-11-13', 'c|2026-11-14', 'c|2026-11-16']);
		expect(streak('2026-11-17', '2026-11-10', 0, [ci], done)).toBe(3);
	});
});

describe('ticking by itself', () => {
	const D = '2026-11-16'; // a Monday; rest day Sunday (0)
	const spell = (id: string, origDate: string, need = 20) => task({ id, app: 'dictation', ref: 'spelling', autoDone: { answered: need }, origDate });

	test('refs: real groups, station-like vocab, lists', () => {
		expect(answerRefs('dictation', 'spelling, numbers')).toEqual(['spelling', 'numbers']);
		expect(answerRefs('dictation', 'spelling,nope')).toBeNull();
		expect(answerRefs('vocab', '5.2')).toEqual(['5.2']);
		expect(answerRefs('vocab', 'unit two')).toBeNull();
		expect(answerRefs('vocab', null)).toBeNull();
	});

	test('counts right and wrong; 12 of 20 is not done and says so', () => {
		const r = autoCheck(D, 0, [spell('a', D)], [], { dictation: { total: 12, by: { spelling: 12 } } });
		expect(r.tick).toEqual([]);
		expect(r.progress.a).toEqual({ answered: 12, need: 20 });
	});

	test('two tasks on one group: the older counts first, one answer never counts twice', () => {
		const tasks = [spell('today', D), spell('old', '2026-11-14')];
		expect(autoCheck(D, 0, tasks, [], { dictation: { total: 30, by: { spelling: 30 } } }).tick).toEqual(['old']);
		const r = autoCheck(D, 0, tasks, [], { dictation: { total: 40, by: { spelling: 40 } } });
		expect(r.tick).toEqual(['old', 'today']);
	});

	test('a check-in without ref counts the whole app, and counts on its own next to a task', () => {
		const c = task({ id: 'c', kind: 'checkin', app: 'dictation', ref: null, autoDone: { answered: 10 }, date: '2026-11-01', origDate: '2026-11-01' });
		const r = autoCheck(D, 0, [spell('a', D), c], [], { dictation: { total: 30, by: { spelling: 20, numbers: 10 } } });
		expect(r.tick).toEqual(['a']);
		expect(r.tickCheckins).toEqual(['c']);
		const none = task({ id: 'c2', kind: 'checkin', app: 'vocab', ref: null, autoDone: null, date: '2026-11-01' });
		expect(autoCheck(D, 0, [none], [], { vocab: { total: 1, by: { '5.1': 1 } } }).tickCheckins).toEqual(['c2']);
	});

	test('not what was unticked by hand today, not tomorrow, nothing when the app did not answer', () => {
		const c = task({ id: 'c', kind: 'checkin', app: 'dictation', date: '2026-11-01' });
		const r = autoCheck(D, 0, [spell('a', D), { ...spell('b', D), offDate: D }, { ...spell('t', D), date: addDays(D, 1) }, c],
			[{ taskId: 'c', userId: 'u', date: D, doneAt: null, doneBy: 'off' }], { dictation: { total: 99, by: { spelling: 99 } } });
		expect(r.tick).toEqual(['a']);
		expect(r.tickCheckins).toEqual([]);
		expect(autoCheck(D, 0, [spell('a', D)], [], { dictation: null }).tick).toEqual([]);
	});

	test('no real group: ask, but only when the app has answers today', () => {
		const t = task({ id: 'q', app: 'vocab', ref: null, autoDone: { answered: 20 } });
		expect(autoCheck(D, 0, [t], [], { vocab: { total: 5, by: { '5.1': 5 } } }).asks).toEqual({ vocab: ['q'] });
		expect(autoCheck(D, 0, [t], [], { vocab: { total: 0, by: {} } }).asks).toEqual({});
	});

	test('typing: one task ticks, two ask, the check-in ticks', () => {
		const ty = (id: string) => task({ id, app: 'typing', autoDone: { report: true } });
		const c = task({ id: 'c', kind: 'checkin', app: 'typing', date: '2026-11-01' });
		expect(typingReport(D, 0, [ty('a'), c], [])).toEqual({ tick: ['a'], ask: [], tickCheckins: ['c'] });
		expect(typingReport(D, 0, [ty('a'), ty('b')], [])).toEqual({ tick: [], ask: ['a', 'b'], tickCheckins: [] });
	});
});

describe.skipIf(REAL == null)('the real list', () => {
	test('passes the import check and fills a week', () => {
		expect(planListProblems(REAL)).toEqual([]);
		const stages = computeStages(REAL!, '2026-11-16', '2027-02-27', '5.5');
		const out = fillDays(REAL!, { restDay: 0, dailyMinutes: 120, examDate: '2027-02-27', focus: null }, stages, [], '2026-11-16', '2026-11-22');
		expect(out.filter(t => t.kind === 'task').length).toBeGreaterThan(5);
	});
});
