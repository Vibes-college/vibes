/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { gemsText, usageText, whenText } from '@/lojo/tutor/usage-text.js';

const now = new Date(2026, 10, 11, 10, 0); // Wed 11 Nov 2026, 10:00 local
const iso = (d: number, h: number, m = 0) => new Date(2026, 10, 11 + d, h, m).toISOString();

describe('the usage line under Vibi', () => {
	test('reset times read as today, tomorrow, a weekday, then a date', () => {
		expect(whenText(iso(0, 14), now, true)).toBe('今天 14:00');
		expect(whenText(iso(1, 9, 30), now, true)).toBe('明天 09:30');
		expect(whenText(iso(1, 9, 30), now, false)).toBe('tomorrow 09:30');
		expect(whenText(iso(1 + 1, 14), now, true)).toBe('周五 14:00');
		expect(whenText(iso(1 + 1, 14), now, false)).toBe('Fri 14:00');
		expect(whenText(iso(9, 14), now, true)).toBe('11月20日 14:00');
	});
	test('gems show whole numbers, or one decimal below 10', () => {
		expect(gemsText(990000)).toBe('990');
		expect(gemsText(2450)).toBe('2.4');
		expect(gemsText(0)).toBe('0');
	});
	test('within the allowance: percent used and when it resets', () => {
		const u = { fivePct: 20, fiveResetAt: iso(0, 14), weekPct: 37, weekResetAt: iso(1, 14), state: 'ok' as const, backAt: null, gems: 0 };
		expect(usageText(u, now, true)).toBe('本周已用 37%，明天 14:00 恢复 · 5 小时内已用 20%');
		expect(usageText(u, now, false)).toBe('This week: 37% used, resets tomorrow 14:00 · Last 5 hours: 20%');
	});
	test('used up: with gems it says gems are in use; without, when it comes back; never a buy button', () => {
		const gems = { fivePct: 100, fiveResetAt: iso(0, 14), weekPct: 40, weekResetAt: iso(1, 14), state: 'gems' as const, backAt: iso(0, 14), gems: 12000 };
		expect(usageText(gems, now, true)).toContain('在用宝石（还剩 12 颗）');
		expect(usageText(gems, now, false)).toContain('gems are being used now (12 left)');
		const out = { ...gems, state: 'out' as const, gems: 0 };
		expect(usageText(out, now, true)).toBe('额度用完了，今天 14:00恢复。在那之前 Vibi 先不回复。');
		for (const s of [usageText(out, now, true), usageText(out, now, false)]) expect(s).not.toMatch(/充值|购买|buy|top.?up/i);
	});
	test('the English line names only Vibi, no title', () => {
		const out = { fivePct: 100, fiveResetAt: null, weekPct: 100, weekResetAt: null, state: 'out' as const, backAt: null, gems: 0 };
		expect(usageText(out, now, false)).not.toMatch(/buddy|tutor/i);
	});
});
