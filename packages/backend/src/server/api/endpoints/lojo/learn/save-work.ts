/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { LojoLearnService } from '@/core/LojoLearnService.js';
import { learnMajorParam, learnWorkParams, lojoLearnErrors } from '@/server/api/lojo-learn-schemas.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	kind: 'write:account',
	prohibitMoved: true,
	description: 'Hands in or changes the signed-in user\'s graduation work for a major (one per major). 「怎么学出来的」 is written from their learning record at this moment. Returns the same as lojo/learn/me.',
	limit: { duration: 60 * 60 * 1000, max: 60 },
	errors: {
		noSuchMajor: lojoLearnErrors.noSuchMajor,
		needTitle: lojoLearnErrors.needTitle,
		needReflection: lojoLearnErrors.needReflection,
		emptyWork: lojoLearnErrors.emptyWork,
	},
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		major: learnMajorParam,
		...learnWorkParams,
	},
	required: ['major', 'title', 'oneLine'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoLearnService: LojoLearnService) {
		super(meta, paramDef, async (ps, me) => {
			const err = await this.lojoLearnService.saveWork(me.id, ps.major, {
				title: ps.title, oneLine: ps.oneLine, reflection: ps.reflection, items: ps.items,
				score: ps.score, before: ps.before, after: ps.after,
			});
			if (err === 'major') throw new ApiError(meta.errors.noSuchMajor);
			if (err === 'title') throw new ApiError(meta.errors.needTitle);
			if (err === 'reflection') throw new ApiError(meta.errors.needReflection);
			if (err === 'empty') throw new ApiError(meta.errors.emptyWork);
			return this.lojoLearnService.me(me.id);
		});
	}
}
