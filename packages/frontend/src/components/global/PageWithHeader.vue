<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl"
	:class="[reversed ? '_pageScrollableReversed' : '_pageScrollable', { [$style.mobileTimeline]: chromeEnabled, [$style.navigationHidden]: chromeHidden, [$style.barOnly]: chromeEnabled && reversed }]"
	:data-mobile-timeline="chromeEnabled || undefined"
	@scroll.passive="onScroll"
	@pointerdown.passive="armScroll"
	@touchmove.passive="armScroll"
	@wheel.passive="armScroll"
	@keydown="onKeydown"
>
	<MkStickyContainer :hideHeader="chromeHidden && !reversed" :hideFooter="chromeHidden && !reversed">
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
			<!-- Vibes: the bottom bar folded into a line, as on the quest map (pages/lojo/quest.vue): tap it or swipe it up. -->
			<button
				v-if="collapsedMode && chromeHidden && !keyboardOpen"
				type="button"
				class="_button"
				:class="$style.navHandle"
				aria-label="叫出底栏"
				@click="barShown = true"
				@touchstart.passive="onHandleTouchStart"
				@touchmove.passive="onHandleTouchMove"
			><i></i></button>
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
import { computed, inject, onActivated, onDeactivated, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { scrollInContainer } from '@@/js/scroll.js';
import type { PageHeaderProps } from './MkPageHeader.vue';
import { useScrollPositionKeeper } from '@/composables/use-scroll-position-keeper.js';
import MkSwiper from '@/components/MkSwiper.vue';
import { mainRouter, useRouter } from '@/router.js';
import { prefer } from '@/preferences.js';
import MkTabs from '@/components/MkTabs.vue';
import { DI } from '@/di.js';
import { createScrollChromeTracker } from '@/utility/scroll-chrome.js';
import { keyboardOpen } from '@/lojo/keyboard.js';

const props = withDefaults(defineProps<PageHeaderProps & {
	reversed?: boolean;
	swipable?: boolean;
	autoHideNavigation?: boolean;
	// Vibes: with autoHideNavigation, the bottom bar stays folded into a line until asked for (the chat, founder 11-11).
	collapsedNavigation?: boolean;
}>(), {
	reversed: false,
	swipable: true,
	autoHideNavigation: false,
	collapsedNavigation: false,
});

const pageHeaderProps = computed(() => {
	const { reversed, tab, swipable, autoHideNavigation, collapsedNavigation, ...rest } = props;
	return rest;
});

const pageHeaderPropsWithoutTabs = computed(() => {
	const { reversed, tabs, swipable, autoHideNavigation, collapsedNavigation, ...rest } = props;
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

// Vibes: how far the reader has moved from where the page starts. A chat (reversed) starts at the newest message at
// the bottom and its scrollTop goes negative going up, so reading older messages counts like scrolling down a
// timeline: the bottom bar goes away, and comes back on the way down or at the newest message. In a chat only the
// bottom bar hides; the title and the message box stay.
function scrolled(el: HTMLElement | null | undefined): number | undefined {
	if (el == null) return undefined;
	return props.reversed ? -el.scrollTop : el.scrollTop;
}

// Vibes: the folded bar (collapsedNavigation). Folded is where it rests: on this page the bar comes out only when the
// line is tapped or swiped up, and folds again when the reader scrolls the messages or starts typing. The app shell
// (ui/universal.vue) puts the bar back out on a route change, a resize or a popup; while this page is the one on
// screen, that is folded again at once (sync, so the bar never shows for a frame).
const collapsedMode = computed(() => props.collapsedNavigation && chromeEnabled.value);
const barShown = ref(false);
const onScreen = ref(false);
let armedAt = 0;
let handleY: number | null = null;
watch([collapsedMode, onScreen, barShown, () => chrome?.hidden.value], () => {
	if (!collapsedMode.value || !onScreen.value || chrome == null) return;
	const hidden = !barShown.value;
	if (chrome.hidden.value !== hidden) chrome.hidden.value = hidden;
}, { flush: 'sync', immediate: true });
watch(keyboardOpen, open => {
	if (open) barShown.value = false;
});

function onHandleTouchStart(event: TouchEvent) {
	handleY = event.touches[0]?.clientY ?? null;
}

function onHandleTouchMove(event: TouchEvent) {
	const y = event.touches[0]?.clientY;
	if (handleY != null && y != null && handleY - y > 12) {
		handleY = null;
		barShown.value = true;
	}
}

// Leaving: the next page gets the bar out (pages that fold it themselves, like the quest map, say so on their own).
function leaveCollapsed() {
	onScreen.value = false;
	if (props.collapsedNavigation && chrome != null) chrome.hidden.value = false;
}

onMounted(() => { onScreen.value = true; });
onUnmounted(leaveCollapsed);

function resetChrome() {
	tracker.reset(scrolled(rootEl.value));
	scrollArmed = false;
	if (collapsedMode.value) return;
	if (chrome && chromeEnabled.value) chrome.hidden.value = false;
}

function armScroll() {
	if (!scrollArmed) tracker.reset(scrolled(rootEl.value));
	scrollArmed = true;
	armedAt = scrolled(rootEl.value) ?? 0;
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Tab') resetChrome();
	else if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) armScroll();
}

function onScroll(event: Event) {
	const el = rootEl.value;
	if (!el || event.target !== el || !chromeEnabled.value || !chrome) return;
	const top = scrolled(el)!;
	if (collapsedMode.value) {
		// Scrolling the messages by hand folds the bar again.
		if (scrollArmed && barShown.value && Math.abs(top - armedAt) > 24) barShown.value = false;
		return;
	}
	if (top <= 12 || chrome.blocked.value) {
		resetChrome();
		return;
	}
	// Programmatic restoration after navigating back must not hide the navigation.
	if (!scrollArmed) return;
	const focused = window.document.activeElement;
	if (focused?.matches(':focus-visible') && focused.closest('[data-timeline-navigation]')) return;
	chrome.hidden.value = tracker.update(top, el.scrollHeight - el.clientHeight);
}

watch([chromeEnabled, tab, () => chrome?.blocked.value], resetChrome);
watch(() => chrome?.hidden.value, hidden => {
	if (!hidden) resetChrome();
});
onActivated(() => {
	onScreen.value = true;
	barShown.value = false;
	resetChrome();
});
onDeactivated(() => {
	resetChrome();
	leaveCollapsed();
});

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
	// Vibes: the bar's measured height (ui/universal.vue), the old guess until it is known.
	--MI-stickyBottom: var(--vibes-navH, calc(66.5px + env(safe-area-inset-bottom, 0px)));

	.body {
		padding-bottom: var(--MI-minBottomSpacingMobile);
		box-sizing: border-box;
	}
}

.navigationHidden {
	--MI-floatingBottom: env(safe-area-inset-bottom, 0px);
}

// Vibes: a chat (reversed) keeps its message box in the sticky footer, so the timeline's room for the floating post
// button (72px + 12px or the home indicator) is just empty space between the last message and the box (founder 11-11
// 23:29: too much wasted). The footer itself keeps clear of the bar and the home indicator.
.mobileTimeline.barOnly .body {
	padding-bottom: 0;
}

// Vibes: a chat with the bottom bar away: the message box goes down to the bottom edge, clear of the home indicator.
.barOnly.navigationHidden {
	--MI-stickyBottom: 0px;
	--vibes-chatBottomPad: env(safe-area-inset-bottom, 0px);
}

// The line the folded bar leaves (collapsedNavigation), the same as on the quest map; it keeps clear of the home
// indicator itself, so the chat footer does not.
.barOnly.navigationHidden:has(.navHandle) {
	--vibes-chatBottomPad: 0px;
}

.navHandle {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 120px;
	height: 26px;
	margin: 0 auto;
	padding-bottom: env(safe-area-inset-bottom, 0px);
	box-sizing: content-box;
	touch-action: none;

	> i {
		display: block;
		width: 44px;
		height: 5px;
		border-radius: 3px;
		background: #B9B1A1;
	}
}

// Keyboard up (lojo/keyboard.ts): the bottom bar is gone, so nothing is kept clear for it.
:global(html.vibes-kb-open) .mobileTimeline {
	--MI-stickyBottom: 0px;
	--vibes-chatBottomPad: 0px;

	.body {
		padding-bottom: 0;
	}
}

.footerTabs {
	background: color(from var(--MI_THEME-pageHeaderBg) srgb r g b / 0.75);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	border-top: solid 0.5px var(--MI_THEME-divider);
}
</style>
