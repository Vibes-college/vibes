/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoGuideService } from '@/core/LojoGuideService.js';
import { guideIdParam, guideAnchorParam, guideThreadResponse, guideCommentResponse, lojoGuideErrors } from '@/server/api/lojo-guide-schemas.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	kind: 'write:notes',
	prohibitMoved: true,
	limit: { duration: 60000, max: 15 },
	errors: lojoGuideErrors,
	res: { type: 'object', optional: false, nullable: false, properties: { thread: guideThreadResponse, comment: guideCommentResponse } },
} as const;

export const paramDef = {
	type: 'object',
	properties: { guideId: guideIdParam, threadId: guideIdParam, anchor: guideAnchorParam, text: { type: 'string', maxLength: 3000 }, fileIds: { type: 'array', maxItems: 4, uniqueItems: true, items: guideIdParam, default: [] }, replyToId: guideIdParam },
	required: ['guideId', 'text'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private service: LojoGuideService) {
		super(meta, paramDef, async (ps, me) => this.service.createComment(me, ps));
	}
}
