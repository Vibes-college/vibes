/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { estimatedVoiceSeconds, formatDuration, isVoiceFile, playedRatio, releaseAudioFocus, takeAudioFocus, voiceTimeText } from '@/lojo/audio.js';

describe('Vibes chat voice messages', () => {
	test('only audio files play as a voice bubble', () => {
		expect(isVoiceFile({ type: 'audio/mpeg' })).toBe(true);
		expect(isVoiceFile({ type: 'audio/ogg' })).toBe(true);
		expect(isVoiceFile({ type: 'image/png' })).toBe(false);
		expect(isVoiceFile({ type: 'video/mp4' })).toBe(false);
		expect(isVoiceFile(null)).toBe(false);
		expect(isVoiceFile(undefined)).toBe(false);
	});

	test('writes lengths as minutes and seconds', () => {
		expect(formatDuration(0)).toBe('0:00');
		expect(formatDuration(5.4)).toBe('0:05');
		expect(formatDuration(12.6)).toBe('0:13');
		expect(formatDuration(65)).toBe('1:05');
		expect(formatDuration(599.6)).toBe('10:00');
		expect(formatDuration(Number.NaN)).toBe('');
		expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('');
		expect(formatDuration(-1)).toBe('');
	});

	test('shows elapsed and total once the length is known', () => {
		expect(voiceTimeText(0, Number.NaN)).toBe('');
		expect(voiceTimeText(3.2, Number.NaN)).toBe('0:03');
		expect(voiceTimeText(3, Number.POSITIVE_INFINITY)).toBe('0:03');
		expect(voiceTimeText(0, 12.4)).toBe('0:00 / 0:12');
		expect(voiceTimeText(3.2, 12.4)).toBe('0:03 / 0:12');
	});

	test('keeps the progress between 0 and 1', () => {
		expect(playedRatio(3, 12)).toBe(0.25);
		expect(playedRatio(15, 12)).toBe(1);
		expect(playedRatio(-1, 12)).toBe(0);
		expect(playedRatio(3, 0)).toBe(0);
		expect(playedRatio(3, Number.NaN)).toBe(0);
		expect(playedRatio(3, Number.POSITIVE_INFINITY)).toBe(0);
	});

	test('starting one sound pauses the one before, and only that one', () => {
		const a = { pause: vi.fn() };
		const b = { pause: vi.fn() };

		takeAudioFocus(a);
		takeAudioFocus(a);
		expect(a.pause).not.toHaveBeenCalled();

		takeAudioFocus(b);
		expect(a.pause).toHaveBeenCalledTimes(1);

		// a is no longer the one playing, so letting go of it changes nothing.
		releaseAudioFocus(a);
		takeAudioFocus(a);
		expect(b.pause).toHaveBeenCalledTimes(1);

		// After a finishes on its own, the next sound has nothing to pause.
		releaseAudioFocus(a);
		takeAudioFocus(b);
		expect(a.pause).toHaveBeenCalledTimes(1);
		expect(b.pause).toHaveBeenCalledTimes(1);
	});

	test('knows the length of our own 64 kbit/s voice files from their size', () => {
		expect(estimatedVoiceSeconds({ name: 'vibes-voice-0123abcd.mp3', size: 96000, type: 'audio/mpeg' })).toBe(12);
		expect(Number.isNaN(estimatedVoiceSeconds({ name: 'recording.mp3', size: 96000, type: 'audio/mpeg' }))).toBe(true);
		expect(Number.isNaN(estimatedVoiceSeconds({ name: 'vibes-voice-x.mp3', size: 0, type: 'audio/mpeg' }))).toBe(true);
	});
});
