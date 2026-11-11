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
	description: 'The clock of a timed try (第四章 4-6 and the Boss) reached 0 on the page. The server checks the time from when the try started; when it is up, the questions not answered count as wrong (time-out) and the try ends. Otherwise it says how many seconds are left.',
	limit: { duration: 60 * 60 * 1000, max: 300 },
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
		super(meta, paramDef, async (ps, me) => this.svc.timeUp(me.id, ps.attemptId));
	}
}
