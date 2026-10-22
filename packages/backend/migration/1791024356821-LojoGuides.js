/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class LojoGuides1791024356821 {
	name = 'LojoGuides1791024356821';

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "lojo_guide" ("id" character varying(32) NOT NULL, "authorId" character varying(32) NOT NULL, "title" character varying(160) NOT NULL, "summary" character varying(600) NOT NULL, "category" character varying(40) NOT NULL, "city" character varying(80) NOT NULL, "coverUrl" character varying(2048), "status" character varying(16) NOT NULL, "isDemo" boolean NOT NULL DEFAULT false, "revision" integer NOT NULL, "blocks" jsonb NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_guide" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "lojo_guide_thread" ("id" character varying(32) NOT NULL, "guideId" character varying(32) NOT NULL, "anchorKey" character varying(64) NOT NULL, "anchor" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_guide_thread" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "lojo_guide_comment" ("id" character varying(32) NOT NULL, "threadId" character varying(32) NOT NULL, "noteId" character varying(32) NOT NULL, "replyToId" character varying(32), CONSTRAINT "PK_lojo_guide_comment" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "lojo_guide_like" ("id" character varying(32) NOT NULL, "threadId" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, CONSTRAINT "PK_lojo_guide_like" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "lojo_guide_bookmark" ("id" character varying(32) NOT NULL, "guideId" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, CONSTRAINT "PK_lojo_guide_bookmark" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_guide_status_updated" ON "lojo_guide" ("status", "updatedAt")`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_guide_author" ON "lojo_guide" ("authorId")`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_lojo_guide_thread_anchor" ON "lojo_guide_thread" ("guideId", "anchorKey")`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_guide_comment_thread" ON "lojo_guide_comment" ("threadId", "id")`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_lojo_guide_comment_note" ON "lojo_guide_comment" ("noteId")`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_lojo_guide_like_pair" ON "lojo_guide_like" ("threadId", "userId")`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_lojo_guide_bookmark_pair" ON "lojo_guide_bookmark" ("userId", "guideId")`);
		await queryRunner.query(`ALTER TABLE "lojo_guide" ADD CONSTRAINT "FK_lojo_guide_author" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "lojo_guide_thread" ADD CONSTRAINT "FK_lojo_guide_thread_guide" FOREIGN KEY ("guideId") REFERENCES "lojo_guide"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "lojo_guide_comment" ADD CONSTRAINT "FK_lojo_guide_comment_thread" FOREIGN KEY ("threadId") REFERENCES "lojo_guide_thread"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "lojo_guide_comment" ADD CONSTRAINT "FK_lojo_guide_comment_note" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "lojo_guide_comment" ADD CONSTRAINT "FK_lojo_guide_comment_reply" FOREIGN KEY ("replyToId") REFERENCES "lojo_guide_comment"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "lojo_guide_like" ADD CONSTRAINT "FK_lojo_guide_like_thread" FOREIGN KEY ("threadId") REFERENCES "lojo_guide_thread"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "lojo_guide_like" ADD CONSTRAINT "FK_lojo_guide_like_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "lojo_guide_bookmark" ADD CONSTRAINT "FK_lojo_guide_bookmark_guide" FOREIGN KEY ("guideId") REFERENCES "lojo_guide"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "lojo_guide_bookmark" ADD CONSTRAINT "FK_lojo_guide_bookmark_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP TABLE "lojo_guide_bookmark"`);
		await queryRunner.query(`DROP TABLE "lojo_guide_like"`);
		await queryRunner.query(`DROP TABLE "lojo_guide_comment"`);
		await queryRunner.query(`DROP TABLE "lojo_guide_thread"`);
		await queryRunner.query(`DROP TABLE "lojo_guide"`);
	}
}
