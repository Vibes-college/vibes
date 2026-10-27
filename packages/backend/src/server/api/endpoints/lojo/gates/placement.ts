/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoGateService } from '@/core/LojoGateService.js';
import { lojoEnglishErrors, lojoGateAttemptSchema, lojoGateErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	description: 'Start a line\'s placement test: without `after` its first part; with the handed-in first part (`after`), the harder or easier second part it leads to. Hand each part in with lojo/gates/submit.',
	limit: { duration: 60 * 60 * 1000, max: 30 },
	errors: {
		noSuchCourse: lojoGateErrors.noSuchCourse,
		notReady: lojoGateErrors.notReady,
		noSuchAttempt: lojoGateErrors.noSuchAttempt,
		unavailable: lojoEnglishErrors.unavailable,
		failed: lojoEnglishErrors.failed,
		quotaExceeded: lojoEnglishErrors.quotaExceeded,
	},
	res: lojoGateAttemptSchema,
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		course: { type: 'string', minLength: 1, maxLength: 32 },
		line: { type: 'integer', minimum: 1, maximum: 9 },
		after: { type: 'string', format: 'misskey:id' },
	},
	required: ['course', 'line'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoGateService: LojoGateService) {
		super(meta, paramDef, async (ps, me) => this.lojoGateService.placement(me.id, ps.course, ps.line, ps.after));
	}
}
