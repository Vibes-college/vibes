/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 听写's recordings. Signed in: each item's `say` read by our Fish Audio voices through the community's
// lojo/english/speech, as before the move (the server synthesizes each (voice, text) once and keeps it for everyone;
// this page also keeps the URLs it was given). Not signed in (the free try, formerly /dictation-try/): the course's own
// recordings in audio/<id>.mp3, made once with the open Kokoro model (tools/recordings.mjs); found by the text they read.
import { computed, ref } from 'vue';
import recordings from './recordings.json';
import type { EnglishVoice } from '@/lojo/english/api.js';
import { englishStatus, speechUrl } from '@/lojo/english/api.js';
import { voiceId } from '@/lojo/english/speech.js';
import { takeAudioFocus } from '@/lojo/audio.js';
import { $i } from '@/i.js';
import { APP_BASE } from '@/router.js';

const bySay = new Map(Object.entries(recordings as Record<string, { say: string; v: string }>).map(([id, r]) => [r.say, `${APP_BASE}audio/${id}.mp3?v=${r.v}`]));

// Not signed in: only the course's recordings (a gate's gaps need an account anyway).
export const ownRecordings = $i == null;
// Whether there is anything to play at all: the community's voices, or the recordings when not signed in.
export const canPlay = computed(() => ownRecordings || englishStatus.value.speech);

// Test recordings are mostly British: a British voice, unless the learner has picked one for read-aloud.
export const dictationVoice = computed<EnglishVoice | null>(() => {
	const { voices, defaultVoice } = englishStatus.value;
	return voices.find(v => v.id === voiceId.value)
		?? voices.find(v => v.accent === 'uk')
		?? voices.find(v => v.id === defaultVoice)
		?? voices.at(0) ?? null;
});

// loading: asking the server (the first time a text is read can take a few seconds); blocked: the browser wouldn't
// start it without a tap.
export type AudioState = 'idle' | 'loading' | 'playing' | 'blocked' | 'failed';
export const audioState = ref<AudioState>('idle');
// the item the state is about
export const audioKey = ref<string | null>(null);
// the server's error code when the recording couldn't be made (LOJO_ENGLISH_UNAVAILABLE, RATE_LIMIT_EXCEEDED…)
export const audioError = ref<string | null>(null);

// iOS only lets audio start inside a tap; playing this silent clip during the tap unlocks the element for later.
const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
let el: HTMLAudioElement | null = null;
let run = 0;
const urls = new Map<string, Promise<string>>();

function player(): HTMLAudioElement {
	el ??= new Audio();
	return el;
}

export function stopAudio(): void {
	run++;
	el?.pause();
	audioState.value = 'idle';
	audioKey.value = null;
}

// A chat voice message or a read-aloud that starts stops this, and the other way round.
const focus = { pause: stopAudio };

// Call inside the tap that starts a round.
export function unlockAudio(): void {
	const a = player();
	a.src = SILENT;
	a.play().catch(() => undefined);
}

export function audioUrl(text: string): Promise<string> {
	if (ownRecordings) {
		const own = bySay.get(text);
		return own != null ? Promise.resolve(own) : Promise.reject({ code: 'NO_RECORDING' });
	}
	const voice = dictationVoice.value?.id ?? '';
	const key = `${voice}|${text}`;
	let p = urls.get(key);
	if (p == null) {
		p = speechUrl({ text }, voice);
		p.catch(() => urls.delete(key));
		urls.set(key, p);
	}
	return p;
}

// The next item's recording, asked for early so it starts at once.
export function prefetchAudio(text: string): void {
	audioUrl(text).catch(() => undefined);
}

// From the start, whatever was playing. Resolves true once it is playing.
export async function playAudio(key: string, text: string): Promise<boolean> {
	stopAudio();
	const mine = run;
	takeAudioFocus(focus);
	audioKey.value = key;
	audioState.value = 'loading';
	audioError.value = null;
	let url: string;
	try {
		url = await audioUrl(text);
	} catch (err) {
		if (mine === run) {
			audioState.value = 'failed';
			audioError.value = (err as { code?: string } | null)?.code ?? null;
		}
		return false;
	}
	if (mine !== run) return false;
	const a = player();
	a.src = url;
	a.onended = () => {
		if (mine === run) audioState.value = 'idle';
	};
	try {
		await a.play();
	} catch (err) {
		if (mine === run) audioState.value = (err as { name?: string } | null)?.name === 'NotAllowedError' ? 'blocked' : 'failed';
		return false;
	}
	if (mine !== run) return false;
	audioState.value = 'playing';
	return true;
}
