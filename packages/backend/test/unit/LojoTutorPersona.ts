/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { cleanPersonaName, defaultPersona, isPersonaSeed, normalizePersona, personaHello, personaNameProblem } from '@/misc/lojo-tutor-persona.js';
import { tutorPublic } from '@/misc/lojo-tutor.js';

describe('每个学员自己的 Momo', () => {
	test('not set yet: a face of their own (momo:<id>) and the name Momo', () => {
		expect(tutorPublic.name).toBe('Momo');
		expect(defaultPersona('9xyz')).toEqual({ seed: 'momo:9xyz', name: 'Momo', chosen: false });
		expect(normalizePersona(null, '9xyz')).toEqual(defaultPersona('9xyz'));
		expect(normalizePersona('Kiki', '9xyz')).toEqual(defaultPersona('9xyz'));
	});

	test('a saved face and name are kept', () => {
		expect(normalizePersona({ seed: 'aB3x9', name: '豆豆' }, 'u1')).toEqual({ seed: 'aB3x9', name: '豆豆', chosen: true });
		expect(normalizePersona({ seed: 'aB3x9', name: '  Kiki  ' }, 'u1').name).toBe('Kiki');
	});

	test('a bad seed or name falls back to the default one, the other is kept', () => {
		expect(normalizePersona({ seed: '<script>', name: 'Kiki' }, 'u1')).toEqual({ seed: 'momo:u1', name: 'Kiki', chosen: true });
		expect(normalizePersona({ seed: 'a'.repeat(33), name: 'Kiki' }, 'u1').seed).toBe('momo:u1');
		expect(normalizePersona({ seed: 'aB3', name: '张老师' }, 'u1')).toEqual({ seed: 'aB3', name: 'Momo', chosen: true });
		expect(normalizePersona({ seed: 'aB3', name: 42 }, 'u1').name).toBe('Momo');
	});

	test('names: at most 10 characters, no pretending to be staff, a teacher or a person', () => {
		expect(personaNameProblem('')).toBe('empty');
		expect(personaNameProblem('一二三四五六七八九十')).toBeNull();
		expect(personaNameProblem('一二三四五六七八九十一')).toBe('long');
		expect(personaNameProblem('😀😀😀😀😀😀😀😀😀😀')).toBeNull(); // emoji count as one each
		for (const name of ['王老师', '官方Momo', '客服小美', '真人陪练', '人工', '李教授', '助教', '管理员', 'Teacher K', 'OFFICIAL']) {
			expect(personaNameProblem(name)).toBe('banned');
		}
		expect(personaNameProblem('Leo')).toBeNull();
	});

	test('the site\'s prohibited words for user names apply too', () => {
		const isProhibited = (name: string) => name.includes('坏词');
		expect(personaNameProblem('小坏词', isProhibited)).toBe('banned');
		expect(normalizePersona({ seed: 'abc', name: '小坏词' }, 'u1', isProhibited).name).toBe('Momo');
	});

	test('control characters, line breaks and hidden characters are taken out', () => {
		expect(cleanPersonaName('Ki\nki')).toBe('Kiki');
		expect(cleanPersonaName('Ki​ki‮')).toBe('Kiki');
		expect(cleanPersonaName('  豆   豆 ')).toBe('豆 豆');
	});

	test('seeds: letters and digits, 1 to 32', () => {
		expect(isPersonaSeed('Qx7a')).toBe(true);
		expect(isPersonaSeed('momo:abc')).toBe(false); // the default is worked out, never saved
		expect(isPersonaSeed('')).toBe(false);
		expect(isPersonaSeed(7)).toBe(false);
	});

	test('the hello after signing up uses the new name and says it is an AI in the first two sentences', () => {
		const hello = personaHello('豆豆');
		expect(hello.startsWith('嗨，我是 豆豆，你的学搭子。我是 AI，不是真人')).toBe(true);
		expect(hello).not.toContain('Momo');
	});
});
