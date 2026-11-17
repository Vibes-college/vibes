<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- The learner's own Momo, head only (founder 11-16 23:54), where the AI tutor shows up inside our own pages (the 「任务」
tab). Took the place of VibiMascot.vue. Avatars elsewhere get the same head through MkAvatar (lojo/tutor/persona.ts). -->

<template>
<img :src="personaHeadUrl(myTutorSeed)" :class="$style.root" :style="{ width: `${size}px` }" alt="" aria-hidden="true" draggable="false" data-momo-head>
</template>

<script lang="ts" setup>
import { personaHeadUrl } from './persona-rules.js';
import { myTutorSeed } from './persona.js';

withDefaults(defineProps<{
	// width in px; the height follows
	size?: number;
}>(), {
	size: 44,
});
</script>

<style lang="scss" module>
.root {
	display: block;
	flex: none;
	aspect-ratio: 202 / 196;
	user-select: none;
}
</style>
