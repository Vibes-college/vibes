/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 一个学员在闯关地图上的状态，不碰数据库：这一章开没开、Boss 打没打赢、备战做了几项、现在在哪一章、哪些关开着、
// 上次输在哪关、该看哪本锦囊，以及三段闯关的站和回炉记录。LojoQuestService 照这些算；live = 正式站
// （第二章起不开，第一章用旧规矩）。2026-11-16 从 LojoQuestService 搬出来，行为没变。

import { MAX_HEARTS, shelfFor } from '@/misc/lojo-quest.js';
import { questChapterOf, questChapters, questFirstChapter, questNodeOf, questRoute } from '@/misc/lojo-quest-content.js';
import { bookForCause, questBooks } from '@/misc/lojo-quest-books.js';
import { ROUTE_SKILLS, oldMapStates, pruneEvents, routeView, sprintStars, tally } from '@/misc/lojo-quest-route.js';
import type { MiLojoQuest } from '@/models/LojoQuest.js';
import type { QuestBook } from '@/misc/lojo-quest-books.js';
import type { QuestChapter, QuestNode, QuestRules } from '@/misc/lojo-quest-types.js';
import type { MiLojoQuestRoute, QuestRoute, RouteEvent, RouteTally } from '@/misc/lojo-quest-route.js';

export type QuestRow = Omit<MiLojoQuest, 'user'>;
export type QuestNodeState = 'done' | 'open' | 'locked';

// 书屋的书在数据库里（lojo-quest-books.ts），这里查的是正在用的那一版
export const questBookOf = (slug: string): QuestBook | undefined => questBooks().find(b => b.slug === slug);
export const questBookByRef = (ref: string): QuestBook | undefined => questBooks().find(b => b.ref === ref);
// 锦囊还没导进来的（j11 起）照 shelfRule 跳过
export const questKnownRefs = (refs: readonly string[]) => refs.filter(r => questBookByRef(r) != null);
// 「读全文」：书写了 guide 就开那篇攻略（2026-11-17 起书指到四篇新攻略），没写就开和书同名的那篇
export const questGuidePath = (b: QuestBook) => `/guides/${b.guide ?? b.slug}`;

// every level of a chapter in map order, the Boss last (for 落后提醒)
export const questLevelName = (id: string): string => {
	const n = questNodeOf(id);
	return n ? [n.kind === 'boss' ? `Boss ${n.label}` : n.label, n.name, n.zh ? `(${n.zh})` : null].filter(x => x).join(' ') : id;
};
export const questLevelOrder = (c: QuestChapter) => c.nodes.filter(n => n.kind === 'level' && !n.hidden).map(n => n.id).concat(c.nodes.filter(n => n.kind === 'boss').map(n => n.id));

// Boss 备战三项：第一章存档里是 guide / gear / news，第二章起带章号（c2:guide…）；extra = 连输后要多做的一项还没做
export const PREP_ITEMS = ['guide', 'gear', 'news'] as const;
export type QuestPrepItem = typeof PREP_ITEMS[number] | 'extra';
export const questPrepKey = (no: number, item: QuestPrepItem) => (no === 1 ? item : `c${no}:${item}`);

// 第一章在正式站的旧规矩（ch1-11a）：开关 1 颗心、备战 3 项全做、连输 2 次清零。11e 新规矩只在测试站，等创始人定。
function legacyCh1(r: QuestRules): QuestRules {
	return {
		...r,
		level: { ...r.level, minHeartsToStart: 1 },
		boss: { ...r.boss, prepRequired: r.boss.prepOf, extraPrepAfterLossesInARow: null, resetPrepAfterLossesInARow: 2 },
	};
}

// A chapter's rules on this site
export function questSiteRules(no: number, live: boolean): QuestRules {
	const r = questChapterOf(no).rules;
	return live && no === 1 ? legacyCh1(r) : r;
}

// numbers.json unlock: 第一章总是开着；第二章打赢第一章 Boss（或定级到第二章）开；第三、四章打赢上一章 Boss 开。
// 正式站第二章起都不开。
export function questChapterOpen(row: QuestRow, no: number, live: boolean): boolean {
	if (no === 1) return true;
	// 三段闯关：开不开看站，不看章
	if (questRoute() != null) return true;
	if (live) return false;
	if (no === 2 && (row.placement?.ch2?.length ?? 0) > 0) return true;
	return row.levels[questChapterOf(no - 1).bossId]?.passedAt != null;
}

export function questBossBeaten(row: QuestRow, no: number): boolean {
	return row.levels[questChapterOf(no).bossId]?.passedAt != null;
}

export function questPrepOf(row: QuestRow, no = 1) {
	const k = (item: QuestPrepItem) => !!row.prep[questPrepKey(no, item)];
	return { guide: k('guide'), gear: k('gear'), news: k('news'), extra: k('extra') };
}

// Doing a prep item (a guide, a gear set, a timeline post) ticks it for every open chapter whose Boss is not beaten
// yet (第一章 always, as before), and does the one more item asked after losses in a row.
export function questTickPrep(row: QuestRow, item: typeof PREP_ITEMS[number], live: boolean): void {
	const next = { ...row.prep };
	for (const c of questChapters()) {
		if (c.no !== 1 && (!questChapterOpen(row, c.no, live) || questBossBeaten(row, c.no))) continue;
		next[questPrepKey(c.no, item)] = true;
		delete next[questPrepKey(c.no, 'extra')];
	}
	row.prep = next;
}

export function questBossReady(row: QuestRow, no: number, live: boolean): boolean {
	if (no === 1 && row.placement?.prepWaived) return true;
	const p = questPrepOf(row, no);
	const done = [p.guide, p.gear, p.news].filter(x => x).length;
	return done >= questSiteRules(no, live).boss.prepRequired && !p.extra;
}

// The chapter a learner is on now: the first open one whose Boss is not beaten, else the last open one.
export function questCurrentChapter(row: QuestRow, live: boolean): QuestChapter {
	const open = questChapters().filter(c => questChapterOpen(row, c.no, live));
	return open.find(c => !questBossBeaten(row, c.no)) ?? open[open.length - 1] ?? questFirstChapter();
}

export function questNewRow(userId: string, now: Date): QuestRow {
	return {
		userId, hearts: MAX_HEARTS, heartsAt: now, streak: 0, streakDay: null, bestStreak: 0, freezes: 0, xp: 0,
		prep: {}, bossLosses: 0, levels: {}, bag: [], chestDay: null, examDate: null, onboarded: false, trial: false, notice: null, placement: null, route: null, createdAt: now, updatedAt: now,
	};
}

export function questSetHearts(row: QuestRow, hearts: number, now: Date): void {
	row.hearts = Math.max(0, Math.min(MAX_HEARTS, hearts));
	row.heartsAt = now;
}

/* ---------- 三段闯关 (route.json) ---------- */

// The route's rules for this learner. gateReady: which old-gate groups are ready on this site (sprint stations only;
// what a level is never depends on it). Stations newly open are added to row.route.opened (the caller saves).
export function questRouteFor(row: QuestRow, route: QuestRoute, now: Date, gateReady: (gate: string, sets: readonly string[]) => boolean = () => false) {
	const state: MiLojoQuestRoute = row.route ?? {};
	const out = routeView({ route, levels: row.levels, state, placementStation: row.placement?.station ?? null, gateReady, now });
	if (out.newlyOpened.length > 0) row.route = { ...state, opened: [...(state.opened ?? []), ...out.newlyOpened] };
	return out;
}

export function questRouteNodeStates(row: QuestRow, route: QuestRoute): Record<string, QuestNodeState> {
	const r = questRouteFor(row, route, new Date());
	const states: Record<string, QuestNodeState> = {};
	for (const c of questChapters()) {
		for (const n of c.nodes) {
			if (n.kind === 'start') states[n.id] = 'done';
			else if (n.kind === 'level' || n.kind === 'boss') states[n.id] = r.states[n.id] ?? (row.levels[n.id]?.passedAt ? 'done' : 'locked');
			else states[n.id] = 'open';
		}
	}
	for (const skill of ROUTE_SKILLS) states[route.stages[1].skills[skill].placement.id] = r.view.focus.open ? 'open' : 'locked';
	return states;
}

// Which nodes are open (numbers.json unlock): a node opens when the from of any line into it is passed (the start
// counts as passed); stations never block and are done once their Boss prep item is. The Boss opens with 1-6 passed
// and can be started once prep is done.
export function questNodeStates(row: QuestRow, live: boolean, useRoute = true): Record<string, QuestNodeState> {
	const route = useRoute ? questRoute() : null;
	if (route != null) return questRouteNodeStates(row, route);
	return oldMapStates(questChapters(), row.levels, no => questChapterOpen(row, no, live), no => questPrepOf(row, no));
}

// The level's 3 books and the recommended first one (numbers.json shelfRule).
// A level may name the book for a cause (第四章 4-8: vocab → j31); books not in yet are skipped.
// book is null only when no books have been imported.
export function questShelfOf(node: QuestNode | undefined, cause: string | null, failStreak: number): { refs: string[]; book: QuestBook | null } {
	const guide = cause ? node?.causeGuide?.[cause] : undefined;
	const causeRef = guide != null && questBookByRef(guide) != null ? guide : cause ? bookForCause(cause)?.ref ?? null : null;
	const refs = shelfFor(questKnownRefs(node?.shelf ?? []), causeRef, failStreak);
	const book = questBookByRef(refs[0] ?? '') ?? bookForCause('same-word') ?? questBooks()[0] ?? null;
	return { refs, book };
}

export function questLastFail(row: QuestRow): { levelId: string; cause: string | null; failStreak: number } | null {
	let best: { levelId: string; at: string; cause: string | null; failStreak: number } | null = null;
	for (const [levelId, l] of Object.entries(row.levels)) {
		if ((l.failStreak ?? 0) > 0 && l.lastAt && (best == null || l.lastAt > best.at)) best = { levelId, at: l.lastAt, cause: l.lastCause ?? null, failStreak: l.failStreak ?? 0 };
	}
	return best;
}

// 回炉的记录：每个题型对了几题、一共几题
export function questAddEvents(row: QuestRow, route: QuestRoute, from: RouteEvent['from'], items: { chain: string | null; correct: boolean }[], full: boolean, now: Date): void {
	const t = tally(items);
	const add: RouteEvent[] = Object.entries(t).map(([chain, x]) => ({ at: now.toISOString(), from, chain, right: x.right, total: x.total, full }));
	if (add.length === 0) return;
	row.route = { ...row.route ?? {}, events: pruneEvents([...row.route?.events ?? [], ...add], now, route.recycle.windowDays) };
}

// A whole set or the mock is done: stars (whole sets, only inside the time), 模考 report by question type, 回炉
export function questFinishRun(row: QuestRow, route: QuestRoute, station: string, parts: { gate: string; score: number; total: number; byChain: RouteTally }[], startedAt: number, now: Date, minutes: number | null): void {
	const score = parts.reduce((s, p) => s + p.score, 0);
	const total = parts.reduce((s, p) => s + p.total, 0);
	const byChain: Record<string, { right: number; total: number }> = {};
	for (const p of parts) for (const [c, x] of Object.entries(p.byChain ?? {})) {
		const t = byChain[c] ??= { right: 0, total: 0 };
		t.right += x.right;
		t.total += x.total;
	}
	const elapsedMs = now.getTime() - startedAt;
	const inTime = minutes == null || elapsedMs <= minutes * 60 * 1000 + 60 * 1000;
	const isMock = station === route.stages[2].mock.id;
	const S = route.stars.sprint;
	const next: MiLojoQuestRoute = { ...row.route ?? {}, run: null, lastRun: { station, score, total, elapsedMs, minutes, inTime, at: now.toISOString(), byChain } };
	if (isMock) next.mock = { at: now.toISOString(), right: score, total, byChain, parts: parts.map(p => ({ gate: p.gate, score: p.score, total: p.total })) };
	else next.sprint = { ...row.route?.sprint ?? {}, [station]: sprintStars(row.route?.sprint?.[station] ?? {}, inTime ? score : 0, total, now.toISOString(), S.passAt / S.of, (S.passAt + 1) / S.of) };
	row.route = next;
	const items = Object.entries(byChain).flatMap(([chain, x]) => [...Array(x.right).fill({ chain, correct: true }), ...Array(x.total - x.right).fill({ chain, correct: false })]);
	questAddEvents(row, route, isMock ? 'mock' : 'sprint', items, true, now);
}
