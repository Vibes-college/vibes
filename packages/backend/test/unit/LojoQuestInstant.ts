/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The small script that puts the 闯关 frame up before the community app (src/server/web/LojoQuestInstant.ts), run on a
// pretend page: the bridge it hangs on the frame must give the game the learner's own Momo (11-17), from the server
// until the app is up, then from the app.

import vm from 'node:vm';
import { describe, expect, test } from 'vitest';
import { questInstantScript } from '@/server/web/LojoQuestInstant.js';

type Sent = { url: string; body: Record<string, unknown> };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bridge = Record<string, any>;

function runOnQuestPage(token: string | null) {
	const sent: Sent[] = [];
	const frames: Bridge[] = [];
	const el = (tag: string) => {
		const node: Bridge = { tagName: tag, style: {}, setAttribute() { /* */ }, appendChild() { /* */ }, querySelectorAll: () => [], addEventListener() { /* */ } };
		if (tag === 'iframe') frames.push(node);
		return node;
	};
	const store: Record<string, string> = token == null ? {} : { account: JSON.stringify({ id: 'u1', token }) };
	const window: Bridge = {};
	const context = vm.createContext({
		window,
		location: { pathname: '/quest', search: '' },
		document: { createElement: el, head: { appendChild() { /* */ } }, body: null, documentElement: { appendChild() { /* */ } } },
		localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; } },
		sessionStorage: { setItem() { /* */ } },
		URLSearchParams,
		Promise,
		JSON,
		Object,
		Date,
		Event: class { constructor(public type: string) {} },
		fetch: (url: string, init: { body: string }) => {
			sent.push({ url, body: JSON.parse(init.body) });
			const body = url.endsWith('/lojo/tutor/persona/show') ? { name: '豆豆', seed: 'abc123', chosen: true } : {};
			return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
		},
	});
	vm.runInContext(questInstantScript('/lojo-assets/quest/index.html?v=1'), context);
	return { sent, bridge: frames[0]?.__vibesQuest as Bridge | undefined };
}

describe('the frame put up before the app', () => {
	test('gives the game the learner\'s Momo from the server before the app is up', async () => {
		const { sent, bridge } = runOnQuestPage('tok');
		expect(typeof bridge?.momo).toBe('function');
		await expect(bridge!.momo()).resolves.toMatchObject({ name: '豆豆', seed: 'abc123' });
		const asked = sent.find(s => s.url === '/api/lojo/tutor/persona/show');
		expect(asked?.body).toEqual({ i: 'tok' });
	});

	test('once the app is up, asks the app instead', async () => {
		const { sent, bridge } = runOnQuestPage('tok');
		bridge!.via = { momo: () => Promise.resolve({ name: 'Leo', seed: 'xyz' }) };
		const before = sent.length;
		await expect(bridge!.momo()).resolves.toEqual({ name: 'Leo', seed: 'xyz' });
		expect(sent.length).toBe(before);
	});

	test('a visitor gets the door, no frame and nothing asked about a Momo', () => {
		const { sent, bridge } = runOnQuestPage(null);
		expect(bridge).toBeUndefined();
		expect(sent.some(s => s.url.includes('persona'))).toBe(false);
	});
});
