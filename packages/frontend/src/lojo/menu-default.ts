/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The sidebar's own menu rows (settings → 导航栏) by default are only 通知, 消息 and 搜索, with no divider (founder,
// 2026-11-17); preferences/def.ts has the list. 便签, 网盘, 关注请求, 发现, 公告, 频道 and 切换界面 can still be added back
// there. A device that saved its settings before keeps the list it saved, so preferences.ts swaps it once, only when it
// is still exactly Misskey's old default: a list someone changed themselves is left alone.
export const VIBES_MENU_DEFAULT = ['notifications', 'chat', 'search'];

const MISSKEY_MENU_DEFAULT = [
	'notifications',
	'clips',
	'drive',
	'followRequests',
	'chat',
	'-',
	'explore',
	'announcements',
	'channels',
	'search',
	'-',
	'ui',
];

export function isMisskeyMenuDefault(menu: readonly string[]): boolean {
	return menu.length === MISSKEY_MENU_DEFAULT.length && menu.every((item, i) => item === MISSKEY_MENU_DEFAULT[i]);
}
