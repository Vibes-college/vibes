<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 5 号线 · 词汇: words got wrong, each with its IPA and meaning (and a note, such as how many letters were typed wrong),
its sound, and 加进生词本; 全部加进生词本 below. Used by a round's summary and by the 错词 tab. -->
<template>
<div>
	<ul :class="$style.list">
		<li v-for="w in words" :key="w.key" :class="$style.item" :data-missed-word="w.w">
			<span :class="$style.x" aria-hidden="true"><i class="ti ti-x"></i></span>
			<div :class="$style.body">
				<b lang="en" class="_selectable">{{ w.w }}</b>
				<span :class="$style.ipa">{{ w.ipa }}</span>
				<span :class="$style.zh"><i v-if="w.pos" :class="$style.pos">{{ w.pos }}</i>{{ w.zh }}</span>
				<small v-if="notes?.[w.key]" :class="$style.note">{{ notes[w.key] }}</small>
			</div>
			<button
				v-if="speech"
				type="button"
				class="_button"
				:class="$style.hear"
				:aria-label="L.hear(w.w)"
				:title="L.hear(w.w)"
				@click="hear(w)"
			>
				<i :class="audioKey === KEY + w.key && audioState === 'loading' ? ['ti ti-loader-2', $style.spin] : 'ti ti-volume'" aria-hidden="true"></i>
			</button>
			<button
				type="button"
				class="_button"
				:class="[$style.add, { [$style.isIn]: inWordbook(w) }]"
				:disabled="inWordbook(w) || addingKeys.includes(w.key)"
				:aria-label="inWordbook(w) ? L.addedWord(w.w) : L.addWord(w.w)"
				data-add
				@click="add(w)"
			>
				<i :class="inWordbook(w) ? 'ti ti-check' : addingKeys.includes(w.key) ? ['ti ti-loader-2', $style.spin] : 'ti ti-notebook'" aria-hidden="true"></i>
				<span>{{ inWordbook(w) ? L.added : L.add }}</span>
			</button>
		</li>
	</ul>
	<div :class="$style.foot">
		<button type="button" class="_button" :class="$style.addAll" :disabled="allIn || busy" data-add-all @click="addAll">
			<i :class="allIn ? 'ti ti-check' : busy ? ['ti ti-loader-2', $style.spin] : 'ti ti-notebook'" aria-hidden="true"></i>
			{{ allIn ? L.allAdded : L.addAll }}
		</button>
		<a href="/apps/wordbook/" class="_link">{{ L.openWordbook }}</a>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { VocabWord } from '@/lojo/vocab/content.js';
import { addAllToWordbook, addToWordbook, addingKeys, inWordbook } from '@/lojo/vocab/wordbook.js';
import { audioKey, audioState, playWord, stopWordAudio } from '@/lojo/vocab/audio.js';
import { vocabLabels as L } from '@/lojo/vocab/labels.js';
import { loadWordbook } from '@/lojo/english/wordbook.js';
import * as os from '@/os.js';

const props = defineProps<{
	words: VocabWord[];
	// a line under a word, by key
	notes?: Record<string, string>;
	speech: boolean;
}>();

const KEY = 'vocab-missed:';
const busy = ref(false);
const allIn = computed(() => props.words.length > 0 && props.words.every(inWordbook));

async function add(w: VocabWord) {
	try {
		if (await addToWordbook(w)) os.toast(L.addedToast(w.w));
	} catch {
		os.toast(L.addFailed);
	}
}

async function addAll() {
	if (busy.value) return;
	busy.value = true;
	try {
		const k = await addAllToWordbook(props.words);
		if (k > 0) os.toast(L.addedAllToast(k));
	} catch {
		os.toast(L.addFailed);
	} finally {
		busy.value = false;
	}
}

function hear(w: VocabWord) {
	void playWord(KEY + w.key, w.w);
}

// what is in the wordbook already, so its words say so
onMounted(() => {
	void loadWordbook();
});

onBeforeUnmount(() => {
	if (audioKey.value?.startsWith(KEY)) stopWordAudio();
});
</script>

<style lang="scss" module>
.list {
	list-style: none;
	margin: 0 0 12px;
	padding: 0;
}

.item {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 9px 2px;
	border-bottom: 1px solid color-mix(in srgb, var(--vl-bad) 14%, transparent);

	&:last-child {
		border-bottom: 0;
	}
}

.x {
	flex: none;
	color: var(--vl-bad);
	font-size: 16px;
	display: inline-grid;
}

.body {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 2px 10px;

	> b {
		font-size: 17px;
		color: var(--vl-ink);
	}
}

.ipa {
	font-family: var(--vl-ipa);
	color: var(--vl-weak);
	font-size: 13.5px;
}

.zh {
	font-size: 13.5px;
}

.pos {
	font-family: var(--vl-pos);
	font-style: italic;
	color: var(--vl-weak);
	margin-right: 5px;
}

.note {
	flex-basis: 100%;
	font-size: 12px;
	color: var(--vl-bad);
}

.hear {
	flex: none;
	width: 34px;
	height: 34px;
	border-radius: 50%;
	background: var(--MI_THEME-panel);
	color: var(--vl-cFg);
	display: grid;
	place-items: center;
	font-size: 17px;

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 1px;
	}
}

.add {
	flex: none;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	min-height: 34px;
	padding: 0 11px;
	border-radius: 999px;
	background: var(--MI_THEME-panel);
	color: var(--vl-ink);
	font-size: 12.5px;
	font-weight: 700;
	white-space: nowrap;
	box-shadow: inset 0 0 0 1px var(--vl-line);

	&:hover:not(:disabled) {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.isIn {
		background: var(--vl-okBg);
		color: var(--vl-ok);
		box-shadow: none;
	}

	&:disabled {
		cursor: default;
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 1px;
	}
}

.foot {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px 14px;
}

.addAll {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-height: 40px;
	padding: 0 16px;
	border-radius: 999px;
	background: var(--MI_THEME-panel);
	color: var(--vl-ink);
	font-weight: 700;
	font-size: 14px;
	box-shadow: inset 0 0 0 1.5px var(--vl-line);

	&:hover:not(:disabled) {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:disabled {
		cursor: default;
		color: var(--vl-ok);
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.spin {
	animation: spin 0.9s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
	.spin {
		animation: none;
	}
}
</style>
