/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

export type LojoEntityType = 'housing' | 'food' | 'pets' | 'events' | 'travel';

@Entity('lojo_entity')
export class MiLojoEntity {
	@PrimaryColumn('varchar', { length: 128, primaryKeyConstraintName: 'PK_lojo_entity' })
	public id: string;

	@Index('IDX_lojo_entity_type')
	@Column('varchar', { length: 16 })
	public type: LojoEntityType;

	@Column('varchar', { length: 200 })
	public title: string;

	@Column('double precision')
	public lat: number;

	@Column('double precision')
	public lng: number;

	@Column('varchar', { length: 240 })
	public route: string;

	@Column('varchar', { length: 32 })
	public mapLayer: string;

	@Column('varchar', { length: 16 })
	public status: 'demo' | 'curated';

	@Column('jsonb')
	public data: Record<string, any>;

	@Column('timestamp with time zone')
	public updatedAt: Date;
}
