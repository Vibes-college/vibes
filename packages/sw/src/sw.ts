/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { get } from 'idb-keyval';
import * as Misskey from 'misskey-js';
import { FETCH_TIMEOUT_MS } from '@/const.js';
import type { PushNotificationDataMap } from '@/types.js';
import type { I18n } from '@@/js/i18n.js';
import type { Locale } from 'i18n';
import { createEmptyNotification, createNotification } from '@/scripts/create-notification.js';
import { swLang } from '@/scripts/lang.js';
import * as swos from '@/scripts/operations.js';

async function respondToNavigation(request: Request): Promise<Response> {
	const controller = new AbortController();
	const timeout = globalThis.setTimeout(() => {
		controller.abort('navigation-timeout');
	}, FETCH_TIMEOUT_MS);

	try {
		const response = await fetch(request, { signal: controller.signal });

		if (response?.status && response.status < 500) return response;
		if (response?.type === 'opaqueredirect') return response;
	} catch (error) {
		if (_DEV_) {
			console.warn('navigation fetch failed; showing offline page', error);
		}
	} finally {
		globalThis.clearTimeout(timeout);
	}

	// Only show offline page when network request actually fails
	const html = await offlineContentHTML();
	return new Response(html, {
		status: 200,
		headers: {
			'content-type': 'text/html',
		},
	});
}

// Vibes: every page of the app opens from the copy of the home page kept on the device, and the copy is refreshed in
// the background for next time. The server sends the same app for every page; other pages only add a title and tags
// for link previews, which the app does not need. From mainland China loading the page takes several round trips of
// about 0.2 s each (measured 2026-10-24), and a phone back from the background could wait up to FETCH_TIMEOUT_MS.
// Paths the server answers itself (API, files, feeds, OAuth, the repair pages) still go to the server, and so do the
// mini apps at /apps/<id>/, which run on their own (小程序搬出社区, 2026-11-12).
// The copy is dropped when a new service worker activates.
const HOME_CACHE = 'vibes-home';
const SERVER_PATHS = /^\/(?:apps|api|api-doc|api\.json|files|proxy|avatar|identicon|emoji|emojis|notes\/[^/]+\/activity|users|likes|follows|inbox|nodeinfo|\.well-known|oauth|healthz|streaming|url|vite|embed_vite|embed|assets|static-assets|client-assets|lojo-assets|lojo-amap|lojo-places|_AMapService|tarball|fluent-emoji|twemoji|twemoji-badge|_info_card_|bios|cli|flush)(?:\/|$)/;

function isAppPage(request: Request, url: URL): boolean {
	return request.method === 'GET'
		&& request.mode === 'navigate'
		&& url.origin === globalThis.location.origin
		&& !SERVER_PATHS.test(url.pathname)
		// Files such as /robots.txt and /manifest.json, and the feeds at /@user.rss.
		&& !/\.[a-z0-9]+$/i.test(url.pathname);
}

async function respondWithApp(ev: FetchEvent, url: URL): Promise<Response> {
	const home = new URL('/', url).href;
	const cache = await caches.open(HOME_CACHE);
	const kept = await cache.match(home, { ignoreVary: true });
	if (kept != null) {
		ev.waitUntil(refreshApp().catch(() => {
			// Offline: keep the copy we have.
		}));
		return kept;
	}
	const response = await respondToNavigation(ev.request);
	if (url.pathname === '/' && isServerPage(response)) {
		await cache.put(home, response.clone());
	} else {
		ev.waitUntil(fetch(home).then(async homeResponse => {
			if (isServerPage(homeResponse)) await cache.put(home, homeResponse);
		}).catch(() => {
			// Offline: the next page loaded will try again.
		}));
	}
	return response;
}

// Vibes: refreshes the kept copy of the app. When the server has a new version, its start-up files (BOOT_FILES in the
// page, see the backend's HtmlTemplateService.collectBootFiles) are downloaded first, into the browser's cache, and the
// copy is switched only once they are all there: the next start then needs no network for code, like an installed app
// that updates in the background. If a download fails, the old copy stays and the next refresh tries again (old files
// stay on the server after a deploy, see apps/community/deploy/deploy.sh).
let refreshing: Promise<void> | null = null;

function refreshApp(): Promise<void> {
	refreshing ??= (async () => {
		const home = new URL('/', globalThis.location.origin).href;
		const cache = await caches.open(HOME_CACHE);
		const response = await fetch(home);
		if (!isServerPage(response)) return;
		const kept = await cache.match(home, { ignoreVary: true });
		const fresh = appVersion(await response.clone().text());
		const old = kept != null ? appVersion(await kept.text()) : null;
		if (fresh != null && fresh.entry !== old?.entry && !await downloadAll(fresh.files)) return;
		await cache.put(home, response);
	})().finally(() => {
		refreshing = null;
	});
	return refreshing;
}

// The entry script and the start-up files named in a copy of the app page.
function appVersion(html: string): { entry: string; files: string[] } | null {
	const entry = /const CLIENT_ENTRY = "([^"]+)"/.exec(html)?.[1];
	if (entry == null) return null;
	let files: unknown = [];
	try {
		files = JSON.parse(/const BOOT_FILES = (\[[^\]]*\])/.exec(html)?.[1] ?? '[]');
	} catch {
		// An older page without the list: only the entry.
	}
	return { entry, files: [entry, ...(Array.isArray(files) ? files.filter((f): f is string => typeof f === 'string') : [])] };
}

async function downloadAll(files: string[]): Promise<boolean> {
	const lang = await swLang.lang;
	const urls = [...new Set(files.map(file => `/vite/${file.startsWith('scripts/') ? file.replace('scripts', lang) : file}`))];
	let ok = true;
	// A few at a time, so a phone on a slow line is not flooded.
	const next = async (): Promise<void> => {
		const url = urls.shift();
		if (url == null) return;
		try {
			const res = await fetch(url);
			// A file the server does not have (404) is not worth waiting for: only a broken connection keeps the old copy,
			// so a user is never held on an old version for good.
			if (res.ok) await res.arrayBuffer();
		} catch {
			ok = false;
		}
		await next();
	};
	await Promise.all([next(), next(), next(), next()]);
	return ok;
}

// A real page from the server, not the offline page made up above, an error or a redirect.
function isServerPage(response: Response): boolean {
	return response.ok && response.type === 'basic' && !response.redirected && (response.headers.get('content-type') ?? '').includes('text/html');
}

async function offlineContentHTML() {
	let i18n: Partial<I18n<Locale>>;
	try {
		i18n = await (swLang.i18n ?? await swLang.fetchLocale()) as Partial<I18n<Locale>>;
	} catch {
		i18n = {};
	}

	const messages = {
		title: i18n.ts?._offlineScreen.title ?? 'Offline - Could not connect to server',
		header: i18n.ts?._offlineScreen.header ?? 'Could not connect to server',
		reload: i18n.ts?.reload ?? 'Reload',
	};

	return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta content="width=device-width,initial-scale=1"name="viewport"><title>${messages.title}</title><style>body{background-color:#0c1210;color:#dee7e4;font-family:Hiragino Maru Gothic Pro,BIZ UDGothic,Roboto,HelveticaNeue,Arial,sans-serif;line-height:1.35;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;box-sizing:border-box}.icon{max-width:120px;width:100%;height:auto;margin-bottom:20px;}.message{text-align:center;font-size:20px;font-weight:700;margin-bottom:20px}.version{text-align:center;font-size:90%;margin-bottom:20px}button{padding:7px 14px;min-width:100px;font-weight:700;font-family:Hiragino Maru Gothic Pro,BIZ UDGothic,Roboto,HelveticaNeue,Arial,sans-serif;line-height:1.35;border-radius:99rem;background-color:#b4e900;color:#192320;border:none;cursor:pointer;-webkit-tap-highlight-color:transparent}button:hover{background-color:#c6ff03}</style></head><body><svg class="icon"fill="none"height="24"stroke="currentColor"stroke-linecap="round"stroke-linejoin="round"stroke-width="2"viewBox="0 0 24 24"width="24"xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z"fill="none"stroke="none"/><path d="M9.58 5.548c.24 -.11 .492 -.207 .752 -.286c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 .957 -.383 1.824 -1.003 2.454m-2.997 1.033h-11.343c-2.572 -.004 -4.657 -2.011 -4.657 -4.487c0 -2.475 2.085 -4.482 4.657 -4.482c.13 -.582 .37 -1.128 .7 -1.62"/><path d="M3 3l18 18"/></svg><div class="message">${messages.header}</div><div class="version">v${_VERSION_}</div><button onclick="reloadPage()">${messages.reload}</button><script>function reloadPage(){location.reload(!0)}</script></body></html>`;
}

globalThis.addEventListener('install', (ev) => {
	// 次の問題が発生するため、ServiceWorkerAutoPreload をオプトアウトする必要がある
	// https://issues.chromium.org/issues/466790291
	if ('addRoutes' in ev) {
		// doc: https://developer.mozilla.org/en-US/docs/Web/API/InstallEvent/addRoutes
		// @ts-expect-error 実験的なAPIなので型定義がない
		ev.addRoutes({
			condition: {
				// doc: https://developer.mozilla.org/ja/docs/Web/API/URLPattern
				// @ts-expect-error 実験的なAPIなので型定義がない
				urlPattern: new URLPattern({}),
			},
			source: 'fetch-event',
		});
	}
});

globalThis.addEventListener('activate', ev => {
	ev.waitUntil(
		caches.keys()
			.then(cacheNames => Promise.all(
				cacheNames
					.filter((v) => v !== swLang.cacheName)
					.map(name => caches.delete(name)),
			))
			.then(() => globalThis.clients.claim()),
	);
});

globalThis.addEventListener('fetch', ev => {
	let isHTMLRequest = false;
	if (ev.request.headers.get('sec-fetch-dest') === 'document') {
		isHTMLRequest = true;
	} else if (ev.request.headers.get('accept')?.includes('/html')) {
		isHTMLRequest = true;
	} else if (ev.request.url.endsWith('/')) {
		isHTMLRequest = true;
	}

	if (!isHTMLRequest) return;
	const url = new URL(ev.request.url);
	if (isAppPage(ev.request, url)) {
		ev.respondWith(respondWithApp(ev, url));
		return;
	}
	ev.respondWith(respondToNavigation(ev.request));
});

globalThis.addEventListener('push', ev => {
	// クライアント取得
	ev.waitUntil(globalThis.clients.matchAll({
		includeUncontrolled: true,
		type: 'window',
	}).then(async () => {
		const data: PushNotificationDataMap[keyof PushNotificationDataMap] = ev.data?.json();

		switch (data.type) {
			// case 'driveFileCreated':
			case 'notification':
			case 'unreadAntennaNote':
			case 'newChatMessage':
				// 1日以上経過している場合は無視
				if (Date.now() - data.dateTime > 1000 * 60 * 60 * 24) break;

				return createNotification(data);
			case 'readAllNotifications':
				await globalThis.registration.getNotifications()
					.then(notifications => notifications.forEach(n => n.tag !== 'read_notification' && n.close()));
				break;
		}

		await createEmptyNotification();
		return;
	}));
});

globalThis.addEventListener('notificationclick', (ev: ServiceWorkerGlobalScopeEventMap['notificationclick']) => {
	ev.waitUntil((async (): Promise<void> => {
		if (_DEV_) {
			console.log('notificationclick', ev.action, ev.notification.data);
		}

		const { action, notification } = ev;
		const data: PushNotificationDataMap[keyof PushNotificationDataMap] = notification.data ?? {};
		const { userId: loginId } = data;
		let client: WindowClient | null = null;

		switch (data.type) {
			case 'notification':
				switch (action) {
					case 'follow':
						if ('userId' in data.body) await swos.api('following/create', loginId, { userId: data.body.userId });
						break;
					case 'showUser':
						if ('user' in data.body) client = await swos.openUser(Misskey.acct.toString(data.body.user), loginId);
						break;
					case 'reply':
						if ('note' in data.body) client = await swos.openPost({ reply: data.body.note }, loginId);
						break;
					case 'renote':
						if ('note' in data.body) await swos.api('notes/create', loginId, { renoteId: data.body.note.id });
						break;
					case 'accept':
						switch (data.body.type) {
							case 'receiveFollowRequest':
								await swos.api('following/requests/accept', loginId, { userId: data.body.userId });
								break;
						}
						break;
					case 'reject':
						switch (data.body.type) {
							case 'receiveFollowRequest':
								await swos.api('following/requests/reject', loginId, { userId: data.body.userId });
								break;
						}
						break;
					case 'showFollowRequests':
						client = await swos.openClient('push', '/my/follow-requests', loginId);
						break;
					default:
						switch (data.body.type) {
							case 'receiveFollowRequest':
								client = await swos.openClient('push', '/my/follow-requests', loginId);
								break;
							case 'reaction':
								client = await swos.openNote(data.body.note.id, loginId);
								break;
							default:
								if ('note' in data.body) {
									client = await swos.openNote(data.body.note.id, loginId);
								} else if ('user' in data.body) {
									client = await swos.openUser(Misskey.acct.toString(data.body.user), loginId);
								}
								break;
						}
				}
				break;
			case 'unreadAntennaNote':
				client = await swos.openAntenna(data.body.antenna.id, loginId);
				break;
			case 'newChatMessage':
				client = await swos.openChat(data.body, loginId);
				break;
			default:
				switch (action) {
					case 'markAllAsRead':
						await globalThis.registration.getNotifications()
							.then(notifications => notifications.forEach(n => n.tag !== 'read_notification' && n.close()));
						await get<Pick<Misskey.entities.SignupResponse, 'id' | 'token'>[]>('accounts').then(accounts => {
							return Promise.all((accounts ?? []).map(async account => {
								await swos.sendMarkAllAsRead(account.id);
							}));
						});
						break;
					case 'settings':
						client = await swos.openClient('push', '/settings/notifications', loginId);
						break;
				}
		}

		if (client) {
			client.focus();
		}
		if (data.type === 'notification') {
			await swos.sendMarkAllAsRead(loginId);
		}

		notification.close();
	})());
});

globalThis.addEventListener('notificationclose', (ev: ServiceWorkerGlobalScopeEventMap['notificationclose']) => {
	const data: PushNotificationDataMap[keyof PushNotificationDataMap] = ev.notification.data;

	ev.waitUntil((async (): Promise<void> => {
		if (data.type === 'notification') {
			await swos.sendMarkAllAsRead(data.userId);
		}
		return;
	})());
});

globalThis.addEventListener('message', (ev: ServiceWorkerGlobalScopeEventMap['message']) => {
	ev.waitUntil((async (): Promise<void> => {
		switch (ev.data) {
			case 'clear':
				// Cache Storage全削除
				await caches.keys()
					.then(cacheNames => Promise.all(
						cacheNames.map(name => caches.delete(name)),
					));
				return; // TODO
		}

		if (typeof ev.data === 'object') {
			// E.g. '[object Array]' → 'array'
			const otype = Object.prototype.toString.call(ev.data).slice(8, -1).toLowerCase();

			if (otype === 'object') {
				if (ev.data.msg === 'initialize') {
					swLang.setLang(ev.data.lang);
				}
				// Vibes: the page is back in front after a while (utility/initialize-sw.ts); a deploy may have happened since.
				if (ev.data.msg === 'vibes-refresh-app') {
					await refreshApp().catch(() => {
						// Offline: the next start or refresh tries again.
					});
				}
			}
		}
	})());
});
