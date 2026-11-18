/*
 * SPDX-FileCopyrightText: Vibes
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes（2026-11-16，创始人在 iPhone Safari 上发现）：小程序（/apps/<名字>/：精听播放器、生词本、听写、打字、词汇、语法……）
// 是社区外面的独立网页。原来从社区点进去是整页跳走，回来时整个社区要从头打开（开屏画面加载几秒）。
// 现在从社区里打开小程序，一律放进盖住整个屏幕的浮层（AppOverlay.vue，里面是 iframe），社区留在下面不动：
// 关掉浮层就回到原来的时间线和位置，不重新加载。
//   - 打开：社区里的链接（<a href="/apps/…">、MkA）、路由跳转（mainRouter.pushByPath，含旧地址 /wordbook、/vocab/5.2 等）、
//     小程序入口（openMiniAppLink）、YouTube 卡片的「精听播放器」（手机上）。
//   - 关掉：手机的返回手势 / 浏览器返回键（打开时记了一条历史）；小程序发来 postMessage {type:'vibes-app:close'}
//     或 {type:'vibes-player:close'}（播放器 v0.4.2 起）；小程序里点了指回社区的链接，或用代码跳回社区
//     （location.assign('/quest…')）：关浮层，社区在原地换到那一页。
// 直接打开小程序地址（不经过社区）不受影响，还是整页。

import { ref, shallowRef } from 'vue';
import { mainRouter } from '@/router.js';

export const appOverlay = shallowRef<{ src: string; id: string } | null>(null);
/** 浮层里的 iframe 第一次加载完之前是 true（显示转圈） */
export const appOverlayLoading = ref(false);

let historyLengthAtOpen = 0;
let getFrameWindow: (() => Window | null) | null = null;

/** AppOverlay.vue 把自己的 iframe 交过来，好算小程序里自己走了几步 */
export function registerAppOverlayFrame(fn: (() => Window | null) | null): void {
	getFrameWindow = fn;
}

/** 社区里指向小程序的地址 → 小程序真正的地址；不是小程序就 null。规则和 pages/lojo/to-app.vue 一样。 */
export function miniAppTarget(fullPath: string): string | null {
	let u: URL;
	try {
		u = new URL(fullPath, window.location.origin);
	} catch {
		return null;
	}
	if (u.origin !== window.location.origin) return null;
	const parts = u.pathname.split('/');
	if (parts[1] === 'apps' && /^[a-z0-9-]+$/i.test(parts[2] ?? '')) return `${u.pathname}${u.search}${u.hash}`;
	// 小程序搬出社区（11-12）以前的旧地址
	if (['wordbook', 'dictation', 'typing'].includes(parts[1]) || (['vocab', 'grammar'].includes(parts[1]) && parts[2])) {
		return `/apps/${parts[1]}/${parts.slice(2).join('/')}${u.search}${u.hash}`;
	}
	return null;
}

/** 个人主页小程序的旧地址（2026-11-17 搬进社区）：/apps/works/u/<用户名>(/<专业>) → 资料页「学习」标签，
 * /apps/works/（管理页）→ /my/learn；不是就 null */
export function learnTabPath(fullPath: string): string | null {
	let u: URL;
	try {
		u = new URL(fullPath, window.location.origin);
	} catch {
		return null;
	}
	if (u.origin !== window.location.origin) return null;
	if (/^\/apps\/works(?:\/(?:index\.html)?)?$/.test(u.pathname)) return `/my/learn${u.hash === '#work' ? '#work' : ''}`;
	const m = /^\/apps\/works\/u\/([A-Za-z0-9_]{1,128})\/?(?:([a-z0-9-]{1,32})\/?)?(?:index\.html)?$/.exec(u.pathname);
	return m ? `/@${m[1]}/learn${m[2] != null && m[2] !== 'index' ? `?work=${m[2]}` : ''}` : null;
}

export function openAppOverlay(target: string): void {
	const src = miniAppTarget(target);
	if (src == null) {
		window.location.href = target;
		return;
	}
	const id = Math.random().toString(36).slice(2);
	if (appOverlay.value == null) {
		// 记一条和现在一样地址的历史：手机返回手势先关浮层，不离开社区
		window.history.pushState({ ...(window.history.state ?? {}), vibesAppOverlay: id }, '', window.location.href);
		historyLengthAtOpen = window.history.length;
	}
	appOverlayLoading.value = true;
	appOverlay.value = { src, id };
}

/** 从现在这一步退回到打开浮层之前，要退几步：浮层自己那 1 步，加上小程序在 iframe 里自己走的几步 */
function stepsBack(): number {
	let inner: number | null = null;
	try {
		const nav = (getFrameWindow?.() as (Window & { navigation?: { currentEntry?: { index: number } | null } }) | null)?.navigation;
		if (nav?.currentEntry != null && nav.currentEntry.index >= 0) inner = nav.currentEntry.index;
	} catch {
		// 小程序已经跳到别的网站，读不到
	}
	if (inner == null) inner = Math.max(0, window.history.length - historyLengthAtOpen);
	return 1 + inner;
}

/** 收起浮层，不动历史记录（已经由返回手势退回去了） */
function dismiss(): void {
	appOverlay.value = null;
	appOverlayLoading.value = false;
}

/** 小程序要求关掉（「回社区」）：收起浮层，并退掉打开时记的那条历史（和小程序里自己走过的几步） */
export function closeAppOverlay(): void {
	if (appOverlay.value == null) return;
	const steps = stepsBack();
	dismiss();
	window.history.go(-steps);
}

/**
 * 小程序要去的社区地址，是不是就等于「关掉浮层、回到打开前那一页」：
 * 要去的就是下面这一页；或者是首页「/」——小程序左上角的「<」（回社区）都指向「/」，
 * 从 Momo 聊天、资料页等地方点开时，学员要回的是原来那一页，不是首页（创始人 11-18「小程序返回改回原页」）。
 */
export function overlayGoesBack(fullPath: string, here: string): boolean {
	return fullPath === here || fullPath === '/';
}

/** 小程序要去社区里的另一页（「回闯关」等）：收起浮层，社区在原地换过去 */
export function leaveAppOverlayTo(fullPath: string): void {
	if (appOverlay.value == null) return;
	if (overlayGoesBack(fullPath, mainRouter.getCurrentFullPath())) {
		closeAppOverlay();
		return;
	}
	const onOverlayEntry = stepsBack() === 1;
	dismiss();
	if (onOverlayEntry) {
		// 把「浮层」那条历史直接换成新的一页，返回时回到原来的社区页
		mainRouter.replaceByPath(fullPath);
	} else {
		mainRouter.pushByPath(fullPath);
	}
}

let installed = false;

export function installAppOverlay(): void {
	if (installed) return;
	installed = true;

	// 返回手势 / 返回键：退回到没有浮层标记的那条历史，就收起浮层
	// （看事件自带的 state：router.ts 先收到 popstate，会把 history.state 换成 {}）
	window.addEventListener('popstate', ev => {
		if (appOverlay.value == null) return;
		if ((ev.state as { vibesAppOverlay?: unknown } | null)?.vibesAppOverlay !== appOverlay.value.id) dismiss();
	});

	// 小程序发来的「关掉我」
	window.addEventListener('message', ev => {
		if (ev.origin !== window.location.origin || appOverlay.value == null) return;
		const type = (ev.data as { type?: unknown } | null)?.type;
		if (type === 'vibes-app:close' || type === 'vibes-player:close') closeAppOverlay();
	});

	// 路由跳转（MkA、各页面里的 router.push、旧地址）：小程序改在浮层里开。
	// 别的界面（deck）自己的 navHook 照常接在后面。
	const previous = mainRouter.navHook;
	mainRouter.navHook = (fullPath, flag) => {
		const learn = learnTabPath(fullPath);
		if (learn != null) {
			mainRouter.pushByPath(learn);
			return true;
		}
		if (flag !== 'forcePage' && miniAppTarget(fullPath) != null) {
			openAppOverlay(fullPath);
			return true;
		}
		return previous ? previous(fullPath, flag) : false;
	};

	// 普通链接（左侧菜单的生词本、MkA behavior="browser"、帖子里的站内链接）：在链接自己处理之前拦下来
	window.document.addEventListener('click', ev => {
		if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
		const a = (ev.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
		// SVG 里的 <a> 的 href 不是字符串，不管它
		if (a == null || typeof a.href !== 'string' || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
		const learn = learnTabPath(a.href);
		if (learn == null && miniAppTarget(a.href) == null) return;
		ev.preventDefault();
		ev.stopPropagation();
		if (learn != null) {
			mainRouter.pushByPath(learn);
			return;
		}
		const u = new URL(a.href);
		openAppOverlay(`${u.pathname}${u.search}${u.hash}`);
	}, true);
}
