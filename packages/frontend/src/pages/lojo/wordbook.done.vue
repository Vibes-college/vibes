<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 生词本: a round of review done. How many cards and how long, how each was answered, the streak, and when the
words just learned come back. -->
<template>
<section :class="$style.root" :aria-labelledby="titleId">
	<div :class="$style.badge" aria-hidden="true"><i class="ti ti-check"></i></div>
	<h2 :id="titleId" ref="titleEl" :class="$style.title" tabindex="-1">{{ wordbookLabels.doneTitle }}</h2>
	<p :class="$style.lede">{{ wordbookLabels.doneLede(done, minutes) }}</p>
	<ul :class="$style.tally">
		<li :class="$style.forgot"><b>{{ tally[1] }}</b>{{ wordbookLabels.tallyForgot }}</li>
		<li :class="$style.hard"><b>{{ tally[2] }}</b>{{ wordbookLabels.tallyHard }}</li>
		<li :class="$style.good"><b>{{ tally[3] }}</b>{{ wordbookLabels.tallyRemembered }}</li>
	</ul>
	<XQuestBack app="wordbook" :class="$style.quest"/>
	<p v-if="today && today.streak > 0" :class="$style.streak"><i class="ti ti-flame" aria-hidden="true"></i> {{ wordbookLabels.streakLine(today.streak) }}</p>
	<p :class="$style.next">{{ nextText }}</p>
	<div :class="$style.buttons">
		<MkButton primary rounded large full @click="emit('today')">{{ wordbookLabels.backToday }}</MkButton>
		<MkButton rounded inline @click="emit('words')">{{ wordbookLabels.seeWords }}</MkButton>
	</div>
</section>
</template>

<script lang="ts" setup>
import { computed, onMounted, useId, useTemplateRef } from 'vue';
import type { WordToday } from '@/lojo/english/wordbook.js';
import type { ReviewRating } from '@/lojo/english/review.js';
import MkButton from '@/components/MkButton.vue';
import XQuestBack from '@/lojo/QuestBack.vue';
import { intervalText } from '@/lojo/english/review.js';
import { wordbookLabels, wordbookLang } from '@/lojo/english/labels.js';

const props = defineProps<{
	done: number;
	tally: Record<ReviewRating, number>;
	minutes: number;
	// today's counts after the round
	today: WordToday | null;
	fetchedAt: number;
}>();

const emit = defineEmits<{
	(ev: 'today'): void;
	(ev: 'words'): void;
}>();

const titleId = `wordbook-done-${useId()}`;
const titleEl = useTemplateRef('titleEl');

const nextText = computed(() => {
	const later = props.today?.later;
	if (later == null) return wordbookLabels.subTomorrow;
	return wordbookLabels.subLater(intervalText(Date.parse(later) - props.fetchedAt, wordbookLang));
});

onMounted(() => {
	titleEl.value?.focus({ preventScroll: true });
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 34px 22px 26px;
	border-radius: 24px;
	text-align: center;
	background: var(--MI_THEME-panel);
	box-shadow: 0 1px 2px color-mix(in srgb, var(--MI_THEME-brandInk) 6%, transparent), 0 10px 28px -12px color-mix(in srgb, var(--MI_THEME-brandInk) 28%, transparent);
}

.badge {
	display: grid;
	place-items: center;
	width: 78px;
	height: 78px;
	margin-bottom: 14px;
	border-radius: 50%;
	font-size: 40px;
	color: var(--MI_THEME-fgOnAccent);
	background: var(--wbOk);
	box-shadow: 0 0 0 10px var(--wbOkBg);
}

.title {
	margin: 0 0 6px;
	font: 700 26px / 1.3 var(--wbSerif);
	color: var(--MI_THEME-brandInk);
	letter-spacing: 0.03em;

	// focused when the round ends (tabindex -1, never reached by Tab): no ring for that
	&:focus {
		outline: none;
	}
}

.quest {
	align-self: stretch;
}

.lede {
	margin: 0 0 16px;
	opacity: 0.8;
}

.tally {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 8px;
	width: 100%;
	margin: 0 0 16px;
	padding: 0;
	list-style: none;

	> li {
		padding: 8px 4px;
		border-radius: 14px;
		font-size: 0.82em;
		font-weight: bold;
	}

	b {
		display: block;
		font-size: 1.7em;
		font-variant-numeric: tabular-nums;
	}
}

.forgot {
	color: var(--wbBadFg);
	background: var(--wbBadBg);
}

.hard {
	color: var(--wbGoldFg);
	background: var(--wbGoldBg);
}

.good {
	color: var(--wbOkFg);
	background: var(--wbOkBg);
}

.streak {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	margin: 0 0 12px;
	padding: 7px 14px;
	border-radius: 999px;
	font-weight: bold;
	color: var(--MI_THEME-brandInk);
	background: var(--wbGoldBg);

	> i {
		color: var(--MI_THEME-warn);
	}
}

.next {
	margin: 0 0 18px;
	font-size: 0.9em;
	opacity: 0.75;
}

.buttons {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	width: 100%;
}
</style>
