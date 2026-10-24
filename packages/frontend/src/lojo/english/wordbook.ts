/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';
import type { EnglishExplanation } from './api.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

// Saved expressions live in the account registry, so they follow the user across devices.
export type WordbookEntry = EnglishExplanation['items'][number] & {
	id: string;
	noteId: string | null;
	addedAt: number;
};

const SCOPE = ['client', 'lojo', 'english'];
const KEY = 'wordbook';
const MAX_ENTRIES = 500;

export const wordbook = ref<WordbookEntry[]>([]);

let loading: Promise<void> | null = null;

export function loadWordbook(): Promise<void> {
	if ($i == null) return Promise.resolve();
	loading ??= misskeyApi('i/registry/get', { scope: SCOPE, key: KEY }).then(value => {
		wordbook.value = Array.isArray(value) ? value as WordbookEntry[] : [];
	}, err => {
		// A new account has no key yet; anything else is retried on the next call.
		if ((err as { code?: string } | null)?.code === 'NO_SUCH_KEY') wordbook.value = [];
		else loading = null;
	});
	return loading;
}

const norm = (text: string) => text.trim().toLowerCase();

export function isSaved(text: string): boolean {
	return wordbook.value.some(entry => norm(entry.text) === norm(text));
}

// Writes go one at a time so a fast add-then-remove cannot land out of order.
let writing: Promise<unknown> = Promise.resolve();

function persist(): Promise<unknown> {
	const value = wordbook.value.slice();
	writing = writing.catch(() => undefined).then(() => misskeyApi('i/registry/set', { scope: SCOPE, key: KEY, value }));
	return writing;
}

// Returns true when the expression is now in the wordbook.
export async function toggleWord(item: EnglishExplanation['items'][number], noteId: string | null): Promise<boolean> {
	await loadWordbook();
	if (isSaved(item.text)) {
		wordbook.value = wordbook.value.filter(entry => norm(entry.text) !== norm(item.text));
		await persist();
		return false;
	}
	const entry: WordbookEntry = {
		...item,
		id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
		noteId,
		addedAt: Date.now(),
	};
	wordbook.value = [entry, ...wordbook.value].slice(0, MAX_ENTRIES);
	await persist();
	return true;
}

export async function removeWord(id: string): Promise<void> {
	wordbook.value = wordbook.value.filter(entry => entry.id !== id);
	await persist();
}

// After a failed write, the server copy is the truth again.
export function reloadWordbook(): Promise<void> {
	loading = null;
	return loadWordbook();
}
