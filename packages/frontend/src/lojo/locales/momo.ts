/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 「认识你的 Momo」 (lojo/tutor/MomoSetup.vue; founder 2026-11-17 00:13 PT: 冲刺1111/Vibi/纯头像-1116/page.html) and the
// checks on the name the learner gives it (lojo/tutor/persona-rules.ts).
import { pickLang } from './lang.js';

const zh = {
	stepTitle: '认识你的 Momo',
	editTitle: '换个样子 / 改名字',
	skip: '先跳过',

	pickTitle: '先挑一张你喜欢的脸',
	pickLead: '这是你的学搭子，只属于你',
	face: '你的学搭子的脸',
	recent: '刚才的',
	recentPick: '换回这张',
	shuffle: '换一个',
	pick: '就 TA 了',

	nameTitle: '给 TA 起个名字',
	nameLead: '以后私信里就叫这个名字',
	nameLabel: '名字',
	nameIdeas: '试试这些名字',
	// The real header after the name (pages/chat/room.vue nameSuffix, tutorPublic.title on the server). Only the Chinese UI
	// shows it; in English the header is just the name (founder, 2026-11-11), so the English is empty.
	previewSuffix: '学搭子',
	previewCaption: '私信顶上会这样显示',
	back: '上一步',
	named: '好了',
	save: '保存',

	arrived: (name: string) => `${name} 来了`,
	ai: 'AI',
	startChat: '开始聊',
	profileFirst: '先设置资料',

	nameNotAllowed: '这个名字用不了，换一个吧',
	failed: '没存上，等一下再试',
	saved: '存好了',

	// persona-rules.ts
	nameIdeaList: ['Momo', 'Leo', 'Kiki', 'Nova', '豆豆', '阿布'],
	nameEmpty: (fallback: string) => `起个名字吧，不想起就用 ${fallback}`,
	nameTooLong: (max: number) => `最多 ${max} 个字`,
	nameBanned: (word: string) => `「${word}」容易让人以为是真人或官方，换一个吧`,
	// The bubble on the last step. The server says the real first line (backend misc/lojo-tutor-persona.ts).
	hello: (name: string) => `嗨，我是 ${name}，你的学搭子。我是 AI，不是真人，陪你练英语、排每天的任务。先说说，你在准备什么？`,
};

const en: typeof zh = {
	stepTitle: 'Meet your Momo',
	editTitle: 'Change look / name',
	skip: 'Skip for now',

	pickTitle: 'Pick a face you like',
	pickLead: 'Your study buddy, just for you',
	face: 'Your study buddy\'s face',
	recent: 'Previous',
	recentPick: 'Switch back',
	shuffle: 'Another one',
	pick: 'This one',

	nameTitle: 'Give them a name',
	nameLead: 'This is the name you\'ll see in your chats',
	nameLabel: 'Name',
	nameIdeas: 'Try one of these',
	previewSuffix: '',
	previewCaption: 'How it shows at the top of your chat',
	back: 'Back',
	named: 'Done',
	save: 'Save',

	arrived: (name: string) => `${name} is here`,
	ai: 'AI',
	startChat: 'Start chatting',
	profileFirst: 'Set up your profile first',

	nameNotAllowed: 'That name can\'t be used. Try another one.',
	failed: 'Didn\'t save. Try again in a moment.',
	saved: 'Saved',

	nameIdeaList: ['Momo', 'Leo', 'Kiki', 'Nova', 'Pip', 'Bo'],
	nameEmpty: (fallback: string) => `Pick a name, or keep ${fallback}`,
	nameTooLong: (max: number) => `Up to ${max} characters`,
	nameBanned: (word: string) => `“${word}” could make people think it's a real person or staff. Try another one.`,
	hello: (name: string) => `Hi, I'm ${name}, your study buddy. I'm an AI, not a real person. I'll practise English with you and plan your days. So, what are you preparing for?`,
};

export const momoTable = { zh, en };
export const momoText = pickLang(momoTable);
