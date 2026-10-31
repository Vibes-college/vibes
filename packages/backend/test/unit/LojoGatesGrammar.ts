/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	SPELL_PLAYS, answersOf, bare, buildOrder, fixAnswer, gateCourseProblems, gateShapeProblems, isGateCourse, markItem, markSet, markTranslation,
	norm, parseAnswer, publicGroups, sentence, tokens, word,
} from '@/misc/lojo-gates.js';
import type { GateCourse, GateGroup, GateItem, GateItemSpec, GateRe, GateSet } from '@/misc/lojo-gates.js';

// Questions made up for these tests: the real sets hold their answers and are kept out of the public source.
type TranslateSpec = Extract<GateItemSpec, { kind: 'translate' }>;
const text = { en: 'Answer the questions.', zh: '作答。' };
const re = (r: RegExp): GateRe => ({ source: r.source, flags: r.flags });
const group = (type: GateGroup['type'], skill: GateGroup['skill'], items: GateItem[]): GateGroup => ({
	type, skill, instructions: text, title: null, lines: [], limit: null, image: null, letters: [], options: [], items,
});
const item = (n: number, more: Partial<GateItem>): GateItem => ({
	n: [n], q: null, options: [], answer: [], ignoreSpaces: false, limit: null, tags: ['x'], why: '一句为什么', right: null, spec: null, ...more,
});
const copy = <T>(v: T): T => structuredClone(v);

/* ---------- a vocabulary set ---------- */

const spell = item(1, { answer: ['neighbour', 'neighbor'], why: 'neighbour：邻居', spec: { kind: 'spell', say: 'neighbour' } });
const meaning = item(2, { q: 'landlord', options: ['房东', '房客', '邻居', '中介'], answer: ['A'], why: 'landlord：房东' });
const vocab: GateSet = {
	id: '5.1-A', station: '5.1', set: 'A', band: 4, part: null, pass: 2, total: 2, voices: { N: 'uk-brit' }, rate: 1, lines: [5], script: [],
	groups: [group('spell', 'vocab', [spell]), group('choice', 'vocab', [meaning])],
};

/* ---------- a grammar set ---------- */

// chips: 0 in the park, 1 we, 2 walk, 3 at weekends, 4 walks (not needed)
const build = item(1, {
	q: '我们周末在公园散步。', options: ['in the park', 'we', 'walk', 'at weekends', 'walks'],
	answer: ['we walk in the park at weekends', 'at weekends we walk in the park'], right: 'We walk in the park at weekends.',
	spec: { kind: 'build', extra: true },
});
// She(0) have(1) finished(2) her(3) essay(4) already.(5)
const fixChoose = item(2, {
	q: 'She have finished her essay already.', options: ['删掉这个词', 'has', 'had', 'having'], answer: ['has'],
	right: 'She has finished her essay already.', spec: { kind: 'fix', wrong: 1 },
});
// The(0) children(1) plays(2) football(3) after(4) school.(5)
const fixType = item(3, { q: 'The children plays football after school.', answer: ['play'], right: 'The children play football after school.', spec: { kind: 'fix', wrong: 2 } });
// Many(0) students(1) are(2) prefer(3) to(4) cycle.(5)
const fixDelete = item(4, {
	q: 'Many students are prefer to cycle.', options: ['删掉这个词', 'is', 'do', 'were'], answer: ['删掉这个词'],
	right: 'Many students prefer to cycle.', spec: { kind: 'fix', wrong: 2 },
});
// The(0) bus(1) that(2) leaves(3) at(4) noon(5) is(6) always(7) full.(8)
const parseClause = item(5, {
	q: 'The bus that leaves at noon is always full.',
	spec: { kind: 'parse', subj: { must: [1], span: [0, 5] }, verb: { must: [6], span: [6, 6] }, clauses: [[2, 5]] },
});
// My(0) brother(1) has(2) worked(3) in(4) a(5) bank.(6)
const parsePlain = item(6, {
	q: 'My brother has worked in a bank.', spec: { kind: 'parse', subj: { must: [1], span: [0, 1] }, verb: { must: [2, 3], span: [2, 3] }, clauses: [] },
});
const LIVES = 'students 是复数，从句里用 live。', THEY = '从句里不再写 they。', ARE = 'walk 本身就是谓语，前面不用 are。';
const OK = '用了定语从句：students who live …', MISS = '“住在校园里的学生”用定语从句：students who live on campus。';
const ALT = 'on-campus students 也对；这一站练的是 who live。';
const refs = ['Students who live on campus usually walk to class.', 'Students living on campus usually walk to their classes.', 'Students who live on campus normally go to class on foot.'];
const translateSpec: TranslateSpec = {
	kind: 'translate', focus: '定语从句',
	must: [
		{ zh: '学生', en: 'students', any: ['students?'], soft: false },
		{ zh: '住', en: 'live', any: ['live', 'living'], soft: false },
		{ zh: '校园', en: 'on campus', any: ['campus'], soft: false },
		{ zh: '步行', en: 'walk', any: ['walk', 'walks', 'walking', 'on foot'], soft: false },
		{ zh: '上课', en: 'class', any: ['class', 'classes', 'lessons?', 'lectures?'], soft: false },
		{ zh: '通常', en: 'usually', any: ['usually', 'normally', 'generally', 'often'], soft: true },
	],
	errors: [
		{ re: re(/\bwho lives\b/), msg: LIVES, replaces: true },
		{ re: re(/\bwho they\b/), msg: THEY, replaces: true },
		{ re: re(/\b(are|is) walk\b/), msg: ARE, replaces: false },
	],
	structure: { any: [re(/\bstudents (who|that) live\b/), re(/\bstudents living\b/)], ok: OK, miss: MISS, alt: [{ re: re(/\bon-campus students\b/), note: ALT }] },
	test: {
		right: ['Students who live on campus generally walk to lectures.'],
		wrong: ['Students who lives on campus usually walk to class.', 'Students who they live on campus usually walk to class.'],
	},
};
const translate = item(7, { q: '住在校园里的学生通常步行去上课。', answer: refs, right: refs[0], spec: translateSpec });
const choice = item(8, { q: 'Prices ___ every year.', options: ['rise', 'rises', 'rising', 'are rise'], answer: ['A'], why: 'prices 是复数，用 rise。' });
const grammar: GateSet = {
	id: '6.1-A', station: '6.1', set: 'A', band: 4, part: null, pass: 6, total: 8, voices: {}, rate: 1, lines: [6], script: [],
	groups: [
		group('build', 'grammar', [build]),
		group('fix', 'grammar', [fixChoose, fixType, fixDelete]),
		group('parse', 'grammar', [parseClause, parsePlain]),
		group('translate', 'grammar', [translate]),
		group('choice', 'grammar', [choice]),
	],
};
const [buildGroup, fixGroup, parseGroup, translateGroup] = grammar.groups;

const course: GateCourse = {
	id: 'ielts', title: 'IELTS',
	lines: [{ n: 5, live: true, name: 'Vocabulary', stations: ['5.1'] }, { n: 6, live: true, name: 'Grammar', stations: ['6.1'] }],
	interchanges: [], tags: { x: { en: 'x', zh: 'x' } }, sets: [vocab, grammar],
};
// the course with one question of the grammar set changed
const withGrammar = (change: (s: GateSet) => void): GateCourse => {
	const s = copy(grammar);
	change(s);
	return { ...course, sets: [vocab, s] };
};
const at = (s: GateSet, n: number) => s.groups.flatMap(g => g.items).find(i => i.n[0] === n)!;
const specOf = <K extends GateItemSpec['kind']>(s: GateSet, n: number, kind: K) => {
	const spec = at(s, n).spec!;
	if (spec.kind !== kind) throw new Error(`question ${n} is not ${kind}`);
	return spec as Extract<GateItemSpec, { kind: K }>;
};
const mark = (g: GateGroup, i: GateItem, value: string) => markItem(g, i, value);
const translation = (value: string, spec: TranslateSpec = translateSpec) => markTranslation(spec, value);

describe('Vibes gates: the vocabulary and grammar types', () => {
	test('splits and compares sentences like the grammar-line demo', () => {
		expect(tokens('  Many  cities, too. ')).toEqual(['Many', 'cities,', 'too.']);
		expect(bare('cities,')).toBe('cities');
		expect(bare('“(yes)”')).toBe('(yes)');
		expect(norm('They’re here, aren’t they?')).toBe('they are here are not they');
		expect(norm('I can\'t — I WON\'T!')).toBe('i can not i will not');
		expect(norm('There\'s an on-campus café.')).toBe('there is an on-campus caf');
		expect(word(' Play. ')).toBe('play');
		expect(word('Don\'t')).toBe('don\'t');
		expect(sentence(['in the park', 'we', 'walk'], [1, 2, 0])).toBe('We walk in the park.');
		expect(sentence(['we'], [])).toBe('');
	});

	test('spell: the word or one of its other spellings, marked like a gap', () => {
		const g = vocab.groups[0];
		expect(mark(g, spell, ' Neighbor. ')).toMatchObject({
			n: 1, correct: true, given: 'Neighbor.', expected: 'neighbour', accepted: ['neighbour', 'neighbor'], reason: null, q: null, why: 'neighbour：邻居',
		});
		expect(mark(g, spell, 'ＮＥＩＧＨＢＯＵＲ').correct).toBe(true);
		expect(mark(g, spell, 'neighbur')).toMatchObject({ correct: false, reason: 'wrong' });
		expect(mark(g, spell, '  ')).toMatchObject({ correct: false, reason: 'blank' });
	});

	test('build: the chips in the order picked make an accepted sentence; numbers that are not chips are wrong', () => {
		expect(mark(buildGroup, build, '1,2,0,3')).toMatchObject({
			correct: true, given: 'We walk in the park at weekends.', expected: 'We walk in the park at weekends.', reason: null, right: 'We walk in the park at weekends.',
		});
		expect(mark(buildGroup, build, '3, 1, 2, 0')).toMatchObject({ correct: true, given: 'At weekends we walk in the park.' });
		// the chip that is not needed, a chip left out
		expect(mark(buildGroup, build, '1,4,0,3')).toMatchObject({ correct: false, given: 'We walks in the park at weekends.', reason: 'wrong' });
		expect(mark(buildGroup, build, '1,2,0')).toMatchObject({ correct: false, reason: 'wrong' });
		for (const bad of ['1,2,0,5', '1,1,0,3', '1,x,0,3', '1,,2', '-1,2', '1.5,2', '[1,2]']) {
			expect(mark(buildGroup, build, bad)).toMatchObject({ correct: false, given: '', reason: 'wrong' });
		}
		expect(mark(buildGroup, build, '')).toMatchObject({ correct: false, given: '', reason: 'blank' });
		expect(buildOrder('4,1,3', 5)).toEqual([4, 1, 3]);
		expect(buildOrder('5', 5)).toBeNull();
	});

	test('fix: the wrong word, then the right correction, picked or typed', () => {
		expect(mark(fixGroup, fixChoose, '1|has')).toMatchObject({
			correct: true, given: '1|has', expected: '1|has', accepted: ['1|has'], reason: null, right: 'She has finished her essay already.',
			q: 'She have finished her essay already.',
		});
		expect(mark(fixGroup, fixChoose, '1|had').correct).toBe(false);
		// the right correction at another word
		expect(mark(fixGroup, fixChoose, '2|has').correct).toBe(false);
		expect(mark(fixGroup, fixChoose, '1|删掉这个词').correct).toBe(false);
		expect(mark(fixGroup, fixDelete, '2|删掉这个词').correct).toBe(true);
		// typed: case and punctuation don't matter, the word does
		expect(mark(fixGroup, fixType, '2| Play. ')).toMatchObject({ correct: true, expected: '2|play' });
		expect(mark(fixGroup, fixType, '2|played').correct).toBe(false);
		expect(mark(fixGroup, fixType, '2|').correct).toBe(false);
		for (const bad of ['9|play', '6|play', 'x|play', '|play', 'play', '-2|play']) expect(mark(fixGroup, fixType, bad)).toMatchObject({ correct: false, reason: 'wrong' });
		expect(mark(fixGroup, fixType, ' ')).toMatchObject({ correct: false, reason: 'blank' });
		expect(fixAnswer('3|删掉这个词')).toEqual({ at: 3, fix: '删掉这个词' });
		expect(fixAnswer('3')).toEqual({ at: 3, fix: '' });
		expect(fixAnswer('2|a|b')).toEqual({ at: 2, fix: 'a|b' });
		expect(fixAnswer('a|b')).toBeNull();
	});

	test('parse: the subject and verb must fit, and clauses must be exactly the ones there are', () => {
		const key = { s: [1], v: [6], c: [[2, 5]] };
		const right = '{"s":[0,1],"v":[6],"c":[[2,5]]}';
		expect(mark(parseGroup, parseClause, right)).toMatchObject({ correct: true, given: right, key, expected: JSON.stringify(key), reason: null });
		// the subject with its clause is still the subject; clauses in any order
		expect(mark(parseGroup, parseClause, JSON.stringify({ s: [0, 1, 2, 3, 4, 5], v: [6], c: [[2, 5]] })).correct).toBe(true);
		// a word beyond the subject, the clause's verb as the verb, no clause, a clause cut short, one too many
		for (const wrong of [{ s: [1, 6], v: [6], c: [[2, 5]] }, { s: [1], v: [3], c: [[2, 5]] }, { s: [1], v: [6] }, { s: [1], v: [6], c: [[2, 4]] }, { s: [1], v: [6], c: [[2, 5], [7, 8]] }]) {
			expect(mark(parseGroup, parseClause, JSON.stringify(wrong))).toMatchObject({ correct: false, reason: 'wrong', key });
		}
		// no clauses to mark: any sent are left alone, as in the demo; half the verb is not the verb
		expect(mark(parseGroup, parsePlain, '{"s":[1],"v":[2,3]}').correct).toBe(true);
		expect(mark(parseGroup, parsePlain, '{"s":[1],"v":[2,3],"c":[[0,1]]}').correct).toBe(true);
		expect(mark(parseGroup, parsePlain, '{"s":[1],"v":[3]}').correct).toBe(false);
		// not the JSON, or positions that are not words of the sentence
		for (const bad of ['{"s":[1],"v":[6]', 'null', '[1,6]', '"s"', '{"s":[1],"v":[9]}', '{"s":[1],"v":[-1]}', '{"s":["1"],"v":[6]}', '{"s":[1.5],"v":[6]}', '{"s":1,"v":[6]}', '{"s":[1],"v":[6],"c":[[2]]}', '{"s":[1],"v":[6],"c":[[2,5,6]]}', '{"s":[1],"v":[6],"c":[2,5]}']) {
			expect(mark(parseGroup, parseClause, bad)).toMatchObject({ correct: false, reason: 'wrong', given: bad });
		}
		for (const blank of ['', '{}', '{"s":[],"v":[],"c":[]}']) expect(mark(parseGroup, parseClause, blank)).toMatchObject({ correct: false, reason: 'blank' });
		expect(parseAnswer('{"s":[3],"v":[4],"c":[[0,2]]}', 5)).toEqual({ s: [3], v: [4], c: [[0, 2]] });
		expect(parseAnswer('{"s":[3]}', 3)).toBeNull();
	});

	test('translate: the references and other fair answers are right, the usual mistakes wrong, with feedback', () => {
		for (const r of [...refs, ...translateSpec.test.right]) expect(mark(translateGroup, translate, r)).toMatchObject({ correct: true, reason: null });
		expect(mark(translateGroup, translate, refs[0])).toMatchObject({
			given: refs[0], expected: refs[0], accepted: refs, right: refs[0], feedback: { good: [OK, '意思都译出来了。'], fix: [], notes: [] },
		});
		expect(translation('Students who live on campus walk to class.')).toEqual({ correct: true, feedback: { good: [OK, '意思都译出来了。'], fix: [], notes: ['小提醒：“通常”也可以译出来，比如 usually。'] } });
		expect(translation('学生 who live on campus usually walk.').feedback.fix).toEqual(['要写英文。']);
		expect(translation('Students walk.').feedback.fix).toEqual(['句子不完整，写一整句。']);
		expect(translation('Students who they live on campus usually walk to class.')).toMatchObject({ correct: false, feedback: { fix: [THEY] } });
		// the structure missed, or another fair structure
		expect(translation('On campus, many students usually walk to class.').feedback.fix).toContain(MISS);
		const alsoOnCampus: TranslateSpec = { ...translateSpec, must: translateSpec.must.map(m => (m.zh === '住' ? { ...m, any: [...m.any, 'on-campus'] } : m)) };
		expect(translation('On-campus students usually walk to class.', alsoOnCampus)).toEqual({ correct: true, feedback: { good: ['意思都译出来了。'], fix: [], notes: [ALT] } });
		expect(translation('Students who live on campus usually go to class.')).toMatchObject({ correct: false, feedback: { fix: ['没找到“步行”的说法，比如 walk。拼写也看一下。'] } });
		expect(mark(translateGroup, translate, '')).toMatchObject({ correct: false, reason: 'blank', feedback: { good: [], fix: [], notes: [] } });
	});

	test('translate: one letter off in a plain word still counts, with a note; never in fragments, short words or grammar', () => {
		// one letter changed, missing or added
		for (const [typed, note] of [['wolk', '拼写：wolk → walk'], ['wak', '拼写：wak → walk'], ['walkk', '拼写：walkk → walk'], ['clas', '拼写：clas → class']] as const) {
			const sentenceTyped = `Students who live on campus usually ${typed === 'clas' ? 'walk to clas' : `${typed} to class`}.`;
			expect(translation(sentenceTyped)).toEqual({ correct: true, feedback: { good: [OK, '意思都译出来了。'], fix: [], notes: [note] } });
		}
		// two letters (swapped), a fragment ('lectures?'), a word under 4 letters
		expect(translation('Students who live on campus usually wlak to class.').correct).toBe(false);
		expect(translation('Students who live on campus usually walk to lecturs.')).toMatchObject({ correct: false, feedback: { notes: [] } });
		const shortWord: TranslateSpec = { ...translateSpec, must: translateSpec.must.map(m => (m.zh === '步行' ? { ...m, any: ['run'] } : m)) };
		expect(translation('Students who live on campus usually run to class.', shortWord).correct).toBe(true);
		expect(translation('Students who live on campus usually rn to class.', shortWord).correct).toBe(false);
		// founder, 2026-10-29: a grammar mistake is still wrong. 'lives' is one letter off 'live', but the error comes first,
		// and it is not taken for a misspelling.
		expect(translation('Students who lives on campus usually walk to class.')).toEqual({
			correct: false, feedback: { good: [], fix: [LIVES, '没找到“住”的说法，比如 live。拼写也看一下。'], notes: [] },
		});
		// a misspelling does not hide a grammar mistake: 'are wlk' is 'are walk'
		expect(translation('Students who live on campus are wlk to class.')).toMatchObject({
			correct: false, feedback: { fix: [ARE], notes: ['拼写：wlk → walk', '小提醒：“通常”也可以译出来，比如 usually。'] },
		});
		expect(translation('Students who live on campus usually wlk to class.').correct).toBe(true);
		// a word that already says another part is not taken for a misspelling: 'class' is not 'glass' misspelt
		const glass: TranslateSpec = { ...translateSpec, must: [...translateSpec.must, { zh: '玻璃', en: 'glass', any: ['glass'], soft: false }] };
		expect(translation('Students who live on campus usually walk to class.', glass)).toMatchObject({
			correct: false, feedback: { fix: ['没找到“玻璃”的说法，比如 glass。拼写也看一下。'], notes: [] },
		});
		expect(translation('Students who live on campus usually walk to class with glas.', glass)).toMatchObject({ correct: true, feedback: { notes: ['拼写：glas → glass'] } });
	});

	test('a translation may be up to 600 characters, other answers are cut at 200', () => {
		const answers = answersOf(grammar, [{ n: 7, value: 'x'.repeat(700) }, { n: 1, value: 'y'.repeat(700) }]);
		expect(answers.get(7)).toHaveLength(600);
		expect(answers.get(1)).toHaveLength(200);
	});

	test('marks a whole paper; results of the new sets carry the question and why, older ones stay as they were', () => {
		const answers = new Map([
			[1, '1,2,0,3'], [2, '1|has'], [3, '2|play'], [4, '2|删掉这个词'], [5, '{"s":[1],"v":[6],"c":[[2,5]]}'], [6, '{"s":[1],"v":[2,3]}'],
			[7, refs[1]], [8, 'a'],
		]);
		const { score, items } = markSet(grammar, answers);
		expect(score).toBe(8);
		expect(items.map(i => i.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
		expect(items.every(i => i.why === '一句为什么' || i.why === 'prices 是复数，用 rise。')).toBe(true);
		expect(items[7]).toMatchObject({ given: 'A', q: 'Prices ___ every year.', why: 'prices 是复数，用 rise。', right: null });
		expect(items[6].feedback?.good).toContain('意思都译出来了。');
		expect(items[4].key).toEqual({ s: [1], v: [6], c: [[2, 5]] });
		expect(markSet(vocab, new Map([[1, 'neighbor'], [2, 'B']])).score).toBe(1);
		// a listening question without why: no new fields
		const listening: GateSet = { ...vocab, groups: [group('form', 'listening', [{ n: [1], q: null, options: [], answer: ['Hollins'], ignoreSpaces: false, limit: null, tags: ['x'] }])] };
		expect(Object.keys(markSet(listening, new Map([[1, 'hollins']])).items[0]).sort()).toEqual(['accepted', 'correct', 'expected', 'given', 'n', 'reason', 'tags']);
	});

	test('the paper sent to the browser has the new types\' own fields and nothing that gives an answer away', () => {
		const words = new Map([[1, 'https://files.example/a1b2c3.mp3']]);
		const vocabPaper = publicGroups(vocab, n => n, words), grammarPaper = publicGroups(grammar, n => n);
		expect(vocabPaper.map(g => g.skill)).toEqual(['vocab', 'vocab']);
		expect(grammarPaper.map(g => g.skill)).toEqual(['grammar', 'grammar', 'grammar', 'grammar', 'grammar']);
		expect(vocabPaper[0].items[0]).toEqual({ n: [1], q: null, options: [], choose: 1, limit: null, audio: 'https://files.example/a1b2c3.mp3', plays: SPELL_PLAYS });
		expect(SPELL_PLAYS).toBe(3);
		expect(grammarPaper[0].items[0]).toEqual({ n: [1], q: '我们周末在公园散步。', options: build.options, choose: 1, limit: null, extra: true });
		expect(grammarPaper[1].items.map(i => i.mode)).toEqual(['choose', 'type', 'choose']);
		expect(grammarPaper[2].items.map(i => i.clauses)).toEqual([true, false]);
		expect(grammarPaper[3].items[0]).toEqual({ n: [7], q: '住在校园里的学生通常步行去上课。', options: [], choose: 1, limit: null, focus: '定语从句' });
		const own: Record<string, string[]> = { spell: ['audio', 'plays'], build: ['extra'], fix: ['mode'], parse: ['clauses'], translate: ['focus'], choice: [] };
		for (const g of [...vocabPaper, ...grammarPaper]) {
			expect(Object.keys(g).sort()).toEqual(['image', 'instructions', 'items', 'letters', 'limit', 'lines', 'options', 'skill', 'title', 'type']);
			for (const i of g.items) expect(Object.keys(i).sort()).toEqual(['choose', 'limit', 'n', 'options', 'q', ...own[g.type]].sort());
		}
		const json = JSON.stringify([vocabPaper, grammarPaper]);
		const secrets = [
			'"say"', '"answer"', '"spec"', '"kind"', '"wrong"', '"subj"', '"verb"', '"span"', '"must"', '"errors"', '"structure"', '"test"', '"why"', '"right"',
			'"tags"', '"key"', 'neighbour', 'neighbor', 'we walk in the park', 'She has finished', '"play"', 'Many students prefer', LIVES, OK, MISS, ALT,
			...refs, ...translateSpec.test.right, ...translateSpec.test.wrong, 'students?',
		];
		for (const secret of secrets) expect(json).not.toContain(secret);
	});

	test('an import of the new types is shape-checked, and their questions are marked against their own answers', () => {
		expect(isGateCourse(course)).toBe(true);
		expect(gateCourseProblems(course)).toEqual([]);
		const bad = (change: (s: GateSet) => void) => isGateCourse(withGrammar(change));
		expect(bad(s => { at(s, 1).answer = []; })).toBe(false);
		expect(bad(s => { at(s, 5).answer = []; })).toBe(true);
		expect(bad(s => { at(s, 5).spec = null; })).toBe(false);
		expect(bad(s => { at(s, 5).spec = { kind: 'build', extra: true }; })).toBe(false);
		expect(bad(s => { at(s, 8).spec = { kind: 'spell', say: 'rise' }; })).toBe(false);
		expect(bad(s => { at(s, 1).n = [1, 2]; })).toBe(false);
		expect(bad(s => { at(s, 1).options = []; })).toBe(false);
		expect(bad(s => { at(s, 2).q = null; })).toBe(false);
		expect(bad(s => { at(s, 2).why = 3 as unknown as string; })).toBe(false);
		expect(bad(s => { specOf(s, 5, 'parse').clauses = [[2]] as unknown as [number, number][]; })).toBe(false);
		expect(bad(s => { specOf(s, 7, 'translate').errors[0].re = { source: '(who', flags: '' }; })).toBe(false);
		expect(bad(s => { specOf(s, 7, 'translate').errors[0].re.flags = 'g'; })).toBe(false);
		expect(bad(s => { specOf(s, 7, 'translate').must[0].any = ['(student']; })).toBe(false);
		expect(bad(s => { delete (specOf(s, 7, 'translate').must[0] as Partial<{ soft: boolean }>).soft; })).toBe(false);
		expect(bad(s => { s.groups[0].skill = 'speaking' as GateGroup['skill']; })).toBe(false);
		expect(gateShapeProblems(withGrammar(s => { at(s, 5).spec = null; }))).toEqual(['6.1-A 第 5 题（parse）的格式不对']);
		expect(gateShapeProblems({ id: 'ielts' })[0]).toContain('不是闯关课程');
	});

	test('the import self-check names the set and question of every kind of problem', () => {
		const problems = (change: (s: GateSet) => void) => gateCourseProblems(withGrammar(change));
		expect(problems(s => { at(s, 1).answer.push('we walk in the garden at weekends'); })).toEqual(['6.1-A 第 1 题（build）：“we walk in the garden at weekends”用词块拼不出来']);
		// built from the chips, but not lower case: it never matches
		expect(problems(s => { at(s, 1).answer.push('In the park we walk at weekends'); })).toEqual(['6.1-A 第 1 题（build）：“In the park we walk at weekends”拼出来判成了错（answer 要小写，词块之间一个空格）']);
		expect(problems(s => { specOf(s, 2, 'fix').wrong = 6; })).toEqual(['6.1-A 第 2 题（fix）：wrong 是 6，句子只有 6 个词（从 0 数）']);
		expect(problems(s => { at(s, 2).answer = ['have got']; })).toEqual(['6.1-A 第 2 题（fix）：改法“have got”不在选项里']);
		expect(problems(s => { at(s, 3).answer = ['Play']; })[0]).toContain('6.1-A 第 3 题（fix）：改法“Play”判成了错');
		expect(problems(s => { specOf(s, 5, 'parse').subj.span = [0, 9]; })).toEqual(['6.1-A 第 5 题（parse）：下标 9 超出了句子的词数（9 个词，从 0 数）']);
		expect(problems(s => { specOf(s, 5, 'parse').clauses = [[5, 2]]; })[0]).toContain('6.1-A 第 5 题（parse）：从句要写成');
		expect(problems(s => { specOf(s, 5, 'parse').clauses = [[2, 5], [4, 6]]; })[0]).toContain('6.1-A 第 5 题（parse）：从句互相重叠');
		expect(problems(s => { specOf(s, 5, 'parse').subj.must = [6]; })[0]).toContain('6.1-A 第 5 题（parse）：用 must 和 clauses 当答案，判成了错');
		expect(problems(s => { at(s, 7).answer.push('Students who lives on campus usually walk to class.'); })[0]).toContain(`6.1-A 第 7 题（translate）：参考答案判成了错：“Students who lives on campus usually walk to class.”：${LIVES}`);
		expect(problems(s => { specOf(s, 7, 'translate').test.right.push('People on campus usually walk to class.'); })[0]).toContain('test.right 判成了错：“People on campus usually walk to class.”');
		expect(problems(s => { specOf(s, 7, 'translate').test.wrong.push(refs[0]); })).toEqual([`6.1-A 第 7 题（translate）：test.wrong 判成了对：“${refs[0]}”`]);
		expect(problems(s => { specOf(s, 7, 'translate').test.wrong.pop(); })).toEqual(['6.1-A 第 7 题（translate）：test.wrong 只有 1 条，至少要 2 条']);
		// what is read out: nothing, or only marks the voice would skip
		for (const say of [' ', '**']) {
			const v = copy(vocab);
			specOfVocab(v).say = say;
			expect(gateCourseProblems({ ...course, sets: [v, grammar] })).toEqual(['5.1-A 第 1 题（spell）：say 是空的，没有要读的词']);
		}
		// placement stages are papers too
		const stage = { ...copy(grammar), id: 'placement-6:first' };
		specOf(stage, 2, 'fix').wrong = 9;
		const withPlacement: GateCourse = { ...course, placements: [{ line: 6, next: 1, place: { high: [[0, '6.1']], low: [[0, '6.1']] }, stages: { first: stage, high: grammar, low: grammar } }] };
		expect(isGateCourse(withPlacement)).toBe(true);
		expect(gateCourseProblems(withPlacement)).toEqual(['placement-6:first 第 2 题（fix）：wrong 是 9，句子只有 6 个词（从 0 数）']);
	});
});

function specOfVocab(s: GateSet) {
	const spec = s.groups[0].items[0].spec;
	if (spec?.kind !== 'spell') throw new Error('not spell');
	return spec;
}
