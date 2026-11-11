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
	description: '闯关定级: hands in the second part (5 answers). Lights the levels before the suggested one (1 star, 0 XP), gives 20 XP and counts today. Returns the suggestion and the same as lojo/quest/show under quest.',
	limit: { duration: 60 * 60 * 1000, max: 60 },
	errors: { placementTooSoon: lojoQuestErrors.placementTooSoon, placementNoFirstPart: lojoQuestErrors.placementNoFirstPart },
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: { answers: { type: 'array', minItems: 5, maxItems: 5, items: { type: 'string', maxLength: 60 } } },
	required: ['answers'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps, me) => this.svc.placementFinish(me.id, ps.answers));
	}
}
