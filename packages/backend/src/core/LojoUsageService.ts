/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DataSource, EntityManager } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

// Vibi 额度与宝石 (founder, 2026-11-11). Talking to Vibi costs real money, so each learner has two allowances, like
// Claude Code: one for 5 hours from the first message of that stretch, and one for 7 days from the first use. Both are
// counted in money (millionths of a yuan, from the cache hit / miss / output tokens of each call at deepseek-flash
// prices), not in messages, so a long answer costs more than a short one. When either runs out, gems are used; with no
// gems, Vibi waits until the allowance comes back. Vibi never talks about any of this: only the chat page does.
// Gems (1 gem = $0.01) live in an append-only ledger, lojo_gem_ledger (migration 1794800000000-LojoGems.js).
// Amounts there are thousandths of a gem, whole numbers, and a charge is always rounded up.

// Changed without a release: `redis-cli SET lojoUsage:config '{"fiveHour":300000}'` or the admin page; missing keys
// keep these defaults. Prices are the peak ones (DeepSeek, checked 2026-11-11; off-peak is half).
export type UsageConfig = {
	// yuan per million tokens
	priceHit: number; priceMiss: number; priceOut: number;
	// the allowances, in millionths of a yuan
	fiveHour: number; week: number;
	// how many millionths of a yuan of model cost one gem pays for (about 5 replies)
	perGem: number;
	// what one Mia-on-Mastra reply is charged when that service does not report its tokens (normally it does)
	mastraReply: number;
	// gifted gems (invite, contribution, admin) expire after this many months; bought gems never expire
	giftMonths: number;
	// gems for each side of an invite (990 = $9.90)
	inviteGems: number;
};

// What one learner message costs on average, the notes / Observer / Reflector calls it sets off included, counted at
// the peak prices above (so an hour of chat uses the same allowance day or night). Measured on the LAN test site
// 2026-11-11 off-peak with the 60-message script, 3 learners each (180 messages per path), doubled to peak:
// classic path ¥0.001283 → 2566, Mia on Mastra ¥0.001098 → 2196. The larger one is used so both get about 100 messages
// per 5 hours and 800 per week (founder, 2026-11-11: "尽量让用户能聊个尽兴").
const AVG_REPLY = 2600;
export const USAGE_DEFAULTS: UsageConfig = {
	priceHit: 0.04, priceMiss: 2, priceOut: 8,
	fiveHour: 100 * AVG_REPLY,
	week: 800 * AVG_REPLY,
	perGem: 5 * AVG_REPLY,
	mastraReply: 2200,
	giftMonths: 6,
	inviteGems: 990,
};
const CONFIG_KEY = 'lojoUsage:config';
const FIVE_HOURS = 5 * 60 * 60 * 1000;
const WEEK = 7 * 24 * 60 * 60 * 1000;
export const MILLI = 1000;

// The fuse for the whole site: model calls per UTC day for all tutors together (founder, 2026-11-11: 20000, with a
// warning at half). LOJO_TUTOR_DAILY_LIMIT changes it without a release. Each learner's allowance above is the real
// limit; this only stops a runaway (a bug, a loop, many accounts) from running up the bill. When it blows, Vibi stays
// quiet and only the usage line under the chat says so, until 00:00 UTC (08:00 Beijing).
export const TUTOR_DAILY_LIMIT_DEFAULT = 20000;
export function tutorDailyLimit(): number {
	return Number(process.env.LOJO_TUTOR_DAILY_LIMIT) || TUTOR_DAILY_LIMIT_DEFAULT;
}
export function tutorBudgetKey(at: Date): string {
	return `lojoTutor:budget:${at.toISOString().slice(0, 10)}`;
}
// After the call that made the count `used`: 'half' exactly once when it reaches half, 'full' once on the first call
// past the limit (both are told only once a day), null otherwise.
export function fuseNews(used: number, limit: number): 'half' | 'full' | null {
	if (used === limit + 1) return 'full';
	if (used === Math.ceil(limit / 2)) return 'half';
	return null;
}
export function nextUtcDay(at: Date): Date {
	return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate() + 1));
}

// Invite reward (founder, 2026-11-11): both sides get inviteGems only once the invited member has paid for membership
// and the 7-day refund window has passed without a refund, so nothing ever has to be taken back. There are no payments
// yet: until there are, an admin grants it by hand (admin page). Once payments are recorded, a daily job calls
// settleInvite for each paid invitee and this decides.
export const INVITE_REFUND_DAYS = 7;
export function inviteRewardDue(payment: { paidAt: Date; refundedAt: Date | null } | null, now: Date): boolean {
	if (payment == null || payment.refundedAt != null) return false;
	return now.getTime() >= payment.paidAt.getTime() + INVITE_REFUND_DAYS * 24 * 60 * 60 * 1000;
}

export type GemKind = 'invite' | 'contribution' | 'purchase' | 'spend' | 'expire' | 'refund' | 'admin';
export type ModelUsage = { hit: number; miss: number; out: number };

export type UsageStatus = {
	fivePct: number; fiveResetAt: string | null;
	weekPct: number; weekResetAt: string | null;
	// ok: within the allowance; gems: allowance used up, gems are being used; out: used up and no gems
	state: 'ok' | 'gems' | 'out';
	// when the allowance that ran out comes back (null when state is ok)
	backAt: string | null;
	gems: number; // thousandths of a gem
	// the whole-site fuse has blown: Vibi answers no one until this time (null normally)
	siteFullUntil: string | null;
};

type Windows = { fiveStart: Date | null; fiveUsed: number; weekStart: Date | null; weekUsed: number };
type Lot = { id: string; left: number; paid: boolean; expiresAt: Date | null };

// Pure helpers, exported for the unit test.

// Millionths of a yuan for one call, rounded up.
export function callCost(u: ModelUsage, c: UsageConfig): number {
	return Math.ceil(u.hit * c.priceHit + u.miss * c.priceMiss + u.out * c.priceOut);
}

// The windows as they stand at `now`: one that has run its course starts again empty.
export function currentWindows(w: Windows, now: number): Windows {
	const fiveOver = w.fiveStart == null || now >= w.fiveStart.getTime() + FIVE_HOURS;
	const weekOver = w.weekStart == null || now >= w.weekStart.getTime() + WEEK;
	return {
		fiveStart: fiveOver ? null : w.fiveStart, fiveUsed: fiveOver ? 0 : w.fiveUsed,
		weekStart: weekOver ? null : w.weekStart, weekUsed: weekOver ? 0 : w.weekUsed,
	};
}

export function allowanceLeft(w: Windows, c: UsageConfig): number {
	return Math.max(0, Math.min(c.fiveHour - w.fiveUsed, c.week - w.weekUsed));
}

// Thousandths of a gem for a cost beyond the allowance, rounded up, at least 1 for any cost.
export function gemsFor(cost: number, c: UsageConfig): number {
	return cost <= 0 ? 0 : Math.max(1, Math.ceil(cost * MILLI / c.perGem));
}

// Spending order: gifted gems first, those expiring soonest first; bought gems last, oldest first.
export function spendOrder(lots: Lot[]): Lot[] {
	return [...lots].sort((a, b) => {
		if (a.paid !== b.paid) return a.paid ? 1 : -1;
		const ea = a.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY;
		const eb = b.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY;
		return ea !== eb ? ea - eb : a.id < b.id ? -1 : 1;
	});
}

export function addMonths(at: Date, months: number): Date {
	const d = new Date(at);
	d.setUTCMonth(d.getUTCMonth() + months);
	return d;
}

@Injectable()
export class LojoUsageService {
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.db)
		private db: DataSource,
		private idService: IdService,
	) {}

	public async config(): Promise<UsageConfig> {
		const raw = await this.redisClient.get(CONFIG_KEY).catch(() => null);
		let saved: Partial<UsageConfig> = {};
		try {
			saved = raw ? JSON.parse(raw) : {};
		} catch { /* a broken value keeps the defaults */ }
		const out = { ...USAGE_DEFAULTS };
		for (const k of Object.keys(USAGE_DEFAULTS) as (keyof UsageConfig)[]) {
			const v = Number(saved[k]);
			if (saved[k] != null && Number.isFinite(v) && v >= 0) out[k] = v;
		}
		if (out.perGem <= 0) out.perGem = USAGE_DEFAULTS.perGem;
		return out;
	}

	public async setConfig(patch: Partial<UsageConfig>): Promise<UsageConfig> {
		const raw = await this.redisClient.get(CONFIG_KEY).catch(() => null);
		let saved: Record<string, unknown> = {};
		try {
			saved = raw ? JSON.parse(raw) : {};
		} catch { /* start over */ }
		for (const k of Object.keys(USAGE_DEFAULTS) as (keyof UsageConfig)[]) {
			if (patch[k] === undefined) continue;
			if (patch[k] === null) delete saved[k];
			else saved[k] = Number(patch[k]);
		}
		await this.redisClient.set(CONFIG_KEY, JSON.stringify(saved));
		return this.config();
	}

	// Whether Vibi may answer this learner now: within the allowance, or with gems left.
	public async canChat(userId: string): Promise<boolean> {
		return (await this.status(userId)).state !== 'out';
	}

	public async status(userId: string): Promise<UsageStatus> {
		const c = await this.config();
		const now = Date.now();
		const [rows, gems, siteUsed] = await Promise.all([
			this.db.query(`SELECT * FROM "lojo_usage" WHERE "userId" = $1`, [userId]),
			this.balance(this.db.manager, userId, new Date(now)),
			this.redisClient.get(tutorBudgetKey(new Date(now))).then(Number).catch(() => 0),
		]);
		const w = currentWindows(this.toWindows(rows[0]), now);
		const left = allowanceLeft(w, c);
		const fiveFull = w.fiveUsed >= c.fiveHour;
		const weekFull = w.weekUsed >= c.week;
		const fiveResetAt = w.fiveStart ? new Date(w.fiveStart.getTime() + FIVE_HOURS) : null;
		const weekResetAt = w.weekStart ? new Date(w.weekStart.getTime() + WEEK) : null;
		// Used up: it comes back when every full window has reset (the week wins when both are full).
		const backAt = left > 0 ? null : weekFull ? weekResetAt : fiveFull ? fiveResetAt : null;
		return {
			fivePct: c.fiveHour > 0 ? Math.min(100, Math.round(w.fiveUsed * 100 / c.fiveHour)) : 100,
			fiveResetAt: fiveResetAt?.toISOString() ?? null,
			weekPct: c.week > 0 ? Math.min(100, Math.round(w.weekUsed * 100 / c.week)) : 100,
			weekResetAt: weekResetAt?.toISOString() ?? null,
			state: left > 0 ? 'ok' : gems > 0 ? 'gems' : 'out',
			backAt: backAt?.toISOString() ?? null,
			gems,
			siteFullUntil: siteUsed >= tutorDailyLimit() ? nextUtcDay(new Date(now)).toISOString() : null,
		};
	}

	// Charge one model call (or one reply made of several calls) to the learner, once per callId: first from the
	// allowance, the rest in gems. What the gems cannot cover is let go (the call has already been made).
	public async charge(userId: string, callId: string, source: string, usage: ModelUsage | null, fixedCost?: number): Promise<{ cost: number; quota: number; gems: number } | null> {
		const c = await this.config();
		const cost = fixedCost ?? (usage ? callCost(usage, c) : 0);
		return this.db.transaction(async em => {
			await this.lockUser(em, userId);
			const now = new Date();
			const inserted = await em.query(
				`INSERT INTO "lojo_usage_call" ("id", "userId", "source", "hit", "miss", "out", "cost", "quota", "gems", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8) ON CONFLICT ("id") DO NOTHING RETURNING "id"`,
				[callId, userId, source.slice(0, 32), usage?.hit ?? 0, usage?.miss ?? 0, usage?.out ?? 0, cost, now],
			);
			if (inserted.length === 0) return null; // already charged
			const rows = await em.query(`SELECT * FROM "lojo_usage" WHERE "userId" = $1 FOR UPDATE`, [userId]);
			const w = currentWindows(this.toWindows(rows[0]), now.getTime());
			const quota = Math.min(cost, allowanceLeft(w, c));
			const next: Windows = {
				fiveStart: w.fiveStart ?? now, fiveUsed: w.fiveUsed + quota,
				weekStart: w.weekStart ?? now, weekUsed: w.weekUsed + quota,
			};
			await em.query(
				`INSERT INTO "lojo_usage" ("userId", "fiveStart", "fiveUsed", "weekStart", "weekUsed") VALUES ($1, $2, $3, $4, $5)
				 ON CONFLICT ("userId") DO UPDATE SET "fiveStart" = $2, "fiveUsed" = $3, "weekStart" = $4, "weekUsed" = $5`,
				[userId, next.fiveStart, next.fiveUsed, next.weekStart, next.weekUsed],
			);
			let gems = 0;
			if (cost > quota) {
				gems = await this.draw(em, userId, gemsFor(cost - quota, c), 'spend', now, { ref: callId.slice(0, 64) });
			}
			await em.query(`UPDATE "lojo_usage_call" SET "quota" = $2, "gems" = $3 WHERE "id" = $1`, [callId, quota, gems]);
			return { cost, quota, gems };
		});
	}

	// Gems coming in: a new lot. Gifted ones expire (giftMonths, or expiresAt to try it out), bought ones never.
	// ref makes it happen once (e.g. one invite reward per invited member); returns false when that ref is already in.
	public async grant(userId: string, kind: GemKind, milli: number, opts: { paid?: boolean; ref?: string; note?: string; byUserId?: string; expiresAt?: Date | null } = {}): Promise<boolean> {
		if (!Number.isSafeInteger(milli) || milli <= 0) throw new Error('grant must be a positive whole number of thousandths');
		const c = await this.config();
		const now = new Date();
		const expiresAt = opts.paid ? null : opts.expiresAt !== undefined ? opts.expiresAt : addMonths(now, c.giftMonths);
		return this.db.transaction(async em => {
			await this.lockUser(em, userId);
			const res = await em.query(
				`INSERT INTO "lojo_gem_ledger" ("id", "userId", "kind", "amount", "lotId", "paid", "expiresAt", "ref", "note", "byUserId", "createdAt") VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10)
				 ON CONFLICT ("ref") WHERE "lotId" IS NULL AND "ref" IS NOT NULL DO NOTHING RETURNING "id"`,
				[this.idService.gen(), userId, kind, milli, opts.paid === true, expiresAt, opts.ref ?? null, opts.note?.slice(0, 200) ?? null, opts.byUserId ?? null, now],
			);
			return res.length > 0;
		});
	}

	// Gems going out by hand (admin), in the usual order. Returns how many thousandths were taken.
	public async take(userId: string, kind: 'admin' | 'refund', milli: number, opts: { note?: string; byUserId?: string } = {}): Promise<number> {
		return this.db.transaction(async em => {
			await this.lockUser(em, userId);
			return this.draw(em, userId, milli, kind, new Date(), opts);
		});
	}

	// Invite reward (docs/decisions.md 2026-10-25): the inviter and the new member each get inviteGems, once per new member.
	public async grantInvite(inviterId: string, inviteeId: string, byUserId?: string): Promise<{ inviter: boolean; invitee: boolean }> {
		if (inviterId === inviteeId) throw new Error('cannot invite oneself');
		const c = await this.config();
		const milli = Math.round(c.inviteGems * MILLI);
		return {
			inviter: await this.grant(inviterId, 'invite', milli, { ref: `invite:${inviteeId}:inviter`, note: `invited ${inviteeId}`, byUserId }),
			invitee: await this.grant(inviteeId, 'invite', milli, { ref: `invite:${inviteeId}:invitee`, note: `invited by ${inviterId}`, byUserId }),
		};
	}

	// Called with the invitee's membership payment once payments exist (see inviteRewardDue). Safe to call every day:
	// the ledger refs make it pay out once. Returns null while it is not due.
	public async settleInvite(inviterId: string, inviteeId: string, payment: { paidAt: Date; refundedAt: Date | null } | null, now = new Date()): Promise<{ inviter: boolean; invitee: boolean } | null> {
		if (!inviteRewardDue(payment, now)) return null;
		return this.grantInvite(inviterId, inviteeId);
	}

	public async ledger(userId: string, limit = 100): Promise<{ id: string; kind: string; amount: number; lotId: string | null; paid: boolean; expiresAt: string | null; note: string | null; createdAt: string }[]> {
		await this.db.transaction(async em => {
			await this.lockUser(em, userId);
			await this.expireLots(em, userId, new Date());
		});
		const rows = await this.db.query(`SELECT * FROM "lojo_gem_ledger" WHERE "userId" = $1 ORDER BY "createdAt" DESC, "id" DESC LIMIT $2`, [userId, limit]);
		return rows.map((r: Record<string, unknown>) => ({
			id: r.id as string, kind: r.kind as string, amount: Number(r.amount), lotId: r.lotId as string | null, paid: r.paid === true,
			expiresAt: r.expiresAt ? new Date(r.expiresAt as string).toISOString() : null, note: r.note as string | null,
			createdAt: new Date(r.createdAt as string).toISOString(),
		}));
	}

	public async calls(userId: string, limit = 30): Promise<{ id: string; source: string; hit: number; miss: number; out: number; cost: number; quota: number; gems: number; createdAt: string }[]> {
		const rows = await this.db.query(`SELECT * FROM "lojo_usage_call" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT $2`, [userId, limit]);
		return rows.map((r: Record<string, unknown>) => ({
			id: r.id as string, source: r.source as string, hit: Number(r.hit), miss: Number(r.miss), out: Number(r.out),
			cost: Number(r.cost), quota: Number(r.quota), gems: Number(r.gems), createdAt: new Date(r.createdAt as string).toISOString(),
		}));
	}

	// Start the learner's windows over (admin, for trying it out). Not part of the ledger.
	public async resetWindows(userId: string): Promise<void> {
		await this.db.query(`DELETE FROM "lojo_usage" WHERE "userId" = $1`, [userId]);
	}

	// The learner's gems now, in thousandths (expired lots excluded; nothing is written).
	private async balance(em: EntityManager, userId: string, now: Date): Promise<number> {
		return (await this.lots(em, userId)).filter(l => l.paid || l.expiresAt == null || l.expiresAt > now).reduce((s, l) => s + l.left, 0);
	}

	private async lots(em: EntityManager, userId: string): Promise<Lot[]> {
		const rows = await em.query(
			`SELECT lot."id", lot."paid", lot."expiresAt", lot."amount" + COALESCE(SUM(d."amount"), 0) AS "left"
			 FROM "lojo_gem_ledger" lot LEFT JOIN "lojo_gem_ledger" d ON d."lotId" = lot."id"
			 WHERE lot."userId" = $1 AND lot."lotId" IS NULL GROUP BY lot."id"`,
			[userId],
		);
		return rows.map((r: Record<string, unknown>) => ({ id: r.id as string, paid: r.paid === true, expiresAt: r.expiresAt ? new Date(r.expiresAt as string) : null, left: Number(r.left) }))
			.filter((l: Lot) => l.left > 0);
	}

	// Gifted lots past their date lose what is left, as an "expire" row.
	private async expireLots(em: EntityManager, userId: string, now: Date): Promise<void> {
		for (const lot of await this.lots(em, userId)) {
			if (lot.paid || lot.expiresAt == null || lot.expiresAt > now) continue;
			await this.insertDraw(em, userId, lot.id, 'expire', -lot.left, now, {});
		}
	}

	private async draw(em: EntityManager, userId: string, milli: number, kind: GemKind, now: Date, opts: { ref?: string; note?: string; byUserId?: string }): Promise<number> {
		await this.expireLots(em, userId, now);
		let need = milli;
		for (const lot of spendOrder(await this.lots(em, userId))) {
			if (need <= 0) break;
			const take = Math.min(need, lot.left);
			await this.insertDraw(em, userId, lot.id, kind, -take, now, opts);
			need -= take;
		}
		return milli - need;
	}

	private async insertDraw(em: EntityManager, userId: string, lotId: string, kind: GemKind, amount: number, now: Date, opts: { ref?: string; note?: string; byUserId?: string }): Promise<void> {
		await em.query(
			`INSERT INTO "lojo_gem_ledger" ("id", "userId", "kind", "amount", "lotId", "paid", "expiresAt", "ref", "note", "byUserId", "createdAt") VALUES ($1, $2, $3, $4, $5, false, NULL, $6, $7, $8, $9)`,
			[this.idService.gen(), userId, kind, amount, lotId, opts.ref ?? null, opts.note?.slice(0, 200) ?? null, opts.byUserId ?? null, now],
		);
	}

	// One learner's charges and gem moves happen one after another.
	private async lockUser(em: EntityManager, userId: string): Promise<void> {
		await em.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`lojo_usage:${userId}`]);
	}

	private toWindows(row: Record<string, unknown> | undefined): Windows {
		return {
			fiveStart: row?.fiveStart ? new Date(row.fiveStart as string) : null, fiveUsed: Number(row?.fiveUsed ?? 0),
			weekStart: row?.weekStart ? new Date(row.weekStart as string) : null, weekUsed: Number(row?.weekUsed ?? 0),
		};
	}
}
