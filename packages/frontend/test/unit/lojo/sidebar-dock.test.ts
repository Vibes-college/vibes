/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it, vi } from 'vitest';

// 侧边栏改版（2026-11-17）：常用小程序 6 个图标读同一份名册；默认菜单只留通知、消息、搜索；站点图标菜单只留两项。
vi.mock('@/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@/lojo/app-overlay.js', () => ({ openAppOverlay: vi.fn() }));
vi.mock('@/lojo/miniapps/state.js', () => ({ hasSeenMiniApp: () => false }));
vi.mock('@@/js/config.js', () => ({ host: 'example.test', lang: 'en-US' }));
vi.mock('@/instance.js', () => ({ instance: { name: '示例站' } }));
vi.mock('@/i18n.js', () => ({
	i18n: {
		ts: { inquiry: '联系我们' },
		tsx: { aboutX: ({ x }: { x: string }) => `关于 ${x}` },
	},
}));

const { pickMiniApps } = await import('@/lojo/miniapps/roster.js');
const { VIBES_MENU_DEFAULT, isMisskeyMenuDefault } = await import('@/lojo/menu-default.js');
const { vibesInstanceMenuItems } = await import('@/lojo/instance-menu.js');

const app = (id: string, formerIds: string[] = []) => ({
	id, name: `示例 ${id}`, icon: 'ti ti-camera', href: `/apps/${id}/`, formerIds,
	intro: { summary: '示例', audience: '示例', steps: ['示例'], caveats: [] },
});
const DOCK = ['photo', 'dictation', 'typing', 'vocab', 'grammar', 'wordbook'];

describe('常用小程序 icons', () => {
	it('are in the dock order, not the roster order, and skip apps that are not in it', () => {
		const roster = [app('photo'), app('synonym'), app('graded-reading'), app('dictation'), app('typing'), app('vocab'), app('grammar'), app('wordbook')];
		expect(pickMiniApps(roster, DOCK).map(a => a.id)).toEqual(DOCK);
		expect(pickMiniApps(roster, ['wordbook', 'photo']).map(a => a.id)).toEqual(['wordbook', 'photo']);
	});

	it('an app turned off in the roster is gone; a list not read yet shows none', () => {
		const roster = [app('photo'), app('dictation'), app('vocab'), app('grammar'), app('wordbook')];
		expect(pickMiniApps(roster, DOCK).map(a => a.id)).toEqual(['photo', 'dictation', 'vocab', 'grammar', 'wordbook']);
		expect(pickMiniApps([], DOCK)).toEqual([]);
	});

	it('finds an app under the id it had before, once', () => {
		const roster = [app('photo-words-renamed', ['photo']), app('dictation')];
		expect(pickMiniApps(roster, ['photo', 'dictation', 'photo-words-renamed']).map(a => a.id)).toEqual(['photo-words-renamed', 'dictation']);
	});
});

describe('the sidebar menu default', () => {
	it('is only 通知, 消息, 搜索, with no divider', () => {
		expect(VIBES_MENU_DEFAULT).toEqual(['notifications', 'chat', 'search']);
	});

	it('swaps only a list that is still exactly Misskey\'s old default', () => {
		const old = ['notifications', 'clips', 'drive', 'followRequests', 'chat', '-', 'explore', 'announcements', 'channels', 'search', '-', 'ui'];
		expect(isMisskeyMenuDefault(old)).toBe(true);
		// someone who changed it keeps theirs
		expect(isMisskeyMenuDefault(old.filter(x => x !== 'drive'))).toBe(false);
		expect(isMisskeyMenuDefault([...old, 'favorites'])).toBe(false);
		expect(isMisskeyMenuDefault(['chat', 'notifications', 'clips', 'drive', 'followRequests', '-', 'explore', 'announcements', 'channels', 'search', '-', 'ui'])).toBe(false);
		expect(isMisskeyMenuDefault(VIBES_MENU_DEFAULT)).toBe(false);
	});
});

describe('the menu under the site logo', () => {
	it('has only 关于 and 联系我们', () => {
		const items = vibesInstanceMenuItems();
		expect(items.map(i => ('to' in i ? [i.text, i.to] : null))).toEqual([['关于 示例站', '/about'], ['联系我们', '/contact']]);
	});
});
