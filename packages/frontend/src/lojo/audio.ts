/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Misskey from 'misskey-js';

// Vibes plays one sound at a time: a chat voice message or a read-aloud. Whatever starts pauses the one before.
type Player = { pause(): void };
let current: Player | null = null;

export function takeAudioFocus(player: Player): void {
	if (current != null && current !== player) current.pause();
	current = player;
}

export function releaseAudioFocus(player: Player): void {
	if (current === player) current = null;
}

// An AI tutor's voice reply is a chat message with an mp3 file and the transcript as its text.
export function isVoiceFile<T extends Pick<Misskey.entities.DriveFile, 'type'>>(file: T | null | undefined): file is T {
	return file != null && file.type.startsWith('audio/');
}

// Our read-aloud and tutor voice files are 64 kbit/s mp3 (LojoSpeechService, named vibes-voice-*), so their length
// follows from the size. A chat full of voice messages then opens without fetching any audio on a slow link.
export function estimatedVoiceSeconds(file: Pick<Misskey.entities.DriveFile, 'name' | 'size' | 'type'>): number {
	if (!file.name.startsWith('vibes-voice-') || file.type !== 'audio/mpeg' || !(file.size > 0)) return Number.NaN;
	return file.size * 8 / 64000;
}

// 65 seconds reads "1:05". A length the browser does not know (yet) reads as ''.
export function formatDuration(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '';
	const s = Math.round(seconds);
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// How much of the clip has played, from 0 to 1.
export function playedRatio(position: number, duration: number): number {
	if (!Number.isFinite(position) || !Number.isFinite(duration) || duration <= 0) return 0;
	return Math.min(1, Math.max(0, position / duration));
}

// "0:03 / 0:12" once the browser knows the length; before that only the time played, if any.
export function voiceTimeText(position: number, duration: number): string {
	const total = formatDuration(duration);
	const elapsed = formatDuration(position) || '0:00';
	if (total === '') return position > 0 ? elapsed : '';
	return `${elapsed} / ${total}`;
}
