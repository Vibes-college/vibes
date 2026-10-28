/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Adding Vibes to the home screen (添加到主屏幕): which steps on /install fit this phone or computer, and when the card
// that asks for it comes back. Pure, so it can be tested without a browser; prompt.ts is the browser side.

export type InstallPlatform = 'ios' | 'android' | 'desktop';

// The step-by-step guides on /install, by platform. 'app' is a page opened inside another app (WeChat, QQ, Weibo…),
// which can't add anything to the home screen: it has to be opened in a browser first.
export const installGuides = {
	ios: ['ios-safari', 'ios-browser', 'app'],
	android: ['android-chrome', 'android-browser', 'app'],
	desktop: ['desktop-chrome', 'desktop-safari', 'desktop-firefox'],
} as const satisfies Record<InstallPlatform, readonly string[]>;
export type InstallGuide = typeof installGuides[InstallPlatform][number];

export type InstallApp = 'wechat' | 'qq' | 'weibo' | 'dingtalk' | 'alipay' | 'douyin' | 'xiaohongshu' | 'feishu' | 'facebook' | 'instagram' | 'line';
export type InstallDevice = { platform: InstallPlatform; guide: InstallGuide; app: InstallApp | null };

const APPS: [RegExp, InstallApp][] = [
	[/MicroMessenger/i, 'wechat'],
	[/ QQ\/\d/, 'qq'],
	[/Weibo/i, 'weibo'],
	[/DingTalk/i, 'dingtalk'],
	[/AlipayClient/i, 'alipay'],
	[/aweme|BytedanceWebview/i, 'douyin'],
	[/xhsdiscover/i, 'xiaohongshu'],
	[/Lark\/|Feishu/i, 'feishu'],
	[/FBAN|FBAV/, 'facebook'],
	[/Instagram/, 'instagram'],
	[/ Line\//, 'line'],
];

// The browsers phone makers put on their phones, and the big Chinese ones. They add a shortcut from their own menus,
// if at all, so they get the general steps rather than Chrome's.
const PHONE_BROWSERS = /HuaweiBrowser|ArkWeb|MiuiBrowser|HeyTapBrowser|OppoBrowser|VivoBrowser|SamsungBrowser|MQQBrowser|UCBrowser|Quark|baiduboxapp|SogouMobileBrowser|QHBrowser|360SE/i;

// touchPoints: navigator.maxTouchPoints. iPadOS asks for desktop pages and says it is a Mac; only the touch screen
// gives it away.
export function detectDevice(ua: string, touchPoints = 0): InstallDevice {
	const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1);
	const platform: InstallPlatform = ios ? 'ios' : /Android|OpenHarmony|HarmonyOS/.test(ua) ? 'android' : 'desktop';
	if (platform !== 'desktop') {
		const app = APPS.find(([pattern]) => pattern.test(ua))?.[1] ?? null;
		// an app's own web view: Android marks it "wv"; on iOS it leaves out "Safari"
		const webView = platform === 'android' ? /; wv\)/.test(ua) : !/Safari\//.test(ua);
		if (app != null || webView) return { platform, guide: 'app', app };
	}
	return { platform, guide: guideOf(platform, ua), app: null };
}

function guideOf(platform: InstallPlatform, ua: string): InstallGuide {
	// every browser on iOS is Safari underneath; Chrome, Edge and Firefox add to the home screen from their share button
	if (platform === 'ios') return /CriOS|EdgiOS|FxiOS|OPiOS/.test(ua) || PHONE_BROWSERS.test(ua) ? 'ios-browser' : 'ios-safari';
	if (platform === 'android') return PHONE_BROWSERS.test(ua) || !/Chrome\/|Firefox\//.test(ua) ? 'android-browser' : 'android-chrome';
	if (/Firefox\//.test(ua)) return 'desktop-firefox';
	return /Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\//.test(ua) ? 'desktop-safari' : 'desktop-chrome';
}

// How long 以后再说 keeps the card away.
export const INSTALL_SNOOZE = 1000 * 60 * 60 * 24 * 7;

export type InstallOffer = 'install' | 'installed';

// The card at boot: 'install' asks to add Vibes to the home screen; 'installed' greets Vibes opened from the home screen,
// once, with the step left (notifications).
//   prompt: miLocalStorage vibesInstallPrompt: 'never' (不再提醒), 'installed', or when the card last showed (ISO)
//   welcomed: whether the 'installed' card has shown in this storage
export function installOffer(state: { standalone: boolean; prompt: string | null; welcomed: boolean }, now: number): InstallOffer | null {
	if (state.standalone) return state.welcomed ? null : 'installed';
	if (state.prompt === 'never' || state.prompt === 'installed') return null;
	const shownAt = state.prompt == null ? NaN : new Date(state.prompt).getTime();
	return Number.isNaN(shownAt) || now - shownAt >= INSTALL_SNOOZE ? 'install' : null;
}

// The buttons a step names, drawn as their icons: "点 {share}「分享」" shows the share icon before 「分享」.
export const installKeys = {
	share: 'ti ti-share-2',
	more: 'ti ti-dots',
	menu: 'ti ti-dots-vertical',
	lines: 'ti ti-menu-2',
	add: 'ti ti-square-plus',
	install: 'ti ti-device-desktop-down',
} as const;
export type InstallKey = keyof typeof installKeys;

export type StepPart = { text: string } | { key: InstallKey };

export function stepParts(text: string): StepPart[] {
	return text.split(/\{(\w+)\}/).map((part, i): StepPart => (i % 2 === 1 && part in installKeys ? { key: part as InstallKey } : { text: i % 2 === 1 ? `{${part}}` : part }))
		.filter(part => !('text' in part) || part.text !== '');
}
