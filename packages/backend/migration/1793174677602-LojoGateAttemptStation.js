/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 同路人: who tried a gate lately is looked up by course, station and start time.
export class LojoGateAttemptStation1793174677602 {
	name = 'LojoGateAttemptStation1793174677602';

	async up(queryRunner) {
		await queryRunner.query(`CREATE INDEX "IDX_lojo_gate_attempt_course_station" ON "lojo_gate_attempt" ("course", "station", "startedAt") `);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "public"."IDX_lojo_gate_attempt_course_station"`);
	}
}
