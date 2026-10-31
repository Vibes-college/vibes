/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The question types of the vocabulary and grammar lines (5 号线、6 号线, docs/vocab-grammar-lines.md): how each answer
// goes to the server as one string, how the page changes it, and how the review reads it back. No UI, so it can be tested.

export const NEW_TYPES = ['spell', 'build', 'fix', 'parse', 'translate'] as const;
export type NewType = typeof NEW_TYPES[number];
export const isNewType = (type: string): type is NewType => (NEW_TYPES as readonly string[]).includes(type);

// A word to spell can be heard this many times, unless the paper says otherwise.
export const DEFAULT_PLAYS = 3;
// The server keeps 600 characters of a translation, and 200 of any other answer.
export const TRANSLATE_MAX = 600;

/* ---------- Words ---------- */

// The server's split (tokens() in lojo-gates.ts): a word's position counts the words this gives, and a word keeps its
// punctuation ("cities,").
export const tokens = (s: string | null | undefined): string[] => String(s ?? '').split(/\s+/).filter(Boolean);

// A word without the punctuation around it: "cities," → "cities"; "didn't" and "(2015)" stay as they are.
export const bare = (t: string): string => t.replace(/^[^A-Za-z0-9(]+|[^A-Za-z0-9)]+$/g, '');

export const capitalized = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

// Chips in order as a sentence, the way the server shows it: a capital first letter and a full stop.
export function sentence(chips: readonly string[], order: readonly number[]): string {
	const s = order.map(i => chips[i]).filter(c => c != null).join(' ');
	return s ? `${capitalized(s)}.` : '';
}

/* ---------- build: 连词成句 ---------- */

// The chips tapped, in order, by their place in the paper's list: "4,1,3,0,2". None is ''.
export const encodeBuild = (order: readonly number[]): string => order.join(',');

// Back from the string; anything not a chip of the item, or a chip already used, is left out.
export function decodeBuild(value: string | null | undefined, chips: number): number[] {
	const order: number[] = [];
	for (const part of (value ?? '').split(',')) {
		const t = part.trim();
		if (!/^\d+$/.test(t)) continue;
		const i = Number(t);
		if (i < chips && !order.includes(i)) order.push(i);
	}
	return order;
}

// A chip from the box goes at the end of the sentence; a chip in the sentence goes back to the box.
export const placeChip = (order: readonly number[], chip: number): number[] => (order.includes(chip) ? [...order] : [...order, chip]);
export const takeBackChip = (order: readonly number[], at: number): number[] => order.filter((_, k) => k !== at);

/* ---------- fix: 找错改错 ---------- */

// at: the place of the word picked as wrong. fix: the words of the option picked ("删掉这个词" is an option too), or
// the word typed.
export type FixAnswer = { at: number | null; fix: string };

// "3|is". A word picked without its fix yet is "3|"; nothing picked is ''.
export const encodeFix = (a: FixAnswer): string => (a.at == null ? '' : `${a.at}|${a.fix}`);

export function decodeFix(value: string | null | undefined): FixAnswer {
	const m = /^(\d+)\|([\s\S]*)$/.exec(value ?? '');
	return m ? { at: Number(m[1]), fix: m[2] } : { at: null, fix: '' };
}

// Picking another word starts its fix over.
export const pickFixWord = (a: FixAnswer, at: number): FixAnswer => (a.at === at ? a : { at, fix: '' });

/* ---------- parse: 拆句 ---------- */

// Word places: s the subject, v the verb, c each clause as its first and last word.
export type ParseMarks = { s: number[]; v: number[]; c: [number, number][] };
export type ParseMode = 's' | 'v' | 'c';
export const noMarks = (): ParseMarks => ({ s: [], v: [], c: [] });

const ascending = (xs: readonly number[]): number[] => [...new Set(xs)].sort((a, b) => a - b);
const isPlace = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 0;
const byStart = (a: [number, number], b: [number, number]) => a[0] - b[0] || a[1] - b[1];

// {"s":[3,4],"v":[9],"c":[[3,8]]}. Nothing marked is ''.
export function encodeParse(m: ParseMarks): string {
	if (m.s.length === 0 && m.v.length === 0 && m.c.length === 0) return '';
	const c = m.c.map(([x, y]): [number, number] => [x, y]).sort(byStart);
	return JSON.stringify({ s: ascending(m.s), v: ascending(m.v), c });
}

export function decodeParse(value: string | null | undefined): ParseMarks {
	let raw: unknown;
	try {
		raw = JSON.parse(value ?? '');
	} catch {
		return noMarks();
	}
	if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return noMarks();
	const o = raw as Record<string, unknown>;
	const places = (x: unknown) => (Array.isArray(x) ? ascending(x.filter(isPlace)) : []);
	const c = (Array.isArray(o.c) ? o.c : [])
		.filter((p): p is [number, number] => Array.isArray(p) && p.length === 2 && isPlace(p[0]) && isPlace(p[1]) && p[0] <= p[1])
		.map(([x, y]): [number, number] => [x, y])
		.sort(byStart);
	return { s: places(o.s), v: places(o.v), c };
}

// The right marks as the result gives them (key: subj.must, verb.must and the clauses), in the same shape.
export function keyMarks(key: { s?: number[] | null; v?: number[] | null; c?: number[][] | null } | null | undefined): ParseMarks | null {
	if (key == null) return null;
	return decodeParse(JSON.stringify({ s: key.s ?? [], v: key.v ?? [], c: key.c ?? [] }));
}

// One tap on word i. 主语 and 谓语 put the mark on or take it off, and a word is never both. 从句: the first tap starts a
// clause and the second ends it (either way round); with none started, a tap inside a clause takes that clause away.
// A new clause replaces the ones it overlaps.
export function tapParse(marks: ParseMarks, mode: ParseMode, i: number, pending: number | null): { marks: ParseMarks; pending: number | null } {
	if (mode === 's' || mode === 'v') {
		const other = mode === 's' ? 'v' : 's';
		if (marks[mode].includes(i)) return { marks: { ...marks, [mode]: marks[mode].filter(x => x !== i) }, pending };
		return { marks: { ...marks, [mode]: ascending([...marks[mode], i]), [other]: marks[other].filter(x => x !== i) }, pending };
	}
	if (pending == null) {
		const hit = marks.c.findIndex(([x, y]) => i >= x && i <= y);
		if (hit >= 0) return { marks: { ...marks, c: marks.c.filter((_, k) => k !== hit) }, pending: null };
		return { marks, pending: i };
	}
	const [x, y] = pending <= i ? [pending, i] : [i, pending];
	const c = [...marks.c.filter(([p, r]) => r < x || p > y), [x, y] as [number, number]].sort(byStart);
	return { marks: { ...marks, c }, pending: null };
}

// The clause a word is in, if any.
export const clauseAt = (marks: ParseMarks, i: number): [number, number] | null => marks.c.find(([x, y]) => i >= x && i <= y) ?? null;

// The marked words, e.g. for "主语：the share；谓语：rose".
export function markedWords(toks: readonly string[], marks: ParseMarks): { s: string; v: string; c: string[] } {
	const words = (places: number[]) => places.map(i => toks[i]).filter(t => t != null).map(bare).join(' ');
	return { s: words(marks.s), v: words(marks.v), c: marks.c.map(([x, y]) => toks.slice(x, y + 1).map(bare).join(' ')) };
}

/* ---------- Answered or not ---------- */

// Whether a question counts as answered before handing in: a fix needs its word and its change; a parse its subject
// and verb, and a clause when it asks for clauses. Anything else, when it isn't blank.
export function answerDone(type: NewType, value: string | null | undefined, item: { clauses?: boolean | null } = {}): boolean {
	const v = (value ?? '').trim();
	if (v === '') return false;
	if (type === 'build') return decodeBuild(v, Number.MAX_SAFE_INTEGER).length > 0;
	if (type === 'fix') {
		const a = decodeFix(v);
		return a.at != null && a.fix.trim() !== '';
	}
	if (type === 'parse') {
		const m = decodeParse(v);
		return m.s.length > 0 && m.v.length > 0 && (item.clauses !== true || m.c.length > 0);
	}
	return true;
}

/* ---------- The review ---------- */

// A built sentence as handed back. The server shows it as a sentence already; the chip places ("4,1,3") are read too.
export function buildGiven(given: string, chips: readonly string[]): string {
	return /^\d+(\s*,\s*\d+)*$/.test(given.trim()) ? sentence(chips, decodeBuild(given, chips.length)) : given;
}

// A fix as handed in ("3|is"), read against its sentence: the word picked and what it became (it may be '').
// null when the server sent something else, to show as it is.
export function fixGiven(q: string | null | undefined, given: string): { word: string; fix: string } | null {
	const a = decodeFix(given);
	if (a.at == null) return null;
	const word = tokens(q)[a.at];
	return word == null ? null : { word: bare(word), fix: a.fix.trim() };
}

// Where the sentence with the mistake and the corrected one differ, as word ranges [from, to): the wrong word in the
// first and its fix in the second (an empty range when the fix took a word out).
export function fixDiff(q: string, right: string): { wrong: [number, number]; fixed: [number, number] } {
	const a = tokens(q), b = tokens(right);
	let p = 0;
	while (p < a.length && p < b.length && a[p] === b[p]) p++;
	let s = 0;
	while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
	return { wrong: [p, a.length - s], fixed: [p, b.length - s] };
}

// A grammar choice's sentence on both sides of its gap ("So far this month, they ___ four reports."), so the pick can
// stand in it. null when it has no gap.
export function blankParts(q: string | null | undefined): [string, string] | null {
	const m = /_{3,}/.exec(q ?? '');
	if (m == null || q == null) return null;
	return [q.slice(0, m.index), q.slice(m.index + m[0].length)];
}

// A vocabulary question's why is "词：意思" ("enrol：注册；报名（课程）").
export function splitWhy(why: string | null | undefined): { word: string; meaning: string } | null {
	const m = /^([^：:]+)[：:]\s*([\s\S]*)$/.exec((why ?? '').trim());
	return m ? { word: m[1].trim(), meaning: m[2].trim() } : null;
}
