/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 个人主页小程序（/apps/works/）用：一个人每天学了几次（摘要索引 + 闯关过关）、过了哪些关、哪天注册、生日。
// 只给小程序后台调，要带小程序口令；学员自己的浏览器调不到。

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { LojoAppsService, lojoServiceKeyOk } from '@/core/LojoAppsService.js';

export const meta = {
	tags: ['lojo'],
	requireCredential: false,
	description: 'For the profile mini app: per-day counts (summary index + passed quest levels, Beijing days), passed levels, join date and birthday of one learner. Needs the mini app service key.',
	limit: { duration: 60 * 1000, max: 600 },
	errors: {
		forbidden: { message: 'Forbidden.', code: 'FORBIDDEN', id: '5b0e2a52-4a8c-4c0e-9f43-0f6f3c1f7a21' },
		noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: '0d3e7c55-9a51-4f0e-8f7e-3c2b1a6d9e40' },
	},
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		serviceKey: { type: 'string', maxLength: 200 },
		userId: { type: 'string', format: 'misskey:id' },
		days: { type: 'integer', minimum: 1, maximum: 371, default: 371 },
	},
	required: ['serviceKey', 'userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoAppsService: LojoAppsService,
	) {
		super(meta, paramDef, async (ps) => {
			if (!lojoServiceKeyOk(ps.serviceKey)) throw new ApiError(meta.errors.forbidden);
			const r = await this.lojoAppsService.learner(ps.userId, ps.days);
			if (r == null) throw new ApiError(meta.errors.noSuchUser);
			return r;
		});
	}
}
