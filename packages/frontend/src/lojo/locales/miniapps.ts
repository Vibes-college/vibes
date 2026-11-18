/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The mini-apps panel and its intro screen: only the frame. Each app's name and intro is content, in the roster
// (apps/community/miniapps-roster.json), and stays as written.
import { pickLang } from './lang.js';

const zh = {
	panelTitle: '小程序',
	audiencePrefix: '适合：',
	stepsTitle: '怎么用',
	caveatsTitle: '注意',
	openButton: '打开',
	loading: '正在读取小程序列表…',
	empty: '这里暂时没有小程序',
	failed: '小程序列表没读到，稍后再打开试试',
};

const en: typeof zh = {
	panelTitle: 'Mini apps',
	audiencePrefix: 'For: ',
	stepsTitle: 'How to use',
	caveatsTitle: 'Good to know',
	openButton: 'Open',
	loading: 'Loading mini apps…',
	empty: 'No mini apps here yet',
	failed: 'Couldn\'t load the mini apps. Try again in a moment.',
};

export const miniAppsTable = { zh, en };
export const miniAppsText = pickLang(miniAppsTable);
