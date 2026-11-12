/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 0 号线 · 机考打字's record, kept by the typing mini app itself (/apps/typing/api/v1/progress; until 11-12 it was in the
// community's account registry, client/lojo/english → typing, copied over by tools/migrate.mjs), so it follows the learner across devices: each stop's tries,
// its first pass (and on what), its best try, and when the whole line lit up. Every write is merged with the account's
// copy first, so a try made on another device is never written over. The route map reads loadTypingProgress().
import { ref } from 'vue';
import { typingContent } from './content.js';
import { emptyProgress, mergeProgress, passedIds, toProgress } from './record.js';
import type { TypingProgress } from './record.js';
import { appApi } from '@/utility/misskey-api.js';
import { APP_BASE } from '@/router.js';
import { $i } from '@/i.js';

// The page: /apps/typing/.
export const TYPING_PATH = APP_BASE;
const stopIds = () => typingContent.stops.map(s => s.id);

export const typingProgress = ref<TypingProgress>(emptyProgress());
// ready once the account's copy has been read; failed: it couldn't be (the page shows the line as new and says so)
export const progressLoad = ref<'idle' | 'loading' | 'ready' | 'failed'>('idle');
// the last write didn't go through; the next one takes this one's tries along
export const saveFailed = ref(false);

// The account's copy; null when there is none (never practised).
async function readRemote(): Promise<TypingProgress | null> {
	const r = await appApi<{ progress: unknown }>(APP_BASE, 'progress');
	return r.progress == null ? null : toProgress(r.progress);
}

// Opening the page (and coming back to it) reads the account's copy again: another device may have practised since.
export async function syncTypingProgress(): Promise<void> {
	if ($i == null) {
		progressLoad.value = 'ready';
		return;
	}
	if (progressLoad.value !== 'ready') progressLoad.value = 'loading';
	try {
		const remote = await readRemote();
		if (remote != null) typingProgress.value = mergeProgress(typingProgress.value, remote, stopIds());
		progressLoad.value = 'ready';
	} catch {
		if (progressLoad.value !== 'ready') progressLoad.value = 'failed';
	}
}

let saving: Promise<void> = Promise.resolve();
let queued = false;

// One write at a time; tries that come in while one is waiting go out with it.
export function saveTypingProgress(): Promise<void> {
	if ($i == null) return Promise.resolve();
	if (queued) return saving;
	queued = true;
	saving = saving.catch(() => undefined).then(async () => {
		queued = false;
		const ids = stopIds();
		// the server merges with its copy too (another device may have written meanwhile) and sends back the result
		const r = await appApi<{ progress: unknown }>(APP_BASE, 'progress', { method: 'PUT', body: { progress: JSON.parse(JSON.stringify(typingProgress.value)) } });
		const merged = mergeProgress(typingProgress.value, toProgress(r.progress), ids);
		// whatever was recorded while this was on its way stays
		typingProgress.value = mergeProgress(typingProgress.value, merged, ids);
		saveFailed.value = false;
		progressLoad.value = 'ready';
	});
	saving.catch(() => {
		saveFailed.value = true;
	});
	return saving;
}

// For the route map: the stops of 0 号线 passed (their ids, in line order), out of how many, and whether that is all of
// them. Reads the account's copy each time; rejects when it can't be read (not when there is none yet).
export async function loadTypingProgress(): Promise<{ passed: string[]; total: number; done: boolean }> {
	const ids = stopIds();
	if ($i != null) {
		const remote = await readRemote();
		if (remote != null) typingProgress.value = mergeProgress(typingProgress.value, remote, ids);
	}
	const passed = passedIds(typingProgress.value, ids);
	return { passed, total: ids.length, done: ids.length > 0 && passed.length === ids.length };
}
