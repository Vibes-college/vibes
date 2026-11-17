/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 右下角的 Momo 默认打开，只在私信「⋯」里关（创始人 11-17 01:29 PT）：lojo/agent/state.ts。
import { beforeEach, describe, expect, test, vi } from 'vitest';

const KEY = 'vibes:vibi';

async function fresh() {
	vi.resetModules();
	return await import('@/lojo/agent/state.js');
}

describe('右下角的 Momo（lojo/agent/state.ts）', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	test('从没选过：默认显示，什么都不存', async () => {
		const s = await fresh();
		expect(s.vibiShown.value).toBe(true);
		expect(localStorage.getItem(KEY)).toBeNull();
	});

	test('以前打开过的（{show:true}）照旧显示', async () => {
		localStorage.setItem(KEY, JSON.stringify({ show: true }));
		const s = await fresh();
		expect(s.vibiShown.value).toBe(true);
	});

	test('在「⋯」里关掉：存下来，重开页面还是关的', async () => {
		let s = await fresh();
		s.vibiShown.value = false;
		expect(s.vibiShown.value).toBe(false);
		expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toEqual({ show: false });
		s = await fresh();
		expect(s.vibiShown.value).toBe(false);
	});

	test('关了再打开：回到默认，不存东西，并且带一声招呼进来', async () => {
		localStorage.setItem(KEY, JSON.stringify({ show: false }));
		const s = await fresh();
		s.vibiShown.value = true;
		expect(s.vibiShown.value).toBe(true);
		expect(s.justShown.value).toBe(true);
		expect(localStorage.getItem(KEY)).toBeNull();
	});

	test('关着的时候不记「面板开着」，开着的时候记，收起后清掉', async () => {
		localStorage.setItem(KEY, JSON.stringify({ show: false }));
		let s = await fresh();
		s.rememberPanelOpen();
		expect(s.shouldReopenPanel()).toBe(false);
		localStorage.clear();
		s = await fresh();
		s.rememberPanelOpen();
		expect(s.shouldReopenPanel()).toBe(true);
		s.forgetPanelOpen();
		expect(s.shouldReopenPanel()).toBe(false);
		expect(localStorage.getItem(KEY)).toBeNull();
	});

	test('坏掉的存值当没选过', async () => {
		localStorage.setItem(KEY, '{not json');
		const s = await fresh();
		expect(s.vibiShown.value).toBe(true);
	});
});
