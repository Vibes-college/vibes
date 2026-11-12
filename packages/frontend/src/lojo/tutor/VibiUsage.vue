<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- Vibes: the notice above the message box in a chat with Vibi (lojo/tutor/usage-text.ts), only when the allowance is
used up (or gems are being used for it) or the whole-site fuse has blown. The everyday percentages live in the usage
card in the ⋯ menu (VibiUsageSheet.vue; founder, 2026-11-11 23:29). Refreshed when a message comes or goes. -->
<template>
<div v-if="usage && (usage.state !== 'ok' || usage.siteFullUntil)" :class="$style.root" data-vibi-usage :data-state="usage.siteFullUntil ? 'site-full' : usage.state" role="status">
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
	width: calc(100% - 24px);
	max-width: 676px;
	margin: 0 auto 8px;
	padding: 8px 14px;
	box-sizing: border-box;
	font-size: 12px;
	line-height: 1.5;
	border-radius: 14px;
	background: color-mix(in srgb, #D9962B 12%, var(--MI_THEME-panel));
	color: var(--MI_THEME-fg);
}

.text {
	white-space: normal;
}
</style>
