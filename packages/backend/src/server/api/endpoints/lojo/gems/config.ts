/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoUsageService, USAGE_DEFAULTS, type UsageConfig } from '@/core/LojoUsageService.js';

// Admin: read or change the allowance and gem numbers without a release (kept in redis, lojoUsage:config).
// A field set to null goes back to its default.
export const meta = {
	tags: ['lojo', 'admin'], requireCredential: true, requireAdmin: true, kind: 'write:admin:meta',
	description: 'Read or change the Vibi allowance and gem settings. Costs are in millionths of a yuan.',
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		set: { type: 'object', nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoUsageService) {
		super(meta, paramDef, async (ps) => {
			const config = ps.set ? await this.svc.setConfig(ps.set as Partial<UsageConfig>) : await this.svc.config();
			return { config, defaults: USAGE_DEFAULTS };
		});
	}
}
