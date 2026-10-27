<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- The sticky bar over a reading paper: the time left, which can't be paused, and on a narrow screen the switch
between the passage and the questions. -->
<template>
<div :class="[$style.root, { [$style.low]: left < 60 }]" role="region" :aria-label="gateLabels.timer">
	<div :class="$style.row">
		<i class="ti ti-clock" :class="$style.icon" aria-hidden="true"></i>
		<div
			:class="$style.track"
			role="progressbar"
			:aria-label="gateLabels.timer"
			aria-valuemin="0"
			:aria-valuemax="total"
			:aria-valuenow="left"
			:aria-valuetext="gateLabels.timeLeft(clockText(left))"
		>
			<span :class="$style.left" :style="{ width: `${total > 0 ? Math.min(1, left / total) * 100 : 0}%` }"></span>
		</div>
		<b :class="$style.time">{{ gateLabels.timeLeft(clockText(left)) }}</b>
	</div>
	<p v-if="left < 60" :class="$style.warn" role="status">{{ gateLabels.timeLow }}</p>
	<div :class="$style.tabs" role="tablist">
		<button class="_button" role="tab" :aria-selected="view === 'passage'" :class="[$style.tab, { [$style.on]: view === 'passage' }]" @click="view = 'passage'">
			<i class="ti ti-file-text" aria-hidden="true"></i> {{ gateLabels.passageTab }}
		</button>
		<button class="_button" role="tab" :aria-selected="view === 'questions'" :class="[$style.tab, { [$style.on]: view === 'questions' }]" @click="view = 'questions'">
			<i class="ti ti-list-check" aria-hidden="true"></i> {{ gateLabels.questionsTab(done, count) }}
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { gateLabels } from '@/lojo/gates/labels.js';
import { clockText } from '@/lojo/gates/player.js';

defineProps<{
	// seconds
	left: number;
	total: number;
	// questions answered, of how many
	done: number;
	count: number;
}>();

// What a narrow screen shows; a wide one shows the passage and the questions side by side.
const view = defineModel<'passage' | 'questions'>('view', { required: true });
</script>

<style lang="scss" module>
.root {
	position: sticky;
	top: var(--MI-stickyTop, 0px);
	z-index: 2;
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 10px 14px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
	box-shadow: 0 4px 16px -8px color-mix(in srgb, var(--MI_THEME-fg) 30%, transparent);

	&.low {
		border-color: var(--MI_THEME-warn);
	}
}

.row {
	display: flex;
	align-items: center;
	gap: 10px;
}

.icon {
	flex-shrink: 0;
	color: var(--MI_THEME-accent);

	.low & {
		color: var(--MI_THEME-warn);
	}
}

.track {
	position: relative;
	flex: 1;
	min-width: 0;
	height: 6px;
	border-radius: 999px;
	background: color-mix(in srgb, var(--MI_THEME-fg) 12%, transparent);
	overflow: clip;
}

.left {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	border-radius: inherit;
	background: var(--MI_THEME-accent);
	transition: width 0.5s linear;

	.low & {
		background: var(--MI_THEME-warn);
	}
}

.time {
	flex-shrink: 0;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;

	.low & {
		color: var(--MI_THEME-warn);
	}
}

.warn {
	margin: 0;
	font-size: 0.85em;
	font-weight: bold;
	color: var(--MI_THEME-warn);
}

.tabs {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 6px;

	// side by side, there is nothing to switch
	@container (min-width: 760px) {
		display: none;
	}
}

.tab {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	height: 36px;
	border-radius: 999px;
	font-weight: bold;
	font-variant-numeric: tabular-nums;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panelHighlight);

	&.on {
		color: var(--MI_THEME-fgOnAccent);
		background: var(--MI_THEME-accent);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}
</style>
