<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 生词本: expressions saved from the "翻译讲解" panel under posts, newest first. -->
<template>
<div :class="$style.root">
	<MkPageHeader :canOmitTitle="false"/>
	<div :class="$style.body">
		<MkInput v-model="q" type="search" :placeholder="englishLabels.wordbookSearch" autocapitalize="off">
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
		<MkLoading v-if="loading" role="status"/>
		<p v-else-if="wordbook.length === 0" :class="$style.empty">{{ englishLabels.wordbookEmpty }}</p>
		<template v-else>
			<div :class="$style.bar">
				<p :class="$style.count">{{ englishLabels.wordbookCount(shown.length) }}</p>
				<button v-if="speechSupported" class="_button" :class="$style.voice" :aria-label="englishLabels.voiceTitle" @click="openVoiceMenu">
					<i class="ti ti-microphone"></i> {{ currentVoice?.name ?? englishLabels.voice }}
				</button>
			</div>
			<ul :class="$style.list">
				<li v-for="entry in shown" :key="entry.id" class="_panel" :class="$style.card">
					<div :class="$style.head">
						<b class="_selectable" :class="$style.phrase">{{ entry.text }}</b>
						<span :class="$style.kind">{{ englishLabels.kinds[entry.kind] }}</span>
						<button
							v-if="speechSupported"
							class="_button"
							:class="$style.icon"
							:aria-label="speakingKey === `${uid}:${entry.id}` ? englishLabels.stop : englishLabels.listen"
							:aria-pressed="speakingKey === `${uid}:${entry.id}`"
							@click="toggleSpeak(`${uid}:${entry.id}`, entry.text)"
						>
							<i :class="[speakIcon(`${uid}:${entry.id}`), { [$style.spin]: loadingKey === `${uid}:${entry.id}` }]"></i>
						</button>
					</div>
					<div class="_selectable" :class="$style.meaning">{{ entry.meaning }}</div>
					<div v-if="entry.usage" class="_selectable" :class="$style.usage">{{ entry.usage }}</div>
					<div v-if="entry.example" :class="$style.example">
						<button
							v-if="speechSupported"
							class="_button"
							:class="$style.icon"
							:aria-label="speakingKey === `${uid}:${entry.id}:ex` ? englishLabels.stop : englishLabels.listen"
							:aria-pressed="speakingKey === `${uid}:${entry.id}:ex`"
							@click="toggleSpeak(`${uid}:${entry.id}:ex`, entry.example)"
						>
							<i :class="[speakIcon(`${uid}:${entry.id}:ex`), { [$style.spin]: loadingKey === `${uid}:${entry.id}:ex` }]"></i>
						</button>
						<span class="_selectable">{{ entry.example }}</span>
						<span v-if="entry.exampleZh" class="_selectable" :class="$style.exampleZh">{{ entry.exampleZh }}</span>
					</div>
					<div :class="$style.foot">
						<MkA v-if="entry.noteId" :to="`/notes/${entry.noteId}`" class="_link">{{ englishLabels.source }}</MkA>
						<MkTime :time="entry.addedAt" :class="$style.time"/>
						<button class="_button" :class="$style.remove" @click="remove(entry.id)">{{ englishLabels.remove }}</button>
					</div>
				</li>
			</ul>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import MkInput from '@/components/MkInput.vue';
import { englishLabels } from '@/lojo/english/labels.js';
import { loadWordbook, reloadWordbook, removeWord, wordbook } from '@/lojo/english/wordbook.js';
import { currentVoice, loadingKey, openVoiceMenu, speakingKey, speechSupported, stopSpeaking, toggleSpeak } from '@/lojo/english/speech.js';
import { loadEnglishStatus } from '@/lojo/english/api.js';
import * as os from '@/os.js';
import { definePage } from '@/page.js';

const uid = `wordbook-${useId()}`;
const q = ref('');
const loading = ref(true);

const shown = computed(() => {
	const k = q.value.trim().toLowerCase();
	if (k === '') return wordbook.value;
	return wordbook.value.filter(entry => [entry.text, entry.meaning, entry.usage, entry.example].some(x => x.toLowerCase().includes(k)));
});

onMounted(async () => {
	loadEnglishStatus();
	await reloadWordbook();
	loading.value = false;
});

onBeforeUnmount(() => {
	stopSpeaking(`${uid}:`);
});

async function remove(id: string) {
	try {
		await removeWord(id);
		os.toast(englishLabels.removed);
	} catch {
		os.toast(englishLabels.saveFailed);
		loadWordbook();
	}
}

definePage(() => ({ title: englishLabels.wordbook, icon: 'ti ti-notebook' }));

function speakIcon(key: string): string {
	if (loadingKey.value === key) return 'ti ti-loader-2';
	return speakingKey.value === key ? 'ti ti-player-stop' : 'ti ti-volume';
}
</script>

<style lang="scss" module>
.root {
	min-height: 100%;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
}

.body {
	max-width: 760px;
	margin: 0 auto;
	padding: 20px 20px 48px;
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.empty {
	margin: 40px 0;
	text-align: center;
	opacity: 0.7;
	line-height: 1.6;
}

.bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.count {
	margin: 0;
	font-size: 0.85em;
	opacity: 0.7;
}

.voice {
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
	}
}

.list {
	margin: 0;
	padding: 0;
	list-style: none;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.card {
	padding: 14px 16px;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.head {
	display: flex;
	align-items: center;
	gap: 8px;
}

.phrase {
	font-size: 1.15em;
	color: var(--MI_THEME-fgHighlighted);
}

.kind {
	padding: 0 6px;
	border-radius: 4px;
	font-size: 0.75em;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.icon {
	padding: 2px 4px;
	border-radius: 4px;
	color: var(--MI_THEME-accent);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
	}
}

.meaning {
	font-weight: bold;
}

.usage {
	opacity: 0.85;
	line-height: 1.5;
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

.foot {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-top: 4px;
	font-size: 0.85em;
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
