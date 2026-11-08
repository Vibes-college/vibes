/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// UI chrome for the mini-apps launchpad and its intro screen. Per-app copy lives in manifest.ts instead, so adding
// a mini app only means editing one file.
export const miniAppsLabels = {
	panelTitle: '小程序',
	audiencePrefix: '适合：',
	stepsTitle: '怎么用',
	caveatsTitle: '注意',
	openButton: '打开',
} as const;
