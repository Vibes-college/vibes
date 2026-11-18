/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The buttons on every post and in the post form: read aloud, 翻译讲解, 创作讲解, 变成英文, 回复思路. What the AI writes
// inside them is content; only the frame is here. The 生词本 page has its own words (lojo/english/labels.ts).
import { pickLang } from './lang.js';

const zh = {
	listen: '朗读',
	stop: '停止',
	loadingVoice: '准备中',
	voice: '音色',
	voiceTitle: '朗读音色',
	accents: { us: '美音', uk: '英音', au: '澳音' },
	voiceChanged: (name: string) => `朗读音色换成了 ${name}`,
	voiceGreeting: (name: string) => `Hi, I'm ${name}. I'll read posts out loud for you.`,
	speechFailed: '这次没读出来，稍后再试。',
	explain: '翻译讲解',
	creatorNotes: '创作讲解',
	hide: '收起',
	translationZh: '中文意思',
	translationEn: '英文这样说',
	worthLearning: '值得学的说法',
	example: '例句',
	byAi: '由 AI 翻译讲解',
	failed: '这次没讲出来，稍后再试。',
	unavailable: 'AI 翻译还没开通。',
	rateLimited: '用得太频繁了，过一会儿再试。',
	quota: '今天的 AI 额度用完了，明天再来。',
	retry: '重试',
	kinds: { word: '词', phrase: '短语', idiom: '习语', slang: '俚语', grammar: '语法' },
	save: '加入生词本',
	unsave: '移出生词本',
	saved: '已加入生词本',
	removed: '已移出生词本',
	saveFailed: '没存上，稍后再试。',

	wordbook: '生词本',

	composeButton: '变成英文',
	composeTitle: '变成英文',
	composeHint: '写的是中文？点这里变成英文',
	composeEmpty: '先写点什么，中文也可以。',
	composeTooLong: '一次最多变 1000 字，先分成几段吧。',
	styles: { casual: '日常', slang: '俚语', formal: '正式' },
	feedback: '原文点评',
	notes: '这一版里值得学的',
	useThis: '用这一版',
	regenerate: '重新生成',
	textChanged: '原文改过了，重新生成一下？',
	closePanel: '关闭',

	ideasHint: '不知道怎么回？看看回复思路',
	ideasTitle: '回复思路',
	ideasMore: '换一批',
	ideasPick: '点一下放进回复框，还可以再改。',

	chineseDraftAsk: '这条是中文。Vibes 的时间线以英文为主，要先变成英文吗？',
	chineseDraftTranslate: '变成英文',
	chineseDraftPost: '直接发',
};

const en: typeof zh = {
	listen: 'Listen',
	stop: 'Stop',
	loadingVoice: 'Loading',
	voice: 'Voice',
	voiceTitle: 'Reading voice',
	accents: { us: 'US', uk: 'UK', au: 'Australian' },
	voiceChanged: (name: string) => `Reading voice changed to ${name}`,
	voiceGreeting: (name: string) => `Hi, I'm ${name}. I'll read posts out loud for you.`,
	speechFailed: 'Couldn\'t read it out this time. Try again later.',
	explain: 'Explain',
	creatorNotes: 'Creator notes',
	hide: 'Hide',
	translationZh: 'In Chinese',
	translationEn: 'In English',
	worthLearning: 'Worth learning',
	example: 'Example',
	byAi: 'Explained by AI',
	failed: 'Couldn\'t explain it this time. Try again later.',
	unavailable: 'AI translation isn\'t available yet.',
	rateLimited: 'Too many requests. Try again in a bit.',
	quota: 'You\'ve used today\'s AI allowance. Come back tomorrow.',
	retry: 'Retry',
	kinds: { word: 'word', phrase: 'phrase', idiom: 'idiom', slang: 'slang', grammar: 'grammar' },
	save: 'Add to wordbook',
	unsave: 'Remove from wordbook',
	saved: 'Added to wordbook',
	removed: 'Removed from wordbook',
	saveFailed: 'Didn\'t save. Try again later.',

	wordbook: 'Wordbook',

	composeButton: 'Into English',
	composeTitle: 'Into English',
	composeHint: 'Wrote it in Chinese? Tap to turn it into English',
	composeEmpty: 'Write something first. Chinese is fine.',
	composeTooLong: 'Up to 1,000 characters at a time. Split it into parts first.',
	styles: { casual: 'Casual', slang: 'Slang', formal: 'Formal' },
	feedback: 'Notes on your text',
	notes: 'Worth learning in this version',
	useThis: 'Use this version',
	regenerate: 'Try again',
	textChanged: 'Your text has changed. Generate again?',
	closePanel: 'Close',

	ideasHint: 'Not sure how to reply? See some ideas',
	ideasTitle: 'Reply ideas',
	ideasMore: 'More ideas',
	ideasPick: 'Tap one to put it in the reply box. You can still edit it.',

	chineseDraftAsk: 'This post is in Chinese. The Vibes timeline is mostly in English. Turn it into English first?',
	chineseDraftTranslate: 'Into English',
	chineseDraftPost: 'Post as is',
};

export const postTable = { zh, en };
export const postText = pickLang(postTable);
