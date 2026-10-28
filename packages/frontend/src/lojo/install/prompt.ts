/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The browser side of adding Vibes to the home screen: whether Vibes already runs from there, and Chrome's and Edge's own
// install offer. That offer can come before the app has loaded, so the bootloader (public/loader/boot.js) catches it
// first and holds back the browser's bar; the card and /install show it with one tap instead.
import { shallowRef } from 'vue';
import { detectDevice, installOffer } from './guide.js';
import type { InstallOffer } from './guide.js';
import { miLocalStorage } from '@/local-storage.js';

type InstallPromptEvent = Event & {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
const early = window as Window & { vibesInstallPrompt?: InstallPromptEvent | null };

export const installPrompt = shallowRef<InstallPromptEvent | null>(early.vibesInstallPrompt ?? null);

window.addEventListener('beforeinstallprompt', ev => {
	ev.preventDefault();
	installPrompt.value = ev as InstallPromptEvent;
});
window.addEventListener('appinstalled', () => {
	installPrompt.value = null;
	miLocalStorage.setItem('vibesInstallPrompt', 'installed');
});

export const standalone = ['standalone', 'fullscreen', 'minimal-ui'].some(mode => window.matchMedia(`(display-mode: ${mode})`).matches)
	|| (navigator as Navigator & { standalone?: boolean }).standalone === true;

// Opened from the home screen. On Android and computers the browser shares this storage, so its tabs stop asking too;
// on iOS the home screen app keeps its own.
if (standalone) miLocalStorage.setItem('vibesInstallPrompt', 'installed');

export const device = detectDevice(navigator.userAgent, navigator.maxTouchPoints);

// Show the browser's own install dialog. True if Vibes was installed.
export async function install(): Promise<boolean> {
	const ev = installPrompt.value;
	if (ev == null) return false;
	// each offer can be shown once
	installPrompt.value = null;
	early.vibesInstallPrompt = null;
	await ev.prompt();
	return (await ev.userChoice).outcome === 'accepted';
}

export function currentInstallOffer(): InstallOffer | null {
	return installOffer({
		standalone,
		prompt: miLocalStorage.getItem('vibesInstallPrompt'),
		welcomed: miLocalStorage.getItem('vibesInstalledWelcomed') === 'true',
	}, Date.now());
}
