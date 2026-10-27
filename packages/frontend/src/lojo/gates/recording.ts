/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The gate's recording: plays once, from start to end. There is no pause button and no seeking.
// If the browser stops it (a phone call, another app), it resumes from the same place; after a failed load, too.
import { ref } from 'vue';
import { silentWav } from './player.js';
import { releaseAudioFocus, takeAudioFocus } from '@/lojo/audio.js';

export type RecordingState = 'idle' | 'loading' | 'playing' | 'interrupted' | 'error' | 'ended';

const SEEK_ACTIONS: MediaSessionAction[] = ['seekto', 'seekbackward', 'seekforward'];

export function useRecording() {
	const state = ref<RecordingState>('idle');
	const position = ref(0);
	const duration = ref(Number.NaN);
	const buffering = ref(false);
	// The browser refused to start it on its own (an autoplay rule), so it waits for a tap.
	const blocked = ref(false);

	let el: HTMLAudioElement | null = null;
	let listeners: AbortController | null = null;
	// false while the element only holds the silent clip that unlocks it
	let armed = false;
	// where to pick up after a failed load
	let resumeAt: number | null = null;
	// our own jump back is under way, so the seek guard leaves it alone
	let settling = false;

	function audio(): HTMLAudioElement {
		if (el != null) return el;
		const a = new Audio();
		a.preload = 'auto';
		const ctrl = new AbortController();
		listeners = ctrl;
		const on = (type: string, fn: () => void) => a.addEventListener(type, () => {
			if (armed && !a.src.startsWith('data:')) fn();
		}, { signal: ctrl.signal });
		on('loadedmetadata', () => {
			if (Number.isFinite(a.duration)) duration.value = a.duration;
			if (resumeAt != null && resumeAt > 0) {
				settling = true;
				a.currentTime = resumeAt;
			}
			resumeAt = null;
		});
		on('durationchange', () => {
			if (Number.isFinite(a.duration)) duration.value = a.duration;
		});
		on('timeupdate', () => {
			// A reload reports 0:00 before it jumps back to where it stopped; keep showing the old place until then.
			if (!settling && !a.seeking && resumeAt == null) position.value = a.currentTime;
		});
		on('playing', () => {
			state.value = 'playing';
			buffering.value = false;
			blocked.value = false;
		});
		on('waiting', () => {
			buffering.value = true;
		});
		on('pause', () => {
			if (!a.ended && (state.value === 'playing' || state.value === 'loading')) state.value = 'interrupted';
			buffering.value = false;
		});
		on('ended', () => {
			state.value = 'ended';
			buffering.value = false;
			if (Number.isFinite(a.duration)) position.value = a.duration;
			releaseAudioFocus(a);
			lockSeeking(false);
		});
		on('error', () => {
			state.value = 'error';
			buffering.value = false;
		});
		// Only one pass through the recording: a seek from outside the page (lock screen, media keys) jumps back.
		on('seeking', () => {
			if (settling) return;
			if (Math.abs(a.currentTime - position.value) > 1) {
				settling = true;
				a.currentTime = position.value;
			}
		});
		on('seeked', () => {
			settling = false;
			position.value = a.currentTime;
		});
		el = a;
		return a;
	}

	function begin(a: HTMLAudioElement) {
		takeAudioFocus(a);
		a.play().catch((err: unknown) => {
			if (!armed) return;
			const name = err instanceof DOMException ? err.name : '';
			// a newer load or pause took over; its own events tell the rest
			if (name === 'AbortError') return;
			if (name === 'NotSupportedError') {
				state.value = 'error';
				return;
			}
			if (state.value === 'loading' || state.value === 'playing') {
				state.value = 'interrupted';
				blocked.value = name === 'NotAllowedError';
			}
		});
	}

	// Call this synchronously inside the tap that starts the gate, before any await:
	// iOS lets an audio element play later only if it first played during a tap.
	function unlock(): void {
		const a = audio();
		armed = false;
		a.src = silentWav();
		a.play().catch(() => { /* only unlocking */ });
	}

	function play(url: string, total: number): void {
		const a = audio();
		armed = true;
		resumeAt = null;
		settling = false;
		position.value = 0;
		duration.value = Number.isFinite(total) && total > 0 ? total : Number.NaN;
		buffering.value = false;
		blocked.value = false;
		state.value = 'loading';
		a.src = url;
		lockSeeking(true);
		begin(a);
	}

	// After the browser paused it on its own: carry on from the same place.
	function resume(): void {
		if (el == null || !armed || state.value !== 'interrupted') return;
		state.value = 'loading';
		begin(el);
	}

	// After a failed load: load again and pick up where it stopped.
	function retry(): void {
		if (el == null || !armed || state.value !== 'error') return;
		resumeAt = position.value;
		state.value = 'loading';
		el.load();
		begin(el);
	}

	// Leaving the page (kept alive in the background) stops the sound; coming back shows "继续播放".
	function suspend(): void {
		if (el != null && armed && !el.paused) el.pause();
	}

	function stop(): void {
		armed = false;
		resumeAt = null;
		settling = false;
		if (el != null) {
			el.pause();
			releaseAudioFocus(el);
			el.removeAttribute('src');
			el.load();
		}
		lockSeeking(false);
		state.value = 'idle';
		buffering.value = false;
		blocked.value = false;
	}

	function dispose(): void {
		stop();
		listeners?.abort();
		listeners = null;
		el = null;
	}

	return { state, position, duration, buffering, blocked, unlock, play, resume, retry, suspend, stop, dispose };
}

export type Recording = ReturnType<typeof useRecording>;

// The lock screen and headset controls must not skip through the recording either.
function lockSeeking(on: boolean): void {
	if (!('mediaSession' in navigator)) return;
	for (const action of SEEK_ACTIONS) {
		try {
			navigator.mediaSession.setActionHandler(action, on ? () => { /* the recording plays once, without seeking */ } : null);
		} catch {
			// this action is not supported here
		}
	}
}
