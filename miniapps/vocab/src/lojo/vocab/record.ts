/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 5 号线 · 词汇's record, without any UI so it can be tested on its own. It lives in the account registry (progress.ts),
// so it follows the learner across devices: for each stop, the words spelled right the first time (learned: no hint,
// no answer shown) and the ones got wrong (missed, until they are spelled right the first time again), and when the stop
// was last practised. Format (docs/vocab-grammar-lines.md): { v: 1, stops: { '5.2': { learned, missed, at } } }.

export type StopWords = { learned: string[]; missed: string[]; at: number };
export type VocabProgress = { v: 1; stops: Partial<Record<string, StopWords>> };
// One answer as it is recorded: a word of a stop (its British spelling, as the course file has it), right the first
// time or not, and when.
export type Mark = { stop: string; word: string; right: boolean; at: number };

export function emptyProgress(): VocabProgress {
	return { v: 1, stops: {} };
}

const isObj = (v: unknown): v is Record<string, unknown> => v != null && typeof v === 'object' && !Array.isArray(v);
const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
const words = (v: unknown): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && x.trim() !== ''))] : []);

// The registry value, as far as it makes sense; anything broken is left out rather than failing the page.
export function toProgress(value: unknown): VocabProgress {
	const p = emptyProgress();
	if (!isObj(value) || !isObj(value.stops)) return p;
	for (const [id, r] of Object.entries(value.stops)) {
		if (!isObj(r)) continue;
		p.stops[id] = { learned: words(r.learned), missed: words(r.missed), at: count(r.at) };
	}
	return p;
}

// The answers on a copy of the record, in order: a word right the first time is learned (for good) and leaves the
// missed ones; a word got wrong is missed. This is how this device's answers are merged into the account's copy before
// it is written back, so whatever another device recorded meanwhile stays.
export function applyMarks(p: VocabProgress, marks: readonly Mark[]): VocabProgress {
	const out = emptyProgress();
	for (const [id, r] of Object.entries(p.stops)) {
		if (r != null) out.stops[id] = { learned: [...r.learned], missed: [...r.missed], at: r.at };
	}
	for (const m of marks) {
		const r = out.stops[m.stop] ?? { learned: [], missed: [], at: 0 };
		if (m.right) {
			if (!r.learned.includes(m.word)) r.learned.push(m.word);
			r.missed = r.missed.filter(w => w !== m.word);
		} else if (!r.missed.includes(m.word)) {
			r.missed.push(m.word);
		}
		r.at = Math.max(r.at, count(m.at));
		out.stops[m.stop] = r;
	}
	return out;
}

export function learnedOf(p: VocabProgress, stop: string): Set<string> {
	return new Set(p.stops[stop]?.learned ?? []);
}

export function missedOf(p: VocabProgress, stop: string): Set<string> {
	return new Set(p.stops[stop]?.missed ?? []);
}
