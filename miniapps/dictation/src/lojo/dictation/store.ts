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
	let p: DictProgress;
	try {
		p = toProgress(JSON.parse(localStorage.getItem(LOCAL_KEY) ?? 'null'));
	} catch {
		p = emptyProgress();
	}
	return importTry(p);
}

// The free try (/dictation-try/, 11-11 to 11-12) kept its records in this browser under its own name. The first time this
// page opens here, they are read over once (decided 2026-11-12): only items and sets this page has no record of yet,
// so nothing newer is overwritten. The old copy is left as it was; a mark keeps it from being read again.
const TRY_KEY = 'vibes-dictation-try:v1';
const TRY_DONE_KEY = 'vibes-dictation:try-imported';

export function importTry(p: DictProgress): DictProgress {
	try {
		if (localStorage.getItem(TRY_DONE_KEY) != null) return p;
		const old = fromTry(JSON.parse(localStorage.getItem(TRY_KEY) ?? 'null'));
		if (old != null) {
			for (const [id, rec] of Object.entries(old.items)) p.items[id] ??= rec;
			for (const [set, ids] of Object.entries(old.last)) p.last[set] ??= ids;
			localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
		}
		localStorage.setItem(TRY_DONE_KEY, new Date().toISOString());
	} catch {
		// storage off or broken: practise from what there is, try again next time
	}
	return p;
}

// The try kept per item { r, w, streak, seen, at, given } and counted a word as 常错 while w >= 2 and streak < 2.
// Here that is o; m (misses since it last left 常错) is all its misses unless it has already left.
export function fromTry(value: unknown): DictProgress | null {
	if (value == null || typeof value !== 'object' || (value as { v?: unknown }).v !== 1) return null;
	const v = value as { items?: Record<string, Record<string, unknown>>; last?: unknown };
	const items: Record<string, unknown> = {};
	for (const [id, rec] of Object.entries(v.items ?? {})) {
		if (rec == null || typeof rec !== 'object') continue;
		const r = rec.r, w = rec.w, s = rec.streak;
		if (![r, w, s].every(n => typeof n === 'number' && Number.isInteger(n) && n >= 0)) continue;
		const o = (w as number) >= 2 && (s as number) < 2;
		items[id] = { r, w, s, o, m: o || (w as number) < 2 ? w : 0, at: typeof rec.at === 'number' ? rec.at : 0 };
	}
	return toProgress({ items, last: v.last });
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
