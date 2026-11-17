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
	description: 'Add one task (or a daily check-in) to the plan. Returns ok false with a reason when the day is full or past.',
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string', minLength: 1, maxLength: 128 },
		date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', nullable: true },
		minutes: { type: 'integer', minimum: 1, maximum: 600 },
		kind: { type: 'string', enum: ['task', 'checkin'], default: 'task' },
		app: { type: 'string', maxLength: 32, nullable: true },
		ref: { type: 'string', maxLength: 32, nullable: true },
	},
	required: ['title', 'minutes'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoPlanService: LojoPlanService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.lojoPlanService.addTask(me.id, 'self', ps);
		});
	}
}
