<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- One group of questions on the gate's paper: a form with gaps, choices, a map or a matching box; for reading also
TRUE / FALSE / NOT GIVEN, a summary with a box of words, a list of headings (i, ii, …) and paragraph letters; for the
vocabulary and grammar lines listen-and-spell, word order, find the wrong word, mark the sentence and translate. -->
<template>
<section :class="$style.root" :aria-labelledby="headId">
	<header :class="$style.head">
		<span :id="headId" :class="$style.range">{{ gateLabels.questionRange(numbers[0], numbers[numbers.length - 1]) }}</span>
		<p v-if="group.instructions.en" :class="$style.instructions" lang="en">{{ group.instructions.en }}</p>
		<p v-if="group.instructions.zh" :class="$style.zh">{{ group.instructions.zh }}</p>
		<p v-if="group.type === 'form' && group.limit && gateLabels.limit(group.limit)" :class="$style.limit">
			<i class="ti ti-pencil" aria-hidden="true"></i> {{ gateLabels.limit(group.limit) }}
		</p>
	</header>

	<!-- a map or plan with letters on it, or a diagram with the question numbers on it -->
	<figure v-if="(group.type === 'map' || group.type === 'form') && group.image" :class="[$style.map, { [$style.zoomed]: zoomed }]">
		<img :src="group.image" :alt="group.type === 'map' ? gateLabels.mapAlt : gateLabels.diagramAlt" draggable="false">
		<button class="_button" :class="$style.zoom" :aria-pressed="zoomed" @click="zoomed = !zoomed">
			<i :class="zoomed ? 'ti ti-zoom-out' : 'ti ti-zoom-in'"></i> {{ zoomed ? gateLabels.zoomOut : gateLabels.zoomIn }}
		</button>
	</figure>

	<!-- form, notes, table and sentence completion (typed); a summary with a box of words (picked) -->
	<div v-if="gapped(group.type)" :class="$style.form" lang="en">
		<b v-if="group.title" :class="$style.title">{{ group.title }}</b>
		<template v-for="(block, bi) in blocks" :key="bi">
			<p v-if="block.kind === 'line'" :class="$style.line">
				<template v-for="(seg, si) in block.segments" :key="si">
					<span v-if="seg.type === 'text'">{{ seg.text }}</span>
					<XSelect v-else-if="group.type === 'bank'" v-model="text[seg.n]" :n="seg.n" :letters="letters" :options="group.options" :disabled="disabled"/>
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
									<XSelect v-else-if="group.type === 'bank'" v-model="text[seg.n]" :n="seg.n" :letters="letters" :options="group.options" :disabled="disabled"/>
									<XGap v-else v-model="text[seg.n]" :n="seg.n" :limit="gapLimit(seg.n)" :disabled="disabled"/>
								</template>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</template>
	</div>

	<!-- the box of options a matching group or a summary picks from (paragraph letters have none) -->
	<div v-if="(group.type === 'match' || group.type === 'bank') && group.options.length > 0" :class="$style.box" lang="en">
		<!-- a summary's title already heads its gaps -->
		<b v-if="group.title && group.type === 'match'" :class="$style.title">{{ group.title }}</b>
		<span :class="$style.boxLabel">{{ gateLabels.optionsBox }}</span>
		<ul :class="$style.boxList">
			<li v-for="(option, oi) in group.options" :key="oi"><b>{{ letters[oi] }}</b> {{ option }}</li>
		</ul>
	</div>

	<!-- one question per item: a choice, several choices, a letter, or TRUE / FALSE / NOT GIVEN -->
	<template v-if="!gapped(group.type) && !isNewType(group.type)">
		<div v-for="item in group.items" :key="item.n.join('-')" :class="$style.item" role="group" :aria-labelledby="`${headId}-${itemKey(item)}`" :data-gate-item="item.n[0]">
			<p :id="`${headId}-${itemKey(item)}`" :class="$style.q" lang="en">
				<span :class="$style.num">{{ item.n.length > 1 ? `${item.n[0]}–${item.n[item.n.length - 1]}` : item.n[0] }}</span>
				<!-- a grammar choice shows the pick in the sentence's gap -->
				<template v-if="group.skill === 'grammar' && blankParts(item.q)">
					{{ blankParts(item.q)![0] }}<span :class="$style.gap">{{ letterText(group, item, String(answers[item.n[0]] ?? '')) ?? '\u00a0' }}<span v-if="!answers[item.n[0]]" :class="$style.sr">{{ gateLabels.gapSr }}</span></span>{{ blankParts(item.q)![1] }}
				</template>
				<template v-else>{{ item.q }}</template>
				<small v-if="group.type === 'multi'" :class="$style.choose">{{ gateLabels.choose(item.choose) }} · {{ gateLabels.picked(picks(item).length, item.choose) }}</small>
			</p>
			<div v-if="group.type === 'choice' || group.type === 'multi'" :class="$style.options" :role="group.type === 'choice' ? 'radiogroup' : undefined">
				<!-- a vocabulary choice's options are Chinese meanings -->
				<button
					v-for="(option, oi) in item.options"
					:key="oi"
					class="_button"
					:class="[$style.option, { [$style.on]: chosen(group.type, item, letterAt(oi)) }]"
					:role="group.type === 'choice' ? 'radio' : 'checkbox'"
					:aria-checked="chosen(group.type, item, letterAt(oi))"
					:disabled="disabled || (group.type === 'multi' && !chosen('multi', item, letterAt(oi)) && picks(item).length >= item.choose)"
					:lang="group.skill === 'vocab' ? undefined : 'en'"
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
					:class="[group.type === 'judge' ? $style.wordBtn : $style.letterBtn, { [$style.on]: text[item.n[0]] === letter }]"
					role="radio"
					:aria-checked="text[item.n[0]] === letter"
					:aria-label="letterLabel(letter)"
					:disabled="disabled"
					@click="choose(group.type, item, letter)"
				>{{ letter }}</button>
			</div>
		</div>
	</template>

	<!-- the vocabulary and grammar lines' own types, one question per item; each answer is one string (lojo/gates/answers.ts) -->
	<template v-else-if="isNewType(group.type)">
		<template v-for="item in group.items" :key="item.n.join('-')">
			<!-- listen and spell: one row each -->
			<div v-if="group.type === 'spell'" :class="$style.spellRow" role="group" :aria-labelledby="`${headId}-${itemKey(item)}`" :data-gate-item="item.n[0]">
				<span :id="`${headId}-${itemKey(item)}`" :class="$style.num"><span aria-hidden="true">{{ item.n[0] }}</span><span :class="$style.sr">{{ gateLabels.question(item.n[0]) }}</span></span>
				<XSpell v-model="text[item.n[0]]" :class="$style.grow" :item="item" :n="item.n[0]" :disabled="disabled"/>
			</div>
			<div v-else :class="[$style.item, $style.newItem]" role="group" :aria-labelledby="`${headId}-${itemKey(item)}`" :data-gate-item="item.n[0]">
				<p :id="`${headId}-${itemKey(item)}`" :class="[$style.q, { [$style.zhQ]: group.type === 'build' || group.type === 'translate' }]">
					<span :class="$style.num">{{ item.n[0] }}</span>
					{{ ask(item) }}
				</p>
				<XBuild v-if="group.type === 'build'" v-model="text[item.n[0]]" :item="item" :disabled="disabled"/>
				<XFix v-else-if="group.type === 'fix'" v-model="text[item.n[0]]" :item="item" :disabled="disabled"/>
				<XParse v-else-if="group.type === 'parse'" v-model="text[item.n[0]]" :item="item" :disabled="disabled"/>
				<XTranslate v-else v-model="text[item.n[0]]" :item="item" :disabled="disabled"/>
			</div>
		</template>
	</template>
</section>
</template>

<script lang="ts" setup>
import { computed, ref, useId } from 'vue';
import XBuild from './gate.build.vue';
import XFix from './gate.fix.vue';
import XGap from './gate.gap.vue';
import XParse from './gate.parse.vue';
import XSelect from './gate.select.vue';
import XSpell from './gate.spell.vue';
import XTranslate from './gate.translate.vue';
import { blankParts, isNewType } from '@/lojo/gates/answers.js';
import { gateLabels } from '@/lojo/gates/labels.js';
import { formBlocks, gapped, groupNumbers, itemKey, letterAt, letterText, pickLetters } from '@/lojo/gates/player.js';
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
const blocks = computed(() => (gapped(props.group.type) ? formBlocks(props.group.lines) : []));
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

// The line over a question of a new type: the Chinese to put together or translate, or what to do with the sentence.
function ask(item: GateItem): string {
	if (props.group.type === 'fix') return (item.mode ?? (item.options.length > 0 ? 'choose' : 'type')) === 'choose' ? gateLabels.fixAskChoose : gateLabels.fixAskType;
	if (props.group.type === 'parse') return item.clauses ? gateLabels.parseAskClauses : gateLabels.parseAsk;
	return item.q ?? '';
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

// TRUE / FALSE / NOT GIVEN: three words side by side
.wordBtn {
	height: 40px;
	padding: 0 14px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 10px;
	font-weight: bold;
	white-space: nowrap;
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

.option, .letterBtn, .wordBtn {
	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

// a grammar choice's gap, with the pick in it
.gap {
	display: inline-block;
	min-width: 5em;
	margin: 0 2px;
	border-bottom: 2px solid var(--MI_THEME-fg);
	font-weight: bold;
	line-height: 1.3;
	text-align: center;
	color: var(--MI_THEME-accent);
}

// the Chinese of a sentence to put together or to translate
.zhQ {
	font-size: 1.05em;
	font-weight: bold;
}

.newItem + .newItem {
	padding-top: 14px;
	border-top: 1px solid var(--MI_THEME-divider);
}

.spellRow {
	display: flex;
	align-items: center;
	gap: 10px;

	> .num {
		flex-shrink: 0;
		margin-right: 0;
	}
}

.grow {
	flex: 1;
	min-width: 0;
}

.sr {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}
</style>
