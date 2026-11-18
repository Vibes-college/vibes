/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 2026-11-17: the old 落脚 map (rent, food, events, travel) was removed from the code (65e2c67), and the founder said
// 「旧表删」 for its three tables. Production had 0 rows in each; the LAN test site's demo rows were dumped first.
// down() recreates the empty tables exactly as 1790969603903-lojo-maps.js made them.
export class DropLojoMaps1795400000000 {
	name = 'DropLojoMaps1795400000000';

	async up(queryRunner) {
		await queryRunner.query(`DROP TABLE IF EXISTS "lojo_entity_note"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "lojo_entity"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "lojo_state"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`CREATE TABLE "lojo_state" ("userId" character varying(32) NOT NULL, "revision" integer NOT NULL, "state" jsonb NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_state" PRIMARY KEY ("userId"))`);
		await queryRunner.query(`CREATE TABLE "lojo_entity" ("id" character varying(128) NOT NULL, "type" character varying(16) NOT NULL, "title" character varying(200) NOT NULL, "lat" double precision NOT NULL, "lng" double precision NOT NULL, "route" character varying(240) NOT NULL, "mapLayer" character varying(32) NOT NULL, "status" character varying(16) NOT NULL, "data" jsonb NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_lojo_entity" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_entity_type" ON "lojo_entity" ("type")`);
		await queryRunner.query(`CREATE TABLE "lojo_entity_note" ("entityId" character varying(128) NOT NULL, "noteId" character varying(32) NOT NULL, CONSTRAINT "PK_lojo_entity_note" PRIMARY KEY ("entityId", "noteId"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_entity_note_note" ON "lojo_entity_note" ("noteId")`);
		await queryRunner.query(`ALTER TABLE "lojo_state" ADD CONSTRAINT "FK_lojo_state_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "lojo_entity_note" ADD CONSTRAINT "FK_lojo_entity_note_entity" FOREIGN KEY ("entityId") REFERENCES "lojo_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "lojo_entity_note" ADD CONSTRAINT "FK_lojo_entity_note_note" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}
}
