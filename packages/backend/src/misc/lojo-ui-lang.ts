/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 界面语言第②批 (founder 2026-11-18): what the server writes itself follows the language the learner picked in
// 设置 › 语言, like the web app's own words (frontend lojo/locales/lang.ts): Chinese (zh-*) gets Chinese, every other
// language gets English. That language lives only in the browser, so the web app copies it into the account registry
// (lojo/ui-lang.ts) and the server reads it here: Momo's hello and away line, task-change cards, confirm cards, the
// task page's errors, and the cue for the messages she writes first. Content (posts, guides, questions, words) is not
// translated. Nothing stored yet (the web app was not opened since) counts as Chinese, the site's first language.
// When the learner writes first, Momo answers in the language they wrote in; that does not look at this.

import type { RegistryApiService } from '@/core/RegistryApiService.js';

export type UiLang = 'zh' | 'en';

export const UI_LANG_SCOPE = ['lojo', 'ui'];
export const UI_LANG_KEY = 'lang';

export function uiLangOf(value: unknown): UiLang {
	return value === 'en' ? 'en' : 'zh';
}

/** The learner's interface language as the web app last stored it; Chinese when unknown or unreadable. */
export async function learnerUiLang(registry: RegistryApiService, userId: string): Promise<UiLang> {
	const item = await registry.getItem(userId, null, UI_LANG_SCOPE, UI_LANG_KEY).catch(() => null);
	return uiLangOf(item?.value);
}
