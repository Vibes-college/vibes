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
	description: 'Start a whole timed set (SR-5, SL-5) or the mock (MOCK) of the three-stage route: one old gate per part, done in order on the gate page (the gate picked for each part is in route.run). cancel drops the run in hand. Returns the same as lojo/quest/show.',
	limit: { duration: 60 * 60 * 1000, max: 60 },
	errors: { noSuchLevel: lojoQuestErrors.noSuchLevel, levelLocked: lojoQuestErrors.levelLocked },
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		station: { type: 'string', minLength: 1, maxLength: 16 },
		cancel: { type: 'boolean', default: false },
	},
	required: ['station'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps, me) => (ps.cancel ? this.svc.cancelRun(me.id) : this.svc.startRun(me.id, ps.station)));
	}
}
