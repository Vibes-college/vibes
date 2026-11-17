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
	kind: 'read:account',
	description: 'The signed-in learner\'s exam plan for the task tab of the chat with Vibi: the week (Monday to Sunday) with each day\'s tasks and check-ins, the stages, streak and recent changes. Moves unfinished tasks to today and fills this week from the list first.',
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		tz: { type: 'string', maxLength: 64, nullable: true },
		weekOf: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', nullable: true },
		seen: { type: 'boolean', default: false },
		board: { type: 'boolean', default: false },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoPlanService: LojoPlanService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.lojoPlanService.show(me.id, { tz: ps.tz, weekOf: ps.weekOf, seen: ps.seen, board: ps.board });
		});
	}
}
