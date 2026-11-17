<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
Vibes: Vibi, the AI tutor's little ghost. It is the old site's picture (Desktop/Vibes src/assets/local-assistant-mascot.png)
with only the color changed (founder 11-16: same shape and face as before, just not the cyan-to-purple gradient, which
the community does not use). The picture is split in two, both cut from that file with the same framing as the old
mascot.webp: vibi-shape.webp is the outline, filled here with the theme accent (cobalt in Vibes Light, the lighter blue in
Vibes Dark); vibi-face.webp is the white face and the eyes, laid on top as they were.
The script that cuts them: 冲刺1111/Vibi/任务页打磨-1116/原图换色/make.py in the workspace.
-->

<template>
<span :class="$style.root" data-vibi-mascot :style="{ width: `${size * 120 / 156}px`, height: `${size}px` }" aria-hidden="true">
	<span :class="$style.body" :style="{ maskImage: shapeMask, WebkitMaskImage: shapeMask }"></span>
	<img :src="faceUrl" :class="$style.face" alt="" draggable="false"/>
</span>
</template>

<script lang="ts" setup>
import shapeUrl from './vibi-shape.webp';
import faceUrl from './vibi-face.webp';

withDefaults(defineProps<{
	// height in px; the width follows
	size?: number;
}>(), {
	size: 48,
});

const shapeMask = `url(${shapeUrl})`;
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: block;
	flex: none;
}

.body {
	position: absolute;
	inset: 0;
	background: var(--MI_THEME-accent);
	mask-size: 100% 100%;
	mask-repeat: no-repeat;
	-webkit-mask-size: 100% 100%;
	-webkit-mask-repeat: no-repeat;
}

.face {
	position: absolute;
	inset: 0;
	display: block;
	width: 100%;
	height: 100%;
	pointer-events: none;
	user-select: none;
}
</style>
