/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	chatSearchFilter,
	chatSearchHits,
	mastraFreshMessages,
	mastraReportedUsage,
	tutorChatTurns,
	tutorFuseText,
	tutorListHas,
	tutorModelDownReason,
	tutorNowText,
	tutorOpenerReason,
	tutorProactiveState,
	tutorUnanswered,
	tutorUsageMeter,
} from '@/misc/lojo-tutor-chat.js';
import { emptyMemory } from '@/misc/lojo-tutor.js';
import { searchTerms } from '@/misc/lojo-tutor-progress.js';
import { testPrompts } from '../misc/lojo-tutor-prompts.js';
import type { MiChatMessage } from '@/models/ChatMessage.js';

const T = 'tutor';
const L = 'learner';
const msg = (id: string, from: string, text: string | null, fileId: string | null = null) => ({ id, fromUserId: from, text, fileId }) as MiChatMessage;

describe('chat turns for the model', () => {
	test('merges messages in a row and writes hers as JSON', () => {
		const turns = tutorChatTurns(T, [msg('1', L, 'hi'), msg('2', L, 'there'), msg('3', T, 'Hello!'), msg('4', T, 'How are you?'), msg('5', L, 'fine')]);
		expect(turns).toEqual([
			{ role: 'user', content: 'hi\nthere' },
			{ role: 'assistant', content: JSON.stringify({ messages: ['Hello!', 'How are you?'], voice: false }) },
			{ role: 'user', content: 'fine' },
		]);
	});

	test('leaves out the app\'s own lines: away messages, change cards, draft cards and 👉 links', () => {
		const turns = tutorChatTurns(T, [
			msg('1', T, 'Vibi 这会儿不在线，你的消息她回来会先看'),
			msg('1b', T, '我这会儿不在线，你的消息我回来会先看'),
			msg('2', T, '【任务改动】加了一个任务（改动号 c1，可以在「任务」页撤销）'),
			msg('3', T, '【给电脑的指令】（草稿号 d1）\nnpm test'),
			msg('4', T, 'Try again\n👉 闯关地图 https://x/quest'),
			msg('5', L, '👉 only a link'),
		]);
		expect(turns).toEqual([{ role: 'assistant', content: JSON.stringify({ messages: ['Try again'], voice: false }) }]);
	});

	test('a learner\'s away-looking text and a file without text are kept', () => {
		const turns = tutorChatTurns(T, [msg('1', L, 'Vibi 这会儿不在线?'), msg('2', L, null, 'f1'), msg('3', L, null)]);
		expect(turns).toEqual([{ role: 'user', content: 'Vibi 这会儿不在线?\n(sent a file)' }]);
	});
});

describe('what Mia on Mastra has not seen', () => {
	const chat = [msg('c1', T, 'check-in'), msg('c2', L, 'hey'), msg('c3', T, 'reply'), msg('c4', T, 'quest answer'), msg('c5', L, 'new q'), msg('c6', L, 'and more')];
	const ids = (m: MiChatMessage[]) => m.map(x => x.id);

	test('after the message she answered, minus the ones she sent herself', () => {
		expect(ids(mastraFreshMessages(chat, T, 'c2|1'))).toEqual(['c4', 'c5', 'c6']);
		expect(ids(mastraFreshMessages(chat, T, 'c2|2'))).toEqual(['c5', 'c6']);
		expect(ids(mastraFreshMessages(chat, T, 'c2|0'))).toEqual(['c3', 'c4', 'c5', 'c6']);
	});

	test('first time, or her mark is gone: since the tutor last wrote', () => {
		expect(ids(mastraFreshMessages(chat, T, null))).toEqual(['c5', 'c6']);
		expect(ids(mastraFreshMessages(chat, T, 'gone|1'))).toEqual(['c5', 'c6']);
		expect(ids(mastraFreshMessages([msg('b1', L, 'one'), msg('b2', L, 'two')], T, null))).toEqual(['b1', 'b2']);
	});
});

describe('does the learner\'s newest message still need an answer', () => {
	const id = (m: MiChatMessage | null) => m?.id ?? null;

	test('a message sent between the parts of her answer is answered (11-17 test site: it was dropped)', () => {
		const chat = [msg('l1', L, 'who are you'), msg('b1', T, 'I am Momo'), msg('l2', L, 'and Vibi?'), msg('b2', T, 'your study buddy')];
		expect(id(tutorUnanswered(chat, T, 'l1'))).toBe('l2');
		expect(id(tutorUnanswered(chat, T, 'l2'))).toBeNull();
	});

	test('her own message after it (a plan nudge, a quest answer) does not count as an answer', () => {
		const chat = [msg('l0', L, 'hi'), msg('b0', T, 'hey'), msg('l1', L, 'plan?'), msg('e1', T, 'You have 2 tasks left')];
		expect(id(tutorUnanswered(chat, T, 'l0'))).toBe('l1');
		expect(id(tutorUnanswered([msg('l1', L, 'hi'), msg('b1', T, 'hey'), msg('e1', T, 'tasks')], T, 'l1'))).toBeNull();
	});

	test('no record yet, or it is no longer in the chat: unanswered unless she wrote last', () => {
		expect(id(tutorUnanswered([msg('l1', L, 'hi'), msg('b1', T, 'hey'), msg('l2', L, 'again')], T, null))).toBe('l2');
		expect(id(tutorUnanswered([msg('l1', L, 'hi'), msg('b1', T, 'hey')], T, null))).toBeNull();
		expect(id(tutorUnanswered([msg('l1', L, 'hi'), msg('b1', T, 'hey'), msg('l2', L, 'again')], T, 'gone'))).toBe('l2');
		expect(id(tutorUnanswered([msg('l1', L, 'hi'), msg('b1', T, 'hey')], T, 'gone'))).toBeNull();
	});

	test('nothing from the learner: nothing to answer', () => {
		expect(tutorUnanswered([], T, null)).toBeNull();
		expect(tutorUnanswered([msg('b1', T, 'hey')], T, 'l1')).toBeNull();
	});
});

describe('switches, model errors and usage', () => {
	test('a user list in redis: all, ids with spaces, or nobody', () => {
		expect(tutorListHas('all', 'a')).toBe(true);
		expect(tutorListHas(' all ', 'a')).toBe(true);
		expect(tutorListHas('a, b ,c', 'b')).toBe(true);
		expect(tutorListHas('a,b', 'c')).toBe(false);
		expect(tutorListHas('ALL', 'a')).toBe(false);
		expect(tutorListHas('', 'a')).toBe(false);
		expect(tutorListHas(null, 'a')).toBe(false);
	});

	test('only HTTP 401 and 402 at the start mean the model account is down', () => {
		expect(tutorModelDownReason(new Error('HTTP 402 Payment Required'))).toBe('402');
		expect(tutorModelDownReason(new Error('HTTP 401'))).toBe('401');
		expect(tutorModelDownReason(new Error('HTTP 500 oops'))).toBeNull();
		expect(tutorModelDownReason(new Error('HTTP 4021'))).toBeNull();
		expect(tutorModelDownReason(new Error('error HTTP 402'))).toBeNull();
		expect(tutorModelDownReason('HTTP 402')).toBeNull();
	});

	test('the usage meter adds up calls, and is empty until the first', () => {
		const m = tutorUsageMeter();
		expect(m.total()).toBeNull();
		m.add({ hit: 1, miss: 2, out: 3 });
		m.add({ hit: 10, miss: 0, out: 5 });
		expect(m.total()).toEqual({ hit: 11, miss: 2, out: 8 });
		expect(tutorUsageMeter().total()).toBeNull();
	});

	test('the usage Mastra reported, or null when any of it is missing or lost', () => {
		expect(mastraReportedUsage({ hit: 1.7, miss: 2, out: 3 })).toEqual({ hit: 1, miss: 2, out: 3 });
		expect(mastraReportedUsage({ hit: 1, miss: 2, out: 3, unreported: 0 })).toEqual({ hit: 1, miss: 2, out: 3 });
		expect(mastraReportedUsage({ hit: 1, miss: 2, out: 3, unreported: 2 })).toBeNull();
		expect(mastraReportedUsage({ hit: -1, miss: 2, out: 3 })).toBeNull();
		expect(mastraReportedUsage({ hit: '1', miss: 2, out: 3 })).toBeNull();
		expect(mastraReportedUsage({ hit: 1, miss: 2 })).toBeNull();
		expect(mastraReportedUsage(undefined)).toBeNull();
		expect(mastraReportedUsage(null)).toBeNull();
	});
});

describe('time and openers', () => {
	test('the "now" line: day, weekday and part of the day in the tutor\'s time zone', () => {
		const at = new Date('2026-11-16T12:00:00Z');
		expect(tutorNowText('Asia/Shanghai', at)).toBe('2026-11-16 Monday evening (Beijing time)');
		expect(tutorNowText('America/Los_Angeles', at)).toBe('2026-11-16 Monday late at night (America/Los_Angeles)');
		expect(tutorNowText('America/Los_Angeles', new Date('2026-11-16T18:00:00Z'))).toBe('2026-11-16 Monday morning (America/Los_Angeles)');
		expect(tutorNowText('Asia/Shanghai', new Date('2026-11-16T15:30:00Z'))).toBe('2026-11-16 Monday late at night (Beijing time)');
		expect(tutorNowText('Asia/Shanghai', new Date('2026-11-16T16:30:00Z'))).toBe('2026-11-17 Tuesday late at night (Beijing time)');
		expect(tutorNowText('Asia/Shanghai', new Date('2026-11-16T06:00:00Z'))).toBe('2026-11-16 Monday afternoon (Beijing time)');
	});

	test('why she writes first: first time, an exam within three weeks, or a check-in', () => {
		const now = Date.parse('2026-11-16T12:00:00Z');
		const memory = emptyMemory();
		expect(tutorOpenerReason(testPrompts, memory, [], now)).toBe('FIRST');
		const some = [{ role: 'user' as const, content: 'x' }];
		expect(tutorOpenerReason(testPrompts, memory, some, now)).toBe('DAILY');
		memory.profile.examDate = '2026-11-20';
		expect(tutorOpenerReason(testPrompts, memory, some, now)).toBe('EXAM IN 4');
		memory.profile.examDate = '2026-12-30';
		expect(tutorOpenerReason(testPrompts, memory, some, now)).toBe('DAILY');
		memory.profile.examDate = '2026-11-10';
		expect(tutorOpenerReason(testPrompts, memory, some, now)).toBe('DAILY');
	});

	test('the "writes first" state from redis, old and new shapes', () => {
		expect(tutorProactiveState({}, null)).toEqual({ muted: false, lastProactiveAt: null, lastCheckInAt: null, proactiveTimes: [], unanswered: 0, lastLearnerAt: null, lastTutorAt: null });
		const old = tutorProactiveState({ lastProactiveAt: '1700', unanswered: '2' }, { proactive: false });
		expect(old).toMatchObject({ muted: true, lastProactiveAt: 1700, lastCheckInAt: 1700, proactiveTimes: [1700], unanswered: 2 });
		const now = tutorProactiveState({ lastProactiveAt: '5', proactiveTimes: '1,x,,5', lastTutorAt: 'abc' }, { proactive: true });
		expect(now).toMatchObject({ muted: false, lastCheckInAt: null, proactiveTimes: [1, 5], lastTutorAt: NaN });
	});

	test('the fuse texts say how much is used and the limit', () => {
		const half = tutorFuseText('half', 10001, 20000);
		expect(half.log).toBe('tutor daily fuse 50%: 10001 of 20000 model calls used today (UTC)');
		expect(half.header).toBe('Vibi 全站保险丝：今天已用一半');
		expect(half.body).toContain('已调用模型 10001 次，上限 20000');
		const full = tutorFuseText('full', 20001, 20000);
		expect(full.log).toContain('fuse blown: 20000');
		expect(full.header).toBe('Vibi 全站保险丝：今天已拉断');
		expect(full.body).toContain('已到上限 20000 次');
	});
});

describe('chat search', () => {
	test('one parameter per word, then the message to search before', () => {
		const terms = searchTerms('speaking o\'clock 雅思口语');
		const f = chatSearchFilter(T, L, terms, 'm9');
		expect(f.params[0]).toBe(T);
		expect(f.params[1]).toBe(L);
		expect(f.params[2]).toBe('speaking | oclock');
		expect(f.params.slice(3, -1)).toEqual(['%雅思%', '%思口%', '%口语%']);
		expect(f.params.at(-1)).toBe('m9');
		expect(f.match).toBe('to_tsvector(\'simple\', m."text") @@ to_tsquery(\'simple\', $3) OR m."text" LIKE $4 OR m."text" LIKE $5 OR m."text" LIKE $6');
		expect(f.before).toBe('AND m."id" < $7');
		expect(chatSearchFilter(T, L, searchTerms('口语'), null)).toEqual({ params: [T, L, '%口语%'], match: 'm."text" LIKE $3', before: '' });
	});

	test('hits: no away messages, best first then newest, cut to the limit', () => {
		const rows = [
			{ id: 'a1', fromUserId: L, text: 'speaking practice' },
			{ id: 'a2', fromUserId: T, text: 'Vibi 这会儿不在线 speaking practice' },
			{ id: 'a3', fromUserId: T, text: 'speaking' },
			{ id: 'a4', fromUserId: L, text: 'speaking' },
			{ id: 'a5', fromUserId: L, text: 'nothing' },
		];
		const terms = searchTerms('speaking practice');
		const at = (id: string) => new Date(Date.UTC(2026, 10, 1, 0, Number(id.slice(1))));
		const hits = chatSearchHits(rows, T, terms, at, {});
		expect(hits.map(h => [h.id, h.who, h.score])).toEqual([['a1', 'learner', 4], ['a4', 'learner', 2], ['a3', 'tutor', 2]]);
		expect(hits[0].at).toBe('2026-11-01T00:01:00.000Z');
		expect(chatSearchHits(rows, T, terms, at, { minScore: 3 }).map(h => h.id)).toEqual(['a1']);
		expect(chatSearchHits(rows, T, terms, at, { limit: 1 }).map(h => h.id)).toEqual(['a1']);
	});
});
