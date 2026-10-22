/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoService } from '@/core/LojoService.js';
import { lojoErrors, lojoStateParam, lojoStateResponse } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	limit: { duration: 60 * 1000, max: 120 },
	errors: { stateConflict: lojoErrors.stateConflict, invalidState: lojoErrors.invalidState },
	res: lojoStateResponse,
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		expectedRevision: { type: 'integer', minimum: 0, maximum: 2147483646 },
		state: lojoStateParam,
	},
	required: ['expectedRevision', 'state'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoService: LojoService) {
		super(meta, paramDef, async (ps, me) => this.lojoService.updateState(me.id, ps.expectedRevision, ps.state));
	}
}
