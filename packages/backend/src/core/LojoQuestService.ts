/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DataSource, EntityManager, In, LessThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { MiLojoQuest, MiLojoQuestAttempt, MiLojoQuestContent, MiLojoQuestLog } from '@/models/LojoQuest.js';
import type { MiLojoQuestLevel, MiLojoQuestPlacement } from '@/models/LojoQuest.js';
import { MiLojoWordCard, MiLojoWordReview } from '@/models/LojoWord.js';
import { MiUser } from '@/models/User.js';
import { IdService } from '@/core/IdService.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import { LojoSpeechService } from '@/core/LojoSpeechService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { lojoTutorIds } from '@/misc/lojo-tutor.js';
import { lojoDefaultVoice, lojoVoiceIds, lojoVoices } from '@/misc/lojo-voices.js';
import { QUEST_NUMBERS } from '@/misc/lojo-quest-numbers.js';
import {
	questChapterOf, questChapters, questContentId, questContentProblems, questContentVersion, questFirstChapter, questNodeOf, questQuestionOf, setQuestContent,
} from '@/misc/lojo-quest-content.js';
import type { QuestChapter, QuestNode, QuestQuestion, QuestRules } from '@/misc/lojo-quest-types.js';
import { QUEST_BOOKS, bookForCause } from '@/misc/lojo-quest-books.js';
import type { QuestBook } from '@/misc/lojo-quest-books.js';
import {
	MAX_FREEZES, MAX_HEARTS, NO_HEART_APPS, REPLAY_XP, XP, addDays, ageOf, behindOf, bookGear, dayOf, daysBetween, displayAnswer, drawQuestions, examDateOk, gearPath,
	grade, heartsNow, mainCause, nextRefillAt, pickSet, setCounts, settleStreak, shelfFor, shuffle, starsAfter, streakNow, touchStreak, wrongCause,
} from '@/misc/lojo-quest.js';
import type { QuestNext, QuestTry, QuestWrong } from '@/misc/lojo-tutor-quest.js';
import type { QuestMistakes, QuestProgressFacts } from '@/misc/lojo-tutor-progress.js';
import {
	PLACEMENT_COOLDOWN_DAYS, PLACEMENT_MAP, PLACEMENT_PARTS, PLACEMENT_VERSION, PLACEMENT_XP, gradePart, pathAfterFirst, publicPart, stationOf,
} from '@/misc/lojo-quest-placement.js';
import type { PlacementPath } from '@/misc/lojo-quest-placement.js';
import { ApiError } from '@/server/api/error.js';
import { lojoQuestErrors } from '@/server/api/lojo-schemas.js';

type Row = Omit<MiLojoQuest, 'user'>;
type Log = { kind: string; ref: string; hearts: number; xp: number; data?: Record<string, unknown> };
type Mode = 'practice' | 'level' | 'retest' | 'boss';

// 雅思四章。第二章起起点、Boss、三个站的 id 带章号（2-boss…），第一章照旧（存档里是 boss、start）。
// 题目和地图在数据库里（2026-11-12 起，misc/lojo-quest-content.ts）：导入的那一版，这个服务每几秒看一眼换没换。
const N = QUEST_NUMBERS;
const chapterOf = questChapterOf;
const nodeOf = questNodeOf;
const questionOf = (node: QuestNode | undefined, qid: string): QuestQuestion | undefined => questQuestionOf(node, qid);
// how often each process checks which version is in use (the one that imported switches at once)
const CONTENT_CHECK_MS = 5000;
const bookOf = (slug: string): QuestBook | undefined => QUEST_BOOKS.find(b => b.slug === slug);
const bookByRef = (ref: string): QuestBook | undefined => QUEST_BOOKS.find(b => b.ref === ref);
// 锦囊还没导进来的（j11 起）照 shelfRule 跳过
const knownRefs = (refs: readonly string[]) => refs.filter(r => bookByRef(r) != null);
// every level of a chapter in map order, the Boss last (for 落后提醒)
const questLevelName = (id: string): string => {
	const n = nodeOf(id);
	return n ? [n.kind === 'boss' ? `Boss ${n.label}` : n.label, n.name, n.zh ? `(${n.zh})` : null].filter(x => x).join(' ') : id;
};
const levelOrder = (c: QuestChapter) => c.nodes.filter(n => n.kind === 'level').map(n => n.id).concat(c.nodes.filter(n => n.kind === 'boss').map(n => n.id));
const BOARD_MIN_PLAYERS = 5;
// Boss 备战三项：第一章存档里是 guide / gear / news，第二章起带章号（c2:guide…）；extra = 连输后要多做的一项还没做
const PREP_ITEMS = ['guide', 'gear', 'news'] as const;
type PrepItem = typeof PREP_ITEMS[number] | 'extra';
const prepKey = (no: number, item: PrepItem) => (no === 1 ? item : `c${no}:${item}`);

// 限时关：服务器比页面多等这么久再判超时（网络慢、手机时钟差一点）
const TIME_GRACE_MS = 3000;

// 第一章在正式站的旧规矩（ch1-11a）：开关 1 颗心、备战 3 项全做、连输 2 次清零。11e 新规矩只在测试站，等创始人定。
function legacyCh1(r: QuestRules): QuestRules {
	return {
		...r,
		level: { ...r.level, minHeartsToStart: 1 },
		boss: { ...r.boss, prepRequired: r.boss.prepOf, extraPrepAfterLossesInARow: null, resetPrepAfterLossesInARow: 2 },
	};
}

// 生词本 today below this many cards: a 「去生词本」 gear goes to its fallback (错因对照表.json 规则)
const WORDBOOK_MIN = N.hearts.earnBack.gear.minItems;

const guidePath = (b: QuestBook) => `/guides/${b.slug}`;

// 先玩后注册 (冲刺1111 新手前三分钟 第 2–4 条): a visitor may play the first level without an account. The try is kept in
// redis for a few hours under a random id only the visitor's page has; nothing about the visitor is stored. Saving
// (存档 = signing up) moves the pass onto the new account (trialClaim).
const trialLevel = () => levelOrder(questFirstChapter())[0];
const TRIAL_TTL_S = 6 * 60 * 60;
const trialKey = (id: string) => `lojoQuestTrial:${id}`;
type Trial = { levelId: string; questionIds: string[]; answers: MiLojoQuestAttempt['answers']; status: string; mode: Mode; createdAt: string };

// need / maxWrong / total / heart cost of a try, from the node's chapter. Levels: 5 questions, 4 right passes, 2 wrong
// fails. Boss: 6, 5 hits (its hp) win, 2 wrong or no hearts lose. Retest: 3 from both sets, 2 right passes, no hearts.
function rulesOf(node: QuestNode, mode: Mode): { need: number; maxWrong: number; total: number; heartCost: number } {
	const R = chapterOf(node.ch).rules;
	if (mode === 'retest') {
		const r = R.retest;
		return { need: r.passAt, maxWrong: r.questions - r.passAt + 1, total: r.questions, heartCost: r.heartCost };
	}
	if (mode === 'boss') return { need: R.boss.hp, maxWrong: R.boss.maxWrong, total: R.boss.total, heartCost: node.heartCost };
	return { need: R.level.need, maxWrong: R.level.maxWrong, total: R.level.ask, heartCost: node.heartCost };
}

// 限时关（第四章 4-6、Boss）：回测不限时
const timedOf = (node: QuestNode, mode: Mode) => (mode === 'retest' ? null : node.timed);
const deadlineOf = (node: QuestNode, at: { createdAt: Date }) => at.createdAt.getTime() + (node.timed?.totalSeconds ?? 0) * 1000;

// What the page gets about the clock: when it started and ends (server time), and the words to show.
function timerOf(node: QuestNode, mode: Mode, at: { createdAt: Date }, now: Date) {
	const t = timedOf(node, mode);
	if (t == null) return null;
	const endsAt = deadlineOf(node, at);
	return {
		totalSeconds: t.totalSeconds, warnAtSecondsLeft: t.warnAtSecondsLeft, card: t.card,
		startedAt: at.createdAt.toISOString(), endsAt: new Date(endsAt).toISOString(), now: now.toISOString(),
		secondsLeft: Math.max(0, Math.ceil((endsAt - now.getTime()) / 1000)),
		copy: chapterOf(node.ch).rules.timedCopy,
	};
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
		pick: q.pick, playOnce: q.playOnce, lecture: q.lecture,
	};
}

// 闯关: hearts, streak, levels, 补心 and the Boss for a learner. Rules in misc/lojo-quest.ts, chapters imported into the database (misc/lojo-quest-content.ts).
@Injectable()
export class LojoQuestService implements OnModuleInit, OnApplicationShutdown {
	// 闯关定级 is on the test site only for now (11-11): its recording is still the browser reading a script, so the
	// answers are in what the page gets. On the live site the banner and menu item stay hidden and no paper is served.
	private placementOn: boolean;
	// 正式站：只开第一章（第二章起挡在门口卡后面，创始人 11-11 定），第一章用旧规矩
	private live: boolean;

	constructor(
		@Inject(DI.config)
		private config: Config,
		@Inject(DI.db)
		private db: DataSource,
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		private idService: IdService,
		private lojoTutorService: LojoTutorService,
		private lojoSpeechService: LojoSpeechService,
		private driveFileEntityService: DriveFileEntityService,
	) {
		// Mia's follow-ups after "Ask Mia" go by the hearts now, not the ones stored with the try.
		this.lojoTutorService.questHearts = userId => this.heartsFor(userId);
		// Mia's progress card and her "what went wrong on that level" lookup read the map from here, without the model.
		this.lojoTutorService.questProgress = userId => this.progressFacts(userId);
		this.lojoTutorService.questMistakes = (userId, levelId) => this.levelMistakes(userId, levelId);
		this.live = new URL(this.config.url).hostname === 'app.vibes.college';
		this.placementOn = !this.live;
	}

	/* ---------- the levels and questions: imported into the database, a version per import ---------- */

	private contentTimer: NodeJS.Timeout | null = null;

	async onModuleInit(): Promise<void> {
		await this.refreshContent().catch(() => { /* table not there yet (before the migration): the timer tries again */ });
		this.contentTimer = setInterval(() => void this.refreshContent().catch(() => {}), CONTENT_CHECK_MS);
		this.contentTimer.unref();
	}

	onApplicationShutdown(): void {
		if (this.contentTimer) clearInterval(this.contentTimer);
		this.contentTimer = null;
	}

	// Load the active version if it is not the one in memory. One small query; the chapters only when they changed.
	public async refreshContent(): Promise<void> {
		const repo = this.db.getRepository(MiLojoQuestContent);
		const head = await repo.findOne({ where: { active: true }, select: { id: true }, order: { id: 'DESC' } });
		if (head == null || head.id === questContentId()) return;
		const row = await repo.findOneByOrFail({ id: head.id });
		setQuestContent(row.id, row.version, row.chapters);
	}

	// Level and Boss ids a new version must keep: what learners' saves point at, and every level of the version in use.
	private async savedLevelIds(): Promise<string[]> {
		const saved: { id: string }[] = await this.db.query('SELECT DISTINCT jsonb_object_keys("levels") AS "id" FROM "lojo_quest"');
		return saved.map(r => r.id);
	}

	private async keptLevelIds(): Promise<string[]> {
		const inUse = questContentId() == null ? [] : questChapters().flatMap(c => c.nodes.filter(n => n.kind === 'level' || n.kind === 'boss').map(n => n.id));
		return [...new Set([...await this.savedLevelIds(), ...inUse])];
	}

	// Check a batch of chapters and, if every check passes, make it the version in use. Nothing is written otherwise.
	public async importContent(chapters: unknown, note: string): Promise<{ id: number; version: string; chapters: number; questions: number } | { problems: string[] }> {
		await this.refreshContent();
		const problems = questContentProblems(chapters, await this.keptLevelIds());
		if (problems.length > 0) return { problems };
		const list = (chapters as QuestChapter[]).slice().sort((a, b) => a.no - b.no);
		const version = list.map(c => c.version).join('+').slice(0, 256);
		const id = await this.db.transaction(async em => {
			await em.query('LOCK TABLE "lojo_quest_content" IN EXCLUSIVE MODE');
			await em.update(MiLojoQuestContent, { active: true }, { active: false });
			const saved = await em.save(MiLojoQuestContent, em.create(MiLojoQuestContent, { version, chapters: list, active: true, createdAt: new Date(), note: note.slice(0, 512) }));
			return saved.id;
		});
		setQuestContent(id, version, list);
		return { id, version, chapters: list.length, questions: list.reduce((s, c) => s + c.nodes.reduce((t, n) => t + (n.pool?.length ?? 0), 0), 0) };
	}

	// Go back to the version before the one in use (or to a given one). The newer row stays, so it can be put back.
	public async rollbackContent(to: number | null): Promise<{ id: number; version: string; from: number | null } | { problems: string[] }> {
		await this.refreshContent();
		const repo = this.db.getRepository(MiLojoQuestContent);
		const current = questContentId();
		const target = to != null
			? await repo.findOneBy({ id: to })
			: current == null ? null : await repo.findOne({ where: { id: LessThan(current) }, order: { id: 'DESC' } });
		if (target == null) return { problems: [to != null ? `没有版本 ${to}` : '没有更早的版本可以退回'] };
		// going back may drop levels the newer version added, but never one a learner has progress on
		const problems = questContentProblems(target.chapters, await this.savedLevelIds());
		if (problems.length > 0) return { problems };
		await this.db.transaction(async em => {
			await em.query('LOCK TABLE "lojo_quest_content" IN EXCLUSIVE MODE');
			await em.update(MiLojoQuestContent, { active: true }, { active: false });
			await em.update(MiLojoQuestContent, { id: target.id }, { active: true });
		});
		setQuestContent(target.id, target.version, target.chapters);
		return { id: target.id, version: target.version, from: current };
	}

	// Every version, newest first, for the import script's list
	public async contentVersions(): Promise<{ id: number; version: string; active: boolean; createdAt: string; note: string }[]> {
		const rows = await this.db.getRepository(MiLojoQuestContent).find({ select: { id: true, version: true, active: true, createdAt: true, note: true }, order: { id: 'DESC' }, take: 30 });
		return rows.map(r => ({ id: r.id, version: r.version, active: r.active, createdAt: r.createdAt.toISOString(), note: r.note }));
	}

	public contentInUse(): { id: number | null; version: string | null } {
		return { id: questContentId(), version: questContentVersion() };
	}

	// A chapter's rules on this site
	private rulesFor(no: number): QuestRules {
		const r = chapterOf(no).rules;
		return this.live && no === 1 ? legacyCh1(r) : r;
	}

	// numbers.json unlock: 第一章总是开着；第二章打赢第一章 Boss（或定级到第二章）开；第三、四章打赢上一章 Boss 开。
	// 正式站第二章起都不开。
	private chapterOpen(row: Row, no: number): boolean {
		if (no === 1) return true;
		if (this.live) return false;
		if (no === 2 && (row.placement?.ch2?.length ?? 0) > 0) return true;
		return row.levels[chapterOf(no - 1).bossId]?.passedAt != null;
	}

	private bossBeaten(row: Row, no: number): boolean {
		return row.levels[chapterOf(no).bossId]?.passedAt != null;
	}

	// Doing a prep item (a guide, a gear set, a timeline post) ticks it for every open chapter whose Boss is not beaten
	// yet (第一章 always, as before), and does the one more item asked after losses in a row.
	private tickPrep(row: Row, item: typeof PREP_ITEMS[number]): void {
		const next = { ...row.prep };
		for (const c of questChapters()) {
			if (c.no !== 1 && (!this.chapterOpen(row, c.no) || this.bossBeaten(row, c.no))) continue;
			next[prepKey(c.no, item)] = true;
			delete next[prepKey(c.no, 'extra')];
		}
		row.prep = next;
	}

	private bossReady(row: Row, no: number): boolean {
		if (no === 1 && row.placement?.prepWaived) return true;
		const p = this.prepOf(row, no);
		const done = [p.guide, p.gear, p.news].filter(x => x).length;
		return done >= this.rulesFor(no).boss.prepRequired && !p.extra;
	}

	// The chapter a learner is on now: the first open one whose Boss is not beaten, else the last open one.
	private currentChapter(row: Row): QuestChapter {
		const open = questChapters().filter(c => this.chapterOpen(row, c.no));
		return open.find(c => !this.bossBeaten(row, c.no)) ?? open[open.length - 1] ?? questFirstChapter();
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
			prep: {}, bossLosses: 0, levels: {}, bag: [], chestDay: null, examDate: null, onboarded: false, trial: false, notice: null, placement: null, createdAt: now, updatedAt: now,
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

	// em null: a visitor's 1-1 (先玩后注册), worked out but not written anywhere
	private async log(em: EntityManager | null, userId: string, now: Date, entry: Log): Promise<void> {
		if (em == null) return;
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
	private async streak(em: EntityManager | null, row: Row, now: Date): Promise<{ days: number; changed: boolean; usedFreezes: number; gotFreeze: boolean }> {
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

	private prepOf(row: Row, no = 1) {
		const k = (item: PrepItem) => !!row.prep[prepKey(no, item)];
		return { guide: k('guide'), gear: k('gear'), news: k('news'), extra: k('extra') };
	}

	// Which nodes are open (numbers.json unlock): a node opens when the from of any line into it is passed (the start
	// counts as passed); stations never block and are done once their Boss prep item is. The Boss opens with 1-6 passed
	// and can be started once prep is done.
	private nodeStates(row: Row): Record<string, 'done' | 'open' | 'locked'> {
		const states: Record<string, 'done' | 'open' | 'locked'> = {};
		for (const c of questChapters()) {
			const open = this.chapterOpen(row, c.no);
			const prep = this.prepOf(row, c.no);
			const passed = (id: string) => id === c.startId || row.levels[id]?.passedAt != null;
			for (const n of c.nodes) {
				if (!open) {
					states[n.id] = 'locked';
					continue;
				}
				if (n.kind === 'start') {
					states[n.id] = 'done';
					continue;
				}
				const reached = c.edges.some(([a, b]) => b === n.id && passed(a));
				const stationDone = (n.kind === 'gear' && prep.gear) || (n.kind === 'news' && prep.news) || (n.kind === 'shelf' && prep.guide);
				states[n.id] = !reached ? 'locked' : (passed(n.id) && (n.kind === 'level' || n.kind === 'boss')) || stationDone ? 'done' : 'open';
			}
		}
		return states;
	}

	// The level's 3 books and the recommended first one (numbers.json shelfRule).
	// A level may name the book for a cause (第四章 4-8: vocab → j31); books not in yet are skipped.
	private shelfOf(node: QuestNode | undefined, cause: string | null, failStreak: number): { refs: string[]; book: QuestBook } {
		const guide = cause ? node?.causeGuide?.[cause] : undefined;
		const causeRef = guide != null && bookByRef(guide) != null ? guide : cause ? bookForCause(cause)?.ref ?? null : null;
		const refs = shelfFor(knownRefs(node?.shelf ?? []), causeRef, failStreak);
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

	// Where a learner is on the map, for Mia's progress card (misc/lojo-tutor-progress.ts). null: never opened the map.
	public async progressFacts(userId: string): Promise<QuestProgressFacts | null> {
		const row = await this.db.getRepository(MiLojoQuest).findOneBy({ userId });
		if (row == null) return null;
		const now = new Date();
		const cur = this.currentChapter(row);
		const states = this.nodeStates(row);
		const order = levelOrder(cur);
		const next = order.find(id => states[id] === 'open' && row.levels[id]?.passedAt == null) ?? null;
		const fail = this.lastFail(row);
		const touched = Object.values(row.levels).map(l => l.lastAt ?? l.passedAt ?? '').filter(x => x !== '').sort().at(-1);
		return {
			chapter: { no: cur.no, title: cur.title },
			passed: order.filter(id => row.levels[id]?.passedAt != null).length,
			total: order.length,
			bossBeaten: this.bossBeaten(row, cur.no),
			next: next ? questLevelName(next) : null,
			hearts: heartsNow(row.hearts, row.heartsAt, now),
			maxHearts: MAX_HEARTS,
			streakDays: streakNow(row, dayOf(now)).days,
			lastFail: fail ? { level: questLevelName(fail.levelId), cause: fail.cause, inARow: fail.failStreak, at: row.levels[fail.levelId]?.lastAt ?? null } : null,
			updatedAt: touched ?? row.heartsAt.toISOString(),
		};
	}

	// The wrong answers of a learner's last three finished tries on a level (or on the last level they failed): the
	// question and why it was wrong, never the right answer.
	public async levelMistakes(userId: string, levelId: string | null): Promise<QuestMistakes | null> {
		let id = levelId;
		if (id == null) {
			const row = await this.db.getRepository(MiLojoQuest).findOneBy({ userId });
			id = row ? this.lastFail(row)?.levelId ?? null : null;
		}
		const node = id ? nodeOf(id) : undefined;
		if (id == null || node == null) return null;
		const tries = await this.db.getRepository(MiLojoQuestAttempt).find({ where: { userId, levelId: id, status: In(['passed', 'failed']) }, order: { createdAt: 'DESC' }, take: 3 });
		return {
			level: questLevelName(id),
			tries: tries.map(t => ({
				at: (t.endedAt ?? t.createdAt).toISOString(),
				passed: t.status === 'passed',
				wrong: t.answers.filter(a => !a.correct && !a.half).slice(0, 5).map(a => ({
					question: (questionOf(node, a.qid)?.question ?? a.qid).replace(/\s+/g, ' ').slice(0, 120),
					cause: a.timeout ? 'time-out' : a.cause,
				})),
			})),
		};
	}

	public async show(userId: string) {
		const now = new Date();
		const row = await this.db.transaction(async em => {
			const r = await this.lock(em, userId, now);
			// the notice is shown once
			if (r.notice != null) await em.update(MiLojoQuest, { userId }, { notice: null });
			return r;
		});
		const [logs, wordbookLow, openTimed] = await Promise.all([this.todayLogs(this.db, userId, now), this.wordbookLow(userId, now), this.openTimed(userId)]);
		return this.pack(row, logs, now, wordbookLow, openTimed);
	}

	// A timed try still open (the page was reloaded or put away): the page goes back into it, the clock still running.
	private async openTimed(userId: string): Promise<{ attemptId: string; levelId: string; endsAt: string } | null> {
		const at = await this.db.getRepository(MiLojoQuestAttempt).findOne({ where: { userId, status: 'open' }, order: { createdAt: 'DESC' } });
		const node = at ? nodeOf(at.levelId) : undefined;
		if (at == null || node == null || timedOf(node, at.mode as Mode) == null) return null;
		return { attemptId: at.id, levelId: at.levelId, endsAt: new Date(deadlineOf(node, at)).toISOString() };
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

	// One chapter for the map: its nodes and states (never the questions), whether it is open, Boss prep and the rules
	// the page shows.
	private packChapter(c: QuestChapter, row: Row, states: Record<string, 'done' | 'open' | 'locked'>, today: string) {
		const R = this.rulesFor(c.no);
		return {
			id: c.id, no: c.no, version: c.version, title: c.title, band: c.band,
			// 页面上不再写「练习难度，不是官方分数」（创始人 11-10 删说明小字）；字段留着，免得改接口
			disclaimer: '', boss: c.boss,
			bossId: c.bossId, startId: c.startId,
			open: this.chapterOpen(row, c.no),
			beaten: this.bossBeaten(row, c.no),
			prep: this.prepOf(row, c.no),
			bossReady: this.bossReady(row, c.no),
			bossLosses: row.levels[c.bossId]?.failStreak ?? 0,
			rules: {
				minHeartsToStart: R.level.minHeartsToStart, minHeartsToStartPractice: R.level.minHeartsToStartPractice, lowHeartsButton: R.level.lowHeartsButton,
				prepRequired: R.boss.prepRequired, prepOf: R.boss.prepOf, prep: R.boss.prep,
				extraPrepAfterLossesInARow: R.boss.extraPrepAfterLossesInARow, resetPrepAfterLossesInARow: R.boss.resetPrepAfterLossesInARow,
				multi: R.multi, timedCopy: R.timedCopy,
			},
			branches: c.branches,
			edges: c.edges,
			nodes: c.nodes.map(n => {
				const l: MiLojoQuestLevel | undefined = row.levels[n.id];
				const isLevel = n.kind === 'level' || n.kind === 'boss';
				// 7 days untouched fades, 14 turns gray; a passed retest relights
				// a level lit by the placement test never fades: it was not played
				const age = l?.passedAt && l.lastAt && !l.placed ? ageOf(dayOf(new Date(l.lastAt)), today) : null;
				return {
					id: n.id, ch: n.ch, kind: n.kind, x: n.x, y: n.y, label: n.label, name: n.name, zh: n.zh, hint: n.zh, branch: n.branch,
					skill: n.skill, type: n.type, practice: n.practice, ask: n.ask, need: n.need, maxWrong: n.maxWrong,
					hashtags: n.hashtags, tags: n.hashtags, shelf: knownRefs(n.shelf).map(r => Number(r.slice(1))), heartCost: n.heartCost,
					gear: isLevel || n.kind === 'gear' ? gearPath(n.gear) : null, state: states[n.id],
					// 「补 1 颗心」去哪（语法关指到词汇线）、本关装备补不补心、两个按钮的字
					heartGear: isLevel ? gearPath(n.heartGear ?? n.gear) : null, gearGivesHeart: n.gearGivesHeart, gearButton: n.gearButton, heartButton: n.heartButton,
					keepOrder: n.keepOrder,
					timed: n.timed ? { totalSeconds: n.timed.totalSeconds, warnAtSecondsLeft: n.timed.warnAtSecondsLeft, card: n.timed.card } : null,
					best: l?.best ?? null, tries: l?.tries ?? 0, failStreak: l?.failStreak ?? 0,
					stars: l?.stars ?? (l?.passedAt ? 1 : 0),
					age,
					retestable: n.retest && l?.passedAt != null && age != null,
					placed: !!l?.placed,
				};
			}),
		};
	}

	private pack(row: Row, logs: MiLojoQuestLog[], now: Date, wordbookLow: boolean, openTimed: { attemptId: string; levelId: string; endsAt: string } | null = null) {
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
		const cur = this.currentChapter(row);
		const order = levelOrder(cur);
		const daysLeft = row.examDate ? Math.max(0, daysBetween(today, row.examDate)) : null;
		const passedDays: Record<string, string | undefined> = {};
		for (const id of order) {
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
			bossReady: this.bossReady(row, 1),
			prepWaived: !!row.placement?.prepWaived,
			placement: this.placementState(row, now),
			bossLosses: row.bossLosses,
			chestToday: row.chestDay === today,
			bag: row.bag,
			badges: questChapters().filter(c => this.bossBeaten(row, c.no)).map(c => c.rules.chest.badge),
			currentChapter: cur.no,
			lastFail: fail ? { levelId: fail.levelId, cause: fail.cause, failStreak: fail.failStreak } : null,
			tutorId: lojoTutorIds()[0] ?? null,
			examDate: row.examDate,
			daysLeft,
			onboarded: row.onboarded,
			behind: behindOf({ order, passed: passedDays, today, daysLeft }),
			notice: row.notice,
			chapter: this.packChapter(questFirstChapter(), row, states, today),
			// 四章（第二章起，正式站上是没开的铅笔稿）
			chapters: questChapters().map(c => this.packChapter(c, row, states, today)),
			openTimed,
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
		const R = this.rulesFor(node.ch);
		return await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			const prev = row.levels[levelId] ?? {};
			const mode: Mode = retest ? 'retest' : node.kind === 'boss' ? 'boss' : node.practice ? 'practice' : 'level';
			if (this.nodeStates(row)[levelId] === 'locked') throw new ApiError(lojoQuestErrors.levelLocked);
			// 限时关开着的那一局：重新加载、锁屏回来都接着打，钟不停；时间已经到了就收卷
			if (!retest && node.timed != null) {
				const open = await em.findOne(MiLojoQuestAttempt, { where: { userId, levelId, status: 'open' }, order: { createdAt: 'DESC' }, lock: { mode: 'pessimistic_write' } });
				if (open != null && open.mode === mode) {
					const resume = this.tryOut(open, node, mode, row, now);
					if (now.getTime() <= deadlineOf(node, open) + TIME_GRACE_MS) return { ...resume, resumed: true, answered: open.answers.length };
					const end = await this.expire(em, row, open, node, now);
					await this.save(em, row, now);
					return { ...resume, resumed: true, answered: open.answers.length, timeUp: end, hearts: row.hearts };
				}
			}
			if (retest) {
				const age = prev.passedAt && prev.lastAt ? ageOf(dayOf(new Date(prev.lastAt)), dayOf(now)) : null;
				if (!node.retest || age == null || prev.placed) throw new ApiError(lojoQuestErrors.notRetestable);
			}
			if (mode === 'boss' && !this.bossReady(row, node.ch)) throw new ApiError(lojoQuestErrors.bossNotReady);
			const rules = rulesOf(node, mode);
			// 开新关至少要几颗心（11e：普通关和 Boss 2 颗，练手关 0；正式站第一章照旧 1 颗）
			const minHearts = rules.heartCost > 0 ? (mode === 'practice' ? R.level.minHeartsToStartPractice : R.level.minHeartsToStart) : 0;
			if (minHearts > 0 && row.hearts < minHearts) throw new ApiError(lojoQuestErrors.noHearts);
			await em.update(MiLojoQuestAttempt, { userId, status: 'open' }, { status: 'quit', endedAt: now });
			let qs: QuestQuestion[];
			let set: string | null = null;
			let setsUsed = prev.setsUsed ?? [];
			if (mode === 'retest') {
				qs = drawQuestions(pool, rules.total, prev.lastQs ?? []);
				// 讲座切成几段的关：按原来的顺序
				if (node.keepOrder) qs = pool.filter(q => qs.includes(q));
			} else {
				const picked = pickSet(pool, node.sets, rules.total, setsUsed, prev.lastQs ?? []);
				qs = picked.questions;
				set = picked.set;
				setsUsed = picked.used;
				// 讲座（3-3）不打乱：几套都用过以后，换一整套，跟上一局不同的那套
				if (node.keepOrder && set == null) {
					const lastSet = pool.find(q => q.id === prev.lastQs?.[0])?.set;
					set = shuffle(node.sets.filter(x => x !== lastSet))[0] ?? node.sets[0];
					qs = pool.filter(q => q.set === set).slice(0, rules.total);
				}
			}
			const attempt = { id: this.idService.gen(now.getTime()), userId, levelId, questionIds: qs.map(q => q.id), answers: [], status: 'open', mode, createdAt: now, endedAt: null, askedTutor: false };
			await em.insert(MiLojoQuestAttempt, attempt);
			row.levels = { ...row.levels, [levelId]: { ...prev, lastQs: attempt.questionIds, setsUsed } };
			await this.save(em, row, now);
			return { ...this.tryOut(attempt, node, mode, row, now), set };
		});
	}

	// What the page gets when a try starts or is picked up again.
	private tryOut(at: Pick<MiLojoQuestAttempt, 'id' | 'levelId' | 'questionIds' | 'createdAt'>, node: QuestNode, mode: Mode, row: Row, now: Date) {
		const rules = rulesOf(node, mode);
		const qs = at.questionIds.map(id => questionOf(node, id)).filter((q): q is QuestQuestion => q != null);
		return {
			attemptId: at.id,
			levelId: at.levelId,
			ch: node.ch,
			mode,
			kind: node.kind,
			practice: node.practice,
			set: null as string | null,
			need: rules.need,
			total: qs.length,
			maxWrong: rules.maxWrong,
			heartCost: rules.heartCost,
			hp: mode === 'boss' ? chapterOf(node.ch).boss.hp : null,
			hint: node.zh,
			hearts: row.hearts,
			multi: chapterOf(node.ch).rules.multi,
			timer: timerOf(node, mode, at, now),
			questions: qs.map(publicQuestion),
		};
	}

	// 限时关时间到：没答的题按错算（错因 time-out）。普通关合起来扣 timeoutHeartCost 颗心；Boss 没答的不打中 Boss，
	// 每题扣 1 颗心，一局（连答错的）最多扣 maxHeartsPerTry 颗。The try ends as not passed.
	private async expire(em: EntityManager, row: Row, at: MiLojoQuestAttempt, node: QuestNode, now: Date) {
		const t = node.timed!;
		const mode = at.mode as Mode;
		const rules = rulesOf(node, mode);
		const left = at.questionIds.slice(at.answers.length);
		const wrongBefore = at.answers.filter(a => !a.correct && !a.half).length;
		at.answers = [...at.answers, ...left.map(qid => ({ qid, given: '', correct: false, cause: 'time-out', timeout: true }))];
		let lost = 0;
		if (rules.heartCost > 0 && left.length > 0) {
			if (mode === 'boss') {
				const cap = t.maxHeartsPerTry ?? Infinity;
				lost = Math.max(0, Math.min(left.length * t.heartPerUnanswered, cap - wrongBefore * rules.heartCost));
			} else {
				lost = t.timeoutHeartCost;
			}
			lost = Math.min(lost, row.hearts);
			if (lost > 0) {
				this.setHearts(row, row.hearts - lost, now);
				await this.log(em, row.userId, now, { kind: 'wrong', ref: at.levelId, hearts: -lost, xp: 0, data: { timeout: true, unanswered: left.length } });
			}
		}
		at.status = 'failed';
		at.endedAt = now;
		const end = await this.finish(em, row, at, node, false, now, false, { unanswered: left.length, heartsLost: lost });
		await em.update(MiLojoQuestAttempt, { id: at.id }, { answers: at.answers, status: at.status, endedAt: at.endedAt });
		return end;
	}

	// The page's clock reached 0: the server checks the time itself and hands the try in.
	public async timeUp(userId: string, attemptId: string) {
		const now = new Date();
		return await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			const at = await em.findOne(MiLojoQuestAttempt, { where: { id: attemptId, userId }, lock: { mode: 'pessimistic_write' } });
			const node = at ? nodeOf(at.levelId) : undefined;
			if (at == null || at.status !== 'open' || node == null || timedOf(node, at.mode as Mode) == null) throw new ApiError(lojoQuestErrors.noSuchAttempt);
			const left = deadlineOf(node, at) - now.getTime();
			// 页面的钟快了一点：还没到就告诉它还剩几秒
			if (left > 1500) return { timeUp: false, secondsLeft: Math.ceil(left / 1000), hearts: row.hearts, end: null };
			const end = await this.expire(em, row, at, node, now);
			await this.save(em, row, now);
			return { timeUp: true, secondsLeft: 0, hearts: row.hearts, end };
		});
	}

	// The current question's recording, made by the server's voices (each line once, shared by every learner). Without
	// speech (no key, the day's quota used, an error) the script comes back to show as text instead.
	public async audio(userId: string, attemptId: string, qid: string) {
		const at = await this.db.getRepository(MiLojoQuestAttempt).findOneBy({ id: attemptId, userId });
		if (at == null || at.status !== 'open') throw new ApiError(lojoQuestErrors.noSuchAttempt);
		return await this.speak(at, qid, async ids => {
			const res = await this.db.getRepository(MiLojoQuestAttempt).update({ id: at.id, userId, status: 'open' }, { questionIds: ids });
			return !!res.affected;
		});
	}

	// The recording of the try's current question; swap stores the try's questions when a gap question without speech is
	// swapped for another (false: the try is gone).
	private async speak(at: Pick<MiLojoQuestAttempt, 'levelId' | 'questionIds' | 'answers'>, qid: string, swap: (ids: string[]) => Promise<boolean>) {
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
			if (!await swap(ids)) throw new ApiError(lojoQuestErrors.noSuchAttempt);
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
			// 限时关：时间已经过了，这一题不算，直接收卷
			if (timedOf(node, mode) != null && now.getTime() > deadlineOf(node, at) + TIME_GRACE_MS) {
				const end = await this.expire(em, row, at, node, now);
				await this.save(em, row, now);
				const right = at.answers.filter(a => a.correct).length;
				return {
					correct: false, half: false, timeUp: true, answer: '', why: '', evidence: '', cause: 'time-out', heartLost: false, hearts: row.hearts,
					progress: { answered: at.answers.length, right, wrong: at.answers.length - right, need: rules.need, maxWrong: rules.maxWrong, total: at.questionIds.length },
					end,
				};
			}
			const g = grade(q, given);
			const correct = g === 'right';
			const half = g === 'half';
			const cause = correct ? null : wrongCause(q, given, chapterOf(node.ch).rules.multi?.oneRightCause);
			at.answers = [...at.answers, { qid, given: given.slice(0, 200), correct, cause, ...(half ? { half: true } : {}) }];
			let heartLost = false;
			// 选两个对一半：不扣心，Boss 也不打中
			if (g === 'wrong' && rules.heartCost > 0 && row.hearts > 0) {
				this.setHearts(row, row.hearts - rules.heartCost, now);
				heartLost = true;
				await this.log(em, userId, now, { kind: 'wrong', ref: at.levelId, hearts: -rules.heartCost, xp: 0, data: { qid, cause } });
			}
			const right = at.answers.filter(a => a.correct).length;
			const wrong = at.answers.filter(a => !a.correct && !a.half).length;
			// the Boss is lost when hearts run out; a level just goes on (0 hearts only stops the next start)
			const outOfHearts = mode === 'boss' && row.hearts <= 0 && g === 'wrong';
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
				correct, half, timeUp: false, answer: displayAnswer(q), why: q.why, evidence: q.evidence, cause, heartLost, hearts: row.hearts,
				progress: { answered: at.answers.length, right, wrong, need: rules.need, maxWrong: rules.maxWrong, total: at.questionIds.length },
				end,
			};
		});
	}

	private async finish(em: EntityManager | null, row: Row, at: MiLojoQuestAttempt, node: QuestNode, passed: boolean, now: Date, outOfHearts: boolean, timeUp: { unanswered: number; heartsLost: number } | null = null) {
		const today = dayOf(now);
		const mode = at.mode as Mode;
		const retest = mode === 'retest';
		const rules = rulesOf(node, mode);
		const chapter = chapterOf(node.ch);
		const R = this.rulesFor(node.ch);
		const prev: MiLojoQuestLevel = row.levels[at.levelId] ?? {};
		const right = at.answers.filter(a => a.correct).length;
		const causes = at.answers.filter(a => !a.correct && a.cause != null).map(a => a.cause!);
		const main = mainCause(causes, chapter.causeOrder);
		const perfect = passed && right === at.questionIds.length && at.answers.every(a => a.correct);
		// a level lit by the placement test: its first real pass is a first pass (定级规则 firstRealPassOnLitLevel)
		const firstPass = passed && !retest && (prev.passedAt == null || !!prev.placed);
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
				stars: passed ? starsAfter(prev.placed ? 0 : prev.stars ?? 0, { retest: false, perfect }) : prev.stars ?? 0,
				...(firstPass ? { passedAt: now.toISOString(), placed: undefined } : {}),
			};
		}
		row.levels = { ...row.levels, [at.levelId]: level };
		let xp = 0;
		let chest: { xp: number; freeze: boolean; preview: string | null } | null = null;
		let sideChest: { xp: number; freeze: boolean } | null = null;
		let badge: string | null = null;
		let streak = null;
		let prepReset = false;
		let prepExtra = false;
		if (mode === 'boss') {
			const ch1 = node.ch === 1;
			if (passed) {
				xp = firstPass ? XP.bossWin : REPLAY_XP;
				if (ch1) row.bossLosses = 0;
				if (ch1 && row.placement?.prepWaived) row.placement = { ...row.placement, prepWaived: false };
				if (firstPass) {
					xp += R.chest.clearXp;
					badge = R.chest.badge;
				}
			} else {
				if (ch1) row.bossLosses += 1;
				const losses = level.failStreak ?? 0;
				const reset = R.boss.resetPrepAfterLossesInARow;
				const extra = R.boss.extraPrepAfterLossesInARow;
				if (reset != null && ch1 && row.bossLosses >= reset) {
					// 正式站第一章的旧规矩：连输两次，备战清零（只清这一章的）
					const p = { ...row.prep };
					for (const item of PREP_ITEMS) delete p[prepKey(node.ch, item)];
					row.prep = p;
					row.bossLosses = 0;
					prepReset = true;
				} else if (extra != null && losses > 0 && losses % extra === 0) {
					// 11e：连输 2 次，多做 1 项备战，做过的不清空
					row.prep = { ...row.prep, [prepKey(node.ch, 'extra')]: true };
					prepExtra = true;
				}
				// 定级免备战 only holds until two losses in a row: then prep as usual
				if (ch1 && (prepReset || prepExtra) && row.placement?.prepWaived) row.placement = { ...row.placement, prepWaived: false };
			}
			await this.log(em, row.userId, now, { kind: 'boss', ref: passed ? 'won' : 'lost', hearts: 0, xp, data: { attemptId: at.id, prepReset, prepExtra, badge } });
		} else if (passed) {
			xp = retest ? XP.retestPass : !firstPass ? REPLAY_XP : mode === 'practice' ? XP.practicePass : XP.levelPass + (perfect ? XP.perfectBonus : 0);
			await this.log(em, row.userId, now, { kind: retest ? 'retest' : 'pass', ref: at.levelId, hearts: 0, xp, data: { attemptId: at.id, first: firstPass, perfect } });
		}
		if (passed) {
			// 支线宝箱: the first pass of N-12, XP and a freeze card when below the max
			if (firstPass && at.levelId === R.chest.sideAt) {
				const freeze = row.freezes < MAX_FREEZES;
				if (freeze) row.freezes += 1;
				sideChest = { xp: R.chest.sideXp, freeze };
				await this.log(em, row.userId, now, { kind: 'chest', ref: `side:${at.levelId}`, hearts: 0, xp: R.chest.sideXp, data: { freeze } });
				xp += R.chest.sideXp;
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
		const timed = timedOf(node, mode);
		return {
			passed, mode, ch: node.ch, right, total: at.questionIds.length, need: rules.need, outOfHearts,
			half: at.answers.filter(a => a.half).length,
			xp, stars: level.stars ?? 0, chest, sideChest, badge, streak, firstPass, failStreak, cause: main,
			bossLosses: mode === 'boss' && node.ch !== 1 ? failStreak : row.bossLosses, prepReset, prepExtra,
			prep: this.prepOf(row, node.ch), bossReady: this.bossReady(row, node.ch),
			// 限时关：用了多久（结算只写用时，不比上次）、是不是时间到收的卷
			timer: timed == null ? null : {
				elapsedSeconds: Math.min(timed.totalSeconds, Math.max(0, Math.round(((at.endedAt ?? now).getTime() - at.createdAt.getTime()) / 1000))),
				totalSeconds: timed.totalSeconds,
				timeUp: timeUp != null, unanswered: timeUp?.unanswered ?? 0, heartsLost: timeUp?.heartsLost ?? 0,
			},
			review: at.answers.map((a, i) => {
				const q = questionOf(node, a.qid);
				return {
					n: i + 1, qid: a.qid, correct: a.correct, half: !!a.half, timeout: !!a.timeout, given: q ? displayAnswer(q, a.given) : a.given,
					answer: q ? displayAnswer(q) : '', why: q?.why ?? '', evidence: q?.evidence ?? '', cause: a.cause,
				};
			}),
			recommended: passed ? null : (() => {
				const { book: b, refs } = this.shelfOf(node, main, failStreak);
				return { slug: b.slug, no: b.no, ref: b.ref, spine: b.spine, path: guidePath(b), shelf: refs.map(r => Number(r.slice(1))) };
			})(),
		};
	}

	private async trialGet(id: string): Promise<Trial | null> {
		if (!/^[A-Za-z0-9_-]{16,40}$/.test(id)) return null;
		const raw = await this.redisClient.get(trialKey(id));
		return raw == null ? null : JSON.parse(raw) as Trial;
	}

	private async trialPut(id: string, t: Trial): Promise<void> {
		await this.redisClient.set(trialKey(id), JSON.stringify(t), 'EX', TRIAL_TTL_S);
	}

	// What a visitor's map looks like: a new learner's, with the first level passed once the try in hand was passed.
	private async trialRow(id: string | null, now: Date): Promise<Row> {
		const row = this.newRow('trial', now);
		const t = id ? await this.trialGet(id) : null;
		const node = t ? nodeOf(t.levelId) : undefined;
		if (t?.status === 'passed' && node) await this.finish(null, row, { ...t, id, userId: 'trial', createdAt: new Date(t.createdAt), endedAt: now, askedTutor: false } as MiLojoQuestAttempt, node, true, now, false);
		return row;
	}

	public async trialShow(id: string | null) {
		const now = new Date();
		const row = await this.trialRow(id, now);
		return { ...this.pack(row, [], now, true), trial: true, trialLevel: trialLevel() };
	}

	public async trialStart() {
		const now = new Date();
		const node = nodeOf(trialLevel())!;
		const rules = rulesOf(node, 'practice');
		const { questions } = pickSet(node.pool ?? [], node.sets, rules.total, [], []);
		const id = randomBytes(18).toString('base64url');
		await this.trialPut(id, { levelId: node.id, questionIds: questions.map(q => q.id), answers: [], status: 'open', mode: 'practice', createdAt: now.toISOString() });
		return {
			attemptId: id, levelId: node.id, mode: 'practice', kind: node.kind, practice: true, set: null,
			need: rules.need, total: questions.length, maxWrong: rules.maxWrong, heartCost: 0, hp: null, hint: node.zh, hearts: MAX_HEARTS,
			questions: questions.map(publicQuestion),
		};
	}

	public async trialAudio(id: string, qid: string) {
		const t = await this.trialGet(id);
		if (t == null || t.status !== 'open') throw new ApiError(lojoQuestErrors.noSuchAttempt);
		return await this.speak(t, qid, async ids => {
			await this.trialPut(id, { ...t, questionIds: ids });
			return true;
		});
	}

	// Same judging as answer; no hearts (the first level is a practice level). At the end the result is worked out on a
	// new learner's row and shown, but only kept once the visitor saves.
	public async trialAnswer(id: string, qid: string, given: string) {
		const now = new Date();
		const t = await this.trialGet(id);
		if (t == null || t.status !== 'open') throw new ApiError(lojoQuestErrors.noSuchAttempt);
		const node = nodeOf(t.levelId);
		if (t.questionIds[t.answers.length] !== qid) throw new ApiError(lojoQuestErrors.wrongQuestion);
		const q = questionOf(node, qid);
		if (node == null || q == null) throw new ApiError(lojoQuestErrors.noSuchAttempt);
		const rules = rulesOf(node, t.mode);
		const correct = grade(q, given) === 'right';
		const cause = correct ? null : wrongCause(q, given);
		t.answers = [...t.answers, { qid, given: given.slice(0, 200), correct, cause }];
		const right = t.answers.filter(a => a.correct).length;
		const wrong = t.answers.length - right;
		const ended = right >= rules.need ? 'passed' : wrong >= rules.maxWrong || t.answers.length >= t.questionIds.length ? 'failed' : null;
		let end = null;
		if (ended) {
			t.status = ended;
			const at = { ...t, id, userId: 'trial', createdAt: new Date(t.createdAt), endedAt: now, askedTutor: false } as MiLojoQuestAttempt;
			end = await this.finish(null, this.newRow('trial', now), at, node, ended === 'passed', now, false);
		}
		await this.trialPut(id, t);
		return {
			correct, answer: displayAnswer(q), why: q.why, evidence: q.evidence, cause, heartLost: false, hearts: MAX_HEARTS,
			progress: { answered: t.answers.length, right, wrong, need: rules.need, maxWrong: rules.maxWrong, total: t.questionIds.length },
			end,
		};
	}

	// 存档: the visitor has just signed up; their passed first level becomes the account's (XP, chest, the first day of the
	// streak), they are marked as having played first (growth report), and the first-time walkthrough is not shown
	// (方案 第 5 条: on the first day the save card is the only pop-up). Returns the same as show.
	public async trialClaim(userId: string, id: string) {
		const now = new Date();
		const t = await this.trialGet(id);
		if (t == null || t.status !== 'passed') throw new ApiError(lojoQuestErrors.noSuchAttempt);
		const node = nodeOf(t.levelId);
		if (node == null) throw new ApiError(lojoQuestErrors.noSuchAttempt);
		await this.redisClient.del(trialKey(id));
		await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			if (row.levels[t.levelId]?.passedAt == null) {
				const at = { id: this.idService.gen(now.getTime()), userId, levelId: t.levelId, questionIds: t.questionIds, answers: t.answers, status: 'passed', mode: t.mode, createdAt: new Date(t.createdAt), endedAt: now, askedTutor: false };
				await em.insert(MiLojoQuestAttempt, at);
				await this.finish(em, row, at as MiLojoQuestAttempt, node, true, now, false);
				row.levels = { ...row.levels, [t.levelId]: { ...row.levels[t.levelId], lastQs: t.questionIds } };
				row.trial = true;
			}
			row.onboarded = true;
			await this.save(em, row, now);
		});
		return this.show(userId);
	}

	// 闯关定级: the banner (after saving, until closed, 1-2 first passed or one test done), whether a test can be taken
	// now (once in 30 days), the last result and the first part kept from a test quit in its second part.
	private placementState(row: Row, now: Date) {
		const p = row.placement ?? {};
		const nextAt = p.placedAt ? new Date(Date.parse(p.placedAt) + PLACEMENT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000) : null;
		const realPass = (id: string) => row.levels[id]?.passedAt != null && !row.levels[id]?.placed;
		return {
			version: PLACEMENT_VERSION,
			on: this.placementOn,
			banner: this.placementOn && row.onboarded && !p.dismissedAt && !p.placedAt && !realPass('1-2'),
			canTest: this.placementOn && (nextAt == null || nextAt <= now),
			lastAt: p.placedAt ?? null,
			nextAt: nextAt?.toISOString() ?? null,
			station: p.station ?? null,
			startAt: p.startAt ?? null,
			kept: p.part1 != null,
		};
	}

	private placementOpen(row: Row, now: Date) {
		const st = this.placementState(row, now);
		if (!st.canTest) throw new ApiError(lojoQuestErrors.placementTooSoon);
		return st;
	}

	// The test paper: the first part, or straight the second part when the first was handed in on a test quit later.
	public async placementPaper(userId: string) {
		if (!this.placementOn) throw new ApiError(lojoQuestErrors.placementTooSoon);
		const now = new Date();
		const row = await this.db.transaction(async em => this.lock(em, userId, now));
		const st = this.placementState(row, now);
		const kept = row.placement?.part1;
		return {
			...st,
			first: publicPart(PLACEMENT_PARTS.first, 1),
			second: st.canTest && kept ? publicPart(PLACEMENT_PARTS[kept.path as PlacementPath], 6) : null,
		};
	}

	// The first part handed in: judged here, kept (a quit in the second part does not lose it), and the second part
	// chosen by it goes back. Which part it is never shows on the page.
	public async placementFirst(userId: string, answers: string[]) {
		const now = new Date();
		return await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			this.placementOpen(row, now);
			const right = gradePart(PLACEMENT_PARTS.first, answers).filter(x => x).length;
			const path = pathAfterFirst(right);
			row.placement = { ...row.placement, part1: { right, path, at: now.toISOString() } };
			await this.save(em, row, now);
			return { second: publicPart(PLACEMENT_PARTS[path], 6) };
		});
	}

	// The second part handed in: the station from both parts, the levels before it lit (1 star, 0 XP, never taken
	// back), +20 XP and today's check-in, no hearts. Returns the result card and the map.
	public async placementFinish(userId: string, answers: string[]) {
		const now = new Date();
		const out = await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			this.placementOpen(row, now);
			const p1 = row.placement?.part1;
			if (p1 == null) throw new ApiError(lojoQuestErrors.placementNoFirstPart);
			const path = p1.path as PlacementPath;
			const total = p1.right + gradePart(PLACEMENT_PARTS[path], answers).filter(x => x).length;
			const station = stationOf(path, total);
			const map = PLACEMENT_MAP[station];
			const lit: string[] = [];
			const levels = { ...row.levels };
			// 1.6 起第二章前三关也点亮（第二章导入后，测试站）
			for (const id of [...map.lit, ...map.ch2.filter(x => nodeOf(x) != null)]) {
				if (levels[id]?.passedAt != null) continue;
				levels[id] = { ...levels[id], passedAt: now.toISOString(), lastAt: now.toISOString(), stars: 1, placed: true };
				lit.push(id);
			}
			row.levels = levels;
			// where to go now: the suggested level, or the first one after it not passed yet; the Boss when it is next
			const order = ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', 'boss'];
			const startIdx = map.startAt === '2-4' ? order.length - 1 : order.indexOf(map.startAt);
			const from = order.slice(startIdx).find(id => row.levels[id]?.passedAt == null) ?? 'boss';
			const prev = row.placement ?? {};
			const bossBeaten = row.levels.boss?.passedAt != null;
			row.placement = {
				...prev, part1: undefined, placedAt: now.toISOString(), station, path, total, startAt: map.startAt,
				// 只往前不往后: a waiver or chapter-2 levels from an earlier test stay
				prepWaived: (prev.prepWaived ?? false) || (map.prepWaived && !bossBeaten),
				ch2: [...new Set([...(prev.ch2 ?? []), ...map.ch2])],
			};
			row.xp += PLACEMENT_XP;
			await this.log(em, userId, now, { kind: 'placement', ref: station, hearts: 0, xp: PLACEMENT_XP, data: { version: PLACEMENT_VERSION, path, total, lit } });
			const streak = await this.streak(em, row, now);
			await this.save(em, row, now);
			return { station, startAt: map.startAt, from, lit, card2: map.ch2.length > 0, xp: PLACEMENT_XP, streak };
		});
		return { ...out, quest: await this.show(userId) };
	}

	// The banner's ✕: it never comes back. The menu entry stays.
	public async placementDismiss(userId: string) {
		const now = new Date();
		await this.db.transaction(async em => {
			const row = await this.lock(em, userId, now);
			row.placement = { ...row.placement, dismissedAt: now.toISOString() };
			await this.save(em, row, now);
		});
		return this.show(userId);
	}

	// 埋点 (增长 埋点清单): one more of this step today, from this source. Nothing else is kept.
	public async funnel(event: string, src: string) {
		await this.db.query(
			'INSERT INTO "lojo_funnel_count" ("day", "event", "src", "n") VALUES ($1, $2, $3, 1) ON CONFLICT ("day", "event", "src") DO UPDATE SET "n" = "lojo_funnel_count"."n" + 1',
			[dayOf(new Date()), event, src],
		);
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
				this.tickPrep(row, 'guide');
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
			this.tickPrep(row, 'guide');
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
			this.tickPrep(row, 'news');
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
			this.tickPrep(row, 'gear');
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
			chapter: chapterOf(node.ch).title,
			chapterNo: node.ch,
			level: { id: node.id, name: node.name || node.label, kind: node.kind === 'boss' ? 'boss' : 'level', skill: node.skill ?? '', type: node.type ?? '' },
			result: { correct: at.answers.filter(a => a.correct).length, total: at.questionIds.length, needed: rulesOf(node, at.mode as Mode).need, passed: false, failStreak },
			wrong,
			cause,
			hearts: { now: row.hearts, max: MAX_HEARTS, nextRefill: new Date(nextRefill.getTime() + 8 * 3600_000).toISOString().slice(11, 16), refilledToday },
			streak: { days: s.days, doneToday: s.doneToday, freezeCards: row.freezes },
			boss: node.kind === 'boss' ? (() => {
				const p = this.prepOf(row, node.ch);
				return { losses: node.ch === 1 ? row.bossLosses : failStreak, prep: { guide: p.guide, gear: p.gear, intel: p.news } };
			})() : null,
			next,
		};
		const result = at.askedTutor ? 'already' : await this.lojoTutorService.openFromQuest(tutorId, userId, questTry);
		if (!at.askedTutor && result === 'sent') await this.db.getRepository(MiLojoQuestAttempt).update({ id: at.id }, { askedTutor: true });
		return { tutorId, result };
	}
}
