/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import { LojoPlanService } from '@/core/LojoPlanService.js';
import { lojoTutorIds } from '@/misc/lojo-tutor.js';

// Try Vibi's three plan messages now (私信任务标签, 2026-11-15): weekPlanned (next week planned), overdue (a task three
// days late or more), replanOffer (three days without opening the task tab). Skips waking hours, mute, the on/off switch
// and "already asked"; the day's limit of first messages (LOJO_TUTOR_PROACTIVE_PER_DAY, 5) still holds.
export const meta = {
	tags: ['lojo', 'admin'], requireCredential: true, requireAdmin: true, kind: 'write:admin:meta',
	description: 'Have the AI tutor send one of the study-plan messages to a learner now (for trying it out).',
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			sent: { type: 'boolean', optional: false, nullable: false },
			reason: { type: 'string', optional: false, nullable: false },
		},
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		kind: { type: 'string', enum: ['weekPlanned', 'overdue', 'replanOffer'] },
	},
	required: ['userId', 'kind'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoTutorService: LojoTutorService, private lojoPlanService: LojoPlanService) {
		super(meta, paramDef, async (ps) => {
			const tutorId = lojoTutorIds()[0];
			if (tutorId == null) return { sent: false, reason: 'no tutor' };
			const ev = await this.lojoPlanService.eventFor(ps.userId, ps.kind);
			if (ev == null) return { sent: false, reason: ps.kind === 'overdue' ? 'no plan, or nothing three days late' : 'no plan' };
			const reason = await this.lojoTutorService.planEvent(tutorId, ev, { force: true });
			return { sent: reason === 'sent', reason };
		});
	}
}
