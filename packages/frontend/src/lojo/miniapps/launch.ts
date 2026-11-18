/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Opening a mini app from anywhere in the community: the 小程序 panel (MkMiniAppsLaunchPad.vue) and the sidebar's
// 常用小程序 icons (MiniAppDock.vue) go through here, so they behave the same. The first time an account opens an
// app, its intro screen (是什么 / 给谁用 / 怎么用 / 注意什么) comes first and its 打开 button opens the app; after that a
// tap opens the app straight away, in the full-screen overlay (lojo/app-overlay.ts).
import * as os from '@/os.js';
import { hasSeenMiniAppIntro, openMiniApp } from '@/lojo/miniapps/roster.js';
import type { MiniAppDef } from '@/lojo/miniapps/roster.js';
import { loadMiniAppsSeen } from '@/lojo/miniapps/state.js';

export async function showMiniAppIntro(app: MiniAppDef, anchorElement: HTMLElement | null): Promise<void> {
	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkMiniAppIntro.vue').then(x => x.default), {
		app,
		anchorElement,
	}, {
		closed: () => dispose(),
	});
}

/** Intro the first time, the app itself after that. Never throws: a list of seen intros that cannot be read just shows the intro. */
export async function launchMiniApp(app: MiniAppDef, anchorElement: HTMLElement | null): Promise<void> {
	await loadMiniAppsSeen();
	if (hasSeenMiniAppIntro(app)) {
		openMiniApp(app);
		return;
	}
	await showMiniAppIntro(app, anchorElement);
}
