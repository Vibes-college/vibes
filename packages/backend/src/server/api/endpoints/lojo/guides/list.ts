/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoGuideService } from '@/core/LojoGuideService.js';
import { guideResponse, lojoGuideErrors } from '@/server/api/lojo-guide-schemas.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: false,
	kind: 'read:pages',
	limit: { duration: 60000, max: 120 },
	errors: lojoGuideErrors,
	res: { type: 'array', optional: false, nullable: false, items: guideResponse },
} as const;

export const paramDef = {
	type: 'object',
	properties: { featuredOnly: { type: 'boolean', default: false }, category: { type: 'string', maxLength: 40 }, search: { type: 'string', maxLength: 200 }, savedOnly: { type: 'boolean', default: false }, mine: { type: 'boolean', default: false }, limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 }, offset: { type: 'integer', minimum: 0, maximum: 10000, default: 0 } },
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private service: LojoGuideService) {
		super(meta, paramDef, async (ps, me) => this.service.list(me, ps));
	}
}
