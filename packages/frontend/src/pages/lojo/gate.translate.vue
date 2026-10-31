<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 中译英: what the question practises, and a box for the English sentence. -->
<template>
<div :class="$style.root">
	<p v-if="item.focus" :class="$style.focus">{{ gateLabels.translateFocus(item.focus) }}</p>
	<label :for="inputId" :class="$style.label">{{ gateLabels.translateLabel }}</label>
	<textarea
		:id="inputId"
		v-model="value"
		:class="$style.input"
		rows="3"
		:maxlength="TRANSLATE_MAX"
		:placeholder="gateLabels.translatePlaceholder"
		:disabled="disabled"
		lang="en"
		autocomplete="off"
		autocapitalize="off"
		autocorrect="off"
		spellcheck="false"
	></textarea>
</div>
</template>

<script lang="ts" setup>
import { useId } from 'vue';
import { TRANSLATE_MAX } from '@/lojo/gates/answers.js';
import { gateLabels } from '@/lojo/gates/labels.js';
import type { GateItem } from '@/lojo/gates/player.js';

defineProps<{
	item: GateItem;
	disabled?: boolean;
}>();

const value = defineModel<string>({ default: '' });
const inputId = useId();
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
}

.focus {
	margin: 0 0 4px;
	padding: 3px 10px;
	border-radius: 8px;
	font-size: 0.85em;
	font-weight: bold;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.label {
	font-size: 0.85em;
	font-weight: bold;
}

.input {
	box-sizing: border-box;
	width: 100%;
	min-height: 96px;
	padding: 10px 12px;
	border: 1px solid var(--MI_THEME-inputBorder);
	border-radius: 10px;
	// 16px or more: iOS zooms the page into smaller text boxes
	font: inherit;
	font-size: max(16px, 1.05em);
	line-height: 1.5;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panel);
	resize: vertical;

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
