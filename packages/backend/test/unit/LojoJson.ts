/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { isSafeLojoJson } from '@/misc/lojo-json.js';

describe('LOJO persisted JSON boundary', () => {
	test('accepts nested records and ordinary photo URLs', () => {
		expect(isSafeLojoJson({ version: 1, cards: [{ name: '年糕', photo: '/lojo-assets/cat.jpg', flags: [true, null, 2] }] }, 1024)).toBe(true);
	});
	test('counts UTF-8 bytes rather than JavaScript string length', () => {
		expect(isSafeLojoJson({ name: '猫'.repeat(20) }, 50)).toBe(false);
	});
	test('rejects prototype pollution paths anywhere in a record', () => {
		for (const key of ['__proto__', 'constructor', 'prototype']) {
			expect(isSafeLojoJson(JSON.parse(`{"cards":[{"${key}":{}}]}`), 1024)).toBe(false);
		}
	});
	test('rejects non-JSON values and cyclic or deep objects without recursion overflow', () => {
		const cyclic: Record<string, unknown> = {};
		cyclic.child = cyclic;
		for (const value of [undefined, NaN, new Date(), { callback: () => null }, cyclic]) {
			expect(isSafeLojoJson(value, 1024)).toBe(false);
		}
	});
});
