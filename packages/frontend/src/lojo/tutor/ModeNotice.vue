<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 聊天模式换了（点名字换的，或在聊天里跟 Momo 说的）：聊天中间一行灰字，只出这一次（lojo/tutor/mode.ts）。 -->
<template>
<div :class="$style.root" role="status" data-mode-notice>
	<span :class="$style.pill"><i :class="MODE_ICONS[mode]"></i> {{ vt.mode.switchedTo(mode) }}</span>
</div>
</template>

<script lang="ts" setup>
import { MODE_ICONS } from './mode.js';
import type { TutorMode } from './mode.js';
import { vt } from '@/lojo/locales/index.js';

defineProps<{
	mode: TutorMode;
}>();
</script>

<style lang="scss" module>
.root {
	display: flex;
	justify-content: center;
	padding: 2px 12px;
}

.pill {
	max-width: 100%;
	padding: 2px 12px;
	border-radius: 999px;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
	opacity: 0.65;
	font-size: 0.8em;
	text-align: center;
	overflow-wrap: anywhere;
}
</style>
