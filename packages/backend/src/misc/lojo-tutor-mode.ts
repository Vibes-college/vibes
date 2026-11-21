/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 聊天模式（创始人 2026-11-20 22:57 PT「可以，去做吧」）：学员点私信顶上 Momo 的名字，选 Momo 怎么回自己。
// - normal（默认）、roast 毒舌、chinglish 抓中式英语、subtext 英式潜台词。
// - 存在学员自己的 registry 里（scope lojo/tutor，key mode），读的时候再过一遍，不认识的当 normal。
// - 每个模式怎么说话写在 Momo 的回话服务里（私有，不在这个仓库）；这里只记选了哪个，带给她，
//   再把她回话里的对照卡和「换模式」变成聊天里的标记消息（聊天页画成卡片和一行灰字，lojo/tutor/mode.ts）。

import type { UiLang } from '@/misc/lojo-ui-lang.js';

export const MODE_KEY = 'mode';
export const TUTOR_MODES = ['normal', 'roast', 'chinglish', 'subtext'] as const;
export type TutorMode = typeof TUTOR_MODES[number];

export function normalizeTutorMode(raw: unknown): TutorMode {
	return typeof raw === 'string' && (TUTOR_MODES as readonly string[]).includes(raw) ? raw as TutorMode : 'normal';
}

// The card under her reply in a mode: the English expression (none for chinglish), what it seems to say, what it means.
export type ModeCard = { phrase: string | null; front: string; back: string };

const oneLine = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

export function normalizeModeCard(raw: unknown): ModeCard | null {
	if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const c = raw as Record<string, unknown>;
	const front = oneLine(c.front, 80);
	const back = oneLine(c.back, 80);
	if (front === '' || back === '') return null;
	const phrase = oneLine(c.phrase, 80);
	return { phrase: phrase === '' ? null : phrase, front, back };
}

// Marker messages (the chat page parses the same shapes, frontend lojo/tutor/mode.ts). Other clients see the plain text.
// 【对照卡·roast】break a leg
// 摔断一条腿
// → 祝你顺利、好运
export function modeCardText(mode: Exclude<TutorMode, 'normal'>, card: ModeCard): string {
	return `【对照卡·${mode}】${card.phrase ?? ''}\n${card.front}\n→ ${card.back}`; // vibes-i18n-keep: message protocol
}

const MODE_NAMES: Record<UiLang, Record<TutorMode, string>> = {
	zh: { normal: '正常', roast: '毒舌', chinglish: '抓中式英语', subtext: '英式潜台词' },
	en: { normal: 'Normal', roast: 'Roast', chinglish: 'Chinglish catcher', subtext: 'British subtext' },
};

// 【说话方式】已切到毒舌（roast）: one grey line in the chat when the learner switches, by the menu or by asking her.
export function modeNoticeText(mode: TutorMode, lang: UiLang): string {
	const name = MODE_NAMES[lang][mode];
	const said = lang === 'en'
		? (mode === 'normal' ? `Back to ${name}` : `Switched to ${name}`)
		: (mode === 'normal' ? `已换回${name}` : `已切到${name}`);
	return `【说话方式】${said}（${mode}）`; // vibes-i18n-keep: message protocol
}
