/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoPlanService } from '@/core/LojoPlanService.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	kind: 'write:account',
	description: 'Tick or untick a task, or a check-in on one day (today by default); removed takes it out.',
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		taskId: { type: 'string', format: 'misskey:id' },
		status: { type: 'string', enum: ['todo', 'doing', 'done', 'removed'] },
		date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', nullable: true },
		via: { type: 'string', enum: ['ask'], nullable: true },
	},
	required: ['taskId', 'status'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoPlanService: LojoPlanService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.lojoPlanService.setStatus(me.id, 'self', ps);
		});
	}
}
