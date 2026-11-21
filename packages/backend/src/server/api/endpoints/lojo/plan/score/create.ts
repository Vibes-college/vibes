/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoPlanService } from '@/core/LojoPlanService.js';
import { SCORE_SOURCES, SKILLS } from '@/misc/lojo-plan-score.js';

// 学习计划第一版 (2026-11-20): 「记分」 on a mock's task card. Same rules as Vibi's recordScore (LojoPlanService).
export const meta = {
	tags: ['lojo'],
	requireCredential: true,
	kind: 'write:account',
	description: 'Record an IELTS score per skill (a mock, the real exam or a teacher\'s), optionally ticking the mock task it belongs to. The weak skill is judged again. Returns ok false with a reason when it cannot.',
	res: { type: 'object', optional: false, nullable: false },
} as const;

const band = { type: 'number', minimum: 0, maximum: 9, nullable: true } as const;

export const paramDef = {
	type: 'object',
	properties: {
		source: { type: 'string', enum: [...SCORE_SOURCES] },
		date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', nullable: true },
		listening: band,
		reading: band,
		writing: band,
		speaking: band,
		estimated: { type: 'array', nullable: true, maxItems: 4, items: { type: 'string', enum: [...SKILLS] } },
		taskId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: ['source'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoPlanService: LojoPlanService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.lojoPlanService.recordScore(me.id, 'self', ps);
		});
	}
}
