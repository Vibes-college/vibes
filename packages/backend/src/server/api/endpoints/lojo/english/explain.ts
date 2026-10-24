/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoEnglishService } from '@/core/LojoEnglishService.js';
import { lojoEnglishErrors, lojoEnglishExplanationRes } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account', requiredRolePolicy: 'canUseTranslator',
	description: 'Translate a note and explain the expressions worth learning.',
	limit: { duration: 60 * 60 * 1000, max: 300 },
	errors: lojoEnglishErrors,
	res: lojoEnglishExplanationRes,
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		lang: { type: 'string', enum: ['zh-CN', 'zh-TW'], default: 'zh-CN' },
	},
	required: ['noteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoEnglishService: LojoEnglishService) {
		super(meta, paramDef, async (ps, me) => {
			const { text } = await this.lojoEnglishService.noteText(ps.noteId, me);
			return this.lojoEnglishService.explain(text, ps.lang);
		});
	}
}
