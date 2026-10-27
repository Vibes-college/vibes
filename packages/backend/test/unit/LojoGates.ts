/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { gateProfileText, gateProgress, isGateCourse, markSet, normalizeAnswer, overLimit, pickSet, publicGroups, weakTags } from '@/misc/lojo-gates.js';
import type { GateAttemptFact, GateCourse, GateGroup, GateSet } from '@/misc/lojo-gates.js';

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

let clock = Date.parse('2026-10-26T08:00:00Z');
const attempt = (station: string, score: number, more: Partial<GateAttemptFact> = {}): GateAttemptFact => {
	clock += 60 * 1000;
	return {
		station, setId: `${station}-A`, lines: [Number(station[0])], score, total: 6, passed: score >= 4,
		startedAt: new Date(clock - 30 * 1000), submittedAt: new Date(clock), weak: [], ...more,
	};
};
const stateOf = (p: ReturnType<typeof gateProgress>, id: string) => p.stations.find(s => s.id === id)?.state;

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

	test('accepts only well-formed imports', () => {
		expect(isGateCourse(course)).toBe(true);
		expect(isGateCourse({ ...course, sets: [{ ...set('1.1'), groups: [] }] })).toBe(false);
		expect(isGateCourse({ id: 'ielts' })).toBe(false);
	});
});
