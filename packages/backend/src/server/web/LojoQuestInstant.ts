/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes: 闯关 opens without waiting for the whole community app (2026-11-10).
// Before: /quest showed the game only after the app (about 630 KB of scripts, then three more waves) had started,
// 8–15 s on a desktop abroad and minutes on a phone, where the pages the app downloads ahead also crowded out the game.
// Now every page carries a small script (questInstantScript, in <head> before the app's stylesheet): on /quest it puts the game's
// frame (or, for a visitor, the 闯关 door) on screen at once and asks for the player's map data right away; the app
// starts once the map is drawn (boot.js) and the 闯关 page then takes the frame over (frontend pages/lojo/quest.vue).
// The script sits on every page because the service worker opens every page from its copy of the home page.
//
// The game's files get a version from their content, so they can be kept on the phone for a year and are fetched again
// only when they change (no more hand-kept ?v=4).

import { createHash } from 'node:crypto';
import { promises as fsp } from 'node:fs';
import { resolve } from 'node:path';

// Files index.html links to, as written there (with any old ?v=…).
const LINKED = ['quest.css', 'quest.js', 'vendor/gsap.min.js'];

export type QuestAssets = {
	indexHtml: string;
	// '/lojo-assets/quest/index.html?v=<hash>'
	frameUrl: string;
	// file (relative to the quest folder) → content hash; a request with that ?v= may be kept for good
	hashes: Map<string, string>;
};

const hash = (data: string | Buffer) => createHash('sha256').update(data).digest('hex').slice(0, 12);

export class LojoQuestAssets {
	private readonly dir: string;
	private cached: { stamp: string; value: QuestAssets } | null = null;
	private loading: Promise<QuestAssets | null> | null = null;

	constructor(staticAssetsDir: string, private readonly watch: boolean) {
		this.dir = resolve(staticAssetsDir, 'lojo/quest');
	}

	// In production the files only change with a new image (and a restart); in development, re-read them when edited.
	public async get(): Promise<QuestAssets | null> {
		if (this.cached != null && !this.watch) return this.cached.value;
		this.loading ??= this.load().finally(() => {
			this.loading = null;
		});
		return await this.loading;
	}

	private async load(): Promise<QuestAssets | null> {
		try {
			const files = ['index.html', ...LINKED];
			const stats = await Promise.all(files.map(f => fsp.stat(resolve(this.dir, f))));
			const stamp = stats.map(s => `${s.mtimeMs}:${s.size}`).join('|');
			if (this.cached?.stamp === stamp) return this.cached.value;
			const hashes = new Map<string, string>();
			for (const f of LINKED) hashes.set(f, hash(await fsp.readFile(resolve(this.dir, f))));
			let indexHtml = await fsp.readFile(resolve(this.dir, 'index.html'), 'utf-8');
			for (const f of LINKED) {
				const re = new RegExp(`(["']\\./${f.replace(/[.]/g, '\\.')})(\\?v=[^"']*)?(["'])`, 'g');
				indexHtml = indexHtml.replace(re, `$1?v=${hashes.get(f)}$3`);
			}
			const indexHash = hash(indexHtml);
			hashes.set('index.html', indexHash);
			const value = { indexHtml, frameUrl: `/lojo-assets/quest/index.html?v=${indexHash}`, hashes };
			this.cached = { stamp, value };
			return value;
		} catch {
			return null;
		}
	}

	// Cache-Control for a file under /lojo-assets/quest/ (path without the prefix, v = its ?v=).
	public static cacheControl(assets: QuestAssets | null, path: string, v: string | undefined): string | null {
		if (assets != null && v != null && assets.hashes.get(path) === v) return 'public, max-age=31536000, immutable';
		// Sound effects change rarely and are not versioned: a week.
		if (path.startsWith('sounds/') && path.endsWith('.mp3')) return 'public, max-age=604800';
		return null;
	}
}

const DOOR_STYLE = `
#vibesQuestDoor{position:fixed;left:0;top:0;width:100%;height:100%;z-index:2147483000;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;background:#f6efe0;overflow:auto;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif}
#vibesQuestDoor .peek{width:100%;max-width:420px;margin-bottom:-18px;opacity:.85}
#vibesQuestDoor .card{position:relative;max-width:420px;box-sizing:border-box;width:100%;padding:28px 22px;border:2px solid #3b3127;border-radius:14px;background:#fffaf0;color:#3b3127;box-shadow:4px 4px 0 #3b3127}
#vibesQuestDoor .kicker{font-size:.85em;letter-spacing:.08em;opacity:.7}
#vibesQuestDoor h1{margin:8px 0 12px;font-size:1.4em;line-height:1.35}
#vibesQuestDoor p{margin:0 0 10px;line-height:1.7}
#vibesQuestDoor .actions{display:flex;flex-direction:column;gap:10px;margin-top:18px}
#vibesQuestDoor button{appearance:none;font:inherit;font-weight:bold;padding:12px 16px;border:2px solid #3b3127;border-radius:999px;background:transparent;color:inherit;cursor:pointer}
#vibesQuestDoor button.primary{background:#3b3127;color:#fffaf0}
#vibesQuestDoor button:disabled{opacity:.6;cursor:default}
#vibesQuestInstant{position:fixed;left:0;top:0;width:100%;height:100%;border:0;margin:0;padding:0;display:block;background:#f6efe0;z-index:2147483000}
`;

// Same look as the door in pages/lojo/quest.vue, which replaces it once the app is up.
const DOOR_HTML = `<svg class="peek" viewBox="0 0 390 150" aria-hidden="true"><path d="M195 150 Q150 125 120 100 Q100 80 150 60 Q200 40 195 15" fill="none" stroke="#141E52" stroke-width="2.4" stroke-dasharray="1 7" stroke-linecap="round"/><path d="M150 60 Q230 70 300 45" fill="none" stroke="#c9bda4" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round"/><path d="M0 95 Q100 80 200 98 T390 88" fill="none" stroke="#d6e0e6" stroke-width="10" stroke-linecap="round"/><g font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle" fill="#141E52"><circle cx="120" cy="100" r="14" fill="#FFFDF8" stroke="#141E52" stroke-width="1.8"/><text x="120" y="104">1-1</text><circle cx="150" cy="60" r="14" fill="#F6F1E7" stroke="#141E52" stroke-width="1.8" stroke-dasharray="3 3"/><text x="150" y="64">1-2</text><circle cx="300" cy="45" r="14" fill="#F6F1E7" stroke="#141E52" stroke-width="1.8" stroke-dasharray="3 3"/><text x="300" y="49">1-7</text><path d="M195 4 l-7 7 h4 v8 h6 v-8 h4z" fill="#E8603F"/></g></svg><div class="card"><div class="kicker">闯关 · 雅思第一章</div><h1>用闯关的方式，让你沉迷学习</h1><p>一关一关，打到考场。第一关：听人报名字、地址，一个字母一个字母拼出来。</p><div class="actions"><button class="primary" type="button" data-open="trial">先打一关，不用注册</button><button type="button" data-open="signin">已有账号？登录</button></div></div>`;

// Plain ES2017 (it runs before anything else, also on older phones). FRAME is replaced with the frame's address.
const SCRIPT = `(function () {
	var frameUrl = FRAME;
	// Also for 闯关 opened later from inside the app (quest.vue): the versioned address can be kept on the phone.
	window.vibesQuestFrame = frameUrl;
	if (location.pathname !== '/quest') return;
	var style = document.createElement('style');
	style.textContent = STYLE;
	document.head.appendChild(style);
	var token = null;
	try { var acct = JSON.parse(localStorage.getItem('account') || 'null'); token = acct && typeof acct.token === 'string' ? acct.token : null; } catch (e) { token = null; }
	var q = new URLSearchParams(location.search);
	// 埋点 quest_arrive (增长 埋点清单 第 1 步): came with ?src= (the landing page's button); once a day per browser, nothing about
	// the person is sent. The source is kept here for the trial's own steps (quest.js).
	var src = q.get('src');
	if (src != null && /^[a-z0-9_]{1,32}$/.test(src)) {
		try {
			localStorage.setItem('vibesQuestSrc', src);
			var day = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
			if (localStorage.getItem('vibesFunnel:quest_arrive') !== day) {
				localStorage.setItem('vibesFunnel:quest_arrive', day);
				fetch('/api/lojo/funnel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', body: JSON.stringify({ event: 'quest_arrive', src: src }) }).catch(function () {});
			}
		} catch (e) { /* private mode: not counted */ }
	}
	// The script runs in <head>, before <body> exists: put it on <html> (it is fixed on screen either way).
	function place(el) { (document.body || document.documentElement).appendChild(el); }
	if (token == null) {
		// A visitor: the door now; its buttons open the first level (先打一关) or the app's sign-in once the app is up (quest.vue).
		var door = document.createElement('div');
		door.id = 'vibesQuestDoor';
		door.innerHTML = DOOR;
		var state = { el: door, pending: null };
		door.addEventListener('click', function (ev) {
			var b = ev.target && ev.target.closest ? ev.target.closest('button[data-open]') : null;
			if (b == null || state.pending != null) return;
			state.pending = b.getAttribute('data-open');
			b.textContent = '正在打开…';
			var all = door.querySelectorAll('button');
			for (var i = 0; i < all.length; i++) all[i].disabled = true;
		});
		place(door);
		window.vibesQuestDoor = state;
		return;
	}
	function post(ep, params) {
		var body = {};
		for (var k in params) body[k] = params[k];
		body.i = token;
		return fetch('/api/' + ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', body: JSON.stringify(body) });
	}
	function result(p) {
		return p.then(function (res) {
			if (res.status === 204) return null;
			return res.json().catch(function () { return null; }).then(function (body) {
				if (!res.ok) throw { code: (body && body.error && body.error.code) || ('HTTP_' + res.status), message: (body && body.error && body.error.message) || '' };
				return body;
			});
		}, function () { throw { code: 'NETWORK', message: '网络断了' }; });
	}
	// The map's data, asked for now, while the game's files are still on their way.
	var early = post('lojo/quest/show', {});
	var earlyAt = Date.now();
	early.catch(function () {});
	var bridge = {
		query: { book: q.get('book') || undefined, level: q.get('level') || undefined, from: q.get('from') || undefined },
		// Set by the 闯关 page once the app is up: from then on its api (the app's login) and go (the app's router).
		via: null,
		api: function (ep, params) {
			params = params || {};
			if (early != null && ep === 'lojo/quest/show' && Object.keys(params).length === 0) {
				var e = early;
				early = null;
				if (Date.now() - earlyAt < 30000) return result(e);
			}
			if (bridge.via != null) return bridge.via.api(ep, params);
			if (!/^lojo\\/(quest\\/[a-z-]+|funnel)$/.test(ep)) return Promise.reject({ code: 'NOT_ALLOWED', message: ep });
			return result(post(ep, params));
		},
		go: function (path) {
			if (bridge.via != null) return bridge.via.go(path);
			if (/^https?:\\/\\//.test(path)) { window.open(path, '_blank', 'noopener'); return; }
			if (typeof path !== 'string' || path.charAt(0) !== '/') return;
			// Same as markFromQuest() in frontend lojo/quest-refill.ts: a set finished in a mini app may give back a heart.
			if (path.indexOf('/quest') !== 0) { try { sessionStorage.setItem('vibes.quest.from', String(Date.now())); } catch (e) { /* private mode */ } }
			location.href = path;
		},
		// Hide / bring back the app's bottom bar (phone). Before the app is up there is no bar to hide.
		chrome: function (hidden) { return bridge.via != null && bridge.via.chrome != null ? bridge.via.chrome(hidden) : false; },
		// Open the summoned agent's panel, if any.
		agent: function () { return bridge.via != null && bridge.via.agent != null ? bridge.via.agent() : false; },
		// The game calls this once its map is drawn: the app may start downloading now (boot.js).
		ready: function () {
			if (window.vibesQuestReady) return;
			window.vibesQuestReady = true;
			try { window.dispatchEvent(new Event('vibes:quest-ready')); } catch (e) { /* very old browser: boot.js times out */ }
		},
	};
	var frame = document.createElement('iframe');
	frame.id = 'vibesQuestInstant';
	frame.title = '闯关';
	frame.setAttribute('allow', 'autoplay');
	frame.__vibesQuest = bridge;
	var s = q.get('s');
	frame.src = frameUrl + (s != null ? '&s=' + encodeURIComponent(s) : '');
	place(frame);
	window.vibesQuestInstant = { frame: frame, bridge: bridge, search: location.search, taken: false };
})();`;

export function questInstantScript(frameUrl: string): string {
	// '<\/' so nothing inside can end the <script> it sits in.
	const js = (v: string) => JSON.stringify(v).replace(/<\//g, '<\\/');
	return SCRIPT
		.replace('FRAME', () => js(frameUrl))
		.replace('STYLE', () => js(DOOR_STYLE.trim()))
		.replace('DOOR', () => js(DOOR_HTML));
}
