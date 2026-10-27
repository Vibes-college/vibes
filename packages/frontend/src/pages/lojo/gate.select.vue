<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- One gap in a summary with a box of words: "(11) ______" becomes a drop-down of the box's words for question 11. -->
<template>
<span :class="$style.root">
	<span :class="$style.num" aria-hidden="true">{{ n }}</span>
	<select v-model="value" :class="[$style.select, { [$style.empty]: value === '' }]" :aria-label="gateLabels.question(n)" :disabled="disabled">
		<option value="">{{ gateLabels.pickWord }}</option>
		<option v-for="(letter, i) in letters" :key="letter" :value="letter">{{ letter }} {{ options[i] }}</option>
	</select>
</span>
</template>

<script lang="ts" setup>
import { gateLabels } from '@/lojo/gates/labels.js';

defineProps<{
	n: number;
	letters: string[];
	// the box's words, in the order of the letters
	options: string[];
	disabled?: boolean;
}>();

const value = defineModel<string>({ default: '' });
</script>

<style lang="scss" module>
.root {
	display: inline-flex;
	align-items: baseline;
	gap: 4px;
	margin: 2px 2px;
	max-width: 100%;
	vertical-align: baseline;
}

.num {
	flex-shrink: 0;
	min-width: 1.6em;
	padding: 0 4px;
	border-radius: 999px;
	font-size: 0.75em;
	font-weight: bold;
	line-height: 1.6;
	text-align: center;
	color: var(--MI_THEME-fgOnAccent);
	background: var(--MI_THEME-accent);
}

.select {
	min-width: 0;
	max-width: 100%;
	padding: 3px 6px;
	border: none;
	border-bottom: 2px solid var(--MI_THEME-accent);
	border-radius: 6px 6px 0 0;
	// 16px or more: iOS zooms the page into smaller controls
	font: inherit;
	font-size: max(16px, 1em);
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panelHighlight);

	&.empty {
		border-bottom-color: var(--MI_THEME-inputBorder);
		color: color-mix(in srgb, var(--MI_THEME-fg) 60%, transparent);
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
