/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { APPS_ROSTER_KIND, APPS_ROSTER_RULES, appsRosterProblems, appsRosterPublic } from '@/misc/lojo-apps-roster.js';

// 小程序名册在数据库里（2026-11-17 起）：这里只用示例小程序，查导入前的格式检查和入口能读到的那部分。
const app = (o: Record<string, unknown> = {}): Record<string, unknown> => ({
	id: 'example',
	name: '示例小程序',
	icon: 'ti ti-camera',
	href: '/apps/example/',
	type: 'server',
	visible: true,
	intro: { summary: '示例：是什么', audience: '示例：给谁用', steps: ['示例第一步'], caveats: [] },
	...o,
});
const file = (apps: unknown[] = [app()]) => ({ version: 'apps@示例', source: '示例', pack: { apps } });

describe('小程序名册：导入前查格式', () => {
	test('a sound roster has no problems, with every type of link', () => {
		expect(appsRosterProblems(file([
			app(),
			app({ id: 'example-static', href: '/apps/example-static/6.1', type: 'static' }),
			app({ id: 'example-site', href: 'https://example.com/read/', type: 'external', visible: false, formerIds: ['example-old'] }),
		]))).toEqual([]);
		expect(APPS_ROSTER_KIND).toBe('apps');
	});

	test('not the file shape', () => {
		expect(appsRosterProblems(null)).toHaveLength(1);
		expect(appsRosterProblems({ apps: [app()] })).toHaveLength(1);
		expect(appsRosterProblems(file([]))).toEqual(['名册里一个小程序都没有']);
		expect(appsRosterProblems({ ...file(), version: '' })).toEqual(['缺 version']);
	});

	test('a misspelt field is refused instead of quietly ignored', () => {
		const problems = appsRosterProblems(file([app({ visable: false, visible: undefined })]));
		expect(problems).toHaveLength(2);
		expect(problems[0]).toContain('visable');
		expect(problems[1]).toContain('visible');
		expect(appsRosterProblems(file([app({ intro: { summary: '示例', audience: '示例', steps: ['示例'], caveats: [], note: '示例' } })]))[0]).toContain('note');
	});

	test('ids: the right shape, and no two entries share one, old ids included', () => {
		expect(appsRosterProblems(file([app({ id: 'Example' })]))[0]).toContain('id 要是');
		expect(appsRosterProblems(file([app(), app()]))).toEqual(['第 2 个（example）: id example 和第 1 个（example）重复']);
		expect(appsRosterProblems(file([app(), app({ id: 'example-new', formerIds: ['example'] })]))).toHaveLength(1);
		expect(appsRosterProblems(file([app({ formerIds: ['Bad Id'] })]))[0]).toContain('formerIds');
	});

	test('links: a mini app is under /apps/, another site is https', () => {
		expect(appsRosterProblems(file([app({ href: '/notes/1' })]))[0]).toContain('/apps/');
		expect(appsRosterProblems(file([app({ href: 'https://example.com/' })]))[0]).toContain('/apps/');
		expect(appsRosterProblems(file([app({ type: 'external', href: 'http://example.com/' })]))[0]).toContain('https://');
		expect(appsRosterProblems(file([app({ type: 'external', href: '/apps/example/' })]))[0]).toContain('https://');
		expect(appsRosterProblems(file([app({ type: 'page' })]))[0]).toContain('type');
	});

	test('the launcher needs a name, an icon, a yes/no for visible and the four parts of the intro', () => {
		expect(appsRosterProblems(file([app({ name: '' })]))[0]).toContain('name');
		expect(appsRosterProblems(file([app({ name: '示'.repeat(APPS_ROSTER_RULES.maxName + 1) })]))[0]).toContain('name');
		expect(appsRosterProblems(file([app({ icon: 'camera' })]))[0]).toContain('icon');
		expect(appsRosterProblems(file([app({ visible: 'yes' })]))[0]).toContain('visible');
		expect(appsRosterProblems(file([app({ intro: null })]))[0]).toContain('intro');
		const intro = appsRosterProblems(file([app({ intro: { summary: '', audience: '示例', steps: [], caveats: '示例' } })]));
		expect(intro).toHaveLength(3);
	});

	test('category and tags are optional words Vibi searches; anything else in them is refused', () => {
		expect(appsRosterProblems(file([app({ category: '示例分类', tags: ['示例', 'example'] })]))).toEqual([]);
		expect(appsRosterProblems(file([app({ category: '' })]))[0]).toContain('category');
		expect(appsRosterProblems(file([app({ category: ['示例'] })]))[0]).toContain('category');
		expect(appsRosterProblems(file([app({ tags: '示例' })]))[0]).toContain('tags');
		expect(appsRosterProblems(file([app({ tags: ['示'.repeat(APPS_ROSTER_RULES.maxTag + 1)] })]))[0]).toContain('tags');
		expect(appsRosterProblems(file([app({ tags: Array.from({ length: APPS_ROSTER_RULES.maxList + 1 }, (_, i) => `t${i}`) })]))[0]).toContain('tags');
	});

	test('the launcher reads only the entries that are on, in the order of the file', () => {
		const roster = file([app({ id: 'example-a' }), app({ id: 'example-b', visible: false }), app({ id: 'example-c' })]);
		expect(appsRosterPublic(roster).apps.map(a => a.id)).toEqual(['example-a', 'example-c']);
	});
});
