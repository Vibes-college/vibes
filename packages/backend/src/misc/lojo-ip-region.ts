/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes: tells the coarse region of a visitor from the IP address, for the anonymous start-up records
// (misc/lojo-boot-report.ts). Offline: the table is assets/lojo-data/ip-region.bin, built from the ip2region data
// (Apache-2.0 OR MIT) by scripts/lojo-ip-region.py. Only the country is known, and for mainland China also the province
// and the carrier; no city. The address itself is only looked up here and never kept.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isIPv4, isIPv6 } from 'node:net';

export type IpRegion = {
	country: string | null; // ISO 3166 two-letter code, null when unknown
	province: string | null; // mainland China only, as ip2region names it ("广东省")
	isp: 'telecom' | 'unicom' | 'mobile' | 'other';
	zone: typeof ipZones[number];
};

// The rows of the daily report (founder 2026-11-09: mainland carriers, Asia, Australia, Europe, North America).
export const ipZones = ['cn-telecom', 'cn-unicom', 'cn-mobile', 'cn-other', 'asia', 'oceania', 'europe', 'namerica', 'other'] as const;

// Hong Kong, Macau and Taiwan go with Asia: they reach the server like the rest of Asia, not like the mainland.
const ZONE_COUNTRIES: Record<'asia' | 'oceania' | 'europe' | 'namerica', string> = {
	asia: 'AE AF AM AZ BD BH BN BT CY GE HK ID IL IN IQ IR JO JP KG KH KP KR KW KZ LA LB LK MM MN MO MV MY NP OM PH PK PS QA SA SG SY TH TJ TL TM TR TW UZ VN YE',
	oceania: 'AS AU CK FJ FM GU KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV VU WF WS',
	europe: 'AD AL AT AX BA BE BG BY CH CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA XK',
	namerica: 'CA US PM GL BM',
};
const zoneOf = new Map<string, IpRegion['zone']>();
for (const [zone, list] of Object.entries(ZONE_COUNTRIES)) {
	for (const code of list.split(' ')) zoneOf.set(code, zone as IpRegion['zone']);
}

const UNKNOWN: IpRegion = { country: null, province: null, isp: 'other', zone: 'other' };

type Table = { labels: string[]; v4: Uint32Array; v4Labels: Uint16Array; v6: Uint32Array; v6Labels: Uint16Array };

let table: Table | null | undefined;

export function parseIpRegionTable(buf: Buffer): Table {
	if (buf.subarray(0, 5).toString('latin1') !== 'VIPR1') throw new Error('ip-region.bin: unknown format');
	let at = 5;
	const u32 = () => {
		const v = buf.readUInt32LE(at);
		at += 4;
		return v;
	};
	// Copied out of the file buffer so the typed arrays are aligned.
	const ints = (count: number) => {
		const out = new Uint32Array(count);
		for (let i = 0; i < count; i++) out[i] = buf.readUInt32LE(at + i * 4);
		at += count * 4;
		return out;
	};
	const shorts = (count: number) => {
		const out = new Uint16Array(count);
		for (let i = 0; i < count; i++) out[i] = buf.readUInt16LE(at + i * 2);
		at += count * 2;
		return out;
	};
	const textLength = u32();
	const labels = buf.subarray(at, at + textLength).toString('utf8').split('\n');
	at += textLength;
	const n4 = u32();
	const v4 = ints(n4);
	const v4Labels = shorts(n4);
	const n6 = u32();
	const v6 = ints(n6 * 2);
	const v6Labels = shorts(n6);
	return { labels, v4, v4Labels, v6, v6Labels };
}

function loadTable(): Table | null {
	if (table !== undefined) return table;
	// The built backend is bundled into flat files right under built/ (one level below packages/backend), while the
	// tests run this file from src/misc/ (two levels below). Try both.
	table = null; // no table: every visitor counts as "other", the records still work
	for (const relative of ['../assets/lojo-data/ip-region.bin', '../../assets/lojo-data/ip-region.bin']) {
		try {
			table = parseIpRegionTable(readFileSync(fileURLToPath(new URL(relative, import.meta.url))));
			break;
		} catch {
			// not here, try the next place
		}
	}
	if (table == null) console.warn('lojo-ip-region: ip-region.bin not found, every visitor counts as region "other"');
	return table;
}

function v4Number(ip: string): number {
	return ip.split('.').reduce((n, part) => n * 256 + Number(part), 0);
}

// The first 64 bits of an IPv6 address as [high, low] 32-bit halves.
function v6Prefix(ip: string): [number, number] {
	const [head, tail] = ip.split('::');
	const left = head ? head.split(':') : [];
	const right = tail != null && tail !== '' ? tail.split(':') : [];
	const groups = tail == null ? left : [...left, ...Array(8 - left.length - right.length).fill('0'), ...right];
	const g = groups.slice(0, 4).map(x => parseInt(x || '0', 16));
	return [g[0] * 65536 + g[1], g[2] * 65536 + g[3]];
}

// Index of the last range starting at or before the address.
function search(count: number, before: (i: number) => boolean): number {
	let lo = 0;
	let hi = count - 1;
	let found = -1;
	while (lo <= hi) {
		const mid = (lo + hi) >>> 1;
		if (before(mid)) {
			found = mid;
			lo = mid + 1;
		} else {
			hi = mid - 1;
		}
	}
	return found;
}

export function labelToRegion(label: string): IpRegion {
	if (label === '') return UNKNOWN;
	if (label.startsWith('CN|')) {
		const [, province, isp] = label.split('|');
		const carrier = (['telecom', 'unicom', 'mobile'].includes(isp) ? isp : 'other') as IpRegion['isp'];
		return { country: 'CN', province: province || null, isp: carrier, zone: `cn-${carrier}` };
	}
	return { country: label, province: null, isp: 'other', zone: zoneOf.get(label) ?? 'other' };
}

export function lookupIpRegion(ip: string | null | undefined, from: Table | null = loadTable()): IpRegion {
	if (ip == null || from == null) return UNKNOWN;
	const address = ip.startsWith('::ffff:') && isIPv4(ip.slice(7)) ? ip.slice(7) : ip;
	let index = -1;
	let labels: Uint16Array | null = null;
	if (isIPv4(address)) {
		const n = v4Number(address);
		index = search(from.v4.length, i => from.v4[i] <= n);
		labels = from.v4Labels;
	} else if (isIPv6(address)) {
		const [high, low] = v6Prefix(address.split('%')[0]);
		index = search(from.v6Labels.length, i => from.v6[i * 2] < high || (from.v6[i * 2] === high && from.v6[i * 2 + 1] <= low));
		labels = from.v6Labels;
	}
	if (index < 0 || labels == null) return UNKNOWN;
	return labelToRegion(from.labels[labels[index]] ?? '');
}
