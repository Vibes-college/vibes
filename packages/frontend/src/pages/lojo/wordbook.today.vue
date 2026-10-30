<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 生词本 · 今日: what is up today. The date and one line on it, the 认得 and 拼写 cards due, the new words left today
(10 a day), the streak, and 开始复习. Under it, where the words come from, and a way to add one by hand. -->
<template>
<div :class="$style.root">
	<section v-if="today.total === 0" :class="[$style.hero, $style.empty]" :aria-labelledby="headId">
		<div :class="$style.emptyIcon" aria-hidden="true"><i class="ti ti-notebook"></i></div>
		<h2 :id="headId" ref="headEl" :class="$style.headline" tabindex="-1">{{ wordbookLabels.emptyTitle }}</h2>
		<p :class="$style.sub">{{ wordbookLabels.emptyText(today.newPerDay) }}</p>
		<MkButton primary rounded large @click="emit('add')"><i class="ti ti-plus"></i> {{ wordbookLabels.addOwn }}</MkButton>
	</section>

	<template v-else>
		<section :class="$style.hero" :aria-labelledby="headId">
			<p :class="$style.date">{{ date }}</p>
			<h2 :id="headId" ref="headEl" :class="$style.headline" tabindex="-1">
				<template v-if="head">{{ head.pre }} <em :class="$style.num">{{ head.n }}</em> {{ head.post }}</template>
				<template v-else>{{ wordbookLabels.headDone }}</template>
			</h2>
			<p v-if="sub" :class="$style.sub">{{ sub }}</p>
			<ul :class="$style.tiles">
				<li :class="[$style.tile, $style.recognize]">
					<small>{{ wordbookLabels.tileRecognize }}</small>
					<b>{{ today.recognizeDue }}</b>
					<span>{{ wordbookLabels.tileRecognizeHint }}</span>
				</li>
				<li :class="[$style.tile, $style.spell]">
					<small>{{ wordbookLabels.tileSpell }}</small>
					<b>{{ today.spellDue }}</b>
					<span>{{ wordbookLabels.tileSpellHint }}</span>
				</li>
				<li :class="$style.tile">
					<small>{{ wordbookLabels.tileNew }}</small>
					<b>{{ today.newLeft }} <i :class="$style.of">/ {{ today.newPerDay }}</i></b>
					<span>{{ wordbookLabels.tileNewHint(today.newPerDay) }}</span>
				</li>
				<li :class="[$style.tile, $style.streak, { [$style.cold]: today.streak === 0 }]">
					<small>{{ wordbookLabels.tileStreak }}</small>
					<b><i class="ti ti-flame" :class="$style.flame" aria-hidden="true"></i>{{ today.streak }} <i :class="$style.of">{{ wordbookLabels.dayUnit[today.streak === 1 ? 0 : 1] }}</i></b>
					<span>{{ streakHint }}</span>
				</li>
			</ul>
			<template v-if="today.queue.length > 0">
				<MkButton primary rounded large full :class="$style.start" @click="emit('start')">
					{{ wordbookLabels.start }} <i class="ti ti-arrow-right"></i>
				</MkButton>
				<p :class="$style.note">{{ wordbookLabels.startNote(today.queue.length) }}</p>
			</template>
		</section>

		<section :class="$style.where" :aria-labelledby="whereId">
			<p :class="$style.whereText"><b :id="whereId" :class="$style.whereTitle">{{ wordbookLabels.whereTitle }}</b> {{ wordbookLabels.whereText }}</p>
			<button type="button" class="_button" :class="$style.addLink" @click="emit('add')">{{ wordbookLabels.addOwn }}</button>
		</section>
	</template>
</div>
</template>

<script lang="ts" setup>
import { computed, useId, useTemplateRef } from 'vue';
import type { WordToday } from '@/lojo/english/wordbook.js';
import MkButton from '@/components/MkButton.vue';
import { dateText, intervalText } from '@/lojo/english/review.js';
import { wordbookLabels, wordbookLang } from '@/lojo/english/labels.js';

const props = defineProps<{
	today: WordToday;
	// the page's clock, a tick every half minute
	now: number;
}>();

const emit = defineEmits<{
	(ev: 'start'): void;
	(ev: 'add'): void;
}>();

const id = useId();
const headId = `wordbook-today-${id}`;
const whereId = `wordbook-where-${id}`;
const headEl = useTemplateRef('headEl');

// after a round of review, the focus comes here
function focusHeading(): void {
	headEl.value?.focus({ preventScroll: true });
}

defineExpose({ focusHeading });

const date = computed(() => dateText(new Date(props.now), wordbookLang));
const due = computed(() => props.today.recognizeDue + props.today.spellDue);

// 今天要复习 N 张 / 今天可以学 N 个新词 / 还有 N 张刚学的; nothing left: 今天的复习做完了
const head = computed(() => {
	const t = props.today;
	if (due.value > 0) return { ...wordbookLabels.headReview, n: due.value };
	if (t.newLeft > 0) return { ...wordbookLabels.headLearn, n: t.newLeft };
	if (t.queue.length > 0) return { ...wordbookLabels.headAgain, n: t.queue.length };
	return null;
});

const sub = computed(() => {
	const t = props.today;
	if (due.value > 0) return t.newLeft > 0 ? wordbookLabels.subReviewAndNew(t.newLeft) : wordbookLabels.subReview;
	if (t.newLeft > 0) return wordbookLabels.subLearn;
	if (t.queue.length > 0) return null;
	if (t.later != null) return wordbookLabels.subLater(intervalText(Date.parse(t.later) - props.now, wordbookLang));
	return wordbookLabels.subTomorrow;
});

// The streak counts today once there is a review today; until then it runs to yesterday.
const streakHint = computed(() => {
	const t = props.today;
	if (t.reviewedToday > 0) return wordbookLabels.streakToday;
	return t.streak > 0 ? wordbookLabels.streakKeep(t.streak + 1) : wordbookLabels.streakStart;
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.hero {
	padding: 22px 20px 20px;
	border-radius: 24px;
	background: var(--MI_THEME-panel);
	box-shadow: 0 1px 2px color-mix(in srgb, var(--MI_THEME-brandInk) 6%, transparent), 0 10px 28px -12px color-mix(in srgb, var(--MI_THEME-brandInk) 28%, transparent);
}

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	padding: 32px 22px 26px;
	text-align: center;

	.sub {
		margin-bottom: 18px;
	}
}

.emptyIcon {
	display: grid;
	place-items: center;
	width: 64px;
	height: 64px;
	margin-bottom: 8px;
	border-radius: 50%;
	font-size: 30px;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.date {
	margin: 0 0 6px;
	font-size: 0.9em;
	letter-spacing: 0.06em;
	opacity: 0.7;
}

.headline {
	margin: 0;
	font: 700 clamp(25px, 7.2vw, 32px) / 1.3 var(--wbSerif);
	color: var(--MI_THEME-brandInk);
	letter-spacing: 0.02em;

	&:focus {
		outline: none;
	}
}

.num {
	font-style: normal;
	color: var(--MI_THEME-cta);
}

.sub {
	margin: 6px 0 0;
	line-height: 1.6;
	opacity: 0.75;
}

.tiles {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 8px;
	margin: 18px 0;
	padding: 0;
	list-style: none;
}

.tile {
	display: flex;
	flex-direction: column;
	min-width: 0;
	padding: 12px 14px 11px;
	border-radius: 16px;
	background: color-mix(in srgb, var(--MI_THEME-fg) 6%, var(--MI_THEME-panel));

	> small {
		font-size: 0.8em;
		opacity: 0.75;
	}

	> b {
		display: flex;
		align-items: baseline;
		gap: 4px;
		font-size: 30px;
		line-height: 1.2;
		font-variant-numeric: tabular-nums;
		color: var(--MI_THEME-brandInk);
	}

	> span {
		font-size: 0.76em;
		line-height: 1.4;
		opacity: 0.7;
	}
}

.recognize > b {
	color: var(--MI_THEME-accent);
}

.spell > b {
	color: var(--wbGoldFg);
}

.of {
	font-size: 14px;
	font-style: normal;
	font-weight: 600;
	opacity: 0.6;
}

.streak {
	background: var(--wbGoldBg);
}

.flame {
	align-self: center;
	font-size: 22px;
	color: var(--MI_THEME-warn);
}

.cold .flame {
	opacity: 0.4;
	filter: grayscale(1);
}

.start {
	font-weight: bold;
	letter-spacing: 0.06em;
}

.note {
	margin: 10px 0 0;
	text-align: center;
	font-size: 0.82em;
	opacity: 0.7;
}

.where {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 14px 16px;
	border-radius: 18px;
	background: color-mix(in srgb, var(--MI_THEME-panel) 70%, transparent);
}

.whereText {
	flex: 1;
	margin: 0;
	font-size: 0.9em;
	line-height: 1.6;
	opacity: 0.85;
}

.whereTitle {
	color: var(--MI_THEME-brandInk);
}

.addLink {
	flex: none;
	padding: 8px 4px;
	border-radius: 8px;
	font-weight: bold;
	color: var(--MI_THEME-accent);

	&:hover {
		text-decoration: underline;
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}
</style>
