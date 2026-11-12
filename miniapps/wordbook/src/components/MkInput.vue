<!-- SPDX-License-Identifier: AGPL-3.0-only -->
<!-- 社区 MkInput 的小替身：一个输入框，v-model，前面可以放一个图标（#prefix）。 -->
<template>
<label :class="$style.root">
	<span v-if="$slots.prefix" :class="$style.prefix"><slot name="prefix"></slot></span>
	<input v-model="model" :class="$style.input" :type="type ?? 'text'" :placeholder="placeholder" :autocapitalize="autocapitalize" :aria-label="placeholder"/>
</label>
</template>

<script lang="ts" setup>
defineProps<{ type?: string; placeholder?: string; autocapitalize?: string }>();
const model = defineModel<string>({ default: '' });
</script>

<style lang="scss" module>
.root { display: flex; align-items: center; gap: 6px; height: 38px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--MI_THEME-inputBorder, rgba(0, 0, 0, 0.15)); background: var(--MI_THEME-panel, #fff); color: var(--MI_THEME-fg, #222); box-sizing: border-box; }
.root:focus-within { border-color: var(--MI_THEME-accent, #86b300); }
.prefix { opacity: 0.6; display: flex; }
.input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: inherit; font: inherit; }
</style>
