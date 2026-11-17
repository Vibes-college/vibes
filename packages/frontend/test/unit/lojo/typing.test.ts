/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	accuracyOf,
	alignWords,
	charDiff,
	charMarks,
	cleanTyped,
	copyTotals,
	judgeCount,
	judgeMock,
	judgeSpeed,
	mockPlan,
	okChars,
	scoreMock,
	sentencesOf,
	typedToEnd,
	wordAt,
	wordCount,
	wpmOf,
} from '@/lojo/typing/score.js';
import { betterBest, emptyProgress, mergeProgress, nextStopId, passedIds, recordTry, stopState, toProgress } from '@/lojo/typing/record.js';
import type { Best, TryRecord } from '@/lojo/typing/record.js';
import { createClock } from '@/lojo/typing/clock.js';
import { parseSpell, toTypingContent } from '@/lojo/typing/content.js';
import type { Device, MockStop } from '@/lojo/typing/content.js';
import { markText } from '@/lojo/dictation/mark.js';

const GOAL = { wpm: 20, acc: 95 };
const IDS = ['numbers', 'spelling', 'listening', 'sentences', 'mock'];
const best = (pass: boolean, acc: number, wpm: number, score: number | null = null, total: number | null = null): Best => ({ pass, score, total, acc, wpm });
const tried = (stop: string, pass: boolean, b: Best, device: Device = 'desktop', ms = 1000): TryRecord => ({ stop, pass, ms, device, best: b });

// 示例题目. The real line (courses/english/ielts/typing.js) is in the site's database since 2026-11-17 (kind typing-ielts);
// content-import.mjs checks it before it goes in: the ids above still there, the hard letters marked, no apostrophes
// in the sentences, every gap's answer marked right, the mock about 100 words and typed in time.
const MOCK_TEXT = 'Some people think that cities should spend more on parks. Others believe that roads matter more. This essay looks at both views.';
const EXAMPLE = () => ({
	line: { n: 0, zh: '示例线', en: 'Example line', color: '#B4457E' },
	goal: { wpm: 20, acc: 95 },
	stops: [
		{ id: 'numbers', kind: 'copy', zh: '示例数字', en: 'Example numbers', minutes: 2, need: 2, items: [
			{ kind: { zh: '日期', en: 'Date' }, field: 'Date of arrival', target: '14 March' },
			{ kind: { zh: '价格', en: 'Price' }, field: 'Price', prefix: '£', target: '68.50' },
			{ field: 'Postcode', target: 'NW3 7QT' },
		] },
		{ id: 'spelling', kind: 'spell', zh: '示例拼写', en: 'Example spelling', need: 1, items: [
			{ spell: 'a[cc]o[mm]odation', zh: '住处', tip: '示例', sentence: 'The ___ is near the station.' },
			{ spell: 'n[e]cessary', zh: '必要的', sentence: 'It is ___.' },
		] },
		{ id: 'listening', kind: 'listen', zh: '示例听打', en: 'Example listening', need: 2, title: 'Example', rows: [
			{ say: 'It costs forty-two pounds.', note: 'Cost: £___', answer: ['42'] },
			{ say: 'On Tuesday.', note: 'Day: ___', answer: ['Tuesday', 'Tue'] },
		] },
		{ id: 'sentences', kind: 'copy', zh: '示例句子', en: 'Example sentences', items: [{ target: 'This is an example sentence.' }] },
		{ id: 'mock', kind: 'mock', zh: '示例模拟', en: 'Example mock', text: `  ${MOCK_TEXT}\n`, seconds: 360, phone: { sentences: 2, seconds: 270 } },
	] as Record<string, unknown>[],
});

describe('speed, accuracy and word count', () => {
	test('speed: 5 characters make a word, only correct ones count', () => {
		expect(wpmOf(100, 60000)).toBe(20);
		expect(wpmOf(50, 30000)).toBe(20);
		expect(wpmOf(101, 60000)).toBe(20);
		expect(wpmOf(10, 0)).toBe(0);
	});

	test('accuracy is rounded down, so 94.9% is not 95%', () => {
		expect(accuracyOf(19, 20)).toBe(95);
		expect(accuracyOf(57, 60)).toBe(95);
		expect(accuracyOf(189, 199)).toBe(94);
		expect(accuracyOf(0, 0)).toBeNull();
	});

	test('words are what is between spaces, as the test\'s word count shows', () => {
		expect(wordCount('')).toBe(0);
		expect(wordCount('   ')).toBe(0);
		expect(wordCount('  Some  people\nbelieve ')).toBe(3);
	});

	test('copying: each letter right, wrong or not typed yet; capitals count', () => {
		expect(charMarks('NW3 7QT', 'NW3 7q')).toEqual(['ok', 'ok', 'ok', 'ok', 'ok', 'bad', 'todo']);
		expect(okChars('£68.50', '£68,50')).toBe(5);
	});

	test('a copy stop\'s totals: accuracy over what was handed in, speed over its typing time', () => {
		const t = copyTotals([
			{ target: '14 March', typed: '14 March', ms: 3000 },
			{ target: '24/04', typed: '24/05', ms: 2000 },
		]);
		expect(t).toEqual({ ok: 12, chars: 13, ms: 5000, acc: 92, wpm: 29 });
		expect(copyTotals([]).acc).toBeNull();
	});
});

describe('what a Chinese keyboard types', () => {
	test('full-width signs become English ones, said once', () => {
		expect(cleanTyped('１４：３０。')).toEqual({ text: '14:30.', fullWidth: true, cjk: false });
		expect(cleanTyped('a，b')).toEqual({ text: 'a,b', fullWidth: true, cjk: false });
	});

	test('Chinese characters are taken out; curly quotes and dashes straightened', () => {
		expect(cleanTyped('你好hello')).toEqual({ text: 'hello', fullWidth: false, cjk: true });
		expect(cleanTyped('don’t — “ok”').text).toBe('don\'t - "ok"');
	});

	test('one line, unless the box takes paragraphs', () => {
		expect(cleanTyped('a\nb').text).toBe('ab');
		expect(cleanTyped('a\nb', true).text).toBe('a\nb');
	});
});

describe('a wrong word next to the right one', () => {
	test('a letter left out shows as a gap', () => {
		const parts = charDiff('goverment', 'government');
		expect(parts.filter(p => p.t === 'miss')).toEqual([{ t: 'miss', ch: 'n' }]);
		expect(parts.filter(p => p.t === 'wrong')).toEqual([]);
		expect(parts.filter(p => p.t !== 'miss').map(p => p.ch).join('')).toBe('goverment');
	});

	test('a wrong letter is marked in place', () => {
		const parts = charDiff('definately', 'definitely');
		expect(parts.filter(p => p.t !== 'same')).toEqual([{ t: 'wrong', ch: 'a' }]);
	});

	test('capitals can be let off', () => {
		expect(charDiff('Necessary', 'necessary', true).every(p => p.t === 'same')).toBe(true);
		expect(charDiff('Necessary', 'necessary').filter(p => p.t !== 'same')).toHaveLength(1);
	});
});

describe('the mock', () => {
	const TEXT = 'The cat sat on the mat.';

	test('all of it typed right', () => {
		const s = scoreMock(TEXT, 'The cat sat on the mat.', 60000, false);
		expect(s).toMatchObject({ acc: 100, words: 6, total: 6, covered: true, left: 0, spell: [], punct: [], missed: [], extra: [] });
		// "The " + "cat " + "sat " + "on " + "the " + "mat. " = 24 characters in a minute
		expect(s.wpm).toBe(5);
	});

	test('mistakes by kind: misspelt, signs or capitals, left out, added', () => {
		expect(scoreMock(TEXT, 'The cat sit on the mat.', 60000, false)).toMatchObject({ acc: 83, covered: true, spell: [{ typed: 'sit', right: 'sat' }] });
		expect(scoreMock(TEXT, 'the cat sat on the mat', 60000, false)).toMatchObject({ covered: true, spell: [], punct: [{ typed: 'the', right: 'The' }, { typed: 'mat', right: 'mat.' }] });
		expect(scoreMock(TEXT, 'The cat on the mat.', 60000, false)).toMatchObject({ acc: 83, covered: true, missed: ['sat'] });
		expect(scoreMock(TEXT, 'The big cat sat on the mat.', 60000, false)).toMatchObject({ acc: 85, covered: true, extra: ['big'] });
	});

	test('stopped part way: not all of it, but what was typed is compared with as far as it got', () => {
		expect(alignWords(['a', 'b', 'c', 'd'], ['a', 'b'])).toEqual({ ops: [{ op: 'ok', s: 'a', t: 'a' }, { op: 'ok', s: 'b', t: 'b' }], reached: 2 });
		expect(scoreMock(TEXT, 'The cat sat', 1000, false)).toMatchObject({ acc: 100, covered: false, left: 3 });
		// time up in the middle of a word: that word wasn't finished
		expect(scoreMock(TEXT, 'The cat sa', 1000, true)).toMatchObject({ words: 2, acc: 100, covered: false, left: 4 });
		expect(scoreMock(TEXT, '', 0, true)).toMatchObject({ words: 0, covered: false, left: 6, wpm: 0 });
	});

	test('where the learner is, and whether all of it is in', () => {
		expect(wordAt('', 6)).toBe(0);
		expect(wordAt('The ca', 6)).toBe(1);
		expect(wordAt('The cat ', 6)).toBe(2);
		expect(wordAt('a b c d e f g h', 6)).toBe(5);
		expect(typedToEnd(TEXT, 'The dog sat on the mat.')).toBe(true);
		expect(typedToEnd(TEXT, 'The cat sat on the')).toBe(false);
	});

	test('sentences keep their full stops', () => {
		expect(sentencesOf('A b. C d? E f!')).toEqual(['A b.', 'C d?', 'E f!']);
		expect(sentencesOf('No stop')).toEqual(['No stop']);
	});
});

describe('pass rules on a computer and on a phone', () => {
	test('stops 1–3: enough of them right', () => {
		expect(judgeCount(11, 11).pass).toBe(true);
		expect(judgeCount(10, 11)).toEqual({ pass: false, checks: [{ what: 'score', ok: false, value: 10, need: 11 }] });
	});

	test('stop 4: a computer needs 20 words a minute and 95%; a phone only 95%', () => {
		expect(judgeSpeed(95, 20, 'desktop', GOAL).pass).toBe(true);
		expect(judgeSpeed(96, 12, 'desktop', GOAL).pass).toBe(false);
		expect(judgeSpeed(96, 12, 'phone', GOAL)).toEqual({
			pass: true,
			checks: [{ what: 'acc', ok: true, value: 96, need: 95 }, { what: 'wpm', ok: false, value: 12, need: 20, counted: false }],
		});
		expect(judgeSpeed(94, 40, 'phone', GOAL).pass).toBe(false);
		expect(judgeSpeed(94, 40, 'desktop', GOAL).pass).toBe(false);
	});

	test('stop 5: typed to its end in time, 95% accurate', () => {
		const text = 'The cat sat on the mat.';
		expect(judgeMock(scoreMock(text, text, 1000, false), GOAL).pass).toBe(true);
		expect(judgeMock(scoreMock(text, 'The cat sat ', 1000, true), GOAL).checks[0]).toEqual({ what: 'covered', ok: false, left: 3 });
		expect(judgeMock(scoreMock(text, 'The cat sit on the mat.', 1000, false), GOAL).pass).toBe(false);
	});

	test('stop 5 is the whole text on a computer, its first sentences in their own time on a phone', () => {
		const mock = toTypingContent(EXAMPLE()).stops.find((s): s is MockStop => s.kind === 'mock');
		expect(mock).toBeDefined();
		if (mock == null) return;
		expect(mockPlan(mock, 'desktop')).toEqual({ text: MOCK_TEXT, seconds: 360 });
		const phone = mockPlan(mock, 'phone');
		expect(phone).toEqual({ text: 'Some people think that cities should spend more on parks. Others believe that roads matter more.', seconds: 270 });
		expect(sentencesOf(phone.text)).toEqual(sentencesOf(MOCK_TEXT).slice(0, 2));
		expect(wordCount(phone.text)).toBe(16);
	});
});

describe('progress: the best of the tries, kept across devices', () => {
	test('a stop lights up on its first pass; misses in a row start again; the best try stays', () => {
		const p = emptyProgress();
		expect(recordTry(p, IDS, tried('sentences', false, best(false, 89, 50), 'desktop', 30000), 1000)).toEqual({ newPass: false, newAll: false });
		expect(p.stops.sentences).toMatchObject({ tries: 1, fails: 1, passedAt: 0, passedOn: null });
		expect(recordTry(p, IDS, tried('sentences', true, best(true, 97, 15), 'phone', 40000), 2000).newPass).toBe(true);
		expect(p.stops.sentences).toMatchObject({ tries: 2, fails: 0, passedAt: 2000, passedOn: 'phone' });
		// a pass beats a faster miss
		expect(p.stops.sentences?.best).toEqual(best(true, 97, 15));
		// passed again on a computer: lit since its first pass, now on a computer; as accurate and faster is better
		expect(recordTry(p, IDS, tried('sentences', true, best(true, 97, 26), 'desktop', 20000), 3000).newPass).toBe(false);
		expect(p.stops.sentences).toMatchObject({ tries: 3, passedAt: 2000, passedOn: 'desktop' });
		// a less accurate pass doesn't replace it, even a faster one
		recordTry(p, IDS, tried('sentences', true, best(true, 96, 30), 'desktop', 20000), 4000);
		expect(p.stops.sentences?.best).toEqual(best(true, 97, 26));
		expect(p.practiceMs).toBe(110000);
	});

	test('the best try: a pass, then the most right, the most accurate, the fastest', () => {
		expect(betterBest(best(false, 100, 90), best(true, 95, 20))).toEqual(best(true, 95, 20));
		expect(betterBest(best(true, 98, 30, 11, 12), best(true, 92, 20, 12, 12))).toEqual(best(true, 92, 20, 12, 12));
		expect(betterBest(null, best(false, 50, 10))).toEqual(best(false, 50, 10));
		expect(betterBest(best(true, 97, 26), best(true, 97, 26))).toEqual(best(true, 97, 26));
	});

	test('the whole line lights up with its last stop, once', () => {
		const p = emptyProgress();
		IDS.forEach((id, k) => {
			expect(recordTry(p, IDS, tried(id, true, best(true, 100, 30)), 1000 + k).newAll).toBe(k === IDS.length - 1);
		});
		expect(p.finishedAt).toBe(1004);
		expect(passedIds(p, IDS)).toEqual(IDS);
		expect(recordTry(p, IDS, tried('mock', true, best(true, 100, 30)), 9000).newAll).toBe(false);
		expect(p.finishedAt).toBe(1004);
	});

	test('the first stop and the one after a passed stop are ready; a later stop passed first lights only itself', () => {
		const p = emptyProgress();
		expect(stopState(p, IDS, 'numbers')).toBe('ready');
		expect(stopState(p, IDS, 'spelling')).toBe('locked');
		recordTry(p, IDS, tried('numbers', true, best(true, 100, 30, 12, 12)));
		expect(stopState(p, IDS, 'spelling')).toBe('ready');
		recordTry(p, IDS, tried('listening', true, best(true, 90, 0, 9, 10)));
		expect(stopState(p, IDS, 'spelling')).toBe('ready');
		expect(stopState(p, IDS, 'listening')).toBe('passed');
		expect(stopState(p, IDS, 'sentences')).toBe('ready');
		expect(stopState(p, IDS, 'mock')).toBe('locked');
		expect(nextStopId(p, IDS)).toBe('spelling');
	});

	test('two devices merge: every pass with its first date, the best of each stop, the later streak', () => {
		// this phone
		const a = emptyProgress();
		recordTry(a, IDS, tried('numbers', true, best(true, 98, 25, 12, 12), 'phone', 60000), 5000);
		recordTry(a, IDS, tried('spelling', false, best(false, 70, 20, 7, 10), 'phone', 60000), 6000);
		// the account's copy, from a computer
		const b = emptyProgress();
		recordTry(b, IDS, tried('numbers', true, best(true, 100, 40, 12, 12), 'desktop', 30000), 3000);
		recordTry(b, IDS, tried('numbers', true, best(true, 100, 38, 12, 12), 'desktop', 30000), 4000);
		recordTry(b, IDS, tried('spelling', true, best(true, 90, 30, 9, 10), 'desktop', 60000), 7000);
		const m = mergeProgress(a, b, IDS);
		expect(m.stops.numbers).toMatchObject({ tries: 2, passedAt: 3000, passedOn: 'desktop', best: best(true, 100, 40, 12, 12) });
		expect(m.stops.spelling).toMatchObject({ tries: 1, fails: 0, at: 7000, passedAt: 7000, best: best(true, 90, 30, 9, 10) });
		expect(passedIds(m, IDS)).toEqual(['numbers', 'spelling']);
		expect(m.practiceMs).toBe(120000);
		// either way round, and again: the same
		expect(passedIds(mergeProgress(b, a, IDS), IDS)).toEqual(['numbers', 'spelling']);
		expect(mergeProgress(m, m, IDS)).toEqual(m);
		// the merge doesn't share objects with what it came from
		expect(m.stops.numbers?.best).not.toBe(b.stops.numbers?.best);
	});

	test('a line finished between two devices is finished when its last stop was passed', () => {
		const a = emptyProgress();
		IDS.slice(0, 4).forEach((id, k) => recordTry(a, IDS, tried(id, true, best(true, 100, 30)), 100 + k));
		const b = emptyProgress();
		recordTry(b, IDS, tried('mock', true, best(true, 99, 25)), 500);
		expect([a.finishedAt, b.finishedAt]).toEqual([0, 0]);
		expect(mergeProgress(a, b, IDS).finishedAt).toBe(500);
	});

	test('the registry value as far as it makes sense', () => {
		expect(toProgress(null)).toEqual(emptyProgress());
		expect(toProgress({ v: 1, stops: { numbers: { tries: 2, fails: 'x', at: 5, passedAt: 4, passedOn: 'phone', best: { pass: true, score: 12, total: 12, acc: 100, wpm: 33 } }, bad: 3 }, practiceMs: -5, finishedAt: 'no' }))
			.toEqual({ v: 1, stops: { numbers: { tries: 2, fails: 0, at: 5, passedAt: 4, passedOn: 'phone', best: best(true, 100, 33, 12, 12) } }, practiceMs: 0, finishedAt: 0 });
		const p = emptyProgress();
		recordTry(p, IDS, tried('numbers', true, best(true, 100, 30, 12, 12)), 1234);
		expect(toProgress(JSON.parse(JSON.stringify(p)))).toEqual(p);
	});
});

describe('a stop\'s clock', () => {
	test('time away from the page doesn\'t count', () => {
		let t = 0;
		const clock = createClock(() => t);
		clock.start();
		t = 1000;
		clock.pause();
		t = 5000;
		expect(clock.now()).toBe(1000);
		clock.start();
		t = 5500;
		expect(clock.now()).toBe(1500);
		expect(clock.running).toBe(true);
	});
});

describe('reading a typing line (示例题目)', () => {
	const content = toTypingContent(EXAMPLE());

	test('stops in line order, numbered from 1, with the line and the goal', () => {
		expect(content.stops.map(s => s.id)).toEqual(IDS);
		expect(content.stops.map(s => [s.n, s.kind])).toEqual([[1, 'copy'], [2, 'spell'], [3, 'listen'], [4, 'copy'], [5, 'mock']]);
		expect(content.line).toEqual({ n: 0, name: { zh: '示例线', en: 'Example line' }, color: '#B4457E' });
		expect(content.goal).toEqual(GOAL);
		// a stop without a short name or a blurb uses its name, and an empty blurb
		expect(content.stops[0]).toMatchObject({ short: { zh: '示例数字', en: 'Example numbers' }, blurb: { zh: '', en: '' }, minutes: 2 });
	});

	test('nothing read yet (or not a line): no stops, the line\'s defaults', () => {
		for (const raw of [null, undefined, 'x', [], { stops: 'x' }]) {
			expect(toTypingContent(raw)).toEqual({ line: { n: 0, name: { zh: '机考打字', en: 'Typing' }, color: '#B4457E' }, goal: GOAL, stops: [] });
		}
	});

	test('pass counts: no more than there are; a sentences stop passes on accuracy and speed', () => {
		const raw = EXAMPLE();
		raw.stops[0].need = 9;
		const [numbers, spelling, listening, sentences] = toTypingContent(raw).stops;
		expect(numbers.kind === 'copy' && [numbers.need, numbers.items.length]).toEqual([3, 3]);
		expect(spelling.kind === 'spell' && [spelling.need, spelling.items.length]).toEqual([1, 2]);
		expect(listening.kind === 'listen' && [listening.need, listening.rows.length]).toEqual([2, 2]);
		expect(sentences.kind === 'copy' && sentences.need).toBeNull();
		const numbersItems = content.stops[0].kind === 'copy' ? content.stops[0].items : [];
		expect(numbersItems.map(i => i.prefix)).toEqual([null, '£', null]);
	});

	test('the hard letters of a word are marked in brackets', () => {
		expect(parseSpell('a[cc]o[mm]odation')).toEqual({ word: 'accommodation', hard: [1, 2, 4, 5] });
		expect(parseSpell('plain')).toEqual({ word: 'plain', hard: [] });
		const spelling = content.stops[1];
		if (spelling.kind !== 'spell') throw new Error('stop 2 is the spelling stop');
		expect(spelling.items.map(w => [w.word, w.hard, w.tip])).toEqual([['accommodation', [1, 2, 4, 5], '示例'], ['necessary', [1], '']]);
	});

	test('what is malformed is left out: an item, a row, a stop, an id seen before', () => {
		const raw = EXAMPLE();
		(raw.stops[0].items as unknown[]).push({ field: 'no target' });
		(raw.stops[1].items as unknown[]).push({ spell: 'w[o]rd', zh: '词', sentence: 'no gap' });
		(raw.stops[2].rows as unknown[]).push({ say: 'x', note: 'y', answer: [] });
		raw.stops.push({ id: 'draw', kind: 'draw', zh: '示例', en: 'Example' }, { id: 'numbers', kind: 'copy', zh: '又一次', en: 'Again', items: [{ target: 'x' }] }, { id: 'empty', kind: 'copy', zh: '示例', en: 'Example', items: [] });
		const c = toTypingContent(raw);
		expect(c.stops.map(s => s.id)).toEqual(IDS);
		expect(c.stops.map(s => (s.kind === 'listen' ? s.rows.length : s.kind === 'mock' ? 0 : s.items.length))).toEqual([3, 2, 2, 1, 0]);
	});

	test('the listening stop: its settings, with defaults where the file leaves them out', () => {
		const listening = content.stops[2];
		if (listening.kind !== 'listen') throw new Error('stop 3 is the listening stop');
		expect(listening).toMatchObject({ title: 'Example', intro: '', lookSeconds: 5, gapSeconds: { desktop: 6, phone: 8 }, instructions: { en: 'Write ONE WORD AND/OR A NUMBER for each answer.', zh: '每空填一个词或一个数字。' } });
		expect(listening.rows[1]).toEqual({ say: 'On Tuesday.', note: 'Day: ___', after: null, answer: ['Tuesday', 'Tue'], hl: null });
	});

	test('every gap takes its own answer, as a gate would mark it; a printed £ may be written too', () => {
		const listening = content.stops[2];
		if (listening.kind !== 'listen') throw new Error('stop 3 is the listening stop');
		const mark = (answer: string[], typed: string) => markText({ answer, ignoreSpaces: false, limit: null }, { words: 1, number: true }, typed).correct;
		for (const r of listening.rows) for (const a of r.answer) expect(mark(r.answer, a), a).toBe(true);
		expect(mark(['42'], '£42')).toBe(true);
		expect(mark(['Tuesday', 'Tue'], 'next Tuesday')).toBe(false);
	});
});
