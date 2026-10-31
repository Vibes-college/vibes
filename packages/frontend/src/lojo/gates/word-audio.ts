/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 听音拼写 on a vocabulary paper: each word's recording, from the start, one at a time. Starting one stops the one
// before; a voice message or a read-aloud elsewhere on the site stops it too.
import { ref } from 'vue';
import { releaseAudioFocus, takeAudioFocus } from '@/lojo/audio.js';

export type WordAudioState = 'idle' | 'loading' | 'playing' | 'failed';

// the question whose word is loading, playing or failed
export const wordAudioKey = ref<string | null>(null);
export const wordAudioState = ref<WordAudioState>('idle');

let el: HTMLAudioElement | null = null;
let run = 0;
const focus = { pause: () => stopWordAudio() };

export function stopWordAudio(): void {
	run++;
	el?.pause();
	releaseAudioFocus(focus);
	wordAudioKey.value = null;
	wordAudioState.value = 'idle';
}

// Call inside the tap: iOS only plays sound that starts there. Resolves true once the word is playing; false when it
// couldn't play, or another word started first.
export async function playWord(key: string, url: string): Promise<boolean> {
	stopWordAudio();
	const mine = run;
	takeAudioFocus(focus);
	wordAudioKey.value = key;
	wordAudioState.value = 'loading';
	el ??= new Audio();
	const a = el;
	a.onended = () => {
		if (mine !== run) return;
		wordAudioKey.value = null;
		wordAudioState.value = 'idle';
		releaseAudioFocus(focus);
	};
	a.onerror = () => {
		if (mine === run) wordAudioState.value = 'failed';
	};
	a.src = url;
	try {
		await a.play();
	} catch {
		if (mine === run) wordAudioState.value = 'failed';
		return false;
	}
	if (mine !== run) return false;
	wordAudioState.value = 'playing';
	return true;
}
