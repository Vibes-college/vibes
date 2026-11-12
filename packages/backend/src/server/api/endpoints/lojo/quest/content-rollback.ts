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
	description: 'Go back to the 闯关 version before the one in use (or to the one given), at once, without a restart. Refused if that version lacks a level a learner has progress on. The newer version is kept, so it can be put back the same way.',
	errors: { invalidContent: lojoQuestErrors.invalidContent },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			id: { type: 'integer', optional: false, nullable: false },
			version: { type: 'string', optional: false, nullable: false },
			from: { type: 'integer', optional: false, nullable: true },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		to: { type: 'integer', nullable: true, default: null },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoQuestService: LojoQuestService) {
		super(meta, paramDef, async (ps) => {
			const res = await this.lojoQuestService.rollbackContent(ps.to ?? null);
			if ('problems' in res) throw new ApiError({ ...lojoQuestErrors.invalidContent, message: `${lojoQuestErrors.invalidContent.message} ${res.problems.length} problem(s), see info.problems.` }, { problems: res.problems });
			return res;
		});
	}
}
