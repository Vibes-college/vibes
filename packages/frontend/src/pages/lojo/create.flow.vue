<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- The four steps of 创作讲解; `step` is the current one (0-based), the ones before it are done. -->
<template>
<ol :class="$style.flow">
	<li v-for="(s, i) in createLabels.steps" :key="s" :class="[$style.step, stepClass(i)]" :aria-current="i === step ? 'step' : undefined">
		<span :class="$style.dot"><i v-if="i < step" class="ti ti-check"></i><template v-else>{{ i + 1 }}</template></span>
		<span :class="$style.text">{{ s }}</span>
	</li>
</ol>
</template>

<script lang="ts" setup>
import { createLabels } from '@/lojo/create/labels.js';

const props = defineProps<{
	step: number;
}>();

// Plain class names styled through :global() below: useCssModule() is empty in production builds.
function stepClass(i: number): string | undefined {
	if (i < props.step) return 'crDone';
	if (i === props.step) return 'crNow';
	return undefined;
}
</script>

<style lang="scss" module>
.flow {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 4px;
	margin: 0 0 20px;
	padding: 0;
	list-style: none;
}

.step {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 5px;
	text-align: center;
	color: color-mix(in srgb, var(--MI_THEME-fg) 50%, transparent);

	&:not(:first-child)::before {
		content: "";
		position: absolute;
		top: 13px;
		left: calc(-50% + 17px);
		right: calc(50% + 17px);
		height: 2px;
		border-radius: 1px;
		background: var(--MI_THEME-divider);
	}

	&:global(.crDone) {
		color: #2F7D5B;

		.dot {
			color: #fff;
			background: #2F7D5B;
			box-shadow: none;
		}
	}

	&:global(.crDone)::before, &:global(.crNow)::before {
		background: #2F7D5B;
	}

	&:global(.crNow) {
		color: var(--MI_THEME-brandInk);

		.dot {
			color: #fff;
			background: var(--MI_THEME-cta);
			box-shadow: 0 6px 14px -6px color-mix(in srgb, var(--MI_THEME-cta) 90%, transparent);
		}
	}
}

.dot {
	position: relative;
	display: grid;
	place-items: center;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	font-size: 0.8em;
	font-weight: 700;
	background: var(--MI_THEME-panel);
	box-shadow: inset 0 0 0 2px var(--MI_THEME-divider);
}

.text {
	font-size: 0.75em;
	font-weight: 600;
	line-height: 1.3;
}
</style>
