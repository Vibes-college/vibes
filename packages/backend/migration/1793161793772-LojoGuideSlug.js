/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class LojoGuideSlug1793161793772 {
	name = 'LojoGuideSlug1793161793772';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "lojo_guide" ADD "slug" character varying(80)`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_lojo_guide_slug" ON "lojo_guide" ("slug") `);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "public"."IDX_lojo_guide_slug"`);
		await queryRunner.query(`ALTER TABLE "lojo_guide" DROP COLUMN "slug"`);
	}
}
