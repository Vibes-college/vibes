<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 闯关: one gate of a route map (/gate/ielts/1.3). What it tests, then the paper with its recording (plays once),
then the mark, the answers and where to practise. Marking happens on the server; the answers never come here before. -->
<template>
<div :class="$style.root">
	<MkPageHeader :canOmitTitle="false"/>
	<div ref="bodyEl" :class="$style.body">
		<MkLoading v-if="phase === 'loading'" role="status"/>

		<div v-else-if="phase === 'missing'" :class="$style.notice" role="alert">
			<p>{{ problem }}</p>
			<MkButton rounded @click="toMap"><i class="ti ti-map-2"></i> {{ gateLabels.backToMap }}</MkButton>
		</div>

		<template v-else-if="pack && info">
			<!-- what this gate is, and the rules -->
			<section v-if="phase === 'intro' || phase === 'preparing'" :class="$style.intro">
				<p :class="$style.eyebrow"><i class="ti ti-headphones" aria-hidden="true"></i> {{ gateLabels.gate }}</p>
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
				<ul :class="$style.rules">
					<li>{{ gateLabels.ruleCount(rules.total, rules.pass) }}</li>
					<li>{{ gateLabels.ruleOnce }}</li>
					<li>{{ gateLabels.ruleReading }}</li>
					<li>{{ gateLabels.ruleQuiet }}</li>
				</ul>
				<p v-if="!info.playable" :class="$style.warn">{{ gateLabels.notOpen(info.line[gateLang]) }}</p>
				<template v-else>
					<MkButton primary rounded large :disabled="phase === 'preparing'" :class="$style.start" @click="begin">
						<i :class="phase === 'preparing' ? 'ti ti-loader-2' : 'ti ti-player-play-filled'"></i>
						{{ phase === 'preparing' ? gateLabels.preparing : gateLabels.start }}
					</MkButton>
					<p v-if="phase === 'preparing' && slow" :class="$style.note" role="status">{{ gateLabels.preparingSlow }}</p>
					<p v-if="startError" :class="$style.warn" role="alert">{{ startError }}</p>
				</template>
				<p :class="$style.legal">{{ pack.TEXT[gateLang].legal }}</p>
			</section>

			<!-- the paper -->
			<template v-else-if="(phase === 'test' || phase === 'submitting') && attempt">
				<header :class="$style.paperHead">
					<h1 :class="$style.paperTitle">{{ title }}</h1>
					<span :class="$style.paperMeta">{{ gateLabels.setMeta(attempt.set, attempt.total, attempt.pass) }}</span>
				</header>
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
				<XGroup v-for="(group, i) in attempt.groups" :key="`${attempt.attemptId}:${i}`" v-model="answers" :group="group" :disabled="phase === 'submitting'"/>
				<div :class="$style.submitBar">
					<MkButton primary rounded large :wait="phase === 'submitting'" :disabled="phase === 'submitting'" @click="handIn">
						<i class="ti ti-send"></i> {{ gateLabels.submit }}
					</MkButton>
				</div>
			</template>

			<XResult
				v-else-if="phase === 'result' && result && attempt"
				:result="result"
				:attempt="attempt"
				:pack="pack"
				:title="title"
				:lineName="info.line[gateLang]"
				:previous="info.previous"
				@again="begin"
				@back="toMap"
				@go="go"
			/>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onDeactivated, ref, shallowRef, useTemplateRef, watch } from 'vue';
import XAudio from './gate.audio.vue';
import XGroup from './gate.group.vue';
import XResult from './gate.result.vue';
import MkButton from '@/components/MkButton.vue';
import { CATALOG } from '@/lojo/route/courses/index.js';
import { coursePath } from '@/lojo/route/my-maps.js';
import { gateErrorCode, gateErrorText, startGate, submitGate } from '@/lojo/gates/api.js';
import { gateLabels, gateLang } from '@/lojo/gates/labels.js';
import { answersPayload, bandText, blankCount, DEFAULT_PASS, DEFAULT_TOTAL, findStation } from '@/lojo/gates/player.js';
import type { GateAnswers, GateAttempt, GatePack, GateResult } from '@/lojo/gates/player.js';
import { useRecording } from '@/lojo/gates/recording.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';

const props = defineProps<{ course: string; station: string }>();

type Phase = 'loading' | 'missing' | 'intro' | 'preparing' | 'test' | 'submitting' | 'result';

const router = useRouter();
const bodyEl = useTemplateRef('bodyEl');
const phase = ref<Phase>('loading');
const problem = ref('');
const pack = shallowRef<GatePack | null>(null);
const info = computed(() => (pack.value ? findStation(pack.value, props.station) : null));
// Questions and pass mark of this gate, from the map's progress; the paper itself carries the exact numbers.
const known = ref<{ total: number; pass: number } | null>(null);
const rules = computed(() => known.value ?? { total: DEFAULT_TOTAL, pass: DEFAULT_PASS });
const attempt = shallowRef<GateAttempt | null>(null);
const result = shallowRef<GateResult | null>(null);
const answers = ref<GateAnswers>({});
const startError = ref<string | null>(null);
const slow = ref(false);
const recording = useRecording();

const title = computed(() => (info.value ? gateLabels.stationTitle(info.value.line[gateLang], bandText(info.value.station.band)) : gateLabels.pageTitle));
const facts = computed(() => {
	const d = info.value?.detail;
	if (d == null) return [];
	return ([[gateLabels.part, d.part], [gateLabels.focus, d.focus], [gateLabels.types, d.types], [gateLabels.pace, d.pace]] as const)
		.filter(([, v]) => v != null)
		.map(([k, v]) => ({ k, v: v![gateLang] }));
});

function toTop() {
	bodyEl.value?.scrollIntoView({ block: 'start' });
}

async function load() {
	phase.value = 'loading';
	attempt.value = null;
	result.value = null;
	startError.value = null;
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
		known.value = here?.total != null && here.pass != null ? { total: here.total, pass: here.pass } : null;
		if (findStation(pack.value, props.station) == null) {
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
	if (!info.value?.playable || phase.value === 'preparing') return;
	// Inside the tap, before any await: iOS only lets the recording play later if the element played now.
	recording.unlock();
	startError.value = null;
	slow.value = false;
	result.value = null;
	phase.value = 'preparing';
	const slowTimer = window.setTimeout(() => { slow.value = true; }, 4000);
	try {
		const next = await startGate(props.course, props.station);
		attempt.value = next;
		answers.value = {};
		known.value = { total: next.total, pass: next.pass };
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

async function handIn() {
	const paper = attempt.value;
	if (paper == null || phase.value !== 'test') return;
	const payload = answersPayload(paper.groups, answers.value);
	const blanks = blankCount(payload);
	const playing = paper.audio != null && ['loading', 'playing', 'interrupted'].includes(recording.state.value);
	if (playing || blanks > 0) {
		const text = playing && blanks > 0 ? gateLabels.confirmBoth(blanks) : playing ? gateLabels.confirmPlaying : gateLabels.confirmBlanks(blanks);
		const { canceled } = await os.confirm({ type: 'warning', text });
		if (canceled) return;
	}
	phase.value = 'submitting';
	try {
		result.value = await submitGate(paper.attemptId, payload);
		recording.stop();
		phase.value = 'result';
		toTop();
	} catch (err) {
		// The answers stay on the page; handing in again is safe (the server returns the first mark).
		os.toast(gateErrorCode(err) === 'NO_SUCH_ATTEMPT' ? gateErrorText(err) : gateLabels.submitFailed);
		phase.value = 'test';
	}
}

function toMap() {
	router.pushByPath(`${coursePath(props.course)}#${encodeURIComponent(props.station)}`);
}

function go(station: string) {
	router.pushByPath(`/gate/${props.course}/${station}`);
}

// Moving to another station reuses this page.
watch(() => [props.course, props.station], () => {
	recording.stop();
	void load();
}, { immediate: true });

// Leaving the page stops the sound; coming back shows "继续播放" from the same place.
onDeactivated(() => recording.suspend());
onBeforeUnmount(() => recording.dispose());

definePage(() => ({ title: title.value, icon: 'ti ti-headphones' }));
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
