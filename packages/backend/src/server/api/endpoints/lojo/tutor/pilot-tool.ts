/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// For the Mastra pilot of Mia on the LAN test site (prototypes/mia-mastra in the workspace): the lookups Mia's tools
// need, so the pilot service never reads the community database itself. Admin only.

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import { lojoTutorIds } from '@/misc/lojo-tutor.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['lojo', 'admin'],
	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:meta',
	description: 'Mastra pilot (test site only): Mia\'s fixed prompt, the progress card, keyword search of the learner\'s chat with Mia, their wordbook and the mistakes of a quest level.',
	errors: {
		noSuchTutor: { message: 'No such tutor.', code: 'NO_SUCH_TUTOR', id: '0b6d1b8e-3a0c-4a51-9a8e-6a0f5c2d7e11' },
	},
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		tool: { type: 'string', enum: ['prompt', 'progress', 'searchChat', 'wordbook', 'levelMistakes'] },
		learnerId: { type: 'string', format: 'misskey:id' },
		tutorId: { type: 'string', format: 'misskey:id', nullable: true },
		query: { type: 'string', maxLength: 1000 },
		levelId: { type: 'string', maxLength: 64, nullable: true },
		limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
	},
	required: ['tool', 'learnerId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private lojoTutorService: LojoTutorService,
	) {
		super(meta, paramDef, async (ps) => {
			const tutorId = ps.tutorId ?? lojoTutorIds()[0];
			if (tutorId == null || !lojoTutorIds().includes(tutorId)) throw new ApiError(meta.errors.noSuchTutor);
			switch (ps.tool) {
				case 'prompt':
					return await this.lojoTutorService.pilotPrompt(tutorId, ps.learnerId);
				case 'progress':
					return { card: await this.lojoTutorService.progressCard(ps.learnerId) };
				case 'searchChat':
					return { hits: await this.lojoTutorService.searchChat(tutorId, ps.learnerId, ps.query ?? '', { limit: ps.limit, minScore: 1 }) };
				case 'wordbook': {
					const facts = await this.lojoTutorService.wordbookFacts(ps.learnerId);
					const words = await this.db.query<{ text: string; meaning: string; due: Date | null }[]>(
						'SELECT w."text", w."meaning", MIN(c."due") AS due FROM "lojo_word" w LEFT JOIN "lojo_word_card" c ON c."wordId" = w."id" WHERE w."userId" = $1 GROUP BY w."id" ORDER BY w."createdAt" DESC LIMIT $2',
						[ps.learnerId, ps.limit * 4],
					);
					return { ...facts, recent: words.map(w => ({ text: w.text, meaning: w.meaning.slice(0, 80), due: w.due?.toISOString().slice(0, 10) ?? null })) };
				}
				case 'levelMistakes':
					return { mistakes: await this.lojoTutorService.questMistakes?.(ps.learnerId, ps.levelId ?? null) ?? null };
			}
		});
	}
}
