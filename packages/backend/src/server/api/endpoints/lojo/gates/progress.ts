/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoGateService } from '@/core/LojoGateService.js';
import { lojoGateProgressSchema } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account',
	description: 'Every station of a route map with gates (IELTS), and which ones you have passed, can take on or have to wait for.',
	res: lojoGateProgressSchema,
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		course: { type: 'string', minLength: 1, maxLength: 32 },
	},
	required: ['course'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoGateService: LojoGateService) {
		super(meta, paramDef, async (ps, me) => this.lojoGateService.progress(me.id, ps.course));
	}
}
