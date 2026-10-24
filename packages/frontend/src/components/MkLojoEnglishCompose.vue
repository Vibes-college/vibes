<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<header :class="$style.header">
		<i :class="mode === 'compose' ? 'ti ti-language' : 'ti ti-bulb'"></i>
		<span :class="$style.title">{{ mode === 'compose' ? englishLabels.composeTitle : englishLabels.ideasTitle }}</span>
		<div v-if="mode === 'compose' && draft" :class="$style.tabs">
			<button
				v-for="v in draft.versions"
				:key="v.style"
				class="_button"
				:aria-pressed="v.style === style"
				:class="[$style.tab, { [$style.tabActive]: v.style === style }]"
				@click="style = v.style"
			>
				{{ englishLabels.styles[v.style] }}
			</button>
		</div>
		<button v-if="mode === 'ideas' && ideas && !loading" class="_button" :class="$style.headerButton" @click="load(true)"><i class="ti ti-refresh"></i> {{ englishLabels.ideasMore }}</button>
		<button class="_button" :class="$style.close" :aria-label="englishLabels.closePanel" @click="emit('close')"><i class="ti ti-x"></i></button>
	</header>

	<MkLoading v-if="loading" mini role="status"/>
	<div v-else-if="error != null" :class="$style.error" role="alert">
		{{ error }}
		<button class="_textButton" @click="load(false)">{{ englishLabels.retry }}</button>
	</div>

	<template v-else-if="mode === 'compose' && draft && current">
		<div v-if="draft.feedback" :class="$style.feedback">
			<b>{{ englishLabels.feedback }}</b> {{ draft.feedback }}
		</div>
		<div :class="$style.version">
			<div class="_selectable" :class="$style.versionText">{{ current.text }}</div>
			<button
				v-if="speechSupported"
				class="_button"
				:class="$style.speak"
				:aria-label="speakingKey === `${uid}:${current.style}` ? englishLabels.stop : englishLabels.listen"
				:aria-pressed="speakingKey === `${uid}:${current.style}`"
				@click="toggleSpeak(`${uid}:${current.style}`, current.text)"
			>
				<i :class="[speakIcon(`${uid}:${current.style}`), { [$style.spin]: loadingKey === `${uid}:${current.style}` }]"></i>
			</button>
		</div>
		<div v-if="current.notes.length > 0" :class="$style.notes">
			<div :class="$style.label">{{ englishLabels.notes }}</div>
			<div v-for="(n, i) in current.notes" :key="i" :class="$style.note">
				<b class="_selectable">{{ n.phrase }}</b> <span class="_selectable">{{ n.explanation }}</span>
			</div>
		</div>
		<div v-if="text.trim() !== sourceText" :class="$style.changed">{{ englishLabels.textChanged }}</div>
		<div :class="$style.buttons">
			<MkButton primary small @click="emit('use', current.text)">{{ englishLabels.useThis }}</MkButton>
			<MkButton small @click="load(false)"><i class="ti ti-refresh"></i> {{ englishLabels.regenerate }}</MkButton>
		</div>
	</template>

	<template v-else-if="mode === 'ideas' && ideas">
		<button v-for="(idea, i) in ideas.ideas" :key="i" class="_button" :class="$style.idea" @click="emit('use', idea.text)">
			<span v-if="idea.angle" :class="$style.angle">{{ idea.angle }}</span>
			<span :class="$style.ideaText">{{ idea.text }}</span>
			<span :class="$style.ideaZh">{{ idea.zh }}</span>
		</button>
		<p :class="$style.foot">{{ englishLabels.ideasPick }}</p>
	</template>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import type { EnglishDraft, EnglishReplyIdeas } from '@/lojo/english/api.js';
import MkButton from '@/components/MkButton.vue';
import { englishLabels } from '@/lojo/english/labels.js';
import { composeEnglish, englishErrorText, replyIdeas } from '@/lojo/english/api.js';
import { loadingKey, speakingKey, speechSupported, stopSpeaking, toggleSpeak } from '@/lojo/english/speech.js';

const props = defineProps<{
	mode: 'compose' | 'ideas';
	text: string;
	replyNoteId?: string | null;
}>();

const emit = defineEmits<{
	(ev: 'use', text: string): void;
	(ev: 'close'): void;
}>();

const uid = `compose-${useId()}`;
const loading = ref(false);
const error = ref<string | null>(null);
const draft = ref<EnglishDraft | null>(null);
const ideas = ref<EnglishReplyIdeas | null>(null);
const style = ref<'casual' | 'slang' | 'formal'>('casual');
const sourceText = ref('');

const current = computed(() => draft.value?.versions.find(v => v.style === style.value) ?? draft.value?.versions[0] ?? null);

async function load(refresh: boolean) {
	loading.value = true;
	error.value = null;
	try {
		if (props.mode === 'compose') {
			sourceText.value = props.text.trim();
			draft.value = await composeEnglish(sourceText.value);
		} else if (props.replyNoteId) {
			ideas.value = await replyIdeas(props.replyNoteId, refresh);
		}
	} catch (err) {
		error.value = englishErrorText(err);
	} finally {
		loading.value = false;
	}
}

onMounted(() => {
	load(false);
});

onBeforeUnmount(() => {
	stopSpeaking(`${uid}:`);
});

function speakIcon(key: string): string {
	if (loadingKey.value === key) return 'ti ti-loader-2';
	return speakingKey.value === key ? 'ti ti-player-stop' : 'ti ti-volume';
}
</script>

<style lang="scss" module>
.root {
	margin: 0 16px 8px;
	padding: 10px 12px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panelHighlight);
	font-size: 0.9em;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.header {
	display: flex;
	align-items: center;
	gap: 6px;
	flex-wrap: wrap;
}

.title {
	font-weight: bold;
}

.tabs {
	display: flex;
	gap: 4px;
	margin-left: 4px;
}

.tab {
	padding: 2px 10px;
	border-radius: 999px;
	font-size: 0.9em;
	background: var(--MI_THEME-buttonBg);

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
	}
}

.tabActive {
	color: var(--MI_THEME-fgOnAccent);
	background: var(--MI_THEME-accent);
}

.headerButton {
	padding: 2px 8px;
	border-radius: 999px;
	font-size: 0.9em;
	color: var(--MI_THEME-accent);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.close {
	margin-left: auto;
	padding: 4px 6px;
	border-radius: 6px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.version {
	display: flex;
	align-items: flex-start;
	gap: 6px;
}

.versionText {
	flex: 1;
	white-space: pre-wrap;
	line-height: 1.6;
	font-size: 1.05em;
}

.speak {
	padding: 4px 6px;
	border-radius: 6px;
	color: var(--MI_THEME-accent);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.label {
	font-size: 0.85em;
	font-weight: bold;
	opacity: 0.7;
	margin-bottom: 2px;
}

.note {
	line-height: 1.5;
}

.feedback {
	padding: 6px 10px;
	border-radius: 6px;
	background: var(--MI_THEME-infoBg);
	color: var(--MI_THEME-infoFg);
	line-height: 1.5;
}

.changed {
	font-size: 0.85em;
	color: var(--MI_THEME-warn);
}

.buttons {
	display: flex;
	gap: 8px;
}

.idea {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 2px;
	width: 100%;
	padding: 8px 10px;
	border-radius: 8px;
	text-align: left;
	background: var(--MI_THEME-buttonBg);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
	}
}

.angle {
	padding: 0 6px;
	border-radius: 4px;
	font-size: 0.8em;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.ideaText {
	line-height: 1.5;
}

.ideaZh {
	font-size: 0.85em;
	opacity: 0.7;
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
