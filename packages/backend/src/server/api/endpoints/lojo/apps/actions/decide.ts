/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 第 6 步 (2026-11-17): the learner's tap on a 「确认」 card. confirm sends the change Vibi asked for to the mini app,
// as this learner; cancel sends nothing. A failed one may be confirmed again; a done or cancelled one stays as it is.

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { LojoAppsService } from '@/core/LojoAppsService.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	kind: 'write:account',
	limit: {
		duration: 60 * 1000,
		max: 30,
	},
	description: 'Confirm or cancel a change in a mini app that Vibi asked for (the card under her reply). Answers the card\'s new state.',
	errors: {
		noSuchAction: { message: 'No such action.', code: 'NO_SUCH_ACTION', id: '760a8128-b393-44dd-b6cb-dda8822a4b20' },
	},
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		actionId: { type: 'string', pattern: '^[0-9a-f]{10}$' },
		decision: { type: 'string', enum: ['confirm', 'cancel'] },
	},
	required: ['actionId', 'decision'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoAppsService: LojoAppsService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const action = await this.lojoAppsService.decideAction(me.id, ps.actionId, ps.decision);
			if (action == null) throw new ApiError(meta.errors.noSuchAction);
			return action;
		});
	}
}
