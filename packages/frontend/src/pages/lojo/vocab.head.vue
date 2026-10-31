<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 5 号线 · 词汇: a stop's header. The line (in its colour) and the stop, its topic, band and what it is for, how many
words it has and how many were learned and missed, and the listening and reading stops its words come up in. -->
<template>
<header :class="$style.head">
	<MkA :to="mapPath(stop.id)" :class="$style.back"><i class="ti ti-chevron-left" aria-hidden="true"></i>{{ L.toMap }}</MkA>
	<div :class="$style.tags">
		<span :class="$style.line">{{ L.lineName(line) }}</span>
		<span :class="$style.id">{{ stop.id }}</span>
	</div>
	<h1 ref="headingEl" tabindex="-1" :class="$style.title" data-stop-title>{{ stop.topic }}</h1>
	<p :class="$style.sub">{{ L.sub(stop.en, stop.band.toFixed(1)) }}</p>
	<p v-if="stop.lede" :class="$style.lede">{{ stop.lede }}</p>
	<div :class="$style.stats">
		<span>{{ L.statWords(stop.words.length, stop.groups.length) }}</span>
		<span v-if="stop.level">{{ stop.level }}</span>
		<span :class="{ [$style.good]: learned > 0 }" data-stat-learned>{{ L.statLearned(learned) }}</span>
		<span v-if="missed > 0" :class="$style.bad" data-stat-missed>{{ L.statMissed(missed) }}</span>
	</div>
	<p v-if="uses.length > 0" :class="$style.uses">
		<span :class="$style.usesHead">{{ L.usesHead }}</span>
		<span v-for="u in uses" :key="u.id" :class="$style.use">{{ useText(u) }}</span>
	</p>
	<p v-if="loadFailed" :class="$style.warn" role="alert">{{ L.progressFailed }}</p>
	<p v-else-if="saveFailed" :class="$style.warn" role="status">{{ L.saveFailed }}</p>
</header>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue';
import type { UsedIn, VocabStop } from '@/lojo/vocab/content.js';
import { mapPath, usedIn } from '@/lojo/vocab/content.js';
import { vocabLabels as L, vocabLang } from '@/lojo/vocab/labels.js';

const props = defineProps<{
	stop: VocabStop;
	line: number;
	// words of this stop learned and missed
	learned: number;
	missed: number;
	loadFailed: boolean;
	saveFailed: boolean;
}>();

const headingEl = useTemplateRef('headingEl');
const uses = computed(() => usedIn(props.stop));

// 听力 4.5; a stop the route map doesn't have: its id
function useText(u: UsedIn): string {
	if (u.line == null) return u.id;
	return u.band != null ? `${u.line[vocabLang]} ${u.band.toFixed(1)}` : `${u.line[vocabLang]} ${u.id}`;
}

function focusHeading() {
	headingEl.value?.focus({ preventScroll: true });
}

defineExpose({ focusHeading });
</script>

<style lang="scss" module>
.head {
	padding: 2px 0 0;
}

.back {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin: 0 0 10px -4px;
	padding: 4px 10px 4px 4px;
	border-radius: 999px;
	color: var(--vl-weak);
	font-size: 13.5px;
	text-decoration: none;

	> i {
		font-size: 16px;
	}

	&:hover {
		color: var(--vl-ink);
		background: var(--vl-hi);
		text-decoration: none;
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 1px;
	}
}

.tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-bottom: 10px;

	> span {
		display: inline-flex;
		align-items: center;
		font-size: 11.5px;
		font-weight: 700;
		padding: 3px 8px;
		border-radius: 7px;
	}
}

.line {
	background: var(--vl-c);
	color: var(--vl-onC);
}

.id {
	background: var(--vl-cBg);
	color: var(--vl-cFg);
	font-variant-numeric: tabular-nums;
}

.title {
	margin: 0;
	font-family: var(--vl-serif);
	font-weight: 700;
	font-size: 26px;
	line-height: 1.25;
	letter-spacing: 0.03em;
	color: var(--vl-ink);
	outline: none;
}

.sub {
	margin: 4px 0 0;
	font-size: 12.5px;
	color: var(--vl-weak);
}

.lede {
	margin: 8px 0 0;
	font-size: 13.5px;
	line-height: 1.7;
}

.stats {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin: 10px 0 0;

	> span {
		font-size: 12px;
		background: var(--vl-hi);
		border-radius: 8px;
		padding: 3px 9px;
	}

	> .good {
		background: var(--vl-okBg);
		color: var(--vl-ok);
		font-weight: 600;
	}

	> .bad {
		background: var(--vl-badBg);
		color: var(--vl-bad);
		font-weight: 600;
	}
}

.uses {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
	margin: 10px 0 0;
}

.usesHead {
	font-size: 12px;
	color: var(--vl-weak);
	margin-right: 2px;
}

.use {
	display: inline-flex;
	align-items: center;
	min-height: 28px;
	padding: 0 10px;
	border-radius: 10px;
	background: var(--MI_THEME-panel);
	box-shadow: inset 0 0 0 1px var(--vl-line);
	color: var(--vl-ink);
	font-size: 12.5px;
}

.warn {
	margin: 10px 0 0;
	font-size: 13px;
	color: var(--vl-gold);
	background: var(--vl-goldBg);
	border-radius: 12px;
	padding: 8px 12px;
}

@media (min-width: 720px) {
	.title {
		font-size: 30px;
	}
}
</style>
