/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { looksChinese, looksEnglish, speechText, splitMentions } from '@/lojo/english/text.js';

describe('Vibes English helper text checks', () => {
	test('treats Chinese drafts as Chinese even with a mention, link or a few English words', () => {
		expect(looksChinese('今天终于考完雅思了，累死')).toBe(true);
		expect(looksChinese('@alice@example.com 我也是 IELTS 考生 https://example.com/a')).toBe(true);
		expect(looksChinese('Just finished my IELTS mock test 好累')).toBe(false);
		expect(looksChinese('')).toBe(false);
	});

	test('only offers reading aloud for English text', () => {
		expect(looksEnglish('Just finished my IELTS mock test')).toBe(true);
		expect(looksEnglish('今天终于考完雅思了')).toBe(false);
		expect(looksEnglish('ok')).toBe(false);
	});

	test('reads words, not links, handles, emoji codes or MFM syntax', () => {
		expect(speechText('@bob check $[x2 this] out https://a.b/c :tada: #IELTS')).toBe('check this out IELTS');
		expect(speechText('<small>quietly</small> done')).toBe('quietly done');
	});

	test('keeps a reply\'s leading mentions apart from the body', () => {
		expect(splitMentions('@alice @bob@example.com 我也考完了')).toEqual({ prefix: '@alice @bob@example.com ', body: '我也考完了' });
		expect(splitMentions('Hi @alice')).toEqual({ prefix: '', body: 'Hi @alice' });
		expect(splitMentions('@alice ')).toEqual({ prefix: '@alice ', body: '' });
	});
});
