<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- Vibes: a chat voice message (an AI tutor's spoken reply), played in place like a WeChat voice bubble. -->
<template>
<div :class="$style.root">
	<button
		class="_buttonPrimary"
		:class="$style.play"
		:aria-label="chatLabels.voicePlay"
		:aria-pressed="playing"
		@click="toggle"
	>
		<i :class="playing ? 'ti ti-player-pause-filled' : 'ti ti-player-play-filled'"></i>
	</button>
	<div :class="$style.track" aria-hidden="true">
		<div :class="$style.played" :style="{ width: `${progress * 100}%` }"></div>
	</div>
	<span :class="$style.time">{{ timeText }}</span>
	<audio
		ref="audioEl"
		:preload="Number.isFinite(estimate) || prefer.s.dataSaver.media ? 'none' : 'metadata'"
		:src="file.url"
		@loadedmetadata="onDuration"
		@durationchange="onDuration"
		@timeupdate="onTimeUpdate"
		@play="onPlay"
		@pause="onPause"
		@ended="onEnded"
		@error="onError"
	></audio>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onDeactivated, ref, useTemplateRef } from 'vue';
import type * as Misskey from 'misskey-js';
import { chatLabels } from '@/lojo/english/labels.js';
import { estimatedVoiceSeconds, playedRatio, releaseAudioFocus, takeAudioFocus, voiceTimeText } from '@/lojo/audio.js';
import { prefer } from '@/preferences.js';
import * as os from '@/os.js';

const props = defineProps<{
	file: Misskey.entities.DriveFile;
}>();

const audioEl = useTemplateRef('audioEl');
const playing = ref(false);
const position = ref(0);
// Known from the size for our own voice files, so they need no download before the first tap.
const estimate = estimatedVoiceSeconds(props.file);
const duration = ref(estimate);

const progress = computed(() => playedRatio(position.value, duration.value));
const timeText = computed(() => voiceTimeText(position.value, duration.value));

function toggle() {
	const el = audioEl.value;
	if (el == null) return;
	if (el.error != null) {
		// After a failed load (a dropped connection, say) the clip only plays again once it is loaded afresh.
		el.load();
	} else if (!el.paused) {
		el.pause();
		return;
	}
	el.play().catch((err: unknown) => {
		// A pause that lands before playback has started is not a failure.
		if (err instanceof DOMException && err.name === 'AbortError') return;
		playing.value = false;
		releaseAudioFocus(el);
		os.toast(chatLabels.voiceFailed);
	});
}

function onDuration() {
	const known = audioEl.value?.duration ?? Number.NaN;
	if (Number.isFinite(known)) duration.value = known;
}

function onTimeUpdate() {
	position.value = audioEl.value?.currentTime ?? 0;
}

// Only one sound at a time: this pauses any other voice message and the read-aloud.
function onPlay() {
	if (audioEl.value != null) takeAudioFocus(audioEl.value);
	playing.value = true;
}

function onPause() {
	playing.value = false;
	if (audioEl.value != null) releaseAudioFocus(audioEl.value);
}

function onEnded() {
	playing.value = false;
	position.value = 0;
}

// A network error midway fires no pause event. The failed play() call already shows the toast.
function onError() {
	playing.value = false;
	if (audioEl.value != null) releaseAudioFocus(audioEl.value);
}

// Leaving the chat stops the sound instead of leaving it playing with no button in sight.
onDeactivated(() => {
	audioEl.value?.pause();
});

onBeforeUnmount(() => {
	const el = audioEl.value;
	if (el == null) return;
	el.pause();
	releaseAudioFocus(el);
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: center;
	gap: 8px;
	width: 220px;
	max-width: 100%;
}

.play {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 999px;

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.track {
	flex: 1;
	min-width: 0;
	height: 3px;
	border-radius: 999px;
	background: color-mix(in srgb, var(--MI_THEME-fg) 15%, transparent);
	overflow: clip;
}

.played {
	height: 100%;
	border-radius: inherit;
	background: var(--MI_THEME-accent);
}

.time {
	flex-shrink: 0;
	font-size: 0.85em;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
	opacity: 0.7;
}
</style>
