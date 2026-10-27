/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关答题页 (the gate player): the parts without any UI, so they can be tested on their own.
import type * as Misskey from 'misskey-js';

export type GateAttempt = Misskey.Endpoints['lojo/gates/start']['res'];
export type GateGroup = GateAttempt['groups'][number];
export type GateItem = GateGroup['items'][number];
export type GateLimit = NonNullable<GateGroup['limit']>;
export type GatePause = NonNullable<GateAttempt['audio']>['pauses'][number];
export type GateAnswer = Misskey.Endpoints['lojo/gates/submit']['req']['answers'][number];
export type GateResult = Misskey.Endpoints['lojo/gates/submit']['res'];
export type GateResultItem = GateResult['items'][number];
export type GateReason = NonNullable<GateResultItem['reason']>;
export type GateScriptLine = GateResult['script'][number];
export type GateTutor = NonNullable<GateResult['tutor']>;

// What the student has put down so far: text or a letter per question number; a multi item's letters sit under its first number.
export type GateAnswers = Record<number, string | string[] | undefined>;

// The parts of a course pack (lojo/route/courses/<id>) this page reads.
type Bilingual = { zh: string; en: string };
export type PackStation = { id: string; band: number; part?: Bilingual; focus?: Bilingual; types?: Bilingual; pace?: Bilingual };
export type PackLine = { n: number; id: string; zh: string; en: string; live: boolean; stations: PackStation[] };
export type PackInterchange = { ids: string[]; zh: string; en: string; dzh: string; den: string; why: Bilingual };
export type PracticeApp = { path: string; zh: string; en: string };
export type PracticeEntry = { guide?: string | null; app?: PracticeApp | null; topics?: string[] | null };
export type GatePack = {
	LINES: PackLine[];
	INTERCHANGES: PackInterchange[];
	TAGS: Record<string, Bilingual>;
	PRACTICE: Record<string, PracticeEntry>;
	TEXT: Record<'zh' | 'en', { title: string; legal: string }>;
};

// Until a set says otherwise (the attempt carries its own numbers): 10 questions, 8 to pass.
export const DEFAULT_TOTAL = 10;
export const DEFAULT_PASS = 8;

export const bandText = (band: number): string => band.toFixed(1);
export const letterAt = (index: number): string => String.fromCharCode(65 + index);

/* ---------- Stations ---------- */

export type StationInfo = {
	line: PackLine;
	station: PackStation;
	// What the gate tests. For an interchange on a line that is not open yet, that is its partner on an open line.
	detail: PackStation;
	detailLine: PackLine;
	interchange: PackInterchange | null;
	// The interchange's lines that are not open yet; their half of the gate comes later.
	closedLines: PackLine[];
	// false when none of the station's lines is open yet
	playable: boolean;
	// The station before it on the same line, where the student can go back to.
	previous: PackStation | null;
};

function locate(lines: PackLine[], id: string): { line: PackLine; index: number } | null {
	for (const line of lines) {
		const index = line.stations.findIndex(s => s.id === id);
		if (index >= 0) return { line, index };
	}
	return null;
}

export function findStation(pack: Pick<GatePack, 'LINES' | 'INTERCHANGES'>, id: string): StationInfo | null {
	const here = locate(pack.LINES, id);
	if (here == null) return null;
	const interchange = pack.INTERCHANGES.find(x => x.ids.includes(id)) ?? null;
	const partners = (interchange?.ids ?? [id]).map(sid => locate(pack.LINES, sid)).filter(x => x != null);
	const tested = here.line.live ? here : partners.find(p => p.line.live) ?? null;
	const base = tested ?? here;
	return {
		line: here.line,
		station: here.line.stations[here.index],
		detail: base.line.stations[base.index],
		detailLine: base.line,
		interchange,
		closedLines: interchange ? partners.filter(p => !p.line.live).map(p => p.line) : [],
		playable: tested != null,
		previous: base.index > 0 ? base.line.stations[base.index - 1] : null,
	};
}

// The band of any station in the pack, e.g. for "挑战下一站 4.5".
export function stationBand(pack: Pick<GatePack, 'LINES'>, id: string): number | null {
	const at = locate(pack.LINES, id);
	return at ? at.line.stations[at.index].band : null;
}

/* ---------- Form lines ---------- */

export type FormSegment = { type: 'text'; text: string } | { type: 'gap'; n: number };
export type FormCell = FormSegment[];
export type FormBlock =
	| { kind: 'line'; segments: FormSegment[] }
	| { kind: 'table'; head: FormCell[] | null; rows: FormCell[][] };

// A gap is written "(7) ______": the question number in brackets, then three or more underscores.
const GAP = /\((\d+)\)\s*_{3,}/g;
const CELL = ' | ';

export function parseSegments(text: string): FormSegment[] {
	const out: FormSegment[] = [];
	let last = 0;
	for (const m of text.matchAll(GAP)) {
		if (m.index > last) out.push({ type: 'text', text: text.slice(last, m.index) });
		out.push({ type: 'gap', n: Number(m[1]) });
		last = m.index + m[0].length;
	}
	if (last < text.length) out.push({ type: 'text', text: text.slice(last) });
	return out;
}

const hasGap = (cells: FormCell[]) => cells.some(cell => cell.some(seg => seg.type === 'gap'));

// Lines with " | " are table rows; rows next to each other make one table.
// A table's first row is its header when it has no gaps and more rows follow.
export function formBlocks(lines: string[]): FormBlock[] {
	const blocks: FormBlock[] = [];
	for (const line of lines) {
		if (line.includes(CELL)) {
			const cells = line.split(CELL).map(cell => parseSegments(cell.trim()));
			const last = blocks.at(-1);
			if (last?.kind === 'table') last.rows.push(cells);
			else blocks.push({ kind: 'table', head: null, rows: [cells] });
		} else {
			blocks.push({ kind: 'line', segments: parseSegments(line) });
		}
	}
	for (const block of blocks) {
		if (block.kind === 'table' && block.rows.length > 1 && !hasGap(block.rows[0])) block.head = block.rows.shift() ?? null;
	}
	return blocks;
}

export function formGaps(lines: string[]): number[] {
	return lines.flatMap(line => [...line.matchAll(GAP)].map(m => Number(m[1])));
}

// The question numbers a group covers, lowest first.
export function groupNumbers(group: Pick<GateGroup, 'type' | 'items' | 'lines'>): number[] {
	const numbers = new Set(group.items.flatMap(item => item.n));
	if (group.type === 'form') for (const n of formGaps(group.lines)) numbers.add(n);
	return [...numbers].sort((a, b) => a - b);
}

/* ---------- Letters ---------- */

// A map brings the letters printed on it; a match group's letters follow its box of options (A, B, …).
export function pickLetters(group: { type: GateGroup['type']; letters: string[] | string | null; options: string[] }): string[] {
	const given = Array.isArray(group.letters) ? group.letters : [...(group.letters ?? '')];
	if (given.length > 0) return given;
	return group.type === 'match' ? group.options.map((_, i) => letterAt(i)) : [];
}

// The words behind a letter answer: an option of the item (choice, multi) or of the box (match). Maps have none.
export function letterText(group: Pick<GateGroup, 'type' | 'options'>, item: Pick<GateItem, 'options'> | null, value: string): string | null {
	if (!/^[A-Z]$/i.test(value)) return null;
	const index = value.toUpperCase().charCodeAt(0) - 65;
	const list = group.type === 'match' ? group.options : group.type === 'choice' || group.type === 'multi' ? item?.options ?? [] : [];
	return list[index] ?? null;
}

/* ---------- Answers ---------- */

// A multi item's picks are kept under its first question number.
export const itemKey = (item: Pick<GateItem, 'n'>): number => Math.min(...item.n);

// One answer for every question number, '' for a blank. A multi item's letters go onto its numbers in ascending order.
export function answersPayload(groups: GateGroup[], answers: GateAnswers): GateAnswer[] {
	const values = new Map<number, string>();
	const text = (n: number) => {
		const v = answers[n];
		return typeof v === 'string' ? v.trim() : '';
	};
	for (const group of groups) {
		for (const item of group.items) {
			const numbers = [...item.n].sort((a, b) => a - b);
			if (group.type === 'multi') {
				const picked = answers[itemKey(item)];
				const letters = [...new Set(Array.isArray(picked) ? picked : [])].sort().slice(0, numbers.length);
				numbers.forEach((n, i) => values.set(n, letters[i] ?? ''));
			} else {
				for (const n of numbers) values.set(n, text(n));
			}
		}
		if (group.type === 'form') {
			for (const n of formGaps(group.lines)) if (!values.has(n)) values.set(n, text(n));
		}
	}
	return [...values].sort(([a], [b]) => a - b).map(([n, value]) => ({ n, value }));
}

export const blankCount = (payload: GateAnswer[]): number => payload.filter(a => a.value === '').length;

/* ---------- The recording ---------- */

// Reading time left at t seconds into the recording, in whole seconds rounded up, so it reads 0:01 until the pause is over.
// null outside the pauses.
export function readingTimeLeft(pauses: GatePause[], t: number): number | null {
	if (!Number.isFinite(t)) return null;
	const pause = pauses.find(p => t >= p.at && t < p.at + p.length);
	if (pause == null) return null;
	// The small margin keeps 33.2 - 3.2 = 30.000000000000004 from reading 0:31.
	return Math.max(1, Math.ceil(pause.at + pause.length - t - 1e-6));
}

// A twentieth of a second of silence (8 kHz, 8-bit mono WAV).
// Playing it inside the tap on "开始" is what lets iOS play the real recording once it arrives.
export function silentWav(): string {
	const samples = 400;
	const bytes = new Uint8Array(44 + samples);
	const view = new DataView(bytes.buffer);
	const tag = (at: number, text: string) => {
		for (let i = 0; i < 4; i++) bytes[at + i] = text.charCodeAt(i);
	};
	tag(0, 'RIFF');
	view.setUint32(4, 36 + samples, true);
	tag(8, 'WAVE');
	tag(12, 'fmt ');
	view.setUint32(16, 16, true); // size of the fmt chunk
	view.setUint16(20, 1, true); // PCM
	view.setUint16(22, 1, true); // mono
	view.setUint32(24, 8000, true); // samples per second
	view.setUint32(28, 8000, true); // bytes per second
	view.setUint16(32, 1, true); // bytes per sample
	view.setUint16(34, 8, true); // bits per sample
	tag(36, 'data');
	view.setUint32(40, samples, true);
	bytes.fill(0x80, 44); // 8-bit PCM is unsigned: 128 is silence
	return `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`;
}

/* ---------- Results ---------- */

// Hours, minutes and seconds, to the nearest second.
export function durationParts(ms: number): { h: number; m: number; s: number } {
	const total = Number.isFinite(ms) && ms > 0 ? Math.round(ms / 1000) : 0;
	return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

export type RecommendCard = { tag: string; count: number; guide: string | null; app: PracticeApp | null; topics: string[] };

// Where to practise the most-missed question types: one card for each of the top `max` tags, with only what exists
// (a guide, a page in the community, hashtags). A tag with nothing to offer gets no card.
export function recommendCards(weak: { tag: string; count: number }[], practice: Record<string, PracticeEntry>, max = 2): RecommendCard[] {
	const seen = new Set<string>();
	const top = weak
		.filter(w => w.count > 0)
		.sort((a, b) => b.count - a.count)
		.filter(w => !seen.has(w.tag) && seen.add(w.tag))
		.slice(0, max);
	return top
		.map(({ tag, count }) => {
			const entry = Object.hasOwn(practice, tag) ? practice[tag] : undefined;
			const topics = [...new Set((entry?.topics ?? []).filter(t => typeof t === 'string' && t !== ''))];
			return { tag, count, guide: entry?.guide || null, app: entry?.app ?? null, topics };
		})
		.filter(card => card.guide != null || card.app != null || card.topics.length > 0);
}

export type QuestionRef = { group: GateGroup; item: GateItem | null; prompt: string };

// What each question asked, for the review: a gap's line with the gaps as "____", or the item's question.
export function questionRefs(groups: GateGroup[]): Map<number, QuestionRef> {
	const refs = new Map<number, QuestionRef>();
	for (const group of groups) {
		if (group.type === 'form') {
			for (const line of group.lines) {
				const cells = (line.includes(CELL) ? line.split(CELL) : [line]).map(cell => parseSegments(cell.trim()));
				const prompt = cells.map(cell => cell.map(seg => seg.type === 'text' ? seg.text : '____').join('').trim()).join(' · ');
				for (const seg of cells.flat()) {
					if (seg.type === 'gap') refs.set(seg.n, { group, item: group.items.find(item => item.n.includes(seg.n)) ?? null, prompt });
				}
			}
		}
		for (const item of group.items) {
			for (const n of item.n) if (!refs.has(n)) refs.set(n, { group, item, prompt: item.q ?? '' });
		}
	}
	return refs;
}
