/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes: an anonymous record of how fast the app starts on people's devices, and the daily stability report made from
// it (founder approved 2026-10-31). One record per page load, sent by the frontend (src/lojo/boot-report.ts). It holds
// no account, no IP address, no full page address and no full browser string: only the section of the site, the kind of
// system and browser, and timings. Kept in Redis per day (Beijing time) for KEEP_DAYS days.

export const KEEP_DAYS = 14;
const MAX_PER_DAY = 20000;

export const bootReportOs = ['ios', 'android', 'mac', 'windows', 'linux', 'other'] as const;
export const bootReportBrowsers = ['safari', 'chrome', 'wechat', 'xhs', 'edge', 'firefox', 'other'] as const;
export const bootReportNavs = ['navigate', 'reload', 'back_forward', 'prerender', 'other'] as const;

export type BootReport = {
	t: number; // when it arrived, Unix seconds
	v: string; // app version: the entry script's file name
	page: string; // section of the site: "home", "notes", "user", "map", …
	nav: typeof bootReportNavs[number];
	os: typeof bootReportOs[number];
	browser: typeof bootReportBrowsers[number];
	standalone: boolean; // opened from the home screen
	signedIn: boolean;
	sw: boolean; // the page came from the service worker's copy
	codeKb: number; // app code downloaded over the network for this start; -1 when the browser does not say
	retries: number; // reloads by the boot loader before the app started
	bootMs: number | null; // until the app was drawn; null when it did not start
	contentMs: number | null; // until the first notes were on screen (timeline pages only)
	keptContent: boolean | null; // those first notes were the ones kept on the device
	firstApiMs: number | null; // until the first answer from the server
	error: string | null; // the boot loader's error code when the app did not start
};

// Beijing time, the founder's day.
export function bootReportDay(at = Date.now()): string {
	return new Date(at + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function bootReportKey(day: string): string {
	return `lojo:bootReport:${day}`;
}

export function bootReportLimits() {
	return { maxPerDay: MAX_PER_DAY, keepSeconds: (KEEP_DAYS + 1) * 24 * 60 * 60 };
}

function percentile(values: number[], p: number): number | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

function spread(values: number[]) {
	return { p50: percentile(values, 0.5), p90: percentile(values, 0.9), n: values.length };
}

function countBy<T extends string>(rows: BootReport[], pick: (row: BootReport) => T): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const row of rows) counts[pick(row)] = (counts[pick(row)] ?? 0) + 1;
	return counts;
}

// A cold start downloaded the app's code (after a new version, or with the browser's cache gone).
const COLD_KB = 50;

export function summarizeBootReports(day: string, rows: BootReport[]) {
	const started = rows.filter(row => row.bootMs != null);
	const timings = (list: BootReport[], pick: (row: BootReport) => number | null) => spread(list.map(pick).filter((v): v is number => v != null));
	const cold = started.filter(row => row.codeKb >= COLD_KB);
	const warm = started.filter(row => row.codeKb >= 0 && row.codeKb < COLD_KB);
	const withContent = started.filter(row => row.contentMs != null);
	const pages = Object.entries(countBy(started, row => row.page))
		.filter(([, n]) => n >= 3)
		.map(([page, n]) => ({ page, n, p90BootMs: percentile(started.filter(row => row.page === page).map(row => row.bootMs!), 0.9) }))
		.sort((a, b) => (b.p90BootMs ?? 0) - (a.p90BootMs ?? 0))
		.slice(0, 5);
	return {
		day,
		loads: rows.length,
		started: started.length,
		failed: rows.length - started.length,
		errors: countBy(rows.filter(row => row.error != null), row => row.error!),
		retried: rows.filter(row => row.retries > 0).length,
		signedIn: rows.filter(row => row.signedIn).length,
		fromServiceWorker: rows.filter(row => row.sw).length,
		bootMs: timings(started, row => row.bootMs),
		bootMsCold: timings(cold, row => row.bootMs),
		bootMsWarm: timings(warm, row => row.bootMs),
		contentMs: timings(withContent, row => row.contentMs),
		keptContent: withContent.filter(row => row.keptContent === true).length,
		firstApiMs: timings(started, row => row.firstApiMs),
		os: countBy(rows, row => row.os),
		browser: countBy(rows, row => row.browser),
		standalone: rows.filter(row => row.standalone).length,
		versions: countBy(rows, row => row.v),
		slowestPages: pages,
	};
}
