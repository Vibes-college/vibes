<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 5 号线 · 词汇: 打字. The word is printed faintly with its meaning and example, and read out; it is typed over letter
by letter. A right letter turns green; a wrong one turns red, counts once and is taken out again, so the right one can
follow. A word typed to its end moves on by itself. Accuracy, speed and progress are shown as it goes. On a computer,
typing anywhere on the page goes into the box. Ported from the demo (prototypes/vocab-line). -->
<template>
<div ref="rootEl" :class="$style.root" data-type>
	<XBar :title="L.modes.typing.name" :sub="sub" :at="i" :done="done" :total="total" :sfx="sfx" @exit="exit" @toggleSfx="emit('toggleSfx')"/>

	<div :class="$style.tiles">
		<div :class="$style.tile" data-tile="acc">
			<small>{{ L.tileAcc }}</small>
			<b :class="[$style.acc, { [$style.low]: low }]">{{ acc }}<span>%</span></b>
		</div>
		<div :class="$style.tile" data-tile="wpm">
			<small>{{ L.tileWpm }}</small>
			<b :class="$style.wpm">{{ wpm }}<span>{{ L.tileWpmUnit }}</span></b>
		</div>
		<div :class="$style.tile" data-tile="progress">
			<small>{{ L.tileProgress }}</small>
			<b>{{ Math.min(i + 1, total) }}<span> / {{ total }}</span></b>
		</div>
	</div>
	<p v-if="ime" :class="$style.ime" role="status">{{ L.ime }}</p>

	<section
		:key="word.key"
		:class="[$style.card, { [$style.right]: complete }]"
		:style="{ '--g': group?.color ?? null }"
		data-card
		@mousedown="onCardDown"
	>
		<div v-if="group" :class="$style.grp"><i aria-hidden="true"></i>{{ group.label }}</div>
		<button
			v-if="speech"
			type="button"
			class="_button"
			:class="$style.say"
			:aria-label="L.hear(word.w)"
			:title="L.hear(word.w)"
			data-play
			@mousedown.stop
			@click="play"
		>
			<i :class="loading ? ['ti ti-loader-2', $style.spin] : 'ti ti-volume'" aria-hidden="true"></i>
		</button>
		<div :class="[$style.word, { [$style.shake]: shaking }]" :style="{ '--n': chars.length }" lang="en" aria-hidden="true" data-word @animationend="shaking = false">
			<span v-for="(ch, k) in chars" :key="k" :class="[$style.l, k < pos ? $style.ok : k === bad ? $style.bad : k === pos ? $style.cur : null]">{{ ch === ' ' ? '\u00A0' : ch }}</span>
		</div>
		<div :class="$style.zh">
			<span><i v-if="word.pos" :class="$style.pos">{{ word.pos }}</i>{{ word.zh }}</span>
			<span :class="$style.ipa">{{ word.ipa }}</span>
		</div>
		<p v-if="ex.word" :class="$style.ex" lang="en">{{ ex.before }}<b>{{ ex.word + ex.suffix }}</b>{{ ex.after }}</p>
		<p v-if="audioNote" :class="$style.warn" role="status">{{ audioNote }}</p>
	</section>

	<div :class="$style.answer">
		<label :for="inputId" :class="$style.label">{{ L.typeLabel }}</label>
		<input
			:id="inputId"
			ref="inputEl"
			:class="$style.box"
			type="text"
			inputmode="text"
			autocomplete="off"
			autocapitalize="off"
			autocorrect="off"
			spellcheck="false"
			enterkeyhint="next"
			lang="en"
			:readonly="complete"
			:aria-label="L.typeAria(word.w)"
			:placeholder="L.typePlaceholder"
			data-answer
			@input="onInput"
			@keydown="holdCaret"
			@compositionstart="onCompositionStart"
			@compositionend="onCompositionEnd"
			@click="caretToEnd(inputEl)"
		>
		<p :class="$style.fb" role="status" aria-live="polite" data-fb>
			<span v-if="bad != null" :class="$style.badm" data-fb-bad><i class="ti ti-x" aria-hidden="true"></i>{{ L.typeBadBefore(bad + 1) }}<b :class="$style.hl" lang="en">{{ chars[bad] }}</b></span>
			<template v-else>{{ pos > 0 || done > 0 ? L.typeGoing : L.typeHint }}</template>
		</p>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from 'vue';
import XBar from './vocab.bar.vue';
import type { VocabStop } from '@/lojo/vocab/content.js';
import type { Round, TypeEnd } from '@/lojo/vocab/round.js';
import { exParts, typeStep, typingAccuracy, wordsPerMinute } from '@/lojo/vocab/spell.js';
import { audioError, audioKey, audioState, playWord, prefetchWord, stopWordAudio } from '@/lojo/vocab/audio.js';
import { vocabLabels as L } from '@/lojo/vocab/labels.js';
import { blip } from '@/lojo/dictation/sfx.js';
import { touchScreen } from '@/lojo/typing/device.js';
import { cleanTyped } from '@/lojo/typing/score.js';
import { caretToEnd, holdCaret, keysForUs, setBoxValue, useWindowKeys, wantsBox } from '@/lojo/typing/screen.js';

const props = defineProps<{
	stop: VocabStop;
	round: Round;
	sfx: boolean;
	// whether recordings can be made at all (lojo/english/status)
	speech: boolean;
}>();

const emit = defineEmits<{
	(ev: 'finish', end: TypeEnd): void;
	(ev: 'exit'): void;
	(ev: 'toggleSfx'): void;
}>();

const KEY = 'vocab-type:';
// how long a word typed to its end stays before the next one
const NEXT_MS = 380;
const inputId = `vocab-type-${useId()}`;
const rootEl = useTemplateRef('rootEl');
const inputEl = useTemplateRef('inputEl');

const i = ref(0);
// the letters of the word on screen typed right so far, and the one just typed wrong (null: none)
const pos = ref(0);
const bad = ref<number | null>(null);
// the word on screen is typed to its end (and the next comes in a moment)
const complete = ref(false);
const keys = ref(0);
const errs = ref(0);
const done = ref(0);
// when the first key was pressed and the last word was typed to its end
const firstAt = ref<number | null>(null);
const lastAt = ref<number | null>(null);
const shaking = ref(false);
const composing = ref(false);
const ime = ref(false);
// wrong keys by word key
const errsBy: Record<string, number> = {};
let finished = false;
let timer: number | null = null;
const startedAt = Date.now();

const total = computed(() => props.round.words.length);
const word = computed(() => props.round.words[i.value]);
const chars = computed(() => Array.from(word.value.w));
const group = computed(() => props.stop.groups[word.value.group] ?? null);
const ex = computed(() => exParts(word.value));
const sub = computed(() => `${props.stop.band.toFixed(1)} ${props.stop.topic} · ${props.round.label}`);
const acc = computed(() => typingAccuracy(keys.value, errs.value));
const low = computed(() => keys.value > 0 && acc.value < 90);
const wpm = computed(() => (firstAt.value != null && lastAt.value != null ? wordsPerMinute(done.value, lastAt.value - firstAt.value) : 0));

const mine = computed(() => audioKey.value === KEY + word.value.key);
const loading = computed(() => mine.value && audioState.value === 'loading');
const audioNote = computed(() => {
	if (!mine.value) return null;
	if (audioState.value === 'blocked') return L.audioBlocked;
	if (audioState.value === 'failed') return (audioError.value != null ? L.audioErrors[audioError.value] : null) ?? L.audioFailed;
	return null;
});

function clearTimer() {
	if (timer != null) window.clearTimeout(timer);
	timer = null;
}

function focusBox() {
	inputEl.value?.focus({ preventScroll: true });
	caretToEnd(inputEl.value);
}

function play() {
	if (!props.speech) return;
	void playWord(KEY + word.value.key, word.value.w);
	focusBox();
}

// A word comes up: it is read out, and the next one's recording is asked for.
function begin() {
	clearTimer();
	pos.value = 0;
	bad.value = null;
	complete.value = false;
	if (inputEl.value != null) inputEl.value.value = '';
	if (props.speech) {
		void playWord(KEY + word.value.key, word.value.w);
		const after = props.round.words.at(i.value + 1);
		if (after != null) prefetchWord(after.w);
	}
	focusBox();
}

function onInput(ev: Event) {
	// a Chinese keyboard composing letters: wait until it is done
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
	const el = inputEl.value;
	if (el == null || finished || complete.value) return;
	const { text, cjk } = cleanTyped(el.value);
	if (!touchScreen) ime.value = cjk;
	const w = word.value;
	const step = typeStep(w.w, pos.value, text);
	if (step.keys > 0 && firstAt.value == null) firstAt.value = Date.now();
	keys.value += step.keys;
	if (step.errs > 0) {
		errs.value += step.errs;
		errsBy[w.key] = (errsBy[w.key] ?? 0) + step.errs;
		shaking.value = false;
		window.requestAnimationFrame(() => {
			shaking.value = true;
		});
		if (props.sfx) blip('slip');
	}
	bad.value = step.bad;
	pos.value = step.pos;
	setBoxValue(el, step.value);
	if (step.pos >= chars.value.length) wordDone();
}

function wordDone() {
	complete.value = true;
	done.value++;
	lastAt.value = Date.now();
	timer = window.setTimeout(() => {
		timer = null;
		if (i.value + 1 >= total.value) {
			finish(false);
			return;
		}
		i.value++;
		begin();
	}, NEXT_MS);
}

function finish(early: boolean) {
	if (finished) return;
	finished = true;
	clearTimer();
	stopWordAudio();
	const typedMs = firstAt.value != null && lastAt.value != null ? lastAt.value - firstAt.value : 0;
	emit('finish', { kind: 'typing', done: done.value, keys: keys.value, errs: errs.value, errsBy: { ...errsBy }, typedMs, ms: Date.now() - startedAt, early });
}

// Ending with words typed shows what they came to; with none, back to the practice tab.
function exit() {
	if (done.value > 0) finish(done.value < total.value);
	else emit('exit');
}

// A click anywhere on the card puts the cursor in the box (a tap on the box itself is the phone's own).
function onCardDown(ev: MouseEvent) {
	if (touchScreen && ev.target === inputEl.value) return;
	ev.preventDefault();
	focusBox();
}

// On a computer, typing anywhere on the page goes into the box, before the site's own shortcuts.
useWindowKeys(ev => {
	if (touchScreen || finished || !keysForUs(ev, rootEl.value) || !wantsBox(ev)) return;
	inputEl.value?.focus({ preventScroll: true });
}, true);

onMounted(begin);

onBeforeUnmount(() => {
	clearTimer();
	if (audioKey.value?.startsWith(KEY)) stopWordAudio();
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
}

.tiles {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 8px;
	margin: 12px 0 0;
}

.tile {
	min-width: 0;
	padding: 9px 11px 8px;
	border-radius: 14px;
	background: var(--vl-hi);
	text-align: center;

	> small {
		display: block;
		margin-bottom: 1px;
		font-size: 11.5px;
		color: var(--vl-weak);
	}

	> b {
		font-size: 22px;
		color: var(--vl-ink);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
		white-space: nowrap;

		> span {
			font-size: 12px;
			font-weight: 500;
			letter-spacing: 0;
			color: var(--vl-weak);
		}

		&.acc {
			color: var(--vl-ok);
		}

		&.acc.low {
			color: var(--vl-bad);
		}

		&.wpm {
			color: var(--MI_THEME-accent);
		}
	}
}

.ime {
	margin: 10px 0 0;
	padding: 8px 12px;
	border-radius: 12px;
	background: var(--vl-goldBg);
	font-size: 13px;
	text-align: center;
}

.card {
	position: relative;
	margin: 14px 0;
	padding: 16px 18px 20px;
	border-radius: 22px;
	background: var(--MI_THEME-panel);
	box-shadow: var(--vl-shadow);
	text-align: center;
	overflow: hidden;
	cursor: text;
	animation: cardIn 0.32s cubic-bezier(0.2, 0.9, 0.3, 1);

	&::before {
		content: "";
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6px;
		background: var(--g, var(--vl-c));
	}

	&.right {
		box-shadow: inset 0 0 0 2px var(--vl-ok), var(--vl-shadow);
	}
}

.grp {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 3px 11px 3px 9px;
	border-radius: 999px;
	background: var(--vl-hi);
	font-size: 12px;

	> i {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--g, var(--vl-c));
	}
}

.say {
	position: absolute;
	top: 12px;
	right: 12px;
	display: grid;
	place-items: center;
	width: 38px;
	height: 38px;
	border-radius: 50%;
	background: var(--vl-cBg);
	color: var(--vl-cFg);
	font-size: 18px;
	cursor: pointer;

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 1px;
	}
}

// as large as fits: the letters of a long phrase get smaller
.word {
	margin: 22px 0 12px;
	font-family: var(--vl-mono);
	font-size: min(56px, calc((min(100cqi, 680px) - 96px) / (var(--n) * 0.62)));
	font-weight: 600;
	line-height: 1.25;
	letter-spacing: 0.02em;
	white-space: nowrap;

	&.shake {
		animation: nudge 0.3s;
	}
}

.l {
	border-radius: 4px;
	color: color-mix(in srgb, var(--MI_THEME-fg) 20%, transparent);
	transition: color 0.08s;

	&.ok {
		color: var(--vl-ok);
	}

	&.cur {
		color: color-mix(in srgb, var(--MI_THEME-fg) 30%, transparent);
		box-shadow: 0 4px 0 -1px var(--vl-c);
	}

	&.bad {
		color: var(--vl-bad);
		background: var(--vl-badBg);
		text-decoration: underline wavy;
		text-decoration-thickness: 2px;
		text-underline-offset: 6px;
	}
}

.zh {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	justify-content: center;
	gap: 4px 10px;
	padding-top: 12px;
	border-top: 1px solid var(--vl-line);
	font-size: 17px;
	font-weight: 700;
	color: var(--vl-ink);
}

.pos {
	margin-right: 6px;
	font-family: var(--vl-pos);
	font-style: italic;
	font-weight: 400;
	color: var(--vl-weak);
}

.ipa {
	font-family: var(--vl-ipa);
	font-size: 14px;
	font-weight: 400;
	color: var(--vl-weak);
}

.ex {
	margin: 6px 0 0;
	font-size: 14px;
	font-style: italic;
	line-height: 1.6;
	color: var(--vl-weak);

	> b {
		color: var(--vl-ink);
	}
}

.warn {
	margin: 8px 0 0;
	font-size: 12.5px;
	color: var(--vl-bad);
}

.answer {
	margin: 0 0 6px;
}

.label {
	display: block;
	margin: 0 0 6px 4px;
	font-size: 12.5px;
	font-weight: 600;
	color: var(--vl-weak);
}

.box {
	display: block;
	box-sizing: border-box;
	width: 100%;
	height: 52px;
	padding: 0 16px;
	border: 0;
	border-radius: 16px;
	background: var(--MI_THEME-bg);
	color: var(--vl-ink);
	font-family: var(--vl-mono);
	font-size: 20px;
	font-weight: 600;
	letter-spacing: 0.03em;
	text-align: center;
	box-shadow: inset 0 0 0 1.5px var(--vl-line);
	appearance: none;
	transition: box-shadow 0.15s;

	&::placeholder {
		font-family: inherit;
		font-size: 14px;
		font-weight: 400;
		letter-spacing: 0;
		color: color-mix(in srgb, var(--MI_THEME-fg) 45%, transparent);
	}

	&:focus {
		outline: none;
		box-shadow: inset 0 0 0 2px var(--MI_THEME-accent), 0 0 0 4px color-mix(in srgb, var(--MI_THEME-accent) 18%, transparent);
	}

	&[readonly] {
		color: var(--vl-ok);
	}
}

.fb {
	margin: 8px 0 0;
	font-size: 12.5px;
	text-align: center;
	color: var(--vl-weak);
}

.badm {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	font-size: 14px;
	font-weight: 800;
	color: var(--vl-bad);
}

.hl {
	padding: 0 6px;
	border-radius: 5px;
	background: var(--vl-cBg);
	color: var(--vl-cFg);
	font-family: var(--vl-mono);
	font-size: 16px;
}

.spin {
	animation: spin 0.9s linear infinite;
}

@keyframes cardIn {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
}

@keyframes nudge {
	20%, 60% { transform: translateX(-6px); }
	40%, 80% { transform: translateX(6px); }
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
	.card,
	.word.shake,
	.spin {
		animation: none;
	}

	.l {
		transition: none;
	}
}
</style>
