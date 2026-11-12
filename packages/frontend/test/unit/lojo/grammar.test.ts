/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { exampleIssues, inlineParts, keysUsed, parseExample, plainText, toMarkup, writingText } from '@/lojo/grammar/marks.js';
import type { Segment } from '@/lojo/grammar/marks.js';
import { bandText, gatePath, grammarContent, lessonPath, neighbours, sectionFromPath, toGrammarContent, toLesson } from '@/lojo/grammar/content.js';
import type { GrammarLesson } from '@/lojo/grammar/content.js';
import { GRAMMAR } from '@/lojo/route/courses/ielts/grammar.js';
import { LINES, PRACTICE } from '@/lojo/route/courses/ielts/content.js';

// the course file as written (grammar.js is plain JS)
type RawBlock = { p?: string; ex?: string; zh?: string; table?: string[][] };
type RawLesson = { lede: string; minutes: number; mistakesAfter: string; writing: string; sections: { id: string; h: string; blocks: RawBlock[] }[]; mistakes: unknown[] };
type RawGrammar = {
	line: number;
	color: string;
	stops: { id: string; band: number; title: string }[];
	lessons: Record<string, RawLesson>;
	tags: Record<string, Record<string, { zh: string; see: string }>>;
};
const RAW = GRAMMAR as unknown as RawGrammar;
const RAW_PRACTICE = PRACTICE as unknown as Record<string, { app?: { path: string } | null } | undefined>;
const IDS = ['6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.7', '6.8', '6.9'];
const MARKUP = /[{}[\]]/;

const text = (t: string): Segment => ({ kind: 'text', text: t });
const mark = (m: 's' | 'v' | 'o' | 'p', t: string, tail = ''): Segment => ({ kind: 'mark', mark: m, text: t, tail });

describe('example markup', () => {
	test('marks become segments, with the words between them as text', () => {
		expect(parseExample('{s:The city centre} {v:is} {p:crowded}.')).toEqual([
			mark('s', 'The city centre'), text(' '), mark('v', 'is'), text(' '), mark('p', 'crowded', '.'),
		]);
		expect(parseExample('There {v:are} {s:two libraries} on campus.')).toEqual([
			text('There '), mark('v', 'are'), text(' '), mark('s', 'two libraries'), text(' on campus.'),
		]);
	});

	test('a mark keeps the punctuation right after it (they never wrap apart)', () => {
		expect(parseExample('{s:My grandmother}, [c:who is 82], {v:swims} every morning.')).toEqual([
			mark('s', 'My grandmother', ','),
			text(' '),
			{ kind: 'clause', parts: [text('who is 82')] },
			text(', '),
			mark('v', 'swims'),
			text(' every morning.'),
		]);
		expect(parseExample('{s:Prices} {v:rise}.')[2]).toEqual(mark('v', 'rise', '.'));
		// several signs in a row, and a closing bracket or quote, go along too
		expect(parseExample('({s:that}), {v:said}...')).toEqual([text('('), mark('s', 'that', '),'), text(' '), mark('v', 'said', '...')]);
	});

	test('a clause is one segment; text in it stays text, (that) included', () => {
		expect(parseExample('[c:When the library closes], {s:most students} {v:go} home.')).toEqual([
			{ kind: 'clause', parts: [text('When the library closes')] },
			text(', '),
			mark('s', 'most students'),
			text(' '),
			mark('v', 'go'),
			text(' home.'),
		]);
		expect(parseExample('the phone [c:(that) I bought last month]')).toEqual([
			text('the phone '),
			{ kind: 'clause', parts: [text('(that) I bought last month')] },
		]);
	});

	test('a clause may hold marks of its own, with their punctuation', () => {
		const src = '{s:Students} [c:who {v:work} long hours, {o:often}] {v:may get} {o:lower marks}.';
		expect(parseExample(src)).toEqual([
			mark('s', 'Students'),
			text(' '),
			{ kind: 'clause', parts: [text('who '), mark('v', 'work'), text(' long hours, '), mark('o', 'often')] },
			text(' '),
			mark('v', 'may get'),
			text(' '),
			mark('o', 'lower marks', '.'),
		]);
		expect(exampleIssues(src)).toEqual([]);
		expect(toMarkup(parseExample(src))).toBe(src);
		expect(keysUsed([parseExample(src)])).toEqual(['s', 'v', 'o', 'c']);
	});

	test('the sentence read aloud has no markup, and (that) is read as that', () => {
		expect(plainText('{s:The price} of flats [c:that are close to the station] {v:has gone up} again.'))
			.toBe('The price of flats that are close to the station has gone up again.');
		expect(plainText('the phone [c:(that) I bought last month]')).toBe('the phone that I bought last month');
		expect(plainText('{s:Prices}  {v:rise}. ')).toBe('Prices rise.');
	});

	test('malformed markup never shows its signs, and is reported', () => {
		const cases = ['{x:Prices} rise.', '{s:Prices rise.', 'Prices] rise.', '[c:when it rains, {s:we} stay', '{s:} rise', '{s:The {o:price}} rose'];
		for (const src of cases) {
			const said = plainText(src);
			expect(said, src).not.toMatch(MARKUP);
			expect(said, src).not.toMatch(/\b[svopc]:/);
			expect(exampleIssues(src).length, src).toBeGreaterThan(0);
		}
		expect(plainText('{x:Prices} rise.')).toBe('Prices rise.');
		expect(exampleIssues('{s: Prices} rise.')).toHaveLength(1);
		expect(parseExample('')).toEqual([]);
	});

	test('the legend lists the marks used, in its own order', () => {
		expect(keysUsed([parseExample('{v:is} {s:it}'), parseExample('[c:if it rains]')])).toEqual(['s', 'v', 'c']);
		expect(keysUsed([])).toEqual([]);
	});
});

describe('paragraph text', () => {
	test('English in backticks is set apart', () => {
		expect(inlineParts('中文常常不用动词。英语要说 `It is hot today.`')).toEqual([
			{ text: '中文常常不用动词。英语要说 ', en: false },
			{ text: 'It is hot today.', en: true },
		]);
		expect(inlineParts('`rise`、`rose`、`has risen`。')).toEqual([
			{ text: 'rise', en: true }, { text: '、', en: false }, { text: 'rose', en: true }, { text: '、', en: false },
			{ text: 'has risen', en: true }, { text: '。', en: false },
		]);
		expect(inlineParts('没有英文')).toEqual([{ text: '没有英文', en: false }]);
		// a lone backtick stays as it is
		expect(inlineParts('a ` b')).toEqual([{ text: 'a ` b', en: false }]);
		expect(inlineParts('')).toEqual([]);
	});

	test('the writing tip loses the title its box already has', () => {
		expect(writingText('写作里用得上：每写完一句，查两件事。')).toBe('每写完一句，查两件事。');
		expect(writingText('写作里用得上: 先写主干。')).toBe('先写主干。');
		expect(writingText('小作文写过去的数据，用过去时。')).toBe('小作文写过去的数据，用过去时。');
	});
});

describe('the course file', () => {
	test('nine stops, 4.0 to 8.0, each with a lesson of five sections', () => {
		expect(grammarContent.line).toBe(6);
		expect(grammarContent.color).toBe('#2F5D4A');
		expect(grammarContent.name).toEqual({ zh: '语法', en: 'Grammar' });
		expect(grammarContent.stops.map(s => s.id)).toEqual(IDS);
		expect(grammarContent.stops.map(s => bandText(s.band))).toEqual(['4.0', '4.5', '5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0']);
		for (const s of grammarContent.stops) {
			const lesson = grammarContent.lessons[s.id];
			expect(lesson, s.id).toBeDefined();
			expect(lesson.sections.map(x => x.id), s.id).toEqual(['s1', 's2', 's3', 's4', 's5']);
			expect(lesson.minutes, s.id).toBeGreaterThan(0);
			expect(lesson.mistakes.length, s.id).toBeGreaterThan(0);
			expect(s.sub && s.focus, s.id).toBeTruthy();
			// what the gate asks, for the end of the lesson
			expect(s.types?.zh, s.id).toContain('连词成句');
		}
	});

	test('nothing in the file is left out as malformed', () => {
		for (const id of IDS) {
			const raw = RAW.lessons[id];
			const lesson = grammarContent.lessons[id];
			expect(lesson.sections.map(x => x.blocks.length), id).toEqual(raw.sections.map(x => x.blocks.length));
			expect(lesson.mistakes.length, id).toBe(raw.mistakes.length);
			// the 常见错误 box goes where the file says
			expect(lesson.mistakesAfter, id).toBe(raw.mistakesAfter);
		}
	});

	test('every example in all nine lessons parses', () => {
		let n = 0;
		for (const id of IDS) {
			for (const sec of RAW.lessons[id].sections) {
				for (const b of sec.blocks) {
					if (b.ex == null) continue;
					n++;
					const where = `${id} ${sec.id}: ${b.ex}`;
					const segments = parseExample(b.ex);
					expect(exampleIssues(b.ex), where).toEqual([]);
					expect(toMarkup(segments), where).toBe(b.ex);
					expect(plainText(b.ex), where).not.toMatch(MARKUP);
					expect(b.zh, where).toBeTruthy();
					for (const s of segments.flatMap(x => (x.kind === 'clause' ? x.parts : [x]))) {
						if (s.kind === 'mark') expect(s.text.trim(), where).toBe(s.text);
						else expect(s.text, where).not.toMatch(MARKUP);
					}
				}
			}
		}
		expect(n).toBeGreaterThan(100);
	});

	test('paragraphs close their backticks, and the writing tips lose their title', () => {
		for (const id of IDS) {
			const lesson = grammarContent.lessons[id];
			const parts = [...lesson.lede, ...lesson.writing, ...lesson.sections.flatMap(s => s.blocks.flatMap(b => (b.kind === 'p' ? b.parts : [])))];
			for (const p of parts) expect(p.text, id).not.toContain('`');
			expect(lesson.writing.length, id).toBeGreaterThan(0);
			expect(lesson.writing.map(p => p.text).join(''), id).not.toMatch(/^写作里用得上/);
			expect(lesson.keys.length, id).toBeGreaterThan(0);
		}
	});

	test('every tag\'s see points at a real section, and the gate\'s result links there', () => {
		let n = 0;
		for (const id of IDS) {
			const sections = RAW.lessons[id].sections.map(s => s.id);
			const tags = RAW.tags[id];
			expect(Object.keys(tags).length, id).toBeGreaterThan(0);
			for (const [key, tag] of Object.entries(tags)) {
				n++;
				expect(key.startsWith(`${id}/`), key).toBe(true);
				expect(sections, key).toContain(tag.see);
				expect(grammarContent.tags[id][key], key).toEqual({ zh: tag.zh, see: tag.see });
				const path = RAW_PRACTICE[key]?.app?.path ?? '';
				expect(path, key).toBe(`/apps/grammar/${id}?section=${tag.see}`);
				expect(sectionFromPath(path, grammarContent.lessons[id]), key).toBe(tag.see);
			}
		}
		expect(n).toBeGreaterThan(40);
	});

	test('the stops before and after along the line, and where links go', () => {
		expect(neighbours(grammarContent, '6.1')).toMatchObject({ prev: null, next: { id: '6.2' } });
		expect(neighbours(grammarContent, '6.5')).toMatchObject({ prev: { id: '6.4' }, next: { id: '6.6' } });
		expect(neighbours(grammarContent, '6.9')).toMatchObject({ prev: { id: '6.8' }, next: null });
		expect(neighbours(grammarContent, '9.9')).toEqual({ prev: null, next: null });
		expect(gatePath('6.2')).toBe('/gate/ielts/6.2');
		expect(lessonPath('6.3')).toBe('/apps/grammar/6.3');
	});
});

describe('reading the file safely', () => {
	const lesson = grammarContent.lessons['6.2'] as GrammarLesson;

	test('?section= in the address: only a section the lesson has', () => {
		expect(sectionFromPath('/apps/grammar/6.2?section=s3', lesson)).toBe('s3');
		expect(sectionFromPath('/apps/grammar/6.2?from=gate&section=s5#top', lesson)).toBe('s5');
		expect(sectionFromPath('/apps/grammar/6.2?section=s9', lesson)).toBeNull();
		expect(sectionFromPath('/apps/grammar/6.2', lesson)).toBeNull();
		expect(sectionFromPath('/apps/grammar/6.2#x?section=s3', lesson)).toBeNull();
	});

	test('malformed stops, sections and blocks are left out', () => {
		const raw = {
			line: 6,
			color: '#2F5D4A',
			stops: [{ id: '6.1', band: 4, title: '句子的主干' }, { id: '6.2', title: 'no band' }, null, { id: '6.1', band: 4, title: 'twice' }],
			lessons: {
				'6.1': {
					lede: 'lede',
					minutes: 'four',
					mistakesAfter: 's9',
					writing: '写作里用得上：一句一个谓语。',
					sections: [
						{ id: 's1', h: 'one', blocks: [{ p: 'a' }, { ex: '' }, { table: [] }, { nope: 1 }, { table: [['who', '人', 'a nurse who works']] }] },
						{ id: 's2', h: 'empty', blocks: [] },
						{ h: 'no id', blocks: [{ p: 'b' }] },
					],
					mistakes: [{ bad: 'x' }, { bad: 'I am agree.', good: 'I agree.' }],
				},
			},
			tags: { '6.1': { '6.1/g-core': { zh: '骨架', see: 's1' }, '6.1/bad': { zh: '' } } },
		};
		const got = toGrammarContent(raw, LINES);
		expect(got.stops.map(s => s.title)).toEqual(['句子的主干']);
		const l = got.lessons['6.1'];
		expect(l.sections.map(s => s.id)).toEqual(['s1']);
		expect(l.sections[0].blocks.map(b => b.kind)).toEqual(['p', 'table']);
		expect(l.sections[0].blocks[1]).toEqual({ kind: 'table', head: null, rows: [['who', '人', 'a nurse who works']] });
		expect(l.minutes).toBeNull();
		expect(l.mistakesAfter).toBe('s1');
		expect(l.mistakes).toEqual([{ bad: 'I am agree.', good: 'I agree.', why: '' }]);
		expect(l.writing).toEqual([{ text: '一句一个谓语。', en: false }]);
		expect(got.tags).toEqual({ '6.1': { '6.1/g-core': { zh: '骨架', see: 's1' } } });
		expect(toLesson({ sections: [] })).toBeNull();
		expect(toGrammarContent(null, null).stops).toEqual([]);
	});
});

// The lesson page itself moved out to the 语法课 mini app (miniapps/grammar, /apps/grammar/<stop>, 小程序搬出社区
// 2026-11-12); scripts/qa/grammar-check.mjs checks it in a browser. The course file and its marks stay tested here.
