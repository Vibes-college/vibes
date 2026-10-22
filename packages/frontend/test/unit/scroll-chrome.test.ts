/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { createScrollChromeTracker } from '@/utility/scroll-chrome.js';

describe('mobile timeline navigation', () => {
	test('keeps the opening content visible, then hides on deliberate downward scrolling', () => {
		const tracker = createScrollChromeTracker();
		expect(tracker.update(70, 2000)).toBe(false);
		expect(tracker.update(130, 2000)).toBe(true);
	});

	test('ignores small reversals and reveals after scrolling back or reaching the top', () => {
		const tracker = createScrollChromeTracker();
		expect(tracker.update(300, 2000)).toBe(true);
		for (const y of [299, 300, 298, 302, 296]) expect(tracker.update(y, 2000)).toBe(true);
		expect(tracker.update(268, 2000)).toBe(false);
		expect(tracker.update(500, 2000)).toBe(true);
		expect(tracker.update(0, 2000)).toBe(false);
	});

	test('elastic overscroll at the end does not reveal controls on rebound', () => {
		const tracker = createScrollChromeTracker();
		expect(tracker.update(1000, 1000)).toBe(true);
		expect(tracker.update(1080, 1000)).toBe(true);
		expect(tracker.update(1000, 1000)).toBe(true);
		expect(tracker.update(960, 1000)).toBe(false);
	});

	test('accumulates slow touch scrolling instead of discarding small deltas', () => {
		const tracker = createScrollChromeTracker();
		expect(tracker.update(500, 2000)).toBe(true);
		for (let y = 499; y > 476; y--) expect(tracker.update(y, 2000)).toBe(true);
		expect(tracker.update(476, 2000)).toBe(false);
	});

	test('resets the baseline for restored pages and keeps short timelines visible', () => {
		const tracker = createScrollChromeTracker();
		tracker.update(900, 2000);
		tracker.reset(900);
		expect(tracker.update(902, 2000)).toBe(false);
		expect(tracker.update(970, 2000)).toBe(true);
		tracker.reset();
		expect(tracker.update(200, 80)).toBe(false);
		expect(tracker.update(-80, 80)).toBe(false);
	});
});
