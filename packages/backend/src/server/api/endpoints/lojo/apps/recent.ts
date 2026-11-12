/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The signed-in learner's own lines in the summary index, newest first.

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoAppsService } from '@/core/LojoAppsService.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	kind: 'read:account',
	description: 'The signed-in learner\'s recent practice across mini apps (the summary index).',
	res: { type: 'array', optional: false, nullable: false, items: { type: 'object', optional: false, nullable: false } },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		app: { type: 'string', maxLength: 32, nullable: true },
		days: { type: 'integer', minimum: 1, maximum: 90, default: 7 },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoAppsService: LojoAppsService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.lojoAppsService.recent(me.id, { since: new Date(Date.now() - ps.days * 86400_000), app: ps.app ?? null, limit: ps.limit });
		});
	}
}
