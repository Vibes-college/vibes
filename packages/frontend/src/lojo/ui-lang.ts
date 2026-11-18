/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 界面语言第②批 (2026-11-18): the server writes some words itself (Momo's hello and away line, task-change cards, the
// task page's errors) and tells Momo which language to write first in. The language picked in 设置 › 语言 lives only in
// this browser, so on every visit it is copied into the account registry, where the server reads it (backend
// misc/lojo-ui-lang.ts). Read first and written only when it differs, so a visit costs one small read. With two devices
// in different languages, the one opened last counts.
import { misskeyApi } from '@/utility/misskey-api.js';
import { vibesLang } from '@/lojo/locales/lang.js';

const SCOPE = ['lojo', 'ui'];
const KEY = 'lang';

export async function syncUiLang(): Promise<void> {
	try {
		const stored = await misskeyApi('i/registry/get', { scope: SCOPE, key: KEY }).catch((err: { code?: string } | null) => {
			if (err?.code === 'NO_SUCH_KEY') return null;
			throw err;
		});
		if (stored === vibesLang) return;
		await misskeyApi('i/registry/set', { scope: SCOPE, key: KEY, value: vibesLang });
	} catch {
		// offline or signed out meanwhile: the server keeps the language it had (Chinese if none), and the next visit tries again
	}
}
