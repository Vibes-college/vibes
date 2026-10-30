/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 生词本 spaced review: the words, their two FSRS cards (认得 and 拼写) and every review.
// Words saved before this lived in the account registry; the client moves them over with lojo/words/import.
export class LojoWords1793330442716 {
	name = 'LojoWords1793330442716';

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "lojo_word" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "key" character varying(256) NOT NULL, "text" character varying(256) NOT NULL, "kind" character varying(16) NOT NULL, "meaning" character varying(1024) NOT NULL DEFAULT '', "usage" character varying(2048) NOT NULL DEFAULT '', "example" character varying(1024) NOT NULL DEFAULT '', "exampleZh" character varying(1024) NOT NULL DEFAULT '', "source" character varying(16) NOT NULL, "noteId" character varying(32), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_word" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_lojo_word_user_key" ON "lojo_word" ("userId", "key") `);
		await queryRunner.query(`ALTER TABLE "lojo_word" ADD CONSTRAINT "FK_lojo_word_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

		await queryRunner.query(`CREATE TABLE "lojo_word_card" ("id" character varying(32) NOT NULL, "wordId" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "kind" character varying(16) NOT NULL, "due" TIMESTAMP WITH TIME ZONE NOT NULL, "stability" double precision NOT NULL, "difficulty" double precision NOT NULL, "elapsedDays" integer NOT NULL, "scheduledDays" integer NOT NULL, "learningSteps" integer NOT NULL, "reps" integer NOT NULL, "lapses" integer NOT NULL, "state" smallint NOT NULL, "lastReview" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_lojo_word_card" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_lojo_word_card_word_kind" ON "lojo_word_card" ("wordId", "kind") `);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_word_card_user_due" ON "lojo_word_card" ("userId", "due") `);
		await queryRunner.query(`ALTER TABLE "lojo_word_card" ADD CONSTRAINT "FK_lojo_word_card_word" FOREIGN KEY ("wordId") REFERENCES "lojo_word"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "lojo_word_card" ADD CONSTRAINT "FK_lojo_word_card_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

		await queryRunner.query(`CREATE TABLE "lojo_word_review" ("id" character varying(32) NOT NULL, "cardId" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "rating" smallint NOT NULL, "state" smallint NOT NULL, "due" TIMESTAMP WITH TIME ZONE NOT NULL, "stability" double precision NOT NULL, "difficulty" double precision NOT NULL, "elapsedDays" integer NOT NULL, "lastElapsedDays" integer NOT NULL, "scheduledDays" integer NOT NULL, "learningSteps" integer NOT NULL, "reviewedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "durationMs" integer, CONSTRAINT "PK_lojo_word_review" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_word_review_user_at" ON "lojo_word_review" ("userId", "reviewedAt") `);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_word_review_card" ON "lojo_word_review" ("cardId") `);
		await queryRunner.query(`ALTER TABLE "lojo_word_review" ADD CONSTRAINT "FK_lojo_word_review_card" FOREIGN KEY ("cardId") REFERENCES "lojo_word_card"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "lojo_word_review" ADD CONSTRAINT "FK_lojo_word_review_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP TABLE "lojo_word_review"`);
		await queryRunner.query(`DROP TABLE "lojo_word_card"`);
		await queryRunner.query(`DROP TABLE "lojo_word"`);
	}
}
