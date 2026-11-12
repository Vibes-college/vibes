<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线: a dot per item of a stop, ✓ / ✗ once done, the current one ringed. -->
<template>
<ol :class="$style.marks" :aria-label="L.marksLabel">
	<li
		v-for="k in total"
		:key="k"
		:class="[$style.mk, { [$style.now]: k - 1 === current && results[k - 1] == null, [$style.ok]: results[k - 1] === true, [$style.bad]: results[k - 1] === false }]"
		:aria-label="L.mark(k, results[k - 1] === true ? 'ok' : results[k - 1] === false ? 'bad' : k - 1 === current ? 'now' : null)"
		:aria-current="k - 1 === current ? 'step' : undefined"
	>
		{{ results[k - 1] === true ? '✓' : results[k - 1] === false ? '✗' : k }}
	</li>
</ol>
</template>

<script lang="ts" setup>
import { typingLabels as L } from '@/lojo/typing/labels.js';

defineProps<{
	total: number;
	// right or wrong, item by item, as far as done
	results: boolean[];
	current: number;
}>();
</script>

<style lang="scss" module>
.marks {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 6px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.mk {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: grid;
	place-items: center;
	font-size: 12px;
	font-weight: 800;
	background: var(--MI_THEME-panel);
	color: var(--tl-weak);
	box-shadow: inset 0 0 0 1.5px var(--tl-line);

	&.now {
		box-shadow: inset 0 0 0 2.5px var(--tl-c);
		color: var(--tl-c);
	}

	&.ok {
		background: var(--tl-ok);
		color: var(--tl-onC);
		box-shadow: none;
	}

	&.bad {
		background: var(--tl-bad);
		color: var(--tl-onC);
		box-shadow: none;
	}
}
</style>
