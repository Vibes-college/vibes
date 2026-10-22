/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class LojoMaps1790969603903 {
    name = 'LojoMaps1790969603903'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "lojo_state" ("userId" character varying(32) NOT NULL, "revision" integer NOT NULL, "state" jsonb NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_state" PRIMARY KEY ("userId"))`);
        await queryRunner.query(`CREATE TABLE "lojo_entity" ("id" character varying(128) NOT NULL, "type" character varying(16) NOT NULL, "title" character varying(200) NOT NULL, "lat" double precision NOT NULL, "lng" double precision NOT NULL, "route" character varying(240) NOT NULL, "mapLayer" character varying(32) NOT NULL, "status" character varying(16) NOT NULL, "data" jsonb NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_entity" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_lojo_entity_type" ON "lojo_entity" ("type")`);
        await queryRunner.query(`CREATE TABLE "lojo_entity_note" ("entityId" character varying(128) NOT NULL, "noteId" character varying(32) NOT NULL, CONSTRAINT "PK_lojo_entity_note" PRIMARY KEY ("entityId", "noteId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_lojo_entity_note_note" ON "lojo_entity_note" ("noteId")`);
        await queryRunner.query(`ALTER TABLE "lojo_state" ADD CONSTRAINT "FK_lojo_state_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lojo_entity_note" ADD CONSTRAINT "FK_lojo_entity_note_entity" FOREIGN KEY ("entityId") REFERENCES "lojo_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lojo_entity_note" ADD CONSTRAINT "FK_lojo_entity_note_note" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "lojo_entity_note"`);
        await queryRunner.query(`DROP TABLE "lojo_entity"`);
        await queryRunner.query(`DROP TABLE "lojo_state"`);
    }
}
