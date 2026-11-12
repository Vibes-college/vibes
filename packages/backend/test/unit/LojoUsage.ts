/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { USAGE_DEFAULTS as C, TUTOR_DAILY_LIMIT_DEFAULT, addMonths, allowanceLeft, callCost, currentWindows, fuseNews, gemsFor, inviteRewardDue, nextUtcDay, spendOrder, tutorDailyLimit } from '@/core/LojoUsageService.js';

const H = 60 * 60 * 1000;
const t0 = new Date('2026-11-11T00:00:00Z');

describe('Vibi allowance and gems (pure parts)', () => {
	test('a call costs its tokens at the configured prices, rounded up', () => {
		// 1000 hit × 0.04 + 100 miss × 2 + 200 out × 8 = 40 + 200 + 1600
		expect(callCost({ hit: 1000, miss: 100, out: 200 }, C)).toBe(1840);
		expect(callCost({ hit: 1, miss: 0, out: 0 }, C)).toBe(1);
		expect(callCost({ hit: 0, miss: 0, out: 0 }, C)).toBe(0);
	});
	test('the 5-hour window starts again after 5 hours, the week after 7 days, each on its own', () => {
		const w = { fiveStart: t0, fiveUsed: 100, weekStart: t0, weekUsed: 500 };
		expect(currentWindows(w, t0.getTime() + 5 * H - 1).fiveUsed).toBe(100);
		const after5 = currentWindows(w, t0.getTime() + 5 * H);
		expect(after5.fiveUsed).toBe(0);
		expect(after5.fiveStart).toBeNull();
		expect(after5.weekUsed).toBe(500);
		expect(currentWindows(w, t0.getTime() + 7 * 24 * H).weekUsed).toBe(0);
	});
	test('what is left is the smaller of the two windows, never below zero', () => {
		expect(allowanceLeft({ fiveStart: t0, fiveUsed: 0, weekStart: t0, weekUsed: 0 }, C)).toBe(C.fiveHour);
		expect(allowanceLeft({ fiveStart: t0, fiveUsed: 0, weekStart: t0, weekUsed: C.week - 10 }, C)).toBe(10);
		expect(allowanceLeft({ fiveStart: t0, fiveUsed: C.fiveHour + 5, weekStart: t0, weekUsed: 0 }, C)).toBe(0);
	});
	test('gems are rounded up, never in the user\'s favour, and any cost takes at least a thousandth', () => {
		expect(gemsFor(C.perGem, C)).toBe(1000);
		expect(gemsFor(C.perGem / 5, C)).toBe(200);
		expect(gemsFor(1, C)).toBe(1);
		expect(gemsFor(C.perGem + 1, C)).toBe(1001);
		expect(gemsFor(0, C)).toBe(0);
		expect(Number.isInteger(gemsFor(1234, C))).toBe(true);
	});
	test('gifted gems go first, soonest-expiring first; bought gems last', () => {
		const lots = [
			{ id: 'a', left: 1, paid: true, expiresAt: null },
			{ id: 'b', left: 1, paid: false, expiresAt: new Date('2027-05-01') },
			{ id: 'c', left: 1, paid: false, expiresAt: new Date('2027-01-01') },
			{ id: 'd', left: 1, paid: false, expiresAt: null },
		];
		expect(spendOrder(lots).map(l => l.id)).toEqual(['c', 'b', 'd', 'a']);
	});
	test('gifted gems expire six months later', () => {
		expect(addMonths(t0, C.giftMonths).toISOString()).toBe('2027-05-11T00:00:00.000Z');
	});

	test('the site fuse is 20000 a day by default, and the environment can change it', () => {
		const was = process.env.LOJO_TUTOR_DAILY_LIMIT;
		delete process.env.LOJO_TUTOR_DAILY_LIMIT;
		expect(TUTOR_DAILY_LIMIT_DEFAULT).toBe(20000);
		expect(tutorDailyLimit()).toBe(20000);
		process.env.LOJO_TUTOR_DAILY_LIMIT = '50';
		expect(tutorDailyLimit()).toBe(50);
		if (was == null) delete process.env.LOJO_TUTOR_DAILY_LIMIT; else process.env.LOJO_TUTOR_DAILY_LIMIT = was;
	});
	test('the fuse speaks once at half and once when it blows', () => {
		expect([9999, 10000, 10001, 20000, 20001, 20002].map(n => fuseNews(n, 20000))).toEqual([null, 'half', null, null, 'full', null]);
		expect([2, 3, 4, 5, 6].map(n => fuseNews(n, 5))).toEqual([null, 'half', null, null, 'full']);
		expect(nextUtcDay(new Date('2026-11-11T23:59:00Z')).toISOString()).toBe('2026-11-12T00:00:00.000Z');
	});
	test('the invite reward is due only after a paid membership has passed 7 days without a refund', () => {
		const paidAt = new Date('2026-11-01T10:00:00Z');
		const day = 24 * H;
		expect(inviteRewardDue(null, t0)).toBe(false);
		expect(inviteRewardDue({ paidAt, refundedAt: null }, new Date(paidAt.getTime() + 7 * day - 1))).toBe(false);
		expect(inviteRewardDue({ paidAt, refundedAt: null }, new Date(paidAt.getTime() + 7 * day))).toBe(true);
		expect(inviteRewardDue({ paidAt, refundedAt: new Date(paidAt.getTime() + 2 * day) }, new Date(paidAt.getTime() + 30 * day))).toBe(false);
	});
});
