/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoEnglishService } from '@/core/LojoEnglishService.js';
import { lojoEnglishErrors, lojoEnglishReplyIdeasRes } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account', requiredRolePolicy: 'canUseTranslator',
	description: 'Suggest three English replies to a note.',
	limit: { duration: 60 * 60 * 1000, max: 120 },
	errors: lojoEnglishErrors,
	res: lojoEnglishReplyIdeasRes,
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		refresh: { type: 'boolean', default: false },
	},
	required: ['noteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoEnglishService: LojoEnglishService) {
		super(meta, paramDef, async (ps, me) => {
			const { text, replyId } = await this.lojoEnglishService.noteText(ps.noteId, me);
			// The post above gives the model context; skip it quietly if the user cannot see it.
			const context = replyId == null ? null : await this.lojoEnglishService.noteText(replyId, me).then(x => x.text.slice(0, 1000), () => null);
			return this.lojoEnglishService.replyIdeas(text, context, ps.refresh);
		});
	}
}
