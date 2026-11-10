<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线 · 机考打字 (/typing): a short line before the listening line's placement test, 5 stops in about 15 minutes.
Numbers and symbols, spelling without autocorrect, typing as a recording plays, sentences, and a timed mock of the
writing screen. Each stop says how it is passed before it starts and lights up when passed; with the whole line lit,
the next step is the placement test. Content: courses/english/ielts/typing.js in the Vibes workspace; progress: the
account registry (lojo/typing/progress.ts, which the route map reads too). -->
<template>
<div ref="rootEl" :class="[$style.root, { [$style.dotted]: view.kind !== 'play' }]" :style="{ '--tl-c': content.line.color }" data-typing>
	<MkPageHeader :canOmitTitle="false"/>
	<div ref="bodyEl" :class="$style.body">
		<MkLoading v-if="progressLoad === 'idle' || progressLoad === 'loading'" role="status"/>
		<template v-else>
			<XLine
				v-if="view.kind === 'line'"
				ref="screenEl"
				:content="content"
				:progress="typingProgress"
				:device="typingDevice"
				:justLit="justLit"
				:loadFailed="progressLoad === 'failed'"
				:saveFailed="saveFailed"
				@open="openStop"
				@device="switchDevice"
				@done="showDone"
			/>
			<XIntro
				v-else-if="introView"
				ref="screenEl"
				:stop="introView.stop"
				:content="content"
				:progress="typingProgress"
				:device="typingDevice"
				@start="startShown"
				@back="toLine"
			/>
			<XCopy v-else-if="copyStop" :key="playRun" :stop="copyStop" :device="typingDevice" :goal="content.goal" @finish="onFinish" @exit="exitPlay"/>
			<XSpell v-else-if="spellStop" :key="playRun" :stop="spellStop" :device="typingDevice" @finish="onFinish" @exit="exitPlay"/>
			<XListen v-else-if="listenStop" :key="playRun" :stop="listenStop" :device="typingDevice" @finish="onFinish" @exit="exitPlay"/>
			<XMock v-else-if="mockStop" :key="playRun" :stop="mockStop" :device="typingDevice" :goal="content.goal" @finish="onFinish" @exit="exitPlay"/>
			<XResult
				v-else-if="resultView"
				ref="screenEl"
				:stop="resultView.stop"
				:result="resultView.result"
				:newPass="resultView.newPass"
				:newAll="resultView.newAll"
				:content="content"
				:progress="typingProgress"
				@again="startShown"
				@open="openStop"
				@line="toLine"
				@done="showDone"
			/>
			<XDone
				v-else-if="view.kind === 'done'"
				ref="screenEl"
				:content="content"
				:progress="typingProgress"
				@line="toLine"
			/>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, ref, useTemplateRef } from 'vue';
import XLine from './typing.line.vue';
import XIntro from './typing.intro.vue';
import XCopy from './typing.copy.vue';
import XSpell from './typing.spell.vue';
import XListen from './typing.listen.vue';
import XMock from './typing.mock.vue';
import XResult from './typing.result.vue';
import XDone from './typing.done.vue';
import type { Device, Stop } from '@/lojo/typing/content.js';
import type { StopTry } from '@/lojo/typing/score.js';
import { typingContent } from '@/lojo/typing/content.js';
import { recordTry } from '@/lojo/typing/record.js';
import { progressLoad, saveFailed, saveTypingProgress, syncTypingProgress, typingProgress } from '@/lojo/typing/progress.js';
import { setTypingDevice, typingDevice } from '@/lojo/typing/device.js';
import { stopClip, unlockTypingAudio } from '@/lojo/typing/audio.js';
import { keysForUs, useWindowKeys } from '@/lojo/typing/screen.js';
import { typingLabels, typingLang } from '@/lojo/typing/labels.js';
import { loadEnglishStatus } from '@/lojo/english/api.js';
import * as os from '@/os.js';
import { definePage } from '@/page.js';
import { reportQuestSet } from '@/lojo/quest-refill.js';

type View =
	| { kind: 'line' }
	| { kind: 'intro'; stop: Stop }
	| { kind: 'play'; stop: Stop }
	| { kind: 'result'; stop: Stop; result: StopTry; newPass: boolean; newAll: boolean }
	| { kind: 'done' };
// What each screen offers the page: its heading takes the focus when it comes up; Enter does its main action.
type Screen = { focusHeading?: () => void; primary?: () => void };

const content = typingContent;
const ids = content.stops.map(s => s.id);
const rootEl = useTemplateRef('rootEl');
const bodyEl = useTemplateRef('bodyEl');
const screenEl = useTemplateRef<Screen>('screenEl');
const view = ref<View>({ kind: 'line' });
// a new run of a stop each time it is started (its component starts from scratch)
const playRun = ref(0);
// the stop that lit up just now: its part of the line fills in when the line shows next
const justLit = ref<string | null>(null);

const introView = computed(() => (view.value.kind === 'intro' ? view.value : null));
const resultView = computed(() => (view.value.kind === 'result' ? view.value : null));
const playing = computed(() => (view.value.kind === 'play' ? view.value.stop : null));
const copyStop = computed(() => (playing.value?.kind === 'copy' ? playing.value : null));
const spellStop = computed(() => (playing.value?.kind === 'spell' ? playing.value : null));
const listenStop = computed(() => (playing.value?.kind === 'listen' ? playing.value : null));
const mockStop = computed(() => (playing.value?.kind === 'mock' ? playing.value : null));

const lineTitle = typingLabels.lineName(content.line.n, content.line.name[typingLang]);

function toTop() {
	bodyEl.value?.scrollIntoView({ block: 'start' });
}

// A new screen: to its top, with the focus on its heading rather than lost on the page.
async function show(next: View) {
	// the stop just lit has had its moment on the line
	if (view.value.kind === 'line' && next.kind !== 'line') justLit.value = null;
	view.value = next;
	toTop();
	if (next.kind === 'play') return;
	await nextTick();
	screenEl.value?.focusHeading?.();
}

function toLine() {
	stopClip();
	void show({ kind: 'line' });
}

function openStop(id: string) {
	const stop = content.stops.find(s => s.id === id);
	if (stop != null) void show({ kind: 'intro', stop });
}

function showDone() {
	void show({ kind: 'done' });
}

// Started by a tap or Enter: that also lets the recordings play later (iOS).
function start(stop: Stop) {
	if (stop.kind === 'listen' || stop.kind === 'spell') unlockTypingAudio();
	playRun.value++;
	void show({ kind: 'play', stop });
}

// The stop of the intro or result on screen, again.
function startShown() {
	const v = view.value;
	if (v.kind === 'intro' || v.kind === 'result') start(v.stop);
}

// Left half way: back to its intro, and the try isn't counted.
function exitPlay() {
	const stop = playing.value;
	stopClip();
	if (stop != null) void show({ kind: 'intro', stop });
}

function onFinish(result: StopTry) {
	const stop = playing.value;
	if (stop == null || stop.id !== result.stop) return;
	stopClip();
	const { newPass, newAll } = recordTry(typingProgress.value, ids, {
		stop: result.stop, pass: result.pass, ms: result.ms, device: result.device,
		best: { pass: result.pass, score: result.score, total: result.total, acc: result.acc, wpm: result.wpm },
	});
	if (newPass) justLit.value = result.stop;
	// 闯关 · 装备补心: a long-sentence stop (each counts 2) and the mock (a whole passage) count as a set of 10.
	const now = Date.now();
	reportQuestSet('typing', `stop:${stop.id}`, stop.kind === 'mock' ? 10 : stop.kind === 'listen' ? stop.rows.length : stop.kind === 'copy' && stop.need == null ? stop.items.length * 2 : stop.items.length, now - result.ms, now);
	void saveTypingProgress().catch(() => { /* said on the line; the next save takes it along */ });
	void show({ kind: 'result', stop, result, newPass, newAll });
}

function switchDevice(next: Device) {
	setTypingDevice(next);
	os.toast(typingLabels.deviceSwitched[next]);
}

// Enter starts a stop from its intro and does a result's main action; Esc leaves a stop. Not while a button, a link or
// a box has the focus: they take their own keys.
function onKeydown(ev: KeyboardEvent) {
	if (ev.defaultPrevented || ev.repeat || ev.isComposing || ev.keyCode === 229 || ev.metaKey || ev.ctrlKey || ev.altKey) return;
	if (!keysForUs(ev, rootEl.value)) return;
	if (ev.key === 'Escape' && view.value.kind === 'play') {
		ev.preventDefault();
		exitPlay();
		return;
	}
	if (ev.key !== 'Enter') return;
	const target = ev.target instanceof Element ? ev.target : null;
	if (target?.closest('button, a, summary, input, textarea, select') != null) return;
	if (view.value.kind === 'intro') {
		ev.preventDefault();
		startShown();
	} else if (view.value.kind === 'result' || view.value.kind === 'done') {
		ev.preventDefault();
		screenEl.value?.primary?.();
	}
}

useWindowKeys(onKeydown);

// The account's copy, and whether recordings can be made (stop 3).
void syncTypingProgress();
void loadEnglishStatus();

// The line shows what another device did meanwhile; a stop under way is left as it was. (The first activation is the
// page opening: read above already.)
let opened = false;
onActivated(() => {
	if (opened && view.value.kind !== 'play') void syncTypingProgress();
	opened = true;
});

// Pages are kept alive after they are left: nothing plays on in the background.
onDeactivated(() => {
	if (view.value.kind !== 'play') stopClip();
});

onBeforeUnmount(() => {
	stopClip();
});

definePage(() => ({ title: lineTitle, icon: 'ti ti-keyboard', needWideArea: true }));
</script>

<style lang="scss" module>
.root {
	// the line's colour (route.css --l7), set from the course file
	--tl-c: #B4457E;
	--tl-cBg: color-mix(in srgb, var(--tl-c) 9%, var(--MI_THEME-panel));
	--tl-cMute: color-mix(in srgb, var(--tl-c) 26%, var(--MI_THEME-divider));
	--tl-ok: color-mix(in srgb, #2F7D5B 82%, var(--MI_THEME-fg));
	--tl-okBg: color-mix(in srgb, #2F7D5B 15%, var(--MI_THEME-panel));
	--tl-bad: var(--MI_THEME-error);
	--tl-badBg: color-mix(in srgb, var(--MI_THEME-error) 13%, var(--MI_THEME-panel));
	--tl-mustard: #F2C14E;
	--tl-goldBg: color-mix(in srgb, #F2C14E 22%, var(--MI_THEME-panel));
	--tl-gold: color-mix(in srgb, #B8871B 72%, var(--MI_THEME-fg));
	--tl-ink: var(--MI_THEME-fgHighlighted);
	--tl-hi: color-mix(in srgb, var(--MI_THEME-fg) 6%, var(--MI_THEME-panel));
	--tl-weak: color-mix(in srgb, var(--MI_THEME-fg) 72%, transparent);
	--tl-todo: color-mix(in srgb, var(--MI_THEME-fgHighlighted) 30%, var(--MI_THEME-panel));
	--tl-line: var(--MI_THEME-divider);
	--tl-onC: var(--MI_THEME-fgOnAccent);
	--tl-shadow: 0 1px 2px color-mix(in srgb, var(--MI_THEME-fgHighlighted) 6%, transparent), 0 10px 28px -10px color-mix(in srgb, var(--MI_THEME-fgHighlighted) 25%, transparent);
	--tl-serif: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", STSong, serif;
	--tl-mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", "Roboto Mono", monospace;
	min-height: 100%;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);

	&.dotted {
		background-image: radial-gradient(circle, color-mix(in srgb, var(--MI_THEME-fg) 11%, transparent) 1.5px, transparent 1.8px);
		background-size: 36px 36px;
	}
}

.body {
	container: typing / inline-size;
	max-width: 1040px;
	margin: 0 auto;
	padding: 12px 14px 48px;
	box-sizing: border-box;
}

@media (min-width: 720px) {
	.body {
		padding: 18px 24px 56px;
	}
}
</style>
