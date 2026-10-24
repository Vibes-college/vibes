/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoEnglishService } from '@/core/LojoEnglishService.js';
import { LojoSpeechService } from '@/core/LojoSpeechService.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account',
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			available: { type: 'boolean', optional: false, nullable: false },
			speech: { type: 'boolean', optional: false, nullable: false },
			defaultVoice: { type: 'string', optional: false, nullable: false },
			voices: {
				type: 'array', optional: false, nullable: false,
				items: {
					type: 'object', optional: false, nullable: false,
					properties: {
						id: { type: 'string', optional: false, nullable: false },
						name: { type: 'string', optional: false, nullable: false },
						accent: { type: 'string', optional: false, nullable: false, enum: ['us', 'uk', 'au'] },
						label: { type: 'string', optional: false, nullable: false },
					},
				},
			},
		},
	},
} as const;
export const paramDef = { type: 'object', properties: {}, required: [] } as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoEnglishService: LojoEnglishService,
		private lojoSpeechService: LojoSpeechService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const { available, allowed } = await this.lojoEnglishService.status(me);
			return { available, speech: allowed && this.lojoSpeechService.available, ...this.lojoSpeechService.voices() };
		});
	}
}
