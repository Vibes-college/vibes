/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// What 0 号线's screens share about being on screen. Pages are kept alive (KeepAlive) after they are left, so a stop
// left half way waits as it was: no keys, no sound, its clock stopped, until the learner comes back.
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue';
import { createClock } from './clock.js';
import type { Ref } from 'vue';
import type { Clock } from './clock.js';
import MkPageWindow from '@/components/MkPageWindow.vue';
import * as os from '@/os.js';

// Whether the page is on screen: shown, not kept in the background, and its tab or app not hidden. `show` and `hide`
// are called as that changes, and `hide` once more when the component goes.
export function useOnScreen(cb: { show?: () => void; hide?: () => void } = {}): Ref<boolean> {
	const shown = ref(false);
	let active = false;

	function update() {
		const next = active && window.document.visibilityState !== 'hidden';
		if (next === shown.value) return;
		shown.value = next;
		if (next) cb.show?.();
		else cb.hide?.();
	}

	onMounted(() => {
		active = true;
		window.document.addEventListener('visibilitychange', update);
		update();
	});
	// also called after the first mount inside a KeepAlive
	onActivated(() => {
		active = true;
		update();
	});
	onDeactivated(() => {
		active = false;
		update();
	});
	onBeforeUnmount(() => {
		active = false;
		window.document.removeEventListener('visibilitychange', update);
		update();
	});
	return shown;
}

// A keydown listener on the window, only while the page is shown; with capture, before the site's own shortcuts.
export function useWindowKeys(handler: (ev: KeyboardEvent) => void, capture = false): void {
	let on = false;
	const add = () => {
		if (on) return;
		window.addEventListener('keydown', handler, { capture });
		on = true;
	};
	const remove = () => {
		if (!on) return;
		window.removeEventListener('keydown', handler, { capture });
		on = false;
	};
	onMounted(add);
	onActivated(add);
	onDeactivated(remove);
	onBeforeUnmount(remove);
}

// Keys meant for this page: not once it is kept in the background, not under a dialog or an in-app window (the rest of
// the app is inert then, and the guides open in one), and not aimed at anything outside the page.
export function keysForUs(ev: KeyboardEvent, el: HTMLElement | null | undefined): boolean {
	if (el == null || !el.isConnected) return false;
	if (el.closest('[inert]') != null || os.popups.value.some(p => p.component === MkPageWindow)) return false;
	const target = ev.target;
	if (target === window.document.body || target === window.document.documentElement) return true;
	return target instanceof Node && (el.closest('[data-typing]') ?? el).contains(target);
}

// On a computer, a key typed while the focus is elsewhere on the page goes into the box: letters, signs and Backspace,
// unless the focus is in another box or Space is pressing a button. A Chinese keyboard's keys (229) are left alone.
export function wantsBox(ev: KeyboardEvent): boolean {
	if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.isComposing || ev.keyCode === 229) return false;
	if (ev.key.length !== 1 && ev.key !== 'Backspace') return false;
	const target = ev.target instanceof Element ? ev.target : null;
	if (target?.closest('input, textarea, select, [contenteditable="true"]') != null) return false;
	return !(ev.key === ' ' && target?.closest('button, a, summary') != null);
}

// A stop's clock, its timers and a tick for what shows the time: all of them run only while the page is on screen.
export type StopClock = {
	clock: Clock;
	// the clock's time, updated ten times a second while on screen
	now: Ref<number>;
	shown: Ref<boolean>;
	// `fn` after `ms` of the clock's time; returns a function that cancels it
	after(ms: number, fn: () => void): () => void;
	wait(ms: number): Promise<void>;
};

export function useStopClock(cb: { show?: () => void; hide?: () => void } = {}): StopClock {
	const clock = createClock();
	const now = ref(0);
	let waits: { at: number; fn: () => void }[] = [];
	let timer: number | null = null;

	function tick() {
		now.value = clock.now();
		const due = waits.filter(w => w.at <= now.value);
		if (due.length === 0) return;
		waits = waits.filter(w => w.at > now.value);
		for (const w of due) w.fn();
	}

	const shown = useOnScreen({
		show() {
			clock.start();
			timer ??= window.setInterval(tick, 100);
			cb.show?.();
			tick();
		},
		hide() {
			clock.pause();
			if (timer != null) window.clearInterval(timer);
			timer = null;
			now.value = clock.now();
			cb.hide?.();
		},
	});
	onBeforeUnmount(() => {
		waits = [];
	});

	function after(ms: number, fn: () => void): () => void {
		const w = { at: clock.now() + ms, fn };
		waits.push(w);
		return () => {
			waits = waits.filter(x => x !== w);
		};
	}

	return { clock, now, shown, after, wait: ms => new Promise<void>(resolve => after(ms, resolve)) };
}

// Full-width signs typed with a Chinese keyboard are turned into English ones; said once a visit.
let fullWidthSaid = false;
export function sayFullWidthOnce(text: string): void {
	if (fullWidthSaid) return;
	fullWidthSaid = true;
	os.toast(text);
}

// Copying letter by letter, the text is painted and the box itself unseen (or a mere strip on a phone): the cursor
// stays at the end, where the next letter goes. Arrow keys, Home / End and select-all don't move it.
const CARET_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);

export function holdCaret(ev: KeyboardEvent): void {
	if (CARET_KEYS.has(ev.key) || ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'a')) ev.preventDefault();
}

export function caretToEnd(el: HTMLInputElement | null | undefined): void {
	if (el == null) return;
	const n = el.value.length;
	try {
		el.setSelectionRange(n, n);
	} catch {
		// not a box with a cursor
	}
}

// Puts `text` into a box that holds something else, keeping the cursor where it was.
export function setBoxValue(el: HTMLInputElement | HTMLTextAreaElement, text: string): void {
	if (el.value === text) return;
	const cut = el.value.length - text.length;
	const pos = Math.max(0, (el.selectionStart ?? el.value.length) - cut);
	el.value = text;
	try {
		if (window.document.activeElement === el) el.setSelectionRange(pos, pos);
	} catch {
		// not a box with a cursor
	}
}
