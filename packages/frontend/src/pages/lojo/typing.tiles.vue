<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线: a row of numbers (准确率, 速度, 进度…), each with what it has to reach, green once reached. `soft`: the
result's centred tiles. -->
<template>
<div :class="[$style.tiles, { [$style.two]: tiles.length === 2, [$style.soft]: soft }]">
	<div v-for="t in tiles" :key="t.id" :class="$style.tile" :data-tile="t.id">
		<small>{{ t.label }}</small>
		<b>{{ t.value }}<span v-if="t.unit">{{ t.unit }}</span></b>
		<span v-if="t.goal" :class="[$style.goal, { [$style.met]: t.met }]">{{ t.goal }}</span>
	</div>
</div>
</template>

<script lang="ts">
export type Tile = { id: string; label: string; value: string; unit?: string; goal?: string; met?: boolean };
</script>

<script lang="ts" setup>
defineProps<{
	tiles: Tile[];
	soft?: boolean;
}>();
</script>

<style lang="scss" module>
.tiles {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 8px;

	&.two {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

.tile {
	min-width: 0;
	background: var(--MI_THEME-panel);
	border-radius: 16px;
	padding: 9px 12px 10px;
	box-shadow: inset 0 0 0 1.5px var(--tl-line);

	> small {
		display: block;
		font-size: 12px;
		color: var(--tl-weak);
		font-weight: 600;
	}

	> b {
		display: block;
		font-size: 24px;
		line-height: 1.2;
		color: var(--tl-ink);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.01em;
		overflow-wrap: anywhere;

		> span {
			font-size: 13px;
			color: var(--tl-weak);
			font-weight: 600;
			letter-spacing: 0;
		}
	}

	.soft & {
		background: var(--tl-hi);
		box-shadow: none;
		text-align: center;
	}
}

.goal {
	display: block;
	font-size: 11.5px;
	color: var(--tl-weak);
	margin-top: 1px;

	&.met {
		color: var(--tl-ok);
		font-weight: 700;
	}
}

@container typing (min-width: 720px) {
	.tile > b {
		font-size: 28px;
	}
}
</style>
