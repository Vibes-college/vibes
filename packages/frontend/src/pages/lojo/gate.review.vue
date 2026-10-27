<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- After handing in one paper: each question with your answer and the right one, then the transcript of its recording. -->
<template>
<div :class="$style.root">
	<section :class="$style.review">
		<h2 :class="$style.h2">{{ title ?? gateLabels.reviewTitle }}</h2>
		<ol :class="$style.items">
			<li v-for="item in result.items" :key="item.n" :class="[$style.row, item.correct ? $style.right : $style.wrong]">
				<span :class="$style.n">{{ item.n }}</span>
				<div :class="$style.rowBody">
					<p v-if="refs.get(item.n)?.prompt" :class="$style.prompt" lang="en">{{ refs.get(item.n)?.prompt }}</p>
					<p :class="$style.answerLine">
						<span :class="$style.label">{{ gateLabels.yours }}</span>
						<span lang="en">{{ item.given === '' ? gateLabels.blank : shown(item.n, item.given) }}</span>
						<span :class="[$style.chip, item.correct ? $style.chipOk : $style.chipBad]">{{ item.correct ? gateLabels.right : gateLabels.reasons[item.reason ?? 'wrong'] }}</span>
					</p>
					<p v-if="!item.correct" :class="$style.answerLine">
						<span :class="$style.label">{{ gateLabels.answer }}</span>
						<b lang="en">{{ shown(item.n, item.expected) }}</b>
					</p>
					<p v-if="others(item).length > 0" :class="$style.also">{{ gateLabels.alsoAccepted }}: <span lang="en">{{ others(item).join(' / ') }}</span></p>
				</div>
			</li>
		</ol>
	</section>

	<section :class="$style.transcript">
		<button class="_button" :class="$style.toggle" :aria-expanded="showScript" @click="showScript = !showScript">
			<i :class="showScript ? 'ti ti-chevron-up' : 'ti ti-chevron-down'"></i> {{ showScript ? gateLabels.transcriptTitle : gateLabels.seeTranscript }}
		</button>
		<div v-if="showScript" :class="$style.script" lang="en">
			<template v-for="(line, i) in result.script" :key="i">
				<p v-if="line.pause != null" :class="$style.pause">{{ gateLabels.pause(line.pause) }}</p>
				<p v-else :class="[$style.say, { [$style.hit]: line.answers.length > 0 }]">
					<b :class="$style.who">{{ line.who }}</b>
					<span>{{ line.text }}</span>
					<span v-for="n in line.answers" :key="n" :class="$style.qchip">{{ gateLabels.answerChip(n) }}</span>
				</p>
			</template>
		</div>
	</section>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { gateLabels } from '@/lojo/gates/labels.js';
import { letterText, questionRefs } from '@/lojo/gates/player.js';
import type { GateAttempt, GateResult, GateResultItem } from '@/lojo/gates/player.js';

const props = defineProps<{
	result: GateResult;
	attempt: GateAttempt;
	// e.g. "第一段": a placement test reviews its two parts one after the other
	title?: string;
}>();

const showScript = ref(false);
const refs = computed(() => questionRefs(props.attempt.groups));

// A letter answer reads with its words: "B: the roof was damaged".
function shown(n: number, value: string): string {
	const ref = refs.value.get(n);
	const words = ref ? letterText(ref.group, ref.item, value) : null;
	return words ? gateLabels.letterOption(value, words) : value;
}

// Other spellings that also count (for gaps): not the one shown as the answer, nor what was written.
function others(item: GateResultItem): string[] {
	if (refs.value.get(item.n)?.group.type !== 'form') return [];
	return item.accepted.filter(a => a !== item.expected && a.toLowerCase() !== item.given.toLowerCase());
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.h2 {
	margin: 0 0 4px;
	font-size: 1em;
}

.review {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.items {
	margin: 0;
	padding: 0;
	list-style: none;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.row {
	display: flex;
	gap: 10px;
	padding: 10px 12px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
	border-left: 4px solid transparent;

	&.right {
		border-left-color: var(--MI_THEME-success);
	}

	&.wrong {
		border-left-color: var(--MI_THEME-error);
	}
}

.n {
	flex-shrink: 0;
	min-width: 1.8em;
	font-weight: bold;
	opacity: 0.7;
}

.rowBody {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;

	p {
		margin: 0;
		overflow-wrap: anywhere;
	}
}

.prompt {
	font-size: 0.85em;
	opacity: 0.7;
}

.answerLine {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 6px;
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

.transcript {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.toggle {
	align-self: flex-start;
	padding: 8px 14px;
	border-radius: 999px;
	font-weight: bold;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.script {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 12px 14px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
	line-height: 1.6;

	p {
		margin: 0;
	}
}

.pause {
	font-size: 0.85em;
	opacity: 0.6;
}

.say.hit {
	margin: 0 -6px;
	padding: 2px 6px;
	border-radius: 6px;
	background: color-mix(in srgb, var(--MI_THEME-warn) 16%, transparent);
}

.who {
	display: inline-block;
	min-width: 1.4em;
	margin-right: 6px;
	opacity: 0.6;
}

.qchip {
	margin-left: 6px;
	padding: 0 6px;
	border-radius: 999px;
	font-size: 0.75em;
	font-weight: bold;
	color: var(--MI_THEME-fgOnAccent);
	background: var(--MI_THEME-accent);
	white-space: nowrap;
}
</style>
