/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 5 号线 · 词汇's stop page (/vocab/5.2): checking a spelling, finding the word in its example, the progress record,
// and the word list itself.
import { describe, expect, test } from 'vitest';
import { closestSpelling, editDistance, exParts, isRight, letterInfo, normWord } from '@/lojo/vocab/spell.js';
import { applyMarks, emptyProgress, learnedOf, missedOf, toProgress } from '@/lojo/vocab/record.js';
import { findStop, gatePath, vocabContent } from '@/lojo/vocab/content.js';
import { scopeWords } from '@/lojo/vocab/round.js';

const word = (w: string, ex: string, alt: string[] = []) => ({ w, alt, ex });

describe('spelling', () => {
	test('the word and its other spellings count, in any case, with or without a final full stop', () => {
		const w = word('enrol', '', ['enroll']);
		expect(isRight(w, 'Enrol')).toBe(true);
		expect(isRight(w, 'enroll.')).toBe(true);
		expect(isRight(w, 'enrole')).toBe(false);
		expect(isRight(w, '   ')).toBe(false);
	});

	test('full-width letters, typed with a Chinese input method, count as plain ones', () => {
		expect(normWord('ｆｌａｔ')).toBe('flat');
		expect(isRight(word('flat', ''), 'ｆｌａｔ')).toBe(true);
	});

	test('a wrong answer is shown against the closest spelling, the word itself on a tie', () => {
		const w = word('neighbourhood', '', ['neighborhood']);
		expect(closestSpelling(w, 'neighborhod')).toBe('neighborhood');
		expect(closestSpelling(w, 'neighbourhod')).toBe('neighbourhood');
		expect(editDistance('flat', 'flt')).toBe(1);
		expect(editDistance('Flat', 'flat')).toBe(0);
	});

	test('the blank says how many letters and words, and whether there is a hyphen', () => {
		expect(letterInfo('labour-intensive')).toEqual({ letters: 15, words: 1, hyphen: true });
		expect(letterInfo('guided tour')).toEqual({ letters: 10, words: 2, hyphen: false });
	});
});

describe('the word in its example', () => {
	test('an ending stays outside the blank', () => {
		const p = exParts(word('advert', 'She answered two adverts for flats this week.'));
		expect([p.word, p.suffix]).toEqual(['advert', 's']);
		expect(p.before + p.word + p.suffix + p.after).toBe('She answered two adverts for flats this week.');
	});

	test('another spelling is found as well', () => {
		expect(exParts(word('enrol', 'You can enroll online until Friday.', ['enroll'])).word).toBe('enroll');
	});

	test('an example without the word has nothing to blank', () => {
		expect(exParts(word('deposit', 'The landlord kept the money.')).word).toBe('');
	});

	test('every example in the nine stops has its word in it', () => {
		const missing = vocabContent.stops.flatMap(s => s.words).filter(w => exParts(w).word === '').map(w => w.w);
		expect(missing).toEqual([]);
	});
});

describe('the progress record', () => {
	test('wrong is missed; right the first time later is learned and leaves the missed ones', () => {
		let p = applyMarks(emptyProgress(), [{ stop: '5.2', word: 'deposit', right: false, at: 1000 }]);
		expect([...missedOf(p, '5.2')]).toEqual(['deposit']);
		expect([...learnedOf(p, '5.2')]).toEqual([]);
		p = applyMarks(p, [{ stop: '5.2', word: 'deposit', right: true, at: 2000 }]);
		expect([...missedOf(p, '5.2')]).toEqual([]);
		expect([...learnedOf(p, '5.2')]).toEqual(['deposit']);
		expect(p.stops['5.2']?.at).toBe(2000);
	});

	test('marks are added to a copy: the record they were applied to stays as it was', () => {
		const before = applyMarks(emptyProgress(), [{ stop: '5.3', word: 'module', right: true, at: 1 }]);
		applyMarks(before, [{ stop: '5.3', word: 'tutorial', right: false, at: 2 }]);
		expect(before.stops['5.3']).toEqual({ learned: ['module'], missed: [], at: 1 });
	});

	test('a broken registry value reads as far as it makes sense', () => {
		expect(toProgress(null)).toEqual(emptyProgress());
		expect(toProgress({ stops: { '5.2': { learned: ['flat', 3, 'flat'], missed: 'x', at: -5 } } }))
			.toEqual({ v: 1, stops: { '5.2': { learned: ['flat'], missed: [], at: 0 } } });
	});
});

describe('the word list', () => {
	test('nine stops, 30 to 40 words each, no word in two stops', () => {
		expect(vocabContent.stops.map(s => s.id)).toEqual(['5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9']);
		for (const s of vocabContent.stops) expect(s.words.length, s.id).toBeGreaterThanOrEqual(30);
		for (const s of vocabContent.stops) expect(s.words.length, s.id).toBeLessThanOrEqual(40);
		const all = vocabContent.stops.flatMap(s => s.words.map(w => w.w.toLowerCase()));
		expect(new Set(all).size).toBe(all.length);
	});

	test('a stop is found by its id, and its gate is on the IELTS map', () => {
		expect(findStop('5.2')?.topic).toBe('住宿与租房');
		expect(findStop('9.9')).toBeNull();
		expect(gatePath('5.2')).toBe('/gate/ielts/5.2');
	});

	test('practising the missed words falls back to every word when there are none', () => {
		const stop = findStop('5.2')!;
		expect(scopeWords(stop, 'missed', new Set()).scope).toBe('all');
		const first = stop.words[0].w;
		expect(scopeWords(stop, 'missed', new Set([first])).words.map(w => w.w)).toEqual([first]);
		expect(scopeWords(stop, 'g1', new Set()).words).toEqual(stop.groups[1].words);
	});
});
