/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// One row per signed-in user per Beijing day on which they opened the app (any authenticated API call).
// Only the user and the day: no IP, device or page. Used for the next-day-return number in the growth report.
export class LojoDailyOpen1794500000000 {
	name = 'LojoDailyOpen1794500000000';

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "lojo_daily_open" ("userId" character varying(32) NOT NULL, "day" date NOT NULL, CONSTRAINT "PK_lojo_daily_open" PRIMARY KEY ("userId", "day"))`);
		await queryRunner.query(`CREATE INDEX "IDX_lojo_daily_open_day" ON "lojo_daily_open" ("day")`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP TABLE "lojo_daily_open"`);
	}
}
