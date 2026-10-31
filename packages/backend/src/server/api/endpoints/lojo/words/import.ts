/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoWordService } from '@/core/LojoWordService.js';
import { WORD_SOURCES } from '@/misc/lojo-words.js';
import { lojoWordItemParam } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	description: 'Moves words saved before the 生词本 had reviews (in the account registry) into it. Words you already have are skipped; the rest keep the time they were saved.',
	limit: { duration: 60 * 60 * 1000, max: 20 },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			added: { type: 'integer', optional: false, nullable: false },
		},
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		entries: {
			type: 'array', maxItems: 2000,
			items: {
				type: 'object',
				properties: {
					item: lojoWordItemParam,
					source: { type: 'string', enum: WORD_SOURCES },
					noteId: { type: 'string', format: 'misskey:id', nullable: true },
					addedAt: { type: 'integer', minimum: 0 },
				},
				required: ['item', 'source', 'addedAt'],
			},
		},
	},
	required: ['entries'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoWordService: LojoWordService) {
		super(meta, paramDef, async (ps, me) => this.lojoWordService.import(me, ps.entries.map(e => ({ ...e, noteId: e.noteId ?? null }))));
	}
}
