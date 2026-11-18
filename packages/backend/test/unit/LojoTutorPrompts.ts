/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { fillPrompt, normalizeTutorPrompts } from '@/misc/lojo-tutor-prompts.js';
import { testPrompts } from '../misc/lojo-tutor-prompts.js';

describe('Momo\'s private words (registry key prompts)', () => {
	test('kept as written when every part is there', () => {
		expect(normalizeTutorPrompts(testPrompts)).toEqual(testPrompts);
		// no trimming: the prompt has to stay byte for byte the same
		expect(normalizeTutorPrompts({ ...testPrompts, notesHead: '  NOTES:  ' })?.notesHead).toBe('  NOTES:  ');
		expect(normalizeTutorPrompts({ ...testPrompts, extra: 'x' })).not.toHaveProperty('extra');
		expect(normalizeTutorPrompts({ ...testPrompts, card: { ...testPrompts.card, name: '  Testy ', extensions: undefined } })?.card).toEqual({ ...testPrompts.card, extensions: { vibes: { voice: 'uk-brit' } } });
	});

	test('the interface-language cue is optional (界面语言第②批): kept when it is text, left out otherwise', () => {
		expect(normalizeTutorPrompts({ ...testPrompts, uiLanguage: 'WRITE IN {{language}}' })?.uiLanguage).toBe('WRITE IN {{language}}');
		expect(normalizeTutorPrompts(testPrompts)).not.toHaveProperty('uiLanguage');
		expect(normalizeTutorPrompts({ ...testPrompts, uiLanguage: '' })).not.toHaveProperty('uiLanguage');
		expect(normalizeTutorPrompts({ ...testPrompts, uiLanguage: 3 })).not.toHaveProperty('uiLanguage');
		expect(normalizeTutorPrompts({ ...testPrompts, uiLanguage: 3 })).not.toBeNull();
	});

	test('none at all when a part is missing, empty or not text', () => {
		expect(normalizeTutorPrompts(null)).toBeNull();
		expect(normalizeTutorPrompts('x')).toBeNull();
		expect(normalizeTutorPrompts([testPrompts])).toBeNull();
		const { cueQuest: _cueQuest, ...noCue } = testPrompts;
		expect(normalizeTutorPrompts(noCue)).toBeNull();
		expect(normalizeTutorPrompts({ ...testPrompts, system: '' })).toBeNull();
		expect(normalizeTutorPrompts({ ...testPrompts, notesTask: 1 })).toBeNull();
		expect(normalizeTutorPrompts({ ...testPrompts, system: 'x'.repeat(20001) })).toBeNull();
		expect(normalizeTutorPrompts({ ...testPrompts, card: { ...testPrompts.card, name: ' ' } })).toBeNull();
		expect(normalizeTutorPrompts({ ...testPrompts, card: undefined })).toBeNull();
	});

	test('fills the gaps once and leaves the rest', () => {
		expect(fillPrompt('Hi {{name}}, {{name}}!', { name: 'Lin' })).toBe('Hi Lin, Lin!');
		// what is filled in is not read again
		expect(fillPrompt('{{a}} {{b}}', { a: '{{b}}', b: 'x' })).toBe('{{b}} x');
		expect(fillPrompt('{{a}}', { a: '$& $1 $$' })).toBe('$& $1 $$');
		// a gap with no value stays
		expect(fillPrompt('{{zzz}} {{toString}}', {})).toBe('{{zzz}} {{toString}}');
	});
});
