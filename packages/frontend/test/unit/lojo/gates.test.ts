/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	answersPayload,
	blankCount,
	clockText,
	durationParts,
	findStation,
	formBlocks,
	letterText,
	paperParts,
	paragraphBlocks,
	parseSegments,
	pickLetters,
	placementLine,
	questionRefs,
	readingTimeLeft,
	recommendCards,
	secondsLeft,
} from '@/lojo/gates/player.js';
import type { GateGroup } from '@/lojo/gates/player.js';

const text = { en: 'Complete the form.', zh: '补全表格。' };
const group = (g: Partial<GateGroup> & Pick<GateGroup, 'type' | 'items'>): GateGroup => ({
	skill: 'listening', instructions: text, title: null, lines: [], limit: null, image: null, letters: [], options: [], ...g,
});
const item = (n: number[], more: Partial<GateGroup['items'][number]> = {}) => ({ n, q: null, options: [], choose: 1, limit: null, ...more });

const form = group({
	type: 'form', limit: { words: 1, number: true },
	lines: ['Surname: (1) ______', 'Day | Class | Time', 'Monday | Yoga | (2) ______'],
	items: [item([1]), item([2])],
});
const multi = group({ type: 'multi', items: [item([3, 4], { q: 'Which TWO?', options: ['a', 'b', 'c', 'd', 'e'], choose: 2 })] });
const match = group({ type: 'match', options: ['too long', 'well run', 'too dear'], items: [item([5], { q: 'Speaker 1' })] });

describe('Vibes gate player', () => {
	test('turns "(n) ______" into gaps, and lines with " | " into a table with a header', () => {
		expect(parseSegments('Address: 14 (3) ______ Road')).toEqual([
			{ type: 'text', text: 'Address: 14 ' }, { type: 'gap', n: 3 }, { type: 'text', text: ' Road' },
		]);
		const blocks = formBlocks(form.lines);
		expect(blocks[0].kind).toBe('line');
		expect(blocks[1]).toMatchObject({ kind: 'table', head: [[{ type: 'text', text: 'Day' }], [{ type: 'text', text: 'Class' }], [{ type: 'text', text: 'Time' }]] });
	});

	test('sends one answer per question number, with a multi item\'s letters in order and blanks as \'\'', () => {
		const payload = answersPayload([form, multi, match], { 1: ' Hollins ', 3: ['D', 'B'], 5: 'C' });
		expect(payload).toEqual([
			{ n: 1, value: 'Hollins' }, { n: 2, value: '' }, { n: 3, value: 'B' }, { n: 4, value: 'D' }, { n: 5, value: 'C' },
		]);
		expect(blankCount(payload)).toBe(1);
	});

	test('counts down the reading time inside a pause only', () => {
		const pauses = [{ at: 10.1, length: 30 }];
		expect(readingTimeLeft(pauses, 5)).toBeNull();
		expect(readingTimeLeft(pauses, 10.1)).toBe(30);
		expect(readingTimeLeft(pauses, 39.9)).toBe(1);
		expect(readingTimeLeft(pauses, 40.2)).toBeNull();
	});

	test('reads letters with their words', () => {
		expect(pickLetters(match)).toEqual(['A', 'B', 'C']);
		expect(letterText(match, null, 'b')).toBe('well run');
		expect(letterText(multi, multi.items[0], 'E')).toBe('e');
		expect(questionRefs([form]).get(2)?.prompt).toBe('Monday · Yoga · ____');
	});

	test('recommends only what exists for the most-missed tags', () => {
		const practice = { spelling: { guide: null, app: null, topics: ['雅思听力'] }, map: { guide: null, app: null, topics: [] } };
		const cards = recommendCards([{ tag: 'map', count: 3 }, { tag: 'spelling', count: 2 }, { tag: 'numbers', count: 1 }], practice);
		expect(cards.map(c => c.tag)).toEqual(['spelling']);
	});

	test('formats the time used', () => {
		expect(durationParts(372_400)).toEqual({ h: 0, m: 6, s: 12 });
		expect(durationParts(Number.NaN)).toEqual({ h: 0, m: 0, s: 0 });
	});

	test('finds a station, and tests an interchange on its open line', () => {
		const line = (n: number, live: boolean, ids: string[]) => ({ n, id: `l${n}`, zh: `线${n}`, en: `Line ${n}`, live, stations: ids.map((id, i) => ({ id, band: 4 + i / 2 })) });
		const pack = {
			LINES: [line(1, true, ['1.1', '1.2', '1.3', '1.4']), line(2, false, ['2.1', '2.2', '2.3', '2.4'])],
			INTERCHANGES: [{ ids: ['1.4', '2.4'], zh: '同义替换', en: 'Paraphrase', dzh: '', den: '', why: { zh: '', en: '' } }],
		};
		const ix = findStation(pack, '2.4');
		expect(ix).toMatchObject({ playable: true, detailLine: { n: 1 }, previous: { id: '1.3' } });
		expect(ix?.closedLines.map(l => l.n)).toEqual([2]);
		expect(findStation(pack, '2.2')?.playable).toBe(false);
		expect(findStation(pack, '9.9')).toBeNull();
	});

	test('reading: the clock, the passage\'s tables, and the two parts of a paper', () => {
		expect(secondsLeft(10_000, 0)).toBe(10);
		expect(secondsLeft(10_000, 9_001)).toBe(1);
		expect(secondsLeft(10_000, 12_000)).toBe(0);
		expect(clockText(14 * 60)).toBe('14:00');
		expect(clockText(65)).toBe('1:05');
		expect(clockText(3725)).toBe('1:02:05');
		const blocks = paragraphBlocks('Ticket | Price\nAdult | £5.50\nStudents pay the child price.');
		expect(blocks.map(b => b.kind)).toEqual(['table', 'line']);
		expect(blocks[0].kind === 'table' && blocks[0].head?.length).toBe(2);
		const listening = group({ type: 'form', lines: ['(1) ______'], items: [item([1])] });
		const reading = group({ type: 'judge', skill: 'reading', letters: ['TRUE', 'FALSE', 'NOT GIVEN'], items: [item([2])] });
		expect(paperParts([listening, reading])).toEqual({ listening: [listening], reading: [reading] });
	});

	test('a summary\'s gaps and a list of headings pick from their box', () => {
		const bank = group({ type: 'bank', lines: ['Bees spend time (4) ______ and (5) ______.'], letters: ['A', 'B', 'C'], options: ['cleaning', 'outside', 'pollen'], items: [item([4]), item([5])] });
		expect(answersPayload([bank], { 4: 'B' })).toEqual([{ n: 4, value: 'B' }, { n: 5, value: '' }]);
		expect(letterText(bank, null, 'C')).toBe('pollen');
		const headings = group({ type: 'match', letters: ['i', 'ii', 'iii', 'iv'], options: ['one', 'two', 'three', 'four'], items: [item([6])] });
		expect(pickLetters(headings)).toEqual(['i', 'ii', 'iii', 'iv']);
		expect(letterText(headings, null, 'iv')).toBe('four');
		// paragraph letters have no words behind them
		expect(letterText(group({ type: 'match', letters: ['A', 'B'], items: [item([7])] }), null, 'B')).toBeNull();
	});

	test('tells a placement test from a station', () => {
		expect(placementLine('placement-1')).toBe(1);
		expect(placementLine('1.1')).toBeNull();
		expect(placementLine('placement-')).toBeNull();
	});
});
