<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 闯关: one gate of a route map (/gate/ielts/1.3). What it tests, then the paper: a recording that plays once
(listening), a passage against the clock (reading), or both, listening first. Then the mark, the answers and where to
practise. Marking happens on the server; the answers never come here before. -->
<template>
<div :class="$style.root">
	<MkPageHeader :canOmitTitle="false"/>
	<div ref="bodyEl" :class="[$style.body, { [$style.wide]: section === 'reading' && (phase === 'test' || phase === 'submitting') }]">
		<MkLoading v-if="phase === 'loading'" role="status"/>

		<div v-else-if="phase === 'missing'" :class="$style.notice" role="alert">
			<p>{{ problem }}</p>
			<MkButton rounded @click="toMap"><i class="ti ti-map-2"></i> {{ gateLabels.backToMap }}</MkButton>
		</div>

		<template v-else-if="pack && line">
			<!-- a placement test: what it is, and its rules -->
			<section v-if="placement != null && (phase === 'intro' || phase === 'preparing')" :class="$style.intro">
				<p :class="$style.eyebrow"><i class="ti ti-compass" aria-hidden="true"></i> {{ gateLabels.gate }}</p>
				<h1 :class="$style.title">{{ title }}</h1>
				<span :class="$style.level">{{ gateLabels.practiceLevel }}</span>
				<p :class="$style.note">{{ gateLabels.placementLede }}</p>
				<h2 :class="$style.h2">{{ gateLabels.rulesTitle }}</h2>
				<ul :class="$style.rules">
					<li>{{ gateLabels.ruleTwoParts }}</li>
					<li>{{ gateLabels.ruleAdaptive }}</li>
					<li>{{ gateLabels.ruleReading }}</li>
					<li>{{ gateLabels.rulePlaced }}</li>
					<li>{{ gateLabels.ruleQuiet }}</li>
				</ul>
				<MkButton primary rounded large :disabled="phase === 'preparing'" :class="$style.start" @click="begin">
					<i :class="phase === 'preparing' ? 'ti ti-loader-2' : 'ti ti-player-play-filled'"></i>
					{{ phase === 'preparing' ? gateLabels.preparing : gateLabels.start }}
				</MkButton>
				<p v-if="phase === 'preparing' && slow" :class="$style.note" role="status">{{ gateLabels.preparingSlow }}</p>
				<p v-if="startError" :class="$style.warn" role="alert">{{ startError }}</p>
				<p :class="$style.legal">{{ pack.TEXT[gateLang].legal }}</p>
			</section>

			<!-- between the two parts of a placement test -->
			<section v-else-if="earlier && (phase === 'between' || phase === 'preparingSecond')" :class="$style.intro">
				<p :class="$style.eyebrow"><i class="ti ti-compass" aria-hidden="true"></i> {{ title }}</p>
				<h1 :class="$style.title">{{ gateLabels.betweenTitle }}</h1>
				<p :class="$style.betweenScore">{{ gateLabels.betweenScore(earlier.result.score, earlier.result.total) }}</p>
				<p :class="$style.sub">{{ earlier.result.placement?.next === 'high' ? gateLabels.betweenHarder : gateLabels.betweenEasier }}</p>
				<MkButton primary rounded large :disabled="phase === 'preparingSecond'" :class="$style.start" @click="beginSecond">
					<i :class="phase === 'preparingSecond' ? 'ti ti-loader-2' : 'ti ti-player-play-filled'"></i>
					{{ phase === 'preparingSecond' ? gateLabels.preparing : gateLabels.startSecond }}
				</MkButton>
				<p v-if="phase === 'preparingSecond' && slow" :class="$style.note" role="status">{{ gateLabels.preparingSlow }}</p>
				<p v-if="startError" :class="$style.warn" role="alert">{{ startError }}</p>
			</section>

			<!-- what this gate is, and the rules -->
			<section v-else-if="info && (phase === 'intro' || phase === 'preparing')" :class="$style.intro">
				<p :class="$style.eyebrow"><i :class="readingGate ? 'ti ti-book' : 'ti ti-headphones'" aria-hidden="true"></i> {{ gateLabels.gate }}</p>
				<h1 :class="$style.title">{{ title }}</h1>
				<span :class="$style.level">{{ gateLabels.practiceLevel }}</span>
				<p v-if="info.interchange" :class="$style.ix">
					<b>{{ gateLabels.interchange(info.interchange[gateLang]) }}</b>
					{{ gateLang === 'zh' ? info.interchange.dzh : info.interchange.den }}
				</p>
				<p v-if="info.playable && info.closedLines.length > 0" :class="$style.note">
					{{ gateLabels.interchangeOnly(info.detailLine[gateLang], info.closedLines.map(l => l[gateLang]).join(gateLang === 'zh' ? '、' : ', ')) }}
				</p>
				<dl v-if="facts.length > 0" :class="$style.facts">
					<template v-for="row in facts" :key="row.k">
						<dt>{{ row.k }}</dt>
						<dd>{{ row.v }}</dd>
					</template>
				</dl>
				<h2 :class="$style.h2">{{ gateLabels.rulesTitle }}</h2>
				<ul v-if="readingGate" :class="$style.rules">
					<li>{{ gateLabels.ruleCount(rules.total, rules.pass) }}</li>
					<li>{{ gateLabels.ruleTime(rules.time!) }}</li>
					<li>{{ gateLabels.ruleTimeUp }}</li>
				</ul>
				<ul v-else :class="$style.rules">
					<li>{{ gateLabels.ruleCount(rules.total, rules.pass) }}</li>
					<li>{{ gateLabels.ruleOnce }}</li>
					<li>{{ gateLabels.ruleReading }}</li>
					<li>{{ gateLabels.ruleQuiet }}</li>
				</ul>
				<p v-if="!playable" :class="$style.warn">{{ info.line.live ? gateLabels.notReady : gateLabels.notOpen(info.line[gateLang]) }}</p>
				<template v-else>
					<MkButton primary rounded large :disabled="phase === 'preparing'" :class="$style.start" @click="begin">
						<i :class="phase === 'preparing' ? 'ti ti-loader-2' : 'ti ti-player-play-filled'"></i>
						{{ phase === 'preparing' ? (readingGate ? gateLabels.preparingPaper : gateLabels.preparing) : gateLabels.start }}
					</MkButton>
					<p v-if="phase === 'preparing' && slow && !readingGate" :class="$style.note" role="status">{{ gateLabels.preparingSlow }}</p>
					<p v-if="startError" :class="$style.warn" role="alert">{{ startError }}</p>
				</template>
				<p :class="$style.legal">{{ pack.TEXT[gateLang].legal }}</p>
			</section>

			<!-- the paper -->
			<template v-else-if="(phase === 'test' || phase === 'submitting') && attempt">
				<header :class="$style.paperHead">
					<h1 :class="$style.paperTitle">{{ title }}</h1>
					<span :class="$style.paperMeta">{{ placement != null ? (earlier ? gateLabels.partSecond : gateLabels.partFirst) : gateLabels.setMeta(attempt.set, attempt.total, attempt.pass) }}</span>
				</header>
				<!-- listening: the recording and its questions (in a half-and-half set, then on to reading) -->
				<template v-if="section === 'listening'">
					<XAudio
						v-if="attempt.audio"
						:state="recording.state.value"
						:position="recording.position.value"
						:total="recording.duration.value"
						:buffering="recording.buffering.value"
						:blocked="recording.blocked.value"
						:pauses="attempt.audio.pauses"
						@resume="recording.resume()"
						@retry="recording.retry()"
					/>
					<XGroup v-for="(group, i) in parts.listening" :key="`${attempt.attemptId}:l${i}`" v-model="answers" :group="group" :disabled="phase === 'submitting'"/>
					<div :class="$style.submitBar">
						<MkButton v-if="parts.reading.length > 0" primary rounded large @click="toReading">
							<i class="ti ti-arrow-right"></i> {{ gateLabels.toReading }}
						</MkButton>
						<MkButton v-else primary rounded large :wait="phase === 'submitting'" :disabled="phase === 'submitting'" @click="handIn()">
							<i class="ti ti-send"></i> {{ gateLabels.submit }}
						</MkButton>
					</div>
				</template>

				<!-- reading: the clock, then the passage and its questions, side by side or one at a time on a phone -->
				<template v-else>
					<XTimer v-model:view="view" :left="left ?? 0" :total="(attempt.time ?? 0) * 60" :done="answered.done" :count="answered.count"/>
					<div :class="$style.reading">
						<div v-if="attempt.passage" :class="[$style.pane, $style.passagePane, { [$style.offNarrow]: view !== 'passage' }]">
							<XPassage :passage="attempt.passage"/>
							<MkButton rounded :class="$style.onlyNarrow" @click="view = 'questions'">
								<i class="ti ti-list-check"></i> {{ gateLabels.toQuestions }}
							</MkButton>
						</div>
						<div :class="[$style.pane, { [$style.offNarrow]: view !== 'questions' }]">
							<XGroup v-for="(group, i) in parts.reading" :key="`${attempt.attemptId}:r${i}`" v-model="answers" :group="group" :disabled="phase === 'submitting'"/>
							<div :class="$style.submitBar">
								<MkButton primary rounded large :wait="phase === 'submitting'" :disabled="phase === 'submitting'" @click="handIn()">
									<i class="ti ti-send"></i> {{ gateLabels.submit }}
								</MkButton>
							</div>
						</div>
					</div>
				</template>
			</template>

			<XResult
				v-else-if="phase === 'result' && result && attempt"
				:result="result"
				:attempt="attempt"
				:pack="pack"
				:title="title"
				:lineName="line[gateLang]"
				:previous="info?.previous ?? null"
				:earlier="earlier"
				@again="begin"
				@back="toMap"
				@go="go"
			/>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onDeactivated, ref, shallowRef, useTemplateRef, watch } from 'vue';
import XAudio from './gate.audio.vue';
import XGroup from './gate.group.vue';
import XPassage from './gate.passage.vue';
import XResult from './gate.result.vue';
import XTimer from './gate.timer.vue';
import { getScrollPosition, scrollInContainer } from '@@/js/scroll.js';
import MkButton from '@/components/MkButton.vue';
import { CATALOG } from '@/lojo/route/courses/index.js';
import { coursePath } from '@/lojo/route/my-maps.js';
import { gateErrorCode, gateErrorText, startGate, startPlacement, submitGate } from '@/lojo/gates/api.js';
import { gateLabels, gateLang } from '@/lojo/gates/labels.js';
import { answersPayload, bandText, blankCount, DEFAULT_PASS, DEFAULT_TOTAL, findStation, paperParts, placementLine, secondsLeft } from '@/lojo/gates/player.js';
import type { GateAnswers, GateAttempt, GatePack, GateResult } from '@/lojo/gates/player.js';
import { useRecording } from '@/lojo/gates/recording.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';

const props = defineProps<{ course: string; station: string }>();

// A placement test hands in two papers: after the first comes 'between', then the second.
type Phase = 'loading' | 'missing' | 'intro' | 'preparing' | 'between' | 'preparingSecond' | 'test' | 'submitting' | 'result';

const router = useRouter();
const bodyEl = useTemplateRef('bodyEl');
const phase = ref<Phase>('loading');
const problem = ref('');
const pack = shallowRef<GatePack | null>(null);
// /gate/ielts/placement-1 is line 1's placement test; any other station is one gate.
const placement = computed(() => placementLine(props.station));
const info = computed(() => (pack.value && placement.value == null ? findStation(pack.value, props.station) : null));
const line = computed(() => (placement.value != null ? pack.value?.LINES.find(l => l.n === placement.value) : info.value?.line) ?? null);
// A placement test's first part, once handed in: the second part follows, and the result reviews both.
const earlier = shallowRef<{ result: GateResult; attempt: GateAttempt } | null>(null);
// Questions, pass mark and (reading) minutes of this gate, from the map's progress; the paper carries the exact numbers.
const known = ref<{ total: number; pass: number; time: number | null } | null>(null);
const rules = computed(() => known.value ?? { total: DEFAULT_TOTAL, pass: DEFAULT_PASS, time: null });
const readingGate = computed(() => rules.value.time != null);
// Whether the server has questions for this stop on its line; null when the progress didn't load (the pack decides).
const serverOpen = ref<boolean | null>(null);
const playable = computed(() => serverOpen.value ?? info.value?.playable ?? false);
const attempt = shallowRef<GateAttempt | null>(null);
const result = shallowRef<GateResult | null>(null);
const answers = ref<GateAnswers>({});
const startError = ref<string | null>(null);
const slow = ref(false);
const recording = useRecording();

// The paper's two parts: listening groups with the recording, reading groups with the passage and the clock.
const parts = computed(() => paperParts(attempt.value?.groups ?? []));
const section = ref<'listening' | 'reading'>('listening');
// When the reading time is up (ms); the clock can't be paused and keeps going while the learner is elsewhere.
const deadline = ref<number | null>(null);
const now = ref(Date.now());
const left = computed(() => (deadline.value != null ? secondsLeft(deadline.value, now.value) : null));
let ticker: number | null = null;
let timeUpHandedIn = false;
// On a narrow screen, the passage or the questions; each keeps its own scroll position.
const view = ref<'passage' | 'questions'>('passage');
const scrolledTo: Record<'passage' | 'questions', number> = { passage: 0, questions: 0 };
const answered = computed(() => {
	const payload = answersPayload(parts.value.reading, answers.value);
	return { done: payload.length - blankCount(payload), count: payload.length };
});

const title = computed(() => {
	if (placement.value != null) return line.value ? gateLabels.placementTitle(line.value[gateLang]) : gateLabels.pageTitle;
	return info.value ? gateLabels.stationTitle(info.value.line[gateLang], bandText(info.value.station.band)) : gateLabels.pageTitle;
});
const facts = computed(() => {
	const d = info.value?.detail;
	if (d == null) return [];
	return ([[gateLabels.part, d.part], [gateLabels.focus, d.focus], [gateLabels.types, d.types], [gateLabels.pace, d.pace], [gateLabels.length, d.length]] as const)
		.filter(([, v]) => v != null)
		.map(([k, v]) => ({ k, v: v![gateLang] }));
});

function toTop() {
	bodyEl.value?.scrollIntoView({ block: 'start' });
}

function stopClock() {
	if (ticker != null) window.clearInterval(ticker);
	ticker = null;
	deadline.value = null;
}

function tick() {
	now.value = Date.now();
	if (left.value === 0 && phase.value === 'test' && !timeUpHandedIn) {
		timeUpHandedIn = true;
		void handIn(true);
	}
}

// The passage appears and the clock starts.
function startReading(minutes: number) {
	stopClock();
	section.value = 'reading';
	view.value = 'passage';
	scrolledTo.passage = 0;
	scrolledTo.questions = 0;
	timeUpHandedIn = false;
	deadline.value = Date.now() + minutes * 60 * 1000;
	now.value = Date.now();
	ticker = window.setInterval(tick, 500);
}

// A new paper: reading straight away, or the recording first.
function setUp(paper: GateAttempt) {
	attempt.value = paper;
	answers.value = {};
	const { listening } = paperParts(paper.groups);
	if (listening.length === 0 && paper.passage != null) startReading(paper.time ?? 20);
	else {
		stopClock();
		section.value = 'listening';
	}
}

// A half-and-half set: once the listening part is done, on to the passage. The recording can't be heard again.
async function toReading() {
	const paper = attempt.value;
	if (paper == null || phase.value !== 'test') return;
	if (['loading', 'playing', 'interrupted'].includes(recording.state.value)) {
		const { canceled } = await os.confirm({ type: 'warning', text: gateLabels.confirmToReading });
		if (canceled || attempt.value !== paper) return;
	}
	recording.stop();
	startReading(paper.time ?? 20);
	toTop();
}

watch(view, (next, previous) => {
	if (bodyEl.value == null) return;
	scrolledTo[previous] = getScrollPosition(bodyEl.value);
	void nextTick(() => { if (bodyEl.value) scrollInContainer(bodyEl.value, { top: scrolledTo[next] }); });
});

async function load() {
	phase.value = 'loading';
	attempt.value = null;
	result.value = null;
	earlier.value = null;
	startError.value = null;
	serverOpen.value = null;
	stopClock();
	section.value = 'listening';
	const entry = CATALOG.find(c => c.id === props.course);
	const loader = entry && entry.ready && 'load' in entry ? entry.load : null;
	if (loader == null) {
		problem.value = gateLabels.noStation;
		phase.value = 'missing';
		return;
	}
	try {
		const [loaded, progress] = await Promise.all([
			loader(),
			misskeyApi('lojo/gates/progress', { course: props.course }).catch(() => null),
		]);
		pack.value = loaded as unknown as GatePack;
		const here = progress?.stations.find(s => s.id === props.station);
		known.value = here?.total != null && here.pass != null ? { total: here.total, pass: here.pass, time: here.time } : null;
		serverOpen.value = here ? here.state !== 'soon' : null;
		// A placement test needs its line open and a placement paper on the server.
		const exists = placement.value != null
			? progress?.lines.find(l => l.line === placement.value)?.placement.available ?? pack.value.LINES.some(l => l.n === placement.value && l.live)
			: findStation(pack.value, props.station) != null;
		if (!exists) {
			problem.value = gateLabels.noStation;
			phase.value = 'missing';
			return;
		}
		phase.value = 'intro';
	} catch {
		problem.value = gateLabels.loadFailed;
		phase.value = 'missing';
	}
}

// Also "再闯一次": the server hands out a set not heard yet (or the one heard longest ago).
async function begin() {
	if ((placement.value == null && !playable.value) || phase.value === 'preparing') return;
	// Inside the tap, before any await: iOS only lets the recording play later if the element played now.
	recording.unlock();
	startError.value = null;
	slow.value = false;
	result.value = null;
	earlier.value = null;
	phase.value = 'preparing';
	const slowTimer = window.setTimeout(() => { slow.value = true; }, 4000);
	try {
		const next = placement.value != null ? await startPlacement(props.course, placement.value) : await startGate(props.course, props.station);
		setUp(next);
		known.value = { total: next.total, pass: next.pass, time: next.time };
		phase.value = 'test';
		toTop();
		if (next.audio) recording.play(next.audio.url, next.audio.duration);
	} catch (err) {
		recording.stop();
		startError.value = gateErrorText(err);
		phase.value = 'intro';
	} finally {
		window.clearTimeout(slowTimer);
	}
}

// A placement test's second part: the server picks the harder or easier paper from the first part's mark.
async function beginSecond() {
	const first = earlier.value;
	if (first == null || placement.value == null || phase.value !== 'between') return;
	recording.unlock();
	startError.value = null;
	slow.value = false;
	phase.value = 'preparingSecond';
	const slowTimer = window.setTimeout(() => { slow.value = true; }, 4000);
	try {
		const next = await startPlacement(props.course, placement.value, first.attempt.attemptId);
		setUp(next);
		phase.value = 'test';
		toTop();
		if (next.audio) recording.play(next.audio.url, next.audio.duration);
	} catch (err) {
		recording.stop();
		startError.value = gateErrorText(err);
		phase.value = 'between';
	} finally {
		window.clearTimeout(slowTimer);
	}
}

// timeUp: the reading clock ran out, so it hands in without asking.
async function handIn(timeUp = false) {
	const paper = attempt.value;
	if (paper == null || phase.value !== 'test') return;
	const blanks = blankCount(answersPayload(paper.groups, answers.value));
	const playing = section.value === 'listening' && paper.audio != null && ['loading', 'playing', 'interrupted'].includes(recording.state.value);
	if (!timeUp && (playing || blanks > 0)) {
		const text = playing && blanks > 0 ? gateLabels.confirmBoth(blanks) : playing ? gateLabels.confirmPlaying : gateLabels.confirmBlanks(blanks);
		const { canceled } = await os.confirm({ type: 'warning', text });
		// the clock may have handed it in while the question was open
		if (canceled || phase.value !== 'test' || attempt.value !== paper) return;
	}
	phase.value = 'submitting';
	try {
		const marked = await submitGate(paper.attemptId, answersPayload(paper.groups, answers.value));
		recording.stop();
		stopClock();
		if (timeUp) os.toast(gateLabels.timeUp);
		toTop();
		if (marked.placement?.stage === 'first') {
			earlier.value = { result: marked, attempt: paper };
			phase.value = 'between';
			return;
		}
		result.value = marked;
		phase.value = 'result';
	} catch (err) {
		// The answers stay on the page; handing in again is safe (the server returns the first mark).
		os.toast(gateErrorCode(err) === 'NO_SUCH_ATTEMPT' ? gateErrorText(err) : gateLabels.submitFailed);
		phase.value = 'test';
	}
}

// Back to the map at this station; after a placement test, at the station it put the learner at.
function toMap() {
	const at = placement.value != null ? result.value?.placement?.placedAt ?? null : props.station;
	router.pushByPath(at ? `${coursePath(props.course)}#${encodeURIComponent(at)}` : coursePath(props.course));
}

function go(station: string) {
	router.pushByPath(`/gate/${props.course}/${station}`);
}

// Moving to another station reuses this page.
watch(() => [props.course, props.station], () => {
	recording.stop();
	void load();
}, { immediate: true });

// Leaving the page stops the sound; coming back shows "继续播放" from the same place. The reading clock keeps going.
onDeactivated(() => recording.suspend());
onBeforeUnmount(() => {
	recording.dispose();
	stopClock();
});

definePage(() => ({ title: title.value, icon: placement.value != null ? 'ti ti-compass' : readingGate.value ? 'ti ti-book' : 'ti ti-headphones' }));
</script>

<style lang="scss" module>
.root {
	min-height: 100%;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
}

.body {
	max-width: 720px;
	margin: 0 auto;
	padding: 16px 16px 64px;
	display: flex;
	flex-direction: column;
	gap: 14px;
	scroll-margin-top: 64px;
	// the reading paper lays the passage and the questions side by side when there is room
	container-type: inline-size;

	&.wide {
		max-width: 1240px;
	}
}

.reading {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.pane {
	display: flex;
	flex-direction: column;
	gap: 14px;
	min-width: 0;
}

// On a narrow screen only one of the two shows, switched in the clock's bar.
.offNarrow {
	display: none;
}

@container (min-width: 760px) {
	.reading {
		display: grid;
		grid-template-columns: minmax(0, 11fr) minmax(0, 10fr);
		align-items: start;
	}

	.offNarrow {
		display: flex;
	}

	// the passage stays in view while the questions scroll
	.passagePane {
		position: sticky;
		top: calc(var(--MI-stickyTop, 0px) + 64px);
		max-height: calc(100dvh - var(--MI-stickyTop, 0px) - 88px);
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.onlyNarrow {
		display: none;
	}
}

.onlyNarrow {
	align-self: center;
}

.notice {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 32px 16px;
	text-align: center;

	p {
		margin: 0;
	}
}

.intro {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 10px;
	padding: 20px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
}

.eyebrow {
	margin: 0;
	font-size: 0.85em;
	font-weight: bold;
	color: var(--MI_THEME-accent);
}

.title {
	margin: 0;
	font-size: 1.6em;
}

.level {
	padding: 2px 10px;
	border-radius: 999px;
	font-size: 0.8em;
	background: var(--MI_THEME-panelHighlight);
}

.ix {
	margin: 0;
	padding: 10px 12px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-accentedBg);

	b {
		margin-right: 6px;
	}
}

.facts {
	display: grid;
	grid-template-columns: max-content 1fr;
	gap: 6px 14px;
	margin: 4px 0 0;
	width: 100%;

	dt {
		font-size: 0.85em;
		opacity: 0.65;
	}

	dd {
		margin: 0;
	}
}

.h2 {
	margin: 8px 0 0;
	font-size: 1em;
}

.rules {
	margin: 0;
	padding-left: 1.2em;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.start {
	margin-top: 8px;
}

.note {
	margin: 0;
	font-size: 0.85em;
	opacity: 0.8;
}

.warn {
	margin: 0;
	color: var(--MI_THEME-warn);
	font-weight: bold;
}

.betweenScore {
	margin: 0;
	font-size: 1.4em;
	font-weight: bold;
	font-variant-numeric: tabular-nums;
}

.sub {
	margin: 0;
}

.legal {
	margin: 8px 0 0;
	font-size: 0.75em;
	opacity: 0.6;
}

.paperHead {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 4px 12px;
}

.paperTitle {
	margin: 0;
	font-size: 1.3em;
}

.paperMeta {
	font-size: 0.85em;
	opacity: 0.75;
}

// After the last question, like the end of a paper: a floating button would cover the answer buttons on a phone,
// and the recording bar already holds the top of the screen.
.submitBar {
	display: flex;
	justify-content: center;
	padding-top: 8px;
}
</style>
