/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { GRAMMAR_PACK_KINDS, GRAMMAR_PACK_RULES, grammarPackProblems } from '@/misc/lojo-grammar-pack.js';

// 语法课在数据库里（2026-11-17 起）：这里只用示例讲解，查导入前的格式检查。
const pack = () => ({
	line: 6,
	color: '#2F5D4A',
	stops: [
		{ id: '6.1', band: 4, title: '示例站一', sub: '示例', focus: '示例' },
		{ id: '6.2', band: 4.5, title: '示例站二' },
	] as Record<string, unknown>[],
	lessons: {
		'6.1': {
			lede: '示例导语。',
			minutes: 4,
			mistakesAfter: 's2',
			writing: '写作里用得上：示例。',
			sections: [
				{ id: 's1', h: '示例一', blocks: [{ p: '示例段落。' }, { ex: '{s:Prices} {v:rise}.', zh: '价格上涨。' }] },
				{ id: 's2', h: '示例二', blocks: [{ table: [['who', '人', 'a nurse who works']] }] },
			],
			mistakes: [{ bad: 'I am agree.', good: 'I agree.', why: '示例。' }],
		},
		'6.2': { sections: [{ id: 's1', h: '示例', blocks: [{ p: '示例。' }] }] },
	} as Record<string, Record<string, unknown>>,
	tags: { '6.1': { '6.1/g-core': { zh: '示例标签', see: 's1' } } } as Record<string, Record<string, unknown>>,
});
const file = (over: Record<string, unknown> = {}) => ({ version: '示例@1', source: '示例', pack: { ...pack(), ...over } });

describe('语法课：导入前查格式', () => {
	test('a sound file has no problems', () => {
		expect(grammarPackProblems(file())).toEqual([]);
		// tags and mistakes may be left out
		expect(grammarPackProblems(file({ tags: undefined }))).toEqual([]);
	});

	test('not the file shape', () => {
		expect(grammarPackProblems(null)).toHaveLength(1);
		expect(grammarPackProblems(pack())).toHaveLength(1);
		expect(grammarPackProblems({ source: '', pack: pack() })).toContain('缺 version');
	});

	test('stops, and a lesson for every stop', () => {
		expect(grammarPackProblems(file({ stops: [] }))).toEqual(['stops 没有站']);
		const noBand = pack().stops;
		noBand[1].band = '4.5';
		expect(grammarPackProblems(file({ stops: noBand }))).toEqual(['第 2 站: 要有 id、title 和数字 band']);
		const twice = pack().stops;
		twice[1].id = '6.1';
		expect(grammarPackProblems(file({ stops: twice }))).toEqual(['站号 6.1 重复']);
		const lessons = pack().lessons;
		delete lessons['6.2'];
		expect(grammarPackProblems(file({ lessons }))).toEqual(['6.2: 没有讲解（lessons 里要有它，至少一节）']);
	});

	test('sections, blocks and mistakes', () => {
		const lessons = pack().lessons;
		lessons['6.1'].sections = [
			{ id: 's1', h: '示例', blocks: [{ p: '' }, { ex: 'x' }, { table: [] }, { table: [['a', 1]] }] },
			{ id: 's1', h: '重复', blocks: [{ p: '示例。' }] },
			{ id: 's3', h: '空', blocks: [] },
		];
		lessons['6.1'].mistakes = [{ bad: 'x' }];
		expect(grammarPackProblems(file({ lessons, tags: {} }))).toEqual([
			'6.1 s1 第 1 段: 要是 { p }、{ ex, zh } 或 { table }',
			'6.1 s1 第 2 段: 要是 { p }、{ ex, zh } 或 { table }',
			'6.1 s1 第 3 段: 要是 { p }、{ ex, zh } 或 { table }',
			'6.1 s1 第 4 段: 要是 { p }、{ ex, zh } 或 { table }',
			'6.1 节号 s1 重复',
			'6.1 第 3 节: 要有 id、h（标题）和 blocks',
			'6.1: mistakes 每条要有 bad 和 good',
		]);
	});

	test('a tag sends the learner back to a part the lesson has', () => {
		expect(grammarPackProblems(file({ tags: { '6.1': { '6.1/g-core': { zh: '示例', see: 's9' } } } }))).toEqual(['6.1/g-core: see s9 不是 6.1 讲解里的一节']);
		expect(grammarPackProblems(file({ tags: { '6.1': { '6.1/g-core': { zh: '' } } } }))).toEqual(['6.1/g-core: 要有 zh 和 see']);
		expect(grammarPackProblems(file({ tags: { '9.9': {} } }))).toEqual(['tags 9.9: 没有这一站，或不是「标签 → { zh, see }」']);
		expect(grammarPackProblems(file({ tags: [] }))).toEqual(['tags 要是「站号 → 标签」']);
	});

	test('size limit, and kinds are named grammar-<catalog id>', () => {
		const lessons = pack().lessons;
		lessons['6.2'].lede = 'x'.repeat(GRAMMAR_PACK_RULES.maxBytes);
		expect(grammarPackProblems(file({ lessons }))[0]).toMatch(/^pack 太大/);
		for (const k of GRAMMAR_PACK_KINDS) expect(k).toMatch(/^grammar-[a-z0-9-]+$/);
	});
});
