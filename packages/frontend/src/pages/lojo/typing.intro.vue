<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线: a stop before it starts. What it is, how it is passed (the rule stands out), a few tips, and the start
button (Enter on a computer). Stop 3 also has its voice, a sound check, and starts getting its recordings ready. -->
<template>
<div :class="$style.root">
	<button class="_button" :class="$style.back" @click="emit('back')"><i class="ti ti-arrow-left" aria-hidden="true"></i>{{ L.back }}</button>
	<section :class="$style.card" :aria-labelledby="`${uid}-h`" :data-intro="stop.id">
		<p :class="$style.eyebrow">{{ L.stopMeta(stop.n, stopMinutes(stop, device)) }}</p>
		<h1 :id="`${uid}-h`" ref="headingEl" tabindex="-1" :class="$style.title">{{ stop.name[typingLang] }}</h1>
		<p :class="$style.lede">{{ intro.what }}</p>
		<div :class="$style.rule" data-rule>
			<span :class="$style.ruleIc" aria-hidden="true"><i class="ti ti-check"></i></span>
			<div><small>{{ L.rule }}</small><b>{{ rule }}</b></div>
		</div>
		<p v-if="state === 'locked'" :class="$style.note">{{ L.lockedNote(behind) }}</p>
		<p v-else-if="state === 'passed'" :class="$style.note"><b>{{ L.passedNote[0] }}</b>{{ L.passedNote[1] }}</p>
		<ul :class="$style.pts">
			<li v-for="t in intro.tips" :key="t">{{ t }}</li>
		</ul>
		<p v-if="device === 'phone'" :class="$style.phoneNote">{{ L.phoneNote }}</p>
		<div v-if="stop.kind === 'listen'" :class="$style.voice">
			<template v-if="speech && voice">
				<span>{{ L.voiceLine(voice.name, L.accents[voice.accent] ?? voice.accent) }}</span>
				<button class="_button" :class="$style.pill" :aria-busy="checking" @click="soundCheck">
					<i :class="checking ? 'ti ti-loader-2' : 'ti ti-volume'" aria-hidden="true"></i>{{ L.soundCheck }}
				</button>
				<button class="_button _textButton" :class="$style.voiceBtn" @click="openVoiceMenu">{{ L.changeVoice }}</button>
			</template>
			<span v-else>{{ L.speechOff }}</span>
		</div>
		<div :class="$style.acts">
			<button class="_button" :class="$style.cta" data-start @click="emit('start')">
				{{ state === 'passed' ? L.again : state === 'locked' ? L.skipAhead : L.start }}
				<kbd v-if="!touchScreen" :class="$style.kbd">{{ L.enterKey }}</kbd>
			</button>
		</div>
		<p v-if="record && record.tries > 0" :class="$style.meta">
			{{ L.tried(record.tries) }}<template v-if="bestText"> · {{ L.best(bestText) }}</template>
		</p>
	</section>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, useId, useTemplateRef } from 'vue';
import type { Device, Stop, TypingContent } from '@/lojo/typing/content.js';
import type { TypingProgress } from '@/lojo/typing/record.js';
import { isPassed, stopState } from '@/lojo/typing/record.js';
import { introOf, typingLabels as L, ruleText, stopMinutes, typingLang } from '@/lojo/typing/labels.js';
import { touchScreen } from '@/lojo/typing/device.js';
import { SOUND_CHECK, clipLoading, clipText, loadClips, playClip, stopClip, typingVoice, unlockTypingAudio } from '@/lojo/typing/audio.js';
import { englishStatus } from '@/lojo/english/api.js';
import { openVoiceMenu } from '@/lojo/english/speech.js';

const props = defineProps<{
	stop: Stop;
	content: TypingContent;
	progress: TypingProgress;
	device: Device;
}>();

const emit = defineEmits<{
	(ev: 'start'): void;
	(ev: 'back'): void;
}>();

const uid = `typing-intro-${useId()}`;
const headingEl = useTemplateRef('headingEl');
const ids = computed(() => props.content.stops.map(s => s.id));
const state = computed(() => stopState(props.progress, ids.value, props.stop.id));
const record = computed(() => props.progress.stops[props.stop.id] ?? null);
// stops before this one not passed yet
const behind = computed(() => ids.value.slice(0, ids.value.indexOf(props.stop.id)).filter(id => !isPassed(props.progress, id)).length);
const rule = computed(() => ruleText(props.stop, props.device, props.content.goal));
const intro = computed(() => introOf(props.stop, props.device, touchScreen, props.content.goal));
const speech = computed(() => englishStatus.value.speech);
const voice = computed(() => typingVoice.value);
const checking = computed(() => clipText.value === SOUND_CHECK && clipLoading.value);

const bestText = computed(() => {
	const b = record.value?.best;
	if (b == null) return null;
	const s = props.stop;
	if (s.kind === 'copy' && s.need != null && b.score != null && b.total != null) return L.bestCount('copy', b.score, b.total);
	if ((s.kind === 'spell' || s.kind === 'listen') && b.score != null && b.total != null) return L.bestCount(s.kind, b.score, b.total);
	return b.wpm != null && b.acc != null ? L.bestSpeed(b.wpm, b.acc) : null;
});

// Inside the tap, so the recording may play once it has come (iOS).
function soundCheck() {
	unlockTypingAudio();
	void playClip(SOUND_CHECK);
}

// Stop 3's recordings start coming while the intro is read, so it can start at once.
onMounted(() => {
	const s = props.stop;
	if (s.kind === 'listen' && speech.value) void loadClips([s.intro, ...s.rows.map(r => r.say)]);
});

onBeforeUnmount(() => {
	if (clipText.value === SOUND_CHECK) stopClip();
});

function focusHeading() {
	headingEl.value?.focus({ preventScroll: true });
}

defineExpose({ focusHeading });
</script>

<style lang="scss" module>
.root {
	max-width: 640px;
	margin: 0 auto;
}

.back {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: var(--tl-weak);
	font-size: 13.5px;
	font-weight: 600;
	margin: 0 0 10px;
	padding: 4px 10px 4px 2px;
	border-radius: 999px;

	> i {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--MI_THEME-panel);
		display: grid;
		place-items: center;
		color: var(--tl-ink);
		box-shadow: var(--tl-shadow);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.card {
	background: var(--MI_THEME-panel);
	border-radius: 22px;
	box-shadow: var(--tl-shadow);
	padding: 20px;
}

.eyebrow {
	font-size: 11.5px;
	letter-spacing: 0.22em;
	color: var(--tl-weak);
	margin: 0 0 6px;
	font-weight: 600;
}

.title {
	font-family: var(--tl-serif);
	font-weight: 700;
	font-size: 28px;
	line-height: 1.25;
	letter-spacing: 0.03em;
	color: var(--tl-ink);
	margin: 0 0 8px;

	&:focus:not(:focus-visible) {
		outline: none;
	}
}

.lede {
	font-size: 14.5px;
	line-height: 1.75;
	margin: 0 0 14px;
}

.rule {
	display: flex;
	gap: 12px;
	align-items: center;
	background: var(--tl-cBg);
	box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--tl-c) 40%, transparent);
	border-radius: 16px;
	padding: 13px 15px;
	margin: 4px 0 14px;

	small {
		display: block;
		font-size: 12px;
		color: var(--tl-weak);
		font-weight: 600;
		letter-spacing: 0.1em;
	}

	b {
		display: block;
		font-size: 16px;
		color: var(--tl-ink);
		line-height: 1.5;
	}
}

.ruleIc {
	flex: none;
	width: 34px;
	height: 34px;
	border-radius: 50%;
	background: var(--tl-c);
	color: var(--tl-onC);
	display: grid;
	place-items: center;
	font-size: 18px;
}

.note {
	background: var(--tl-goldBg);
	border-radius: 14px;
	padding: 10px 13px;
	font-size: 13.5px;
	line-height: 1.6;
	margin: 0 0 12px;

	> b {
		color: var(--tl-ink);
	}
}

.pts {
	margin: 0;
	padding: 0;
	list-style: none;

	> li {
		position: relative;
		padding: 9px 0 9px 20px;
		border-top: 1px solid var(--tl-line);
		font-size: 14px;
		line-height: 1.65;

		&::before {
			content: "";
			position: absolute;
			left: 3px;
			top: 17px;
			width: 7px;
			height: 7px;
			border-radius: 50%;
			background: var(--tl-c);
		}
	}
}

.phoneNote {
	font-size: 13px;
	color: var(--tl-gold);
	margin: 10px 0 0;
}

.voice {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px 12px;
	background: var(--tl-hi);
	border-radius: 14px;
	padding: 10px 13px;
	margin: 12px 0 0;
	font-size: 13.5px;

	> span {
		flex: 1;
		min-width: 180px;
	}
}

.pill {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 34px;
	padding: 0 14px;
	border-radius: 999px;
	background: var(--MI_THEME-panel);
	box-shadow: inset 0 0 0 1.5px var(--tl-line);
	font-weight: 700;
	font-size: 13.5px;
	color: var(--tl-ink);

	&:hover {
		background: var(--MI_THEME-buttonBg);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.voiceBtn {
	font-size: 13px;
}

.acts {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: 16px;
}

.cta {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	width: 100%;
	min-height: 50px;
	padding: 0 18px;
	border-radius: 15px;
	background: var(--MI_THEME-cta);
	color: var(--MI_THEME-fgOnAccent);
	font-weight: 700;
	font-size: 16px;
	letter-spacing: 0.04em;

	&:hover {
		background: hsl(from var(--MI_THEME-cta) h s calc(l + 5));
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.kbd {
	font: 600 11.5px system-ui, sans-serif;
	background: color-mix(in srgb, var(--MI_THEME-fgOnAccent) 22%, transparent);
	border-radius: 6px;
	padding: 2px 6px;
	letter-spacing: 0;
}

.meta {
	font-size: 12.5px;
	color: var(--tl-weak);
	line-height: 1.6;
	margin: 10px 0 0;
}

@media (hover: none) {
	.cta:hover {
		background: var(--MI_THEME-cta);
	}

	.pill:hover {
		background: var(--MI_THEME-panel);
	}
}

@container typing (min-width: 720px) {
	.title {
		font-size: 34px;
	}

	.card {
		padding: 24px 26px;
	}
}
</style>
