/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoService } from '@/core/LojoService.js';
import { lojoEntityResponse, lojoEntityTypes } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: false,
	res: { type: 'array', optional: false, nullable: false, items: lojoEntityResponse },
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: lojoEntityTypes },
		limit: { type: 'integer', minimum: 1, maximum: 200, default: 100 },
		offset: { type: 'integer', minimum: 0, maximum: 10000, default: 0 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoService: LojoService) {
		super(meta, paramDef, async (ps) => this.lojoService.listEntities(ps.type, ps.limit, ps.offset));
	}
}
