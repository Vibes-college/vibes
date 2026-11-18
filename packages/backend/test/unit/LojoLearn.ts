/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { LEARN_DEFAULTS, learnDayKey, learnDayText, learnJourney, learnView, learnWorkInput } from '@/misc/lojo-learn.js';
import type { LearnRecord, LearnWorkRow } from '@/misc/lojo-learn.js';

// 资料页「学习」标签：示例学员、示例作品，不是真实数据。
const L: LearnRecord = {
	days: [
		{ day: '2026-10-02', n: 3, apps: { quest: 2, dictation: 1 } },
		{ day: '2026-11-15', n: 4, apps: { typing: 3, works: 1 } },
	],
	levels: [{ id: '1-start', at: '2026-10-01T02:00:00Z' }, { id: '1-1', at: '2026-10-02T02:00:00Z' }, { id: '2-1', at: '2026-10-20T02:00:00Z' }],
	joinedAt: '2026-09-20T00:00:00Z',
};
const work = (o: Partial<LearnWorkRow> = {}): LearnWorkRow => ({
	major: 'ielts', title: '示例：一次全真模考', oneLine: '示例一句话', items: [{ kind: 'link', url: 'https://example.com/a', label: '示例' }],
	before: null, after: null, reflection: '示例复盘', score: { text: '示例 6.5', image: '' },
	journey: learnJourney(L, ['第一章']), createdAt: '2026-11-15T04:00:00Z', ...o,
});
const base = { L, chapterTitle: '第二章', name: '示例', shareUrl: 'https://example.com/@example/learn', now: new Date('2026-11-17T20:00:00Z') };

describe('资料页「学习」标签：谁看得到', () => {
	test('public by default: outsiders see the grid, works and 「我是怎么学的」', () => {
		const v = learnView({ ...base, p: { ...LEARN_DEFAULTS }, works: [work()], owner: false });
		expect(v.visible).toBe(true);
		expect(v.grid).toHaveLength(2);
		expect(v.works).toHaveLength(1);
		expect(v.how?.map(r => r[0])).toEqual(['方向', '工具', '圈子']);
		expect(v.me).toBeNull();
	});

	test('turned off or taken down: outsiders get nothing, the owner still sees all', () => {
		for (const p of [{ ...LEARN_DEFAULTS, isPublic: false }, { ...LEARN_DEFAULTS, takenDown: true }]) {
			const out = learnView({ ...base, p, works: [work()], owner: false });
			expect(out).toMatchObject({ visible: false, grid: null, how: null, works: [], studying: [], contact: null });
			const mine = learnView({ ...base, p, works: [work()], owner: true });
			expect(mine.visible).toBe(true);
			expect(mine.works).toHaveLength(1);
			expect(mine.me?.public).toBe(false);
		}
	});

	test('the score shows when it is filled in; a contact turns into a link', () => {
		const v = learnView({ ...base, p: { ...LEARN_DEFAULTS, contact: 'someone@example.com' }, works: [work(), work({ major: 'x', score: { text: '', image: '' } })], owner: false });
		expect(v.works[0].score).toEqual({ text: '示例 6.5', image: '' });
		expect(v.works[1].score).toBeNull();
		expect(v.contact).toEqual({ href: 'mailto:someone@example.com' });
	});

	test('studying IELTS until an IELTS work is handed in', () => {
		expect(learnView({ ...base, p: { ...LEARN_DEFAULTS }, works: [], owner: false }).studying).toEqual(['ielts']);
		expect(learnView({ ...base, p: { ...LEARN_DEFAULTS }, works: [work()], owner: false }).studying).toEqual([]);
	});

	test('the owner gets the share card from the first work', () => {
		const v = learnView({ ...base, p: { ...LEARN_DEFAULTS }, works: [work()], owner: true });
		expect(v.me?.share).toEqual({ name: '示例', major: 'ielts', title: '示例：一次全真模考', line: '示例一句话', url: base.shareUrl });
	});
});

describe('资料页「学习」标签：文字', () => {
	test('day text, Beijing days', () => {
		expect(learnDayText({ quest: 2, dictation: 1, works: 1, unknown: 5 })).toBe('过了 2 关，更新了毕业作品，听写练了 1 次');
		expect(learnDayText({ wordbook: 2 })).toBe('生词本复习了 2 次');
		expect(learnDayKey('2026-11-17T17:00:00Z')).toBe('2026-11-18');
	});

	test('「我是怎么学的」 rows', () => {
		const v = learnView({ ...base, p: { ...LEARN_DEFAULTS, sources: ['示例频道'] }, works: [], owner: false });
		expect(v.how).toEqual([
			['信息', '在时间线上订了：示例频道'],
			['方向', '在走雅思路线图：过了 2 关，现在在第二章'],
			['工具', '机考打字 3 次、听写 1 次'],
			['圈子', '在学雅思，2026 年秋季加入'],
		]);
	});

	test('「怎么学出来的」 rows, with the mini apps used', () => {
		const v = learnView({ ...base, p: { ...LEARN_DEFAULTS }, works: [work()], owner: false });
		expect(v.works[0].journey).toEqual([
			['用时', '从 10 月 1 日（2026）开始，到交作品用了 45 天'],
			['关卡', '过了雅思路线图的 2 关：第一章 1 关、第二章 1 关'],
			['章节', '打过了 第一章 的 Boss'],
			['用到的小程序', '听写、机考打字'],
		]);
	});
});

describe('资料页「学习」标签：交作品', () => {
	const ok = { title: ' 示例标题 ', oneLine: '示例', reflection: '示例复盘', items: [{ kind: 'link', url: 'https://example.com/a' }, { kind: 'odd', url: '  ' }] };
	test('cleans what was typed', () => {
		const r = learnWorkInput('ielts', { ...ok, score: { text: '', image: '' }, before: { text: '示例' } });
		expect(r).toEqual({ ok: {
			title: '示例标题', oneLine: '示例', reflection: '示例复盘', items: [{ kind: 'link', url: 'https://example.com/a', label: '' }],
			score: null, before: { text: '示例', image: '' }, after: null,
		} });
	});
	test('errors', () => {
		expect(learnWorkInput('nope', ok)).toEqual({ error: 'major' });
		expect(learnWorkInput('ielts', { ...ok, title: '  ' })).toEqual({ error: 'title' });
		expect(learnWorkInput('ielts', { ...ok, reflection: '' })).toEqual({ error: 'reflection' });
	});
});
