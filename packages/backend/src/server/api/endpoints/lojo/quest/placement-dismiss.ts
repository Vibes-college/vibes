/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	description: '闯关定级: closes the banner on the map for good (the menu entry stays). Returns the same as lojo/quest/show.',
	limit: { duration: 60 * 60 * 1000, max: 60 },
	errors: {},
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps, me) => this.svc.placementDismiss(me.id));
	}
}
