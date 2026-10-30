<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 生词本: one round of review, inside the page. The cards up now, one at a time: a 认得 card is answered 忘了 or
记得, a 拼写 card is graded by the spelling. Each answer is saved as it is given. When the cards run out, today's queue
is asked for again (words just learned come back within minutes); the round ends when nothing is left.
Keys on a computer: Space shows the answer, 1 忘了, 2 记得, Enter checks a spelling, Esc ends the round. They are
taken only from inside the round, while the page is on screen and no dialog is over it. -->
<template>
<div ref="rootEl" :class="$style.root" tabindex="-1" @keydown="onKeydown">
	<template v-if="phase !== 'done'">
		<div :class="$style.head">
			<button type="button" class="_button" :class="$style.end" :aria-label="wordbookLabels.endReview" @click="stop">
				<i class="ti ti-x" aria-hidden="true"></i>
			</button>
			<div :class="$style.bar" role="progressbar" :aria-label="wordbookLabels.progress" aria-valuemin="0" :aria-valuemax="total" :aria-valuenow="done">
				<div :class="$style.fill" :style="{ width: `${percent}%` }"></div>
			</div>
			<p :class="$style.left">{{ wordbookLabels.left }} <b>{{ left }}</b></p>
		</div>

		<template v-if="phase === 'card' && current">
			<XRecognize
				v-if="current.card.kind === 'recognize'"
				:key="seq"
				:item="current"
				:revealed="revealed"
				:fetchedAt="fetchedAt"
				:soundKey="soundKey"
				:exampleKey="exampleKey"
				@reveal="reveal"
				@rate="rate"
				@listen="listen"
			/>
			<XSpell
				v-else
				:key="seq"
				:item="current"
				:fetchedAt="fetchedAt"
				:soundKey="soundKey"
				:exampleKey="exampleKey"
				@checked="settle"
				@rate="rate"
				@listen="listen"
			/>
		</template>
		<MkLoading v-else-if="phase === 'loading'" role="status"/>
		<div v-else-if="phase === 'failed'" :class="$style.failed" role="alert">
			<p>{{ wordbookLabels.loadFailed }}</p>
			<MkButton rounded inline @click="refill"><i class="ti ti-refresh"></i> {{ wordbookLabels.retry }}</MkButton>
		</div>
	</template>
	<XDone v-else :done="done" :tally="tally" :minutes="minutes" :today="latest" :fetchedAt="fetchedAt" @today="leave('today')" @words="leave('words')"/>
</div>
</template>

<script lang="ts" setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, reactive, ref, shallowRef, useId, useTemplateRef } from 'vue';
import XRecognize from './wordbook.recognize.vue';
import XSpell from './wordbook.spell.vue';
import XDone from './wordbook.done.vue';
import type { WordReviewItem, WordToday } from '@/lojo/english/wordbook.js';
import type { ReviewRating } from '@/lojo/english/review.js';
import MkButton from '@/components/MkButton.vue';
import { loadToday, reviewCard } from '@/lojo/english/wordbook.js';
import { durationMs } from '@/lojo/english/review.js';
import { wordbookLabels } from '@/lojo/english/labels.js';
import { speechSupported, stopSpeaking, toggleSpeak } from '@/lojo/english/speech.js';
import * as os from '@/os.js';

const props = defineProps<{
	// today's queue as the page last fetched it, and when
	today: WordToday;
	fetchedAt: number;
}>();

const emit = defineEmits<{
	// the round is over: the latest counts when there are any, and where to go next
	(ev: 'finish', today: WordToday | null, then: 'today' | 'words'): void;
}>();

const uid = `wordbook-review-${useId()}`;
const rootEl = useTemplateRef('rootEl');
// How long a card, or its answer buttons, is up before an answer counts: a double tap cannot answer the next card unseen.
const SETTLE_MS = 300;

// The round starts from the page's queue and then keeps its own.
// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const queue = ref<WordReviewItem[]>(props.today.queue.slice());
const current = shallowRef<WordReviewItem | null>(null);
// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const fetchedAt = ref(props.fetchedAt);
const phase = ref<'card' | 'loading' | 'failed' | 'done'>('card');
const revealed = ref(false);
const seq = ref(0);
const done = ref(0);
const tally = reactive<Record<ReviewRating, number>>({ 1: 0, 2: 0, 3: 0 });
const latest = shallowRef<WordToday | null>(null);
const startedAt = Date.now();
const minutes = ref(1);
let shownAt = 0;
let settledAt = 0;
let writes: Promise<void> = Promise.resolve();
let ended = false;
// read through a call: the round can end while an answer is being saved or the queue fetched
const isOver = (): boolean => ended;
// false while the page is kept but not shown (another page is open), or the browser tab is hidden
let active = true;
let pausedAt: number | null = null;

const left = computed(() => queue.value.length + (current.value != null ? 1 : 0));
const total = computed(() => done.value + left.value);
const percent = computed(() => (total.value === 0 ? 100 : Math.round(done.value / total.value * 100)));

/* ---------- read-aloud ---------- */

// A fresh key each time, so "再听一遍" always starts it again instead of stopping it.
const soundKey = ref('');
let soundRun = 0;
const exampleKey = computed(() => `${uid}:ex:${seq.value}`);

function speak(text: string): void {
	if (!speechSupported.value) return;
	soundKey.value = `${uid}:w:${++soundRun}`;
	toggleSpeak(soundKey.value, text);
}

function listen(): void {
	if (current.value != null) speak(current.value.word.text);
}

/* ---------- the cards ---------- */

function show(item: WordReviewItem): void {
	current.value = item;
	revealed.value = false;
	seq.value++;
	phase.value = 'card';
	shownAt = performance.now();
	settledAt = shownAt + SETTLE_MS;
	// Shown after a tap or a key, so the browser lets it play; when it does not, "再听一遍" does.
	speak(item.word.text);
}

function reveal(): void {
	if (phase.value !== 'card' || current.value == null || revealed.value) return;
	revealed.value = true;
	settle();
}

// new answer buttons have just come up
function settle(): void {
	settledAt = performance.now() + SETTLE_MS;
}

function rate(rating: ReviewRating): void {
	const item = current.value;
	if (item == null || phase.value !== 'card' || performance.now() < settledAt) return;
	done.value++;
	tally[rating]++;
	save(item, rating, durationMs(shownAt, performance.now()));
	next();
}

// Saved one after another while the next card is already up; one that fails comes round again.
function save(item: WordReviewItem, rating: ReviewRating, ms: number): void {
	writes = writes.then(() => reviewCard(item.card, rating, ms).then(() => undefined, err => {
		done.value--;
		tally[rating]--;
		// the word was removed meanwhile, on another device: nothing to save
		if ((err as { code?: string } | null)?.code === 'NO_SUCH_CARD') return;
		queue.value.push(item);
		os.toast(wordbookLabels.reviewFailed);
	}));
}

function next(): void {
	const item = queue.value.shift();
	if (item != null) show(item);
	else refill();
}

// Out of cards: once the answers are saved, ask for today's queue again.
async function refill(): Promise<void> {
	current.value = null;
	phase.value = 'loading';
	// the card had the focus; keep it in the round so Esc still works
	rootEl.value?.focus({ preventScroll: true });
	await writes;
	if (isOver()) return;
	const failed = queue.value.shift();
	if (failed != null) {
		show(failed);
		return;
	}
	try {
		const today = await loadToday();
		if (isOver()) return;
		latest.value = today;
		fetchedAt.value = Date.now();
		queue.value = today.queue.slice();
		const item = queue.value.shift();
		if (item != null) {
			show(item);
		} else {
			minutes.value = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
			phase.value = 'done';
		}
	} catch {
		if (!isOver()) phase.value = 'failed';
	}
}

/* ---------- ending ---------- */

// ✕ or Esc in the middle: what was answered is saved already.
async function stop(): Promise<void> {
	if (ended) return;
	ended = true;
	stopSpeaking(`${uid}:`);
	await writes;
	os.toast(wordbookLabels.stopped(done.value));
	emit('finish', null, 'today');
}

function leave(then: 'today' | 'words'): void {
	if (ended) return;
	ended = true;
	stopSpeaking(`${uid}:`);
	emit('finish', latest.value, then);
}

function onKeydown(ev: KeyboardEvent): void {
	// Safari ends a Chinese keyboard's composing with isComposing false but keyCode 229: that Esc only cancels the letters
	if (ev.defaultPrevented || ev.repeat || ev.isComposing || ev.keyCode === 229 || ev.ctrlKey || ev.metaKey || ev.altKey) return;
	// the page is kept while another one is open, or a dialog is over it (the rest of the app is inert then)
	if (!active || rootEl.value == null || rootEl.value.closest('[inert]') != null) return;
	if (ev.key === 'Escape') {
		ev.preventDefault();
		if (phase.value === 'done') leave('today');
		else stop();
		return;
	}
	const target = ev.target instanceof Element ? ev.target : null;
	// typing a spelling
	if (target?.closest('input, textarea, select, [contenteditable="true"]') != null) return;
	const item = current.value;
	if (phase.value !== 'card' || item == null || item.card.kind !== 'recognize') return;
	if (!revealed.value && ev.key === ' ') {
		// a focused button is pressed by Space itself
		if (target?.closest('button, a') != null) return;
		ev.preventDefault();
		reveal();
	} else if (revealed.value && (ev.key === '1' || ev.key === '2')) {
		ev.preventDefault();
		rate(ev.key === '1' ? 1 : 3);
	}
}

// Time away (another page, another app) is not time on screen.
function pause(): void {
	pausedAt ??= performance.now();
	stopSpeaking(`${uid}:`);
}

function resume(): void {
	if (pausedAt == null) return;
	shownAt += performance.now() - pausedAt;
	pausedAt = null;
}

function onVisibility(): void {
	if (window.document.visibilityState === 'hidden') pause();
	else if (active) resume();
}

// The first card comes up at once: still inside the tap on 开始复习, so its word can be read out.
next();

onMounted(() => {
	window.document.addEventListener('visibilitychange', onVisibility);
});

onActivated(() => {
	active = true;
	if (window.document.visibilityState !== 'hidden') resume();
	// back on the page: the keys go to the round again, unless something else has the focus
	const focused = window.document.activeElement;
	if (focused == null || focused === window.document.body) rootEl.value?.focus({ preventScroll: true });
});

onDeactivated(() => {
	active = false;
	pause();
});

onBeforeUnmount(() => {
	ended = true;
	window.document.removeEventListener('visibilitychange', onVisibility);
	stopSpeaking(`${uid}:`);
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 14px;

	// takes the keys; not a control itself
	&:focus {
		outline: none;
	}
}

.head {
	display: flex;
	align-items: center;
	gap: 12px;
}

.end {
	flex: none;
	display: grid;
	place-items: center;
	width: 44px;
	height: 44px;
	border-radius: 50%;
	font-size: 1.3em;
	color: var(--MI_THEME-brandInk);
	background: var(--MI_THEME-panel);
	box-shadow: 0 1px 2px color-mix(in srgb, var(--MI_THEME-brandInk) 8%, transparent), 0 4px 14px -8px color-mix(in srgb, var(--MI_THEME-brandInk) 30%, transparent);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.bar {
	flex: 1;
	height: 8px;
	border-radius: 999px;
	overflow: clip;
	background: color-mix(in srgb, var(--MI_THEME-fg) 12%, transparent);
}

.fill {
	height: 100%;
	border-radius: 999px;
	background: var(--MI_THEME-cta);
	transition: width 0.3s;
}

.left {
	flex: none;
	margin: 0;
	font-size: 0.9em;
	opacity: 0.8;

	> b {
		font-size: 1.3em;
		font-variant-numeric: tabular-nums;
		color: var(--MI_THEME-brandInk);
	}
}

.failed {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 40px 0;
	text-align: center;

	> p {
		margin: 0;
	}
}
</style>
