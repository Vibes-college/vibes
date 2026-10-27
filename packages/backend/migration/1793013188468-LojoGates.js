/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class LojoGates1793013188468 {
    name = 'LojoGates1793013188468'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "lojo_gate_course" ("id" character varying(32) NOT NULL, "data" jsonb NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_gate_course" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lojo_gate_attempt" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "course" character varying(32) NOT NULL, "kind" character varying(16) NOT NULL, "station" character varying(16) NOT NULL, "setId" character varying(32) NOT NULL, "score" smallint, "total" smallint NOT NULL, "passed" boolean, "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "submittedAt" TIMESTAMP WITH TIME ZONE, "data" jsonb NOT NULL, CONSTRAINT "PK_lojo_gate_attempt" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_lojo_gate_attempt_user_course" ON "lojo_gate_attempt" ("userId", "course")`);
        await queryRunner.query(`ALTER TABLE "lojo_gate_attempt" ADD CONSTRAINT "FK_lojo_gate_attempt_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "lojo_gate_attempt"`);
        await queryRunner.query(`DROP TABLE "lojo_gate_course"`);
    }
}
