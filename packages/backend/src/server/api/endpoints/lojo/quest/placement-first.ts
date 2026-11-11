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
	description: '闯关定级: hands in the first part (5 answers). Returns the second part, chosen by how the first went.',
	limit: { duration: 60 * 60 * 1000, max: 60 },
	errors: { placementTooSoon: lojoQuestErrors.placementTooSoon },
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
		super(meta, paramDef, async (ps, me) => this.svc.placementFirst(me.id, ps.answers));
	}
}
