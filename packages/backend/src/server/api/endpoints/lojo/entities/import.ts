/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoService } from '@/core/LojoService.js';
import { lojoEntityParam, lojoErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, requireAdmin: true, kind: 'write:admin:account',
	limit: { duration: 60 * 1000, max: 10 },
	errors: { invalidEntity: lojoErrors.invalidEntity },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: { count: { type: 'integer', optional: false, nullable: false } },
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: { entities: { type: 'array', minItems: 1, maxItems: 200, items: lojoEntityParam } },
	required: ['entities'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoService: LojoService) {
		super(meta, paramDef, async (ps) => this.lojoService.importEntities(ps.entities));
	}
}
