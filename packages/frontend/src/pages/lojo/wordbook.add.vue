<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 生词本: 自己加一个词. The word or phrase, its meaning in Chinese, and an example if there is one. Words otherwise
come in by themselves, from the explanations under posts and from dictation. -->
<template>
<form :class="$style.root" :aria-label="wordbookLabels.addOwn" @submit.prevent="submit">
	<p :class="$style.hint">{{ wordbookLabels.addHint }}</p>
	<div :class="$style.row">
		<div :class="$style.field">
			<label :for="`${id}-text`" :class="$style.label">{{ wordbookLabels.fieldText }}</label>
			<input :id="`${id}-text`" ref="textEl" v-model="text" :class="$style.input" type="text" lang="en" maxlength="256" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false">
		</div>
		<div :class="$style.field">
			<label :for="`${id}-meaning`" :class="$style.label">{{ wordbookLabels.fieldMeaning }}</label>
			<input :id="`${id}-meaning`" v-model="meaning" :class="$style.input" type="text" maxlength="1024" autocomplete="off">
		</div>
	</div>
	<div :class="$style.field">
		<label :for="`${id}-example`" :class="$style.label">{{ wordbookLabels.fieldExample }} <span :class="$style.optional">{{ wordbookLabels.optional }}</span></label>
		<input :id="`${id}-example`" v-model="example" :class="$style.input" type="text" lang="en" maxlength="1024" autocapitalize="off" autocomplete="off">
	</div>
	<p v-if="problem" :class="$style.problem" role="alert">{{ problem }}</p>
	<div :class="$style.buttons">
		<MkButton primary rounded inline type="submit" :disabled="saving"><i class="ti ti-plus"></i> {{ wordbookLabels.addSubmit }}</MkButton>
		<MkButton rounded inline @click="emit('cancel')">{{ wordbookLabels.cancel }}</MkButton>
	</div>
</form>
</template>

<script lang="ts" setup>
import { onMounted, ref, useId, useTemplateRef } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { addWord } from '@/lojo/english/wordbook.js';
import { wordbookLabels } from '@/lojo/english/labels.js';
import * as os from '@/os.js';

const emit = defineEmits<{
	// added (true) or already in the wordbook (false)
	(ev: 'done', created: boolean): void;
	(ev: 'cancel'): void;
}>();

const id = `wordbook-add-${useId()}`;
const textEl = useTemplateRef('textEl');
const text = ref('');
const meaning = ref('');
const example = ref('');
const problem = ref<string | null>(null);
const saving = ref(false);

async function submit(): Promise<void> {
	if (saving.value) return;
	const word = text.value.trim().replace(/\s+/g, ' ');
	if (word === '') {
		problem.value = wordbookLabels.needText;
		return;
	}
	if (meaning.value.trim() === '') {
		problem.value = wordbookLabels.needMeaning;
		return;
	}
	problem.value = null;
	saving.value = true;
	try {
		const created = await addWord({
			text: word,
			kind: word.includes(' ') ? 'phrase' : 'word',
			meaning: meaning.value.trim(),
			usage: '',
			example: example.value.trim(),
			exampleZh: '',
		}, 'manual');
		os.toast(created ? wordbookLabels.added(word) : wordbookLabels.alreadyIn(word));
		emit('done', created);
	} catch (err) {
		os.toast((err as { code?: string } | null)?.code === 'TOO_MANY_WORDS' ? wordbookLabels.full : wordbookLabels.saveFailed);
	} finally {
		saving.value = false;
	}
}

onMounted(() => {
	textEl.value?.focus();
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 18px;
	border-radius: 20px;
	background: var(--MI_THEME-panel);
}

.hint {
	margin: 0;
	font-size: 0.88em;
	line-height: 1.6;
	opacity: 0.75;
}

.row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;

	@media (max-width: 420px) {
		grid-template-columns: 1fr;
	}
}

.field {
	display: flex;
	flex-direction: column;
	gap: 5px;
	min-width: 0;
}

.label {
	font-size: 0.85em;
	font-weight: bold;
	color: var(--MI_THEME-brandInk);
}

.optional {
	margin-left: 4px;
	font-weight: normal;
	opacity: 0.65;
}

.input {
	box-sizing: border-box;
	width: 100%;
	height: 44px;
	padding: 0 12px;
	border: 1px solid var(--MI_THEME-inputBorder);
	border-radius: 12px;
	font: inherit;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panel);

	&:hover {
		border-color: var(--MI_THEME-inputBorderHover);
	}

	&:focus {
		outline: none;
		border-color: var(--MI_THEME-accent);
		box-shadow: 0 0 0 3px var(--MI_THEME-accentedBg);
	}
}

.problem {
	margin: 0;
	font-size: 0.9em;
	font-weight: bold;
	color: var(--MI_THEME-error);
}

.buttons {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}
</style>
