/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 6 号线 · 语法: the speaker on each example sentence. Read by our Fish Audio voices through lojo/english/speech, which
// makes each (voice, text) once and keeps it for everyone; this page also keeps the URLs it was given. As 听写 does:
// a British voice, unless the learner has picked one for read-aloud.
import { computed, ref } from 'vue';
import type { EnglishVoice } from '@/lojo/english/api.js';
import { englishErrorText, englishStatus, speechUrl } from '@/lojo/english/api.js';
import { englishLabels } from '@/lojo/english/labels.js';
import { voiceId } from '@/lojo/english/speech.js';
import { releaseAudioFocus, takeAudioFocus } from '@/lojo/audio.js';
import * as os from '@/os.js';

export const grammarVoice = computed<EnglishVoice | null>(() => {
	const { voices, defaultVoice } = englishStatus.value;
	return voices.find(v => v.id === voiceId.value)
		?? voices.find(v => v.accent === 'uk')
		?? voices.find(v => v.id === defaultVoice)
		?? voices.at(0) ?? null;
});

// the example being read (or fetched to be read), and whether it is still being fetched
export const sayingKey = ref<string | null>(null);
export const sayLoading = ref(false);

// iOS only lets audio start inside a tap; playing this silent clip during the tap unlocks the element for later.
const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
// the server's errors that say more than "it failed"
const TOLD = ['LOJO_ENGLISH_UNAVAILABLE', 'RATE_LIMIT_EXCEEDED', 'LOJO_ENGLISH_QUOTA_EXCEEDED'];
let el: HTMLAudioElement | null = null;
let run = 0;
const urls = new Map<string, Promise<string>>();

function player(): HTMLAudioElement {
	el ??= new Audio();
	return el;
}

export function stopSaying(): void {
	run++;
	el?.pause();
	sayingKey.value = null;
	sayLoading.value = false;
	releaseAudioFocus(focus);
}

// A chat voice message or a read-aloud that starts stops this, and the other way round.
const focus = { pause: stopSaying };

function urlOf(text: string): Promise<string> {
	const voice = grammarVoice.value?.id ?? '';
	const key = `${voice}|${text}`;
	let p = urls.get(key);
	if (p == null) {
		p = speechUrl({ text }, voice);
		p.catch(() => urls.delete(key));
		urls.set(key, p);
	}
	return p;
}

// Called inside the tap. The same sentence again stops it; another one stops the one before.
export async function toggleSay(key: string, text: string): Promise<void> {
	const again = sayingKey.value === key;
	stopSaying();
	if (again) return;
	const a = player();
	a.src = SILENT;
	a.play().catch(() => undefined);
	takeAudioFocus(focus);
	const mine = run;
	sayingKey.value = key;
	sayLoading.value = true;
	try {
		const url = await urlOf(text);
		if (mine !== run) return;
		a.src = url;
		a.onended = () => {
			if (mine === run) stopSaying();
		};
		sayLoading.value = false;
		await a.play();
	} catch (err) {
		if (mine !== run) return;
		stopSaying();
		const code = (err as { code?: string } | null)?.code;
		os.toast(code != null && TOLD.includes(code) ? englishErrorText(err) : englishLabels.speechFailed);
	}
}
