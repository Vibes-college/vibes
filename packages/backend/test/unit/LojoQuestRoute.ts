/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
	chainOf, gateSkill, keptFromOldMap, oldChapterOpen, oldMapStates, placementBand, routePerfect, routeSnapshot, probeOrder, recycleChains, routeProblems, routeStars, routeView, runPlan, sprintOfGate, sprintStars, stable, tally,
} from '@/misc/lojo-quest-route.js';
import type { MiLojoQuestRoute, QuestRoute, RouteEvent } from '@/misc/lojo-quest-route.js';
import type { MiLojoQuestLevel } from '@/models/LojoQuest.js';
import type { QuestChapter } from '@/misc/lojo-quest-types.js';

// route.json and the chapters live in the Vibes workspace (not in this repository); skipped where they are not.
const CONTENT_DIR = process.env.QUEST_CONTENT_DIR ?? new URL('../../../../../../../courses/english/ielts/quest/', import.meta.url).pathname;
const ROUTE: QuestRoute | null = existsSync(`${CONTENT_DIR}/route.json`) ? JSON.parse(readFileSync(`${CONTENT_DIR}/route.json`, 'utf8')) as QuestRoute : null;
const CHAPTERS: QuestChapter[] | null = existsSync(`${CONTENT_DIR}/ch1.json`)
	? [1, 2, 3, 4].map(n => JSON.parse(readFileSync(`${CONTENT_DIR}/ch${n}.json`, 'utf8')) as QuestChapter)
	: null;
const noRoute = ROUTE == null || CHAPTERS == null;
const R = () => ROUTE as QuestRoute;

const NOW = new Date('2026-11-13T12:00:00Z');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86400000).toISOString();
const two = (n = 2): MiLojoQuestLevel => ({ passedAt: daysAgo(3), stars: n, tries: 2 });
const view = (levels: Record<string, MiLojoQuestLevel>, state: MiLojoQuestRoute = {}, placementStation: string | null = null, ready = true) =>
	routeView({ route: R(), levels, state, placementStation, gateReady: () => ready, now: NOW });
const allStable = (ids: string[]) => Object.fromEntries(ids.map(id => [id, two()]));
const baseIds = () => Object.values(R().stages[0].skills).flat();
const chainLevels = (skill: 'reading' | 'listening') => R().stages[1].skills[skill].chains.flatMap(c => c.stations.filter(s => s.level != null && !s.building).map(s => s.level!));

describe('三段闯关 stars', () => {
	test('★ once, ★★ two passes in a row, ★★★ two perfect runs', () => {
		let rec: MiLojoQuestLevel = {};
		let r = routeStars(rec, { passed: true, perfect: false, retest: false });
		expect(r.stars).toBe(1);
		rec = { ...rec, ...r, passedAt: daysAgo(1) };
		r = routeStars(rec, { passed: true, perfect: true, retest: false });
		expect(r.stars).toBe(2);
		rec = { ...rec, ...r };
		r = routeStars(rec, { passed: true, perfect: true, retest: false });
		expect(r.stars).toBe(3);
	});

	test('a fail between two passes is not ★★', () => {
		let rec: MiLojoQuestLevel = {};
		for (const passed of [true, false, true]) rec = { ...rec, ...routeStars(rec, { passed, perfect: false, retest: false }), ...(passed ? { passedAt: daysAgo(1) } : {}) };
		expect(rec.stars).toBe(1);
		expect(rec.recent).toEqual([false, true]);
	});

	// ★★★ = already ★★ and two perfect runs in total (not in a row; a fail between is fine). 路线图 2026-11-13.
	// Old perfect runs don't count: perfects starts at 0 with the new code. play() feeds results like the service does.
	const play = (rec: MiLojoQuestLevel, runs: ('4/5' | '5/5' | 'fail' | 'retest 3/3')[]) => { // 5/5 / 3/3 here = 一题不错 (4/4, 2/2 under the 11-13 rule)
		for (const r of runs) {
			const how = { passed: r !== 'fail', perfect: r === '5/5' || r === 'retest 3/3', retest: r === 'retest 3/3' };
			rec = { ...rec, ...routeStars(rec, how), ...(how.passed ? { passedAt: daysAgo(1) } : {}) };
		}
		return rec;
	};

	test('★★★ case 1: 4/5, 4/5 = ★★; then 5/5, fail, 5/5 = ★★★', () => {
		let rec = play({}, ['4/5', '4/5']);
		expect(rec.stars).toBe(2);
		rec = play(rec, ['5/5']);
		expect(rec.stars).toBe(2);
		rec = play(rec, ['fail']);
		expect(rec.stars).toBe(2);
		rec = play(rec, ['5/5']);
		expect(rec.perfects).toBe(2);
		expect(rec.stars).toBe(3);
	});

	test('★★★ case 2: 5/5, fail, 5/5 = only ★ (no two passes in a row); the next pass, even 4/5, = ★★★', () => {
		let rec = play({}, ['5/5', 'fail', '5/5']);
		expect(rec.stars).toBe(1);
		expect(rec.perfects).toBe(2);
		rec = play(rec, ['4/5']);
		expect(rec.stars).toBe(3);
	});

	test('★★★ case 3: a retest 3/3 counts as one perfect run', () => {
		let rec = play({}, ['4/5', '4/5', '5/5']);
		expect(rec.stars).toBe(2);
		rec = play(rec, ['fail', 'retest 3/3']);
		expect(rec.perfects).toBe(2);
		expect(rec.stars).toBe(3);
	});

	test('★★★: an old ★★ with old perfect runs starts counting at 0', () => {
		let rec = play({ stars: 2, passedAt: daysAgo(9), tries: 3, best: 5 }, ['5/5']);
		expect(rec.stars).toBe(2);
		rec = play(rec, ['5/5']);
		expect(rec.stars).toBe(3);
	});

	test('stars never drop: an old ★★ from one perfect run stays ★★ after a fail', () => {
		const r = routeStars({ stars: 2, passedAt: daysAgo(9) }, { passed: false, perfect: false, retest: false });
		expect(r.stars).toBe(2);
		expect(stable(r.stars)).toBe(true);
	});

	test('retest 3/3 counts as a perfect pass, 2/3 only relights', () => {
		const base = { stars: 1, passedAt: daysAgo(5), recent: [true], perfects: 1 };
		const full = routeStars(base, { passed: true, perfect: true, retest: true });
		expect(full.stars).toBe(3);
		const half = routeStars(base, { passed: true, perfect: false, retest: true });
		expect(half).toEqual({ stars: 1, recent: [true], perfects: 1 });
	});

	test('a placed level (1 star from the placement test) is not stable until really passed twice', () => {
		const placed = { stars: 1, placed: true, passedAt: daysAgo(2) };
		const r = routeStars(placed, { passed: true, perfect: false, retest: false });
		expect(r.stars).toBe(1);
		const r2 = routeStars({ ...placed, ...r }, { passed: true, perfect: false, retest: false });
		expect(r2.stars).toBe(2);
	});

	test('sprint: pass at 8/10, ★★★ = two runs at 9 or more, never drops', () => {
		let s = sprintStars({}, 7, 10, daysAgo(3));
		expect(s.stars).toBe(0);
		s = sprintStars(s, 8, 10, daysAgo(2));
		expect(s.stars).toBe(1);
		s = sprintStars(s, 9, 10, daysAgo(1));
		expect(s.stars).toBe(2);
		s = sprintStars(s, 10, 10, daysAgo(0));
		expect(s.stars).toBe(3);
		s = sprintStars(s, 2, 10, NOW.toISOString());
		expect(s.stars).toBe(3);
		expect(s.tries).toBe(5);
		expect(s.best).toBe(100);
	});
});

describe('三段闯关 helpers', () => {
	test('probe order: most wrong first, ties keep the default order', () => {
		expect(probeOrder(['R1', 'R2', 'R3', 'R4'], { R3: 2, R2: 2, R4: 1 })).toEqual(['R2', 'R3', 'R4', 'R1']);
		expect(probeOrder(['L1', 'L2'], {})).toEqual(['L1', 'L2']);
	});

	test('placement band: 1.1 = 4.0, +0.5 per station', () => {
		expect(placementBand('1.1')).toBe(4);
		expect(placementBand('1.3')).toBe(5);
		expect(placementBand('1.9')).toBe(8);
		expect(placementBand(null)).toBeNull();
	});

	test('gate skill and tally', () => {
		expect(gateSkill('1.4')).toBe('listening');
		expect(gateSkill('2.7')).toBe('reading');
		expect(tally([{ chain: 'R2', correct: true }, { chain: 'R2', correct: false }, { chain: null, correct: true }])).toEqual({ R2: { right: 1, total: 2 } });
	});
});

describe.skipIf(noRoute)('三段闯关 route.json', () => {
	test('the real route.json passes the import check', () => {
		const levelIds = new Set(CHAPTERS!.flatMap(c => c.nodes.map(n => n.id)));
		const qids = new Set(CHAPTERS!.flatMap(c => c.nodes.flatMap(n => (n.pool ?? []).map(q => q.id))));
		expect(routeProblems(R(), levelIds, qids)).toEqual([]);
		expect(routeProblems({ stages: [] }, levelIds, qids).length).toBeGreaterThan(0);
		expect(routeProblems({ ...R(), hard: { questions: ['nope/x'] } }, levelIds, qids)).toContain('难题 nope/x: 找不到');
	});

	test('a new learner: base line opens one by one, focus closed', () => {
		const v = view({});
		const vocab = v.view.base.skills.find(s => s.skill === 'vocab')!;
		expect(vocab.stations[0].state).toBe('open');
		expect(vocab.stations[1].state).toBe('locked');
		expect(v.view.focus.open).toBe(false);
		expect(v.states['1-4']).toBe('locked');
	});

	test('base station opens the next on ★★ only', () => {
		expect(view({ '1-7': two(1) }).states['1-8']).toBe('locked');
		expect(view({ '1-7': two(2) }).states['1-8']).toBe('open');
	});

	test('focus opens on the 6 base stations at ★★, or placement ≥ 5.0', () => {
		const must = R().stages[0].gateToNext.mustStations;
		expect(view(allStable(must)).view.focus.open).toBe(true);
		expect(view({}, {}, '1.3').view.focus.open).toBe(true);
		expect(view({}, {}, '1.2').view.focus.open).toBe(false);
		const v = view({}, {}, '1.3');
		expect(v.view.focus.byPlacement).toBe(true);
		expect(v.states['1-4']).toBe('open'); // R1-1
		expect(v.states['1-5']).toBe('locked'); // R2-1: R1 not stable yet
	});

	test('one chain at a time per skill; the probe order decides which', () => {
		const must = R().stages[0].gateToNext.mustStations;
		expect(view(allStable(must)).view.focus.skills.reading.active).toBe('R1');
		const v = view(allStable(must), { probe: { reading: { at: daysAgo(1), right: {}, wrong: { R3: 2 }, order: ['R3', 'R1', 'R2', 'R4', 'R5', 'R6'] } } });
		expect(v.view.focus.skills.reading.active).toBe('R3');
		expect(v.states['2-4']).toBe('open'); // R3-1
		expect(v.states['1-4']).toBe('locked'); // R1 waits its turn
	});

	test('a stable chain opens the next one; building stations do not block', () => {
		const must = R().stages[0].gateToNext.mustStations;
		// R2 has R2-5 being built (not required, not counted)
		const r2 = R().stages[1].skills.reading.chains.find(c => c.id === 'R2')!;
		const lv = { ...allStable(must), '1-4': two(), ...allStable(r2.stations.filter(s => s.level && s.required).map(s => s.level!)) };
		const v = view(lv);
		const chain = v.view.focus.skills.reading.chains.find(c => c.id === 'R2')!;
		expect(chain.stable).toBe(true);
		expect(chain.stations.find(s => s.id === 'R2-5')!.state).toBe('building');
		expect(v.view.focus.skills.reading.active).toBe('R3');
	});

	test('target ≥ 7 makes advanced stations required', () => {
		const must = R().stages[0].gateToNext.mustStations;
		const r4 = R().stages[1].skills.reading.chains.find(c => c.id === 'R4')!;
		expect(view(allStable(must), { target: 6.5 }).view.focus.skills.reading.chains.find(c => c.id === 'R4')!.stations.find(s => s.id === 'R4-2')!.required).toBe(false);
		expect(view(allStable(must), { target: 7 }).view.focus.skills.reading.chains.find(c => c.id === 'R4')!.stations.find(s => s.id === 'R4-2')!.required).toBe(true);
		expect(r4.stations.find(s => s.id === 'R4-2')!.tier).toBe('advanced');
	});

	test('never locked again: opened ids, kept old-map levels and levels already tried stay open', () => {
		expect(view({}, { opened: ['stage:focus'] }).view.focus.open).toBe(true);
		expect(view({}, { kept: ['3-4'] }).states['3-4']).toBe('open');
		expect(view({ '2-6': { tries: 1 } }).states['2-6']).toBe('open');
		const first = view({}, {}, '1.3');
		expect(first.newlyOpened).toContain('stage:focus');
		// placement later read lower: still open, because it was opened once
		expect(view({}, { opened: first.newlyOpened }, '1.1').view.focus.open).toBe(true);
	});

	test('old stars kept: an old ★★ level stays done and stable on the route', () => {
		const v = view({ '1-7': { passedAt: daysAgo(30), stars: 2, best: 100, tries: 1 } });
		expect(v.view.base.skills.find(s => s.skill === 'vocab')!.stations[0].stars).toBe(2);
		expect(v.states['1-7']).toBe('done');
		expect(v.states['1-8']).toBe('open');
	});

	// 质量把关 fixtures.json P1 / P2: the 2 prod learners on 2026-11-13 (identity removed). 1-1 to 1-3 passed (★, no ★★),
	// P1 also tried 1-4; on the old map (chapter 1 only) 1-4 and 1-7 are open. On the route none of them may lock again.
	test.skipIf(noRoute)('prod learners: everything open on the old map stays open on the route, stars kept', () => {
		const pass = (at: string, tries: number): MiLojoQuestLevel => ({ best: 4, stars: 1, tries, passedAt: at, lastAt: at, failStreak: 0 });
		const P1: Record<string, MiLojoQuestLevel> = { '1-1': pass('2026-11-11T04:34:11.161Z', 5), '1-2': pass('2026-11-11T04:34:13.660Z', 5), '1-3': pass('2026-11-11T04:34:16.096Z', 5), '1-4': { best: 3, stars: 0, tries: 6 } };
		const P2: Record<string, MiLojoQuestLevel> = { '1-1': pass('2026-11-11T06:04:04.848Z', 1), '1-2': pass('2026-11-11T06:05:56.450Z', 1), '1-3': pass('2026-11-11T06:07:37.141Z', 1) };
		const noPrep = () => ({ guide: false, gear: false, news: false });
		for (const levels of [P1, P2]) {
			const old = oldMapStates(CHAPTERS!, levels, no => no === 1, noPrep);
			const wasOpen = ['1-1', '1-2', '1-3', '1-4', '1-7'];
			// same as prod-baseline.json (现行规则): exactly these levels are open or done
			for (const id of wasOpen) expect(old[id], id).not.toBe('locked');
			for (const id of ['1-5', '1-6', '1-8']) expect(old[id], id).toBe('locked');
			const kept = keptFromOldMap(CHAPTERS!, old);
			expect(kept).toEqual(expect.arrayContaining(wasOpen));
			const v = view(levels, { kept, opened: [] });
			for (const id of wasOpen) expect(v.states[id], id).not.toBe('locked');
			for (const id of ['1-1', '1-2', '1-3']) expect(v.states[id], id).toBe('done');
			// no ★★ anywhere in base, so focus stays closed, and the old ★ are still ★
			expect(v.view.focus.open).toBe(false);
			for (const id of ['1-1', '1-2', '1-3']) expect(levels[id].stars).toBe(1);
		}
	});

	test('sprint opens per skill when its chains are stable; mixed when both are; unready gates show 建设中', () => {
		const lv = allStable([...baseIds(), ...chainLevels('reading')]);
		const v = view(lv);
		expect(v.view.sprint.reading.open).toBe(true);
		expect(v.view.sprint.listening.open).toBe(false);
		expect(v.view.sprint.mixed.open).toBe(false);
		expect(v.view.sprint.reading.stations[0].state).toBe('open'); // SR-1 (4-6)
		const both = view(allStable([...baseIds(), ...chainLevels('reading'), ...chainLevels('listening')]));
		expect(both.view.sprint.mixed.open).toBe(true);
		const notReady = view(lv, {}, null, false);
		expect(notReady.view.sprint.reading.stations.find(s => s.id === 'SR-2')!.state).toBe('building');
		expect(notReady.view.sprint.mock.state).toBe('building');
	});

	test('mock opens when SL-5 and SR-5 have a star; never stars', () => {
		const lv = allStable([...baseIds(), ...chainLevels('reading'), ...chainLevels('listening')]);
		expect(view(lv).view.sprint.mock.state).toBe('locked');
		const v = view(lv, { sprint: { 'SR-5': { stars: 1, passedAt: daysAgo(1) }, 'SL-5': { stars: 1, passedAt: daysAgo(1) } } });
		expect(v.view.sprint.mock.state).toBe('open');
		expect(R().stages[2].mock.stars).toBe(false);
	});

	test('runs: SR-5 is 3 groups (缩短版), SL-5 is 4, the mock is listening then reading on set C', () => {
		const sr5 = runPlan(R(), 'SR-5')!;
		expect(sr5.groups).toHaveLength(3);
		expect(R().stages[2].reading.find(s => s.id === 'SR-5')!.short).toBe(true);
		expect(runPlan(R(), 'SL-5')!.groups).toHaveLength(4);
		const mock = runPlan(R(), 'MOCK')!;
		expect(mock.groups).toHaveLength(7);
		expect(mock.groups[0][0].startsWith('1.')).toBe(true);
		expect(mock.groups[6][0].startsWith('2.')).toBe(true);
		expect(mock.sets).toEqual(['C']);
		expect(sprintOfGate(R(), '2.2', 'A')!.id).toBe('SR-2');
		expect(sprintOfGate(R(), '2.2', 'C')).toBeNull();
	});

	test('chain of a question: by level first, then tags', () => {
		const [lvl, chain] = Object.entries(R().tagToChain.byLevel)[0];
		expect(chainOf(R(), lvl, null, [])).toBe(chain);
		const [tag, tchain] = R().tagToChain.reading[0];
		expect(chainOf(R(), null, 'reading', [tag])).toBe(tchain);
		expect(chainOf(R(), null, 'reading', ['nothing'])).toBeNull();
		// tagToChain.unmapped (paraphrase): a question with only that tag counts for no chain, so never for 回炉
		for (const t of (R().tagToChain as unknown as { unmapped?: string[] }).unmapped ?? []) {
			expect(chainOf(R(), null, 'reading', [t])).toBeNull();
			expect(chainOf(R(), null, 'listening', [t])).toBeNull();
		}
	});

	test('回炉: 3 wrong in 7 days from mixed / sprint / mock, or a whole set below 60%; cleared by passing the first station after', () => {
		const ev = (at: string, right: number, total: number, from: RouteEvent['from'] = 'mixed', full = false): RouteEvent => ({ at, from, chain: 'R2', right, total, full });
		expect(recycleChains(R(), [ev(daysAgo(1), 0, 2)], () => null, NOW)).toEqual([]);
		expect(recycleChains(R(), [ev(daysAgo(1), 0, 2), ev(daysAgo(2), 1, 2, 'sprint')], () => null, NOW)).toEqual(['R2']);
		expect(recycleChains(R(), [ev(daysAgo(9), 0, 5)], () => null, NOW)).toEqual([]);
		expect(recycleChains(R(), [ev(daysAgo(1), 1, 3, 'mock', true)], () => null, NOW)).toEqual(['R2']);
		expect(recycleChains(R(), [ev(daysAgo(2), 0, 5)], () => daysAgo(1), NOW)).toEqual([]);
		const v = view(allStable(R().stages[0].gateToNext.mustStations), { events: [ev(daysAgo(1), 0, 3)] });
		expect(v.view.recycle).toEqual(['R2']);
	});
});

// 拦路 2 (质量把关 2026-11-13): a run ends as soon as enough are right, so 全对 = passed without one wrong (路线图 11-13).
// run() plays answers the way LojoQuestService.answer() ends a run; the result goes through routePerfect and routeStars.
describe('三段闯关 全对 = 一局一题没错', () => {
	const run = (answers: boolean[], need: number, maxWrong: number) => {
		const done: { correct: boolean }[] = [];
		let ended: 'passed' | 'failed' | null = null;
		for (const correct of answers) {
			done.push({ correct });
			const right = done.filter(a => a.correct).length;
			if (right >= need) ended = 'passed';
			else if (done.length - right >= maxWrong) ended = 'failed';
			if (ended) break;
		}
		const passed = ended === 'passed';
		return { passed, perfect: routePerfect(done, passed), answered: done.length };
	};
	const LEVEL = { need: 4, maxWrong: 2 };
	const RETEST = { need: 2, maxWrong: 2 };

	test('a level: 4 right in a row ends the run at 4 and is 全对', () => {
		const r = run([true, true, true, true, true], LEVEL.need, LEVEL.maxWrong);
		expect(r).toEqual({ passed: true, perfect: true, answered: 4 });
	});

	test('a level: one wrong, then over the line = passed, not 全对', () => {
		const r = run([true, false, true, true, true], LEVEL.need, LEVEL.maxWrong);
		expect(r).toEqual({ passed: true, perfect: false, answered: 5 });
	});

	test('a half-right pick counts as a wrong for 全对; a failed run is never 全对', () => {
		expect(routePerfect([{ correct: true }, { correct: false }, { correct: true }, { correct: true }, { correct: true }], true)).toBe(false);
		expect(routePerfect([{ correct: true }], false)).toBe(false);
		expect(routePerfect([], true)).toBe(false);
	});

	test('a retest: 2 right in a row = 全对 (instead of 3/3)', () => {
		expect(run([true, true, true], RETEST.need, RETEST.maxWrong)).toEqual({ passed: true, perfect: true, answered: 2 });
		expect(run([false, true, true], RETEST.need, RETEST.maxWrong)).toEqual({ passed: true, perfect: false, answered: 3 });
	});

	test('after ★★, two clean runs in total (a slip between is fine) = ★★★', () => {
		let rec: MiLojoQuestLevel = {};
		const go = (answers: boolean[], retest = false) => {
			const r = run(answers, retest ? RETEST.need : LEVEL.need, retest ? RETEST.maxWrong : LEVEL.maxWrong);
			rec = { ...rec, ...routeStars(rec, { passed: r.passed, perfect: r.perfect, retest }), ...(r.passed ? { passedAt: daysAgo(1) } : {}) };
			return rec.stars;
		};
		expect(go([true, false, true, true, true])).toBe(1);
		expect(go([true, true, false, true, true])).toBe(2);
		expect(go([true, true, true, true])).toBe(2); // first clean run
		expect(go([true, false, true, true, true])).toBe(2); // a slip in between
		expect(go([true, true, true, true])).toBe(3); // second clean run
		expect(rec.perfects).toBe(2);
		// and a clean retest counts as one of the two
		rec = { stars: 2, passedAt: daysAgo(5), recent: [true, true], perfects: 1 };
		expect(go([true, true], true)).toBe(3);
	});
});

// 拦路 1 (质量把关 2026-11-13): the first route state is worked out with the old map's own unlock, not the route's.
describe.skipIf(noRoute)('三段闯关 旧地图快照', () => {
	const noPrep = () => ({ guide: false, gear: false, news: false });
	const test1 = { live: false, placedCh2: false };
	const prod = { live: true, placedCh2: false };
	const focusLevels = ['1-1', '2-1', '3-1', '4-1']; // L1-1, L3-1, L4-2, L5-2

	test('old chapter unlock: ch1 always; live site never more; ch2 by placement or the ch1 Boss; ch3–4 by the Boss before', () => {
		const open = (levels: Record<string, MiLojoQuestLevel>, o = test1) => [1, 2, 3, 4].map(oldChapterOpen(CHAPTERS!, levels, o));
		expect(open({})).toEqual([true, false, false, false]);
		expect(open({}, { live: false, placedCh2: true })).toEqual([true, true, false, false]);
		expect(open({ boss: { passedAt: daysAgo(1) } })).toEqual([true, true, false, false]);
		expect(open({ 'boss': { passedAt: daysAgo(2) }, '2-boss': { passedAt: daysAgo(1) } })).toEqual([true, true, true, false]);
		expect(open({ boss: { passedAt: daysAgo(1) } }, prod)).toEqual([true, false, false, false]);
	});

	test('a brand-new learner keeps nothing; the focus stations stay locked and cannot be opened by the snapshot', () => {
		for (const o of [test1, prod]) {
			const snap = routeSnapshot(CHAPTERS!, {}, o, noPrep);
			expect(snap).toEqual({ kept: [], opened: [] });
			const v = view({}, snap);
			expect(v.view.focus.open).toBe(false);
			for (const id of focusLevels) expect(v.states[id], id).toBe('locked');
			expect(v.newlyOpened.filter(id => focusLevels.includes(id))).toEqual([]);
		}
	});

	test('prod learners (1-1 to 1-3 passed, 1-4 and 1-7 open): only those stay open, no extra 2-1, 3-1, 4-1', () => {
		const pass = (at: string, tries: number): MiLojoQuestLevel => ({ best: 4, stars: 1, tries, passedAt: at, lastAt: at, failStreak: 0 });
		const P1: Record<string, MiLojoQuestLevel> = { '1-1': pass('2026-11-11T04:34:11.161Z', 5), '1-2': pass('2026-11-11T04:34:13.660Z', 5), '1-3': pass('2026-11-11T04:34:16.096Z', 5), '1-4': { best: 3, stars: 0, tries: 6 } };
		const P2: Record<string, MiLojoQuestLevel> = { '1-1': pass('2026-11-11T06:04:04.848Z', 1), '1-2': pass('2026-11-11T06:05:56.450Z', 1), '1-3': pass('2026-11-11T06:07:37.141Z', 1) };
		for (const o of [prod, test1]) {
			for (const levels of [P1, P2]) {
				const snap = routeSnapshot(CHAPTERS!, levels, o, noPrep);
				expect([...snap.kept].sort()).toEqual(['1-1', '1-2', '1-3', '1-4', '1-7']);
				const v = view(levels, snap);
				for (const id of ['1-4', '1-7']) expect(v.states[id], id).not.toBe('locked');
				for (const id of ['2-1', '3-1', '4-1']) expect(v.states[id], id).toBe('locked');
			}
		}
	});

	test('a test-site learner who beat the ch1 Boss keeps ch2 open as before, but not ch3–4', () => {
		const levels: Record<string, MiLojoQuestLevel> = { '1-1': { passedAt: daysAgo(3), stars: 1 }, 'boss': { passedAt: daysAgo(2), stars: 1 } };
		const kept = routeSnapshot(CHAPTERS!, levels, test1, noPrep).kept;
		expect(kept).toContain('2-1');
		expect(kept).not.toContain('3-1');
		expect(kept).not.toContain('4-1');
		expect(routeSnapshot(CHAPTERS!, levels, prod, noPrep).kept).not.toContain('2-1');
	});
});

// 原地图三章 v2（2026-11-16）：专项关听力线、阅读线都连进 Boss，Boss 要每条线都过完；藏起来的格子没有连线，一直锁着
describe('旧地图 Boss 要连进来的每条线都过完', () => {
	const node = (id: string, kind: QuestChapter['nodes'][number]['kind'], extra: Partial<QuestChapter['nodes'][number]> = {}) => ({ id, kind, ...extra }) as QuestChapter['nodes'][number];
	const ch = {
		no: 2, startId: 's', bossId: 'b',
		nodes: [node('s', 'start'), node('a1', 'level'), node('a2', 'level'), node('r1', 'level'), node('b', 'boss'), node('h', 'level', { hidden: true })],
		edges: [['s', 'a1', 'main'], ['a1', 'a2', 'main'], ['a2', 'b', 'main'], ['a1', 'r1', 'vocab'], ['r1', 'b', 'vocab']],
	} as unknown as QuestChapter;
	const noPrep = () => ({ guide: false, gear: false, news: false });
	const states = (passed: string[]) => oldMapStates([ch], Object.fromEntries(passed.map(id => [id, { passedAt: '2026-11-16T00:00:00Z' }])), () => true, noPrep);

	test('one line done is not enough; both done opens the Boss', () => {
		expect(states(['a1', 'a2']).b).toBe('locked');
		expect(states(['a1', 'r1']).b).toBe('locked');
		expect(states(['a1', 'a2', 'r1']).b).toBe('open');
	});

	test('other levels still open from any one way in; a hidden slot stays locked', () => {
		expect(states(['a1']).r1).toBe('open');
		expect(states(['a1', 'a2', 'r1', 'h']).h).toBe('locked');
	});
});
