/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 5 号线 · 词汇 on the gate's result page: the words missed in a vocabulary paper, with their meaning, phonetics and
// example from the course pack's word lists (VOCAB in courses/english/ielts/vocab.js), ready for the 生词本.
import { splitWhy } from './answers.js';
import type { GateAttempt, GateResult } from './player.js';
import type { WordbookItem } from '@/lojo/english/wordbook.js';

// The parts of vocab.js read here. alt: other spellings that also count (American ones).
export type VocabWord = { w: string; alt?: string[]; ipa?: string; pos?: string; zh: string; ex?: string };
export type VocabPack = { stops: { id: string; groups: { label: string; words: VocabWord[] }[] }[] };

const norm = (s: string) => s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

// The word lists ship with the IELTS pack only. Loaded when a result needs them, once.
let loading: Promise<VocabPack | null> | null = null;
export function loadVocab(course: string): Promise<VocabPack | null> {
	if (course !== 'ielts') return Promise.resolve(null);
	loading ??= import('@/lojo/route/courses/ielts/vocab.js').then(
		mod => (mod as unknown as { VOCAB?: VocabPack }).VOCAB ?? null,
		() => {
			loading = null;
			return null;
		},
	);
	return loading;
}

// A word in the lists by its spelling (or another spelling that counts): this stop's words first, then the others.
export function findVocabWord(vocab: VocabPack | null, station: string, text: string): VocabWord | null {
	if (vocab == null) return null;
	const key = norm(text);
	const stops = [...vocab.stops.filter(s => s.id === station), ...vocab.stops.filter(s => s.id !== station)];
	for (const stop of stops) {
		for (const group of stop.groups) {
			const found = group.words.find(w => norm(w.w) === key || (w.alt ?? []).some(a => norm(a) === key));
			if (found) return found;
		}
	}
	return null;
}

export type MissedWord = { text: string; why: string | null };

// The words of the vocabulary questions answered wrong, once each, in question order: the word to spell (what was
// expected), or the word whose meaning was asked (the question).
export function missedVocab(result: Pick<GateResult, 'items'>, attempt: Pick<GateAttempt, 'groups'>): MissedWord[] {
	const asked = new Map(attempt.groups.flatMap(group => group.items.flatMap(item => item.n.map(n => [n, { group, item }] as const))));
	const seen = new Set<string>();
	const out: MissedWord[] = [];
	for (const r of [...result.items].sort((a, b) => a.n - b.n)) {
		const at = asked.get(r.n);
		if (r.correct || at == null || at.group.skill !== 'vocab') continue;
		const fromWhy = splitWhy(r.why)?.word ?? '';
		const text = ((at.group.type === 'spell' ? r.expected : r.q ?? at.item.q) || fromWhy).trim();
		if (text === '' || seen.has(norm(text))) continue;
		seen.add(norm(text));
		out.push({ text, why: r.why ?? null });
	}
	return out;
}

// A missed word for the 生词本, with what the word lists say about it; without them, the meaning from its why.
// altText reads the other spellings, e.g. "美式拼法 enroll".
export function vocabWordbookItem(missed: MissedWord, word: VocabWord | null, altText: (alt: string) => string): WordbookItem {
	const text = word?.w ?? missed.text;
	const alt = (word?.alt ?? []).filter(a => norm(a) !== norm(text));
	const usage = [[word?.pos, word?.ipa].filter(x => x != null && x !== '').join(' '), alt.length > 0 ? altText(alt.join(' / ')) : '']
		.filter(x => x !== '').join(' · ');
	return {
		text,
		kind: /\s/.test(text.trim()) ? 'phrase' : 'word',
		meaning: word?.zh ?? splitWhy(missed.why)?.meaning ?? '',
		usage,
		example: word?.ex ?? '',
		exampleZh: '',
	};
}
