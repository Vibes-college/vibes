/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';
import { englishLabels } from './labels.js';
import type * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { miLocalStorage } from '@/local-storage.js';
import { $i } from '@/i.js';

export type EnglishExplanation = Misskey.Endpoints['lojo/english/explain']['res'];
export type EnglishDraft = Misskey.Endpoints['lojo/english/compose']['res'];
export type EnglishReplyIdeas = Misskey.Endpoints['lojo/english/reply-ideas']['res'];
export type EnglishStatus = Misskey.Endpoints['lojo/english/status']['res'];
export type EnglishVoice = EnglishStatus['voices'][number];

export const englishStatus = ref<EnglishStatus>({ available: false, speech: false, defaultVoice: '', voices: [] });

let statusPromise: Promise<void> | null = null;
export function loadEnglishStatus(): Promise<void> {
	if ($i == null) return Promise.resolve();
	statusPromise ??= misskeyApi('lojo/english/status', {}).then(res => {
		englishStatus.value = res;
	}, () => {
		// Ask again later rather than on every newly rendered note.
		window.setTimeout(() => {
			statusPromise = null;
		}, 60 * 1000);
	});
	return statusPromise;
}

function lang(): 'zh-CN' | 'zh-TW' {
	return (miLocalStorage.getItem('lang') ?? navigator.language).startsWith('zh-TW') ? 'zh-TW' : 'zh-CN';
}

// Explanations are cached on the server too; this only avoids asking again in the same session.
const explanations = new Map<string, Promise<EnglishExplanation>>();
export function explainNote(noteId: string): Promise<EnglishExplanation> {
	let p = explanations.get(noteId);
	if (p == null) {
		p = misskeyApi('lojo/english/explain', { noteId, lang: lang() });
		p.catch(() => explanations.delete(noteId));
		explanations.set(noteId, p);
	}
	return p;
}

export function composeEnglish(text: string): Promise<EnglishDraft> {
	return misskeyApi('lojo/english/compose', { text });
}

export function replyIdeas(noteId: string, refresh: boolean): Promise<EnglishReplyIdeas> {
	return misskeyApi('lojo/english/reply-ideas', { noteId, refresh });
}

// Returns the shared audio URL; the server synthesizes each (voice, text) once.
type SpeechRequest = Misskey.Endpoints['lojo/english/speech']['req'];

export async function speechUrl(source: { noteId: string } | { text: string }, voice: string): Promise<string> {
	const req: SpeechRequest = 'text' in source ? { text: source.text.slice(0, 1500) } : { noteId: source.noteId };
	if (voice) req.voice = voice as SpeechRequest['voice'];
	const res = await misskeyApi('lojo/english/speech', req);
	return res.url;
}

export function englishErrorText(err: unknown): string {
	const code = (err as { code?: string } | null)?.code;
	if (code === 'LOJO_ENGLISH_UNAVAILABLE') return englishLabels.unavailable;
	if (code === 'RATE_LIMIT_EXCEEDED') return englishLabels.rateLimited;
	if (code === 'LOJO_ENGLISH_QUOTA_EXCEEDED') return englishLabels.quota;
	return englishLabels.failed;
}
