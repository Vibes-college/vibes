/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class LojoGuideFeatured1791025004248 {
	name = 'LojoGuideFeatured1791025004248';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "lojo_guide" ADD "featured" boolean NOT NULL DEFAULT false`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "lojo_guide" DROP COLUMN "featured"`);
	}
}
