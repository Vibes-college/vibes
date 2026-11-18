/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// UI chrome for the mini-apps launchpad and its intro screen. Per-app copy is in the 小程序 roster on the server
// (roster.ts), so adding or rewording a mini app is an import, not a rebuild.
export const miniAppsLabels = {
	panelTitle: '小程序',
	audiencePrefix: '适合：',
	stepsTitle: '怎么用',
	caveatsTitle: '注意',
	openButton: '打开',
	loading: '正在读取小程序列表…',
	empty: '这里暂时没有小程序',
	failed: '小程序列表没读到，稍后再打开试试',
} as const;
