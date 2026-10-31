/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { lang } from '@@/js/config.js';

export async function initializeSw() {
	if (!('serviceWorker' in navigator)) return;

	navigator.serviceWorker.register('/sw.js', { scope: '/', type: 'classic' });
	navigator.serviceWorker.ready.then(registration => {
		registration.active?.postMessage({
			msg: 'initialize',
			lang,
		});
	});

	// Vibes: when the page comes back to the front, let the service worker check for a new version and download it in
	// the background (packages/sw/src/sw.ts refreshApp), so the next start does not wait for code. At most every 15 min.
	let lastRefresh = Date.now();
	window.document.addEventListener('visibilitychange', () => {
		if (window.document.visibilityState !== 'visible' || Date.now() - lastRefresh < 15 * 60 * 1000) return;
		lastRefresh = Date.now();
		navigator.serviceWorker.controller?.postMessage({ msg: 'vibes-refresh-app' });
	});
}
