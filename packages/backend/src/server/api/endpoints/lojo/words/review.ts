/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoWordService } from '@/core/LojoWordService.js';
import { lojoWordCardSchema, lojoWordErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	description: 'Records one review of a 生词本 card and schedules it with FSRS. rating: 1 忘了 (again), 2 hard, 3 记得 (good), 4 easy. Send the card\'s reps as shown: if they no longer match, the review was already saved (a retry, another tab) and the card is returned unchanged with applied false. tzOffset (Date#getTimezoneOffset()) makes FSRS count days by the learner\'s midnight.',
	limit: { duration: 60 * 60 * 1000, max: 3000 },
	errors: {
		noSuchCard: lojoWordErrors.noSuchCard,
	},
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			applied: { type: 'boolean', optional: false, nullable: false },
			card: lojoWordCardSchema,
		},
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		cardId: { type: 'string', format: 'misskey:id' },
		rating: { type: 'integer', minimum: 1, maximum: 4 },
		durationMs: { type: 'integer', minimum: 0, maximum: 3600000, nullable: true },
		reps: { type: 'integer', minimum: 0, nullable: true },
		tzOffset: { type: 'integer', minimum: -840, maximum: 840, default: 0 },
	},
	required: ['cardId', 'rating'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoWordService: LojoWordService) {
		super(meta, paramDef, async (ps, me) => this.lojoWordService.review(me, ps.cardId, ps.rating, ps.durationMs ?? null, ps.reps ?? null, ps.tzOffset));
	}
}
