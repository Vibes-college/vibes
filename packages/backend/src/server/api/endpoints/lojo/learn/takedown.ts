/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { LojoLearnService } from '@/core/LojoLearnService.js';
import { lojoLearnErrors } from '@/server/api/lojo-learn-schemas.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:account',
	description: 'Moderators: takes a local user\'s 「学习」 tab down (others see nothing; the owner is told it was taken down), or puts it back with down: false.',
	limit: { duration: 60 * 1000, max: 60 },
	errors: {
		noSuchUser: lojoLearnErrors.noSuchUser,
	},
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			username: { type: 'string', optional: false, nullable: false },
			takenDown: { type: 'boolean', optional: false, nullable: false },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		username: { type: 'string', minLength: 1, maxLength: 128 },
		down: { type: 'boolean', default: true },
	},
	required: ['username'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoLearnService: LojoLearnService) {
		super(meta, paramDef, async (ps) => {
			const r = await this.lojoLearnService.takedown(ps.username, ps.down);
			if (r == null) throw new ApiError(meta.errors.noSuchUser);
			return r;
		});
	}
}
