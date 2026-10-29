/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoGateService } from '@/core/LojoGateService.js';
import { lojoGateErrors, lojoGatePeersSchema } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account',
	description: '同路人: the people who tried a gate in the last 30 days, the latest first (up to `limit`), and how many in all. Leaves out you, people you block or mute or who block you, bots, suspended accounts, people who are not discoverable or hide their online status, and profiles under 18.',
	limit: { duration: 60 * 60 * 1000, max: 300 },
	errors: {
		noSuchCourse: lojoGateErrors.noSuchCourse,
		noSuchStation: lojoGateErrors.noSuchStation,
	},
	res: lojoGatePeersSchema,
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		course: { type: 'string', minLength: 1, maxLength: 32 },
		station: { type: 'string', minLength: 1, maxLength: 16 },
		limit: { type: 'integer', minimum: 1, maximum: 50, default: 6 },
	},
	required: ['course', 'station'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoGateService: LojoGateService) {
		super(meta, paramDef, async (ps, me) => this.lojoGateService.peers(me, ps.course, ps.station, ps.limit));
	}
}
