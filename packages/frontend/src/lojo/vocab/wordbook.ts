/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 5 号线 · 词汇's words going into the 生词本 (source 'vocab'), one at a time or all at once. The wordbook itself is
// lojo/english/wordbook.ts; a word already in it is left alone.
import { ref } from 'vue';
import { vocabLabels } from './labels.js';
import type { VocabWord } from './content.js';
import type { WordbookItem } from '@/lojo/english/wordbook.js';
import { addWord, isSaved } from '@/lojo/english/wordbook.js';

// A word as the wordbook keeps it: the meaning with its part of speech, the IPA (and the American spelling) as how it
// is used, and its example.
export function wordbookItem(w: VocabWord): WordbookItem {
	return {
		text: w.w,
		kind: /\s/.test(w.w) ? 'phrase' : 'word',
		meaning: w.pos !== '' ? `${w.pos} ${w.zh}` : w.zh,
		usage: vocabLabels.wordbookUsage(w.ipa, w.alt),
		example: w.ex,
		exampleZh: '',
	};
}

// words on their way in, by key
export const addingKeys = ref<string[]>([]);

export function inWordbook(w: VocabWord): boolean {
	return isSaved(w.w);
}

// Resolves true when it went in just now (false: it was there already). Rejects when it couldn't be added.
export async function addToWordbook(w: VocabWord): Promise<boolean> {
	if (addingKeys.value.includes(w.key)) return false;
	addingKeys.value = [...addingKeys.value, w.key];
	try {
		return await addWord(wordbookItem(w), 'vocab');
	} finally {
		addingKeys.value = addingKeys.value.filter(k => k !== w.key);
	}
}

// The ones not in the wordbook yet, in order; resolves how many went in. Stops at the first that fails (rejects).
export async function addAllToWordbook(words: VocabWord[]): Promise<number> {
	let added = 0;
	for (const w of words) {
		if (inWordbook(w)) continue;
		if (await addToWordbook(w)) added++;
	}
	return added;
}
