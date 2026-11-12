/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 5 号线 · 词汇's practice rounds, without any UI: which words the practice tab picks, the order, and what a round
// hands back when it ends.
import type { VocabStop, VocabWord } from './content.js';
import type { PracticeMode } from './prefs.js';

// label: what is practised, under the mode's name ("全部 37 个词", "找房子 6 个词", "刚才错的 3 个")
export type Round = { id: number; mode: PracticeMode; words: VocabWord[]; label: string };

// 看义拼写 / 听音拼写: a word as it was left. first: right the first time, with no hint and the answer not shown;
// last: the last wrong spelling ('' if none).
export type SpellResult = { word: VocabWord; first: boolean; hinted: boolean; revealed: boolean; last: string };
export type SpellEnd = { kind: 'spell'; results: SpellResult[]; ms: number; early: boolean };
// 打字: the words typed to the end, the keys pressed and the wrong ones, wrong keys by word key, and the time from the
// first key to the last word.
export type TypeEnd = { kind: 'typing'; done: number; keys: number; errs: number; errsBy: Record<string, number>; typedMs: number; ms: number; early: boolean };
export type RoundEnd = SpellEnd | TypeEnd;

// What the practice tab has picked: every word, the missed ones, or one group ('g2': the third).
export type Scope = 'all' | 'missed' | `g${number}`;

export function groupOf(scope: string): number | null {
	const m = /^g(\d+)$/.exec(scope);
	return m ? Number(m[1]) : null;
}

// The words of a scope, in the stop's order. A group the stop doesn't have, or no missed words, is every word.
export function scopeWords(stop: VocabStop, scope: string, missed: ReadonlySet<string>): { scope: Scope; words: VocabWord[] } {
	if (scope === 'missed') {
		const words = stop.words.filter(w => missed.has(w.w));
		if (words.length > 0) return { scope: 'missed', words };
	}
	const g = groupOf(scope);
	if (g != null && stop.groups[g] != null) return { scope: `g${g}`, words: stop.groups[g].words };
	return { scope: 'all', words: stop.words };
}

export function shuffled<T>(list: readonly T[], random: () => number = Math.random): T[] {
	const a = list.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

// The words a round got wrong, in the order they came: not right the first time, or typed with a wrong letter.
export function wrongWords(round: Round, end: RoundEnd): VocabWord[] {
	if (end.kind === 'spell') return end.results.filter(r => !r.first).map(r => r.word);
	return round.words.filter(w => (end.errsBy[w.key] ?? 0) > 0);
}

// How many of the round's words were dealt with: answered, or typed to the end.
export function doneCount(end: RoundEnd): number {
	return end.kind === 'spell' ? end.results.length : end.done;
}
