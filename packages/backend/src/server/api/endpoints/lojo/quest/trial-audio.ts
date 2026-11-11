/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';
import { lojoQuestErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: false,
	description: 'The recording of the current question of a visitor’s try; the same as audio.',
	limit: { duration: 60 * 60 * 1000, max: 300 },
	errors: { noSuchAttempt: lojoQuestErrors.noSuchAttempt, wrongQuestion: lojoQuestErrors.wrongQuestion, noAudio: lojoQuestErrors.noAudio },
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: { attemptId: { type: 'string', minLength: 16, maxLength: 40 }, qid: { type: 'string', maxLength: 32 } },
	required: ['attemptId', 'qid'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps) => this.svc.trialAudio(ps.attemptId, ps.qid));
	}
}
