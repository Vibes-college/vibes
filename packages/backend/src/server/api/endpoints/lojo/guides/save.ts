/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoGuideService } from '@/core/LojoGuideService.js';
import { guideIdParam, guideBlockParam, guideResponse, lojoGuideErrors } from '@/server/api/lojo-guide-schemas.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	kind: 'write:pages',
	prohibitMoved: true,
	limit: { duration: 60000, max: 60 },
	errors: lojoGuideErrors,
	res: guideResponse,
} as const;

export const paramDef = {
	type: 'object',
	properties: { guideId: guideIdParam, expectedRevision: { type: 'integer', minimum: 1 }, title: { type: 'string', minLength: 1, maxLength: 160 }, summary: { type: 'string', maxLength: 600 }, category: { type: 'string', enum: ['housing', 'ai', 'career', 'abroad', 'life', 'sport', 'pets', 'travel'] }, city: { type: 'string', maxLength: 80 }, coverUrl: { type: 'string', maxLength: 2048, nullable: true }, blocks: { type: 'array', maxItems: 200, items: guideBlockParam }, status: { type: 'string', enum: ['draft', 'published'] }, isDemo: { type: 'boolean' } },
	required: ['title', 'summary', 'category', 'city', 'blocks', 'status'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private service: LojoGuideService) {
		super(meta, paramDef, async (ps, me) => this.service.save(me, ps));
	}
}
