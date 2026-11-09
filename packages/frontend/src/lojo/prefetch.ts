/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { firstContentShown } from '@/lojo/early-api.js';
import { preloadLaterUi } from '@/lojo/later-ui.js';

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
	// the bottom bar's two tabs: the route map with the IELTS map (route.vue loads these two), and the guides
	() => import('@/pages/lojo/route.vue'),
	() => import('@/lojo/route/gate-map.js'),
	() => import('@/lojo/route/courses/ielts/index.js'),
	() => import('@/pages/lojo/guides/index.vue'),
	() => import('@/pages/lojo/guides/detail.vue'),
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
	// The post form, emoji picker, menus and dialogs are small and the first tap needs them, so they go first: as soon as
	// the first list is on screen (or after 10 s).
	Promise.race([firstContentShown, new Promise(resolve => window.setTimeout(resolve, 10000))]).then(() => whenIdle(() => preloadLaterUi(signedIn)));

	// 2026-11-09: started right after the app appeared, these ~85 files took the line from the first page's notes and
	// pictures on a slow phone network. Now they wait until the first list has arrived and 2 more seconds have passed for
	// its posts, avatars and pictures to show (or 10 s at most).
	const listShown = firstContentShown.then(() => new Promise(resolve => window.setTimeout(resolve, 2000)));
	Promise.race([listShown, new Promise(resolve => window.setTimeout(resolve, 10000))]).then(() => whenIdle(() => {
		for (const load of signedIn ? signedInPages : visitorPages) {
			// A failed prefetch only means the page downloads on its first tap, as before.
			load().catch(() => {});
		}
	}));
}
