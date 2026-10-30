<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 生词本 review: the frame of one card. Its kind (认得 / 拼写), the big prompt (the word, or its meaning to spell),
"再听一遍", then the card's own body, and its answer buttons under the panel. -->
<template>
<article ref="rootEl" :class="$style.root" tabindex="-1" :aria-labelledby="headingId">
	<div :class="$style.card">
		<div :class="$style.top">
			<span :class="[$style.tag, kind === 'spell' ? $style.tagSpell : $style.tagRecognize]">{{ kind === 'spell' ? wordbookLabels.spellTag : wordbookLabels.recognizeTag }}</span>
			<span :class="$style.ask">{{ kind === 'spell' ? wordbookLabels.spellAsk : wordbookLabels.recognizeAsk }}</span>
			<span v-if="first" :class="$style.first">{{ wordbookLabels.firstTime }}</span>
		</div>
		<h2 v-if="kind === 'spell'" :id="headingId" class="_selectable" :class="$style.meaning">{{ prompt }}</h2>
		<h2 v-else :id="headingId" class="_selectable" :class="$style.word" lang="en">{{ prompt }}</h2>
		<button v-if="speechSupported" type="button" class="_button" :class="[$style.sound, { [$style.playing]: speakingKey === soundKey }]" @click="emit('listen')">
			<i :class="loadingKey === soundKey ? ['ti ti-loader-2', $style.spin] : 'ti ti-volume'" aria-hidden="true"></i>
			{{ wordbookLabels.listenAgain }}
		</button>
		<slot></slot>
	</div>
	<div v-if="$slots.actions" :class="$style.actions">
		<slot name="actions"></slot>
	</div>
</article>
</template>

<script lang="ts" setup>
import { computed, useId, useTemplateRef } from 'vue';
import { wordbookLabels } from '@/lojo/english/labels.js';
import { loadingKey, speakingKey, speechSupported } from '@/lojo/english/speech.js';

const props = defineProps<{
	kind: 'recognize' | 'spell';
	first: boolean;
	// the word (认得) or its meaning (拼写)
	prompt: string;
	// the prompt's id, when the card's own fields refer to it
	promptId?: string;
	// the read-aloud key of this card's word, to show it loading or playing
	soundKey: string;
}>();

const emit = defineEmits<{
	(ev: 'listen'): void;
}>();

const ownId = `wordbook-card-${useId()}`;
const headingId = computed(() => props.promptId ?? ownId);
const rootEl = useTemplateRef('rootEl');

// A new card takes the focus, so a screen reader reads it out; the page does not jump.
function focus(): void {
	rootEl.value?.focus({ preventScroll: true });
}

defineExpose({ focus });
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 12px;

	&:focus {
		outline: none;
	}
}

.card {
	padding: 18px 18px 22px;
	border-radius: 24px;
	background: var(--MI_THEME-panel);
	box-shadow: 0 1px 2px color-mix(in srgb, var(--MI_THEME-brandInk) 6%, transparent), 0 10px 28px -12px color-mix(in srgb, var(--MI_THEME-brandInk) 28%, transparent);
	text-align: center;
}

.top {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 18px;
	text-align: left;
	font-size: 0.85em;
}

.tag {
	flex: none;
	padding: 2px 9px;
	border-radius: 8px;
	font-weight: bold;
}

.tagRecognize {
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.tagSpell {
	color: var(--wbGoldFg);
	background: var(--wbGoldBg);
}

.ask {
	min-width: 0;
	opacity: 0.75;
}

.first {
	flex: none;
	margin-left: auto;
	padding: 2px 8px;
	border-radius: 8px;
	font-weight: bold;
	color: var(--wbBadFg);
	background: var(--wbBadBg);
}

.word {
	margin: 18px 0 14px;
	font: 600 clamp(34px, 10vw, 48px) / 1.15 var(--wbEn);
	color: var(--MI_THEME-brandInk);
	overflow-wrap: anywhere;
}

.meaning {
	margin: 14px 0 12px;
	font: 700 clamp(22px, 6.4vw, 28px) / 1.4 var(--wbSerif);
	color: var(--MI_THEME-brandInk);
	letter-spacing: 0.02em;
}

.sound {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-height: 44px;
	padding: 0 18px;
	border-radius: 999px;
	font-weight: bold;
	color: var(--MI_THEME-brandInk);
	background: var(--MI_THEME-buttonBg);

	> i {
		color: var(--MI_THEME-accent);
	}

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}

	&.playing {
		box-shadow: inset 0 0 0 2px var(--MI_THEME-accent);
	}
}

.actions {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
