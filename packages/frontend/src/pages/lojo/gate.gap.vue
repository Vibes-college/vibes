<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- One gap in a form, note or table: "(3) ______" becomes a text box for question 3. Spelling is tested, so no autocorrect. -->
<template>
<span :class="$style.root">
	<span :class="$style.num" aria-hidden="true">{{ n }}</span>
	<input
		v-model="value"
		type="text"
		data-gate-gap
		:class="$style.input"
		:style="{ width: `${width}ch` }"
		:aria-label="gateLabels.question(n)"
		:aria-describedby="limit ? limitId : undefined"
		:disabled="disabled"
		maxlength="80"
		autocomplete="off"
		autocapitalize="off"
		autocorrect="off"
		spellcheck="false"
		enterkeyhint="next"
		@keydown.enter.prevent="toNext"
	>
	<small v-if="limit" :id="limitId" :class="$style.limit">{{ gateLabels.gapLimit(limit) }}</small>
</span>
</template>

<script lang="ts" setup>
import { computed, useId } from 'vue';
import { gateLabels } from '@/lojo/gates/labels.js';
import type { GateLimit } from '@/lojo/gates/player.js';

defineProps<{
	n: number;
	// only when this gap's word limit differs from the group's
	limit: GateLimit | null;
	disabled?: boolean;
}>();

const value = defineModel<string>({ default: '' });
const limitId = useId();

// Grows with the answer, from a short box to most of a phone's line.
const width = computed(() => Math.min(22, Math.max(7, value.value.length + 2)));

// Enter (the keyboard's "next" key on phones) moves on to the next gap.
function toNext(ev: KeyboardEvent) {
	const current = ev.target as HTMLInputElement;
	const gaps = [...window.document.querySelectorAll<HTMLInputElement>('input[data-gate-gap]')].filter(x => !x.disabled);
	const following = gaps[gaps.indexOf(current) + 1];
	if (following != null) following.focus();
	else current.blur();
}
</script>

<style lang="scss" module>
.root {
	display: inline-flex;
	align-items: baseline;
	flex-wrap: wrap;
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

.input {
	box-sizing: border-box;
	min-width: 0;
	max-width: 100%;
	padding: 3px 6px;
	border: none;
	border-bottom: 2px solid var(--MI_THEME-inputBorder);
	border-radius: 6px 6px 0 0;
	// 16px or more: iOS zooms the page into smaller text boxes
	font: inherit;
	font-size: max(16px, 1em);
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panelHighlight);
	transition: border-color 0.1s ease;

	&:hover {
		border-bottom-color: var(--MI_THEME-inputBorderHover);
	}

	&:focus {
		outline: none;
		border-bottom-color: var(--MI_THEME-accent);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 1px;
	}

	&:disabled {
		opacity: 0.6;
	}
}

.limit {
	font-size: 0.75em;
	opacity: 0.7;
}
</style>
