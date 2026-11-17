/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { alsoAccepted, checkAnswer, closest, diffChars, liveState, markText, nearMiss, normalizeAnswer, overLimit, revealed, slipOf } from '@/lojo/dictation/mark.js';
import type { Markable } from '@/lojo/dictation/mark.js';
import { drawRound, emptyProgress, isOften, oftenIds, recordAnswer, spread, toProgress } from '@/lojo/dictation/logic.js';
import { carryFromResult, carryPath, gapLine, looksSpaceless, spokenForm } from '@/lojo/dictation/carry.js';
import { gateItems, toContent } from '@/lojo/dictation/content.js';
import type { GateAttempt, GateGroup, GateResult } from '@/lojo/gates/player.js';

// A seeded random, so a round is the same every run.
function seeded(seed: number) {
	let s = seed;
	return () => {
		s = (s * 1103515245 + 12345) % 2147483648;
		return s / 2147483648;
	};
}

describe('marking is the gates\' marking (backend test/unit/LojoGates.ts)', () => {
	// The same cases as the server's tests; if one of these changes, change lojo-gates.ts and its test too.
	test('case, spaces, a final full stop and full-width input do not matter', () => {
		expect(normalizeAnswer('  HOLLINS. ')).toBe('hollins');
		expect(normalizeAnswer('ｗｅｂｓｉｔｅ')).toBe('website');
		expect(normalizeAnswer('6：30')).toBe('6:30');
		expect(normalizeAnswer('0161 5550 199', true)).toBe('01615550199');
	});

	test('a word limit counts words and numbers the IELTS way', () => {
		const limit = { words: 1, number: true };
		expect(overLimit('website', limit)).toBe(false);
		expect(overLimit('6.30 pm', limit)).toBe(false);
		expect(overLimit('Thursday 6.30', limit)).toBe(false);
		expect(overLimit('the website', limit)).toBe(true);
		expect(overLimit('half past six', limit)).toBe(true);
		expect(overLimit('part-time', { words: 1, number: false })).toBe(false);
	});

	test('marks a gap and says why it is wrong, as the gate paper\'s form items', () => {
		const groupLimit = { words: 1, number: true };
		const item = (answer: string[], ignoreSpaces = false): Markable => ({ answer, ignoreSpaces, limit: null });
		const name = item(['Hollins']);
		const phone = item(['01615550199'], true);
		const price = item(['45']);
		expect(markText(name, groupLimit, 'hollins')).toEqual({ correct: true, reason: null });
		expect(markText(phone, groupLimit, '01615 550 199')).toEqual({ correct: true, reason: null });
		expect(markText(price, groupLimit, '£45')).toEqual({ correct: true, reason: null });
		expect(markText(name, groupLimit, 'the Hollins').reason).toBe('word-limit');
		expect(markText(phone, groupLimit, '').reason).toBe('blank');
		expect(markText(price, groupLimit, '54').reason).toBe('wrong');
		// an item's own limit wins over its group's
		expect(markText({ ...name, limit: { words: 2, number: false } }, groupLimit, 'Mrs Hollins').reason).toBe('wrong');
	});

	test('British and American spellings both count when both are listed', () => {
		const colour: Markable = { answer: ['colour', 'color'], ignoreSpaces: false, limit: null };
		expect(markText(colour, null, 'Color').correct).toBe(true);
		expect(markText(colour, null, 'colur').correct).toBe(false);
	});
});

describe('a word typed letter by letter', () => {
	test('each letter is right while it fits an accepted spelling', () => {
		expect(liveState(['colour', 'color'], 'colo').bad).toBe(false);
		expect(liveState(['colour', 'color'], 'color').complete).toBe(true);
		expect(liveState(['colour', 'color'], 'colour').complete).toBe(true);
		const wrong = liveState(['Wednesday'], 'Wen');
		expect(wrong.marks).toEqual(['ok', 'ok', 'bad']);
		expect(wrong.firstBad).toBe(2);
		// leading and trailing spaces don't count
		expect(liveState(['receipt'], ' receipt ').complete).toBe(true);
		// nor a curly apostrophe (a Chinese input method types ’), as in normalizeAnswer
		expect(liveState(['o\'clock'], 'o’clock')).toMatchObject({ bad: false, complete: true });
	});

	test('a typo put right before checking is not wrong, only noted (decided 2026-10-29)', () => {
		const word: Markable = { answer: ['Wednesday'], ignoreSpaces: false, limit: null };
		const first = liveState(word.answer, 'Wen');
		const slip = slipOf(word.answer, 'Wen', first.firstBad);
		expect(slip).toEqual({ pos: 2, got: 'n', want: ['d'] });
		expect(liveState(word.answer, 'Wednesday').complete).toBe(true);
		const verdict = checkAnswer(word, null, 'Wednesday', slip);
		expect(verdict).toMatchObject({ correct: true, reason: null, fixed: slip });
		// left wrong, it is wrong, and the slip isn't a note any more
		expect(checkAnswer(word, null, 'Wensday', slip)).toMatchObject({ correct: false, reason: 'wrong', fixed: null });
		expect(revealed('Wed')).toMatchObject({ correct: false, reason: 'revealed' });
		// a progress record counts the put-right word as right
		const p = emptyProgress();
		recordAnswer(p, 'sp-wednesday', verdict.correct);
		expect(p.items['sp-wednesday']).toMatchObject({ r: 1, w: 0, s: 1 });
	});

	test('a wrong answer is compared with the closest accepted form', () => {
		expect(closest(['15 March', 'March 15', '15th March'], 'March 15th', false)).toBe('March 15');
		const d = diffChars('reciept', 'receipt', false);
		expect(d.ops.filter(op => op.t !== 'same').length).toBeGreaterThan(0);
		expect(d.common).toBe(6);
		// phones: spaces are not compared
		expect(diffChars('07700900461', '07700 900461', true).ops.filter(op => op.t === 'extra' || op.t === 'miss')).toEqual([]);
	});

	test('other accepted forms are listed once each', () => {
		expect(alsoAccepted(['9.30', '9:30', '9.30 am', '9.30am', '9.30 a.m.'], '9.30', 5)).toEqual(['9:30', '9.30 am']);
		expect(nearMiss(['photo'], 'Photo')).toBe(true);
		expect(nearMiss(['photo'], 'photos')).toBe(false);
	});
});

describe('常错: in after 2 misses, out after 2 rights in a row (decided 2026-10-29)', () => {
	test('two misses put a word in, even apart', () => {
		const p = emptyProgress();
		recordAnswer(p, 'a', false);
		expect(isOften(p, 'a')).toBe(false);
		recordAnswer(p, 'a', true);
		recordAnswer(p, 'a', false);
		expect(isOften(p, 'a')).toBe(true);
	});

	test('two rights in a row take it out; a miss in between starts the count again', () => {
		const p = emptyProgress();
		recordAnswer(p, 'a', false);
		recordAnswer(p, 'a', false);
		recordAnswer(p, 'a', true);
		recordAnswer(p, 'a', false);
		recordAnswer(p, 'a', true);
		expect(isOften(p, 'a')).toBe(true);
		recordAnswer(p, 'a', true);
		expect(isOften(p, 'a')).toBe(false);
		// out again, it takes two new misses to come back
		recordAnswer(p, 'a', false);
		expect(isOften(p, 'a')).toBe(false);
		recordAnswer(p, 'a', false);
		expect(isOften(p, 'a')).toBe(true);
		expect(p.items.a).toMatchObject({ r: 3, w: 5 });
	});

	test('the most missed come first; the registry value is read back safely', () => {
		const p = emptyProgress();
		for (const [id, misses] of [['x', 2], ['y', 4], ['z', 1]] as const) for (let i = 0; i < misses; i++) recordAnswer(p, id, false);
		expect(oftenIds(p, ['x', 'y', 'z'])).toEqual(['y', 'x']);
		const back = toProgress(JSON.parse(JSON.stringify(p)));
		expect(back).toEqual(p);
		expect(toProgress({ items: { bad: { r: 'one' } }, last: { spelling: ['a', 3] } })).toEqual({ ...emptyProgress(), last: { spelling: ['a'] } });
		expect(toProgress(null)).toEqual(emptyProgress());
	});
});

describe('a round is 10 drawn from a set\'s pool', () => {
	const pool = Array.from({ length: 24 }, (_, i) => ({ id: `q${i}`, kind: ['phone', 'date', 'time', 'name'][i % 4] }));

	test('10 different items of the pool, every kind in it', () => {
		const round = drawRound(pool, () => 0, [], 10, seeded(1));
		expect(round).toHaveLength(10);
		expect(new Set(round.map(it => it.id)).size).toBe(10);
		expect(round.every(it => pool.includes(it))).toBe(true);
		expect(new Set(round.map(it => it.kind)).size).toBe(4);
	});

	test('not the last round again, and the least practised first', () => {
		const first = drawRound(pool, () => 0, [], 10, seeded(2)).map(it => it.id);
		const second = drawRound(pool, () => 0, first, 10, seeded(3)).map(it => it.id);
		expect(second.filter(id => first.includes(id))).toEqual([]);
		const seen = (id: string) => (Number(id.slice(1)) < 12 ? 3 : 0);
		expect(drawRound(pool, seen, [], 10, seeded(4)).every(it => seen(it.id) === 0)).toBe(true);
	});

	test('a small pool gives all it has; the same kind is not twice in a row where it can be helped', () => {
		expect(drawRound(pool.slice(0, 6), () => 0, [], 10, seeded(5))).toHaveLength(6);
		const list = spread([{ kind: 'a' }, { kind: 'a' }, { kind: 'b' }, { kind: 'a' }, { kind: 'b' }]);
		expect(list.some((it, i) => i > 0 && it.kind === list[i - 1].kind)).toBe(false);
	});
});

// 听写题在社区数据库里（2026-11-17 起，kind dictation-ielts）：这里只用示例题，查读题的规则。题目文件本身
// （每组够不够 20 题、每个写法按判分算对、录音能读）由导入脚本 apps/community/scripts/content-import.mjs 查。
const EXAMPLE = {
	perRound: 10,
	guide: 'example-guide',
	sets: [
		{
			id: 'spelling', tag: 'spelling', zh: '示例拼写', en: 'Example spelling', mode: 'live', limit: null, instructions: null,
			items: [
				{ id: 'ex-colour', answer: ['colour', 'color'], hint: '颜色', line: 'What {} is it?', lineZh: '示例：它是什么颜色的？', say: 'What colour is it? Colour.', rule: '示例规则' },
				{ id: 'ex-broken', hint: '没有答案，读的时候跳过', line: 'A {}.', say: 'A gap.' },
			],
		},
		{
			id: 'numbers', tag: 'numbers', zh: '示例数字', en: 'Example numbers', mode: 'enter', limit: { words: 1, number: true },
			instructions: { zh: '示例', en: 'ONE WORD AND/OR A NUMBER' },
			items: [
				{ id: 'ex-date', kind: 'date', answer: ['15 March', 'March 15', '15th March', 'March 15th', '15/03', '15/3'], hint: '日期', line: 'Starts: {}', say: 'It starts on the fifteenth of March.', rule: '示例' },
				{ id: 'ex-phone', kind: 'phone', answer: ['07700 900461'], ignoreSpaces: true, hint: '手机号', line: 'Mobile: {}', say: 'Oh seven seven double oh, nine double oh, four six one.', rule: '示例' },
				{ id: 'ex-postcode', kind: 'postcode', answer: ['CB2 1TN'], ignoreSpaces: true, hint: '邮编', line: 'Postcode: {}', say: 'C, B, two, one, T, N.', rule: '示例' },
			],
		},
		{
			id: 'plural', tag: 'plural', zh: '示例单复数', en: 'Example plural', mode: 'enter', limit: { words: 1, number: false }, instructions: null,
			items: [
				{ id: 'ex-boxes', number: 'pl', answer: ['boxes'], near: ['box'], hint: '箱子', line: 'Bring two {}.', say: 'Bring two boxes.', rule: '示例' },
			],
		},
		{ id: 'nameless', mode: 'enter', items: [{ id: 'ex-x', answer: ['x'], line: '{}', say: 'x' }] },
	],
};

describe('reading the dictation sets (toContent, example sets)', () => {
	const content = toContent(EXAMPLE);

	test('sets in order; a set without a name and an item without an answer are left out', () => {
		expect(content.sets.map(s => s.id)).toEqual(['spelling', 'numbers', 'plural']);
		expect(content.sets[0].items.map(it => it.id)).toEqual(['ex-colour']);
		expect(content.perRound).toBe(10);
		expect(content.guide).toBe('example-guide');
		expect(toContent(null).sets).toEqual([]);
	});

	test('a spelling word carries what the wordbook needs; British and American spellings both count', () => {
		const colour = content.sets[0].items[0];
		expect(colour.mode).toBe('live');
		expect(colour.word).toMatchObject({ text: 'colour', kind: 'word', example: 'What colour is it?', exampleZh: '示例：它是什么颜色的？' });
		expect(markText(colour, null, 'color').correct).toBe(true);
	});

	test('dates take the usual forms under the set\'s word limit; phones and postcodes ignore spaces', () => {
		const [date, phone, postcode] = content.sets[1].items;
		for (const form of ['15 March', 'March 15', '15th March', 'March 15th', '15/03', '15/3', 'march 15th.']) {
			expect(markText(date, null, form).correct, form).toBe(true);
		}
		expect(markText(date, null, 'the fifteenth of March').reason).toBe('word-limit');
		expect(markText(phone, null, '07700900461').correct).toBe(true);
		expect(phone.inputmode).toBe('tel');
		expect(markText(postcode, null, 'cb21tn').correct).toBe(true);
	});

	test('a plural keeps its number; its near form (the singular) is marked wrong and caught as a near miss', () => {
		const boxes = content.sets[2].items[0];
		expect(boxes).toMatchObject({ number: 'pl', kind: 'pl', near: ['box'], inputmode: 'text', word: null });
		expect(markText(boxes, null, 'box')).toEqual({ correct: false, reason: 'wrong' });
		expect(nearMiss(boxes.near, 'Box')).toBe(true);
		expect(markText(boxes, null, 'two boxes').reason).toBe('word-limit');
	});
});

describe('the gaps a gate missed go along to dictation', () => {
	const instructions = { en: 'Complete the form.', zh: '补全表格。' };
	const group = (g: Partial<GateGroup> & Pick<GateGroup, 'type' | 'items'>): GateGroup => ({
		skill: 'listening', instructions, title: null, lines: [], limit: null, image: null, letters: [], options: [], ...g,
	});
	const asked = (n: number) => ({ n: [n], q: null, options: [], choose: 1, limit: null });
	const attempt = {
		attemptId: 'att1', course: 'ielts', station: '1.2', set: 'A', band: 4.5, part: 1, pass: 4, total: 5, startedAt: '', stage: null,
		time: null, passage: null, audio: null,
		groups: [
			group({ type: 'form', limit: { words: 1, number: true }, lines: ['Surname: (1) ______', 'Phone: (2) ______', 'Day | Class | Time', 'Monday | Yoga | (3) ______'], items: [asked(1), asked(2), asked(3)] }),
			group({ type: 'choice', items: [asked(4)] }),
		],
	} as unknown as GateAttempt;
	const resultItem = (n: number, correct: boolean, expected: string, given: string, tags: string[]) => ({ n, correct, given, expected, accepted: [expected], reason: correct ? null : 'wrong' as const, tags });
	const result = {
		attemptId: 'att1', course: 'ielts', station: '1.2', set: 'A', band: 4.5,
		items: [
			resultItem(1, false, 'Hollins', 'Holins', ['spelling']),
			resultItem(2, false, '01615550199', '0161555019', ['numbers']),
			resultItem(3, true, '6.30', '6.30', ['numbers']),
			resultItem(4, false, 'B', 'A', ['choice']),
		],
		script: [
			{ who: 'N', text: "It's Hollins, H, O, double L, I, N, S.", pause: null, answers: [1] },
			{ who: null, text: null, pause: 5, answers: [] },
		],
	} as unknown as GateResult;

	test('only the wrong form gaps with a dictation tag, with their line and what the recording said', () => {
		const carry = carryFromResult([{ result, attempt }], '听力 4.5', '1.2')!;
		expect(carry).toMatchObject({ attemptId: 'att1', course: 'ielts', station: '1.2', where: '听力 4.5', runs: 0 });
		expect(carry.gaps.map(g => g.id)).toEqual(['0-1', '0-2']);
		expect(carry.gaps[0]).toMatchObject({ answer: ['Hollins'], given: 'Holins', line: 'Surname: {}', ignoreSpaces: false, limit: { words: 1, number: true } });
		expect(carry.gaps[0].say).toContain('double L');
		// no line of the recording names it: the answer is read the way a recording would
		expect(carry.gaps[1]).toMatchObject({ ignoreSpaces: true, say: 'oh one six one five five five oh one nine nine.' });
		expect(carryFromResult([{ result: { ...result, items: [result.items[2]] }, attempt }], '听力 4.5', '1.2')).toBeNull();
		expect(carryPath('att1', 'spelling')).toBe('/apps/dictation/?gate=att1&tag=spelling');
	});

	test('as items: a word letter by letter, a number on Enter, marked as the gate marked it', () => {
		const carry = carryFromResult([{ result, attempt }], '听力 4.5', '1.2')!;
		const content = toContent(EXAMPLE);
		const [word, phone] = gateItems(carry, null, content.sets);
		expect(word).toMatchObject({ mode: 'live', setId: 'spelling', gate: { given: 'Holins' } });
		expect(phone).toMatchObject({ mode: 'enter', setId: 'numbers' });
		expect(markText(phone, null, '01615 550 199').correct).toBe(true);
		expect(gateItems(carry, 'spelling', content.sets)).toHaveLength(1);
	});

	test('a gap\'s line on the paper; phones and postcodes by shape', () => {
		expect(gapLine(['Monday | Yoga | (3) ______'], 3)).toBe('Monday · Yoga · {}');
		expect(gapLine(['From (5) ______ to (6) ______'], 6)).toBe('From ___ to {}');
		expect(gapLine(['Name: (1) ______'], 2)).toBeNull();
		expect(looksSpaceless('0161 555 0199')).toBe(true);
		expect(looksSpaceless('CB2 1TN')).toBe(true);
		expect(looksSpaceless('15 March')).toBe(false);
		expect(spokenForm('CB2 1TN')).toBe('C, B, two, one, T, N.');
		expect(spokenForm('Wednesday')).toBe('Wednesday.');
	});
});
