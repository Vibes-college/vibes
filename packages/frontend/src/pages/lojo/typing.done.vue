<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线: the whole line lit. The line fills in stop by stop with confetti; how long it took, the mock's best and the
tries. The next step is the listening line's placement test (the map instead, for a learner already placed on it), or
dictation practice for what went wrong here. -->
<template>
<div :class="$style.root">
	<section :class="[$style.card, $style.dcard]" :aria-labelledby="`${uid}-h`" data-done>
		<div :class="$style.confetti" aria-hidden="true">
			<i v-for="(c, j) in confetti" :key="j" :style="c"></i>
		</div>
		<svg :class="$style.dline" viewBox="0 0 420 96" aria-hidden="true">
			<path :class="$style.tr" d="M34 40 H378"/>
			<template v-for="(s, j) in content.stops" :key="s.id">
				<g :class="$style.stp" :style="{ animationDelay: `${(0.35 + j * 0.22).toFixed(2)}s` }">
					<circle :class="$style.st" :cx="xOf(j)" cy="40" r="15"/>
					<path :class="$style.chk" :d="`M${xOf(j) - 6.5} 40.5l4.4 4.4 8.8-9.7`"/>
				</g>
				<text :class="$style.lab" :x="xOf(j)" y="80">{{ s.short[typingLang] }}</text>
			</template>
			<g :class="$style.stp" style="animation-delay: 1.5s"><rect :class="$style.tm" x="378" y="26" width="28" height="28" rx="8"/></g>
			<text :class="$style.lab" x="392" y="80">{{ L.terminalShort }}</text>
		</svg>
		<p :class="$style.eyebrow">{{ L.doneEyebrow(lineTitle, passed, total) }}</p>
		<h1 :id="`${uid}-h`" ref="headingEl" tabindex="-1" :class="$style.title">{{ L.doneTitle }}</h1>
		<p>{{ L.doneBody(total, L.duration(progress.practiceMs)) }}</p>
		<p>{{ L.doneWalk }}</p>
		<XTiles :class="$style.tiles" :tiles="tiles" soft/>
		<p v-if="onPhone > 0" :class="$style.note">{{ L.donePhone(onPhone) }}</p>
		<p :class="$style.level">{{ L.level }}</p>
	</section>

	<section :class="[$style.card, $style.nextstep]" :aria-labelledby="`${uid}-next`">
		<p :class="$style.eyebrow">{{ L.nextStep }}</p>
		<h2 :id="`${uid}-next`" :class="$style.h2">{{ placed ? L.backListening : L.goListening }}</h2>
		<p>{{ placed ? L.placedBody : L.placementBody }}</p>
		<div :class="$style.go">
			<template v-if="!placed">
				<MkButton type="routerLink" :to="PLACEMENT" primary rounded large data-placement>{{ L.placement }} <i class="ti ti-arrow-right" aria-hidden="true"></i></MkButton>
				<MkButton type="routerLink" :to="MAP" rounded large><i class="ti ti-map-2" aria-hidden="true"></i> {{ L.toListeningMap }}</MkButton>
			</template>
			<template v-else>
				<MkButton type="routerLink" :to="MAP" primary rounded large><i class="ti ti-map-2" aria-hidden="true"></i> {{ L.toListeningMap }}</MkButton>
				<MkA :to="PLACEMENT" class="_link" data-placement>{{ L.placeAgain }}</MkA>
			</template>
		</div>
		<p :class="$style.alt"><b>{{ L.alsoLabel }}</b>{{ L.alsoBody }} <MkA to="/dictation" class="_link">{{ L.toDictation }}</MkA></p>
	</section>

	<button class="_button" :class="$style.back" @click="emit('line')">{{ L.backToLine }}</button>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, useId, useTemplateRef } from 'vue';
import XTiles from './typing.tiles.vue';
import type { Tile } from './typing.tiles.vue';
import type { TypingContent } from '@/lojo/typing/content.js';
import type { TypingProgress } from '@/lojo/typing/record.js';
import { passedIds, totalTries } from '@/lojo/typing/record.js';
import { typingLabels as L, typingLang } from '@/lojo/typing/labels.js';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useRouter } from '@/router.js';

const props = defineProps<{
	content: TypingContent;
	progress: TypingProgress;
}>();

const emit = defineEmits<{
	(ev: 'line'): void;
}>();

// The listening line of the IELTS map, and its placement test.
const COURSE = 'ielts';
const LISTENING = 1;
const PLACEMENT = `/gate/${COURSE}/placement-${LISTENING}`;
const MAP = `/map/${COURSE}`;

const router = useRouter();
const uid = `typing-done-${useId()}`;
const headingEl = useTemplateRef('headingEl');
const ids = computed(() => props.content.stops.map(s => s.id));
const total = computed(() => ids.value.length);
const passed = computed(() => passedIds(props.progress, ids.value).length);
const lineTitle = computed(() => L.lineName(props.content.line.n, props.content.line.name[typingLang]));
const onPhone = computed(() => ids.value.filter(id => props.progress.stops[id]?.passedOn === 'phone').length);
// already placed on the listening line, or past a stop of it: the map rather than the placement test
const placed = ref(false);

const xOf = (j: number) => 34 + j * (344 / Math.max(1, props.content.stops.length));

const tiles = computed<Tile[]>(() => {
	const mock = props.content.stops.find(s => s.kind === 'mock');
	const best = mock != null ? props.progress.stops[mock.id]?.best : null;
	return [
		{ id: 'mockWpm', label: L.tileMockWpm, value: best?.wpm != null ? String(best.wpm) : '—', unit: L.wpmUnit },
		{ id: 'mockAcc', label: L.tileMockAcc, value: best?.acc != null ? `${best.acc}%` : '—' },
		{ id: 'tries', label: L.tileTries, value: String(totalTries(props.progress, ids.value)), unit: L.timesUnit },
	];
});

const COLORS = ['var(--tl-c)', 'var(--tl-mustard)', 'var(--MI_THEME-cta)', 'var(--MI_THEME-accent)', 'var(--tl-ok)'];
const confetti = Array.from({ length: 46 }, (_, j) => ({
	'--x': `${(Math.random() * 100).toFixed(1)}%`,
	'--d': `${(Math.random() * 0.9).toFixed(2)}s`,
	'--r': `${Math.round(Math.random() * 360)}deg`,
	'--k': COLORS[j % COLORS.length],
}));

onMounted(() => {
	misskeyApi('lojo/gates/progress', { course: COURSE }).then(res => {
		const line = res.lines.find(l => l.line === LISTENING);
		placed.value = line != null && (line.placement.station != null || line.passed > 0);
	}, () => { /* a newcomer's next step, then */ });
});

function focusHeading() {
	headingEl.value?.focus({ preventScroll: true });
}

// Enter: the next step.
function primary() {
	router.pushByPath(placed.value ? MAP : PLACEMENT);
}

defineExpose({ focusHeading, primary });
</script>

<style lang="scss" module>
.root {
	max-width: 720px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.card {
	background: var(--MI_THEME-panel);
	border-radius: 22px;
	box-shadow: var(--tl-shadow);
	padding: 20px;
}

.dcard {
	position: relative;
	overflow: hidden;
	text-align: center;
	padding: 26px 18px 22px;
	background: radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--tl-c) 14%, var(--MI_THEME-panel)), var(--MI_THEME-panel) 70%);

	> p {
		margin: 0 0 6px;
		font-size: 15px;
		line-height: 1.7;
	}
}

.confetti {
	position: absolute;
	inset: 0;
	pointer-events: none;
	overflow: hidden;

	> i {
		position: absolute;
		top: -16px;
		left: var(--x);
		width: 9px;
		height: 14px;
		border-radius: 2px;
		background: var(--k);
		transform: rotate(var(--r));
		animation: fall 2.2s var(--d) ease-in forwards;
	}
}

@keyframes fall {
	to { transform: translateY(620px) rotate(calc(var(--r) + 540deg)); opacity: 0; }
}

.dline {
	display: block;
	width: 100%;
	max-width: 420px;
	height: 96px;
	margin: 0 auto 4px;
	overflow: visible;
}

.tr {
	fill: none;
	stroke: var(--tl-c);
	stroke-width: 9;
	stroke-linecap: round;
	stroke-dasharray: 400;
	stroke-dashoffset: 400;
	animation: draw 1.4s 0.2s ease-out forwards;
}

.stp {
	animation: fillin 0.45s ease-out both;
	transform-box: fill-box;
	transform-origin: center;
}

.st {
	fill: var(--tl-c);
}

.chk {
	fill: none;
	stroke: var(--tl-onC);
	stroke-width: 3.4;
	stroke-linecap: round;
	stroke-linejoin: round;
}

.tm {
	fill: var(--tl-mustard);
	stroke: var(--tl-ink);
	stroke-width: 3.5;
}

.lab {
	font: 700 12px system-ui, sans-serif;
	fill: var(--tl-weak);
	text-anchor: middle;
}

@keyframes draw {
	to { stroke-dashoffset: 0; }
}

@keyframes fillin {
	0% { transform: scale(0.4); opacity: 0; }
	60% { transform: scale(1.25); opacity: 1; }
	100% { transform: scale(1); }
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
	font-size: 30px;
	line-height: 1.25;
	letter-spacing: 0.03em;
	color: var(--tl-ink);
	margin: 0 0 8px;

	&:focus:not(:focus-visible) {
		outline: none;
	}
}

.tiles {
	max-width: 520px;
	margin: 14px auto 0;
}

.dcard > .note {
	background: var(--tl-goldBg);
	border-radius: 14px;
	padding: 10px 13px;
	font-size: 13.5px;
	margin: 12px 0 0;
}

.dcard > .level {
	font-size: 12px;
	color: var(--tl-weak);
	margin: 12px 0 0;
}

.nextstep {
	> p {
		margin: 0 0 10px;
		font-size: 14.5px;
		line-height: 1.7;
	}

	> .eyebrow {
		margin: 0 0 4px;
		font-size: 11.5px;
	}
}

.h2 {
	font-family: var(--tl-serif);
	font-size: 20px;
	color: var(--tl-ink);
	margin: 0 0 6px;
}

.go {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px 14px;
	margin: 4px 0 12px;
}

.nextstep > .alt {
	border-top: 1px solid var(--tl-line);
	padding-top: 10px;
	margin: 0;
	font-size: 14px;
}

.back {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 50px;
	border-radius: 15px;
	background: var(--MI_THEME-buttonBg);
	color: var(--tl-ink);
	font-weight: 700;
	font-size: 16px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.confetti {
		display: none;
	}

	.tr,
	.stp {
		animation: none;
		stroke-dashoffset: 0;
	}
}
</style>
