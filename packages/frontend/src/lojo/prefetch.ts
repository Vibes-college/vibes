/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes runs in Hong Kong, and from mainland China each round trip takes about 0.2 s (measured 2026-10-24).
// A page whose code is not downloaded yet needs several round trips on the first tap, so once the app is idle,
// download the pages people open most. These are the same modules the router loads, so later taps reuse them.
const signedInPages = [
	() => import('@/pages/note.vue'),
	() => import('@/pages/user/index.vue'),
	() => import('@/pages/user/home.vue'),
	() => import('@/pages/notifications.vue'),
	() => import('@/pages/explore.vue'),
	() => import('@/pages/search.vue'),
	() => import('@/pages/lojo/wordbook.vue'),
	() => import('@/pages/settings/index.vue'),
	() => import('@/pages/settings/profile.vue'),
];

const visitorPages = [
	() => import('@/pages/note.vue'),
	() => import('@/pages/user/index.vue'),
	() => import('@/pages/user/home.vue'),
	() => import('@/components/MkSignupDialog.vue'),
];

function whenIdle(run: () => void): void {
	if (typeof globalThis.requestIdleCallback === 'function') {
		globalThis.requestIdleCallback(run, { timeout: 4000 });
	} else {
		window.setTimeout(run, 2000); // Safari has no requestIdleCallback
	}
}

export function prefetchCommonPages(signedIn: boolean): void {
	whenIdle(() => {
		for (const load of signedIn ? signedInPages : visitorPages) {
			// A failed prefetch only means the page downloads on its first tap, as before.
			load().catch(() => {});
		}
	});
}
