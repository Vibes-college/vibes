/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

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

	// per level: { passedAt, lastAt, best, tries, fails } and the question ids of the last try
	@Column('jsonb', { default: {} })
	public levels: Record<string, { passedAt?: string; lastAt?: string; best?: number; tries?: number; failStreak?: number; lastQs?: string[] }>;

	// the 锦囊 slugs in the bag
	@Column('jsonb', { default: [] })
	public bag: string[];

	// the Beijing day of the last first-win chest
	@Column('varchar', { length: 10, nullable: true })
	public chestDay: string | null;

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

	// { qid, choice, correct } in order
	@Column('jsonb', { default: [] })
	public answers: { qid: string; choice: number; correct: boolean }[];

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
