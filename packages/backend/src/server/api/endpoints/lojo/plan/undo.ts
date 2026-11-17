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
	description: 'Undo one change to the plan (within 30 days).',
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		changeId: { type: 'string', format: 'misskey:id' },
	},
	required: ['changeId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoPlanService: LojoPlanService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.lojoPlanService.undo(me.id, 'self', ps);
		});
	}
}
