/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';

export const meta = {
	tags: ['lojo', 'admin'], requireCredential: true, requireAdmin: true, kind: 'read:admin:meta',
	description: 'The imported 闯关 versions, newest first (the last 30), and which one this process is using now.',
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			inUse: {
				type: 'object', optional: false, nullable: false,
				properties: {
					id: { type: 'integer', optional: false, nullable: true },
					version: { type: 'string', optional: false, nullable: true },
				},
			},
			versions: {
				type: 'array', optional: false, nullable: false,
				items: {
					type: 'object', optional: false, nullable: false,
					properties: {
						id: { type: 'integer', optional: false, nullable: false },
						version: { type: 'string', optional: false, nullable: false },
						active: { type: 'boolean', optional: false, nullable: false },
						createdAt: { type: 'string', optional: false, nullable: false, format: 'date-time' },
						note: { type: 'string', optional: false, nullable: false },
					},
				},
			},
		},
	},
} as const;

export const paramDef = { type: 'object', properties: {}, required: [] } as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoQuestService: LojoQuestService) {
		super(meta, paramDef, async () => {
			await this.lojoQuestService.refreshContent();
			return { inUse: this.lojoQuestService.contentInUse(), versions: await this.lojoQuestService.contentVersions() };
		});
	}
}
