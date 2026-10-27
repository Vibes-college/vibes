<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- The sticky bar over the questions: how far the recording is, the reading-time countdown, and what to do if it stops. -->
<template>
<div :class="[$style.root, { [$style.reading]: readingLeft != null }]" role="region" :aria-label="gateLabels.recording">
	<div :class="$style.row">
		<i class="ti ti-headphones" :class="$style.icon" aria-hidden="true"></i>
		<div
			:class="$style.track"
			role="progressbar"
			:aria-label="gateLabels.progress"
			aria-valuemin="0"
			:aria-valuemax="Number.isFinite(total) ? Math.round(total) : undefined"
			:aria-valuenow="Math.round(position)"
			:aria-valuetext="timeText"
		>
			<span
				v-for="(pause, i) in pauses"
				:key="i"
				:class="$style.pauseMark"
				:style="{ left: `${ratioAt(pause.at) * 100}%`, width: `${(ratioAt(pause.at + pause.length) - ratioAt(pause.at)) * 100}%` }"
			></span>
			<span :class="$style.played" :style="{ width: `${ratioAt(position) * 100}%` }"></span>
		</div>
		<span :class="$style.time">{{ timeText }}</span>
	</div>
	<div :class="$style.status">
		<p v-if="readingLeft != null && state === 'playing'" :class="$style.countdown">
			<i class="ti ti-hourglass" aria-hidden="true"></i> {{ gateLabels.readingTime(formatDuration(readingLeft)) }}
		</p>
		<p :class="[$style.message, { [$style.warn]: state === 'interrupted' || state === 'error' }]" aria-live="polite">{{ message }}</p>
		<MkButton v-if="state === 'interrupted'" primary rounded small @click="emit('resume')">
			<i class="ti ti-player-play-filled"></i> {{ position < 0.5 ? gateLabels.play : gateLabels.resume }}
		</MkButton>
		<MkButton v-else-if="state === 'error'" primary rounded small @click="emit('retry')">
			<i class="ti ti-refresh"></i> {{ gateLabels.audioRetry }}
		</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { formatDuration, playedRatio } from '@/lojo/audio.js';
import { gateLabels } from '@/lojo/gates/labels.js';
import { readingTimeLeft } from '@/lojo/gates/player.js';
import type { GatePause } from '@/lojo/gates/player.js';
import type { RecordingState } from '@/lojo/gates/recording.js';

const props = defineProps<{
	state: RecordingState;
	position: number;
	total: number;
	buffering: boolean;
	blocked: boolean;
	pauses: GatePause[];
}>();

// Both happen inside the tap, so iOS lets the sound start again.
const emit = defineEmits<{
	(ev: 'resume'): void;
	(ev: 'retry'): void;
}>();

const ratioAt = (t: number) => playedRatio(t, props.total);
const readingLeft = computed(() => readingTimeLeft(props.pauses, props.position));
const timeText = computed(() => {
	const elapsed = formatDuration(props.position) || '0:00';
	const total = formatDuration(props.total);
	return total === '' ? elapsed : `${elapsed} / ${total}`;
});

const message = computed(() => {
	switch (props.state) {
		case 'loading': return gateLabels.loadingAudio;
		case 'interrupted': return props.blocked ? gateLabels.blocked : gateLabels.interrupted;
		case 'error': return gateLabels.audioError;
		case 'ended': return gateLabels.ended;
		default: return props.buffering ? gateLabels.buffering : gateLabels.onceNote;
	}
});
</script>

<style lang="scss" module>
.root {
	position: sticky;
	top: var(--MI-stickyTop, 0px);
	z-index: 2;
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 10px 14px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
	box-shadow: 0 4px 16px -8px color-mix(in srgb, var(--MI_THEME-fg) 30%, transparent);

	&.reading {
		border-color: var(--MI_THEME-accent);
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

.pauseMark {
	position: absolute;
	top: 0;
	bottom: 0;
	background: color-mix(in srgb, var(--MI_THEME-accent) 25%, transparent);
}

.played {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	border-radius: inherit;
	background: var(--MI_THEME-accent);
}

.time {
	flex-shrink: 0;
	font-size: 0.85em;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
	opacity: 0.8;
}

.status {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6px 12px;
	min-height: 1.6em;
}

.countdown {
	margin: 0;
	padding: 2px 10px;
	border-radius: 999px;
	font-weight: bold;
	font-variant-numeric: tabular-nums;
	color: var(--MI_THEME-fgOnAccent);
	background: var(--MI_THEME-accent);
}

.message {
	margin: 0;
	font-size: 0.85em;
	opacity: 0.8;

	&.warn {
		opacity: 1;
		color: var(--MI_THEME-warn);
		font-weight: bold;
	}
}
</style>
