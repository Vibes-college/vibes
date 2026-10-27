<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- One group of questions on the gate's paper: a form with gaps, choices, a map or a matching box. -->
<template>
<section :class="$style.root" :aria-labelledby="headId">
	<header :class="$style.head">
		<span :id="headId" :class="$style.range">{{ gateLabels.questionRange(numbers[0], numbers[numbers.length - 1]) }}</span>
		<p :class="$style.instructions" lang="en">{{ group.instructions.en }}</p>
		<p :class="$style.zh">{{ group.instructions.zh }}</p>
		<p v-if="group.type === 'form' && group.limit && gateLabels.limit(group.limit)" :class="$style.limit">
			<i class="ti ti-pencil" aria-hidden="true"></i> {{ gateLabels.limit(group.limit) }}
		</p>
	</header>

	<!-- form, notes, table and sentence completion -->
	<div v-if="group.type === 'form'" :class="$style.form" lang="en">
		<b v-if="group.title" :class="$style.title">{{ group.title }}</b>
		<template v-for="(block, bi) in blocks" :key="bi">
			<p v-if="block.kind === 'line'" :class="$style.line">
				<template v-for="(seg, si) in block.segments" :key="si">
					<span v-if="seg.type === 'text'">{{ seg.text }}</span>
					<XGap v-else v-model="text[seg.n]" :n="seg.n" :limit="gapLimit(seg.n)" :disabled="disabled"/>
				</template>
			</p>
			<div v-else :class="$style.tableWrap">
				<table :class="$style.table">
					<thead v-if="block.head">
						<tr><th v-for="(cell, ci) in block.head" :key="ci">{{ cellText(cell) }}</th></tr>
					</thead>
					<tbody>
						<tr v-for="(row, ri) in block.rows" :key="ri">
							<td v-for="(cell, ci) in row" :key="ci">
								<template v-for="(seg, si) in cell" :key="si">
									<span v-if="seg.type === 'text'">{{ seg.text }}</span>
									<XGap v-else v-model="text[seg.n]" :n="seg.n" :limit="gapLimit(seg.n)" :disabled="disabled"/>
								</template>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</template>
	</div>

	<!-- a map or plan with letters on it -->
	<figure v-if="group.type === 'map' && group.image" :class="[$style.map, { [$style.zoomed]: zoomed }]">
		<img :src="group.image" :alt="gateLabels.mapAlt" draggable="false">
		<button class="_button" :class="$style.zoom" :aria-pressed="zoomed" @click="zoomed = !zoomed">
			<i :class="zoomed ? 'ti ti-zoom-out' : 'ti ti-zoom-in'"></i> {{ zoomed ? gateLabels.zoomOut : gateLabels.zoomIn }}
		</button>
	</figure>

	<!-- the box of options a matching group picks from -->
	<div v-if="group.type === 'match'" :class="$style.box" lang="en">
		<b v-if="group.title" :class="$style.title">{{ group.title }}</b>
		<span :class="$style.boxLabel">{{ gateLabels.optionsBox }}</span>
		<ul :class="$style.boxList">
			<li v-for="(option, oi) in group.options" :key="oi"><b>{{ letters[oi] }}</b> {{ option }}</li>
		</ul>
	</div>

	<!-- one question per item: a choice, several choices, or a letter -->
	<template v-if="group.type !== 'form'">
		<div v-for="item in group.items" :key="item.n.join('-')" :class="$style.item" role="group" :aria-labelledby="`${headId}-${itemKey(item)}`">
			<p :id="`${headId}-${itemKey(item)}`" :class="$style.q" lang="en">
				<span :class="$style.num">{{ item.n.length > 1 ? `${item.n[0]}–${item.n[item.n.length - 1]}` : item.n[0] }}</span>
				{{ item.q }}
				<small v-if="group.type === 'multi'" :class="$style.choose">{{ gateLabels.choose(item.choose) }} · {{ gateLabels.picked(picks(item).length, item.choose) }}</small>
			</p>
			<div v-if="group.type === 'choice' || group.type === 'multi'" :class="$style.options" :role="group.type === 'choice' ? 'radiogroup' : undefined">
				<button
					v-for="(option, oi) in item.options"
					:key="oi"
					class="_button"
					:class="[$style.option, { [$style.on]: chosen(group.type, item, letterAt(oi)) }]"
					:role="group.type === 'choice' ? 'radio' : 'checkbox'"
					:aria-checked="chosen(group.type, item, letterAt(oi))"
					:disabled="disabled || (group.type === 'multi' && !chosen('multi', item, letterAt(oi)) && picks(item).length >= item.choose)"
					lang="en"
					@click="choose(group.type, item, letterAt(oi))"
				>
					<b :class="$style.letter">{{ letterAt(oi) }}</b>
					<span>{{ option }}</span>
				</button>
			</div>
			<div v-else :class="$style.letters" role="radiogroup">
				<button
					v-for="letter in letters"
					:key="letter"
					class="_button"
					:class="[$style.letterBtn, { [$style.on]: text[item.n[0]] === letter }]"
					role="radio"
					:aria-checked="text[item.n[0]] === letter"
					:aria-label="letterLabel(letter)"
					:disabled="disabled"
					@click="choose(group.type, item, letter)"
				>{{ letter }}</button>
			</div>
		</div>
	</template>
</section>
</template>

<script lang="ts" setup>
import { computed, ref, useId } from 'vue';
import XGap from './gate.gap.vue';
import { gateLabels } from '@/lojo/gates/labels.js';
import { formBlocks, groupNumbers, itemKey, letterAt, letterText, pickLetters } from '@/lojo/gates/player.js';
import type { FormCell, GateAnswers, GateGroup, GateItem, GateLimit } from '@/lojo/gates/player.js';

const props = defineProps<{
	group: GateGroup;
	disabled?: boolean;
}>();

// Shared with the page: one entry per question number; a multi item's letters sit under its first number.
const answers = defineModel<GateAnswers>({ required: true });

const headId = useId();
const zoomed = ref(false);
const numbers = computed(() => groupNumbers(props.group));
const blocks = computed(() => (props.group.type === 'form' ? formBlocks(props.group.lines) : []));
const letters = computed(() => pickLetters(props.group));

// The text boxes write straight into the shared answers.
const text = new Proxy({} as Record<number, string>, {
	get: (_, key) => {
		const v = answers.value[Number(key)];
		return typeof v === 'string' ? v : '';
	},
	set: (_, key, value: string) => {
		answers.value = { ...answers.value, [Number(key)]: value };
		return true;
	},
});

// A gap's own word limit, only when it differs from the group's (shown under that gap).
function gapLimit(n: number): GateLimit | null {
	const own = props.group.items.find(i => i.n.includes(n))?.limit ?? null;
	if (own == null) return null;
	const g = props.group.limit;
	return g != null && g.words === own.words && g.number === own.number ? null : own;
}

const cellText = (cell: FormCell) => cell.map(seg => (seg.type === 'text' ? seg.text : '____')).join('');

function picks(item: GateItem): string[] {
	const v = answers.value[itemKey(item)];
	return Array.isArray(v) ? v : [];
}

function chosen(type: GateGroup['type'], item: GateItem, letter: string): boolean {
	return type === 'multi' ? picks(item).includes(letter) : answers.value[item.n[0]] === letter;
}

function choose(type: GateGroup['type'], item: GateItem, letter: string) {
	if (props.disabled) return;
	if (type === 'multi') {
		const now = picks(item);
		const next = now.includes(letter) ? now.filter(x => x !== letter) : now.length < item.choose ? [...now, letter] : now;
		answers.value = { ...answers.value, [itemKey(item)]: next };
	} else {
		// tapping the picked letter again clears it
		answers.value = { ...answers.value, [item.n[0]]: answers.value[item.n[0]] === letter ? '' : letter };
	}
}

function letterLabel(letter: string): string {
	const words = letterText(props.group, null, letter);
	return words ? gateLabels.letterOption(letter, words) : letter;
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
}

.head {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.range {
	align-self: flex-start;
	padding: 2px 10px;
	border-radius: 999px;
	font-size: 0.8em;
	font-weight: bold;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.instructions {
	margin: 0;
	font-weight: bold;
	line-height: 1.5;
}

.zh {
	margin: 0;
	font-size: 0.85em;
	opacity: 0.75;
}

.limit {
	margin: 2px 0 0;
	font-size: 0.85em;
	color: var(--MI_THEME-accent);
}

.form {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 12px 14px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	line-height: 2.1;
}

.title {
	line-height: 1.5;
	margin-bottom: 4px;
}

.line {
	margin: 0;
	overflow-wrap: anywhere;
}

.tableWrap {
	overflow-x: auto;
}

.table {
	border-collapse: collapse;
	min-width: 100%;
	line-height: 1.6;

	th, td {
		padding: 6px 8px;
		border: 1px solid var(--MI_THEME-divider);
		text-align: left;
		vertical-align: top;
	}

	th {
		font-size: 0.9em;
		background: var(--MI_THEME-panelHighlight);
	}
}

.map {
	position: relative;
	margin: 0;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	overflow: auto;
	// maps bring their own background; this only shows around them
	background: var(--MI_THEME-panelHighlight);

	img {
		display: block;
		width: 100%;
		height: auto;
		user-select: none;
	}

	&.zoomed img {
		width: 200%;
		max-width: none;
	}
}

.zoom {
	position: sticky;
	left: 8px;
	bottom: 8px;
	margin: -44px 0 8px 8px;
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 0.85em;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panel);
	box-shadow: 0 2px 8px var(--MI_THEME-shadow);
}

.box {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 12px 14px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
}

.boxLabel {
	font-size: 0.8em;
	opacity: 0.7;
}

.boxList {
	margin: 0;
	padding: 0;
	list-style: none;
	display: flex;
	flex-direction: column;
	gap: 4px;

	b {
		display: inline-block;
		min-width: 1.4em;
		color: var(--MI_THEME-accent);
	}
}

.item {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.q {
	margin: 0;
	line-height: 1.5;
}

.num {
	display: inline-block;
	min-width: 1.6em;
	margin-right: 6px;
	padding: 0 6px;
	border-radius: 999px;
	font-size: 0.75em;
	font-weight: bold;
	line-height: 1.6;
	text-align: center;
	color: var(--MI_THEME-fgOnAccent);
	background: var(--MI_THEME-accent);
}

.choose {
	margin-left: 6px;
	font-size: 0.8em;
	opacity: 0.75;
}

.options {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.option {
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 10px 12px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	text-align: left;
	line-height: 1.5;
	background: var(--MI_THEME-panel);

	&:hover:not(:disabled) {
		border-color: var(--MI_THEME-accent);
	}

	&:disabled {
		opacity: 0.55;
	}

	&.on {
		border-color: var(--MI_THEME-accent);
		background: var(--MI_THEME-accentedBg);
	}
}

.letter {
	flex-shrink: 0;
	width: 1.6em;
	text-align: center;
	color: var(--MI_THEME-accent);
}

.letters {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.letterBtn {
	width: 40px;
	height: 40px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 10px;
	font-weight: bold;
	background: var(--MI_THEME-panel);

	&:hover:not(:disabled) {
		border-color: var(--MI_THEME-accent);
	}

	&.on {
		color: var(--MI_THEME-fgOnAccent);
		border-color: var(--MI_THEME-accent);
		background: var(--MI_THEME-accent);
	}
}

.option, .letterBtn {
	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}
</style>
