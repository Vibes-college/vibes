/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import { tutorPublic } from '@/misc/lojo-tutor.js';
import { PERSONA_NAME_MAX } from '@/misc/lojo-tutor-persona.js';

const str = { type: 'string', optional: false, nullable: false } as const;

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account',
	description: 'My own Momo (the AI 学搭子): the face (seed for /lojo-head/<seed>) and the name I gave it, the default ones until I pick.',
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			seed: str,
			name: str,
			chosen: { type: 'boolean', optional: false, nullable: false },
			defaultName: str,
			nameMax: { type: 'integer', optional: false, nullable: false },
		},
	},
} as const;
export const paramDef = { type: 'object', properties: {}, required: [] } as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoTutorService: LojoTutorService) {
		super(meta, paramDef, async (ps, me) => ({
			...await this.lojoTutorService.persona(me.id),
			defaultName: tutorPublic.name,
			nameMax: PERSONA_NAME_MAX,
		}));
	}
}
