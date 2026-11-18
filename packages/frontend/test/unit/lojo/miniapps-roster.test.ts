/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// 小程序入口读服务器上的名册（2026-11-17 起）：手机上留一份，先用这份，后台问一句变没变；读不到也不出错。
const api = vi.fn();
const opened: string[] = [];
const seen = new Set<string>();
vi.mock('@/utility/misskey-api.js', () => ({ misskeyApi: (...args: unknown[]) => api(...args) }));
vi.mock('@/lojo/app-overlay.js', () => ({ openAppOverlay: (href: string) => { opened.push(href); } }));
vi.mock('@/lojo/miniapps/state.js', () => ({ hasSeenMiniApp: (id: string) => seen.has(id) }));

const app = (id: string, o: Record<string, unknown> = {}) => ({
	id, name: `示例 ${id}`, icon: 'ti ti-camera', href: `/apps/${id}/`, type: 'server', visible: true,
	intro: { summary: '示例', audience: '示例', steps: ['示例'], caveats: [] }, ...o,
});
const KEY = 'lojo:miniApps:roster';

async function fresh() {
	vi.resetModules();
	return await import('@/lojo/miniapps/roster.js');
}

beforeEach(() => {
	api.mockReset();
	opened.length = 0;
	seen.clear();
	window.localStorage.clear();
});

describe('the 小程序 launcher reads the roster from the server', () => {
	it('first visit: nothing yet, then the server list, kept on the device', async () => {
		const r = await fresh();
		expect(r.miniApps.value).toEqual([]);
		expect(r.miniAppsState.value).toBe('loading');
		api.mockResolvedValue({ kind: 'apps', version: 'apps@1', hash: 'h1', data: { apps: [app('example-a'), app('example-b')] } });
		await r.refreshMiniApps();
		expect(api).toHaveBeenCalledWith('lojo/content/pack', { kind: 'apps' });
		expect(r.miniApps.value.map(a => a.id)).toEqual(['example-a', 'example-b']);
		expect(r.miniAppsState.value).toBe('ready');
		expect(JSON.parse(window.localStorage.getItem(KEY)!).hash).toBe('h1');
	});

	it('with a copy: shows it at once; the same version costs a few bytes; a new one replaces it', async () => {
		window.localStorage.setItem(KEY, JSON.stringify({ hash: 'h1', apps: [app('example-a'), app('example-b')] }));
		const r = await fresh();
		expect(r.miniApps.value.map(a => a.id)).toEqual(['example-a', 'example-b']);
		expect(r.miniAppsState.value).toBe('ready');
		api.mockResolvedValueOnce({ kind: 'apps', version: 'apps@1', hash: 'h1' });
		await r.refreshMiniApps();
		expect(api).toHaveBeenCalledWith('lojo/content/pack', { kind: 'apps', have: 'h1' });
		expect(r.miniApps.value).toHaveLength(2);
		// example-b turned off in the roster
		api.mockResolvedValueOnce({ kind: 'apps', version: 'apps@2', hash: 'h2', data: { apps: [app('example-a')] } });
		await r.refreshMiniApps();
		expect(r.miniApps.value.map(a => a.id)).toEqual(['example-a']);
		expect(api).toHaveBeenLastCalledWith('lojo/content/pack', { kind: 'apps', have: 'h1' });
		api.mockResolvedValueOnce({ kind: 'apps', version: 'apps@2', hash: 'h2' });
		await r.refreshMiniApps();
		expect(api).toHaveBeenLastCalledWith('lojo/content/pack', { kind: 'apps', have: 'h2' });
	});

	it('the server cannot be read: the copy stays; without one the launcher says so, and nothing throws', async () => {
		window.localStorage.setItem(KEY, JSON.stringify({ hash: 'h1', apps: [app('example-a')] }));
		let r = await fresh();
		api.mockRejectedValue(new Error('offline'));
		await expect(r.refreshMiniApps()).resolves.toBeUndefined();
		expect(r.miniApps.value.map(a => a.id)).toEqual(['example-a']);
		expect(r.miniAppsState.value).toBe('ready');

		window.localStorage.clear();
		r = await fresh();
		await r.refreshMiniApps();
		expect(r.miniApps.value).toEqual([]);
		expect(r.miniAppsState.value).toBe('failed');

		window.localStorage.setItem(KEY, '{not json');
		r = await fresh();
		expect(r.miniApps.value).toEqual([]);
		api.mockResolvedValue({ kind: 'apps', version: 'apps@1', hash: 'h1', data: { nothing: true } });
		await r.refreshMiniApps();
		expect(r.miniAppsState.value).toBe('failed');
	});

	it('an entry missing a part the launcher draws is left out, the rest still show', async () => {
		const r = await fresh();
		expect(r.rosterApps({ apps: [app('example-a'), app('example-b', { intro: { summary: '示例' } }), { id: 'example-c' }, null] })!.map(a => a.id)).toEqual(['example-a']);
		expect(r.rosterApps({})).toBeNull();
		expect(r.rosterApps(null)).toBeNull();
	});

	it('opening, the intro seen under an old id, the plan links and the overlay title', async () => {
		const r = await fresh();
		r.setMiniApps(r.rosterApps({ apps: [app('example-a', { formerIds: ['example-old'] }), app('example-site', { href: 'https://example.com/read/' })] })!);
		r.openMiniApp(r.miniApps.value[1]);
		expect(opened).toEqual(['https://example.com/read/']);
		expect(r.hasSeenMiniAppIntro(r.miniApps.value[0])).toBe(false);
		seen.add('example-old');
		expect(r.hasSeenMiniAppIntro(r.miniApps.value[0])).toBe(true);
		expect(r.miniAppHref('example-a')).toBe('/apps/example-a/');
		expect(r.miniAppHref('zzz')).toBeNull();
		expect(r.miniAppNameAt('/apps/example-a/list?x=1')).toBe('示例 example-a');
		expect(r.miniAppNameAt('/apps/other/')).toBeNull();
	});
});
