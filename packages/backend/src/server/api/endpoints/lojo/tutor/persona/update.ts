/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import { cleanPersonaName, PERSONA_SEED_PATTERN, personaNameProblem } from '@/misc/lojo-tutor-persona.js';

const str = { type: 'string', optional: false, nullable: false } as const;

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'write:account',
	description: 'Pick the face and the name of my own Momo (the AI 学搭子). Leave one out to keep it. The name: at most 10 characters, nothing that pretends to be staff, a teacher or a real person, and none of the site\'s prohibited words for names. greet (the sign-up step): my Momo then says hello in a chat with no messages yet.',
	limit: { duration: 60 * 60 * 1000, max: 60 },
	errors: {
		nameEmpty: { message: 'The name is empty.', code: 'NAME_EMPTY', id: 'f98d19a5-a108-4e60-8850-af9b859c25e0' },
		nameTooLong: { message: 'The name is longer than 10 characters.', code: 'NAME_TOO_LONG', id: '8331aaaa-7e88-4ba5-b28b-5c07d21e0a43' },
		nameNotAllowed: { message: 'The name pretends to be staff, a teacher or a real person, or has a prohibited word.', code: 'NAME_NOT_ALLOWED', id: '9ec613cb-d841-4dd1-8859-4cc8ae32336d' },
	},
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			seed: str,
			name: str,
			chosen: { type: 'boolean', optional: false, nullable: false },
		},
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		seed: { type: 'string', pattern: PERSONA_SEED_PATTERN },
		name: { type: 'string', maxLength: 100 },
		greet: { type: 'boolean' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoTutorService: LojoTutorService) {
		super(meta, paramDef, async (ps, me) => {
			const now = await this.lojoTutorService.persona(me.id);
			const name = ps.name === undefined ? now.name : cleanPersonaName(ps.name);
			const problem = personaNameProblem(name, this.lojoTutorService.isProhibitedName);
			if (problem === 'empty') throw new ApiError(meta.errors.nameEmpty);
			if (problem === 'long') throw new ApiError(meta.errors.nameTooLong);
			if (problem === 'banned') throw new ApiError(meta.errors.nameNotAllowed);
			// Keeping the default face saves momo:<id>, which is not a valid saved seed and reads back as the default again.
			const saved = await this.lojoTutorService.setPersona(me.id, { seed: ps.seed ?? now.seed, name });
			// The hello is a nicety: the name is saved either way.
			if (ps.greet === true) await this.lojoTutorService.greet(me, saved.name).catch(() => false);
			return saved;
		});
	}
}
