/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 0 号线 · 机考打字's record, without any UI so it can be tested on its own. It lives in the account registry
// (progress.ts), so it follows the learner across devices; two copies of it merge without losing a pass or a best try.
import type { Device } from './content.js';

// A stop's best try: a pass first, then the most right (or, without a count, the most accurate), the most accurate,
// the fastest.
export type Best = { pass: boolean; score: number | null; total: number | null; acc: number | null; wpm: number | null };
// tries: tries handed in; fails: misses in a row since the last pass; at: the last try; passedAt: the first pass (0: not
// yet); passedOn: where it was passed (a computer, once it has been passed on one).
export type StopRecord = { tries: number; fails: number; at: number; passedAt: number; passedOn: Device | null; best: Best | null };
// practiceMs: time in stops, all tries; finishedAt: when the last stop lit up the whole line (0: not yet).
export type TypingProgress = { v: 1; stops: Partial<Record<string, StopRecord>>; practiceMs: number; finishedAt: number };
// A try as it is recorded.
export type TryRecord = { stop: string; pass: boolean; ms: number; device: Device; best: Best };
// passed; ready: the first stop, or the one after a passed stop; locked: the rest (they can still be tried).
export type StopState = 'passed' | 'ready' | 'locked';

export function emptyProgress(): TypingProgress {
	return { v: 1, stops: {}, practiceMs: 0, finishedAt: 0 };
}

const blankStop = (): StopRecord => ({ tries: 0, fails: 0, at: 0, passedAt: 0, passedOn: null, best: null });

const isObj = (v: unknown): v is Record<string, unknown> => v != null && typeof v === 'object' && !Array.isArray(v);
const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
const numOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const device = (v: unknown): Device | null => (v === 'desktop' || v === 'phone' ? v : null);

function toBest(v: unknown): Best | null {
	if (!isObj(v)) return null;
	return { pass: v.pass === true, score: numOrNull(v.score), total: numOrNull(v.total), acc: numOrNull(v.acc), wpm: numOrNull(v.wpm) };
}

// The registry value, as far as it makes sense; anything broken is left out rather than failing the page.
export function toProgress(value: unknown): TypingProgress {
	const p = emptyProgress();
	if (!isObj(value)) return p;
	if (isObj(value.stops)) {
		for (const [id, r] of Object.entries(value.stops)) {
			if (!isObj(r)) continue;
			const passedAt = count(r.passedAt);
			p.stops[id] = {
				tries: count(r.tries), fails: count(r.fails), at: count(r.at), passedAt,
				passedOn: passedAt > 0 ? device(r.passedOn) ?? 'desktop' : null, best: toBest(r.best),
			};
		}
	}
	p.practiceMs = count(value.practiceMs);
	p.finishedAt = count(value.finishedAt);
	return p;
}

export function isPassed(p: TypingProgress, id: string): boolean {
	return (p.stops[id]?.passedAt ?? 0) > 0;
}

// The stops passed, in line order.
export function passedIds(p: TypingProgress, ids: string[]): string[] {
	return ids.filter(id => isPassed(p, id));
}

export function stopState(p: TypingProgress, ids: string[], id: string): StopState {
	if (isPassed(p, id)) return 'passed';
	const i = ids.indexOf(id);
	return i <= 0 || isPassed(p, ids[i - 1]) ? 'ready' : 'locked';
}

// The first stop not passed yet, in line order.
export function nextStopId(p: TypingProgress, ids: string[]): string | null {
	return ids.find(id => !isPassed(p, id)) ?? null;
}

export function betterBest(a: Best | null, b: Best | null): Best | null {
	if (a == null) return b;
	if (b == null) return a;
	const key = (r: Best) => [r.pass ? 1 : 0, r.score ?? r.acc ?? 0, r.acc ?? 0, r.wpm ?? 0];
	const ka = key(a);
	const kb = key(b);
	for (let i = 0; i < ka.length; i++) {
		if (ka[i] !== kb[i]) return kb[i] > ka[i] ? b : a;
	}
	return a;
}

// The whole line lit: when its last stop was first passed.
function settle(p: TypingProgress, ids: string[]): void {
	if (p.finishedAt > 0 || ids.length === 0 || !ids.every(id => isPassed(p, id))) return;
	p.finishedAt = Math.max(...ids.map(id => p.stops[id]?.passedAt ?? 0));
}

// A try handed in. newPass: the stop lit up just now; newAll: so did the whole line.
export function recordTry(p: TypingProgress, ids: string[], t: TryRecord, now = Date.now()): { newPass: boolean; newAll: boolean } {
	const wasAll = ids.length > 0 && ids.every(id => isPassed(p, id));
	const rec = p.stops[t.stop] ?? blankStop();
	rec.tries++;
	rec.at = now;
	let newPass = false;
	if (t.pass) {
		rec.fails = 0;
		if (rec.passedAt === 0) {
			rec.passedAt = now;
			rec.passedOn = t.device;
			newPass = true;
		} else if (t.device === 'desktop') {
			rec.passedOn = 'desktop';
		}
	} else {
		rec.fails++;
	}
	rec.best = betterBest(rec.best, { ...t.best });
	p.stops[t.stop] = rec;
	p.practiceMs += Math.max(0, Math.round(t.ms));
	settle(p, ids);
	return { newPass, newAll: !wasAll && ids.length > 0 && ids.every(id => isPassed(p, id)) };
}

const earliest = (a: number, b: number) => (a > 0 && b > 0 ? Math.min(a, b) : Math.max(a, b));

// Two copies of the record (this device's and the account's, which another device may have added to): every pass kept
// with its first date, the best try of each stop, the larger counts, the misses in a row of the later try.
export function mergeProgress(a: TypingProgress, b: TypingProgress, ids: string[]): TypingProgress {
	const out = emptyProgress();
	for (const id of new Set([...Object.keys(a.stops), ...Object.keys(b.stops)])) {
		const x = a.stops[id] ?? blankStop();
		const y = b.stops[id] ?? blankStop();
		const passedAt = earliest(x.passedAt, y.passedAt);
		const passedOn = x.passedOn === 'desktop' || y.passedOn === 'desktop' ? 'desktop' : x.passedOn ?? y.passedOn;
		out.stops[id] = {
			tries: Math.max(x.tries, y.tries),
			fails: y.at > x.at ? y.fails : x.fails,
			at: Math.max(x.at, y.at),
			passedAt,
			passedOn: passedAt > 0 ? passedOn ?? 'desktop' : null,
			best: betterBest(x.best ? { ...x.best } : null, y.best ? { ...y.best } : null),
		};
	}
	out.practiceMs = Math.max(a.practiceMs, b.practiceMs);
	out.finishedAt = earliest(a.finishedAt, b.finishedAt);
	settle(out, ids);
	return out;
}

// All tries of the line.
export function totalTries(p: TypingProgress, ids: string[]): number {
	return ids.reduce((n, id) => n + (p.stops[id]?.tries ?? 0), 0);
}
