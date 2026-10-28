/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { INSTALL_SNOOZE, detectDevice, installGuides, installOffer, stepParts } from '@/lojo/install/guide.js';
import { INSTALL_TEXT } from '@/lojo/install/labels.js';

// the labels pick their language from the page, which a test doesn't have
vi.mock('@@/js/config.js', () => ({ lang: 'zh-CN' }));

const UA = {
	iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
	iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.7204.156 Mobile/15E148 Safari/604.1',
	iphoneWeChat: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.61(0x18003d2c) NetType/WIFI Language/zh_CN',
	iphoneWebView: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
	iphoneQQBrowser: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 MQQBrowser/14.6.0 Mobile/15E148 Safari/604.1',
	ipadDesktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
	androidChrome: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
	androidEdge: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 EdgA/138.0.0.0',
	androidWeChat: 'Mozilla/5.0 (Linux; Android 14; 23013RK75C Build/UKQ1.230804.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.103 Mobile Safari/537.36 XWEB/1300333 MMWEBSDK/20241103 MMWEBID/1234 MicroMessenger/8.0.55.2780(0x28003737) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64',
	androidWebView: 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.0.0 Mobile Safari/537.36',
	miui: 'Mozilla/5.0 (Linux; U; Android 14; zh-cn; 23013RK75C Build/UKQ1.230804.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.5993.80 Mobile Safari/537.36 XiaoMi/MiuiBrowser/18.6.60904',
	harmony: 'Mozilla/5.0 (Phone; OpenHarmony 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 ArkWeb/4.1.6.1 Mobile HuaweiBrowser/5.0.4.300',
	samsung: 'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36',
	windowsEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0',
	windowsFirefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0',
	macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
	macChrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
};

describe('detectDevice', () => {
	test.each([
		['iphoneSafari', 0, 'ios', 'ios-safari', null],
		['iphoneChrome', 0, 'ios', 'ios-browser', null],
		['iphoneQQBrowser', 0, 'ios', 'ios-browser', null],
		['iphoneWeChat', 0, 'ios', 'app', 'wechat'],
		['iphoneWebView', 0, 'ios', 'app', null],
		['ipadDesktop', 5, 'ios', 'ios-safari', null],
		['androidChrome', 5, 'android', 'android-chrome', null],
		['androidEdge', 5, 'android', 'android-chrome', null],
		['androidWeChat', 5, 'android', 'app', 'wechat'],
		['androidWebView', 5, 'android', 'app', null],
		['miui', 5, 'android', 'android-browser', null],
		['harmony', 5, 'android', 'android-browser', null],
		['samsung', 5, 'android', 'android-browser', null],
		['windowsEdge', 0, 'desktop', 'desktop-chrome', null],
		['windowsFirefox', 0, 'desktop', 'desktop-firefox', null],
		['macSafari', 0, 'desktop', 'desktop-safari', null],
		['macChrome', 0, 'desktop', 'desktop-chrome', null],
	] as const)('%s', (ua, touchPoints, platform, guide, app) => {
		const device = detectDevice(UA[ua], touchPoints);
		expect(device).toEqual({ platform, guide, app });
		expect(installGuides[device.platform]).toContain(device.guide);
	});
});

describe('installOffer', () => {
	const now = Date.parse('2026-10-28T12:00:00Z');
	const ago = (ms: number) => new Date(now - ms).toISOString();

	test('asks in a browser that has not been asked', () => {
		expect(installOffer({ standalone: false, prompt: null, welcomed: false }, now)).toBe('install');
	});

	test('以后再说 keeps it away for a week', () => {
		expect(installOffer({ standalone: false, prompt: ago(INSTALL_SNOOZE - 1000), welcomed: false }, now)).toBe(null);
		expect(installOffer({ standalone: false, prompt: ago(INSTALL_SNOOZE), welcomed: false }, now)).toBe('install');
	});

	test('never again after 不再提醒 or once installed', () => {
		expect(installOffer({ standalone: false, prompt: 'never', welcomed: false }, now)).toBe(null);
		expect(installOffer({ standalone: false, prompt: 'installed', welcomed: false }, now)).toBe(null);
	});

	test('a stored value that is not a time asks again', () => {
		expect(installOffer({ standalone: false, prompt: 'garbage', welcomed: false }, now)).toBe('install');
	});

	test('opened from the home screen: greets once, never asks to install', () => {
		expect(installOffer({ standalone: true, prompt: null, welcomed: false }, now)).toBe('installed');
		expect(installOffer({ standalone: true, prompt: 'installed', welcomed: true }, now)).toBe(null);
	});
});

describe('stepParts', () => {
	test('draws the named buttons as icons and keeps the rest as text', () => {
		expect(stepParts('点 {share}「分享」。')).toEqual([{ text: '点 ' }, { key: 'share' }, { text: '「分享」。' }]);
		expect(stepParts('{more}{menu}')).toEqual([{ key: 'more' }, { key: 'menu' }]);
	});

	test('leaves braces it does not know as they are', () => {
		expect(stepParts('a {nope} b')).toEqual([{ text: 'a ' }, { text: '{nope}' }, { text: ' b' }]);
	});

	test('every step in both languages names only known buttons', () => {
		for (const labels of Object.values(INSTALL_TEXT)) {
			for (const steps of Object.values(labels.steps)) {
				for (const step of steps) {
					expect(stepParts(step.text).filter(part => 'text' in part && /\{\w+\}/.test(part.text))).toEqual([]);
				}
			}
		}
	});

	test('both languages have the same number of steps per guide', () => {
		for (const [guide, steps] of Object.entries(INSTALL_TEXT.zh.steps)) {
			expect(INSTALL_TEXT.en.steps[guide as keyof typeof INSTALL_TEXT.en.steps]).toHaveLength(steps.length);
		}
	});
});
