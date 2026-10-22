/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoService } from '@/core/LojoService.js';
import { lojoEntityId, lojoErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:notes',
	limit: { duration: 60 * 1000, max: 60 },
	errors: { noSuchEntity: lojoErrors.noSuchEntity, noSuchNote: lojoErrors.noSuchNote, notYourNote: lojoErrors.notYourNote },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			entityId: { type: 'string', optional: false, nullable: false },
			noteId: { type: 'string', optional: false, nullable: false },
		},
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: { entityId: lojoEntityId, noteId: { type: 'string', format: 'misskey:id' } },
	required: ['entityId', 'noteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoService: LojoService) {
		super(meta, paramDef, async (ps, me) => this.lojoService.linkNote(ps.entityId, ps.noteId, me.id));
	}
}
