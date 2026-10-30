/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoWordService } from '@/core/LojoWordService.js';
import { lojoWordErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	description: 'Removes a word from your 生词本, with its cards and their reviews.',
	limit: { duration: 60 * 60 * 1000, max: 600 },
	errors: {
		noSuchWord: lojoWordErrors.noSuchWord,
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		wordId: { type: 'string', format: 'misskey:id' },
	},
	required: ['wordId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoWordService: LojoWordService) {
		super(meta, paramDef, async (ps, me) => {
			await this.lojoWordService.remove(me, ps.wordId);
		});
	}
}
