/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { TYPING_PACK_KINDS, TYPING_PACK_RULES, typingPackProblems } from '@/misc/lojo-typing-pack.js';

// 打字课在数据库里（2026-11-17 起）：这里只用示例题目，查导入前的格式检查。
const pack = () => ({
	line: { n: 0, zh: '示例线', en: 'Example line', color: '#B4457E' },
	goal: { wpm: 20, acc: 95 },
	stops: [
		{ id: 'a', kind: 'copy', zh: '示例一', en: 'Example one', need: 1, items: [{ target: '14 March', field: 'Date' }, { prefix: '£', target: '9.50' }] },
		{ id: 'b', kind: 'spell', zh: '示例二', en: 'Example two', need: 1, items: [{ spell: 'n[ece]ssary', zh: '必要的', sentence: 'It is ___.' }] },
		{ id: 'c', kind: 'listen', zh: '示例三', en: 'Example three', need: 1, rows: [{ say: 'It costs nine pounds.', note: 'Price: £___', answer: ['9'] }] },
		{ id: 'd', kind: 'copy', zh: '示例四', en: 'Example four', items: [{ target: 'An example sentence.' }] },
		{ id: 'e', kind: 'mock', zh: '示例五', en: 'Example five', text: 'An example passage.', seconds: 60 },
	] as Record<string, unknown>[],
});
const file = (over: Record<string, unknown> = {}) => ({ version: '示例@1', source: '示例', pack: { ...pack(), ...over } });

describe('打字课：导入前查格式', () => {
	test('a sound file has no problems', () => {
		expect(typingPackProblems(file())).toEqual([]);
	});

	test('not the file shape', () => {
		expect(typingPackProblems(null)).toHaveLength(1);
		expect(typingPackProblems(pack())).toHaveLength(1);
		expect(typingPackProblems({ source: '', pack: pack() })).toContain('缺 version');
	});

	test('the line and the goal', () => {
		expect(typingPackProblems(file({ line: { zh: '示例' } }))).toEqual(['line 要有数字 n 和 zh、en']);
		expect(typingPackProblems(file({ goal: { wpm: 20, acc: 0 } }))).toEqual(['goal 要有 wpm 和 acc（正数）']);
	});

	test('stops: ids, names and kinds', () => {
		expect(typingPackProblems(file({ stops: [] }))).toEqual(['stops 没有站']);
		const stops = pack().stops;
		stops[1].id = 'a';
		delete stops[2].en;
		stops[3].kind = 'draw';
		delete stops[4].text;
		expect(typingPackProblems(file({ stops }))).toEqual([
			'站号 a 重复',
			'第 3 站: 要有 id、zh 和 en',
			'd: kind 要是 copy、spell、listen 或 mock',
			'e: 模拟要有 text（要打的那段）',
		]);
	});

	test('each kind of item, and need', () => {
		const stops = pack().stops;
		stops[0].items = [{ field: 'Date' }];
		stops[1].items = [{ spell: 'n[ece]ssary', zh: '必要的', sentence: 'No gap here.' }];
		stops[2].rows = [{ say: 'Nine.', note: '___', answer: [] }];
		stops[3].items = [];
		expect(typingPackProblems(file({ stops }))).toEqual([
			'a 第 1 题: 要有 target（要打的字）',
			'b 第 1 题: 要有 spell、zh 和带 ___ 的 sentence',
			'c 第 1 题: 要有 say、note 和 answer（至少一个答案）',
			'd: 没有题（items）',
		]);
		const more = pack().stops;
		more[0].need = 3;
		more[1].need = '1';
		expect(typingPackProblems(file({ stops: more }))).toEqual(['a: need 要是正数，不能比题多（2 题）', 'b: need 要是正数，不能比题多（1 题）']);
	});

	test('size limit, and kinds are named typing-<catalog id>', () => {
		const stops = pack().stops;
		stops[4].text = 'x'.repeat(TYPING_PACK_RULES.maxBytes);
		expect(typingPackProblems(file({ stops }))[0]).toMatch(/^pack 太大/);
		for (const k of TYPING_PACK_KINDS) expect(k).toMatch(/^typing-[a-z0-9-]+$/);
	});
});
