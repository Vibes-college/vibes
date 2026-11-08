/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoCreateService } from '@/core/LojoCreateService.js';
import { lojoCreateErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo', 'admin'], requireCredential: true, requireAdmin: true, kind: 'write:admin:meta',
	description: 'Replace what 创作讲解 works from: the formats (形式卡) Vibes took apart from viral posts, and the local accounts whose notes anyone may use besides their own. Sent by apps/community/scripts/create-import.mjs in the Vibes workspace; the formats are kept out of the public source.',
	errors: { invalidConfig: lojoCreateErrors.invalidConfig },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			forms: { type: 'integer', optional: false, nullable: false },
			sources: { type: 'integer', optional: false, nullable: false },
		},
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		forms: { type: 'array', items: { type: 'object' } },
		sources: { type: 'array', items: { type: 'string' } },
	},
	required: ['forms', 'sources'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoCreateService: LojoCreateService) {
		super(meta, paramDef, async (ps) => {
			return this.lojoCreateService.importConfig({ forms: ps.forms, sources: ps.sources });
		});
	}
}
