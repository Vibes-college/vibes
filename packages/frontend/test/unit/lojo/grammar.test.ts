/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { exampleIssues, inlineParts, keysUsed, parseExample, plainText, toMarkup, writingText } from '@/lojo/grammar/marks.js';
import type { Segment } from '@/lojo/grammar/marks.js';
import { bandText, gatePath, lessonPath, neighbours, sectionFromPath, toGrammarContent, toLesson } from '@/lojo/grammar/content.js';
import type { GrammarLesson } from '@/lojo/grammar/content.js';

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

// 示例: the lessons are in the site's database since 2026-11-17, not in the code. content-import.mjs grammar-ielts
// checks the real ones before they go in (every example's marks, the writing tips, every tag's section and its
// link from the gate's result). Here: example lessons in the same shape.
const EXAMPLE = {
	line: 6,
	color: '#2F5D4A',
	stops: [
		{ id: '6.1', band: 4, title: '示例站一', sub: '示例副标题', focus: '示例重点' },
		{ id: '6.2', band: 4.5, title: '示例站二' },
		{ id: '6.3', band: 5, title: '示例站三' },
	],
	lessons: {
		'6.1': {
			lede: '示例导语，英语要说 `It is hot today.`',
			minutes: 4,
			mistakesAfter: 's1',
			writing: '写作里用得上：示例。',
			sections: [
				{ id: 's1', h: '示例一', blocks: [{ p: '示例段落。' }, { ex: '{s:Prices} {v:rise}.', zh: '价格上涨。' }] },
				{ id: 's2', h: '示例二', blocks: [{ ex: '[c:When it rains], {s:we} {v:stay} home.', zh: '示例。' }] },
			],
			mistakes: [{ bad: 'I am agree.', good: 'I agree.', why: '示例。' }],
		},
		'6.2': { sections: [{ id: 's1', h: '示例', blocks: [{ p: '示例。' }] }, { id: 's3', h: '示例三', blocks: [{ p: '示例。' }] }] },
		'6.3': { sections: [{ id: 's1', h: '示例', blocks: [{ p: '示例。' }] }] },
	},
	tags: { '6.1': { '6.1/g-core': { zh: '示例标签', see: 's1' } }, '6.2': { '6.2/g-x': { zh: '示例', see: 's3' } } },
};
// the route lines (the course's route pack): the line's name, and each gate's question types
const EXAMPLE_LINES = [
	{ n: 1, zh: '听力', en: 'Listening', stations: [{ id: '1.1' }] },
	{ n: 6, zh: '语法（示例）', en: 'Grammar (example)', stations: [{ id: '6.1', types: { zh: '连词成句、选择', en: 'Word order, choice' } }, { id: '6.2' }] },
];
const content = toGrammarContent(EXAMPLE, EXAMPLE_LINES);

describe('the lessons (示例)', () => {
	test('stops in line order; the line\'s name and the gates\' question types come from the route lines', () => {
		expect(content.line).toBe(6);
		expect(content.color).toBe('#2F5D4A');
		expect(content.name).toEqual({ zh: '语法（示例）', en: 'Grammar (example)' });
		expect(content.stops.map(s => s.id)).toEqual(['6.1', '6.2', '6.3']);
		expect(content.stops.map(s => bandText(s.band))).toEqual(['4.0', '4.5', '5.0']);
		expect(content.stops[0]).toMatchObject({ sub: '示例副标题', focus: '示例重点', types: { zh: '连词成句、选择', en: 'Word order, choice' } });
		expect(content.stops[1]).toMatchObject({ sub: '', focus: '', types: null });
		// before the route lines are read: 语法, and no question types
		const alone = toGrammarContent(EXAMPLE, null);
		expect(alone.name).toEqual({ zh: '语法', en: 'Grammar' });
		expect(alone.stops.map(s => s.types)).toEqual([null, null, null]);
		expect(alone.lessons).toEqual(content.lessons);
	});

	test('a lesson as written', () => {
		const l = content.lessons['6.1'];
		expect(l.sections.map(s => s.id)).toEqual(['s1', 's2']);
		expect(l.sections.map(s => s.blocks.map(b => b.kind))).toEqual([['p', 'ex'], ['ex']]);
		expect(l.sections[0].blocks[1]).toMatchObject({ kind: 'ex', say: 'Prices rise.', zh: '价格上涨。' });
		expect(l.minutes).toBe(4);
		expect(l.mistakesAfter).toBe('s1');
		expect(l.lede).toEqual([{ text: '示例导语，英语要说 ', en: false }, { text: 'It is hot today.', en: true }]);
		expect(l.writing).toEqual([{ text: '示例。', en: false }]);
		expect(l.mistakes).toEqual([{ bad: 'I am agree.', good: 'I agree.', why: '示例。' }]);
		expect(l.keys).toEqual(['s', 'v', 'c']);
		// no minutes, no mistakesAfter: the 常见错误 box goes after the last part
		expect(content.lessons['6.2']).toMatchObject({ minutes: null, mistakesAfter: 's3', mistakes: [], writing: [] });
	});

	test('a tag sends the learner back to its part of the lesson', () => {
		expect(content.tags).toEqual({ '6.1': { '6.1/g-core': { zh: '示例标签', see: 's1' } }, '6.2': { '6.2/g-x': { zh: '示例', see: 's3' } } });
		expect(sectionFromPath('/apps/grammar/6.2?section=s3', content.lessons['6.2'])).toBe('s3');
	});

	test('the stops before and after along the line, and where links go', () => {
		expect(neighbours(content, '6.1')).toMatchObject({ prev: null, next: { id: '6.2' } });
		expect(neighbours(content, '6.2')).toMatchObject({ prev: { id: '6.1' }, next: { id: '6.3' } });
		expect(neighbours(content, '6.3')).toMatchObject({ prev: { id: '6.2' }, next: null });
		expect(neighbours(content, '9.9')).toEqual({ prev: null, next: null });
		expect(gatePath('6.2')).toBe('/gate/ielts/6.2');
		expect(lessonPath('6.3')).toBe('/apps/grammar/6.3');
	});
});

describe('reading the file safely', () => {
	const lesson = toLesson({ sections: ['s1', 's2', 's3', 's4', 's5'].map(id => ({ id, h: '示例', blocks: [{ p: '示例。' }] })) }) as GrammarLesson;

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
		const got = toGrammarContent(raw, EXAMPLE_LINES);
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

	test('a stop keeps its place without a lesson; tags only for stops the line has', () => {
		const raw = {
			...EXAMPLE,
			stops: [...EXAMPLE.stops, { id: '6.4', band: 5.5, title: '示例站四' }],
			tags: { ...EXAMPLE.tags, '6.4': { '6.4/g-y': { zh: '示例', see: 's1' } }, '9.9': { '9.9/g-z': { zh: '示例', see: 's1' } } },
		};
		const got = toGrammarContent(raw, EXAMPLE_LINES);
		// 6.4 is on the line (the page says its lesson is not ready), but has no lesson to read
		expect(got.stops.map(s => s.id)).toEqual(['6.1', '6.2', '6.3', '6.4']);
		expect(Object.keys(got.lessons)).toEqual(['6.1', '6.2', '6.3']);
		expect(neighbours(got, '6.3').next).toMatchObject({ id: '6.4' });
		// a tag of a stop that is not on the line is left out
		expect(Object.keys(got.tags)).toEqual(['6.1', '6.2', '6.4']);
	});

	test('the line\'s name: the route line with the same number, or 语法', () => {
		// the file says line 7: the name and the question types come from route line 7, not 6
		const seven = toGrammarContent({ ...EXAMPLE, line: 7 }, [...EXAMPLE_LINES, { n: 7, zh: '示例七号线', en: 'Line 7 (example)', stations: [{ id: '6.2', types: { zh: '示例题型', en: 'Example' } }] }]);
		expect(seven.line).toBe(7);
		expect(seven.name).toEqual({ zh: '示例七号线', en: 'Line 7 (example)' });
		expect(seven.stops.map(s => s.types?.zh ?? null)).toEqual([null, '示例题型', null]);
		// route lines that are not a list, or have no such line: 语法, no question types
		for (const lines of [{ n: 6 }, [], [{ n: 1, zh: '听力' }], 'lines']) {
			const got = toGrammarContent(EXAMPLE, lines);
			expect(got.name, JSON.stringify(lines)).toEqual({ zh: '语法', en: 'Grammar' });
			expect(got.stops.every(s => s.types == null)).toBe(true);
		}
		// no line number in the file: 6
		expect(toGrammarContent({ ...EXAMPLE, line: '6' }, EXAMPLE_LINES).name.zh).toBe('语法（示例）');
	});
});

// The lesson page itself moved out to the 语法课 mini app (miniapps/grammar, /apps/grammar/<stop>, 小程序搬出社区
// 2026-11-12); scripts/qa/grammar-check.mjs checks it in a browser. The marks and how lessons are read stay tested
// here; the real lessons are checked by content-import.mjs grammar-ielts before they go into the database.
