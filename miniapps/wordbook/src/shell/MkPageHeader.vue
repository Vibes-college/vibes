<!-- SPDX-License-Identifier: AGPL-3.0-only -->
<!-- 顶栏：左边回社区（从闯关来就回闯关那一关），中间是标题。 -->
<template>
<header class="mini-header">
	<a :href="back" class="mini-back" :aria-label="backLabel"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
	<h1>{{ title }}</h1>
	<span class="mini-spacer"/>
</header>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
const title = ref(document.title.replace(/ · Vibes$/, ''));
new MutationObserver(() => { title.value = document.title.replace(/ · Vibes$/, ''); }).observe(document.querySelector('title')!, { childList: true });
const q = new URLSearchParams(location.search);
const level = q.get('level');
const back = q.get('from') === 'quest' ? (level ? `/quest?level=${encodeURIComponent(level)}` : '/quest') : '/';
const backLabel = q.get('from') === 'quest' ? '回闯关' : '回社区';
</script>
