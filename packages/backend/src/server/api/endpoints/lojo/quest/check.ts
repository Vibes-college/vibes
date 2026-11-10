/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';
import { lojoQuestErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	description: '锦囊补心: the 3-question check of a book in the bookshop. 2 right passes: the book goes in the bag, Boss prep and the streak tick, and 1 heart comes back if below 5 and the 锦囊 path has not given one today. Once a day per book.',
	limit: { duration: 60 * 60 * 1000, max: 120 },
	errors: { noSuchBook: lojoQuestErrors.noSuchBook },
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: { slug: { type: 'string', maxLength: 80 }, answers: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'integer', minimum: 0, maximum: 1 } } },
	required: ['slug', 'answers'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps, me) => this.svc.check(me.id, ps.slug, ps.answers));
	}
}
