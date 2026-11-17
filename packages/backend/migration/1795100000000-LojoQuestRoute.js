/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 三段闯关 (冲刺1111 闯关排法, 2026-11-13): the route (route.json) imported with the chapters, and each learner's route state
// (stations ever opened, 摸底 results, sprint stars, 回炉 events). Both null = the old map, unchanged.
export class LojoQuestRoute1795100000000 {
	name = 'LojoQuestRoute1795100000000';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "lojo_quest_content" ADD "route" jsonb`);
		await queryRunner.query(`ALTER TABLE "lojo_quest" ADD "route" jsonb`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "lojo_quest" DROP COLUMN "route"`);
		await queryRunner.query(`ALTER TABLE "lojo_quest_content" DROP COLUMN "route"`);
	}
}
