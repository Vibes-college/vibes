<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 听音拼写: a play button for the word (it can be heard a few times, and says how many are left) and a box to spell
it in. Spelling is what's tested, so the keyboard doesn't correct, capitalise or check it. -->
<template>
<div :class="$style.root">
	<button
		type="button"
		class="_button"
		:class="[$style.play, { [$style.busy]: busy }]"
		:disabled="disabled || left <= 0 || !item.audio"
		:aria-label="gateLabels.playWord(n)"
		:aria-describedby="countId"
		@click="play"
	>
		<i :class="busy ? 'ti ti-volume' : 'ti ti-player-play-filled'" aria-hidden="true"></i>
	</button>
	<span :id="countId" :class="[$style.count, { [$style.warn]: failed }]" aria-live="polite">{{ countText }}</span>
	<input
		v-model="value"
		type="text"
		data-gate-gap
		:class="$style.input"
		:aria-label="gateLabels.spellInput(n)"
		:placeholder="gateLabels.spellPlaceholder"
		:disabled="disabled"
		maxlength="80"
		lang="en"
		inputmode="text"
		autocomplete="off"
		autocapitalize="off"
		autocorrect="off"
		spellcheck="false"
		enterkeyhint="next"
		@keydown.enter.prevent="toNext"
	>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, useId } from 'vue';
import { DEFAULT_PLAYS } from '@/lojo/gates/answers.js';
import { gateLabels } from '@/lojo/gates/labels.js';
import type { GateItem } from '@/lojo/gates/player.js';
import { playWord, stopWordAudio, wordAudioKey, wordAudioState } from '@/lojo/gates/word-audio.js';

const props = defineProps<{
	item: GateItem;
	n: number;
	disabled?: boolean;
}>();

const value = defineModel<string>({ default: '' });

const countId = useId();
const key = useId();
// plays that started; one that failed to load doesn't count
const used = ref(0);
const max = computed(() => Math.max(1, props.item.plays ?? DEFAULT_PLAYS));
const left = computed(() => Math.max(0, max.value - used.value));
const mine = computed(() => wordAudioKey.value === key);
const busy = computed(() => mine.value && (wordAudioState.value === 'loading' || wordAudioState.value === 'playing'));
const failed = computed(() => mine.value && wordAudioState.value === 'failed');

const countText = computed(() => {
	if (!props.item.audio) return gateLabels.noWordAudio;
	if (busy.value) return gateLabels.playing;
	if (failed.value && left.value > 0) return gateLabels.wordAudioFailed;
	if (left.value <= 0) return gateLabels.playsUsed;
	return used.value === 0 ? gateLabels.playsFirst(max.value) : gateLabels.playsLeft(left.value);
});

async function play() {
	const url = props.item.audio;
	// a second tap while it plays would only waste a play
	if (props.disabled || busy.value || left.value <= 0 || !url) return;
	if (await playWord(key, url)) used.value++;
}

// Enter (the keyboard's "next" key on phones) moves on to the next box, as in a form.
function toNext(ev: KeyboardEvent) {
	const current = ev.target as HTMLInputElement;
	const boxes = [...window.document.querySelectorAll<HTMLInputElement>('input[data-gate-gap]')].filter(x => !x.disabled);
	const following = boxes[boxes.indexOf(current) + 1];
	if (following != null) following.focus();
	else current.blur();
}

onBeforeUnmount(() => {
	if (mine.value) stopWordAudio();
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px 10px;
}

.play {
	flex-shrink: 0;
	display: grid;
	place-items: center;
	width: 44px;
	height: 44px;
	border-radius: 50%;
	font-size: 20px;
	color: var(--MI_THEME-fgOnAccent);
	background: var(--MI_THEME-accent);
	transition: opacity 0.12s ease;

	&.busy {
		color: var(--MI_THEME-accent);
		background: var(--MI_THEME-accentedBg);
	}

	&:disabled:not(.busy) {
		opacity: 0.4;
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.count {
	flex: 0 1 auto;
	min-width: 6.5em;
	font-size: 0.85em;
	opacity: 0.8;

	&.warn {
		color: var(--MI_THEME-warn);
		opacity: 1;
	}
}

.input {
	box-sizing: border-box;
	flex: 1 1 180px;
	min-width: 0;
	height: 44px;
	padding: 0 12px;
	border: 1px solid var(--MI_THEME-inputBorder);
	border-radius: 10px;
	// 16px or more: iOS zooms the page into smaller text boxes
	font: inherit;
	font-size: max(16px, 1.05em);
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panel);
	transition: border-color 0.1s ease;

	&:hover {
		border-color: var(--MI_THEME-inputBorderHover);
	}

	&:focus {
		outline: none;
		border-color: var(--MI_THEME-accent);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 1px;
	}

	&:disabled {
		opacity: 0.6;
	}
}
</style>
