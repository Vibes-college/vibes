/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 听写 progress and rounds, without any UI so they can be tested on their own. The progress lives in the account
// registry (store.ts), so it follows the learner across devices.

// Per item: r right and w wrong in all; m misses since it last left 常错; s rights in a row; o in 常错; at last practised.
export type ItemRecord = { r: number; w: number; m: number; s: number; o: boolean; at: number };
// last: the items of the latest round of each set, so the next round doesn't repeat them; sfx: the right/wrong blips.
export type DictProgress = { v: 1; items: Record<string, ItemRecord>; last: Record<string, string[]>; sfx: boolean };

// 常错 (decided 2026-10-29): a word goes in after 2 misses and comes out after 2 rights in a row.
export const OFTEN_IN = 2;
export const OFTEN_OUT = 2;

export function emptyProgress(): DictProgress {
	return { v: 1, items: {}, last: {}, sfx: true };
}

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const isObj = (v: unknown): v is Record<string, unknown> => v != null && typeof v === 'object' && !Array.isArray(v);

// The registry value, as far as it makes sense; anything broken is left out rather than failing the page.
export function toProgress(value: unknown): DictProgress {
	const p = emptyProgress();
	if (!isObj(value)) return p;
	if (isObj(value.items)) {
		for (const [id, rec] of Object.entries(value.items)) {
			if (!isObj(rec) || !isCount(rec.r) || !isCount(rec.w) || !isCount(rec.m) || !isCount(rec.s)) continue;
			p.items[id] = { r: rec.r, w: rec.w, m: rec.m, s: rec.s, o: rec.o === true, at: typeof rec.at === 'number' ? rec.at : 0 };
		}
	}
	if (isObj(value.last)) {
		for (const [set, ids] of Object.entries(value.last)) {
			if (Array.isArray(ids)) p.last[set] = ids.filter((id): id is string => typeof id === 'string');
		}
	}
	if (typeof value.sfx === 'boolean') p.sfx = value.sfx;
	return p;
}

export function recordAnswer(p: DictProgress, id: string, correct: boolean, now = Date.now()): ItemRecord {
	const rec = p.items[id] ?? { r: 0, w: 0, m: 0, s: 0, o: false, at: 0 };
	rec.at = now;
	if (correct) {
		rec.r++;
		rec.s++;
		if (rec.o && rec.s >= OFTEN_OUT) {
			rec.o = false;
			rec.m = 0;
		}
	} else {
		rec.w++;
		rec.m++;
		rec.s = 0;
		if (!rec.o && rec.m >= OFTEN_IN) rec.o = true;
	}
	p.items[id] = rec;
	return rec;
}

export const isOften = (p: DictProgress, id: string): boolean => p.items[id]?.o === true;
export const seenCount = (p: DictProgress, id: string): number => (p.items[id] ? p.items[id].r + p.items[id].w : 0);

// The 常错 items among `ids`, most missed first.
export function oftenIds(p: DictProgress, ids: string[]): string[] {
	return ids.filter(id => isOften(p, id)).sort((a, b) => p.items[b].m - p.items[a].m || p.items[b].w - p.items[a].w);
}

export function shuffle<T>(list: T[], random: () => number = Math.random): T[] {
	const a = list.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

// Items of the same kind (two phones, two dates…) not next to each other, where the others allow.
export function spread<T extends { kind: string | null }>(list: T[]): T[] {
	const a = list.slice();
	for (let i = 1; i < a.length; i++) {
		if (a[i].kind !== a[i - 1].kind) continue;
		const j = a.findIndex((x, k) => k > i && x.kind !== a[i - 1].kind);
		if (j > 0) [a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

// One round of `n` from a set's pool: items not in the last round first, then the least practised, at random among
// equals; the kinds take turns (phone, price, date… or plural, singular, uncountable), so a round has some of each.
export function drawRound<T extends { id: string; kind: string | null }>(
	pool: T[], seen: (id: string) => number, last: string[], n: number, random: () => number = Math.random,
): T[] {
	const recent = new Set(last);
	const sorted = pool
		.map(it => ({ it, recent: recent.has(it.id) ? 1 : 0, seen: seen(it.id), rnd: random() }))
		.sort((a, b) => a.recent - b.recent || a.seen - b.seen || a.rnd - b.rnd);
	const kinds = new Map<string | null, T[]>();
	for (const { it } of sorted) {
		const list = kinds.get(it.kind);
		if (list) list.push(it);
		else kinds.set(it.kind, [it]);
	}
	const out: T[] = [];
	const want = Math.min(n, pool.length);
	let took = true;
	while (out.length < want && took) {
		took = false;
		for (const list of kinds.values()) {
			if (out.length >= want) break;
			const next = list.shift();
			if (next == null) continue;
			out.push(next);
			took = true;
		}
	}
	return spread(shuffle(out, random));
}
