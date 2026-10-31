/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 5 号线 · 词汇's spelling rules, without any UI so they can be tested on their own: what counts as the word (its other
// spellings too), where it goes in its example, how a wrong spelling lines up with the right one, the letter a hint
// gives, and copying a word letter by letter (打字).
import type { VocabWord } from './content.js';

type Spelt = Pick<VocabWord, 'w' | 'alt'>;

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// What was typed, tidied the way it is checked: full-width letters as plain ones, single spaces, no full stop or comma
// at the end. Capitals are kept (they are shown).
export function tidyTyped(s: string): string {
	return s.normalize('NFKC').replace(/\s+/g, ' ').trim().replace(/[.!?。，,]+$/, '').trim();
}

// A spelling as it is compared: tidied, any case, straight apostrophes.
export function normWord(s: string): string {
	return tidyTyped(s.replace(/[‘’`]/g, '\'')).toLowerCase();
}

const normChar = (ch: string) => ch.normalize('NFKC').toLowerCase().replace(/[‘’`]/, '\'');
const sameChar = (a: string, b: string) => normChar(a) === normChar(b);

// The spellings that count: the word, then its other spellings.
export function spellingsOf(w: Spelt): string[] {
	return [w.w, ...w.alt];
}

export function isRight(w: Spelt, typed: string): boolean {
	const t = normWord(typed);
	return t !== '' && spellingsOf(w).some(s => normWord(s) === t);
}

// The fewest letters to add, take out or change to turn one into the other (capitals don't matter).
export function editDistance(a: string, b: string): number {
	const x = Array.from(a);
	const y = Array.from(b);
	let prev = Array.from({ length: y.length + 1 }, (_, k) => k);
	for (let i = 1; i <= x.length; i++) {
		const row = [i];
		for (let k = 1; k <= y.length; k++) row[k] = Math.min(prev[k] + 1, row[k - 1] + 1, prev[k - 1] + (sameChar(x[i - 1], y[k - 1]) ? 0 : 1));
		prev = row;
	}
	return prev[y.length];
}

// The spelling a wrong answer is shown against: the closest one, the word itself on a tie (so "neighborhod" is lined
// up with "neighborhood", not "neighbourhood").
export function closestSpelling(w: Spelt, typed: string): string {
	const t = tidyTyped(typed);
	let best = w.w;
	let bestD = editDistance(t, w.w);
	for (const s of w.alt) {
		const d = editDistance(t, s);
		if (d < bestD) {
			best = s;
			bestD = d;
		}
	}
	return best;
}

/* ---------- the word in its example ---------- */

// before + word + suffix + after is the example. word is '' when the example doesn't have it.
export type ExParts = { before: string; word: string; suffix: string; after: string };

// Where the word is in its example, with an ending if it has one (-s, -es, -d, -ed, -ing): to print it in bold, or to
// blank it out in 看义拼写 (the ending stays, so "advert" blanks "adverts" to "____s").
export function exParts(w: Pick<VocabWord, 'w' | 'alt' | 'ex'>): ExParts {
	for (const s of spellingsOf(w)) {
		const m = new RegExp(`\\b(${escRe(s)})(s|es|d|ed|ing)?\\b`, 'i').exec(w.ex);
		if (m) return { before: w.ex.slice(0, m.index), word: m[1], suffix: m[2] ?? '', after: w.ex.slice(m.index + m[0].length) };
	}
	return { before: w.ex, word: '', suffix: '', after: '' };
}

// What "N 个字母" counts: letters only; and how many words, and whether there is a hyphen, which the blank doesn't show.
export function letterInfo(word: string): { letters: number; words: number; hyphen: boolean } {
	const t = word.trim();
	return { letters: Array.from(t.replace(/[^\p{L}]/gu, '')).length, words: t === '' ? 0 : t.split(/\s+/).length, hyphen: t.includes('-') };
}

/* ---------- a wrong spelling against the right one ---------- */

// same / wrong: a letter of the right spelling, typed right or as another letter; extra: typed but not in it; miss:
// left out.
export type SpellOp =
	| { t: 'same'; typed: string; right: string }
	| { t: 'wrong'; typed: string; right: string }
	| { t: 'extra'; typed: string }
	| { t: 'miss'; right: string };

// Letter by letter, the fewest changes from what was typed to the right spelling (edit distance), as the demo marks
// them: what was typed with the wrong and extra letters struck and a gap where one is missing; the right spelling with
// the letters that were got wrong underlined.
export function spellOps(typed: string, right: string): SpellOp[] {
	const a = Array.from(tidyTyped(typed));
	const b = Array.from(right);
	const n = a.length;
	const m = b.length;
	const d = Array.from({ length: n + 1 }, (_, i) => {
		const row = new Array<number>(m + 1).fill(0);
		row[0] = i;
		return row;
	});
	for (let k = 0; k <= m; k++) d[0][k] = k;
	for (let i = 1; i <= n; i++) {
		for (let k = 1; k <= m; k++) d[i][k] = Math.min(d[i - 1][k] + 1, d[i][k - 1] + 1, d[i - 1][k - 1] + (sameChar(a[i - 1], b[k - 1]) ? 0 : 1));
	}
	const ops: SpellOp[] = [];
	let i = n;
	let k = m;
	while (i > 0 || k > 0) {
		if (i > 0 && k > 0 && d[i][k] === d[i - 1][k - 1] + (sameChar(a[i - 1], b[k - 1]) ? 0 : 1)) {
			ops.push({ t: sameChar(a[i - 1], b[k - 1]) ? 'same' : 'wrong', typed: a[i - 1], right: b[k - 1] });
			i--;
			k--;
		} else if (i > 0 && d[i][k] === d[i - 1][k] + 1) {
			ops.push({ t: 'extra', typed: a[i - 1] });
			i--;
		} else {
			ops.push({ t: 'miss', right: b[k - 1] });
			k--;
		}
	}
	return ops.reverse();
}

/* ---------- 提示 ---------- */

// The word up to and including the first letter that what was typed gets wrong or hasn't got to: what a hint puts in
// the box (at: that letter's place, from 0). null when what was typed already starts with the whole word.
export function hintOf(word: string, typed: string): { at: number; text: string } | null {
	const a = Array.from(word);
	const t = Array.from(typed.normalize('NFKC'));
	let k = 0;
	while (k < t.length && k < a.length && sameChar(t[k], a[k])) k++;
	if (k >= a.length) return null;
	return { at: k, text: a.slice(0, k + 1).join('') };
}

/* ---------- 打字: copying the word letter by letter ---------- */

// The box after a key, and what the key did. Only letters of the word that are right stay in the box: a wrong one is
// counted (keys and errs) and taken out again, its place in `bad`; a space where the word has none is skipped. Deleting
// goes back to the last letter that still fits, and isn't counted. Capitals don't matter.
export type TypeStep = { value: string; pos: number; keys: number; errs: number; bad: number | null };

export function typeStep(target: string, pos: number, value: string): TypeStep {
	const t = Array.from(target);
	const v = Array.from(value);
	const done = t.slice(0, pos);
	const kept = v.length >= pos && done.every((ch, k) => sameChar(v[k], ch));
	if (!kept) {
		let k = 0;
		while (k < v.length && k < t.length && sameChar(v[k], t[k])) k++;
		return { value: t.slice(0, k).join(''), pos: k, keys: 0, errs: 0, bad: null };
	}
	let p = pos;
	let keys = 0;
	let errs = 0;
	let bad: number | null = null;
	for (const ch of v.slice(pos)) {
		if (p >= t.length) break;
		if (/\s/.test(ch) && t[p] !== ' ') continue;
		keys++;
		if (sameChar(ch, t[p])) {
			p++;
		} else {
			errs++;
			bad = p;
			break;
		}
	}
	return { value: t.slice(0, p).join(''), pos: p, keys, errs, bad };
}

// 打字's numbers: accuracy over the keys pressed (100 before any), and words a minute since the first key (at least a
// second, so the first word doesn't read 600).
export function typingAccuracy(keys: number, errs: number): number {
	return keys > 0 ? Math.round((keys - errs) / keys * 100) : 100;
}

export function wordsPerMinute(done: number, ms: number): number {
	return done > 0 ? Math.round(done / (Math.max(ms, 1000) / 60000)) : 0;
}
