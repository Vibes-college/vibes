/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关定级 (冲刺1111): lojo_quest.placement holds the learner's placement test: when it was taken, the station, where
// they were told to start, the part already handed in (kept when they quit in the second part), whether the banner was
// closed and whether the first Boss try needs no prep. Null for anyone who never saw or took it.
export class LojoQuestPlacement1794700000000 {
	name = 'LojoQuestPlacement1794700000000';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "lojo_quest" ADD "placement" jsonb`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "lojo_quest" DROP COLUMN "placement"`);
	}
}
