<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- The head of a marketing plan: ours or a common format, where and how, its name, the format card, and its hook. -->
<template>
<div>
	<div :class="$style.top">
		<span :class="[$style.badge, { [$style.ours]: plan.source === 'ours' }]">
			<i v-if="plan.source === 'ours'" class="ti ti-sparkles"></i>{{ plan.source === 'ours' ? createLabels.ours : createLabels.common }}
		</span>
		<span :class="$style.where">{{ plan.platform }} · {{ plan.medium }}</span>
	</div>
	<h3 :class="$style.name">{{ plan.name }}</h3>
	<p v-if="plan.form" :class="$style.form">{{ createLabels.byForm(plan.form) }}</p>
	<p :class="$style.hook">{{ plan.hook }}</p>
</div>
</template>

<script lang="ts" setup>
import { createLabels } from '@/lojo/create/labels.js';
import type { CreatePlan } from '@/lojo/create/state.js';

defineProps<{
	plan: CreatePlan;
}>();
</script>

<style lang="scss" module>
.top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 8px;
}

.badge {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 2px 9px;
	border-radius: 8px;
	font-size: 0.75em;
	font-weight: 700;
	color: color-mix(in srgb, var(--MI_THEME-fg) 75%, transparent);
	background: color-mix(in srgb, var(--MI_THEME-fg) 7%, var(--MI_THEME-panel));
}

.ours {
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.where {
	font-size: 0.8em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent);
}

.name {
	margin: 10px 0 0;
	font: 700 1.15em/1.4 "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", STSong, serif;
	color: var(--MI_THEME-brandInk);
	letter-spacing: 0.02em;
}

.form {
	margin: 3px 0 0;
	font-size: 0.8em;
	color: var(--MI_THEME-accent);
}

.hook {
	position: relative;
	margin: 10px 0 0;
	padding: 11px 14px 11px 36px;
	border-radius: 14px;
	font-weight: 700;
	line-height: 1.55;
	color: color-mix(in srgb, var(--MI_THEME-cta) 70%, var(--MI_THEME-fg));
	background: color-mix(in srgb, var(--MI_THEME-cta) 12%, var(--MI_THEME-panel));

	&::before {
		content: "“";
		position: absolute;
		left: 11px;
		top: 6px;
		font: 700 2em/1 "Songti SC", "Noto Serif SC", serif;
		color: var(--MI_THEME-cta);
	}
}
</style>
