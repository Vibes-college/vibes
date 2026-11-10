/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In, MoreThanOrEqual } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { MiLojoQuest, MiLojoQuestAttempt, MiLojoQuestLog } from '@/models/LojoQuest.js';
import { MiLojoWordReview } from '@/models/LojoWord.js';
import { MiUser } from '@/models/User.js';
import { IdService } from '@/core/IdService.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import { lojoTutorIds } from '@/misc/lojo-tutor.js';
import { QUEST_CH1 } from '@/misc/lojo-quest-ch1.js';
import type { QuestNode, QuestQuestion } from '@/misc/lojo-quest-ch1.js';
import { QUEST_BOOKS, bookForCause } from '@/misc/lojo-quest-books.js';
import type { QuestBook } from '@/misc/lojo-quest-books.js';
import { MAX_HEARTS, NO_HEART_APPS, XP, addDays, dayOf, daysBetween, drawQuestions, heartsNow, nextRefillAt, setCounts, streakNow, touchStreak } from '@/misc/lojo-quest.js';
import type { QuestNext, QuestTry } from '@/misc/lojo-tutor-quest.js';
import { ApiError } from '@/server/api/error.js';
import { lojoQuestErrors } from '@/server/api/lojo-schemas.js';

type Row = Omit<MiLojoQuest, 'user'>;
type Log = { kind: string; ref: string; hearts: number; xp: number; data?: Record<string, unknown> };

const CH = QUEST_CH1;
const nodeOf = (id: string): QuestNode | undefined => CH.nodes.find(n => n.id === id);
const questionOf = (node: QuestNode, qid: string): QuestQuestion | undefined => node.pool?.find(q => q.id === qid);
const bookOf = (slug: string): QuestBook | undefined => QUEST_BOOKS.find(b => b.slug === slug);
const PREP_KEYS = ['guide', 'gear', 'news'] as const;
const BOARD_MIN_PLAYERS = 5;

// Where a level's 「去装备练一组」 goes (路线图 gear 字段): dictation, vocab:5.N, grammar:6.N, typing, wordbook.
export function gearPath(gear: string | undefined): { app: string; path: string; zh: string; givesHeart: boolean } {
	const g = gear ?? 'dictation';
	const [app, stop] = g.split(':');
	if (app === 'vocab') return { app, path: `/vocab/${stop ?? '5.3'}?scope=all`, zh: `词汇线 ${stop ?? '5.3'} 站`, givesHeart: true };
	if (app === 'grammar') return { app, path: `/grammar/${stop ?? '6.3'}`, zh: `语法线 ${stop ?? '6.3'} 站`, givesHeart: false };
	if (app === 'typing') return { app, path: '/typing', zh: '机考打字', givesHeart: true };
	if (app === 'wordbook') return { app, path: '/wordbook', zh: '生词本', givesHeart: true };
	return { app: 'dictation', path: '/dictation', zh: '听写', givesHeart: true };
}

const guidePath = (b: QuestBook) => `/guides/${b.slug}`;

// 闯关: hearts, streak, levels, 补心 and the Boss for a learner. Rules in misc/lojo-quest.ts, chapter in misc/lojo-quest-ch1.ts.
@Injectable()
export class LojoQuestService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,
		private idService: IdService,
		private lojoTutorService: LojoTutorService,
	) {
	}

	private newRow(userId: string, now: Date): Row {
		return {
			userId, hearts: MAX_HEARTS, heartsAt: now, streak: 0, streakDay: null, bestStreak: 0, freezes: 0, xp: 0,
			prep: {}, bossLosses: 0, levels: {}, bag: [], chestDay: null, createdAt: now, updatedAt: now,
		};
	}

	// Read the row for update inside a transaction, creating it on first use. Hearts are brought up to date.
	private async lock(em: EntityManager, userId: string, now: Date): Promise<Row> {
		await em.createQueryBuilder().insert().into(MiLojoQuest).values(this.newRow(userId, now)).orIgnore().execute();
		const row = await em.findOneOrFail(MiLojoQuest, { where: { userId }, lock: { mode: 'pessimistic_write' } });
		const h = heartsNow(row.hearts, row.heartsAt, now);
		if (h !== row.hearts) {
			row.hearts = h;
			row.heartsAt = now;
		}
		return row;
	}

	private async save(em: EntityManager, row: Row, now: Date): Promise<void> {
		row.updatedAt = now;
		const { userId, ...rest } = row;
		await em.update(MiLojoQuest, { userId }, rest);
	}

	private async log(em: EntityManager, userId: string, now: Date, entry: Log): Promise<void> {
		await em.insert(MiLojoQuestLog, { id: this.idService.gen(now.getTime()), userId, at: now, day: dayOf(now), kind: entry.kind, ref: entry.ref, hearts: entry.hearts, xp: entry.xp, data: (entry.data ?? {}) as never });
	}

	private async todayLogs(em: EntityManager | DataSource, userId: string, now: Date): Promise<MiLojoQuestLog[]> {
		return em.getRepository(MiLojoQuestLog).find({ where: { userId, day: dayOf(now) } });
	}

	private setHearts(row: Row, hearts: number, now: Date): void {
		row.hearts = Math.max(0, Math.min(MAX_HEARTS, hearts));
		row.heartsAt = now;
	}

	// Count today for the streak; returns what changed for the page's flame animation.
	private async streak(em: EntityManager, row: Row, now: Date): Promise<{ days: number; changed: boolean; usedFreezes: number; gotFreeze: boolean }> {
		const t = touchStreak(row, dayOf(now));
		if (t.changed) {
			row.streak = t.streak;
			row.streakDay = t.streakDay;
			row.bestStreak = t.bestStreak;
			row.freezes = t.freezes;
			if (t.usedFreezes > 0) await this.log(em, row.userId, now, { kind: 'freeze', ref: 'used', hearts: 0, xp: 0, data: { n: t.usedFreezes } });
			if (t.gotFreeze) await this.log(em, row.userId, now, { kind: 'freeze', ref: 'streak', hearts: 0, xp: 0 });
		}
		return { days: row.streak, changed: t.changed, usedFreezes: t.usedFreezes, gotFreeze: t.gotFreeze };
	}

	// Which nodes are open: a level opens when one node before it is cleared; the Boss when every level before it is
	// passed. Stations (装备、情报、书屋) never block: they count as cleared once open.
	private nodeStates(row: Row): Record<string, 'done' | 'open' | 'locked'> {
		const states: Record<string, 'done' | 'open' | 'locked'> = { S: 'done' };
		const cleared = (id: string) => states[id] === 'done' || (states[id] === 'open' && nodeOf(id)?.kind !== 'level' && nodeOf(id)?.kind !== 'boss');
		for (const n of CH.nodes) {
			if (n.kind === 'start') continue;
			const before = CH.edges.filter(([, b]) => b === n.id).map(([a]) => a);
			const open = n.kind === 'boss'
				? before.filter(a => nodeOf(a)?.kind === 'level').every(cleared)
				: before.some(cleared);
			const passed = row.levels[n.id]?.passedAt != null;
			const stationDone = (n.kind === 'gear' && row.prep.gear) || (n.kind === 'news' && row.prep.news) || (n.kind === 'shelf' && row.prep.guide);
			states[n.id] = !open ? 'locked' : (passed || stationDone) ? 'done' : 'open';
		}
		return states;
	}

	private bookFor(cause: string | null, failStreak: number): QuestBook {
		// 错因 → 锦囊 follows 攻略's causeKeys; failing the same level twice in a row points to 「卡住多半在练已经会的」
		return (failStreak >= 2 ? bookForCause('same-mistake-again') : null) ?? bookForCause(cause ?? '') ?? QUEST_BOOKS.find(b => b.no === 5) ?? QUEST_BOOKS[0];
	}

	private lastFail(row: Row): { levelId: string; cause: string | null; failStreak: number } | null {
		let best: { levelId: string; at: string; cause: string | null; failStreak: number } | null = null;
		for (const [levelId, l] of Object.entries(row.levels)) {
			const x = l as typeof l & { lastCause?: string };
			if ((l.failStreak ?? 0) > 0 && l.lastAt && (best == null || l.lastAt > best.at)) best = { levelId, at: l.lastAt, cause: x.lastCause ?? null, failStreak: l.failStreak ?? 0 };
		}
		return best;
	}

	public async show(userId: string) {
		const now = new Date();
		const row = await this.db.transaction(async em => {
			const r = await this.lock(em, userId, now);
			return r;
		});
		const logs = await this.todayLogs(this.db, userId, now);
		return this.pack(row, logs, now);
	}

	private pack(row: Row, logs: MiLojoQuestLog[], now: Date) {
		const today = dayOf(now);
		const s = streakNow(row, today);
		const states = this.nodeStates(row);
		const fail = this.lastFail(row);
		const rec = fail ? this.bookFor(fail.cause, fail.failStreak) : null;
		const checked = new Set(logs.filter(l => l.kind === 'check' && l.data.passed === true).map(l => l.ref));
		const refilled = { guide: logs.some(l => l.kind === 'refill' && l.ref === 'guide'), gear: logs.some(l => l.kind === 'refill' && l.ref === 'gear') };
		const lit = new Set<number>(rec ? [rec.no] : []);
		if (fail) for (const b of [bookForCause(fail.cause ?? ''), bookForCause('same-mistake-again')]) if (b) lit.add(b.no);
		const prep = { guide: !!row.prep.guide, gear: !!row.prep.gear, news: !!row.prep.news };
		return {
			now: now.toISOString(),
			day: today,
			hearts: row.hearts,
			maxHearts: MAX_HEARTS,
			nextRefillAt: nextRefillAt(now).toISOString(),
			refilledToday: refilled,
			streak: { days: s.days, doneToday: s.doneToday, best: row.bestStreak, freezes: row.freezes, freezesNeeded: s.freezesNeeded },
			xp: row.xp,
			todayXp: logs.reduce((a, l) => a + l.xp, 0),
			prep,
			bossReady: prep.guide && prep.gear && prep.news,
			bossLosses: row.bossLosses,
			chestToday: row.chestDay === today,
			bag: row.bag,
			lastFail: fail ? { levelId: fail.levelId, cause: fail.cause, failStreak: fail.failStreak } : null,
			tutorId: lojoTutorIds()[0] ?? null,
			chapter: {
				id: CH.id, title: CH.title, band: CH.band, boss: CH.boss,
				edges: CH.edges,
				nodes: CH.nodes.map(n => {
					const l = row.levels[n.id];
					const idle = l?.passedAt && l.lastAt ? daysBetween(dayOf(new Date(l.lastAt)), today) : 0;
					const g = n.kind === 'level' || n.kind === 'boss' || n.kind === 'gear' ? gearPath(n.gear) : null;
					return {
						id: n.id, kind: n.kind, x: n.x, y: n.y, label: n.label, name: n.name ?? null, skill: n.skill ?? null, type: n.type ?? null,
						hint: n.hint ?? null, practice: !!n.practice, ask: n.ask ?? null, need: n.need ?? null, tags: n.tags ?? [],
						gear: g, state: states[n.id],
						best: l?.best ?? null, tries: l?.tries ?? 0, failStreak: l?.failStreak ?? 0,
						// 7 days untouched fades, 14 turns gray (display only)
						age: l?.passedAt ? (idle >= 14 ? 'gray' : idle >= 7 ? 'fade' : null) : null,
					};
				}),
			},
			books: QUEST_BOOKS.map(b => ({
				no: b.no, id: b.id, slug: b.slug, spine: b.spine, title: b.title, summary: b.summary, kind: b.kind, evidence: b.evidence, color: b.color,
				app: b.app, verify: b.verify, path: guidePath(b), gear: b.gear ? gearPath(b.gear === 'level' ? undefined : b.gear) : null, givesHeart: b.givesHeart,
				quiz: b.quiz.map(q => ({ q: q.q, o: q.o })),
				checkedToday: checked.has(b.slug), inBag: row.bag.includes(b.slug), lit: lit.has(b.no), recommended: rec?.no === b.no,
			})),
		};
	}

	public async start(userId: string, levelId: string) {
		const now = new Date();
		const node = nodeOf(levelId);
		if (node == null || (node.kind !== 'level' && node.kind !== 'boss') || node.pool == null) throw new ApiError(lojoQuestErrors.noSuchLevel);
		return await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			if (this.nodeStates(row)[levelId] === 'locked') throw new ApiError(lojoQuestErrors.levelLocked);
			if (node.kind === 'boss' && !(row.prep.guide && row.prep.gear && row.prep.news)) throw new ApiError(lojoQuestErrors.bossNotReady);
			if (!node.practice && row.hearts <= 0) throw new ApiError(lojoQuestErrors.noHearts);
			await em.update(MiLojoQuestAttempt, { userId, status: 'open' }, { status: 'quit', endedAt: now });
			const qs = drawQuestions(node.pool!, node.ask ?? 5, row.levels[levelId]?.lastQs ?? []);
			const attempt = { id: this.idService.gen(now.getTime()), userId, levelId, questionIds: qs.map(q => q.id), answers: [], status: 'open', createdAt: now, endedAt: null, askedTutor: false };
			await em.insert(MiLojoQuestAttempt, attempt);
			row.levels = { ...row.levels, [levelId]: { ...row.levels[levelId], lastQs: attempt.questionIds } };
			await this.save(em, row, now);
			return {
				attemptId: attempt.id,
				levelId,
				kind: node.kind,
				practice: !!node.practice,
				need: node.kind === 'boss' ? CH.boss.hp : node.need ?? qs.length,
				total: qs.length,
				maxWrong: node.kind === 'boss' ? CH.boss.maxWrong : qs.length - (node.need ?? qs.length) + 1,
				hint: node.hint ?? null,
				hearts: row.hearts,
				questions: qs.map(q => ({ id: q.id, p: q.p ?? null, s: q.s, o: q.o })),
			};
		});
	}

	public async answer(userId: string, attemptId: string, qid: string, choice: number) {
		const now = new Date();
		return await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			const at = await em.findOne(MiLojoQuestAttempt, { where: { id: attemptId, userId }, lock: { mode: 'pessimistic_write' } });
			if (at == null || at.status !== 'open') throw new ApiError(lojoQuestErrors.noSuchAttempt);
			const node = nodeOf(at.levelId)!;
			if (at.questionIds[at.answers.length] !== qid) throw new ApiError(lojoQuestErrors.wrongQuestion);
			const q = questionOf(node, qid)!;
			const correct = choice === q.a;
			at.answers = [...at.answers, { qid, choice, correct }];
			let heartLost = false;
			if (!correct && !node.practice) {
				if (row.hearts > 0) {
					this.setHearts(row, row.hearts - 1, now);
					heartLost = true;
					await this.log(em, userId, now, { kind: 'wrong', ref: at.levelId, hearts: -1, xp: 0, data: { qid } });
				}
			}
			const right = at.answers.filter(a => a.correct).length;
			const wrong = at.answers.length - right;
			const isBoss = node.kind === 'boss';
			const need = isBoss ? CH.boss.hp : node.need ?? at.questionIds.length;
			const maxWrong = isBoss ? CH.boss.maxWrong : at.questionIds.length - need + 1;
			const outOfHearts = !node.practice && row.hearts <= 0 && !correct;
			let ended: null | 'passed' | 'failed' = null;
			if (right >= need) ended = 'passed';
			else if (wrong >= maxWrong || outOfHearts || at.answers.length >= at.questionIds.length) ended = 'failed';

			let end = null;
			if (ended) {
				at.status = ended;
				at.endedAt = now;
				end = await this.finish(em, row, at, node, ended === 'passed', now, outOfHearts);
			}
			await em.update(MiLojoQuestAttempt, { id: at.id }, { answers: at.answers, status: at.status, endedAt: at.endedAt });
			await this.save(em, row, now);
			return {
				correct, answer: q.a, why: q.why, heartLost, hearts: row.hearts,
				progress: { answered: at.answers.length, right, wrong, need, maxWrong, total: at.questionIds.length },
				end,
			};
		});
	}

	private async finish(em: EntityManager, row: Row, at: MiLojoQuestAttempt, node: QuestNode, passed: boolean, now: Date, outOfHearts: boolean) {
		const today = dayOf(now);
		const prev = row.levels[at.levelId] ?? {};
		const right = at.answers.filter(a => a.correct).length;
		const causes: string[] = at.answers.filter(a => !a.correct).map(a => questionOf(node, a.qid)?.cause as string | undefined).filter((c): c is string => c != null);
		const mainCause = causes.length ? [...causes].sort((a, b) => causes.filter(c => c === b).length - causes.filter(c => c === a).length)[0] : null;
		const level = {
			...prev,
			lastAt: now.toISOString(),
			tries: (prev.tries ?? 0) + 1,
			best: Math.max(prev.best ?? 0, right),
			failStreak: passed ? 0 : (prev.failStreak ?? 0) + 1,
			lastCause: passed ? undefined : mainCause ?? undefined,
			...(passed && prev.passedAt == null ? { passedAt: now.toISOString() } : {}),
		};
		row.levels = { ...row.levels, [at.levelId]: level };
		let xp = 0;
		let chest = null;
		let streak = null;
		let prepReset = false;
		const firstPass = passed && prev.passedAt == null;
		if (node.kind === 'boss') {
			if (passed) {
				xp = firstPass ? XP.boss : XP.replay;
				row.bossLosses = 0;
			} else {
				row.bossLosses += 1;
				// 连输两次，三样准备清零
				if (row.bossLosses >= 2) {
					row.prep = {};
					row.bossLosses = 0;
					prepReset = true;
				}
			}
			await this.log(em, row.userId, now, { kind: 'boss', ref: passed ? 'won' : 'lost', hearts: 0, xp, data: { attemptId: at.id, prepReset } });
		} else if (passed) {
			xp = firstPass ? XP.pass : XP.replay;
			await this.log(em, row.userId, now, { kind: 'pass', ref: at.levelId, hearts: 0, xp, data: { attemptId: at.id, first: firstPass } });
		}
		if (passed) {
			// 每天第一次过关开宝箱：经验，四分之一的机会多一张冻结卡（最多 2 张）
			if (row.chestDay !== today) {
				row.chestDay = today;
				const freeze = row.freezes < 2 && Math.random() < 0.25;
				if (freeze) row.freezes += 1;
				chest = { xp: XP.chest, freeze };
				await this.log(em, row.userId, now, { kind: 'chest', ref: at.levelId, hearts: 0, xp: XP.chest, data: { freeze } });
				xp += XP.chest;
			}
			row.xp += xp;
			streak = await this.streak(em, row, now);
		}
		return {
			passed, right, total: at.answers.length, need: node.kind === 'boss' ? CH.boss.hp : node.need, outOfHearts,
			xp, chest, streak, firstPass, failStreak: level.failStreak, cause: mainCause,
			bossLosses: row.bossLosses, prepReset, prep: { guide: !!row.prep.guide, gear: !!row.prep.gear, news: !!row.prep.news },
			review: at.answers.map((a, i) => {
				const q = questionOf(node, a.qid)!;
				return { n: i + 1, qid: a.qid, correct: a.correct, choice: a.choice, answer: q.a, why: q.why };
			}),
			recommended: passed ? null : (() => {
				const b = this.bookFor(mainCause, level.failStreak);
				return { slug: b.slug, no: b.no, spine: b.spine, path: guidePath(b) };
			})(),
		};
	}

	// 锦囊补心: the book's 3-question check, 2 right passes. A pass puts the book in the bag, ticks Boss prep and the
	// streak, and gives 1 heart if hearts are below 5 and the 锦囊 path has not given one today. Once a day per book.
	public async check(userId: string, slug: string, answers: number[]) {
		const now = new Date();
		const book = bookOf(slug);
		if (book == null) throw new ApiError(lojoQuestErrors.noSuchBook);
		return await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			const logs = await this.todayLogs(em, userId, now);
			const results = book.quiz.map((q, i) => ({ correct: answers[i] === q.a, answer: q.a, why: q.why }));
			const right = results.filter(r => r.correct).length;
			const passed = right >= 2;
			const already = logs.some(l => l.kind === 'check' && l.ref === slug && l.data.passed === true);
			let refilled = false;
			let reason: string | null = null;
			let streak = null;
			if (!passed) reason = 'failed';
			else if (already) reason = 'duplicate';
			else {
				await this.log(em, userId, now, { kind: 'check', ref: slug, hearts: 0, xp: XP.check, data: { passed: true, right } });
				row.xp += XP.check;
				row.prep = { ...row.prep, guide: true };
				if (!row.bag.includes(slug)) row.bag = [...row.bag, slug].slice(-3);
				if (row.hearts >= MAX_HEARTS) reason = 'full';
				else if (logs.some(l => l.kind === 'refill' && l.ref === 'guide')) reason = 'pathUsed';
				else {
					this.setHearts(row, row.hearts + 1, now);
					refilled = true;
					await this.log(em, userId, now, { kind: 'refill', ref: 'guide', hearts: 1, xp: 0, data: { slug } });
				}
				streak = await this.streak(em, row, now);
			}
			if (!passed) await this.log(em, userId, now, { kind: 'check', ref: slug, hearts: 0, xp: 0, data: { passed: false, right } });
			await this.save(em, row, now);
			return { passed, right, refilled, reason, hearts: row.hearts, results, streak, prep: { guide: !!row.prep.guide, gear: !!row.prep.gear, news: !!row.prep.news } };
		});
	}

	// Carry a book into a level (the bag holds 3). Reading it counts for Boss prep.
	public async take(userId: string, slug: string) {
		const now = new Date();
		if (bookOf(slug) == null) throw new ApiError(lojoQuestErrors.noSuchBook);
		return await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			if (!row.bag.includes(slug)) row.bag = [...row.bag, slug].slice(-3);
			row.prep = { ...row.prep, guide: true };
			await this.log(em, userId, now, { kind: 'take', ref: slug, hearts: 0, xp: 0 });
			await this.save(em, row, now);
			return { bag: row.bag, prep: { guide: !!row.prep.guide, gear: !!row.prep.gear, news: !!row.prep.news } };
		});
	}

	// 情报: opening the timeline posts of the 情报站 ticks Boss prep. Never a heart.
	public async news(userId: string, levelId: string | null) {
		const now = new Date();
		return await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			row.prep = { ...row.prep, news: true };
			await this.log(em, userId, now, { kind: 'news', ref: levelId ?? '', hearts: 0, xp: 0 });
			await this.save(em, row, now);
			return { prep: { guide: !!row.prep.guide, gear: !!row.prep.gear, news: !!row.prep.news } };
		});
	}

	// 装备补心: a mini app reports a finished set. It counts with at least 10 items and 2 minutes, once a day per set;
	// a counted set ticks Boss prep and the streak, and gives 1 heart if hearts are below 5 and the 装备 path has not
	// given one today (语法线 gives none in v1). 生词本 sets are checked against the reviews saved in that time.
	public async refill(userId: string, p: { app: string; setKey: string; items: number; durationMs: number; startedAt: number }) {
		const now = new Date();
		let items = p.items;
		if (p.app === 'wordbook') {
			const reviews = await this.db.getRepository(MiLojoWordReview).createQueryBuilder('v')
				.where('v.userId = :userId', { userId })
				.andWhere('v.reviewedAt >= :from AND v.reviewedAt <= :to', { from: new Date(p.startedAt - 5000), to: new Date(p.startedAt + p.durationMs + 5000) })
				.getCount();
			items = Math.min(items, reviews);
		}
		const ok = setCounts(items, p.durationMs, p.startedAt, now);
		return await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			const base = { counted: false, refilled: false, hearts: row.hearts, items, streak: null as null | Awaited<ReturnType<LojoQuestService['streak']>> };
			if (!ok.ok) return { ...base, reason: ok.reason! };
			const logs = await this.todayLogs(em, userId, now);
			const ref = `${p.app}:${p.setKey}`.slice(0, 256);
			if (logs.some(l => l.kind === 'set' && l.ref === ref)) return { ...base, reason: 'duplicate' };
			await this.log(em, userId, now, { kind: 'set', ref, hearts: 0, xp: XP.set, data: { items, durationMs: p.durationMs } });
			row.xp += XP.set;
			row.prep = { ...row.prep, gear: true };
			let reason: string | null = null;
			let refilled = false;
			if (NO_HEART_APPS.includes(p.app)) reason = 'noHeartApp';
			else if (row.hearts >= MAX_HEARTS) reason = 'full';
			else if (logs.some(l => l.kind === 'refill' && l.ref === 'gear')) reason = 'pathUsed';
			else {
				this.setHearts(row, row.hearts + 1, now);
				refilled = true;
				await this.log(em, userId, now, { kind: 'refill', ref: 'gear', hearts: 1, xp: 0, data: { app: p.app } });
			}
			const streak = await this.streak(em, row, now);
			await this.save(em, row, now);
			return { counted: true, refilled, reason, hearts: row.hearts, items, streak };
		});
	}

	// This week's XP (Monday 00:00 Beijing on). Opens only with at least 5 real players; no made-up names.
	public async board(userId: string) {
		const now = new Date();
		const today = dayOf(now);
		const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
		const monday = addDays(today, -weekday);
		const rows: { userId: string; xp: string }[] = await this.db.getRepository(MiLojoQuestLog).createQueryBuilder('l')
			.select('l.userId', 'userId').addSelect('SUM(l.xp)', 'xp')
			.where('l.day >= :monday', { monday })
			.andWhere('l.xp > 0')
			.groupBy('l.userId')
			.orderBy('xp', 'DESC')
			.limit(200)
			.getRawMany();
		const tutors = lojoTutorIds();
		const players = rows.filter(r => !tutors.includes(r.userId));
		if (players.length < BOARD_MIN_PLAYERS) return { open: false, players: players.length, min: BOARD_MIN_PLAYERS, since: monday, top: [], me: null };
		const top = players.slice(0, 20);
		const users = await this.db.getRepository(MiUser).findBy({ id: In(top.map(r => r.userId)) });
		const meIdx = players.findIndex(r => r.userId === userId);
		return {
			open: true, players: players.length, min: BOARD_MIN_PLAYERS, since: monday,
			top: top.map((r, i) => {
				const u = users.find(x => x.id === r.userId);
				return { rank: i + 1, userId: r.userId, username: u?.username ?? '', name: u?.name ?? u?.username ?? '', xp: Number(r.xp), me: r.userId === userId };
			}),
			me: meIdx < 0 ? null : { rank: meIdx + 1, xp: Number(players[meIdx].xp) },
		};
	}

	// 「问 Mia」 on a failed try: build "this try" from the stored attempt and let Mia write first. Mia接入.md section 2.
	public async askTutor(userId: string, attemptId: string) {
		const now = new Date();
		const tutorId = lojoTutorIds()[0] ?? null;
		const at = await this.db.getRepository(MiLojoQuestAttempt).findOneBy({ id: attemptId, userId });
		if (at == null || at.status !== 'failed') throw new ApiError(lojoQuestErrors.noSuchAttempt);
		if (tutorId == null) return { tutorId, result: 'off' as const };
		const row = await this.db.transaction(em => this.lock(em, userId, now));
		const logs = await this.todayLogs(this.db, userId, now);
		const node = nodeOf(at.levelId)!;
		const level = row.levels[at.levelId] ?? {};
		const wrong = at.answers.map((a, i) => ({ a, i })).filter(x => !x.a.correct).map(({ a, i }) => {
			const q = questionOf(node, a.qid)!;
			return {
				n: i + 1, question: [q.p, q.s].filter(Boolean).join(' / ').slice(0, 200), evidence: (q.ev ?? q.p ?? '').slice(0, 300),
				picked: q.o[a.choice] ?? '', answer: q.o[q.a], cause: q.cause,
			};
		});
		const causes: string[] = wrong.map(w => w.cause as string);
		const prevCause = (level as { lastCause?: string }).lastCause ?? null;
		let cause: string | null = causes.length ? [...causes].sort((x, y) => causes.filter(c => c === y).length - causes.filter(c => c === x).length)[0] : null;
		if (cause != null && (level.failStreak ?? 0) >= 2 && prevCause === cause) cause = 'same-mistake-again';
		const s = streakNow(row, dayOf(now));
		const refilledToday = { guide: logs.some(l => l.kind === 'refill' && l.ref === 'guide'), gear: logs.some(l => l.kind === 'refill' && l.ref === 'gear') };
		const book = this.bookFor(causes[0] ?? null, level.failStreak ?? 0);
		const gear = gearPath(node.gear);
		const read = logs.some(l => l.kind === 'check' && l.ref === book.slug && l.data.passed === true);
		const next: QuestNext[] = [
			{ id: `guide:${book.id}`, label: `锦囊 ${book.no} · ${book.spine}`, url: `/quest?book=${book.slug}`, recommended: true, readToday: read },
			{ id: `gear:${gear.app}`, label: `装备 · ${gear.zh}`, url: gear.path, ...(gear.givesHeart ? { givesHeart: true } : {}) },
			{ id: 'retry', label: `再打 ${node.label}（换新题）`, url: `/quest?level=${node.id}` },
		];
		const nextRefill = nextRefillAt(now);
		const questTry: QuestTry = {
			v: 1,
			attemptId: at.id,
			at: (at.endedAt ?? now).toISOString(),
			chapter: CH.title,
			level: { id: node.id, name: node.name ?? node.label, kind: node.kind === 'boss' ? 'boss' : 'level', skill: node.skill ?? '', type: node.type ?? '' },
			result: { correct: at.answers.filter(a => a.correct).length, total: at.questionIds.length, needed: node.kind === 'boss' ? CH.boss.hp : node.need ?? 0, passed: false, failStreak: level.failStreak ?? 1 },
			wrong,
			cause,
			hearts: { now: row.hearts, max: MAX_HEARTS, nextRefill: new Date(nextRefill.getTime() + 8 * 3600_000).toISOString().slice(11, 16), refilledToday },
			streak: { days: s.days, doneToday: s.doneToday, freezeCards: row.freezes },
			boss: node.kind === 'boss' ? { losses: row.bossLosses, prep: { guide: !!row.prep.guide, gear: !!row.prep.gear, intel: !!row.prep.news } } : null,
			next,
		};
		const result = at.askedTutor ? 'already' : await this.lojoTutorService.openFromQuest(tutorId, userId, questTry);
		if (!at.askedTutor && result === 'sent') await this.db.getRepository(MiLojoQuestAttempt).update({ id: at.id }, { askedTutor: true });
		return { tutorId, result };
	}
}
