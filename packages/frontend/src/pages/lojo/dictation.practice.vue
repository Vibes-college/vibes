<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 听写: a round in progress. Stop, the round's name, where it is, the blips switch, a dot per item (✓ / ✗ once
answered), then the current item. -->
<template>
<section :class="$style.root" :aria-labelledby="`${uid}-title`">
	<div :class="$style.bar">
		<button class="_button" :class="$style.iconBtn" :aria-label="dictLabels.exit" :title="dictLabels.exit" @click="emit('exit')">
			<i class="ti ti-x" aria-hidden="true"></i>
		</button>
		<div :class="$style.barText">
			<h2 :id="`${uid}-title`" :class="$style.title">{{ round.title }}</h2>
			<span :class="$style.count">{{ index + 1 }} / {{ round.items.length }}</span>
		</div>
		<button
			class="_button"
			:class="[$style.iconBtn, { [$style.off]: !sfxOn }]"
			:aria-label="dictLabels.sfx"
			:title="dictLabels.sfx"
			:aria-pressed="sfxOn"
			@click="emit('toggleSfx')"
		>
			<i :class="sfxOn ? 'ti ti-bell-ringing' : 'ti ti-bell-off'" aria-hidden="true"></i>
		</button>
	</div>
	<ol :class="$style.dots" :aria-label="dictLabels.progressLabel">
		<li
			v-for="(it, k) in round.items"
			:key="it.id"
			:class="[$style.dot, { [$style.now]: k === index && stateOf(k) == null, [$style.dotOk]: stateOf(k) === 'ok', [$style.dotBad]: stateOf(k) === 'bad' }]"
			:aria-label="dictLabels.dot(k + 1, stateOf(k) ?? (k === index ? 'now' : null))"
			:aria-current="k === index ? 'step' : undefined"
		>
			{{ stateOf(k) === 'ok' ? '✓' : stateOf(k) === 'bad' ? '✗' : k + 1 }}
		</li>
	</ol>
	<XItem
		:key="`${round.id}:${index}`"
		:item="round.items[index]"
		:last="index === round.items.length - 1"
		:sfxOn="sfxOn"
		:speech="speech"
		:guideSlug="guideSlug"
		:guideName="guideName"
		:wordSaved="savedIds.includes(round.items[index].id)"
		@answer="r => emit('answer', r)"
		@next="emit('next')"
	/>
</section>
</template>

<script lang="ts" setup>
import { useId } from 'vue';
import XItem from './dictation.item.vue';
import type { Verdict } from '@/lojo/dictation/mark.js';
import type { Round } from '@/lojo/dictation/content.js';
import { dictLabels } from '@/lojo/dictation/labels.js';

const props = defineProps<{
	round: Round;
	index: number;
	sfxOn: boolean;
	speech: boolean;
	guideSlug: string;
	guideName: string | null;
	// items whose word went into the wordbook in this round
	savedIds: string[];
}>();

const emit = defineEmits<{
	(ev: 'answer', result: { verdict: Verdict; replays: number }): void;
	(ev: 'next'): void;
	(ev: 'exit'): void;
	(ev: 'toggleSfx'): void;
}>();

const uid = `dict-round-${useId()}`;

function stateOf(k: number): 'ok' | 'bad' | null {
	const r = props.round.results.at(k);
	if (r == null) return null;
	return r.verdict.correct ? 'ok' : 'bad';
}
</script>

<style lang="scss" module>
.root {
	--ok: color-mix(in srgb, #2F7D5B 82%, var(--MI_THEME-fg));
	--bad: var(--MI_THEME-error);
	--weak: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
	--faint: color-mix(in srgb, var(--MI_THEME-fg) 45%, transparent);
	--ink: var(--MI_THEME-fgHighlighted);
}

.bar {
	display: flex;
	align-items: center;
	gap: 10px;
}

.barText {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: baseline;
	justify-content: center;
	gap: 10px;
}

.title {
	margin: 0;
	font-size: 17px;
	font-weight: 700;
	color: var(--ink);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	letter-spacing: 0.02em;
}

.count {
	font-size: 13px;
	color: var(--weak);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

.iconBtn {
	flex: none;
	width: 40px;
	height: 40px;
	border-radius: 12px;
	display: grid;
	place-items: center;
	font-size: 20px;
	color: var(--ink);
	background: var(--MI_THEME-panel);
	box-shadow: 0 1px 2px color-mix(in srgb, var(--ink) 10%, transparent);

	&:hover {
		background: var(--MI_THEME-buttonBg);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}

	&.off {
		color: var(--faint);
	}
}

.dots {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	gap: 6px;
	list-style: none;
	margin: 10px 0 14px;
	padding: 0;
}

.dot {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: grid;
	place-items: center;
	font-size: 11px;
	font-weight: 700;
	color: var(--faint);
	background: var(--MI_THEME-panel);
	box-shadow: inset 0 0 0 1.5px var(--MI_THEME-divider);

	&.now {
		color: var(--MI_THEME-cta);
		box-shadow: inset 0 0 0 2.5px var(--MI_THEME-cta);
	}

	&.dotOk {
		background: var(--ok);
		color: var(--MI_THEME-fgOnAccent);
		box-shadow: none;
	}

	&.dotBad {
		background: var(--bad);
		color: var(--MI_THEME-fgOnAccent);
		box-shadow: none;
	}
}

@media (min-width: 720px) {
	.dots {
		gap: 8px;
		margin: 12px 0 18px;
	}

	.dot {
		width: 26px;
		height: 26px;
	}
}
</style>
