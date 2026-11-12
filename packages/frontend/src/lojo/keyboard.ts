/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes: the on-screen keyboard on phones (founder, 2026-11-11: on iPhone Safari, tapping the chat box showed the bottom
// bar above the keyboard and no box or send button).
//
// Why: the app is one 100dvh box with its own scroll areas. iOS Safari does not shrink the page when the keyboard
// opens; it slides the whole page up behind the keyboard instead. The chat box is stuck to the bottom of a scroll area
// inside that box, and iOS often fails to bring it into view (or to paint it) while the page is slid up, so what is
// left above the keyboard is the bottom bar. Android Chrome does the same since Chrome 108 (resizes-visual).
//
// Fix: while a text field has focus and the keyboard is up, the app box takes exactly the part of the screen the
// keyboard leaves (window.visualViewport) and the bottom bar steps aside, so the chat box sits right above the keyboard.
// html.vibes-kb-open and --vibes-vvh / --vibes-vvtop are read by ui/universal.vue and PageWithHeader.vue.

import { ref } from 'vue';

export const keyboardOpen = ref(false);

// Taller than any browser toolbar change, shorter than any phone keyboard.
const KEYBOARD_MIN = 150;
const NOT_TEXT = ['button', 'checkbox', 'radio', 'range', 'file', 'submit', 'reset', 'color', 'image', 'hidden'];

function typingInto(el: Element | null): boolean {
	if (el instanceof HTMLTextAreaElement) return !el.readOnly && !el.disabled;
	if (el instanceof HTMLInputElement) return !el.readOnly && !el.disabled && !NOT_TEXT.includes(el.type);
	return el instanceof HTMLElement && el.isContentEditable;
}

let started = false;

export function watchKeyboard(): void {
	const vv = window.visualViewport;
	if (started || vv == null) return;
	started = true;
	const html = window.document.documentElement;
	let frame = 0;

	const apply = () => {
		frame = 0;
		const full = Math.max(html.clientHeight, window.innerHeight);
		const open = typingInto(window.document.activeElement) && full - vv.height > KEYBOARD_MIN;
		if (open) {
			html.style.setProperty('--vibes-vvh', `${Math.round(vv.height)}px`);
			html.style.setProperty('--vibes-vvtop', `${Math.max(0, Math.round(vv.offsetTop))}px`);
		}
		if (open === keyboardOpen.value) return;
		keyboardOpen.value = open;
		html.classList.toggle('vibes-kb-open', open);
		if (!open) {
			html.style.removeProperty('--vibes-vvh');
			html.style.removeProperty('--vibes-vvtop');
			// iOS sometimes leaves the page slid up after the keyboard goes away.
			if (window.scrollY !== 0) window.scrollTo(0, 0);
		}
	};
	const schedule = () => {
		if (frame === 0) frame = window.requestAnimationFrame(apply);
	};

	vv.addEventListener('resize', schedule);
	vv.addEventListener('scroll', schedule);
	window.addEventListener('focusin', schedule);
	// Focus moving from one field to the next passes through <body>; look again once it has landed.
	window.addEventListener('focusout', () => window.setTimeout(schedule, 50));
}
