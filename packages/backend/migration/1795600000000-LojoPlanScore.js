/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 学习计划第一版 (founder 2026-11-20 「可以开工」): scores per skill and the stage mocks. Rules in misc/lojo-plan-score.ts
// and misc/lojo-plan.ts; the service is core/LojoPlanService.ts.
// - lojo_plan_score: one row per mock, real exam or teacher's score (the four skills, which were estimated). Taken
//   back by undo with removedAt, never deleted;
// - lojo_plan: the learner's own target and the school's minimum per skill (null = the overall target, no minimum),
//   and the weak skill as last judged (only when a score comes in, or the plan is made again);
// - lojo_plan_task: the skill a task trains, the guide that says how, and whether it is a full mock to score.
export class LojoPlanScore1795600000000 {
	name = 'LojoPlanScore1795600000000';

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "lojo_plan_score" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "date" character varying(10) NOT NULL, "source" character varying(8) NOT NULL, "listening" real, "reading" real, "writing" real, "speaking" real, "overall" real, "estimated" jsonb NOT NULL DEFAULT '[]', "taskId" character varying(32), "by" character varying(8) NOT NULL, "removedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_plan_score" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_plan_score_user_date" ON "lojo_plan_score" ("userId", "date")`);
		await queryRunner.query(`ALTER TABLE "lojo_plan_score" ADD CONSTRAINT "FK_lojo_plan_score_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "lojo_plan" ADD "targets" jsonb`);
		await queryRunner.query(`ALTER TABLE "lojo_plan" ADD "minimums" jsonb`);
		await queryRunner.query(`ALTER TABLE "lojo_plan" ADD "weak" jsonb`);
		await queryRunner.query(`ALTER TABLE "lojo_plan_task" ADD "skill" character varying(16)`);
		await queryRunner.query(`ALTER TABLE "lojo_plan_task" ADD "guide" jsonb`);
		await queryRunner.query(`ALTER TABLE "lojo_plan_task" ADD "mock" boolean`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "lojo_plan_task" DROP COLUMN "mock"`);
		await queryRunner.query(`ALTER TABLE "lojo_plan_task" DROP COLUMN "guide"`);
		await queryRunner.query(`ALTER TABLE "lojo_plan_task" DROP COLUMN "skill"`);
		await queryRunner.query(`ALTER TABLE "lojo_plan" DROP COLUMN "weak"`);
		await queryRunner.query(`ALTER TABLE "lojo_plan" DROP COLUMN "minimums"`);
		await queryRunner.query(`ALTER TABLE "lojo_plan" DROP COLUMN "targets"`);
		await queryRunner.query(`ALTER TABLE "lojo_plan_score" DROP CONSTRAINT "FK_lojo_plan_score_user"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_lojo_plan_score_user_date"`);
		await queryRunner.query(`DROP TABLE "lojo_plan_score"`);
	}
}
