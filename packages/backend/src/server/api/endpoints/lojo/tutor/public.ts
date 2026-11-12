/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { lojoTutorIds, tutorPublic } from '@/misc/lojo-tutor.js';

export const meta = {
	tags: ['lojo'], requireCredential: false,
	description: 'The AI tutor accounts and the line shown under their name in chats (empty: no line).',
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			ids: { type: 'array', optional: false, nullable: false, items: { type: 'string', optional: false, nullable: false, format: 'misskey:id' } },
			title: { type: 'string', optional: false, nullable: false },
		},
	},
} as const;
export const paramDef = { type: 'object', properties: {}, required: [] } as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor() {
		super(meta, paramDef, async () => ({ ids: lojoTutorIds(), title: tutorPublic.title }));
	}
}
