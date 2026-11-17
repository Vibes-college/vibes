/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 内容进数据库 (2026-11-17): private content that changes fast (first the 锦囊书屋 books and their quizzes) is imported
// here instead of being written into the open-source code. One row per import; `kind` says what it is
// ("quest-books", later course content), one active row per kind, older rows stay for rollback.
export class LojoContent1795300000000 {
	name = 'LojoContent1795300000000';

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "lojo_content" ("id" SERIAL NOT NULL, "kind" character varying(64) NOT NULL, "version" character varying(256) NOT NULL, "data" jsonb NOT NULL, "active" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "note" character varying(512) NOT NULL DEFAULT '', CONSTRAINT "PK_lojo_content" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_content_kind_active" ON "lojo_content" ("kind", "active") `);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "public"."IDX_lojo_content_kind_active"`);
		await queryRunner.query(`DROP TABLE "lojo_content"`);
	}
}
