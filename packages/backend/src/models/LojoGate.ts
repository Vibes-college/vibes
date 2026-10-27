/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import type { GateCourse, GateItemResult } from '@/misc/lojo-gates.js';

// A gate course's question sets (IELTS, say), imported from the Vibes workspace with gates-import.mjs.
// They live in the database, not in the source, because the source is public and the sets hold the answers.
@Entity('lojo_gate_course')
export class MiLojoGateCourse {
	@PrimaryColumn('varchar', { length: 32, primaryKeyConstraintName: 'PK_lojo_gate_course' })
	public id: string;

	@Column('jsonb')
	public data: GateCourse;

	@Column('timestamp with time zone')
	public updatedAt: Date;
}

// One try at a gate on a route map (IELTS listening 1.3, say). A row is written when the test starts, so a set the
// learner has already heard is not handed out again first; score and passed stay null until it is handed in.
// Kept per attempt so the pass marks can be tuned from real results later.
@Entity('lojo_gate_attempt')
@Index('IDX_lojo_gate_attempt_user_course', ['userId', 'course'])
export class MiLojoGateAttempt {
	@PrimaryColumn({ ...id(), primaryKeyConstraintName: 'PK_lojo_gate_attempt' })
	public id: string;

	@Column(id())
	public userId: string;

	@ManyToOne(() => MiUser, { onDelete: 'CASCADE' })
	@JoinColumn({ foreignKeyConstraintName: 'FK_lojo_gate_attempt_user' })
	public user: MiUser | null;

	@Column('varchar', { length: 32 })
	public course: string;

	// 'gate', or 'placement' for a part of a line's placement test (station 'placement-1')
	@Column('varchar', { length: 16 })
	public kind: string;

	// the gate id: an interchange is filed under its first id (1.4 for 1.4 ↔ 2.4)
	@Column('varchar', { length: 16 })
	public station: string;

	// e.g. '1.3-B'
	@Column('varchar', { length: 32 })
	public setId: string;

	@Column('smallint', { nullable: true })
	public score: number | null;

	@Column('smallint')
	public total: number;

	@Column('boolean', { nullable: true })
	public passed: boolean | null;

	@Column('timestamp with time zone')
	public startedAt: Date;

	@Column('timestamp with time zone', { nullable: true })
	public submittedAt: Date | null;

	// lines: the lines this set counts for; the rest is filled in on hand-in.
	// Placement tests also keep their stage ('first', 'high' or 'low'), the first part's attempt (after) and,
	// on the second part, the first part's mark and the station the learner was placed at.
	@Column('jsonb')
	public data: {
		lines: number[];
		stage?: string;
		after?: string;
		firstScore?: number;
		firstTotal?: number;
		placedAt?: string;
		answers?: { n: number; value: string }[];
		items?: GateItemResult[];
		weak?: { tag: string; count: number }[];
	};
}
