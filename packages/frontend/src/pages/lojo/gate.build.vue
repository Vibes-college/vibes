<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 连词成句: tap the chips in order to build the sentence; tap a chip in the sentence to put it back. A chip that's
been used leaves an empty place in the box, so the others don't move under the finger. -->
<template>
<div ref="rootEl" :class="$style.root">
	<p v-if="item.extra" :class="$style.extra">{{ gateLabels.buildExtra }}</p>
	<div :class="$style.slot" role="group" :aria-label="gateLabels.builtLabel">
		<template v-if="order.length > 0">
			<button
				v-for="(chip, pos) in order"
				:key="`s${chip}`"
				type="button"
				class="_button"
				:class="[$style.chip, $style.placed]"
				:data-chip="`s${pos}`"
				:aria-label="gateLabels.takeBackChip(chips[chip])"
				:disabled="disabled"
				@click="takeBack(pos)"
			><span lang="en">{{ pos === 0 ? capitalized(chips[chip]) : chips[chip] }}</span></button>
			<span :class="$style.period" aria-hidden="true">.</span>
		</template>
		<span v-else :class="$style.placeholder">{{ gateLabels.buildPlaceholder }}</span>
	</div>
	<div :class="$style.pool" role="group" :aria-label="gateLabels.chipsLabel">
		<template v-for="(chip, i) in chips" :key="`p${i}`">
			<span v-if="order.includes(i)" :class="[$style.chip, $style.ghost]" aria-hidden="true">{{ chip }}</span>
			<button
				v-else
				type="button"
				class="_button"
				:class="$style.chip"
				:data-chip="`p${i}`"
				:aria-label="gateLabels.putChip(chip)"
				:disabled="disabled"
				@click="place(i)"
			><span lang="en">{{ chip }}</span></button>
		</template>
	</div>
	<div :class="$style.tools">
		<button type="button" class="_button" :class="$style.tool" :disabled="disabled || order.length === 0" @click="clear">
			<i class="ti ti-eraser" aria-hidden="true"></i> {{ gateLabels.clear }}
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, useTemplateRef } from 'vue';
import { capitalized, decodeBuild, encodeBuild, placeChip, takeBackChip } from '@/lojo/gates/answers.js';
import { gateLabels } from '@/lojo/gates/labels.js';
import type { GateItem } from '@/lojo/gates/player.js';

const props = defineProps<{
	item: GateItem;
	disabled?: boolean;
}>();

// the chips' places in the item's list, in the order tapped ("4,1,3")
const value = defineModel<string>({ default: '' });

const rootEl = useTemplateRef('rootEl');
// the chips in the order the paper shows them
const chips = computed(() => props.item.options);
const order = computed(() => decodeBuild(value.value, chips.value.length));

// The chip tapped leaves the box (or the sentence), so the focus goes to its neighbour for keyboard users.
function focusChip(key: string) {
	void nextTick(() => rootEl.value?.querySelector<HTMLElement>(`[data-chip="${key}"]`)?.focus({ preventScroll: true }));
}

function place(i: number) {
	if (props.disabled) return;
	const next = placeChip(order.value, i);
	value.value = encodeBuild(next);
	const free = chips.value.map((_, k) => k).filter(k => !next.includes(k));
	const neighbour = free.find(k => k > i) ?? free[0];
	focusChip(neighbour != null ? `p${neighbour}` : `s${next.length - 1}`);
}

function takeBack(pos: number) {
	if (props.disabled) return;
	const chip = order.value[pos];
	const next = takeBackChip(order.value, pos);
	value.value = encodeBuild(next);
	focusChip(next.length > 0 ? `s${Math.min(pos, next.length - 1)}` : `p${chip}`);
}

function clear() {
	if (props.disabled) return;
	value.value = '';
	focusChip('p0');
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.extra {
	margin: 0;
	font-size: 0.85em;
	font-weight: bold;
	color: var(--MI_THEME-accent);
}

.slot {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	align-content: flex-start;
	gap: 8px 6px;
	min-height: 108px;
	padding: 10px;
	border: 1.5px dashed var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panelHighlight);
}

.placeholder {
	padding: 0 4px;
	font-size: 0.85em;
	opacity: 0.65;
}

.period {
	margin-left: -2px;
	font-size: 1.3em;
	font-weight: 800;
}

.pool {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 10px 8px;
	padding: 2px 0;
}

.chip {
	display: inline-flex;
	align-items: center;
	min-height: 44px;
	padding: 0 14px;
	border-radius: 12px;
	font-size: 1.05em;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panel);
	box-shadow: 0 0 0 1.5px var(--MI_THEME-divider), 0 3px 0 0 var(--MI_THEME-divider);
	transition: transform 0.08s ease, box-shadow 0.08s ease;

	&:hover:not(:disabled) {
		box-shadow: 0 0 0 1.5px var(--MI_THEME-accent), 0 3px 0 0 color-mix(in srgb, var(--MI_THEME-accent) 40%, var(--MI_THEME-divider));
	}

	&:active:not(:disabled) {
		transform: translateY(2px);
		box-shadow: 0 0 0 1.5px var(--MI_THEME-divider), 0 1px 0 0 var(--MI_THEME-divider);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}

	&:disabled {
		cursor: default;
		opacity: 0.7;
	}
}

.placed {
	box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--MI_THEME-accent) 45%, var(--MI_THEME-divider)), 0 3px 0 0 color-mix(in srgb, var(--MI_THEME-accent) 45%, var(--MI_THEME-divider));
}

// where a used chip was: keeps its size, shows nothing
.ghost {
	color: transparent;
	background: var(--MI_THEME-panelHighlight);
	box-shadow: inset 0 0 0 1.5px var(--MI_THEME-divider);
	user-select: none;
}

.tools {
	display: flex;
	justify-content: flex-end;
}

.tool {
	min-height: 36px;
	padding: 0 14px;
	border-radius: 999px;
	font-size: 0.9em;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-buttonBg);

	&:hover:not(:disabled) {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:disabled {
		opacity: 0.45;
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}
</style>
