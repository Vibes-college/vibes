/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Our own translation table (lojo/locales/): the UI follows the language picked in settings, Chinese for zh-* and
// English for everything else (founder, 2026-11-17). Every Chinese word needs its English, and the English must not
// fall back to Chinese.

import { describe, expect, test } from 'vitest';
import { vibesLangOf } from '@/lojo/locales/lang.js';
import { agentTable } from '@/lojo/locales/agent.js';
import { appActionTable } from '@/lojo/locales/appAction.js';
import { chatTable } from '@/lojo/locales/chat.js';
import { learnTable } from '@/lojo/locales/learn.js';
import { miniAppsTable } from '@/lojo/locales/miniapps.js';
import { momoTable } from '@/lojo/locales/momo.js';
import { navTable } from '@/lojo/locales/nav.js';
import { postTable } from '@/lojo/locales/post.js';
import { settingsTable } from '@/lojo/locales/settings.js';
import { signupTable } from '@/lojo/locales/signup.js';
import { vibiTable } from '@/lojo/locales/vibi.js';

const TABLES = { agent: agentTable, appAction: appActionTable, chat: chatTable, learn: learnTable, miniapps: miniAppsTable, momo: momoTable, nav: navTable, post: postTable, settings: settingsTable, signup: signupTable, vibi: vibiTable };
const HAN = /[㐀-鿿]/;

// Call a word that takes values (a count, a name, a list of files) with sample values until one fits.
function sample(fn: (...a: never[]) => unknown): string {
	for (const args of [[2, 3, 4], ['Pip', 'Pip', 'Pip'], [['a.ts', 'b.ts'], 3]]) {
		try {
			const out = (fn as (...a: unknown[]) => unknown)(...args);
			if (typeof out === 'string') return out;
		} catch { /* try the next sample */ }
	}
	throw new Error('no sample fits');
}

// Every leaf of a table as [path, text].
function leaves(v: unknown, path: string): [string, string][] {
	if (typeof v === 'string') return [[path, v]];
	if (typeof v === 'function') return [[path, sample(v as () => unknown)]];
	if (Array.isArray(v)) return v.flatMap((x, i) => leaves(x, `${path}[${i}]`));
	if (v != null && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => leaves(x, `${path}.${k}`));
	return [];
}

function shape(v: unknown): unknown {
	if (typeof v === 'function') return 'fn';
	if (Array.isArray(v)) return 'list';
	if (v != null && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)]));
	return typeof v;
}

describe('which language the UI shows', () => {
	test('any Chinese gets Chinese', () => {
		for (const code of ['zh-CN', 'zh-TW', 'zh-HK', 'zh', 'ZH-cn']) expect(vibesLangOf(code)).toBe('zh');
	});
	test('every other language, or none, gets English', () => {
		for (const code of ['en-US', 'en-GB', 'ja-JP', 'ko-KR', 'fr-FR', '', null, undefined]) expect(vibesLangOf(code)).toBe('en');
	});
});

describe.each(Object.entries(TABLES))('the %s words', (_name, table) => {
	test('English has every word Chinese has, of the same kind', () => {
		expect(shape(table.en)).toEqual(shape(table.zh));
	});
	test('no Chinese left in the English', () => {
		const bad = leaves(table.en, 'en').filter(([, t]) => HAN.test(t));
		expect(bad).toEqual([]);
	});
	test('no word is empty in Chinese', () => {
		const empty = leaves(table.zh, 'zh').filter(([, t]) => t.trim() === '').map(([p]) => p);
		expect(empty).toEqual([]);
	});
});

describe('English that needs care', () => {
	test('Momo says it is an AI in the first two sentences, in English too', () => {
		const hello = momoTable.en.hello('Pip');
		expect(hello.startsWith('Hi, I\'m Pip.')).toBe(true);
		expect(hello.split('. ').slice(0, 2).join('. ')).toContain('I\'m an AI, not a real person');
	});
	test('one file, two files', () => {
		expect(agentTable.en.groupRead(1)).toBe('Read 1 file');
		expect(agentTable.en.groupRead(2)).toBe('Read 2 files');
		expect(agentTable.en.groupSearch(1)).toBe('Searched once');
		expect(learnTable.en.gridLearned(1)).toBe('Learned on 1 day in the past year');
		expect(learnTable.en.gridLearned(5)).toBe('Learned on 5 days in the past year');
	});
	test('the learning grid names months and days in English', () => {
		expect(learnTable.en.month(1)).toBe('Jan');
		expect(learnTable.en.month(12)).toBe('Dec');
		expect(learnTable.en.dayTip(learnTable.en.day(11, 3), learnTable.en.noRecord)).toBe('Nov 3: Nothing recorded');
	});
	test('the agent summary handed to Momo reads as one English line', () => {
		const parts = [agentTable.en.groupRead(2), agentTable.en.filesChanged(['a.ts'], 1)];
		expect(parts.join(agentTable.en.partsJoin)).toBe('Read 2 files; Files changed: a.ts');
	});
});
