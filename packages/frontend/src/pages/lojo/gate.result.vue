<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- After handing in: the score (or, for a placement test, the station to start at), what to do next, where to practise
what went wrong, the answers and the transcript. -->
<template>
<div :class="$style.root">
	<section v-if="placedAt" :class="[$style.score, $style.pass]" aria-live="polite">
		<i :class="['ti ti-map-pin-filled', $style.scoreIcon]" aria-hidden="true"></i>
		<p :class="$style.verdict">{{ gateLabels.placedTitle }}</p>
		<b :class="$style.big">{{ stationTitle(placedAt) }}</b>
		<p :class="$style.sub">{{ gateLabels.placedAt }}{{ result.unlocked.length > 0 ? `${gateLang === 'zh' ? '' : ' '}${gateLabels.placedLit(result.unlocked.length)}` : '' }}</p>
		<p :class="$style.meta">
			{{ gateLabels.placedTotal(result.placement!.score, result.placement!.total) }} · {{ gateLabels.timeUsed(gateLabels.duration(durationMs)) }}
		</p>
		<p :class="$style.level">{{ gateLabels.placedNote }}</p>
	</section>
	<section v-else :class="[$style.score, result.passed ? $style.pass : $style.fail]" aria-live="polite">
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
		<template v-if="placedAt">
			<MkButton primary rounded large @click="emit('go', placedAt)">
				<i class="ti ti-arrow-right"></i> {{ gateLabels.goPlaced(stationTitle(placedAt)) }}
			</MkButton>
		</template>
		<template v-else>
			<MkButton v-if="result.passed && result.next" primary rounded large @click="emit('go', result.next)">
				<i class="ti ti-arrow-right"></i> {{ gateLabels.next(stationTitle(result.next)) }}
			</MkButton>
			<MkButton :primary="!result.passed" rounded large @click="emit('again')">
				<i class="ti ti-refresh"></i> {{ gateLabels.again }}
			</MkButton>
		</template>
		<MkButton rounded large @click="emit('back')">
			<i class="ti ti-map-2"></i> {{ gateLabels.backToMap }}
		</MkButton>
	</div>

	<section v-if="!placedAt && !result.passed && result.failStreak >= 3" :class="$style.streak">
		<p>{{ gateLabels.streak(result.failStreak, previous != null) }}</p>
		<MkButton v-if="previous" rounded small @click="emit('go', previous.id)">
			<i class="ti ti-arrow-left"></i> {{ gateLabels.previous(stationTitle(previous.id)) }}
		</MkButton>
	</section>

	<section v-if="anyWrong && (cards.length > 0 || result.tutor)" :class="$style.practice">
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

	<template v-if="earlier">
		<XReview :result="earlier.result" :attempt="earlier.attempt" :title="gateLabels.partFirst"/>
		<XReview :result="result" :attempt="attempt" :title="gateLabels.partSecond"/>
	</template>
	<XReview v-else :result="result" :attempt="attempt"/>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import XReview from './gate.review.vue';
import MkButton from '@/components/MkButton.vue';
import { guideTitle } from '@/lojo/gates/api.js';
import { gateLabels, gateLang } from '@/lojo/gates/labels.js';
import { bandText, recommendCards, stationBand } from '@/lojo/gates/player.js';
import type { GateAttempt, GatePack, GateResult, PackStation } from '@/lojo/gates/player.js';

const props = defineProps<{
	result: GateResult;
	attempt: GateAttempt;
	pack: GatePack;
	// e.g. "听力 · 5.0"
	title: string;
	lineName: string;
	previous: PackStation | null;
	// a placement test's first part, reviewed above its second
	earlier?: { result: GateResult; attempt: GateAttempt } | null;
}>();

const emit = defineEmits<{
	(ev: 'again'): void;
	(ev: 'back'): void;
	(ev: 'go', station: string): void;
}>();

// A placement test's second part says where the learner starts.
const placedAt = computed(() => props.result.placement?.placedAt ?? null);
const durationMs = computed(() => props.result.durationMs + (props.earlier?.result.durationMs ?? 0));

// What went wrong in both parts of a placement test, or in this gate.
const weak = computed(() => {
	const counts = new Map<string, number>();
	for (const w of [...(props.earlier?.result.weak ?? []), ...props.result.weak]) counts.set(w.tag, (counts.get(w.tag) ?? 0) + w.count);
	return [...counts].map(([tag, count]) => ({ tag, count }));
});
const cards = computed(() => recommendCards(weak.value, props.pack.PRACTICE));
// All right: nothing to practise, and nothing to take to the tutor.
const anyWrong = computed(() => [...(props.earlier?.result.items ?? []), ...props.result.items].some(i => !i.correct));
const tagName = (tag: string) => props.pack.TAGS[tag]?.[gateLang] ?? tag;

// "听力 · 4.5": stations on the same line are named by their band.
function stationTitle(id: string): string {
	const band = stationBand(props.pack, id);
	return band == null ? id : gateLabels.stationTitle(props.lineName, bandText(band));
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
</style>
