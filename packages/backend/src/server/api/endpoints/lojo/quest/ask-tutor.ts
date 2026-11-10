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
	description: '「问 Mia」 on a failed try: the server builds what happened (wrong questions, hearts, streak, where to go next) and the tutor writes first in DM. Once per try; result is sent, already, limit or off.',
	limit: { duration: 24 * 60 * 60 * 1000, max: 30 },
	errors: { noSuchAttempt: lojoQuestErrors.noSuchAttempt },
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: { attemptId: { type: 'string', format: 'misskey:id' } },
	required: ['attemptId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps, me) => this.svc.askTutor(me.id, ps.attemptId));
	}
}
