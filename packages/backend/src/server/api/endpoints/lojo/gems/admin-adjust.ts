/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoUsageService, MILLI } from '@/core/LojoUsageService.js';

// Admin: add or take gems by hand (for trying it out, or to put something right). Adding makes a gifted lot that
// expires after giftMonths (or expiresInMinutes, to try expiry), or a bought lot that never expires with paid: true.
// Taking follows the usual order. resetUsage starts the learner's 5-hour and weekly windows over.
export const meta = {
	tags: ['lojo', 'admin'], requireCredential: true, requireAdmin: true, kind: 'write:admin:account',
	description: 'Add (positive) or take (negative) gems for a learner, or reset their Vibi allowance windows.',
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		gems: { type: 'number', nullable: true },
		paid: { type: 'boolean', nullable: true },
		note: { type: 'string', maxLength: 200, nullable: true },
		expiresInMinutes: { type: 'number', minimum: 0, nullable: true },
		resetUsage: { type: 'boolean', nullable: true },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoUsageService) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.resetUsage) await this.svc.resetWindows(ps.userId);
			const milli = Math.round((ps.gems ?? 0) * MILLI);
			let moved = 0;
			if (milli > 0) {
				await this.svc.grant(ps.userId, 'admin', milli, {
					paid: ps.paid === true, note: ps.note ?? undefined, byUserId: me.id,
					expiresAt: ps.expiresInMinutes != null ? new Date(Date.now() + ps.expiresInMinutes * 60 * 1000) : undefined,
				});
				moved = milli;
			} else if (milli < 0) {
				moved = -(await this.svc.take(ps.userId, 'admin', -milli, { note: ps.note ?? undefined, byUserId: me.id }));
			}
			return { moved, status: await this.svc.status(ps.userId) };
		});
	}
}
