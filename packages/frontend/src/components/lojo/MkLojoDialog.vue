<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow ref="modal" :width="580" :height="720" @close="controller.close" @click="controller.close" @esc="controller.close" @closed="emit('closed')">
	<template #header>{{ controller.title.value }}</template>
	<div ref="body" :class="$style.body" role="dialog" :aria-label="controller.title.value"></div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { getCurrentInstance, nextTick, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue';
import type { LojoDialogController } from '@/lojo/native-dialog.js';
import MkModalWindow from '@/components/MkModalWindow.vue';

const props = defineProps<{ controller: LojoDialogController }>();
const emit = defineEmits<{ (event: 'closed'): void }>();
const body = useTemplateRef('body');
const modal = useTemplateRef('modal');
const instance = getCurrentInstance()!;

watch(props.controller.closed, () => modal.value?.close(), { flush: 'sync' });
onMounted(() => {
	if (props.controller.closed.value) { modal.value?.close(); return; }
	props.controller.attach(body.value!, instance.appContext);
	void nextTick(() => body.value?.querySelector<HTMLElement>('input:not([hidden]):not([type="hidden"]),textarea,[data-lojo-native] button,[data-lojo-native] [tabindex="0"]')?.focus({ preventScroll: true }));
});
onBeforeUnmount(() => props.controller.close());
</script>

<style lang="scss" module>
.body {
	padding: 24px;
	color: var(--MI_THEME-fg);
	font-size: 14px;
	line-height: 1.6;
	overflow-wrap: anywhere;
	--paper: var(--MI_THEME-panel);
	--ink: var(--MI_THEME-fg);
	--muted: var(--MI_THEME-fgTransparentWeak);
	--line: var(--MI_THEME-divider);
	--green: var(--MI_THEME-accent);

	:global(.lojo-native-dialog) {
		position: static;
		display: block;
		width: auto;
		max-width: none;
		max-height: none;
		padding: 0;
		margin: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		overflow: visible;
	}

	:global(.dialog-close), :global(.planner-dialog-head), :global(.housing-dialog-head), :global(.lojo-native-dialog) > h2 {
		display: none;
	}

	:global(.lojo-native-dialog) {
		form { display: flex; flex-direction: column; gap: 20px; }
		p { margin: 0 0 16px; }
		h3, h4 { font-size: 1em; margin: 0 0 8px; }
		img:not(:global(.icon)) { max-width: 100%; object-fit: cover; border-radius: var(--MI-radius); }
		:global(.icon) { width: 20px; height: 20px; vertical-align: middle; }
		:global(.lojo-icon) { display: inline-block; background: currentColor; mask-image: var(--lojo-icon); mask-size: contain; mask-position: center; mask-repeat: no-repeat; }
		:global(.field-label) { display: block; margin: 0; }
		:global(.planner-form-grid), :global(.planner-fields), :global(.planner-search-meta), :global(.housing-form-grid), :global(.form-grid) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
		:global(.planner-three) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
		:global(.button-row), :global(.planner-form-actions), :global(.planner-add-methods), :global(.housing-contact-form-actions), :global(.dialog-tags), :global(.trip-filter-chips) { display: flex; flex-wrap: wrap; gap: 8px; }
		:global(.planner-add-methods), :global(.planner-coordinates) { margin-block: 16px; }
		:global(.planner-search-bar) { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 8px; }
		:global(.housing-check-options), :global(.housing-checklist), :global(.create-kind-choices) { display: flex; flex-direction: column; gap: 16px; }
		fieldset { border: 1px solid var(--MI_THEME-divider); padding: 16px; border-radius: var(--MI-radius); }
		:global(.housing-field-note), :global(.planner-field-note), small { font-size: .9em; color: var(--MI_THEME-fgTransparentWeak); }
		[role="alert"] { margin: 0; color: var(--MI_THEME-error); }
		[role="alert"]:empty { display: none; }
		:global(.housing-contact-card), :global(.planner-source-card), :global(.trip-source-card), :global(.housing-contact-editor) { padding: 20px; margin-block: 12px; border-radius: var(--MI-radius); background: var(--MI_THEME-panel); }
		:global(.housing-contact-meta) { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
		:global(.housing-contact-avatar) { display: grid; place-items: center; width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%; background: var(--MI_THEME-accentedBg); color: var(--MI_THEME-accent); }
		:global(.housing-badge) { display: inline-block; padding: 2px 8px; font-size: .85em; border-radius: var(--MI-radius); background: var(--MI_THEME-buttonBg); }
		:global(.housing-fee-promise), :global(.housing-contact-status) { padding: 16px; margin-block: 16px; border-radius: var(--MI-radius); background: var(--MI_THEME-infoBg); color: var(--MI_THEME-infoFg); }
		:global(.housing-contact-commitments) { display: flex; flex-wrap: wrap; gap: 8px; margin-block: 16px; }
		:global(.housing-contact-commitments) > span { padding: 4px 8px; border-radius: var(--MI-radius); background: var(--MI_THEME-buttonBg); }
		dl > div { display: flex; justify-content: space-between; gap: 16px; padding-block: 8px; border-bottom: 1px solid var(--MI_THEME-divider); }
		dd { margin: 0; text-align: right; }
		details { margin-block: 16px; }
		summary { cursor: pointer; }
		li { margin-block: 8px; }
		:global(.planner-search-result), :global(.planner-result) { display: flex; align-items: center; gap: 12px; padding-block: 16px; border-bottom: 1px solid var(--MI_THEME-divider); }
		:global(.planner-result) > img { width: 48px; height: 48px; flex-shrink: 0; }
		:global(.planner-result-icon) { display: grid; place-items: center; width: 48px; height: 48px; border-radius: var(--MI-radius); background: var(--MI_THEME-buttonBg); }
		:global(.planner-search-result) > div:not([data-lojo-native]), :global(.planner-result) > div:not([data-lojo-native]) { flex: 1; min-width: 0; }
		:global(.planner-result) strong, :global(.planner-result) > div > span { display: block; }
		:global(.planner-result) > div > span { color: var(--MI_THEME-fgTransparentWeak); font-size: .9em; }
		[data-lojo-native="button"] { display: block; }
		[data-lojo-native="field"] { min-width: 0; }
		[data-lojo-native="file"] { display: grid; gap: 8px; }
	}

	@media (max-width: 500px) {
		padding: 20px 16px;
		:global(.lojo-native-dialog) :global(.housing-contact-card) { padding: 16px; }
		:global(.lojo-native-dialog) :global(.planner-three) { grid-template-columns: 1fr; }
	}
}
</style>
