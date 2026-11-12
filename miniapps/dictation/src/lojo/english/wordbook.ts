// SPDX-License-Identifier: AGPL-3.0-only
// 听写错的拼写词进生词本：直接调生词本小程序的接口（/apps/wordbook/api/v1/words），带社区登录，只能加进自己的生词本。
// 生词本里已经有这个词就不重复加。没登录不加（生词本跟着账号走）。
import { appApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

export type WordbookItem = { text: string; kind: 'word' | 'phrase' | 'idiom' | 'slang' | 'grammar'; meaning: string; usage: string; example: string; exampleZh: string };
const WORDBOOK = '/apps/wordbook/';

// The wordbook's limits on each field.
const clip = (item: WordbookItem): WordbookItem => ({
	text: item.text.trim().slice(0, 256), kind: item.kind, meaning: item.meaning.slice(0, 1024), usage: item.usage.slice(0, 2048),
	example: item.example.slice(0, 1024), exampleZh: item.exampleZh.slice(0, 1024),
});

// Resolves true when the word is new in the wordbook.
export async function addWord(item: WordbookItem, source: 'dictation'): Promise<boolean> {
	if ($i == null) return false;
	const r = await appApi<{ created: boolean }>(WORDBOOK, 'words', { method: 'POST', body: { item: clip(item), source, noteId: null } });
	return r.created;
}
