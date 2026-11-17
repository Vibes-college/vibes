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
	tags: ['lojo', 'admin'], requireCredential: true, requireAdmin: true, kind: 'read:admin:meta',
	description: 'The imported versions of one content kind, newest first (the last 30), and which one this process is using now.',
	errors: { unknownKind: lojoContentErrors.unknownKind },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			inUse: {
				type: 'object', optional: false, nullable: false,
				properties: {
					id: { type: 'integer', optional: false, nullable: true },
					version: { type: 'string', optional: false, nullable: true },
				},
			},
			versions: {
				type: 'array', optional: false, nullable: false,
				items: {
					type: 'object', optional: false, nullable: false,
					properties: {
						id: { type: 'integer', optional: false, nullable: false },
						version: { type: 'string', optional: false, nullable: false },
						active: { type: 'boolean', optional: false, nullable: false },
						createdAt: { type: 'string', optional: false, nullable: false, format: 'date-time' },
						note: { type: 'string', optional: false, nullable: false },
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		kind: { type: 'string', minLength: 1, maxLength: 64 },
	},
	required: ['kind'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoContentService: LojoContentService) {
		super(meta, paramDef, async (ps) => {
			if (!this.lojoContentService.has(ps.kind)) throw new ApiError(lojoContentErrors.unknownKind, { kinds: this.lojoContentService.kindNames() });
			await this.lojoContentService.refresh(ps.kind);
			return { inUse: this.lojoContentService.inUse(ps.kind), versions: await this.lojoContentService.versions(ps.kind) };
		});
	}
}
