/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关 rules, pure so they can be tested (test/unit/LojoQuest.ts). Days and refill times are Beijing time (UTC+8).
// 补心规则 11-10 定稿（闯关核心循环-故事板.md）：
// - at most 5 hearts; back to 5 at 08:00 and 20:00;
// - below 5, two paths give 1 heart each, once a day each: 锦囊 (pass its 3-question check, 2 right) and 装备
//   (one practice set of at least 10 items and at least 2 minutes); the same set or book counts once a day;
// - 情报 gives no heart, it only ticks Boss prep; hearts cannot be bought.

export const MAX_HEARTS = 5;
export const SET_MIN_ITEMS = 10;
export const SET_MIN_MS = 2 * 60 * 1000;
export const MAX_FREEZES = 2;
export const FREEZE_EVERY = 7;
// apps that report a finished set. grammar is listed so its sets are recorded, but it gives no heart in v1
export const SET_APPS = ['dictation', 'typing', 'vocab', 'grammar', 'wordbook', 'photo-words'] as const;
export type SetApp = typeof SET_APPS[number];
export const NO_HEART_APPS: readonly string[] = ['grammar'];

export const XP = { pass: 20, replay: 5, boss: 100, set: 5, check: 5, chest: 30 } as const;

const OFFSET = 8 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

// Beijing day of an instant, YYYY-MM-DD
export function dayOf(at: Date): string {
	return new Date(at.getTime() + OFFSET).toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
	return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
	return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
}

// 08:00 and 20:00 Beijing are 00:00 and 12:00 UTC
export function lastRefillAt(now: Date): Date {
	const half = 12 * 60 * 60 * 1000;
	return new Date(Math.floor(now.getTime() / half) * half);
}

export function nextRefillAt(now: Date): Date {
	return new Date(lastRefillAt(now).getTime() + 12 * 60 * 60 * 1000);
}

// Hearts as of now: a refill time after the last change fills them back up.
export function heartsNow(hearts: number, heartsAt: Date, now: Date): number {
	if (hearts >= MAX_HEARTS) return MAX_HEARTS;
	return heartsAt.getTime() < lastRefillAt(now).getTime() ? MAX_HEARTS : Math.max(0, hearts);
}

export type StreakState = { streak: number; streakDay: string | null; bestStreak: number; freezes: number };

// The streak as shown today, without counting today: alive if the last day was yesterday or today, or the missed days
// can be covered by freeze cards.
export function streakNow(s: StreakState, today: string): { days: number; doneToday: boolean; freezesNeeded: number } {
	if (s.streakDay == null || s.streak <= 0) return { days: 0, doneToday: false, freezesNeeded: 0 };
	const gap = daysBetween(s.streakDay, today);
	if (gap <= 0) return { days: s.streak, doneToday: true, freezesNeeded: 0 };
	const missed = gap - 1;
	if (missed === 0) return { days: s.streak, doneToday: false, freezesNeeded: 0 };
	if (missed <= s.freezes) return { days: s.streak, doneToday: false, freezesNeeded: missed };
	return { days: 0, doneToday: false, freezesNeeded: 0 };
}

// Count today for the streak. Missed days are covered by freeze cards when there are enough, else the streak restarts.
// Every 7th day gives a freeze card, at most 2.
export function touchStreak(s: StreakState, today: string): StreakState & { changed: boolean; usedFreezes: number; gotFreeze: boolean } {
	const now = streakNow(s, today);
	if (now.doneToday) return { ...s, changed: false, usedFreezes: 0, gotFreeze: false };
	const streak = now.days + 1;
	const freezes0 = s.freezes - now.freezesNeeded;
	const gotFreeze = streak % FREEZE_EVERY === 0 && freezes0 < MAX_FREEZES;
	return {
		streak,
		streakDay: today,
		bestStreak: Math.max(s.bestStreak, streak),
		freezes: freezes0 + (gotFreeze ? 1 : 0),
		changed: true,
		usedFreezes: now.freezesNeeded,
		gotFreeze,
	};
}

// Whether a reported practice set counts: at least 10 items and 2 minutes, and not from the future or long ago.
export function setCounts(items: number, durationMs: number, startedAt: number, now: Date): { ok: boolean; reason?: 'items' | 'time' | 'clock' } {
	if (!Number.isFinite(startedAt) || startedAt > now.getTime() + 60_000 || startedAt < now.getTime() - DAY) return { ok: false, reason: 'clock' };
	if (startedAt + durationMs > now.getTime() + 60_000) return { ok: false, reason: 'clock' };
	if (items < SET_MIN_ITEMS) return { ok: false, reason: 'items' };
	if (durationMs < SET_MIN_MS) return { ok: false, reason: 'time' };
	return { ok: true };
}

// Pick n questions from a pool, preferring ones not asked in the last try, in a random order.
export function drawQuestions<T extends { id: string }>(pool: T[], n: number, last: string[] = [], rand: () => number = Math.random): T[] {
	const shuffle = (xs: T[]) => {
		const a = [...xs];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(rand() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	};
	const fresh = shuffle(pool.filter(q => !last.includes(q.id)));
	const seen = shuffle(pool.filter(q => last.includes(q.id)));
	return [...fresh, ...seen].slice(0, Math.min(n, pool.length));
}
