/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The site's frame: sidebar, bottom tab bar, the timeline's tabs, the link-preview button and our control-panel entries.
import { pickLang } from './lang.js';

const zh = {
	quest: '闯关',
	guides: '攻略',
	studio: '创作台',
	openSource: '开源与致谢',
	showFooter: '叫出底栏',
	tlFollowing: '关注',
	tlEveryone: '全站',
	tlChannels: '频道',
	listenPlayer: '精听播放器',
	adminStability: '稳定性日报',
	adminGems: 'AI tutor 用量和宝石',
};

const en: typeof zh = {
	quest: 'Quests',
	guides: 'Guides',
	studio: 'Studio',
	openSource: 'Open source & credits',
	showFooter: 'Show the bottom bar',
	tlFollowing: 'Following',
	tlEveryone: 'Everyone',
	tlChannels: 'Channels',
	listenPlayer: 'Listening player',
	adminStability: 'Stability report',
	adminGems: 'AI tutor usage & gems',
};

export const navTable = { zh, en };
export const navText = pickLang(navTable);
