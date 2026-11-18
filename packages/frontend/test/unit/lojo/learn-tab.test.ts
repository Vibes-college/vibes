/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it, vi } from 'vitest';

// 资料页「学习」标签（2026-11-17）：学习格子怎么排、什么时候只显示一行空状态、旧地址 /apps/works/u/<用户名> 跳到哪。
vi.mock('@/router.js', () => ({ mainRouter: {} }));
// These lines are checked in Chinese (zh-CN UI); the English ones are in vibes-i18n.test.ts.
vi.mock('@@/js/config.js', async (orig) => ({ ...(await orig<typeof import('@@/js/config.js')>()), lang: 'zh-CN' }));

const { buildGrid, halfYear, level, majorText, nothingToShow } = await import('@/lojo/learn/learn.js');
const { learnTabPath } = await import('@/lojo/app-overlay.js');

describe('学习格子', () => {
	it('过去一年 53 列、周日在最上面，今天是最后一格，不画以后的日子', () => {
		// 2026-11-17 是星期二：最后一列只有周日、周一、周二三格
		const g = buildGrid([], '2026-11-17');
		expect(g.cells.length).toBe(52 * 7 + 3);
		const last = g.cells[g.cells.length - 1];
		expect(last).toMatchObject({ day: '2026-11-17', col: 53, row: 3 });
		expect(g.cells[0]).toMatchObject({ day: '2025-11-16', col: 1, row: 1 });
		expect(g.learned).toBe(0);
	});

	it('有记录的日子按次数分深浅，点开写那天做了什么；没记录的写「没有记录」', () => {
		const g = buildGrid([{ day: '2026-11-03', n: 3, text: '过了 2 关，听写练了 1 次' }, { day: '2026-11-10', n: 12, text: '过了 12 关' }], '2026-11-17');
		const on = g.cells.find(c => c.day === '2026-11-03');
		expect(on).toMatchObject({ n: 3, level: 2, tip: '11 月 3 日：过了 2 关，听写练了 1 次' });
		expect(g.cells.find(c => c.day === '2026-11-10')?.level).toBe(4);
		expect(g.cells.find(c => c.day === '2026-11-04')?.tip).toBe('11 月 4 日：没有记录');
		expect(g.learned).toBe(2);
		expect([0, 1, 2, 3, 5, 6, 9, 10].map(level)).toEqual([0, 1, 1, 2, 2, 3, 3, 4]);
	});

	it('月份标在每个月第一个周日那一列', () => {
		const g = buildGrid([], '2026-11-17');
		expect(g.months[0]).toEqual({ col: 1, label: '11月' });
		expect(g.months.some(m => m.label === '12月')).toBe(true);
	});
	it('第一列是月底那一周时，不跟下个月的字叠在一起', () => {
		// 2026-10-25 是周日：第一列从 2025-10-26 开始，第二列已经是 11 月
		const g = buildGrid([], '2026-10-25');
		expect(g.cells[0].day).toBe('2025-10-26');
		expect(g.months[0]).toEqual({ col: 2, label: '11月' });
	});
});

describe('专业和交作品的时间', () => {
	it('雅思的名字、要交什么、复盘和成绩单叫什么从翻译表来；没登记的专业用它的 id', () => {
		expect(majorText('ielts')).toMatchObject({ name: '雅思', reflection: '错题复盘', score: '模考成绩单' });
		expect(majorText('ielts').capstone).toContain('全真模考');
		expect(majorText('x')).toEqual({ name: 'x', capstone: '', reflection: '复盘', score: '成绩' });
	});
	it('哪半年交的按北京时间算', () => {
		expect(halfYear('2026-11-15T04:00:00Z')).toBe('2026 下半年');
		expect(halfYear('2026-06-30T17:00:00Z')).toBe('2026 下半年');
		expect(halfYear('2026-06-30T15:00:00Z')).toBe('2026 上半年');
	});
});

describe('外人看到的空状态', () => {
	const base = { owner: false, visible: true, today: '2026-11-17', grid: [], how: [], works: [] };
	it('看不到（本人关了公开、被管理员下架）只回 visible: false，显示一行空状态', () => {
		expect(nothingToShow({ owner: false, visible: false })).toBe(true);
	});
	it('公开了但什么都没学过、没作品，也是一行空状态', () => {
		expect(nothingToShow(base)).toBe(true);
		expect(nothingToShow({ ...base, grid: [{ day: '2026-11-03', n: 0, text: '' }] })).toBe(true);
	});
	it('有一天学过、或有作品、或有「我是怎么学的」，就照常显示', () => {
		expect(nothingToShow({ ...base, grid: [{ day: '2026-11-03', n: 1, text: '过了 1 关' }] })).toBe(false);
		expect(nothingToShow({ ...base, grid: null, how: null, works: [{} as never] })).toBe(false);
		expect(nothingToShow({ ...base, how: [['工具', '听写 3 次']] })).toBe(false);
	});
});

describe('旧地址跳到「学习」标签', () => {
	it('/apps/works/u/<用户名> → /@<用户名>/learn，带专业的打开那份作品', () => {
		expect(learnTabPath('/apps/works/u/lojo_qa')).toBe('/@lojo_qa/learn');
		expect(learnTabPath('/apps/works/u/lojo_qa/')).toBe('/@lojo_qa/learn');
		expect(learnTabPath('/apps/works/u/lojo_qa/ielts')).toBe('/@lojo_qa/learn?work=ielts');
		expect(learnTabPath(`${window.location.origin}/apps/works/u/lojo_qa/ielts/`)).toBe('/@lojo_qa/learn?work=ielts');
		expect(learnTabPath('/apps/works/u/lojo_qa/index.html')).toBe('/@lojo_qa/learn');
	});
	it('旧的管理页到 /my/learn，从「去交作品」来的带 #work', () => {
		expect(learnTabPath('/apps/works')).toBe('/my/learn');
		expect(learnTabPath('/apps/works/')).toBe('/my/learn');
		expect(learnTabPath('/apps/works/index.html')).toBe('/my/learn');
		expect(learnTabPath('/apps/works/#work')).toBe('/my/learn#work');
	});
	it('接口、别的小程序、别的网站都不动', () => {
		expect(learnTabPath('/apps/works/api/u/lojo_qa')).toBeNull();
		expect(learnTabPath('/apps/worksheet/')).toBeNull();
		expect(learnTabPath('/apps/wordbook/u/lojo_qa')).toBeNull();
		expect(learnTabPath('https://example.com/apps/works/u/lojo_qa')).toBeNull();
	});
});
