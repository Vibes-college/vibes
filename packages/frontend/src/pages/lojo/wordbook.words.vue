<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 生词本 · 单词表: every saved word, newest first, with when each of its two cards (认得, 拼写) is next up. Search,
read aloud, go to the post a word came from, remove it; add a word by hand; export everything to Anki. A list that did
not load says so, with a retry, rather than looking empty. -->
<template>
<div :class="$style.root">
	<div :class="$style.intro">
		<h2 ref="headEl" :class="$style.title" tabindex="-1">{{ wordbookLabels.tabWords }}</h2>
		<p v-if="!wordbookFailed" :class="$style.lede">{{ wordbookLabels.wordsLede(wordbook.length) }}</p>
		<div :class="$style.actions">
			<MkButton primary rounded inline :aria-expanded="adding" @click="adding = !adding"><i class="ti ti-plus"></i> {{ wordbookLabels.addOwn }}</MkButton>
			<MkButton rounded inline :disabled="wordbook.length === 0" @click="exportAnki"><i class="ti ti-download"></i> {{ wordbookLabels.exportAnki }}</MkButton>
		</div>
	</div>

	<XAdd v-if="adding" @done="onAdded" @cancel="closeAdd"/>

	<MkLoading v-if="loading || retrying" role="status"/>
	<div v-else-if="wordbookFailed && wordbook.length === 0" :class="$style.failed" role="alert">
		<p>{{ wordbookLabels.loadFailed }}</p>
		<MkButton rounded inline @click="retry"><i class="ti ti-refresh"></i> {{ wordbookLabels.retry }}</MkButton>
	</div>
	<p v-else-if="wordbook.length === 0" :class="$style.empty">{{ wordbookLabels.emptyText(newPerDay) }}</p>
	<template v-else>
		<div v-if="wordbookFailed" :class="$style.failedLine" role="alert">
			<span>{{ wordbookLabels.loadFailed }}</span>
			<button type="button" class="_button _textButton" @click="retry">{{ wordbookLabels.retry }}</button>
		</div>
		<div :class="$style.bar">
			<MkInput v-model="q" :class="$style.search" type="search" :placeholder="wordbookLabels.search" autocapitalize="off">
				<template #prefix><i class="ti ti-search"></i></template>
			</MkInput>
			<button v-if="speechSupported" type="button" class="_button" :class="$style.voice" :aria-label="wordbookLabels.voiceTitle" @click="openVoiceMenu">
				<i class="ti ti-microphone" aria-hidden="true"></i> {{ currentVoice?.name ?? wordbookLabels.voice }}
			</button>
		</div>
		<p v-if="shown.length === 0" :class="$style.empty">{{ wordbookLabels.noMatch }}</p>
		<ul v-else :class="$style.list">
			<li v-for="entry in shown" :key="entry.id" :class="$style.item">
				<div :class="$style.head">
					<b class="_selectable" :class="$style.phrase" lang="en">{{ entry.text }}</b>
					<span :class="$style.kind">{{ wordbookLabels.kinds[entry.kind] }}</span>
					<button
						v-if="speechSupported"
						type="button"
						class="_button"
						:class="$style.icon"
						:aria-label="speakingKey === `${uid}:${entry.id}` ? wordbookLabels.stop : wordbookLabels.listen"
						:aria-pressed="speakingKey === `${uid}:${entry.id}`"
						@click="toggleSpeak(`${uid}:${entry.id}`, entry.text)"
					>
						<i :class="[speakIcon(`${uid}:${entry.id}`), { [$style.spin]: loadingKey === `${uid}:${entry.id}` }]" aria-hidden="true"></i>
					</button>
				</div>
				<div class="_selectable" :class="$style.meaning">{{ entry.meaning }}</div>
				<div v-if="entry.usage" class="_selectable" :class="$style.usage">{{ entry.usage }}</div>
				<div v-if="entry.example" :class="$style.example">
					<button
						v-if="speechSupported"
						type="button"
						class="_button"
						:class="$style.icon"
						:aria-label="speakingKey === `${uid}:${entry.id}:ex` ? wordbookLabels.stop : wordbookLabels.listenExample"
						:aria-pressed="speakingKey === `${uid}:${entry.id}:ex`"
						@click="toggleSpeak(`${uid}:${entry.id}:ex`, entry.example)"
					>
						<i :class="[speakIcon(`${uid}:${entry.id}:ex`), { [$style.spin]: loadingKey === `${uid}:${entry.id}:ex` }]" aria-hidden="true"></i>
					</button>
					<span class="_selectable" lang="en">{{ entry.example }}</span>
					<span v-if="entry.exampleZh" class="_selectable" :class="$style.exampleZh">{{ entry.exampleZh }}</span>
				</div>
				<dl :class="$style.nextUp" :aria-label="wordbookLabels.nextReview">
					<div v-for="c in cardsOf(entry)" :key="c.kind" :class="$style.nextCard">
						<dt>{{ c.name }}</dt>
						<dd :class="$style[c.tone]">{{ c.text }}</dd>
					</div>
				</dl>
				<div :class="$style.foot">
					<span :class="$style.source">{{ wordbookLabels.sources[entry.source] }}</span>
					<MkA v-if="entry.noteId" :to="`/notes/${entry.noteId}`" class="_link">{{ wordbookLabels.sourceLink }}</MkA>
					<MkTime :time="entry.createdAt" :class="$style.time"/>
					<button type="button" class="_button" :class="$style.remove" @click="remove(entry)">{{ wordbookLabels.remove }}</button>
				</div>
			</li>
		</ul>
	</template>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onDeactivated, ref, useId, useTemplateRef } from 'vue';
import XAdd from './wordbook.add.vue';
import type { WordbookEntry } from '@/lojo/english/wordbook.js';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import { reloadWordbook, removeWord, wordbook, wordbookFailed, wordbookTsv } from '@/lojo/english/wordbook.js';
import { dueText } from '@/lojo/english/review.js';
import { wordbookLabels, wordbookLang } from '@/lojo/english/labels.js';
import { currentVoice, loadingKey, openVoiceMenu, speakingKey, speechSupported, stopSpeaking, toggleSpeak } from '@/lojo/english/speech.js';
import * as os from '@/os.js';

const props = defineProps<{
	// the page's clock, a tick every half minute
	now: number;
	loading: boolean;
	newPerDay: number;
}>();

const emit = defineEmits<{
	// a word was added or removed: today's counts change
	(ev: 'changed'): void;
}>();

// the form for 自己加一个词; the 今日 tab opens it too
const adding = defineModel<boolean>('adding', { default: false });

const uid = `wordbook-words-${useId()}`;
const q = ref('');
const retrying = ref(false);
const headEl = useTemplateRef('headEl');

// When what had the focus goes away (the form, a removed word, the round), the heading takes it.
function focusHeading(): void {
	headEl.value?.focus({ preventScroll: true });
}

defineExpose({ focusHeading });

const shown = computed(() => {
	const k = q.value.trim().toLowerCase();
	if (k === '') return wordbook.value;
	return wordbook.value.filter(entry => [entry.text, entry.meaning, entry.usage, entry.example, entry.exampleZh].some(x => x.toLowerCase().includes(k)));
});

function cardsOf(entry: WordbookEntry) {
	return [
		{ kind: 'recognize', name: wordbookLabels.cardRecognize, ...dueText(entry.recognize, props.now, wordbookLang) },
		{ kind: 'spell', name: wordbookLabels.cardSpell, ...dueText(entry.spell, props.now, wordbookLang) },
	];
}

function speakIcon(key: string): string {
	if (loadingKey.value === key) return 'ti ti-loader-2';
	return speakingKey.value === key ? 'ti ti-player-stop' : 'ti ti-volume';
}

async function closeAdd(): Promise<void> {
	adding.value = false;
	await nextTick();
	focusHeading();
}

function onAdded(): void {
	closeAdd();
	emit('changed');
}

async function retry(): Promise<void> {
	retrying.value = true;
	try {
		await reloadWordbook();
	} finally {
		retrying.value = false;
	}
}

async function remove(entry: WordbookEntry): Promise<void> {
	const { canceled } = await os.confirm({ type: 'warning', text: wordbookLabels.removeConfirm(entry.text) });
	if (canceled) return;
	try {
		await removeWord(entry.id);
		os.toast(wordbookLabels.removed);
		emit('changed');
		await nextTick();
		focusHeading();
	} catch {
		os.toast(wordbookLabels.saveFailed);
		reloadWordbook();
	}
}

// 导出到 Anki: a tab-separated file; in Anki, 文件 → 导入.
function exportAnki(): void {
	const blob = new Blob([wordbookTsv(wordbook.value)], { type: 'text/tab-separated-values;charset=utf-8' });
	const a = window.document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = 'vibes-wordbook.tsv';
	a.click();
	window.setTimeout(() => URL.revokeObjectURL(a.href), 10 * 1000);
	os.toast(wordbookLabels.exported);
}

// another page opened (this one is kept), or this one closed
onDeactivated(() => {
	stopSpeaking(`${uid}:`);
});

onBeforeUnmount(() => {
	stopSpeaking(`${uid}:`);
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.intro {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.title {
	margin: 0;
	font: 700 26px / 1.3 var(--wbSerif);
	color: var(--MI_THEME-brandInk);
	letter-spacing: 0.03em;

	&:focus {
		outline: none;
	}
}

.lede {
	margin: 0;
	font-size: 0.9em;
	opacity: 0.75;
}

.failed {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 32px 0;
	text-align: center;

	> p {
		margin: 0;
	}
}

.failedLine {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px 12px;
	padding: 10px 14px;
	border-radius: 12px;
	font-size: 0.9em;
	color: var(--wbBadFg);
	background: var(--wbBadBg);
}

.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

.empty {
	margin: 32px 0;
	text-align: center;
	line-height: 1.6;
	opacity: 0.7;
}

.bar {
	display: flex;
	align-items: center;
	gap: 10px;
}

.search {
	flex: 1;
	min-width: 0;
}

.voice {
	flex: none;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 0.85em;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-buttonBg);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
	}
}

.list {
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.item {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 16px 18px;
	border-radius: 20px;
	background: var(--MI_THEME-panel);
}

.head {
	display: flex;
	align-items: center;
	gap: 8px;
}

.phrase {
	min-width: 0;
	font: 600 1.35em / 1.25 var(--wbEn);
	color: var(--MI_THEME-brandInk);
	overflow-wrap: anywhere;
}

.kind {
	flex: none;
	padding: 0 7px;
	border-radius: 6px;
	font-size: 0.75em;
	font-weight: bold;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.icon {
	flex: none;
	padding: 4px 6px;
	border-radius: 6px;
	color: var(--MI_THEME-accent);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
	}
}

.head > .icon {
	margin-left: auto;
}

.meaning {
	font-weight: bold;
}

.usage {
	line-height: 1.5;
	opacity: 0.8;
}

.example {
	line-height: 1.5;
	font-style: italic;
}

.exampleZh {
	display: block;
	font-style: normal;
	opacity: 0.7;
}

.nextUp {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
	margin: 4px 0 0;
}

.nextCard {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 6px;
	min-width: 0;
	padding: 7px 12px;
	border-radius: 12px;
	font-size: 0.88em;
	background: color-mix(in srgb, var(--MI_THEME-fg) 6%, var(--MI_THEME-panel));

	> dt {
		font-weight: bold;
		color: var(--MI_THEME-brandInk);
	}

	> dd {
		margin: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-variant-numeric: tabular-nums;
	}
}

.new {
	opacity: 0.7;
}

.due,
.soon {
	font-weight: bold;
	color: var(--MI_THEME-cta);
}

.later {
	font-weight: 600;
	color: var(--MI_THEME-brandInk);
}

.foot {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px 12px;
	margin-top: 2px;
	font-size: 0.85em;
}

.source {
	opacity: 0.75;
}

.time {
	opacity: 0.6;
}

.remove {
	margin-left: auto;
	padding: 2px 8px;
	border-radius: 6px;
	opacity: 0.7;

	&:hover {
		opacity: 1;
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
	}
}

.spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
