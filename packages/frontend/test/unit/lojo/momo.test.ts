/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { cleanPersonaName, DEFAULT_TUTOR_NAME, isSavableSeed, personaHeadUrl, personaHello, personaNameWarning, PERSONA_NAME_IDEAS, randomPersonaSeed } from '@/lojo/tutor/persona-rules.js';
import { localDay, peekLine } from '@/lojo/agent/peek.js';

// These lines are checked in Chinese (zh-CN UI); the English ones are in vibes-i18n.test.ts.
vi.mock('@@/js/config.js', async (orig) => ({ ...(await orig<typeof import('@@/js/config.js')>()), lang: 'zh-CN' }));

describe('the learner\'s own Momo: name rules', () => {
	test('the default name is Momo', () => {
		expect(DEFAULT_TUTOR_NAME).toBe('Momo');
	});
	test('names are cleaned: ends trimmed, inner spaces made one, line breaks and invisible characters taken out', () => {
		expect(cleanPersonaName('  豆  豆 \n')).toBe('豆 豆');
		expect(cleanPersonaName('Mo\u200Bmo')).toBe('Momo');
	});
	test('empty, longer than 10 characters, or pretending to be a teacher, staff or a real person: a warning in plain words', () => {
		expect(personaNameWarning('   ')).toContain('Momo');
		expect(personaNameWarning('一二三四五六七八九十')).toBeNull();
		expect(personaNameWarning('一二三四五六七八九十一')).toBe('最多 10 个字');
		expect(personaNameWarning('王老师')).toContain('老师');
		expect(personaNameWarning('Vibes 官方')).toContain('官方');
		expect(personaNameWarning('MyTeacher')).toContain('teacher');
		expect(personaNameWarning('豆豆')).toBeNull();
	});
	test('every suggested name passes', () => {
		for (const name of PERSONA_NAME_IDEAS) expect(personaNameWarning(name)).toBeNull();
	});
	test('emoji count as one character each', () => {
		expect(personaNameWarning('🐱🐱🐱🐱🐱🐱🐱🐱🐱🐱')).toBeNull();
	});
});

describe('the learner\'s own Momo: faces', () => {
	test('a new face is 10 letters or digits, which the server saves', () => {
		const seed = randomPersonaSeed();
		expect(seed).toMatch(/^[A-Za-z0-9]{10}$/);
		expect(isSavableSeed(seed)).toBe(true);
		expect(randomPersonaSeed(n => new Uint8Array(n))).toBe('aaaaaaaaaa');
	});
	test('the default face (momo:<id>) is not sent back as a choice', () => {
		expect(isSavableSeed('momo:9xyz')).toBe(false);
		expect(isSavableSeed('')).toBe(false);
		expect(isSavableSeed('a'.repeat(33))).toBe(false);
	});
	test('head links: outlined by default, the seed escaped', () => {
		expect(personaHeadUrl('abc')).toBe('/lojo-head/abc?v=2&sticker=1');
		expect(personaHeadUrl('momo:9xyz', false)).toBe('/lojo-head/momo%3A9xyz?v=2');
	});
	test('the hello says it is an AI in the first two sentences', () => {
		const hello = personaHello('豆豆');
		expect(hello.startsWith('嗨，我是 豆豆，')).toBe(true);
		expect(hello.split('。').slice(0, 2).join('。')).toContain('我是 AI，不是真人');
	});
});

describe('the peek in the corner: what it says', () => {
	const day = (date: string, statuses: string[], rest = false) => ({ date, rest, tasks: statuses.map(status => ({ status })) });
	test('this week: today is found among the days', () => {
		const d = { plan: {}, today: '2026-11-17', days: [day('2026-11-16', ['todo']), day('2026-11-17', ['done', 'todo', 'doing'])], todayView: null };
		expect(peekLine(d)).toBe('今天还有 2 个任务没做，来吗？');
	});
	test('another week asked for: today comes separately', () => {
		const d = { plan: {}, today: '2026-11-17', days: [], todayView: day('2026-11-17', ['todo']) };
		expect(peekLine(d)).toBe('今天还有 1 个任务没做，来吗？');
	});
	test('nothing to say: no plan, rest day, all done, or no tasks', () => {
		expect(peekLine(null)).toBeNull();
		expect(peekLine({ plan: null })).toBeNull();
		expect(peekLine({ plan: {}, today: '2026-11-17', days: [day('2026-11-17', ['todo'], true)] })).toBeNull();
		expect(peekLine({ plan: {}, today: '2026-11-17', days: [day('2026-11-17', ['done', 'done'])] })).toBeNull();
		expect(peekLine({ plan: {}, today: '2026-11-17', days: [day('2026-11-17', [])] })).toBeNull();
		expect(peekLine({ plan: {}, today: '2026-11-17', days: [day('2026-11-16', ['todo'])] })).toBeNull();
	});
	test('the day is the local date, YYYY-MM-DD', () => {
		expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
	});
});
