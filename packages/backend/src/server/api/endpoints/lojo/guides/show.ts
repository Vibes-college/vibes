/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoGuideService } from '@/core/LojoGuideService.js';
import { guideIdParam, guideResponse, guideSlugParam, lojoGuideErrors } from '@/server/api/lojo-guide-schemas.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: false,
	kind: 'read:pages',
	limit: { duration: 60000, max: 120 },
	errors: lojoGuideErrors,
	res: guideResponse,
} as const;

// by id, or by the slug of a guide imported from the workspace
export const paramDef = {
	anyOf: [
		{ type: 'object', properties: { guideId: guideIdParam }, required: ['guideId'] },
		{ type: 'object', properties: { slug: guideSlugParam }, required: ['slug'] },
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private service: LojoGuideService) {
		super(meta, paramDef, async (ps, me) => this.service.show(me, ps));
	}
}
