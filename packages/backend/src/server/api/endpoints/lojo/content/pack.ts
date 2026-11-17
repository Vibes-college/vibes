/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoContentService } from '@/core/LojoContentService.js';
import { ApiError } from '@/server/api/error.js';
import { lojoContentErrors } from '@/server/api/lojo-schemas.js';

// 课程内容进数据库 (2026-11-17): the gate pages read a course's route pack from here instead of from the compiled
// frontend. The page keeps a copy on the device and sends its hash as `have`; when it is still the version in use, the
// answer has no data (a few bytes), so a second visit costs one small round trip in the background.
export const meta = {
	tags: ['lojo'],
	requireCredential: false,
	limit: { duration: 60_000, max: 60 },
	description: 'The version in use of a public content kind (a course route pack, kind course-<id>). Without data when `have` is its hash.',
	errors: { unknownKind: lojoContentErrors.unknownKind, notImportedYet: lojoContentErrors.notImportedYet },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			kind: { type: 'string', optional: false, nullable: false },
			version: { type: 'string', optional: false, nullable: false },
			hash: { type: 'string', optional: false, nullable: false },
			data: { type: 'object', optional: true, nullable: false },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		kind: { type: 'string', minLength: 1, maxLength: 64 },
		have: { type: 'string', maxLength: 64 },
	},
	required: ['kind'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoContentService: LojoContentService) {
		super(meta, paramDef, async (ps) => {
			// kinds that are not public (the 锦囊书屋 quizzes carry their answers) answer as if they did not exist
			if (!this.lojoContentService.isPublic(ps.kind)) throw new ApiError(lojoContentErrors.unknownKind);
			const pack = this.lojoContentService.publicPack(ps.kind);
			if (pack == null) throw new ApiError(lojoContentErrors.notImportedYet);
			if (ps.have === pack.hash) return { kind: ps.kind, version: pack.version, hash: pack.hash };
			return { kind: ps.kind, version: pack.version, hash: pack.hash, data: pack.data as Record<string, unknown> };
		});
	}
}
