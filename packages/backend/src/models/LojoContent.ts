/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// 内容进数据库 (2026-11-17): private content imported by an admin, a version per import. `kind` names what it is
// (e.g. "quest-books"); one active row per kind, the older rows stay so it can go back. Rules in core/LojoContentService.ts.
@Entity('lojo_content')
@Index('IDX_lojo_content_kind_active', ['kind', 'active'])
export class MiLojoContent {
	@PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_lojo_content' })
	public id: number;

	@Column('varchar', { length: 64 })
	public kind: string;

	@Column('varchar', { length: 256 })
	public version: string;

	@Column('jsonb')
	public data: unknown;

	@Column('boolean', { default: false })
	public active: boolean;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Column('varchar', { length: 512, default: '' })
	public note: string;
}
