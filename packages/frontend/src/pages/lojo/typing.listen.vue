<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线, stop 3: type as you listen. The notes have a gap for each sentence of the recording; it doesn't stop. A
moment to look at the notes, then each sentence plays and leaves a few seconds; when the next one starts, the gap before
it locks. Every recording is downloaded before it starts; where they can't be made, captions stand in for them. The
answers are marked as the gates mark gaps (case, spaces and a printed £ don't matter; misspelt is wrong). -->
<template>
<div ref="rootEl" :class="$style.root" :data-play="stop.id" :data-phase="phase">
	<XBar :stop="stop" :rule="rule" @exit="leave"/>
	<div :class="$style.nowbar">
		<div :class="$style.nbHead">
			<span :class="[$style.live, { [$style.liveOn]: playingNow }]"><i aria-hidden="true"></i><span>{{ liveText }}</span></span>
			<span :class="$style.left">{{ countText }}</span>
		</div>
		<div :class="$style.track" aria-hidden="true"><b :style="{ transform: `scaleX(${barScale})` }"></b></div>
		<label :for="inputId" :class="$style.q">
			<span :class="$style.qn">{{ Math.max(k, 0) + 1 }}</span>
			<span lang="en">{{ question }}</span>
		</label>
		<input
			:id="inputId"
			ref="inputEl"
			:class="$style.gin"
			type="text"
			inputmode="text"
			autocomplete="off"
			autocapitalize="off"
			autocorrect="off"
			spellcheck="false"
			enterkeyhint="done"
			lang="en"
			maxlength="40"
			@input="onInput"
			@keydown="onKeydown"
			@compositionstart="onCompositionStart"
			@compositionend="onCompositionEnd"
		>
		<p v-if="filled" :class="$style.filled" role="status">✓ {{ L.filled }}</p>
		<p v-if="caption" :class="$style.cap"><span>{{ L.caption }}</span><b lang="en">{{ caption }}</b></p>
		<p v-if="notice" :class="$style.notice" role="status">{{ notice }}</p>
		<p v-if="ime" :class="$style.ime" role="status">{{ L.ime }}</p>
	</div>
	<section :class="$style.notes" :aria-label="L.notesLabel">
		<p :class="$style.nh" lang="en">{{ stop.title }}</p>
		<p :class="$style.ni"><b lang="en">{{ stop.instructions.en }}</b> {{ stop.instructions.zh }}</p>
		<ol :class="$style.rows">
			<li
				v-for="(r, j) in stop.rows"
				:key="j"
				:class="j < k ? $style.done : j === k ? $style.now : $style.todo"
				:data-row="j"
				:data-now="j === k ? '' : undefined"
			>
				<span :class="$style.qn">{{ j + 1 }}</span>
				<span lang="en">{{ r.note }} <span :class="$style.gapv">{{ j <= k ? answers[j] : '' }}</span><template v-if="r.after"> {{ r.after }}</template></span>
			</li>
		</ol>
	</section>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, useTemplateRef } from 'vue';
import XBar from './typing.bar.vue';
import type { Device, ListenStop } from '@/lojo/typing/content.js';
import type { ListenTry } from '@/lojo/typing/score.js';
import type { DictLimit } from '@/lojo/dictation/mark.js';
import { accuracyOf, cleanTyped, judgeCount } from '@/lojo/typing/score.js';
import { keysForUs, sayFullWidthOnce, setBoxValue, useStopClock, useWindowKeys, wantsBox } from '@/lojo/typing/screen.js';
import { touchScreen } from '@/lojo/typing/device.js';
import { loadClips, pauseClip, playClip, resumeClip, stopClip } from '@/lojo/typing/audio.js';
import { typingLabels as L, ruleText } from '@/lojo/typing/labels.js';
import { markText } from '@/lojo/dictation/mark.js';
import { englishStatus, loadEnglishStatus } from '@/lojo/english/api.js';
import * as os from '@/os.js';

const props = defineProps<{
	stop: ListenStop;
	device: Device;
}>();

const emit = defineEmits<{
	(ev: 'finish', result: ListenTry): void;
	(ev: 'exit'): void;
}>();

// ONE WORD AND/OR A NUMBER, as on the notes
const LIMIT: DictLimit = { words: 1, number: true };

type Phase = 'preparing' | 'look' | 'rows';

const inputId = `typing-listen-${useId()}`;
const rootEl = useTemplateRef('rootEl');
const inputEl = useTemplateRef('inputEl');
const n = props.stop.rows.length;
const phase = ref<Phase>('preparing');
// the gap being filled; -1 before the first sentence
const k = ref(-1);
// a sentence is playing (or shown as a caption)
const playingNow = ref(false);
const countdown = shallowRef<{ end: number; total: number } | null>(null);
const answers = ref<string[]>(props.stop.rows.map(() => ''));
// recordings ready, of how many
const prepared = ref(0);
const clipCount = n + 1;
const captions = ref(false);
const caption = ref<string | null>(null);
const notice = ref<string | null>(null);
const filled = ref(false);
const composing = ref(false);
const ime = ref(false);
// the stop has been left or handed in: the run stops where it is (read through `over()`: it changes while `run` waits)
let gone = false;
const over = () => gone;

const clk = useStopClock({
	show() {
		resumeClip();
		const focusedEl = window.document.activeElement;
		if (focusedEl == null || focusedEl === window.document.body) inputEl.value?.focus({ preventScroll: true });
	},
	hide() {
		pauseClip();
	},
});

const rule = computed(() => ruleText(props.stop, props.device, { wpm: 0, acc: 0 }));
const row = computed(() => props.stop.rows[Math.max(0, k.value)]);
const question = computed(() => `${row.value.note} ____${row.value.after ? ` ${row.value.after}` : ''}`);
const leftSec = computed(() => (countdown.value == null ? null : Math.max(0, Math.ceil((countdown.value.end - clk.now.value) / 1000))));

const liveText = computed(() => {
	if (phase.value === 'preparing') return L.preparing(prepared.value, clipCount);
	if (phase.value === 'look') return L.lookFirst;
	if (playingNow.value) return L.playingRow(k.value + 1);
	return k.value < n - 1 ? L.nextSoon : L.lastGap;
});

const countText = computed(() => {
	const s = leftSec.value;
	if (s == null) return '';
	if (phase.value === 'look') return L.startIn(s);
	return k.value < n - 1 ? L.nextIn(s) : L.endIn(s);
});

const barScale = computed(() => {
	if (phase.value === 'preparing') return prepared.value / clipCount;
	const c = countdown.value;
	if (c == null) return 1;
	return Math.max(0, Math.min(1, (c.end - clk.now.value) / c.total));
});

const captionMs = (say: string) => Math.max(1800, say.split(/\s+/).length * 380);

async function count(ms: number): Promise<void> {
	countdown.value = { end: clk.clock.now() + ms, total: ms };
	await clk.wait(ms);
	countdown.value = null;
}

// A recording that stopped: when the stop itself is being left, that is not a failure.
async function stillHere(): Promise<boolean> {
	await nextTick();
	return !over();
}

function toRow(j: number) {
	k.value = j;
	filled.value = false;
	if (inputEl.value != null) inputEl.value.value = '';
	void nextTick(() => {
		rootEl.value?.querySelector(`[data-row="${j}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	});
}

async function run() {
	const rows = props.stop.rows;
	await loadEnglishStatus().catch(() => undefined);
	if (over()) return;
	if (englishStatus.value.speech) {
		const ok = await loadClips([props.stop.intro, ...rows.map(r => r.say)], done => {
			prepared.value = done;
		});
		if (over()) return;
		if (!ok) {
			captions.value = true;
			notice.value = L.captionsInstead;
		}
	} else {
		captions.value = true;
		notice.value = L.speechOff;
	}
	prepared.value = clipCount;
	phase.value = 'look';
	const intro = captions.value ? null : playClip(props.stop.intro);
	await count(props.stop.lookSeconds * 1000);
	if (intro != null) await intro;
	if (over()) return;
	phase.value = 'rows';
	const gapMs = props.stop.gapSeconds[props.device] * 1000;
	for (let j = 0; j < n; j++) {
		toRow(j);
		playingNow.value = true;
		if (!captions.value) {
			const played = await playClip(rows[j].say);
			if (!await stillHere()) return;
			if (!played) {
				captions.value = true;
				os.toast(L.audioLost);
			}
		}
		if (captions.value) {
			caption.value = rows[j].say;
			await clk.wait(captionMs(rows[j].say));
			if (over()) return;
			caption.value = null;
		}
		playingNow.value = false;
		await count(gapMs);
		if (over()) return;
	}
	finish();
}

function finish() {
	gone = true;
	const marks = props.stop.rows.map((r, j) => markText({ answer: r.answer, ignoreSpaces: false, limit: null }, LIMIT, answers.value[j]));
	const right = marks.map(m => m.correct);
	const score = right.filter(Boolean).length;
	const judged = judgeCount(score, props.stop.need);
	emit('finish', {
		kind: 'listen', stop: props.stop.id, device: props.device, pass: judged.pass, checks: judged.checks, ms: clk.clock.now(),
		acc: accuracyOf(score, n) ?? 0, wpm: 0, score, total: n,
		given: answers.value.slice(), right, reasons: marks.map(m => m.reason), captions: captions.value,
	});
}

function leave() {
	gone = true;
	stopClip();
	emit('exit');
}

function onInput(ev: Event) {
	if (composing.value || (ev as InputEvent).isComposing) return;
	take();
}

function onCompositionStart() {
	composing.value = true;
	if (!touchScreen) ime.value = true;
}

function onCompositionEnd() {
	composing.value = false;
	take();
}

function take() {
	const el = inputEl.value;
	if (el == null || gone) return;
	const { text, fullWidth, cjk } = cleanTyped(el.value);
	if (fullWidth) sayFullWidthOnce(L.fullWidth);
	if (!touchScreen) ime.value = cjk;
	// before the first sentence there is no gap to fill
	if (phase.value !== 'rows' || k.value < 0) {
		setBoxValue(el, '');
		return;
	}
	setBoxValue(el, text);
	answers.value[k.value] = text.trim();
	filled.value = false;
}

// Enter: this gap is filled. It can still be changed until the next sentence starts.
function onKeydown(ev: KeyboardEvent) {
	if (ev.key !== 'Enter' || ev.isComposing || ev.keyCode === 229) return;
	ev.preventDefault();
	if (phase.value === 'rows' && k.value >= 0 && answers.value[k.value] !== '') filled.value = true;
}

// On a computer, typing anywhere on the page goes into the box.
useWindowKeys(ev => {
	if (touchScreen || gone || !keysForUs(ev, rootEl.value) || !wantsBox(ev)) return;
	inputEl.value?.focus({ preventScroll: true });
}, true);

onMounted(() => {
	inputEl.value?.focus({ preventScroll: true });
	void run();
});

onBeforeUnmount(() => {
	gone = true;
	stopClip();
});
</script>

<style lang="scss" module>
.root {
	max-width: 860px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.nowbar {
	position: sticky;
	top: var(--MI-stickyTop, 0px);
	z-index: 5;
	background: var(--MI_THEME-panel);
	border-radius: 20px;
	box-shadow: var(--tl-shadow);
	padding: 12px 14px 14px;
}

.nbHead {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 8px;
	font-size: 13px;
}

.live {
	display: inline-flex;
	align-items: center;
	gap: 7px;
	font-weight: 700;
	color: var(--tl-weak);

	> i {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--tl-cMute);
	}
}

.liveOn {
	color: var(--tl-c);

	> i {
		background: var(--tl-c);
		animation: livepulse 1s ease-in-out infinite alternate;
	}
}

@keyframes livepulse {
	from { opacity: 0.35; }
	to { opacity: 1; }
}

.left {
	margin-left: auto;
	color: var(--tl-weak);
	font-variant-numeric: tabular-nums;
	font-weight: 600;
}

.track {
	height: 6px;
	border-radius: 999px;
	background: var(--tl-hi);
	overflow: hidden;
	margin-bottom: 10px;

	> b {
		display: block;
		height: 100%;
		width: 100%;
		background: var(--tl-c);
		border-radius: inherit;
		transform-origin: left;
		transition: transform 0.1s linear;
	}
}

.q {
	display: flex;
	align-items: baseline;
	gap: 8px;
	font-family: var(--tl-mono);
	font-size: 15px;
	color: var(--tl-ink);
	margin-bottom: 6px;
}

.qn {
	flex: none;
	display: inline-grid;
	place-items: center;
	min-width: 24px;
	height: 22px;
	padding: 0 6px;
	box-sizing: border-box;
	border-radius: 999px;
	background: var(--tl-c);
	color: var(--tl-onC);
	font: 800 12px system-ui, sans-serif;
}

.gin {
	box-sizing: border-box;
	width: 100%;
	height: 50px;
	border: 0;
	border-radius: 12px;
	background: var(--tl-hi);
	padding: 0 14px;
	font: 20px var(--tl-mono);
	color: var(--tl-ink);
	box-shadow: inset 0 -2px 0 var(--tl-c);
	outline: none;

	&:focus {
		box-shadow: inset 0 0 0 2px var(--tl-c);
	}
}

.filled {
	margin: 6px 0 0;
	font-size: 13px;
	font-weight: 700;
	color: var(--tl-ok);
}

.cap {
	margin: 8px 0 0;
	font-size: 13px;
	background: var(--tl-goldBg);
	border-radius: 10px;
	padding: 6px 10px;

	> b {
		color: var(--tl-ink);
	}
}

.notice {
	margin: 8px 0 0;
	font-size: 13px;
	color: var(--tl-gold);
}

.ime {
	margin: 8px 0 0;
	background: var(--tl-goldBg);
	color: var(--tl-gold);
	font-weight: 700;
	font-size: 13.5px;
	border-radius: 12px;
	padding: 8px 12px;
	text-align: center;
}

.notes {
	background: var(--MI_THEME-panel);
	border-radius: 22px;
	box-shadow: var(--tl-shadow);
	padding: 18px;
}

.nh {
	font-weight: 800;
	letter-spacing: 0.14em;
	color: var(--tl-ink);
	margin: 0 0 2px;
	font-size: 14px;
}

.ni {
	font-size: 13px;
	color: var(--tl-weak);
	margin: 0 0 8px;
	line-height: 1.6;

	> b {
		color: var(--tl-ink);
	}
}

.rows {
	list-style: none;
	margin: 0;
	padding: 0;

	> li {
		display: flex;
		align-items: baseline;
		gap: 4px 8px;
		padding: 9px 8px;
		border-top: 1px solid var(--tl-line);
		font-family: var(--tl-mono);
		font-size: 14px;
		border-radius: 10px;
		scroll-margin-top: 240px;

		&.now {
			background: var(--tl-cBg);
			color: var(--tl-ink);
			border-top-color: transparent;
		}
	}
}

.now .gapv {
	border-bottom-color: var(--tl-c);
}

.done .gapv {
	border-bottom-color: var(--tl-cMute);
}

.todo {
	opacity: 0.62;
}

.gapv {
	display: inline-block;
	min-width: 4.2em;
	min-height: 1.4em;
	padding: 0 6px;
	vertical-align: bottom;
	border-bottom: 2px solid var(--tl-line);
	color: var(--tl-ink);
	font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
	.liveOn > i {
		animation: none;
	}
}

@container typing (min-width: 720px) {
	.gapv {
		min-width: 6.5em;
	}

	.rows > li {
		font-size: 14.5px;
	}
}
</style>
