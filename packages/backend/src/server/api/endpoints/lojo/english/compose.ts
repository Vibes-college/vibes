/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoEnglishService } from '@/core/LojoEnglishService.js';
import { lojoEnglishErrors, lojoEnglishDraftRes } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account', requiredRolePolicy: 'canUseTranslator',
	description: 'Turn a draft (Chinese or English) into three English versions: casual, slang and formal.',
	limit: { duration: 60 * 60 * 1000, max: 120 },
	errors: { unavailable: lojoEnglishErrors.unavailable, failed: lojoEnglishErrors.failed, quotaExceeded: lojoEnglishErrors.quotaExceeded },
	res: lojoEnglishDraftRes,
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
		super(meta, paramDef, async (ps) => this.lojoEnglishService.compose(ps.text));
	}
}
