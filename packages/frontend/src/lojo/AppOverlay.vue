<!--
SPDX-FileCopyrightText: Vibes
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
Vibes（2026-11-16）：小程序的全屏浮层。社区留在下面不动，关掉浮层就回到原来的页面和位置。
怎么打开、怎么关见 app-overlay.ts。这里只管：画浮层、iframe 加载好之前转圈、
小程序想回社区（点了指回社区的链接、用代码跳回社区）时及时接住，别让社区在 iframe 里再开一遍。
-->

<template>
<div
	v-if="appOverlay"
	:class="$style.root"
	:style="{ zIndex }"
	role="dialog"
	aria-modal="true"
	:aria-label="frameTitle"
>
	<iframe
		:key="appOverlay.id"
		ref="frameEl"
		:class="$style.frame"
		:src="appOverlay.src"
		:title="frameTitle"
		allow="autoplay; fullscreen; picture-in-picture; encrypted-media; microphone; camera; clipboard-write; screen-wake-lock"
		allowfullscreen
		@load="onLoad"
	></iframe>
	<div v-if="appOverlayLoading" :class="$style.loading"><MkLoading/></div>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import { appOverlay, appOverlayLoading, leaveAppOverlayTo, registerAppOverlayFrame } from '@/lojo/app-overlay.js';
import { miniAppNameAt } from '@/lojo/miniapps/roster.js';
import { claimZIndex } from '@/os.js';
import { mainRouter } from '@/router.js';

const frameEl = useTemplateRef('frameEl');
const pageTitle = ref('');
// 读屏软件念的名字：小程序页面自己的标题，还没加载好时用小程序清单里的名字
const frameTitle = computed(() => {
	if (pageTitle.value !== '') return pageTitle.value;
	const src = appOverlay.value?.src ?? '';
	return miniAppNameAt(src) ?? 'Vibes';
});
// 只在浮层打开时才挂上（common.vue 里 v-if），每次打开要一个新的层级，盖在社区和它的弹窗上面
const zIndex = claimZIndex('middle');
// 关掉浮层后，焦点回到打开前的那个按钮或链接
const focusBefore = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
let disposed = false;

registerAppOverlayFrame(() => frameEl.value?.contentWindow ?? null);
onBeforeUnmount(() => {
	disposed = true;
	registerAppOverlayFrame(null);
	stopPolling();
	if (focusBefore?.isConnected) focusBefore.focus({ preventScroll: true });
});

function isAppPath(pathname: string): boolean {
	return pathname.startsWith('/apps/');
}

/** 是社区自己的一页（不是 /files、/proxy、/api 这类服务器地址，也不是认不出的地址） */
function isCommunityPage(fullPath: string): boolean {
	const r = mainRouter.resolve(fullPath);
	return r != null && r.route.path !== '/:(*)';
}

/** iframe 里现在的地址（站内，读得到才有） */
function framePath(w: Window): { pathname: string; fullPath: string } | null {
	try {
		const l = w.location;
		if (l.origin !== window.location.origin) return null;
		return { pathname: l.pathname, fullPath: `${l.pathname}${l.search}${l.hash}` };
	} catch {
		return null;
	}
}

// 盯着 iframe 等下一页：一换成社区的地址就关浮层（不等社区在 iframe 里整个加载完）；
// 是小程序的页，HTML 一读完（DOMContentLoaded）就收起转圈、接上拦截——
// 不等 load：load 要等页面里的 YouTube 播放器、图片全部加载完，YouTube 慢或打不开时会一直盖着转圈、点不动。
// 只在刚打开和小程序换页的时候盯（最多 15 秒），平时不跑。
let pollTimer: number | null = null;

function stopPolling() {
	if (pollTimer != null) window.clearInterval(pollTimer);
	pollTimer = null;
}

function watchNextPage(fromHref: string | null) {
	stopPolling();
	if (disposed) return;
	const startedAt = Date.now();
	pollTimer = window.setInterval(() => {
		if (disposed || appOverlay.value == null || Date.now() - startedAt > 15000) {
			stopPolling();
			return;
		}
		const w = frameEl.value?.contentWindow;
		if (w == null) return;
		let href: string;
		let ready: boolean;
		try {
			href = w.location.href;
			ready = w.document.readyState !== 'loading';
		} catch {
			// 跳到别的网站了，读不到；交给 load
			stopPolling();
			return;
		}
		if (href === fromHref || href === 'about:blank') return;
		const p = framePath(w);
		if (p != null && !isAppPath(p.pathname) && isCommunityPage(p.fullPath)) {
			stopPolling();
			leaveAppOverlayTo(p.fullPath);
			return;
		}
		if (!ready) return;
		stopPolling();
		onPageReady();
	}, 30);
}

// 刚打开（或换了一个小程序）时开始盯
watchNextPage(null);
watch(() => appOverlay.value?.id, () => {
	pageTitle.value = '';
	watchNextPage(null);
});

/** 已经接上拦截的页面（DOMContentLoaded 和 load 都会走到这里，只接一次） */
const wired = new WeakSet<Document>();

function onLoad() {
	stopPolling();
	onPageReady();
}

function onPageReady() {
	const w = frameEl.value?.contentWindow;
	if (w == null || appOverlay.value == null) return;
	const p = framePath(w);
	if (p != null && w.location.href === 'about:blank') return;
	if (p != null && !isAppPath(p.pathname) && isCommunityPage(p.fullPath)) {
		// 已经跳回社区了（上面几道都没拦住）：关浮层，社区在原地换过去
		leaveAppOverlayTo(p.fullPath);
		return;
	}
	appOverlayLoading.value = false;
	if (p == null) return;

	try {
		const doc = w.document;
		if (doc.title !== '') pageTitle.value = doc.title;
		if (wired.has(doc)) return;
		wired.add(doc);
		frameEl.value?.focus();

		// 小程序里指回社区的链接（「回社区」「回闯关」）：不在 iframe 里打开，直接关浮层换页
		doc.addEventListener('click', ev => {
			if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
			const a = (ev.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
			// SVG 里的 <a> 的 href 不是字符串，不管它
			if (a == null || typeof a.href !== 'string' || a.hasAttribute('download')) return;
			if (a.target && !['_self', '_top', '_parent'].includes(a.target)) return;
			const u = new URL(a.href);
			const to = `${u.pathname}${u.search}${u.hash}`;
			if (u.origin !== window.location.origin || isAppPath(u.pathname) || !isCommunityPage(to)) return;
			ev.preventDefault();
			ev.stopPropagation();
			leaveAppOverlayTo(to);
		}, true);

		// 用代码跳回社区（location.assign('/quest…')）：浏览器支持 Navigation API 时在出发前拦下
		// 下载文件、提交表单不拦
		type NavigateEvent = Event & { cancelable: boolean; destination: { url: string }; navigationType: string; downloadRequest: string | null; formData: FormData | null };
		const nav = (w as Window & { navigation?: EventTarget }).navigation;
		nav?.addEventListener('navigate', (ev) => {
			const e = ev as NavigateEvent;
			if (e.navigationType === 'traverse' || !e.cancelable || e.downloadRequest != null || e.formData != null) return;
			const u = new URL(e.destination.url);
			const to = `${u.pathname}${u.search}${u.hash}`;
			if (u.origin !== window.location.origin || isAppPath(u.pathname) || !isCommunityPage(to)) return;
			e.preventDefault();
			leaveAppOverlayTo(to);
		});

		// 页面卸掉时（换页、不支持 Navigation API 的浏览器用代码跳走）：盯下一页
		const fromHref = w.location.href;
		w.addEventListener('pagehide', () => watchNextPage(fromHref));
	} catch {
		// 读不到小程序页面（不该发生：小程序和社区同一个网站）
	}
}
</script>

<style lang="scss" module>
.root {
	position: fixed;
	inset: 0;
	box-sizing: border-box;
	padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
	background: var(--MI_THEME-bg);
}

.frame {
	display: block;
	width: 100%;
	height: 100%;
	border: none;
}

.loading {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--MI_THEME-bg);
}
</style>
