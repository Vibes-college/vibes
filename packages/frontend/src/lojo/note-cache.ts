/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Misskey from 'misskey-js';

// Notes already shown in a timeline, so the note page can draw one at once and refresh it in the background.
// From mainland China every round trip takes about 0.2 s (measured 2026-10-24). In memory only, newest kept.
const MAX_NOTES = 300;
const notes = new Map<string, Misskey.entities.Note>();

export function rememberNote(note: Misskey.entities.Note): void {
	notes.delete(note.id);
	notes.set(note.id, note);
	if (notes.size > MAX_NOTES) {
		const oldest = notes.keys().next().value;
		if (oldest != null) notes.delete(oldest);
	}
}

export function recallNote(id: string): Misskey.entities.Note | null {
	return notes.get(id) ?? null;
}

// What a reader can see change between the remembered copy and the fresh one.
export function visibleNoteState(note: Misskey.entities.Note): string {
	return JSON.stringify([
		note.text, note.cw, note.reactions, note.reactionCount, note.myReaction ?? null,
		note.repliesCount, note.renoteCount, note.fileIds, note.poll?.choices.map(choice => choice.votes) ?? null,
	]);
}
