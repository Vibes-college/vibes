<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 5 号线 · 词汇: the bar over a round. End it, the mode and what is practised, where it is, the blips switch, and a
progress line. -->
<template>
<div :class="$style.root">
	<div :class="$style.bar">
		<button type="button" class="_button" :class="$style.icon" :aria-label="L.exit" :title="L.exit" data-exit @click="emit('exit')">
			<i class="ti ti-x" aria-hidden="true"></i>
		</button>
		<div :class="$style.text">
			<h1 :class="$style.title">{{ title }}</h1>
			<small>{{ sub }}</small>
		</div>
		<span :class="$style.count" :aria-label="L.countLabel(at + 1, total)" data-count>{{ at + 1 }} / {{ total }}</span>
		<button
			type="button"
			class="_button"
			:class="[$style.icon, { [$style.off]: !sfx }]"
			:aria-label="L.sfx"
			:title="L.sfx"
			:aria-pressed="sfx"
			@click="emit('toggleSfx')"
		>
			<i :class="sfx ? 'ti ti-bell-ringing' : 'ti ti-bell-off'" aria-hidden="true"></i>
		</button>
	</div>
	<div :class="$style.progress" aria-hidden="true"><i :style="{ width: `${Math.min(100, Math.max(0, done / total * 100))}%` }"></i></div>
</div>
</template>

<script lang="ts" setup>
import { vocabLabels as L } from '@/lojo/vocab/labels.js';

defineProps<{
	title: string;
	sub: string;
	// the word on screen (from 0), how many are done, and how many there are
	at: number;
	done: number;
	total: number;
	sfx: boolean;
}>();

const emit = defineEmits<{
	(ev: 'exit'): void;
	(ev: 'toggleSfx'): void;
}>();
</script>

<style lang="scss" module>
.root {
	margin-bottom: 4px;
}

.bar {
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 56px;
}

.icon {
	flex: none;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: var(--MI_THEME-panel);
	box-shadow: var(--vl-shadow);
	display: grid;
	place-items: center;
	color: var(--vl-ink);
	font-size: 18px;

	&.off {
		color: var(--vl-weak);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.text {
	flex: 1;
	min-width: 0;
	line-height: 1.3;

	> small {
		display: block;
		font-size: 12px;
		color: var(--vl-weak);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
}

.title {
	margin: 0;
	font-family: var(--vl-serif);
	font-size: 17px;
	font-weight: 700;
	color: var(--vl-ink);
}

.count {
	font-weight: 700;
	color: var(--vl-ink);
	font-variant-numeric: tabular-nums;
	font-size: 15px;
	white-space: nowrap;
}

.progress {
	height: 5px;
	border-radius: 3px;
	background: var(--vl-line);
	overflow: hidden;

	> i {
		display: block;
		height: 100%;
		background: var(--vl-c);
		border-radius: 3px;
		transition: width 0.35s ease;
	}
}

@media (prefers-reduced-motion: reduce) {
	.progress > i {
		transition: none;
	}
}
</style>
