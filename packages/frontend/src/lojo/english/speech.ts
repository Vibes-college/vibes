/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, ref } from 'vue';
import { englishErrorText, englishStatus, speechUrl } from './api.js';
import { englishLabels } from './labels.js';
import type { EnglishVoice } from './api.js';
import type { MenuItem } from '@/types/menu.js';
import * as os from '@/os.js';

// Read-aloud goes through the server (Fish Audio); one shared <audio> element plays everything.
export const speechSupported = computed(() => englishStatus.value.speech);
export const speakingKey = ref<string | null>(null);
export const loadingKey = ref<string | null>(null);

const VOICE_KEY = 'vibes:voice';
export const voiceId = ref(localStorage.getItem(VOICE_KEY) ?? '');
export const currentVoice = computed<EnglishVoice | null>(() => {
	const { voices, defaultVoice } = englishStatus.value;
	return voices.find(v => v.id === voiceId.value) ?? voices.find(v => v.id === defaultVoice) ?? (voices.length > 0 ? voices[0] : null);
});

// iOS only lets audio start inside a tap; playing this silent clip during the tap unlocks the element for later.
const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
let audio: HTMLAudioElement | null = null;
let run = 0;
const urls = new Map<string, string>();

function player(): HTMLAudioElement {
	audio ??= new Audio();
	return audio;
}

function stop() {
	run++;
	player().pause();
	speakingKey.value = null;
	loadingKey.value = null;
}

// Pressing the same button again stops it; starting another one stops the previous.
export async function toggleSpeak(key: string, text: string, source?: { noteId: string }): Promise<void> {
	const wasThis = speakingKey.value === key || loadingKey.value === key;
	stop();
	if (wasThis || !speechSupported.value) return;

	const voice = currentVoice.value?.id ?? '';
	const el = player();
	el.src = SILENT;
	el.play().catch(() => undefined);
	const myRun = run;
	loadingKey.value = key;
	try {
		const cacheKey = `${voice}|${source?.noteId ?? text}`;
		let url = urls.get(cacheKey);
		if (url == null) {
			url = await speechUrl(source ?? { text }, voice);
			urls.set(cacheKey, url);
		}
		if (myRun !== run) return;
		el.src = url;
		el.onended = () => {
			if (myRun === run) speakingKey.value = null;
		};
		loadingKey.value = null;
		speakingKey.value = key;
		await el.play();
	} catch (err) {
		if (myRun !== run) return;
		speakingKey.value = null;
		loadingKey.value = null;
		os.toast((err as { code?: string } | null)?.code ? englishErrorText(err) : englishLabels.speechFailed);
	}
}

// Called when a component that started speech goes away.
export function stopSpeaking(keyPrefix: string): void {
	if ([speakingKey.value, loadingKey.value].some(k => k?.startsWith(keyPrefix))) stop();
}

// Voices grouped by accent; picking one plays a short greeting in that voice.
export function openVoiceMenu(ev: MouseEvent): void {
	const items: MenuItem[] = [];
	for (const accent of ['us', 'uk', 'au'] as const) {
		const group = englishStatus.value.voices.filter(v => v.accent === accent);
		if (group.length === 0) continue;
		items.push({ type: 'label', text: englishLabels.accents[accent] });
		for (const v of group) {
			items.push({
				text: v.name,
				caption: v.label,
				icon: 'ti ti-microphone',
				active: computed(() => currentVoice.value?.id === v.id),
				action: () => {
					voiceId.value = v.id;
					localStorage.setItem(VOICE_KEY, v.id);
					os.toast(englishLabels.voiceChanged(v.name));
					toggleSpeak(`voice-greeting:${v.id}`, englishLabels.voiceGreeting(v.name));
				},
			});
		}
	}
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}
