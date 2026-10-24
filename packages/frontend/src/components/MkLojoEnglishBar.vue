<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="!mock && text !== '' && (canSpeak || englishStatus.available)" :class="$style.root">
	<div :class="$style.actions">
		<button v-if="canSpeak" class="_button" :class="[$style.action, { [$style.active]: speakingKey === `${uid}:post` }]" :aria-pressed="speakingKey === `${uid}:post`" @click="toggleSpeak(`${uid}:post`, text, { noteId })">
			<i :class="[speakIcon(`${uid}:post`), { [$style.spin]: loadingKey === `${uid}:post` }]"></i>
			{{ loadingKey === `${uid}:post` ? englishLabels.loadingVoice : speakingKey === `${uid}:post` ? englishLabels.stop : englishLabels.listen }}
		</button>
		<button v-if="canSpeak" class="_button" :class="$style.action" :aria-label="englishLabels.voiceTitle" @click="openVoiceMenu">
			<i class="ti ti-microphone"></i>
			{{ currentVoice?.name ?? englishLabels.voice }}
		</button>
		<button v-if="englishStatus.available" class="_button" :class="[$style.action, { [$style.active]: panelOpen }]" :aria-expanded="panelOpen" @click="toggle">
			<i class="ti ti-language"></i>
			{{ panelOpen ? englishLabels.hide : englishLabels.explain }}
		</button>
	</div>
	<div v-if="panelOpen" :class="$style.panel">
		<MkLoading v-if="loading" mini role="status"/>
		<div v-else-if="error != null" :class="$style.error" role="alert">
			{{ error }}
			<button class="_textButton" @click="load">{{ englishLabels.retry }}</button>
		</div>
		<template v-else-if="data">
			<section :class="$style.translation">
				<div :class="$style.label">
					{{ data.sourceLang === 'en' ? englishLabels.translationZh : englishLabels.translationEn }}
					<button v-if="data.sourceLang !== 'en' && speechSupported" class="_button" :class="$style.miniSpeak" :aria-label="speakingKey === `${uid}:translation` ? englishLabels.stop : englishLabels.listen" :aria-pressed="speakingKey === `${uid}:translation`" @click="toggleSpeak(`${uid}:translation`, data.translation)">
						<i :class="[speakIcon(`${uid}:translation`), { [$style.spin]: loadingKey === `${uid}:translation` }]"></i>
					</button>
				</div>
				<div class="_selectable" :class="$style.translationText">{{ data.translation }}</div>
				<div v-if="data.tone" :class="$style.tone">{{ data.tone }}</div>
			</section>
			<section v-if="data.items.length > 0">
				<div :class="$style.label">{{ englishLabels.worthLearning }}</div>
				<ul :class="$style.items">
					<li v-for="(item, i) in data.items" :key="i" :class="$style.item">
						<div :class="$style.itemHead">
							<b class="_selectable" :class="$style.phrase">{{ item.text }}</b>
							<span :class="$style.kind">{{ englishLabels.kinds[item.kind] }}</span>
							<button v-if="speechSupported" class="_button" :class="$style.miniSpeak" :aria-label="speakingKey === `${uid}:item:${i}` ? englishLabels.stop : englishLabels.listen" :aria-pressed="speakingKey === `${uid}:item:${i}`" @click="toggleSpeak(`${uid}:item:${i}`, item.text)">
								<i :class="[speakIcon(`${uid}:item:${i}`), { [$style.spin]: loadingKey === `${uid}:item:${i}` }]"></i>
							</button>
							<span class="_selectable" :class="$style.meaning">{{ item.meaning }}</span>
							<button
								class="_button"
								:class="[$style.miniSpeak, $style.save]"
								:aria-label="isSaved(item.text) ? englishLabels.unsave : englishLabels.save"
								:aria-pressed="isSaved(item.text)"
								@click="toggleSave(item)"
							>
								<i :class="isSaved(item.text) ? 'ti ti-bookmark-filled' : 'ti ti-bookmark'"></i>
							</button>
						</div>
						<div v-if="item.usage" class="_selectable" :class="$style.usage">{{ item.usage }}</div>
						<div v-if="item.example" :class="$style.example">
							<button v-if="speechSupported" class="_button" :class="$style.miniSpeak" :aria-label="speakingKey === `${uid}:example:${i}` ? englishLabels.stop : englishLabels.listen" :aria-pressed="speakingKey === `${uid}:example:${i}`" @click="toggleSpeak(`${uid}:example:${i}`, item.example)">
								<i :class="[speakIcon(`${uid}:example:${i}`), { [$style.spin]: loadingKey === `${uid}:example:${i}` }]"></i>
							</button>
							<span class="_selectable">{{ item.example }}</span>
							<span v-if="item.exampleZh" class="_selectable" :class="$style.exampleZh">{{ item.exampleZh }}</span>
						</div>
					</li>
				</ul>
			</section>
			<p :class="$style.foot">{{ englishLabels.byAi }}</p>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, inject, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import type * as Misskey from 'misskey-js';
import type { EnglishExplanation } from '@/lojo/english/api.js';
import { DI } from '@/di.js';
import { englishLabels } from '@/lojo/english/labels.js';
import { englishErrorText, englishStatus, explainNote, loadEnglishStatus } from '@/lojo/english/api.js';
import { currentVoice, loadingKey, openVoiceMenu, speakingKey, speechSupported, stopSpeaking, toggleSpeak } from '@/lojo/english/speech.js';
import { looksEnglish } from '@/lojo/english/text.js';
import { isSaved, loadWordbook, reloadWordbook, toggleWord } from '@/lojo/english/wordbook.js';
import * as os from '@/os.js';

const props = defineProps<{
	note: Misskey.entities.Note;
}>();

const mock = inject(DI.mock, false);
// Per instance, so the same note shown twice (e.g. original and renote) keeps separate play buttons.
const uid = `note-${useId()}`;

const noteId = computed(() => props.note.id);
const text = computed(() => [props.note.cw, props.note.text].filter(x => x != null && x !== '').join('\n'));
const canSpeak = computed(() => speechSupported.value && looksEnglish(text.value));

const panelOpen = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);
const data = ref<EnglishExplanation | null>(null);

onMounted(() => {
	loadEnglishStatus();
});

onBeforeUnmount(() => {
	stopSpeaking(`${uid}:`);
});

async function load() {
	loading.value = true;
	error.value = null;
	try {
		data.value = await explainNote(noteId.value);
	} catch (err) {
		error.value = englishErrorText(err);
	} finally {
		loading.value = false;
	}
}

function toggle() {
	panelOpen.value = !panelOpen.value;
	if (panelOpen.value) loadWordbook();
	if (panelOpen.value && data.value == null && !loading.value) load();
}

async function toggleSave(item: EnglishExplanation['items'][number]) {
	try {
		os.toast(await toggleWord(item, noteId.value) ? englishLabels.saved : englishLabels.removed);
	} catch {
		os.toast(englishLabels.saveFailed);
		reloadWordbook();
	}
}

function speakIcon(key: string): string {
	if (loadingKey.value === key) return 'ti ti-loader-2';
	return speakingKey.value === key ? 'ti ti-player-stop' : 'ti ti-volume';
}
</script>

<style lang="scss" module>
.root {
	margin-top: 6px;
}

.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.action {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 3px 10px;
	border-radius: 999px;
	font-size: 0.8em;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-buttonBg);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}

	&.active {
		background: var(--MI_THEME-accentedBg);
	}
}

.panel {
	margin-top: 8px;
	padding: 12px 14px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panelHighlight);
	font-size: 0.9em;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.label {
	display: flex;
	align-items: center;
	gap: 4px;
	margin-bottom: 4px;
	font-size: 0.85em;
	font-weight: bold;
	opacity: 0.7;
}

.translationText {
	white-space: pre-wrap;
	line-height: 1.6;
}

.tone {
	margin-top: 4px;
	font-size: 0.85em;
	opacity: 0.7;
}

.items {
	margin: 0;
	padding: 0;
	list-style: none;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.item {
	padding-left: 10px;
	border-left: 3px solid var(--MI_THEME-accent);
}

.itemHead {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
}

.phrase {
	color: var(--MI_THEME-fgHighlighted);
}

.kind {
	padding: 0 6px;
	border-radius: 4px;
	font-size: 0.75em;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.meaning {
	font-weight: bold;
}

.usage {
	margin-top: 2px;
	opacity: 0.85;
	line-height: 1.5;
}

.example {
	margin-top: 4px;
	line-height: 1.5;
	font-style: italic;
}

.exampleZh {
	display: block;
	font-style: normal;
	opacity: 0.7;
}

.miniSpeak {
	padding: 2px 4px;
	border-radius: 4px;
	color: var(--MI_THEME-accent);
	font-style: normal;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
	}
}

.save {
	margin-left: auto;
}

.error {
	color: var(--MI_THEME-error);
}

.foot {
	margin: 0;
	font-size: 0.75em;
	opacity: 0.6;
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
