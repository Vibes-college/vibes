/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { lojoDefaultVoice, lojoVoiceIds, lojoVoices, speechText } from '@/misc/lojo-voices.js';

describe('LOJO read-aloud voices', () => {
	test('reads words, not links, handles, emoji codes or MFM syntax', () => {
		expect(speechText('@bob check $[x2 this] out https://a.b/c :tada: #IELTS')).toBe('check this out IELTS');
		expect(speechText('<small>quietly</small> done')).toBe('quietly done');
		expect(speechText('Line one\n\n  Line two')).toBe('Line one\nLine two');
	});

	test('voice ids are unique and the default voice exists', () => {
		expect(new Set(lojoVoiceIds).size).toBe(lojoVoices.length);
		expect(lojoVoiceIds).toContain(lojoDefaultVoice);
	});
});
