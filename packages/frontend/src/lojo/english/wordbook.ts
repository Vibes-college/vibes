/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';
import type * as Misskey from 'misskey-js';
import type { EnglishExplanation } from './api.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

// The 生词本 lives on the server (lojo/words/*), so it follows the user across devices. Each word has two review
// cards scheduled with FSRS: 认得 (see it, recall the meaning) and 拼写 (hear it, spell it).
export type WordbookItem = EnglishExplanation['items'][number];
export type WordbookEntry = Misskey.Endpoints['lojo/words/list']['res'][number];
export type WordCard = WordbookEntry['recognize'];
// Where a word came from: a post's explanation, a gate's mistakes, dictation, or typed in by hand.
export type WordSource = Misskey.Endpoints['lojo/words/add']['req']['source'];
export type WordToday = Misskey.Endpoints['lojo/words/today']['res'];
export type WordReviewItem = WordToday['queue'][number];
// 1 忘了 (again), 2 hard, 3 记得 (good), 4 easy
export type WordRating = 1 | 2 | 3 | 4;

export const wordbook = ref<WordbookEntry[]>([]);
// true while the last try to load the list failed, so the page can say so instead of looking empty
export const wordbookFailed = ref(false);

// One spelling of a word per learner, as on the server (misc/lojo-words.ts wordKey).
export function wordKey(text: string): string {
	return text.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

const KINDS: WordbookItem['kind'][] = ['word', 'phrase', 'idiom', 'slang', 'grammar'];

// The server's limits on each field (lojoWordItemParam).
function clip(item: WordbookItem): WordbookItem {
	return {
		text: item.text.trim().slice(0, 256),
		kind: KINDS.includes(item.kind) ? item.kind : 'word',
		meaning: (item.meaning ?? '').slice(0, 1024),
		usage: (item.usage ?? '').slice(0, 2048),
		example: (item.example ?? '').slice(0, 1024),
		exampleZh: (item.exampleZh ?? '').slice(0, 1024),
	};
}

// Before the review cards, saved expressions lived in the account registry. They are moved over once and the old
// key removed; words already on the server are skipped, so a half-finished move can simply run again.
const SCOPE = ['client', 'lojo', 'english'];
const OLD_KEY = 'wordbook';
type OldEntry = WordbookItem & { noteId?: string | null; addedAt?: number; source?: WordSource };

async function moveOldEntries(): Promise<void> {
	let old: unknown;
	try {
		old = await misskeyApi('i/registry/get', { scope: SCOPE, key: OLD_KEY });
	} catch (err) {
		if ((err as { code?: string } | null)?.code === 'NO_SUCH_KEY') return;
		throw err;
	}
	const entries = (Array.isArray(old) ? old as OldEntry[] : [])
		.filter(e => typeof e?.text === 'string' && wordKey(e.text) !== '')
		.map(e => ({
			item: clip(e),
			source: e.source ?? 'post',
			noteId: e.noteId ?? null,
			addedAt: typeof e.addedAt === 'number' ? Math.max(0, Math.round(e.addedAt)) : Date.now(),
		}));
	if (entries.length > 0) await misskeyApi('lojo/words/import', { entries });
	await misskeyApi('i/registry/remove', { scope: SCOPE, key: OLD_KEY });
}

let loading: Promise<void> | null = null;

export function loadWordbook(): Promise<void> {
	if ($i == null) return Promise.resolve();
	// If the move fails (offline, say), the list still loads; the move is tried again on the next load.
	loading ??= moveOldEntries().catch(() => undefined)
		.then(() => misskeyApi('lojo/words/list', {}))
		.then(list => {
			wordbook.value = list;
			wordbookFailed.value = false;
		}, () => {
			wordbookFailed.value = true;
			loading = null;
		});
	return loading;
}

// After a failed write, the server copy is the truth again.
export function reloadWordbook(): Promise<void> {
	loading = null;
	return loadWordbook();
}

function find(text: string): WordbookEntry | undefined {
	const key = wordKey(text);
	return wordbook.value.find(entry => wordKey(entry.text) === key);
}

export function isSaved(text: string): boolean {
	return find(text) != null;
}

// Writes go one at a time so a fast add-then-remove cannot land out of order.
let writing: Promise<unknown> = Promise.resolve();

function serial<T>(write: () => Promise<T>): Promise<T> {
	const next = writing.catch(() => undefined).then(write);
	writing = next;
	return next;
}

async function save(item: WordbookItem, source: WordSource, noteId: string | null): Promise<boolean> {
	const res = await misskeyApi('lojo/words/add', { item: clip(item), source, noteId });
	if (!wordbook.value.some(entry => entry.id === res.word.id)) wordbook.value = [res.word, ...wordbook.value];
	return res.created;
}

// Returns true when the expression is now in the wordbook.
export async function toggleWord(item: WordbookItem, noteId: string | null): Promise<boolean> {
	await loadWordbook();
	return serial(async () => {
		const saved = find(item.text);
		if (saved == null) {
			await save(item, 'post', noteId);
			return true;
		}
		await misskeyApi('lojo/words/remove', { wordId: saved.id });
		wordbook.value = wordbook.value.filter(entry => entry.id !== saved.id);
		return false;
	});
}

// Adds an expression unless it is already saved, e.g. a word missed in dictation. Returns true when it was new.
export async function addWord(item: WordbookItem, source: WordSource, noteId: string | null = null): Promise<boolean> {
	await loadWordbook();
	return serial(async () => isSaved(item.text) ? false : save(item, source, noteId));
}

export async function removeWord(id: string): Promise<void> {
	await serial(() => misskeyApi('lojo/words/remove', { wordId: id }));
	wordbook.value = wordbook.value.filter(entry => entry.id !== id);
}

/* ---------- reviews ---------- */

// Today's queue and counts; the day ends at the learner's own midnight.
export function loadToday(): Promise<WordToday> {
	return misskeyApi('lojo/words/today', { tzOffset: new Date().getTimezoneOffset() });
}

// Sends the card's review count as shown: if a retry finds the review already saved (the reply got lost), the server
// leaves the card alone instead of counting it twice. tzOffset lets FSRS count days by the learner's own midnight.
export async function reviewCard(shown: Pick<WordCard, 'id' | 'reps'>, rating: WordRating, durationMs: number | null): Promise<WordCard> {
	const { card } = await misskeyApi('lojo/words/review', { cardId: shown.id, reps: shown.reps, rating, durationMs, tzOffset: new Date().getTimezoneOffset() });
	// keep the list's due dates current
	wordbook.value = wordbook.value.map(entry => entry.id !== card.wordId ? entry : { ...entry, [card.kind]: card });
	return card;
}

// 导出到 Anki: one note per line, tab-separated: the expression, its meaning and example, and where it came from.
// The header lines tell Anki (2.1.55 and later) the separator and the tags column.
export function wordbookTsv(entries: WordbookEntry[]): string {
	const field = (s: string) => s.replace(/[\t\r\n]+/g, ' ').trim();
	const lines = entries.map(e => {
		const back = [e.meaning, e.usage, e.example, e.exampleZh].map(field).filter(s => s !== '').join('<br>');
		return [field(e.text), back, `vibes ${e.source}`].join('\t');
	});
	return ['#separator:tab', '#html:true', '#tags column:3', ...lines].join('\n') + '\n';
}
