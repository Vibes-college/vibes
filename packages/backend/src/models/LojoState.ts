/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiUser } from './User.js';
import { id } from './util/id.js';

@Entity('lojo_state')
export class MiLojoState {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_state' })
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_state_user' })
	public user: MiUser | null;

	@Column('integer')
	public revision: number;

	@Column('jsonb')
	public state: Record<string, unknown>;

	@Column('timestamp with time zone')
	public updatedAt: Date;
}
