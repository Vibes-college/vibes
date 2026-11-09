/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { KEEP_DAYS, bootReportDay, bootReportKey, connReportKey, summarizeBootReports } from '@/misc/lojo-boot-report.js';
import type { BootReport, ConnReport } from '@/misc/lojo-boot-report.js';

export const meta = {
	tags: ['lojo', 'admin'],
	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:meta',
	description: 'Vibes stability report: for each of the last `days` days (Beijing time, today first), how many page loads there were, how many failed to start and why, and how long starting and the first content took (see src/misc/lojo-boot-report.ts).',
	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		days: { type: 'integer', minimum: 1, maximum: KEEP_DAYS, default: 7 },
	},
	required: [],
} as const;

function parseLines<T>(raw: string[]): T[] {
	const rows: T[] = [];
	for (const line of raw) {
		try {
			rows.push(JSON.parse(line) as T);
		} catch {
			// A damaged line is skipped.
		}
	}
	return rows;
}

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
	) {
		super(meta, paramDef, async (ps) => {
			const report = [];
			for (let i = 0; i < ps.days; i++) {
				const day = bootReportDay(Date.now() - i * 24 * 60 * 60 * 1000);
				const rows = parseLines<BootReport>(await this.redisClient.lrange(bootReportKey(day), 0, -1));
				const conns = parseLines<ConnReport>(await this.redisClient.lrange(connReportKey(day), 0, -1));
				report.push(summarizeBootReports(day, rows, conns));
			}
			return report;
		});
	}
}
