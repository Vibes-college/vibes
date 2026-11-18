/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoLearnService } from '@/core/LojoLearnService.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	kind: 'write:account',
	description: 'Changes the signed-in user\'s 「学习」 tab settings: public or only for them, the channels shown under 「信息」, a contact (link or email). Left out = unchanged. Returns the same as lojo/learn/me.',
	limit: { duration: 60 * 60 * 1000, max: 120 },
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		isPublic: { type: 'boolean' },
		sources: { type: 'array', maxItems: 12, items: { type: 'string', maxLength: 128 } },
		contact: { type: 'string', maxLength: 256 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoLearnService: LojoLearnService) {
		super(meta, paramDef, async (ps, me) => {
			await this.lojoLearnService.update(me.id, { isPublic: ps.isPublic, sources: ps.sources, contact: ps.contact });
			return this.lojoLearnService.me(me.id);
		});
	}
}
