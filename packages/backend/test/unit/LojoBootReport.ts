/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { labelToRegion, lookupIpRegion } from '@/misc/lojo-ip-region.js';
import { MIN_GROUP, hostOf, summarizeBootReports, timeSlot, whereOf } from '@/misc/lojo-boot-report.js';
import type { BootReport, ConnReport } from '@/misc/lojo-boot-report.js';

describe('Vibes IP region (offline table)', () => {
	test('mainland addresses get province and carrier, others only the country', () => {
		// 1.0.1.0/24 is 福建 China Telecom and 1.0.0.0/24 Australia in the ip2region data.
		expect(lookupIpRegion('1.0.1.1')).toEqual({ country: 'CN', province: '福建省', isp: 'telecom', zone: 'cn-telecom' });
		expect(lookupIpRegion('::ffff:1.0.1.1').zone).toBe('cn-telecom');
		expect(lookupIpRegion('1.0.0.1')).toMatchObject({ country: 'AU', province: null, zone: 'oceania' });
		expect(lookupIpRegion('8.8.8.8')).toMatchObject({ country: 'US', zone: 'namerica' });
		expect(lookupIpRegion('2001:200::1')).toMatchObject({ country: 'JP', zone: 'asia' });
	});

	test('private, broken and missing addresses are unknown', () => {
		for (const ip of ['10.0.0.1', '127.0.0.1', 'not an ip', null, undefined]) {
			expect(lookupIpRegion(ip).zone).toBe('other');
		}
		expect(lookupIpRegion('1.0.1.1', null).country).toBeNull();
	});

	test('Hong Kong goes with Asia, unknown carriers stay on the mainland', () => {
		expect(labelToRegion('HK').zone).toBe('asia');
		expect(labelToRegion('CN|广东省|other')).toEqual({ country: 'CN', province: '广东省', isp: 'other', zone: 'cn-other' });
		expect(labelToRegion('CN||mobile').province).toBeNull();
	});
});

describe('Vibes speed report', () => {
	// 2026-11-09 12:00 UTC is 20:00 in Beijing (evening peak); 04:00 UTC is 12:00 (day).
	const PEAK = Date.UTC(2026, 10, 9, 12) / 1000;
	const DAY = Date.UTC(2026, 10, 9, 4) / 1000;

	function row(over: Partial<BootReport>): BootReport {
		return {
			t: DAY, v: 'x', page: 'home', nav: 'navigate', os: 'ios', browser: 'safari', standalone: false, signedIn: true,
			sw: false, codeKb: 10, retries: 0, bootMs: 1000, contentMs: null, keptContent: null, firstApiMs: 300, error: null,
			...whereOf(labelToRegion('CN|上海市|telecom'), { host: 'test.vibes.college', 'cf-ray': 'abc' }),
			ttfbMs: 200, fcpMs: 500, wsMs: 800, bot: false,
			...over,
		};
	}

	test('time of day is Beijing time', () => {
		expect(timeSlot(PEAK)).toBe('peak');
		expect(timeSlot(DAY)).toBe('day');
		expect(timeSlot(Date.UTC(2026, 10, 9, 16) / 1000)).toBe('night');
		expect(hostOf('APP.vibes.college:443')).toBe('app');
		expect(hostOf(undefined)).toBe('other');
	});

	test('groups by region and time of day, hides small groups, leaves bots out', () => {
		const rows = [
			...Array.from({ length: MIN_GROUP }, () => row({})),
			...Array.from({ length: MIN_GROUP - 1 }, () => row({ t: PEAK })),
			row({ bot: true, bootMs: 99999 }),
		];
		const conn: ConnReport = {
			t: DAY, ...whereOf(labelToRegion('CN|上海市|telecom'), { host: 'test.vibes.college' }),
			os: 'ios', browser: 'safari', bot: false, visibleSec: 1800, drops: 1, hiddenDrops: 2, reconnectMs: [1500], down: false,
		};
		const day = summarizeBootReports('2026-11-09', rows, [conn]);
		expect(day.loads).toBe(2 * MIN_GROUP - 1);
		expect(day.bootMs.p90).toBe(1000);
		expect(day.speed.bots).toBe(1);
		const zone = day.speed.zones.find(z => z.zone === 'cn-telecom')!;
		expect(zone.day).toMatchObject({ n: MIN_GROUP, dropsPerHour: 2, hiddenDrops: 2 });
		expect(zone.day.ttfbMs).toEqual({ p50: 200, p90: 200, n: MIN_GROUP });
		expect(zone.peak).toEqual({ n: MIN_GROUP - 1, conns: 0 });
		expect(day.speed.routes.map(r => [r.host, r.cf, r.n])).toEqual([['test', false, 0], ['test', true, 2 * MIN_GROUP - 1]]);
	});

	test('old records without the speed fields count only in the old figures', () => {
		const old = { ...row({}) } as Partial<BootReport>;
		for (const key of ['country', 'province', 'isp', 'zone', 'host', 'cf', 'ttfbMs', 'fcpMs', 'wsMs', 'bot'] as const) delete old[key];
		const day = summarizeBootReports('2026-11-09', [old as BootReport]);
		expect(day.loads).toBe(1);
		expect(day.speed.withFields).toBe(0);
		expect(day.speed.zones).toEqual([]);
	});
});
