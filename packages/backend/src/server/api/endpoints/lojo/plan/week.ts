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
	description: 'Plan one week from the list (next week by default), replacing what the program planned there and the learner has not touched.',
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		weekStart: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoPlanService: LojoPlanService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.lojoPlanService.planWeek(me.id, 'self', ps);
		});
	}
}
