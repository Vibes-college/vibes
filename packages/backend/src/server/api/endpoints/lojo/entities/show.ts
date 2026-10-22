/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoService } from '@/core/LojoService.js';
import { lojoEntityId, lojoEntityResponse, lojoErrors } from '@/server/api/lojo-schemas.js';

export const meta = {
	tags: ['lojo'], requireCredential: false,
	errors: { noSuchEntity: lojoErrors.noSuchEntity },
	res: lojoEntityResponse,
} as const;
export const paramDef = {
	type: 'object', properties: { entityId: lojoEntityId }, required: ['entityId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoService: LojoService) {
		super(meta, paramDef, async (ps) => this.lojoService.showEntity(ps.entityId));
	}
}
