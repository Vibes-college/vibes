/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Phone or computer targets (decided 2026-10-29): the test is on a computer, so a computer aims at 20 words a minute;
// on a phone stop 4 checks accuracy only and stop 5 is its first sentences. The learner can switch, on this device.
import { ref } from 'vue';
import type { Device } from './content.js';

const KEY = 'vibes:typing-device';

// A touch screen without a mouse (or a small one).
function detect(): Device {
	const mm = (q: string) => window.matchMedia(q).matches;
	const small = Math.min(window.screen.width, window.screen.height) < 600;
	return mm('(pointer: coarse)') && (mm('(hover: none)') || small) ? 'phone' : 'desktop';
}

const detected = detect();

// A touch screen: the box to type in is shown (a phone needs it for its keyboard) and the hints say "tap".
export const touchScreen = window.matchMedia('(pointer: coarse)').matches;

function saved(): Device | null {
	try {
		const v = window.localStorage.getItem(KEY);
		return v === 'phone' || v === 'desktop' ? v : null;
	} catch {
		return null;
	}
}

export const typingDevice = ref<Device>(saved() ?? detected);

export function setTypingDevice(next: Device): void {
	typingDevice.value = next;
	try {
		if (next === detected) window.localStorage.removeItem(KEY);
		else window.localStorage.setItem(KEY, next);
	} catch {
		// private mode: for this visit only
	}
}
