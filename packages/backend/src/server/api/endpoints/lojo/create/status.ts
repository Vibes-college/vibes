/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoCreateService } from '@/core/LojoCreateService.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account',
	description: 'Whether 创作讲解 works here, how many formats it knows, and whose notes it may use besides your own.',
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			available: { type: 'boolean', optional: false, nullable: false },
			forms: { type: 'integer', optional: false, nullable: false },
			sources: { type: 'array', optional: false, nullable: false, items: { type: 'string', optional: false, nullable: false } },
		},
	},
} as const;
export const paramDef = { type: 'object', properties: {}, required: [] } as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoCreateService: LojoCreateService) {
		super(meta, paramDef, async () => {
			return this.lojoCreateService.status();
		});
	}
}
