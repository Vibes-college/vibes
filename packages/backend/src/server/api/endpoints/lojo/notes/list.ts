/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { LojoService } from '@/core/LojoService.js';
import { DI } from '@/di-symbols.js';
import { MiLojoEntityNote } from '@/models/LojoEntityNote.js';
import { lojoEntityId, lojoErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: false,
	errors: { noSuchEntity: lojoErrors.noSuchEntity },
	res: {
		type: 'array', optional: false, nullable: false,
		items: { type: 'object', optional: false, nullable: false, ref: 'Note' },
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		entityId: lojoEntityId,
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
	},
	required: ['entityId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository) private notesRepository: NotesRepository,
		private queryService: QueryService,
		private noteEntityService: NoteEntityService,
		private lojoService: LojoService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.lojoService.showEntity(ps.entityId);
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
				.innerJoin(MiLojoEntityNote, 'lojoLink', 'lojoLink.noteId = note.id AND lojoLink.entityId = :lojoEntityId', { lojoEntityId: ps.entityId })
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');
			this.queryService.generateVisibilityQuery(query, me);
			this.queryService.generateBaseNoteFilteringQuery(query, me);
			if (me) this.queryService.generateBlockQueryForUsers(query, me);
			return this.noteEntityService.packMany(await query.limit(ps.limit).getMany(), me);
		});
	}
}
