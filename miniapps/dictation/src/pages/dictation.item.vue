<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 听写: one item. The recording plays once by itself and can be played again (replays before answering are counted:
the real test plays it once). A word is checked letter by letter and moves on when it is right; numbers, dates and
plurals are checked on Enter. On a computer typing goes straight into the box, Enter checks and moves on, ` replays. -->
<template>
<div ref="rootEl" :class="$style.root" :data-item="item.id">
	<article :class="[$style.card, verdict ? (verdict.correct ? $style.isOk : $style.isBad) : null]">
		<div :class="$style.listen">
			<button
				class="_button"
				:class="[$style.play, { [$style.playing]: playing }]"
				:aria-label="playLabel"
				:disabled="!speech"
				@click="replay"
			>
				<i v-if="loadingAudio" class="ti ti-loader-2" :class="$style.spin" aria-hidden="true"></i>
				<span v-else-if="playing" :class="$style.eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
				<i v-else-if="plays > 0" class="ti ti-reload" aria-hidden="true"></i>
				<i v-else class="ti ti-player-play-filled" aria-hidden="true"></i>
			</button>
			<div :class="$style.listenText">
				<b>{{ playText }}</b>
				<span :class="$style.listenNote">
					<template v-if="replays > 0">{{ dictLabels.replays(replays) }} <span :class="$style.once">{{ dictLabels.once }}</span></template>
					<template v-else>{{ verdict ? dictLabels.afterNote : dictLabels.listenNote }}</template>
				</span>
			</div>
			<button v-if="speech" class="_button" :class="$style.noSound" :aria-expanded="helpOpen" :aria-controls="`${uid}-help`" @click="helpOpen = !helpOpen">{{ dictLabels.noSound }}</button>
		</div>
		<p v-if="audioProblem" :class="$style.problem" role="alert">{{ audioProblem }}</p>
		<div v-if="helpOpen || !speech" :id="`${uid}-help`" :class="$style.help">
			<p>{{ speech ? dictLabels.noSoundHelp : dictLabels.speechOff }}</p>
			<p v-if="scriptOpen" lang="en" class="_selectable" :class="$style.script">{{ item.say }}</p>
			<button v-else class="_button _textButton" @click="scriptOpen = true">{{ dictLabels.showScript }}</button>
		</div>

		<p v-if="item.instructions" :class="$style.instr"><span lang="en">{{ item.instructions.en }}</span><span>{{ item.instructions.zh }}</span></p>
		<p :class="$style.line" lang="en">
			{{ line.before }}<span :class="$style.nb"><span v-if="verdict == null" :class="$style.gap"><span :class="$style.sr">{{ dictLabels.gap }}</span></span><span v-else :class="[$style.gap, $style.filled, verdict.correct ? $style.filledOk : $style.filledRight]">{{ filled }}</span>{{ line.punct }}</span>{{ line.after }}
		</p>
		<p v-if="item.hint" :class="$style.hint"><span :class="$style.hintKey">{{ dictLabels.hint }}</span><span>{{ item.hint }}</span></p>
		<p v-else-if="item.gate" :class="$style.hint">
			<span :class="$style.hintKey">{{ dictLabels.gateWrote }}</span>
			<s v-if="item.gate.given" lang="en" :class="$style.gateGiven">{{ item.gate.given }}</s>
			<span v-else>{{ dictLabels.blank }}</span>
		</p>

		<XVerdict v-if="verdict" :item="item" :verdict="verdict" :guideSlug="guideSlug" :guideName="guideName" :wordSaved="wordSaved"/>
	</article>

	<div :class="$style.answer">
		<XField
			ref="fieldEl"
			v-model="value"
			:marks="verdict == null && live ? liveNow.marks : null"
			:state="fieldState"
			:locked="verdict != null"
			:inputmode="item.inputmode"
			:placeholder="live ? dictLabels.placeholderLive : dictLabels.placeholderEnter"
			:label="dictLabels.answerLabel"
			:describedby="`${uid}-key`"
			@enter="submit"
			@replay="replay"
		/>
		<button class="_button" :class="[$style.act, actPrimary ? $style.primary : $style.ghost]" @click="act">{{ actText }}</button>
	</div>
	<p :id="`${uid}-key`" :class="[$style.keyhint, { [$style.warn]: warn != null }]">
		<template v-if="warn">{{ warn }}</template>
		<template v-else-if="verdict">{{ verdict.correct ? '' : coarse ? dictLabels.afterWrongTouch : dictLabels.afterWrong }}</template>
		<template v-else>
			{{ live ? dictLabels.keyLive : coarse ? dictLabels.keyEnterTouch : dictLabels.keyEnter }}
			<template v-if="!coarse && speech"> {{ dictLabels.replayKey[0] }} <kbd :class="$style.kbd">`</kbd> {{ dictLabels.replayKey[1] }}</template>
		</template>
	</p>
	<p :class="$style.sr" aria-live="polite">{{ announce }}</p>
</div>
</template>

<script lang="ts" setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, useId, useTemplateRef, watch } from 'vue';
import XField from './dictation.field.vue';
import XVerdict from './dictation.verdict.vue';
import type { Slip, Verdict } from '@/lojo/dictation/mark.js';
import type { DictItem } from '@/lojo/dictation/content.js';
import type { Blip } from '@/lojo/dictation/sfx.js';
import { checkAnswer, closest, liveState, nearMiss, normalizeAnswer, revealed, slipOf } from '@/lojo/dictation/mark.js';
import { audioError, audioKey, audioState, playAudio, stopAudio } from '@/lojo/dictation/audio.js';
import { blip } from '@/lojo/dictation/sfx.js';
import { dictLabels } from '@/lojo/dictation/labels.js';
import MkPageWindow from '@/components/MkPageWindow.vue';
import { popups } from '@/os.js';

const props = defineProps<{
	item: DictItem;
	last: boolean;
	sfxOn: boolean;
	// whether recordings can be made at all (lojo/english/status)
	speech: boolean;
	guideSlug: string;
	guideName: string | null;
	wordSaved: boolean;
}>();

const emit = defineEmits<{
	(ev: 'answer', result: { verdict: Verdict; replays: number }): void;
	(ev: 'next'): void;
}>();

const uid = `dict-${useId()}`;
// the item never changes: the round gives each one its own component
const audioKeyOfItem = computed(() => `dictation:${props.item.id}`);
const coarse = window.matchMedia('(pointer: coarse)').matches;
const fieldEl = useTemplateRef('fieldEl');
const rootEl = useTemplateRef('rootEl');
// false while the page is kept alive in the background (RouterView's KeepAlive) after the learner left it
let active = true;

const value = ref('');
const verdict = ref<Verdict | null>(null);
// the first letter that went wrong while typing a word
const slip = ref<Slip | null>(null);
const plays = ref(0);
const replays = ref(0);
const warn = ref<string | null>(null);
const announce = ref('');
const helpOpen = ref(false);
const scriptOpen = ref(false);
// the first play, a moment after the item shows; and moving on after a right answer
let playTimer: number | null = null;
let nextTimer: number | null = null;

const live = computed(() => props.item.mode === 'live');
const liveNow = computed(() => liveState(props.item.answer, value.value));
const fieldState = computed(() => {
	if (verdict.value) return verdict.value.correct ? 'ok' : 'wrong';
	return live.value && liveNow.value.bad ? 'bad' : 'idle';
});

const mine = computed(() => audioKey.value === audioKeyOfItem.value);
const playing = computed(() => mine.value && audioState.value === 'playing');
const loadingAudio = computed(() => mine.value && audioState.value === 'loading');
const audioProblem = computed(() => {
	if (!mine.value) return null;
	if (audioState.value === 'blocked') return dictLabels.blocked;
	if (audioState.value === 'failed') return (audioError.value != null ? dictLabels.audioErrors[audioError.value] : null) ?? dictLabels.audioFailed;
	return null;
});
const playText = computed(() => {
	if (loadingAudio.value) return dictLabels.loadingAudio;
	if (playing.value) return dictLabels.playing;
	return plays.value > 0 ? dictLabels.again : dictLabels.listen;
});
const playLabel = computed(() => (playing.value ? dictLabels.playingLabel : plays.value > 0 ? dictLabels.again : dictLabels.play));

// The gap stays with the punctuation right after it, so a full stop never ends up alone on the next line.
const line = computed(() => {
	const [before, after = ''] = props.item.line.split('{}');
	const punct = /^[.,!?;:)]+/.exec(after)?.[0] ?? '';
	return { before, punct, after: after.slice(punct.length) };
});
// Once checked, the gap shows what was written (right) or the answer closest to it (wrong).
const filled = computed(() => {
	const v = verdict.value;
	if (v == null) return '';
	if (v.correct) return v.given;
	return v.given !== '' ? closest(props.item.answer, v.given, props.item.ignoreSpaces) : props.item.answer[0];
});

const actPrimary = computed(() => verdict.value != null || !live.value);
const actText = computed(() => {
	if (verdict.value) return props.last ? dictLabels.finish : dictLabels.next;
	return live.value ? dictLabels.reveal : dictLabels.check;
});

function sound(kind: Blip) {
	if (props.sfxOn) blip(kind);
}

async function play() {
	if (!props.speech) return;
	// Played again before answering counts as a replay.
	const counted = plays.value > 0 && verdict.value == null;
	if (await playAudio(audioKeyOfItem.value, props.item.say)) {
		plays.value++;
		if (counted) replays.value++;
	}
}

function replay() {
	void play();
}

function answer(v: Verdict) {
	if (verdict.value != null) return;
	verdict.value = v;
	warn.value = null;
	emit('answer', { verdict: v, replays: replays.value });
	sound(v.correct ? 'ok' : 'bad');
	if (v.correct) {
		announce.value = v.fixed ? dictLabels.liveFixed : dictLabels.liveRight;
		// a moment longer when there is a note or other forms to read
		const pause = v.fixed ? 2000 : live.value ? 750 : 1700;
		nextTimer = window.setTimeout(() => {
			nextTimer = null;
			emit('next');
		}, pause);
	} else {
		const title = v.reason === 'word-limit' ? dictLabels.wordLimit : v.reason === 'revealed' ? dictLabels.revealedTitle
			: nearMiss(props.item.near, v.given) ? dictLabels.nearTitle : dictLabels.wrong;
		announce.value = dictLabels.liveWrong(title, filled.value);
		// on a phone the keyboard goes down, so the answer and the rule can be read
		if (coarse) fieldEl.value?.blur();
	}
}

function needAnswer() {
	fieldEl.value?.shake();
	warn.value = live.value ? dictLabels.needAnswerLive : dictLabels.needAnswer;
	fieldEl.value?.focus();
}

function clearTimers() {
	if (playTimer != null) window.clearTimeout(playTimer);
	if (nextTimer != null) window.clearTimeout(nextTimer);
	playTimer = null;
	nextTimer = null;
}

function next() {
	clearTimers();
	emit('next');
}

// Enter: check (a word half typed is handed in as it is), or once checked, the next one.
function submit() {
	if (verdict.value) {
		next();
		return;
	}
	if (normalizeAnswer(value.value, props.item.ignoreSpaces) === '') {
		needAnswer();
		return;
	}
	answer(checkAnswer(props.item, null, value.value, live.value ? slip.value : null));
}

function act() {
	if (verdict.value) next();
	else if (live.value) answer(revealed(value.value));
	else submit();
	if (verdict.value == null) fieldEl.value?.focus();
}

// A word: a wrong letter is noted the first time and marked until deleted; the right word is done at once.
watch(value, v => {
	if (verdict.value != null) return;
	if (!live.value) {
		warn.value = null;
		return;
	}
	const st = liveState(props.item.answer, v);
	if (st.bad && slip.value == null) {
		slip.value = slipOf(props.item.answer, v, st.firstBad);
		fieldEl.value?.shake();
		sound('slip');
	}
	warn.value = st.bad ? dictLabels.letterWrong(st.firstBad + 1) : null;
	if (st.complete) answer(checkAnswer(props.item, null, v, slip.value));
});

// Keys for this item only: not once the learner has left the page (it stays alive in the background), not under an
// in-app window or dialog (the guide and the wordbook open in one), and not aimed at anything outside this page.
function forUs(ev: KeyboardEvent): boolean {
	const root = rootEl.value;
	if (!active || root == null || !root.isConnected) return false;
	if (root.closest('[inert]') != null || popups.value.some(p => p.component === MkPageWindow)) return false;
	const target = ev.target;
	if (target === window.document.body || target === window.document.documentElement) return true;
	return target instanceof Node && (root.closest('[data-dictation]') ?? root).contains(target);
}

// On a computer: typing anywhere on the page goes into the box, Enter checks and moves on, ` replays. Caught before the
// site's own shortcuts (p, n, s…), which would otherwise open the post form or search.
function onKeydown(ev: KeyboardEvent) {
	if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.isComposing || !forUs(ev)) return;
	const target = ev.target as HTMLElement | null;
	const tag = target?.tagName;
	if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
	if (ev.key === '`' || ev.key === '·') {
		ev.preventDefault();
		ev.stopPropagation();
		replay();
		return;
	}
	if (ev.key === 'Enter') {
		if (tag === 'BUTTON' || tag === 'A') return;
		ev.preventDefault();
		ev.stopPropagation();
		submit();
		return;
	}
	// Space still presses a focused button. Once checked the box is read-only, but holding the focus there keeps letters
	// away from the shortcuts all the same.
	if (ev.key === ' ' && (tag === 'BUTTON' || tag === 'A')) return;
	if (ev.key.length === 1 || ev.key === 'Backspace') fieldEl.value?.focus();
}

onMounted(() => {
	window.addEventListener('keydown', onKeydown, { capture: true });
	fieldEl.value?.focus();
	playTimer = window.setTimeout(() => {
		playTimer = null;
		if (plays.value === 0 && verdict.value == null) void play();
	}, 280);
});

// Leaving the page keeps it alive: no keys, no sound and nothing moving on until the learner comes back.
onActivated(() => {
	active = true;
	window.addEventListener('keydown', onKeydown, { capture: true });
});

onDeactivated(() => {
	active = false;
	window.removeEventListener('keydown', onKeydown, { capture: true });
	clearTimers();
	if (mine.value) stopAudio();
});

onBeforeUnmount(() => {
	window.removeEventListener('keydown', onKeydown, { capture: true });
	clearTimers();
	if (mine.value) stopAudio();
});
</script>

<style lang="scss" module>
.root {
	--ok: color-mix(in srgb, #2F7D5B 82%, var(--MI_THEME-fg));
	--okBg: color-mix(in srgb, #2F7D5B 16%, var(--MI_THEME-panel));
	--bad: var(--MI_THEME-error);
	--mustard: #F2C14E;
	--goldBg: color-mix(in srgb, #F2C14E 22%, var(--MI_THEME-panel));
	--gold: color-mix(in srgb, #B8871B 72%, var(--MI_THEME-fg));
	--hi: color-mix(in srgb, var(--MI_THEME-fg) 6%, var(--MI_THEME-panel));
	--weak: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
	--ink: var(--MI_THEME-fgHighlighted);
}

.card {
	position: relative;
	background: var(--MI_THEME-panel);
	border-radius: 22px;
	box-shadow: 0 1px 2px color-mix(in srgb, var(--ink) 6%, transparent), 0 10px 28px -10px color-mix(in srgb, var(--ink) 25%, transparent);
	padding: 16px 18px 18px;
	transition: box-shadow 0.2s;

	&.isOk {
		box-shadow: 0 10px 28px -10px color-mix(in srgb, var(--ink) 25%, transparent), inset 0 0 0 2px color-mix(in srgb, var(--ok) 50%, transparent);
	}

	&.isBad {
		box-shadow: 0 10px 28px -10px color-mix(in srgb, var(--ink) 25%, transparent), inset 0 0 0 2px color-mix(in srgb, var(--bad) 40%, transparent);
	}
}

.listen {
	display: flex;
	align-items: center;
	gap: 14px;
}

.play {
	position: relative;
	flex: none;
	width: 58px;
	height: 58px;
	border-radius: 50%;
	background: var(--MI_THEME-cta);
	color: var(--MI_THEME-fgOnAccent);
	display: grid;
	place-items: center;
	font-size: 26px;
	box-shadow: 0 8px 18px -8px color-mix(in srgb, var(--MI_THEME-cta) 80%, transparent);
	transition: background 0.15s, transform 0.1s;

	&:hover:not(:disabled) {
		background: hsl(from var(--MI_THEME-cta) h s calc(l + 5));
	}

	&:active:not(:disabled) {
		transform: scale(0.96);
	}

	&:disabled {
		opacity: 0.5;
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}

	&.playing::after {
		content: "";
		position: absolute;
		inset: -5px;
		border-radius: 50%;
		border: 3px solid var(--MI_THEME-cta);
		animation: ring 1.6s ease-out infinite;
		pointer-events: none;
	}
}

.eq {
	display: flex;
	align-items: center;
	gap: 3px;
	height: 22px;

	> i {
		width: 4px;
		height: 100%;
		border-radius: 2px;
		background: currentColor;
		animation: eq 0.9s ease-in-out infinite;

		&:nth-child(2) { animation-delay: -0.3s; }
		&:nth-child(3) { animation-delay: -0.6s; }
		&:nth-child(4) { animation-delay: -0.15s; }
	}
}

.spin {
	animation: spin 0.9s linear infinite;
}

@keyframes eq {
	0%, 100% { transform: scaleY(0.35); }
	50% { transform: scaleY(1); }
}

@keyframes ring {
	0% { transform: scale(0.92); opacity: 0.7; }
	100% { transform: scale(1.28); opacity: 0; }
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.listenText {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 3px;

	> b {
		color: var(--ink);
		font-size: 15.5px;
	}
}

.listenNote {
	font-size: 12.5px;
	color: var(--weak);
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px 8px;
}

.once {
	display: inline-block;
	background: var(--goldBg);
	color: var(--gold);
	font-weight: 700;
	font-size: 11.5px;
	border-radius: 6px;
	padding: 1px 7px;
}

.noSound {
	flex: none;
	align-self: flex-start;
	color: var(--weak);
	font-size: 12px;
	text-decoration: underline;
	text-underline-offset: 3px;
	padding: 4px 2px;
}

.problem {
	margin: 10px 0 0;
	font-size: 13px;
	color: var(--bad);
}

.help {
	margin: 12px 0 0;
	background: var(--hi);
	border-radius: 14px;
	padding: 10px 12px;
	font-size: 13px;
	line-height: 1.6;

	> p {
		margin: 0 0 4px;
	}
}

.script {
	color: var(--ink);
	font-size: 15px;
}

.instr {
	margin: 16px 0 0;
	font-size: 12px;
	color: var(--weak);
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 2px 8px;

	> span[lang="en"] {
		font-weight: 700;
		font-size: 11.5px;
		color: var(--MI_THEME-fg);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
}

.line {
	font-size: 19px;
	line-height: 1.6;
	color: var(--ink);
	margin: 10px 0 0;
	overflow-wrap: anywhere;
}

.nb {
	white-space: nowrap;
}

.gap {
	display: inline-block;
	min-width: 4.6em;
	height: 1.2em;
	border-bottom: 2.5px solid var(--ink);
	vertical-align: -0.28em;
	margin: 0 3px;
}

.filled {
	min-width: 0;
	height: auto;
	padding: 0 5px;
	font-weight: 700;
	vertical-align: baseline;
	border-radius: 6px 6px 0 0;
	white-space: pre-wrap;
}

.filledOk {
	color: var(--ok);
	border-color: var(--ok);
	background: var(--okBg);
}

.filledRight {
	color: var(--ink);
	border-color: var(--mustard);
	background: var(--goldBg);
}

.hint {
	margin: 10px 0 0;
	font-size: 13.5px;
	display: flex;
	align-items: center;
	gap: 8px;
}

.hintKey {
	font-size: 11px;
	font-weight: 700;
	color: var(--weak);
	background: var(--hi);
	border-radius: 6px;
	padding: 1px 7px;
	letter-spacing: 0.06em;
}

.gateGiven {
	color: var(--bad);
	font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}

.answer {
	display: flex;
	gap: 10px;
	margin-top: 14px;
	align-items: stretch;
}

.act {
	flex: none;
	min-width: 88px;
	height: 62px;
	border-radius: 18px;
	padding: 0 16px;
	font-weight: 700;
	font-size: 15.5px;
	letter-spacing: 0.04em;
	transition: background 0.15s, transform 0.1s;

	&:active {
		transform: scale(0.97);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}

	&.primary {
		background: var(--MI_THEME-cta);
		color: var(--MI_THEME-fgOnAccent);

		&:hover {
			background: hsl(from var(--MI_THEME-cta) h s calc(l + 5));
		}
	}

	&.ghost {
		background: var(--MI_THEME-buttonBg);
		color: var(--ink);

		&:hover {
			background: var(--MI_THEME-buttonHoverBg);
		}
	}
}

.keyhint {
	margin: 10px 4px 0;
	min-height: 1.6em;
	font-size: 12.5px;
	color: var(--weak);
	text-align: center;
	line-height: 1.6;

	&.warn {
		color: var(--bad);
		font-weight: 600;
	}
}

.kbd {
	font: 600 11.5px ui-monospace, "SF Mono", Menlo, Consolas, monospace;
	color: var(--ink);
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	border-bottom-width: 2px;
	border-radius: 5px;
	padding: 0 5px;
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

@media (min-width: 720px) {
	.card {
		padding: 22px 26px 24px;
	}

	.play {
		width: 62px;
		height: 62px;
	}

	.line {
		font-size: 22px;
	}

	.answer {
		margin-top: 16px;
	}

	.act {
		height: 68px;
		min-width: 104px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.eq > i,
	.spin,
	.play.playing::after {
		animation: none;
	}
}
</style>
