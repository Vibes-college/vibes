/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoCreateService } from '@/core/LojoCreateService.js';
import { lojoCreateErrors, lojoCreatePlansRes } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account',
	description: 'Marketing plans for a note (创作讲解), made by the formats Vibes took apart from viral posts. Kept for a week per person and note; refresh makes new ones. Takes about 25 s.',
	limit: { duration: 60 * 60 * 1000, max: 30 },
	errors: lojoCreateErrors,
	res: lojoCreatePlansRes,
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
	constructor(private lojoCreateService: LojoCreateService) {
		super(meta, paramDef, async (ps, me) => {
			return this.lojoCreateService.plans(me, ps.noteId, ps.refresh);
		});
	}
}
