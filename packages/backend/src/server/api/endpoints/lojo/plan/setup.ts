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
	description: 'Make or remake the exam plan from the exam date, minutes per day, target and current score. Returns ok false with a reason when it cannot.',
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		examDate: { type: 'string', pattern: '^\\d{4}-\\d{2}(-\\d{2})?$' },
		dailyMinutes: { type: 'integer', minimum: 15, maximum: 600 },
		target: { type: 'string', maxLength: 16 },
		current: { type: 'string', maxLength: 16 },
		restDay: { type: 'integer', minimum: 0, maximum: 6, nullable: true },
		focus: { type: 'string', maxLength: 64, nullable: true },
		tz: { type: 'string', maxLength: 64, nullable: true },
	},
	required: ['examDate', 'dailyMinutes', 'target', 'current'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoPlanService: LojoPlanService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.lojoPlanService.setPlan(me.id, 'self', ps);
		});
	}
}
