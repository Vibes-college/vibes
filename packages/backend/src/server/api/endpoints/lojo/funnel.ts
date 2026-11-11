/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';

// 增长 埋点清单 (冲刺1111): the visitor steps of 先玩后注册, counted per Beijing day and source. Only these names are
// taken; any other source is counted as other, so nothing free-form is stored.
const SOURCES = ['home', 'home_en', 'guide', 'read', 'synonym', 'wx', 'xhs', 'other'];

export const meta = {
	tags: ['lojo'], requireCredential: false,
	description: 'Counts one visitor step of 先玩后注册 for today (Beijing): only the day, the step and where the visitor came from. No account, IP or device is kept.',
	limit: { duration: 60 * 1000, max: 30 },
	errors: {},
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		event: { type: 'string', enum: ['quest_arrive', 'trial_start', 'trial_pass', 'trial_fail', 'save_card_shown', 'save_skip', 'save_skip_final', 'save_open'] },
		src: { type: 'string', maxLength: 32, nullable: true },
	},
	required: ['event'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoQuestService) {
		super(meta, paramDef, async (ps) => {
			await this.svc.funnel(ps.event, ps.src != null && SOURCES.includes(ps.src) ? ps.src : 'other');
		});
	}
}
