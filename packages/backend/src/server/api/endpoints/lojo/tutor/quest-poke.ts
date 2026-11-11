/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import { lojoTutorIds } from '@/misc/lojo-tutor.js';

export const meta = {
	tags: ['lojo', 'admin'], requireCredential: true, requireAdmin: true, kind: 'write:admin:meta',
	description: 'Have the AI tutor write first about a failed quest try, as after "Ask Mia" (for trying quest mode out with a sample try).',
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			status: { type: 'string', optional: false, nullable: false, enum: ['sent', 'already', 'limit', 'off'] },
			tutorId: { type: 'string', optional: false, nullable: true },
		},
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		tutorId: { type: 'string', format: 'misskey:id' },
		// "This try", same shape the quest service builds (lojo-tutor-quest.ts QuestTry)
		questTry: { type: 'object' },
	},
	required: ['userId', 'questTry'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoTutorService: LojoTutorService) {
		super(meta, paramDef, async (ps) => {
			const tutorId = ps.tutorId ?? lojoTutorIds()[0] ?? null;
			if (tutorId == null) return { status: 'off' as const, tutorId };
			const status = await this.lojoTutorService.openFromQuest(tutorId, ps.userId, ps.questTry);
			// "away" (model account unavailable) shows as off here, so this admin tool's schema stays as it is.
			return { status: status === 'away' ? 'off' as const : status, tutorId };
		});
	}
}
