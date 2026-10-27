<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- After handing in: the score, what to do next, where to practise what went wrong, the answers and the transcript. -->
<template>
<div :class="$style.root">
	<section :class="[$style.score, result.passed ? $style.pass : $style.fail]" aria-live="polite">
		<i :class="[result.passed ? 'ti ti-circle-check-filled' : 'ti ti-target-arrow', $style.scoreIcon]" aria-hidden="true"></i>
		<b :class="$style.big" :aria-label="gateLabels.scoreLabel(result.score, result.total)">{{ gateLabels.score(result.score, result.total) }}</b>
		<p :class="$style.verdict">{{ result.passed ? gateLabels.passed : gateLabels.missing(result.missing) }}</p>
		<p v-if="result.passed && result.unlocked.length > 0" :class="$style.sub">{{ gateLabels.unlocked(result.unlocked.length) }}</p>
		<p :class="$style.meta">
			{{ title }} · {{ gateLabels.setName(result.set) }} · {{ gateLabels.passLine(result.pass) }} · {{ gateLabels.timeUsed(gateLabels.duration(result.durationMs)) }}
		</p>
		<p :class="$style.level">{{ gateLabels.practiceLevel }}</p>
	</section>

	<div :class="$style.actions">
		<MkButton v-if="result.passed && result.next" primary rounded large @click="emit('go', result.next)">
			<i class="ti ti-arrow-right"></i> {{ gateLabels.next(stationTitle(result.next)) }}
		</MkButton>
		<MkButton :primary="!result.passed" rounded large @click="emit('again')">
			<i class="ti ti-refresh"></i> {{ gateLabels.again }}
		</MkButton>
		<MkButton rounded large @click="emit('back')">
			<i class="ti ti-map-2"></i> {{ gateLabels.backToMap }}
		</MkButton>
	</div>

	<section v-if="!result.passed && result.failStreak >= 3" :class="$style.streak">
		<p>{{ gateLabels.streak(result.failStreak, previous != null) }}</p>
		<MkButton v-if="previous" rounded small @click="emit('go', previous.id)">
			<i class="ti ti-arrow-left"></i> {{ gateLabels.previous(stationTitle(previous.id)) }}
		</MkButton>
	</section>

	<section v-if="cards.length > 0 || result.tutor" :class="$style.practice">
		<h2 :class="$style.h2">{{ gateLabels.practiceTitle }}</h2>
		<div v-for="card in cards" :key="card.tag" :class="$style.card">
			<b :class="$style.cardHead">{{ tagName(card.tag) }} <small>{{ gateLabels.wrongCount(card.count) }}</small></b>
			<div :class="$style.links">
				<MkA v-if="card.guide && guides[card.guide]" :to="`/guides/${card.guide}`" :class="$style.link">
					<i class="ti ti-book"></i> {{ gateLabels.guide }} · {{ guides[card.guide] }}
				</MkA>
				<MkA v-if="card.app" :to="card.app.path" :class="$style.link">
					<i class="ti ti-apps"></i> {{ gateLabels.app }} · {{ card.app[gateLang] }}
				</MkA>
				<MkA v-for="topic in card.topics" :key="topic" :to="`/tags/${encodeURIComponent(topic)}`" :class="$style.link">
					<i class="ti ti-hash"></i> {{ topic }}
				</MkA>
			</div>
		</div>
		<MkA v-if="result.tutor" :to="`/chat/user/${result.tutor.id}`" :class="[$style.card, $style.tutor]">
			<i class="ti ti-message-circle-2" aria-hidden="true"></i>
			<span>
				<b>{{ gateLabels.askTutor(result.tutor.name ?? result.tutor.username) }}</b>
				<small>{{ gateLabels.tutorHint }}</small>
			</span>
		</MkA>
	</section>

	<section :class="$style.review">
		<h2 :class="$style.h2">{{ gateLabels.reviewTitle }}</h2>
		<ol :class="$style.items">
			<li v-for="item in result.items" :key="item.n" :class="[$style.row, item.correct ? $style.right : $style.wrong]">
				<span :class="$style.n">{{ item.n }}</span>
				<div :class="$style.rowBody">
					<p v-if="refs.get(item.n)?.prompt" :class="$style.prompt" lang="en">{{ refs.get(item.n)?.prompt }}</p>
					<p :class="$style.answerLine">
						<span :class="$style.label">{{ gateLabels.yours }}</span>
						<span lang="en">{{ item.given === '' ? gateLabels.blank : shown(item.n, item.given) }}</span>
						<span :class="[$style.chip, item.correct ? $style.chipOk : $style.chipBad]">{{ item.correct ? gateLabels.right : gateLabels.reasons[item.reason ?? 'wrong'] }}</span>
					</p>
					<p v-if="!item.correct" :class="$style.answerLine">
						<span :class="$style.label">{{ gateLabels.answer }}</span>
						<b lang="en">{{ shown(item.n, item.expected) }}</b>
					</p>
					<p v-if="others(item).length > 0" :class="$style.also">{{ gateLabels.alsoAccepted }}: <span lang="en">{{ others(item).join(' / ') }}</span></p>
				</div>
			</li>
		</ol>
	</section>

	<section :class="$style.transcript">
		<button class="_button" :class="$style.toggle" :aria-expanded="showScript" @click="showScript = !showScript">
			<i :class="showScript ? 'ti ti-chevron-up' : 'ti ti-chevron-down'"></i> {{ showScript ? gateLabels.transcriptTitle : gateLabels.seeTranscript }}
		</button>
		<div v-if="showScript" :class="$style.script" lang="en">
			<template v-for="(line, i) in result.script" :key="i">
				<p v-if="line.pause != null" :class="$style.pause">{{ gateLabels.pause(line.pause) }}</p>
				<p v-else :class="[$style.say, { [$style.hit]: line.answers.length > 0 }]">
					<b :class="$style.who">{{ line.who }}</b>
					<span>{{ line.text }}</span>
					<span v-for="n in line.answers" :key="n" :class="$style.qchip">{{ gateLabels.answerChip(n) }}</span>
				</p>
			</template>
		</div>
	</section>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { guideTitle } from '@/lojo/gates/api.js';
import { gateLabels, gateLang } from '@/lojo/gates/labels.js';
import { bandText, letterText, questionRefs, recommendCards, stationBand } from '@/lojo/gates/player.js';
import type { GateAttempt, GatePack, GateResult, GateResultItem, PackStation } from '@/lojo/gates/player.js';

const props = defineProps<{
	result: GateResult;
	attempt: GateAttempt;
	pack: GatePack;
	// e.g. "听力 · 5.0"
	title: string;
	lineName: string;
	previous: PackStation | null;
}>();

const emit = defineEmits<{
	(ev: 'again'): void;
	(ev: 'back'): void;
	(ev: 'go', station: string): void;
}>();

const showScript = ref(false);
const refs = computed(() => questionRefs(props.attempt.groups));
const cards = computed(() => recommendCards(props.result.weak, props.pack.PRACTICE));
const tagName = (tag: string) => props.pack.TAGS[tag]?.[gateLang] ?? tag;

// "听力 · 4.5": stations on the same line are named by their band.
function stationTitle(id: string): string {
	const band = stationBand(props.pack, id);
	return band == null ? id : gateLabels.stationTitle(props.lineName, bandText(band));
}

// A letter answer reads with its words: "B: the roof was damaged".
function shown(n: number, value: string): string {
	const ref = refs.value.get(n);
	const words = ref ? letterText(ref.group, ref.item, value) : null;
	return words ? gateLabels.letterOption(value, words) : value;
}

// Other spellings that also count (for gaps): not the one shown as the answer, nor what was written.
function others(item: GateResultItem): string[] {
	if (refs.value.get(item.n)?.group.type !== 'form') return [];
	return item.accepted.filter(a => a !== item.expected && a.toLowerCase() !== item.given.toLowerCase());
}

// Guide cards show only once the guide's title has loaded; a guide that is gone is left out.
const guides = ref<Record<string, string>>({});
watch(cards, list => {
	for (const card of list) {
		if (card.guide == null || card.guide in guides.value) continue;
		const id = card.guide;
		guideTitle(id).then(t => { guides.value = { ...guides.value, [id]: t }; }, () => { /* left out */ });
	}
}, { immediate: true });
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.score {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	padding: 24px 16px 18px;
	border-radius: var(--MI-radius);
	text-align: center;
	background: var(--MI_THEME-panel);

	&.pass {
		background: color-mix(in srgb, var(--MI_THEME-success) 14%, var(--MI_THEME-panel));
	}
}

.scoreIcon {
	font-size: 34px;

	.pass & {
		color: var(--MI_THEME-success);
	}

	.fail & {
		color: var(--MI_THEME-accent);
	}
}

.big {
	font-size: 2.6em;
	font-variant-numeric: tabular-nums;
	line-height: 1.1;
}

.verdict {
	margin: 0;
	font-size: 1.2em;
	font-weight: bold;
}

.sub {
	margin: 0;
}

.meta {
	margin: 6px 0 0;
	font-size: 0.85em;
	opacity: 0.8;
}

.level {
	margin: 0;
	font-size: 0.75em;
	opacity: 0.6;
}

.actions {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 8px;
}

.streak {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
	padding: 12px 14px;
	border-radius: var(--MI-radius);
	border: 1px solid var(--MI_THEME-warn);

	p {
		margin: 0;
	}
}

.h2 {
	margin: 0 0 4px;
	font-size: 1em;
}

.practice {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.card {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px 14px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
}

.cardHead small {
	margin-left: 6px;
	font-weight: normal;
	opacity: 0.7;
}

.links {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.link {
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 0.9em;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);

	&:hover {
		text-decoration: none;
	}
}

.tutor {
	flex-direction: row;
	align-items: center;
	gap: 12px;
	color: inherit;

	&:hover {
		text-decoration: none;
	}

	> i {
		font-size: 24px;
		color: var(--MI_THEME-accent);
	}

	span {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	small {
		opacity: 0.75;
	}
}

.review {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.items {
	margin: 0;
	padding: 0;
	list-style: none;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.row {
	display: flex;
	gap: 10px;
	padding: 10px 12px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
	border-left: 4px solid transparent;

	&.right {
		border-left-color: var(--MI_THEME-success);
	}

	&.wrong {
		border-left-color: var(--MI_THEME-error);
	}
}

.n {
	flex-shrink: 0;
	min-width: 1.8em;
	font-weight: bold;
	opacity: 0.7;
}

.rowBody {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;

	p {
		margin: 0;
		overflow-wrap: anywhere;
	}
}

.prompt {
	font-size: 0.85em;
	opacity: 0.7;
}

.answerLine {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 6px;
}

.label {
	font-size: 0.8em;
	opacity: 0.65;
}

.chip {
	padding: 0 8px;
	border-radius: 999px;
	font-size: 0.75em;
	font-weight: bold;
}

.chipOk {
	color: var(--MI_THEME-success);
	background: color-mix(in srgb, var(--MI_THEME-success) 14%, transparent);
}

.chipBad {
	color: var(--MI_THEME-error);
	background: color-mix(in srgb, var(--MI_THEME-error) 12%, transparent);
}

.also {
	font-size: 0.8em;
	opacity: 0.75;
}

.transcript {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.toggle {
	align-self: flex-start;
	padding: 8px 14px;
	border-radius: 999px;
	font-weight: bold;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.script {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 12px 14px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
	line-height: 1.6;

	p {
		margin: 0;
	}
}

.pause {
	font-size: 0.85em;
	opacity: 0.6;
}

.say.hit {
	margin: 0 -6px;
	padding: 2px 6px;
	border-radius: 6px;
	background: color-mix(in srgb, var(--MI_THEME-warn) 16%, transparent);
}

.who {
	display: inline-block;
	min-width: 1.4em;
	margin-right: 6px;
	opacity: 0.6;
}

.qchip {
	margin-left: 6px;
	padding: 0 6px;
	border-radius: 999px;
	font-size: 0.75em;
	font-weight: bold;
	color: var(--MI_THEME-fgOnAccent);
	background: var(--MI_THEME-accent);
	white-space: nowrap;
}
</style>
