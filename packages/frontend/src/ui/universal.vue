<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { '_forceShrinkSpacer': deviceKind === 'smartphone' }]">
	<XTitlebar v-if="prefer.r.showTitlebar.value" style="flex-shrink: 0;"/>

	<div :class="$style.nonTitlebarArea">
		<XSidebar v-if="!isMobile && !pageMetadata?.hideSidebar" :class="$style.sidebar" :showWidgetButton="!showWidgetsSide" @widgetButtonClick="widgetsShowing = true"/>

		<div :class="[$style.contents, !isMobile && prefer.r.showTitlebar.value ? $style.withSidebarAndTitlebar : null]" @contextmenu.stop="onContextmenu">
			<div>
				<XReloadSuggestion v-if="shouldSuggestReload"/>
				<XPreferenceRestore v-if="shouldSuggestRestoreBackup"/>
				<XThemePreviewing v-if="isThemePreviewMode"/>
				<XAnnouncements v-if="$i"/>
				<XStatusBars :class="$style.statusbars"/>
			</div>
			<StackingRouterView v-if="prefer.s['experimental.stackingRouterView']" :class="$style.content"/>
			<RouterView v-else :class="$style.content"/>
			<XMobileFooterMenu
				v-if="isMobile && !pageMetadata?.hideMobileFooter"
				ref="navFooter"
				v-model:drawerMenuShowing="drawerMenuShowing"
				v-model:widgetsShowing="widgetsShowing"
				:class="{ [$style.timelineFooter]: timelineChromeEnabled, [$style.footerHidden]: timelineChromeHidden, [$style.noAnimation]: !prefer.s.animation }"
				:inert="timelineChromeHidden"
				:aria-hidden="timelineChromeHidden || undefined"
				data-timeline-navigation
			/>
			<button
				v-if="timelineChromeEnabled && isRoot"
				type="button"
				class="_button _buttonGradate"
				:class="[$style.floatingPost, { [$style.floatingPostVisible]: timelineChromeHidden, [$style.noAnimation]: !prefer.s.animation }]"
				:aria-label="i18n.ts.note"
				:inert="!timelineChromeHidden"
				:aria-hidden="!timelineChromeHidden || undefined"
				data-testid="timeline-floating-post"
				@click="os.post()"
			>
				<i class="ti ti-pencil"></i>
			</button>
		</div>

		<div v-if="showWidgetsSide && !pageMetadata?.needWideArea" :class="$style.widgets">
			<XWidgets/>
		</div>
	</div>

	<XCommon v-model:drawerMenuShowing="drawerMenuShowing" v-model:widgetsShowing="widgetsShowing"/>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, provide, computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { instanceName } from '@@/js/config.js';
import { isLink } from '@@/js/is-link.js';
import XCommon from './_common_/common.vue';
import type { PageMetadata } from '@/page.js';
import XMobileFooterMenu from '@/ui/_common_/mobile-footer-menu.vue';
import XPreferenceRestore from '@/ui/_common_/PreferenceRestore.vue';
import XReloadSuggestion from '@/ui/_common_/ReloadSuggestion.vue';
import XThemePreviewing from '@/ui/_common_/ThemePreviewing.vue';
import XTitlebar from '@/ui/_common_/titlebar.vue';
import XSidebar from '@/ui/_common_/navbar.vue';
import { isPreviewMode as isThemePreviewMode } from '@/theme.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import { provideMetadataReceiver, provideReactiveMetadata } from '@/page.js';
import { deviceKind } from '@/utility/device-kind.js';
import { miLocalStorage } from '@/local-storage.js';
import { mainRouter } from '@/router.js';
import { prefer } from '@/preferences.js';
import { shouldSuggestRestoreBackup } from '@/preferences/utility.js';
import { DI } from '@/di.js';
import { shouldSuggestReload } from '@/utility/reload-suggest.js';

const XWidgets = defineAsyncComponent(() => import('./_common_/widgets.vue'));
const XStatusBars = defineAsyncComponent(() => import('@/ui/_common_/statusbars.vue'));
const XAnnouncements = defineAsyncComponent(() => import('@/ui/_common_/announcements.vue'));

const isRoot = computed(() => mainRouter.currentRoute.value.name === 'index');
const isGuideList = computed(() => mainRouter.currentRoute.value.path === '/guides');

const DESKTOP_THRESHOLD = 1100;
const MOBILE_THRESHOLD = 500;

// デスクトップでウィンドウを狭くしたときモバイルUIが表示されて欲しいことはあるので deviceKind === 'desktop' の判定は行わない
const showWidgetsSide = window.innerWidth >= DESKTOP_THRESHOLD;

const isMobile = ref(deviceKind === 'smartphone' || window.innerWidth <= MOBILE_THRESHOLD);

function onResize() {
	isMobile.value = deviceKind === 'smartphone' || window.innerWidth <= MOBILE_THRESHOLD;
	timelineChromeHidden.value = false;
}

const pageMetadata = ref<null | PageMetadata>(null);
const widgetsShowing = ref(false);

provide(DI.router, mainRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
	if (pageMetadata.value) {
		if (isRoot.value && pageMetadata.value.title === instanceName) {
			window.document.title = pageMetadata.value.title;
		} else {
			window.document.title = `${pageMetadata.value.title} | ${instanceName}`;
		}
	}
});
provideReactiveMetadata(pageMetadata);

const drawerMenuShowing = ref(false);
const timelineChromeEnabled = computed(() => !!$i && isMobile.value && (isRoot.value || isGuideList.value) && !pageMetadata.value?.hideMobileFooter);
const timelineChromeHidden = ref(false);
const timelineChromeBlocked = computed(() => drawerMenuShowing.value || widgetsShowing.value || os.popups.value.length > 0);
provide(DI.mobileTimelineChrome, { enabled: timelineChromeEnabled, blocked: timelineChromeBlocked, hidden: timelineChromeHidden });
watch([timelineChromeEnabled, timelineChromeBlocked], () => {
	timelineChromeHidden.value = false;
});

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Tab' && timelineChromeEnabled.value) timelineChromeHidden.value = false;
}

onMounted(() => {
	window.addEventListener('resize', onResize);
	window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
	window.removeEventListener('resize', onResize);
	window.removeEventListener('keydown', onKeydown);
});

mainRouter.on('change', () => {
	drawerMenuShowing.value = false;
	timelineChromeHidden.value = false;
});

if (window.innerWidth > 1024) {
	const tempUI = miLocalStorage.getItem('ui_temp');
	if (tempUI) {
		miLocalStorage.setItem('ui', tempUI);
		miLocalStorage.removeItem('ui_temp');
		window.location.reload();
	}
}

function onContextmenu(ev: PointerEvent) {
	if (isLink(ev.target as HTMLElement)) return;
	if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes((ev.target as HTMLElement).tagName) || (ev.target as HTMLElement).attributes.getNamedItem('contenteditable') != null) return;
	if (window.getSelection()?.toString() !== '') return;
	const path = mainRouter.getCurrentFullPath();
	os.contextMenu([{
		type: 'label',
		text: path,
	}, {
		icon: 'ti ti-window-maximize',
		text: i18n.ts.openInWindow,
		action: () => {
			os.pageWindow(path);
		},
	}], ev);
}
</script>

<style lang="scss" module>
$widgets-hide-threshold: 1090px;

.root {
	height: 100dvh;
	overflow: clip;
	contain: strict;
	display: flex;
	flex-direction: column;
	background: var(--MI_THEME-navBg);
}

.nonTitlebarArea {
	display: flex;
	flex: 1;
	min-height: 0;
}

.sidebar {
	border-right: solid 0.5px var(--MI_THEME-divider);
}

.contents {
	position: relative;
	display: flex;
	flex-direction: column;
	flex: 1;
	height: 100%;
	min-width: 0;

	&.withSidebarAndTitlebar {
		background: var(--MI_THEME-navBg);
		border-radius: 12px 0 0 0;
		overflow: clip;
	}
}

.content {
	flex: 1;
	min-height: 0;
}

.timelineFooter {
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 5;
	transition: transform 200ms ease, visibility 0s;
}

.footerHidden {
	transform: translateY(100%);
	visibility: hidden;
	pointer-events: none;
	transition: transform 200ms ease, visibility 0s 200ms;
}

.floatingPost {
	position: absolute;
	right: max(16px, env(safe-area-inset-right, 0px));
	bottom: calc(16px + env(safe-area-inset-bottom, 0px));
	z-index: 5;
	display: grid;
	place-items: center;
	width: 52px;
	height: 52px;
	border-radius: 50%;
	font-size: 22px;
	box-shadow: 0 4px 20px var(--MI_THEME-shadow);
	opacity: 0;
	visibility: hidden;
	transform: translateY(12px) scale(0.9);
	transition: opacity 160ms ease, transform 200ms ease, visibility 0s 200ms;
	&.floatingPostVisible {
		opacity: 1;
		visibility: visible;
		transform: none;
		transition-delay: 0s;
	}
}

.noAnimation {
	transition: none;
}

@media (prefers-reduced-motion: reduce) {
	.timelineFooter, .floatingPost {
		transition: none;
	}
}

.statusbars {
	position: sticky;
	top: 0;
	left: 0;
}

.widgets {
	width: 350px;
	height: 100%;
	box-sizing: border-box;
	overflow: auto;
	padding: var(--MI-margin) var(--MI-margin) calc(var(--MI-margin) + env(safe-area-inset-bottom, 0px));
	border-left: solid 0.5px var(--MI_THEME-divider);
	background: var(--MI_THEME-bg);

	@media (max-width: $widgets-hide-threshold) {
		display: none;
	}
}
</style>
