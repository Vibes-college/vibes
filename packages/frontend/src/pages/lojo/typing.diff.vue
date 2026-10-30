<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线: a word as it was typed, next to the right one: wrong or extra letters in red, a gap where one is missing. -->
<template>
<span :class="$style.diff" lang="en">
	<template v-for="(p, i) in parts" :key="i">
		<span v-if="p.t === 'miss'" :class="$style.miss"><span :class="$style.sr">{{ L.missing(p.ch) }}</span></span>
		<span v-else-if="p.t === 'wrong'" :class="$style.x">{{ p.ch }}</span>
		<template v-else>{{ p.ch }}</template>
	</template>
</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { charDiff } from '@/lojo/typing/score.js';
import { typingLabels as L } from '@/lojo/typing/labels.js';

const props = defineProps<{
	typed: string;
	right: string;
	anyCase?: boolean;
}>();

const parts = computed(() => charDiff(props.typed, props.right, props.anyCase));
</script>

<style lang="scss" module>
.diff {
	font-family: var(--tl-mono);
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}

.x {
	color: var(--tl-bad);
	background: var(--tl-badBg);
	text-decoration: underline wavy var(--tl-bad) 1.5px;
	text-underline-offset: 0.2em;
	border-radius: 3px;
}

.miss {
	display: inline-block;
	width: 0.6em;
	height: 1em;
	vertical-align: -0.12em;
	border-bottom: 3px solid var(--tl-bad);
	margin: 0 1px;
}

.sr {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}
</style>
