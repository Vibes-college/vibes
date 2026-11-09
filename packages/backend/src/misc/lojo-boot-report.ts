/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes: an anonymous record of how fast the app starts on people's devices, and the daily stability report made from
// it (founder approved 2026-10-31). One record per page load, sent by the frontend (src/lojo/boot-report.ts). It holds
// no account, no IP address, no full page address and no full browser string: only the section of the site, the kind of
// system and browser, and timings. Kept in Redis per day (Beijing time) for KEEP_DAYS days.
//
// Speed fields (2026-11-09, for the speed standard 社区运维 wrote): the server adds the coarse region worked out from
// the IP address (misc/lojo-ip-region.ts: country, mainland province and carrier; the address itself is not kept), which
// site was opened (app / test) and whether the request came through Cloudflare. The browser adds time to first byte,
// first contentful paint, time to connect the live connection, and whether it is an automated browser (left out of the
// figures). A second, smaller record (ConnReport) says how often the live connection dropped while the page was open.
// These are kept only where LOJO_SPEED_FIELDS=on (test site first; the main site needs the founder's go-ahead).

import { ipZones } from '@/misc/lojo-ip-region.js';
import type { IpRegion } from '@/misc/lojo-ip-region.js';

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
} & Partial<SpeedFields>;

export const speedFieldsOn = () => process.env.LOJO_SPEED_FIELDS === 'on';

export const bootReportHosts = ['app', 'test', 'other'] as const;

// Added by the server from the request.
export type Where = {
	country: string | null;
	province: string | null;
	isp: IpRegion['isp'];
	zone: IpRegion['zone'];
	host: typeof bootReportHosts[number];
	cf: boolean; // a cf-ray header came with the request. On the direct route anyone could send one: that only skews
	// the figures, it gives nothing away, so it is not checked further.
};

export type SpeedFields = Where & {
	ttfbMs: number | null; // the page's first byte (Navigation Timing responseStart); not the network when sw is true
	fcpMs: number | null; // first contentful paint
	wsMs: number | null; // until the live connection first connected; null if not by the time the record was sent
	bot: boolean; // navigator.webdriver: our own automated checks; left out of every figure
};

// How the live connection held up while the page was open, sent when the page goes to the background or is closed
// (once per stretch in front, at most 20 per page load). Not linked to the start-up record.
export type ConnReport = Where & {
	t: number;
	os: typeof bootReportOs[number];
	browser: typeof bootReportBrowsers[number];
	bot: boolean;
	visibleSec: number; // how long the page was in front during this stretch
	drops: number; // the connection dropped while the page was in front
	hiddenDrops: number; // dropped while the page was in the background (phones freeze background pages)
	reconnectMs: number[]; // how long each drop in front took to reconnect, at most 10
	down: boolean; // not connected when the record was sent
};

export function hostOf(header: string | undefined): Where['host'] {
	const host = (header ?? '').split(':')[0].toLowerCase();
	if (host === 'app.vibes.college') return 'app';
	if (host === 'test.vibes.college') return 'test';
	return 'other';
}

export function whereOf(region: IpRegion, headers: Record<string, string | string[] | undefined> | null | undefined): Where {
	return {
		country: region.country,
		province: region.province,
		isp: region.isp,
		zone: region.zone,
		host: hostOf(headers?.host as string | undefined),
		cf: headers?.['cf-ray'] != null,
	};
}

export function connReportKey(day: string): string {
	return `lojo:connReport:${day}`;
}

// Beijing time of day: day 9–20, the evening peak 20–23, night the rest.
export const timeSlots = ['day', 'peak', 'night'] as const;
export function timeSlot(t: number): typeof timeSlots[number] {
	const hour = new Date((t + 8 * 60 * 60) * 1000).getUTCHours();
	if (hour >= 9 && hour < 20) return 'day';
	if (hour >= 20 && hour < 23) return 'peak';
	return 'night';
}

// A group with fewer records than this shows only its count, so a place with few people cannot be picked out.
export const MIN_GROUP = 5;

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

function speedCell(rows: BootReport[], conns: ConnReport[]) {
	const n = rows.length;
	if (n < MIN_GROUP && conns.length < MIN_GROUP) return { n, conns: conns.length };
	const started = rows.filter(row => row.bootMs != null);
	const timings = (pick: (row: BootReport) => number | null | undefined) => spread(started.map(pick).filter((v): v is number => v != null));
	const visibleHours = conns.reduce((sum, c) => sum + c.visibleSec, 0) / 3600;
	const drops = conns.reduce((sum, c) => sum + c.drops, 0);
	return {
		n,
		failed: n - started.length,
		bootMs: timings(row => row.bootMs),
		contentMs: timings(row => row.contentMs),
		ttfbMs: timings(row => (row.sw ? null : row.ttfbMs)),
		fcpMs: timings(row => row.fcpMs),
		firstApiMs: timings(row => row.firstApiMs),
		wsMs: timings(row => row.wsMs),
		conns: conns.length,
		visibleHours: Math.round(visibleHours * 10) / 10,
		dropsPerHour: visibleHours > 0 ? Math.round(drops / visibleHours * 10) / 10 : null,
		hiddenDrops: conns.reduce((sum, c) => sum + c.hiddenDrops, 0),
		reconnectMs: spread(conns.flatMap(c => c.reconnectMs)),
		down: conns.filter(c => c.down).length,
	};
}

// Speed by region and time of day, and by route (site and Cloudflare). Records without the speed fields (older
// app versions, or LOJO_SPEED_FIELDS off) and automated browsers are left out.
export function summarizeSpeed(rows: BootReport[], conns: ConnReport[]) {
	const real = rows.filter(row => row.zone != null && row.bot !== true);
	const realConns = conns.filter(c => c.bot !== true);
	const zones = [];
	for (const zone of ipZones) {
		const inZone = real.filter(row => row.zone === zone);
		const connsInZone = realConns.filter(c => c.zone === zone);
		if (inZone.length === 0 && connsInZone.length === 0) continue;
		const slots: Record<string, ReturnType<typeof speedCell>> = { all: speedCell(inZone, connsInZone) };
		for (const slot of timeSlots) {
			slots[slot] = speedCell(inZone.filter(row => timeSlot(row.t) === slot), connsInZone.filter(c => timeSlot(c.t) === slot));
		}
		zones.push({ zone, ...slots });
	}
	const routes = [];
	for (const host of bootReportHosts) {
		for (const cf of [false, true]) {
			const inRoute = real.filter(row => row.host === host && row.cf === cf);
			const connsInRoute = realConns.filter(c => c.host === host && c.cf === cf);
			if (inRoute.length === 0 && connsInRoute.length === 0) continue;
			routes.push({ host, cf, ...speedCell(inRoute, connsInRoute) });
		}
	}
	return {
		withFields: real.length,
		bots: rows.filter(row => row.bot === true).length + conns.filter(c => c.bot === true).length,
		zones,
		routes,
	};
}

export function summarizeBootReports(day: string, all: BootReport[], conns: ConnReport[] = []) {
	// Automated browsers (our own checks) are counted apart in speed.bots and left out of every figure.
	const rows = all.filter(row => row.bot !== true);
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
		speed: summarizeSpeed(all, conns),
	};
}
