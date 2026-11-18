/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The chat page's own words: the box, voice messages, the 「正在输入」 line and the usage sheet in the ⋯ menu.
// The usage lines themselves (when it comes back, how much is used) are in lojo/tutor/usage-text.ts, which already
// gives both languages. n: the name the learner gave their Momo.
import { pickLang } from './lang.js';

const zh = {
	placeholder: (n: string) => `跟 ${n} 说点什么…`,
	usage: '用量',
	voicePlay: '播放语音',
	voiceFailed: '这条语音没放出来，稍后再试。',
	typing: '正在输入',
	usageFive: '5 小时额度',
	usageWeek: '本周额度',
	usageNote: '额度按实际用量算，用完会自动恢复。',
	usageFailed: '暂时没取到用量，稍后再看。',
	gems: (n: string) => `宝石 ${n} 颗`,
};

const en: typeof zh = {
	placeholder: (n: string) => `Message ${n}…`,
	usage: 'Usage',
	voicePlay: 'Play voice message',
	voiceFailed: 'This voice message didn\'t play. Try again in a moment.',
	typing: 'Typing',
	usageFive: '5-hour allowance',
	usageWeek: 'Weekly allowance',
	usageNote: 'Your allowance follows what you actually use, and comes back on its own.',
	usageFailed: 'Couldn\'t load your usage. Try again in a moment.',
	gems: (n: string) => `${n} gems`,
};

export const chatTable = { zh, en };
export const chatText = pickLang(chatTable);
