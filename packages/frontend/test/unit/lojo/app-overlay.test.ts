/*
 * SPDX-FileCopyrightText: Vibes
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it, vi } from 'vitest';

// 小程序浮层（2026-11-18，创始人「小程序返回改回原页」）：小程序左上角「<」指向社区首页「/」，
// 在浮层里点它要回到打开前那一页（比如和 Momo 的聊天），不是跳到首页。
vi.mock('@/router.js', () => ({ mainRouter: {} }));

const { overlayGoesBack } = await import('@/lojo/app-overlay.js');

describe('小程序浮层：去社区哪一页', () => {
	it('「<」（指向首页 /）从哪里打开就回哪里', () => {
		expect(overlayGoesBack('/', '/chat/user/9x1abc')).toBe(true);
		expect(overlayGoesBack('/', '/@someone/learn')).toBe(true);
		expect(overlayGoesBack('/', '/timeline')).toBe(true);
		expect(overlayGoesBack('/', '/quest')).toBe(true);
	});

	it('要去的就是下面这一页，也是直接关浮层', () => {
		expect(overlayGoesBack('/quest?level=1-4', '/quest?level=1-4')).toBe(true);
	});

	it('「回闯关」这类指到别的页的链接，照旧换过去', () => {
		expect(overlayGoesBack('/quest?level=1-4', '/chat/user/9x1abc')).toBe(false);
		expect(overlayGoesBack('/quest', '/timeline')).toBe(false);
		expect(overlayGoesBack('/my/learn', '/chat/user/9x1abc')).toBe(false);
	});
});
