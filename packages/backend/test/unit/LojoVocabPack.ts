/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { VOCAB_PACK_KINDS, VOCAB_PACK_RULES, vocabPackProblems } from '@/misc/lojo-vocab-pack.js';

// 词表在数据库里（2026-11-17 起）：这里只用示例词表，查导入前的格式检查。
const pack = () => ({
	line: 5,
	color: '#6E4F8F',
	gate: { total: 10, spell: 6, choose: 4, pass: 8, plays: 3 },
	stops: [
		{ id: '5.1', band: 4, topic: '示例站一', uses: ['1.1'], groups: [{ label: '示例组', words: [
			{ w: 'postcode', ipa: '/ˈpəʊstkəʊd/', pos: 'n.', zh: '邮政编码', ex: 'Don\'t forget the postcode.' },
			{ w: 'enrol', alt: ['enroll'], ipa: '/ɪnˈrəʊl/', pos: 'v.', zh: '注册', ex: 'I want to enrol on a course.' },
		] }] },
		{ id: '5.2', band: 4.5, topic: '示例站二', groups: [{ label: '示例组', words: [{ w: 'flat', zh: '公寓' }] }] },
	],
});
const file = (over: Record<string, unknown> = {}) => ({ version: '示例@1', source: '示例', pack: { ...pack(), ...over } });

describe('词表：导入前查格式', () => {
	test('a sound file has no problems', () => {
		expect(vocabPackProblems(file())).toEqual([]);
	});

	test('not the file shape', () => {
		expect(vocabPackProblems(null)).toHaveLength(1);
		expect(vocabPackProblems(pack())).toHaveLength(1);
		expect(vocabPackProblems({ source: '', pack: pack() })).toContain('缺 version');
	});

	test('stops and groups', () => {
		expect(vocabPackProblems(file({ stops: [] }))).toEqual(['stops 没有站']);
		expect(vocabPackProblems(file({ stops: [{ id: '5.1', topic: '示例', groups: [] }] }))).toEqual(['第 1 站: 要有 id、topic 和至少一组词（groups）']);
		const twice = pack().stops;
		twice[1].id = '5.1';
		expect(vocabPackProblems(file({ stops: twice }))).toEqual(['站号 5.1 重复']);
		const noWords = pack().stops;
		noWords[1].groups = [{ label: '空', words: [] }];
		expect(vocabPackProblems(file({ stops: noWords }))).toEqual(['5.2 第 1 组: 要有 words']);
	});

	test('every word has its spelling and meaning; alt and uses are lists of text', () => {
		const bad = pack().stops;
		(bad[0].groups[0].words[0] as { zh?: string }).zh = '';
		(bad[0].groups[0].words[1] as { alt?: unknown }).alt = 'enroll';
		(bad[0] as { uses?: unknown }).uses = '1.1';
		expect(vocabPackProblems(file({ stops: bad }))).toEqual([
			'5.1: uses 要是站号列表',
			'5.1 第 1 组第 1 个词: 要有 w（词）和 zh（意思）',
			'5.1 enrol: alt 要是文字列表',
		]);
		expect(vocabPackProblems(file({ gate: { total: '10' } }))).toEqual(['gate 里要都是数字']);
	});

	test('size limit, and kinds are named vocab-<catalog id>', () => {
		const big = pack().stops;
		big[1].groups[0].words[0].zh = 'x'.repeat(VOCAB_PACK_RULES.maxBytes);
		expect(vocabPackProblems(file({ stops: big }))[0]).toMatch(/^pack 太大/);
		for (const k of VOCAB_PACK_KINDS) expect(k).toMatch(/^vocab-[a-z0-9-]+$/);
	});
});
