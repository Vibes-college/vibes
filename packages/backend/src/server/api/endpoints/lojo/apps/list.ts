/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The mini app directory: what each app is, where it lives and its kinds of data. Public (nothing personal in it).

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoAppsService } from '@/core/LojoAppsService.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: false,
	allowGet: true,
	cacheSec: 30,
	description: 'The mini app directory.',
	res: { type: 'array', optional: false, nullable: false, items: { type: 'object', optional: false, nullable: false } },
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoAppsService: LojoAppsService,
	) {
		super(meta, paramDef, async () => {
			return (await this.lojoAppsService.all()).map(a => ({ id: a.id, name: a.name, summary: a.summary, url: a.base, version: a.version, kinds: a.kinds }));
		});
	}
}
