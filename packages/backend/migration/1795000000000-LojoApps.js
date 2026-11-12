/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 小程序搬出社区 (2026-11-12): the directory of mini apps (each registers itself when it starts) and the summary index
// (one line per set a learner finished in a mini app). The mini apps' own records stay in their own schemas.
export class LojoApps1795000000000 {
	name = 'LojoApps1795000000000';

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "lojo_app" ("id" character varying(32) NOT NULL, "name" character varying(64) NOT NULL, "summary" character varying(512) NOT NULL DEFAULT '', "base" character varying(128) NOT NULL, "internal" character varying(256) NOT NULL, "version" character varying(32) NOT NULL DEFAULT '', "kinds" jsonb NOT NULL DEFAULT '{}', "defaultGrants" jsonb NOT NULL DEFAULT '{}', "spec" jsonb, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_app" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "lojo_app_activity" ("id" BIGSERIAL NOT NULL, "userId" character varying(32) NOT NULL, "app" character varying(32) NOT NULL, "what" character varying(200) NOT NULL, "right" integer, "total" integer, "note" character varying(200) NOT NULL DEFAULT '', "at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_app_activity" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_app_activity_user_at" ON "lojo_app_activity" ("userId", "at" DESC)`);
		await queryRunner.query(`ALTER TABLE "lojo_app_activity" ADD CONSTRAINT "FK_lojo_app_activity_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "lojo_app_activity" DROP CONSTRAINT "FK_lojo_app_activity_user"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_lojo_app_activity_user_at"`);
		await queryRunner.query(`DROP TABLE "lojo_app_activity"`);
		await queryRunner.query(`DROP TABLE "lojo_app"`);
	}
}
