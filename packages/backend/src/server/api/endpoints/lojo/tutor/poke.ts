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
	description: 'Have the AI tutor write first to a learner now, skipping the daily schedule (for trying it out).',
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			sent: { type: 'boolean', optional: false, nullable: false },
		},
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		tutorId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoTutorService: LojoTutorService) {
		super(meta, paramDef, async (ps) => {
			const tutorId = ps.tutorId ?? lojoTutorIds()[0];
			if (tutorId == null) return { sent: false };
			return { sent: await this.lojoTutorService.writeFirst(tutorId, ps.userId) };
		});
	}
}
