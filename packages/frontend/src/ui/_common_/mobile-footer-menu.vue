<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root">
	<button :class="$style.item" class="_button" :aria-label="i18n.ts.menu" @click="drawerMenuShowing = true">
		<div :class="$style.itemInner">
			<i :class="$style.itemIcon" class="ti ti-menu-2"></i><span v-if="menuIndicated" :class="$style.itemIndicator" class="_blink"><i class="_indicatorCircle"></i></span>
		</div>
	</button>

	<MkA :class="$style.item" :activeClass="$style.active" class="_button" to="/" :aria-label="i18n.ts.timeline" :aria-current="routeName === 'index' ? 'page' : undefined">
		<div :class="$style.itemInner">
			<i :class="$style.itemIcon" class="ti ti-home"></i>
		</div>
	</MkA>

	<MkA :class="$style.item" :activeClass="$style.active" class="_button" to="/map" :aria-label="lojoLabels.map" :aria-current="routeName === 'lojo' ? 'page' : undefined">
		<div :class="$style.itemInner">
			<i :class="$style.itemIcon" class="ti ti-road"></i>
		</div>
	</MkA>

	<MkA :class="$style.item" :activeClass="$style.active" class="_button" to="/guides" aria-label="攻略" :aria-current="routeName === 'lojo-guides' ? 'page' : undefined">
		<div :class="$style.itemInner">
			<i :class="$style.itemIcon" class="ti ti-book"></i>
		</div>
	</MkA>

	<button :class="[$style.item, $style.post]" class="_button" :aria-label="i18n.ts.note" @click="os.post()">
		<div :class="$style.itemInner">
			<i :class="$style.itemIcon" class="ti ti-pencil"></i>
		</div>
	</button>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch } from 'vue';
import * as os from '@/os.js';
import { mainRouter } from '@/router.js';
import { navbarItemDef } from '@/navbar.js';
import { lojoLabels } from '@/lojo/labels.js';
import { i18n } from '@/i18n.js';

const drawerMenuShowing = defineModel<boolean>('drawerMenuShowing');
const widgetsShowing = defineModel<boolean>('widgetsShowing');

const rootEl = useTemplateRef('rootEl');
const routeName = computed(() => mainRouter.currentRoute.value.name);

const menuIndicated = computed(() => {
	for (const def in navbarItemDef) {
		if (navbarItemDef[def].indicated) return true;
	}
	return false;
});

const rootElHeight = ref(0);

watch(rootEl, () => {
	if (rootEl.value) {
		rootElHeight.value = rootEl.value.offsetHeight;
		window.document.body.style.setProperty('--MI-minBottomSpacing', 'var(--MI-minBottomSpacingMobile)');
	} else {
		rootElHeight.value = 0;
		window.document.body.style.setProperty('--MI-minBottomSpacing', '0px');
	}
}, {
	immediate: true,
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	z-index: 1;
	padding-bottom: env(safe-area-inset-bottom, 0px);
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
	width: 100%;
	box-sizing: border-box;
	background: var(--MI_THEME-navBg);
	color: var(--MI_THEME-navFg);
	border-top: solid 0.5px var(--MI_THEME-divider);
}

.item {
	padding: 12px 0;
	text-align: center;

	&.active {
		color: var(--MI_THEME-accent);

		.itemInner {
			background: var(--MI_THEME-accentedBg);
		}
	}

	&:first-child {
		padding-left: 12px;
	}

	&:last-child {
		padding-right: 12px;
	}

	&.post {
		.itemInner {
			background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));
			color: var(--MI_THEME-fgOnAccent);

			&:hover {
				background: linear-gradient(90deg, hsl(from var(--MI_THEME-cta) h s calc(l + 5)), hsl(from var(--MI_THEME-cta) h s calc(l + 5)));
			}

			&:active {
				background: linear-gradient(90deg, hsl(from var(--MI_THEME-cta) h s calc(l + 5)), hsl(from var(--MI_THEME-cta) h s calc(l + 5)));
			}
		}
	}
}

.itemInner {
	position: relative;
	padding: 0;
	aspect-ratio: 1;
	width: 100%;
	max-width: 42px;
	margin: auto;
	align-content: center;
	border-radius: 100%;

	&:hover {
		background: var(--MI_THEME-panelHighlight);
	}

	&:active {
		background: var(--MI_THEME-panelHighlight);
	}
}

.itemIcon {
	font-size: 15px;
}

.itemIndicator {
	position: absolute;
	bottom: -4px;
	left: 0;
	right: 0;
	color: var(--MI_THEME-indicator);
	font-size: 10px;
	pointer-events: none;

	&:has(.itemIndicateValueIcon) {
		animation: none;
		font-size: 8px;
	}
}
</style>
