/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { DICTATION_PACK_KINDS, DICTATION_PACK_RULES, dictationPackProblems } from '@/misc/lojo-dictation-pack.js';

// 听写在数据库里（2026-11-17 起）：这里只用示例题目，查导入前的格式检查。
const pack = () => ({
	perRound: 2,
	guide: 'example-guide',
	sets: [
		{
			id: 'a', tag: 'example', zh: '示例一', en: 'Example one', mode: 'live', limit: null, instructions: null,
			items: [
				{ id: 'a-1', answer: ['colour', 'color'], line: 'The {} is red.', say: 'The colour is red.', hint: '示例提示', rule: '示例规则', lineZh: '示例' },
				{ id: 'a-2', answer: ['example'], line: 'An {}.', say: 'An example.' },
			] as Record<string, unknown>[],
		},
		{
			id: 'b', tag: 'example', zh: '示例二', en: 'Example two', mode: 'enter', limit: { words: 1, number: true },
			instructions: { zh: '写一个词或数字', en: 'ONE WORD AND/OR A NUMBER' },
			items: [
				{ id: 'b-1', kind: 'phone', answer: ['01234'], ignoreSpaces: true, line: 'Phone: {}', say: 'Zero one two three four.' },
				{ id: 'b-2', number: 'pl', answer: ['boxes'], near: ['box'], line: 'Bring two {}.', say: 'Bring two boxes.' },
			] as Record<string, unknown>[],
		},
	] as Record<string, unknown>[],
});
const file = (over: Record<string, unknown> = {}) => ({ version: '示例@1', source: '示例', pack: { ...pack(), ...over } });

describe('听写：导入前查格式', () => {
	test('a sound file has no problems', () => {
		expect(dictationPackProblems(file())).toEqual([]);
	});

	test('not the file shape', () => {
		expect(dictationPackProblems(null)).toHaveLength(1);
		expect(dictationPackProblems(pack())).toHaveLength(1);
		expect(dictationPackProblems({ source: '', pack: pack() })).toContain('缺 version');
	});

	test('perRound and guide', () => {
		expect(dictationPackProblems(file({ perRound: 0, guide: '' }))).toEqual(['perRound 要是正整数（每组出几题）', '要有 guide（做错时链到的攻略）']);
		expect(dictationPackProblems(file({ perRound: 1.5 }))).toEqual(['perRound 要是正整数（每组出几题）']);
	});

	test('sets: ids, names, mode, limit, instructions', () => {
		expect(dictationPackProblems(file({ sets: [] }))).toEqual(['sets 没有组']);
		const sets = pack().sets;
		sets[1].id = 'a';
		sets[1].mode = 'type';
		sets[1].limit = { words: 0, number: true };
		sets[1].instructions = { zh: '只有中文' };
		expect(dictationPackProblems(file({ sets }))).toEqual([
			'组号 a 重复',
			'a: mode 要是 live 或 enter',
			'a: limit 要是 null 或 { words, number }',
			'a: instructions 要是 null 或 { zh, en }',
		]);
		const more = pack().sets;
		delete more[0].en;
		more[1].items = [];
		expect(dictationPackProblems(file({ sets: more }))).toEqual(['第 1 组: 要有 id、zh 和 en', 'b: 没有题']);
	});

	test('items: ids unique across sets, answer, line, say and the optional fields', () => {
		const sets = pack().sets;
		const [a, b] = [sets[0].items as Record<string, unknown>[], sets[1].items as Record<string, unknown>[]];
		b[0].id = 'a-1';
		a[1].answer = [];
		b[1].line = 'No gap.';
		a[0].say = '';
		expect(dictationPackProblems(file({ sets }))).toEqual([
			'a-1: 要有 say（录音读的话）',
			'a-2: 要有 answer（至少一个写法）',
			'题号 a-1 重复',
			'b-2: 要有带 {} 的 line',
		]);
		const more = pack().sets;
		const [c, d] = [more[0].items as Record<string, unknown>[], more[1].items as Record<string, unknown>[]];
		c[0].hint = 3;
		c[1].near = 'examples';
		d[0].ignoreSpaces = 'yes';
		d[1].number = 'many';
		delete d[1].id;
		expect(dictationPackProblems(file({ sets: more }))).toEqual([
			'a-1: hint 要是文字',
			'a-2: near 要是一串写法',
			'b-1: ignoreSpaces 要是 true 或 false',
			'b 第 2 题: 要有 id',
		]);
	});

	test('size limit, and kinds are named dictation-<catalog id>', () => {
		const sets = pack().sets;
		(sets[0].items as Record<string, unknown>[])[0].rule = 'x'.repeat(DICTATION_PACK_RULES.maxBytes);
		expect(dictationPackProblems(file({ sets }))[0]).toMatch(/^pack 太大/);
		for (const k of DICTATION_PACK_KINDS) expect(k).toMatch(/^dictation-[a-z0-9-]+$/);
	});
});
