/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoGateService } from '@/core/LojoGateService.js';
import { ApiError } from '@/server/api/error.js';
import { lojoGateErrors } from '@/server/api/lojo-schemas.js';
import { isGateCourse } from '@/misc/lojo-gates.js';

export const meta = {
	tags: ['lojo', 'admin'], requireCredential: true, requireAdmin: true, kind: 'write:admin:meta',
	description: 'Replace the question sets of a route map with gates. Sent by apps/community/scripts/gates-import.mjs in the Vibes workspace, which checks them first; the sets hold the answers, so they are kept out of the public source.',
	errors: { invalidCourse: lojoGateErrors.invalidCourse },
	res: {
		type: 'object', optional: false, nullable: false,
		properties: {
			sets: { type: 'integer', optional: false, nullable: false },
		},
	},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		course: { type: 'object' },
		// also make every recording now, so the first learner on each set does not wait for it
		record: { type: 'boolean', default: false },
	},
	required: ['course'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoGateService: LojoGateService) {
		super(meta, paramDef, async (ps) => {
			if (!isGateCourse(ps.course)) throw new ApiError(lojoGateErrors.invalidCourse);
			const res = await this.lojoGateService.import(ps.course);
			if (ps.record) for (const set of ps.course.sets) await this.lojoGateService.audioFor(set);
			return res;
		});
	}
}
