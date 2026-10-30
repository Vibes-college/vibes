/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	TYPO_RATING,
	dateText,
	dueText,
	durationMs,
	highlightParts,
	intervalText,
	letterCount,
	letterMarks,
	letterNumber,
	nextKey,
	ratingInterval,
	slipped,
	spellRating,
	spellingFilled,
	spellingMatches,
} from '@/lojo/english/review.js';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('生词本 review: when a card comes back', () => {
	test('button intervals in minutes, hours, days, months and years', () => {
		expect(intervalText(1 * MIN, 'zh')).toBe('1 分钟');
		expect(intervalText(10 * MIN, 'zh')).toBe('10 分钟');
		expect(intervalText(5 * 1000, 'zh')).toBe('1 分钟');
		expect(intervalText(59.6 * MIN, 'zh')).toBe('1 小时');
		expect(intervalText(5 * HOUR, 'zh')).toBe('5 小时');
		expect(intervalText(23.8 * HOUR, 'zh')).toBe('1 天');
		expect(intervalText(3 * DAY + 2 * HOUR, 'zh')).toBe('3 天');
		expect(intervalText(45 * DAY, 'zh')).toBe('1.5 个月');
		expect(intervalText(400 * DAY, 'zh')).toBe('1.1 年');
		expect(intervalText(10 * MIN, 'en')).toBe('10 min');
		expect(intervalText(2 * HOUR, 'en')).toBe('2 h');
		expect(intervalText(1 * DAY, 'en')).toBe('1 day');
		expect(intervalText(3 * DAY, 'en')).toBe('3 days');
		expect(intervalText(60 * DAY, 'en')).toBe('2 mo');
	});

	test('the buttons read the server\'s dates from when the queue was fetched', () => {
		const fetchedAt = Date.parse('2026-10-29T10:00:00Z');
		const next = { again: '2026-10-29T10:01:00.000Z', hard: '2026-10-29T10:06:00.000Z', good: '2026-10-29T10:10:00.000Z', easy: '2026-11-08T10:00:00.000Z' };
		expect(nextKey(1)).toBe('again');
		expect(nextKey(2)).toBe('hard');
		expect(nextKey(3)).toBe('good');
		expect(ratingInterval(next, 1, fetchedAt, 'zh')).toBe('1 分钟');
		expect(ratingInterval(next, 2, fetchedAt, 'zh')).toBe('6 分钟');
		expect(ratingInterval(next, 3, fetchedAt, 'en')).toBe('10 min');
	});

	test('the word list: new, minutes for learning cards, calendar days for review cards', () => {
		const now = new Date(2026, 9, 29, 22, 0).getTime();
		const at = (ms: number) => new Date(now + ms).toISOString();
		expect(dueText({ state: 'new', due: at(0) }, now, 'zh')).toEqual({ text: '新词', tone: 'new' });
		expect(dueText({ state: 'learning', due: at(10 * MIN) }, now, 'zh')).toEqual({ text: '10 分钟后', tone: 'soon' });
		expect(dueText({ state: 'relearning', due: at(-MIN) }, now, 'zh')).toEqual({ text: '现在', tone: 'due' });
		// 3 hours on is past midnight: tomorrow, by the calendar
		expect(dueText({ state: 'review', due: at(3 * HOUR) }, now, 'zh')).toEqual({ text: '明天', tone: 'later' });
		expect(dueText({ state: 'review', due: at(HOUR) }, now, 'zh')).toEqual({ text: '今天', tone: 'due' });
		expect(dueText({ state: 'review', due: at(-2 * DAY) }, now, 'zh')).toEqual({ text: '该复习了', tone: 'due' });
		expect(dueText({ state: 'review', due: at(3 * DAY) }, now, 'zh')).toEqual({ text: '3 天后', tone: 'later' });
		expect(dueText({ state: 'review', due: at(3 * DAY) }, now, 'en')).toEqual({ text: 'in 3 days', tone: 'later' });
		expect(dueText({ state: 'learning', due: at(10 * MIN) }, now, 'en').text).toBe('in 10 min');
		expect(dueText({ state: 'new', due: at(0) }, now, 'en').text).toBe('New');
	});

	test('today\'s date', () => {
		expect(dateText(new Date(2026, 9, 30), 'zh')).toBe('10 月 30 日 周五');
		expect(dateText(new Date(2026, 9, 30), 'en')).toBe('Fri, Oct 30');
	});

	test('time on screen stays within what the server takes', () => {
		expect(durationMs(1000, 5200.4)).toBe(4200);
		expect(durationMs(5000, 1000)).toBe(0);
		expect(durationMs(0, 2 * HOUR)).toBe(HOUR);
	});
});

describe('生词本 review: spelling', () => {
	test('a match ignores case, extra spaces, curly apostrophes and accents', () => {
		expect(spellingMatches('Itinerary', 'itinerary')).toBe(true);
		expect(spellingMatches('  take a   rain check ', 'take a rain check')).toBe(true);
		expect(spellingMatches('don’t mention it', 'don\'t mention it')).toBe(true);
		expect(spellingMatches('don\'t', 'don’t')).toBe(true);
		expect(spellingMatches('cafe', 'café')).toBe(true);
		expect(spellingMatches('ｗｅｄｎｅｓｄａｙ', 'Wednesday')).toBe(true);
		expect(spellingMatches('itinery', 'itinerary')).toBe(false);
		expect(spellingMatches('takea rain check', 'take a rain check')).toBe(false);
	});

	test('the card checks itself once as many letters as the answer are typed', () => {
		expect(spellingFilled('itinerar', 'itinerary')).toBe(false);
		expect(spellingFilled('itinerarx', 'itinerary')).toBe(true);
		expect(spellingFilled('itinerary ', 'itinerary')).toBe(true);
		expect(spellingFilled('take a rain ', 'take a rain check')).toBe(false);
		expect(spellingFilled('take  a rain check', 'take a rain check')).toBe(true);
		expect(spellingFilled('', 'a')).toBe(false);
	});

	test('letters are marked right, wrong, extra or not yet typed', () => {
		const m = letterMarks('itix', 'itinerary');
		expect(m.cells.map(c => c.state).join(',')).toBe('ok,ok,ok,bad,empty,empty,empty,empty,empty');
		expect(m.cells[3].ch).toBe('x');
		expect(m.firstWrong).toBe(3);
		expect(letterNumber('itinerary', m.firstWrong)).toBe(4);
		expect(m.typed).toBe(4);
		expect(m.length).toBe(9);

		// the answer's own case on the right letters
		expect(letterMarks('wed', 'Wednesday').cells.slice(0, 3).map(c => c.ch).join('')).toBe('Wed');

		const extra = letterMarks('cats', 'cat');
		expect(extra.cells.map(c => c.state)).toEqual(['ok', 'ok', 'ok', 'extra']);
		expect(extra.firstWrong).toBe(3);

		const right = letterMarks('it', 'itinerary');
		expect(right.firstWrong).toBe(-1);
	});

	test('a phrase: spaces are gaps, and letters are counted without them', () => {
		const m = letterMarks('take a rian', 'take a rain check');
		expect(m.cells[4]).toEqual({ ch: ' ', state: 'ok', space: true });
		expect(m.cells[16]).toEqual({ ch: '', state: 'empty', space: false });
		expect(m.firstWrong).toBe(8);
		expect(letterNumber('take a rain check', 8)).toBe(7);
		expect(letterCount('take a rain check')).toEqual({ letters: 14, words: 4 });
		expect(letterCount('itinerary')).toEqual({ letters: 9, words: 1 });
	});

	test('a slip is a wrong letter just typed; going back over it is not another', () => {
		expect(slipped('iti', 'itix', 'itinerary')).toBe(true);
		expect(slipped('iti', 'itin', 'itinerary')).toBe(false);
		expect(slipped('itix', 'iti', 'itinerary')).toBe(false);
		// pasted in one go: one slip however many letters are wrong
		expect(slipped('', 'xxxx', 'itinerary')).toBe(true);
		expect(slipped('itinerary', 'itinerarys', 'itinerary')).toBe(true);
	});

	test('grades: right first time 3, right after a slip 2, wrong or gave up 1, a typo 2', () => {
		expect(spellRating({ right: true, slips: 0, gaveUp: false })).toBe(3);
		expect(spellRating({ right: true, slips: 2, gaveUp: false })).toBe(2);
		expect(spellRating({ right: false, slips: 0, gaveUp: false })).toBe(1);
		expect(spellRating({ right: false, slips: 1, gaveUp: true })).toBe(1);
		expect(TYPO_RATING).toBe(2);
	});
});

describe('生词本 review: the example sentence', () => {
	test('marks the expression, whatever its case or spacing', () => {
		expect(highlightParts('I emailed my Itinerary to Mum.', 'itinerary')).toEqual([
			{ text: 'I emailed my ', hit: false }, { text: 'Itinerary', hit: true }, { text: ' to Mum.', hit: false },
		]);
		expect(highlightParts('Can I take a  rain check?', 'take a rain check').filter(p => p.hit).map(p => p.text)).toEqual(['take a  rain check']);
		expect(highlightParts('I don’t mind.', 'don\'t').filter(p => p.hit).map(p => p.text)).toEqual(['don’t']);
		expect(highlightParts('Nothing here.', 'itinerary')).toEqual([{ text: 'Nothing here.', hit: false }]);
		expect(highlightParts('a (b) c', '(b)').filter(p => p.hit).map(p => p.text)).toEqual(['(b)']);
	});
});
