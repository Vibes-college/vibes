/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoPlanService } from '@/core/LojoPlanService.js';

export const meta = {
	tags: ['lojo', 'admin'],
	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:meta',
	description: 'Replace the exam task list the plans are made from (攻略\'s ielts-tasks.json). Sent by apps/community/scripts/plan-import.mjs in the Vibes workspace; the list is kept out of the public source.',
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		list: { type: 'object' },
	},
	required: ['list'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoPlanService: LojoPlanService,
	) {
		super(meta, paramDef, async (ps) => {
			return await this.lojoPlanService.importList(ps.list);
		});
	}
}
