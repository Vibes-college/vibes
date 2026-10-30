/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 0 号线's recordings: stop 3's sentences and stop 2's words, read by our Fish Audio voices through lojo/english/speech.
// The server makes each (voice, text) once and keeps it for everyone. A stop's recordings are downloaded before it
// starts, so its timing doesn't depend on the network.
import { computed, ref } from 'vue';
import type { EnglishVoice } from '@/lojo/english/api.js';
import { englishStatus, speechUrl } from '@/lojo/english/api.js';
import { voiceId } from '@/lojo/english/speech.js';
import { releaseAudioFocus, takeAudioFocus } from '@/lojo/audio.js';

// Test recordings are mostly British: a British voice, unless the learner has picked one for read-aloud.
export const typingVoice = computed<EnglishVoice | null>(() => {
	const { voices, defaultVoice } = englishStatus.value;
	return voices.find(v => v.id === voiceId.value)
		?? voices.find(v => v.accent === 'uk')
		?? voices.find(v => v.id === defaultVoice)
		?? voices.at(0) ?? null;
});

// What the intro's "试听一句" reads.
export const SOUND_CHECK = 'This is a sound check. If you can hear this clearly, you are ready.';

// iOS only lets audio start inside a tap; playing this silent clip during the tap unlocks the element for later.
const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
let el: HTMLAudioElement | null = null;

function player(): HTMLAudioElement {
	el ??= new Audio();
	return el;
}

// voice|text → what to play: the recording downloaded, or the server's address when it couldn't be downloaded
const clips = new Map<string, Promise<string>>();

async function download(url: string): Promise<string> {
	try {
		const res = await window.fetch(url);
		if (!res.ok) return url;
		return URL.createObjectURL(await res.blob());
	} catch {
		return url;
	}
}

export function loadClip(text: string): Promise<string> {
	const voice = typingVoice.value?.id ?? '';
	const key = `${voice}|${text}`;
	let p = clips.get(key);
	if (p == null) {
		p = speechUrl({ text }, voice).then(download);
		p.catch(() => clips.delete(key));
		clips.set(key, p);
	}
	return p;
}

// Every one of them, three at a time; one that fails is asked for once more. Resolves whether all of them are ready
// (it stops at the first that can't be made: the stop then uses captions).
export async function loadClips(texts: string[], onReady?: (done: number) => void): Promise<boolean> {
	let next = 0;
	let done = 0;
	let ok = true;

	async function worker() {
		while (ok && next < texts.length) {
			const text = texts[next++];
			const got = await loadClip(text).then(() => true, () => loadClip(text).then(() => true, () => false));
			if (!got) ok = false;
			else onReady?.(++done);
		}
	}

	await Promise.all([worker(), worker(), worker()]);
	return ok;
}

// The text whose recording is playing (or being fetched to play); for the buttons that show it.
export const clipText = ref<string | null>(null);
export const clipLoading = ref(false);

type Playing = { text: string; done: (ok: boolean) => void; paused: boolean; ready: boolean };
let current: Playing | null = null;

// A chat voice message or a read-aloud that starts stops this.
const focus = { pause: (): void => stopClip() };

function settle(ok: boolean): void {
	const c = current;
	current = null;
	clipText.value = null;
	clipLoading.value = false;
	if (el != null) {
		el.onended = null;
		el.onerror = null;
	}
	c?.done(ok);
}

export function stopClip(): void {
	el?.pause();
	settle(false);
	releaseAudioFocus(focus);
}

// Call inside the tap that starts a stop.
export function unlockTypingAudio(): void {
	const a = player();
	a.src = SILENT;
	a.play().catch(() => undefined);
}

// From the start. Resolves true once it has played to its end; false if it couldn't play, or was stopped (by another
// recording, a voice message, or the stop ending).
export function playClip(text: string): Promise<boolean> {
	stopClip();
	return new Promise<boolean>(resolve => {
		const me: Playing = { text, done: resolve, paused: false, ready: false };
		current = me;
		clipText.value = text;
		clipLoading.value = true;
		takeAudioFocus(focus);
		loadClip(text).then(url => {
			if (current !== me) return;
			const a = player();
			a.onended = () => {
				if (current === me) settle(true);
			};
			a.onerror = () => {
				if (current === me) settle(false);
			};
			a.src = url;
			me.ready = true;
			clipLoading.value = false;
			if (!me.paused) start(me);
		}, () => {
			if (current === me) settle(false);
		});
	});
}

function start(me: Playing): void {
	player().play().catch(() => {
		// paused on purpose (the page was left) is not a failure: it goes on when the page is back
		if (current === me && !me.paused) settle(false);
	});
}

// The page is out of sight: the recording waits where it is.
export function pauseClip(): void {
	if (current == null) return;
	current.paused = true;
	el?.pause();
}

export function resumeClip(): void {
	const c = current;
	if (c == null || !c.paused) return;
	c.paused = false;
	if (c.ready) start(c);
}
