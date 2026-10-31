/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoEnglishService } from '@/core/LojoEnglishService.js';
import { lojoEnglishErrors } from '@/server/api/lojo-schemas.js';

const str = { type: 'string', optional: false, nullable: false } as const;

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account', requiredRolePolicy: 'canUseTranslator',
	description: 'Polish what the user wants to tell their own coding agent into natural English, with short notes in Chinese.',
	limit: { duration: 60 * 60 * 1000, max: 120 },
	errors: { unavailable: lojoEnglishErrors.unavailable, failed: lojoEnglishErrors.failed, quotaExceeded: lojoEnglishErrors.quotaExceeded },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			text: str,
			feedback: str,
			notes: {
				type: 'array', optional: false, nullable: false,
				items: {
					type: 'object', optional: false, nullable: false,
					properties: { phrase: str, explanation: str },
				},
			},
		},
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		text: { type: 'string', minLength: 1, maxLength: 1000 },
	},
	required: ['text'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoEnglishService: LojoEnglishService) {
		super(meta, paramDef, async (ps) => this.lojoEnglishService.agentEnglish(ps.text));
	}
}
