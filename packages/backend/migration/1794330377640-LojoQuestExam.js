/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关 with the real chapter (ch1-2026-11-10f): the learner's exam date, whether the walkthrough is done, a one-time
// notice (freeze cards used / streak lost), and the mode of each try (practice, level, retest, boss).
// Tries still open from the sample questions cannot be answered with the new questions, so they are closed.
export class LojoQuestExam1794330377640 {
	name = 'LojoQuestExam1794330377640';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "lojo_quest" ADD "examDate" character varying(10)`);
		await queryRunner.query(`ALTER TABLE "lojo_quest" ADD "onboarded" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`ALTER TABLE "lojo_quest" ADD "notice" jsonb`);
		await queryRunner.query(`ALTER TABLE "lojo_quest_attempt" ADD "mode" character varying(8) NOT NULL DEFAULT 'level'`);
		await queryRunner.query(`UPDATE "lojo_quest_attempt" SET "status" = 'quit', "endedAt" = now() WHERE "status" = 'open'`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "lojo_quest_attempt" DROP COLUMN "mode"`);
		await queryRunner.query(`ALTER TABLE "lojo_quest" DROP COLUMN "notice"`);
		await queryRunner.query(`ALTER TABLE "lojo_quest" DROP COLUMN "onboarded"`);
		await queryRunner.query(`ALTER TABLE "lojo_quest" DROP COLUMN "examDate"`);
	}
}
