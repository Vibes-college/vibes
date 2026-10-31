<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 5 号线 · 词汇: 错词. The stop's words got wrong and not yet spelled right the first time since: practise them, or put
them in the wordbook one by one or all at once. -->
<template>
<section v-if="words.length > 0" :class="$style.root" :aria-labelledby="`${uid}-h`" data-missed>
	<h3 :id="`${uid}-h`" :class="$style.h">{{ L.missedHead(words.length) }}</h3>
	<p :class="$style.note">{{ L.missedNote }}</p>
	<div :class="$style.card">
		<XMissList :words="words" :speech="speech"/>
	</div>
	<div :class="$style.acts">
		<button type="button" class="_button" :class="[$style.btn, $style.primary]" data-practise-missed="meaning" @click="emit('practise', 'meaning')">
			{{ L.practiseWith(L.modes.meaning.name, words.length) }}
		</button>
		<button type="button" class="_button" :class="[$style.btn, $style.ghost]" data-practise-missed="listen" @click="emit('practise', 'listen')">
			{{ L.practiseWith(L.modes.listen.name, words.length) }}
		</button>
	</div>
</section>
<p v-else :class="$style.none" data-missed>{{ L.missedNone }}</p>
</template>

<script lang="ts" setup>
import { useId } from 'vue';
import XMissList from './vocab.misslist.vue';
import type { VocabWord } from '@/lojo/vocab/content.js';
import type { PracticeMode } from '@/lojo/vocab/prefs.js';
import { vocabLabels as L } from '@/lojo/vocab/labels.js';

defineProps<{
	words: VocabWord[];
	speech: boolean;
}>();

const emit = defineEmits<{
	(ev: 'practise', mode: PracticeMode): void;
}>();

const uid = `vocab-missed-${useId()}`;
</script>

<style lang="scss" module>
.root {
	padding-top: 2px;
}

.h {
	margin: 0;
	font-family: var(--vl-serif);
	font-weight: 700;
	font-size: 16px;
	color: var(--vl-ink);
}

.note {
	margin: 4px 0 12px;
	font-size: 12.5px;
	color: var(--vl-weak);
}

.card {
	border-radius: 18px;
	background: var(--vl-badBg);
	padding: 12px 14px 14px;
}

.acts {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 14px;
}

.btn {
	flex: 1 1 200px;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 48px;
	padding: 0 14px;
	border-radius: 15px;
	font-weight: 700;
	font-size: 15px;
	letter-spacing: 0.03em;
	transition: background 0.15s;

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.primary {
	background: var(--MI_THEME-cta);
	color: var(--MI_THEME-fgOnAccent);

	&:hover {
		background: hsl(from var(--MI_THEME-cta) h s calc(l + 5));
	}
}

.ghost {
	background: var(--MI_THEME-buttonBg);
	color: var(--vl-ink);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.none {
	margin: 24px 0;
	text-align: center;
	color: var(--vl-weak);
	font-size: 14px;
}
</style>
