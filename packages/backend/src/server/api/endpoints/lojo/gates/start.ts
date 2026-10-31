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
	description: 'Start a gate: pick a question set you have not heard yet and return the paper and its recording (no answers); a spell question comes with the recording of its word. The first start of a set can take half a minute while the recording is made.',
	limit: { duration: 60 * 60 * 1000, max: 60 },
	errors: {
		noSuchCourse: lojoGateErrors.noSuchCourse,
		noSuchStation: lojoGateErrors.noSuchStation,
		notReady: lojoGateErrors.notReady,
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
		station: { type: 'string', minLength: 1, maxLength: 16 },
	},
	required: ['course', 'station'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoGateService: LojoGateService) {
		super(meta, paramDef, async (ps, me) => this.lojoGateService.start(me.id, ps.course, ps.station));
	}
}
