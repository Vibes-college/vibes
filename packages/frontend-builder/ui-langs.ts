/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes: while the site is changed every day, VIBES_UI_LANGS="zh-CN,en-US" builds only those UI languages.
// All 28 make every deploy about 14 times bigger. Unset it before the public launch to build all of them again.
// en-US must stay in the list: the boot loader falls back to it.
export function pickUiLocales<T>(locales: Record<string, T>): Record<string, T> {
	const wanted = (process.env.VIBES_UI_LANGS ?? '').split(',').map(lang => lang.trim()).filter(lang => lang !== '');
	if (wanted.length === 0) return locales;
	if (!wanted.includes('en-US')) throw new Error('VIBES_UI_LANGS must include en-US, the language the boot loader falls back to');
	const missing = wanted.filter(lang => !(lang in locales));
	if (missing.length > 0) throw new Error(`VIBES_UI_LANGS has unknown languages: ${missing.join(', ')}`);
	return Object.fromEntries(Object.entries(locales).filter(([lang]) => wanted.includes(lang)));
}
