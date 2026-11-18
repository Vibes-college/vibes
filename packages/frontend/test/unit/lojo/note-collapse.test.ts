/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 帖子折叠门槛（创始人 2026-11-17：太短，每条都要点展开，至少放大 3 倍）：
// 上游是超过 9 行或 500 字就折叠，我们改成 30 行、1500 字；折叠后露出的高度 9em → 27em（MkNote、MkSubNoteContent 等）。
// 链接：上游 4 个就折叠，同样放大 3 倍，12 个以上才折叠（11-17 编辑部 1434 字、4 个出处链接的帖子被折了）。
// 跟上游升级时这里会提醒：门槛被合并改回去了。
import { describe, expect, it } from 'vitest';
import { shouldCollapsed } from '@@/js/collapsed.js';
import type * as Misskey from 'misskey-js';

const note = (text: string | null, extra: Partial<Misskey.entities.Note> = {}) => ({ text, cw: null, files: [], ...extra }) as unknown as Misskey.entities.Note;
const lines = (n: number, perLine = 40) => Array.from({ length: n }, (_, i) => `第 ${i + 1} 行`.padEnd(perLine, '字')).join('\n');

describe('shouldCollapsed（Vibes 门槛：30 行 / 1500 字）', () => {
	it('20 行、800 字左右的帖子不折叠', () => {
		const text = lines(20, 40);
		expect(text.length).toBeGreaterThan(780);
		expect(shouldCollapsed(note(text), [])).toBe(false);
	});

	it('编辑部常见的 13 行短帖不折叠（上游 9 行就会折）', () => {
		expect(shouldCollapsed(note(lines(13, 20)), [])).toBe(false);
	});

	it('刚好 30 行不折叠，31 行折叠', () => {
		expect(shouldCollapsed(note(lines(30, 10)), [])).toBe(false);
		expect(shouldCollapsed(note(lines(31, 10)), [])).toBe(true);
	});

	it('刚好 1500 字不折叠，1501 字折叠', () => {
		expect(shouldCollapsed(note('字'.repeat(1500)), [])).toBe(false);
		expect(shouldCollapsed(note('字'.repeat(1501)), [])).toBe(true);
	});

	it('11 个链接不折叠，12 个折叠（上游 4 个就折）', () => {
		const urls = (n: number) => Array.from({ length: n }, (_, i) => `https://example.com/${i}`);
		expect(shouldCollapsed(note('短帖'), urls(4))).toBe(false);
		expect(shouldCollapsed(note('短帖'), urls(11))).toBe(false);
		expect(shouldCollapsed(note('短帖'), urls(12))).toBe(true);
	});

	it('编辑部深度帖：1434 字、21 行、4 个出处链接，整篇显示', () => {
		const text = lines(21, 68);
		expect(text.length).toBeGreaterThan(1400);
		expect(text.length).toBeLessThanOrEqual(1500);
		expect(shouldCollapsed(note(text), ['a', 'b', 'c', 'd'])).toBe(false);
	});

	it('其余几条照上游：放大字、5 张图仍折叠；有 CW 不折叠', () => {
		expect(shouldCollapsed(note('$[x2 大字]'), [])).toBe(true);
		expect(shouldCollapsed(note('短帖', { files: [{}, {}, {}, {}, {}] as Misskey.entities.Note['files'] }), [])).toBe(true);
		expect(shouldCollapsed(note('字'.repeat(3000), { cw: '剧透' }), [])).toBe(false);
	});
});
