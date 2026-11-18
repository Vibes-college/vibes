/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 第 6 步：Momo 请学员确认的改动，在私信里是一条带暗号的消息，聊天页把它画成「确认」卡。

import { describe, expect, test, vi } from 'vitest';

const calls: [string, unknown][] = [];
let answer: (endpoint: string) => Promise<unknown> = async () => ({});
vi.mock('@/utility/misskey-api.js', () => ({
	misskeyApi: (endpoint: string, data: unknown) => {
		calls.push([endpoint, data]);
		return answer(endpoint);
	},
}));

const { appActionErrorKind, decideAppAction, parseAppAction, showAppAction } = await import('@/lojo/apps/actionCard.js');

describe('确认卡的暗号', () => {
	test('the server\'s marker becomes a card', () => {
		expect(parseAppAction('【请确认】把「resilient」加进你的生词本（确认号 0123456789）')).toEqual({ sentence: '把「resilient」加进你的生词本', actionId: '0123456789' });
		expect(parseAppAction('  【请确认】两行\n也行（确认号 abcdef0123）\n')).toEqual({ sentence: '两行\n也行', actionId: 'abcdef0123' });
	});

	test('anything else stays a speech bubble', () => {
		for (const text of [null, undefined, '', '把 resilient 加进生词本', '【请确认】没有确认号', '【请确认】号不对（确认号 xyz）', '前面有字【请确认】x（确认号 0123456789）']) {
			expect(parseAppAction(text)).toBeNull();
		}
	});
});

describe('确认卡问服务器', () => {
	test('show and decide send the card id; a card the server does not know is null, a network failure undefined', async () => {
		answer = async () => ({ id: '0123456789', status: 'done' });
		expect(await showAppAction('0123456789')).toMatchObject({ status: 'done' });
		expect(await decideAppAction('0123456789', 'cancel')).toMatchObject({ status: 'done' });
		expect(calls).toEqual([
			['lojo/apps/actions/show', { actionId: '0123456789' }],
			['lojo/apps/actions/decide', { actionId: '0123456789', decision: 'cancel' }],
		]);
		// misskeyApi rejects with the API error object ({ code, id, … })
		answer = async () => { throw Object.assign(new Error('No such action.'), { code: 'NO_SUCH_ACTION' }); };
		expect(await decideAppAction('0123456789', 'confirm')).toBeNull();
		answer = async () => { throw new Error('offline'); };
		expect(await showAppAction('0123456789')).toBeUndefined();
	});

	test('why it failed, in words the learner understands', () => {
		expect(appActionErrorKind('APP_DOWN (TimeoutError)')).toBe('down');
		expect(appActionErrorKind('NOT_GRANTED')).toBe('refused');
		expect(appActionErrorKind('HTTP_403')).toBe('refused');
		expect(appActionErrorKind('DUPLICATE')).toBe('other');
		expect(appActionErrorKind(null)).toBe('other');
	});
});
