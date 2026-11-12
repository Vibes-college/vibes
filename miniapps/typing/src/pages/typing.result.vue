<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线: a stop's result. Passed or not and why (each rule ✓ or ✗), its numbers, the little line with the stop just
lit, then what's next: the next stop, again, or (after three misses in a row) on to the next stop for now. Below, every
item looked at again. -->
<template>
<div :class="$style.root">
	<section :class="[$style.card, $style.head, result.pass ? $style.pass : $style.fail]" :aria-labelledby="`${uid}-h`" :data-result="result.pass ? 'pass' : 'fail'">
		<div :class="$style.badge" aria-hidden="true"><i :class="result.pass ? 'ti ti-check' : 'ti ti-target-arrow'"></i></div>
		<p :class="$style.eyebrow">{{ L.nextTitle(stop.n, stop.name[typingLang]) }}</p>
		<h1 :id="`${uid}-h`" ref="headingEl" tabindex="-1" :class="$style.title">{{ title }}</h1>
		<ul :class="$style.reasons">
			<li v-for="(r, j) in reasons" :key="j" :class="r.ok == null ? $style.info : r.ok ? $style.ok : $style.bad">
				<i aria-hidden="true">{{ r.ok == null ? 'i' : r.ok ? '✓' : '✗' }}</i><span>{{ r.text }}</span>
			</li>
		</ul>
		<XTiles :class="$style.tiles" :tiles="tiles" soft/>
		<svg :class="$style.minil" :viewBox="`0 0 ${20 + (content.stops.length - 1) * 50} 34`" aria-hidden="true">
			<line :class="$style.tr" x1="10" y1="17" :x2="xOf(content.stops.length - 1)" y2="17"/>
			<template v-for="(s, j) in content.stops" :key="s.id">
				<line v-if="j < content.stops.length - 1 && isPassed(progress, s.id)" :class="$style.tf" :x1="xOf(j)" y1="17" :x2="xOf(j + 1)" y2="17"/>
			</template>
			<circle
				v-for="(s, j) in content.stops"
				:key="s.id"
				:cx="xOf(j)"
				cy="17"
				r="8"
				:class="{ [$style.p]: isPassed(progress, s.id), [$style.new]: newPass && s.id === stop.id }"
			/>
		</svg>
		<p :class="$style.sr">{{ L.miniLine(passedCount, content.stops.length) }}</p>
		<p v-if="result.pass && result.device === 'phone'" :class="$style.meta">{{ L.phonePass }}</p>
		<p :class="$style.level">{{ L.level }}</p>
	</section>
	<XQuestBack app="typing"/>
	<p v-if="!result.pass && fails >= 3" :class="$style.streak">{{ L.streak(fails) }}</p>
	<div :class="$style.acts">
		<button
			v-for="a in actions"
			:key="a.id"
			class="_button"
			:class="[$style.cta, { [$style.ghost]: !a.primary }]"
			:data-act="a.id"
			@click="a.run"
		>
			{{ a.text }}<i v-if="a.arrow" class="ti ti-arrow-right" aria-hidden="true"></i>
		</button>
	</div>
	<XReview :stop="stop" :result="result"/>
</div>
</template>

<script lang="ts" setup>
import { computed, useId, useTemplateRef } from 'vue';
import XTiles from './typing.tiles.vue';
import XReview from './typing.review.vue';
import XQuestBack from '@/lojo/QuestBack.vue';
import type { Tile } from './typing.tiles.vue';
import type { Stop, TypingContent } from '@/lojo/typing/content.js';
import type { StopTry } from '@/lojo/typing/score.js';
import type { TypingProgress } from '@/lojo/typing/record.js';
import { isPassed, nextStopId, passedIds } from '@/lojo/typing/record.js';
import { typingLabels as L, typingLang } from '@/lojo/typing/labels.js';

const props = defineProps<{
	stop: Stop;
	result: StopTry;
	// the stop lit up with this try; and with it the whole line
	newPass: boolean;
	newAll: boolean;
	content: TypingContent;
	progress: TypingProgress;
}>();

const emit = defineEmits<{
	(ev: 'again'): void;
	(ev: 'open', id: string): void;
	(ev: 'line'): void;
	(ev: 'done'): void;
}>();

const uid = `typing-result-${useId()}`;
const headingEl = useTemplateRef('headingEl');
const ids = computed(() => props.content.stops.map(s => s.id));
const passedCount = computed(() => passedIds(props.progress, ids.value).length);
const fails = computed(() => props.progress.stops[props.stop.id]?.fails ?? 0);
const countKind = computed(() => (props.stop.kind === 'spell' ? 'spell' : props.stop.kind === 'listen' ? 'listen' : 'copy'));

const xOf = (j: number) => 10 + j * 50;

const title = computed(() => {
	if (props.newAll) return L.resultAll(props.content.stops.length);
	if (!props.result.pass) return L.resultFail;
	return props.newPass ? L.resultLit(props.stop.n) : L.resultAgain;
});

// Each rule: ✓ met, ✗ not, or (speed on a phone) shown but not counted.
const reasons = computed(() => props.result.checks.map(c => {
	if (c.what === 'score') return { ok: c.ok, text: L.reasonCount(countKind.value, c.value, c.need) };
	if (c.what === 'acc') return { ok: c.ok, text: L.reasonAcc(c.value, c.need) };
	if (c.what === 'wpm') return c.counted ? { ok: c.ok, text: L.reasonWpm(c.value, c.need) } : { ok: null, text: L.reasonWpmPhone(c.value) };
	const r = props.result;
	return c.ok && r.kind === 'mock' ? { ok: true, text: L.reasonCovered(L.duration(r.typedMs), L.limit(r.limitS)) } : { ok: c.ok, text: L.reasonLeft(c.left) };
}));

const tiles = computed<Tile[]>(() => {
	const r = props.result;
	const time: Tile = { id: 'time', label: L.tileTime, value: L.duration(r.ms) };
	const speed: Tile = { id: 'wpm', label: L.tileSpeed, value: String(r.wpm), unit: L.wpmUnit };
	const accCheck = r.checks.find(c => c.what === 'acc');
	const acc: Tile = { id: 'acc', label: L.tileAcc, value: `${r.acc}%`, ...(accCheck ? { goal: L.goalNeed(`${accCheck.need}%`), met: accCheck.ok } : {}) };
	const count = r.checks.find(c => c.what === 'score');
	if (count?.what === 'score') {
		const right: Tile = { id: 'score', label: L.tileCount[countKind.value], value: String(count.value), unit: ` / ${r.total ?? ''}`, goal: L.goalNeed(String(count.need)), met: count.ok };
		if (r.kind === 'copy') return [right, acc, speed];
		if (r.kind === 'spell') return [right, speed, time];
		return [right, time];
	}
	if (r.kind === 'mock') return [speed, acc, { id: 'typed', label: L.tileTypedTime, value: L.duration(r.typedMs) }];
	const wpmCheck = r.checks.find(c => c.what === 'wpm');
	const wpmGoal = wpmCheck?.what === 'wpm' ? (wpmCheck.counted ? { goal: L.goalNeed(String(wpmCheck.need)), met: wpmCheck.ok } : { goal: L.goalPhoneWpm }) : {};
	return [acc, { ...speed, ...wpmGoal }, time];
});

// What comes next: the whole line once it is lit; the next stop (or again) after a pass; again (or, after three misses in
// a row, the next stop for now) after a miss; the line, always.
const actions = computed(() => {
	const out: { id: string; text: string; primary: boolean; arrow?: boolean; run: () => void }[] = [];
	const nextId = nextStopId(props.progress, ids.value);
	const nextStop = props.content.stops.find(s => s.id === nextId) ?? null;
	if (props.newAll) {
		out.push({ id: 'lightLine', text: L.lightLine, primary: true, arrow: true, run: () => emit('done') });
	} else if (props.result.pass) {
		if (nextStop != null) out.push({ id: 'next', text: L.nextStop(nextStop.name[typingLang]), primary: true, arrow: true, run: () => emit('open', nextStop.id) });
		else out.push({ id: 'seeLine', text: L.seeLine, primary: true, arrow: true, run: () => emit('done') });
		out.push({ id: 'again', text: L.again, primary: false, run: () => emit('again') });
	} else {
		out.push({ id: 'retry', text: L.retry, primary: true, run: () => emit('again') });
		const after = props.content.stops.at(props.stop.n);
		if (fails.value >= 3 && after != null) out.push({ id: 'skip', text: L.skipTo(after.n), primary: false, run: () => emit('open', after.id) });
	}
	out.push({ id: 'line', text: L.backToLine, primary: false, run: () => emit('line') });
	return out;
});

function focusHeading() {
	headingEl.value?.focus({ preventScroll: true });
}

function primary() {
	actions.value[0]?.run();
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

.head {
	text-align: center;
	padding: 24px 18px 18px;

	&.pass {
		background: linear-gradient(var(--tl-okBg), var(--MI_THEME-panel) 70%);
	}
}

.badge {
	width: 68px;
	height: 68px;
	margin: 0 auto 10px;
	border-radius: 50%;
	display: grid;
	place-items: center;
	color: var(--tl-onC);
	font-size: 34px;
	background: var(--tl-ok);
	box-shadow: 0 0 0 9px color-mix(in srgb, var(--tl-ok) 15%, transparent);
	animation: badge 0.55s cubic-bezier(0.2, 1.6, 0.4, 1) both;

	.fail & {
		background: var(--tl-c);
		box-shadow: 0 0 0 9px color-mix(in srgb, var(--tl-c) 15%, transparent);
	}
}

@keyframes badge {
	from { transform: scale(0.3); }
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
	margin: 0 0 6px;

	// focused by the page when the stop ends (tabindex -1, never reached by Tab): no ring for that
	&:focus {
		outline: none;
	}
}

.reasons {
	list-style: none;
	margin: 10px auto 0;
	padding: 0;
	display: inline-flex;
	flex-direction: column;
	gap: 6px;
	text-align: left;

	> li {
		display: flex;
		gap: 9px;
		align-items: center;
		font-size: 14.5px;
		color: var(--tl-ink);

		> i {
			flex: none;
			width: 22px;
			height: 22px;
			border-radius: 50%;
			display: grid;
			place-items: center;
			color: var(--tl-onC);
			font-style: normal;
			font-weight: 800;
			font-size: 12px;
		}
	}

	.ok > i {
		background: var(--tl-ok);
	}

	.bad > i {
		background: var(--tl-bad);
	}

	.info > i {
		background: var(--tl-weak);
	}
}

.tiles {
	margin: 16px 0 0;
}

.minil {
	display: block;
	width: 220px;
	height: 34px;
	margin: 14px auto 0;
	overflow: visible;

	circle {
		fill: var(--MI_THEME-panel);
		stroke: var(--tl-cMute);
		stroke-width: 3.5;
	}

	.p {
		fill: var(--tl-c);
		stroke: var(--tl-c);
	}

	.new {
		animation: pop 0.8s 0.35s ease-out both;
		transform-box: fill-box;
		transform-origin: center;
	}
}

.tr {
	stroke: var(--tl-cMute);
	stroke-width: 5;
	stroke-linecap: round;
}

.tf {
	stroke: var(--tl-c);
	stroke-width: 5;
	stroke-linecap: round;
}

@keyframes pop {
	0% { transform: scale(1); }
	35% { transform: scale(1.45); }
	100% { transform: scale(1); }
}

.sr {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}

.meta {
	font-size: 12.5px;
	color: var(--tl-weak);
	line-height: 1.6;
	margin: 10px 0 0;
}

.level {
	font-size: 12px;
	color: var(--tl-weak);
	margin: 12px 0 0;
}

.streak {
	margin: 0;
	background: var(--tl-goldBg);
	border-radius: 16px;
	padding: 12px 14px;
	font-size: 14px;
	line-height: 1.65;
}

.acts {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.cta {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
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

	&.ghost {
		background: var(--MI_THEME-buttonBg);
		color: var(--tl-ink);

		&:hover {
			background: var(--MI_THEME-buttonHoverBg);
		}
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.badge,
	.minil .new {
		animation: none;
	}
}

@container typing (min-width: 720px) {
	.head {
		padding: 30px 24px 22px;
	}

	.acts {
		flex-direction: row;
		flex-wrap: wrap;

		> .cta {
			flex: 1;
			min-width: 200px;
		}
	}
}
</style>
