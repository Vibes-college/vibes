/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import { TUTOR_MODES } from '@/misc/lojo-tutor-mode.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	description: 'Pick how my Momo talks to me in the chat (聊天模式, the menu under her name). When it changed, one grey line goes into the chat from her.',
	limit: { duration: 60 * 60 * 1000, max: 120 },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			mode: { type: 'string', optional: false, nullable: false, enum: TUTOR_MODES },
		},
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		mode: { type: 'string', enum: TUTOR_MODES },
	},
	required: ['mode'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoTutorService: LojoTutorService) {
		super(meta, paramDef, async (ps, me) => {
			return { mode: await this.lojoTutorService.setMode(me, ps.mode) };
		});
	}
}
