<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 找错改错: the sentence as words to tap. Tap the one that's wrong, then pick its change from the options or type the
right word. Picking another word starts its change over. -->
<template>
<div :class="$style.root">
	<XTokens :tokens="words" :selected="answer.at" tappable pickable :disabled="disabled" @tap="pick"/>
	<div v-if="answer.at != null" :class="$style.box">
		<p :class="$style.boxHead">
			{{ gateLabels.fixTo[0] }} <b lang="en">{{ picked }}</b> {{ gateLabels.fixTo[1] }}
		</p>
		<div v-if="mode === 'choose'" :class="$style.options" role="radiogroup" :aria-label="gateLabels.fixOptions">
			<button
				v-for="(option, oi) in item.options"
				:key="oi"
				type="button"
				class="_button"
				:class="[$style.option, { [$style.on]: answer.fix === option }]"
				role="radio"
				:aria-checked="answer.fix === option"
				:disabled="disabled"
				@click="change(option)"
			><span :lang="/[a-z]/i.test(option) ? 'en' : undefined">{{ option }}</span></button>
		</div>
		<template v-else>
			<label :for="inputId" :class="$style.label">{{ gateLabels.fixTypeLabel }}</label>
			<input
				:id="inputId"
				:value="answer.fix"
				type="text"
				:class="$style.input"
				:disabled="disabled"
				maxlength="40"
				lang="en"
				autocomplete="off"
				autocapitalize="off"
				autocorrect="off"
				spellcheck="false"
				enterkeyhint="done"
				@input="change(($event.target as HTMLInputElement).value)"
				@keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
			>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, useId } from 'vue';
import XTokens from './gate.tokens.vue';
import { bare, decodeFix, encodeFix, pickFixWord, tokens } from '@/lojo/gates/answers.js';
import { gateLabels } from '@/lojo/gates/labels.js';
import type { GateItem } from '@/lojo/gates/player.js';

const props = defineProps<{
	item: GateItem;
	disabled?: boolean;
}>();

// "3|is": the wrong word's place, then its change
const value = defineModel<string>({ default: '' });

const inputId = useId();
const words = computed(() => tokens(props.item.q));
const answer = computed(() => decodeFix(value.value));
const picked = computed(() => (answer.value.at != null ? bare(words.value[answer.value.at] ?? '') : ''));
// the paper says; a fix with options to pick from is the choosing kind
const mode = computed(() => props.item.mode ?? (props.item.options.length > 0 ? 'choose' : 'type'));

function pick(i: number) {
	if (props.disabled) return;
	value.value = encodeFix(pickFixWord(answer.value, i));
}

function change(fix: string) {
	if (props.disabled || answer.value.at == null) return;
	value.value = encodeFix({ at: answer.value.at, fix });
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.box {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panelHighlight);
}

.boxHead {
	margin: 0;
	font-size: 0.9em;

	b {
		font-size: 1.1em;
		color: var(--MI_THEME-error);
	}
}

.options {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	gap: 8px;
}

.option {
	min-height: 44px;
	padding: 6px 12px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	text-align: center;
	line-height: 1.4;
	background: var(--MI_THEME-panel);

	&:hover:not(:disabled) {
		border-color: var(--MI_THEME-accent);
	}

	&.on {
		border-color: var(--MI_THEME-accent);
		background: var(--MI_THEME-accentedBg);
		box-shadow: inset 0 0 0 1px var(--MI_THEME-accent);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}

	&:disabled {
		opacity: 0.6;
	}
}

.label {
	font-size: 0.85em;
	font-weight: bold;
}

.input {
	box-sizing: border-box;
	width: 100%;
	max-width: 320px;
	height: 44px;
	padding: 0 12px;
	border: 1px solid var(--MI_THEME-inputBorder);
	border-radius: 10px;
	// 16px or more: iOS zooms the page into smaller text boxes
	font: inherit;
	font-size: max(16px, 1.05em);
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panel);

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
