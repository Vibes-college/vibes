<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 拆句: choose what to mark (主语, 谓语, and 从句 when the question asks for clauses), then tap the words. A clause is
its first and last word. Below, what has been marked so far, in words. -->
<template>
<div :class="$style.root">
	<p :class="$style.hint">{{ item.clauses ? gateLabels.parseHintClauses : gateLabels.parseHint }}</p>
	<div :class="$style.modes" role="group" :aria-label="gateLabels.parseModeLabel">
		<button
			v-for="m in modes"
			:key="m"
			type="button"
			class="_button"
			:class="[$style.mode, $style[`mode_${m}`], { [$style.on]: mode === m }]"
			:aria-pressed="mode === m"
			:disabled="disabled"
			@click="setMode(m)"
		>
			<i :class="$style.swatch" aria-hidden="true"></i>{{ gateLabels.parseModes[m] }}
		</button>
	</div>
	<XTokens :tokens="words" :marks="marks" :pending="pending" tappable :disabled="disabled" @tap="tap"/>
	<dl :class="$style.summary" aria-live="polite">
		<div>
			<dt>{{ gateLabels.parseModes.s }}</dt>
			<dd>
				<span v-if="said.s" lang="en">{{ said.s }}</span>
				<span v-else :class="$style.none">{{ gateLabels.notMarked }}</span>
			</dd>
		</div>
		<div>
			<dt>{{ gateLabels.parseModes.v }}</dt>
			<dd>
				<span v-if="said.v" lang="en">{{ said.v }}</span>
				<span v-else :class="$style.none">{{ gateLabels.notMarked }}</span>
			</dd>
		</div>
		<div v-if="item.clauses">
			<dt>{{ gateLabels.parseModes.c }}</dt>
			<dd>
				<span v-if="said.c.length > 0" lang="en">{{ said.c.map(c => `[${c}]`).join(' ') }}</span>
				<span v-if="pending != null" :class="$style.none">{{ gateLabels.clauseEndHint }}</span>
				<span v-else-if="said.c.length === 0" :class="$style.none">{{ gateLabels.notMarked }}</span>
			</dd>
		</div>
	</dl>
	<div :class="$style.tools">
		<button type="button" class="_button" :class="$style.tool" :disabled="disabled || (value === '' && pending == null)" @click="clear">
			<i class="ti ti-eraser" aria-hidden="true"></i> {{ gateLabels.clear }}
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import XTokens from './gate.tokens.vue';
import { decodeParse, encodeParse, markedWords, tapParse, tokens } from '@/lojo/gates/answers.js';
import type { ParseMode } from '@/lojo/gates/answers.js';
import { gateLabels } from '@/lojo/gates/labels.js';
import type { GateItem } from '@/lojo/gates/player.js';

const props = defineProps<{
	item: GateItem;
	disabled?: boolean;
}>();

// {"s":[3,4],"v":[9],"c":[[3,8]]}
const value = defineModel<string>({ default: '' });

const mode = ref<ParseMode>('s');
// a clause's first word, tapped; its last word comes next
const pending = ref<number | null>(null);
const modes = computed<ParseMode[]>(() => (props.item.clauses ? ['s', 'v', 'c'] : ['s', 'v']));
const words = computed(() => tokens(props.item.q));
const marks = computed(() => decodeParse(value.value));
const said = computed(() => markedWords(words.value, marks.value));

function setMode(m: ParseMode) {
	mode.value = m;
	if (m !== 'c') pending.value = null;
}

function tap(i: number) {
	if (props.disabled) return;
	const next = tapParse(marks.value, mode.value, i, pending.value);
	pending.value = next.pending;
	value.value = encodeParse(next.marks);
}

function clear() {
	if (props.disabled) return;
	pending.value = null;
	value.value = '';
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.hint {
	margin: 0;
	font-size: 0.85em;
	opacity: 0.8;
}

.modes {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.mode {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-height: 44px;
	padding: 0 14px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 12px;
	font-weight: bold;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panel);

	&:hover:not(:disabled) {
		border-color: var(--MI_THEME-accent);
	}

	&.on {
		border-color: var(--MI_THEME-fg);
		box-shadow: inset 0 0 0 1px var(--MI_THEME-fg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}

	&:disabled {
		opacity: 0.6;
	}
}

.swatch {
	width: 16px;
	height: 16px;
	border-radius: 5px;

	.mode_s & {
		background: var(--MI_THEME-accent);
	}

	.mode_v & {
		background: var(--MI_THEME-hashtag);
	}

	.mode_c & {
		background: var(--MI_THEME-warn);
	}
}

.summary {
	display: grid;
	gap: 3px;
	margin: 0;
	padding: 8px 12px;
	border-radius: 10px;
	font-size: 0.85em;
	background: var(--MI_THEME-panelHighlight);

	div {
		display: flex;
		gap: 10px;
	}

	dt {
		flex: none;
		min-width: 2.6em;
		opacity: 0.65;
	}

	dd {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 8px;
		margin: 0;
		min-width: 0;
		overflow-wrap: anywhere;
	}
}

.none {
	opacity: 0.6;
}

.tools {
	display: flex;
	justify-content: flex-end;
}

.tool {
	min-height: 36px;
	padding: 0 14px;
	border-radius: 999px;
	font-size: 0.9em;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-buttonBg);

	&:hover:not(:disabled) {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:disabled {
		opacity: 0.45;
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}
</style>
