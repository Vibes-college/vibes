<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 5 号线 · 词汇: a wrong spelling against the right one, letter by letter. `attempt`: what was typed, the wrong and
extra letters struck through, _ where one is missing. `answer`: the right spelling, the letters that were got wrong
underlined. A screen reader hears the spelling itself. -->
<template>
<span :class="[$style.diff, { [$style.big]: big }]" :data-diff="view">
	<span aria-hidden="true" lang="en">
		<template v-for="(p, i) in parts" :key="i">
			<span v-if="p.k === 'miss'" :class="$style.miss" :title="L.missing(p.ch)">_</span>
			<span v-else-if="p.k === 'bad'" :class="view === 'attempt' ? $style.struck : $style.fix">{{ p.ch }}</span>
			<template v-else>{{ p.ch }}</template>
		</template>
	</span>
	<span :class="$style.sr">{{ view === 'attempt' ? L.yourSpelling(tidyTyped(typed)) : L.answerSpelling(right) }}</span>
</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { spellOps, tidyTyped } from '@/lojo/vocab/spell.js';
import { vocabLabels as L } from '@/lojo/vocab/labels.js';

const props = defineProps<{
	typed: string;
	right: string;
	view: 'attempt' | 'answer';
	big?: boolean;
}>();

// ok: as it is; bad: struck (attempt) or underlined (answer); miss: a letter left out (attempt only)
const parts = computed<{ k: 'ok' | 'bad' | 'miss'; ch: string }[]>(() => {
	if (props.typed.trim() === '') return props.view === 'answer' ? Array.from(props.right).map(ch => ({ k: 'ok' as const, ch })) : [];
	const ops = spellOps(props.typed, props.right);
	if (props.view === 'attempt') {
		return ops.map(o => (o.t === 'same' ? { k: 'ok' as const, ch: o.typed } : o.t === 'miss' ? { k: 'miss' as const, ch: o.right } : { k: 'bad' as const, ch: o.typed }));
	}
	return ops.flatMap(o => (o.t === 'extra' ? [] : [{ k: o.t === 'same' ? 'ok' as const : 'bad' as const, ch: o.right }]));
});
</script>

<style lang="scss" module>
.diff {
	font: 600 19px/1.5 var(--vl-mono);
	letter-spacing: 0.05em;
	color: var(--vl-ink);
	white-space: pre-wrap;
	overflow-wrap: anywhere;

	&.big {
		font-size: 24px;
	}
}

.struck {
	color: var(--vl-bad);
	text-decoration: line-through;
	text-decoration-thickness: 2px;
}

.miss {
	color: var(--vl-bad);
	font-weight: 800;
}

.fix {
	color: var(--vl-bad);
	text-decoration: underline;
	text-decoration-thickness: 2.5px;
	text-underline-offset: 4px;
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
