/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	answerDone,
	bare,
	blankParts,
	buildGiven,
	clauseAt,
	decodeBuild,
	decodeFix,
	decodeParse,
	encodeBuild,
	encodeFix,
	encodeParse,
	fixDiff,
	fixGiven,
	isNewType,
	keyMarks,
	markedWords,
	noMarks,
	pickFixWord,
	placeChip,
	sentence,
	splitWhy,
	takeBackChip,
	tapParse,
	tokens,
} from '@/lojo/gates/answers.js';
import type { ParseMarks, ParseMode } from '@/lojo/gates/answers.js';
import { answersPayload, blankCount, plainKind, plainLine, practicePath, stopPage, unansweredCount } from '@/lojo/gates/player.js';
import type { GateAttempt, GateGroup, GateItem, GateResult } from '@/lojo/gates/player.js';
import { findVocabWord, missedVocab, vocabWordbookItem } from '@/lojo/gates/vocab.js';
import type { VocabPack } from '@/lojo/gates/vocab.js';
import { VOCAB } from '@/lojo/route/courses/ielts/vocab.js';

// Papers as the server sends them; cast, so fields added to the generated types later don't break the fixtures.
const item = (n: number, more: Partial<GateItem> = {}) => ({ n: [n], q: null, options: [], choose: 1, limit: null, ...more }) as GateItem;
const group = (type: GateGroup['type'], skill: GateGroup['skill'], items: GateItem[]) => ({
	type, skill, instructions: { en: '', zh: '' }, title: null, lines: [], limit: null, image: null, letters: [], options: [], items,
}) as unknown as GateGroup;
const mark = (n: number, correct: boolean, more: Partial<GateResult['items'][number]> = {}) => ({
	n, correct, given: '', expected: '', accepted: [], reason: correct ? null : 'wrong', tags: [], ...more,
});

// Sentences made up for these tests: the real sets hold their answers and are kept out of the public source.
const FIX = 'Last week, the shop has closed two old branches in the city.';
const FIXED = 'Last week, the shop closed two old branches in the city.';
const PARSE = 'Since the new park opened, noise in the old street has dropped by half.';

describe('Vibes gate answers (vocabulary and grammar)', () => {
	test('splits a sentence the server\'s way, and strips a word\'s punctuation', () => {
		expect(tokens('  Since the new park opened,  noise ')).toEqual(['Since', 'the', 'new', 'park', 'opened,', 'noise']);
		expect(tokens(null)).toEqual([]);
		expect(tokens(PARSE)[4]).toBe('opened,');
		expect(bare('cities,')).toBe('cities');
		expect(bare('didn\'t')).toBe('didn\'t');
		expect(bare('(2015)')).toBe('(2015)');
		expect(bare('“Hello,”')).toBe('Hello');
		expect(isNewType('parse')).toBe(true);
		expect(isNewType('choice')).toBe(false);
	});

	test('build: the chips tapped, in order, as "4,1,3,0,2"', () => {
		const chips = ['in this flat', 'have stayed', 'I', 'for two months', 'stayed', 'since'];
		expect(encodeBuild([4, 1, 3, 0, 2])).toBe('4,1,3,0,2');
		expect(encodeBuild([])).toBe('');
		expect(decodeBuild('4,1,3,0,2', 5)).toEqual([4, 1, 3, 0, 2]);
		// out of range, repeated or not a number: left out
		expect(decodeBuild('4,4,9,x,,1', 5)).toEqual([4, 1]);
		expect(decodeBuild(undefined, 5)).toEqual([]);
		expect(placeChip([2], 0)).toEqual([2, 0]);
		expect(placeChip([2, 0], 2)).toEqual([2, 0]);
		expect(takeBackChip([2, 1, 0], 1)).toEqual([2, 0]);
		expect(sentence(chips, [2, 1, 0, 3])).toBe('I have stayed in this flat for two months.');
		expect(sentence(chips, [3, 2, 1, 0])).toBe('For two months I have stayed in this flat.');
		expect(sentence(chips, [])).toBe('');
		// the server sends the sentence; chip numbers are read too
		expect(buildGiven('2,1,0,3', chips)).toBe('I have stayed in this flat for two months.');
		expect(buildGiven('I stayed since in this flat.', chips)).toBe('I stayed since in this flat.');
	});

	test('fix: the wrong word\'s place, then its change, as "3|is"', () => {
		expect(encodeFix({ at: 5, fix: 'is' })).toBe('5|is');
		expect(encodeFix({ at: 4, fix: '删掉这个词' })).toBe('4|删掉这个词');
		expect(encodeFix({ at: 3, fix: '' })).toBe('3|');
		expect(encodeFix({ at: null, fix: 'is' })).toBe('');
		expect(decodeFix('5|is')).toEqual({ at: 5, fix: 'is' });
		expect(decodeFix('3|')).toEqual({ at: 3, fix: '' });
		expect(decodeFix('2|a|b')).toEqual({ at: 2, fix: 'a|b' });
		expect(decodeFix('x|is')).toEqual({ at: null, fix: '' });
		expect(decodeFix('')).toEqual({ at: null, fix: '' });
		// another word starts its change over; the same word keeps it
		expect(pickFixWord({ at: 3, fix: 'is' }, 3)).toEqual({ at: 3, fix: 'is' });
		expect(pickFixWord({ at: 3, fix: 'is' }, 5)).toEqual({ at: 5, fix: '' });
	});

	test('fix review: the word picked, and where the corrected sentence differs', () => {
		expect(fixGiven(FIX, '4|删掉这个词')).toEqual({ word: 'has', fix: '删掉这个词' });
		expect(fixGiven(FIX, '1| that ')).toEqual({ word: 'week', fix: 'that' });
		expect(fixGiven(FIX, '99|is')).toBeNull();
		expect(fixGiven(FIX, 'Picked has')).toBeNull();
		// a word taken out: an empty fix range
		expect(fixDiff(FIX, FIXED)).toEqual({ wrong: [4, 5], fixed: [4, 4] });
		expect(fixDiff('She didn\'t took the bus because it was late.', 'She didn\'t take the bus because it was late.')).toEqual({ wrong: [2, 3], fixed: [2, 3] });
	});

	test('parse: the marks as {"s":[3,4],"v":[9],"c":[[3,8]]}', () => {
		expect(encodeParse({ s: [4, 3], v: [9], c: [[3, 8]] })).toBe('{"s":[3,4],"v":[9],"c":[[3,8]]}');
		expect(encodeParse({ s: [5], v: [11, 10], c: [] })).toBe('{"s":[5],"v":[10,11],"c":[]}');
		expect(encodeParse(noMarks())).toBe('');
		expect(decodeParse('{"s":[3,4],"v":[9],"c":[[3,8]]}')).toEqual({ s: [3, 4], v: [9], c: [[3, 8]] });
		// anything else is read as nothing marked, or loses what isn't a word's place
		expect(decodeParse('nonsense')).toEqual(noMarks());
		expect(decodeParse('[1,2]')).toEqual(noMarks());
		expect(decodeParse('null')).toEqual(noMarks());
		expect(decodeParse('{"s":[-1,2.5,"3",2],"c":[[5,2],[1,2,3],[0,1]]}')).toEqual({ s: [2], v: [], c: [[0, 1]] });
		expect(keyMarks({ s: [5], v: [10, 11], c: [[0, 4]] })).toEqual({ s: [5], v: [10, 11], c: [[0, 4]] });
		expect(keyMarks(null)).toBeNull();
	});

	test('parse: tapping words in 主语, 谓语 and 从句 mode', () => {
		let marks = noMarks(), pending: number | null = null;
		const tap = (mode: ParseMode, i: number) => {
			({ marks, pending } = tapParse(marks, mode, i, pending));
		};
		tap('s', 5);
		expect(marks.s).toEqual([5]);
		tap('s', 5);
		expect(marks.s).toEqual([]);
		// a word is never both the subject and the verb
		tap('s', 10);
		tap('v', 10);
		expect(marks).toEqual({ s: [], v: [10], c: [] });
		tap('v', 11);
		tap('s', 5);
		// a clause: its last word first works too
		tap('c', 4);
		expect(pending).toBe(4);
		tap('c', 0);
		expect(pending).toBeNull();
		expect(marks.c).toEqual([[0, 4]]);
		expect(clauseAt(marks, 2)).toEqual([0, 4]);
		expect(clauseAt(marks, 5)).toBeNull();
		expect(encodeParse(marks)).toBe('{"s":[5],"v":[10,11],"c":[[0,4]]}');
		expect(markedWords(tokens(PARSE), marks)).toEqual({ s: 'noise', v: 'has dropped', c: ['Since the new park opened'] });
		// a tap inside a clause, with none started, takes it away
		tap('c', 2);
		expect(marks.c).toEqual([]);
		// a new clause replaces the ones it overlaps
		const two: ParseMarks = { s: [], v: [], c: [[0, 2], [6, 7]] };
		const started = tapParse(two, 'c', 4, null);
		expect(started.pending).toBe(4);
		expect(tapParse(started.marks, 'c', 1, started.pending).marks.c).toEqual([[1, 4], [6, 7]]);
	});

	test('what counts as answered before handing in', () => {
		expect(answerDone('spell', '')).toBe(false);
		expect(answerDone('spell', ' enrol ')).toBe(true);
		expect(answerDone('translate', 'There is a supermarket.')).toBe(true);
		expect(answerDone('build', '')).toBe(false);
		expect(answerDone('build', '0')).toBe(true);
		expect(answerDone('fix', '3|')).toBe(false);
		expect(answerDone('fix', '3| ')).toBe(false);
		expect(answerDone('fix', '3|is')).toBe(true);
		expect(answerDone('parse', '{"s":[1],"v":[],"c":[]}')).toBe(false);
		expect(answerDone('parse', '{"s":[1],"v":[2],"c":[]}')).toBe(true);
		expect(answerDone('parse', '{"s":[1],"v":[2],"c":[]}', { clauses: true })).toBe(false);
		expect(answerDone('parse', '{"s":[1],"v":[2],"c":[[3,5]]}', { clauses: true })).toBe(true);
	});

	test('one string per question goes to the server; half-done ones count as not done', () => {
		const groups = [
			group('build', 'grammar', [item(1, { q: '中文', options: ['a', 'b', 'c'], extra: true })]),
			group('fix', 'grammar', [item(2, { q: FIX, mode: 'type' }), item(3, { q: FIX, mode: 'type' })]),
			group('parse', 'grammar', [item(4, { q: PARSE, clauses: false })]),
			group('translate', 'grammar', [item(5, { q: '中文', focus: '现在完成时' })]),
			group('choice', 'grammar', [item(6, { q: 'We ___ two reports.', options: ['write', 'have written'] })]),
		];
		const answers = { 1: '2,0', 2: '4|', 3: '4|is', 4: '{"s":[5],"v":[],"c":[]}', 5: '  My sister and I have shared a room for five years. ', 6: '' };
		expect(answersPayload(groups, answers)).toEqual([
			{ n: 1, value: '2,0' }, { n: 2, value: '4|' }, { n: 3, value: '4|is' }, { n: 4, value: '{"s":[5],"v":[],"c":[]}' },
			{ n: 5, value: 'My sister and I have shared a room for five years.' }, { n: 6, value: '' },
		]);
		// 6 is blank, 2 has no change yet, 4 no verb
		expect(unansweredCount(groups, answers)).toBe(3);
		// listening and reading: the blanks, as before
		const listening = [group('form', 'listening', [item(1), item(2)]), group('choice', 'reading', [item(3)])];
		const said = { 1: 'Hollins', 3: '' };
		expect(unansweredCount(listening, said)).toBe(blankCount(answersPayload(listening, said)));
	});

	test('a vocabulary or grammar paper, its stop\'s page, and PRACTICE paths for this stop', () => {
		expect(plainKind([{ skill: 'vocab' }, { skill: 'vocab' }])).toBe('vocab');
		expect(plainKind([{ skill: 'grammar' }])).toBe('grammar');
		expect(plainKind([{ skill: 'listening' }, { skill: 'reading' }])).toBeNull();
		expect(plainKind([{ skill: 'vocab' }, { skill: 'grammar' }])).toBeNull();
		expect(plainKind([])).toBeNull();
		expect(plainLine('vocab')).toBe('vocab');
		expect(plainLine('listening')).toBeNull();
		expect(plainLine(undefined)).toBeNull();
		expect(stopPage('vocab', '5.2')).toBe('/apps/vocab/5.2');
		expect(stopPage('grammar', '6.2')).toBe('/grammar/6.2');
		expect(stopPage(null, '1.1')).toBeNull();
		expect(practicePath('/apps/vocab/{station}', '5.2')).toBe('/apps/vocab/5.2');
		expect(practicePath('/grammar/6.2?section=s3', '6.2')).toBe('/grammar/6.2?section=s3');
		expect(practicePath('/dictation', '1.1')).toBe('/dictation');
	});

	test('a grammar choice\'s gap, and a vocabulary question\'s why', () => {
		expect(blankParts('So far this month, they ___ four reports.')).toEqual(['So far this month, they ', ' four reports.']);
		expect(blankParts('a ____ b')).toEqual(['a ', ' b']);
		expect(blankParts('Why is the centre closed?')).toBeNull();
		expect(blankParts(null)).toBeNull();
		expect(splitWhy('enrol：注册；报名（课程）')).toEqual({ word: 'enrol', meaning: '注册；报名（课程）' });
		expect(splitWhy('estate agent: 房产中介')).toEqual({ word: 'estate agent', meaning: '房产中介' });
		expect(splitWhy('没有冒号的一句话')).toBeNull();
		expect(splitWhy(null)).toBeNull();
	});
});

describe('Vibes gate results (vocabulary)', () => {
	const pack: VocabPack = { stops: [
		{ id: '5.1', groups: [{ label: '地址', words: [{ w: 'postcode', ipa: '/ˈpəʊstkəʊd/', pos: 'n.', zh: '邮政编码', ex: 'Don\'t forget the postcode.' }] }] },
		{ id: '5.2', groups: [{ label: '找房子', words: [
			{ w: 'enrol', alt: ['enroll'], ipa: '/ɪnˈrəʊl/', pos: 'v.', zh: '注册；报名（课程）', ex: 'I want to enrol on a cooking course.' },
			{ w: 'estate agent', ipa: '/ɪˈsteɪt ˌeɪdʒənt/', pos: 'n.', zh: '房产中介', ex: 'The estate agent showed us the flat.' },
		] }] },
	] };
	const attempt = { groups: [
		group('spell', 'vocab', [item(1), item(2)]),
		group('choice', 'vocab', [item(3, { q: 'estate agent', options: ['房产中介', '邮政编码'] }), item(4, { q: 'postcode', options: ['房产中介', '邮政编码'] })]),
	] } as unknown as GateAttempt;

	test('finds a word by its spelling or another that counts, this stop first', () => {
		expect(findVocabWord(pack, '5.2', 'Enroll')?.w).toBe('enrol');
		expect(findVocabWord(pack, '5.2', ' estate  agent ')?.w).toBe('estate agent');
		expect(findVocabWord(pack, '5.2', 'postcode')?.w).toBe('postcode');
		expect(findVocabWord(pack, '5.2', 'nowhere')).toBeNull();
		expect(findVocabWord(null, '5.2', 'enrol')).toBeNull();
	});

	test('lists the words missed, once each: the word to spell, or the word asked', () => {
		const result = { items: [
			mark(1, false, { given: 'enroal', expected: 'enrol', accepted: ['enrol', 'enroll'], why: 'enrol：注册；报名（课程）' }),
			mark(2, true, { given: 'flat', expected: 'flat', why: 'flat：公寓（英式说法）' }),
			mark(3, false, { given: 'B', expected: 'A', q: 'estate agent', why: 'estate agent：房产中介' }),
			mark(4, false, { given: '', expected: 'B', reason: 'blank', why: 'postcode：邮政编码' }),
		] } as unknown as GateResult;
		expect(missedVocab(result, attempt)).toEqual([
			{ text: 'enrol', why: 'enrol：注册；报名（课程）' },
			{ text: 'estate agent', why: 'estate agent：房产中介' },
			// no q on the result: the paper's
			{ text: 'postcode', why: 'postcode：邮政编码' },
		]);
		// a grammar paper has no words to save
		const grammar = { groups: [group('choice', 'grammar', [item(1, { q: 'We ___ it.' })])] } as unknown as GateAttempt;
		expect(missedVocab({ items: [mark(1, false, { expected: 'B' })] } as unknown as GateResult, grammar)).toEqual([]);
	});

	test('a missed word for the 生词本, with its meaning, phonetics and example', () => {
		const alt = (a: string) => `美式拼法 ${a}`;
		const enrol = { text: 'enrol', why: 'enrol：注册；报名（课程）' };
		expect(vocabWordbookItem(enrol, findVocabWord(pack, '5.2', 'enrol'), alt)).toEqual({
			text: 'enrol', kind: 'word', meaning: '注册；报名（课程）', usage: 'v. /ɪnˈrəʊl/ · 美式拼法 enroll',
			example: 'I want to enrol on a cooking course.', exampleZh: '',
		});
		// without the word lists: the meaning from why
		expect(vocabWordbookItem({ text: 'estate agent', why: 'estate agent：房产中介' }, null, alt)).toEqual({
			text: 'estate agent', kind: 'phrase', meaning: '房产中介', usage: '', example: '', exampleZh: '',
		});
	});

	test('reads the synced word lists (lojo/route/courses/ielts/vocab.js)', () => {
		const lists = VOCAB as unknown as VocabPack;
		expect(lists.stops.length).toBeGreaterThan(0);
		for (const stop of lists.stops) {
			for (const g of stop.groups) {
				for (const w of g.words) {
					expect(typeof w.w === 'string' && typeof w.zh === 'string' && (w.alt == null || w.alt.every(a => typeof a === 'string'))).toBe(true);
					expect(findVocabWord(lists, stop.id, w.w)).toBe(w);
				}
			}
		}
	});
});
