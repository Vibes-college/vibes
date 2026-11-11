/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// For Mia on Mastra (prototypes/mia-mastra in the workspace): the lookups Mia's tools need, so that service never reads
// the community's own tables for them. The service sends the shared secret LOJO_TUTOR_MASTRA_SECRET; an admin may call
// it too (for checks by hand).

import { timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import { lojoTutorIds } from '@/misc/lojo-tutor.js';
import { ApiError } from '@/server/api/error.js';
import { RoleService } from '@/core/RoleService.js';

// The shared secret, compared in constant time; with no secret set, only admins get in.
function secretOk(given: string | null | undefined): boolean {
	const want = process.env.LOJO_TUTOR_MASTRA_SECRET ?? '';
	if (want.length < 16 || typeof given !== 'string') return false;
	const a = Buffer.from(given);
	const b = Buffer.from(want);
	return a.length === b.length && timingSafeEqual(a, b);
}

export const meta = {
	tags: ['lojo', 'admin'],
	requireCredential: false,
	description: 'Mia on Mastra: Mia\'s fixed prompt, the progress card, keyword search of the learner\'s chat with Mia, their wordbook and the mistakes of a quest level. Needs the shared secret, or an admin.',
	errors: {
		noSuchTutor: { message: 'No such tutor.', code: 'NO_SUCH_TUTOR', id: '0b6d1b8e-3a0c-4a51-9a8e-6a0f5c2d7e11' },
		forbidden: { message: 'Forbidden.', code: 'FORBIDDEN', id: '5c1f3f0e-8f7a-4b8e-9f43-2b1d6f9a0c77' },
	},
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		tool: { type: 'string', enum: ['prompt', 'progress', 'searchChat', 'wordbook', 'levelMistakes'] },
		secret: { type: 'string', maxLength: 200, nullable: true },
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
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (!secretOk(ps.secret) && !(me != null && await this.roleService.isAdministrator(me))) throw new ApiError(meta.errors.forbidden);
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
