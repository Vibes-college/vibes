/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 5 号线 · 词汇's settings on this device: what the word list covers, whether practice shuffles, the blips; and each
// practice mode's last result per stop ("上次：…"). Not the learner's record: that is in the account (progress.ts).
import { ref } from 'vue';

export type CoverMode = 'none' | 'en' | 'zh';
export type PracticeMode = 'meaning' | 'listen' | 'typing';
export type VocabPrefs = { cover: CoverMode; shuffle: boolean; sfx: boolean };
// 看义拼写 / 听音拼写: right the first time, of how many; 打字: accuracy and speed.
export type LastRun = { right: number; total: number; at: number } | { acc: number; wpm: number; at: number };

const PREFS_KEY = 'vibes:vocab-prefs';
const LAST_KEY = 'vibes:vocab-last';

const isObj = (v: unknown): v is Record<string, unknown> => v != null && typeof v === 'object' && !Array.isArray(v);

function read(key: string): unknown {
	try {
		const raw = window.localStorage.getItem(key);
		return raw == null ? null : JSON.parse(raw);
	} catch {
		return null;
	}
}

function write(key: string, value: unknown): void {
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// private mode: for this visit only
	}
}

function loadPrefs(): VocabPrefs {
	const v = read(PREFS_KEY);
	const p = isObj(v) ? v : {};
	return {
		cover: p.cover === 'en' || p.cover === 'zh' ? p.cover : 'none',
		shuffle: p.shuffle === true,
		sfx: p.sfx !== false,
	};
}

export const vocabPrefs = ref<VocabPrefs>(loadPrefs());

export function setPref<K extends keyof VocabPrefs>(key: K, value: VocabPrefs[K]): void {
	vocabPrefs.value = { ...vocabPrefs.value, [key]: value };
	write(PREFS_KEY, vocabPrefs.value);
}

type LastRuns = Record<string, Partial<Record<PracticeMode, LastRun>>>;
const lastRuns = ref<LastRuns>((() => {
	const v = read(LAST_KEY);
	return isObj(v) ? v as LastRuns : {};
})());

export function lastRun(stop: string, mode: PracticeMode): LastRun | null {
	// read back from this device's storage, so checked rather than trusted
	const r: unknown = lastRuns.value[stop]?.[mode];
	if (!isObj(r)) return null;
	const at = typeof r.at === 'number' ? r.at : 0;
	if (typeof r.right === 'number' && typeof r.total === 'number') return { right: r.right, total: r.total, at };
	if (typeof r.acc === 'number' && typeof r.wpm === 'number') return { acc: r.acc, wpm: r.wpm, at };
	return null;
}

export function saveLastRun(stop: string, mode: PracticeMode, run: LastRun): void {
	lastRuns.value = { ...lastRuns.value, [stop]: { ...lastRuns.value[stop], [mode]: run } };
	write(LAST_KEY, lastRuns.value);
}
