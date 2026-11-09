/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test } from 'vitest';
import { earlyKey, takeEarlyResponse } from '@/lojo/early-api.js';

type Win = Window & { vibesEarlyApi?: unknown[] };

function early(endpoint: string, data: Record<string, unknown>, token: string | null, at = Date.now()) {
	const res = Promise.resolve(new Response('[]'));
	(window as Win).vibesEarlyApi!.push({ endpoint, key: earlyKey(data), token, at, res });
	return res;
}

describe('early answers from the boot loader', () => {
	beforeEach(() => {
		(window as Win).vibesEarlyApi = [];
	});

	test('the same request takes the early answer once', () => {
		const res = early('notes/timeline', { withRenotes: true, limit: 15, allowPartial: true }, 'T');
		// key order and the credential do not matter
		expect(takeEarlyResponse('notes/timeline', { limit: 15, allowPartial: true, withRenotes: true, i: 'T' }, 'T')).toBe(res);
		expect(takeEarlyResponse('notes/timeline', { limit: 15, allowPartial: true, withRenotes: true }, 'T')).toBeNull();
	});

	test('another account, other options or another endpoint ask as usual', () => {
		early('notes/timeline', { withRenotes: true, limit: 15, allowPartial: true }, 'T');
		expect(takeEarlyResponse('notes/timeline', { withRenotes: true, limit: 15, allowPartial: true }, 'U')).toBeNull();
		expect(takeEarlyResponse('notes/timeline', { withRenotes: false, limit: 15, allowPartial: true }, 'T')).toBeNull();
		expect(takeEarlyResponse('notes/local-timeline', { withRenotes: true, limit: 15, allowPartial: true }, 'T')).toBeNull();
	});

	test('an answer kept too long is not used', () => {
		early('notes/featured', {}, null, Date.now() - 60_000);
		expect(takeEarlyResponse('notes/featured', {}, null)).toBeNull();
	});

	test('no list (old boot loader) means no early answer', () => {
		delete (window as Win).vibesEarlyApi;
		expect(takeEarlyResponse('notes/featured', {}, null)).toBeNull();
	});
});
