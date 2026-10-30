/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { KEY_MAX, LEARN_AHEAD_MS, NEW_WORDS_PER_DAY, dayEnd, dayOf, dayStart, isDue, newCard, newLeft, preview, review, stateName, streak, validKey, wordKey } from '@/misc/lojo-words.js';

const at = (iso: string) => new Date(iso);
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
// China: 8 hours ahead of UTC, so getTimezoneOffset() is -480
const CN = -480;

describe('lojo words', () => {
	test('one key per expression: case, width and spacing do not make a second word', () => {
		expect(wordKey('  Take  a Rain Check ')).toBe('take a rain check');
		expect(wordKey('ＡＢＣ')).toBe('abc');
		expect(wordKey('   ')).toBe('');
	});

	test('a new card: 忘了 comes back in a minute, 记得 in ten, as the short steps say', () => {
		const now = at('2026-10-30T02:00:00Z');
		const card = newCard(now);
		expect(stateName(card.state)).toBe('new');
		const next = preview(card, now);
		expect(next.again.getTime() - now.getTime()).toBe(1 * MIN);
		expect(next.good.getTime() - now.getTime()).toBe(10 * MIN);
		expect(next.easy.getTime() - now.getTime()).toBeGreaterThan(DAY);
	});

	test('a review moves the card on and keeps the card as it was in the log', () => {
		const now = at('2026-10-30T02:00:00Z');
		const card = newCard(now);
		const once = review(card, now, 3);
		expect(stateName(once.card.state)).toBe('learning');
		expect(once.card.due.getTime() - now.getTime()).toBe(10 * MIN);
		expect(once.log).toMatchObject({ rating: 3, state: 0, reviewedAt: now });
		// 记得 again after the ten minutes: the card graduates to days
		const later = new Date(now.getTime() + 10 * MIN);
		const twice = review(once.card, later, 3);
		expect(stateName(twice.card.state)).toBe('review');
		expect(twice.card.due.getTime() - later.getTime()).toBeGreaterThanOrEqual(DAY);
		// forgetting a card in review sends it back to relearning for ten minutes
		const lapse = review(twice.card, twice.card.due, 1);
		expect(stateName(lapse.card.state)).toBe('relearning');
		expect(lapse.card.lapses).toBe(1);
		expect(lapse.card.due.getTime() - twice.card.due.getTime()).toBe(10 * MIN);
		expect(() => review(card, now, 5)).toThrow();
	});

	test("the learner's day runs midnight to midnight in their time zone", () => {
		// 01:30 in Beijing is still the evening before in UTC
		const now = at('2026-10-29T17:30:00Z');
		expect(dayOf(now, CN)).toBe('2026-10-30');
		expect(dayStart(now, CN).toISOString()).toBe('2026-10-29T16:00:00.000Z');
		expect(dayEnd(now, CN).toISOString()).toBe('2026-10-30T16:00:00.000Z');
		expect(dayOf(now, 0)).toBe('2026-10-29');
	});

	test('the streak counts days in a row, from today or from yesterday while today has none', () => {
		expect(streak([], '2026-10-30')).toBe(0);
		expect(streak(['2026-10-30'], '2026-10-30')).toBe(1);
		expect(streak(['2026-10-28', '2026-10-29'], '2026-10-30')).toBe(2);
		expect(streak(['2026-10-27', '2026-10-29', '2026-10-30'], '2026-10-30')).toBe(2);
		expect(streak(['2026-10-28'], '2026-10-30')).toBe(0);
		// across a month
		expect(streak(['2026-10-31', '2026-11-01'], '2026-11-01')).toBe(2);
	});

	test('due: review cards all day on their date, learning cards when their step is (nearly) over, new cards never', () => {
		const now = at('2026-10-30T02:00:00Z');
		const end = dayEnd(now, CN);
		expect(isDue({ state: 2, due: at('2026-10-30T12:00:00Z') }, now, end)).toBe(true);
		expect(isDue({ state: 2, due: at('2026-10-30T17:00:00Z') }, now, end)).toBe(false);
		expect(isDue({ state: 1, due: new Date(now.getTime() + LEARN_AHEAD_MS) }, now, end)).toBe(true);
		expect(isDue({ state: 3, due: new Date(now.getTime() + LEARN_AHEAD_MS + MIN) }, now, end)).toBe(false);
		expect(isDue({ state: 0, due: now }, now, end)).toBe(false);
	});

	test("FSRS counts days by the learner's midnight: 21:00 one evening and 07:30 the next morning are a day apart", () => {
		// learned the evening before (21:00 in Beijing), into review
		const evening = at('2026-10-29T13:00:00Z');
		const learned = review(review(newCard(evening), evening, 3, CN).card, new Date(evening.getTime() + 10 * MIN), 3, CN).card;
		expect(stateName(learned.state)).toBe('review');
		// 07:30 the next morning in Beijing is still 29 October in UTC
		const morning = at('2026-10-29T23:30:00Z');
		expect(review(learned, morning, 3, CN).log.elapsedDays).toBe(1);
		expect(review(learned, morning, 3, 0).log.elapsedDays).toBe(0);
		// the next due date comes back as a real instant, not shifted
		const next = review(learned, morning, 3, CN).card.due;
		expect(dayOf(next, CN) > dayOf(morning, CN)).toBe(true);
	});

	test('a review timed before the last one (two tabs, a clock that is off) is taken as at the last one', () => {
		const now = at('2026-10-30T02:00:00Z');
		const once = review(newCard(now), now, 3).card;
		const early = review(once, new Date(now.getTime() - 5 * MIN), 3);
		expect(early.log.reviewedAt).toEqual(now);
		expect(() => preview(once, new Date(now.getTime() - 5 * MIN))).not.toThrow();
	});

	test('keys longer than the column after NFKC are not valid words', () => {
		expect(validKey(wordKey('ok'))).toBe(true);
		expect(validKey('')).toBe(false);
		// … (one character) becomes ... (three) under NFKC
		const text = '…'.repeat(100);
		expect(text.length).toBeLessThanOrEqual(KEY_MAX);
		expect(validKey(wordKey(text))).toBe(false);
	});

	test('ten new words a day', () => {
		expect(NEW_WORDS_PER_DAY).toBe(10);
		expect(newLeft(0)).toBe(10);
		expect(newLeft(7)).toBe(3);
		expect(newLeft(12)).toBe(0);
	});
});
