/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// A stop's clock. It runs only while the stop is on screen: time on another page (pages are kept alive in the
// background), in another tab or in another app counts neither against a time limit nor as practice.
export type Clock = {
	start(): void;
	pause(): void;
	// milliseconds it has run
	now(): number;
	readonly running: boolean;
};

export function createClock(now: () => number = () => window.performance.now()): Clock {
	let base = 0;
	let since: number | null = null;
	return {
		start() {
			since ??= now();
		},
		pause() {
			if (since == null) return;
			base += now() - since;
			since = null;
		},
		now: () => base + (since != null ? now() - since : 0),
		get running() {
			return since != null;
		},
	};
}
