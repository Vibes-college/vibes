/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoWordService } from '@/core/LojoWordService.js';
import { lojoWordSchema } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account',
	description: '生词本: every word you saved, the newest first, with its two review cards (认得 and 拼写).',
	limit: { duration: 60 * 60 * 1000, max: 600 },
	res: { type: 'array', optional: false, nullable: false, items: lojoWordSchema },
} as const;
export const paramDef = { type: 'object', properties: {}, required: [] } as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoWordService: LojoWordService) {
		super(meta, paramDef, async (ps, me) => this.lojoWordService.list(me));
	}
}
