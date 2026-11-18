/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoLearnService } from '@/core/LojoLearnService.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: false,
	description: 'The 「学习」 tab of a local user\'s profile: learning grid, pinned graduation works, 「我是怎么学的」. Public unless the owner turned it off or a moderator took it down (then visible: false). The owner also gets `me` (status and the share card).',
	limit: { duration: 60 * 1000, max: 120 },
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		username: { type: 'string', minLength: 1, maxLength: 128 },
	},
	required: ['username'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoLearnService: LojoLearnService) {
		super(meta, paramDef, async (ps, me) => this.lojoLearnService.show(ps.username, me?.id ?? null));
	}
}
