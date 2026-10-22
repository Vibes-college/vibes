/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiLojoEntity } from './LojoEntity.js';
import { MiNote } from './Note.js';
import { id } from './util/id.js';

@Entity('lojo_entity_note')
export class MiLojoEntityNote {
	@PrimaryColumn('varchar', { length: 128, primaryKeyConstraintName: 'PK_lojo_entity_note' })
	public entityId: string;

	@ManyToOne(() => MiLojoEntity, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_entity_note_entity' })
	public entity: MiLojoEntity | null;

	@Index('IDX_lojo_entity_note_note')
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_entity_note' })
	public noteId: string;

	@ManyToOne(() => MiNote, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_entity_note_note' })
	public note: MiNote | null;
}
