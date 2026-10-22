/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiNote } from './Note.js';

export type GuideBlock = {
	id: string;
	type: 'heading' | 'paragraph' | 'image' | 'video' | 'audio' | 'checklist' | 'resource';
	text?: string;
	level?: 2 | 3;
	url?: string;
	caption?: string;
	items?: string[];
	resource?: { kind: 'tool' | 'service' | 'map' | 'guide'; title: string; description: string; url: string; meta?: string };
};

export type GuideAnchor = {
	revision: number;
	startBlockId: string;
	startOffset: number;
	endBlockId: string;
	endOffset: number;
	exact: string;
	prefix: string;
	suffix: string;
};

@Entity('lojo_guide')
@Index('IDX_lojo_guide_status_updated', ['status', 'updatedAt'])
@Index('IDX_lojo_guide_author', ['authorId'])
export class MiLojoGuide {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_guide' })
	public id: string;

	@Column(id())
	public authorId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_guide_author' })
	public author: MiUser | null;

	@Column('varchar', { length: 160 })
	public title: string;

	@Column('varchar', { length: 600 })
	public summary: string;

	@Column('varchar', { length: 40 })
	public category: string;

	@Column('varchar', { length: 80 })
	public city: string;

	@Column('varchar', { length: 2048, nullable: true })
	public coverUrl: string | null;

	@Column('varchar', { length: 16 })
	public status: 'draft' | 'published';

	@Column('boolean', { default: false })
	public isDemo: boolean;

	@Column('boolean', { default: false })
	public featured: boolean;

	@Column('integer')
	public revision: number;

	@Column('jsonb')
	public blocks: GuideBlock[];

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Column('timestamp with time zone')
	public updatedAt: Date;
}

@Entity('lojo_guide_thread')
@Index('IDX_lojo_guide_thread_anchor', ['guideId', 'anchorKey'], { unique: true })
export class MiLojoGuideThread {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_guide_thread' })
	public id: string;

	@Column(id())
	public guideId: string;

	@ManyToOne(() => MiLojoGuide, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_guide_thread_guide' })
	public guide: MiLojoGuide | null;

	@Column('varchar', { length: 64 })
	public anchorKey: string;

	@Column('jsonb', { nullable: true })
	public anchor: GuideAnchor | null;

	@Column('timestamp with time zone')
	public createdAt: Date;
}

@Entity('lojo_guide_comment')
@Index('IDX_lojo_guide_comment_thread', ['threadId', 'id'])
@Index('IDX_lojo_guide_comment_note', ['noteId'], { unique: true })
export class MiLojoGuideComment {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_guide_comment' })
	public id: string;

	@Column(id())
	public threadId: string;

	@ManyToOne(() => MiLojoGuideThread, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_guide_comment_thread' })
	public thread: MiLojoGuideThread | null;

	@Column(id())
	public noteId: string;

	@ManyToOne(() => MiNote, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_guide_comment_note' })
	public note: MiNote | null;

	@Column({ ...id(), nullable: true })
	public replyToId: string | null;

	@ManyToOne(() => MiLojoGuideComment, { onDelete: 'SET NULL' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_guide_comment_reply' })
	public replyTo: MiLojoGuideComment | null;
}

@Entity('lojo_guide_like')
@Index('IDX_lojo_guide_like_pair', ['threadId', 'userId'], { unique: true })
export class MiLojoGuideLike {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_guide_like' })
	public id: string;

	@Column(id())
	public threadId: string;

	@ManyToOne(() => MiLojoGuideThread, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_guide_like_thread' })
	public thread: MiLojoGuideThread | null;

	@Column(id())
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_guide_like_user' })
	public user: MiUser | null;
}

@Entity('lojo_guide_bookmark')
@Index('IDX_lojo_guide_bookmark_pair', ['userId', 'guideId'], { unique: true })
export class MiLojoGuideBookmark {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_guide_bookmark' })
	public id: string;

	@Column(id())
	public guideId: string;

	@ManyToOne(() => MiLojoGuide, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_guide_bookmark_guide' })
	public guide: MiLojoGuide | null;

	@Column(id())
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_guide_bookmark_user' })
	public user: MiUser | null;
}
