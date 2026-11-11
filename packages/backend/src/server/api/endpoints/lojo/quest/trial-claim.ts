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
	description: '存档: right after signing up, the passed try the visitor played (trialId) is moved onto this account. Returns the same as show.',
	limit: { duration: 60 * 60 * 1000, max: 30 },
	errors: { noSuchAttempt: lojoQuestErrors.noSuchAttempt },
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: { trialId: { type: 'string', minLength: 16, maxLength: 40 } },
	required: ['trialId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps, me) => this.svc.trialClaim(me.id, ps.trialId));
	}
}
