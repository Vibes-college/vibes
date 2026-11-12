/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// A mini app adds one line to the summary index when a learner finishes a set. Needs the mini app service key.

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { LojoAppsService, lojoServiceKeyOk } from '@/core/LojoAppsService.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: false,
	description: 'A mini app reports one finished set to the summary index. Needs the mini app service key.',
	errors: {
		forbidden: { message: 'Forbidden.', code: 'FORBIDDEN', id: '8fd73156-1379-4013-bf3b-381f638f47f4' },
		badLine: { message: 'Bad line.', code: 'BAD_LINE', id: '813361e9-7de0-44e4-8e7b-19bc8d098c23' },
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		serviceKey: { type: 'string', maxLength: 200 },
		userId: { type: 'string', format: 'misskey:id' },
		app: { type: 'string', maxLength: 32 },
		line: {
			type: 'object',
			properties: {
				what: { type: 'string', minLength: 1, maxLength: 200 },
				right: { type: 'integer', nullable: true },
				total: { type: 'integer', nullable: true },
				note: { type: 'string', maxLength: 200 },
				at: { type: 'string', maxLength: 40 },
			},
			required: ['what'],
		},
	},
	required: ['serviceKey', 'userId', 'app', 'line'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoAppsService: LojoAppsService,
	) {
		super(meta, paramDef, async (ps) => {
			if (!lojoServiceKeyOk(ps.serviceKey)) throw new ApiError(meta.errors.forbidden);
			try {
				await this.lojoAppsService.report(ps.userId, ps.app, ps.line);
			} catch (e) {
				throw new ApiError(meta.errors.badLine, { reason: (e as Error).message });
			}
		});
	}
}
