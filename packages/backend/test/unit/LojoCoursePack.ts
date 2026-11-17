/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { COURSE_PACK_KINDS, COURSE_PACK_RULES, coursePackProblems, packHash } from '@/misc/lojo-course-pack.js';

// 课程线路包在数据库里（2026-11-17 起）：这里只用示例包，查导入前的格式检查。
const pack = () => ({
	META: { id: 'example', kind: 'gates', storeKey: 'example', tag: 'EX', group: { zh: '示例', en: 'Example' } },
	LINES: [
		{ n: 1, id: 'listening', zh: '示例听力', en: 'Example listening', live: true, stations: [{ id: '1.1', band: 4 }, { id: '1.2', band: 4.5 }] },
		{ n: 2, id: 'reading', zh: '示例阅读', en: 'Example reading', live: false, stations: [{ id: '2.1', band: 4 }] },
	],
	WARMUP: null,
	INTERCHANGES: [],
	TAGS: { spelling: { zh: '拼写', en: 'Spelling' } },
	PRACTICE: {},
	CANVAS: { w: 100, h: 100 }, POS: {}, PATHS: {}, TAGPOS: {}, BBOX: { x: 0, y: 0, w: 100, h: 100 },
	TEXT: { zh: { title: '示例', legal: '' }, en: { title: 'Example', legal: '' } },
	TOUR: { steps: 3, zh: { go: '去 {0}' }, en: { go: 'Go to {0}' } },
});
const file = (over: Record<string, unknown> = {}) => ({ version: '示例@1', source: '示例', pack: { ...pack(), ...over } });

describe('课程线路包：导入前查格式', () => {
	test('a sound file has no problems', () => {
		expect(coursePackProblems(file())).toEqual([]);
	});

	test('not the file shape', () => {
		expect(coursePackProblems(null)).toHaveLength(1);
		expect(coursePackProblems(pack())).toHaveLength(1);
		expect(coursePackProblems({ source: '', pack: pack() })).toContain('缺 version');
	});

	test('lines and stops', () => {
		expect(coursePackProblems(file({ LINES: [] }))).toContain('LINES 没有线');
		expect(coursePackProblems(file({ LINES: [{ n: 1, id: 'x', zh: '', en: 'X', live: true, stations: [] }] }))).toEqual(['LINES 第 1 条: 要有 n、id、zh、en、live、stations']);
		const twice = pack().LINES;
		twice[1].stations[0].id = '1.1';
		expect(coursePackProblems(file({ LINES: twice }))).toEqual(['站号 1.1 重复']);
		const noBand = pack().LINES;
		(noBand[0].stations[1] as { band?: number }).band = undefined;
		expect(coursePackProblems(file({ LINES: noBand }))).toEqual(['LINES 第 1 条 第 2 站: 要有 id 和 band']);
	});

	test('the parts the pages read', () => {
		expect(coursePackProblems(file({ META: { id: 'x' } }))).toEqual(['META 要有 id、kind、storeKey']);
		expect(coursePackProblems(file({ PATHS: undefined }))).toEqual(['缺 PATHS']);
		expect(coursePackProblems(file({ TEXT: { zh: { title: '示例' } } }))).toEqual(['TEXT 要有 zh、en 两种的 title']);
		expect(coursePackProblems(file({ TAGS: { form: { zh: '表格' } } }))).toEqual(['TAGS.form 要有 zh 和 en']);
	});

	test('tour captions are text, with {0} where a value goes', () => {
		expect(coursePackProblems(file({ TOUR: { zh: { go: 1 }, en: { go: 'Go to {0}' } } }))).toEqual(['TOUR.zh.go 要是文字（带值的地方写 {0}）']);
		expect(coursePackProblems(file({ TOUR: { zh: { go: '去 {0}' } } }))).toEqual(['TOUR.en 缺']);
	});

	test('size limit', () => {
		const big = { zh: 'x'.repeat(COURSE_PACK_RULES.maxBytes), en: 'x' };
		expect(coursePackProblems(file({ TAGS: { big } }))[0]).toMatch(/^pack 太大/);
	});

	test('the same data always gets the same hash', () => {
		expect(packHash(pack())).toBe(packHash(pack()));
		expect(packHash(pack())).toMatch(/^[0-9a-f]{16}$/);
		expect(packHash({ ...pack(), TAGS: {} })).not.toBe(packHash(pack()));
	});

	test('course kinds are named course-<catalog id>', () => {
		for (const k of COURSE_PACK_KINDS) expect(k).toMatch(/^course-[a-z0-9-]+$/);
	});
});
