/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关 rules, pure so they can be tested (test/unit/LojoQuest.ts). Days and refill times are Beijing time (UTC+8).
// Numbers come from the route map's numbers.json (QUEST_NUMBERS in misc/lojo-quest-numbers.ts, generated); what differs by
// chapter is in each chapter's rules (rules of each imported chapter, misc/lojo-quest-content.ts).
// 补心规则 11-10 定稿（闯关核心循环-故事板.md）：
// - at most 5 hearts; back to 5 at 08:00 and 20:00;
// - below 5, two paths give 1 heart each, once a day each: 锦囊 (pass its 3-question check, 2 right) and 装备
//   (one practice set of at least 10 items and at least 2 minutes); the same set or book counts once a day;
// - 情报 gives no heart, it only ticks Boss prep; hearts cannot be bought.

import { QUEST_CAUSE_ORDER, QUEST_NUMBERS } from '@/misc/lojo-quest-numbers.js';
import type { QuestCause, QuestQuestion } from '@/misc/lojo-quest-types.js';
import type { QuestBook } from '@/misc/lojo-quest-books.js';

const N = QUEST_NUMBERS;

export const MAX_HEARTS = N.hearts.max;
export const SET_MIN_ITEMS = N.hearts.earnBack.gear.minItems;
export const SET_MIN_MS = N.hearts.earnBack.gear.minSeconds * 1000;
export const MAX_FREEZES = N.streak.freeze.max;
export const FREEZE_EVERY = N.streak.freeze.earnEveryDays;
// apps that report a finished set. grammar is listed so its sets are recorded, but it gives no heart in v1
export const SET_APPS = ['dictation', 'typing', 'vocab', 'grammar', 'wordbook', 'photo-words', 'synonym-match'] as const;
export type SetApp = typeof SET_APPS[number];
export const NO_HEART_APPS: readonly string[] = ['grammar'];

export const XP = N.xp;
// 已经过了的关再打一遍只给这么多（v1 的规矩，防刷经验；numbers.json 没写，社区工程 11-10 加，等创始人定）
export const REPLAY_XP = 5;

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

export function shuffle<T>(xs: readonly T[], rand: () => number = Math.random): T[] {
	const a = [...xs];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

// Pick n questions from a pool, preferring ones not asked in the last try, in a random order.
export function drawQuestions<T extends { id: string }>(pool: T[], n: number, last: string[] = [], rand: () => number = Math.random): T[] {
	const fresh = shuffle(pool.filter(q => !last.includes(q.id)), rand);
	const seen = shuffle(pool.filter(q => last.includes(q.id)), rand);
	return [...fresh, ...seen].slice(0, Math.min(n, pool.length));
}

// A try at a level or the Boss: one whole set, a set not used yet first (A, then B, then C for the Boss). Once every
// set has been used, the sets are mixed and n questions drawn, avoiding the last try's questions (numbers.json
// level.afterAllSets). Returns the questions, the set (null when mixed) and the sets used so far.
export function pickSet<T extends { id: string; set: string }>(pool: T[], sets: readonly string[], n: number, used: readonly string[] = [], last: readonly string[] = [], rand: () => number = Math.random): { questions: T[]; set: string | null; used: string[] } {
	const next = sets.find(s => !used.includes(s));
	if (next != null) {
		const qs = pool.filter(q => q.set === next).slice(0, n);
		if (qs.length >= n) return { questions: qs, set: next, used: [...used, next] };
	}
	return { questions: drawQuestions(pool, n, [...last], rand), set: null, used: [...sets] };
}

// What the learner wrote, the way it is compared: trimmed, without punctuation at the end, single spaces; lower case
// when the question is case-insensitive; no spaces at all when it ignores spaces (postcodes, phone numbers).
export function normalizeAnswer(text: string, q: Pick<QuestQuestion, 'caseInsensitive' | 'ignoreSpaces'>): string {
	let t = text.trim().replace(/[\s.,!?;:。，！？；：]+$/u, '').replace(/\s+/g, ' ');
	if (q.caseInsensitive) t = t.toLowerCase();
	if (q.ignoreSpaces) t = t.replace(/\s+/g, '');
	return t;
}

const isJudgement = (t: string) => t === 'TFNG' || t === 'YNNG';

// 选两个: the keys picked, upper case, sorted, no repeats ("e, c" → ["C", "E"])
export function multiKeys(given: string): string[] {
	return [...new Set(given.split(/[\s,，、]+/).map(k => k.trim().toUpperCase()).filter(k => k !== ''))].sort();
}

// The answer as the page shows it: "A. text" for a choice, "C. text / E. text" for 选两个, the key for TFNG and
// YNNG, the words otherwise.
export function displayAnswer(q: Pick<QuestQuestion, 'type' | 'options' | 'answer'>, key: string = q.answer): string {
	const one = (k: string) => {
		const o = q.options?.find(x => x.key === k);
		return o ? `${o.key}. ${o.text}` : k;
	};
	if (q.type === 'choice') return one(key);
	if (q.type === 'multi') return key === '' ? '' : multiKeys(key).map(one).join(' / ');
	return key;
}

// 选两个 (第三章起): both right is right; one right is 「对一半」 (not right, not wrong, no heart); none right is wrong.
// Other types are right or wrong.
export function grade(q: QuestQuestion, given: string): 'right' | 'half' | 'wrong' {
	if (q.type !== 'multi') return judge(q, given) ? 'right' : 'wrong';
	const want = q.answer.split(',');
	const got = multiKeys(given);
	const hits = got.filter(k => want.includes(k)).length;
	if (got.length === want.length && hits === want.length) return 'right';
	return hits > 0 ? 'half' : 'wrong';
}

export function judge(q: QuestQuestion, given: string): boolean {
	if (q.type === 'multi') return grade(q, given) === 'right';
	if (q.type === 'choice' || isJudgement(q.type)) return given.trim().toUpperCase() === q.answer.toUpperCase();
	const g = normalizeAnswer(given, q);
	if (g === '') return false;
	return [q.answer, ...q.accept].some(a => normalizeAnswer(a, q) === g);
}

function editDistance(a: string, b: string): number {
	const d = Array.from({ length: b.length + 1 }, (_, j) => j);
	for (let i = 1; i <= a.length; i++) {
		let prev = d[0];
		d[0] = i;
		for (let j = 1; j <= b.length; j++) {
			const t = d[j];
			d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
			prev = t;
		}
	}
	return d[b.length];
}

// 填空题改判 (错因和evidence说明.md): differing only in singular/plural or case, or (answers of 5 letters or more) by at
// most 2 letters, is spelling. Only for word answers: a wrong digit in a number or postcode was not heard.
export function isSpellingSlip(given: string, answer: string): boolean {
	const g = given.trim().toLowerCase().replace(/[.,!?;:]+$/, '').replace(/\s+/g, ' ');
	const a = answer.trim().toLowerCase().replace(/\s+/g, ' ');
	if (g === '' || !/^[a-z' -]+$/.test(a)) return false;
	if (g === a) return true;
	const stem = (w: string) => w.replace(/(es|s)$/, '');
	if (stem(g) === stem(a) && /^[a-z' -]+$/.test(g)) return true;
	return a.replace(/[^a-z]/g, '').length >= 5 && editDistance(g, a) <= 2;
}

// Why a wrong answer was wrong: the option's cause for choice, TFNG and YNNG, the question's cause for gap and build,
// with near-misses in gap questions counted as spelling. 选两个: one right is half-right (numbers.json multi), none
// right the question's bothWrongCause.
export function wrongCause(q: QuestQuestion, given: string, halfCause = 'half-right'): QuestCause {
	if (q.type === 'multi') return grade(q, given) === 'half' ? halfCause : q.bothWrongCause ?? 'too-hard';
	if (q.type === 'choice' || isJudgement(q.type)) {
		return q.causes?.[given.trim().toUpperCase()] ?? q.causes?.[given.trim()] ?? Object.values(q.causes ?? {})[0] ?? 'too-hard';
	}
	if (q.type === 'gap' && [q.answer, ...q.accept].some(a => isSpellingSlip(given, a))) return 'spelling';
	return q.cause ?? 'too-hard';
}

// 主错因: the cause seen most often in this try; ties go by the chapter's order (第一章 QUEST_CAUSE_ORDER).
export function mainCause(causes: readonly string[], order: readonly string[] = QUEST_CAUSE_ORDER): string | null {
	if (causes.length === 0) return null;
	const count = (c: string) => causes.filter(x => x === c).length;
	const rank = (c: string) => {
		const i = order.indexOf(c);
		return i < 0 ? order.length : i;
	};
	return [...new Set(causes)].sort((a, b) => count(b) - count(a) || rank(a) - rank(b))[0];
}

// Stars on a level: a pass is 1, a perfect try 2, a passed retest adds 1; at most 3, never fewer than before.
export function starsAfter(prev: number, how: { retest: boolean; perfect: boolean }): number {
	const S = N.map.stars;
	if (how.retest) return Math.min(S.max, Math.max(prev, S.pass) + S.retestAdds);
	return Math.min(S.max, Math.max(prev, how.perfect ? S.perfect : S.pass));
}

// A passed level fades after 7 days untouched and turns gray after 14.
export function ageOf(lastDay: string | null, today: string): 'fade' | 'gray' | null {
	if (lastDay == null) return null;
	const idle = daysBetween(lastDay, today);
	return idle >= N.map.grayAfterDays ? 'gray' : idle >= N.map.fadeAfterDays ? 'fade' : null;
}

// 书屋 (numbers.json shelfRule): the level's 3 books, the first recommended. The book for this try's main cause moves
// to the front (in place of the last one if the level does not list it); 2 fails in a row on the level recommend j7.
export function shelfFor(shelf: readonly string[], causeRef: string | null, failStreak: number): string[] {
	const lit = N.shelfRule.lit;
	const rule = N.shelfRule.sameLevelFailsInARow;
	const first = failStreak >= rule.count ? rule.recommend : causeRef;
	if (first == null) return shelf.slice(0, lit);
	return [first, ...shelf.filter(r => r !== first)].slice(0, lit);
}

// 落后提醒 (numbers.json behind): pace = levels first passed in the last 7 days / 7; at that pace, how far would they
// get by the exam? 2 or more levels short gives the target (the first level they would not reach) and how many more
// to pass today. order is every level of the chapter, the Boss last.
export function behindOf(p: { order: readonly string[]; passed: Record<string, string | undefined>; today: string; daysLeft: number | null }): { target: string; n: number; copy: string } | null {
	const B = N.behind;
	if (p.daysLeft == null || p.daysLeft <= 0) return null;
	const remaining = p.order.filter(id => p.passed[id] == null);
	if (remaining.length === 0) return null;
	const from = addDays(p.today, -(B.paceWindowDays - 1));
	const recent = Object.values(p.passed).filter((d): d is string => d != null && d >= from && d <= p.today).length;
	const reach = Math.floor((recent / B.paceWindowDays) * p.daysLeft);
	const gap = remaining.length - reach;
	if (gap < B.minGapLevels) return null;
	const target = remaining[Math.max(0, reach)];
	const n = gap - 1;
	return { target, n, copy: B.copy.replace('{target}', target).replace('{n}', String(n)) };
}

// An exam date: YYYY-MM-DD, a real day, after today and within 2 years.
export function examDateOk(date: string, today: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
	const t = Date.parse(`${date}T00:00:00Z`);
	if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== date) return false;
	const limit = `${Number(today.slice(0, 4)) + 2}${today.slice(4)}`;
	return date > today && date <= limit;
}

// Coming back after missed days: freeze cards cover them now (the streak waits at yesterday), or the streak is lost.
// Returns the one-time notice for the page, or null when nothing happened.
export function settleStreak(s: StreakState, today: string): { state: StreakState; notice: { kind: 'freeze'; used: number } | { kind: 'lost'; days: number; best: number } | null } {
	if (s.streakDay == null || s.streak <= 0) return { state: s, notice: null };
	const now = streakNow(s, today);
	if (now.freezesNeeded > 0) {
		return { state: { ...s, freezes: s.freezes - now.freezesNeeded, streakDay: addDays(today, -1) }, notice: { kind: 'freeze', used: now.freezesNeeded } };
	}
	if (now.days === 0) return { state: { ...s, streak: 0 }, notice: { kind: 'lost', days: s.streak, best: s.bestStreak } };
	return { state: s, notice: null };
}

// Where a level's 「去装备练一组」 goes (路线图 gear 字段): dictation, vocab:5.N, grammar:6.N, typing, wordbook,
// synonym-match:<话题>（同义词连连看，/synonym/），graded-reading.
export function gearPath(gear: string | null | undefined): { app: string; path: string; zh: string; givesHeart: boolean } {
	const g = gear ?? 'dictation';
	const [app, stop] = g.split(':');
	if (app === 'vocab') return { app, path: `/vocab/${stop ?? '5.3'}?tab=practice&scope=all`, zh: '词汇线', givesHeart: true };
	if (app === 'grammar') return { app, path: `/grammar/${stop ?? '6.3'}`, zh: '语法线', givesHeart: false };
	if (app === 'typing') return { app, path: '/apps/typing/?stop=spelling', zh: '机考打字 · 拼写站', givesHeart: true };
	if (app === 'wordbook') return { app, path: '/wordbook', zh: '生词本', givesHeart: true };
	if (app === 'synonym-match') return { app, path: `/synonym/index.html?topic=${encodeURIComponent(stop ?? 'general')}`, zh: '同义词连连看', givesHeart: true };
	if (app === 'graded-reading') return { app, path: 'https://vibes.college/read/artisan/', zh: '分级阅读', givesHeart: false };
	return { app: 'dictation', path: '/dictation', zh: '听写', givesHeart: true };
}

// A book's gear for this learner: 'level' is the level's own gear; 生词本 with too few cards today goes to the
// book's fallback (j5 → vocab:5.4); 分级阅读 gives no heart, so with 2 hearts or fewer it goes to vocab:5.3.
export function bookGear(book: QuestBook, levelGear: string | null | undefined, p: { wordbookLow: boolean; hearts: number }): string | null {
	let g = book.gear === 'level' ? (levelGear ?? 'dictation') : book.gear;
	if (g === 'wordbook' && p.wordbookLow) g = book.fallbackGear ?? 'dictation';
	if (g === 'graded-reading' && p.hearts <= 2) g = book.fallbackGear ?? 'vocab:5.3';
	return g;
}
