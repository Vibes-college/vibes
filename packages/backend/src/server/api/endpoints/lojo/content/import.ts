/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoContentService } from '@/core/LojoContentService.js';
import { ApiError } from '@/server/api/error.js';
import { lojoContentErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo', 'admin'], requireCredential: true, requireAdmin: true, kind: 'write:admin:meta',
	description: 'Import private content of one kind (e.g. "quest-books": the 锦囊书屋 books and their quizzes) as a new version and use it at once, without a restart. Sent by apps/community/scripts/content-import.mjs in the Vibes workspace; the content is kept out of the public source. Everything is checked first: if anything fails, nothing is imported and the error lists it. The version before stays, for lojo/content/rollback.',
	errors: { unknownKind: lojoContentErrors.unknownKind, invalidContent: lojoContentErrors.invalidContent },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			id: { type: 'integer', optional: false, nullable: false },
			kind: { type: 'string', optional: false, nullable: false },
			version: { type: 'string', optional: false, nullable: false },
			// the version in use before this import
			from: { type: 'integer', optional: false, nullable: true },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		kind: { type: 'string', minLength: 1, maxLength: 64 },
		version: { type: 'string', minLength: 1, maxLength: 256 },
		data: { type: 'object' },
		note: { type: 'string', maxLength: 512, default: '' },
	},
	required: ['kind', 'version', 'data'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoContentService: LojoContentService) {
		super(meta, paramDef, async (ps) => {
			if (!this.lojoContentService.has(ps.kind)) throw new ApiError(lojoContentErrors.unknownKind, { kinds: this.lojoContentService.kindNames() });
			const res = await this.lojoContentService.import(ps.kind, ps.data, ps.version, ps.note);
			if ('problems' in res) {
				// the message goes into an HTTP header too, so it stays ASCII; the problems (in Chinese) are in info
				throw new ApiError({ ...lojoContentErrors.invalidContent, message: `${lojoContentErrors.invalidContent.message} ${res.problems.length} problem(s), see info.problems.` }, { problems: res.problems });
			}
			return res;
		});
	}
}
