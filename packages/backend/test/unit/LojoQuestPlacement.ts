/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { PLACEMENT_MAP, PLACEMENT_PARTS, gradePart, normalizePlacement, pathAfterFirst, publicPart, stationOf } from '@/misc/lojo-quest-placement.js';

describe('闯关定级 (placement-2026-11-11b)', () => {
	test('judges like the gates: trim, any case, a full stop or comma at the end', () => {
		expect(normalizePlacement('  Mill. ')).toBe('mill');
		expect(gradePart(PLACEMENT_PARTS.first, ['Week', 'brown,', 'seven', 'mill lane', ''])).toEqual([true, true, true, false, false]);
		expect(gradePart(PLACEMENT_PARTS.low, ['monthly', '48', 'TANAKA', '1st', 'friday'])).toEqual([true, true, true, true, true]);
	});

	test('3 or more right in the first part goes high', () => {
		expect(pathAfterFirst(2)).toBe('low');
		expect(pathAfterFirst(3)).toBe('high');
	});

	test('stations from the total right (定级规则 bands)', () => {
		expect([0, 1, 2, 3, 4, 5, 6, 7].map(n => stationOf('low', n))).toEqual(['1.1', '1.1', '1.2', '1.2', '1.3', '1.3', '1.4', '1.4']);
		expect([3, 4, 5, 6, 7, 8, 9, 10].map(n => stationOf('high', n))).toEqual(['1.5', '1.6', '1.7', '1.7', '1.8', '1.8', '1.9', '1.9']);
	});

	test('mapping: vocab and grammar never lit, 1.5 and up start at the Boss without prep', () => {
		for (const m of Object.values(PLACEMENT_MAP)) expect(m.lit.every(id => ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6'].includes(id))).toBe(true);
		expect(PLACEMENT_MAP['1.3']).toMatchObject({ lit: ['1-1', '1-2'], startAt: '1-3', prepWaived: false });
		expect(PLACEMENT_MAP['1.5']).toMatchObject({ startAt: 'boss', prepWaived: true, ch2: [] });
		expect(PLACEMENT_MAP['1.9']).toMatchObject({ startAt: '2-4', prepWaived: true, ch2: ['2-1', '2-2', '2-3'] });
	});

	test('the page gets no answers, and the second part is numbered 6–10', () => {
		const p = publicPart(PLACEMENT_PARTS.high, 6);
		expect(JSON.stringify(p)).not.toContain('"answer"');
		expect(p.lines[0]).toContain('(6)');
		expect(p.lines[4]).toContain('(10)');
	});
});
