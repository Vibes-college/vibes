/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoUsageService } from '@/core/LojoUsageService.js';

// The chat page's usage line for Vibi: how much of the 5-hour and weekly allowance is used, when each comes back, and
// whether gems are in use. gems is in thousandths of a gem.
export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account',
	description: 'Your own Vibi allowance: percent used of the 5-hour and weekly windows, when they reset, and your gems.',
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			fivePct: { type: 'number', optional: false, nullable: false },
			fiveResetAt: { type: 'string', optional: false, nullable: true },
			weekPct: { type: 'number', optional: false, nullable: false },
			weekResetAt: { type: 'string', optional: false, nullable: true },
			state: { type: 'string', optional: false, nullable: false, enum: ['ok', 'gems', 'out'] },
			backAt: { type: 'string', optional: false, nullable: true },
			gems: { type: 'number', optional: false, nullable: false },
		},
	},
} as const;
export const paramDef = { type: 'object', properties: {}, required: [] } as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoUsageService) {
		super(meta, paramDef, async (ps, me) => this.svc.status(me.id));
	}
}
