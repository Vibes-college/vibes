/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Gates on a route map (IELTS first): every station is a short test at one band level. Pass it to light the
// station up; passing a later station on the same line lights up the ones before it as well.
// A listening set comes with a recording script, a reading set with a passage and a time limit; an interchange set
// can have both, its listening questions first.
// Question sets are written in the Vibes workspace (courses/<subject>/<course>/gates/, format in its README.md) and
// imported into the database with apps/community/scripts/gates-import.mjs, so answers and scripts stay on the server.
// The vocabulary and grammar lines (5 and 6) have neither: their sets use the types from spell on, marked by the rules
// of the grammar-line demo (docs/vocab-grammar-lines.md in the workspace).

import { speechText } from '@/misc/lojo-voices.js';

export const gateTypes = ['form', 'choice', 'multi', 'map', 'match', 'judge', 'bank', 'spell', 'build', 'fix', 'parse', 'translate'] as const;
export type GateType = typeof gateTypes[number];
// every group of a vocabulary set is vocab, every group of a grammar set grammar
export const gateSkills = ['listening', 'reading', 'vocab', 'grammar'] as const;
export type GateSkill = typeof gateSkills[number];
export type GateLimit = { words: number; number: boolean };
export type GateText = { en: string; zh: string };

// A regular expression of a translate question: gates.mjs turns the literals of the authoring files into this.
export type GateRe = { source: string; flags: string };
// Word positions are indices into tokens(q), from 0; punctuation stays with its word ('cities,').
export type GateSpan = { must: number[]; span: [number, number] };
// any: regular expression fragments ('supermarkets?'), matched as whole words
export type GateMust = { any: string[]; zh: string; en: string; soft: boolean };
// What the vocabulary and grammar types need for marking. Never sent to the browser, nor is the answer.
export type GateItemSpec =
	// q: null; options: []; answer: the word and its other spellings. say: what is read out
	| { kind: 'spell'; say: string }
	// q: the Chinese; options: the chips in the order shown; answer: the accepted orders (lower case, one space between chips)
	| { kind: 'build'; extra: boolean }
	// q: the sentence; options: the corrections to choose from, [] to type one; answer: [the right option], or the accepted words (lower case)
	| { kind: 'fix'; wrong: number }
	// q: the sentence; options: []; answer: []
	| { kind: 'parse'; subj: GateSpan; verb: GateSpan; clauses: [number, number][] }
	// q: the Chinese; options: []; answer: the reference translations
	| {
		kind: 'translate'; focus: string; must: GateMust[]; errors: { re: GateRe; msg: string; replaces: boolean }[];
		structure: { any: GateRe[]; ok: string; miss: string; alt: { re: GateRe; note: string }[] };
		// other answers that must be marked right, and wrong ones that must not: checked on import
		test: { right: string[]; wrong: string[] };
	};
export type GateSpecType = GateItemSpec['kind'];
const specTypes: readonly GateType[] = ['spell', 'build', 'fix', 'parse', 'translate'];

// The imported form: the import script has filled in every default, so nothing here is optional
// but what sets imported before the vocabulary and grammar lines don't have.
export type GateItem = {
	n: number[]; q: string | null; options: string[]; answer: string[]; ignoreSpaces: boolean; limit: GateLimit | null; tags: string[];
	// shown once the paper is handed in: why (vocabulary: 词：意思), and a right sentence (build and fix: the corrected one,
	// translate: the first reference)
	why?: string | null;
	right?: string | null;
	spec?: GateItemSpec | null;
};
// letters: what can be picked, for every type but form and the A–C of choice and multi: map letters, A–H of a box,
// i–x of a list of headings, a passage's paragraph letters, or TRUE / FALSE / NOT GIVEN.
export type GateGroup = {
	type: GateType; instructions: GateText; title: string | null; lines: string[]; limit: GateLimit | null;
	image: string | null; letters: string[]; options: string[]; items: GateItem[];
	// missing on sets imported before reading: listening
	skill?: GateSkill;
};
export type GateScriptLine = { who: string | null; text: string | null; pause: number | null; answers: number[] };
// A paragraph (text, with its letter and heading if it has them) or a figure (image) of a reading passage.
// answers: the questions whose answer is in it, marked once the paper is handed in.
export type GateParagraph = {
	label: string | null; heading: string | null; text: string | null; image: string | null; caption: string | null; answers: number[];
};
export type GatePassage = { title: string; subtitle: string | null; paragraphs: GateParagraph[]; glossary: { word: string; meaning: string }[] };
export type GateSet = {
	id: string; station: string; set: string; band: number; part: number | null; pass: number; total: number;
	voices: Record<string, string>; rate: number; lines: number[]; script: GateScriptLine[]; groups: GateGroup[];
	// reading: the passage, and the minutes for the reading questions (missing on sets imported before reading)
	passage?: GatePassage | null;
	time?: number | null;
};
// A line's placement test: a first part, then a harder or easier second part chosen by its score, and a table from
// the two parts' total to the station the learner starts at. The stages are papers like any set (station 'placement-1').
export type GatePlacementPath = 'high' | 'low';
export type GatePlacement = {
	line: number; next: number;
	place: Record<GatePlacementPath, [number, string][]>;
	stages: { first: GateSet; high: GateSet; low: GateSet };
};
export type GateCourse = {
	id: string;
	title: string;
	lines: { n: number; live: boolean; name: string; stations: string[] }[];
	interchanges: string[][];
	tags: Record<string, GateText>;
	sets: GateSet[];
	// missing on courses imported before placement tests existed
	placements?: GatePlacement[];
};

export type GateReason = 'blank' | 'word-limit' | 'wrong';
// translate: what is right, what to fix (any of it makes the answer wrong), and notes that don't
export type GateFeedback = { good: string[]; fix: string[]; notes: string[] };
// parse: the subject's and verb's words that must be marked, and the clauses (first and last word)
export type GateParseKey = { s: number[]; v: number[]; c: [number, number][] };
// given, expected and accepted of the vocabulary and grammar types: spell as typed; build the sentence the chips make
// (expected: the right sentence); fix and parse in the answer's encoding ('3|is', the parse JSON); translate as written.
export type GateItemResult = {
	n: number; correct: boolean; given: string; expected: string; accepted: string[]; reason: GateReason | null; tags: string[];
	// questions with a why (the vocabulary and grammar sets)
	q?: string | null;
	why?: string | null;
	right?: string | null;
	feedback?: GateFeedback;
	key?: GateParseKey;
};

/* ---------- the paper as the learner sees it: no answers, no tags ---------- */

// How many times a spell question's word may be played.
export const SPELL_PLAYS = 3;

// What each new type adds to a question on the paper: never the answer, what is read out or the rest of the spec.
type PublicExtras = { audio?: string; plays?: number; extra?: boolean; mode?: 'choose' | 'type'; clauses?: boolean; focus?: string };

function publicExtras(item: GateItem, words: ReadonlyMap<number, string>): PublicExtras {
	const spec = item.spec;
	switch (spec?.kind) {
		case 'spell': {
			const audio = words.get(item.n[0]);
			return { ...(audio != null ? { audio } : {}), plays: SPELL_PLAYS };
		}
		case 'build': return { extra: spec.extra };
		case 'fix': return { mode: item.options.length > 0 ? 'choose' : 'type' };
		case 'parse': return { clauses: spec.clauses.length > 0 };
		case 'translate': return { focus: spec.focus };
		default: return {};
	}
}

// words: the recording of each spell question's word by question number, made by LojoGateService before handing out.
export function publicGroups(set: GateSet, imageUrl: (name: string) => string, words: ReadonlyMap<number, string> = new Map()) {
	return set.groups.map(g => ({
		type: g.type,
		skill: g.skill ?? 'listening',
		instructions: g.instructions,
		title: g.title,
		lines: g.lines,
		limit: g.limit,
		image: g.image != null ? imageUrl(g.image) : null,
		letters: g.letters,
		options: g.options,
		items: g.items.map(i => ({
			n: i.n, q: i.q, options: i.options, choose: g.type === 'multi' ? i.answer.length : 1, limit: i.limit,
			...publicExtras(i, words),
		})),
	}));
}

// The passage without what would give answers away: which paragraph holds which answer.
export function publicPassage(set: GateSet): GatePassage | null {
	const p = set.passage;
	return p ? { ...p, paragraphs: p.paragraphs.map(par => ({ ...par, answers: [] })) } : null;
}

/* ---------- marking ---------- */

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
export function overLimit(text: string, limit: GateLimit | null): boolean {
	if (limit == null) return false;
	const tokens = normalizeAnswer(text).split(' ').filter(t => t !== '');
	const numbers = tokens.filter(t => NUMBER_TOKEN.test(t)).length;
	if (!limit.number) return tokens.length > limit.words;
	return tokens.length - numbers > limit.words || numbers > 1;
}

function markText(item: GateItem, groupLimit: GateLimit | null, given: string): { correct: boolean; reason: GateReason | null } {
	const g = normalizeAnswer(given, item.ignoreSpaces);
	if (g === '') return { correct: false, reason: 'blank' };
	if (!item.ignoreSpaces && overLimit(given, item.limit ?? groupLimit)) return { correct: false, reason: 'word-limit' };
	const accepted = item.answer.map(a => normalizeAnswer(a, item.ignoreSpaces));
	// £45 for 45: the currency is already printed next to the gap
	const bare = g.replace(/^[£$€¥]\s*/, '');
	const ok = accepted.includes(g) || (bare !== g && /^\d/.test(bare) && accepted.includes(bare));
	return { correct: ok, reason: ok ? null : 'wrong' };
}

const letterOf = (value: string) => value.normalize('NFKC').trim().toUpperCase();
// One of the group's labels, in any case ('iv' for 'IV'), given back as the label itself; anything else as typed.
const pickOf = (group: GateGroup, value: string) => {
	const v = letterOf(value);
	return group.letters.find(l => l.toUpperCase() === v) ?? v;
};

/* ---------- marking the vocabulary and grammar types: the rules of prototypes/grammar-line/js/mark.js ---------- */

// A sentence for comparing: lower case, plain quotes, short forms written out, no punctuation.
export function norm(s: string): string {
	return s.toLowerCase()
		.replace(/[’‘`´]/g, '\'').replace(/[“”]/g, '"')
		.replace(/\b(there|it|that|what|he|she)'s\b/g, '$1 is')
		.replace(/\b(does|do|did|is|are|was|were|has|have|had)n't\b/g, '$1 not')
		.replace(/\bcan't\b/g, 'can not').replace(/\bcannot\b/g, 'can not').replace(/\bwon't\b/g, 'will not')
		.replace(/'re\b/g, ' are').replace(/'m\b/g, ' am').replace(/'ve\b/g, ' have').replace(/'ll\b/g, ' will')
		.replace(/[^a-z0-9'\- ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
export const word = (s: string) => s.toLowerCase().replace(/[^a-z'\-]/g, '');
// The words of a sentence, as the paper shows them: 'cities,' keeps its comma. The page splits the same way.
export const tokens = (s: string) => s.split(/\s+/).filter(Boolean);
export const bare = (t: string) => t.replace(/^[^A-Za-z0-9(]+|[^A-Za-z0-9)]+$/g, '');

// The chips in the learner's order as a sentence: a capital letter and a full stop.
export function sentence(chips: string[], order: number[]): string {
	const s = order.map(i => chips[i]).join(' ');
	return s ? s.charAt(0).toUpperCase() + s.slice(1) + '.' : '';
}

const numberOf = (part: string): number | null => (/^\d+$/.test(part.trim()) ? Number(part.trim()) : null);

// build: '4,1,3,0,2', the chips in the order picked. null if a number is not a chip's, or comes twice.
export function buildOrder(value: string, chips: number): number[] | null {
	const order = value.split(',').map(numberOf);
	if (order.some(i => i == null || i >= chips)) return null;
	return new Set(order).size === order.length ? order as number[] : null;
}

// fix: '3|is', the wrong word's position and the correction (an option's text, '删掉这个词' too, or what was typed).
export function fixAnswer(value: string): { at: number; fix: string } | null {
	const bar = value.indexOf('|');
	const at = numberOf(bar < 0 ? value : value.slice(0, bar));
	return at == null ? null : { at, fix: bar < 0 ? '' : value.slice(bar + 1).trim() };
}

// parse: '{"s":[3,4],"v":[9],"c":[[3,8]]}', the words marked as the subject and the verb, and each clause's first and
// last word. null if it is not that JSON or a position is not one of the sentence's `words`.
export function parseAnswer(value: string, words: number): GateParseKey | null {
	let a: unknown;
	try {
		a = JSON.parse(value);
	} catch {
		return null;
	}
	if (!isObj(a)) return null;
	const at = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < words;
	const list = (v: unknown): number[] | null => (v === undefined ? [] : allOf(v, at) ? v : null);
	const s = list(a.s), v = list(a.v);
	const c = a.c === undefined ? [] : Array.isArray(a.c) && a.c.every(x => Array.isArray(x) && x.length === 2 && x.every(at)) ? a.c as [number, number][] : null;
	return s && v && c ? { s, v, c } : null;
}

const regex = (re: GateRe) => new RegExp(re.source, re.flags);
const mustSource = (any: string[]) => '\\b(' + any.join('|') + ')\\b';
const mustRegex = (any: string[]) => new RegExp(mustSource(any));

// Founder, 2026-10-29: in a translation, one letter off (one added, missing or changed) in a plain word of `must`
// (letters only, 4 or more) still counts as translated, with a note. Never for fragments such as 'supermarkets?'.
const PLAIN_WORD = /^[a-z]{4,}$/i;

function oneLetterOff(a: string, b: string): boolean {
	if (a === b || Math.abs(a.length - b.length) > 1) return false;
	if (a.length === b.length) {
		let diff = 0;
		for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
		return diff === 1;
	}
	const [short, long] = a.length < b.length ? [a, b] : [b, a];
	let i = 0;
	while (i < short.length && short[i] === long[i]) i++;
	return short.slice(i) === long.slice(i + 1);
}

function misspelt(any: string[], words: string[]): { given: string; meant: string } | null {
	const plain = any.filter(a => PLAIN_WORD.test(a)).map(a => a.toLowerCase());
	for (const given of words) for (const meant of plain) if (oneLetterOff(given, meant)) return { given, meant };
	return null;
}

// The parts of `must` not found in t that a misspelt word stands for. The words it could be are not those that already
// say another part ('best friend' is not 'friends' misspelt), nor those of a mistake in `flagged` ('who lives' is
// grammar, not 'live' misspelt).
function misspellings(must: GateMust[], t: string, flagged: [number, number][]): Map<GateMust, { given: string; meant: string }> {
	const out = new Map<GateMust, { given: string; meant: string }>();
	const unmatched = must.filter(m => !mustRegex(m.any).test(t));
	if (unmatched.length === 0) return out;
	const taken = [...flagged, ...must.flatMap(m => [...t.matchAll(new RegExp(mustSource(m.any), 'g'))].map(x => [x.index, x.index + x[0].length]))];
	const words = [...t.matchAll(/[a-z]+/g)].filter(w => !taken.some(([a, b]) => w.index >= a && w.index + w[0].length <= b)).map(w => w[0]);
	for (const m of unmatched) {
		const typo = misspelt(m.any, words);
		if (typo) out.set(m, typo);
	}
	return out;
}

// The stand-in for AI marking until DeepSeek marks translations: the references, the structure this stop practises
// and the usual mistakes. The errors are looked for first: a grammar mistake is wrong even where a misspelling isn't.
// They, the structure and its alternatives are looked for in the sentence as written and as meant (its misspellings
// put right), so a misspelt word hides no grammar mistake ('are spnd' is 'are spend') and costs no structure.
export function markTranslation(spec: Extract<GateItemSpec, { kind: 'translate' }>, raw: string): { correct: boolean; feedback: GateFeedback } {
	const good: string[] = [], fix: string[] = [], notes: string[] = [];
	if (/[㐀-鿿]/.test(raw)) return { correct: false, feedback: { good, fix: ['要写英文。'], notes } };
	const t = norm(raw);
	if (t.split(' ').length < 4) return { correct: false, feedback: { good, fix: ['句子不完整，写一整句。'], notes } };
	const flagged = spec.errors.flatMap(e => {
		const m = regex(e.re).exec(t);
		return m ? [[m.index, m.index + m[0].length] as [number, number]] : [];
	});
	const typos = misspellings(spec.must, t, flagged);
	const meant = [...typos.values()].reduce((s, x) => s.replace(new RegExp(`\\b${x.given}\\b`, 'g'), x.meant), t);
	const found = (re: GateRe) => regex(re).test(t) || (meant !== t && regex(re).test(meant));
	let replaced = false;
	for (const e of spec.errors) {
		if (found(e.re)) {
			fix.push(e.msg);
			if (e.replaces) replaced = true;
		}
	}
	const st = spec.structure;
	if (st.any.some(re => found(re))) good.push(st.ok);
	else {
		const alt = st.alt.find(x => found(x.re));
		if (alt) notes.push(alt.note);
		else if (!replaced) fix.push(st.miss);
	}
	const missing: GateMust[] = [];
	for (const m of spec.must) {
		if (mustRegex(m.any).test(t)) continue;
		const typo = typos.get(m);
		if (typo) notes.push(`拼写：${typo.given} → ${typo.meant}`);
		else if (m.soft) notes.push(`小提醒：“${m.zh}”也可以译出来，比如 ${m.en}。`);
		else missing.push(m);
	}
	if (missing.length) fix.push('没找到' + missing.map(m => `“${m.zh}”`).join('、') + '的说法，比如 ' + missing.map(m => m.en).join('、') + '。拼写也看一下。');
	else good.push('意思都译出来了。');
	return { correct: fix.length === 0, feedback: { good, fix, notes } };
}

// A whole subject or verb: every word that must be in it, and none outside its span.
const fits = (marks: number[], spec: GateSpan) => marks.length > 0 && spec.must.every(i => marks.includes(i)) && marks.every(i => i >= spec.span[0] && i <= spec.span[1]);

type Mark = Omit<GateItemResult, 'n' | 'tags' | 'q' | 'why' | 'right'>;
const marked = (correct: boolean, given: string, expected: string, accepted: string[], more: Partial<Mark> = {}): Mark => ({
	correct, given, expected, accepted, reason: correct ? null : 'wrong', ...more,
});

function markSpec(item: GateItem, spec: GateItemSpec, value: string): Mark {
	const v = value.trim();
	switch (spec.kind) {
		case 'spell': {
			const { correct, reason } = markText(item, null, value);
			return { correct, given: v, expected: item.answer[0], accepted: item.answer, reason };
		}
		case 'build': {
			const expected = item.right ?? item.answer[0];
			if (v === '') return { ...marked(false, '', expected, item.answer), reason: 'blank' };
			const order = buildOrder(v, item.options.length);
			if (order == null) return marked(false, '', expected, item.answer);
			const said = order.map(i => item.options[i]).join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
			return marked(item.answer.includes(said), sentence(item.options, order), expected, item.answer);
		}
		case 'fix': {
			const expected = `${spec.wrong}|${item.answer[0]}`, accepted = item.answer.map(a => `${spec.wrong}|${a}`);
			if (v === '') return { ...marked(false, '', expected, accepted), reason: 'blank' };
			const a = fixAnswer(v);
			if (a == null || a.at >= tokens(item.q ?? '').length) return marked(false, v, expected, accepted);
			const okFix = item.options.length > 0 ? a.fix === item.answer[0].trim() : a.fix !== '' && item.answer.includes(word(a.fix));
			return marked(a.at === spec.wrong && okFix, v, expected, accepted);
		}
		case 'parse': {
			const key: GateParseKey = { s: spec.subj.must, v: spec.verb.must, c: spec.clauses };
			const expected = JSON.stringify(key);
			const a: GateParseKey | null = v === '' ? { s: [], v: [], c: [] } : parseAnswer(v, tokens(item.q ?? '').length);
			if (a == null) return marked(false, v, expected, [expected], { key });
			if (!a.s.length && !a.v.length && !a.c.length) return { ...marked(false, v, expected, [expected], { key }), reason: 'blank' };
			let okC = true;
			if (spec.clauses.length > 0) {
				const want = spec.clauses.map(x => x.join('-')).sort(), got = a.c.map(x => x.join('-')).sort();
				okC = want.length === got.length && want.every((x, i) => x === got[i]);
			}
			return marked(fits(a.s, spec.subj) && fits(a.v, spec.verb) && okC, v, expected, [expected], { key });
		}
		case 'translate': {
			if (v === '') return { ...marked(false, '', item.answer[0], item.answer), reason: 'blank', feedback: { good: [], fix: [], notes: [] } };
			const { correct, feedback } = markTranslation(spec, value);
			return marked(correct, v, item.answer[0], item.answer, { feedback });
		}
	}
}

// One question with one number. value: what the learner wrote or picked ('' for a blank).
export function markItem(group: GateGroup, item: GateItem, value: string): GateItemResult {
	const n = item.n[0];
	// the vocabulary and grammar sets: the question and why, for going over the answers
	const shown = item.why === undefined && item.right === undefined && item.spec == null ? {} : { q: item.q, why: item.why ?? null, right: item.right ?? null };
	if (group.type === 'form') {
		const { correct, reason } = markText(item, group.limit, value);
		return { n, correct, given: value.trim(), expected: item.answer[0], accepted: item.answer, reason, tags: item.tags, ...shown };
	}
	if (item.spec != null && item.spec.kind === group.type) return { n, ...markSpec(item, item.spec, value), tags: item.tags, ...shown };
	const given = group.type === 'choice' ? letterOf(value) : pickOf(group, value);
	const correct = given !== '' && given === item.answer[0];
	return { n, correct, given, expected: item.answer[0], accepted: item.answer, reason: correct ? null : given === '' ? 'blank' : 'wrong', tags: item.tags, ...shown };
}

export const ANSWER_MAX = 200;
export const TRANSLATION_MAX = 600;

// What the learner handed in, by question number, cut to what is marked: 600 characters of a translation, 200 of the rest.
export function answersOf(set: GateSet, answers: { n: number; value: string }[]): Map<number, string> {
	const long = new Set(set.groups.filter(g => g.type === 'translate').flatMap(g => g.items.flatMap(i => i.n)));
	return new Map(answers.map(a => [a.n, a.value.slice(0, long.has(a.n) ? TRANSLATION_MAX : ANSWER_MAX)]));
}

// answers: question number → what the learner wrote or picked ('' or missing for a blank)
export function markSet(set: GateSet, answers: Map<number, string>): { score: number; items: GateItemResult[] } {
	const items: GateItemResult[] = [];
	for (const group of set.groups) {
		for (const item of group.items) {
			if (group.type === 'multi') {
				// One question with several numbers: each right letter scores once, in any order.
				const unused = new Set(item.answer);
				const picks = item.n.map(n => ({ n, given: letterOf(answers.get(n) ?? '') }));
				const right = picks.map(p => {
					const ok = p.given !== '' && unused.has(p.given);
					if (ok) unused.delete(p.given);
					return ok;
				});
				const missing = [...unused];
				picks.forEach((p, i) => {
					items.push({
						n: p.n, correct: right[i], given: p.given,
						expected: right[i] ? p.given : missing.shift() ?? item.answer[i] ?? '',
						accepted: item.answer, reason: right[i] ? null : p.given === '' ? 'blank' : 'wrong', tags: item.tags,
					});
				});
			} else items.push(markItem(group, item, answers.get(item.n[0]) ?? ''));
		}
	}
	items.sort((a, b) => a.n - b.n);
	return { score: items.filter(i => i.correct).length, items };
}

// 同路人 are the people who tried a gate within this many days.
export const PEER_DAYS = 30;

// The latest birthday (YYYY-MM-DD) of someone who is 18 on `now`: a profile born on or before it is an adult's.
export function adultBirthday(now: Date): string {
	return new Date(Date.UTC(now.getUTCFullYear() - 18, now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10);
}

// Tags of the questions answered wrong, most frequent first: what to practise.
export function weakTags(items: GateItemResult[]): { tag: string; count: number }[] {
	const counts = new Map<string, number>();
	for (const item of items) if (!item.correct) for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
	return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}

/* ---------- the map: which stations are lit ---------- */

export type GateAttemptFact = {
	kind: string; station: string; setId: string; lines: number[]; score: number | null; total: number; passed: boolean | null;
	startedAt: Date; submittedAt: Date | null; weak: { tag: string; count: number }[];
	// placement tests: the station the second part put the learner at
	placedAt: string | null;
};
export type GateStationState = 'passed' | 'open' | 'locked' | 'soon';
export type GateStationProgress = {
	id: string; line: number; gate: string; state: GateStationState;
	sets: number; attempts: number; best: number | null; total: number | null; pass: number | null;
	// reading: minutes for the reading questions
	time: number | null;
	failStreak: number; passedAt: Date | null; via: 'gate' | 'higher' | 'placement' | null;
};

// A paper by its id: a set ('1.3-B') or a placement stage ('placement-1:high').
export function paperOf(course: GateCourse, setId: string): GateSet | null {
	return course.sets.find(s => s.id === setId)
		?? course.placements?.flatMap(p => [p.stages.first, p.stages.high, p.stages.low]).find(s => s.id === setId)
		?? null;
}

export function gateOf(course: GateCourse, id: string): string {
	return course.interchanges.find(pair => pair.includes(id))?.[0] ?? id;
}

export function lineOf(course: GateCourse, id: string): number | null {
	return course.lines.find(l => l.stations.includes(id))?.n ?? null;
}

// Sets that count for station `id` on its own line: an interchange set counts for a line only if it covers it.
export function setsFor(course: GateCourse, id: string): GateSet[] {
	const gate = gateOf(course, id), line = lineOf(course, id);
	return course.sets.filter(s => s.station === gate && line != null && s.lines.includes(line));
}

export const placementStation = (line: number) => `placement-${line}`;

export function placementOf(course: GateCourse, line: number): GatePlacement | null {
	return course.placements?.find(p => p.line === line) ?? null;
}

// The station a placement total leads to: the first row of the path's table the total reaches.
export function placeAt(placement: GatePlacement, path: GatePlacementPath, total: number): string {
	const table = placement.place[path];
	return (table.find(([min]) => total >= min) ?? table[table.length - 1])[1];
}

// Where a placement actually starts the learner: the table's station, or, while that one has no sets yet, the closest
// station before it that has some. Nobody is sent to a stop that only says "coming soon".
export function placedStation(course: GateCourse, placement: GatePlacement, path: GatePlacementPath, total: number): string {
	const station = placeAt(placement, path, total);
	const stations = course.lines.find(l => l.n === placement.line)?.stations ?? [];
	for (let i = stations.indexOf(station); i >= 0; i--) if (setsFor(course, stations[i]).length > 0) return stations[i];
	return station;
}

export function gateProgress(course: GateCourse, attempts: GateAttemptFact[]) {
	const done = attempts.filter(a => a.submittedAt != null).sort((a, b) => a.submittedAt!.getTime() - b.submittedAt!.getTime());
	const stations: GateStationProgress[] = [];
	const lines = course.lines.map(line => {
		// The furthest placement on this line (the first time it was reached): a later, lower one never turns stations off.
		const placed = done.filter(a => a.station === placementStation(line.n) && a.placedAt != null && line.stations.includes(a.placedAt))
			.reduce<GateAttemptFact | null>((b, a) => (b == null || line.stations.indexOf(a.placedAt!) > line.stations.indexOf(b.placedAt!) ? a : b), null);
		const rows = line.stations.map(id => {
			// an interchange keeps one record per line: a listening-only set says nothing about reading
			const gate = gateOf(course, id), here = done.filter(a => a.station === gate && a.lines.includes(line.n));
			const passes = here.filter(a => a.passed);
			const best = here.reduce<GateAttemptFact | null>((b, a) => (b == null || (a.score ?? 0) > (b.score ?? 0) ? a : b), null);
			let failStreak = 0;
			for (let i = here.length - 1; i >= 0 && !here[i].passed; i--) failStreak++;
			const sets = setsFor(course, id);
			return {
				id, line: line.n, gate, sets: line.live ? sets.length : 0, attempts: here.length,
				best: best?.score ?? null, total: best?.total ?? sets[0]?.total ?? null, pass: sets[0]?.pass ?? null, time: sets[0]?.time ?? null, failStreak,
				passedAt: passes[0]?.submittedAt ?? null,
			};
		});
		// Passing a station lights up every station before it on the line.
		let laterPass: Date | null = null;
		const lit = new Map<string, { at: Date; via: 'gate' | 'higher' | 'placement' }>();
		for (let i = rows.length - 1; i >= 0; i--) {
			const r = rows[i];
			if (r.passedAt) {
				lit.set(r.id, { at: r.passedAt, via: 'gate' });
				if (laterPass == null || r.passedAt < laterPass) laterPass = r.passedAt;
			} else if (laterPass) lit.set(r.id, { at: laterPass, via: 'higher' });
		}
		// A placement starts the learner at a station: the ones before it count as passed.
		const placedIndex = placed ? line.stations.indexOf(placed.placedAt!) : -1;
		for (let i = 0; i < placedIndex; i++) if (!lit.has(rows[i].id)) lit.set(rows[i].id, { at: placed!.submittedAt!, via: 'placement' });
		let current: string | null = null;
		for (const r of rows) {
			const l = lit.get(r.id);
			let state: GateStationState;
			if (l) state = 'passed';
			else if (r.sets === 0) state = 'soon';
			else if (current == null) { state = 'open'; current = r.id; } else state = 'locked';
			stations.push({ ...r, state, passedAt: l?.at ?? null, via: l?.via ?? null });
		}
		return {
			line: line.n, live: line.live, current, passed: lit.size, total: rows.length,
			placement: {
				available: line.live && placementOf(course, line.n) != null,
				station: placed?.placedAt ?? null, at: placed?.submittedAt ?? null,
			},
		};
	});
	// Where the learner was last: a gate, or the station a placement put them at (a first part alone says nothing yet).
	const lastAttempt = done.filter(a => a.kind === 'gate' || a.placedAt != null).at(-1);
	return {
		lines, stations,
		last: lastAttempt ? { station: lastAttempt.placedAt ?? lastAttempt.station, at: lastAttempt.submittedAt! } : null,
	};
}

/* ---------- which set to give ---------- */

// A set the learner hasn't heard yet, in order (A, B, C…); once all are used, the one heard longest ago.
export function pickSet(sets: GateSet[], history: { setId: string; startedAt: Date }[]): GateSet | null {
	if (sets.length === 0) return null;
	const lastHeard = new Map<string, number>();
	for (const h of history) lastHeard.set(h.setId, Math.max(lastHeard.get(h.setId) ?? 0, h.startedAt.getTime()));
	const fresh = sets.find(s => !lastHeard.has(s.id));
	if (fresh) return fresh;
	return [...sets].sort((a, b) => lastHeard.get(a.id)! - lastHeard.get(b.id)!)[0];
}

/* ---------- what the AI tutor knows about it ---------- */

const bandText = (b: number) => b.toFixed(1);

// A few lines for the tutor's system prompt: where the learner is on each line and what they keep missing.
export function gateProfileText(course: GateCourse, attempts: GateAttemptFact[]): string | null {
	const done = attempts.filter(a => a.submittedAt != null);
	if (done.length === 0) return null;
	const progress = gateProgress(course, attempts);
	const bandOf = (station: string) => course.sets.find(s => s.station === gateOf(course, station))?.band;
	const out: string[] = [];
	for (const line of progress.lines) {
		const mine = done.filter(a => a.lines.includes(line.line)).sort((a, b) => b.submittedAt!.getTime() - a.submittedAt!.getTime());
		if (mine.length === 0) continue;
		const rows = progress.stations.filter(s => s.line === line.line);
		const top = [...rows].reverse().find(s => s.state === 'passed');
		const parts = [`${course.lines.find(l => l.n === line.line)?.name ?? `Line ${line.line}`}: ${top ? `passed up to the ${bandText(bandOf(top.id) ?? 0)} gate (${top.id})` : 'no gate passed yet'}`];
		if (line.current) parts.push(`next gate ${line.current} (${bandText(bandOf(line.current) ?? 0)})`);
		const placed = line.placement.station != null ? line.placement : null;
		if (placed) parts.push(`the placement test on ${placed.at!.toISOString().slice(0, 10)} started them at ${placed.station} (${bandText(bandOf(placed.station!) ?? 0)})`);
		const recent = mine.filter(a => a.kind === 'gate').slice(0, 3);
		if (recent.length > 0) parts.push(`recent tries: ${recent.map(a => `${a.station} ${a.score}/${a.total}${a.passed ? ' passed' : ''} on ${a.submittedAt!.toISOString().slice(0, 10)}`).join(', ')}`);
		const missed = new Map<string, number>();
		for (const a of recent) for (const w of a.weak) missed.set(w.tag, (missed.get(w.tag) ?? 0) + w.count);
		if (missed.size > 0) {
			parts.push(`often missed: ${[...missed].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag, n]) => `${course.tags[tag]?.en ?? tag} ×${n}`).join(', ')}`);
		}
		out.push(parts.join('; '));
	}
	return out.length > 0 ? out.join('\n') : null;
}

/* ---------- an import, before it reaches the database ---------- */

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => v != null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const allOf = <T>(v: unknown, ok: (x: unknown) => x is T): v is T[] => Array.isArray(v) && v.every(ok);
const isLimit = (v: unknown) => v === null || (isObj(v) && isNum(v.words) && typeof v.number === 'boolean');

const isNullStr = (v: unknown) => v === null || isStr(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isIndex = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;
const isPair = (v: unknown): v is [number, number] => Array.isArray(v) && v.length === 2 && v.every(isIndex);
const compiles = (source: string, flags: string) => {
	try {
		new RegExp(source, flags);
		return true;
	} catch {
		return false;
	}
};
// no g or y: test() would start where the last match ended
const isRe = (v: unknown): v is GateRe => isObj(v) && isStr(v.source) && isStr(v.flags) && !/[gy]/.test(v.flags) && compiles(v.source, v.flags);
const isSpan = (v: unknown): v is GateSpan => isObj(v) && allOf(v.must, isIndex) && isPair(v.span);
const isMust = (v: unknown): v is GateMust => isObj(v) && allOf(v.any, isStr) && v.any.length > 0 && isStr(v.zh) && isStr(v.en) && isBool(v.soft)
	&& compiles(mustSource(v.any), '');

const isSpecType = (type: GateType): type is GateSpecType => specTypes.includes(type);

function isSpec(type: GateSpecType, v: unknown): v is GateItemSpec {
	if (!isObj(v) || v.kind !== type) return false;
	switch (type) {
		case 'spell': return isStr(v.say);
		case 'build': return isBool(v.extra);
		case 'fix': return isIndex(v.wrong);
		case 'parse': return isSpan(v.subj) && isSpan(v.verb) && allOf(v.clauses, isPair);
		case 'translate': {
			const st = v.structure, test = v.test;
			return isStr(v.focus) && allOf(v.must, isMust)
				&& Array.isArray(v.errors) && v.errors.every(e => isObj(e) && isRe(e.re) && isStr(e.msg) && isBool(e.replaces))
				&& isObj(st) && allOf(st.any, isRe) && isStr(st.ok) && isStr(st.miss)
				&& Array.isArray(st.alt) && st.alt.every(a => isObj(a) && isRe(a.re) && isStr(a.note))
				&& isObj(test) && allOf(test.right, isStr) && allOf(test.wrong, isStr);
		}
	}
}

function isItem(type: GateType, v: unknown): v is GateItem {
	if (!(isObj(v) && allOf(v.n, isNum) && v.n.length > 0 && (v.q === null || isStr(v.q)) && allOf(v.options, isStr)
		&& allOf(v.answer, isStr) && typeof v.ignoreSpaces === 'boolean' && isLimit(v.limit) && allOf(v.tags, isStr)
		&& (v.why === undefined || isNullStr(v.why)) && (v.right === undefined || isNullStr(v.right)))) return false;
	if (!isSpecType(type)) return v.answer.length > 0 && (v.spec === undefined || v.spec === null);
	// one number each; a parse question's answer is all in its spec, the others' sentences and chips are in q and options
	return v.n.length === 1 && isSpec(type, v.spec) && (type === 'parse' || v.answer.length > 0)
		&& (type === 'spell' || isStr(v.q)) && (type !== 'build' || v.options.length > 0);
}

function isGroup(v: unknown): v is GateGroup {
	if (!isObj(v) || !(gateTypes as readonly unknown[]).includes(v.type)) return false;
	const type = v.type as GateType;
	return isObj(v.instructions) && isStr(v.instructions.en) && isStr(v.instructions.zh)
		&& (v.title === null || isStr(v.title)) && allOf(v.lines, isStr) && isLimit(v.limit) && (v.image === null || isStr(v.image))
		&& allOf(v.letters, isStr) && allOf(v.options, isStr) && Array.isArray(v.items) && v.items.length > 0 && v.items.every(i => isItem(type, i))
		&& (v.skill === undefined || (gateSkills as readonly unknown[]).includes(v.skill));
}

function isParagraph(v: unknown): v is GateParagraph {
	return isObj(v) && isNullStr(v.label) && isNullStr(v.heading) && isNullStr(v.text) && isNullStr(v.image) && isNullStr(v.caption)
		&& allOf(v.answers, isNum) && (isStr(v.text) || isStr(v.image));
}

function isPassage(v: unknown): v is GatePassage {
	return isObj(v) && isStr(v.title) && isNullStr(v.subtitle) && allOf(v.paragraphs, isParagraph) && v.paragraphs.length > 0
		&& Array.isArray(v.glossary) && v.glossary.every(g => isObj(g) && isStr(g.word) && isStr(g.meaning));
}

function isLine(v: unknown): v is GateScriptLine {
	return isObj(v) && allOf(v.answers, isNum)
		&& ((v.pause === null && isStr(v.who) && isStr(v.text)) || (isNum(v.pause) && v.who === null && v.text === null));
}

function isSet(v: unknown): v is GateSet {
	return isObj(v) && isStr(v.id) && isStr(v.station) && isStr(v.set) && isNum(v.band) && (v.part === null || isNum(v.part))
		&& isNum(v.pass) && isNum(v.total) && isObj(v.voices) && Object.values(v.voices).every(isStr) && isNum(v.rate)
		&& allOf(v.lines, isNum) && allOf(v.script, isLine) && allOf(v.groups, isGroup) && v.groups.length > 0
		&& (v.passage === undefined || v.passage === null || isPassage(v.passage))
		&& (v.time === undefined || v.time === null || (isNum(v.time) && v.time > 0));
}

function isPlacement(v: unknown): v is GatePlacement {
	if (!isObj(v) || !isNum(v.line) || !isNum(v.next) || !isObj(v.place) || !isObj(v.stages)) return false;
	const place = v.place, stages = v.stages;
	const isTable = (rows: unknown) => Array.isArray(rows) && rows.length > 0
		&& rows.every((row: unknown) => Array.isArray(row) && row.length === 2 && isNum(row[0]) && isStr(row[1]));
	return isTable(place.high) && isTable(place.low) && isSet(stages.first) && isSet(stages.high) && isSet(stages.low);
}

// The import script has already checked the content; this only makes sure the shape can't break the server.
export function isGateCourse(v: unknown): v is GateCourse {
	return isObj(v) && isStr(v.id) && isStr(v.title)
		&& Array.isArray(v.lines) && v.lines.every(l => isObj(l) && isNum(l.n) && typeof l.live === 'boolean' && isStr(l.name) && allOf(l.stations, isStr))
		&& Array.isArray(v.interchanges) && v.interchanges.every(p => allOf(p, isStr) && p.length === 2)
		&& isObj(v.tags) && Object.values(v.tags).every(t => isObj(t) && isStr(t.en) && isStr(t.zh))
		&& allOf(v.sets, isSet)
		&& (v.placements === undefined || allOf(v.placements, isPlacement));
}

const papersOf = (course: GateCourse): GateSet[] => [...course.sets, ...(course.placements ?? []).flatMap(p => [p.stages.first, p.stages.high, p.stages.low])];
const where = (paper: string, n: unknown, type: unknown) => `${paper} 第 ${Array.isArray(n) ? n.join('、') : '?'} 题（${String(type)}）`;

// For the error when isGateCourse() turns an import down: which papers, and in them which questions, are not in shape.
export function gateShapeProblems(v: unknown): string[] {
	if (!isObj(v) || !Array.isArray(v.sets)) return ['不是闯关课程：要有 id、title、lines、interchanges、tags、sets'];
	const stages = Array.isArray(v.placements) ? v.placements.flatMap(p => (isObj(p) && isObj(p.stages) ? [p.stages.first, p.stages.high, p.stages.low] : [p])) : [];
	const out: string[] = [];
	for (const paper of [...v.sets, ...stages]) {
		if (isSet(paper)) continue;
		const id = isObj(paper) && isStr(paper.id) ? paper.id : '?';
		const groups = isObj(paper) && Array.isArray(paper.groups) ? paper.groups : [];
		const bad = groups.flatMap(g => (isGroup(g) ? [] : isObj(g) && Array.isArray(g.items) && (gateTypes as readonly unknown[]).includes(g.type)
			? g.items.filter(i => !isItem(g.type as GateType, i)).map(i => `${where(id, isObj(i) ? i.n : null, g.type)}的格式不对`)
			: []));
		out.push(...(bad.length > 0 ? bad : [`${id}：套题或题组的格式不对`]));
	}
	return out.length > 0 ? out : ['课程的格式不对（lines、interchanges、tags 或定级测试）'];
}

// 导入时自检: the vocabulary and grammar questions are marked with the real marking first, as a learner's answers would
// be; an import with any problem is turned down whole. Each problem names the paper (station-set) and the question.
export function gateCourseProblems(course: GateCourse): string[] {
	const out: string[] = [];
	for (const paper of papersOf(course)) {
		for (const group of paper.groups) {
			for (const item of group.items) for (const problem of itemProblems(group, item)) out.push(`${where(paper.id, item.n, group.type)}：${problem}`);
		}
	}
	return out;
}

// The chips that make up an accepted order (lower case, one space between chips), in order; null if they can't.
function chipsFor(chips: string[], accepted: string): number[] | null {
	const texts = chips.map(c => c.toLowerCase().replace(/\s+/g, ' ').trim());
	const order: number[] = [];
	const walk = (rest: string): boolean => {
		if (rest === '') return true;
		for (let i = 0; i < texts.length; i++) {
			const c = texts[i];
			// a chip already used, or the same text as an earlier chip still free: nothing new to try
			if (c === '' || order.includes(i) || texts.findIndex((x, k) => x === c && !order.includes(k)) < i) continue;
			if (rest !== c && !rest.startsWith(c + ' ')) continue;
			order.push(i);
			if (walk(rest.slice(c.length).trim())) return true;
			order.pop();
		}
		return false;
	};
	return walk(accepted.toLowerCase().replace(/\s+/g, ' ').trim()) ? order : null;
}

function itemProblems(group: GateGroup, item: GateItem): string[] {
	const spec = item.spec;
	if (spec == null || spec.kind !== group.type) return [];
	const mark = (value: string) => markItem(group, item, value);
	const out: string[] = [];
	const words = tokens(item.q ?? '').length;
	switch (spec.kind) {
		case 'spell':
			if (speechText(spec.say) === '') out.push('say 是空的，没有要读的词');
			break;
		case 'build':
			for (const a of item.answer) {
				const order = chipsFor(item.options, a);
				if (order == null) out.push(`“${a}”用词块拼不出来`);
				else if (!mark(order.join(',')).correct) out.push(`“${a}”拼出来判成了错（answer 要小写，词块之间一个空格）`);
			}
			break;
		case 'fix':
			if (spec.wrong >= words) out.push(`wrong 是 ${spec.wrong}，句子只有 ${words} 个词（从 0 数）`);
			else if (item.options.length > 0 && !item.options.includes(item.answer[0])) out.push(`改法“${item.answer[0]}”不在选项里`);
			else for (const a of item.options.length > 0 ? [item.answer[0]] : item.answer) if (!mark(`${spec.wrong}|${a}`).correct) out.push(`改法“${a}”判成了错（自己写的改法要小写，只有字母）`);
			break;
		case 'parse': {
			const beyond = [...spec.subj.must, ...spec.subj.span, ...spec.verb.must, ...spec.verb.span, ...spec.clauses.flat()].filter(i => i >= words);
			// the page marks a clause by its first and last word, and one clause can't overlap another
			const clauses = [...spec.clauses].sort((x, y) => x[0] - y[0]);
			if (beyond.length > 0) out.push(`下标 ${[...new Set(beyond)].join('、')} 超出了句子的词数（${words} 个词，从 0 数）`);
			else if (clauses.some(([a, b]) => a > b)) out.push('从句要写成 [第一个词, 最后一个词]');
			else if (clauses.some(([a], i) => i > 0 && a <= clauses[i - 1][1])) out.push('从句互相重叠，页面上标不出来');
			else if (!mark(JSON.stringify({ s: spec.subj.must, v: spec.verb.must, c: spec.clauses })).correct) out.push('用 must 和 clauses 当答案，判成了错（must 要在 span 里面）');
			break;
		}
		case 'translate': {
			const why = (r: GateItemResult) => (r.feedback?.fix.length ? `：${r.feedback.fix.join(' / ')}` : '');
			for (const ref of item.answer) {
				const r = mark(ref);
				if (!r.correct) out.push(`参考答案判成了错：“${ref}”${why(r)}`);
			}
			for (const right of spec.test.right) {
				const r = mark(right);
				if (!r.correct) out.push(`test.right 判成了错：“${right}”${why(r)}`);
			}
			for (const wrong of spec.test.wrong) if (mark(wrong).correct) out.push(`test.wrong 判成了对：“${wrong}”`);
			if (spec.test.wrong.length < 2) out.push(`test.wrong 只有 ${spec.test.wrong.length} 条，至少要 2 条`);
			break;
		}
	}
	return out;
}
