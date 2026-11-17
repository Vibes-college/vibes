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
	description: 'Go back to the version of this content kind before the one in use (or to the one given), at once, without a restart. The version is checked again first. The newer version is kept, so it can be put back the same way.',
	errors: { unknownKind: lojoContentErrors.unknownKind, invalidContent: lojoContentErrors.invalidContent },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			id: { type: 'integer', optional: false, nullable: false },
			kind: { type: 'string', optional: false, nullable: false },
			version: { type: 'string', optional: false, nullable: false },
			from: { type: 'integer', optional: false, nullable: true },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		kind: { type: 'string', minLength: 1, maxLength: 64 },
		to: { type: 'integer', nullable: true, default: null },
	},
	required: ['kind'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoContentService: LojoContentService) {
		super(meta, paramDef, async (ps) => {
			if (!this.lojoContentService.has(ps.kind)) throw new ApiError(lojoContentErrors.unknownKind, { kinds: this.lojoContentService.kindNames() });
			const res = await this.lojoContentService.rollback(ps.kind, ps.to ?? null);
			if ('problems' in res) throw new ApiError({ ...lojoContentErrors.invalidContent, message: `${lojoContentErrors.invalidContent.message} ${res.problems.length} problem(s), see info.problems.` }, { problems: res.problems });
			return res;
		});
	}
}
