/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoEnglishService } from '@/core/LojoEnglishService.js';
import { LojoSpeechService } from '@/core/LojoSpeechService.js';
import { ApiError } from '@/server/api/error.js';
import { lojoEnglishErrors } from '@/server/api/lojo-schemas.js';
import { lojoVoiceIds } from '@/misc/lojo-voices.js';

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account', requiredRolePolicy: 'canUseTranslator',
	description: 'Read a note (or a short English text such as an example sentence) aloud and return the audio URL.',
	limit: { duration: 60 * 60 * 1000, max: 300 },
	errors: lojoEnglishErrors,
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			url: { type: 'string', optional: false, nullable: false },
		},
	},
} as const;
export const paramDef = {
	type: 'object',
	// One of noteId or text is required.
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		text: { type: 'string', minLength: 1, maxLength: 1500 },
		voice: { type: 'string', enum: lojoVoiceIds },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoEnglishService: LojoEnglishService,
		private lojoSpeechService: LojoSpeechService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// For a note the server reads the text itself, with the same visibility checks as the explanation.
			const text = ps.noteId ? (await this.lojoEnglishService.noteText(ps.noteId, me)).text : ps.text;
			if (text == null) throw new ApiError(lojoEnglishErrors.emptyNote);
			return { url: await this.lojoSpeechService.speak(text, ps.voice) };
		});
	}
}
