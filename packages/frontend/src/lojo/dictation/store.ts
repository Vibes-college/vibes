/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 听写 progress (常错, counts) in the account registry, so it follows the learner across devices.
import { ref } from 'vue';
import { emptyProgress, toProgress } from './logic.js';
import type { DictProgress } from './logic.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

const SCOPE = ['client', 'lojo', 'english'];
const KEY = 'dictation';

export const progress = ref<DictProgress>(emptyProgress());
// Whether the account's copy was read. Until then nothing is written, so a failed read can't wipe it.
export const progressLoaded = ref(false);

let loading: Promise<void> | null = null;

export function loadProgress(): Promise<void> {
	if ($i == null) return Promise.resolve();
	loading ??= misskeyApi('i/registry/get', { scope: SCOPE, key: KEY }).then(value => {
		progress.value = toProgress(value);
		progressLoaded.value = true;
	}, err => {
		// A learner who never practised has no key yet; anything else is tried again on the next load.
		if ((err as { code?: string } | null)?.code === 'NO_SUCH_KEY') {
			progress.value = emptyProgress();
			progressLoaded.value = true;
		} else {
			loading = null;
		}
	});
	return loading;
}

// Opening the page reads the account's copy again: another device may have practised since.
export function reloadProgress(): Promise<void> {
	loading = null;
	return loadProgress();
}

// One write at a time; answers that come in while one is waiting go out with it.
let writing: Promise<unknown> = Promise.resolve();
let waiting = false;

export function saveProgress(): Promise<unknown> {
	if (!progressLoaded.value || $i == null) return Promise.resolve();
	if (waiting) return writing;
	waiting = true;
	writing = writing.catch(() => undefined).then(() => {
		waiting = false;
		return misskeyApi('i/registry/set', { scope: SCOPE, key: KEY, value: JSON.parse(JSON.stringify(progress.value)) });
	});
	return writing;
}
