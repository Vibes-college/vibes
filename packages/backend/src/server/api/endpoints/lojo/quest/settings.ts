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
	description: 'Sets the exam date (YYYY-MM-DD, after today and within two years; null clears it) and whether the first-time walkthrough is done. Returns the same as lojo/quest/show.',
	limit: { duration: 60 * 60 * 1000, max: 60 },
	errors: { invalidExamDate: lojoQuestErrors.invalidExamDate },
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: { examDate: { type: 'string', nullable: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' }, onboarded: { type: 'boolean' } },
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps, me) => this.svc.settings(me.id, { examDate: ps.examDate, onboarded: ps.onboarded }));
	}
}
