/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes' own words follow the language picked in 设置 › 语言 (founder, 2026-11-17 20:00 PT: 「我选英文就应该给我显示英文，
// 我选中文你才能给我显示中文」). Chinese (zh-CN, zh-TW, …) gets Chinese; every other language gets English. Misskey's own
// words keep coming from its Crowdin locales (i18n.ts); ours are kept apart in lojo/locales/, because only
// locales/ja-JP.yml may be edited by hand there (Misskey AGENTS.md). Changing the language reloads the page, so this is
// read once.
import { lang } from '@@/js/config.js';

export type VibesLang = 'zh' | 'en';

export function vibesLangOf(code: string | null | undefined): VibesLang {
	return code != null && code.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export const vibesLang: VibesLang = vibesLangOf(lang);

/** One area's words in both languages; the English must have every key the Chinese has. */
export function pickLang<T>(table: { zh: T; en: NoInfer<T> }): T {
	return table[vibesLang];
}

export const isZhUi = vibesLang === 'zh';
