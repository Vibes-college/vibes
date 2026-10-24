/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { LojoEnglishInvalidResponse, normalizeDraft, normalizeExplanation, normalizeReplyIdeas, withoutNewLinks } from '@/misc/lojo-english.js';

describe('LOJO English helper responses', () => {
	test('keeps a well-formed explanation and drops items without text or meaning', () => {
		const result = normalizeExplanation({
			sourceLang: 'en',
			translation: ' 今天考完雅思了 ',
			tone: '轻松',
			items: [
				{ text: 'nailed it', kind: 'slang', meaning: '搞定了', usage: '口语', example: 'You nailed it!', exampleZh: '你做到了！' },
				{ text: '', kind: 'word', meaning: '空' },
				{ text: 'mock', kind: 'unknown', meaning: '模拟考' },
			],
		});
		expect(result.translation).toBe('今天考完雅思了');
		expect(result.items.map(x => x.text)).toEqual(['nailed it', 'mock']);
		expect(result.items[1].kind).toBe('phrase');
	});

	test('rejects an explanation without a translation', () => {
		expect(() => normalizeExplanation({ sourceLang: 'en', items: [] })).toThrow(LojoEnglishInvalidResponse);
		expect(() => normalizeExplanation('not json')).toThrow(LojoEnglishInvalidResponse);
	});

	test('returns the three styles in a fixed order, matching by style name first', () => {
		const result = normalizeDraft({
			sourceLang: 'zh',
			versions: [
				{ style: 'formal', text: 'I have completed the test.' },
				{ style: 'casual', text: 'Just finished the test!', notes: [{ phrase: 'just', explanation: '刚刚' }, { phrase: 'x' }] },
				{ style: 'slang', text: 'Test done lol' },
			],
		});
		expect(result.versions.map(v => v.style)).toEqual(['casual', 'slang', 'formal']);
		expect(result.versions[0].notes).toEqual([{ phrase: 'just', explanation: '刚刚' }]);
		expect(result.feedback).toBe('');
	});

	test('rejects a draft that is missing a version', () => {
		expect(() => normalizeDraft({ versions: [{ style: 'casual', text: 'Hi' }] })).toThrow(LojoEnglishInvalidResponse);
	});

	test('keeps at most three reply ideas and needs at least one', () => {
		const ideas = Array.from({ length: 5 }, (_, i) => ({ angle: '共鸣', text: `Reply ${i}`, zh: '回复' }));
		expect(normalizeReplyIdeas({ ideas }).ideas).toHaveLength(3);
		expect(() => normalizeReplyIdeas({ ideas: [{ text: '' }] })).toThrow(LojoEnglishInvalidResponse);
	});

	test('removes links the model added but keeps links from the post', () => {
		const source = JSON.stringify({ post: 'see https://ielts.org/test for dates' });
		const out = withoutNewLinks({ translation: '看 https://ielts.org/test 和 https://evil.example/x', items: [{ example: 'Go to https://evil.example/y.' }] }, source);
		expect(out.translation).toBe('看 https://ielts.org/test 和');
		expect(out.items[0].example).toBe('Go to .');
	});
});
