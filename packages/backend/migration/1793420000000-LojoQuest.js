/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关: a learner's hearts, streak and progress, each try at a level and the ledger of hearts, sets and XP.
// Only new tables: rolling back drops them and nothing else changes.
export class LojoQuest1793420000000 {
	name = 'LojoQuest1793420000000';

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "lojo_quest" ("userId" character varying(32) NOT NULL, "hearts" smallint NOT NULL, "heartsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "streak" integer NOT NULL DEFAULT 0, "streakDay" character varying(10), "bestStreak" integer NOT NULL DEFAULT 0, "freezes" smallint NOT NULL DEFAULT 0, "xp" integer NOT NULL DEFAULT 0, "prep" jsonb NOT NULL DEFAULT '{}', "bossLosses" smallint NOT NULL DEFAULT 0, "levels" jsonb NOT NULL DEFAULT '{}', "bag" jsonb NOT NULL DEFAULT '[]', "chestDay" character varying(10), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_quest" PRIMARY KEY ("userId"))`);
		await queryRunner.query(`ALTER TABLE "lojo_quest" ADD CONSTRAINT "FK_lojo_quest_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

		await queryRunner.query(`CREATE TABLE "lojo_quest_attempt" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "levelId" character varying(32) NOT NULL, "questionIds" jsonb NOT NULL, "answers" jsonb NOT NULL DEFAULT '[]', "status" character varying(8) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endedAt" TIMESTAMP WITH TIME ZONE, "askedTutor" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_lojo_quest_attempt" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_quest_attempt_user" ON "lojo_quest_attempt" ("userId", "createdAt") `);
		await queryRunner.query(`ALTER TABLE "lojo_quest_attempt" ADD CONSTRAINT "FK_lojo_quest_attempt_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

		await queryRunner.query(`CREATE TABLE "lojo_quest_log" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "at" TIMESTAMP WITH TIME ZONE NOT NULL, "day" character varying(10) NOT NULL, "kind" character varying(16) NOT NULL, "ref" character varying(256) NOT NULL DEFAULT '', "hearts" smallint NOT NULL DEFAULT 0, "xp" integer NOT NULL DEFAULT 0, "data" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_lojo_quest_log" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_quest_log_user_day" ON "lojo_quest_log" ("userId", "day") `);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_quest_log_day_kind" ON "lojo_quest_log" ("day", "kind") `);
		await queryRunner.query(`ALTER TABLE "lojo_quest_log" ADD CONSTRAINT "FK_lojo_quest_log_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP TABLE "lojo_quest_log"`);
		await queryRunner.query(`DROP TABLE "lojo_quest_attempt"`);
		await queryRunner.query(`DROP TABLE "lojo_quest"`);
	}
}
