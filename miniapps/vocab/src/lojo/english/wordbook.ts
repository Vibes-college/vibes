// SPDX-License-Identifier: AGPL-3.0-only
// 词汇里的词进生词本：直接调生词本小程序的接口（/apps/wordbook/api/v1/words），带社区登录，只能加进自己的生词本。
// 页面要标出「已在生词本」，所以先把自己的生词列一遍（最多 2000 个，生词本的上限）。没登录不加也不列。
import { ref } from 'vue';
import { appApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

export type WordbookItem = { text: string; kind: 'word' | 'phrase' | 'idiom' | 'slang' | 'grammar'; meaning: string; usage: string; example: string; exampleZh: string };
const WORDBOOK = '/apps/wordbook/';

// the saved words, as wordKey; reactive so the page marks them
export const savedKeys = ref<Set<string>>(new Set());
export const wordbookFailed = ref(false);

// One spelling of a word per learner, as the wordbook keys it.
export function wordKey(text: string): string {
	return text.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

const clip = (item: WordbookItem): WordbookItem => ({
	text: item.text.trim().slice(0, 256), kind: item.kind, meaning: item.meaning.slice(0, 1024), usage: item.usage.slice(0, 2048),
	example: item.example.slice(0, 1024), exampleZh: item.exampleZh.slice(0, 1024),
});

let loading: Promise<void> | null = null;

export function loadWordbook(): Promise<void> {
	if ($i == null) return Promise.resolve();
	loading ??= appApi<{ items: { text: string }[] }>(WORDBOOK, 'words?limit=2000').then(r => {
		savedKeys.value = new Set(r.items.map(w => wordKey(w.text)));
		wordbookFailed.value = false;
	}, () => {
		wordbookFailed.value = true;
		loading = null;
	});
	return loading;
}

export function isSaved(text: string): boolean {
	return savedKeys.value.has(wordKey(text));
}

// Resolves true when the word is new in the wordbook (false: it was there already).
export async function addWord(item: WordbookItem, source: 'vocab'): Promise<boolean> {
	if ($i == null) return false;
	const r = await appApi<{ created: boolean }>(WORDBOOK, 'words', { method: 'POST', body: { item: clip(item), source, noteId: null } });
	savedKeys.value = new Set([...savedKeys.value, wordKey(item.text)]);
	return r.created;
}
