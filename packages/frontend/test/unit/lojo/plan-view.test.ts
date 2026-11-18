/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import {
	about, addDays, appHref, appName, dayDiff, lineColor, planAsk, planMoveOptions, planOverCount, planStageLists, ringClass,
	vibiAll, vibiToday, vibiWeek,
} from '@/lojo/plan/planView.js';
import type { PCheckin, PDay, PShow, PStage, PTask } from '@/lojo/plan/planView.js';
import { planAppNames, planStrings as S } from '@/lojo/plan/strings.js';
import { rosterApps, setMiniApps } from '@/lojo/miniapps/roster.js';

const TODAY = '2026-11-18'; // a Wednesday
const task = (id: string, o: Partial<PTask> = {}): PTask => ({
	id, title: `Task ${id}`, kind: 'task', stage: 1, date: TODAY, origDate: TODAY, minutes: 20, app: null, appName: null, ref: null,
	status: 'todo', doneBy: null, by: 'plan', pinned: false, delayDays: 0, asked: false, long: false, ...o,
});
const checkin = (id: string, o: Partial<PCheckin> = {}): PCheckin => ({ id, title: `Check ${id}`, app: null, appName: null, ref: null, minutes: 10, done: false, doneBy: null, ...o });
const day = (date: string, tasks: PTask[], o: Partial<PDay> = {}): PDay => ({
	date, rest: false, past: false, total: tasks.length, done: tasks.filter(t => t.status === 'done').length,
	minutes: tasks.reduce((n, t) => n + t.minutes, 0), tasks, checkins: [], ...o,
});
const stage = (o: Partial<PStage> = {}): PStage => ({ no: 1, name: 'Base', goal: '', start: '2026-11-10', end: '2026-11-30', done: 2, total: 20, ...o });
const show = (o: Partial<PShow> = {}, plan: Partial<NonNullable<PShow['plan']>> = {}): PShow => ({
	plan: { examDate: '2026-12-31', examTentative: false, dailyMinutes: 60, restDay: 0, tz: 'Asia/Shanghai', notifyWeekly: true, stages: [stage()], ...plan },
	today: TODAY, daysToExam: 43, stageNow: 1, diagnostic: false, streak: 0, weekStart: '2026-11-16', days: [], todayView: null, board: null, ...o,
});
const hooks = () => ({ move: vi.fn(), talk: vi.fn(), dismiss: vi.fn() });

describe('dates, colors and mini apps', () => {
	test('days between two dates, and adding days, across a month and a year', () => {
		expect(dayDiff('2026-11-18', '2026-11-10')).toBe(8);
		expect(dayDiff('2026-11-10', '2026-11-18')).toBe(-8);
		expect(dayDiff('2027-01-02', '2026-12-30')).toBe(3);
		expect(addDays('2026-11-28', 6)).toBe('2026-12-04');
		expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
		expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
	});

	test('stage colors and the week circles', () => {
		expect(lineColor(0)).toBe('var(--ink)');
		expect(lineColor(3)).toBe('var(--l3)');
		expect(ringClass(day(TODAY, [task('a')], { rest: true }))).toBe('rest');
		expect(ringClass(day(TODAY, []))).toBe('none');
		expect(ringClass(day(TODAY, [task('a', { status: 'done' })]))).toBe('full');
		expect(ringClass(day(TODAY, [task('a', { status: 'done' }), task('b')]))).toBe('part');
		expect(ringClass(day(TODAY, [task('a')]))).toBe('zero');
	});

	test('mini app names and where they open', () => {
		expect(appName('dictation')).toBe(planAppNames.dictation);
		expect(appName('zzz')).toBe('zzz');
		expect(appName(null)).toBe('');
		// before the 小程序 roster is read, an app opens at its home
		expect(appHref('vocab', null)).toBe('/apps/vocab/');
		setMiniApps(rosterApps({ apps: [{ id: 'vocab', name: '示例', icon: 'ti ti-vocabulary', href: '/apps/vocab/5.1', intro: { summary: '示例', audience: '示例', steps: ['示例'], caveats: [] } }] })!);
		expect(appHref('vocab', 'a b/c')).toBe('/apps/vocab/a%20b%2Fc');
		expect(appHref('vocab', null)).toBe('/apps/vocab/5.1');
		expect(appHref('dictation', 'x')).toBe('/apps/dictation/');
		expect(appHref('zzz', null)).toBe('/apps/zzz/');
	});

	test('「大概」 minutes: as they are up to 10, then to the nearest 5', () => {
		expect([3, 10, 12, 13, 22, 23, 105].map(about)).toEqual([3, 10, 10, 15, 20, 25, 105]);
	});
});

describe('the today list', () => {
	test('「勾上这件吗？」 asks about the first task not done and not turned down', () => {
		const today = day(TODAY, [task('t1', { status: 'done' }), task('t2'), task('t3')]);
		const asks = [{ app: 'dictation', appName: 'x', taskIds: ['t1', 't2'] }, { app: 'vocab', appName: 'y', taskIds: ['t3'] }];
		expect(planAsk(today, asks, () => false)).toEqual({ app: 'dictation', task: today.tasks[1] });
		expect(planAsk(today, asks, id => id === 't2')).toEqual({ app: 'vocab', task: today.tasks[2] });
		expect(planAsk(today, asks, () => true)).toBeNull();
		expect(planAsk(today, [{ app: 'x', appName: 'x', taskIds: ['gone'] }], () => false)).toBeNull();
	});

	test('「今天多了 N 件」 counts open tasks from the end until today fits, always leaving one', () => {
		const d = day(TODAY, [task('a', { minutes: 30 }), task('b', { minutes: 30 }), task('c', { minutes: 30, status: 'done' }), task('d', { minutes: 30 })]);
		expect(planOverCount(d, { dailyMinutes: 90 })).toBe(1);
		expect(planOverCount(d, { dailyMinutes: 60 })).toBe(2);
		expect(planOverCount(d, { dailyMinutes: 1 })).toBe(2);
		expect(planOverCount(d, { dailyMinutes: 120 })).toBe(0);
	});

	test('each stage: next by date (5, then 「还有」), done the last 3', () => {
		const todo = [...Array(6).keys()].map(i => task(`t${i}`, { date: addDays('2026-11-20', 5 - i) }));
		const b = { todo: [...todo, task('x', { stage: 2 })], doing: [task('d', { date: '2026-11-30' })], done: [...Array(4).keys()].map(i => task(`o${i}`, { status: 'done' })) };
		const lists = planStageLists(b, [stage(), stage({ no: 2 }), stage({ no: 3 })]);
		expect(lists[1].next.map(t => t.id)).toEqual(['t5', 't4', 't3', 't2', 't1']);
		expect(lists[1].more).toBe(2);
		expect(lists[1].done.map(t => t.id)).toEqual(['o0', 'o1', 'o2']);
		expect(lists[2]).toEqual({ next: [b.todo[6]], more: 0, done: [] });
		expect(lists[3]).toEqual({ next: [], more: 0, done: [] });
	});
});

describe('挪到哪天', () => {
	test('the next 7 days: rest day, full days and the exam day can\'t be picked; unknown days can', () => {
		const t = task('m', { minutes: 20 });
		const days = [
			day(TODAY, [t, task('a', { minutes: 30 })]), // the task itself is not counted twice
			day('2026-11-19', [...Array(5).keys()].map(i => task(`f${i}`, { minutes: 5 }))), // 5 other tasks
			day('2026-11-20', [task('g', { minutes: 45 })]), // 45 + 20 > 60
			day('2026-11-21', [task('h', { minutes: 40 })]), // 40 + 20 fits
		];
		const opts = planMoveOptions(show({ days }, { examDate: '2026-11-24' }), t, [day('2026-11-23', [])]);
		expect(opts.map(o => o.date)).toEqual(['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24']);
		expect(opts.map(o => [o.rest, o.full, o.ok])).toEqual([
			[false, false, true],
			[false, true, false],
			[false, true, false],
			[false, false, true],
			[true, false, false], // Sunday, the rest day
			[false, false, true],
			[false, true, false], // the exam day
		]);
	});
});

describe('what Vibi says', () => {
	test('today: nothing when the day is all done or missing; the rest day', () => {
		const d = show();
		expect(vibiToday(d, null, false, hooks())).toBeNull();
		expect(vibiToday(d, day(TODAY, [task('a')]), true, hooks())).toBeNull();
		expect(vibiToday(d, day(TODAY, [task('a')], { rest: true }), false, hooks())).toEqual({ id: `rest:${TODAY}`, text: S.vibiRest, chips: [] });
	});

	test('today: a task dragged on to a third day, with three chips', () => {
		const on = hooks();
		const late = task('l', { delayDays: 3 });
		const say = vibiToday(show(), day(TODAY, [task('a', { delayDays: 2 }), late]), false, on)!;
		expect(say.id).toBe(`late:l:${TODAY}`);
		expect(say.text).toBe(S.vibiLate(late.title, 3));
		expect(say.strong).toBe(S.vibiLateAsk);
		expect(say.chips.map(c => [c.label, c.main ?? false])).toEqual([[S.vibiMove, true], [S.vibiOtherWay, false], [S.vibiNo, false]]);
		say.chips.forEach(c => c.action?.());
		expect(on.move).toHaveBeenCalledWith(late);
		expect(on.talk).toHaveBeenCalledWith(S.vibiOtherWayPrefill(late.title));
		expect(on.dismiss).toHaveBeenCalledWith(say.id);
		expect(vibiToday(show(), day(TODAY, [task('a', { delayDays: 1 })]), false, on)?.id).toBe(`start:${TODAY}`);
	});

	test('today: tasks done but check-ins left; nothing planned; only check-ins', () => {
		const left = day(TODAY, [task('a', { status: 'done' })], { checkins: [checkin('c1', { app: 'dictation', appName: 'x' }), checkin('c2'), checkin('c3', { done: true })] });
		expect(vibiToday(show(), left, false, hooks())).toEqual({ id: `ci:${TODAY}`, text: S.vibiTasksDone, strong: S.vibiCheckinsLeft([planAppNames.dictation, 'Check c2']), chips: [] });
		expect(vibiToday(show(), day(TODAY, []), false, hooks())).toEqual({ id: `none:${TODAY}`, text: S.vibiNothing, chips: [] });
		expect(vibiToday(show(), day(TODAY, [], { checkins: [checkin('c1')] }), false, hooks())).toBeNull();
	});

	test('today: what was ticked by itself, how many are done, or where to start', () => {
		const auto = day(TODAY, [task('a', { status: 'done', doneBy: 'auto', app: 'vocab' }), task('b', { status: 'done', doneBy: 'vibi' }), task('c', { minutes: 12 })]);
		expect(vibiToday(show(), auto, false, hooks())).toEqual({ id: 'auto:b', text: S.vibiAuto('Task b'), strong: S.vibiLeft(1, 10), chips: [] });
		const some = day(TODAY, [task('a', { status: 'done', doneBy: 'self' }), task('b', { minutes: 13 }), task('c', { minutes: 14 })]);
		expect(vibiToday(show(), some, false, hooks())).toEqual({ id: `some:${TODAY}`, text: S.vibiDoneSome(1), strong: S.vibiLeft(2, 25), chips: [] });
		const start = vibiToday(show(), day(TODAY, [task('a', { app: 'vocab', ref: '5.2' }), task('b')]), false, hooks())!;
		expect(start).toEqual({ id: `start:${TODAY}`, text: S.vibiStart(2, 40), strong: S.vibiStartWith('Task a'), chips: [{ label: S.vibiGo(planAppNames.vocab), main: true, href: '/apps/vocab/5.2' }] });
		expect(vibiToday(show(), day(TODAY, [task('a'), task('b', { app: 'vocab' })]), false, hooks())?.chips).toEqual([]);
	});

	test('this week: the rest day, with a chip to change it', () => {
		const on = hooks();
		expect(vibiWeek(show({ plan: null }), on)).toBeNull();
		const say = vibiWeek(show({}, { restDay: 3, notifyWeekly: false }), on)!;
		expect(say).toMatchObject({ id: 'week:2026-11-16', text: S.vibiWeek(false), strong: S.vibiRestDay(S.restDayName(3)) });
		say.chips.forEach(c => c.action?.());
		expect(on.talk).toHaveBeenCalledWith(S.vibiChangeRestPrefill);
		expect(on.dismiss).toHaveBeenCalledWith('week:2026-11-16');
	});

	test('the whole plan: behind only past 3 days in and more than a bit behind', () => {
		expect(vibiAll(show(), null)).toBeNull();
		expect(vibiAll(show(), stage({ total: 0 }))).toBeNull();
		// 8 of 21 days gone (38%), 2 of 20 done (10% + 15% < 38%)
		expect(vibiAll(show(), stage())).toEqual({ id: `behind:1:${TODAY}`, text: S.vibiBehind(S.stage('Base')), strong: S.vibiBehindAsk, chips: [] });
		expect(vibiAll(show(), stage({ done: 5 }))?.id).toBe(`on:1:${TODAY}`);
		expect(vibiAll(show(), stage({ done: 0, start: '2026-11-16' }))).toEqual({ id: `on:1:${TODAY}`, text: S.vibiOnTrack(S.stage('Base'), 0, 20), strong: S.vibiOnTrackTail, chips: [] });
	});
});
