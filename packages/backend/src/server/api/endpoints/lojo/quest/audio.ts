/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';
import { lojoQuestErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account',
	description: 'The recording of the current question of a try, made by the server voices. lines has one url per speaker line, played at rate; without speech it is empty and fallback has the script to show as text.',
	limit: { duration: 60 * 60 * 1000, max: 600 },
	errors: { noSuchAttempt: lojoQuestErrors.noSuchAttempt, wrongQuestion: lojoQuestErrors.wrongQuestion, noAudio: lojoQuestErrors.noAudio },
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: { attemptId: { type: 'string', format: 'misskey:id' }, qid: { type: 'string', maxLength: 32 } },
	required: ['attemptId', 'qid'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps, me) => this.svc.audio(me.id, ps.attemptId, ps.qid));
	}
}
