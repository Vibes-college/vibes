/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 先玩后注册 (冲刺1111): a visitor plays 1-1 before signing up.
// lojo_quest.trial: this learner played first and saved after (存档), for the growth report.
// lojo_funnel_count: how many times a day each visitor step happened (增长 埋点清单). Only the day, the step and where
// the visitor came from, and a count: no user, IP, device or page.
export class LojoTrialFunnel1794600000000 {
	name = 'LojoTrialFunnel1794600000000';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "lojo_quest" ADD "trial" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`CREATE TABLE "lojo_funnel_count" ("day" date NOT NULL, "event" character varying(32) NOT NULL, "src" character varying(16) NOT NULL, "n" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_lojo_funnel_count" PRIMARY KEY ("day", "event", "src"))`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP TABLE "lojo_funnel_count"`);
		await queryRunner.query(`ALTER TABLE "lojo_quest" DROP COLUMN "trial"`);
	}
}
