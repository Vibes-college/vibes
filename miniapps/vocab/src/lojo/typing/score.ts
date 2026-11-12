/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 0 号线 · 机考打字's maths, without any UI so it can be tested on its own: speed, accuracy and word count, copying
// letter by letter, what a Chinese keyboard types, a wrong word next to the right one, the mock's marking, the pass
// rules, and what a stop hands in when it ends.
import type { Device, Goal, MockStop } from './content.js';

/* ---------- speed, accuracy, word count ---------- */

// Speed as typing tests count it (decided 2026-10-29): 5 characters make a word, and only correct characters count.
export function wpmOf(right: number, ms: number): number {
	return ms > 0 ? Math.round(right / 5 / (ms / 60000)) : 0;
}

// Accuracy of what was handed in, in whole percent rounded down, so 94.9% is not 95%. A slip put right before an item
// is done doesn't count against it: it only costs time, as in the test. null before anything is typed.
export function accuracyOf(ok: number, total: number): number | null {
	return total > 0 ? Math.floor(ok * 100 / total) : null;
}

// Words as the test's word count shows them: anything between spaces.
export function wordCount(text: string): number {
	const t = text.trim();
	return t === '' ? 0 : t.split(/\s+/).length;
}

/* ---------- copying, letter by letter ---------- */

export type CharMark = 'ok' | 'bad' | 'todo';

// Each letter of the target: typed right, typed wrong, or not typed yet. Capitals and every sign count.
export function charMarks(target: string, typed: string): CharMark[] {
	const y = Array.from(typed);
	return Array.from(target).map((ch, i) => (i >= y.length ? 'todo' : y[i] === ch ? 'ok' : 'bad'));
}

export function okChars(target: string, typed: string): number {
	return charMarks(target, typed).filter(m => m === 'ok').length;
}

// One copied item: what was in the box when it was done, and the time from its first key.
export type Copied = { target: string; typed: string; ms: number };

// A copy stop's totals: the items done (and, while typing, the one under way).
export function copyTotals(items: Copied[]): { ok: number; chars: number; ms: number; acc: number | null; wpm: number } {
	let ok = 0;
	let chars = 0;
	let ms = 0;
	for (const it of items) {
		ok += okChars(it.target, it.typed);
		chars += Array.from(it.typed).length;
		ms += it.ms;
	}
	return { ok, chars, ms, acc: accuracyOf(ok, chars), wpm: wpmOf(ok, ms) };
}

/* ---------- what a Chinese keyboard types ---------- */

const FULL_WIDTH = /[\uFF01-\uFF5E]/g;
const CJK_MARKS = /[\u3000-\u3002]/g;
const HANZI = /[\u3400-\u9FFF]/g;

// The test centre has an English keyboard. Full-width signs (，：（）％) become the English ones, 。 and 、 become . and ,
// and curly quotes, long dashes and no-break spaces plain ones; Chinese characters are taken out. fullWidth / cjk:
// whether there were any.
export function cleanTyped(raw: string, multiline = false): { text: string; fullWidth: boolean; cjk: boolean } {
	let fullWidth = false;
	let text = raw
		.replace(FULL_WIDTH, ch => {
			fullWidth = true;
			return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
		})
		.replace(CJK_MARKS, ch => {
			fullWidth = true;
			return ch === '\u3002' ? '.' : ch === '\u3001' ? ',' : ' ';
		})
		.replace(/[\u2018\u2019\u02BC]/g, '\'')
		.replace(/[\u201C\u201D]/g, '"')
		.replace(/[\u2013\u2014]/g, '-')
		.replace(/\u00A0/g, ' ');
	if (!multiline) text = text.replace(/[\r\n]+/g, '');
	const cjk = /[\u3400-\u9FFF]/.test(text);
	if (cjk) text = text.replace(HANZI, '');
	return { text, fullWidth, cjk };
}

/* ---------- a wrong word next to the right one ---------- */

// same: as in the right word; wrong: a wrong or an extra letter; miss: a letter left out (`ch` is the right one).
export type DiffPart = { t: 'same' | 'wrong' | 'miss'; ch: string };

// The fewest changes that turn what was typed into the right word (edit distance), as parts to paint.
export function charDiff(typed: string, right: string, anyCase = false): DiffPart[] {
	const a = Array.from(typed);
	const b = Array.from(right);
	const same = (x: string, y: string) => (anyCase ? x.toLowerCase() === y.toLowerCase() : x === y);
	const n = a.length;
	const m = b.length;
	const d = Array.from({ length: n + 1 }, (_, i) => {
		const row = new Array<number>(m + 1).fill(0);
		row[0] = i;
		return row;
	});
	for (let k = 0; k <= m; k++) d[0][k] = k;
	for (let i = 1; i <= n; i++) {
		for (let k = 1; k <= m; k++) d[i][k] = Math.min(d[i - 1][k - 1] + (same(a[i - 1], b[k - 1]) ? 0 : 1), d[i - 1][k] + 1, d[i][k - 1] + 1);
	}
	const out: DiffPart[] = [];
	let i = n;
	let k = m;
	while (i > 0 || k > 0) {
		if (i > 0 && k > 0 && d[i][k] === d[i - 1][k - 1] + (same(a[i - 1], b[k - 1]) ? 0 : 1)) {
			out.push({ t: same(a[i - 1], b[k - 1]) ? 'same' : 'wrong', ch: a[i - 1] });
			i--;
			k--;
		} else if (i > 0 && d[i][k] === d[i - 1][k] + 1) {
			out.push({ t: 'wrong', ch: a[i - 1] });
			i--;
		} else {
			out.push({ t: 'miss', ch: b[k - 1] });
			k--;
		}
	}
	return out.reverse();
}

/* ---------- the mock: the words handed in against the text ---------- */

// ok / sub: a word of the text typed right or wrong (s: the text's, t: typed); del: left out; ins: typed but not in it.
export type WordOp =
	| { op: 'ok'; s: string; t: string }
	| { op: 'sub'; s: string; t: string }
	| { op: 'del'; s: string }
	| { op: 'ins'; t: string };

// Word by word, the fewest changes from the text to what was typed. The learner may stop early, so it is compared with
// the part of the text that fits best (the longer part on a tie); `reached` is how many words of the text that is.
export function alignWords(src: string[], typed: string[]): { ops: WordOp[]; reached: number } {
	const n = src.length;
	const m = typed.length;
	const d = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
	for (let j = 0; j <= n; j++) d[j][0] = j;
	for (let x = 0; x <= m; x++) d[0][x] = x;
	for (let j = 1; j <= n; j++) {
		for (let x = 1; x <= m; x++) d[j][x] = Math.min(d[j - 1][x - 1] + (src[j - 1] === typed[x - 1] ? 0 : 1), d[j - 1][x] + 1, d[j][x - 1] + 1);
	}
	let reached = 0;
	for (let j = 0; j <= n; j++) if (d[j][m] <= d[reached][m]) reached = j;
	const ops: WordOp[] = [];
	let j = reached;
	let x = m;
	while (j > 0 || x > 0) {
		if (j > 0 && x > 0 && d[j][x] === d[j - 1][x - 1] + (src[j - 1] === typed[x - 1] ? 0 : 1)) {
			ops.push(src[j - 1] === typed[x - 1] ? { op: 'ok', s: src[j - 1], t: typed[x - 1] } : { op: 'sub', s: src[j - 1], t: typed[x - 1] });
			j--;
			x--;
		} else if (j > 0 && d[j][x] === d[j - 1][x] + 1) {
			ops.push({ op: 'del', s: src[j - 1] });
			j--;
		} else {
			ops.push({ op: 'ins', t: typed[x - 1] });
			x--;
		}
	}
	return { ops: ops.reverse(), reached };
}

// Letters and digits only: "libraries," and "Libraries." are the same word with other signs or capitals.
const bare = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');

export type WordPair = { typed: string; right: string };
export type MockScore = {
	acc: number;
	wpm: number;
	// words typed (after a time-up, the one still being typed is left out); words of the text
	words: number;
	total: number;
	// the whole text was typed, to its last word give or take mistakes; left: words of it not reached
	covered: boolean;
	left: number;
	spell: WordPair[];
	punct: WordPair[];
	missed: string[];
	extra: string[];
};

// After hand-in: accuracy over the words compared; speed over the words typed right (each with its space), from the
// first key to the last; the mistakes by kind.
export function scoreMock(text: string, typedText: string, typedMs: number, timeUp: boolean): MockScore {
	const src = text.trim().split(/\s+/);
	let words = typedText.trim() === '' ? [] : typedText.trim().split(/\s+/);
	// time up in the middle of a word: that word was not finished
	if (timeUp && words.length > 0 && words.length < src.length && !/\s$/.test(typedText)) words = words.slice(0, -1);
	const { ops, reached } = alignWords(src, words);
	let good = 0;
	let okLetters = 0;
	const spell: WordPair[] = [];
	const punct: WordPair[] = [];
	const missed: string[] = [];
	const extra: string[] = [];
	for (const o of ops) {
		if (o.op === 'ok') {
			good++;
			okLetters += Array.from(o.s).length + 1;
		} else if (o.op === 'sub') {
			(bare(o.s) === bare(o.t) ? punct : spell).push({ typed: o.t, right: o.s });
		} else if (o.op === 'del') {
			missed.push(o.s);
		} else {
			extra.push(o.t);
		}
	}
	const covered = words.length > 0 && reached === src.length;
	return {
		acc: accuracyOf(good, ops.length) ?? 0,
		wpm: wpmOf(okLetters, typedMs),
		words: words.length,
		total: src.length,
		covered,
		left: src.length - reached,
		spell,
		punct,
		missed,
		extra,
	};
}

// Sentences, each with its full stop (or ? or !).
export function sentencesOf(text: string): string[] {
	return (text.match(/[^.!?]+(?:[.!?]+|$)/g) ?? []).map(s => s.trim()).filter(s => s !== '');
}

// What the mock asks for on this device: the whole text on a computer; its first sentences on a phone.
export function mockPlan(stop: MockStop, device: Device): { text: string; seconds: number } {
	if (device === 'desktop') return { text: stop.text, seconds: stop.seconds };
	return { text: sentencesOf(stop.text).slice(0, stop.phone.sentences).join(' '), seconds: stop.phone.seconds };
}

// The word of the text the learner is on: the one being typed, or the next one after a space.
export function wordAt(typedText: string, total: number): number {
	const n = wordCount(typedText);
	const at = /\s$/.test(typedText) || n === 0 ? n : n - 1;
	return Math.max(0, Math.min(total - 1, at));
}

// The whole text is in: as many words as it has, the last one right.
export function typedToEnd(text: string, typedText: string): boolean {
	const src = text.trim().split(/\s+/);
	const words = typedText.trim().split(/\s+/);
	return words.length >= src.length && words[src.length - 1] === src[src.length - 1];
}

/* ---------- pass rules ---------- */

// score: items right of `need` (stops 1–3); acc and wpm (stops 4, 5): `counted` is false for speed on a phone, shown but
// not needed; covered: the mock typed to its end in time (`left` words not reached).
export type Check =
	| { what: 'score'; ok: boolean; value: number; need: number }
	| { what: 'acc'; ok: boolean; value: number; need: number }
	| { what: 'wpm'; ok: boolean; value: number; need: number; counted: boolean }
	| { what: 'covered'; ok: boolean; left: number };
export type Judged = { pass: boolean; checks: Check[] };

// Stops 1–3: enough of them right.
export function judgeCount(score: number, need: number): Judged {
	const ok = score >= need;
	return { pass: ok, checks: [{ what: 'score', ok, value: score, need }] };
}

// Stop 4: accuracy; on a computer speed too. On a phone the speed is shown but doesn't count.
export function judgeSpeed(acc: number, wpm: number, device: Device, goal: Goal): Judged {
	const accOk = acc >= goal.acc;
	const wpmOk = wpm >= goal.wpm;
	const counted = device === 'desktop';
	return {
		pass: accOk && (wpmOk || !counted),
		checks: [{ what: 'acc', ok: accOk, value: acc, need: goal.acc }, { what: 'wpm', ok: wpmOk, value: wpm, need: goal.wpm, counted }],
	};
}

// Stop 5: all of it typed in time (the device's part of it), accurately enough.
export function judgeMock(mock: MockScore, goal: Goal): Judged {
	const accOk = mock.acc >= goal.acc;
	return {
		pass: mock.covered && accOk,
		checks: [{ what: 'covered', ok: mock.covered, left: mock.left }, { what: 'acc', ok: accOk, value: mock.acc, need: goal.acc }],
	};
}

/* ---------- what a stop hands in ---------- */

// ms: time in the stop, on screen only (practice time); score / total: items right, for stops 1–3.
type TryHead = {
	stop: string;
	device: Device;
	pass: boolean;
	checks: Check[];
	ms: number;
	acc: number;
	wpm: number;
	score: number | null;
	total: number | null;
};
// what was typed for each item, in order
export type CopyTry = TryHead & { kind: 'copy'; typed: string[] };
export type SpellTry = TryHead & { kind: 'spell'; typed: string[]; right: boolean[] };
// reasons: why a gap was wrong ('blank', 'word-limit', 'wrong'); captions: the recording was replaced by captions
export type ListenTry = TryHead & { kind: 'listen'; given: string[]; right: boolean[]; reasons: (string | null)[]; captions: boolean };
// typedMs: first key to last; limitS: the time limit; timeUp: handed in by the clock
export type MockTry = TryHead & { kind: 'mock'; mock: MockScore; typedMs: number; limitS: number; timeUp: boolean };
export type StopTry = CopyTry | SpellTry | ListenTry | MockTry;
