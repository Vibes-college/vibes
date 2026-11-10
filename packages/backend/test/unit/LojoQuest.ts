/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { addDays, dayOf, drawQuestions, heartsNow, lastRefillAt, nextRefillAt, setCounts, streakNow, touchStreak } from '@/misc/lojo-quest.js';
import { QUEST_CH1 } from '@/misc/lojo-quest-ch1.js';
import { QUEST_BOOKS } from '@/misc/lojo-quest-books.js';

const bj = (s: string) => new Date(`${s}+08:00`);

describe('闯关 rules', () => {
	test('Beijing day', () => {
		expect(dayOf(bj('2026-11-10T23:59:00'))).toBe('2026-11-10');
		expect(dayOf(bj('2026-11-11T00:01:00'))).toBe('2026-11-11');
		expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
	});

	test('hearts fill back to 5 at 08:00 and 20:00 Beijing', () => {
		expect(lastRefillAt(bj('2026-11-10T09:00:00')).toISOString()).toBe(bj('2026-11-10T08:00:00').toISOString());
		expect(nextRefillAt(bj('2026-11-10T09:00:00')).toISOString()).toBe(bj('2026-11-10T20:00:00').toISOString());
		expect(nextRefillAt(bj('2026-11-10T21:00:00')).toISOString()).toBe(bj('2026-11-11T08:00:00').toISOString());
		expect(heartsNow(2, bj('2026-11-10T09:00:00'), bj('2026-11-10T19:59:00'))).toBe(2);
		expect(heartsNow(2, bj('2026-11-10T09:00:00'), bj('2026-11-10T20:00:00'))).toBe(5);
		expect(heartsNow(0, bj('2026-11-10T21:00:00'), bj('2026-11-11T07:00:00'))).toBe(0);
		expect(heartsNow(0, bj('2026-11-10T21:00:00'), bj('2026-11-11T08:00:01'))).toBe(5);
	});

	test('a set counts with 10 items and 2 minutes', () => {
		const now = bj('2026-11-10T12:00:00');
		const t = now.getTime();
		expect(setCounts(10, 120_000, t - 130_000, now).ok).toBe(true);
		expect(setCounts(9, 300_000, t - 310_000, now).reason).toBe('items');
		expect(setCounts(20, 119_000, t - 130_000, now).reason).toBe('time');
		expect(setCounts(20, 300_000, t + 120_000, now).reason).toBe('clock');
		expect(setCounts(20, 300_000, t - 2 * 86400_000, now).reason).toBe('clock');
	});

	test('streak grows a day at a time, freeze cards cover missed days', () => {
		let s = { streak: 0, streakDay: null as string | null, bestStreak: 0, freezes: 0 };
		for (let i = 0; i < 7; i++) s = touchStreak(s, addDays('2026-11-01', i));
		expect(s.streak).toBe(7);
		expect(s.freezes).toBe(1);
		expect(touchStreak(s, '2026-11-07').changed).toBe(false);
		// skip 11-08, come back 11-09: one freeze used
		const t = touchStreak(s, '2026-11-09');
		expect(t.streak).toBe(8);
		expect(t.usedFreezes).toBe(1);
		expect(t.freezes).toBe(0);
		// two days missed without freezes: restart
		expect(streakNow(t, '2026-11-12').days).toBe(0);
		expect(touchStreak(t, '2026-11-12').streak).toBe(1);
	});

	test('a retry draws questions not asked last time first', () => {
		const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(id => ({ id }));
		const first = drawQuestions(pool, 5, []);
		const second = drawQuestions(pool, 5, first.map(q => q.id));
		expect(second.slice(0, 3).every(q => !first.some(f => f.id === q.id))).toBe(true);
	});

	test('chapter data is sound', () => {
		const ids = new Set(QUEST_CH1.nodes.map(n => n.id));
		for (const [a, b] of QUEST_CH1.edges) expect(ids.has(a) && ids.has(b)).toBe(true);
		for (const n of QUEST_CH1.nodes) {
			if (n.kind !== 'level' && n.kind !== 'boss') continue;
			expect(n.pool!.length).toBeGreaterThanOrEqual(n.ask!);
			for (const q of n.pool!) expect(q.a).toBeLessThan(q.o.length);
		}
		expect(QUEST_BOOKS.length).toBeGreaterThanOrEqual(8);
		for (const b of QUEST_BOOKS) expect(b.quiz).toHaveLength(3);
	});
});
