/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { bootReportDay, bootReportLimits, bootReportBrowsers, bootReportOs, connReportKey, speedFieldsOn, whereOf } from '@/misc/lojo-boot-report.js';
import type { ConnReport } from '@/misc/lojo-boot-report.js';
import { lookupIpRegion } from '@/misc/lojo-ip-region.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: false,
	description: 'Vibes: an anonymous record of how the live connection held up while a page was open, sent without the account when the page goes to the background or is closed (see src/misc/lojo-boot-report.ts, ConnReport). Kept only where LOJO_SPEED_FIELDS=on.',
	limit: { duration: 60 * 60 * 1000, max: 300 },
	errors: {},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		os: { type: 'string', enum: bootReportOs },
		browser: { type: 'string', enum: bootReportBrowsers },
		bot: { type: 'boolean' },
		visibleSec: { type: 'integer', minimum: 0, maximum: 86400 },
		drops: { type: 'integer', minimum: 0, maximum: 1000 },
		hiddenDrops: { type: 'integer', minimum: 0, maximum: 1000 },
		reconnectMs: { type: 'array', maxItems: 10, items: { type: 'integer', minimum: 0, maximum: 600000 } },
		down: { type: 'boolean' },
	},
	required: ['os', 'browser', 'bot', 'visibleSec', 'drops', 'hiddenDrops', 'reconnectMs', 'down'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
	) {
		super(meta, paramDef, async (ps, _me, _token, _file, _cleanup, ip, headers) => {
			if (!speedFieldsOn()) return;
			// The account is never read; the address only for the coarse region (see lojo/boot-report), then dropped.
			const report: ConnReport = {
				t: Math.floor(Date.now() / 1000),
				...whereOf(lookupIpRegion(ip), headers),
				os: ps.os,
				browser: ps.browser,
				bot: ps.bot,
				visibleSec: ps.visibleSec,
				drops: ps.drops,
				hiddenDrops: ps.hiddenDrops,
				reconnectMs: ps.reconnectMs,
				down: ps.down,
			};
			const key = connReportKey(bootReportDay());
			const { maxPerDay, keepSeconds } = bootReportLimits();
			await this.redisClient.multi()
				.rpush(key, JSON.stringify(report))
				.ltrim(key, -maxPerDay, -1)
				.expire(key, keepSeconds)
				.exec();
		});
	}
}
