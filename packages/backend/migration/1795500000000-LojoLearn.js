/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 资料页「学习」标签进社区 (founder, 2026-11-17: 「这个功能其实是属于社区的功能…跟社区是一体的」): graduation works and
// the tab's settings move out of the separate 个人主页 mini app (its own schema app_works) into the community's own
// tables. Rules in core/LojoLearnService.ts and misc/lojo-learn.ts.
// - lojo_learn_profile: one row per learner who changed a setting (no row = the defaults: public);
// - lojo_learn_work: one graduation work per learner and major.
export class LojoLearn1795500000000 {
	name = 'LojoLearn1795500000000';

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "lojo_learn_profile" ("userId" character varying(32) NOT NULL, "isPublic" boolean NOT NULL DEFAULT true, "sources" jsonb NOT NULL DEFAULT '[]', "contact" character varying(256) NOT NULL DEFAULT '', "takenDown" boolean NOT NULL DEFAULT false, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_lojo_learn_profile" PRIMARY KEY ("userId"))`);
		await queryRunner.query(`ALTER TABLE "lojo_learn_profile" ADD CONSTRAINT "FK_lojo_learn_profile_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`CREATE TABLE "lojo_learn_work" ("id" SERIAL NOT NULL, "userId" character varying(32) NOT NULL, "major" character varying(32) NOT NULL, "title" character varying(80) NOT NULL, "oneLine" character varying(120) NOT NULL, "items" jsonb NOT NULL DEFAULT '[]', "before" jsonb, "after" jsonb, "reflection" text NOT NULL DEFAULT '', "score" jsonb, "journey" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_lojo_learn_work" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_lojo_learn_work_user_major" ON "lojo_learn_work" ("userId", "major") `);
		await queryRunner.query(`ALTER TABLE "lojo_learn_work" ADD CONSTRAINT "FK_lojo_learn_work_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "lojo_learn_work" DROP CONSTRAINT "FK_lojo_learn_work_user"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_lojo_learn_work_user_major"`);
		await queryRunner.query(`DROP TABLE "lojo_learn_work"`);
		await queryRunner.query(`ALTER TABLE "lojo_learn_profile" DROP CONSTRAINT "FK_lojo_learn_profile_user"`);
		await queryRunner.query(`DROP TABLE "lojo_learn_profile"`);
	}
}
