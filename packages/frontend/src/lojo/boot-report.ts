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
