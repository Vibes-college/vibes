<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 5 号线 · 词汇: 看义拼写 and 听音拼写, one word at a time. 看义拼写 shows the Chinese, the part of speech and the
example with the word blanked out; 听音拼写 reads the word (again, or slower, on a tap; ` on a computer). A wrong spelling
is lined up against the right one and can be put right; 提示 gives the next letter, 看答案 shows the word to copy once.
Only a word right the first time, with no hint and the answer not shown, counts as right (the page records it). A word
spelled right moves on by itself. Ported from the demo (prototypes/vocab-line). -->
<template>
<div ref="rootEl" :class="$style.root" :data-spell="round.mode">
	<XBar :title="L.modes[round.mode].name" :sub="sub" :at="i" :done="results.length" :total="round.words.length" :sfx="sfx" @exit="exit" @toggleSfx="emit('toggleSfx')"/>

	<section
		:key="word.key"
		:class="[$style.card, { [$style.right]: phase === 'right', [$style.wrong]: phase === 'wrong' || phase === 'shown' }]"
		:style="{ '--g': group?.color ?? null }"
		:aria-label="L.countLabel(i + 1, round.words.length)"
		data-card
	>
		<div v-if="group" :class="$style.grp"><i aria-hidden="true"></i>{{ group.label }}</div>
		<template v-if="round.mode === 'meaning'">
			<p :class="$style.zh" data-meaning><i v-if="word.pos" :class="$style.pos">{{ word.pos }}</i>{{ word.zh }}</p>
			<p v-if="ex.word" :class="$style.ex" lang="en">{{ ex.before }}<span :class="$style.gap" :style="{ '--n': Array.from(ex.word).length }" role="img" :aria-label="L.gap"></span>{{ ex.suffix }}{{ ex.after }}</p>
			<p :class="$style.len">{{ lettersText }}</p>
		</template>
		<template v-else>
			<div v-if="speech" :class="$style.listen">
				<button type="button" class="_button" :class="$style.bigPlay" :aria-label="L.playAgain" :title="L.playAgain" data-play @click="play(false)">
					<i :class="loading ? ['ti ti-loader-2', $style.spin] : 'ti ti-volume'" aria-hidden="true"></i>
				</button>
				<button type="button" class="_button" :class="$style.slow" data-play-slow @click="play(true)">{{ L.playSlow }}</button>
			</div>
			<p v-if="speech" :class="$style.listenHint">{{ L.listenHint }}<template v-if="!touchScreen"> · {{ L.listenKey }}</template></p>
			<p v-else :class="$style.noSpeech">{{ L.noSpeechIpa }} <span :class="$style.ipa">{{ word.ipa }}</span></p>
		</template>
		<p v-if="audioNote" :class="$style.warn" role="status">{{ audioNote }}</p>

		<div v-if="phase === 'right' || phase === 'shown'" :class="$style.reveal" data-reveal>
			<div :class="$style.rvW">
				<div :class="$style.rvWord">
					<b lang="en" class="_selectable">{{ word.w }}</b>
					<span :class="$style.ipa">{{ word.ipa }}</span>
				</div>
				<button v-if="speech" type="button" class="_button" :class="$style.say" :aria-label="L.hear(word.w)" :title="L.hear(word.w)" @click="play(false)">
					<i class="ti ti-volume" aria-hidden="true"></i>
				</button>
			</div>
			<p v-if="word.alt.length > 0" :class="$style.alt" lang="en">{{ L.alsoSpelt(word.alt.join(' / ')) }}</p>
			<p :class="$style.rvZh"><i v-if="word.pos" :class="$style.pos">{{ word.pos }}</i>{{ word.zh }}</p>
			<p v-if="ex.word" :class="$style.rvEx" lang="en">{{ ex.before }}<b>{{ ex.word + ex.suffix }}</b>{{ ex.after }}</p>
		</div>
	</section>

	<form :class="$style.answer" novalidate @submit.prevent="submit">
		<label :for="inputId" :class="$style.label">{{ L.spellLabel }}</label>
		<input
			:id="inputId"
			ref="inputEl"
			v-model="typed"
			:class="[$style.box, { [$style.bad]: phase === 'wrong' || phase === 'shown', [$style.nudge]: shaking }]"
			type="text"
			inputmode="text"
			autocomplete="off"
			autocapitalize="off"
			autocorrect="off"
			spellcheck="false"
			enterkeyhint="done"
			lang="en"
			:readonly="phase === 'right'"
			:placeholder="phase === 'shown' ? L.placeholderCopy : L.placeholder"
			data-answer
			@animationend="shaking = false"
		>
		<div :class="$style.fb" role="status" aria-live="polite" data-fb>
			<span v-if="fb.k === 'need'" :class="$style.soft">{{ L.needWord }}</span>
			<span v-else-if="fb.k === 'right'" :class="$style.okm" data-fb-right><i class="ti ti-check" aria-hidden="true"></i>{{ fb.how === 'first' ? L.right : fb.how === 'shown' ? L.rightAfterShown : L.rightFixed }}</span>
			<template v-else-if="fb.k === 'wrong'">
				<span :class="$style.badm" data-fb-wrong><i class="ti ti-x" aria-hidden="true"></i>{{ fb.again ? L.wrongAgain : L.wrong }}</span>
				<XDiff :typed="fb.typed" :right="closestSpelling(word, fb.typed)" view="attempt"/>
				<span :class="$style.soft">{{ fb.again ? L.wrongAgainHelp : L.wrongHelp }}</span>
			</template>
			<span v-else-if="fb.k === 'hint'" :class="$style.soft" data-fb-hint><i class="ti ti-bulb" aria-hidden="true"></i>{{ L.hintBefore(fb.at + 1) }}<b :class="$style.hl" lang="en">{{ fb.letter }}</b>{{ L.hintAfter }}</span>
			<span v-else-if="fb.k === 'hintDone'" :class="$style.soft">{{ L.hintDone }}</span>
			<template v-else-if="fb.k === 'shown'">
				<span :class="$style.badm" data-fb-shown><i class="ti ti-eye" aria-hidden="true"></i>{{ L.answerHead }}</span>
				<XDiff :typed="fb.last" :right="fb.last !== '' ? closestSpelling(word, fb.last) : word.w" view="answer" big/>
				<span v-if="fb.last !== ''" :class="$style.soft">{{ L.youWrote }} <XDiff :typed="fb.last" :right="closestSpelling(word, fb.last)" view="attempt"/></span>
				<span :class="$style.soft">{{ L.copyOnce }}</span>
			</template>
		</div>
		<div :class="$style.acts">
			<button v-if="phase === 'right' || phase === 'shown'" type="button" class="_button" :class="[$style.btn, $style.go]" data-act="next" @click="next">
				{{ isLast ? L.seeResult : L.next }}<i class="ti ti-arrow-right" aria-hidden="true"></i>
			</button>
			<template v-else>
				<button type="button" class="_button" :class="[$style.btn, $style.ghost]" data-act="hint" @click="hint"><i class="ti ti-bulb" aria-hidden="true"></i>{{ L.hint }}</button>
				<button type="button" class="_button" :class="[$style.btn, $style.ghost]" data-act="show" @click="showAnswer"><i class="ti ti-eye" aria-hidden="true"></i>{{ L.show }}</button>
				<button type="submit" class="_button" :class="[$style.btn, $style.go]" data-act="check">{{ phase === 'wrong' ? L.checkAgain : L.check }}</button>
			</template>
		</div>
	</form>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, useTemplateRef } from 'vue';
import XBar from './vocab.bar.vue';
import XDiff from './vocab.diff.vue';
import type { VocabStop } from '@/lojo/vocab/content.js';
import type { Round, SpellEnd, SpellResult } from '@/lojo/vocab/round.js';
import { closestSpelling, exParts, hintOf, isRight, letterInfo, tidyTyped } from '@/lojo/vocab/spell.js';
import { audioError, audioKey, audioState, playWord, prefetchWord, stopWordAudio } from '@/lojo/vocab/audio.js';
import { vocabLabels as L } from '@/lojo/vocab/labels.js';
import { blip } from '@/lojo/dictation/sfx.js';
import { touchScreen } from '@/lojo/typing/device.js';
import { caretToEnd, keysForUs, useWindowKeys, wantsBox } from '@/lojo/typing/screen.js';

const props = defineProps<{
	stop: VocabStop;
	round: Round;
	sfx: boolean;
	// whether recordings can be made at all (lojo/english/status)
	speech: boolean;
}>();

const emit = defineEmits<{
	(ev: 'record', result: SpellResult): void;
	(ev: 'finish', end: SpellEnd): void;
	(ev: 'exit'): void;
	(ev: 'toggleSfx'): void;
}>();

// ask: not answered yet; wrong: a wrong spelling to put right; right: spelled right (moves on by itself); shown: the
// answer is shown, to copy once or to go on from
type Phase = 'ask' | 'wrong' | 'right' | 'shown';
// what the line under the box says
type Feedback =
	| { k: 'none' }
	| { k: 'need' }
	| { k: 'right'; how: 'first' | 'fixed' | 'shown' }
	| { k: 'wrong'; typed: string; again: boolean }
	| { k: 'hint'; at: number; letter: string }
	| { k: 'hintDone' }
	| { k: 'shown'; last: string };

const KEY = 'vocab-round:';
const inputId = `vocab-spell-${useId()}`;
const rootEl = useTemplateRef('rootEl');
const inputEl = useTemplateRef('inputEl');

const i = ref(0);
const phase = ref<Phase>('ask');
const typed = ref('');
const fb = shallowRef<Feedback>({ k: 'none' });
const results = shallowRef<SpellResult[]>([]);
const shaking = ref(false);
// the word on screen: wrong tries, whether a hint or the answer was used, whether it is recorded, the last wrong try
let attempts = 0;
let hinted = false;
let revealed = false;
let recorded = false;
let last = '';
let finished = false;
let timer: number | null = null;
const startedAt = Date.now();

const word = computed(() => props.round.words[i.value]);
const group = computed(() => props.stop.groups[word.value.group] ?? null);
const ex = computed(() => exParts(word.value));
const lettersText = computed(() => {
	const n = letterInfo(word.value.w);
	return L.letters(n.letters, n.words, n.hyphen);
});
const isLast = computed(() => i.value >= props.round.words.length - 1);
const sub = computed(() => `${props.stop.band.toFixed(1)} ${props.stop.topic} · ${props.round.label}`);

const mine = computed(() => audioKey.value === KEY + word.value.key);
const loading = computed(() => mine.value && audioState.value === 'loading');
const audioNote = computed(() => {
	if (!mine.value) return null;
	if (audioState.value === 'blocked') return L.audioBlocked;
	if (audioState.value === 'failed') return (audioError.value != null ? L.audioErrors[audioError.value] : null) ?? L.audioFailed;
	return null;
});

function clearTimer() {
	if (timer != null) window.clearTimeout(timer);
	timer = null;
}

function focusBox() {
	inputEl.value?.focus({ preventScroll: true });
	caretToEnd(inputEl.value);
}

function play(slow: boolean) {
	if (!props.speech) return;
	void playWord(KEY + word.value.key, word.value.w, slow);
	if (phase.value !== 'right') focusBox();
}

function nudge() {
	shaking.value = false;
	window.requestAnimationFrame(() => {
		shaking.value = true;
	});
}

// A word comes up: 听音拼写 reads it; the recordings coming up next are asked for now.
function begin() {
	clearTimer();
	phase.value = 'ask';
	typed.value = '';
	fb.value = { k: 'none' };
	attempts = 0;
	hinted = false;
	revealed = false;
	recorded = false;
	last = '';
	if (props.speech) {
		if (props.round.mode === 'listen') play(false);
		else prefetchWord(word.value.w);
		const after = props.round.words.at(i.value + 1);
		if (after != null && props.round.mode === 'listen') prefetchWord(after.w);
	}
	focusBox();
}

// Each word once: right the first time, or not.
function record(first: boolean) {
	if (recorded) return;
	recorded = true;
	const r: SpellResult = { word: word.value, first, hinted, revealed, last };
	results.value = [...results.value, r];
	emit('record', r);
}

function submit() {
	if (finished) return;
	if (phase.value === 'right') {
		next();
		return;
	}
	const v = typed.value;
	if (tidyTyped(v) === '') {
		if (phase.value === 'shown') {
			next();
			return;
		}
		fb.value = { k: 'need' };
		nudge();
		return;
	}
	if (isRight(word.value, v)) {
		const first = phase.value === 'ask' && attempts === 0 && !hinted;
		record(first);
		fb.value = { k: 'right', how: first ? 'first' : revealed ? 'shown' : 'fixed' };
		phase.value = 'right';
		if (props.sfx) blip('ok');
		if (props.round.mode === 'meaning') play(false);
		timer = window.setTimeout(next, first ? 1300 : 1600);
		return;
	}
	attempts++;
	last = v;
	if (props.sfx) blip('bad');
	nudge();
	if (phase.value === 'shown') {
		fb.value = { k: 'wrong', typed: v, again: true };
		return;
	}
	phase.value = 'wrong';
	fb.value = { k: 'wrong', typed: v, again: false };
	inputEl.value?.select();
}

// The word up to the first letter that is wrong or missing goes into the box. The word then doesn't count as right.
function hint() {
	if (phase.value === 'right' || phase.value === 'shown') return;
	const target = tidyTyped(typed.value) !== '' ? closestSpelling(word.value, typed.value) : word.value.w;
	const h = hintOf(target, typed.value);
	if (h == null) {
		fb.value = { k: 'hintDone' };
		focusBox();
		return;
	}
	hinted = true;
	typed.value = h.text;
	fb.value = { k: 'hint', at: h.at, letter: Array.from(target)[h.at] ?? '' };
	window.requestAnimationFrame(focusBox);
}

function showAnswer() {
	if (phase.value === 'right' || phase.value === 'shown') return;
	revealed = true;
	record(false);
	phase.value = 'shown';
	fb.value = { k: 'shown', last };
	typed.value = '';
	focusBox();
	play(false);
}

function next() {
	clearTimer();
	if (finished) return;
	// a word left without an answer isn't right
	if (!recorded) record(false);
	if (i.value + 1 >= props.round.words.length) {
		finish(false);
		return;
	}
	i.value++;
	begin();
}

function finish(early: boolean) {
	if (finished) return;
	finished = true;
	clearTimer();
	stopWordAudio();
	emit('finish', { kind: 'spell', results: results.value, ms: Date.now() - startedAt, early });
}

// Ending with words done shows what they came to; with none, back to the practice tab.
function exit() {
	if (results.value.length > 0) finish(results.value.length < props.round.words.length);
	else emit('exit');
}

// On a computer: ` reads the word again (听音拼写), Enter goes on once the word is done, and typing anywhere on the page
// goes into the box.
useWindowKeys(ev => {
	if (finished || !keysForUs(ev, rootEl.value)) return;
	if (props.round.mode === 'listen' && ev.key === '`' && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
		ev.preventDefault();
		play(false);
		return;
	}
	const target = ev.target instanceof Element ? ev.target : null;
	if (ev.key === 'Enter' && (phase.value === 'right' || phase.value === 'shown') && target?.closest('button, a, input, textarea') == null) {
		ev.preventDefault();
		next();
		return;
	}
	if (touchScreen || phase.value === 'right' || !wantsBox(ev)) return;
	inputEl.value?.focus({ preventScroll: true });
}, true);

onMounted(begin);

onBeforeUnmount(() => {
	clearTimer();
	if (audioKey.value?.startsWith(KEY)) stopWordAudio();
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
}

.card {
	position: relative;
	margin: 14px 0;
	padding: 16px 18px 20px;
	border-radius: 22px;
	background: var(--MI_THEME-panel);
	box-shadow: var(--vl-shadow);
	text-align: center;
	overflow: hidden;
	animation: cardIn 0.32s cubic-bezier(0.2, 0.9, 0.3, 1);

	// the word's group, in its colour
	&::before {
		content: "";
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6px;
		background: var(--g, var(--vl-c));
	}

	&.right {
		box-shadow: inset 0 0 0 2px var(--vl-ok), var(--vl-shadow);
	}

	&.wrong {
		box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--vl-bad) 70%, transparent), var(--vl-shadow);
	}
}

.grp {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 3px 11px 3px 9px;
	border-radius: 999px;
	background: var(--vl-hi);
	font-size: 12px;

	> i {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--g, var(--vl-c));
	}
}

.zh {
	margin: 18px 0 8px;
	font-size: 26px;
	font-weight: 700;
	line-height: 1.35;
	color: var(--vl-ink);

	> .pos {
		font-size: 17px;
	}
}

.pos {
	margin-right: 6px;
	font-family: var(--vl-pos);
	font-style: italic;
	font-weight: 400;
	color: var(--vl-weak);
}

.ex {
	max-width: 34em;
	margin: 0 auto;
	font-size: 15px;
	line-height: 1.75;
}

// the word in its example, blanked out (about as wide as the word)
.gap {
	display: inline-block;
	width: calc(var(--n) * 0.58em + 0.6em);
	height: 1.05em;
	margin: 0 2px;
	vertical-align: -0.18em;
	border-bottom: 2.5px solid var(--vl-c);
	border-radius: 3px 3px 0 0;
	background: color-mix(in srgb, var(--vl-c) 7%, transparent);
}

.len {
	display: inline-block;
	margin: 10px 0 0;
	padding: 2px 10px;
	border-radius: 999px;
	background: var(--vl-cBg);
	color: var(--vl-cFg);
	font-size: 12px;
	font-weight: 600;
}

.listen {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 14px;
	margin: 20px 0 6px;
}

.bigPlay {
	display: grid;
	place-items: center;
	width: 84px;
	height: 84px;
	border-radius: 50%;
	background: var(--vl-c);
	color: var(--vl-onC);
	font-size: 38px;
	box-shadow: 0 0 0 8px var(--vl-cBg), 0 10px 24px -8px color-mix(in srgb, var(--vl-c) 70%, transparent);
	transition: transform 0.12s;

	&:active {
		transform: scale(0.95);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 10px;
	}
}

.slow {
	min-height: 36px;
	padding: 0 13px;
	border-radius: 999px;
	background: var(--MI_THEME-buttonBg);
	color: var(--vl-ink);
	font-size: 13px;
	font-weight: 700;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.listenHint {
	margin: 10px 0 0;
	font-size: 13.5px;
	color: var(--vl-weak);
}

.noSpeech {
	margin: 18px 0 4px;
	font-size: 14px;

	> .ipa {
		display: block;
		margin-top: 6px;
		font-size: 24px;
		color: var(--vl-ink);
	}
}

.warn {
	margin: 8px 0 0;
	font-size: 12.5px;
	color: var(--vl-bad);
}

.ipa {
	font-family: var(--vl-ipa);
	color: var(--vl-weak);
}

.reveal {
	margin: 14px -18px -20px;
	padding: 14px 18px 16px;
	background: var(--vl-hi);
	text-align: left;
	animation: cardIn 0.3s ease;
}

.rvW {
	display: flex;
	align-items: flex-start;
	gap: 10px;
}

// the word and its IPA wrap under each other on a narrow screen; the speaker stays on the right
.rvWord {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 2px 10px;

	> b {
		font-size: 22px;
		color: var(--vl-ink);
		overflow-wrap: anywhere;
	}
}

.say {
	flex: none;
	display: inline-grid;
	place-items: center;
	width: 34px;
	height: 34px;
	border-radius: 50%;
	background: var(--vl-cBg);
	color: var(--vl-cFg);
	font-size: 17px;

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 1px;
	}
}

.alt {
	margin: 2px 0 0;
	font-size: 12.5px;
	color: var(--vl-weak);
}

.rvZh {
	margin: 2px 0 0;
	font-size: 14.5px;
}

.rvEx {
	margin: 4px 0 0;
	font-size: 13.5px;
	line-height: 1.6;

	> b {
		color: var(--vl-ink);
	}
}

.answer {
	margin: 0 0 6px;
}

.label {
	display: block;
	margin: 0 0 6px 4px;
	font-size: 12.5px;
	font-weight: 600;
	color: var(--vl-weak);
}

.box {
	display: block;
	box-sizing: border-box;
	width: 100%;
	height: 58px;
	padding: 0 16px;
	border: 0;
	border-radius: 16px;
	background: var(--MI_THEME-bg);
	color: var(--vl-ink);
	font-family: inherit;
	font-size: 23px;
	font-weight: 600;
	letter-spacing: 0.03em;
	text-align: center;
	box-shadow: inset 0 0 0 1.5px var(--vl-line);
	appearance: none;
	transition: box-shadow 0.15s;

	&::placeholder {
		font-size: 14px;
		font-weight: 400;
		letter-spacing: 0;
		color: color-mix(in srgb, var(--MI_THEME-fg) 45%, transparent);
	}

	&:focus {
		outline: none;
		box-shadow: inset 0 0 0 2px var(--MI_THEME-accent), 0 0 0 4px color-mix(in srgb, var(--MI_THEME-accent) 18%, transparent);
	}

	&[readonly] {
		color: var(--vl-ok);
	}

	&.bad:not([readonly]) {
		box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--vl-bad) 60%, transparent);
	}

	&.bad:not([readonly]):focus {
		box-shadow: inset 0 0 0 2px var(--vl-bad), 0 0 0 4px var(--vl-badBg);
	}
}

.nudge {
	animation: nudge 0.35s;
}

.fb {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	margin: 10px 0 0;
	font-size: 14px;
	text-align: center;

	&:empty {
		margin: 0;
	}
}

.okm,
.badm {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	font-size: 15px;
	font-weight: 800;
}

.okm {
	color: var(--vl-ok);
}

.badm {
	color: var(--vl-bad);
}

.soft {
	font-size: 13.5px;
	line-height: 1.65;

	> i {
		margin-right: 3px;
		color: var(--vl-gold);
	}
}

.hl {
	padding: 0 6px;
	border-radius: 5px;
	background: var(--vl-cBg);
	color: var(--vl-cFg);
	font-family: var(--vl-mono);
	font-size: 16px;
}

.acts {
	display: flex;
	gap: 8px;
	margin-top: 12px;
}

.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 5px;
	min-height: 46px;
	padding: 0 14px;
	border-radius: 999px;
	font-size: 14px;
	font-weight: 700;
	letter-spacing: 0.04em;
	white-space: nowrap;
	transition: background 0.15s;

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.go {
	flex: 1;
	background: var(--MI_THEME-cta);
	color: var(--MI_THEME-fgOnAccent);
	font-size: 15px;

	&:hover {
		background: hsl(from var(--MI_THEME-cta) h s calc(l + 5));
	}
}

.ghost {
	background: var(--MI_THEME-buttonBg);
	color: var(--vl-ink);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.spin {
	animation: spin 0.9s linear infinite;
}

@keyframes cardIn {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
}

@keyframes nudge {
	20%, 60% { transform: translateX(-6px); }
	40%, 80% { transform: translateX(6px); }
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
	.card,
	.reveal,
	.nudge,
	.spin {
		animation: none;
	}
}
</style>
