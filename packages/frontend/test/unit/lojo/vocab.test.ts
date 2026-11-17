/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 5 号线 · 词汇's stop page (/apps/vocab/5.2): checking a spelling, finding the word in its example, the progress record,
// and reading a word list. The real lists are in the site's database since 2026-11-17 (content-import.mjs vocab-ielts
// checks them before they go in); an example list is used here.
import { describe, expect, test } from 'vitest';
import { closestSpelling, editDistance, exParts, isRight, letterInfo, normWord } from '@/lojo/vocab/spell.js';
import { applyMarks, emptyProgress, learnedOf, missedOf, toProgress } from '@/lojo/vocab/record.js';
import { GROUP_COLORS, findStop, gatePath, toVocabContent, usedIn } from '@/lojo/vocab/content.js';
import { scopeWords } from '@/lojo/vocab/round.js';

const word = (w: string, ex: string, alt: string[] = []) => ({ w, alt, ex });

// 示例词表（不是课程里的词）：5.2 有两组；一个重复的词、一个没写意思的词、一个没有词的站会被去掉。
const EXAMPLE = {
	line: 5,
	color: '#6E4F8F',
	gate: { total: 10, spell: 6, choose: 4, pass: 8, plays: 3 },
	stops: [
		{ id: '5.1', band: 4, topic: '示例：个人信息', uses: ['1.1', '9.9'], groups: [{ label: '地址', words: [
			{ w: 'postcode', ipa: '/ˈpəʊstkəʊd/', pos: 'n.', zh: '邮政编码', ex: 'Don\'t forget the postcode.' },
		] }] },
		{ id: '5.2', band: 4.5, topic: '示例：住宿', groups: [
			{ label: '找房子', words: [
				{ w: 'flat', zh: '公寓', ex: 'We rented a small flat.' },
				{ w: 'deposit', zh: '押金', ex: 'The landlord kept the deposit.' },
				{ w: 'Flat', zh: '重复', ex: 'Flat again.' },
				{ w: 'landlord', ex: 'No meaning, so it is left out.' },
			] },
			{ label: '签合同', words: [
				{ w: 'enrol', alt: ['enroll', 'ENROL'], zh: '注册', ex: 'You can enroll online until Friday.' },
				{ w: 'lease', zh: '租约', ex: 'We signed the lease yesterday.' },
			] },
		] },
		{ id: '5.3', topic: '示例：没有词的站', groups: [] },
	],
};
const vocab = toVocabContent(EXAMPLE);

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

	test('every example in a list has its word in it, as written, with an ending or in another spelling', () => {
		const missing = vocab.stops.flatMap(s => s.words).filter(w => exParts(w).word === '').map(w => w.w);
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
	test('read as stops: malformed stops and words left out, a word once per stop, a colour per group', () => {
		expect(vocab.stops.map(s => s.id)).toEqual(['5.1', '5.2']);
		const stop = findStop(vocab, '5.2')!;
		expect(stop.words.map(w => w.w)).toEqual(['flat', 'deposit', 'enrol', 'lease']);
		expect(stop.groups.map(g => g.color)).toEqual([GROUP_COLORS[0], GROUP_COLORS[1]]);
		expect(stop.words[2]).toMatchObject({ alt: ['enroll'], stop: '5.2', group: 1, key: '5.2:enrol' });
		expect(vocab.gate).toEqual(EXAMPLE.gate);
		// nothing read yet (or nothing usable): no stops, the line's own defaults
		expect(toVocabContent(null)).toEqual({ line: 5, color: '#6E4F8F', gate: { total: 10, spell: 6, choose: 4, pass: 8, plays: 3 }, stops: [] });
	});

	test('a stop is found by its id, and its gate is on the IELTS map', () => {
		expect(findStop(vocab, '5.2')?.topic).toBe('示例：住宿');
		expect(findStop(vocab, '9.9')).toBeNull();
		expect(gatePath('5.2')).toBe('/gate/ielts/5.2');
	});

	test('used in: each stop by its line and band from the route lines, by its id alone before they are read', () => {
		const lines = [{ zh: '听力', en: 'Listening', stations: [{ id: '1.1', band: 4 }] }];
		const stop = findStop(vocab, '5.1')!;
		expect(usedIn(stop, lines)).toEqual([{ id: '1.1', line: { zh: '听力', en: 'Listening' }, band: 4 }, { id: '9.9', line: null, band: null }]);
		expect(usedIn(stop, [])).toEqual([{ id: '1.1', line: null, band: null }, { id: '9.9', line: null, band: null }]);
	});

	test('practising the missed words falls back to every word when there are none', () => {
		const stop = findStop(vocab, '5.2')!;
		expect(scopeWords(stop, 'missed', new Set()).scope).toBe('all');
		const first = stop.words[0].w;
		expect(scopeWords(stop, 'missed', new Set([first])).words.map(w => w.w)).toEqual([first]);
		expect(scopeWords(stop, 'g1', new Set()).words).toEqual(stop.groups[1].words);
	});
});
