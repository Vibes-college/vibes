/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In, LessThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { MiLojoQuest, MiLojoQuestAttempt, MiLojoQuestLog } from '@/models/LojoQuest.js';
import type { MiLojoQuestLevel } from '@/models/LojoQuest.js';
import { MiLojoWordCard, MiLojoWordReview } from '@/models/LojoWord.js';
import { MiUser } from '@/models/User.js';
import { IdService } from '@/core/IdService.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import { LojoSpeechService } from '@/core/LojoSpeechService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { lojoTutorIds } from '@/misc/lojo-tutor.js';
import { lojoDefaultVoice, lojoVoiceIds, lojoVoices } from '@/misc/lojo-voices.js';
import { QUEST_CH1, QUEST_NUMBERS } from '@/misc/lojo-quest-ch1.js';
import type { QuestNode, QuestQuestion } from '@/misc/lojo-quest-ch1.js';
import { QUEST_BOOKS, bookForCause } from '@/misc/lojo-quest-books.js';
import type { QuestBook } from '@/misc/lojo-quest-books.js';
import {
	MAX_FREEZES, MAX_HEARTS, NO_HEART_APPS, REPLAY_XP, XP, addDays, ageOf, behindOf, bookGear, dayOf, daysBetween, displayAnswer, drawQuestions, examDateOk, gearPath,
	heartsNow, judge, mainCause, nextRefillAt, pickSet, setCounts, settleStreak, shelfFor, shuffle, starsAfter, streakNow, touchStreak, wrongCause,
} from '@/misc/lojo-quest.js';
import type { QuestNext, QuestTry, QuestWrong } from '@/misc/lojo-tutor-quest.js';
import { ApiError } from '@/server/api/error.js';
import { lojoQuestErrors } from '@/server/api/lojo-schemas.js';

type Row = Omit<MiLojoQuest, 'user'>;
type Log = { kind: string; ref: string; hearts: number; xp: number; data?: Record<string, unknown> };
type Mode = 'practice' | 'level' | 'retest' | 'boss';

const CH = QUEST_CH1;
const N = QUEST_NUMBERS;
const nodeOf = (id: string): QuestNode | undefined => CH.nodes.find(n => n.id === id);
const questionOf = (node: QuestNode | undefined, qid: string): QuestQuestion | undefined => node?.pool?.find(q => q.id === qid);
const bookOf = (slug: string): QuestBook | undefined => QUEST_BOOKS.find(b => b.slug === slug);
const bookByRef = (ref: string): QuestBook | undefined => QUEST_BOOKS.find(b => b.ref === ref);
// every level of the chapter in map order, the Boss last (for 落后提醒)
const LEVEL_ORDER = CH.nodes.filter(n => n.kind === 'level').map(n => n.id).concat(CH.nodes.filter(n => n.kind === 'boss').map(n => n.id));
const BOARD_MIN_PLAYERS = 5;
const BADGE = N.chest.chapterClear.badge;
// 生词本 today below this many cards: a 「去生词本」 gear goes to its fallback (错因对照表.json 规则)
const WORDBOOK_MIN = N.hearts.earnBack.gear.minItems;

const guidePath = (b: QuestBook) => `/guides/${b.slug}`;

// need / maxWrong / total / heart cost of a try. Levels: 5 questions, 4 right passes, 2 wrong fails. Boss: 6, 5 hits
// (its hp) win, 2 wrong or no hearts lose. Retest: 3 from both sets, 2 right passes, no hearts.
function rulesOf(node: QuestNode, mode: Mode): { need: number; maxWrong: number; total: number; heartCost: number } {
	if (mode === 'retest') {
		const r = N.level.retest;
		return { need: r.passAt, maxWrong: r.questions - r.passAt + 1, total: r.questions, heartCost: r.heartCost };
	}
	if (mode === 'boss') return { need: N.boss.hp, maxWrong: N.boss.loseAtWrong, total: N.boss.questionsPerTry, heartCost: node.heartCost };
	return { need: N.level.passAtCorrect, maxWrong: N.level.failAtWrong, total: N.level.questionsPerTry, heartCost: node.heartCost };
}

// What the page gets for a question: never the answer, accept list, evidence or the recording's script. Chips shuffled.
function publicQuestion(q: QuestQuestion) {
	let chips = q.chips;
	if (chips != null) {
		const target = q.answer.toLowerCase();
		for (let i = 0; i < 6; i++) {
			chips = shuffle(q.chips!);
			if (chips.join(' ').toLowerCase() !== target) break;
		}
	}
	return {
		id: q.id, type: q.type, skill: q.skill, passage: q.passage, question: q.question,
		options: q.options, chips, limit: q.limit, audio: q.audio != null,
	};
}

// 闯关: hearts, streak, levels, 补心 and the Boss for a learner. Rules in misc/lojo-quest.ts, chapter in misc/lojo-quest-ch1.ts.
@Injectable()
export class LojoQuestService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,
		private idService: IdService,
		private lojoTutorService: LojoTutorService,
		private lojoSpeechService: LojoSpeechService,
		private driveFileEntityService: DriveFileEntityService,
	) {
		// Mia's follow-ups after "Ask Mia" go by the hearts now, not the ones stored with the try.
		this.lojoTutorService.questHearts = userId => this.heartsFor(userId);
	}

	private async heartsFor(userId: string) {
		const now = new Date();
		const row = await this.db.getRepository(MiLojoQuest).findOneBy({ userId });
		const logs = await this.todayLogs(this.db, userId, now);
		return {
			now: row == null ? MAX_HEARTS : heartsNow(row.hearts, row.heartsAt, now),
			refilledToday: { guide: logs.some(l => l.kind === 'refill' && l.ref === 'guide'), gear: logs.some(l => l.kind === 'refill' && l.ref === 'gear') },
		};
	}

	private newRow(userId: string, now: Date): Row {
		return {
			userId, hearts: MAX_HEARTS, heartsAt: now, streak: 0, streakDay: null, bestStreak: 0, freezes: 0, xp: 0,
			prep: {}, bossLosses: 0, levels: {}, bag: [], chestDay: null, examDate: null, onboarded: false, notice: null, createdAt: now, updatedAt: now,
		};
	}

	// Read the row for update inside a transaction, creating it on first use. Hearts are brought up to date; coming
	// back after missed days uses freeze cards or ends the streak, and leaves a one-time notice for the page.
	private async lock(em: EntityManager, userId: string, now: Date): Promise<Row> {
		await em.createQueryBuilder().insert().into(MiLojoQuest).values(this.newRow(userId, now)).orIgnore().execute();
		const row = await em.findOneOrFail(MiLojoQuest, { where: { userId }, lock: { mode: 'pessimistic_write' } });
		const h = heartsNow(row.hearts, row.heartsAt, now);
		if (h !== row.hearts) {
			row.hearts = h;
			row.heartsAt = now;
		}
		const settled = settleStreak(row, dayOf(now));
		if (settled.notice) {
			row.streak = settled.state.streak;
			row.streakDay = settled.state.streakDay;
			row.freezes = settled.state.freezes;
			row.notice = settled.notice;
			if (settled.notice.kind === 'freeze') await this.log(em, userId, now, { kind: 'freeze', ref: 'used', hearts: 0, xp: 0, data: { n: settled.notice.used } });
			await this.save(em, row, now);
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

	// 生词本 cards due by the end of today (Beijing): below 10, a wordbook gear cannot give a heart today.
	private async wordbookLow(userId: string, now: Date): Promise<boolean> {
		const end = new Date(Date.parse(`${addDays(dayOf(now), 1)}T00:00:00+08:00`));
		const due = await this.db.getRepository(MiLojoWordCard).count({ where: { userId, due: LessThan(end) }, take: WORDBOOK_MIN });
		return due < WORDBOOK_MIN;
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

	private prepOf(row: Row) {
		return { guide: !!row.prep.guide, gear: !!row.prep.gear, news: !!row.prep.news };
	}

	// Which nodes are open (numbers.json unlock): a node opens when the from of any line into it is passed (the start
	// counts as passed); stations never block and are done once their Boss prep item is. The Boss opens with 1-6 passed
	// and can be started once prep is done.
	private nodeStates(row: Row): Record<string, 'done' | 'open' | 'locked'> {
		const passed = (id: string) => id === 'start' || row.levels[id]?.passedAt != null;
		const states: Record<string, 'done' | 'open' | 'locked'> = {};
		for (const n of CH.nodes) {
			if (n.kind === 'start') {
				states[n.id] = 'done';
				continue;
			}
			const reached = CH.edges.some(([a, b]) => b === n.id && passed(a));
			const stationDone = (n.kind === 'gear' && row.prep.gear) || (n.kind === 'news' && row.prep.news) || (n.kind === 'shelf' && row.prep.guide);
			states[n.id] = !reached ? 'locked' : (passed(n.id) && (n.kind === 'level' || n.kind === 'boss')) || stationDone ? 'done' : 'open';
		}
		return states;
	}

	// The level's 3 books and the recommended first one (numbers.json shelfRule).
	private shelfOf(node: QuestNode | undefined, cause: string | null, failStreak: number): { refs: string[]; book: QuestBook } {
		const refs = shelfFor(node?.shelf ?? [], cause ? bookForCause(cause)?.ref ?? null : null, failStreak);
		const book = bookByRef(refs[0] ?? '') ?? bookForCause('same-word') ?? QUEST_BOOKS[0];
		return { refs, book };
	}

	private lastFail(row: Row): { levelId: string; cause: string | null; failStreak: number } | null {
		let best: { levelId: string; at: string; cause: string | null; failStreak: number } | null = null;
		for (const [levelId, l] of Object.entries(row.levels)) {
			if ((l.failStreak ?? 0) > 0 && l.lastAt && (best == null || l.lastAt > best.at)) best = { levelId, at: l.lastAt, cause: l.lastCause ?? null, failStreak: l.failStreak ?? 0 };
		}
		return best;
	}

	public async show(userId: string) {
		const now = new Date();
		const row = await this.db.transaction(async em => {
			const r = await this.lock(em, userId, now);
			// the notice is shown once
			if (r.notice != null) await em.update(MiLojoQuest, { userId }, { notice: null });
			return r;
		});
		const [logs, wordbookLow] = await Promise.all([this.todayLogs(this.db, userId, now), this.wordbookLow(userId, now)]);
		return this.pack(row, logs, now, wordbookLow);
	}

	// Exam date and the first-time walkthrough. Returns the same as show.
	public async settings(userId: string, p: { examDate?: string | null; onboarded?: boolean }) {
		const now = new Date();
		if (p.examDate != null && !examDateOk(p.examDate, dayOf(now))) throw new ApiError(lojoQuestErrors.invalidExamDate);
		await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			if (p.examDate !== undefined) row.examDate = p.examDate;
			if (p.onboarded !== undefined) row.onboarded = p.onboarded;
			await this.save(em, row, now);
		});
		return this.show(userId);
	}

	private pack(row: Row, logs: MiLojoQuestLog[], now: Date, wordbookLow: boolean) {
		const today = dayOf(now);
		const s = streakNow(row, today);
		const states = this.nodeStates(row);
		const fail = this.lastFail(row);
		const failNode = fail ? nodeOf(fail.levelId) : undefined;
		const shelf = fail ? this.shelfOf(failNode, fail.cause, fail.failStreak) : null;
		const rec = shelf?.book ?? null;
		const lit = new Set(shelf?.refs ?? []);
		const checked = new Set(logs.filter(l => l.kind === 'check' && l.data.passed === true).map(l => l.ref));
		const refilled = { guide: logs.some(l => l.kind === 'refill' && l.ref === 'guide'), gear: logs.some(l => l.kind === 'refill' && l.ref === 'gear') };
		const prep = this.prepOf(row);
		const daysLeft = row.examDate ? Math.max(0, daysBetween(today, row.examDate)) : null;
		const passedDays: Record<string, string | undefined> = {};
		for (const id of LEVEL_ORDER) {
			const at = row.levels[id]?.passedAt;
			passedDays[id] = at ? dayOf(new Date(at)) : undefined;
		}
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
			badges: row.levels.boss?.passedAt ? [BADGE] : [],
			lastFail: fail ? { levelId: fail.levelId, cause: fail.cause, failStreak: fail.failStreak } : null,
			tutorId: lojoTutorIds()[0] ?? null,
			examDate: row.examDate,
			daysLeft,
			onboarded: row.onboarded,
			behind: behindOf({ order: LEVEL_ORDER, passed: passedDays, today, daysLeft }),
			notice: row.notice,
			chapter: {
				id: CH.id, version: CH.version, title: CH.title, band: CH.band, disclaimer: CH.disclaimer, boss: CH.boss,
				branches: CH.branches,
				edges: CH.edges,
				nodes: CH.nodes.map(n => {
					const l: MiLojoQuestLevel | undefined = row.levels[n.id];
					const isLevel = n.kind === 'level' || n.kind === 'boss';
					// 7 days untouched fades, 14 turns gray; a passed retest relights
					const age = l?.passedAt && l.lastAt ? ageOf(dayOf(new Date(l.lastAt)), today) : null;
					return {
						id: n.id, kind: n.kind, x: n.x, y: n.y, label: n.label, name: n.name, zh: n.zh, hint: n.zh, branch: n.branch,
						skill: n.skill, type: n.type, practice: n.practice, ask: n.ask, need: n.need, maxWrong: n.maxWrong,
						hashtags: n.hashtags, tags: n.hashtags, shelf: n.shelf.map(r => Number(r.slice(1))), heartCost: n.heartCost,
						gear: isLevel || n.kind === 'gear' ? gearPath(n.gear) : null, state: states[n.id],
						best: l?.best ?? null, tries: l?.tries ?? 0, failStreak: l?.failStreak ?? 0,
						stars: l?.stars ?? (l?.passedAt ? 1 : 0),
						age,
						retestable: n.retest && l?.passedAt != null && age != null,
					};
				}),
			},
			books: QUEST_BOOKS.map(b => {
				const g = bookGear(b, failNode?.gear, { wordbookLow, hearts: row.hearts });
				const gp = g ? gearPath(g) : null;
				return {
					no: b.no, ref: b.ref, id: b.id, slug: b.slug, spine: b.spine, title: b.title, summary: b.summary, kind: b.kind, evidence: b.evidence, color: b.color,
					app: b.app, verify: b.verify, path: guidePath(b), gear: gp, givesHeart: b.givesHeart && (gp?.givesHeart ?? false),
					quiz: b.quiz.map(q => ({ q: q.q, o: q.o })),
					checkedToday: checked.has(b.slug), inBag: row.bag.includes(b.slug), lit: lit.has(b.ref), recommended: rec?.no === b.no,
				};
			}),
		};
	}

	public async start(userId: string, levelId: string, retest = false) {
		const now = new Date();
		const node = nodeOf(levelId);
		if (node == null || (node.kind !== 'level' && node.kind !== 'boss') || node.pool == null) throw new ApiError(lojoQuestErrors.noSuchLevel);
		const pool = node.pool;
		return await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			const prev = row.levels[levelId] ?? {};
			const mode: Mode = retest ? 'retest' : node.kind === 'boss' ? 'boss' : node.practice ? 'practice' : 'level';
			if (this.nodeStates(row)[levelId] === 'locked') throw new ApiError(lojoQuestErrors.levelLocked);
			if (retest) {
				const age = prev.passedAt && prev.lastAt ? ageOf(dayOf(new Date(prev.lastAt)), dayOf(now)) : null;
				if (!node.retest || age == null) throw new ApiError(lojoQuestErrors.notRetestable);
			}
			if (mode === 'boss' && !(row.prep.guide && row.prep.gear && row.prep.news)) throw new ApiError(lojoQuestErrors.bossNotReady);
			const rules = rulesOf(node, mode);
			if (rules.heartCost > 0 && row.hearts <= 0) throw new ApiError(lojoQuestErrors.noHearts);
			await em.update(MiLojoQuestAttempt, { userId, status: 'open' }, { status: 'quit', endedAt: now });
			let qs: QuestQuestion[];
			let set: string | null = null;
			let setsUsed = prev.setsUsed ?? [];
			if (mode === 'retest') {
				qs = drawQuestions(pool, rules.total, prev.lastQs ?? []);
			} else {
				const picked = pickSet(pool, node.sets, rules.total, setsUsed, prev.lastQs ?? []);
				qs = picked.questions;
				set = picked.set;
				setsUsed = picked.used;
			}
			const attempt = { id: this.idService.gen(now.getTime()), userId, levelId, questionIds: qs.map(q => q.id), answers: [], status: 'open', mode, createdAt: now, endedAt: null, askedTutor: false };
			await em.insert(MiLojoQuestAttempt, attempt);
			row.levels = { ...row.levels, [levelId]: { ...prev, lastQs: attempt.questionIds, setsUsed } };
			await this.save(em, row, now);
			return {
				attemptId: attempt.id,
				levelId,
				mode,
				kind: node.kind,
				practice: node.practice,
				set,
				need: rules.need,
				total: qs.length,
				maxWrong: rules.maxWrong,
				heartCost: rules.heartCost,
				hp: mode === 'boss' ? CH.boss.hp : null,
				hint: node.zh,
				hearts: row.hearts,
				questions: qs.map(publicQuestion),
			};
		});
	}

	// The current question's recording, made by the server's voices (each line once, shared by every learner). Without
	// speech (no key, the day's quota used, an error) the script comes back to show as text instead.
	public async audio(userId: string, attemptId: string, qid: string) {
		const at = await this.db.getRepository(MiLojoQuestAttempt).findOneBy({ id: attemptId, userId });
		if (at == null || at.status !== 'open') throw new ApiError(lojoQuestErrors.noSuchAttempt);
		if (at.questionIds[at.answers.length] !== qid) throw new ApiError(lojoQuestErrors.wrongQuestion);
		const node = nodeOf(at.levelId);
		const q = questionOf(node, qid);
		if (q?.audio == null) throw new ApiError(lojoQuestErrors.noAudio);
		const { voices, rate, lines } = q.audio;
		// 文字稿的说话人：一个人念的不标；两个人对话标 Woman / Man（按声音），认不出来就照原样
		const solo = new Set(lines.map(l => l.who)).size <= 1;
		const whoOf = (who: string) => {
			if (solo) return '';
			const label = lojoVoices.find(v => v.id === voices[who])?.label ?? '';
			return label.startsWith('女声') ? 'Woman' : label.startsWith('男声') ? 'Man' : who;
		};
		// 没有录音时：选择、判断题给文字稿；填空题的文字稿会把答案露出来，所以这题跳过，换同一关没出过的一道，不记对错、不扣心
		const noSpeech = async () => {
			if (q.type !== 'gap') return { lines: [] as { who: string; url: string }[], rate, fallback: lines.map(l => ({ who: whoOf(l.who), text: l.text })) };
			const pool = node?.pool ?? [];
			const left = pool.filter(x => !at.questionIds.includes(x.id));
			const pick = shuffle(left.filter(x => x.audio == null))[0] ?? shuffle(left)[0] ?? null;
			if (pick == null) return { lines: [] as { who: string; url: string }[], rate, skip: { next: null } };
			const ids = [...at.questionIds];
			ids[at.answers.length] = pick.id;
			const res = await this.db.getRepository(MiLojoQuestAttempt).update({ id: at.id, userId, status: 'open' }, { questionIds: ids });
			if (!res.affected) throw new ApiError(lojoQuestErrors.noSuchAttempt);
			return { lines: [] as { who: string; url: string }[], rate, skip: { next: publicQuestion(pick) } };
		};
		if (!this.lojoSpeechService.available) return await noSpeech();
		try {
			const out: { who: string; url: string }[] = [];
			for (const l of lines) {
				const v = voices[l.who];
				const voice = v != null && (lojoVoiceIds as readonly string[]).includes(v) ? v : lojoDefaultVoice;
				// 合成偶尔连不上（网络抖一下），先重试一次再退回文字稿：文字稿会把填空题的答案露出来
				const file = await this.lojoSpeechService.speakFile(l.text, voice, { speed: rate })
					.catch(() => this.lojoSpeechService.speakFile(l.text, voice, { speed: rate }));
				out.push({ who: l.who, url: this.driveFileEntityService.getPublicUrl(file) });
			}
			return { lines: out, rate };
		} catch {
			return await noSpeech();
		}
	}

	public async answer(userId: string, attemptId: string, qid: string, given: string) {
		const now = new Date();
		return await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			const at = await em.findOne(MiLojoQuestAttempt, { where: { id: attemptId, userId }, lock: { mode: 'pessimistic_write' } });
			if (at == null || at.status !== 'open') throw new ApiError(lojoQuestErrors.noSuchAttempt);
			const node = nodeOf(at.levelId);
			if (at.questionIds[at.answers.length] !== qid) throw new ApiError(lojoQuestErrors.wrongQuestion);
			const q = questionOf(node, qid);
			if (node == null || q == null) throw new ApiError(lojoQuestErrors.noSuchAttempt);
			const mode = at.mode as Mode;
			const rules = rulesOf(node, mode);
			const correct = judge(q, given);
			const cause = correct ? null : wrongCause(q, given);
			at.answers = [...at.answers, { qid, given: given.slice(0, 200), correct, cause }];
			let heartLost = false;
			if (!correct && rules.heartCost > 0 && row.hearts > 0) {
				this.setHearts(row, row.hearts - rules.heartCost, now);
				heartLost = true;
				await this.log(em, userId, now, { kind: 'wrong', ref: at.levelId, hearts: -rules.heartCost, xp: 0, data: { qid, cause } });
			}
			const right = at.answers.filter(a => a.correct).length;
			const wrong = at.answers.length - right;
			// the Boss is lost when hearts run out; a level just goes on (0 hearts only stops the next start)
			const outOfHearts = mode === 'boss' && row.hearts <= 0 && !correct;
			let ended: null | 'passed' | 'failed' = null;
			if (right >= rules.need) ended = 'passed';
			else if (wrong >= rules.maxWrong || outOfHearts || at.answers.length >= at.questionIds.length) ended = 'failed';

			let end = null;
			if (ended) {
				at.status = ended;
				at.endedAt = now;
				end = await this.finish(em, row, at, node, ended === 'passed', now, outOfHearts);
			}
			await em.update(MiLojoQuestAttempt, { id: at.id }, { answers: at.answers, status: at.status, endedAt: at.endedAt });
			await this.save(em, row, now);
			return {
				correct, answer: displayAnswer(q), why: q.why, evidence: q.evidence, cause, heartLost, hearts: row.hearts,
				progress: { answered: at.answers.length, right, wrong, need: rules.need, maxWrong: rules.maxWrong, total: at.questionIds.length },
				end,
			};
		});
	}

	private async finish(em: EntityManager, row: Row, at: MiLojoQuestAttempt, node: QuestNode, passed: boolean, now: Date, outOfHearts: boolean) {
		const today = dayOf(now);
		const mode = at.mode as Mode;
		const retest = mode === 'retest';
		const rules = rulesOf(node, mode);
		const prev: MiLojoQuestLevel = row.levels[at.levelId] ?? {};
		const right = at.answers.filter(a => a.correct).length;
		const causes = at.answers.filter(a => !a.correct && a.cause != null).map(a => a.cause!);
		const main = mainCause(causes);
		const perfect = passed && right === at.questionIds.length && at.answers.every(a => a.correct);
		const firstPass = passed && !retest && prev.passedAt == null;
		let level: MiLojoQuestLevel;
		if (retest) {
			// a passed retest relights the level and adds a star; a failed one changes nothing
			level = passed ? { ...prev, lastAt: now.toISOString(), stars: starsAfter(prev.stars ?? 1, { retest: true, perfect }) } : prev;
		} else {
			level = {
				...prev,
				lastAt: now.toISOString(),
				tries: (prev.tries ?? 0) + 1,
				best: Math.max(prev.best ?? 0, right),
				failStreak: passed ? 0 : (prev.failStreak ?? 0) + 1,
				lastCause: passed ? undefined : main ?? undefined,
				prevCause: passed ? undefined : prev.lastCause,
				stars: passed ? starsAfter(prev.stars ?? 0, { retest: false, perfect }) : prev.stars ?? 0,
				...(firstPass ? { passedAt: now.toISOString() } : {}),
			};
		}
		row.levels = { ...row.levels, [at.levelId]: level };
		let xp = 0;
		let chest: { xp: number; freeze: boolean; preview: string | null } | null = null;
		let sideChest: { xp: number; freeze: boolean } | null = null;
		let badge: string | null = null;
		let streak = null;
		let prepReset = false;
		if (mode === 'boss') {
			if (passed) {
				xp = firstPass ? XP.bossWin : REPLAY_XP;
				row.bossLosses = 0;
				if (firstPass) {
					xp += N.chest.chapterClear.xp;
					badge = BADGE;
				}
			} else {
				row.bossLosses += 1;
				// 连输两次，备战清零
				if (row.bossLosses >= N.boss.resetPrepAfterLossesInARow) {
					row.prep = {};
					row.bossLosses = 0;
					prepReset = true;
				}
			}
			await this.log(em, row.userId, now, { kind: 'boss', ref: passed ? 'won' : 'lost', hearts: 0, xp, data: { attemptId: at.id, prepReset, badge } });
		} else if (passed) {
			xp = retest ? XP.retestPass : !firstPass ? REPLAY_XP : mode === 'practice' ? XP.practicePass : XP.levelPass + (perfect ? XP.perfectBonus : 0);
			await this.log(em, row.userId, now, { kind: retest ? 'retest' : 'pass', ref: at.levelId, hearts: 0, xp, data: { attemptId: at.id, first: firstPass, perfect } });
		}
		if (passed) {
			// 支线宝箱: the first pass of 1-12, XP and a freeze card when below the max
			const side = N.chest.sideQuest;
			if (firstPass && at.levelId === side.at) {
				const freeze = row.freezes < MAX_FREEZES;
				if (freeze) row.freezes += 1;
				sideChest = { xp: side.xp, freeze };
				await this.log(em, row.userId, now, { kind: 'chest', ref: `side:${at.levelId}`, hearts: 0, xp: side.xp, data: { freeze } });
				xp += side.xp;
			}
			// 每天第一次过关开宝箱：经验；10% 多一张冻结卡（满了不出），20% 给一本这关书屋里的锦囊预览
			if (row.chestDay !== today) {
				const daily = N.chest.dailyFirstWin;
				row.chestDay = today;
				const freezeChance = daily.bonus.find(b => b.item === 'freeze')?.chance ?? 0;
				const previewChance = daily.bonus.find(b => b.item === 'guide-preview')?.chance ?? 0;
				const freeze = row.freezes < MAX_FREEZES && Math.random() < freezeChance;
				if (freeze) row.freezes += 1;
				const books = node.shelf.map(bookByRef).filter((b): b is QuestBook => b != null);
				const preview = books.length > 0 && Math.random() < previewChance ? books[Math.floor(Math.random() * books.length)].slug : null;
				chest = { xp: daily.xp, freeze, preview };
				await this.log(em, row.userId, now, { kind: 'chest', ref: at.levelId, hearts: 0, xp: daily.xp, data: { freeze, preview } });
				xp += daily.xp;
			}
			row.xp += xp;
			streak = await this.streak(em, row, now);
		}
		const failStreak = level.failStreak ?? 0;
		return {
			passed, mode, right, total: at.questionIds.length, need: rules.need, outOfHearts,
			xp, stars: level.stars ?? 0, chest, sideChest, badge, streak, firstPass, failStreak, cause: main,
			bossLosses: row.bossLosses, prepReset, prep: this.prepOf(row),
			review: at.answers.map((a, i) => {
				const q = questionOf(node, a.qid);
				return {
					n: i + 1, qid: a.qid, correct: a.correct, given: q ? displayAnswer(q, a.given) : a.given,
					answer: q ? displayAnswer(q) : '', why: q?.why ?? '', evidence: q?.evidence ?? '', cause: a.cause,
				};
			}),
			recommended: passed ? null : (() => {
				const { book: b, refs } = this.shelfOf(node, main, failStreak);
				return { slug: b.slug, no: b.no, ref: b.ref, spine: b.spine, path: guidePath(b), shelf: refs.map(r => Number(r.slice(1))) };
			})(),
		};
	}

	public async check(userId: string, slug: string, answers: number[]) {
		const now = new Date();
		const book = bookOf(slug);
		if (book == null) throw new ApiError(lojoQuestErrors.noSuchBook);
		return await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			const logs = await this.todayLogs(em, userId, now);
			const results = book.quiz.map((q, i) => ({ correct: answers[i] === q.a, answer: q.a, why: q.why }));
			const right = results.filter(r => r.correct).length;
			const passed = right >= N.hearts.earnBack.guide.quizPassAt;
			const already = logs.some(l => l.kind === 'check' && l.ref === slug && l.data.passed === true);
			let refilled = false;
			let reason: string | null = null;
			let streak = null;
			if (!passed) reason = 'failed';
			else if (already) reason = 'duplicate';
			else {
				await this.log(em, userId, now, { kind: 'check', ref: slug, hearts: 0, xp: XP.guideQuizPass, data: { passed: true, right } });
				row.xp += XP.guideQuizPass;
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
			return { passed, right, refilled, reason, hearts: row.hearts, results, streak, prep: this.prepOf(row) };
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
			return { bag: row.bag, prep: this.prepOf(row) };
		});
	}

	// 情报: opening the timeline posts of the 情报站 ticks Boss prep. Never a heart.
	public async news(userId: string, levelId: string | null) {
		const now = new Date();
		return await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			// 看情报 +2 XP, once a day
			const logs = await this.todayLogs(em, userId, now);
			const xp = logs.some(l => l.kind === 'news' && l.xp > 0) ? 0 : XP.intelRead;
			row.prep = { ...row.prep, news: true };
			row.xp += xp;
			await this.log(em, userId, now, { kind: 'news', ref: levelId ?? '', hearts: 0, xp });
			await this.save(em, row, now);
			return { xp, prep: this.prepOf(row) };
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
			await this.log(em, userId, now, { kind: 'set', ref, hearts: 0, xp: XP.gearSet, data: { items, durationMs: p.durationMs } });
			row.xp += XP.gearSet;
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
		const node = nodeOf(at.levelId);
		if (node == null) throw new ApiError(lojoQuestErrors.noSuchAttempt);
		const level = row.levels[at.levelId] ?? {};
		const wrong: QuestWrong[] = [];
		at.answers.forEach((a, i) => {
			const q = questionOf(node, a.qid);
			if (a.correct || q == null) return;
			wrong.push({
				n: i + 1,
				question: [q.question, q.passage].filter(Boolean).join(' / ').slice(0, 200),
				evidence: q.evidence.slice(0, 300),
				picked: displayAnswer(q, a.given).slice(0, 120),
				answer: displayAnswer(q).slice(0, 120),
				cause: a.cause ?? q.cause ?? '',
				why: q.why.slice(0, 200),
			});
		});
		const main = mainCause(at.answers.filter(a => !a.correct && a.cause != null).map(a => a.cause!));
		// failing the same level again for the same main cause: 「同一个错又犯了」
		const failStreak = level.failStreak ?? 1;
		const cause: string | null = main != null && failStreak >= N.shelfRule.sameLevelFailsInARow.count && level.prevCause === main ? 'same-mistake-again' : main;
		const s = streakNow(row, dayOf(now));
		const refilledToday = { guide: logs.some(l => l.kind === 'refill' && l.ref === 'guide'), gear: logs.some(l => l.kind === 'refill' && l.ref === 'gear') };
		const { book } = this.shelfOf(node, main, failStreak);
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
			level: { id: node.id, name: node.name || node.label, kind: node.kind === 'boss' ? 'boss' : 'level', skill: node.skill ?? '', type: node.type ?? '' },
			result: { correct: at.answers.filter(a => a.correct).length, total: at.questionIds.length, needed: rulesOf(node, at.mode as Mode).need, passed: false, failStreak },
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
