/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// A mini app (miniapps/<id> in this repo) registers itself in the directory each time it starts. Needs the service key
// MINIAPP_SERVICE_KEY, which only the mini app containers have.

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { LojoAppsService, lojoServiceKeyOk } from '@/core/LojoAppsService.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: false,
	description: 'A mini app registers itself in the directory. Needs the mini app service key.',
	errors: {
		forbidden: { message: 'Forbidden.', code: 'FORBIDDEN', id: '437c466b-9f75-4642-a81d-a4f5cbf1d91c' },
		badManifest: { message: 'Bad manifest.', code: 'BAD_MANIFEST', id: '628050ae-b1b6-4e5c-b58c-6b6bf17d6bdb' },
	},
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		serviceKey: { type: 'string', maxLength: 200 },
		app: { type: 'object' },
	},
	required: ['serviceKey', 'app'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoAppsService: LojoAppsService,
	) {
		super(meta, paramDef, async (ps) => {
			if (!lojoServiceKeyOk(ps.serviceKey)) throw new ApiError(meta.errors.forbidden);
			try {
				const app = await this.lojoAppsService.register(ps.app);
				return { id: app.id, version: app.version };
			} catch (e) {
				throw new ApiError(meta.errors.badManifest, { reason: (e as Error).message });
			}
		});
	}
}
