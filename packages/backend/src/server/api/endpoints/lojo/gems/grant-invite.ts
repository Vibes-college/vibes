/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoUsageService } from '@/core/LojoUsageService.js';

// Invite reward (docs/decisions.md 2026-10-25): the inviter and the new member each get inviteGems (990 = $9.90),
// once per new member. By hand for now: when it should happen on its own (after paying, after the refund window)
// is still for the founder to decide.
export const meta = {
	tags: ['lojo', 'admin'], requireCredential: true, requireAdmin: true, kind: 'write:admin:account',
	description: 'Give the invite reward to an inviter and the member they invited (once per invited member).',
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		inviterId: { type: 'string', format: 'misskey:id' },
		inviteeId: { type: 'string', format: 'misskey:id' },
	},
	required: ['inviterId', 'inviteeId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private svc: LojoUsageService) {
		super(meta, paramDef, async (ps, me) => this.svc.grantInvite(ps.inviterId, ps.inviteeId, me.id));
	}
}
