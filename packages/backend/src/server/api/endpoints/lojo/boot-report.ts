/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { bootReportDay, bootReportKey, bootReportLimits, bootReportBrowsers, bootReportNavs, bootReportOs } from '@/misc/lojo-boot-report.js';
import type { BootReport } from '@/misc/lojo-boot-report.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: false,
	description: 'Vibes: an anonymous record of how fast the app started on this device, sent once per page load without the account (see src/misc/lojo-boot-report.ts). Stored per day for the stability report.',
	limit: { duration: 60 * 60 * 1000, max: 300 },
	errors: {},
} as const;

const optionalMs = { type: 'integer', minimum: 0, maximum: 600000, nullable: true } as const;

export const paramDef = {
	type: 'object',
	properties: {
		v: { type: 'string', minLength: 1, maxLength: 80 },
		page: { type: 'string', pattern: '^[a-z][a-z0-9-]{0,31}$' },
		nav: { type: 'string', enum: bootReportNavs },
		os: { type: 'string', enum: bootReportOs },
		browser: { type: 'string', enum: bootReportBrowsers },
		standalone: { type: 'boolean' },
		signedIn: { type: 'boolean' },
		sw: { type: 'boolean' },
		codeKb: { type: 'integer', minimum: -1, maximum: 100000 },
		retries: { type: 'integer', minimum: 0, maximum: 10 },
		bootMs: optionalMs,
		contentMs: optionalMs,
		keptContent: { type: 'boolean', nullable: true },
		firstApiMs: optionalMs,
		error: { type: 'string', pattern: '^[A-Z_]{1,40}$', nullable: true },
	},
	required: ['v', 'page', 'nav', 'os', 'browser', 'standalone', 'signedIn', 'sw', 'codeKb', 'retries', 'bootMs'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
	) {
		super(meta, paramDef, async (ps) => {
			// Only these fields are kept; the account and the address are never read here.
			const report: BootReport = {
				t: Math.floor(Date.now() / 1000),
				v: ps.v,
				page: ps.page,
				nav: ps.nav,
				os: ps.os,
				browser: ps.browser,
				standalone: ps.standalone,
				signedIn: ps.signedIn,
				sw: ps.sw,
				codeKb: ps.codeKb,
				retries: ps.retries,
				bootMs: ps.bootMs ?? null,
				contentMs: ps.contentMs ?? null,
				keptContent: ps.keptContent ?? null,
				firstApiMs: ps.firstApiMs ?? null,
				error: ps.error ?? null,
			};
			const key = bootReportKey(bootReportDay());
			const { maxPerDay, keepSeconds } = bootReportLimits();
			await this.redisClient.multi()
				.rpush(key, JSON.stringify(report))
				.ltrim(key, -maxPerDay, -1)
				.expire(key, keepSeconds)
				.exec();
		});
	}
}
