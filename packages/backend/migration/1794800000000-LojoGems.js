/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibi 额度与宝石 (2026-11-11): per-person 5-hour and weekly allowance for chatting with Vibi, and the gem ledger.
// - lojo_usage: one row per learner, the two running windows (start and money used, in millionths of a yuan).
// - lojo_usage_call: one row per charged model call (its id is the charge key, so a call is never charged twice).
// - lojo_gem_ledger: append-only. A row without lotId is a lot (gems coming in: invite, contribution, purchase, admin,
//   refund); a row with lotId takes gems out of that lot (spend, expire, refund, admin). Amounts are thousandths of a
//   gem. The balance is always computed from the rows; UPDATE and DELETE are refused by a trigger.
export class LojoGems1794800000000 {
	name = 'LojoGems1794800000000';

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "lojo_usage" ("userId" character varying(32) NOT NULL, "fiveStart" TIMESTAMP WITH TIME ZONE, "fiveUsed" bigint NOT NULL DEFAULT 0, "weekStart" TIMESTAMP WITH TIME ZONE, "weekUsed" bigint NOT NULL DEFAULT 0, CONSTRAINT "PK_lojo_usage" PRIMARY KEY ("userId"))`);
		await queryRunner.query(`CREATE TABLE "lojo_usage_call" ("id" character varying(64) NOT NULL, "userId" character varying(32) NOT NULL, "source" character varying(32) NOT NULL, "hit" integer NOT NULL, "miss" integer NOT NULL, "out" integer NOT NULL, "cost" bigint NOT NULL, "quota" bigint NOT NULL, "gems" bigint NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_usage_call" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_usage_call_user" ON "lojo_usage_call" ("userId", "createdAt")`);
		await queryRunner.query(`CREATE TABLE "lojo_gem_ledger" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "kind" character varying(16) NOT NULL, "amount" bigint NOT NULL, "lotId" character varying(32), "paid" boolean NOT NULL DEFAULT false, "expiresAt" TIMESTAMP WITH TIME ZONE, "ref" character varying(64), "note" character varying(200), "byUserId" character varying(32), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_gem_ledger" PRIMARY KEY ("id"), CONSTRAINT "CHK_lojo_gem_ledger_kind" CHECK ("kind" IN ('invite', 'contribution', 'purchase', 'spend', 'expire', 'refund', 'admin')), CONSTRAINT "CHK_lojo_gem_ledger_sign" CHECK (("lotId" IS NULL AND "amount" > 0) OR ("lotId" IS NOT NULL AND "amount" < 0)))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_gem_ledger_user" ON "lojo_gem_ledger" ("userId", "createdAt")`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_gem_ledger_lot" ON "lojo_gem_ledger" ("lotId")`);
		await queryRunner.query(`CREATE UNIQUE INDEX "UQ_lojo_gem_ledger_ref" ON "lojo_gem_ledger" ("ref") WHERE "lotId" IS NULL AND "ref" IS NOT NULL`);
		await queryRunner.query(`CREATE FUNCTION "lojo_gem_ledger_append_only"() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'lojo_gem_ledger is append-only'; END; $$ LANGUAGE plpgsql`);
		await queryRunner.query(`CREATE TRIGGER "TRG_lojo_gem_ledger_append_only" BEFORE UPDATE OR DELETE ON "lojo_gem_ledger" FOR EACH ROW EXECUTE FUNCTION "lojo_gem_ledger_append_only"()`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP TABLE "lojo_gem_ledger"`);
		await queryRunner.query(`DROP FUNCTION "lojo_gem_ledger_append_only"()`);
		await queryRunner.query(`DROP TABLE "lojo_usage_call"`);
		await queryRunner.query(`DROP TABLE "lojo_usage"`);
	}
}
