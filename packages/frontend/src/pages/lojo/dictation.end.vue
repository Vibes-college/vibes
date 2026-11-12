<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 听写: the end of a round. How many were right, accuracy, time and replays; the ones missed (each can be heard
again) with what was written and the rule; then practise the missed ones again, another round, or (from a gate) back
to the map to try the gate again. -->
<template>
<section :class="$style.card" :aria-labelledby="`${uid}-title`">
	<div :class="[$style.top, { [$style.all]: wrong.length === 0 }]">
		<span :class="$style.icon" aria-hidden="true"><i :class="wrong.length === 0 ? 'ti ti-check' : 'ti ti-target-arrow'"></i></span>
		<h2 :id="`${uid}-title`" ref="headingEl" tabindex="-1" :class="$style.verdict">{{ wrong.length === 0 ? dictLabels.allRight : dictLabels.done }}</h2>
		<b :class="$style.score" :aria-label="dictLabels.scoreLabel(right, total)">{{ right }}<span aria-hidden="true"> / {{ total }}</span></b>
		<p :class="$style.sub">{{ round.title }}</p>
		<XQuestBack app="dictation"/>
	</div>
	<div :class="$style.tiles">
		<div :class="$style.tile"><small>{{ dictLabels.accuracy }}</small><b>{{ accuracy }}<span>%</span></b></div>
		<div :class="$style.tile"><small>{{ dictLabels.time }}</small><b>{{ dictLabels.duration(seconds) }}</b></div>
		<div :class="$style.tile"><small>{{ dictLabels.replaysTile }}</small><b>{{ round.replays }}<span>{{ dictLabels.timesUnit }}</span></b></div>
	</div>
	<p v-if="round.replays > 0" :class="$style.note">{{ dictLabels.replayNote }}</p>

	<template v-if="wrong.length > 0">
		<div :class="$style.head">
			<h3>{{ dictLabels.wrongTitle(wrong.length) }}</h3>
			<span v-if="speech">{{ dictLabels.tapToHear }}</span>
		</div>
		<ul :class="$style.wrongs">
			<li v-for="r in wrong" :key="r.item.id">
				<span :class="$style.wx" aria-hidden="true">✗</span>
				<div :class="$style.body">
					<b lang="en" class="_selectable">{{ r.item.answer[0] }}</b>
					<small>
						<template v-if="r.verdict.reason === 'revealed'">{{ dictLabels.givenRevealed }}<template v-if="r.verdict.given">{{ dictLabels.givenRevealedWrote }}<s lang="en">{{ r.verdict.given }}</s></template></template>
						<template v-else-if="r.verdict.reason === 'word-limit'">{{ dictLabels.givenWordLimit }}<s lang="en">{{ r.verdict.given }}</s></template>
						<template v-else>{{ dictLabels.givenWrote }}<s lang="en">{{ r.verdict.given }}</s></template>
					</small>
					<small v-if="ruleOf(r.item)" :class="$style.rule">{{ ruleOf(r.item) }}</small>
				</div>
				<button
					v-if="speech"
					class="_button"
					:class="$style.hear"
					:aria-label="dictLabels.hearAgain(r.item.answer[0])"
					:title="dictLabels.hearAgain(r.item.answer[0])"
					@click="hear(r.item)"
				>
					<i :class="audioKey === `dictation-end:${r.item.id}` && audioState === 'loading' ? 'ti ti-loader-2' : 'ti ti-volume'" aria-hidden="true"></i>
				</button>
			</li>
		</ul>
	</template>
	<p v-else :class="$style.allRight">{{ dictLabels.noneWrong }}</p>
	<p v-if="fixed.length > 0" :class="$style.fixed">
		{{ dictLabels.fixedList(fixed.length) }}
		<b v-for="r in fixed" :key="r.item.id" lang="en">{{ r.item.answer[0] }}</b>
	</p>
	<p v-if="wordsAdded > 0" :class="$style.words">
		<i class="ti ti-notebook" aria-hidden="true"></i> {{ dictLabels.addedWords(wordsAdded) }}
		<a href="/apps/wordbook/" class="_link">{{ dictLabels.openWordbook }}</a>
	</p>

	<div :class="$style.acts">
		<MkButton v-if="wrong.length > 0" primary rounded large @click="emit('retry')">
			<i class="ti ti-refresh" aria-hidden="true"></i> {{ dictLabels.retryWrong(wrong.length) }}
		</MkButton>
		<MkButton :primary="wrong.length === 0" rounded large @click="emit('more')">
			<i class="ti ti-arrows-shuffle" aria-hidden="true"></i> {{ dictLabels.another }}
		</MkButton>
		<MkButton v-if="fromGate" rounded large @click="emit('map')">
			<i class="ti ti-map-2" aria-hidden="true"></i> {{ fromGate.station ? dictLabels.backToGate(fromGate.where) : dictLabels.backToMap }}
		</MkButton>
	</div>
	<div :class="$style.links">
		<MkA :to="`/guides/${guideSlug}`" :class="$style.guide">
			<i class="ti ti-book" aria-hidden="true"></i> {{ guideName ? dictLabels.guide(guideName) : dictLabels.guideGeneric }}
		</MkA>
		<button class="_button _textButton" @click="emit('home')">{{ dictLabels.home }}</button>
	</div>
</section>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, useId, useTemplateRef } from 'vue';
import type { DictItem, Round } from '@/lojo/dictation/content.js';
import MkButton from '@/components/MkButton.vue';
import XQuestBack from '@/lojo/QuestBack.vue';
import { audioKey, audioState, playAudio, stopAudio } from '@/lojo/dictation/audio.js';
import { dictLabels } from '@/lojo/dictation/labels.js';

const props = defineProps<{
	round: Round;
	// opened from a gate's result: where it was, and the station to try again (none after a placement test)
	fromGate: { where: string; station: string | null } | null;
	speech: boolean;
	guideSlug: string;
	guideName: string | null;
	wordsAdded: number;
}>();

const emit = defineEmits<{
	(ev: 'retry'): void;
	(ev: 'more'): void;
	(ev: 'map'): void;
	(ev: 'home'): void;
}>();

const uid = `dict-end-${useId()}`;
const headingEl = useTemplateRef('headingEl');
const total = computed(() => props.round.results.length);
const right = computed(() => props.round.results.filter(r => r.verdict.correct).length);
const accuracy = computed(() => (total.value > 0 ? Math.round(right.value / total.value * 100) : 0));
const seconds = computed(() => Math.max(0, Math.round((props.round.endedAt - props.round.startedAt) / 1000)));
const wrong = computed(() => props.round.results.filter(r => !r.verdict.correct));
// right in the end, after putting a letter right on the way
const fixed = computed(() => props.round.results.filter(r => r.verdict.correct && r.verdict.fixed != null));

const ruleOf = (item: DictItem) => item.rule ?? dictLabels.tagRules[item.setId] ?? null;

// The round is over: the focus goes to the result rather than being lost.
function focusHeading() {
	headingEl.value?.focus({ preventScroll: true });
}

defineExpose({ focusHeading });

function hear(item: DictItem) {
	void playAudio(`dictation-end:${item.id}`, item.say);
}

onBeforeUnmount(() => {
	if (audioKey.value?.startsWith('dictation-end:')) stopAudio();
});
</script>

<style lang="scss" module>
.card {
	--ok: color-mix(in srgb, #2F7D5B 82%, var(--MI_THEME-fg));
	--bad: var(--MI_THEME-error);
	--gold: color-mix(in srgb, #B8871B 72%, var(--MI_THEME-fg));
	--goldBg: color-mix(in srgb, #F2C14E 22%, var(--MI_THEME-panel));
	--hi: color-mix(in srgb, var(--MI_THEME-fg) 6%, var(--MI_THEME-panel));
	--weak: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
	--ink: var(--MI_THEME-fgHighlighted);
	position: relative;
	background: var(--MI_THEME-panel);
	border-radius: 22px;
	box-shadow: 0 1px 2px color-mix(in srgb, var(--ink) 6%, transparent), 0 10px 28px -10px color-mix(in srgb, var(--ink) 25%, transparent);
	padding: 22px 18px 18px;
}

.top {
	text-align: center;
	padding: 2px 0 14px;
}

.icon {
	width: 62px;
	height: 62px;
	border-radius: 50%;
	display: grid;
	place-items: center;
	margin: 0 auto 8px;
	font-size: 30px;
	background: color-mix(in srgb, var(--MI_THEME-cta) 12%, var(--MI_THEME-panel));
	color: var(--MI_THEME-cta);

	.all & {
		background: var(--ok);
		color: var(--MI_THEME-fgOnAccent);
		box-shadow: 0 0 0 10px color-mix(in srgb, var(--ok) 13%, transparent);
		animation: badge 0.6s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
}

@keyframes badge {
	from { transform: scale(0.2); }
}

.verdict {
	color: var(--ink);
	font-size: 24px;
	margin: 6px 0 2px;
	letter-spacing: 0.06em;

	// focused by the page when the round ends (tabindex -1, never reached by Tab). After an answer sent with Enter the
	// browser would count that focus as a keyboard one and ring the heading: no ring here at all.
	&:focus {
		outline: none;
	}
}

.score {
	display: block;
	font-size: 46px;
	font-weight: 800;
	line-height: 1.1;
	color: var(--ink);
	font-variant-numeric: tabular-nums;

	> span {
		font-size: 22px;
		color: var(--weak);
		font-weight: 600;
	}
}

.sub {
	margin: 4px 0 0;
	color: var(--weak);
	font-size: 13px;
}

.tiles {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 8px;
}

.tile {
	background: var(--hi);
	border-radius: 14px;
	padding: 10px 12px;

	small {
		display: block;
		color: var(--weak);
		font-size: 11.5px;
		margin-bottom: 2px;
	}

	b {
		font-size: 19px;
		color: var(--ink);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	b span {
		font-size: 12px;
		color: var(--weak);
		font-weight: 500;
	}
}

.note {
	font-size: 12px;
	color: var(--weak);
	margin: 8px 2px 0;
}

.head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	margin: 22px 0 4px;

	h3 {
		margin: 0;
		font-size: 18px;
		color: var(--ink);
	}

	span {
		font-size: 12.5px;
		color: var(--weak);
		text-align: right;
	}
}

.wrongs {
	list-style: none;
	margin: 0;
	padding: 0;

	li {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 12px 0;
		border-bottom: 1px solid var(--MI_THEME-divider);

		&:last-child {
			border-bottom: 0;
		}
	}
}

.wx {
	flex: none;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: var(--bad);
	color: var(--MI_THEME-fgOnAccent);
	display: grid;
	place-items: center;
	font-size: 12px;
	font-weight: 800;
	margin-top: 3px;
}

.body {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;

	b {
		font: 700 17px ui-monospace, "SF Mono", Menlo, Consolas, monospace;
		color: var(--ink);
		overflow-wrap: anywhere;
	}

	small {
		font-size: 12.5px;
		line-height: 1.55;
	}

	s {
		color: var(--bad);
		font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
		font-size: 13px;
	}
}

.rule {
	color: var(--weak);
}

.hear {
	flex: none;
	width: 36px;
	height: 36px;
	border-radius: 11px;
	display: grid;
	place-items: center;
	font-size: 18px;
	color: var(--ink);
	background: var(--hi);

	&:hover {
		background: var(--MI_THEME-buttonBg);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.allRight {
	margin: 14px 0 0;
	text-align: center;
	font-size: 13.5px;
	color: var(--ok);
	font-weight: 600;
}

.fixed {
	margin: 12px 0 0;
	padding: 8px 12px;
	border-radius: 12px;
	background: var(--goldBg);
	font-size: 12.5px;
	line-height: 1.8;

	b {
		margin-left: 6px;
		font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
		color: var(--ink);
	}
}

.words {
	margin: 12px 0 0;
	font-size: 12.5px;
	color: var(--weak);
}

.acts {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: 18px;
}

.links {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	margin-top: 14px;
}

.guide {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	color: var(--MI_THEME-accent);
	font-size: 13.5px;
	font-weight: 600;
}

@media (min-width: 720px) {
	.card {
		padding: 28px 28px 24px;
	}

	.acts {
		flex-direction: row;
		flex-wrap: wrap;

		> * {
			flex: 1;
		}
	}
}

@media (prefers-reduced-motion: reduce) {
	.all .icon {
		animation: none;
	}
}
</style>
