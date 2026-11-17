/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 发到我的电脑 (2026-11-15): is it switched on for me, and do I have a computer connected in this browser. The pairing
// itself (the Paseo link) stays in the learner's browser and never comes here; only a yes/no does, so Vibi knows
// whether a draft card can be used.

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';

const bool = { type: 'boolean', optional: false, nullable: false } as const;

export const meta = {
	tags: ['lojo'], requireCredential: true, kind: 'read:account',
	description: 'Send to my computer (Vibi drafts, the learner sends it to their own Paseo): whether it is switched on for me, and whether I said a computer is connected. Pass connected to change the latter; the pairing itself never comes to the server.',
	limit: { duration: 60 * 1000, max: 30 },
	res: { type: 'object', optional: false, nullable: false, properties: { enabled: bool, connected: bool } },
} as const;
export const paramDef = {
	type: 'object',
	properties: { connected: { type: 'boolean', nullable: true } },
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(private lojoTutorService: LojoTutorService) {
		super(meta, paramDef, async (ps, me) => this.lojoTutorService.agentBridgeState(me.id, ps.connected ?? null));
	}
}
