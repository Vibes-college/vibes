<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线: the bar over a stop being played. Leave (the try isn't counted), the stop's pass rule and its name. -->
<template>
<div :class="$style.bar">
	<button class="_button" :class="$style.x" :aria-label="L.exit" :title="L.exit" @click="emit('exit')">
		<i class="ti ti-x" aria-hidden="true"></i>
	</button>
	<div :class="$style.text">
		<small>{{ L.barRule(stop.n, rule) }}</small>
		<h1 :class="$style.name">{{ stop.name[typingLang] }}</h1>
	</div>
</div>
</template>

<script lang="ts" setup>
import type { Stop } from '@/lojo/typing/content.js';
import { typingLabels as L, typingLang } from '@/lojo/typing/labels.js';

defineProps<{
	stop: Stop;
	rule: string;
}>();

const emit = defineEmits<{
	(ev: 'exit'): void;
}>();
</script>

<style lang="scss" module>
.bar {
	display: flex;
	align-items: center;
	gap: 12px;
	padding-top: 2px;
}

.x {
	flex: none;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: var(--MI_THEME-panel);
	box-shadow: var(--tl-shadow);
	display: grid;
	place-items: center;
	color: var(--tl-ink);
	font-size: 18px;

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
		font-size: 11.5px;
		color: var(--tl-weak);
		font-weight: 600;
		letter-spacing: 0.06em;
	}
}

.name {
	margin: 0;
	font-family: var(--tl-serif);
	font-size: 18px;
	font-weight: 700;
	color: var(--tl-ink);
}
</style>
