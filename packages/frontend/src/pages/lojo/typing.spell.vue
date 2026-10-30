<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线, stop 2: no autocorrect. Each word is copied once (the letters people get wrong underlined in yellow), then
covered: with its meaning and a sentence it goes in, it is typed from memory and checked on Enter (capitals don't
matter). A wrong one shows what was typed against the right spelling and how to remember it. The word is read out when
it is covered, where recordings are available. -->
<template>
<div ref="rootEl" :class="[$style.root, touchScreen ? $style.touch : $style.keys]" :data-play="stop.id">
	<XBar :stop="stop" :rule="rule" @exit="emit('exit')"/>
	<XTiles :tiles="tiles"/>
	<p v-if="ime" :class="$style.ime" role="status">{{ L.ime }}</p>
	<p :class="$style.phase" aria-hidden="true">
		<span :class="[$style.ph, { [$style.phOn]: looking }]">{{ L.phaseLook }}</span>
		<span>→</span>
		<span :class="[$style.ph, { [$style.phOn]: !looking }]">{{ L.phaseCover }}</span>
	</p>
	<div :class="[$style.card, { [$style.nofocus]: !focused }]" :data-item="i" :data-phase="phase" @mousedown="onCardDown">
		<p :class="$style.zh">
			<span>{{ word.zh }}</span>
			<button v-if="speech" class="_button" :class="$style.say" :aria-label="L.hear" :title="L.hear" @mousedown.stop @click="hear">
				<i :class="clipText === word.word && clipLoading ? 'ti ti-loader-2' : 'ti ti-volume'" aria-hidden="true"></i>
			</button>
		</p>
		<template v-if="looking">
			<div :class="$style.target" aria-hidden="true" lang="en"><XChars :target="word.word" :typed="typed" :hard="word.hard" :caret="focused" :steady="busy"/></div>
			<p :class="$style.tip">{{ word.tip }}</p>
		</template>
		<template v-else-if="phase === 'cover' || lastRight">
			<p v-if="phase === 'cover'" :class="$style.cover">{{ L.cover }}</p>
			<p :class="$style.sentence" lang="en">{{ gap[0] }}<span :class="$style.gap"></span>{{ gap[1] }}</p>
			<div :class="[$style.recall, { [$style.recallOk]: phase === 'fb' }]" aria-hidden="true" lang="en">
				<XChars plain :target="recall" :typed="recall" :caret="focused && phase === 'cover'" :steady="busy"/>
			</div>
			<p v-if="phase === 'fb'" :class="[$style.fb, $style.fbOk]" role="status">✓ {{ L.right }}</p>
		</template>
		<div v-else :class="[$style.fb, $style.fbBad]" role="status">
			<div :class="$style.row"><small>✗ {{ L.youTyped }}</small><XDiff :class="$style.mono" :typed="lastTyped" :right="word.word" anyCase/></div>
			<div :class="$style.row"><small>{{ L.shouldBe }}</small><span :class="$style.mono" lang="en"><XChars plain :target="word.word" typed="" :hard="word.hard"/></span></div>
			<div :class="$style.row"><small>{{ L.memo }}</small><span>{{ word.tip }}</span></div>
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
				enterkeyhint="done"
				lang="en"
				:maxlength="looking ? word.word.length : 40"
				:aria-label="looking ? L.copyAria(word.word) : L.coverAria(word.zh)"
				@input="onInput"
				@keydown="onKeydown"
				@compositionstart="onCompositionStart"
				@compositionend="onCompositionEnd"
				@focus="onFocus"
				@blur="focused = false"
				@click="caretToEnd(inputEl)"
			>
		</div>
		<p :class="$style.fhint">{{ L.clickToType }}</p>
		<button v-if="touchScreen && (phase === 'cover' || (phase === 'fb' && !lastRight))" class="_button" :class="$style.okbtn" @mousedown.stop @click="act">
			{{ phase === 'cover' ? L.confirm : L.next }}
		</button>
	</div>
	<XMarks :total="stop.items.length" :results="results" :current="i"/>
	<p :class="[$style.under, { [$style.warn]: warn != null }]">{{ warn ?? under }}</p>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, useTemplateRef } from 'vue';
import XBar from './typing.bar.vue';
import XTiles from './typing.tiles.vue';
import XMarks from './typing.marks.vue';
import XChars from './typing.chars.vue';
import XDiff from './typing.diff.vue';
import type { Tile } from './typing.tiles.vue';
import type { Device, SpellStop } from '@/lojo/typing/content.js';
import type { Copied, SpellTry } from '@/lojo/typing/score.js';
import { accuracyOf, cleanTyped, copyTotals, judgeCount } from '@/lojo/typing/score.js';
import { caretToEnd, holdCaret, keysForUs, sayFullWidthOnce, setBoxValue, useStopClock, useWindowKeys, wantsBox } from '@/lojo/typing/screen.js';
import { touchScreen } from '@/lojo/typing/device.js';
import { clipLoading, clipText, loadClips, playClip, stopClip } from '@/lojo/typing/audio.js';
import { typingLabels as L, ruleText } from '@/lojo/typing/labels.js';
import { englishStatus } from '@/lojo/english/api.js';

const props = defineProps<{
	stop: SpellStop;
	device: Device;
}>();

const emit = defineEmits<{
	(ev: 'finish', result: SpellTry): void;
	(ev: 'exit'): void;
}>();

type Phase = 'look' | 'wait' | 'cover' | 'fb';

const inputId = `typing-spell-${useId()}`;
const rootEl = useTemplateRef('rootEl');
const inputEl = useTemplateRef('inputEl');
const i = ref(0);
const phase = ref<Phase>('look');
const typed = ref('');
// the last answer checked, and whether it was right
const lastTyped = ref('');
const lastRight = ref(false);
const answers = shallowRef<{ typed: string; right: boolean }[]>([]);
// the words as copied the first time: the speed
const looks = shallowRef<Copied[]>([]);
const focused = ref(false);
const composing = ref(false);
const ime = ref(false);
const busy = ref(false);
const warn = ref<string | null>(null);
let firstAt: number | null = null;
let finished = false;
let calm: (() => void) | null = null;
let moveOn: (() => void) | null = null;

const clk = useStopClock({
	show() {
		const focusedEl = window.document.activeElement;
		if (focusedEl == null || focusedEl === window.document.body) inputEl.value?.focus({ preventScroll: true });
	},
	hide() {
		if (clipText.value != null) stopClip();
	},
});

const word = computed(() => props.stop.items[i.value]);
const looking = computed(() => phase.value === 'look' || phase.value === 'wait');
const speech = computed(() => englishStatus.value.speech);
const rule = computed(() => ruleText(props.stop, props.device, { wpm: 0, acc: 0 }));
const results = computed(() => answers.value.map(a => a.right));
const gap = computed(() => {
	const [before, after = ''] = word.value.sentence.split('___');
	return [before, after];
});
const recall = computed(() => (phase.value === 'cover' ? typed.value : lastTyped.value));

const under = computed(() => {
	if (looking.value) return L.underLook;
	if (phase.value === 'cover') return touchScreen ? L.underCoverTouch : L.underCover;
	return lastRight.value ? '' : touchScreen ? L.underWrongTouch : L.underWrong;
});

const tiles = computed<Tile[]>(() => {
	const n = props.stop.items.length;
	const right = answers.value.filter(a => a.right).length;
	const acc = accuracyOf(right, answers.value.length);
	const items = looks.value.slice();
	if (phase.value === 'look' && firstAt != null && typed.value !== '') items.push({ target: word.value.word, typed: typed.value, ms: Math.max(0, clk.now.value - firstAt) });
	const t = copyTotals(items);
	return [
		{ id: 'acc', label: L.tileAcc, value: acc == null ? '—' : `${acc}%`, goal: L.coveredRight },
		{ id: 'wpm', label: L.tileWpm, value: t.ms > 1500 ? String(t.wpm) : '—' },
		{ id: 'progress', label: L.tileProgress, value: String(Math.min(i.value + 1, n)), unit: ` / ${n}`, goal: L.goalRight(props.stop.need) },
	];
});

const norm = (s: string) => s.normalize('NFKC').toLowerCase();

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
	const el = inputEl.value;
	if (el == null || finished) return;
	const { text, fullWidth, cjk } = cleanTyped(el.value);
	if (fullWidth) sayFullWidthOnce(L.fullWidth);
	if (!touchScreen) ime.value = cjk;
	if (phase.value === 'look') {
		const target = word.value.word;
		let v = text;
		if (typed.value === '' && v.trim() === '') v = '';
		v = v.slice(0, target.length);
		setBoxValue(el, v);
		if (v !== '' && firstAt == null) firstAt = clk.clock.now();
		typed.value = v;
		settleCaret();
		if (v === target) {
			looks.value = [...looks.value, { target, typed: v, ms: firstAt != null ? clk.clock.now() - firstAt : 0 }];
			firstAt = null;
			phase.value = 'wait';
			clk.after(280, cover);
		}
	} else if (phase.value === 'cover') {
		const v = text.slice(0, 40);
		setBoxValue(el, v);
		typed.value = v;
		warn.value = null;
		settleCaret();
	} else {
		// waiting, or reading what was wrong: the box takes nothing
		setBoxValue(el, '');
	}
}

function settleCaret() {
	busy.value = true;
	calm?.();
	calm = clk.after(600, () => {
		busy.value = false;
	});
}

function cover() {
	if (phase.value !== 'wait') return;
	phase.value = 'cover';
	typed.value = '';
	if (inputEl.value != null) inputEl.value.value = '';
	if (speech.value) void playClip(word.value.word);
}

function judge() {
	const ans = typed.value.trim();
	if (ans === '') {
		warn.value = L.typeFirst;
		return;
	}
	const right = norm(ans) === norm(word.value.word);
	answers.value = [...answers.value, { typed: ans, right }];
	lastTyped.value = ans;
	lastRight.value = right;
	phase.value = 'fb';
	typed.value = '';
	if (inputEl.value != null) inputEl.value.value = '';
	if (right) moveOn = clk.after(850, next);
	// on a phone the keyboard goes down, so the right spelling can be read
	else if (touchScreen) inputEl.value?.blur();
}

function next() {
	if (phase.value !== 'fb') return;
	moveOn?.();
	moveOn = null;
	if (i.value + 1 >= props.stop.items.length) {
		finish();
		return;
	}
	i.value++;
	phase.value = 'look';
	typed.value = '';
	lastTyped.value = '';
	warn.value = null;
}

function act() {
	if (phase.value === 'cover') judge();
	else if (phase.value === 'fb') next();
	if (!finished && phase.value !== 'fb') inputEl.value?.focus({ preventScroll: true });
}

function onKeydown(ev: KeyboardEvent) {
	holdCaret(ev);
	// Enter that ends a Chinese keyboard's composing is not a check (Safari reports it as keyCode 229)
	if (ev.key !== 'Enter' || ev.isComposing || ev.keyCode === 229) return;
	ev.preventDefault();
	act();
}

function finish() {
	finished = true;
	const n = props.stop.items.length;
	const score = answers.value.filter(a => a.right).length;
	const judged = judgeCount(score, props.stop.need);
	emit('finish', {
		kind: 'spell', stop: props.stop.id, device: props.device, pass: judged.pass, checks: judged.checks, ms: clk.clock.now(),
		acc: accuracyOf(score, n) ?? 0, wpm: copyTotals(looks.value).wpm, score, total: n,
		typed: answers.value.map(a => a.typed), right: answers.value.map(a => a.right),
	});
}

function hear() {
	void playClip(word.value.word);
	inputEl.value?.focus({ preventScroll: true });
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

// On a computer, typing anywhere on the page goes into the box; Enter there checks or moves on.
useWindowKeys(ev => {
	if (touchScreen || finished || !keysForUs(ev, rootEl.value)) return;
	if (ev.key === 'Enter' && phase.value === 'fb' && !ev.isComposing && ev.keyCode !== 229) {
		const target = ev.target instanceof Element ? ev.target : null;
		if (target?.closest('button, a, input, textarea') != null) return;
		ev.preventDefault();
		ev.stopPropagation();
		next();
		inputEl.value?.focus({ preventScroll: true });
		return;
	}
	if (wantsBox(ev)) inputEl.value?.focus({ preventScroll: true });
}, true);

onMounted(() => {
	inputEl.value?.focus({ preventScroll: true });
	// the words' recordings, ready for when they are covered
	if (speech.value) void loadClips(props.stop.items.map(w => w.word));
});

onBeforeUnmount(() => {
	if (clipText.value != null) stopClip();
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

.phase {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 8px;
	margin: 0;
	font-size: 13px;
	color: var(--tl-weak);
}

.ph {
	padding: 2px 4px;
}

.phOn {
	color: var(--tl-ink);
	font-weight: 700;
	background: var(--MI_THEME-panel);
	border-radius: 999px;
	padding: 2px 12px;
	box-shadow: inset 0 0 0 1.5px var(--tl-c);
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

.zh {
	font-family: var(--tl-serif);
	font-weight: 700;
	color: var(--tl-ink);
	font-size: 24px;
	margin: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
}

.say {
	position: relative;
	z-index: 3;
	width: 38px;
	height: 38px;
	border-radius: 50%;
	background: var(--tl-hi);
	display: grid;
	place-items: center;
	color: var(--tl-c);
	font-size: 20px;

	&:hover {
		background: var(--MI_THEME-buttonBg);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.target,
.recall {
	font-family: var(--tl-mono);
	font-size: 34px;
	line-height: 1.45;
	min-height: 1.45em;
	margin: 6px 0 4px;
	color: var(--tl-ink);
	overflow-wrap: anywhere;
}

.recallOk {
	color: var(--tl-ok);
}

.tip {
	display: inline-block;
	align-self: center;
	font-size: 13.5px;
	color: var(--tl-gold);
	background: var(--tl-goldBg);
	border-radius: 999px;
	padding: 2px 12px;
	margin: 2px 0 0;
	font-weight: 600;
}

.cover {
	box-sizing: border-box;
	width: 100%;
	margin: 10px auto 2px;
	max-width: 520px;
	border-radius: 14px;
	background: repeating-linear-gradient(-45deg, var(--tl-cBg) 0 10px, color-mix(in srgb, var(--tl-c) 14%, var(--MI_THEME-panel)) 10px 20px);
	color: var(--tl-c);
	font-weight: 700;
	font-size: 13px;
	padding: 6px 10px;
	animation: slidein 0.35s ease-out;
}

@keyframes slidein {
	from { transform: translateY(-8px); opacity: 0; }
}

.sentence {
	font-family: var(--tl-mono);
	font-size: 15.5px;
	margin: 6px 0 2px;
	line-height: 1.6;
}

.gap {
	display: inline-block;
	min-width: 5.5em;
	border-bottom: 2px solid var(--tl-c);
	margin: 0 0.2em;
	vertical-align: -2px;
}

.fb {
	border-radius: 16px;
	padding: 12px 14px;
	margin: 10px 0 0;
	text-align: left;
	font-size: 14px;
	line-height: 1.7;
}

.fbOk {
	background: var(--tl-okBg);
	color: var(--tl-ok);
	font-weight: 700;
	text-align: center;
}

.fbBad {
	background: var(--tl-badBg);
}

.row {
	display: flex;
	gap: 10px;
	align-items: baseline;
	flex-wrap: wrap;

	> small {
		width: 4.5em;
		flex: none;
		color: var(--tl-weak);
		font-weight: 600;
	}
}

.mono {
	font-family: var(--tl-mono);
	font-size: 18px;
	color: var(--tl-ink);
}

.input {
	font: 16px var(--tl-mono);
	color: var(--tl-ink);
}

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

.okbtn {
	position: relative;
	z-index: 3;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	min-height: 48px;
	margin-top: 10px;
	border-radius: 15px;
	background: var(--MI_THEME-buttonBg);
	color: var(--tl-ink);
	font-weight: 700;
	font-size: 16px;

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.under {
	min-height: 1.6em;
	font-size: 13px;
	color: var(--tl-weak);
	text-align: center;
	margin: 0;

	&.warn {
		color: var(--tl-bad);
		font-weight: 600;
	}
}

@media (prefers-reduced-motion: reduce) {
	.cover {
		animation: none;
	}
}

@container typing (min-width: 720px) {
	.card {
		padding: 34px 34px 26px;
		min-height: 250px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.target,
	.recall {
		font-size: 46px;
	}
}
</style>
