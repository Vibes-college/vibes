<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 听写's answer box. The real input is on top with see-through text; underneath, the same text is painted letter by
letter: green where it fits an accepted spelling, red and underlined where it doesn't. A visible input, so phones get
their keyboard, with autocorrect, capitals and spellcheck off. -->
<template>
<div :class="[$style.field, { [$style.isBad]: state === 'bad', [$style.isOk]: state === 'ok', [$style.isWrong]: state === 'wrong', [$style.shake]: shaking }]" @mousedown="onMousedown" @animationend="shaking = false">
	<div :class="$style.paint" aria-hidden="true">
		<span :class="$style.text" :style="{ transform: `translateX(${-scrolled}px)` }">
			<template v-if="marks && !composing"><span v-for="(ch, i) in chars" :key="i" :class="marks[i] === 'ok' ? $style.letterOk : marks[i] === 'bad' ? $style.letterBad : undefined">{{ ch }}</span></template>
			<template v-else>{{ raw }}</template>
		</span>
	</div>
	<input
		ref="inputEl"
		:class="$style.input"
		:value="raw"
		type="text"
		:inputmode="inputmode"
		autocomplete="off"
		autocapitalize="off"
		autocorrect="off"
		spellcheck="false"
		enterkeyhint="done"
		maxlength="60"
		:readonly="locked"
		:placeholder="placeholder"
		:aria-label="label"
		:aria-describedby="describedby"
		:aria-invalid="state === 'bad' || state === 'wrong'"
		@input="onInput"
		@keydown="onKeydown"
		@compositionstart="composing = true"
		@compositionend="onCompositionEnd"
		@scroll="syncScroll"
		@keyup="syncScroll"
		@click="syncScroll"
		@select="syncScroll"
		@focus="syncScroll"
	>
	<span v-if="state === 'ok'" :class="[$style.mark, $style.markOk]" aria-hidden="true">✓</span>
	<span v-else-if="state === 'wrong'" :class="[$style.mark, $style.markBad]" aria-hidden="true">✗</span>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import type { LetterMark } from '@/lojo/dictation/mark.js';

const model = defineModel<string>({ required: true });

const props = defineProps<{
	// letter by letter while a word is typed; null paints the text plain
	marks: LetterMark[] | null;
	// bad: a wrong letter while typing; ok / wrong: checked
	state: 'idle' | 'bad' | 'ok' | 'wrong';
	locked: boolean;
	inputmode: 'text' | 'tel' | 'decimal';
	placeholder: string;
	label: string;
	describedby?: string;
}>();

const emit = defineEmits<{
	(ev: 'enter'): void;
	(ev: 'replay'): void;
}>();

const inputEl = useTemplateRef('inputEl');
// What the box shows, including text still being composed with an input method (v-model would skip that).
const raw = ref(model.value);
const composing = ref(false);
const scrolled = ref(0);
const shaking = ref(false);
const chars = computed(() => Array.from(raw.value));

watch(model, v => {
	if (v !== raw.value) raw.value = v;
});

function syncScroll() {
	scrolled.value = inputEl.value?.scrollLeft ?? 0;
}

function onInput(ev: Event) {
	const el = ev.target as HTMLInputElement;
	// ` replays; a Chinese input method turns that key into ·
	if (/[`·]/.test(el.value)) {
		el.value = el.value.replace(/[`·]/g, '');
		emit('replay');
	}
	raw.value = el.value;
	if (!composing.value) model.value = el.value;
	syncScroll();
}

function onCompositionEnd(ev: CompositionEvent) {
	composing.value = false;
	onInput(ev);
}

function onKeydown(ev: KeyboardEvent) {
	if (ev.isComposing || ev.keyCode === 229) return;
	if (ev.key === '`' || ev.key === '·') {
		ev.preventDefault();
		emit('replay');
	} else if (ev.key === 'Enter') {
		ev.preventDefault();
		emit('enter');
	}
}

// A click on the box but not on the text (the ✓, the padding) still puts the cursor in it.
function onMousedown(ev: MouseEvent) {
	if (ev.target !== inputEl.value) {
		ev.preventDefault();
		focus();
	}
}

function focus() {
	inputEl.value?.focus({ preventScroll: true });
}

function blur() {
	inputEl.value?.blur();
}

// A checked answer is shown from its start.
watch(() => props.locked, locked => {
	if (!locked || inputEl.value == null) return;
	inputEl.value.scrollLeft = 0;
	void nextTick(syncScroll);
});

function shake() {
	shaking.value = false;
	void nextTick(() => {
		shaking.value = true;
	});
}

defineExpose({ focus, blur, shake });
</script>

<style lang="scss" module>
.field {
	--ok: color-mix(in srgb, #2F7D5B 82%, var(--MI_THEME-fg));
	--bad: var(--MI_THEME-error);
	position: relative;
	flex: 1;
	min-width: 0;
	height: 62px;
	border-radius: 18px;
	background: var(--MI_THEME-panel);
	box-shadow: inset 0 0 0 2px var(--MI_THEME-divider);
	overflow: hidden;
	cursor: text;
	transition: box-shadow 0.15s;

	&:focus-within {
		box-shadow: inset 0 0 0 2px var(--MI_THEME-accent), 0 0 0 4px var(--MI_THEME-accentedBg);
	}

	&.isBad,
	&.isBad:focus-within,
	&.isWrong,
	&.isWrong:focus-within {
		box-shadow: inset 0 0 0 2.5px var(--bad), 0 0 0 4px color-mix(in srgb, var(--bad) 12%, transparent);
	}

	&.isOk,
	&.isOk:focus-within {
		box-shadow: inset 0 0 0 2.5px var(--ok), 0 0 0 4px color-mix(in srgb, var(--ok) 15%, transparent);
	}
}

.input,
.paint {
	position: absolute;
	inset: 0;
	margin: 0;
	border: 0;
	padding: 0 48px 0 16px;
	font: 500 25px/62px ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Roboto Mono", monospace;
	letter-spacing: 0.05em;
	white-space: pre;
}

.input {
	width: 100%;
	height: 100%;
	background: transparent;
	color: transparent;
	-webkit-text-fill-color: transparent;
	caret-color: var(--MI_THEME-fgHighlighted);
	outline: none;
	appearance: none;
	border-radius: 0;
	text-overflow: clip;

	&::placeholder {
		color: color-mix(in srgb, var(--MI_THEME-fg) 50%, transparent);
		-webkit-text-fill-color: color-mix(in srgb, var(--MI_THEME-fg) 50%, transparent);
		font: 400 15px/62px system-ui, sans-serif;
		letter-spacing: 0.02em;
	}
}

.paint {
	display: flex;
	align-items: center;
	overflow: hidden;
	pointer-events: none;
	color: var(--MI_THEME-fgHighlighted);
	clip-path: inset(0 46px 0 14px);

	.isOk & {
		color: var(--ok);
	}

	.isWrong & {
		color: var(--bad);
	}
}

.text {
	display: block;
	white-space: pre;
}

.letterOk {
	color: var(--ok);
}

.letterBad {
	color: var(--bad);
	text-decoration: underline wavy;
	text-decoration-thickness: 1.5px;
	text-underline-offset: 6px;
}

.mark {
	position: absolute;
	right: 13px;
	top: 50%;
	margin-top: -13px;
	width: 26px;
	height: 26px;
	border-radius: 50%;
	display: grid;
	place-items: center;
	color: var(--MI_THEME-fgOnAccent);
	font-weight: 800;
	font-size: 14px;
	pointer-events: none;
}

.markOk {
	background: var(--ok);
	animation: pop 0.4s ease-out;
}

.markBad {
	background: var(--bad);
}

.shake {
	animation: shake 0.32s;
}

@keyframes pop {
	0% { transform: scale(0.3); }
	60% { transform: scale(1.2); }
	100% { transform: scale(1); }
}

@keyframes shake {
	20% { transform: translateX(-5px); }
	40% { transform: translateX(5px); }
	60% { transform: translateX(-3px); }
	80% { transform: translateX(2px); }
}

@media (min-width: 720px) {
	.field {
		height: 68px;
	}

	.input,
	.paint {
		font-size: 30px;
		line-height: 68px;
		padding-left: 20px;
	}

	.paint {
		clip-path: inset(0 46px 0 18px);
	}
}

@media (prefers-reduced-motion: reduce) {
	.markOk,
	.shake {
		animation: none;
	}
}
</style>
