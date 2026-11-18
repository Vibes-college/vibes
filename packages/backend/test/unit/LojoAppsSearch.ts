/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { APP_SEARCH_LIMIT, appUrl, mergeApps, searchApps, searchTerms } from '@/misc/lojo-apps-search.js';
import type { AppSearchDirectoryEntry, AppSearchRosterEntry } from '@/misc/lojo-apps-search.js';

// 第 6 步：Momo 按学员的说法找小程序。名册在数据库里、不在公开代码里，这里只用示例小程序。
const SITE = 'https://example.com';
const entry = (o: Partial<AppSearchRosterEntry> & { id: string; name: string }): AppSearchRosterEntry => ({
	href: `/apps/${o.id}/`,
	type: 'server',
	intro: { summary: '示例介绍', audience: '示例：给谁用', steps: [], caveats: [] },
	...o,
});
const roster: AppSearchRosterEntry[] = [
	entry({ id: 'ex-dictation', name: '示例听写', category: '听力', tags: ['听写', '听力', 'dictation'], intro: { summary: '听一句，把空着的词打出来。', audience: '示例', steps: ['听录音'], caveats: [] } }),
	entry({ id: 'ex-vocab', name: '示例词汇', category: '单词', tags: ['词汇', '背单词', 'vocabulary'], intro: { summary: '按话题学词，练法有拼写、听写、打字。', audience: '示例', steps: [], caveats: [] } }),
	// "口语" only in who it is for: not a 口语 app
	entry({ id: 'ex-grammar', name: '示例语法', category: '语法', tags: ['语法', 'grammar'], intro: { summary: '一站讲一个语法点。', audience: '想避免写作口语里语法错误的人', steps: [], caveats: [] } }),
	entry({ id: 'ex-wordbook', name: '示例生词本', category: '单词', tags: ['生词本', '复习', 'wordbook'], intro: { summary: '按记忆曲线复习生词。', audience: '示例', steps: [], caveats: [] } }),
	entry({ id: 'ex-site', name: '示例外站', href: 'https://example.org/read/', type: 'external', category: '阅读', tags: ['阅读'] }),
];
const spec = {
	openapi: '3.1.0',
	paths: {
		'/api/v1/words': {
			get: { 'x-vibes-kind': 'words' },
			post: { 'x-vibes-kind': 'words', 'x-vibes-action': { zh: '把「{item.text}」加进你的生词本', en: 'Add “{item.text}”' } },
		},
	},
};
const directory: AppSearchDirectoryEntry[] = [
	{ id: 'ex-wordbook', name: '示例生词本', summary: '', kinds: { words: '示例：生词', reviews: '示例：复习' }, defaultGrants: { vibi: ['words', 'words:do'] }, spec },
	{ id: 'ex-hidden', name: '示例后台', summary: '只有数据', kinds: { progress: '示例：进度' }, defaultGrants: { vibi: ['progress'] }, spec: null },
];
const apps = mergeApps(roster, directory, 'vibi', SITE);
const ids = (q: string | null, category?: string) => searchApps(apps, { query: q, category }).apps.map(a => a.id);

describe('Momo 找小程序', () => {
	test('the words worth matching: asking words, "mini app", English and IELTS are left out', () => {
		expect(searchTerms('有没有练听写的小程序')).toEqual(['听写']);
		expect(searchTerms('我想背单词用哪个')).toEqual(['背单词']);
		expect(searchTerms('有没有练口语的')).toEqual(['口语']);
		expect(searchTerms('Is there an app for DICTATION?')).toEqual(['dictation']);
		expect(searchTerms('有没有小程序')).toEqual([]);
	});

	test('the app named for it comes first; one that only mentions it comes after', () => {
		expect(ids('有没有练听写的小程序')).toEqual(['ex-dictation', 'ex-vocab']);
		expect(ids('我想背单词用哪个')[0]).toBe('ex-vocab');
		expect(ids('dictation')).toEqual(['ex-dictation']);
	});

	test('nothing for it: total 0, no app made up, even when a word shows up in who an app is for', () => {
		const r = searchApps(apps, { query: '有没有练口语的' });
		expect(r.total).toBe(0);
		expect(r.apps).toEqual([]);
		expect(searchApps(apps, { query: 'speaking' }).total).toBe(0);
	});

	test('no words: every app, launcher first in its order, then apps not in the launcher', () => {
		const r = searchApps(apps, { query: '有没有小程序' });
		expect(r.total).toBe(6);
		expect(r.apps.map(a => a.id)).toEqual(['ex-dictation', 'ex-vocab', 'ex-grammar', 'ex-wordbook', 'ex-site', 'ex-hidden']);
		expect(r.categories).toEqual(['听力', '单词', '语法', '阅读']);
		expect(searchApps(apps, {}).total).toBe(6);
	});

	test('a category narrows the list', () => {
		expect(ids(null, '单词')).toEqual(['ex-vocab', 'ex-wordbook']);
		expect(ids('复习', '单词')).toEqual(['ex-wordbook']);
		expect(ids('听写', '阅读')).toEqual([]);
	});

	test('links are full addresses; an app not in the launcher has none', () => {
		const byId = new Map(searchApps(apps, {}).apps.map(a => [a.id, a]));
		expect(byId.get('ex-dictation')!.url).toBe('https://example.com/apps/ex-dictation/');
		expect(byId.get('ex-site')!.url).toBe('https://example.org/read/');
		expect(byId.get('ex-hidden')!.url).toBeNull();
		expect(byId.get('ex-hidden')!.inLauncher).toBe(false);
		expect(appUrl('http://localhost:4322/', '/apps/vocab/5.1')).toBe('http://localhost:4322/apps/vocab/5.1');
	});

	test('what Vibi may read, and whether she may ask to change something there', () => {
		const byId = new Map(searchApps(apps, {}).apps.map(a => [a.id, a]));
		expect(byId.get('ex-wordbook')!.kinds).toEqual([
			{ kind: 'words', about: '示例：生词', granted: true },
			{ kind: 'reviews', about: '示例：复习', granted: false },
		]);
		expect(byId.get('ex-wordbook')!.writes).toBe(true);
		expect(byId.get('ex-hidden')!.writes).toBe(false);
		expect(byId.get('ex-dictation')!.kinds).toEqual([]);
		// another caller has no grants
		expect(mergeApps(roster, directory, 'someone', SITE).find(a => a.item.id === 'ex-wordbook')!.item.writes).toBe(false);
	});

	test('at most 20 apps in one answer', () => {
		const many = Array.from({ length: 30 }, (_, i) => entry({ id: `ex-${i}`, name: `示例${i}`, tags: ['听写'] }));
		const r = searchApps(mergeApps(many, [], 'vibi', SITE), { query: '听写' });
		expect(r.total).toBe(30);
		expect(r.apps).toHaveLength(APP_SEARCH_LIMIT);
	});
});
