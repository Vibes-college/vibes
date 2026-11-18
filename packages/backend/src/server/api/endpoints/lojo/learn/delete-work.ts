/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoLearnService } from '@/core/LojoLearnService.js';
import { learnMajorParam } from '@/server/api/lojo-learn-schemas.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	kind: 'write:account',
	description: 'Deletes the signed-in user\'s graduation work for a major. Returns the same as lojo/learn/me.',
	limit: { duration: 60 * 60 * 1000, max: 60 },
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		major: learnMajorParam,
	},
	required: ['major'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoLearnService: LojoLearnService) {
		super(meta, paramDef, async (ps, me) => {
			await this.lojoLearnService.deleteWork(me.id, ps.major);
			return this.lojoLearnService.me(me.id);
		});
	}
}
