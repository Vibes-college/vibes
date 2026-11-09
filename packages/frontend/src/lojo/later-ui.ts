/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import type { Component } from 'vue';

// Vibes 2026-11-09: the post form, emoji picker, menus, dialogs and page window used to be imported by os.ts and the
// pickers at startup, so every first open downloaded about a quarter of the startup code for things nobody had tapped yet.
// They now download after the first posts are on screen (preloadLaterUi, called from prefetch.ts). Once downloaded, get()
// hands back the real component, exactly as the static import did, so iOS keeps focusing the text box on the same tap.
// A tap before that still works: get() returns an async wrapper that downloads it first (iOS may then skip the autofocus).
function later<T extends Component>(loader: () => Promise<{ default: T }>) {
	let loaded: T | null = null;
	let loading: Promise<T> | null = null;
	const load = (): Promise<T> => loading ??= loader().then(m => {
		loaded = m.default;
		return loaded;
	}, err => {
		loading = null; // let the next tap try again
		throw err;
	});
	return {
		load,
		// a fresh wrapper each time: Vue's wrapper remembers a failed download and would never try again
		get: (): T => loaded ?? defineAsyncComponent(load) as unknown as T,
	};
}

export const postFormDialog = later(() => import('@/components/MkPostFormDialog.vue'));
export const emojiPickerDialog = later(() => import('@/components/MkEmojiPickerDialog.vue'));
export const dialog = later(() => import('@/components/MkDialog.vue'));
export const popupMenu = later(() => import('@/components/MkPopupMenu.vue'));
export const contextMenu = later(() => import('@/components/MkContextMenu.vue'));
export const pageWindow = later(() => import('@/components/MkPageWindow.vue'));

// The note "more" menu builders (with the user menu they include, ~8 KB compressed): only needed when a menu opens.
type NoteMenus = typeof import('@/utility/get-note-menu.js');
let noteMenus: NoteMenus | null = null;
let noteMenusLoading: Promise<NoteMenus> | null = null;
export function loadNoteMenus(): Promise<NoteMenus> {
	return noteMenusLoading ??= import('@/utility/get-note-menu.js').then(m => {
		noteMenus = m;
		return m;
	}, err => {
		noteMenusLoading = null;
		throw err;
	});
}
/** The note menu builders if already downloaded, for handlers that must answer on the same tick (the right-click menu). */
export function noteMenusNow(): NoteMenus | null {
	return noteMenus;
}

export function preloadLaterUi(signedIn: boolean): void {
	loadNoteMenus().catch(() => {});
	const parts = signedIn
		? [dialog, popupMenu, contextMenu, emojiPickerDialog, postFormDialog, pageWindow]
		: [dialog, popupMenu, contextMenu];
	for (const part of parts) {
		// A failed preload only means that part downloads on its first tap.
		part.load().catch(() => {});
	}
}
