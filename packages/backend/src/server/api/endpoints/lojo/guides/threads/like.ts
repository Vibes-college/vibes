/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoGuideService } from '@/core/LojoGuideService.js';
import { guideIdParam, guideAnchorParam, guideThreadResponse, lojoGuideErrors } from '@/server/api/lojo-guide-schemas.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	kind: 'write:reactions',
	prohibitMoved: true,
	limit: { duration: 60000, max: 60 },
	errors: lojoGuideErrors,
	res: guideThreadResponse,
} as const;

export const paramDef = {
	type: 'object',
	properties: { guideId: guideIdParam, threadId: guideIdParam, anchor: guideAnchorParam, liked: { type: 'boolean' } },
	required: ['guideId', 'liked'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private service: LojoGuideService) {
		super(meta, paramDef, async (ps, me) => this.service.likeThread(me, ps));
	}
}
