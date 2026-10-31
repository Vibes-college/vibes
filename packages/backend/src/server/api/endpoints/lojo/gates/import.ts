/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoGateService } from '@/core/LojoGateService.js';
import { ApiError } from '@/server/api/error.js';
import { lojoGateErrors } from '@/server/api/lojo-schemas.js';
import { gateCourseProblems, gateShapeProblems, isGateCourse } from '@/misc/lojo-gates.js';

// The error, with what is wrong where (station-set, question) in its message for gates-import.mjs to print, and in info.
const refused = (error: { message: string; code: string; id: string }, problems: string[]) => new ApiError({
	...error, message: `${error.message} ${problems.slice(0, 30).join('; ')}${problems.length > 30 ? ` …(${problems.length - 30} more)` : ''}`,
}, { problems });

export const meta = {
	tags: ['lojo', 'admin'], requireCredential: true, requireAdmin: true, kind: 'write:admin:meta',
	description: 'Replace the question sets of a route map with gates. Sent by apps/community/scripts/gates-import.mjs in the Vibes workspace, which checks them first; the sets hold the answers, so they are kept out of the public source. The vocabulary and grammar questions are marked against their own answers and tests first: if any of them fails, nothing is imported and the error lists them.',
	errors: { invalidCourse: lojoGateErrors.invalidCourse, selfCheckFailed: lojoGateErrors.selfCheckFailed },
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
		// also make every recording (and the words of spell questions) now, so the first learner on each set does not wait
		record: { type: 'boolean', default: false },
	},
	required: ['course'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoGateService: LojoGateService) {
		super(meta, paramDef, async (ps) => {
			if (!isGateCourse(ps.course)) throw refused(lojoGateErrors.invalidCourse, gateShapeProblems(ps.course));
			const problems = gateCourseProblems(ps.course);
			if (problems.length > 0) throw refused(lojoGateErrors.selfCheckFailed, problems);
			const res = await this.lojoGateService.import(ps.course);
			if (ps.record) {
				const papers = [...ps.course.sets, ...(ps.course.placements ?? []).flatMap(p => [p.stages.first, p.stages.high, p.stages.low])];
				for (const paper of papers) {
					await this.lojoGateService.audioFor(paper);
					await this.lojoGateService.wordAudio(paper);
				}
			}
			return res;
		});
	}
}
