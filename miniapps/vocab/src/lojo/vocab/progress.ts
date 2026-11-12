/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 5 号线 · 词汇's record. Kept by the vocab mini app itself (/apps/vocab/api/v1/progress; until 2026-11-12 it was in
// the community's account registry, client/lojo/english → vocab, copied over by import-from-community.sql), so it
// follows the learner across devices. Answers are kept here until they are sent; the mini app puts them on its copy
// (record.ts applyMarks, the same merge as before), so what another device recorded meanwhile is never written over.
// Sends go one at a time.
import { ref } from 'vue';
import { applyMarks, emptyProgress, toProgress } from './record.js';
import type { Mark, VocabProgress } from './record.js';
import { appApi } from '@/utility/misskey-api.js';
import { APP_BASE } from '@/router.js';
import { $i } from '@/i.js';

// answers wait this long for the next one before they are sent
const SAVE_AFTER_MS = 1200;

// What the page shows: the stored copy with this device's answers not sent yet.
export const vocabProgress = ref<VocabProgress>(emptyProgress());
// ready once the stored copy has been read; failed: it couldn't be (the page shows the stop as new and says so)
export const progressLoad = ref<'idle' | 'loading' | 'ready' | 'failed'>('idle');
// the last send didn't go through; the next one takes its answers along
export const saveFailed = ref(false);

// answers not sent yet, in the order they were given
let pending: Mark[] = [];
let chain: Promise<unknown> = Promise.resolve();

function serial<T>(job: () => Promise<T>): Promise<T> {
	const next = chain.catch(() => undefined).then(job);
	chain = next;
	return next;
}

// The stored copy (empty when never practised).
async function readRemote(): Promise<VocabProgress> {
	const r = await appApi<{ progress: unknown }>(APP_BASE, 'progress');
	return r.progress == null ? emptyProgress() : toProgress(r.progress);
}

// Opening the page (and coming back to it) reads the stored copy again: another device may have practised since.
export function syncVocabProgress(): Promise<void> {
	if ($i == null) {
		progressLoad.value = 'ready';
		return Promise.resolve();
	}
	if (progressLoad.value !== 'ready') progressLoad.value = 'loading';
	return serial(async () => {
		try {
			vocabProgress.value = applyMarks(await readRemote(), pending);
			progressLoad.value = 'ready';
		} catch {
			if (progressLoad.value !== 'ready') progressLoad.value = 'failed';
		}
	});
}

let queued: Promise<void> | null = null;

// Sends the answers given so far. Answers that come in while a send is waiting go out with it.
export function saveVocabProgress(): Promise<void> {
	if ($i == null || pending.length === 0) return queued ?? Promise.resolve();
	if (queued != null) return queued;
	const run = serial(async () => {
		queued = null;
		const batch = pending.slice();
		if (batch.length === 0) return;
		const r = await appApi<{ progress: unknown }>(APP_BASE, 'marks', { method: 'POST', body: { marks: batch } });
		const merged = toProgress(r.progress);
		// the ones given while this was on its way stay for the next send
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

// A word answered: shown at once, sent a moment later (with any that follow).
export function recordWord(stop: string, word: string, right: boolean): void {
	const mark: Mark = { stop, word, right, at: Date.now() };
	pending.push(mark);
	vocabProgress.value = applyMarks(vocabProgress.value, [mark]);
	if (timer != null) window.clearTimeout(timer);
	timer = window.setTimeout(() => {
		timer = null;
		saveVocabProgress().catch(() => { /* said on the page; the next send takes them along */ });
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
