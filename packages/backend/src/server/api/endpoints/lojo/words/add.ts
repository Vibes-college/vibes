/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoWordService } from '@/core/LojoWordService.js';
import { lojoWordErrors, lojoWordItemParam, lojoWordSchema } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	description: 'Saves a word to your 生词本 with its two review cards, unless you have it already (then created is false).',
	limit: { duration: 60 * 60 * 1000, max: 600 },
	errors: {
		tooManyWords: lojoWordErrors.tooManyWords,
		invalidWord: lojoWordErrors.invalidWord,
	},
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			created: { type: 'boolean', optional: false, nullable: false },
			word: lojoWordSchema,
		},
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		item: lojoWordItemParam,
		source: { type: 'string', enum: ['post', 'gate', 'dictation', 'manual'] },
		noteId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: ['item', 'source'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoWordService: LojoWordService) {
		super(meta, paramDef, async (ps, me) => this.lojoWordService.add(me, ps.item, ps.source, ps.noteId ?? null));
	}
}
