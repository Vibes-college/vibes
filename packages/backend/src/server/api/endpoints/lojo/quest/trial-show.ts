/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';

export const meta = {
	tags: ['lojo'], requireCredential: false,
	description: 'A visitor’s 闯关 map (先玩后注册): the same as show for a new learner, with the first level passed once the visitor’s try (trialId) was passed. Nothing is stored.',
	limit: { duration: 60 * 1000, max: 60 },
	errors: { },
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: { trialId: { type: 'string', minLength: 16, maxLength: 40, nullable: true } },
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps) => this.svc.trialShow(ps.trialId ?? null));
	}
}
