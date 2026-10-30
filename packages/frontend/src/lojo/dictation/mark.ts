/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 听写 marking. normalizeAnswer, overLimit and markText are the gates' own (packages/backend/src/misc/lojo-gates.ts),
// copied line for line so a gap is right here exactly when it is right in a gate: case, extra spaces, curly quotes,
// full-width characters and a final full stop don't matter; phones and postcodes ignore spaces; a currency sign the
// paper already prints may be written or not; over the word limit is wrong. Change both together:
// test/unit/lojo/dictation.test.ts repeats the server's cases (packages/backend/test/unit/LojoGates.ts).
// The rest is dictation's own: checking a word letter by letter as it is typed, and comparing a wrong answer with the
// right one.

export type DictLimit = { words: number; number: boolean };
export type MarkReason = 'blank' | 'word-limit' | 'wrong';
export type Markable = { answer: string[]; ignoreSpaces: boolean; limit: DictLimit | null };

/* ---------- the gates' marking (lojo-gates.ts) ---------- */

// Case, spacing, curly quotes, full-width characters (typed with a Chinese input method) and a final full stop don't matter.
export function normalizeAnswer(text: string, ignoreSpaces = false): string {
	let t = text.normalize('NFKC').toLowerCase()
		.replace(/[‘’ʼ`´]/g, '\'')
		.replace(/[“”]/g, '"')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/[.。]+$/, '')
		.trim();
	if (ignoreSpaces) t = t.replace(/\s/g, '');
	return t;
}

const NUMBER_TOKEN = /^[£$€¥]?\d[\d.,:/]*(?:st|nd|rd|th|am|pm|%)?$/i;

// "ONE WORD AND/OR A NUMBER" is { words: 1, number: true }; a hyphenated word counts as one word.
export function overLimit(text: string, limit: DictLimit | null): boolean {
	if (limit == null) return false;
	const tokens = normalizeAnswer(text).split(' ').filter(t => t !== '');
	const numbers = tokens.filter(t => NUMBER_TOKEN.test(t)).length;
	if (!limit.number) return tokens.length > limit.words;
	return tokens.length - numbers > limit.words || numbers > 1;
}

export function markText(item: Markable, groupLimit: DictLimit | null, given: string): { correct: boolean; reason: MarkReason | null } {
	const g = normalizeAnswer(given, item.ignoreSpaces);
	if (g === '') return { correct: false, reason: 'blank' };
	if (!item.ignoreSpaces && overLimit(given, item.limit ?? groupLimit)) return { correct: false, reason: 'word-limit' };
	const accepted = item.answer.map(a => normalizeAnswer(a, item.ignoreSpaces));
	// £45 for 45: the currency is already printed next to the gap
	const bare = g.replace(/^[£$€¥]\s*/, '');
	const ok = accepted.includes(g) || (bare !== g && /^\d/.test(bare) && accepted.includes(bare));
	return { correct: ok, reason: ok ? null : 'wrong' };
}

/* ---------- checking an answer ---------- */

// The first letter that went wrong while a word was typed: what was typed there, and what fits there instead.
export type Slip = { pos: number; got: string; want: string[] };
// revealed: the learner pressed "看答案" before finishing.
export type VerdictReason = MarkReason | 'revealed';
export type Verdict = {
	correct: boolean;
	reason: VerdictReason | null;
	// A word that went wrong on the way and was put right before it was checked: right, with a note of the slip.
	fixed: Slip | null;
	given: string;
};

// Only what is in the box when it is checked counts (decided 2026-10-29): a typo put right before that is not a
// mistake, only noted as "中间改过".
export function checkAnswer(item: Markable, groupLimit: DictLimit | null, given: string, slip: Slip | null): Verdict {
	const { correct, reason } = markText(item, groupLimit, given);
	return { correct, reason, fixed: correct ? slip : null, given: given.trim() };
}

export function revealed(given: string): Verdict {
	return { correct: false, reason: 'revealed', fixed: null, given: given.trim() };
}

/* ---------- a word, letter by letter ---------- */

// As normalizeAnswer: full-width letters, case and curly quotes (a Chinese input method types ’) don't matter.
const fold = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[‘’ʼ`´]/g, '\'').replace(/[“”]/g, '"');

export type LetterMark = 'ok' | 'bad' | 'space';
export type LiveState = { marks: LetterMark[]; bad: boolean; firstBad: number; empty: boolean; complete: boolean };

// Each typed letter is compared with every accepted spelling that still fits what came before it ("colo" then "u" is
// colour, "r" is color: both right). From the first letter that fits none, it and everything after it are wrong until
// deleted. Spaces before and after don't count. complete: the box holds one of the accepted spellings.
export function liveState(answers: string[], raw: string): LiveState {
	const cands = answers.map(fold);
	const chars = Array.from(raw);
	let lead = 0;
	let end = chars.length;
	while (lead < end && /\s/.test(chars[lead])) lead++;
	while (end > lead && /\s/.test(chars[end - 1])) end--;
	const alive = cands.map(() => true);
	const marks: LetterMark[] = [];
	let pos = 0;
	let broken = false;
	let firstBad = -1;
	for (let i = 0; i < chars.length; i++) {
		if (i < lead || i >= end) {
			marks.push('space');
			continue;
		}
		const c = fold(chars[i]);
		let ok = false;
		if (!broken) {
			cands.forEach((cand, j) => {
				if (alive[j] && cand.slice(pos, pos + c.length) === c) ok = true;
				else alive[j] = false;
			});
		}
		if (ok) {
			marks.push('ok');
			pos += c.length;
		} else {
			if (!broken) firstBad = i - lead;
			broken = true;
			marks.push('bad');
		}
	}
	const typed = fold(chars.slice(lead, end).join(''));
	return { marks, bad: broken, firstBad, empty: typed === '', complete: !broken && cands.includes(typed) };
}

// The first wrong letter: what was typed (`got`) and the letters an accepted spelling has there (`want`).
export function slipOf(answers: string[], raw: string, firstBad: number): Slip {
	const typed = Array.from(raw.trim());
	const before = fold(typed.slice(0, firstBad).join(''));
	const want = [...new Set(answers
		.map(a => Array.from(a))
		.filter(a => fold(a.slice(0, firstBad).join('')) === before && a[firstBad] != null)
		.map(a => a[firstBad]))];
	return { pos: firstBad, got: typed[firstBad] ?? '', want };
}

/* ---------- a wrong answer next to the right one ---------- */

// same: in both; extra: written but not in the answer; miss: in the answer but not written; space: a space of the
// answer that is skipped in the comparison (phones and postcodes).
export type DiffOp =
	| { t: 'same'; a: string; b: string }
	| { t: 'extra'; a: string }
	| { t: 'miss'; b: string }
	| { t: 'space'; b: string };

// A letter-by-letter comparison (longest common subsequence). `common` is how many letters match.
export function diffChars(given: string, expected: string, ignoreSpaces: boolean): { ops: DiffOp[]; common: number } {
	const a = Array.from(ignoreSpaces ? given.replace(/\s/g, '') : given);
	const b = Array.from(expected);
	const eq = (x: string, y: string) => fold(x) === fold(y);
	const bIdx: number[] = [];
	b.forEach((ch, j) => {
		if (!(ignoreSpaces && /\s/.test(ch))) bIdx.push(j);
	});
	const bb = bIdx.map(j => b[j]);
	const n = a.length;
	const m = bb.length;
	const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
	for (let i = n - 1; i >= 0; i--) {
		for (let j = m - 1; j >= 0; j--) dp[i][j] = eq(a[i], bb[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
	}
	const ops: DiffOp[] = [];
	let i = 0;
	let j = 0;
	let k = 0; // walks the whole expected text, spaces included
	const flushSpaces = () => {
		while (k < b.length && ignoreSpaces && /\s/.test(b[k])) ops.push({ t: 'space', b: b[k++] });
	};
	while (i < n || j < m) {
		flushSpaces();
		if (i < n && j < m && eq(a[i], bb[j])) {
			ops.push({ t: 'same', a: a[i], b: bb[j] });
			i++; j++; k++;
		} else if (j >= m || (i < n && dp[i + 1][j] >= dp[i][j + 1])) {
			ops.push({ t: 'extra', a: a[i] });
			i++;
		} else {
			ops.push({ t: 'miss', b: bb[j] });
			j++; k++;
		}
	}
	flushSpaces();
	return { ops, common: dp[0][0] };
}

// Which accepted form to compare a wrong answer with: the one most like it (most letters in common, closest length).
export function closest(answers: string[], given: string, ignoreSpaces: boolean): string {
	let best = answers[0];
	let score = -Infinity;
	for (const ans of answers) {
		const d = diffChars(given, ans, ignoreSpaces);
		const s = d.common * 2 - Math.abs(Array.from(ans).length - Array.from(given).length) * 0.1;
		if (s > score) {
			score = s;
			best = ans;
		}
	}
	return best;
}

// The other accepted forms worth showing, up to `max`: forms that differ only in spaces or the dots of "a.m." count
// as one (9.30am, 9.30 am and 9.30 a.m. show once), and the one the learner wrote is left out.
export function alsoAccepted(answers: string[], typed: string, max: number): string[] {
	const shape = (s: string) => normalizeAnswer(s, true).replace(/([ap])\.m\.?/g, '$1m');
	const seen = new Set([shape(typed)]);
	const out: string[] = [];
	for (const a of answers) {
		const k = shape(a);
		if (seen.has(k) || out.length >= max) continue;
		seen.add(k);
		out.push(a);
	}
	return out;
}

// A singular for a plural (or the other way round): one of the item's near forms.
export function nearMiss(near: string[], given: string): boolean {
	const g = normalizeAnswer(given);
	return g !== '' && near.some(n => normalizeAnswer(n) === g);
}
