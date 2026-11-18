/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The fixed lines Momo sends without the model (界面语言第②批, 2026-11-18), Chinese or English by the learner's interface
// language (misc/lojo-ui-lang.ts): her hello after sign-up, the 「I'm offline」 line, and the pointer she leaves after a
// failed level while offline. The quest's causes and tips are content and stay as written. What the model writes is
// not here: when the learner writes first she answers in their language; for what she writes first she is told the
// interface language (the private prompts, not this repository).

import type { UiLang } from '@/misc/lojo-ui-lang.js';

// Every away line starts with this, so it is kept out of her context (isTutorAwayText). In the first person since every
// learner names her (Momo, 2026-11-17), so it is the same whatever her name is.
export const TUTOR_AWAY_PREFIXES: Record<UiLang, string> = { zh: '我这会儿不在线', en: 'I\'m offline right now' };

export type TutorText = {
	/** the first thing the learner's Momo says once named; it says it is an AI in the first sentence (拟人化互动办法) */
	hello: (name: string) => string;
	away: (mapUrl: string) => string;
	quest: {
		causeLead: (cause: string) => string;
		lead: string;
		retry: (hearts: number) => string;
		book: string;
		gear: string;
		refillAt: (time: string) => string;
		refillTomorrow: string;
	};
};

const zh: TutorText = {
	hello: name => `嗨，我是 ${name}，你的学搭子。我是 AI，不是真人，陪你练英语、排每天的任务。先说说，你在准备什么？`,
	away: map => `${TUTOR_AWAY_PREFIXES.zh}，你的消息我回来会先看 🙏 想先练的话，👉 闯关地图 ${map}`,
	quest: {
		causeLead: cause => `${TUTOR_AWAY_PREFIXES.zh}，先给你留个路标：这一关主要卡在「${cause}」。`,
		lead: `${TUTOR_AWAY_PREFIXES.zh}，先给你留个路标。`,
		retry: n => `你还有 ${n} 颗心，再打这一关会换新题。`,
		book: '先读这本锦囊，读完过小测能补 1 颗心。',
		gear: '练一组这个装备，能补 1 颗心。',
		refillAt: t => `心 ${t} 回满，先读读这本锦囊。`,
		refillTomorrow: '心明天回满，先读读这本锦囊。',
	},
};

// Same words as the sign-up step (frontend lojo/locales/momo.ts hello).
// No "study buddy" in English: there she is just her name (founder 2026-11-11, the title 学搭子 is for Chinese only).
const en: TutorText = {
	hello: name => `Hi, I'm ${name}. I'm an AI, not a real person. I'll practise English with you and plan your days. So, what are you preparing for?`,
	away: map => `${TUTOR_AWAY_PREFIXES.en}. I'll read your message first thing when I'm back 🙏 Want to practise meanwhile? 👉 Quest map ${map}`,
	quest: {
		causeLead: cause => `${TUTOR_AWAY_PREFIXES.en}, so here's a pointer first: this level mostly tripped you up on 「${cause}」.`,
		lead: `${TUTOR_AWAY_PREFIXES.en}, so here's a pointer first.`,
		retry: n => `You still have ${n} ${n === 1 ? 'heart' : 'hearts'}. Play this level again and you'll get new questions.`,
		book: 'Read this tip book first. Pass its short quiz to get 1 heart back.',
		gear: 'Do one set with this gear to get 1 heart back.',
		refillAt: t => `Your hearts refill at ${t}. Read this tip book meanwhile.`,
		refillTomorrow: 'Your hearts refill tomorrow. Read this tip book meanwhile.',
	},
};

export function tutorText(lang: UiLang): TutorText {
	return lang === 'en' ? en : zh;
}
