<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 生词本 review: the answer side of a card. The meaning, how the word is used, the example with the word marked and
its Chinese, and where the word came from. -->
<template>
<div ref="rootEl" :class="$style.root" tabindex="-1">
	<p v-if="withMeaning" class="_selectable" :class="$style.meaning">{{ word.meaning }}</p>
	<p v-if="word.usage" class="_selectable" :class="$style.usage">{{ word.usage }}</p>
	<div v-if="word.example" :class="$style.example">
		<div :class="$style.exampleText">
			<p class="_selectable" :class="$style.exampleEn" lang="en"><template v-for="(part, i) in parts" :key="i"><mark v-if="part.hit" :class="$style.mark">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></p>
			<p v-if="word.exampleZh" class="_selectable" :class="$style.exampleZh">{{ word.exampleZh }}</p>
		</div>
		<button
			v-if="speechSupported"
			type="button"
			class="_button"
			:class="$style.listen"
			:aria-label="speakingKey === exampleKey ? wordbookLabels.stop : wordbookLabels.listenExample"
			:aria-pressed="speakingKey === exampleKey"
			@click="toggleSpeak(exampleKey, word.example)"
		>
			<i :class="loadingKey === exampleKey ? ['ti ti-loader-2', $style.spin] : speakingKey === exampleKey ? 'ti ti-player-stop' : 'ti ti-volume'" aria-hidden="true"></i>
		</button>
	</div>
	<div :class="$style.chips">
		<span :class="[$style.chip, $style.kind]">{{ wordbookLabels.kinds[word.kind] }}</span>
		<span :class="$style.chip">{{ wordbookLabels.sources[word.source] }}</span>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue';
import type { WordReviewItem } from '@/lojo/english/wordbook.js';
import { highlightParts } from '@/lojo/english/review.js';
import { wordbookLabels } from '@/lojo/english/labels.js';
import { loadingKey, speakingKey, speechSupported, toggleSpeak } from '@/lojo/english/speech.js';

const props = defineProps<{
	word: WordReviewItem['word'];
	withMeaning: boolean;
	// the read-aloud key of the example (the card's own prefix)
	exampleKey: string;
}>();

const parts = computed(() => highlightParts(props.word.example, props.word.text));
const rootEl = useTemplateRef('rootEl');

// Shown after 看答案: the focus moves here, so a screen reader reads the answer.
function focus(): void {
	rootEl.value?.focus({ preventScroll: true });
}

defineExpose({ focus });
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 18px;
	padding-top: 18px;
	border-top: 1px dashed var(--MI_THEME-divider);
	text-align: left;

	&:focus {
		outline: none;
	}
}

.meaning {
	margin: 0;
	font: 700 clamp(22px, 6.4vw, 27px) / 1.35 var(--wbSerif);
	color: var(--MI_THEME-brandInk);
}

.usage {
	margin: 0;
	line-height: 1.6;
	opacity: 0.8;
}

.example {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	padding: 12px 14px;
	border-radius: 16px;
	background: color-mix(in srgb, var(--MI_THEME-fg) 6%, var(--MI_THEME-panel));
}

.exampleText {
	flex: 1;
	min-width: 0;
}

.exampleEn {
	margin: 0;
	font: italic 1.12em / 1.55 var(--wbEn);
	color: var(--MI_THEME-brandInk);
}

.mark {
	padding: 0 3px;
	border-radius: 4px;
	color: inherit;
	background: var(--wbGoldBg);
}

.exampleZh {
	margin: 4px 0 0;
	font-size: 0.92em;
	line-height: 1.5;
	opacity: 0.75;
}

.listen {
	flex: none;
	display: grid;
	place-items: center;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	font-size: 1.15em;
	color: var(--MI_THEME-accent);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
	}
}

.chips {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.chip {
	padding: 1px 8px;
	border-radius: 6px;
	font-size: 0.78em;
	font-weight: bold;
	background: var(--MI_THEME-buttonBg);
}

.kind {
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
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
