/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import type * as Misskey from 'misskey-js';
import { recallNote, rememberNote, visibleNoteState } from '@/lojo/note-cache.js';

function note(id: string, extra: Partial<Misskey.entities.Note> = {}): Misskey.entities.Note {
	return {
		id, text: 'Phrase of the day: "burn out"', cw: null, reactions: {}, reactionCount: 0, myReaction: null,
		repliesCount: 0, renoteCount: 0, fileIds: [], ...extra,
	} as unknown as Misskey.entities.Note;
}

describe('Vibes note cache', () => {
	test('gives back a note the timeline showed, and forgets the oldest past 300', () => {
		rememberNote(note('first'));
		expect(recallNote('first')?.id).toBe('first');
		for (let i = 0; i < 300; i++) rememberNote(note(`n${i}`));
		expect(recallNote('first')).toBeNull();
		expect(recallNote('n299')?.id).toBe('n299');
		expect(recallNote('missing')).toBeNull();
	});

	test('only a change a reader can see asks for a redraw', () => {
		const seen = note('a');
		expect(visibleNoteState(seen)).toBe(visibleNoteState(note('a')));
		expect(visibleNoteState(seen)).not.toBe(visibleNoteState(note('a', { reactions: { '❤': 1 }, reactionCount: 1 })));
		expect(visibleNoteState(seen)).not.toBe(visibleNoteState(note('a', { repliesCount: 2 })));
	});
});
