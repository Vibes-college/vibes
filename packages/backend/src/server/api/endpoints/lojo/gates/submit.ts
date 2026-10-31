/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoGateService } from '@/core/LojoGateService.js';
import { lojoGateErrors, lojoGateResultSchema } from '@/server/api/lojo-schemas.js';
import { TRANSLATION_MAX } from '@/misc/lojo-gates.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	description: 'Hand in a gate and get it marked. Handing in the same attempt again returns the first result.',
	limit: { duration: 60 * 60 * 1000, max: 120 },
	errors: { noSuchAttempt: lojoGateErrors.noSuchAttempt },
	res: lojoGateResultSchema,
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		attemptId: { type: 'string', format: 'misskey:id' },
		// one entry per question number; a blank is ''. A question with several numbers (choose TWO) has one letter per number.
		// Up to 600 characters for a translation; other answers are marked on their first 200.
		// build: the chips' numbers in order ('4,1,3,0,2'); fix: the wrong word's number and the correction ('3|is');
		// parse: JSON of the words marked ('{"s":[3,4],"v":[9],"c":[[3,8]]}'); spell and translate: what was written.
		answers: {
			type: 'array', maxItems: 100,
			items: {
				type: 'object',
				properties: {
					n: { type: 'integer', minimum: 1, maximum: 100 },
					value: { type: 'string', maxLength: TRANSLATION_MAX },
				},
				required: ['n', 'value'],
			},
		},
	},
	required: ['attemptId', 'answers'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoGateService: LojoGateService) {
		super(meta, paramDef, async (ps, me) => this.lojoGateService.submit(me.id, ps.attemptId, ps.answers));
	}
}
