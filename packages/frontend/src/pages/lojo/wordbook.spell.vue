<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 生词本 review: the 拼写 card. The meaning, the word read out, and a box to spell it in. The first time, letter
boxes show the length and mark each letter as it is typed, and it checks itself once they are filled. Later reviews
give no hint: it moves on by itself only when the spelling is right, otherwise on Enter. Right the first time is
记得 (3), right after fixing a slip 2, wrong or 不会 忘了 (1); after a wrong answer "我会，只是手误" counts as 2.
Letters a Chinese keyboard is still composing are shown but not marked. -->
<template>
<XCard kind="spell" :first="item.first" :prompt="item.word.meaning" :promptId="promptId" :soundKey="soundKey" @listen="emit('listen')">
	<div
		v-if="showSlots"
		:class="$style.slots"
		:style="{ '--n': marks.cells.length }"
		:role="result ? 'img' : undefined"
		:aria-label="result ? `${wordbookLabels.yourTry} ${result.attempt}` : undefined"
		:aria-hidden="result ? undefined : 'true'"
	>
		<span
			v-for="(cell, i) in marks.cells"
			:key="i"
			:class="[$style.slot, composing && result == null ? undefined : $style[cell.state], { [$style.gap]: cell.space && (cell.state === 'ok' || cell.state === 'empty') }]"
		>{{ cell.ch === ' ' ? '␣' : cell.ch }}</span>
	</div>

	<template v-if="result == null">
		<p v-if="item.first" :id="statusId" :class="[$style.status, { [$style.statusBad]: status.bad, [$style.statusOk]: status.ok }]" aria-live="polite">{{ status.text }}</p>
		<label :for="inputId" :class="$style.label">{{ wordbookLabels.yourSpelling }}</label>
		<div :class="$style.typeRow">
			<input
				:id="inputId"
				ref="inputEl"
				:value="typed"
				:class="$style.input"
				type="text"
				inputmode="text"
				enterkeyhint="done"
				autocapitalize="off"
				autocorrect="off"
				autocomplete="off"
				spellcheck="false"
				lang="en"
				:maxlength="item.word.text.length + 10"
				:placeholder="wordbookLabels.spellPlaceholder"
				:aria-describedby="item.first ? `${promptId} ${statusId} ${tipId}` : `${promptId} ${tipId}`"
				@input="onInput"
				@keydown="onKeydown"
				@compositionstart="composing = true"
				@compositionend="onCompositionEnd"
			>
			<button type="button" class="_button" :class="$style.giveUp" @click="giveUp">{{ wordbookLabels.giveUp }}</button>
		</div>
		<p :id="tipId" :class="$style.tip">{{ item.first ? wordbookLabels.spellTipFirst : wordbookLabels.spellTip }}</p>
	</template>

	<template v-else>
		<p :class="[$style.verdict, result.right ? (result.rating === 3 ? $style.verdictOk : $style.verdictHard) : $style.verdictBad]">{{ verdict }}</p>
		<p v-if="!result.right" :class="$style.answer">
			<span :class="$style.answerLabel">{{ wordbookLabels.answerIs }}</span>
			<span class="_selectable" :class="$style.answerWord" lang="en">{{ item.word.text }}</span>
		</p>
		<XBack :word="item.word" :withMeaning="false" :exampleKey="exampleKey"/>
	</template>
	<!-- there from the start, so the verdict is read out even as the focus moves to 继续 -->
	<p :class="$style.sr" aria-live="polite">{{ announce }}</p>

	<template v-if="result" #actions>
		<div :class="$style.after">
			<button v-if="!result.right && !result.gaveUp" type="button" class="_button" :class="[$style.action, $style.typo]" @click="emit('rate', TYPO_RATING)">
				<b>{{ wordbookLabels.typo }}</b>
				<span>{{ wordbookLabels.backIn(typoIn) }}</span>
			</button>
			<button ref="nextEl" type="button" class="_button" :class="[$style.action, $style.next]" @click="emit('rate', result.rating)">
				<b>{{ wordbookLabels.next }}</b>
				<span>{{ wordbookLabels.backIn(nextIn) }}</span>
			</button>
		</div>
	</template>
</XCard>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, useId, useTemplateRef } from 'vue';
import XCard from './wordbook.card.vue';
import XBack from './wordbook.back.vue';
import type { WordReviewItem } from '@/lojo/english/wordbook.js';
import type { ReviewRating } from '@/lojo/english/review.js';
import { TYPO_RATING, letterCount, letterMarks, letterNumber, ratingInterval, slipped, spellRating, spellingFilled, spellingMatches } from '@/lojo/english/review.js';
import { wordbookLabels, wordbookLang } from '@/lojo/english/labels.js';

const props = defineProps<{
	item: WordReviewItem;
	// when the queue was fetched: the server's dates for each answer count from then
	fetchedAt: number;
	soundKey: string;
	exampleKey: string;
}>();

const emit = defineEmits<{
	(ev: 'rate', rating: ReviewRating): void;
	(ev: 'listen'): void;
	// the spelling has been judged; the answer buttons are up
	(ev: 'checked'): void;
}>();

const id = useId();
const inputId = `wordbook-spell-${id}`;
const statusId = `wordbook-spell-status-${id}`;
const promptId = `wordbook-spell-prompt-${id}`;
const tipId = `wordbook-spell-tip-${id}`;
const inputEl = useTemplateRef('inputEl');
const nextEl = useTemplateRef('nextEl');

type SpellResult = { right: boolean; gaveUp: boolean; rating: ReviewRating; attempt: string };

const typed = ref('');
const composing = ref(false);
const result = ref<SpellResult | null>(null);
const announce = ref('');
// what had been typed at the last input (a composing keyboard's letters not yet in), and the slips so far
const committed = ref('');
let slips = 0;

const answer = computed(() => props.item.word.text);
// the boxes show every letter in the field; only committed ones are marked and read out
const marks = computed(() => letterMarks(result.value?.attempt ?? typed.value, answer.value));
const judged = computed(() => letterMarks(committed.value, answer.value));
const showSlots = computed(() => props.item.first || (result.value != null && result.value.attempt !== ''));

const status = computed(() => {
	const m = judged.value;
	if (m.firstWrong >= 0) {
		const text = m.firstWrong >= m.length ? wordbookLabels.extraLetters(m.typed - m.length) : wordbookLabels.wrongLetter(letterNumber(answer.value, m.firstWrong));
		return { text, bad: true, ok: false };
	}
	if (m.typed > 0) return { text: wordbookLabels.soFarRight, bad: false, ok: true };
	const c = letterCount(answer.value);
	return { text: wordbookLabels.lettersHint(c.letters, c.words), bad: false, ok: false };
});

const verdict = computed(() => {
	const r = result.value;
	if (r == null) return '';
	if (r.right) return r.rating === 3 ? wordbookLabels.rightFirst : wordbookLabels.rightFixed;
	return r.gaveUp ? wordbookLabels.gaveUp : wordbookLabels.wrong;
});

const nextIn = computed(() => ratingInterval(props.item.next, result.value?.rating ?? 1, props.fetchedAt, wordbookLang));
const typoIn = computed(() => ratingInterval(props.item.next, TYPO_RATING, props.fetchedAt, wordbookLang));

// Each change: count a slip if the letters just typed went wrong. With the letter boxes, check once they are filled;
// without them, only once the spelling is right, so checking never gives the length away.
function take(): void {
	if (result.value != null || typed.value === committed.value) return;
	if (slipped(committed.value, typed.value, answer.value)) slips++;
	committed.value = typed.value;
	if (props.item.first ? spellingFilled(typed.value, answer.value) : spellingMatches(typed.value, answer.value)) check();
}

function onInput(ev: Event): void {
	typed.value = (ev.target as HTMLInputElement).value;
	// a Chinese keyboard composing letters: wait until it is done
	if ((ev as InputEvent).isComposing || composing.value) return;
	take();
}

function onCompositionEnd(ev: CompositionEvent): void {
	composing.value = false;
	typed.value = (ev.target as HTMLInputElement).value;
	take();
}

function onKeydown(ev: KeyboardEvent): void {
	// Enter that ends a Chinese keyboard's composing is not a check (Safari reports it as keyCode 229)
	if (ev.key !== 'Enter' || ev.isComposing || ev.keyCode === 229) return;
	ev.preventDefault();
	check();
}

function check(): void {
	if (result.value != null || typed.value.trim() === '') return;
	judge(spellingMatches(typed.value, answer.value), false);
}

function giveUp(): void {
	if (result.value != null) return;
	judge(false, true);
}

async function judge(right: boolean, gaveUp: boolean): Promise<void> {
	const rating = spellRating({ right, slips, gaveUp });
	result.value = { right, gaveUp, rating, attempt: typed.value.trim() };
	announce.value = right ? wordbookLabels.spelledRight(rating === 2) : wordbookLabels.spelledWrong(answer.value, gaveUp);
	emit('checked');
	// hear it again with the right spelling in front of you
	if (!right) emit('listen');
	await nextTick();
	nextEl.value?.focus({ preventScroll: true });
}

onMounted(() => {
	inputEl.value?.focus({ preventScroll: true });
});
</script>

<style lang="scss" module>
.slots {
	container-type: inline-size;
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 4px;
	margin: 22px 0 8px;
}

.slot {
	--w: max(18px, min(34px, calc((100cqw - (var(--n) - 1) * 4px) / var(--n))));
	flex: none;
	display: grid;
	place-items: center;
	width: var(--w);
	height: calc(var(--w) * 1.36);
	border-radius: 8px 8px 5px 5px;
	border-bottom: 3px solid var(--MI_THEME-divider);
	font-size: calc(var(--w) * 0.66);
	font-weight: bold;
	line-height: 1;
	color: var(--MI_THEME-brandInk);
	background: color-mix(in srgb, var(--MI_THEME-fg) 6%, var(--MI_THEME-panel));
	transition: background 0.12s;
}

.ok {
	color: var(--wbOkFg);
	background: var(--wbOkBg);
	border-color: var(--wbOk);
}

.bad,
.extra {
	color: var(--wbBadFg);
	background: var(--wbBadBg);
	border-color: var(--wbBad);
	text-decoration: line-through 2px;
}

.slot.gap {
	width: calc(var(--w) * 0.45);
	background: none;
	border-color: transparent;
}

.status {
	min-height: 1.5em;
	margin: 0 0 14px;
	font-size: 0.9em;
	opacity: 0.8;
}

.statusBad {
	font-weight: bold;
	color: var(--wbBadFg);
	opacity: 1;
}

.statusOk {
	font-weight: bold;
	color: var(--wbOkFg);
	opacity: 1;
}

.label {
	display: block;
	margin: 18px 2px 6px;
	text-align: left;
	font-size: 0.85em;
	font-weight: bold;
	color: var(--MI_THEME-brandInk);
}

.status + .label {
	margin-top: 0;
}

.typeRow {
	display: flex;
	gap: 8px;
}

.input {
	flex: 1;
	min-width: 0;
	height: 52px;
	box-sizing: border-box;
	padding: 0 14px;
	border: 2px solid var(--MI_THEME-inputBorder);
	border-radius: 15px;
	font-size: 19px;
	font-weight: 500;
	letter-spacing: 0.06em;
	color: var(--MI_THEME-brandInk);
	background: var(--MI_THEME-panel);

	&::placeholder {
		font-size: 15px;
		letter-spacing: 0.02em;
		color: color-mix(in srgb, var(--MI_THEME-fg) 45%, transparent);
	}

	&:hover {
		border-color: var(--MI_THEME-inputBorderHover);
	}

	&:focus {
		outline: none;
		border-color: var(--MI_THEME-accent);
		box-shadow: 0 0 0 4px var(--MI_THEME-accentedBg);
	}
}

.giveUp {
	flex: none;
	min-height: 52px;
	padding: 0 18px;
	border-radius: 15px;
	font-weight: bold;
	color: var(--MI_THEME-brandInk);
	background: var(--MI_THEME-buttonBg);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.tip {
	margin: 10px 0 0;
	font-size: 0.8em;
	opacity: 0.7;
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

.verdict {
	margin: 10px 0 0;
	padding: 10px 12px;
	border-radius: 14px;
	font-weight: bold;
}

.verdictOk {
	color: var(--wbOkFg);
	background: var(--wbOkBg);
}

.verdictHard {
	color: var(--wbGoldFg);
	background: var(--wbGoldBg);
}

.verdictBad {
	color: var(--wbBadFg);
	background: var(--wbBadBg);
}

.answer {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	margin: 14px 0 0;
}

.answerLabel {
	font-size: 13px;
	opacity: 0.7;
}

.answerWord {
	font: 600 30px / 1.2 var(--wbEn);
	color: var(--MI_THEME-brandInk);
	overflow-wrap: anywhere;
}

.after {
	display: grid;
	grid-auto-columns: 1fr;
	grid-auto-flow: column;
	gap: 10px;
}

.action {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	min-height: 64px;
	padding: 8px;
	border-radius: 18px;

	> b {
		font-size: 1.05em;
	}

	> span {
		font-size: 0.8em;
		font-variant-numeric: tabular-nums;
		opacity: 0.85;
	}

	&:active {
		transform: translateY(1px);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.typo {
	color: var(--wbGoldFg);
	background: var(--wbGoldBg);
}

.next {
	color: var(--MI_THEME-fgOnAccent);
	background: var(--MI_THEME-cta);

	&:hover {
		background: hsl(from var(--MI_THEME-cta) h s calc(l + 5));
	}
}
</style>
