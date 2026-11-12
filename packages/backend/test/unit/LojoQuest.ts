/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
	addDays, ageOf, behindOf, dayOf, displayAnswer, drawQuestions, examDateOk, grade, heartsNow, isSpellingSlip, judge, lastRefillAt, mainCause, nextRefillAt,
	bookGear, gearPath, pickSet, setCounts, settleStreak, shelfFor, starsAfter, streakNow, touchStreak, wrongCause,
} from '@/misc/lojo-quest.js';
import { QUEST_NUMBERS } from '@/misc/lojo-quest-numbers.js';
import { questContentProblems } from '@/misc/lojo-quest-content.js';
import type { QuestChapter, QuestQuestion } from '@/misc/lojo-quest-types.js';
import { QUEST_BOOKS } from '@/misc/lojo-quest-books.js';
import { lojoVoiceIds } from '@/misc/lojo-voices.js';

const q = (over: Partial<QuestQuestion>): QuestQuestion => ({
	id: 'x', set: 'A', type: 'gap', skill: null, passage: null, question: '', options: null, chips: null, answer: '', accept: [], limit: null,
	ignoreSpaces: false, caseInsensitive: true, cause: 'not-heard', causes: null, pick: null, bothWrongCause: null, playOnce: false, lecture: null,
	evidence: '', why: '', audio: null, tags: [], ...over,
});

// The chapters (with the answers) are not in this repository: they are in the Vibes workspace, courses/english/ielts/quest,
// imported into the database by apps/community/scripts/quest-import.mjs. Their tests run where that folder is (or
// QUEST_CONTENT_DIR points at it) and are skipped elsewhere, e.g. in a checkout of the public repository.
const CONTENT_DIR = process.env.QUEST_CONTENT_DIR ?? new URL('../../../../../../../courses/english/ielts/quest/', import.meta.url).pathname;
const CONTENT: QuestChapter[] | null = existsSync(`${CONTENT_DIR}/ch1.json`)
	? [1, 2, 3, 4].map(n => JSON.parse(readFileSync(`${CONTENT_DIR}/ch${n}.json`, 'utf8')) as QuestChapter)
	: null;
const [QUEST_CH1, QUEST_CH2, QUEST_CH3, QUEST_CH4] = CONTENT ?? [];
const noContent = CONTENT == null;

const bj = (s: string) => new Date(`${s}+08:00`);

describe('闯关 rules', () => {
	test('Beijing day', () => {
		expect(dayOf(bj('2026-11-10T23:59:00'))).toBe('2026-11-10');
		expect(dayOf(bj('2026-11-11T00:01:00'))).toBe('2026-11-11');
		expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
	});

	test('hearts fill back to 5 at 08:00 and 20:00 Beijing', () => {
		expect(lastRefillAt(bj('2026-11-10T09:00:00')).toISOString()).toBe(bj('2026-11-10T08:00:00').toISOString());
		expect(nextRefillAt(bj('2026-11-10T09:00:00')).toISOString()).toBe(bj('2026-11-10T20:00:00').toISOString());
		expect(nextRefillAt(bj('2026-11-10T21:00:00')).toISOString()).toBe(bj('2026-11-11T08:00:00').toISOString());
		expect(heartsNow(2, bj('2026-11-10T09:00:00'), bj('2026-11-10T19:59:00'))).toBe(2);
		expect(heartsNow(2, bj('2026-11-10T09:00:00'), bj('2026-11-10T20:00:00'))).toBe(5);
		expect(heartsNow(0, bj('2026-11-10T21:00:00'), bj('2026-11-11T07:00:00'))).toBe(0);
		expect(heartsNow(0, bj('2026-11-10T21:00:00'), bj('2026-11-11T08:00:01'))).toBe(5);
	});

	test('a set counts with 10 items and 2 minutes', () => {
		const now = bj('2026-11-10T12:00:00');
		const t = now.getTime();
		expect(setCounts(10, 120_000, t - 130_000, now).ok).toBe(true);
		expect(setCounts(9, 300_000, t - 310_000, now).reason).toBe('items');
		expect(setCounts(20, 119_000, t - 130_000, now).reason).toBe('time');
		expect(setCounts(20, 300_000, t + 120_000, now).reason).toBe('clock');
		expect(setCounts(20, 300_000, t - 2 * 86400_000, now).reason).toBe('clock');
	});

	test('streak grows a day at a time, freeze cards cover missed days', () => {
		let s = { streak: 0, streakDay: null as string | null, bestStreak: 0, freezes: 0 };
		for (let i = 0; i < 7; i++) s = touchStreak(s, addDays('2026-11-01', i));
		expect(s.streak).toBe(7);
		expect(s.freezes).toBe(1);
		expect(touchStreak(s, '2026-11-07').changed).toBe(false);
		// skip 11-08, come back 11-09: one freeze used
		const t = touchStreak(s, '2026-11-09');
		expect(t.streak).toBe(8);
		expect(t.usedFreezes).toBe(1);
		expect(t.freezes).toBe(0);
		// two days missed without freezes: restart
		expect(streakNow(t, '2026-11-12').days).toBe(0);
		expect(touchStreak(t, '2026-11-12').streak).toBe(1);
	});

	test('a retry draws questions not asked last time first', () => {
		const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(id => ({ id }));
		const first = drawQuestions(pool, 5, []);
		const second = drawQuestions(pool, 5, first.map(q => q.id));
		expect(second.slice(0, 3).every(q => !first.some(f => f.id === q.id))).toBe(true);
	});

	test.skipIf(noContent).each(CONTENT ?? [])('chapter $no data is sound', ch => {
		const ids = new Set(ch.nodes.map(n => n.id));
		expect(ids.has(ch.startId)).toBe(true);
		expect(ids.has(ch.bossId)).toBe(true);
		// 第二章起的 id 不跟第一章撞
		if (ch.no > 1) for (const id of ids) expect(QUEST_CH1.nodes.some(n => n.id === id)).toBe(false);
		for (const [a, b, branch] of ch.edges) {
			expect(ids.has(a) && ids.has(b)).toBe(true);
			expect(typeof branch).toBe('string');
		}
		let total = 0;
		for (const n of ch.nodes) {
			expect(n.ch).toBe(ch.no);
			if (n.kind !== 'level' && n.kind !== 'boss') continue;
			total += n.pool!.length;
			for (const set of n.sets) expect(n.pool!.filter(x => x.set === set).length).toBeGreaterThanOrEqual(n.ask!);
			for (const x of n.pool!) {
				// the answer is right by the server's own judging, and has its evidence
				expect(judge(x, x.answer)).toBe(true);
				expect(x.evidence.length).toBeGreaterThan(0);
				if (x.type === 'choice' || x.type === 'TFNG' || x.type === 'YNNG') {
					expect(x.options!.some(o => o.key === x.answer)).toBe(true);
					for (const o of x.options!) if (o.key !== x.answer) expect(x.causes![o.key]).toBeTruthy();
				} else if (x.type === 'multi') {
					expect(x.answer.split(',')).toHaveLength(x.pick!);
					expect(x.bothWrongCause).toBeTruthy();
				} else {
					expect(x.cause).toBeTruthy();
				}
				if (x.chips && x.type === 'build') expect(judge(x, x.chips.join(' '))).toBe(x.chips.join(' ').toLowerCase() === x.answer.toLowerCase());
				if (x.audio) for (const v of Object.values(x.audio.voices)) expect(lojoVoiceIds).toContain(v);
			}
		}
		expect(total).toBe(138);
		for (const c of ch.causeOrder) expect(typeof c).toBe('string');
	});

	test('books', () => {
		expect(QUEST_BOOKS.length).toBe(10);
		for (const b of QUEST_BOOKS) expect(b.quiz).toHaveLength(3);
		if (noContent) return;
		for (const n of QUEST_CH1.nodes) for (const r of n.shelf) expect(QUEST_BOOKS.some(b => b.ref === r)).toBe(true);
	});

	test('选两个: both right, one right is half, none right is wrong', () => {
		const m = q({ type: 'multi', answer: 'C,E', pick: 2, bothWrongCause: 'paraphrase', options: ['A', 'B', 'C', 'D', 'E'].map(k => ({ key: k, text: k })) });
		expect(grade(m, 'E,C')).toBe('right');
		expect(judge(m, 'c, e')).toBe(true);
		expect(grade(m, 'C,D')).toBe('half');
		expect(grade(m, 'A,B')).toBe('wrong');
		expect(grade(m, 'C')).toBe('half');
		expect(grade(m, 'C,E,A')).toBe('half');
		expect(wrongCause(m, 'A,C')).toBe('half-right');
		expect(wrongCause(m, 'A,B')).toBe('paraphrase');
		expect(displayAnswer(m)).toBe('C. C / E. E');
		const yn = q({ type: 'YNNG', answer: 'NOT GIVEN', options: [{ key: 'YES', text: 'YES' }, { key: 'NO', text: 'NO' }, { key: 'NOT GIVEN', text: 'NOT GIVEN' }], causes: { YES: 'fact-opinion', NO: 'qualifier' } });
		expect(judge(yn, 'not given')).toBe(true);
		expect(wrongCause(yn, 'NO')).toBe('qualifier');
	});

	test.skipIf(noContent)('主错因 ties go by the chapter order', () => {
		expect(mainCause(['vocab', 'time-out'], QUEST_CH4.causeOrder)).toBe('time-out');
		expect(mainCause(['vocab', 'grammar'])).toBe('grammar');
	});

	test.skipIf(noContent)('the timed levels of chapter 4', () => {
		const timed = QUEST_CH4.nodes.filter(n => n.timed != null);
		expect(timed.map(n => n.id).sort()).toEqual(['4-6', '4-boss']);
		const boss = timed.find(n => n.kind === 'boss')!.timed!;
		expect(boss.hitsBoss).toBe(false);
		expect(boss.maxHeartsPerTry).toBe(2);
		expect(timed.find(n => n.id === '4-6')!.timed!.timeoutHeartCost).toBe(1);
		expect(QUEST_CH3.nodes.find(n => n.id === '3-3')!.keepOrder).toBe(true);
	});

	test('answers are judged after trim, end punctuation, case and spaces', () => {
		const gap = q({ answer: 'Hillside Road', accept: ['Hillside Rd'] });
		expect(judge(gap, '  hillside road. ')).toBe(true);
		expect(judge(gap, 'Hillside  Rd')).toBe(true);
		expect(judge(gap, '')).toBe(false);
		const code = q({ answer: 'CB2 3QF', ignoreSpaces: true });
		expect(judge(code, 'cb23qf')).toBe(true);
		const cased = q({ answer: 'Smith', caseInsensitive: false });
		expect(judge(cased, 'smith')).toBe(false);
		const choice = q({ type: 'choice', answer: 'B', options: [{ key: 'A', text: 'bus' }, { key: 'B', text: 'train' }], causes: { A: 'same-word' } });
		expect(judge(choice, 'b')).toBe(true);
		expect(displayAnswer(choice)).toBe('B. train');
		expect(displayAnswer(choice, 'A')).toBe('A. bus');
	});

	test('wrong answers get a cause; near-misses in gaps are spelling', () => {
		expect(isSpellingSlip('libary', 'library')).toBe(true);
		expect(isSpellingSlip('apples', 'apple')).toBe(true);
		expect(isSpellingSlip('cat', 'car')).toBe(false);
		expect(isSpellingSlip('14', '40')).toBe(false);
		expect(wrongCause(q({ answer: 'library' }), 'libary')).toBe('spelling');
		expect(wrongCause(q({ answer: 'library' }), 'museum')).toBe('not-heard');
		expect(wrongCause(q({ type: 'TFNG', answer: 'FALSE', causes: { TRUE: 'same-word', 'NOT GIVEN': 'not-given' } }), 'true')).toBe('same-word');
		expect(wrongCause(q({ type: 'build', answer: 'a b', cause: 'grammar' }), 'b a')).toBe('grammar');
	});

	test('main cause: most often, ties by too-hard > grammar > vocab > not-given > same-word > not-heard > spelling', () => {
		expect(mainCause([])).toBe(null);
		expect(mainCause(['spelling', 'spelling', 'vocab'])).toBe('spelling');
		expect(mainCause(['spelling', 'not-heard'])).toBe('not-heard');
		expect(mainCause(['same-word', 'not-given'])).toBe('not-given');
		expect(mainCause(['vocab', 'too-hard'])).toBe('too-hard');
	});

	test('sets come in turn, then mixed without last try\'s questions', () => {
		const pool = ['A', 'B'].flatMap(set => [1, 2, 3, 4, 5].map(i => ({ id: `${set}${i}`, set })));
		const a = pickSet(pool, ['A', 'B'], 5);
		expect(a.set).toBe('A');
		expect(a.questions.every(x => x.set === 'A')).toBe(true);
		const b = pickSet(pool, ['A', 'B'], 5, a.used);
		expect(b.set).toBe('B');
		const mixed = pickSet(pool, ['A', 'B'], 5, b.used, b.questions.map(x => x.id));
		expect(mixed.set).toBe(null);
		expect(mixed.questions.every(x => x.set === 'A')).toBe(true);
	});

	test('stars, fading and the shelf', () => {
		expect(starsAfter(0, { retest: false, perfect: false })).toBe(1);
		expect(starsAfter(0, { retest: false, perfect: true })).toBe(2);
		expect(starsAfter(2, { retest: false, perfect: false })).toBe(2);
		expect(starsAfter(2, { retest: true, perfect: false })).toBe(3);
		expect(starsAfter(3, { retest: true, perfect: true })).toBe(3);
		expect(ageOf('2026-11-04', '2026-11-10')).toBe(null);
		expect(ageOf('2026-11-03', '2026-11-10')).toBe('fade');
		expect(ageOf('2026-10-27', '2026-11-10')).toBe('gray');
		expect(shelfFor(['j4', 'j6', 'j7'], null, 1)).toEqual(['j4', 'j6', 'j7']);
		expect(shelfFor(['j4', 'j6', 'j7'], 'j6', 1)).toEqual(['j6', 'j4', 'j7']);
		expect(shelfFor(['j4', 'j6', 'j3'], 'j9', 1)).toEqual(['j9', 'j4', 'j6']);
		expect(shelfFor(['j4', 'j6', 'j3'], 'j9', 2)).toEqual(['j7', 'j4', 'j6']);
	});

	test('book gear: level gear, wordbook fallback, no graded reading on low hearts', () => {
		const j5 = QUEST_BOOKS.find(b => b.ref === 'j5')!;
		const j7 = QUEST_BOOKS.find(b => b.ref === 'j7')!;
		expect(bookGear(j7, 'dictation', { wordbookLow: false, hearts: 5 })).toBe('dictation');
		if (j5.gear === 'wordbook') {
			expect(bookGear(j5, null, { wordbookLow: false, hearts: 5 })).toBe('wordbook');
			expect(bookGear(j5, null, { wordbookLow: true, hearts: 5 })).toBe('vocab:5.4');
		}
		expect(gearPath('graded-reading').givesHeart).toBe(false);
		expect(gearPath('vocab:5.4').path).toBe('/vocab/5.4?tab=practice&scope=all');
	});

	test('behind: at the last 7 days\' pace, 2 or more levels short of the exam', () => {
		const order = ['1-1', '1-2', '1-3', '1-4', '1-5', 'boss'];
		expect(behindOf({ order, passed: {}, today: '2026-11-10', daysLeft: null })).toBe(null);
		const slow = behindOf({ order, passed: { '1-1': '2026-11-09' }, today: '2026-11-10', daysLeft: 7 });
		expect(slow?.target).toBe('1-3');
		expect(slow?.n).toBe(3);
		expect(slow?.copy).toContain('1-3');
		expect(behindOf({ order, passed: { '1-1': '2026-11-09' }, today: '2026-11-10', daysLeft: 35 })).toBe(null);
	});

	test('exam date: a real day after today, within 2 years', () => {
		expect(examDateOk('2026-12-05', '2026-11-10')).toBe(true);
		expect(examDateOk('2026-11-10', '2026-11-10')).toBe(false);
		expect(examDateOk('2026-02-30', '2026-01-10')).toBe(false);
		expect(examDateOk('2028-11-10', '2026-11-10')).toBe(true);
		expect(examDateOk('2028-11-11', '2026-11-10')).toBe(false);
		expect(examDateOk('12/05/2026', '2026-11-10')).toBe(false);
	});

	test('coming back: freeze cards cover missed days, or the streak is lost, once', () => {
		const s = { streak: 9, streakDay: '2026-11-07', bestStreak: 12, freezes: 2 };
		const f = settleStreak(s, '2026-11-10');
		expect(f.notice).toEqual({ kind: 'freeze', used: 2 });
		expect(f.state.streakDay).toBe('2026-11-09');
		expect(f.state.freezes).toBe(0);
		expect(settleStreak(f.state, '2026-11-10').notice).toBe(null);
		const l = settleStreak({ ...s, freezes: 0 }, '2026-11-10');
		expect(l.notice).toEqual({ kind: 'lost', days: 9, best: 12 });
		expect(settleStreak(l.state, '2026-11-10').notice).toBe(null);
	});

	test('numbers come from numbers.json', () => {
		expect(QUEST_NUMBERS.level.questionsPerTry).toBe(5);
		expect(QUEST_NUMBERS.boss.hp).toBe(5);
	});
});

describe('闯关 import check (lojo/quest/content-import)', () => {
	test.skipIf(noContent)('the four chapters pass, and keep every level id', () => {
		const ids = CONTENT!.flatMap(c => c.nodes.map(n => n.id));
		expect(questContentProblems(CONTENT, ids)).toEqual([]);
	});

	test.skipIf(noContent)('a batch is refused whole for one bad question, a lost level or a missing chapter 1', () => {
		const copy = (): QuestChapter[] => JSON.parse(JSON.stringify(CONTENT));
		const bad = copy();
		const level = bad[2].nodes.find(n => n.pool?.some(x => x.type === 'choice'))!;
		level.pool!.find(x => x.type === 'choice')!.answer = 'Z';
		const p = questContentProblems(bad);
		expect(p.length).toBe(1);
		expect(p[0]).toContain(level.id);
		const lost = copy();
		lost[1].nodes = lost[1].nodes.filter(n => n.id !== '2-3');
		lost[1].edges = lost[1].edges.filter(e => e[0] !== '2-3' && e[1] !== '2-3');
		expect(questContentProblems(lost, ['1-1', '2-3']).join()).toContain('2-3');
		expect(questContentProblems(copy().slice(1)).join()).toContain('第一章');
		expect(questContentProblems([])).toEqual(['没有章节']);
		expect(questContentProblems({ no: 1 })).toEqual(['没有章节']);
	});
});
