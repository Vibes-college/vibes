/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { LojoStateSync } from '@/lojo/state-sync.js';
import { mapRouteFromText } from '@/lojo/entity-link.js';

describe('LOJO account state synchronization', () => {
	test('serializes writes against successive revisions and snapshots mutable state', async () => {
		const write = vi.fn(async (state, revision) => ({ state, revision: revision + 1 }));
		const sync = new LojoStateSync({ revision: 7, state: null }, write, () => true, vi.fn(), vi.fn());
		const state = { saved: ['h1'] };
		const first = sync.save(state);
		state.saved.push('h2');
		const second = sync.save(state);
		await Promise.all([first, second]);
		expect(write.mock.calls).toEqual([[{ saved: ['h1'] }, 7], [{ saved: ['h1', 'h2'] }, 8]]);
		expect(sync.hasPendingChanges).toBe(false);
	});

	test('blocks later writes after a conflict without overwriting remote state', async () => {
		const conflict = { code: 'STATE_CONFLICT' };
		const write = vi.fn().mockRejectedValue(conflict);
		const sync = new LojoStateSync({ revision: 2, state: null }, write, () => true, vi.fn(), vi.fn());
		const results = await Promise.allSettled([sync.save({ saved: ['a'] }), sync.save({ saved: ['b'] })]);
		expect(results.every(result => result.status === 'rejected')).toBe(true);
		expect(write).toHaveBeenCalledTimes(1);
		expect(sync.hasPendingChanges).toBe(true);
	});

	test('retries the latest unsaved snapshot, not an older failed edit', async () => {
		const write = vi.fn().mockRejectedValueOnce(new Error('offline')).mockImplementation(async (state, revision) => ({ state, revision: revision + 1 }));
		const sync = new LojoStateSync({ revision: 0, state: null }, write, () => true, vi.fn(), vi.fn());
		await sync.save({ saved: ['a'] }).catch(() => {});
		await sync.save({ saved: ['b'] }).catch(() => {});
		await sync.retry();
		expect(write.mock.calls.at(-1)).toEqual([{ saved: ['b'] }, 0]);
		expect(sync.hasPendingChanges).toBe(false);
	});

	test('does not send queued state after an account switch or unmount', async () => {
		const write = vi.fn();
		let currentAccount = true;
		const sync = new LojoStateSync({ revision: 0, state: null }, write, () => currentAccount, vi.fn(), vi.fn());
		const pending = sync.save({ privatePlan: 'A' });
		currentAccount = false;
		await expect(pending).rejects.toThrow('ACCOUNT_CHANGED');
		expect(write).not.toHaveBeenCalled();
		sync.dispose();
		await expect(sync.retry()).rejects.toThrow('ACCOUNT_CHANGED');
		expect(write).not.toHaveBeenCalled();
	});
});

describe('LOJO note map context', () => {
	test('accepts only canonical entity links on this instance', () => {
		const origin = 'https://lojo.example';
		expect(mapRouteFromText('My experience\nhttps://lojo.example/lojo#building/h1', origin)).toBe('/lojo#building/h1');
		expect(mapRouteFromText('https://elsewhere.example/lojo#building/h1', origin)).toBeNull();
		expect(mapRouteFromText('https://lojo.example/lojo#planner/private-plan', origin)).toBeNull();
		expect(mapRouteFromText('https://lojo.example/lojo?redirect=evil#building/h1', origin)).toBeNull();
		expect(mapRouteFromText('javascript:alert(1)', origin)).toBeNull();
	});
});
