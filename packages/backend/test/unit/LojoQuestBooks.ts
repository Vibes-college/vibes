/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, describe, expect, test } from 'vitest';
import { QUEST_BOOK_RULES, bookForCause, clearQuestBooks, questBooks, questBooksProblems, questBooksVersion, setQuestBooks } from '@/misc/lojo-quest-books.js';
import type { QuestBook, QuestBooksFile } from '@/misc/lojo-quest-books.js';
import { questBookByRef, questBookOf, questGuidePath, questKnownRefs, questShelfOf } from '@/misc/lojo-quest-learner.js';

// 锦囊书屋的书在数据库里（2026-11-17 起）：这里只用示例书，查导入前的格式检查和「正在用的那一版」。
const book = (no: number, over: Partial<QuestBook> = {}): QuestBook => ({
	no, ref: `j${no}`, id: `kit-${no}`, slug: `example-${no}`, spine: `示例书脊 ${no}`, title: `示例锦囊 ${no}`, summary: '示例', kind: 'method', evidence: '', color: '#888888',
	app: { id: 'dictation', zh: '听写', path: '/apps/dictation/' },
	verify: '', verifyUrl: null, verifyLevels: ['*'], gear: 'level', fallbackGear: null, givesHeart: true, causeKeys: [], tags: [], when: '',
	quiz: [1, 2, 3].map(i => ({ id: `q${no}-${i}`, q: `示例题 ${i}`, o: ['对', '错'], a: 0, why: '示例' })),
	...over,
});
const file = (books: QuestBook[], version = '示例@1'): QuestBooksFile => ({ version, source: '示例', books });

describe('锦囊书屋：导入前查格式', () => {
	test('a sound file has no problems', () => {
		expect(questBooksProblems(file([book(1), book(2, { causeKeys: ['same-word'] })]))).toEqual([]);
	});

	test('not the file shape, or no books', () => {
		expect(questBooksProblems(null)).toHaveLength(1);
		expect(questBooksProblems([book(1)])).toHaveLength(1);
		expect(questBooksProblems({ version: 'x', source: '', books: [] })).toContain('没有书');
		expect(questBooksProblems({ source: '', books: [book(1)] })).toContain('缺 version');
	});

	test('every quiz has the right number of questions, at least 2 options and an answer among them', () => {
		const two = book(1, { quiz: book(1).quiz.slice(0, 2) });
		expect(questBooksProblems(file([two]))).toEqual([`j1: 小验证要 ${QUEST_BOOK_RULES.count} 题`]);
		const b = book(1);
		b.quiz[1] = { ...b.quiz[1], a: 2 };
		expect(questBooksProblems(file([b]))).toEqual(['j1 第 2 题: 答案 a 不在选项里']);
		const c = book(1);
		c.quiz[0] = { ...c.quiz[0], o: ['只有一个'] };
		expect(questBooksProblems(file([c]))).toEqual(['j1 第 1 题: 至少 2 个选项']);
	});

	test('fields: ref, slug, app, lists', () => {
		expect(questBooksProblems(file([book(1, { ref: 'x1' })]))).toContain('x1: ref 要写成 j<数字>');
		expect(questBooksProblems(file([book(1, { slug: 'Has Space' })]))).toContain('j1: slug 只能有小写字母、数字和 -');
		expect(questBooksProblems(file([book(1, { app: { id: 'x' } as QuestBook['app'] })]))).toContain('j1: app 要有 id、zh、path');
		expect(questBooksProblems(file([book(1, { causeKeys: 'same-word' as unknown as string[] })]))).toContain('j1: causeKeys 要是文字列表');
		expect(questBooksProblems(file([book(1, { givesHeart: 'yes' as unknown as boolean })]))).toContain('j1: givesHeart 要是 true 或 false');
	});

	test('guide: a guide slug or null; 读全文 opens it, else the book\'s own slug', () => {
		expect(questBooksProblems(file([book(1, { guide: 'ielts-reading' }), book(2, { guide: null }), book(3)]))).toEqual([]);
		expect(questBooksProblems(file([book(1, { guide: 'Has Space' })]))).toContain('j1: guide 要是攻略的 slug（小写字母、数字和 -）或 null');
		expect(questBooksProblems(file([book(1, { guide: 7 as unknown as string })]))).toContain('j1: guide 要是攻略的 slug（小写字母、数字和 -）或 null');
		expect(questGuidePath(book(1, { guide: 'ielts-reading' }))).toBe('/guides/ielts-reading');
		expect(questGuidePath(book(1, { guide: null }))).toBe('/guides/example-1');
		expect(questGuidePath(book(1))).toBe('/guides/example-1');
	});

	test('no, ref, id, slug and question ids are unique', () => {
		const p = questBooksProblems(file([book(1), book(2, { slug: 'example-1' }), book(3, { quiz: book(1).quiz })]));
		expect(p).toContain('slug example-1 重复');
		expect(p).toContain('题号 q1-1 重复');
	});
});

describe('锦囊书屋：正在用的那一版', () => {
	afterEach(() => clearQuestBooks());

	test('nothing imported: the shop is empty and a failed level recommends no book', () => {
		clearQuestBooks();
		expect(questBooks()).toEqual([]);
		expect(questBooksVersion()).toBeNull();
		expect(questBookOf('example-1')).toBeUndefined();
		expect(questKnownRefs(['j1', 'j2'])).toEqual([]);
		expect(questShelfOf(undefined, 'same-word', 1)).toEqual({ refs: [], book: null });
	});

	test('an imported version is used at once, sorted by number; the next one replaces it', () => {
		setQuestBooks(file([book(3), book(1, { causeKeys: ['same-word'] }), book(2, { causeKeys: ['not-heard'] })]), '示例@1');
		expect(questBooks().map(b => b.ref)).toEqual(['j1', 'j2', 'j3']);
		expect(questBooksVersion()).toBe('示例@1');
		expect(questBookOf('example-2')?.ref).toBe('j2');
		expect(questBookByRef('j3')?.slug).toBe('example-3');
		expect(bookForCause('not-heard')?.ref).toBe('j2');
		// books on a shelf that are not in this version are skipped
		expect(questKnownRefs(['j2', 'j9', 'j1'])).toEqual(['j2', 'j1']);
		expect(questShelfOf(undefined, 'not-heard', 1).book?.ref).toBe('j2');

		setQuestBooks(file([book(1)], '示例@2'), '示例@2');
		expect(questBooks().map(b => b.ref)).toEqual(['j1']);
		expect(questBookOf('example-2')).toBeUndefined();
		expect(questBooksVersion()).toBe('示例@2');
	});
});
