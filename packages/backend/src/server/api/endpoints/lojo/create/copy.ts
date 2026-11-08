/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoCreateService } from '@/core/LojoCreateService.js';
import { lojoCreateDraftRes, lojoCreateErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	description: 'Write the copy for one of your plans for a note (创作讲解), from your own idea, story, standard and tone, then check it once more against the note. Saved as a draft in your registry (scope lojo/create). Takes about 20 s.',
	limit: { duration: 60 * 60 * 1000, max: 30 },
	errors: lojoCreateErrors,
	res: lojoCreateDraftRes,
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		planIndex: { type: 'integer', minimum: 0, maximum: 4 },
		idea: { type: 'string', minLength: 4, maxLength: 1000 },
		story: { type: 'string', maxLength: 2000, default: '' },
		standard: { type: 'string', maxLength: 1000, default: '' },
		tone: { type: 'string', maxLength: 20, default: '' },
	},
	required: ['noteId', 'planIndex', 'idea'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoCreateService: LojoCreateService) {
		super(meta, paramDef, async (ps, me) => {
			return this.lojoCreateService.copy(me, ps.noteId, ps.planIndex, {
				idea: ps.idea.trim(),
				story: ps.story.trim(),
				standard: ps.standard.trim(),
				tone: ps.tone.trim(),
			});
		});
	}
}
