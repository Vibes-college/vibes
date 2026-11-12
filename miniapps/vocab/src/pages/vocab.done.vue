<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 5 号线 · 词汇: the end of a round. 看义拼写 / 听音拼写: how many were right the first time; 打字: accuracy and
speed. The words got wrong (or typed with a slip), each with its sound and 加进生词本, and practising just those; the
same words in another mode; the gate once every word was right; back to the word list. -->
<template>
<div :class="$style.root" :data-done="round.mode">
	<div :class="$style.bar">
		<button type="button" class="_button" :class="$style.icon" :aria-label="L.backToWords" :title="L.backToWords" @click="emit('words')">
			<i class="ti ti-x" aria-hidden="true"></i>
		</button>
		<div :class="$style.text">
			<h1 :class="$style.title">{{ L.modes[round.mode].name }}</h1>
			<small>{{ sub }}</small>
		</div>
		<span :class="$style.count">{{ L.groupCount(count) }}</span>
	</div>

	<section :class="[$style.res, all ? $style.pass : $style.mid]" data-result>
		<div :class="$style.badge" aria-hidden="true">
			<i :class="all ? 'ti ti-check' : typing ? 'ti ti-keyboard' : 'ti ti-target'"></i>
		</div>
		<b :class="$style.score" :aria-label="scoreLabel" data-score>
			<template v-if="typing">{{ acc }}<span>%</span></template>
			<template v-else>{{ right }}<span> / {{ count }}</span></template>
		</b>
		<h2 ref="headingEl" :class="$style.verdict" tabindex="-1">{{ verdict }}</h2>
		<p :class="$style.meta">{{ meta }}</p>
		<XQuestBack app="vocab"/>
	</section>

	<section v-if="wrong.length > 0" :class="$style.missed" :aria-labelledby="`${uid}-missed`" data-round-missed>
		<h3 :id="`${uid}-missed`" :class="$style.h">{{ typing ? L.typedTitle : L.missedTitle }} <small>{{ typing ? L.typedSub(wrong.length) : L.missedSub(wrong.length) }}</small></h3>
		<XMissList :words="wrong" :notes="notes" :speech="speech"/>
		<button type="button" class="_button" :class="[$style.cta, $style.again]" data-again-missed @click="emit('again', typing ? 'meaning' : round.mode, wrong)">
			{{ typing ? L.againTyped : L.againMissed(wrong.length) }}<i class="ti ti-arrow-right" aria-hidden="true"></i>
		</button>
	</section>

	<div :class="$style.acts">
		<MkA v-if="all" :to="gatePath(stop.id)" :class="$style.cta" data-gate>{{ L.toGate }}<i class="ti ti-arrow-right" aria-hidden="true"></i></MkA>
		<div :class="$style.modes">
			<button v-for="m in others" :key="m" type="button" class="_button" :class="[$style.cta, $style.ghost]" :data-again-mode="m" @click="emit('again', m, null)">
				{{ L.switchTo(L.modes[m].name) }}
			</button>
		</div>
		<button type="button" class="_button" :class="[$style.cta, $style.ghost]" data-back-words @click="emit('words')">
			<i class="ti ti-list" aria-hidden="true"></i>{{ L.backToWords }}
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, useId, useTemplateRef } from 'vue';
import XMissList from './vocab.misslist.vue';
import XQuestBack from '@/lojo/QuestBack.vue';
import type { VocabStop, VocabWord } from '@/lojo/vocab/content.js';
import type { PracticeMode } from '@/lojo/vocab/prefs.js';
import type { Round, RoundEnd } from '@/lojo/vocab/round.js';
import { gatePath } from '@/lojo/vocab/content.js';
import { doneCount, wrongWords } from '@/lojo/vocab/round.js';
import { typingAccuracy, wordsPerMinute } from '@/lojo/vocab/spell.js';
import { vocabLabels as L } from '@/lojo/vocab/labels.js';

const props = defineProps<{
	stop: VocabStop;
	round: Round;
	end: RoundEnd;
	speech: boolean;
}>();

const emit = defineEmits<{
	// the same words in another mode (onlyWrong null), or just the ones got wrong
	(ev: 'again', mode: PracticeMode, onlyWrong: VocabWord[] | null): void;
	(ev: 'words'): void;
}>();

const MODES: PracticeMode[] = ['meaning', 'listen', 'typing'];
const uid = `vocab-done-${useId()}`;
const headingEl = useTemplateRef('headingEl');

const typing = computed(() => props.end.kind === 'typing');
const count = computed(() => doneCount(props.end));
const wrong = computed(() => wrongWords(props.round, props.end));
const all = computed(() => wrong.value.length === 0 && count.value > 0);
const right = computed(() => (props.end.kind === 'spell' ? props.end.results.filter(r => r.first).length : 0));
const acc = computed(() => (props.end.kind === 'typing' ? typingAccuracy(props.end.keys, props.end.errs) : 0));
const others = computed(() => MODES.filter(m => m !== props.round.mode));
const sub = computed(() => `${props.stop.band.toFixed(1)} ${props.stop.topic} · ${props.round.label}`);

const scoreLabel = computed(() => (typing.value ? L.accLabel(acc.value) : L.scoreLabel(right.value, count.value)));
const verdict = computed(() => {
	if (typing.value) return all.value ? L.typingAll : L.typingAcc;
	return all.value ? L.doneAll : L.doneSome(right.value);
});
const meta = computed(() => {
	const e = props.end;
	if (e.kind === 'typing') return `${L.typingMeta(wordsPerMinute(e.done, e.typedMs), e.done, e.early)} · ${L.took(e.ms)}`;
	return e.early ? `${L.early(e.results.length)} · ${L.took(e.ms)}` : L.took(e.ms);
});
// 打字: how many wrong keys each word took
const notes = computed(() => {
	const e = props.end;
	if (e.kind !== 'typing') return undefined;
	return Object.fromEntries(wrong.value.map(w => [w.key, L.typedTimes(e.errsBy[w.key] ?? 0)]));
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
}

.bar {
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 56px;
}

.icon {
	flex: none;
	display: grid;
	place-items: center;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: var(--MI_THEME-panel);
	box-shadow: var(--vl-shadow);
	color: var(--vl-ink);
	font-size: 18px;

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.text {
	flex: 1;
	min-width: 0;
	line-height: 1.3;

	> small {
		display: block;
		font-size: 12px;
		color: var(--vl-weak);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
}

.title {
	margin: 0;
	font-family: var(--vl-serif);
	font-size: 17px;
	font-weight: 700;
	color: var(--vl-ink);
}

.count {
	font-size: 15px;
	font-weight: 700;
	color: var(--vl-ink);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

.res {
	margin: 14px 0;
	padding: 26px 16px 20px;
	border-radius: 22px;
	text-align: center;

	&.pass {
		background: var(--vl-okBg);
	}

	&.mid {
		background: var(--vl-cBg);
	}
}

.badge {
	display: grid;
	place-items: center;
	width: 68px;
	height: 68px;
	margin: 0 auto 10px;
	border-radius: 50%;
	color: var(--vl-onC);
	font-size: 34px;
	animation: badge 0.6s cubic-bezier(0.2, 1.6, 0.4, 1) both;

	.pass > & {
		background: var(--vl-ok);
		box-shadow: 0 0 0 10px color-mix(in srgb, var(--vl-ok) 14%, transparent);
	}

	.mid > & {
		background: var(--vl-c);
		box-shadow: 0 0 0 10px color-mix(in srgb, var(--vl-c) 14%, transparent);
	}
}

.score {
	display: block;
	font-size: 46px;
	line-height: 1.1;
	color: var(--vl-ink);
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.02em;

	> span {
		font-size: 20px;
		font-weight: 600;
		letter-spacing: 0;
		color: var(--vl-weak);
	}
}

.verdict {
	margin: 4px 0 2px;
	font-family: var(--vl-serif);
	font-size: 22px;
	font-weight: 700;
	color: var(--vl-ink);

	// focused by the page when the round ends (tabindex -1, never by Tab): no ring for that
	&:focus {
		outline: none;
	}

	.pass > & {
		color: var(--vl-ok);
	}
}

.meta {
	margin: 6px 0 0;
	font-size: 12.5px;
	color: var(--vl-weak);
}

.missed {
	margin: 0 0 14px;
	padding: 14px 14px 16px;
	border-radius: 18px;
	background: var(--vl-badBg);
}

.h {
	margin: 0 0 6px;
	font-family: var(--vl-serif);
	font-size: 16px;
	font-weight: 700;
	color: var(--vl-ink);

	> small {
		margin-left: 6px;
		font-size: 12.5px;
		font-weight: 400;
		color: var(--vl-weak);
	}
}

.acts {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin: 0 0 16px;
}

.modes {
	display: flex;
	gap: 8px;

	> .cta {
		flex: 1;
		min-width: 0;
		padding: 0 10px;
	}
}

.cta {
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	width: 100%;
	min-height: 48px;
	padding: 0 14px;
	border-radius: 15px;
	background: var(--MI_THEME-cta);
	color: var(--MI_THEME-fgOnAccent);
	font-size: 15px;
	font-weight: 700;
	line-height: 1.3;
	letter-spacing: 0.04em;
	text-align: center;
	text-decoration: none;
	transition: background 0.15s;

	&:hover {
		background: hsl(from var(--MI_THEME-cta) h s calc(l + 5));
		text-decoration: none;
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.ghost {
	background: var(--MI_THEME-buttonBg);
	color: var(--vl-ink);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.again {
	margin-top: 12px;
}

@keyframes badge {
	from {
		transform: scale(0.2);
	}
}

@media (prefers-reduced-motion: reduce) {
	.badge {
		animation: none;
	}
}
</style>
