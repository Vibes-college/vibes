/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 0 号线 · 机考打字's stops: the course file (courses/english/ielts/typing.js in the Vibes workspace, synced to
// lojo/route/courses/ielts/typing.js) as typed stops. Anything malformed is left out; the unit test checks the file.
import { TYPING } from '@/lojo/route/courses/ielts/typing.js';

export type Bilingual = { zh: string; en: string };
// The targets differ: on a phone stop 4 checks accuracy only and stop 5 is its first sentences.
export type Device = 'desktop' | 'phone';
export type Goal = { wpm: number; acc: number };

// prefix: a sign the paper already prints next to the gap (£), not typed
export type CopyItem = { target: string; prefix: string | null; field: string | null; kind: Bilingual | null };
// hard: the letters people get wrong, underlined the first time
export type SpellItem = { word: string; hard: number[]; zh: string; tip: string; sentence: string };
// hl: what to highlight in the transcript on the result (the answer when there is none)
export type ListenRow = { say: string; note: string; after: string | null; answer: string[]; hl: string | null };

type StopHead = { id: string; n: number; name: Bilingual; short: Bilingual; blurb: Bilingual };
// need: how many must be right to pass; none means the stop passes on accuracy and speed (stop 4)
export type CopyStop = StopHead & { kind: 'copy'; minutes: number; need: number | null; items: CopyItem[] };
export type SpellStop = StopHead & { kind: 'spell'; minutes: number; need: number; items: SpellItem[] };
export type ListenStop = StopHead & {
	kind: 'listen';
	minutes: number;
	need: number;
	title: string;
	intro: string;
	instructions: Bilingual;
	lookSeconds: number;
	gapSeconds: Record<Device, number>;
	rows: ListenRow[];
};
export type MockStop = StopHead & { kind: 'mock'; topic: Bilingual; text: string; seconds: number; phone: { sentences: number; seconds: number } };
export type Stop = CopyStop | SpellStop | ListenStop | MockStop;

export type TypingContent = { line: { n: number; name: Bilingual; color: string }; goal: Goal; stops: Stop[] };

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => v != null && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : []);
const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback);
const bilingual = (v: unknown): Bilingual | null => (isObj(v) && str(v.zh) && str(v.en) ? { zh: v.zh as string, en: v.en as string } : null);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

// "a[cc]o[mm]odation": the word, and the places of the letters in brackets.
export function parseSpell(spell: string): { word: string; hard: number[] } {
	let word = '';
	let inside = false;
	const hard: number[] = [];
	for (const ch of spell) {
		if (ch === '[') inside = true;
		else if (ch === ']') inside = false;
		else {
			if (inside) hard.push(word.length);
			word += ch;
		}
	}
	return { word, hard };
}

function copyItem(v: unknown): CopyItem | null {
	if (!isObj(v) || str(v.target) == null) return null;
	return { target: v.target as string, prefix: str(v.prefix), field: str(v.field), kind: bilingual(v.kind) };
}

function spellItem(v: unknown): SpellItem | null {
	if (!isObj(v)) return null;
	const spell = str(v.spell);
	const zh = str(v.zh);
	const sentence = str(v.sentence);
	if (spell == null || zh == null || sentence == null || !sentence.includes('___')) return null;
	return { ...parseSpell(spell), zh, tip: str(v.tip) ?? '', sentence };
}

function listenRow(v: unknown): ListenRow | null {
	if (!isObj(v)) return null;
	const say = str(v.say);
	const note = str(v.note);
	const answer = strings(v.answer);
	if (say == null || note == null || answer.length === 0) return null;
	return { say, note, after: str(v.after), answer, hl: str(v.hl) };
}

function toStop(v: unknown, n: number): Stop | null {
	if (!isObj(v)) return null;
	const id = str(v.id);
	const name = bilingual({ zh: v.zh, en: v.en });
	if (id == null || name == null) return null;
	const head: StopHead = { id, n, name, short: bilingual(v.short) ?? name, blurb: bilingual(v.blurb) ?? { zh: '', en: '' } };
	const minutes = num(v.minutes, 3);
	if (v.kind === 'copy') {
		const items = list(v.items).map(copyItem).filter((x): x is CopyItem => x != null);
		const need = typeof v.need === 'number' ? Math.min(v.need, items.length) : null;
		return items.length > 0 ? { ...head, kind: 'copy', minutes, need, items } : null;
	}
	if (v.kind === 'spell') {
		const items = list(v.items).map(spellItem).filter((x): x is SpellItem => x != null);
		return items.length > 0 ? { ...head, kind: 'spell', minutes, need: Math.min(num(v.need, items.length), items.length), items } : null;
	}
	if (v.kind === 'listen') {
		const rows = list(v.rows).map(listenRow).filter((x): x is ListenRow => x != null);
		const gap = isObj(v.gapSeconds) ? v.gapSeconds : {};
		const instructions = bilingual(v.instructions) ?? { en: 'Write ONE WORD AND/OR A NUMBER for each answer.', zh: '每空填一个词或一个数字。' };
		if (rows.length === 0) return null;
		return {
			...head, kind: 'listen', minutes, need: Math.min(num(v.need, rows.length), rows.length), title: str(v.title) ?? '', intro: str(v.intro) ?? '',
			instructions, lookSeconds: num(v.lookSeconds, 5), gapSeconds: { desktop: num(gap.desktop, 6), phone: num(gap.phone, 8) }, rows,
		};
	}
	if (v.kind === 'mock') {
		const text = str(v.text);
		const phone = isObj(v.phone) ? v.phone : {};
		if (text == null) return null;
		return {
			...head, kind: 'mock', topic: bilingual(v.topic) ?? { zh: '', en: '' }, text: text.trim(), seconds: num(v.seconds, 360),
			phone: { sentences: num(phone.sentences, 2), seconds: num(phone.seconds, 270) },
		};
	}
	return null;
}

// The course file's TYPING, as typed stops in line order (numbered from 1).
export function toTypingContent(raw: unknown): TypingContent {
	const d = isObj(raw) ? raw : {};
	const line = isObj(d.line) ? d.line : {};
	const goal = isObj(d.goal) ? d.goal : {};
	const stops: Stop[] = [];
	for (const s of list(d.stops)) {
		const stop = toStop(s, stops.length + 1);
		if (stop != null && !stops.some(x => x.id === stop.id)) stops.push(stop);
	}
	return {
		line: { n: typeof line.n === 'number' ? line.n : 0, name: bilingual(line) ?? { zh: '机考打字', en: 'Typing' }, color: str(line.color) ?? '#B4457E' },
		goal: { wpm: num(goal.wpm, 20), acc: num(goal.acc, 95) },
		stops,
	};
}

export const typingContent: TypingContent = toTypingContent(TYPING);
