/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关的题目和地图搬进数据库 (2026-11-12): one row per import, the active one in use, older ones kept for rolling back.
// The content itself is put in by apps/community/scripts/quest-import.mjs after this runs; until then 闯关 answers
// QUEST_NO_CONTENT. Learner saves (lojo_quest and the rest) are not touched: level ids stay the same.
export class LojoQuestContent1794900000000 {
	name = 'LojoQuestContent1794900000000';

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "lojo_quest_content" ("id" SERIAL NOT NULL, "version" character varying(256) NOT NULL, "chapters" jsonb NOT NULL, "active" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "note" character varying(512) NOT NULL DEFAULT '', CONSTRAINT "PK_lojo_quest_content" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_quest_content_active" ON "lojo_quest_content" ("active") `);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "public"."IDX_lojo_quest_content_active"`);
		await queryRunner.query(`DROP TABLE "lojo_quest_content"`);
	}
}
