<!-- SPDX-License-Identifier: AGPL-3.0-only -->
<!-- 顶栏：左边回社区（从闯关来就回闯关那一关），中间是标题；有分页（今日 / 单词表）时标题下面一排分页按钮。 -->
<template>
<header class="mini-header-wrap">
	<div class="mini-header">
		<a :href="back" class="mini-back" :aria-label="backLabel"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
		<h1>{{ title }}</h1>
		<span class="mini-spacer"/>
	</div>
	<nav v-if="tabs && tabs.length > 0" class="mini-tabs">
		<button
			v-for="t in tabs" :key="t.key" type="button" class="mini-tab" :class="{ active: t.key === tab }"
			:aria-current="t.key === tab ? 'page' : undefined" @click="emit('update:tab', t.key)"
		>
			<i v-if="t.icon" :class="t.icon" aria-hidden="true"></i> {{ t.title }}
		</button>
	</nav>
</header>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
defineProps<{ tab?: string; tabs?: { key: string; title: string; icon?: string }[]; canOmitTitle?: boolean }>();
const emit = defineEmits<{ (e: 'update:tab', key: string): void }>();
const title = ref(document.title.replace(/ · Vibes$/, ''));
new MutationObserver(() => { title.value = document.title.replace(/ · Vibes$/, ''); }).observe(document.querySelector('title')!, { childList: true });
const q = new URLSearchParams(location.search);
const level = q.get('level');
const back = q.get('from') === 'quest' ? (level ? `/quest?level=${encodeURIComponent(level)}` : '/quest') : '/';
const backLabel = q.get('from') === 'quest' ? '回闯关' : '回社区';
</script>
