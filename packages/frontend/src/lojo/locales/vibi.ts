/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The AI tutor's settings page and the Momo in the corner (lojo/agent/LojoAgent.vue, peek.ts).
// n: the name the learner gave their Momo (lojo/tutor/persona.ts myTutorName; Momo until they pick one).
import { pickLang } from './lang.js';

const zh = {
	settingsTitle: 'AI tutor',
	showOnHome: (n: string) => `在首页显示 ${n}`,
	// 设置 › AI tutor no longer holds the switch (founder 11-17 01:29 PT): it is in the ⋯ menu of the chat with Momo.
	showOnHomeWhere: (n: string) => `${n} 默认在每页右下角探头，有任务没做时说一句。不想看到 TA，到和 ${n} 的私信，点右上角「⋯」关掉「在首页显示 ${n}」。只对这台设备生效。`,
	arrived: (n: string) => `${n} 在这儿，有事点我。`,
	open: (n: string) => `和 ${n} 聊天`,
	bigger: '放大',
	smaller: '缩小',
	minimize: '收起',
	more: '更多',
	openFull: '在完整页面打开',
	settings: 'AI tutor 设置',
	hide: '不在首页显示',
	hidden: (n: string) => `好的。想再叫出来，到和 ${n} 的私信，点右上角「⋯」打开。`,
	unavailable: (n: string) => `${n} 暂时不在，过一会儿再试。`,
	// 有新任务的时候从旁边冒一句话（创始人 11-17 00:13 PT）
	todayLeft: (count: number) => `今天还有 ${count} 个任务没做，来吗？`,
};

const en: typeof zh = {
	settingsTitle: 'AI tutor',
	showOnHome: (n: string) => `Show ${n} on the home page`,
	showOnHomeWhere: (n: string) => `${n} peeks out at the bottom right of every page and says something when tasks are waiting. To hide ${n}, open your chat with ${n}, tap “⋯” at the top right and turn off “Show ${n} on the home page”. This only applies to this device.`,
	arrived: (n: string) => `${n} is here. Tap me if you need anything.`,
	open: (n: string) => `Chat with ${n}`,
	bigger: 'Bigger',
	smaller: 'Smaller',
	minimize: 'Minimize',
	more: 'More',
	openFull: 'Open as a full page',
	settings: 'AI tutor settings',
	hide: 'Hide from the home page',
	hidden: (n: string) => `OK. To bring ${n} back, open your chat with ${n} and tap “⋯” at the top right.`,
	unavailable: (n: string) => `${n} isn't available right now. Try again in a bit.`,
	todayLeft: (count: number) => (count === 1 ? '1 task left today. Shall we?' : `${count} tasks left today. Shall we?`),
};

export const vibiTable = { zh, en };
export const vibiText = pickLang(vibiTable);
