/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	description: 'A practice app finished one set. It counts with at least 10 items and 2 minutes, once a day per setKey: Boss prep and the streak tick, and 1 heart comes back if below 5 and the 装备 path has not given one today (语法线 gives none in v1). 生词本 sets are checked against its saved reviews.',
	limit: { duration: 60 * 60 * 1000, max: 200 },
	errors: {},
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: { app: { type: 'string', enum: ['dictation', 'typing', 'vocab', 'grammar', 'wordbook', 'photo-words'] }, setKey: { type: 'string', minLength: 1, maxLength: 200 }, items: { type: 'integer', minimum: 0, maximum: 10000 }, durationMs: { type: 'integer', minimum: 0, maximum: 86400000 }, startedAt: { type: 'number' } },
	required: ['app', 'setKey', 'items', 'durationMs', 'startedAt'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps, me) => this.svc.refill(me.id, ps));
	}
}
