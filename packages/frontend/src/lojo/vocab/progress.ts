/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 5 号线 · 词汇's record in the account registry (scope client/lojo/english, key vocab), so it follows the learner
// across devices. Answers are kept here until they are written; each write reads the account's copy first and puts
// them on it (record.ts applyMarks), so what another device recorded meanwhile is never written over. Reads and writes
// go one at a time.
import { ref } from 'vue';
import { applyMarks, emptyProgress, toProgress } from './record.js';
import type { Mark, VocabProgress } from './record.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

const SCOPE = ['client', 'lojo', 'english'];
const KEY = 'vocab';
// answers wait this long for the next one before they are written
const SAVE_AFTER_MS = 1200;

// What the page shows: the account's copy with this device's answers not written yet.
export const vocabProgress = ref<VocabProgress>(emptyProgress());
// ready once the account's copy has been read; failed: it couldn't be (the page shows the stop as new and says so)
export const progressLoad = ref<'idle' | 'loading' | 'ready' | 'failed'>('idle');
// the last write didn't go through; the next one takes its answers along
export const saveFailed = ref(false);

// answers not written yet, in the order they were given
let pending: Mark[] = [];
let chain: Promise<unknown> = Promise.resolve();

function serial<T>(job: () => Promise<T>): Promise<T> {
	const next = chain.catch(() => undefined).then(job);
	chain = next;
	return next;
}

// The account's copy; null when there is none (never practised).
async function readRemote(): Promise<VocabProgress | null> {
	try {
		return toProgress(await misskeyApi('i/registry/get', { scope: SCOPE, key: KEY }));
	} catch (err) {
		if ((err as { code?: string } | null)?.code === 'NO_SUCH_KEY') return null;
		throw err;
	}
}

// Opening the page (and coming back to it) reads the account's copy again: another device may have practised since.
export function syncVocabProgress(): Promise<void> {
	if ($i == null) {
		progressLoad.value = 'ready';
		return Promise.resolve();
	}
	if (progressLoad.value !== 'ready') progressLoad.value = 'loading';
	return serial(async () => {
		try {
			const remote = await readRemote() ?? emptyProgress();
			vocabProgress.value = applyMarks(remote, pending);
			progressLoad.value = 'ready';
		} catch {
			if (progressLoad.value !== 'ready') progressLoad.value = 'failed';
		}
	});
}

let queued: Promise<void> | null = null;

// Writes the answers given so far. Answers that come in while a write is waiting go out with it.
export function saveVocabProgress(): Promise<void> {
	if ($i == null || pending.length === 0) return queued ?? Promise.resolve();
	if (queued != null) return queued;
	const run = serial(async () => {
		queued = null;
		const batch = pending.slice();
		if (batch.length === 0) return;
		const merged = applyMarks(await readRemote() ?? emptyProgress(), batch);
		await misskeyApi('i/registry/set', { scope: SCOPE, key: KEY, value: JSON.parse(JSON.stringify(merged)) });
		// the ones given while this was on its way stay for the next write
		pending = pending.slice(batch.length);
		vocabProgress.value = applyMarks(merged, pending);
		saveFailed.value = false;
		progressLoad.value = 'ready';
	});
	queued = run;
	run.catch(() => {
		saveFailed.value = true;
	});
	return run;
}

let timer: number | null = null;

// A word answered: shown at once, written a moment later (with any that follow).
export function recordWord(stop: string, word: string, right: boolean): void {
	const mark: Mark = { stop, word, right, at: Date.now() };
	pending.push(mark);
	vocabProgress.value = applyMarks(vocabProgress.value, [mark]);
	if (timer != null) window.clearTimeout(timer);
	timer = window.setTimeout(() => {
		timer = null;
		saveVocabProgress().catch(() => { /* said on the page; the next write takes them along */ });
	}, SAVE_AFTER_MS);
}

// Now rather than in a moment: a round ended, or the page is being left.
export function flushVocabProgress(): Promise<void> {
	if (timer != null) {
		window.clearTimeout(timer);
		timer = null;
	}
	return saveVocabProgress();
}
