/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoLearnService } from '@/core/LojoLearnService.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	kind: 'read:account',
	description: 'The signed-in user\'s 「学习」 tab settings, their graduation works as typed, the majors that take one, and the channels they follow.',
	limit: { duration: 60 * 1000, max: 120 },
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoLearnService: LojoLearnService) {
		super(meta, paramDef, async (ps, me) => this.lojoLearnService.me(me.id));
	}
}
