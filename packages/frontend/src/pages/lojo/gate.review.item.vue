<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- One marked question of a vocabulary or grammar paper: what was asked, the learner's answer and the right one, the
translation's marking (✓ right, ✗ to change, notes), and why. A parse shows the right subject, verb and clauses
marked on the sentence, under the learner's marks. A vocabulary question shows its word and meaning. -->
<template>
<div :class="$style.root">
	<!-- what was asked; a fix shows its sentence with the wrong word struck out -->
	<XTokens v-if="type === 'fix' && q" :tokens="words" :wrong="!item.correct && rightFix ? [rightFix.at, rightFix.at + 1] : null" :class="$style.prompt"/>
	<p v-else-if="q && type !== 'parse'" :class="[$style.prompt, { [$style.zh]: zhQ }]" :lang="zhQ ? undefined : 'en'">{{ q }}</p>

	<!-- yours -->
	<div :class="[$style.line, { [$style.stack]: type === 'parse' && item.given !== '' }]">
		<span :class="$style.label">{{ gateLabels.yours }}</span>
		<span v-if="item.given === ''">{{ gateLabels.blank }}</span>
		<XTokens v-else-if="type === 'parse'" :tokens="words" :marks="givenMarks" :summary="summary(givenMarks)" :class="$style.wide"/>
		<span v-else-if="type === 'fix'">{{ givenFix ? gateLabels.fixYours(givenFix.word, givenFix.fix) : item.given }}</span>
		<span v-else-if="type === 'choice'" :lang="optionLang">{{ choiceText(item.given) }}</span>
		<span v-else lang="en">{{ type === 'build' ? buildGiven(item.given, asked?.options ?? []) : item.given }}</span>
		<span :class="[$style.chip, item.correct ? $style.chipOk : $style.chipBad]">{{ item.correct ? gateLabels.right : gateLabels.reasons[item.reason ?? 'wrong'] }}</span>
	</div>

	<!-- the right answer -->
	<template v-if="!item.correct">
		<p v-if="type === 'spell' || type === 'build'" :class="$style.line">
			<span :class="$style.label">{{ gateLabels.answer }}</span>
			<b lang="en">{{ type === 'build' ? item.right ?? item.expected : item.expected }}</b>
		</p>
		<p v-else-if="type === 'choice'" :class="$style.line">
			<span :class="$style.label">{{ gateLabels.answer }}</span>
			<b :lang="optionLang">{{ choiceText(item.expected) }}</b>
		</p>
		<template v-else-if="type === 'fix'">
			<p v-if="rightFix" :class="$style.line">
				<span :class="$style.label">{{ gateLabels.wrongWord }}</span>
				<b lang="en">{{ rightFix.word }}</b>
			</p>
			<div v-if="item.right" :class="$style.line">
				<span :class="$style.label">{{ gateLabels.fixedSentence }}</span>
				<XTokens :tokens="rightWords" :fixed="fixedRange" :class="$style.wide"/>
			</div>
		</template>
		<div v-else-if="type === 'parse' && keyed" :class="[$style.line, $style.stack]">
			<span :class="$style.label">{{ gateLabels.answer }}</span>
			<XTokens :tokens="words" :marks="keyed" :summary="summary(keyed)" :class="$style.wide"/>
		</div>
	</template>
	<p v-if="others.length > 0" :class="$style.also">{{ gateLabels.alsoAccepted }}: <span lang="en">{{ others.join(' / ') }}</span></p>

	<!-- a translation: its marking, then the model answers -->
	<template v-if="type === 'translate'">
		<ul v-if="feedback.length > 0" :class="$style.feedback">
			<li v-for="(f, i) in feedback" :key="i" :class="$style[f.kind]">
				<i :class="f.kind === 'good' ? 'ti ti-check' : f.kind === 'bad' ? 'ti ti-x' : 'ti ti-bulb'" aria-hidden="true"></i>
				<span><span v-if="f.kind !== 'note'" :class="$style.sr">{{ f.kind === 'good' ? gateLabels.feedbackGood : gateLabels.feedbackFix }}</span>{{ f.text }}</span>
			</li>
		</ul>
		<div v-if="refs.length > 0" :class="[$style.line, $style.stack]">
			<span :class="$style.label">{{ gateLabels.refs }}</span>
			<ol :class="$style.refs" lang="en">
				<li v-for="r in refs" :key="r">{{ r }}</li>
			</ol>
		</div>
	</template>

	<!-- why; a vocabulary question's is its word and meaning -->
	<p v-if="vocabWhy" :class="$style.why">
		<b :class="$style.whyLabel">{{ gateLabels.wordMeaning }}</b>
		<span><b lang="en">{{ vocabWhy.word }}</b> {{ vocabWhy.meaning }}</span>
	</p>
	<p v-else-if="item.why" :class="$style.why">
		<b :class="$style.whyLabel">{{ gateLabels.why }}</b>
		<span>{{ item.why }}</span>
	</p>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XTokens from './gate.tokens.vue';
import { buildGiven, decodeFix, decodeParse, fixDiff, fixGiven, keyMarks, markedWords, splitWhy, tokens } from '@/lojo/gates/answers.js';
import type { ParseMarks } from '@/lojo/gates/answers.js';
import { gateLabels } from '@/lojo/gates/labels.js';
import { letterText } from '@/lojo/gates/player.js';
import type { GateGroup, GateItem, GateResultItem } from '@/lojo/gates/player.js';

const props = defineProps<{
	item: GateResultItem;
	group: GateGroup | null;
	// the question as it was on the paper
	asked: GateItem | null;
}>();

const type = computed(() => props.group?.type ?? null);
const q = computed(() => props.item.q ?? props.asked?.q ?? null);
const zhQ = computed(() => type.value === 'build' || type.value === 'translate');
const words = computed(() => tokens(q.value));
// a vocabulary choice's options are Chinese meanings, a grammar choice's English
const optionLang = computed(() => (props.group?.skill === 'vocab' ? undefined : 'en'));

function choiceText(value: string): string {
	const option = props.group ? letterText(props.group, props.asked, value) : null;
	return option ? gateLabels.letterOption(value, option) : value;
}

// fix: what the learner picked and changed, and (from the expected "4|删掉这个词") the wrong word
const givenFix = computed(() => (type.value === 'fix' ? fixGiven(q.value, props.item.given) : null));
const rightFix = computed(() => {
	if (type.value !== 'fix') return null;
	const at = decodeFix(props.item.expected).at;
	const found = fixGiven(q.value, props.item.expected);
	if (at != null && found) return { at, word: found.word };
	// the server didn't say where: the first word that differs from the corrected sentence
	if (props.item.right == null || q.value == null) return null;
	const { wrong } = fixDiff(q.value, props.item.right);
	return wrong[1] > wrong[0] ? { at: wrong[0], word: words.value.slice(wrong[0], wrong[1]).join(' ') } : null;
});
const rightWords = computed(() => tokens(props.item.right));
const fixedRange = computed<[number, number] | null>(() => {
	if (props.item.right == null || q.value == null) return null;
	const { fixed } = fixDiff(q.value, props.item.right);
	return fixed[1] > fixed[0] ? fixed : null;
});

// parse: the learner's marks and the right ones (key, or the expected JSON)
const givenMarks = computed(() => decodeParse(props.item.given));
const keyed = computed<ParseMarks | null>(() => (type.value === 'parse' ? keyMarks(props.item.key) ?? decodeParse(props.item.expected) : null));
const withClauses = computed(() => props.asked?.clauses ?? (keyed.value?.c.length ?? 0) > 0);

function summary(marks: ParseMarks): string {
	const said = markedWords(words.value, marks);
	return gateLabels.parseSummary(said.s, said.v, withClauses.value ? said.c : null);
}

// spell: the other spellings that count too
const others = computed(() => {
	if (type.value !== 'spell') return [];
	const given = props.item.given.trim().toLowerCase();
	return props.item.accepted.filter(a => a !== props.item.expected && a.toLowerCase() !== given);
});

// translate
const feedback = computed(() => {
	const f = props.item.feedback;
	if (f == null) return [];
	return [
		...f.good.map(text => ({ kind: 'good' as const, text })),
		...f.fix.map(text => ({ kind: 'bad' as const, text })),
		...f.notes.map(text => ({ kind: 'note' as const, text })),
	];
});
const refs = computed(() => (type.value === 'translate' ? [...new Set([props.item.right, ...props.item.accepted].filter((r): r is string => r != null && r.trim() !== ''))] : []));

const vocabWhy = computed(() => (props.group?.skill === 'vocab' ? splitWhy(props.item.why) : null));
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;

	p {
		margin: 0;
		overflow-wrap: anywhere;
	}

	.why {
		margin-top: 4px;
	}
}

.prompt {
	font-size: 0.85em;
	opacity: 0.75;

	&.zh {
		font-size: 0.9em;
		opacity: 0.85;
	}
}

.line {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 6px;

	&.stack {
		flex-direction: column;
		align-items: flex-start;
		gap: 0;
	}
}

.wide {
	max-width: 100%;
}

.label {
	font-size: 0.8em;
	opacity: 0.65;
}

.chip {
	padding: 0 8px;
	border-radius: 999px;
	font-size: 0.75em;
	font-weight: bold;
}

.chipOk {
	color: var(--MI_THEME-success);
	background: color-mix(in srgb, var(--MI_THEME-success) 14%, transparent);
}

.chipBad {
	color: var(--MI_THEME-error);
	background: color-mix(in srgb, var(--MI_THEME-error) 12%, transparent);
}

.also {
	font-size: 0.8em;
	opacity: 0.75;
}

.feedback {
	margin: 4px 0 0;
	padding: 0;
	list-style: none;
	display: flex;
	flex-direction: column;
	gap: 2px;

	li {
		display: flex;
		gap: 8px;
		font-size: 0.9em;
		line-height: 1.55;

		i {
			flex-shrink: 0;
			margin-top: 0.2em;
		}
	}
}

.good {
	color: var(--MI_THEME-success);
}

.bad {
	color: var(--MI_THEME-error);
}

.note {
	color: color-mix(in srgb, var(--MI_THEME-warn) 65%, var(--MI_THEME-fg));
}

.refs {
	margin: 2px 0 0;
	padding-left: 1.4em;
	line-height: 1.6;
}

.why {
	display: flex;
	gap: 8px;
	padding: 6px 10px;
	border-radius: 8px;
	font-size: 0.9em;
	line-height: 1.6;
	background: var(--MI_THEME-panelHighlight);
}

.whyLabel {
	flex-shrink: 0;
	font-size: 0.85em;
	opacity: 0.7;
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
