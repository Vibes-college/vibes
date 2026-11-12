<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- Vibes: the usage line under a chat with Vibi (lojo/tutor/usage-text.ts). Refreshed when a message comes or goes. -->
<template>
<div v-if="usage" :class="[$style.root, usage.state !== 'ok' || usage.siteFullUntil ? $style.done : null]" data-vibi-usage :data-state="usage.siteFullUntil ? 'site-full' : usage.state" role="status">
	<div v-if="usage.state === 'ok' && !usage.siteFullUntil" :class="$style.bar"><div :class="[$style.fill, pct >= 80 ? $style.high : null]" :style="{ width: `${pct}%` }"></div></div>
	<div :class="$style.text">{{ text }}</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { lang } from '@@/js/config.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { usageText } from '@/lojo/tutor/usage-text.js';
import type { VibiUsage } from '@/lojo/tutor/usage-text.js';

const props = defineProps<{ tick: number }>();
const zh = lang.startsWith('zh');
const usage = ref<VibiUsage | null>(null);
const now = ref(new Date());
let timer: number | null = null;
let backTimer: number | null = null;

const pct = computed(() => Math.max(usage.value?.fivePct ?? 0, usage.value?.weekPct ?? 0));
const text = computed(() => usage.value ? usageText(usage.value, now.value, zh) : '');

async function load() {
	try {
		usage.value = await misskeyApi('lojo/usage/show', {}) as VibiUsage;
		now.value = new Date();
		if (backTimer != null) window.clearTimeout(backTimer);
		backTimer = null;
		// Come back on time when the allowance resets (at most a day ahead; timers further out are not worth it).
		const until = usage.value.siteFullUntil ?? usage.value.backAt;
		const wait = until ? new Date(until).getTime() - Date.now() + 2000 : null;
		if (wait != null && wait > 0 && wait < 86400000) backTimer = window.setTimeout(load, wait);
	} catch { /* the line just stays as it was */ }
}

// A message just sent or received: the charge lands after Vibi answers, so look again a moment later as well.
watch(() => props.tick, () => {
	if (timer != null) window.clearTimeout(timer);
	timer = window.setTimeout(() => { load(); timer = window.setTimeout(load, 6000); }, 1500);
});

onMounted(load);
onBeforeUnmount(() => {
	if (timer != null) window.clearTimeout(timer);
	if (backTimer != null) window.clearTimeout(backTimer);
});
</script>

<style lang="scss" module>
.root {
	margin: 0 auto 6px;
	max-width: 700px;
	padding: 0 12px;
	box-sizing: border-box;
	font-size: 11px;
	opacity: 0.75;
}

.done {
	opacity: 1;
	font-size: 12px;
	padding: 6px 12px;
	border-radius: 8px;
	background: var(--MI_THEME-infoWarnBg, rgba(255, 180, 0, 0.12));
	color: var(--MI_THEME-infoWarnFg, inherit);
}

.bar {
	height: 3px;
	border-radius: 2px;
	background: var(--MI_THEME-divider);
	overflow: hidden;
	margin-bottom: 3px;
}

.fill {
	height: 100%;
	background: var(--MI_THEME-accent);
}

.high {
	background: var(--MI_THEME-warn);
}

.text {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.done .text {
	white-space: normal;
}
</style>
