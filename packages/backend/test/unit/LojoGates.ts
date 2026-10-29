/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { adultBirthday, gateProfileText, gateProgress, isGateCourse, markSet, normalizeAnswer, overLimit, paperOf, pickSet, placeAt, placedStation, publicGroups, publicPassage, weakTags } from '@/misc/lojo-gates.js';
import type { GateAttemptFact, GateCourse, GateGroup, GatePlacement, GateSet } from '@/misc/lojo-gates.js';

const text = { en: 'Complete the form.', zh: '补全表格。' };
const group = (g: Partial<GateGroup> & Pick<GateGroup, 'type' | 'items'>): GateGroup => ({
	instructions: text, title: null, lines: [], limit: null, image: null, letters: [], options: [], ...g,
});
const item = (n: number | number[], answer: string[], tags: string[], more = {}) => ({
	n: Array.isArray(n) ? n : [n], q: null, options: [], answer, ignoreSpaces: false, limit: null, tags, ...more,
});

// A small paper with every question type.
const set = (station: string, id = 'A', lines = [Number(station[0])]): GateSet => ({
	id: `${station}-${id}`, station, set: id, band: 4, part: 1, pass: 4, total: 6, voices: { N: 'uk-brit' }, rate: 1, lines,
	script: [{ who: 'N', text: 'Hello.', pause: null, answers: [1] }, { who: null, text: null, pause: 30, answers: [] }],
	groups: [
		group({ type: 'form', limit: { words: 1, number: true }, lines: ['Name: (1) ______', 'Phone: (2) ______', 'Price: £(3) ______'], items: [
			item(1, ['Hollins'], ['spelling']),
			item(2, ['01615550199'], ['numbers'], { ignoreSpaces: true }),
			item(3, ['45'], ['numbers']),
		] }),
		group({ type: 'choice', items: [item(4, ['B'], ['choice'], { q: 'Why?', options: ['a', 'b', 'c'] })] }),
		group({ type: 'multi', items: [item([5, 6], ['B', 'D'], ['choice'], { q: 'Which TWO?', options: ['a', 'b', 'c', 'd', 'e'] })] }),
	],
});

const course: GateCourse = {
	id: 'ielts', title: 'IELTS',
	lines: [
		{ n: 1, live: true, name: 'Listening', stations: ['1.1', '1.2', '1.3', '1.4', '1.5'] },
		{ n: 2, live: false, name: 'Reading', stations: ['2.1', '2.2', '2.3', '2.4', '2.5'] },
	],
	interchanges: [['1.4', '2.4']],
	tags: { spelling: { zh: '拼写', en: 'Spelling' }, numbers: { zh: '数字', en: 'Numbers' }, choice: { zh: '选择', en: 'Multiple choice' } },
	sets: [set('1.1'), set('1.1', 'B'), set('1.2'), set('1.3'), set('1.4')],
};

// A placement test for line 1: 3 or more right in the first part leads to the high part.
const stage = (name: string): GateSet => ({ ...set('1.2'), id: `placement-1:${name}`, station: 'placement-1', set: name });
const placement: GatePlacement = {
	line: 1, next: 3,
	place: { high: [[9, '1.5'], [5, '1.4'], [0, '1.3']], low: [[4, '1.2'], [0, '1.1']] },
	stages: { first: stage('first'), high: stage('high'), low: stage('low') },
};
const withPlacement: GateCourse = { ...course, placements: [placement] };

let clock = Date.parse('2026-10-26T08:00:00Z');
const attempt = (station: string, score: number, more: Partial<GateAttemptFact> = {}): GateAttemptFact => {
	clock += 60 * 1000;
	return {
		kind: 'gate', station, setId: `${station}-A`, lines: [Number(station[0])], score, total: 6, passed: score >= 4,
		startedAt: new Date(clock - 30 * 1000), submittedAt: new Date(clock), weak: [], placedAt: null, ...more,
	};
};
const stateOf = (p: ReturnType<typeof gateProgress>, id: string) => p.stations.find(s => s.id === id)?.state;

// A reading paper: a passage with lettered paragraphs, and the types that pick a label.
const paragraph = (label: string, words: string, answers: number[]) => ({ label, heading: null, text: words, image: null, caption: null, answers });
const reading = (): GateSet => ({
	...set('2.1'), id: '2.1-A', time: 10, script: [], voices: {}, total: 5, pass: 4,
	passage: { title: 'Bees', subtitle: null, glossary: [], paragraphs: [paragraph('A', 'Bees use the sun.', [1]), paragraph('B', 'Young bees clean.', [3, 4])] },
	groups: [
		group({ type: 'judge', skill: 'reading', letters: ['TRUE', 'FALSE', 'NOT GIVEN'], items: [item(1, ['TRUE'], ['tfng']), item(2, ['NOT GIVEN'], ['tfng'])] }),
		group({ type: 'match', skill: 'reading', letters: ['i', 'ii', 'iii', 'iv'], options: ['a', 'b', 'c', 'd'], items: [item(3, ['iv'], ['headings'])] }),
		group({ type: 'bank', skill: 'reading', lines: ['Bees (4) ______.'], letters: ['A', 'B', 'C'], options: ['clean', 'sing', 'fly'], items: [item(4, ['A'], ['summary'])] }),
		group({ type: 'match', skill: 'reading', letters: ['A', 'B'], items: [item(5, ['B'], ['matching'])] }),
	],
});

describe('Vibes route map gates', () => {
	test('marks gaps like the real test: case, spaces, a final full stop and full-width input do not matter', () => {
		expect(normalizeAnswer('  HOLLINS. ')).toBe('hollins');
		expect(normalizeAnswer('ｗｅｂｓｉｔｅ')).toBe('website');
		expect(normalizeAnswer('6：30')).toBe('6:30');
		expect(normalizeAnswer('0161 5550 199', true)).toBe('01615550199');
	});

	test('a word limit counts words and numbers the IELTS way', () => {
		const limit = { words: 1, number: true };
		expect(overLimit('website', limit)).toBe(false);
		expect(overLimit('6.30 pm', limit)).toBe(false);
		expect(overLimit('Thursday 6.30', limit)).toBe(false);
		expect(overLimit('the website', limit)).toBe(true);
		expect(overLimit('half past six', limit)).toBe(true);
		expect(overLimit('part-time', { words: 1, number: false })).toBe(false);
	});

	test('marks every question type and says why an answer is wrong', () => {
		const answers = new Map([[1, 'hollins'], [2, '01615 550 199'], [3, '£45'], [4, 'b'], [5, 'D'], [6, 'A']]);
		const { score, items } = markSet(set('1.1'), answers);
		expect(score).toBe(5);
		expect(items.map(i => i.correct)).toEqual([true, true, true, true, true, false]);
		// choose TWO: D is right in either slot; the slot with A is told the missing letter
		expect(items[5]).toMatchObject({ n: 6, given: 'A', expected: 'B', reason: 'wrong' });

		const wrong = markSet(set('1.1'), new Map([[1, 'the Hollins'], [3, '54'], [5, 'B'], [6, 'B']]));
		expect(wrong.items.find(i => i.n === 1)?.reason).toBe('word-limit');
		expect(wrong.items.find(i => i.n === 2)?.reason).toBe('blank');
		expect(wrong.items.find(i => i.n === 3)?.reason).toBe('wrong');
		// the same letter twice scores once
		expect(wrong.items.filter(i => i.n >= 5 && i.correct)).toHaveLength(1);
		expect(weakTags(wrong.items)[0]).toEqual({ tag: 'numbers', count: 2 });
	});

	test('the paper sent to the browser has no answers or tags', () => {
		const groups = publicGroups(set('1.1'), name => name);
		const json = JSON.stringify(groups);
		expect(json).not.toContain('Hollins');
		expect(json).not.toContain('tags');
		expect(groups[2].items[0].choose).toBe(2);
	});

	test('marks reading picks against their own labels, in any case', () => {
		const { score, items } = markSet(reading(), new Map([[1, 'TRUE'], [2, 'false'], [3, 'IV'], [4, 'a'], [5, 'B']]));
		expect(score).toBe(4);
		expect(items.find(i => i.n === 2)).toMatchObject({ correct: false, given: 'FALSE', expected: 'NOT GIVEN' });
		// a roman numeral comes back as the list writes it
		expect(items.find(i => i.n === 3)).toMatchObject({ correct: true, given: 'iv' });
		expect(items.find(i => i.n === 4)?.given).toBe('A');
	});

	test('the passage sent to the browser does not say where the answers are', () => {
		const p = publicPassage(reading());
		expect(p?.paragraphs.map(x => x.answers)).toEqual([[], []]);
		expect(p?.paragraphs[0].text).toBe('Bees use the sun.');
		expect(publicPassage(set('1.1'))).toBeNull();
		expect(publicGroups(reading(), n => n).map(g => g.skill)).toEqual(['reading', 'reading', 'reading', 'reading']);
		// sets imported before reading have no skill: listening
		expect(publicGroups(set('1.1'), n => n)[0].skill).toBe('listening');
		expect(gateProgress({ ...course, sets: [...course.sets, reading()] }, []).stations.find(s => s.id === '2.1')?.time).toBe(10);
	});

	test('a new learner can take the first gate; the rest wait, and lines without sets are coming soon', () => {
		const p = gateProgress(course, []);
		expect(['1.1', '1.2', '1.3', '1.4', '1.5'].map(id => stateOf(p, id))).toEqual(['open', 'locked', 'locked', 'locked', 'soon']);
		expect(stateOf(p, '2.1')).toBe('soon');
		expect(p.lines[0].current).toBe('1.1');
	});

	test('passing a later gate lights up the ones before it; failing keeps a streak', () => {
		const p = gateProgress(course, [attempt('1.1', 2), attempt('1.1', 3), attempt('1.3', 5)]);
		expect(['1.1', '1.2', '1.3', '1.4'].map(id => stateOf(p, id))).toEqual(['passed', 'passed', 'passed', 'open']);
		expect(p.stations.find(s => s.id === '1.1')).toMatchObject({ via: 'higher', attempts: 2, best: 3, failStreak: 2 });
		expect(p.last?.station).toBe('1.3');
		const again = gateProgress(course, [attempt('1.2', 1), attempt('1.2', 1), attempt('1.2', 2)]);
		expect(again.stations.find(s => s.id === '1.2')?.failStreak).toBe(3);
	});

	test('an interchange set for one subject only counts for that line', () => {
		const p = gateProgress(course, [attempt('1.4', 6)]);
		expect(stateOf(p, '1.4')).toBe('passed');
		expect(stateOf(p, '2.4')).toBe('soon');
		expect(p.stations.find(s => s.id === '2.4')?.attempts).toBe(0);
	});

	test('gives a set the learner has not heard, then the one heard longest ago', () => {
		const sets = [set('1.1'), set('1.1', 'B'), set('1.1', 'C')];
		const at = (m: number) => new Date(Date.UTC(2026, 9, 26, 8, m));
		expect(pickSet(sets, [])?.id).toBe('1.1-A');
		expect(pickSet(sets, [{ setId: '1.1-A', startedAt: at(1) }])?.id).toBe('1.1-B');
		expect(pickSet(sets, [{ setId: '1.1-A', startedAt: at(3) }, { setId: '1.1-B', startedAt: at(1) }, { setId: '1.1-C', startedAt: at(2) }])?.id).toBe('1.1-B');
	});

	test('tells the tutor where the learner is and what they keep missing', () => {
		const weak = [{ tag: 'numbers', count: 2 }];
		const textOut = gateProfileText(course, [attempt('1.1', 5), attempt('1.2', 3, { weak })]);
		expect(textOut).toContain('Listening: passed up to the 4.0 gate (1.1)');
		expect(textOut).toContain('next gate 1.2');
		expect(textOut).toContain('often missed: Numbers ×2');
		expect(gateProfileText(course, [])).toBeNull();
	});

	test('a placement test starts the learner at a station and lights the ones before it', () => {
		expect(placeAt(placement, 'high', 10)).toBe('1.5');
		expect(placeAt(placement, 'high', 6)).toBe('1.4');
		expect(placeAt(placement, 'low', 1)).toBe('1.1');
		// 1.5 has no sets yet: the learner starts at 1.4 instead
		expect(placedStation(withPlacement, placement, 'high', 10)).toBe('1.4');
		expect(placedStation(withPlacement, placement, 'low', 4)).toBe('1.2');
		expect(paperOf(withPlacement, 'placement-1:low')?.set).toBe('low');
		const placed = attempt('placement-1', 4, { kind: 'placement', setId: 'placement-1:high', lines: [1], passed: null, placedAt: '1.4' });
		const p = gateProgress(withPlacement, [attempt('placement-1', 4, { kind: 'placement', setId: 'placement-1:first', lines: [1], passed: null }), placed]);
		expect(['1.1', '1.2', '1.3', '1.4'].map(id => stateOf(p, id))).toEqual(['passed', 'passed', 'passed', 'open']);
		expect(p.stations.find(s => s.id === '1.2')?.via).toBe('placement');
		expect(p.lines[0].placement).toMatchObject({ available: true, station: '1.4' });
		expect(p.lines[1].placement.available).toBe(false);
		expect(p.last?.station).toBe('1.4');
		// taking it again and doing worse turns nothing off
		const lower = attempt('placement-1', 1, { kind: 'placement', setId: 'placement-1:low', lines: [1], passed: null, placedAt: '1.2' });
		const again = gateProgress(withPlacement, [placed, lower]);
		expect(['1.3', '1.4'].map(id => stateOf(again, id))).toEqual(['passed', 'open']);
		expect(again.lines[0].placement.station).toBe('1.4');
		// a first part alone places nobody
		expect(gateProgress(withPlacement, [attempt('placement-1', 2, { kind: 'placement', lines: [1], passed: null })]).last).toBeNull();
		expect(gateProfileText(withPlacement, [placed])).toContain('placement test on');
	});

	test('accepts only well-formed imports', () => {
		expect(isGateCourse(withPlacement)).toBe(true);
		expect(isGateCourse({ ...withPlacement, placements: [{ ...placement, place: { high: [] } }] })).toBe(false);
		expect(isGateCourse(course)).toBe(true);
		expect(isGateCourse({ ...course, sets: [reading()] })).toBe(true);
		expect(isGateCourse({ ...course, sets: [{ ...reading(), passage: { title: 'Bees', subtitle: null, glossary: [], paragraphs: [] } }] })).toBe(false);
		expect(isGateCourse({ ...course, sets: [{ ...reading(), groups: [{ ...reading().groups[0], skill: 'speaking' }] }] })).toBe(false);
		expect(isGateCourse({ ...course, sets: [{ ...set('1.1'), groups: [] }] })).toBe(false);
		expect(isGateCourse({ id: 'ielts' })).toBe(false);
	});

	test('同路人 leave out profiles under 18: the cutoff birthday', () => {
		expect(adultBirthday(new Date('2026-10-28T09:00:00Z'))).toBe('2008-10-28');
		// born on 2008-10-28 is 18 that day; a day later is not
		expect('2008-10-28' <= adultBirthday(new Date('2026-10-28T00:00:00Z'))).toBe(true);
		expect('2008-10-29' <= adultBirthday(new Date('2026-10-28T23:59:59Z'))).toBe(false);
		// born on 29 February 2008: not yet 18 on 28 February 2026, 18 on 1 March
		expect('2008-02-29' <= adultBirthday(new Date('2026-02-28T12:00:00Z'))).toBe(false);
		expect('2008-02-29' <= adultBirthday(new Date('2026-03-01T12:00:00Z'))).toBe(true);
	});
});
