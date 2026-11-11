/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';

export const meta = {
	tags: ['lojo'], requireCredential: false,
	description: 'A visitor starts the first level without an account. attemptId is the trial id, kept a few hours; the same as start otherwise.',
	limit: { duration: 60 * 60 * 1000, max: 60 },
	errors: { },
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: { },
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async () => this.svc.trialStart());
	}
}
