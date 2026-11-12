/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 听写's questions: the course file (courses/english/ielts/dictation.js in the Vibes workspace, synced to
// lojo/route/courses/ielts/dictation.js) as typed items, and a gate's missed gaps (carry.ts) as items of the same shape.
import type { Carry, CarriedGap } from './carry.js';
import type { DictLimit, Markable, Verdict } from './mark.js';
import type { WordbookItem } from '@/lojo/english/wordbook.js';
import type { GateReason } from '@/lojo/gates/player.js';

export type Bilingual = { zh: string; en: string };
// live: checked letter by letter while typing, done when right; enter: checked when Enter is pressed.
export type DictMode = 'live' | 'enter';
export type DictNumber = 'pl' | 'sg' | 'unc';
export type InputMode = 'text' | 'tel' | 'decimal';

// limit is the effective word limit (the set's), so markText(item, null, given) marks it as its gate would.
export type DictItem = Markable & {
	id: string;
	// the set it belongs to; a gate's gap: the set of its tag
	setId: string;
	mode: DictMode;
	instructions: Bilingual | null;
	// the line with {} for the gap
	line: string;
	// what the recording reads
	say: string;
	hint: string | null;
	rule: string | null;
	// what takes turns in a round: the kind of a number (phone, date…), or plural / singular / uncountable
	kind: string | null;
	number: DictNumber | null;
	// a singular for a plural, or the other way round
	near: string[];
	inputmode: InputMode;
	// a spelling word: what goes into the wordbook when it is missed
	word: WordbookItem | null;
	// a gap from a gate: what the learner wrote there
	gate: { given: string; reason: GateReason | null } | null;
};

export type DictSet = {
	id: string;
	tag: string;
	name: Bilingual;
	badge: string;
	mode: DictMode;
	limit: DictLimit | null;
	instructions: Bilingual | null;
	blurb: Bilingual;
	how: Bilingual;
	items: DictItem[];
};

export type DictContent = { perRound: number; guide: string; sets: DictSet[] };

// A round being practised: a set's draw, a gate's missed gaps, the 常错 items, or the ones just missed again.
export type RoundKind = 'set' | 'gate' | 'often' | 'retry';
export type RoundResult = { item: DictItem; verdict: Verdict; replays: number };
export type Round = {
	id: number;
	kind: RoundKind;
	// the set "换一组" draws from
	setId: string | null;
	title: string;
	items: DictItem[];
	results: RoundResult[];
	startedAt: number;
	endedAt: number;
	replays: number;
};

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => v != null && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : []);
const bilingual = (v: unknown): Bilingual | null => (isObj(v) && str(v.zh) && str(v.en) ? { zh: v.zh as string, en: v.en as string } : null);
const limitOf = (v: unknown): DictLimit | null => (isObj(v) && typeof v.words === 'number' && typeof v.number === 'boolean' ? { words: v.words, number: v.number } : null);
const NUMBERS: readonly string[] = ['pl', 'sg', 'unc'];

function inputmodeOf(kind: string | null): InputMode {
	if (kind === 'phone') return 'tel';
	if (kind === 'price') return 'decimal';
	return 'text';
}

function toItem(raw: unknown, set: Omit<DictSet, 'items'>): DictItem | null {
	if (!isObj(raw)) return null;
	const id = str(raw.id);
	const answer = strings(raw.answer);
	const line = str(raw.line);
	const say = str(raw.say);
	if (id == null || answer.length === 0 || line == null || !line.includes('{}') || say == null) return null;
	const number = typeof raw.number === 'string' && NUMBERS.includes(raw.number) ? raw.number as DictNumber : null;
	const kind = str(raw.kind) ?? number;
	const hint = str(raw.hint);
	const rule = str(raw.rule);
	const lineZh = str(raw.lineZh);
	return {
		id, setId: set.id, mode: set.mode, instructions: set.instructions, answer, ignoreSpaces: raw.ignoreSpaces === true, limit: set.limit,
		line, say, hint, rule, kind, number, near: strings(raw.near), inputmode: inputmodeOf(kind),
		// a spelling word with its meaning goes into the wordbook with the sentence it was heard in
		word: hint != null && lineZh != null ? {
			text: answer[0], kind: 'word', meaning: hint, usage: rule ?? '', example: line.replace('{}', answer[0]), exampleZh: lineZh,
		} : null,
		gate: null,
	};
}

// The course file's DICTATION; anything malformed is left out (the unit test checks the file itself).
export function toContent(raw: unknown): DictContent {
	const d = isObj(raw) ? raw : {};
	const sets: DictSet[] = [];
	for (const s of Array.isArray(d.sets) ? d.sets : []) {
		if (!isObj(s)) continue;
		const id = str(s.id);
		const name = bilingual({ zh: s.zh, en: s.en });
		if (id == null || name == null) continue;
		const head: Omit<DictSet, 'items'> = {
			id, tag: str(s.tag) ?? id, name, badge: str(s.badge) ?? '', mode: s.mode === 'live' ? 'live' : 'enter',
			limit: limitOf(s.limit), instructions: bilingual(s.instructions),
			blurb: bilingual(s.blurb) ?? { zh: '', en: '' }, how: bilingual(s.how) ?? { zh: '', en: '' },
		};
		const items = (Array.isArray(s.items) ? s.items : []).map(it => toItem(it, head)).filter((it): it is DictItem => it != null);
		if (items.length > 0) sets.push({ ...head, items });
	}
	const perRound = typeof d.perRound === 'number' && d.perRound > 0 ? d.perRound : 10;
	return { perRound, guide: str(d.guide) ?? 'ielts-listening-gaps', sets };
}

// Spelling first: a gap tagged both spelling and numbers is practised as a spelling word unless it has digits.
const DICT_ORDER = ['spelling', 'numbers', 'plural'];

// A word is checked letter by letter; numbers, codes and anything with a space are checked on Enter.
const typedLive = (gap: CarriedGap) => gap.tags.includes('spelling') && !gap.ignoreSpaces && gap.answer.every(a => /^[\p{L}'’-]+$/u.test(a));

function fromGap(gap: CarriedGap, sets: DictSet[]): DictItem {
	const tag = DICT_ORDER.find(t => gap.tags.includes(t)) ?? gap.tags[0];
	const set = sets.find(s => s.tag === tag);
	return {
		id: `gate:${gap.id}`, setId: set?.id ?? tag, mode: typedLive(gap) ? 'live' : 'enter', instructions: gap.instructions,
		answer: gap.answer, ignoreSpaces: gap.ignoreSpaces, limit: gap.limit, line: gap.line ?? '{}', say: gap.say,
		hint: null, rule: null, kind: null, number: null, near: [], inputmode: 'text', word: null,
		gate: { given: gap.given, reason: gap.reason },
	};
}

// The gaps of one tag (or all of them) as items, in the order of the paper.
export function gateItems(carry: Carry, tag: string | null, sets: DictSet[]): DictItem[] {
	return carry.gaps.filter(g => tag == null || g.tags.includes(tag)).map(g => fromGap(g, sets));
}
