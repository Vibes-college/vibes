/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 听写 progress (常错, counts). Signed in: kept by the dictation mini app itself (/apps/dictation/api/v1/progress;
// until 11-12 it was in the community's account registry, client/lojo/english → dictation, copied over by
// import-from-community.sql), so it follows the learner across devices. Not signed in: only in this browser
// (localStorage), as the free try (/dictation-try/) did; nothing is sent anywhere.
import { ref } from 'vue';
import { emptyProgress, toProgress } from './logic.js';
import type { DictProgress } from './logic.js';
import { appApi } from '@/utility/misskey-api.js';
import { APP_BASE } from '@/router.js';
import { $i } from '@/i.js';

const LOCAL_KEY = 'vibes-dictation:v1';

export const progress = ref<DictProgress>(emptyProgress());
// Whether the stored copy was read. Until then nothing is written, so a failed read can't wipe it.
export const progressLoaded = ref(false);

function readLocal(): DictProgress {
	try {
		return toProgress(JSON.parse(localStorage.getItem(LOCAL_KEY) ?? 'null'));
	} catch {
		return emptyProgress();
	}
}

let loading: Promise<void> | null = null;

export function loadProgress(): Promise<void> {
	if ($i == null) {
		progress.value = readLocal();
		progressLoaded.value = true;
		return Promise.resolve();
	}
	// A learner who never practised has none yet (progress: null); anything else failing is tried again next load.
	loading ??= appApi<{ progress: unknown }>(APP_BASE, 'progress').then(r => {
		progress.value = r.progress == null ? emptyProgress() : toProgress(r.progress);
		progressLoaded.value = true;
	}, () => {
		loading = null;
	});
	return loading;
}

// Opening the page reads the stored copy again: another device may have practised since.
export function reloadProgress(): Promise<void> {
	loading = null;
	return loadProgress();
}

// One write at a time; answers that come in while one is waiting go out with it.
let writing: Promise<unknown> = Promise.resolve();
let waiting = false;

export function saveProgress(): Promise<unknown> {
	if (!progressLoaded.value) return Promise.resolve();
	if ($i == null) {
		try {
			localStorage.setItem(LOCAL_KEY, JSON.stringify(progress.value));
		} catch {
			// storage full or off: practice goes on, only not remembered
		}
		return Promise.resolve();
	}
	if (waiting) return writing;
	waiting = true;
	writing = writing.catch(() => undefined).then(() => {
		waiting = false;
		return appApi(APP_BASE, 'progress', { method: 'PUT', body: { progress: JSON.parse(JSON.stringify(progress.value)) } });
	});
	return writing;
}
