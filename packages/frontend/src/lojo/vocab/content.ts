/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 5 号线 · 词汇's stops: the course file (courses/english/ielts/vocab.js in the Vibes workspace, synced to
// lojo/route/courses/ielts/vocab.js) as typed stops. Anything malformed is left out; the unit test checks the file.
import { VOCAB } from '@/lojo/route/courses/ielts/vocab.js';
import { LINES } from '@/lojo/route/courses/ielts/content.js';

// A word as the course file has it, British spelling first. alt: other spellings that count (American).
export type VocabWord = {
	w: string;
	alt: string[];
	ipa: string;
	pos: string;
	zh: string;
	ex: string;
	// its stop, and the place of its group in the stop
	stop: string;
	group: number;
	// unique on the line, e.g. "5.2:accommodation"
	key: string;
};

export type VocabGroup = { label: string; color: string; words: VocabWord[] };

export type VocabStop = {
	id: string;
	band: number;
	topic: string;
	en: string;
	level: string;
	fit: string;
	lede: string;
	// the listening and reading stops the words are used in, by id ("1.2")
	uses: string[];
	groups: VocabGroup[];
	// every word, group by group
	words: VocabWord[];
};

// A stop's gate (/gate/ielts/5.2): its questions, how many of each kind, how many to pass, and plays per word.
export type VocabGate = { total: number; spell: number; choose: number; pass: number; plays: number };

export type VocabContent = { line: number; color: string; gate: VocabGate; stops: VocabStop[] };

// A group's colour bar: the other lines' colours on the route map, never this line's own purple.
export const GROUP_COLORS = ['#E8603F', '#3F8F86', '#B8871B', '#2340A3', '#B4457E', '#2F5D4A', '#5C6F91'];

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => v != null && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).filter((x): x is string => x != null) : []);
const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function toWord(v: unknown, stop: string, group: number): VocabWord | null {
	if (!isObj(v)) return null;
	const w = str(v.w);
	const zh = str(v.zh);
	if (w == null || zh == null) return null;
	const alt = strings(v.alt).filter(a => a.toLowerCase() !== w.toLowerCase());
	return { w, alt, ipa: str(v.ipa) ?? '', pos: str(v.pos) ?? '', zh, ex: str(v.ex) ?? '', stop, group, key: `${stop}:${w}` };
}

function toStop(v: unknown): VocabStop | null {
	if (!isObj(v)) return null;
	const id = str(v.id);
	const topic = str(v.topic);
	if (id == null || topic == null) return null;
	const seen = new Set<string>();
	const groups: VocabGroup[] = [];
	for (const g of list(v.groups)) {
		if (!isObj(g)) continue;
		const at = groups.length;
		const words = list(g.words)
			.map(x => toWord(x, id, at))
			.filter((x): x is VocabWord => x != null)
			.filter(x => {
				// a word once per stop
				const k = x.w.toLowerCase();
				if (seen.has(k)) return false;
				seen.add(k);
				return true;
			});
		if (words.length > 0) groups.push({ label: str(g.label) ?? '', color: GROUP_COLORS[at % GROUP_COLORS.length], words });
	}
	if (groups.length === 0) return null;
	return {
		id, band: num(v.band, 0), topic, en: str(v.en) ?? '', level: str(v.level) ?? '', fit: str(v.fit) ?? '', lede: str(v.lede) ?? '',
		uses: strings(v.uses), groups, words: groups.flatMap(g => g.words),
	};
}

// The course file's VOCAB, as typed stops in line order.
export function toVocabContent(raw: unknown): VocabContent {
	const d = isObj(raw) ? raw : {};
	const gate = isObj(d.gate) ? d.gate : {};
	const stops: VocabStop[] = [];
	for (const s of list(d.stops)) {
		const stop = toStop(s);
		if (stop != null && !stops.some(x => x.id === stop.id)) stops.push(stop);
	}
	return {
		line: num(d.line, 5),
		color: str(d.color) ?? '#6E4F8F',
		gate: { total: num(gate.total, 10), spell: num(gate.spell, 6), choose: num(gate.choose, 4), pass: num(gate.pass, 8), plays: num(gate.plays, 3) },
		stops,
	};
}

export const vocabContent: VocabContent = toVocabContent(VOCAB);

export function findStop(id: string): VocabStop | null {
	return vocabContent.stops.find(s => s.id === id) ?? null;
}

// The stop's gate, and the stop on the route map.
export const gatePath = (id: string): string => `/gate/ielts/${encodeURIComponent(id)}`;
export const mapPath = (id: string): string => `/map/ielts#${encodeURIComponent(id)}`;

// "这一站的词也用在": each listening or reading stop by its line's name and band (听力 4.5), from the route map's
// content. A stop the map doesn't have is shown by its id.
export type UsedIn = { id: string; line: { zh: string; en: string } | null; band: number | null };

export function usedIn(stop: VocabStop, lines: unknown = LINES): UsedIn[] {
	return stop.uses.map(id => {
		for (const l of list(lines)) {
			if (!isObj(l)) continue;
			const st = list(l.stations).find(s => isObj(s) && s.id === id);
			if (!isObj(st)) continue;
			const zh = str(l.zh);
			const en = str(l.en);
			return { id, line: zh != null ? { zh, en: en ?? zh } : null, band: typeof st.band === 'number' ? st.band : null };
		}
		return { id, line: null, band: null };
	});
}
