/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoGuideService } from '@/core/LojoGuideService.js';
import { guideIdParam, lojoGuideErrors } from '@/server/api/lojo-guide-schemas.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	kind: 'write:page-likes',
	prohibitMoved: true,
	limit: { duration: 60000, max: 60 },
	errors: lojoGuideErrors,
	res: { type: 'object', optional: false, nullable: false, properties: { saved: { type: 'boolean', optional: false, nullable: false } } },
} as const;

export const paramDef = {
	type: 'object',
	properties: { guideId: guideIdParam, saved: { type: 'boolean' } },
	required: ['guideId', 'saved'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private service: LojoGuideService) {
		super(meta, paramDef, async (ps, me) => this.service.bookmark(me, ps.guideId, ps.saved));
	}
}
