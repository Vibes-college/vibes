/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 「在首页显示 Momo」 (2026-11-16, was 「召唤 Agent」): a choice for this device only, so it lives in localStorage, not in
// account settings. On by default (founder 11-17 01:29 PT: everyone sees their Momo in the corner; the switch moved from
// 设置 › AI tutor into the ⋯ menu of the chat with Momo, pages/chat/room.vue). Only 「off」 is stored.

import { computed, ref } from 'vue';

const KEY = 'vibes:vibi';
// Until 11-16 the corner held Paseo ("召唤 Agent"); that key is no longer read.
const OLD_KEY = 'vibes:agent';

type VibiState = { show?: boolean; reopenUntil?: number };

function load(): VibiState {
	try {
		localStorage.removeItem(OLD_KEY);
		const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
		if (typeof parsed === 'object' && parsed != null) return parsed as VibiState;
		return {};
	} catch {
		return {};
	}
}

export const vibiState = ref<VibiState>(load());
// Set when switched on in the ⋯ menu, so the button arrives with a small animation and a greeting.
export const justShown = ref(false);

function save(next: VibiState) {
	vibiState.value = next;
	if (next.show === false || next.reopenUntil != null) localStorage.setItem(KEY, JSON.stringify(next));
	else localStorage.removeItem(KEY);
}

export function isVibiShown(state: VibiState = vibiState.value): boolean {
	return state.show !== false;
}

export function setShowVibi(on: boolean) {
	save(on ? {} : { show: false });
	justShown.value = on;
}

// For the ⋯ menu's switch (type: 'switch' needs a writable ref) and for whoever only reads it.
export const vibiShown = computed<boolean>({
	get: () => isVibiShown(),
	set: (on) => setShowVibi(on),
});

// While 「认识你的 Momo」 is open (lojo/tutor/MomoSetup.vue), the corner one waits: a new learner would otherwise see a
// default face peeking out next to the faces they are picking from (11-17 test-site screenshots). A count, in case two
// are ever open at once.
export const cornerHeldBack = ref(0);

// A phone may drop the whole page while it is in the background and load it again when the user comes back.
// If the panel was open when the user left, it opens again by itself, for a while.
const REOPEN_WINDOW_MS = 30 * 60 * 1000;

export function rememberPanelOpen() {
	if (isVibiShown()) save({ ...vibiState.value, reopenUntil: Date.now() + REOPEN_WINDOW_MS });
}

export function forgetPanelOpen() {
	if (vibiState.value.reopenUntil != null) {
		const { reopenUntil: _, ...rest } = vibiState.value;
		save(rest);
	}
}

export function shouldReopenPanel(): boolean {
	return (vibiState.value.reopenUntil ?? 0) > Date.now();
}
