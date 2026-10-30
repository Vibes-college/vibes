/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

// A word or expression in a learner's 生词本: saved from a post's explanation, missed in dictation or a gate, or
// typed in by hand. The meaning and example come with it, so a review card can show them.
@Entity('lojo_word')
@Index('IDX_lojo_word_user_key', ['userId', 'key'], { unique: true })
export class MiLojoWord {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_word' })
	public id: string;

	@Column(id())
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_word_user' })
	public user: MiUser | null;

	// wordKey(text): one row per expression per learner
	@Column('varchar', { length: 256 })
	public key: string;

	@Column('varchar', { length: 256 })
	public text: string;

	// word, phrase, idiom, slang or grammar
	@Column('varchar', { length: 16 })
	public kind: string;

	@Column('varchar', { length: 1024, default: '' })
	public meaning: string;

	@Column('varchar', { length: 2048, default: '' })
	public usage: string;

	@Column('varchar', { length: 1024, default: '' })
	public example: string;

	@Column('varchar', { length: 1024, default: '' })
	public exampleZh: string;

	// post, gate, dictation or manual
	@Column('varchar', { length: 16 })
	public source: string;

	// the post it was saved from; the post may be gone since
	@Column({ ...id(), nullable: true })
	public noteId: string | null;

	@Column('timestamp with time zone')
	public createdAt: Date;
}

// One of a word's two cards, 认得 (recognize) or 拼写 (spell), with its FSRS state in columns so the due cards can
// be found with an index. See misc/lojo-words.ts.
@Entity('lojo_word_card')
@Index('IDX_lojo_word_card_word_kind', ['wordId', 'kind'], { unique: true })
@Index('IDX_lojo_word_card_user_due', ['userId', 'due'])
export class MiLojoWordCard {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_word_card' })
	public id: string;

	@Column(id())
	public wordId: string;

	@ManyToOne(() => MiLojoWord, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_word_card_word' })
	public word: MiLojoWord | null;

	@Column(id())
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_word_card_user' })
	public user: MiUser | null;

	@Column('varchar', { length: 16 })
	public kind: string;

	@Column('timestamp with time zone')
	public due: Date;

	@Column('double precision')
	public stability: number;

	@Column('double precision')
	public difficulty: number;

	@Column('integer')
	public elapsedDays: number;

	@Column('integer')
	public scheduledDays: number;

	@Column('integer')
	public learningSteps: number;

	@Column('integer')
	public reps: number;

	@Column('integer')
	public lapses: number;

	// ts-fsrs State: 0 new, 1 learning, 2 review, 3 relearning
	@Column('smallint')
	public state: number;

	@Column('timestamp with time zone', { nullable: true })
	public lastReview: Date | null;
}

// Every review, with the card as it was before it. Kept for the streak and today's new words, and so FSRS's
// parameters can be fitted to our learners later.
@Entity('lojo_word_review')
@Index('IDX_lojo_word_review_user_at', ['userId', 'reviewedAt'])
// removing a word or a card deletes its reviews through this
@Index('IDX_lojo_word_review_card', ['cardId'])
export class MiLojoWordReview {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_word_review' })
	public id: string;

	@Column(id())
	public cardId: string;

	@ManyToOne(() => MiLojoWordCard, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_word_review_card' })
	public card: MiLojoWordCard | null;

	@Column(id())
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_word_review_user' })
	public user: MiUser | null;

	// 1 again, 2 hard, 3 good, 4 easy
	@Column('smallint')
	public rating: number;

	@Column('smallint')
	public state: number;

	@Column('timestamp with time zone')
	public due: Date;

	@Column('double precision')
	public stability: number;

	@Column('double precision')
	public difficulty: number;

	@Column('integer')
	public elapsedDays: number;

	@Column('integer')
	public lastElapsedDays: number;

	@Column('integer')
	public scheduledDays: number;

	@Column('integer')
	public learningSteps: number;

	@Column('timestamp with time zone')
	public reviewedAt: Date;

	// how long the card was on screen, when the client knows
	@Column('integer', { nullable: true })
	public durationMs: number | null;
}
