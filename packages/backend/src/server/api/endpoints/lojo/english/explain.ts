/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoEnglishService } from '@/core/LojoEnglishService.js';
import { ApiError } from '@/server/api/error.js';
import { lojoEnglishErrors, lojoEnglishExplanationRes } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account', requiredRolePolicy: 'canUseTranslator',
	description: 'Translate a note (or a chat message\'s text) and explain the expressions worth learning.',
	limit: { duration: 60 * 60 * 1000, max: 300 },
	errors: lojoEnglishErrors,
	res: lojoEnglishExplanationRes,
} as const;
export const paramDef = {
	type: 'object',
	// One of noteId or text is required. Chat messages pass their text; the reader already sees it.
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		text: { type: 'string', minLength: 1, maxLength: 2000 },
		lang: { type: 'string', enum: ['zh-CN', 'zh-TW'], default: 'zh-CN' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoEnglishService: LojoEnglishService) {
		super(meta, paramDef, async (ps, me) => {
			const text = ps.noteId ? (await this.lojoEnglishService.noteText(ps.noteId, me)).text : ps.text;
			if (text == null) throw new ApiError(lojoEnglishErrors.emptyNote);
			return this.lojoEnglishService.explain(text, ps.lang);
		});
	}
}
