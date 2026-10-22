<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl"
	:class="[reversed ? '_pageScrollableReversed' : '_pageScrollable', { [$style.mobileTimeline]: chromeEnabled, [$style.navigationHidden]: chromeHidden }]"
	:data-mobile-timeline="chromeEnabled || undefined"
	@scroll.passive="onScroll"
	@pointerdown.passive="armScroll"
	@touchmove.passive="armScroll"
	@wheel.passive="armScroll"
	@keydown="onKeydown"
>
	<MkStickyContainer :hideHeader="chromeHidden" :hideFooter="chromeHidden">
		<template #header>
			<MkPageHeader v-if="prefer.s.showPageTabBarBottom && (props.tabs?.length ?? 0) > 0" v-bind="pageHeaderPropsWithoutTabs"/>
			<MkPageHeader v-else v-model:tab="tab" v-bind="pageHeaderProps"/>
		</template>
		<div :class="$style.body">
			<MkSwiper v-if="prefer.s.enableHorizontalSwipe && swipable && (props.tabs?.length ?? 1) > 1" v-model:tab="tab" :class="$style.swiper" :tabs="props.tabs ?? []">
				<slot></slot>
			</MkSwiper>
			<slot v-else></slot>
		</div>
		<template #footer>
			<slot name="footer"></slot>
			<div v-if="prefer.s.showPageTabBarBottom && (props.tabs?.length ?? 0) > 0" :class="$style.footerTabs">
				<MkTabs v-model:tab="tab" :tabs="props.tabs" :centered="true" :tabHighlightUpper="true"/>
			</div>
		</template>
		<template v-if="$slots.floating" #floating>
			<slot name="floating"></slot>
		</template>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed, inject, onActivated, onDeactivated, useTemplateRef, watch } from 'vue';
import { scrollInContainer } from '@@/js/scroll.js';
import type { PageHeaderProps } from './MkPageHeader.vue';
import { useScrollPositionKeeper } from '@/composables/use-scroll-position-keeper.js';
import MkSwiper from '@/components/MkSwiper.vue';
import { mainRouter, useRouter } from '@/router.js';
import { prefer } from '@/preferences.js';
import MkTabs from '@/components/MkTabs.vue';
import { DI } from '@/di.js';
import { createScrollChromeTracker } from '@/utility/scroll-chrome.js';

const props = withDefaults(defineProps<PageHeaderProps & {
	reversed?: boolean;
	swipable?: boolean;
	autoHideNavigation?: boolean;
}>(), {
	reversed: false,
	swipable: true,
	autoHideNavigation: false,
});

const pageHeaderProps = computed(() => {
	const { reversed, tab, swipable, autoHideNavigation, ...rest } = props;
	return rest;
});

const pageHeaderPropsWithoutTabs = computed(() => {
	const { reversed, tabs, swipable, autoHideNavigation, ...rest } = props;
	return rest;
});

const tab = defineModel<string>('tab');
const rootEl = useTemplateRef('rootEl');

useScrollPositionKeeper(rootEl);

const router = useRouter();
const chrome = inject(DI.mobileTimelineChrome, null);
const depth = inject(DI.routerCurrentDepth, 0);
const inModal = inject(DI.inModal, false);
const chromeEnabled = computed(() => props.autoHideNavigation && !!chrome?.enabled.value && router === mainRouter && depth === 1 && !inModal);
const chromeHidden = computed(() => chromeEnabled.value && !!chrome?.hidden.value);
const tracker = createScrollChromeTracker();
let scrollArmed = false;

function resetChrome() {
	tracker.reset(rootEl.value?.scrollTop);
	scrollArmed = false;
	if (chrome && chromeEnabled.value) chrome.hidden.value = false;
}

function armScroll() {
	if (!scrollArmed) tracker.reset(rootEl.value?.scrollTop);
	scrollArmed = true;
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Tab') resetChrome();
	else if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) armScroll();
}

function onScroll(event: Event) {
	const el = rootEl.value;
	if (!el || event.target !== el || !chromeEnabled.value || !chrome) return;
	if (el.scrollTop <= 12 || chrome.blocked.value) {
		resetChrome();
		return;
	}
	// Programmatic restoration after navigating back must not hide the navigation.
	if (!scrollArmed) return;
	const focused = window.document.activeElement;
	if (focused?.matches(':focus-visible') && focused.closest('[data-timeline-navigation]')) return;
	chrome.hidden.value = tracker.update(el.scrollTop, el.scrollHeight - el.clientHeight);
}

watch([chromeEnabled, tab, () => chrome?.blocked.value], resetChrome);
watch(() => chrome?.hidden.value, hidden => {
	if (!hidden) resetChrome();
});
onActivated(resetChrome);
onDeactivated(resetChrome);

router.useListener('same', () => {
	scrollToTop();
});

function scrollToTop() {
	if (rootEl.value) scrollInContainer(rootEl.value, { top: 0, behavior: 'smooth' });
}

defineExpose({
	scrollToTop,
});
</script>

<style lang="scss" module>
.body, .swiper {
	min-height: calc(100cqh - (var(--MI-stickyTop, 0px) + var(--MI-stickyBottom, 0px)));
}

.mobileTimeline {
	// Match the native mobile footer (42px button + 24px padding + border).
	--MI-stickyBottom: calc(66.5px + env(safe-area-inset-bottom, 0px));

	.body {
		padding-bottom: var(--MI-minBottomSpacingMobile);
		box-sizing: border-box;
	}
}

.navigationHidden {
	--MI-floatingBottom: env(safe-area-inset-bottom, 0px);
}

.footerTabs {
	background: color(from var(--MI_THEME-pageHeaderBg) srgb r g b / 0.75);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	border-top: solid 0.5px var(--MI_THEME-divider);
}
</style>
