/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 6 号线 · 语法's lessons: the course file (courses/english/ielts/grammar.js in the Vibes workspace, synced to
// lojo/route/courses/ielts/grammar.js) as typed stops and lessons, with the examples already parsed. Anything malformed
// is left out; the unit test checks the file. The line's name and each stop's question types come from content.js.
// The gates themselves are on the server (gates/6.x-A.js); their tags point back at a lesson's sections.
import { inlineParts, keysUsed, parseExample, plainText, writingText } from './marks.js';
import type { InlinePart, LegendKey, Segment } from './marks.js';
import { GRAMMAR } from '@/lojo/route/courses/ielts/grammar.js';
import { LINES } from '@/lojo/route/courses/ielts/content.js';

export type Bilingual = { zh: string; en: string };

// types: the question types of its gate (连词成句、选择…), when content.js has them
export type GrammarStop = { id: string; band: number; title: string; sub: string; focus: string; types: Bilingual | null };
// say: the sentence without its markup, read aloud
export type ExampleBlock = { kind: 'ex'; src: string; segments: Segment[]; say: string; zh: string };
export type TableBlock = { kind: 'table'; head: string[] | null; rows: string[][] };
export type GrammarBlock = { kind: 'p'; parts: InlinePart[] } | ExampleBlock | TableBlock;
export type GrammarSection = { id: string; h: string; blocks: GrammarBlock[] };
export type GrammarMistake = { bad: string; good: string; why: string };
export type GrammarLesson = {
	lede: InlinePart[];
	minutes: number | null;
	// the section the 常见错误 box comes after (the last one when the file names none that exists)
	mistakesAfter: string;
	// without its "写作里用得上：" prefix
	writing: InlinePart[];
	sections: GrammarSection[];
	mistakes: GrammarMistake[];
	// what the legend explains: the marks this lesson's examples use
	keys: LegendKey[];
};
// see: the section to read again
export type GrammarTag = { zh: string; see: string };
export type GrammarContent = {
	line: number;
	color: string;
	name: Bilingual;
	stops: GrammarStop[];
	lessons: Record<string, GrammarLesson>;
	// stop → "stop/tag" → the tag
	tags: Record<string, Record<string, GrammarTag>>;
};

// the course the line belongs to: its gates are /gate/ielts/6.2
export const GRAMMAR_COURSE = 'ielts';

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => v != null && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const strings = (v: unknown): string[] => list(v).filter((x): x is string => typeof x === 'string');
const bilingual = (v: unknown): Bilingual | null => (isObj(v) && str(v.zh) != null && str(v.en) != null ? { zh: v.zh as string, en: v.en as string } : null);

function toBlock(v: unknown): GrammarBlock | null {
	if (!isObj(v)) return null;
	const p = str(v.p);
	if (p != null) return { kind: 'p', parts: inlineParts(p) };
	const ex = str(v.ex);
	if (ex != null) return { kind: 'ex', src: ex, segments: parseExample(ex), say: plainText(ex), zh: str(v.zh) ?? '' };
	const rows = list(v.table).filter(Array.isArray).map(r => strings(r));
	if (rows.length > 0) {
		const head = strings(v.head);
		return { kind: 'table', head: head.length > 0 ? head : null, rows };
	}
	return null;
}

function toSection(v: unknown): GrammarSection | null {
	if (!isObj(v)) return null;
	const id = str(v.id);
	const h = str(v.h);
	const blocks = list(v.blocks).map(toBlock).filter(b => b != null);
	return id != null && h != null && blocks.length > 0 ? { id, h, blocks } : null;
}

function toMistake(v: unknown): GrammarMistake | null {
	if (!isObj(v)) return null;
	const bad = str(v.bad);
	const good = str(v.good);
	return bad != null && good != null ? { bad, good, why: str(v.why) ?? '' } : null;
}

export function toLesson(v: unknown): GrammarLesson | null {
	if (!isObj(v)) return null;
	const sections = list(v.sections).map(toSection).filter(s => s != null);
	if (sections.length === 0) return null;
	const after = str(v.mistakesAfter);
	const writing = str(v.writing);
	return {
		lede: inlineParts(str(v.lede) ?? ''),
		minutes: typeof v.minutes === 'number' && v.minutes > 0 ? v.minutes : null,
		mistakesAfter: after != null && sections.some(s => s.id === after) ? after : sections[sections.length - 1].id,
		writing: writing != null ? inlineParts(writingText(writing)) : [],
		sections,
		mistakes: list(v.mistakes).map(toMistake).filter(m => m != null),
		keys: keysUsed(sections.flatMap(s => s.blocks.filter((b): b is ExampleBlock => b.kind === 'ex').map(b => b.segments))),
	};
}

export function toGrammarContent(raw: unknown, lines: unknown): GrammarContent {
	const g = isObj(raw) ? raw : {};
	const lineNo = typeof g.line === 'number' ? g.line : 6;
	const line = list(lines).find(l => isObj(l) && l.n === lineNo);
	const stations = isObj(line) ? list(line.stations).filter(isObj) : [];
	const stops: GrammarStop[] = [];
	for (const s of list(g.stops)) {
		if (!isObj(s)) continue;
		const id = str(s.id);
		const title = str(s.title);
		if (id == null || title == null || typeof s.band !== 'number' || !Number.isFinite(s.band) || stops.some(x => x.id === id)) continue;
		stops.push({ id, band: s.band, title, sub: str(s.sub) ?? '', focus: str(s.focus) ?? '', types: bilingual(stations.find(x => x.id === id)?.types) });
	}
	const lessons: Record<string, GrammarLesson> = {};
	const rawLessons = isObj(g.lessons) ? g.lessons : {};
	for (const s of stops) {
		const lesson = toLesson(rawLessons[s.id]);
		if (lesson != null) lessons[s.id] = lesson;
	}
	const tags: Record<string, Record<string, GrammarTag>> = {};
	const rawTags = isObj(g.tags) ? g.tags : {};
	for (const s of stops) {
		const mine = rawTags[s.id];
		if (!isObj(mine)) continue;
		for (const [key, t] of Object.entries(mine)) {
			const zh = isObj(t) ? str(t.zh) : null;
			const see = isObj(t) ? str(t.see) : null;
			if (zh != null && see != null) (tags[s.id] ??= {})[key] = { zh, see };
		}
	}
	return {
		line: lineNo,
		color: str(g.color) ?? '#2F5D4A',
		name: (isObj(line) ? bilingual(line) : null) ?? { zh: '语法', en: 'Grammar' },
		stops,
		lessons,
		tags,
	};
}

export const grammarContent = toGrammarContent(GRAMMAR, LINES);

// 4 → "4.0"
export const bandText = (band: number): string => band.toFixed(1);

export function findStop(content: GrammarContent, id: string): GrammarStop | null {
	return content.stops.find(s => s.id === id) ?? null;
}

// The stops before and after along the line.
export function neighbours(content: GrammarContent, id: string): { prev: GrammarStop | null; next: GrammarStop | null } {
	const at = content.stops.findIndex(s => s.id === id);
	if (at < 0) return { prev: null, next: null };
	return { prev: content.stops[at - 1] ?? null, next: content.stops[at + 1] ?? null };
}

export const lessonPath = (id: string): string => `/apps/grammar/${id}`;
export const gatePath = (id: string): string => `/gate/${GRAMMAR_COURSE}/${id}`;

// The section a link asks for (/grammar/6.2?section=s3, the router's full path), if the lesson has it.
export function sectionFromPath(fullPath: string, lesson: GrammarLesson): string | null {
	const path = fullPath.split('#')[0];
	const at = path.indexOf('?');
	if (at < 0) return null;
	const id = new URLSearchParams(path.slice(at + 1)).get('section');
	return id != null && lesson.sections.some(s => s.id === id) ? id : null;
}
