<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 5 号线 · 词汇: 练习. Which words (all of them, the missed ones, or one group), shuffled or not, then one of the three
modes, each with its last result on this device. -->
<template>
<section :class="$style.root" :aria-labelledby="`${uid}-scope`">
	<h3 :id="`${uid}-scope`" :class="$style.h">{{ L.scopeHead }}</h3>
	<div :class="$style.scopes" role="group" :aria-labelledby="`${uid}-scope`">
		<button
			v-for="c in choices"
			:key="c.value"
			type="button"
			class="_button"
			:class="$style.chip"
			:aria-pressed="current === c.value"
			:data-scope="c.value"
			@click="scope = c.value"
		>
			<i v-if="c.color" :style="{ background: c.color }" aria-hidden="true"></i>{{ c.label }}<b>{{ c.count }}</b>
		</button>
	</div>
	<label :class="$style.switch">
		<input type="checkbox" :checked="vocabPrefs.shuffle" data-shuffle @change="onShuffle">
		<span :class="$style.sw" aria-hidden="true"></span>
		{{ L.shuffle }}
	</label>

	<div :class="$style.modes">
		<article v-for="m in MODES" :key="m" :class="$style.mode" :data-mode="m">
			<span :class="$style.icon" aria-hidden="true">
				<span v-if="m === 'meaning'" :class="$style.yi">义</span>
				<i v-else :class="m === 'listen' ? 'ti ti-headphones' : 'ti ti-keyboard'"></i>
			</span>
			<div :class="$style.text">
				<b>{{ L.modes[m].name }}</b>
				<small>{{ L.modes[m].desc }}</small>
				<small v-if="m === 'listen' && !speech" :class="$style.warn">{{ L.listenNoSpeech }}</small>
				<em v-if="lastText(m)">{{ lastText(m) }}</em>
			</div>
			<button type="button" class="_button" :class="$style.go" :aria-label="L.startMode(L.modes[m].name)" :data-start="m" @click="emit('start', m)">{{ L.start }}</button>
		</article>
	</div>
	<p :class="$style.note">{{ L.practiceNote }}</p>
</section>
</template>

<script lang="ts" setup>
import { computed, useId } from 'vue';
import type { VocabStop } from '@/lojo/vocab/content.js';
import type { PracticeMode } from '@/lojo/vocab/prefs.js';
import { lastRun, setPref, vocabPrefs } from '@/lojo/vocab/prefs.js';
import { scopeWords } from '@/lojo/vocab/round.js';
import { vocabLabels as L } from '@/lojo/vocab/labels.js';

const props = defineProps<{
	stop: VocabStop;
	missed: ReadonlySet<string>;
	// whether recordings can be made at all (lojo/english/status)
	speech: boolean;
}>();

const emit = defineEmits<{
	(ev: 'start', mode: PracticeMode): void;
}>();

// 'all', 'missed' or a group ('g2')
const scope = defineModel<string>('scope', { required: true });

const MODES: PracticeMode[] = ['meaning', 'listen', 'typing'];
const uid = `vocab-pick-${useId()}`;

const missedCount = computed(() => props.stop.words.filter(w => props.missed.has(w.w)).length);
// what the round would be: no missed words left means every word
const current = computed(() => scopeWords(props.stop, scope.value, props.missed).scope);

const choices = computed(() => [
	{ value: 'all', label: L.scopeAll, count: props.stop.words.length, color: null },
	...(missedCount.value > 0 ? [{ value: 'missed', label: L.scopeMissed, count: missedCount.value, color: 'var(--vl-bad)' }] : []),
	...props.stop.groups.map((g, i) => ({ value: `g${i}`, label: g.label, count: g.words.length, color: g.color })),
]);

function lastText(m: PracticeMode): string | null {
	const r = lastRun(props.stop.id, m);
	if (r == null) return null;
	return 'acc' in r ? L.lastTyping(r.acc, r.wpm) : L.lastSpell(r.right, r.total);
}

function onShuffle(ev: Event) {
	setPref('shuffle', (ev.target as HTMLInputElement).checked);
}
</script>

<style lang="scss" module>
.root {
	padding-top: 2px;
}

.h {
	margin: 0 0 10px;
	font-family: var(--vl-serif);
	font-weight: 700;
	font-size: 16px;
	color: var(--vl-ink);
}

.scopes {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-bottom: 10px;
}

.chip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-height: 34px;
	padding: 0 12px;
	border-radius: 10px;
	background: var(--vl-hi);
	font-size: 13px;
	color: var(--MI_THEME-fg);

	> i {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex: none;
	}

	> b {
		font-weight: 700;
		color: var(--vl-weak);
		font-size: 12px;
		font-variant-numeric: tabular-nums;
	}

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&[aria-pressed="true"] {
		background: var(--vl-ink);
		color: var(--MI_THEME-bg);

		> b {
			color: color-mix(in srgb, var(--MI_THEME-bg) 70%, transparent);
		}
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 1px;
	}
}

.switch {
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-height: 32px;
	font-size: 13.5px;
	cursor: pointer;

	> input {
		position: absolute;
		left: 0;
		top: 50%;
		width: 38px;
		height: 22px;
		margin: -11px 0 0;
		opacity: 0;
		cursor: pointer;
	}

	> input:checked + .sw {
		background: var(--vl-c);

		&::after {
			transform: translateX(16px);
		}
	}

	> input:focus-visible + .sw {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.sw {
	position: relative;
	flex: none;
	width: 38px;
	height: 22px;
	border-radius: 999px;
	background: var(--MI_THEME-buttonHoverBg);
	transition: background 0.15s;

	&::after {
		content: "";
		position: absolute;
		left: 3px;
		top: 3px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--MI_THEME-panel);
		box-shadow: 0 1px 2px color-mix(in srgb, var(--vl-ink) 25%, transparent);
		transition: transform 0.15s;
	}
}

.modes {
	display: grid;
	gap: 10px;
	margin-top: 12px;
}

.mode {
	display: grid;
	grid-template-columns: 48px minmax(0, 1fr) auto;
	align-items: center;
	gap: 12px;
	background: var(--MI_THEME-panel);
	border-radius: 18px;
	padding: 14px;
	box-shadow: inset 0 0 0 1px var(--vl-line), var(--vl-shadow);
}

.icon {
	width: 48px;
	height: 48px;
	border-radius: 14px;
	display: grid;
	place-items: center;
	background: var(--vl-cBg);
	color: var(--vl-cFg);
	font-size: 24px;
}

.yi {
	font-family: var(--vl-serif);
	font-weight: 800;
	font-size: 22px;
	line-height: 1;
}

.text {
	min-width: 0;

	> b {
		display: block;
		font-family: var(--vl-serif);
		font-size: 16.5px;
		color: var(--vl-ink);
	}

	> small {
		display: block;
		font-size: 12.5px;
		color: var(--vl-weak);
		line-height: 1.5;
		margin-top: 2px;
	}

	> .warn {
		color: var(--vl-gold);
	}

	> em {
		display: inline-block;
		font-style: normal;
		font-size: 11.5px;
		font-weight: 600;
		color: var(--vl-cFg);
		background: var(--vl-cBg);
		border-radius: 6px;
		padding: 1px 7px;
		margin-top: 6px;
	}
}

.go {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 40px;
	padding: 0 16px;
	border-radius: 999px;
	font-weight: 700;
	font-size: 14px;
	letter-spacing: 0.04em;
	background: var(--MI_THEME-cta);
	color: var(--MI_THEME-fgOnAccent);
	white-space: nowrap;
	transition: background 0.15s;

	&:hover {
		background: hsl(from var(--MI_THEME-cta) h s calc(l + 5));
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.note {
	font-size: 12px;
	color: var(--vl-weak);
	line-height: 1.6;
	margin: 12px 0 0;
}

@media (prefers-reduced-motion: reduce) {
	.sw,
	.sw::after {
		transition: none;
	}
}
</style>
