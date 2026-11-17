/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// 课程线路包从服务器读（2026-11-17 起）：有留的副本就先用副本、后台问一句还是不是这一版；没有就等服务器。
const api = vi.fn();
const kept = new Map<string, unknown>();
vi.mock('@/utility/misskey-api.js', () => ({ misskeyApi: (...args: unknown[]) => api(...args) }));
vi.mock('@/lojo/kept.js', () => ({
	readKept: async (name: string) => kept.get(name) ?? null,
	keep: (name: string, value: unknown) => { kept.set(name, value); },
}));

const v1 = { META: { id: 'example', kind: 'gates', storeKey: 'example', group: { zh: '示例', en: 'Example' } }, TEXT: { zh: { title: '示例 1', legal: '' }, en: { title: 'Example 1', legal: '' } } };
const v2 = { ...v1, TEXT: { zh: { title: '示例 2', legal: '' }, en: { title: 'Example 2', legal: '' } } };
const flush = () => new Promise(r => setTimeout(r, 0));

async function fresh() {
	vi.resetModules();
	return await import('@/lojo/content-pack.js');
}

beforeEach(() => {
	api.mockReset();
	kept.clear();
});

describe('course route pack from the server', () => {
	it('first visit: waits for the server, keeps a copy, and asks once per page load', async () => {
		const { loadCourse } = await fresh();
		api.mockResolvedValue({ kind: 'course-example', version: '示例@1', hash: 'h1', data: v1 });
		expect(await loadCourse('example')).toEqual(v1);
		expect(api).toHaveBeenCalledWith('lojo/content/pack', { kind: 'course-example' });
		expect(kept.get('pack:course-example')).toEqual({ hash: 'h1', version: '示例@1', data: v1 });
		expect(await loadCourse('example')).toEqual(v1);
		expect(api).toHaveBeenCalledTimes(1);
	});

	it('with a kept copy: draws from it at once and only checks it in the background', async () => {
		kept.set('pack:course-example', { hash: 'h1', version: '示例@1', data: v1 });
		const { loadCourse } = await fresh();
		api.mockResolvedValue({ kind: 'course-example', version: '示例@1', hash: 'h1' });
		expect(await loadCourse('example')).toEqual(v1);
		await flush();
		expect(api).toHaveBeenCalledWith('lojo/content/pack', { kind: 'course-example', have: 'h1' });
		expect(kept.get('pack:course-example')).toEqual({ hash: 'h1', version: '示例@1', data: v1 });
	});

	it('a newer version on the server is kept and used from the next open', async () => {
		kept.set('pack:course-example', { hash: 'h1', version: '示例@1', data: v1 });
		const { loadCourse } = await fresh();
		api.mockResolvedValue({ kind: 'course-example', version: '示例@2', hash: 'h2', data: v2 });
		expect(await loadCourse('example')).toEqual(v1);
		await flush();
		expect(kept.get('pack:course-example')).toEqual({ hash: 'h2', version: '示例@2', data: v2 });
		expect(await loadCourse('example')).toEqual(v2);
	});

	it('offline with a copy: the copy stays; without one: fails, and the next open asks again', async () => {
		kept.set('pack:course-example', { hash: 'h1', version: '示例@1', data: v1 });
		let m = await fresh();
		api.mockRejectedValue(new Error('offline'));
		expect(await m.loadCourse('example')).toEqual(v1);
		await flush();
		expect(kept.get('pack:course-example')).toEqual({ hash: 'h1', version: '示例@1', data: v1 });

		kept.clear();
		m = await fresh();
		await expect(m.loadCourse('example')).rejects.toThrow('offline');
		api.mockResolvedValue({ kind: 'course-example', version: '示例@1', hash: 'h1', data: v1 });
		expect(await m.loadCourse('example')).toEqual(v1);
	});
});
