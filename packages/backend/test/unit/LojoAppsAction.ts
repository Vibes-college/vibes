/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { APP_ACTION_ID, APP_ACTION_RECENT_SHOWN, appActionText, appBodyProblems, appSpecOps, cleanAppPath, describeBody, fillAppText, findAppOp, recentAppCards } from '@/misc/lojo-apps-action.js';

// 第 6 步：Momo 只能「请学员确认」小程序里的写操作。这里查读规格、查内容、确认卡上的那句话。示例小程序。
const spec = {
	openapi: '3.1.0',
	paths: {
		'/api/v1/words': {
			'x-vibes-kind': 'words',
			get: { summary: 'Recent words', parameters: [{ name: 'limit', in: 'query' }] },
			post: {
				'x-vibes-kind': 'words',
				summary: 'Add a word',
				'x-vibes-action': { zh: '把「{item.text}」加进你的生词本', en: 'Add “{item.text}” to your wordbook', doneZh: '「{item.text}」已加进生词本' },
				requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Add' } } } },
			},
		},
		'/api/v1/words/{id}': {
			get: { 'x-vibes-kind': 'words', parameters: [{ name: 'id', in: 'path' }] },
			// a write with no x-vibes-action: Vibi cannot ask for it
			delete: { 'x-vibes-kind': 'words' },
		},
		'/api/v1/health': { get: { summary: 'no kind: not for Vibi' } },
	},
	components: {
		schemas: {
			Add: {
				type: 'object',
				required: ['item', 'source'],
				additionalProperties: false,
				properties: {
					item: {
						type: 'object',
						required: ['text'],
						properties: { text: { type: 'string', maxLength: 10 }, kind: { type: 'string', enum: ['word', 'phrase'] } },
					},
					source: { type: 'string', enum: ['post', 'manual'] },
				},
			},
		},
	},
};
const ops = appSpecOps(spec);
const add = findAppOp(ops, 'POST', 'words')!;

describe('小程序写操作：读规格', () => {
	test('reads with a kind, writes with their sentence; no kind, not listed', () => {
		expect(ops.map(o => `${o.method} ${o.path} ${o.kind} ${o.action != null}`)).toEqual([
			'GET words words false',
			'POST words words true',
			'GET words/{id} words false',
			'DELETE words/{id} words false',
		]);
		expect(ops[0].params).toEqual(['limit']);
		expect(add.action).toEqual({ zh: '把「{item.text}」加进你的生词本', en: 'Add “{item.text}” to your wordbook', doneZh: '「{item.text}」已加进生词本', doneEn: null });
		expect(add.body?.required).toEqual(['item', 'source']);
		expect(appSpecOps(null)).toEqual([]);
	});

	test('a call finds its operation by method and path, placeholders included', () => {
		expect(findAppOp(ops, 'post', '/api/v1/words/')).toBe(add);
		expect(findAppOp(ops, 'DELETE', 'words/abc123')?.path).toBe('words/{id}');
		expect(findAppOp(ops, 'PUT', 'words')).toBeNull();
		expect(findAppOp(ops, 'DELETE', 'words/../x')).toBeNull();
		expect(cleanAppPath('/api/v1/words/')).toBe('words');
	});

	test('the body in one line for Vibi', () => {
		expect(describeBody(add.body)).toBe('item*: {text*: string, kind: word|phrase}, source*: post|manual');
		expect(describeBody(null)).toBe('');
	});
});

describe('小程序写操作：查内容', () => {
	test('a sound body has no problems', () => {
		expect(appBodyProblems(add.body, { item: { text: 'resilient' }, source: 'manual' })).toEqual([]);
	});

	test('missing, wrong type, not in the list, too long, not allowed', () => {
		expect(appBodyProblems(add.body, { item: {} })).toEqual(['source is required', 'item.text is required']);
		expect(appBodyProblems(add.body, { item: { text: 5 }, source: 'manual' })).toEqual(['item.text should be string']);
		expect(appBodyProblems(add.body, { item: { text: 'ok', kind: 'idiom' }, source: 'manual' })).toEqual(['item.kind should be one of word, phrase']);
		expect(appBodyProblems(add.body, { item: { text: 'a much longer word' }, source: 'manual' })).toEqual(['item.text is longer than 10']);
		expect(appBodyProblems(add.body, { item: { text: 'ok' }, source: 'manual', userId: 'someone' })).toEqual(['userId is not allowed']);
		expect(appBodyProblems(add.body, 'resilient')).toEqual(['body should be a JSON object']);
		expect(appBodyProblems(add.body, { item: { text: 'x'.repeat(5000) }, source: 'manual' })[0]).toMatch(/too large/);
	});

	test('an action that takes no body', () => {
		expect(appBodyProblems(null, null)).toEqual([]);
		expect(appBodyProblems(null, { a: 1 })).toEqual(['this action takes no body']);
	});
});

describe('确认卡上的那句话', () => {
	test('filled from the body, one line, unknown as …', () => {
		expect(fillAppText('把「{item.text}」加进你的生词本', { item: { text: ' resilient\n' } })).toBe('把「resilient」加进你的生词本');
		expect(fillAppText('把「{item.text}」加进你的生词本', {})).toBe('把「…」加进你的生词本');
		expect(fillAppText('{a}', { a: 'x'.repeat(100) })).toHaveLength(60);
	});

	test('the marker message the chat page draws as a card', () => {
		expect(appActionText('把「resilient」加进你的生词本', '0123456789')).toBe('【请确认】把「resilient」加进你的生词本（确认号 0123456789）');
		expect(APP_ACTION_ID.test('0123456789')).toBe(true);
		expect(APP_ACTION_ID.test('012345678')).toBe(false);
	});
});

// 第 6 步返工 (11-17)：Momo 每次回话都带上学员最近几张卡的结果，按结果说话。示例词。
describe('最近的确认卡（带给 Momo）', () => {
	const now = Date.parse('2026-11-17T23:00:00Z');
	const card = (id: string, word: string, status: 'pending' | 'done' | 'cancelled' | 'expired', minutesAgo: number) => ({
		id, app: 'wordbook', appName: '生词本', text: { zh: `把「${word}」加进你的生词本` }, status,
		createdAt: new Date(now - minutesAgo * 60_000).toISOString(),
		decidedAt: status === 'pending' || status === 'expired' ? null : new Date(now - minutesAgo * 60_000 + 30_000).toISOString(),
		error: null,
	});

	test('newest first, each with what became of it', () => {
		const out = recentAppCards([card('aaaaaaaaaa', 'alpha', 'done', 5), card('bbbbbbbbbb', 'beta', 'cancelled', 4), card('cccccccccc', 'gamma', 'pending', 3)], now);
		expect(out.map(c => `${c.card} ${c.status}`)).toEqual([
			'把「gamma」加进你的生词本 pending',
			'把「beta」加进你的生词本 cancelled',
			'把「alpha」加进你的生词本 done',
		]);
		expect(out[0]).toEqual({ id: 'cccccccccc', app: 'wordbook', appName: '生词本', card: '把「gamma」加进你的生词本', status: 'pending', askedAt: '2026-11-17T22:57:00.000Z', decidedAt: null, error: null });
		expect(out[1].decidedAt).toBe('2026-11-17T22:56:30.000Z');
	});

	test('only the last 7 days, at most 8, each card once', () => {
		const old = card('dddddddddd', 'old', 'done', 8 * 24 * 60);
		const many = Array.from({ length: 12 }, (_, i) => card(`${i}`.padStart(10, 'e'), `w${i}`, 'done', i + 1));
		const out = recentAppCards([old, ...many, many[0]], now);
		expect(out).toHaveLength(APP_ACTION_RECENT_SHOWN);
		expect(out.map(c => c.card)).not.toContain('把「old」加进你的生词本');
		expect(new Set(out.map(c => c.id)).size).toBe(out.length);
		expect(out[0].card).toBe('把「w0」加进你的生词本');
	});

	test('nothing yet: an empty list', () => {
		expect(recentAppCards([], now)).toEqual([]);
	});
});
