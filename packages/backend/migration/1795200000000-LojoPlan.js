/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 私信「任务」标签 (2026-11-15): a learner's exam plan with Vibi. One plan per learner, its tasks (a check-in is one
// task with one row per day it was done), the 「勾上这件吗？」 asks, and every change (so it can be undone).
// Raw SQL like lojo_app: the rules are in src/misc/lojo-plan.ts and src/core/LojoPlanService.ts.
export class LojoPlan1795200000000 {
	name = 'LojoPlan1795200000000';

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "lojo_plan" ("userId" character varying(32) NOT NULL, "examDate" character varying(10) NOT NULL, "examTentative" boolean NOT NULL DEFAULT false, "dailyMinutes" smallint NOT NULL, "target" character varying(16) NOT NULL, "current" character varying(16), "restDay" smallint NOT NULL DEFAULT 0, "tz" character varying(64) NOT NULL DEFAULT 'Asia/Shanghai', "stages" jsonb NOT NULL DEFAULT '[]', "focus" character varying(64), "notifyWeekly" boolean NOT NULL DEFAULT true, "plannedUntil" character varying(10), "seenAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_plan" PRIMARY KEY ("userId"))`);
		await queryRunner.query(`ALTER TABLE "lojo_plan" ADD CONSTRAINT "FK_lojo_plan_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

		await queryRunner.query(`CREATE TABLE "lojo_plan_task" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "title" character varying(128) NOT NULL, "kind" character varying(8) NOT NULL, "stage" smallint NOT NULL, "origDate" character varying(10) NOT NULL, "date" character varying(10) NOT NULL, "endDate" character varying(10), "minutes" smallint NOT NULL, "app" character varying(32), "ref" character varying(32), "autoDone" jsonb, "itemId" character varying(16), "status" character varying(8) NOT NULL DEFAULT 'todo', "doneBy" character varying(8), "doneAt" TIMESTAMP WITH TIME ZONE, "by" character varying(8) NOT NULL, "pinned" boolean NOT NULL DEFAULT false, "askedAt" TIMESTAMP WITH TIME ZONE, "offDate" character varying(10), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_plan_task" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_plan_task_user_date" ON "lojo_plan_task" ("userId", "date")`);
		await queryRunner.query(`ALTER TABLE "lojo_plan_task" ADD CONSTRAINT "FK_lojo_plan_task_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

		await queryRunner.query(`CREATE TABLE "lojo_plan_checkin" ("taskId" character varying(32) NOT NULL, "date" character varying(10) NOT NULL, "userId" character varying(32) NOT NULL, "doneAt" TIMESTAMP WITH TIME ZONE, "doneBy" character varying(8), CONSTRAINT "PK_lojo_plan_checkin" PRIMARY KEY ("taskId", "date"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_plan_checkin_user_date" ON "lojo_plan_checkin" ("userId", "date")`);
		await queryRunner.query(`ALTER TABLE "lojo_plan_checkin" ADD CONSTRAINT "FK_lojo_plan_checkin_task" FOREIGN KEY ("taskId") REFERENCES "lojo_plan_task"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

		await queryRunner.query(`CREATE TABLE "lojo_plan_ask" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "app" character varying(32) NOT NULL, "activityId" bigint, "day" character varying(10) NOT NULL, "skipped" jsonb NOT NULL DEFAULT '[]', "at" TIMESTAMP WITH TIME ZONE NOT NULL, "answeredAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_lojo_plan_ask" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_plan_ask_user_day" ON "lojo_plan_ask" ("userId", "day")`);
		await queryRunner.query(`ALTER TABLE "lojo_plan_ask" ADD CONSTRAINT "FK_lojo_plan_ask_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

		await queryRunner.query(`CREATE TABLE "lojo_plan_change" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "who" character varying(8) NOT NULL, "at" TIMESTAMP WITH TIME ZONE NOT NULL, "summary" character varying(512) NOT NULL, "before" jsonb NOT NULL, "after" jsonb NOT NULL, "undoneAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_lojo_plan_change" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_plan_change_user_at" ON "lojo_plan_change" ("userId", "at" DESC)`);
		await queryRunner.query(`ALTER TABLE "lojo_plan_change" ADD CONSTRAINT "FK_lojo_plan_change_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP TABLE "lojo_plan_change"`);
		await queryRunner.query(`DROP TABLE "lojo_plan_ask"`);
		await queryRunner.query(`DROP TABLE "lojo_plan_checkin"`);
		await queryRunner.query(`DROP TABLE "lojo_plan_task"`);
		await queryRunner.query(`DROP TABLE "lojo_plan"`);
	}
}
