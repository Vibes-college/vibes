/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account',
	description: "Everything the 闯关 page needs: hearts (refilled at 08:00 and 20:00 Beijing), streak, XP, Boss prep, today's 补心, the chapter map with each node's state and the bookshop. Answers are not included.",
	limit: { duration: 60 * 1000, max: 120 },
	errors: {},
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps, me) => this.svc.show(me.id));
	}
}
