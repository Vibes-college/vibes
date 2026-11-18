/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 第 6 步 (2026-11-17): the state of one 「确认」 card under Vibi's reply (a write she asked for in a mini app): waiting,
// done, cancelled, failed or expired. Only the learner it is for can see it.

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { LojoAppsService } from '@/core/LojoAppsService.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	kind: 'read:account',
	description: 'One confirm card Vibi put under her reply (a change in a mini app the learner confirms): what it does and its state.',
	errors: {
		noSuchAction: { message: 'No such action.', code: 'NO_SUCH_ACTION', id: '769ebebf-83a0-4c38-9ab5-d77c3dbe6859' },
	},
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		actionId: { type: 'string', pattern: '^[0-9a-f]{10}$' },
	},
	required: ['actionId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoAppsService: LojoAppsService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const action = await this.lojoAppsService.showAction(me.id, ps.actionId);
			if (action == null) throw new ApiError(meta.errors.noSuchAction);
			return action;
		});
	}
}
