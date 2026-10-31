/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关答题页 (the gate player): the parts without any UI, so they can be tested on their own.
import type * as Misskey from 'misskey-js';
import { answerDone, isNewType } from './answers.js';
import type { NewType } from './answers.js';

type ApiAttempt = Misskey.Endpoints['lojo/gates/start']['res'];
type ApiGroup = ApiAttempt['groups'][number];
type ApiItem = ApiGroup['items'][number];
type ApiResult = Misskey.Endpoints['lojo/gates/submit']['res'];
type ApiResultItem = ApiResult['items'][number];

// The vocabulary and grammar lines (docs/vocab-grammar-lines.md) bring five question types, two skills, and a few
// fields on the paper and on the result. Until misskey-js is generated again from the server, they are laid over the
// generated types here; once it is, the two agree and these can simply be the generated types.
export type GateType = ApiGroup['type'] | NewType;
export type GateSkill = ApiGroup['skill'] | 'vocab' | 'grammar';
// What a question of a new type adds on the paper; nothing that gives the answer away.
export type GateItemExtras = {
	// spell: the recording of the word, and how many times it can be heard
	audio?: string | null;
	plays?: number | null;
	// build: one of the chips isn't needed
	extra?: boolean | null;
	// fix: pick the change from the options, or type it
	mode?: 'choose' | 'type' | null;
	// parse: the clauses are marked too
	clauses?: boolean | null;
	// translate: what the question practises
	focus?: string | null;
};
export type GateItem = ApiItem & GateItemExtras;
export type GateGroup = Omit<ApiGroup, 'type' | 'skill' | 'items'> & { type: GateType; skill: GateSkill; items: GateItem[] };
export type GateAttempt = Omit<ApiAttempt, 'groups'> & { groups: GateGroup[] };
export type GateLimit = NonNullable<ApiGroup['limit']>;
export type GatePause = NonNullable<ApiAttempt['audio']>['pauses'][number];
export type GateAnswer = Misskey.Endpoints['lojo/gates/submit']['req']['answers'][number];
// A translation's marking: what is right, what to change, and notes (a misspelt word, a softer point).
export type GateFeedback = { good: string[]; fix: string[]; notes: string[] };
// A parse's right marks: the subject's and the verb's words that must be marked, and each clause's first and last word.
export type GateParseKey = { s: number[]; v: number[]; c: number[][] };
// What a marked question adds after handing in (all types of the new lines): the question, a why, a right sentence.
export type GateResultExtras = {
	q?: string | null;
	why?: string | null;
	right?: string | null;
	feedback?: GateFeedback | null;
	key?: GateParseKey | null;
};
export type GateResultItem = ApiResultItem & GateResultExtras;
export type GateResult = Omit<ApiResult, 'items'> & { items: GateResultItem[] };
export type GateReason = NonNullable<ApiResultItem['reason']>;
export type GateScriptLine = ApiResult['script'][number];
export type GateTutor = NonNullable<ApiResult['tutor']>;
export type GatePassage = NonNullable<ApiAttempt['passage']>;
export type GateParagraph = GatePassage['paragraphs'][number];

// What the student has put down so far: text or a letter per question number; a multi item's letters sit under its first number.
export type GateAnswers = Record<number, string | string[] | undefined>;

// The parts of a course pack (lojo/route/courses/<id>) this page reads.
type Bilingual = { zh: string; en: string };
// pace: speed and accents (listening); length: words and time limit (reading)
export type PackStation = { id: string; band: number; part?: Bilingual; focus?: Bilingual; types?: Bilingual; pace?: Bilingual; length?: Bilingual };
export type PackLine = { n: number; id: string; zh: string; en: string; live: boolean; stations: PackStation[] };
export type PackInterchange = { ids: string[]; zh: string; en: string; dzh: string; den: string; why: Bilingual };
export type PracticeApp = { path: string; zh: string; en: string };
// A tag both lines ask (choice, form…) can point each line somewhere else: a plain value is for every line, an object
// is by line id ({ listening: 'ielts-listening-choice', reading: null }); a line it leaves out gets nothing.
export type PerLine<T> = T | { [line: string]: T | undefined };
export type PracticeEntry = { guide?: PerLine<string | null>; app?: PracticeApp | null; topics?: PerLine<string[] | null> };
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

// /gate/ielts/placement-1 is line 1's placement test.
export function placementLine(station: string): number | null {
	const m = /^placement-(\d+)$/.exec(station);
	return m ? Number(m[1]) : null;
}

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

// Groups whose questions are gaps in their lines: a form (typed) or a summary with a box of words (picked).
export const gapped = (type: GateGroup['type']): boolean => type === 'form' || type === 'bank';

// The question numbers a group covers, lowest first.
export function groupNumbers(group: Pick<GateGroup, 'type' | 'items' | 'lines'>): number[] {
	const numbers = new Set(group.items.flatMap(item => item.n));
	if (gapped(group.type)) for (const n of formGaps(group.lines)) numbers.add(n);
	return [...numbers].sort((a, b) => a - b);
}

/* ---------- Letters ---------- */

// What can be picked: the letters on a map, A–H of a box, i–x of a list of headings, a passage's paragraph letters,
// TRUE / FALSE / NOT GIVEN. The server sends them; a match group from before falls back to its box (A, B, …).
export function pickLetters(group: { type: GateGroup['type']; letters: string[] | string | null; options: string[] }): string[] {
	const given = Array.isArray(group.letters) ? group.letters : [...(group.letters ?? '')];
	if (given.length > 0) return given;
	return group.type === 'match' || group.type === 'bank' ? group.options.map((_, i) => letterAt(i)) : [];
}

// The words behind a picked answer: an option of the item (choice, multi) or of the box (match, bank).
// Maps, paragraph letters and TRUE / FALSE / NOT GIVEN have none.
export function letterText(group: Pick<GateGroup, 'type' | 'options' | 'letters'>, item: Pick<GateItem, 'options'> | null, value: string): string | null {
	if (group.type === 'choice' || group.type === 'multi') {
		if (!/^[A-Z]$/i.test(value)) return null;
		return item?.options[value.toUpperCase().charCodeAt(0) - 65] ?? null;
	}
	if (group.type !== 'match' && group.type !== 'bank') return null;
	const index = pickLetters(group).findIndex(l => l.toUpperCase() === value.toUpperCase());
	return index >= 0 ? group.options[index] ?? null : null;
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
		if (gapped(group.type)) {
			for (const n of formGaps(group.lines)) if (!values.has(n)) values.set(n, text(n));
		}
	}
	return [...values].sort(([a], [b]) => a - b).map(([n, value]) => ({ n, value }));
}

export const blankCount = (payload: GateAnswer[]): number => payload.filter(a => a.value === '').length;

// The questions not done yet, for "还有 N 题没填": the blanks, and (vocabulary and grammar) a fix still without its
// change, or a parse without its subject or verb. For listening and reading this is the number of blanks.
export function unansweredCount(groups: GateGroup[], answers: GateAnswers): number {
	const payload = answersPayload(groups, answers);
	const values = new Map(payload.map(a => [a.n, a.value]));
	let count = blankCount(payload);
	for (const group of groups) {
		if (!isNewType(group.type)) continue;
		for (const item of group.items) {
			const value = values.get(item.n[0]) ?? '';
			if (value !== '' && !answerDone(group.type, value, item)) count++;
		}
	}
	return count;
}

/* ---------- Vocabulary and grammar ---------- */

export type PlainKind = 'vocab' | 'grammar';

// A vocabulary or grammar paper has no recording and no passage: it opens on its questions. null for any other paper.
export function plainKind(groups: Pick<GateGroup, 'skill'>[]): PlainKind | null {
	const first = groups[0]?.skill;
	return (first === 'vocab' || first === 'grammar') && groups.every(g => g.skill === first) ? first : null;
}

// The line a station is on, when it is the vocabulary or the grammar line (content.js LINES: 'vocab', 'grammar').
export const plainLine = (lineId: string | null | undefined): PlainKind | null => (lineId === 'vocab' || lineId === 'grammar' ? lineId : null);

// The stop's own page: its words and practice (/vocab/5.2) or its lesson (/grammar/6.2).
export function stopPage(kind: PlainKind | null, station: string): string | null {
	if (kind == null) return null;
	return `/${kind}/${encodeURIComponent(station)}`;
}

// A PRACTICE page may name the station it is about: "/vocab/{station}" is this stop's words. Other paths are kept.
export const practicePath = (path: string, station: string): string => path.split('{station}').join(encodeURIComponent(station));

/* ---------- Reading ---------- */

// The listening groups and the reading groups of a paper. A half-and-half interchange set has both, listening first.
export function paperParts(groups: GateGroup[]): { listening: GateGroup[]; reading: GateGroup[] } {
	return { listening: groups.filter(g => g.skill !== 'reading'), reading: groups.filter(g => g.skill === 'reading') };
}

// Whole seconds left before the deadline, rounded up, so it reads 0:01 until time is really up.
export function secondsLeft(deadline: number, now: number): number {
	return Math.max(0, Math.ceil((deadline - now) / 1000 - 1e-6));
}

// "13:42"; an hour or more as "1:02:05".
export function clockText(seconds: number): string {
	const s = Math.max(0, Math.round(seconds));
	const mm = String(Math.floor((s % 3600) / 60)), ss = String(s % 60).padStart(2, '0');
	return s >= 3600 ? `${Math.floor(s / 3600)}:${mm.padStart(2, '0')}:${ss}` : `${mm}:${ss}`;
}

// A paragraph's text as lines and tables: "\n" breaks a line, and lines with " | " are table rows, as in a form.
export const paragraphBlocks = (text: string): FormBlock[] => formBlocks(text.split('\n'));

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

// The value of a PRACTICE field for one line (see PerLine).
export function forLine<T>(value: PerLine<T> | undefined, line: string): T | undefined {
	if (value == null || typeof value !== 'object' || Array.isArray(value)) return value as T | undefined;
	const byLine = value as { [line: string]: T | undefined };
	return Object.hasOwn(byLine, line) ? byLine[line] : undefined;
}

export type Weak = { tag: string; skill: GateSkill; count: number };

// What went wrong, by tag and by the skill of the question it was in (a half-and-half set has both), over the parts
// of a placement test or the one paper of a gate.
export function weakBySkill(parts: { result: GateResult; attempt: GateAttempt }[]): Weak[] {
	const counts = new Map<string, Weak>();
	for (const { result, attempt } of parts) {
		const skillOf = new Map(attempt.groups.flatMap(g => g.items.flatMap(item => item.n.map(n => [n, g.skill] as const))));
		for (const item of result.items) {
			if (item.correct) continue;
			const skill = skillOf.get(item.n) ?? attempt.groups[0]?.skill ?? 'listening';
			for (const tag of item.tags) {
				const key = `${tag}|${skill}`;
				const weak = counts.get(key) ?? { tag, skill, count: 0 };
				weak.count++;
				counts.set(key, weak);
			}
		}
	}
	return [...counts.values()];
}

export type RecommendCard = { tag: string; skill: GateSkill; count: number; guide: string | null; app: PracticeApp | null; topics: string[] };

// Where to practise the most-missed question types: one card for each of the top `max`, with only what exists (a guide,
// a page in the community, hashtags); one with nothing to offer gets no card. A tag missed in both listening and
// reading is one card when the two lines share the advice, and two when they don't.
export function recommendCards(weak: Weak[], practice: Record<string, PracticeEntry>, max = 2): RecommendCard[] {
	const cards = new Map<string, RecommendCard>();
	for (const { tag, skill, count } of weak) {
		if (count <= 0) continue;
		const entry = Object.hasOwn(practice, tag) ? practice[tag] : undefined;
		const guide = forLine(entry?.guide, skill) || null;
		const app = entry?.app ?? null;
		const topics = [...new Set((forLine(entry?.topics, skill) ?? []).filter(t => typeof t === 'string' && t !== ''))];
		const key = JSON.stringify([tag, guide, app?.path ?? null, topics]);
		const card = cards.get(key);
		if (card) card.count += count;
		else cards.set(key, { tag, skill, count, guide, app, topics });
	}
	return [...cards.values()]
		.sort((a, b) => b.count - a.count)
		.slice(0, max)
		.filter(card => card.guide != null || card.app != null || card.topics.length > 0);
}

export type QuestionRef = { group: GateGroup; item: GateItem | null; prompt: string };

// What each question asked, for the review: a gap's line with the gaps as "____", or the item's question.
export function questionRefs(groups: GateGroup[]): Map<number, QuestionRef> {
	const refs = new Map<number, QuestionRef>();
	for (const group of groups) {
		if (gapped(group.type)) {
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
