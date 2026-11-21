/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 聊天模式 (founder 2026-11-20 22:57 PT): the menu under Momo's name in her chat, the line under her name while a mode is
// on, the grey line when it changes, and the card under her reply (lojo/tutor/mode.ts, ContrastCard.vue).
// Never 「人设」: only how she talks changes; she is the same Momo. n: the name the learner gave their Momo.
import { pickLang } from './lang.js';

type Mode = 'normal' | 'roast' | 'chinglish' | 'subtext';
type Card = Exclude<Mode, 'normal'>;

const zh = {
	menuTitle: (n: string) => `${n} 怎么回你`,
	name: { normal: '正常', roast: '毒舌', chinglish: '抓中式英语', subtext: '英式潜台词' } as Record<Mode, string>,
	caption: {
		normal: (n: string) => `平常的 ${n}`,
		roast: () => '损你一句，带一句地道说法',
		chinglish: () => '顺手逮一处中式说法',
		subtext: () => '客气话背后的真意思',
	} as Record<Mode, (n: string) => string>,
	hint: '也能直接说「开毒舌」「正常点」',
	accent: { roast: '毒舌模式', chinglish: '抓中式英语模式', subtext: '英式潜台词模式' } as Record<Card, string>,
	changeAria: (n: string) => `换 ${n} 说话的方式`,
	switchedTo: (m: Mode) => (m === 'normal' ? '已换回正常' : `已切到${zh.name[m]} · 说「正常点」随时换回`),
	failed: '没换成，再试一次',

	// The card: first what it seems to say, then what it really means.
	pre: {
		roast: ['直译误会', '其实是'],
		chinglish: ['中式英语', '地道说法'],
		subtext: ['字面上', '英国人其实想说'],
	} as Record<Card, [string, string]>,
	cardAria: (s: string) => `对照卡：${s}，点一下重播`,
	listen: '听',
	stop: '停',
	addWord: '+ 生词本',
	saved: '已在生词本',
	addFailed: '没存上，再试一次',
	literally: (s: string) => `字面：${s}`,
	insteadOf: (s: string) => `代替：${s}`,
};

const en: typeof zh = {
	menuTitle: (n: string) => `How ${n} talks to you`,
	name: { normal: 'Normal', roast: 'Roast', chinglish: 'Chinglish catcher', subtext: 'British subtext' },
	caption: {
		normal: (n: string) => `The usual ${n}`,
		roast: () => 'A gentle roast, plus a real expression',
		chinglish: () => 'Catches one Chinglish slip',
		subtext: () => 'What polite British words really mean',
	},
	hint: 'You can also just say "roast me" or "normal please"',
	accent: { roast: 'Roast mode', chinglish: 'Chinglish catcher', subtext: 'British subtext' },
	changeAria: (n: string) => `Change how ${n} talks`,
	switchedTo: (m: Mode) => (m === 'normal' ? 'Back to Normal' : `Switched to ${en.name[m]} · say "normal please" to switch back`),
	failed: 'Could not switch. Try again.',

	pre: {
		roast: ['Taken literally', 'Actually means'],
		chinglish: ['Chinglish', 'Natural English'],
		subtext: ['On the surface', 'What a Brit means'],
	},
	cardAria: (s: string) => `Card: ${s}. Tap to replay`,
	listen: 'Listen',
	stop: 'Stop',
	addWord: '+ Wordbook',
	saved: 'In wordbook',
	addFailed: 'Not saved. Try again.',
	literally: (s: string) => `Literally: ${s}`,
	insteadOf: (s: string) => `Instead of: ${s}`,
};

export const modeText = pickLang({ zh, en });
