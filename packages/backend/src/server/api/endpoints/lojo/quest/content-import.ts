/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';
import { ApiError } from '@/server/api/error.js';
import { lojoQuestErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo', 'admin'], requireCredential: true, requireAdmin: true, kind: 'write:admin:meta',
	description: 'Import the 闯关 chapters (map, levels, questions) as a new version and use it at once, without a restart. Sent by apps/community/scripts/quest-import.mjs in the Vibes workspace; the questions hold the answers, so they are kept out of the public source. Every chapter is checked first, and a batch that drops a level a learner has progress on is refused: if anything fails, nothing is imported and the error lists it. The version before stays, for lojo/quest/content-rollback.',
	errors: { invalidContent: lojoQuestErrors.invalidContent },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			id: { type: 'integer', optional: false, nullable: false },
			version: { type: 'string', optional: false, nullable: false },
			chapters: { type: 'integer', optional: false, nullable: false },
			questions: { type: 'integer', optional: false, nullable: false },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		chapters: { type: 'array', items: { type: 'object' } },
		note: { type: 'string', maxLength: 512, default: '' },
	},
	required: ['chapters'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoQuestService: LojoQuestService) {
		super(meta, paramDef, async (ps) => {
			const res = await this.lojoQuestService.importContent(ps.chapters, ps.note);
			if ('problems' in res) {
				// the message goes into an HTTP header too, so it stays ASCII; the problems (in Chinese) are in info
				throw new ApiError({ ...lojoQuestErrors.invalidContent, message: `${lojoQuestErrors.invalidContent.message} ${res.problems.length} problem(s), see info.problems.` }, { problems: res.problems });
			}
			return res;
		});
	}
}
