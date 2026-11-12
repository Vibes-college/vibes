/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoUsageService } from '@/core/LojoUsageService.js';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

// For the admin page /lojo/gems-admin: anyone's allowance, recent charged calls and gem ledger.
export const meta = {
	tags: ['lojo', 'admin'], requireCredential: true, requireAdmin: true, kind: 'read:admin:account',
	description: 'A learner\'s Vibi allowance, recent charged model calls and gem ledger (amounts in thousandths of a gem, costs in millionths of a yuan).',
	errors: { noSuchUser: { message: 'No such user.', code: 'NO_SUCH_USER', id: '0b1c7e8e-6c1f-4c55-9a4b-3c2f1f8e7a01' } },
	res: { type: 'object', optional: false, nullable: false },
} as const;
export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id', nullable: true },
		username: { type: 'string', maxLength: 128, nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository) private usersRepository: UsersRepository,
		private svc: LojoUsageService,
	) {
		super(meta, paramDef, async (ps) => {
			const user = ps.userId ? await this.usersRepository.findOneBy({ id: ps.userId })
				: ps.username ? await this.usersRepository.findOneBy({ usernameLower: ps.username.replace(/^@/, '').toLowerCase(), host: IsNull() })
				: null;
			if (user == null) throw new ApiError(meta.errors.noSuchUser);
			const [status, calls, ledger, config] = await Promise.all([this.svc.status(user.id), this.svc.calls(user.id), this.svc.ledger(user.id), this.svc.config()]);
			return { user: { id: user.id, username: user.username, name: user.name }, status, calls, ledger, config };
		});
	}
}
