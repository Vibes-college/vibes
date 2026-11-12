<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线, stop 5: the mock. The text on one side, a plain box on the other, as on the test's writing screen: no
spellcheck, no pasting, a word count under the box. While typing only the time left and the word count show; what was
wrong (misspelt words, signs and capitals, words left out or added) comes after hand-in. The clock starts at the first
key and hands in by itself at the end. On a phone it is the text's first sentences. -->
<template>
<div ref="rootEl" :class="$style.root" :data-play="stop.id">
	<XBar :stop="stop" :rule="rule" @exit="emit('exit')"/>
	<div :class="$style.mbar">
		<div :class="[$style.mtime, { [$style.low]: low }]">
			<small>{{ L.timeLeft }}</small>
			<b data-time-left>{{ clockText }}</b>
			<div :class="$style.mtrack" aria-hidden="true"><b :style="{ width: `${leftShare * 100}%` }"></b></div>
		</div>
		<div :class="$style.mwc"><small>{{ L.wordsTile }}</small><b>{{ words }}</b></div>
		<button class="_button" :class="[$style.submit, { [$style.ready]: typedAll, [$style.armed]: armed }]" data-submit @click="onSubmit">
			{{ armed ? L.submitArmed : L.submit }}
		</button>
	</div>
	<p v-if="ime" :class="$style.ime" role="status">{{ L.ime }}</p>
	<div :class="$style.cols">
		<section :class="[$style.card, $style.src]" :aria-labelledby="`${uid}-src`">
			<h2 :id="`${uid}-src`" :class="$style.label">{{ L.source }}</h2>
			<p :class="$style.topic">{{ L.topic(stop.topic[typingLang]) }}</p>
			<p ref="srcEl" :class="$style.text" lang="en">
				<template v-for="(w, j) in src" :key="j">
					<span :class="[$style.w, { [$style.now]: j === at, [$style.past]: j < at }]" :data-k="j">{{ w }}</span>{{ j < src.length - 1 ? ' ' : '' }}
				</template>
			</p>
		</section>
		<section :class="[$style.card, $style.ans]">
			<label :for="inputId" :class="$style.label">{{ L.answerLabel }}</label>
			<textarea
				:id="inputId"
				ref="taEl"
				:class="$style.ta"
				autocomplete="off"
				autocapitalize="off"
				autocorrect="off"
				spellcheck="false"
				lang="en"
				@input="onInput"
				@compositionstart="onCompositionStart"
				@compositionend="onCompositionEnd"
				@paste="noPaste"
				@drop="noPaste"
			></textarea>
			<p :class="$style.wc"><span>{{ L.wordsFoot }}: <b data-words>{{ words }}</b></span><span>{{ L.noSpellcheck }}</span></p>
			<p v-if="typedAll" :class="$style.mdone" role="status">{{ L.typedAll }}</p>
		</section>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, useId, useTemplateRef, watch } from 'vue';
import XBar from './typing.bar.vue';
import type { Device, Goal, MockStop } from '@/lojo/typing/content.js';
import type { MockTry } from '@/lojo/typing/score.js';
import { cleanTyped, judgeMock, mockPlan, scoreMock, typedToEnd, wordAt, wordCount } from '@/lojo/typing/score.js';
import { keysForUs, sayFullWidthOnce, setBoxValue, useStopClock, useWindowKeys, wantsBox } from '@/lojo/typing/screen.js';
import { touchScreen } from '@/lojo/typing/device.js';
import { typingLabels as L, ruleText, typingLang } from '@/lojo/typing/labels.js';
import * as os from '@/os.js';

const props = defineProps<{
	stop: MockStop;
	device: Device;
	goal: Goal;
}>();

const emit = defineEmits<{
	(ev: 'finish', result: MockTry): void;
	(ev: 'exit'): void;
}>();

const uid = `typing-mock-${useId()}`;
const inputId = `${uid}-answer`;
const rootEl = useTemplateRef('rootEl');
const taEl = useTemplateRef('taEl');
const srcEl = useTemplateRef('srcEl');
// fixed for the try: a device switch counts from the next one
const plan = mockPlan(props.stop, props.device);
const src = plan.text.split(/\s+/);
const limitMs = plan.seconds * 1000;
const value = ref('');
// the clock's time at the first key, and at the last
const startedAt = ref<number | null>(null);
let lastAt = 0;
const armed = ref(false);
const composing = ref(false);
const ime = ref(false);
let disarm: (() => void) | null = null;
let finished = false;

const clk = useStopClock({
	show() {
		const focusedEl = window.document.activeElement;
		if (focusedEl == null || focusedEl === window.document.body) taEl.value?.focus({ preventScroll: true });
	},
});

const rule = computed(() => ruleText(props.stop, props.device, props.goal));
const leftMs = computed(() => (startedAt.value == null ? limitMs : Math.max(0, limitMs - (clk.now.value - startedAt.value))));
const leftShare = computed(() => leftMs.value / limitMs);
const clockText = computed(() => {
	const s = Math.ceil(leftMs.value / 1000);
	return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
});
const low = computed(() => startedAt.value != null && leftMs.value <= 60 * 1000);
const words = computed(() => wordCount(value.value));
const at = computed(() => wordAt(value.value, src.length));
const typedAll = computed(() => typedToEnd(plan.text, value.value));

// Time up: handed in as it is.
watch(leftMs, ms => {
	if (ms > 0 || startedAt.value == null || finished) return;
	os.toast(L.timeUp);
	submit(true);
});

// Keep the word being typed in sight where the text scrolls (a phone).
watch(at, async j => {
	await nextTick();
	const box = srcEl.value;
	const w = box?.querySelector<HTMLElement>(`[data-k="${j}"]`);
	if (box == null || w == null || box.scrollHeight <= box.clientHeight + 4) return;
	if (w.offsetTop < box.scrollTop || w.offsetTop > box.scrollTop + box.clientHeight - 40) box.scrollTop = w.offsetTop - 30;
});

function onInput(ev: Event) {
	if (composing.value || (ev as InputEvent).isComposing) return;
	take();
}

function onCompositionStart() {
	composing.value = true;
	if (!touchScreen) ime.value = true;
}

function onCompositionEnd() {
	composing.value = false;
	take();
}

function take() {
	const el = taEl.value;
	if (el == null || finished) return;
	const { text, fullWidth, cjk } = cleanTyped(el.value, true);
	if (fullWidth) sayFullWidthOnce(L.fullWidth);
	if (!touchScreen) ime.value = cjk;
	setBoxValue(el, text);
	const now = clk.clock.now();
	if (startedAt.value == null && text.trim() !== '') startedAt.value = now;
	lastAt = now;
	value.value = text;
}

function noPaste(ev: Event) {
	ev.preventDefault();
	os.toast(L.noPaste);
}

function submit(timeUp: boolean) {
	if (finished) return;
	finished = true;
	disarm?.();
	const typedMs = startedAt.value != null ? Math.max(1, lastAt - startedAt.value) : 0;
	const mock = scoreMock(plan.text, value.value, typedMs, timeUp);
	const judged = judgeMock(mock, props.goal);
	emit('finish', {
		kind: 'mock', stop: props.stop.id, device: props.device, pass: judged.pass, checks: judged.checks, ms: clk.clock.now(),
		acc: mock.acc, wpm: mock.wpm, score: null, total: null, mock, typedMs, limitS: plan.seconds, timeUp,
	});
}

// Not all typed yet: the first press only asks for a second one.
function onSubmit() {
	if (!typedAll.value && !armed.value) {
		armed.value = true;
		disarm = clk.after(3500, () => {
			armed.value = false;
		});
		return;
	}
	submit(false);
}

// On a computer, typing anywhere on the page goes into the box.
useWindowKeys(ev => {
	if (touchScreen || finished || !keysForUs(ev, rootEl.value) || !wantsBox(ev)) return;
	taEl.value?.focus({ preventScroll: true });
}, true);

onMounted(() => {
	taEl.value?.focus({ preventScroll: true });
});
</script>

<style lang="scss" module>
.root {
	max-width: 960px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.mbar {
	position: sticky;
	top: var(--MI-stickyTop, 0px);
	z-index: 5;
	display: flex;
	align-items: center;
	gap: 10px;
	background: var(--MI_THEME-panel);
	border-radius: 18px;
	box-shadow: var(--tl-shadow);
	padding: 10px 12px;
}

.mtime {
	display: flex;
	flex-direction: column;
	min-width: 0;
	flex: 1;
}

.mtime,
.mwc {
	> small {
		font-size: 11.5px;
		color: var(--tl-weak);
		font-weight: 600;
	}

	> b {
		font-size: 22px;
		color: var(--tl-ink);
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}
}

.low > b {
	color: var(--tl-bad);
}

.mtrack {
	height: 5px;
	border-radius: 999px;
	background: var(--tl-hi);
	overflow: hidden;
	margin-top: 4px;

	> b {
		display: block;
		height: 100%;
		background: var(--tl-c);
		transition: width 0.25s linear;

		.low & {
			background: var(--tl-bad);
		}
	}
}

.mwc {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
}

.submit {
	flex: none;
	height: 44px;
	padding: 0 18px;
	border-radius: 13px;
	background: var(--MI_THEME-buttonBg);
	color: var(--tl-ink);
	font-weight: 700;
	font-size: 15px;

	&.ready {
		background: var(--MI_THEME-cta);
		color: var(--MI_THEME-fgOnAccent);
		animation: ready 1.4s ease-in-out infinite;
	}

	&.armed {
		background: var(--tl-bad);
		color: var(--MI_THEME-fgOnAccent);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

@keyframes ready {
	50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--MI_THEME-cta) 25%, transparent); }
}

.ime {
	margin: 0;
	background: var(--tl-goldBg);
	color: var(--tl-gold);
	font-weight: 700;
	font-size: 13.5px;
	border-radius: 12px;
	padding: 8px 12px;
	text-align: center;
}

.cols {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.card {
	background: var(--MI_THEME-panel);
	border-radius: 22px;
	box-shadow: var(--tl-shadow);
	padding: 14px 14px 12px;
}

.label {
	display: block;
	font-size: 12px;
	font-weight: 700;
	color: var(--tl-weak);
	letter-spacing: 0.1em;
	margin: 0 0 6px;
}

.topic {
	font-size: 13px;
	margin: 0 0 8px;
}

.text {
	position: relative;
	font-family: Arial, "Helvetica Neue", system-ui, sans-serif;
	font-size: 15.5px;
	line-height: 1.7;
	color: var(--tl-ink);
	margin: 0;
	max-height: 30vh;
	overflow: auto;
	padding-right: 4px;
	user-select: none;
}

.w {
	border-radius: 4px;
}

.now {
	background: color-mix(in srgb, var(--tl-c) 18%, var(--MI_THEME-panel));
	box-shadow: 0 0 0 2px color-mix(in srgb, var(--tl-c) 18%, var(--MI_THEME-panel));
}

.past {
	color: color-mix(in srgb, var(--tl-ink) 50%, var(--MI_THEME-panel));
}

// the test's own box: white, square-ish, a plain font
.ta {
	display: block;
	box-sizing: border-box;
	width: 100%;
	min-height: 170px;
	resize: vertical;
	border: 1.5px solid color-mix(in srgb, var(--MI_THEME-fg) 35%, var(--MI_THEME-panel));
	border-radius: 6px;
	background: var(--MI_THEME-panel);
	padding: 10px 12px;
	font: 16px/1.6 Arial, "Helvetica Neue", system-ui, sans-serif;
	color: var(--tl-ink);
	outline: none;

	&:focus {
		border-color: var(--MI_THEME-accent);
		box-shadow: 0 0 0 3px var(--MI_THEME-accentedBg);
	}
}

.wc {
	display: flex;
	justify-content: space-between;
	gap: 10px;
	font-size: 13px;
	margin: 6px 0 0;
	font-family: Arial, system-ui, sans-serif;

	b {
		font-variant-numeric: tabular-nums;
	}
}

.mdone {
	background: var(--tl-okBg);
	color: var(--tl-ok);
	font-weight: 700;
	border-radius: 12px;
	padding: 8px 12px;
	font-size: 13.5px;
	margin: 8px 0 0;
}

@media (prefers-reduced-motion: reduce) {
	.submit.ready {
		animation: none;
	}
}

@container typing (min-width: 720px) {
	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		align-items: stretch;
	}

	.text {
		max-height: none;
	}

	.ta {
		min-height: 300px;
	}
}
</style>
