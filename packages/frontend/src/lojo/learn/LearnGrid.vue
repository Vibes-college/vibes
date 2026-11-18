<!--
SPDX-FileCopyrightText: Vibes
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 学习格子：过去一年每天一格，点一下（电脑上悬停也行）看那天做了什么。手机上横着滑，打开时停在最近这几周。键盘用方向键挪。 -->
<template>
<div>
	<div ref="scroller" :class="$style.scroll" @scroll.passive="pinMonth">
		<div ref="monthsEl" :class="$style.months" aria-hidden="true">
			<span v-for="(m, i) in grid.months" :key="m.col" :style="monthStyle(m.col, i)">{{ m.label }}</span>
		</div>
		<div ref="cellsEl" :class="$style.grid" role="group" :aria-label="learnLabels.gridLabel" @keydown="onKey">
			<button
				v-for="(c, i) in grid.cells"
				:key="c.day"
				type="button"
				class="_button"
				:class="[$style.cell, $style[`l${c.level}`], { [$style.on]: c.day === picked?.day }]"
				:style="{ gridColumn: c.col, gridRow: c.row }"
				:title="c.tip"
				:aria-label="c.tip"
				:aria-pressed="c.day === picked?.day"
				:tabindex="i === focusAt ? 0 : -1"
				:data-i="i"
				@click="pick(i)"
			></button>
		</div>
	</div>
	<div :class="$style.tip" aria-live="polite">{{ picked?.tip ?? learnLabels.gridHint }}</div>
	<div :class="$style.legend">
		<span>{{ learnLabels.gridLearned(grid.learned) }}</span>
		<span :class="$style.scale" aria-hidden="true">
			{{ learnLabels.gridLess }}
			<i v-for="l in 5" :key="l" :class="[$style.cell, $style[`l${l - 1}`]]"></i>
			{{ learnLabels.gridMore }}
		</span>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { buildGrid } from './learn.js';
import type { GridCell, LearnDay } from './learn.js';
import { learnText as learnLabels } from '@/lojo/locales/learn.js';

const props = defineProps<{
	days: LearnDay[];
	today: string;
}>();

const grid = computed(() => buildGrid(props.days, props.today));
const picked = ref<GridCell | null>(null);
const scroller = useTemplateRef('scroller');
const monthsEl = useTemplateRef('monthsEl');
const cellsEl = useTemplateRef('cellsEl');

// 手机上格子横着滑，左边缘常常切在月份字中间（11-17 测试站截图只剩半个「5月」）。左边缘所在那个月的字挪进来贴着边缘完整显示；
// 跟下一个月的字挤在一起时就先不显示。
const pin = ref<{ i: number; x: number | null } | null>(null);

function pinMonth(): void {
	const sc = scroller.value;
	const row = monthsEl.value;
	if (!sc || !row) return;
	const left = sc.scrollLeft;
	const spans = [...row.children] as HTMLElement[];
	let i = -1;
	spans.forEach((el, k) => { if (el.offsetLeft < left) i = k; });
	if (i < 0) { pin.value = null; return; }
	const next = spans[i + 1] as HTMLElement | undefined;
	const room = next == null || next.offsetLeft - left >= spans[i].offsetWidth + 4;
	pin.value = { i, x: room ? left - spans[i].offsetLeft : null };
}

function monthStyle(col: number, i: number): Record<string, string | number> {
	if (pin.value?.i !== i) return { gridColumn: col };
	return pin.value.x == null ? { gridColumn: col, visibility: 'hidden' } : { gridColumn: col, transform: `translateX(${pin.value.x}px)` };
}

// 键盘：整片格子只占一个 Tab 位（默认停在今天），上下键差一天、左右键差一周
const focusAt = ref(-1);
watch(() => grid.value.cells.length, n => { focusAt.value = n - 1; }, { immediate: true });

function pick(i: number): void {
	focusAt.value = i;
	picked.value = grid.value.cells[i] ?? null;
}

const STEP: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };

function onKey(ev: KeyboardEvent): void {
	const n = grid.value.cells.length;
	let i = focusAt.value;
	if (ev.key in STEP) i += STEP[ev.key];
	else if (ev.key === 'Home') i = 0;
	else if (ev.key === 'End') i = n - 1;
	else return;
	ev.preventDefault();
	i = Math.min(Math.max(i, 0), n - 1);
	pick(i);
	cellsEl.value?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.focus();
}

onMounted(() => {
	if (scroller.value) scroller.value.scrollLeft = scroller.value.scrollWidth;
	pinMonth();
});
</script>

<style lang="scss" module>
.scroll {
	// The month labels measure their place from here (pinMonth).
	position: relative;
	overflow-x: auto;
	padding-bottom: 4px;
	--c: 10px;
	--g: 2px;
}

.months, .grid {
	display: grid;
	grid-template-columns: repeat(53, var(--c));
	gap: var(--g);
	width: max-content;
}

.months {
	margin-bottom: 4px;
	font-size: 10px;
	line-height: 1;
	color: color-mix(in srgb, var(--MI_THEME-fg) 55%, transparent);

	> span {
		white-space: nowrap;
	}
}

.grid {
	grid-template-rows: repeat(7, var(--c));
}

.cell {
	display: inline-block;
	width: var(--c, 10px);
	height: var(--c, 10px);
	border-radius: 3px;

	&.on {
		outline: 2px solid var(--MI_THEME-fg);
		outline-offset: 1px;
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 1px;
	}
}

.l0 { background: color-mix(in srgb, var(--MI_THEME-fg) 8%, transparent); }
.l1 { background: color-mix(in srgb, var(--MI_THEME-accent) 30%, transparent); }
.l2 { background: color-mix(in srgb, var(--MI_THEME-accent) 55%, transparent); }
.l3 { background: color-mix(in srgb, var(--MI_THEME-accent) 80%, transparent); }
.l4 { background: var(--MI_THEME-accent); }

.tip {
	margin-top: 10px;
	min-height: 1.5em;
	font-size: 0.9em;
}

.legend {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	gap: 8px;
	margin-top: 8px;
	font-size: 0.85em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent);
}

.scale {
	display: inline-flex;
	align-items: center;
	gap: 3px;
}
</style>
