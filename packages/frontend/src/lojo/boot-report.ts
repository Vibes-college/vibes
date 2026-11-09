/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Anonymous record of how fast the app started on this device, for the daily stability report (founder approved
// 2026-10-31; the server side and what is kept: packages/backend/src/misc/lojo-boot-report.ts). Sent once per page load,
// without the account: only the section of the site, the kind of system and browser, and timings.
// The boot loader sends its own record when the app fails to start (public/loader/boot.js, sendBootError).

import { $i } from '@/i.js';

// Set by the page's inline script (backend views/base.tsx); null in development.
declare const CLIENT_ENTRY: string | null | undefined;

// The timeline marks when its first notes are on screen, and whether they were the ones kept on the device
// (utility/paginator.ts): performance.mark('vibes:first-content', { detail: { kept } }).
export const FIRST_CONTENT_MARK = 'vibes:first-content';

let sent = false;

// The live connection (stream.ts calls trackStream when it opens one). Speed fields, 2026-11-09: see
// packages/backend/src/misc/lojo-boot-report.ts; the server keeps them only where LOJO_SPEED_FIELDS=on.
type StreamEvents = {
	state: string;
	on(event: '_connected_' | '_disconnected_', listener: () => void): unknown;
};
let wsMs: number | null = null;
let conn: { visibleSince: number | null; visibleMs: number; drops: number; hiddenDrops: number; reconnectMs: number[]; droppedAt: number | null; sent: number } | null = null;
const MAX_CONN_REPORTS = 20;

function section(path: string): string {
	const first = path.split('/')[1] ?? '';
	if (first === '') return 'home';
	if (first.startsWith('@')) return 'user';
	return /^[a-z][a-z0-9-]{0,31}$/.test(first) ? first : 'other';
}

function system(ua: string): string {
	if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
	if (/Android/.test(ua)) return 'android';
	if (/Mac OS X/.test(ua)) return 'mac';
	if (/Windows/.test(ua)) return 'windows';
	if (/Linux/.test(ua)) return 'linux';
	return 'other';
}

function browser(ua: string): string {
	if (/MicroMessenger/i.test(ua)) return 'wechat';
	if (/xhsdiscover|XiaoHongShu/i.test(ua)) return 'xhs';
	if (/EdgA?\/|EdgiOS\//.test(ua)) return 'edge';
	if (/FxiOS\/|Firefox\//.test(ua)) return 'firefox';
	if (/CriOS\/|Chrome\//.test(ua)) return 'chrome';
	if (/Safari\//.test(ua)) return 'safari';
	return 'other';
}

function navigationType(): string {
	const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
	const type = entry?.type ?? 'other';
	return ['navigate', 'reload', 'back_forward', 'prerender'].includes(type) ? type : 'other';
}

function isVisible() {
	return window.document.visibilityState === 'visible';
}

function paintMs(): number | null {
	const fcp = performance.getEntriesByName('first-contentful-paint')[0];
	return fcp != null ? Math.min(Math.round(fcp.startTime), 600000) : null;
}

function firstByteMs(): number | null {
	const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
	return entry != null && entry.responseStart > 0 ? Math.min(Math.round(entry.responseStart), 600000) : null;
}

export function trackStream(stream: StreamEvents) {
	if (conn != null) return;
	const opened = performance.now();
	conn = { visibleSince: isVisible() ? opened : null, visibleMs: 0, drops: 0, hiddenDrops: 0, reconnectMs: [], droppedAt: null, sent: 0 };
	const c = conn;
	stream.on('_connected_', () => {
		const now = performance.now();
		if (wsMs == null) wsMs = Math.min(Math.round(now - opened), 600000);
		if (c.droppedAt != null && c.reconnectMs.length < 10) c.reconnectMs.push(Math.min(Math.round(now - c.droppedAt), 600000));
		c.droppedAt = null;
	});
	stream.on('_disconnected_', () => {
		// A drop while the page is in the background is the phone freezing it; it reconnects when the page comes back.
		if (!isVisible()) {
			c.hiddenDrops++;
			return;
		}
		c.drops++;
		c.droppedAt = performance.now();
	});
	window.document.addEventListener('visibilitychange', () => {
		if (isVisible()) {
			c.visibleSince = performance.now();
		} else {
			sendConn(stream);
		}
	});
	window.addEventListener('pagehide', () => sendConn(stream));
}

// One record per stretch in front: sent when the page goes to the background or is closed, then the counts start over.
function sendConn(stream: StreamEvents) {
	const c = conn;
	if (c == null || c.sent >= MAX_CONN_REPORTS) return;
	const now = performance.now();
	if (c.visibleSince != null) c.visibleMs += now - c.visibleSince;
	c.visibleSince = null;
	if (c.visibleMs < 1000 && c.drops === 0 && c.hiddenDrops === 0) return;
	const ua = navigator.userAgent;
	const report = {
		os: system(ua),
		browser: browser(ua),
		bot: navigator.webdriver === true,
		visibleSec: Math.min(Math.round(c.visibleMs / 1000), 86400),
		drops: Math.min(c.drops, 1000),
		hiddenDrops: Math.min(c.hiddenDrops, 1000),
		reconnectMs: c.reconnectMs,
		down: stream.state !== 'connected',
	};
	c.sent++;
	c.visibleMs = 0;
	c.drops = 0;
	c.hiddenDrops = 0;
	c.reconnectMs = [];
	try {
		navigator.sendBeacon('/api/lojo/conn-report', new Blob([JSON.stringify(report)], { type: 'application/json' }));
	} catch {
		// Not sent: the report is only for statistics.
	}
}

function send(bootMs: number) {
	if (sent) return;
	sent = true;
	const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
	const code = resources.filter(r => r.name.includes('/vite/') && r.responseEnd <= bootMs + 1);
	// transferSize is 0 for files from the browser's cache; browsers that do not report it give undefined.
	const codeKb = code.length > 0 && code.every(r => typeof r.transferSize === 'number')
		? Math.round(code.reduce((sum, r) => sum + r.transferSize, 0) / 1024)
		: -1;
	const api = resources.filter(r => r.name.includes('/api/') && r.responseEnd > 0).map(r => r.responseEnd);
	const first = performance.getEntriesByName(FIRST_CONTENT_MARK)[0] as PerformanceMark | undefined;
	const ua = navigator.userAgent;
	const report = {
		v: (typeof CLIENT_ENTRY === 'string' ? CLIENT_ENTRY.split('/').pop() : null) ?? 'dev',
		page: section(window.location.pathname),
		nav: navigationType(),
		os: system(ua),
		browser: browser(ua),
		standalone: window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
		signedIn: $i != null,
		sw: navigator.serviceWorker?.controller != null,
		codeKb: Math.min(codeKb, 100000),
		retries: Math.min(Number((window as Window & { vibesBootRetries?: number }).vibesBootRetries ?? 0), 10),
		bootMs: Math.min(Math.round(bootMs), 600000),
		contentMs: first != null ? Math.min(Math.round(first.startTime), 600000) : null,
		keptContent: first != null ? (first.detail as { kept?: boolean } | null)?.kept === true : null,
		firstApiMs: api.length > 0 ? Math.min(Math.round(Math.min(...api)), 600000) : null,
		ttfbMs: firstByteMs(),
		fcpMs: paintMs(),
		wsMs,
		bot: navigator.webdriver === true,
	};
	try {
		navigator.sendBeacon('/api/lojo/boot-report', new Blob([JSON.stringify(report)], { type: 'application/json' }));
	} catch {
		// Not sent: the report is only for statistics.
	}
}

// Called once the app is drawn (boot/common.ts). The record waits for the first notes, up to 15 s, and goes out
// earlier if the page is closed or hidden.
export function startBootReport() {
	const bootMs = performance.now();
	const flush = () => send(bootMs);
	window.setTimeout(flush, 15 * 1000);
	window.addEventListener('pagehide', flush, { once: true });
	window.document.addEventListener('visibilitychange', () => {
		if (window.document.visibilityState === 'hidden') flush();
	});
}
