/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoWordService } from '@/core/LojoWordService.js';
import { lojoWordTodaySchema } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account',
	description: "Today's 生词本 reviews: the cards up now in order (due ones, then new words up to today's allowance), each with when it would come back after each answer, and the counts for the page. tzOffset is the client's Date#getTimezoneOffset(), so the day ends at the learner's midnight.",
	limit: { duration: 60 * 60 * 1000, max: 1200 },
	res: lojoWordTodaySchema,
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		tzOffset: { type: 'integer', minimum: -840, maximum: 840, default: 0 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoWordService: LojoWordService) {
		super(meta, paramDef, async (ps, me) => this.lojoWordService.today(me, ps.tzOffset));
	}
}
