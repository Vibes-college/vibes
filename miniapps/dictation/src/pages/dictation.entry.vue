<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 听写's first screen: the gaps a gate just missed (when opened from its result), the three sets with how much of
each has been practised and how many are 常错, and the 常错 words themselves. -->
<template>
<div :class="$style.root">
	<header :class="$style.hero">
		<p :class="$style.eyebrow">{{ dictLabels.eyebrow }}</p>
		<h1 ref="headingEl" tabindex="-1" :class="$style.h1">{{ dictLabels.heading }}</h1>
		<p :class="$style.lede">{{ dictLabels.lede }}</p>
	</header>

	<section v-if="gate" :class="$style.gateCard" :aria-labelledby="`${uid}-gate`">
		<div :class="$style.gateHead">
			<span :class="$style.gateIcon" aria-hidden="true"><i class="ti ti-target-arrow"></i></span>
			<span>{{ dictLabels.fromGate }}</span>
		</div>
		<h2 :id="`${uid}-gate`" :class="$style.gateTitle">
			{{ dictLabels.gateMissed(tagName, gate.items.length)[0] }}<b>{{ gate.where }}</b>{{ dictLabels.gateMissed(tagName, gate.items.length)[1] }}
		</h2>
		<ul :class="$style.missed" :aria-label="dictLabels.givenLabel">
			<li v-for="it in gate.items" :key="it.id">
				<span :class="$style.x" aria-hidden="true">✗</span>
				<s v-if="it.gate?.given" lang="en">{{ it.gate.given }}</s>
				<span v-else :class="$style.blank">{{ dictLabels.blank }}</span>
			</li>
		</ul>
		<MkButton primary rounded large full @click="emit('startGate')">
			{{ dictLabels.practiseThese(gate.items.length) }} <i class="ti ti-arrow-right" aria-hidden="true"></i>
		</MkButton>
		<p :class="$style.gateNote">
			<span v-if="gate.runs > 0" :class="$style.gateDone">✓ {{ dictLabels.gateRuns(gate.runs) }}</span>
			{{ dictLabels.gateNote }}
		</p>
	</section>

	<section :aria-labelledby="`${uid}-sets`">
		<div :class="$style.head">
			<h2 :id="`${uid}-sets`">{{ dictLabels.chooseSet }}</h2>
			<span>{{ dictLabels.perRound(content.perRound) }}</span>
		</div>
		<button
			v-for="set in content.sets"
			:key="set.id"
			class="_button"
			:class="$style.setCard"
			:data-set="set.id"
			@click="emit('startSet', set.id)"
		>
			<span :class="[$style.badge, $style[badgeClass(set.id)]]" aria-hidden="true">{{ set.badge }}</span>
			<span :class="$style.setBody">
				<span :class="$style.setTop">
					<b>{{ set.name[dictLang] }}</b>
					<span v-if="oftenBySet[set.id] > 0" :class="$style.oftenChip">{{ dictLabels.oftenChip(oftenBySet[set.id]) }}</span>
				</span>
				<small>{{ set.blurb[dictLang] }}</small>
				<span :class="$style.setHow">{{ set.how[dictLang] }}</span>
				<span :class="$style.setProgress">
					<span :class="$style.bar"><i :style="{ width: `${Math.round(doneBySet[set.id] / set.items.length * 100)}%` }"></i></span>
					<span>{{ dictLabels.practised(doneBySet[set.id], set.items.length) }}</span>
				</span>
			</span>
			<i class="ti ti-chevron-right" :class="$style.chev" aria-hidden="true"></i>
		</button>
	</section>

	<section v-if="often.length > 0" :class="$style.oftenCard" :aria-labelledby="`${uid}-often`">
		<div :class="$style.head">
			<h2 :id="`${uid}-often`">{{ dictLabels.oftenTitle(often.length) }}</h2>
			<span>{{ dictLabels.oftenRule }}</span>
		</div>
		<ul :class="$style.oftenList">
			<li v-for="it in often.slice(0, 12)" :key="it.id" lang="en">{{ it.answer[0] }}<small>{{ dictLabels.missedTimes(progress.items[it.id]?.m ?? 0) }}</small></li>
		</ul>
		<MkButton rounded full @click="emit('startOften')">{{ dictLabels.practiseOften(often.length, content.perRound) }}</MkButton>
	</section>

	<footer :class="$style.foot">
		<p>{{ dictLabels.footOnce }}</p>
		<p v-if="!speech" :class="$style.warn">{{ dictLabels.speechOff }}</p>
		<p v-else-if="voice">
			{{ dictLabels.voiceLine(voice.name, dictLabels.accents[voice.accent] ?? voice.accent) }}
			<button class="_button _textButton" :class="$style.voiceBtn" @click="ev => emit('voice', ev)">{{ dictLabels.changeVoice }}</button>
		</p>
		<p v-if="progressFailed" :class="$style.warn">{{ dictLabels.progressFailed }}</p>
		<!-- not signed in: the page's own note says where the record is kept -->
		<p v-else-if="$i != null">{{ dictLabels.savedNote }}</p>
	</footer>
</div>
</template>

<script lang="ts" setup>
import { computed, useId, useTemplateRef } from 'vue';
import type { DictContent, DictItem } from '@/lojo/dictation/content.js';
import type { DictProgress } from '@/lojo/dictation/logic.js';
import MkButton from '@/components/MkButton.vue';
import { oftenIds, seenCount } from '@/lojo/dictation/logic.js';
import { dictLabels, dictLang } from '@/lojo/dictation/labels.js';
import { $i } from '@/i.js';

const props = defineProps<{
	content: DictContent;
	progress: DictProgress;
	// a gate's missed gaps of one tag (or of all three)
	gate: { where: string; tag: string | null; items: DictItem[]; runs: number } | null;
	speech: boolean;
	voice: { name: string; accent: string } | null;
	progressFailed: boolean;
}>();

const emit = defineEmits<{
	(ev: 'startSet', setId: string): void;
	(ev: 'startGate'): void;
	(ev: 'startOften'): void;
	(ev: 'voice', mouse: MouseEvent): void;
}>();

const uid = `dict-entry-${useId()}`;
const headingEl = useTemplateRef('headingEl');

const tagName = computed(() => {
	const tag = props.gate?.tag ?? props.gate?.items[0]?.setId ?? '';
	return dictLabels.tagNames[tag] ?? tag;
});
const doneBySet = computed(() => Object.fromEntries(props.content.sets.map(s => [s.id, s.items.filter(it => seenCount(props.progress, it.id) > 0).length])));
const oftenBySet = computed(() => Object.fromEntries(props.content.sets.map(s => [s.id, oftenIds(props.progress, s.items.map(it => it.id)).length])));
const often = computed(() => {
	const all = props.content.sets.flatMap(s => s.items);
	const byId = new Map(all.map(it => [it.id, it]));
	return oftenIds(props.progress, all.map(it => it.id)).flatMap(id => byId.get(id) ?? []);
});

// Back from a round, the focus goes here instead of being lost.
function focusHeading() {
	headingEl.value?.focus({ preventScroll: true });
}

defineExpose({ focusHeading });

// by name, looked up in $style by the template (useCssModule() is empty in production builds: same as the typing mini app)
function badgeClass(setId: string): string {
	return setId === 'spelling' ? 'badgeSpelling' : setId === 'numbers' ? 'badgeNumbers' : setId === 'plural' ? 'badgePlural' : '';
}
</script>

<style lang="scss" module>
.root {
	--bad: var(--MI_THEME-error);
	--ok: color-mix(in srgb, #2F7D5B 82%, var(--MI_THEME-fg));
	--weak: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
	--faint: color-mix(in srgb, var(--MI_THEME-fg) 45%, transparent);
	--ink: var(--MI_THEME-fgHighlighted);
	--ctaBg: color-mix(in srgb, var(--MI_THEME-cta) 12%, var(--MI_THEME-panel));
	--ctaInk: color-mix(in srgb, var(--MI_THEME-cta) 70%, var(--MI_THEME-fgHighlighted));
	--shadow: 0 1px 2px color-mix(in srgb, var(--ink) 6%, transparent), 0 10px 28px -10px color-mix(in srgb, var(--ink) 25%, transparent);
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.hero {
	padding: 4px 2px;
}

.eyebrow {
	font-size: 11.5px;
	letter-spacing: 0.24em;
	color: var(--weak);
	margin: 0 0 8px;
}

.h1 {
	font-family: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", STSong, serif;
	font-weight: 700;
	font-size: 27px;
	line-height: 1.25;
	letter-spacing: 0.03em;
	color: var(--ink);
	margin: 0 0 10px;

	&:focus:not(:focus-visible) {
		outline: none;
	}
}

.lede {
	font-size: 14.5px;
	line-height: 1.75;
	color: var(--weak);
	margin: 0;
}

.gateCard {
	margin: 14px 0 6px;
	border-radius: 22px;
	background: color-mix(in srgb, var(--MI_THEME-cta) 10%, var(--MI_THEME-panel));
	box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--MI_THEME-cta) 38%, transparent);
	padding: 15px 16px 14px;
}

.gateHead {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12.5px;
	font-weight: 700;
	color: var(--ctaInk);
	letter-spacing: 0.04em;
}

.gateIcon {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: var(--MI_THEME-panel);
	display: grid;
	place-items: center;
	color: var(--MI_THEME-cta);
	font-size: 18px;
}

.gateTitle {
	font-family: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", STSong, serif;
	font-weight: 700;
	font-size: 19px;
	line-height: 1.5;
	color: var(--ink);
	margin: 10px 0;

	b {
		color: var(--ctaInk);
	}
}

.missed {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	list-style: none;
	margin: 0 0 14px;
	padding: 0;

	li {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		background: var(--MI_THEME-panel);
		border-radius: 10px;
		padding: 6px 11px;
		font: 600 15.5px ui-monospace, "SF Mono", Menlo, Consolas, monospace;
		color: var(--bad);
	}

	s {
		text-decoration-thickness: 1.5px;
	}
}

.x {
	font-size: 12px;
	font-weight: 800;
}

.blank {
	font-family: system-ui, sans-serif;
	font-size: 13px;
}

.gateNote {
	font-size: 12.5px;
	color: var(--weak);
	margin: 10px 2px 0;
	line-height: 1.65;
}

.gateDone {
	color: var(--ok);
	font-weight: 700;
}

.head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 12px;
	margin: 20px 2px 10px;

	h2 {
		font-family: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", STSong, serif;
		font-weight: 700;
		font-size: 18px;
		color: var(--ink);
		margin: 0;
	}

	span {
		font-size: 12.5px;
		color: var(--weak);
		text-align: right;
	}
}

.setCard {
	display: flex;
	align-items: center;
	gap: 14px;
	width: 100%;
	text-align: left;
	background: var(--MI_THEME-panel);
	border-radius: 18px;
	box-shadow: var(--shadow);
	padding: 14px 12px 14px 14px;
	margin: 0 0 10px;
	transition: transform 0.12s, box-shadow 0.12s;

	&:hover {
		transform: translateY(-1px);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.badge {
	flex: none;
	align-self: flex-start;
	width: 48px;
	height: 48px;
	border-radius: 14px;
	display: grid;
	place-items: center;
	font-weight: 800;
	font-size: 18px;
}

.badgeSpelling {
	background: var(--ctaBg);
	color: var(--ctaInk);
}

.badgeNumbers {
	background: color-mix(in srgb, #F2C14E 22%, var(--MI_THEME-panel));
	color: color-mix(in srgb, #B8871B 72%, var(--MI_THEME-fg));
}

.badgePlural {
	background: color-mix(in srgb, #3F8F86 14%, var(--MI_THEME-panel));
	color: color-mix(in srgb, #3F8F86 80%, var(--MI_THEME-fg));
}

.setBody {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 1px;

	b {
		font-family: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", STSong, serif;
		font-size: 17px;
		color: var(--ink);
	}

	small {
		font-size: 13px;
		line-height: 1.55;
	}
}

.setTop {
	display: flex;
	align-items: center;
	gap: 8px;
}

.setHow {
	font-size: 12px;
	color: var(--weak);
	line-height: 1.5;
}

.setProgress {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 7px;

	> span:last-child {
		font-size: 11.5px;
		color: var(--weak);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
}

.bar {
	flex: 1;
	height: 4px;
	border-radius: 2px;
	background: var(--MI_THEME-divider);
	overflow: hidden;

	i {
		display: block;
		height: 100%;
		border-radius: 2px;
		background: var(--MI_THEME-cta);
	}
}

.oftenChip {
	flex: none;
	font-size: 11px;
	font-weight: 700;
	color: var(--bad);
	background: color-mix(in srgb, var(--bad) 12%, var(--MI_THEME-panel));
	border-radius: 999px;
	padding: 1px 8px;
	white-space: nowrap;
}

.chev {
	flex: none;
	color: var(--faint);
	font-size: 18px;
}

.oftenCard {
	background: var(--MI_THEME-panel);
	border-radius: 18px;
	box-shadow: var(--shadow);
	padding: 4px 16px 16px;
	margin-top: 6px;

	.head {
		margin: 12px 0 8px;
	}
}

.oftenList {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	list-style: none;
	margin: 0 0 14px;
	padding: 0;

	li {
		font: 600 14px ui-monospace, "SF Mono", Menlo, Consolas, monospace;
		color: var(--ink);
		background: color-mix(in srgb, var(--bad) 10%, var(--MI_THEME-panel));
		border-radius: 8px;
		padding: 3px 9px;
	}

	small {
		font: 700 11px system-ui, sans-serif;
		color: var(--bad);
		margin-left: 5px;
	}
}

.foot {
	margin: 24px 2px 0;
	font-size: 12.5px;
	color: var(--weak);
	line-height: 1.7;

	p {
		margin: 0 0 4px;
	}
}

.warn {
	color: var(--bad);
}

.voiceBtn {
	margin-left: 6px;
	font-size: 12.5px;
}

@media (min-width: 720px) {
	.h1 {
		font-size: 32px;
	}

	.lede {
		font-size: 15px;
	}
}
</style>
