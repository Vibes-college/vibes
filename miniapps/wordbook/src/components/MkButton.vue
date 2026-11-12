<!-- SPDX-License-Identifier: AGPL-3.0-only -->
<!-- 社区 MkButton 的小替身：普通按钮，或者 type="routerLink" 时是链接（整页跳转）。 -->
<template>
<a v-if="type === 'routerLink'" :href="to" :class="['mk-btn', { primary, rounded, large, danger, full }]"><slot/></a>
<button v-else :type="type === 'submit' ? 'submit' : 'button'" :disabled="disabled" :class="['mk-btn', { primary, rounded, large, danger, full }]" @click="emit('click', $event)"><slot/></button>
</template>
<script lang="ts" setup>
defineProps<{ type?: string; to?: string; primary?: boolean; rounded?: boolean; large?: boolean; danger?: boolean; full?: boolean; disabled?: boolean }>();
const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>();
</script>
