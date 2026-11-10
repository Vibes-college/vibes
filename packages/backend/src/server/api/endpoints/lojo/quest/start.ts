/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';
import { lojoQuestErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	description: 'Starts a try at a level or the Boss and draws its questions (new ones first on a retry). Costs nothing; wrong answers cost a heart, except in practice levels.',
	limit: { duration: 60 * 60 * 1000, max: 300 },
	errors: { noSuchLevel: lojoQuestErrors.noSuchLevel, levelLocked: lojoQuestErrors.levelLocked, noHearts: lojoQuestErrors.noHearts, bossNotReady: lojoQuestErrors.bossNotReady },
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: { levelId: { type: 'string', maxLength: 32 } },
	required: ['levelId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps, me) => this.svc.start(me.id, ps.levelId));
	}
}
