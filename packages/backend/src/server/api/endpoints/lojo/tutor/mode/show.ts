/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import { TUTOR_MODES } from '@/misc/lojo-tutor-mode.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account',
	description: 'How my Momo talks to me in the chat (聊天模式): normal, roast (毒舌), chinglish (catches my Chinglish) or subtext (British subtext). available: whether my replies come from the Momo who knows the modes (the menu under her name shows only then).',
	limit: { duration: 60 * 1000, max: 120 },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			mode: { type: 'string', optional: false, nullable: false, enum: TUTOR_MODES },
			available: { type: 'boolean', optional: false, nullable: false },
		},
	},
} as const;
export const paramDef = { type: 'object', properties: {}, required: [] } as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoTutorService: LojoTutorService) {
		super(meta, paramDef, async (ps, me) => {
			const [mode, available] = await Promise.all([this.lojoTutorService.mode(me.id), this.lojoTutorService.modesAvailable(me.id)]);
			return { mode, available };
		});
	}
}
