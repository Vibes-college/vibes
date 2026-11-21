/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 聊天模式：点 Momo 的名字选她怎么回；她回话下面的对照卡和「换了说话方式」那行灰字，是两种带暗号的消息。

import { describe, expect, test, vi } from 'vitest';

vi.mock('@@/js/config.js', async (orig) => ({ ...(await orig<typeof import('@@/js/config.js')>()), lang: 'zh-CN' }));
const calls: [string, unknown][] = [];
let answer: (endpoint: string, data: any) => Promise<unknown> = async () => ({});
vi.mock('@/utility/misskey-api.js', () => ({
	misskeyApi: (endpoint: string, data: unknown) => {
		calls.push([endpoint, data]);
		return answer(endpoint, data);
	},
}));
vi.mock('@/i.js', () => ({ $i: { id: 'learner1' } }));
const toasts: string[] = [];
vi.mock('@/os.js', () => ({ toast: (t: string) => toasts.push(t), popupMenu: () => Promise.resolve() }));
const handlers: Record<string, (ev: any) => void> = {};
vi.mock('@/stream.js', () => ({ useStream: () => ({ useChannel: () => ({ on: (name: string, fn: (ev: any) => void) => { handlers[name] = fn; } }) }) }));

const mode = await import('@/lojo/tutor/mode.js');

describe('聊天模式的暗号', () => {
	test('the card under her reply', () => {
		expect(mode.parseModeCard('【对照卡·roast】break a leg\n摔断一条腿\n→ 祝你顺利')).toEqual({ mode: 'roast', phrase: 'break a leg', front: '摔断一条腿', back: '祝你顺利' });
		expect(mode.parseModeCard('【对照卡·chinglish】\nI very like it\n→ I really like it')).toEqual({ mode: 'chinglish', phrase: null, front: 'I very like it', back: 'I really like it' });
	});

	test('the grey line when the mode changed', () => {
		expect(mode.parseModeNotice('【说话方式】已切到毒舌（roast）')).toBe('roast');
		expect(mode.parseModeNotice('【说话方式】Back to Normal（normal）')).toBe('normal');
	});

	test('anything else stays a speech bubble', () => {
		for (const text of [null, undefined, '', 'break a leg', '【对照卡·evil】x\na\n→ b', '【对照卡·roast】x\n只有一行', '前面有字【对照卡·roast】x\na\n→ b']) expect(mode.parseModeCard(text)).toBeNull();
		for (const text of [null, '', '【说话方式】已切到毒舌', '【说话方式】已切到（evil）', '已切到毒舌（roast）']) expect(mode.parseModeNotice(text)).toBeNull();
		expect(mode.isModeMarker('【对照卡·roast】x')).toBe(true);
		expect(mode.isModeMarker('hello')).toBe(false);
	});
});

describe('点名字换模式', () => {
	test('the menu: her name, four ways with a line each, and that saying it works too', () => {
		const items = mode.modeMenu('阿蓝') as any[];
		expect(items[0]).toMatchObject({ type: 'label', text: '阿蓝 怎么回你' });
		expect(items.filter(i => i.type === 'radioOption').map(i => i.text)).toEqual(['正常', '毒舌', '抓中式英语', '英式潜台词']);
		expect(items[1].caption).toBe('平常的 阿蓝');
		expect(items.at(-1)).toMatchObject({ type: 'label', text: '也能直接说「开毒舌」「正常点」' });
		expect(JSON.stringify(items)).not.toContain('人设');
	});

	test('read from the server; the orange line only while a mode is on and the menu is offered', async () => {
		answer = async () => ({ mode: 'roast', available: true });
		await mode.loadTutorMode(true);
		expect(mode.tutorMode.value).toBe('roast');
		expect(mode.modeAccent.value).toEqual({ icon: 'ti ti-bolt', text: '毒舌模式' });
		answer = async () => ({ mode: 'roast', available: false });
		await mode.loadTutorMode(true);
		expect(mode.modeAccent.value).toBeNull();
	});

	test('picking one saves it; when saving fails it goes back and says so', async () => {
		answer = async () => ({ mode: 'normal', available: true });
		await mode.loadTutorMode(true);
		calls.length = 0;
		answer = async (_e, data) => ({ mode: data.mode });
		await mode.setTutorMode('chinglish');
		expect(calls).toEqual([['lojo/tutor/mode/update', { mode: 'chinglish' }]]);
		expect(mode.tutorMode.value).toBe('chinglish');

		answer = async () => { throw new Error('offline'); };
		await mode.setTutorMode('subtext');
		expect(mode.tutorMode.value).toBe('chinglish');
		expect(toasts.at(-1)).toBe('没换成，再试一次');
	});

	test('when she switches because the learner asked, the header follows', async () => {
		await mode.loadTutorMode();
		handlers.registryUpdated({ scope: ['lojo', 'tutor'], key: 'mode', value: 'normal' });
		expect(mode.tutorMode.value).toBe('normal');
		handlers.registryUpdated({ scope: ['lojo', 'tutor'], key: 'persona', value: 'roast' });
		expect(mode.tutorMode.value).toBe('normal');
	});
});
