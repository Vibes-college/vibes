<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 5 号线 · 词汇: 词表. The words by group (a colour bar and the group's name, and 练这组), each with its sound, British
IPA, part of speech, Chinese and an example with the word in bold; marked 错词 or 拼对过. 遮英文 / 遮中文 cover that half
of every word to test yourself; a tap shows one. -->
<template>
<div ref="rootEl">
	<div :class="$style.tools">
		<div :class="$style.seg" role="group" :aria-label="L.coverLabel">
			<button
				v-for="c in COVERS"
				:key="c"
				type="button"
				class="_button"
				:aria-pressed="cover === c"
				:data-cover="c"
				@click="setCover(c)"
			>
				{{ L.cover[c] }}
			</button>
		</div>
		<p :class="$style.note">{{ L.ipaNote }}</p>
	</div>
	<p v-if="!speech" :class="$style.note">{{ L.speechOff }}</p>

	<section
		v-for="(g, gi) in stop.groups"
		:key="gi"
		:class="$style.group"
		:style="{ '--g': g.color }"
		:aria-labelledby="`${uid}-g${gi}`"
		:data-group="gi"
	>
		<header :class="$style.groupHead">
			<h3 :id="`${uid}-g${gi}`">{{ g.label }}</h3>
			<small>{{ L.groupCount(g.words.length) }}</small>
			<button type="button" class="_button" :class="$style.mini" :aria-label="L.practiseGroupLabel(g.label)" @click="emit('practiseGroup', gi)">
				{{ L.practiseGroup }}<i class="ti ti-arrow-right" aria-hidden="true"></i>
			</button>
		</header>
		<ul :class="$style.words">
			<li v-for="w in g.words" :key="w.key" :class="$style.word" :data-word="w.w">
				<button
					type="button"
					class="_button"
					:class="[$style.say, { [$style.playing]: playingKey === w.key }]"
					:aria-label="L.hear(w.w)"
					:title="L.hear(w.w)"
					:disabled="!speech"
					data-say
					@click="hear(w)"
				>
					<i :class="loadingKey === w.key ? ['ti ti-loader-2', $style.spin] : 'ti ti-volume'" aria-hidden="true"></i>
				</button>
				<div :class="$style.wordBody">
					<div :class="$style.top">
						<span :class="$style.en">
							<button v-if="covered(w, 'en')" type="button" class="_button" :class="$style.mask" :aria-label="L.revealEn" @click="reveal(w)">{{ L.reveal }}</button>
							<span v-else lang="en" class="_selectable">{{ w.w }}</span>
						</span>
						<span v-if="!covered(w, 'en')" :class="$style.ipa">{{ w.ipa }}</span>
						<span v-if="missed.has(w.w)" :class="[$style.mark, $style.markBad]" data-mark="missed"><i class="ti ti-x" aria-hidden="true"></i>{{ L.markMissed }}</span>
						<span v-else-if="learned.has(w.w)" :class="[$style.mark, $style.markGood]" data-mark="learned"><i class="ti ti-check" aria-hidden="true"></i>{{ L.markLearned }}</span>
					</div>
					<div :class="$style.zh">
						<i v-if="w.pos" :class="$style.pos">{{ w.pos }}</i>
						<button v-if="covered(w, 'zh')" type="button" class="_button" :class="$style.mask" :aria-label="L.revealZh" @click="reveal(w)">{{ L.reveal }}</button>
						<span v-else class="_selectable">{{ w.zh }}</span>
					</div>
					<p v-if="w.ex" :class="$style.ex" lang="en">
						<template v-if="exOf(w).word">
							{{ exOf(w).before }}<span v-if="covered(w, 'en')" :class="$style.blank" :style="{ '--n': exOf(w).word.length + exOf(w).suffix.length }"><span :class="$style.sr">{{ L.gap }}</span></span><b v-else>{{ exOf(w).word + exOf(w).suffix }}</b>{{ exOf(w).after }}
						</template>
						<template v-else>{{ w.ex }}</template>
					</p>
				</div>
			</li>
		</ul>
	</section>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, useTemplateRef } from 'vue';
import type { VocabStop, VocabWord } from '@/lojo/vocab/content.js';
import type { CoverMode } from '@/lojo/vocab/prefs.js';
import type { ExParts } from '@/lojo/vocab/spell.js';
import { exParts } from '@/lojo/vocab/spell.js';
import { setPref, vocabPrefs } from '@/lojo/vocab/prefs.js';
import { audioError, audioKey, audioState, playWord, stopWordAudio } from '@/lojo/vocab/audio.js';
import { vocabLabels as L } from '@/lojo/vocab/labels.js';
import { englishErrorText } from '@/lojo/english/api.js';
import * as os from '@/os.js';

const props = defineProps<{
	stop: VocabStop;
	learned: ReadonlySet<string>;
	missed: ReadonlySet<string>;
	// whether recordings can be made at all (lojo/english/status)
	speech: boolean;
}>();

const emit = defineEmits<{
	(ev: 'practiseGroup', group: number): void;
}>();

const COVERS: CoverMode[] = ['none', 'en', 'zh'];
const KEY = 'vocab-list:';
const uid = `vocab-words-${useId()}`;
const rootEl = useTemplateRef('rootEl');
const cover = computed(() => vocabPrefs.value.cover);
// words shown again under a cover, by key
const shown = ref<string[]>([]);

const examples = computed(() => new Map<string, ExParts>(props.stop.words.map(w => [w.key, exParts(w)])));
const exOf = (w: VocabWord): ExParts => examples.value.get(w.key) ?? exParts(w);

const mine = computed(() => (audioKey.value?.startsWith(KEY) ? audioKey.value.slice(KEY.length) : null));
const loadingKey = computed(() => (audioState.value === 'loading' ? mine.value : null));
const playingKey = computed(() => (audioState.value === 'playing' ? mine.value : null));

function covered(w: VocabWord, half: 'en' | 'zh'): boolean {
	return cover.value === half && !shown.value.includes(w.key);
}

function setCover(c: CoverMode) {
	setPref('cover', c);
	shown.value = [];
}

// Shows the covered half of one word; the focus moves to its sound button, as the mask that had it is gone.
function reveal(w: VocabWord) {
	shown.value = [...shown.value, w.key];
	void nextTick(() => {
		rootEl.value?.querySelector<HTMLElement>(`[data-word="${CSS.escape(w.w)}"] [data-say]`)?.focus({ preventScroll: true });
	});
}

async function hear(w: VocabWord) {
	const key = KEY + w.key;
	if (await playWord(key, w.w)) return;
	if (audioKey.value !== key) return;
	if (audioState.value === 'blocked') os.toast(L.audioBlocked);
	else if (audioState.value === 'failed') os.toast(audioError.value != null ? englishErrorText({ code: audioError.value }) : L.audioFailed);
}

onBeforeUnmount(() => {
	if (mine.value != null) stopWordAudio();
});
</script>

<style lang="scss" module>
.tools {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 6px 12px;
	margin: 0 0 14px;

	> .note {
		margin: 0;
	}
}

.seg {
	display: inline-flex;
	background: var(--vl-hi);
	border-radius: 12px;
	padding: 3px;

	> button {
		height: 32px;
		padding: 0 12px;
		border-radius: 10px;
		font-size: 13px;
		color: var(--MI_THEME-fg);

		&[aria-pressed="true"] {
			background: var(--MI_THEME-panel);
			color: var(--vl-cFg);
			font-weight: 700;
			box-shadow: 0 1px 2px color-mix(in srgb, var(--vl-ink) 10%, transparent), inset 0 0 0 1.5px color-mix(in srgb, var(--vl-c) 40%, transparent);
		}

		&:focus-visible {
			outline: 3px solid var(--MI_THEME-focus);
			outline-offset: 1px;
		}
	}
}

.note {
	font-size: 12px;
	color: var(--vl-weak);
	line-height: 1.6;
	margin: 0 0 12px;
}

.group {
	position: relative;
	background: var(--MI_THEME-panel);
	border-radius: 16px;
	margin: 0 0 14px;
	padding-left: 6px;
	box-shadow: inset 0 0 0 1px var(--vl-line);
	overflow: hidden;

	&::before {
		content: "";
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6px;
		background: var(--g);
	}
}

.groupHead {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 11px 10px 9px 12px;
	background: color-mix(in srgb, var(--g) 7%, var(--MI_THEME-panel));

	> h3 {
		margin: 0;
		font-family: var(--vl-serif);
		font-size: 15.5px;
		color: var(--vl-ink);
	}

	> small {
		color: var(--vl-weak);
		font-size: 12px;
	}
}

.mini {
	margin-left: auto;
	display: inline-flex;
	align-items: center;
	gap: 3px;
	height: 30px;
	padding: 0 10px 0 12px;
	border-radius: 999px;
	background: var(--vl-cBg);
	color: var(--vl-cFg);
	font-size: 12.5px;
	font-weight: 700;
	white-space: nowrap;

	&:hover {
		background: color-mix(in srgb, var(--vl-c) 16%, var(--MI_THEME-panel));
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 1px;
	}
}

.words {
	list-style: none;
	margin: 0;
	padding: 0;
}

.word {
	display: grid;
	grid-template-columns: 38px minmax(0, 1fr);
	gap: 0 10px;
	padding: 12px 12px 13px 10px;
	border-top: 1px solid var(--vl-line);
}

.say {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: var(--vl-cBg);
	color: var(--vl-cFg);
	display: grid;
	place-items: center;
	font-size: 18px;
	margin-top: -2px;
	transition: background 0.15s, transform 0.1s;

	&:hover:not(:disabled) {
		background: color-mix(in srgb, var(--vl-c) 18%, var(--MI_THEME-panel));
	}

	&:active:not(:disabled) {
		transform: scale(0.94);
	}

	&:disabled {
		opacity: 0.45;
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 1px;
	}

	&.playing {
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--vl-c) 30%, transparent);
	}
}

.spin {
	animation: spin 0.9s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.wordBody {
	min-width: 0;
}

.top {
	display: flex;
	align-items: baseline;
	flex-wrap: wrap;
	gap: 0 10px;
}

.en {
	font-size: 18.5px;
	font-weight: 700;
	color: var(--vl-ink);
	letter-spacing: 0.005em;
}

.ipa {
	font-family: var(--vl-ipa);
	color: var(--vl-weak);
	font-size: 14px;
	font-weight: 400;
}

.mark {
	margin-left: auto;
	align-self: center;
	display: inline-flex;
	align-items: center;
	gap: 2px;
	font-size: 11px;
	font-weight: 700;
	border-radius: 6px;
	padding: 1px 6px;
}

.markGood {
	background: var(--vl-okBg);
	color: var(--vl-ok);
}

.markBad {
	background: var(--vl-badBg);
	color: var(--vl-bad);
}

.zh {
	margin-top: 2px;
	font-size: 14.5px;
}

.pos {
	font-family: var(--vl-pos);
	font-style: italic;
	color: var(--vl-weak);
	margin-right: 6px;
	font-size: 0.95em;
}

.ex {
	margin: 5px 0 0;
	font-size: 13.5px;
	line-height: 1.6;
	color: color-mix(in srgb, var(--MI_THEME-fg) 90%, transparent);

	> b {
		color: var(--vl-cFg);
		font-weight: 700;
	}
}

.blank {
	display: inline-block;
	width: calc(var(--n) * 0.55em);
	height: 1.05em;
	vertical-align: -0.18em;
	border-radius: 4px;
	background: var(--vl-hi);
	box-shadow: inset 0 -2px 0 var(--vl-cSoft);
}

.mask {
	display: inline-flex;
	align-items: center;
	min-height: 28px;
	padding: 0 10px;
	border-radius: 8px;
	font-size: 12.5px;
	font-weight: 400;
	color: var(--vl-weak);
	background: repeating-linear-gradient(-45deg, var(--vl-hi) 0 6px, var(--MI_THEME-bg) 6px 12px);
	box-shadow: inset 0 0 0 1px var(--vl-line);
	vertical-align: middle;

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 1px;
	}
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

@media (prefers-reduced-motion: reduce) {
	.spin {
		animation: none;
	}

	.say {
		transition: none;
	}
}
</style>
