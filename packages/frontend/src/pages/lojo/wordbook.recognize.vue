<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 生词本 review: the 认得 card. The English word, read out; 看答案 shows the meaning, usage and example; then 忘了 or
记得, each with when the card comes back. -->
<template>
<XCard ref="cardEl" kind="recognize" :first="item.first" :prompt="item.word.text" :soundKey="soundKey" @listen="emit('listen')">
	<MkButton v-if="!revealed" primary rounded large :class="$style.show" @click="emit('reveal')">
		{{ wordbookLabels.showAnswer }}<kbd :class="$style.kbd" aria-hidden="true">{{ wordbookLabels.keySpace }}</kbd>
	</MkButton>
	<XBack v-else ref="backEl" :word="item.word" :withMeaning="true" :exampleKey="exampleKey"/>
	<template v-if="revealed" #actions>
		<p :class="$style.ask">{{ wordbookLabels.recallAsk }}</p>
		<div :class="$style.grades">
			<button type="button" class="_button" :class="[$style.grade, $style.again]" @click="emit('rate', 1)">
				<b>{{ wordbookLabels.forgot }}</b>
				<span>{{ forgotIn }}</span>
				<kbd :class="$style.kbd" aria-hidden="true">1</kbd>
			</button>
			<button type="button" class="_button" :class="[$style.grade, $style.good]" @click="emit('rate', 3)">
				<b>{{ wordbookLabels.remembered }}</b>
				<span>{{ rememberedIn }}</span>
				<kbd :class="$style.kbd" aria-hidden="true">2</kbd>
			</button>
		</div>
	</template>
</XCard>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, useTemplateRef, watch } from 'vue';
import XCard from './wordbook.card.vue';
import XBack from './wordbook.back.vue';
import type { WordReviewItem } from '@/lojo/english/wordbook.js';
import type { ReviewRating } from '@/lojo/english/review.js';
import MkButton from '@/components/MkButton.vue';
import { ratingInterval } from '@/lojo/english/review.js';
import { wordbookLabels, wordbookLang } from '@/lojo/english/labels.js';

const props = defineProps<{
	item: WordReviewItem;
	revealed: boolean;
	// when the queue was fetched: the server's dates for each answer count from then
	fetchedAt: number;
	soundKey: string;
	exampleKey: string;
}>();

const emit = defineEmits<{
	(ev: 'reveal'): void;
	(ev: 'rate', rating: ReviewRating): void;
	(ev: 'listen'): void;
}>();

const cardEl = useTemplateRef('cardEl');
const backEl = useTemplateRef('backEl');

const forgotIn = computed(() => ratingInterval(props.item.next, 1, props.fetchedAt, wordbookLang));
const rememberedIn = computed(() => ratingInterval(props.item.next, 3, props.fetchedAt, wordbookLang));

onMounted(() => {
	cardEl.value?.focus();
});

watch(() => props.revealed, async revealed => {
	if (!revealed) return;
	await nextTick();
	backEl.value?.focus();
});
</script>

<style lang="scss" module>
.show {
	margin-top: 22px;
	width: 100%;
}

.kbd {
	display: none;
	margin-left: 8px;
	padding: 1px 5px;
	border: 1px solid currentColor;
	border-radius: 5px;
	font-size: 10.5px;
	font-weight: 600;
	line-height: 1.3;
	opacity: 0.6;

	@media (hover: hover) and (pointer: fine) {
		display: inline-block;
	}
}

.ask {
	margin: 4px 0 0;
	text-align: center;
	font-size: 0.85em;
	opacity: 0.7;
}

.grades {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
}

.grade {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	min-height: 68px;
	padding: 8px;
	border-radius: 18px;

	> b {
		font-size: 1.1em;
		letter-spacing: 0.04em;
	}

	> span {
		font-size: 0.82em;
		font-variant-numeric: tabular-nums;
		opacity: 0.85;
	}

	> .kbd {
		position: absolute;
		top: 7px;
		right: 9px;
		margin: 0;
	}

	&:active {
		transform: translateY(1px);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.again {
	color: var(--wbBadFg);
	background: var(--wbBadBg);

	&:hover {
		box-shadow: inset 0 0 0 2px var(--wbBad);
	}
}

.good {
	color: var(--wbOkFg);
	background: var(--wbOkBg);

	&:hover {
		box-shadow: inset 0 0 0 2px var(--wbOk);
	}
}
</style>
