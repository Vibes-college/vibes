/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { hitScore, progressCardText, recallText, searchTerms } from '@/misc/lojo-tutor-progress.js';
import { tutorContextMessage } from '@/misc/lojo-tutor.js';

describe('progress card', () => {
	const card = progressCardText({
		quest: {
			chapter: { no: 2, title: 'Chapter 2' }, passed: 2, total: 6, bossBeaten: false, next: '2-3 Listening',
			hearts: 3, maxHearts: 5, streakDays: 4,
			lastFail: { level: '2-3 Listening', cause: 'linking sounds', inARow: 2, at: '2026-11-10T09:00:00.000Z' },
			updatedAt: '2026-11-10T09:00:00.000Z',
		},
		gates: 'IELTS listening 1.3: passed (2026-11-09)',
		wordbook: { words: 20, dueToday: 5, reviewedToday: 1, updatedAt: '2026-11-11T01:00:00.000Z' },
	});

	test('has each part, with dates', () => {
		expect(card).toContain('chapter 2');
		expect(card).toContain('2 of 6 levels passed');
		expect(card).toContain('Last failed: 2-3 Listening, mostly linking sounds, 2 times in a row (2026-11-10)');
		expect(card).toContain('IELTS listening 1.3');
		expect(card).toContain('20 words saved; 5 due for review today');
		expect(card).toContain('updated 2026-11-11');
	});

	test('stays short', () => {
		expect(card.length).toBeLessThanOrEqual(1400);
		const long = progressCardText({ quest: null, gates: Array.from({ length: 10 }, (_, i) => `line ${i} ${'x'.repeat(400)}`).join('\n'), wordbook: null });
		expect(long.length).toBeLessThanOrEqual(1400);
		expect(long.split('\n').filter(l => l.startsWith('- line')).length).toBe(3);
	});

	test('says what is not started', () => {
		expect(progressCardText({ quest: null, gates: null, wordbook: null })).toBe('Quest map: not started yet.\nRoute map gates: none taken yet.\nWordbook: no words saved yet.');
	});

	test('goes in the last message, not the gates text', () => {
		const msg = tutorContextMessage({ now: '2026-11-11 Wednesday morning (Beijing time)', progress: card, gates: 'old gates', recall: 'Older messages …' });
		expect(msg).toContain('never say you cannot see it');
		expect(msg).toContain(card);
		expect(msg).not.toContain('old gates');
		expect(msg).toContain('Older messages …');
	});
});

describe('chat search terms', () => {
	test('English words without filler', () => {
		expect(searchTerms('Do you remember my cat Mochi?').en).toEqual(['remember', 'cat', 'mochi']);
	});

	test('Chinese as two-character pieces, filler dropped', () => {
		const t = searchTerms('你还记得我上次说的雅思考试吗');
		expect(t.zh).toContain('雅思');
		expect(t.zh).toContain('考试');
		expect(t.zh).not.toContain('还记');
	});

	test('score and recall text', () => {
		const terms = searchTerms('my cat Mochi 雅思');
		expect(hitScore('My cat is called Mochi', terms)).toBe(4);
		expect(hitScore('我在准备雅思', terms)).toBe(1);
		expect(recallText([])).toBeNull();
		expect(recallText([{ id: 'a', at: '2026-11-01T00:00:00.000Z', who: 'learner', text: 'My cat is Mochi', score: 4 }])).toContain('2026-11-01 they said: My cat is Mochi');
	});
});
