<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线, stops 1 and 4: copy the faint text. Each letter turns green or red as it is typed, with a caret where the
next one goes; a red one can be deleted and put right (only what is there when the item is done counts). The item moves
on by itself when it is typed to its end. Accuracy, speed and progress are shown as it goes. On a computer the box sits
unseen over the card, so typing anywhere on the page goes onto the text; on a touch screen it is under the text, with
autocorrect, capitals and spellcheck off. -->
<template>
<div ref="rootEl" :class="[$style.root, touchScreen ? $style.touch : $style.keys]" :data-play="stop.id">
	<XBar :stop="stop" :rule="rule" @exit="emit('exit')"/>
	<XTiles :tiles="tiles"/>
	<p v-if="ime" :class="$style.ime" role="status">{{ L.ime }}</p>
	<div :class="[$style.card, { [$style.nofocus]: !focused }]" :data-item="i" @mousedown="onCardDown">
		<p :class="$style.ctx">
			<span :class="$style.kind">{{ kindLabel }}</span>
			<span v-if="item.field" :class="$style.field" lang="en">{{ item.field }}:</span>
		</p>
		<div :class="[$style.target, { [$style.long]: long }]" aria-hidden="true" lang="en">
			<span v-if="item.prefix" :class="$style.prefix" :title="L.printed">{{ item.prefix }}</span>
			<XChars :target="item.target" :typed="typed" :caret="focused" :steady="busy"/>
		</div>
		<div :class="$style.inwrap">
			<label :for="inputId" :class="$style.inlabel">{{ L.typeHere }}</label>
			<input
				:id="inputId"
				ref="inputEl"
				:class="$style.input"
				type="text"
				inputmode="text"
				autocomplete="off"
				autocapitalize="off"
				autocorrect="off"
				spellcheck="false"
				enterkeyhint="next"
				lang="en"
				:maxlength="item.target.length"
				:aria-label="L.copyAria(item.target)"
				@input="onInput"
				@keydown="holdCaret"
				@compositionstart="onCompositionStart"
				@compositionend="onCompositionEnd"
				@focus="onFocus"
				@blur="focused = false"
				@click="caretToEnd(inputEl)"
			>
		</div>
		<p :class="$style.fhint">{{ L.clickToType }}</p>
	</div>
	<XMarks :total="stop.items.length" :results="results" :current="i"/>
	<p :class="$style.under">{{ long ? L.underSentences : L.underNumbers }}</p>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, shallowRef, useId, useTemplateRef } from 'vue';
import XBar from './typing.bar.vue';
import XTiles from './typing.tiles.vue';
import XMarks from './typing.marks.vue';
import XChars from './typing.chars.vue';
import type { Tile } from './typing.tiles.vue';
import type { CopyStop, Device, Goal } from '@/lojo/typing/content.js';
import type { Copied, CopyTry } from '@/lojo/typing/score.js';
import { cleanTyped, copyTotals, judgeCount, judgeSpeed } from '@/lojo/typing/score.js';
import { caretToEnd, holdCaret, keysForUs, sayFullWidthOnce, setBoxValue, useStopClock, useWindowKeys, wantsBox } from '@/lojo/typing/screen.js';
import { touchScreen } from '@/lojo/typing/device.js';
import { typingLabels as L, ruleText, typingLang } from '@/lojo/typing/labels.js';

const props = defineProps<{
	stop: CopyStop;
	device: Device;
	goal: Goal;
}>();

const emit = defineEmits<{
	(ev: 'finish', result: CopyTry): void;
	(ev: 'exit'): void;
}>();

const inputId = `typing-copy-${useId()}`;
const rootEl = useTemplateRef('rootEl');
const inputEl = useTemplateRef('inputEl');
const i = ref(0);
// what counts as typed: not letters a Chinese keyboard is still composing
const typed = ref('');
const done = shallowRef<Copied[]>([]);
const results = ref<boolean[]>([]);
const focused = ref(false);
const composing = ref(false);
const ime = ref(false);
// typed just now: the caret holds still
const busy = ref(false);
// the clock's time at the first key of the item being typed
let firstAt: number | null = null;
let finished = false;
let calm: (() => void) | null = null;

const clk = useStopClock({
	show() {
		const focusedEl = window.document.activeElement;
		if (focusedEl == null || focusedEl === window.document.body) inputEl.value?.focus({ preventScroll: true });
	},
});

const item = computed(() => props.stop.items[i.value]);
// stop 4: sentences, passed on accuracy and speed; stop 1: short items, passed on how many are exactly right
const long = computed(() => props.stop.need == null);
const rule = computed(() => ruleText(props.stop, props.device, props.goal));
const kindLabel = computed(() => item.value.kind?.[typingLang] ?? L.sentenceNo(i.value + 1));

const live = computed(() => {
	const items = done.value.slice();
	if (!finished && firstAt != null && typed.value !== '') items.push({ target: item.value.target, typed: typed.value, ms: Math.max(0, clk.now.value - firstAt) });
	return copyTotals(items);
});

const tiles = computed<Tile[]>(() => {
	const t = live.value;
	const n = props.stop.items.length;
	const acc = t.acc == null ? '—' : `${t.acc}%`;
	// a speed from the first second or so means nothing yet
	const wpm = t.ms > 1500 ? String(t.wpm) : '—';
	const progress = { id: 'progress', label: L.tileProgress, value: String(Math.min(i.value + 1, n)), unit: ` / ${n}` };
	if (props.stop.need != null) {
		return [{ id: 'acc', label: L.tileAcc, value: acc }, { id: 'wpm', label: L.tileWpm, value: wpm }, { ...progress, goal: L.goalAllRight(props.stop.need) }];
	}
	const phone = props.device === 'phone';
	return [
		{ id: 'acc', label: L.tileAcc, value: acc, goal: L.goalAcc(props.goal.acc), met: t.acc != null && t.acc >= props.goal.acc },
		{ id: 'wpm', label: L.tileWpm, value: wpm, goal: phone ? L.goalPhoneWpm : L.goalWpm(props.goal.wpm), met: !phone && t.ms > 1500 && t.wpm >= props.goal.wpm },
		progress,
	];
});

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
	if (el == null || finished) return;
	const { text, fullWidth, cjk } = cleanTyped(el.value);
	if (fullWidth) sayFullWidthOnce(L.fullWidth);
	if (!touchScreen) ime.value = cjk;
	const target = item.value.target;
	let v = text;
	// a space left over from the item before
	if (typed.value === '' && v.trim() === '' && !target.startsWith(' ')) v = '';
	v = v.slice(0, target.length);
	setBoxValue(el, v);
	if (v !== '' && firstAt == null) firstAt = clk.clock.now();
	typed.value = v;
	busy.value = true;
	calm?.();
	calm = clk.after(600, () => {
		busy.value = false;
	});
	if (v.length === target.length) complete();
}

function complete() {
	const it = item.value;
	const ms = firstAt != null ? clk.clock.now() - firstAt : 0;
	done.value = [...done.value, { target: it.target, typed: typed.value, ms }];
	results.value = [...results.value, typed.value === it.target];
	firstAt = null;
	if (i.value + 1 < props.stop.items.length) {
		i.value++;
		typed.value = '';
		if (inputEl.value != null) inputEl.value.value = '';
		return;
	}
	finish();
}

function finish() {
	finished = true;
	const t = copyTotals(done.value);
	const n = props.stop.items.length;
	const score = results.value.filter(Boolean).length;
	const acc = t.acc ?? 0;
	const judged = props.stop.need != null ? judgeCount(score, props.stop.need) : judgeSpeed(acc, t.wpm, props.device, props.goal);
	emit('finish', {
		kind: 'copy', stop: props.stop.id, device: props.device, pass: judged.pass, checks: judged.checks, ms: clk.clock.now(),
		acc, wpm: t.wpm, score: props.stop.need != null ? score : null, total: props.stop.need != null ? n : null,
		typed: done.value.map(d => d.typed),
	});
}

// A click anywhere on the card puts the cursor in the box, at its end (a tap on the box itself is the phone's own).
function onCardDown(ev: MouseEvent) {
	if (touchScreen && ev.target === inputEl.value) return;
	ev.preventDefault();
	inputEl.value?.focus({ preventScroll: true });
	caretToEnd(inputEl.value);
}

function onFocus() {
	focused.value = true;
	caretToEnd(inputEl.value);
}

// On a computer, typing anywhere on the page goes onto the text, before the site's own shortcuts (p, n, s…).
useWindowKeys(ev => {
	if (touchScreen || finished || !keysForUs(ev, rootEl.value) || !wantsBox(ev)) return;
	inputEl.value?.focus({ preventScroll: true });
}, true);

onMounted(() => {
	inputEl.value?.focus({ preventScroll: true });
});
</script>

<style lang="scss" module>
.root {
	max-width: 860px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 12px;
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

.card {
	position: relative;
	background: var(--MI_THEME-panel);
	border-radius: 22px;
	box-shadow: var(--tl-shadow);
	padding: 22px 18px 18px;
	text-align: center;
	cursor: text;
	transition: box-shadow 0.2s;

	.keys &:focus-within {
		box-shadow: var(--tl-shadow), 0 0 0 3px color-mix(in srgb, var(--tl-c) 45%, transparent);
	}
}

.ctx {
	margin: 0 0 8px;
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: baseline;
	gap: 4px 10px;
}

.kind {
	font-size: 12.5px;
	font-weight: 700;
	color: var(--tl-c);
	background: var(--tl-cBg);
	border-radius: 999px;
	padding: 1px 10px;
}

.field {
	font-size: 15px;
	color: var(--tl-weak);
	font-family: var(--tl-mono);
}

.target {
	font-family: var(--tl-mono);
	font-size: 34px;
	line-height: 1.45;
	letter-spacing: 0.02em;
	margin: 6px 0 4px;
	min-height: 1.45em;
	color: var(--tl-ink);

	&.long {
		font-size: 21px;
		line-height: 1.7;
		text-align: left;
		letter-spacing: 0;
	}
}

.prefix {
	display: inline-block;
	color: var(--tl-ink);
	background: var(--tl-hi);
	border-radius: 8px;
	padding: 0 0.2em;
	margin-right: 0.25em;
	font-weight: 600;
	box-shadow: inset 0 0 0 1.5px var(--tl-line);
}

.input {
	font: 16px var(--tl-mono);
	color: var(--tl-ink);
}

// on a computer the box lies unseen over the whole card
.keys {
	.input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		border: 0;
		opacity: 0;
		cursor: text;
		z-index: 2;
	}

	.inlabel {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
	}

	.nofocus .fhint {
		display: block;
	}
}

// on a touch screen it is a box under the text, so the keyboard comes up
.touch {
	.inwrap {
		display: flex;
		flex-direction: column;
		gap: 4px;
		text-align: left;
		margin-top: 12px;
	}

	.inlabel {
		font-size: 12px;
		color: var(--tl-weak);
		font-weight: 600;
	}

	.input {
		box-sizing: border-box;
		width: 100%;
		height: 48px;
		border: 0;
		border-radius: 12px;
		background: var(--tl-hi);
		padding: 0 14px;
		font-size: 18px;
		box-shadow: inset 0 -2px 0 var(--tl-c);
		outline: none;

		&:focus {
			box-shadow: inset 0 0 0 2px var(--tl-c);
		}
	}
}

.fhint {
	display: none;
	margin: 8px 0 0;
	font-size: 13px;
	color: var(--MI_THEME-accent);
	font-weight: 600;
}

.under {
	font-size: 13px;
	color: var(--tl-weak);
	text-align: center;
	margin: 0;
}

@container typing (min-width: 720px) {
	.card {
		padding: 34px 34px 26px;
		min-height: 250px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.target {
		font-size: 46px;

		&.long {
			font-size: 25px;
		}
	}
}
</style>
