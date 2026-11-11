<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线 · 机考打字: the line. Its stops in a row (one under the other on a narrow screen), each passed (filled, with
a check), ready (a ring that breathes) or locked (a lock; it can still be tried); the end of the line lights up when they
all are. Below: the next stop with its pass rule, why typing is worth practising (with sources), and the switch
between phone and computer targets. -->
<template>
<div :class="$style.root">
	<header :class="$style.hero">
		<p :class="$style.eyebrow">{{ L.eyebrow }}</p>
		<h1 ref="headingEl" tabindex="-1" :class="$style.title">{{ lineTitle }}</h1>
		<p :class="$style.lede">{{ L.lede(content.stops.length, totalMinutes) }}</p>
		<div :class="$style.devbar">
			<span :class="$style.devchip"><i :class="device === 'phone' ? 'ti ti-device-mobile' : 'ti ti-device-laptop'" aria-hidden="true"></i>{{ L.deviceChip[device] }}</span>
			<button class="_button" :class="$style.linkbtn" data-device-switch @click="emit('device', device === 'phone' ? 'desktop' : 'phone')">{{ L.deviceSwitch[device] }}</button>
		</div>
		<p v-if="device === 'phone'" :class="$style.phoneNote">{{ L.phoneNote }}</p>
		<p v-if="loadFailed" :class="$style.warn" role="alert">{{ L.progressFailed }}</p>
	</header>

	<section :class="[$style.card, $style.map]" :aria-labelledby="`${uid}-map`">
		<div :class="$style.mapHead">
			<span :id="`${uid}-map`" :class="$style.ltag" data-line-count>{{ lineTitle }} <em>{{ passed.length }}/{{ content.stops.length }}</em></span>
			<small>{{ all ? L.lineLit : L.lineSub }}</small>
		</div>
		<ol :class="$style.line">
			<li
				v-for="s in content.stops"
				:key="s.id"
				:class="[$style.sli, $style[stateOf(s.id)], { [$style.lit]: isLit(s.id), [$style.grow]: s.id === justLit }]"
				:data-stop="s.id"
				:data-state="stateOf(s.id)"
			>
				<button class="_button" :class="$style.stop" :aria-label="L.stopAria(s.n, s.name[typingLang], L.statesLong[stateOf(s.id)])" @click="emit('open', s.id)">
					<svg :class="$style.dot" viewBox="-24 -24 48 48" aria-hidden="true">
						<circle v-if="stateOf(s.id) === 'ready'" r="17" :class="$style.pulse"/>
						<circle r="17" :class="$style.ring"/>
						<path v-if="stateOf(s.id) === 'passed'" :class="$style.chk" d="M-7.5 .5l5 5 10-11"/>
						<g v-else-if="stateOf(s.id) === 'locked'" :class="$style.lock">
							<path d="M-3.6 -1.5 V-4.4 A3.6 3.6 0 0 1 3.6 -4.4 V-1.5"/>
							<rect x="-6" y="-1.5" width="12" height="9" rx="2"/>
						</g>
						<text v-else :class="$style.num" y="5.5">{{ s.n }}</text>
					</svg>
					<span :class="$style.sl">
						<span :class="$style.sn">{{ L.stopMeta(s.n, stopMinutes(s, device)) }}</span>
						<b :class="$style.st">{{ s.name[typingLang] }}</b>
						<span :class="$style.sd">{{ s.blurb[typingLang] }}</span>
						<span :class="$style.tags">
							<span :class="[$style.tg, $style[`tg_${stateOf(s.id)}`]]">{{ stateOf(s.id) === 'passed' ? '✓ ' : '' }}{{ L.states[stateOf(s.id)] }}</span>
							<span v-if="progress.stops[s.id]?.passedOn === 'phone'" :class="[$style.tg, $style.tg_phone]">{{ L.byPhone }}</span>
						</span>
					</span>
				</button>
			</li>
			<li :class="[$style.term, { [$style.termOn]: all }]">
				<i aria-hidden="true"></i>
				<button v-if="all" class="_button" :class="$style.termGo" @click="emit('done')">{{ L.terminalGo }} →</button>
				<span v-else>{{ L.terminal }}</span>
			</li>
		</ol>
	</section>

	<div :class="$style.lower">
		<section v-if="next" :class="[$style.card, $style.next]" :aria-labelledby="`${uid}-next`">
			<p :class="$style.eyebrow">{{ passed.length > 0 ? L.nextLabel : L.nextFirst }}</p>
			<b :id="`${uid}-next`" :class="$style.nextTitle">{{ L.nextTitle(next.n, next.name[typingLang]) }}</b>
			<p>{{ L.nextBody(next.blurb[typingLang], stopMinutes(next, device)) }}</p>
			<div :class="$style.rulemini"><b>{{ L.rule }}</b><span>{{ ruleText(next, device, content.goal) }}</span></div>
			<button class="_button" :class="$style.cta" data-next @click="emit('open', next.id)">
				{{ passed.length > 0 ? L.continueAt(next.n) : L.startAt(next.n) }} <i class="ti ti-arrow-right" aria-hidden="true"></i>
			</button>
		</section>
		<section v-else :class="[$style.card, $style.next]" :aria-labelledby="`${uid}-next`">
			<p :class="$style.eyebrow">{{ L.lineLit }}</p>
			<b :id="`${uid}-next`" :class="$style.nextTitle">{{ L.allTitle(content.stops.length) }}</b>
			<p>{{ L.allBody(L.duration(progress.practiceMs)) }}</p>
			<button class="_button" :class="$style.cta" data-next @click="emit('done')">
				{{ L.seeLine }} <i class="ti ti-arrow-right" aria-hidden="true"></i>
			</button>
		</section>

		<details :class="[$style.card, $style.why]" :open="device !== 'phone'">
			<summary>{{ L.whyTitle }}</summary>
			<ul :class="$style.pts">
				<li v-for="(w, i) in L.why" :key="i"><b>{{ w[0] }}</b>{{ w[1] }}</li>
			</ul>
			<p :class="$style.src">{{ L.whySource }}</p>
		</details>
	</div>

	<footer :class="$style.foot">
		<p :class="{ [$style.warnText]: saveFailed }">{{ saveFailed ? L.saveFailed : L.savedNote }}</p>
		<MkA to="/quest" :class="$style.mapLink"><i class="ti ti-map-2" aria-hidden="true"></i> {{ L.toMap }}</MkA>
	</footer>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, useId, useTemplateRef } from 'vue';
import type { Device, TypingContent } from '@/lojo/typing/content.js';
import type { StopState, TypingProgress } from '@/lojo/typing/record.js';
import { nextStopId, passedIds, stopState } from '@/lojo/typing/record.js';
import { typingLabels as L, ruleText, stopMinutes, typingLang } from '@/lojo/typing/labels.js';

const props = defineProps<{
	content: TypingContent;
	progress: TypingProgress;
	device: Device;
	// the stop that lit up just now: its part of the line fills in
	justLit: string | null;
	loadFailed: boolean;
	saveFailed: boolean;
}>();

const emit = defineEmits<{
	(ev: 'open', id: string): void;
	(ev: 'device', next: Device): void;
	(ev: 'done'): void;
}>();

const uid = `typing-line-${useId()}`;
const headingEl = useTemplateRef('headingEl');
const ids = computed(() => props.content.stops.map(s => s.id));
const passed = computed(() => passedIds(props.progress, ids.value));
const all = computed(() => passed.value.length === ids.value.length);
const next = computed(() => {
	const id = nextStopId(props.progress, ids.value);
	return props.content.stops.find(s => s.id === id) ?? null;
});
const lineTitle = computed(() => L.lineName(props.content.line.n, props.content.line.name[typingLang]));
const totalMinutes = computed(() => Math.round(props.content.stops.reduce((n, s) => n + stopMinutes(s, props.device), 0) / 5) * 5);

const stateOf = (id: string): StopState => stopState(props.progress, ids.value, id);

// The stop just lit fills in a moment after the line shows; the others are lit already.
const grown = ref(false);
const isLit = (id: string) => stateOf(id) === 'passed' && (id !== props.justLit || grown.value);

onMounted(() => {
	window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
		grown.value = true;
	}));
});

function focusHeading() {
	headingEl.value?.focus({ preventScroll: true });
}

defineExpose({ focusHeading });
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.card {
	background: var(--MI_THEME-panel);
	border-radius: 22px;
	box-shadow: var(--tl-shadow);
	padding: 18px;
}

.eyebrow {
	font-size: 11.5px;
	letter-spacing: 0.22em;
	color: var(--tl-weak);
	margin: 0 0 6px;
	font-weight: 600;
}

.hero {
	padding: 4px 4px 0;
	max-width: 720px;
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
	margin: 0 0 12px;
}

.devbar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px 10px;
}

.devchip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	font-weight: 700;
	color: var(--tl-ink);
	background: var(--MI_THEME-panel);
	border-radius: 999px;
	padding: 5px 12px 5px 9px;
	box-shadow: inset 0 0 0 1.5px var(--tl-line);

	> i {
		font-size: 16px;
	}
}

.linkbtn {
	color: var(--MI_THEME-accent);
	font-weight: 600;
	font-size: 13.5px;
	padding: 6px 4px;
	border-radius: 8px;

	&:hover {
		text-decoration: underline;
	}
}

.phoneNote {
	font-size: 13px;
	color: var(--tl-gold);
	margin: 8px 0 0;
}

.warn {
	font-size: 13px;
	color: var(--tl-bad);
	margin: 8px 0 0;
}

.map {
	padding: 16px 12px 10px;
}

.mapHead {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	margin: 0 6px 10px;

	> small {
		color: var(--tl-weak);
		font-size: 12.5px;
		text-align: right;
	}
}

.ltag {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	background: var(--tl-c);
	color: var(--tl-onC);
	font-weight: 700;
	font-size: 14px;
	padding: 5px 12px;
	border-radius: 10px;
	letter-spacing: 0.02em;

	> em {
		font-style: normal;
		font-variant-numeric: tabular-nums;
		opacity: 0.9;
	}
}

.line {
	list-style: none;
	margin: 0;
	padding: 0;
	position: relative;
}

.sli {
	position: relative;

	// the track to the next stop, and its fill once this one is passed
	&::before,
	&::after {
		content: "";
		position: absolute;
		left: 31px;
		top: 34px;
		bottom: -34px;
		width: 8px;
		margin-left: -4px;
		border-radius: 4px;
		z-index: 0;
	}

	&::before {
		background: var(--tl-cMute);
	}

	&::after {
		background: var(--tl-c);
		transform: scaleY(0);
		transform-origin: top;
		transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
	}

	&.lit::after {
		transform: scaleY(1);
	}

	&.grow::after {
		transition-delay: 0.45s;
	}
}

.stop {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: flex-start;
	gap: 12px;
	width: 100%;
	text-align: left;
	padding: 10px 10px 12px 9px;
	border-radius: 16px;

	&:hover {
		background: var(--tl-hi);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: -2px;
	}
}

.dot {
	flex: none;
	width: 44px;
	height: 44px;
	display: block;
	overflow: visible;
}

.ring {
	fill: var(--MI_THEME-panel);
	stroke: var(--tl-c);
	stroke-width: 5;

	.passed & {
		fill: var(--tl-c);
	}

	.ready & {
		stroke-width: 7.5;
	}

	.locked & {
		stroke: var(--tl-cMute);
	}
}

.chk {
	fill: none;
	stroke: var(--tl-onC);
	stroke-width: 3.6;
	stroke-linecap: round;
	stroke-linejoin: round;
}

.lock {
	> path {
		fill: none;
		stroke: color-mix(in srgb, var(--MI_THEME-fg) 55%, var(--MI_THEME-panel));
		stroke-width: 2.2;
		stroke-linecap: round;
	}

	> rect {
		fill: color-mix(in srgb, var(--MI_THEME-fg) 55%, var(--MI_THEME-panel));
	}
}

.num {
	font: 800 15px system-ui, sans-serif;
	fill: var(--tl-c);
	text-anchor: middle;
}

.pulse {
	fill: none;
	stroke: var(--tl-c);
	stroke-width: 4;
	animation: breathe 2.6s ease-out infinite;
	transform-box: fill-box;
	transform-origin: center;
}

@keyframes breathe {
	0% { transform: scale(1); opacity: 0.5; }
	75%, 100% { transform: scale(1.75); opacity: 0; }
}

.grow .dot {
	animation: pop 0.8s 0.1s ease-out both;
}

@keyframes pop {
	0% { transform: scale(1); }
	35% { transform: scale(1.45); }
	100% { transform: scale(1); }
}

.sl {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding-top: 1px;
}

.sn {
	font-size: 11.5px;
	color: var(--tl-weak);
	font-weight: 600;
	letter-spacing: 0.06em;
}

.st {
	font-family: var(--tl-serif);
	font-weight: 700;
	font-size: 18px;
	color: var(--tl-ink);
	line-height: 1.3;

	.locked & {
		color: color-mix(in srgb, var(--tl-ink) 62%, var(--MI_THEME-panel));
	}
}

.sd {
	font-size: 13px;
	color: var(--tl-weak);
	line-height: 1.5;
}

.tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-top: 5px;
}

.tg {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	font-weight: 700;
	padding: 2px 9px;
	border-radius: 999px;
	white-space: nowrap;
}

.tg_passed {
	background: var(--tl-okBg);
	color: var(--tl-ok);
}

.tg_ready {
	background: color-mix(in srgb, var(--MI_THEME-cta) 12%, var(--MI_THEME-panel));
	color: color-mix(in srgb, var(--MI_THEME-cta) 75%, var(--tl-ink));
}

.tg_locked {
	background: var(--tl-hi);
	color: var(--tl-weak);
}

.tg_phone {
	background: var(--tl-goldBg);
	color: var(--tl-gold);
}

.term {
	position: relative;
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 21px 10px 6px 18px;
	color: var(--tl-weak);
	font-size: 13px;
	font-weight: 600;

	> i {
		position: relative;
		z-index: 1;
		flex: none;
		width: 26px;
		height: 26px;
		border-radius: 8px;
		background: var(--MI_THEME-panel);
		box-shadow: inset 0 0 0 3px var(--tl-cMute);
	}

	&.termOn {
		color: var(--tl-ink);

		> i {
			background: var(--tl-mustard);
			box-shadow: inset 0 0 0 3px var(--tl-ink);
		}
	}
}

.termGo {
	color: var(--MI_THEME-accent);
	font-weight: 700;
}

.lower {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.next {
	display: flex;
	flex-direction: column;
	gap: 10px;

	> p {
		margin: 0;
		font-size: 14px;
		line-height: 1.65;
	}

	> .eyebrow {
		margin: 0;
	}
}

.nextTitle {
	font-family: var(--tl-serif);
	font-weight: 700;
	font-size: 20px;
	color: var(--tl-ink);
}

.rulemini {
	display: flex;
	gap: 8px;
	align-items: flex-start;
	background: var(--tl-cBg);
	border-radius: 12px;
	padding: 9px 12px;
	font-size: 13.5px;
	color: var(--tl-ink);

	> b {
		white-space: nowrap;
	}
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

.why {
	> summary {
		cursor: pointer;
		font-family: var(--tl-serif);
		font-weight: 700;
		color: var(--tl-ink);
		font-size: 16.5px;
		list-style: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 10px;

		&::-webkit-details-marker {
			display: none;
		}

		&::after {
			content: "+";
			font-family: system-ui, sans-serif;
			color: var(--tl-weak);
			font-weight: 400;
		}
	}

	&[open] > summary::after {
		content: "−";
	}
}

.pts {
	margin: 12px 0 0;
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

		> b {
			color: var(--tl-ink);
		}
	}
}

.src {
	font-size: 12px;
	color: var(--tl-weak);
	margin: 10px 0 0;
	line-height: 1.7;
}

.foot {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 0 6px;
	font-size: 12.5px;
	color: var(--tl-weak);

	> p {
		margin: 0;
	}
}

.warnText {
	color: var(--tl-bad);
}

.mapLink {
	color: var(--MI_THEME-accent);
	font-weight: 600;
}

@media (hover: none) {
	.stop:hover {
		background: none;
	}

	.cta:hover {
		background: var(--MI_THEME-cta);
	}
}

@media (prefers-reduced-motion: reduce) {
	.pulse,
	.grow .dot {
		animation: none;
	}

	.sli::after {
		transition: none;
	}
}

// On a wide screen the stops stand in a row, the track running between them.
@container typing (min-width: 720px) {
	.title {
		font-size: 34px;
	}

	.map {
		padding: 22px 18px 18px;
	}

	.line {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr)) 0.62fr;
		align-items: start;
	}

	.sli {
		&::before,
		&::after {
			left: 50%;
			top: 42px;
			bottom: auto;
			width: 100%;
			height: 8px;
			margin: -4px 0 0;
		}

		&:nth-child(5)::before,
		&:nth-child(5)::after {
			width: 81%;
		}

		&::after {
			transform: scaleX(0);
			transform-origin: left;
		}

		&.lit::after {
			transform: scaleX(1);
		}
	}

	.stop {
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 8px;
		padding: 18px 8px 14px;
	}

	.dot {
		width: 48px;
		height: 48px;
	}

	.sl {
		align-items: center;
	}

	.tags {
		justify-content: center;
	}

	.sd {
		font-size: 12.5px;
		max-width: 15em;
	}

	.term {
		flex-direction: column;
		justify-content: flex-start;
		text-align: center;
		gap: 8px;
		padding: 29px 4px 8px;
	}

	.lower {
		display: grid;
		grid-template-columns: 1.1fr 1fr;
		align-items: start;
	}
}
</style>
