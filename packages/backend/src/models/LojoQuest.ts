/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

export type MiLojoQuestLevel = {
	passedAt?: string; lastAt?: string; best?: number; tries?: number; failStreak?: number; lastCause?: string; prevCause?: string;
	stars?: number; setsUsed?: string[]; lastQs?: string[];
	// lit by the placement test (1 star, 0 XP): the first real pass still counts as a first pass
	placed?: boolean;
};

// 闯关定级: the last test (placedAt, station, path, total right, startAt), the first part handed in on a test not yet
// finished, the banner closed, the first Boss try without prep, chapter-2 levels to light once chapter 2 is in.
export type MiLojoQuestPlacement = {
	placedAt?: string; station?: string; path?: string; total?: number; startAt?: string;
	part1?: { right: number; path: string; at: string };
	dismissedAt?: string; prepWaived?: boolean; ch2?: string[];
};

export type MiLojoQuestNotice = { kind: 'freeze'; used: number } | { kind: 'lost'; days: number; best: number };

// half: 选两个只对一个（不算对、不算错、不扣心）；timeout: 限时关时间到时没答的题
export type MiLojoQuestAnswer = { qid: string; given: string; correct: boolean; cause: string | null; half?: boolean; timeout?: boolean };

// 闯关: one row per learner with hearts, streak, freeze cards, XP, Boss prep and level progress. Rules in misc/lojo-quest.ts.
@Entity('lojo_quest')
export class MiLojoQuest {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_quest' })
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_quest_user' })
	public user: MiUser | null;

	@Column('smallint')
	public hearts: number;

	// when hearts last changed: a refill boundary (08:00 or 20:00 Beijing) after it fills them back to 5
	@Column('timestamp with time zone')
	public heartsAt: Date;

	@Column('integer', { default: 0 })
	public streak: number;

	// the last Beijing day (YYYY-MM-DD) that counted for the streak
	@Column('varchar', { length: 10, nullable: true })
	public streakDay: string | null;

	@Column('integer', { default: 0 })
	public bestStreak: number;

	@Column('smallint', { default: 0 })
	public freezes: number;

	@Column('integer', { default: 0 })
	public xp: number;

	// Boss prep: { guide, gear, news } true once done since the last reset
	@Column('jsonb', { default: {} })
	public prep: Record<string, boolean>;

	// Boss losses in a row
	@Column('smallint', { default: 0 })
	public bossLosses: number;

	// per level: when first passed, last touched (a passed retest relights it), best score, tries, fails in a row and the
	// main cause of the last fail, stars (0-3), the sets used since the last mix and the question ids of the last try
	@Column('jsonb', { default: {} })
	public levels: Record<string, MiLojoQuestLevel>;

	// the 锦囊 slugs in the bag
	@Column('jsonb', { default: [] })
	public bag: string[];

	// the Beijing day of the last first-win chest
	@Column('varchar', { length: 10, nullable: true })
	public chestDay: string | null;

	// the learner's exam date (YYYY-MM-DD, Beijing), null when not given or skipped
	@Column('varchar', { length: 10, nullable: true })
	public examDate: string | null;

	// the first-time walkthrough was finished or skipped
	@Column('boolean', { default: false })
	public onboarded: boolean;

	// played 1-1 as a visitor first and saved after (先玩后注册, 冲刺1111)
	@Column('boolean', { default: false })
	public trial: boolean;

	// one-time notice for the next visit: freeze cards used, or the streak lost
	@Column('jsonb', { nullable: true })
	public notice: MiLojoQuestNotice | null;

	// 闯关定级 (冲刺1111), null until the banner is closed or a test is handed in
	@Column('jsonb', { nullable: true })
	public placement: MiLojoQuestPlacement | null;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Column('timestamp with time zone')
	public updatedAt: Date;
}

// One try at a level or the Boss: the questions drawn, the answers given and the result. Answers are judged on the
// server, so the page never sees the right option before answering.
@Entity('lojo_quest_attempt')
@Index('IDX_lojo_quest_attempt_user', ['userId', 'createdAt'])
export class MiLojoQuestAttempt {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_quest_attempt' })
	public id: string;

	@Column(id())
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_quest_attempt_user' })
	public user: MiUser | null;

	@Column('varchar', { length: 32 })
	public levelId: string;

	@Column('jsonb')
	public questionIds: string[];

	// { qid, given, correct, cause } in order
	@Column('jsonb', { default: [] })
	public answers: MiLojoQuestAnswer[];

	// practice, level, retest or boss
	@Column('varchar', { length: 8, default: 'level' })
	public mode: string;

	// open, passed, failed or quit
	@Column('varchar', { length: 8 })
	public status: string;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Column('timestamp with time zone', { nullable: true })
	public endedAt: Date | null;

	// 「问 Mia」 already opened a chat for this try
	@Column('boolean', { default: false })
	public askedTutor: boolean;
}

// The ledger: every heart lost or won, every practice set and check counted, every XP grant. day is the Beijing day.
// 补心 once a day per path and once a day per set or book are checked against it.
@Entity('lojo_quest_log')
@Index('IDX_lojo_quest_log_user_day', ['userId', 'day'])
@Index('IDX_lojo_quest_log_day_kind', ['day', 'kind'])
export class MiLojoQuestLog {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_quest_log' })
	public id: string;

	@Column(id())
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_quest_log_user' })
	public user: MiUser | null;

	@Column('timestamp with time zone')
	public at: Date;

	@Column('varchar', { length: 10 })
	public day: string;

	// wrong, refill, set, check, pass, boss, chest, freeze, news, take
	@Column('varchar', { length: 16 })
	public kind: string;

	// guide or gear for a refill; app:setKey for a set; the book slug for a check; the level id otherwise
	@Column('varchar', { length: 256, default: '' })
	public ref: string;

	@Column('smallint', { default: 0 })
	public hearts: number;

	@Column('integer', { default: 0 })
	public xp: number;

	@Column('jsonb', { default: {} })
	public data: Record<string, unknown>;
}
