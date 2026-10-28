/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Copy for adding Vibes to the home screen: the card at boot (components/lojo/MkLojoInstallPrompt.vue) and the steps on
// /install (pages/lojo/install.vue), kept apart from upstream Crowdin translations. Chinese first, short sentences.
// The button names in the steps are the ones the browsers show; {share} and the like are drawn as the buttons' icons.
import { lang } from '@@/js/config.js';
import type { InstallApp, InstallGuide, InstallKey } from './guide.js';

// at: where on the screen the step's button is, for the little picture next to it
export type InstallSpot = 'bottom' | 'top-right' | 'top-left' | 'sheet' | 'center' | 'home';
export type InstallStep = { text: string; at?: InstallSpot };
const steps = (all: Record<InstallGuide, InstallStep[]>) => all;

const zh = {
	cardTitle: '把 Vibes 添加到主屏幕',
	cardText: '加好以后，Vibes 会像 App 一样全屏打开，功能最完整。iPhone 和 iPad 要先加到主屏幕，才能收到通知。',
	addNow: '添加到主屏幕',
	howTo: '看看怎么加',
	later: '以后再说',
	never: '不再提醒',
	close: '关闭',
	welcomeTitle: 'Vibes 已经在主屏幕上了',
	welcomeText: '还差一步：打开通知。有人回复你时，会提醒你。',
	turnOnNotifications: '打开通知',
	gotIt: '知道了',
	// in place of upstream's source-code popup (AGPL §13)
	sourceBefore: 'Vibes 基于开源软件 Misskey 修改，源代码见',
	sourceLink: '「关于 Misskey」',
	sourceAfter: '。',
	added: '加好了。去主屏幕或桌面上找 Vibes 的图标。',

	pageTitle: '添加到主屏幕',
	heading: '把 Vibes 添加到主屏幕',
	lede: '加好以后，点图标就能打开 Vibes，像 App 一样全屏，功能最完整。跟着下面几步做，一两分钟就好。',
	iosNotifications: 'iPhone 和 iPad 要先加到主屏幕，才能收到通知。',
	platformsLabel: '你的设备',
	platforms: { ios: 'iPhone / iPad', android: '安卓手机', desktop: '电脑' },
	guidesLabel: '你用的浏览器',
	guides: {
		'ios-safari': 'Safari',
		'ios-browser': '其他浏览器',
		'android-chrome': 'Chrome、Edge',
		'android-browser': '手机自带的浏览器',
		'desktop-chrome': 'Chrome、Edge',
		'desktop-safari': 'Mac 上的 Safari',
		'desktop-firefox': 'Firefox',
		app: '微信等 App 里',
	} satisfies Record<InstallGuide, string>,
	detected: '已经按你现在用的设备选好了。不对的话，换一个。',
	oneTap: '你的浏览器可以一步加好：',
	steps: steps({
		'ios-safari': [
			{ text: '点 {share}「分享」。iPhone 在屏幕底部，iPad 在右上角。没看到的话，先点右下角的 {more}，再点「分享」。', at: 'bottom' },
			{ text: '往下滑，点 {add}「添加到主屏幕」。没有这一项：滑到最底下点「编辑操作」，把它加进来。', at: 'sheet' },
			{ text: '有「作为网页 App 打开」的开关，就保持打开。再点右上角的「添加」。', at: 'top-right' },
			{ text: '回到主屏幕，点 Vibes 的图标打开。第一次打开要再登录一次。', at: 'home' },
		],
		'ios-browser': [
			{ text: '点 {share}「分享」。Chrome 在地址栏右边；Edge 和 Firefox 要先点 {more} 或 {lines}。', at: 'top-right' },
			{ text: '点 {add}「添加到主屏幕」，再点「添加」。', at: 'sheet' },
			{ text: '没有这一项的话，复制链接，用 Safari 打开，再按 Safari 的步骤加。' },
			{ text: '回到主屏幕，点 Vibes 的图标打开。第一次打开要再登录一次。', at: 'home' },
		],
		'android-chrome': [
			{ text: '点右上角的 {menu}。', at: 'top-right' },
			{ text: '点 {add}「添加到主屏幕」或「安装应用」。', at: 'sheet' },
			{ text: '选「安装」，再点一次「安装」确认。', at: 'center' },
			{ text: '回到桌面，点 Vibes 的图标打开。', at: 'home' },
		],
		'android-browser': [
			{ text: '打开浏览器的菜单，通常在底部的 {lines}，或者右上角的 {more}。', at: 'bottom' },
			{ text: '找「添加到桌面」「添加到主屏幕」或「添加快捷方式」，点它。', at: 'sheet' },
			{ text: '桌面上没有出现图标：打开手机的「设置 → 应用 → 这个浏览器 → 权限」，允许「桌面快捷方式」，再加一次。' },
			{ text: '这样加的有时只是快捷方式，打开还是浏览器的样子。想要像 App 一样全屏，就复制链接，用 Chrome 或 Edge 打开再加。' },
		],
		app: [
			{ text: '点右上角的 {more}。', at: 'top-right' },
			{ text: '选「在浏览器打开」。iPhone 上可能叫「在 Safari 中打开」或「在默认浏览器中打开」。', at: 'sheet' },
			{ text: '打开以后，这一页会换成那个浏览器的步骤，跟着加就行。找不到这一项的话，复制链接，到浏览器里粘贴打开。' },
		],
		'desktop-chrome': [
			{ text: '看地址栏最右边，点 {install} 安装图标。', at: 'top-right' },
			{ text: '点「安装」。', at: 'center' },
			{ text: '没有这个图标：Chrome 点右上角的 {menu}，在「投放、保存和分享」里点「安装 Vibes」；Edge 点 {more}，在「应用」里点「将此站点作为应用安装」。' },
			{ text: '以后从桌面、开始菜单或程序坞打开 Vibes。' },
		],
		'desktop-safari': [
			{ text: '点屏幕最上面菜单栏里的「文件」。', at: 'top-left' },
			{ text: '点「添加到程序坞」，再点「添加」。', at: 'center' },
			{ text: '以后从程序坞打开 Vibes。需要 macOS 14 或更新的系统；更早的系统请用 Chrome 或 Edge。' },
		],
		'desktop-firefox': [
			{ text: 'Firefox 现在还不能把网站装成 App。' },
			{ text: '复制链接，用 Chrome、Edge 或 Safari 打开，再按那边的步骤加。' },
		],
	}),
	copyLink: '复制链接',
	keys: {
		share: '分享按钮', more: '「···」按钮', menu: '「⋮」按钮', lines: '「≡」按钮', add: '添加图标', install: '安装图标',
	} satisfies Record<InstallKey, string>,
	done: '我已经加好了',
	doneToast: '好的，以后不再提醒你添加。',
	inApp: (name: string) => `你现在是在${name}里打开的。App 里的网页加不到主屏幕，要先用浏览器打开。`,
	inAppUnknown: '你现在是在一个 App 里打开的。App 里的网页加不到主屏幕，要先用浏览器打开。',
	apps: {
		wechat: '微信', qq: 'QQ', weibo: '微博', dingtalk: '钉钉', alipay: '支付宝', douyin: '抖音', xiaohongshu: '小红书', feishu: '飞书',
		facebook: 'Facebook', instagram: 'Instagram', line: 'LINE',
	} satisfies Record<InstallApp, string>,
	standaloneTitle: '你已经在用主屏幕上的 Vibes 了',
	standaloneLede: '还差一步：打开通知。',
	notifyTitle: '通知',
	notifyText: '有人回复你时，会提醒你。以后也可以在「设置 → 通知」里打开或关掉。',
	notifyLogin: '登录以后，可以在这里打开通知。',
	home: '回首页',
};

const en: typeof zh = {
	cardTitle: 'Add Vibes to your home screen',
	cardText: 'Vibes then opens full screen like an app, with everything working. On iPhone and iPad, notifications only work once Vibes is on the home screen.',
	addNow: 'Add to home screen',
	howTo: 'Show me how',
	later: 'Later',
	never: 'Don’t remind me',
	close: 'Close',
	welcomeTitle: 'Vibes is on your home screen',
	welcomeText: 'One more step: turn on notifications, so you hear when someone replies.',
	turnOnNotifications: 'Turn on notifications',
	gotIt: 'Got it',
	sourceBefore: 'Vibes is a modified version of the open-source Misskey. The source code is on ',
	sourceLink: 'About Misskey',
	sourceAfter: '.',
	added: 'Done. Look for the Vibes icon on your home screen or desktop.',

	pageTitle: 'Add to home screen',
	heading: 'Add Vibes to your home screen',
	lede: 'Then Vibes opens with one tap, full screen like an app, with everything working. Follow the steps below; it takes a minute or two.',
	iosNotifications: 'On iPhone and iPad, notifications only work once Vibes is on the home screen.',
	platformsLabel: 'Your device',
	platforms: { ios: 'iPhone / iPad', android: 'Android', desktop: 'Computer' },
	guidesLabel: 'Your browser',
	guides: {
		'ios-safari': 'Safari',
		'ios-browser': 'Other browsers',
		'android-chrome': 'Chrome, Edge',
		'android-browser': 'The phone’s own browser',
		'desktop-chrome': 'Chrome, Edge',
		'desktop-safari': 'Safari on a Mac',
		'desktop-firefox': 'Firefox',
		app: 'Inside WeChat or another app',
	},
	detected: 'Picked for the device you are on now. Change it if it’s wrong.',
	oneTap: 'Your browser can do it in one step:',
	steps: steps({
		'ios-safari': [
			{ text: 'Tap {share} Share: at the bottom on iPhone, at the top right on iPad. Can’t see it? Tap {more} at the bottom right first, then Share.', at: 'bottom' },
			{ text: 'Scroll down and tap {add} Add to Home Screen. Not there? Scroll to the end, tap Edit Actions and add it.', at: 'sheet' },
			{ text: 'If there is an Open as Web App switch, leave it on. Then tap Add at the top right.', at: 'top-right' },
			{ text: 'Go to your home screen and tap the Vibes icon. The first time, log in again.', at: 'home' },
		],
		'ios-browser': [
			{ text: 'Tap {share} Share: in Chrome it is at the right of the address bar; in Edge and Firefox, tap {more} or {lines} first.', at: 'top-right' },
			{ text: 'Tap {add} Add to Home Screen, then Add.', at: 'sheet' },
			{ text: 'Not there? Copy the link, open it in Safari and follow the Safari steps.' },
			{ text: 'Go to your home screen and tap the Vibes icon. The first time, log in again.', at: 'home' },
		],
		'android-chrome': [
			{ text: 'Tap {menu} at the top right.', at: 'top-right' },
			{ text: 'Tap {add} Add to home screen or Install app.', at: 'sheet' },
			{ text: 'Choose Install, then tap Install again to confirm.', at: 'center' },
			{ text: 'Go to your home screen and tap the Vibes icon.', at: 'home' },
		],
		'android-browser': [
			{ text: 'Open the browser’s menu, usually {lines} at the bottom or {more} at the top right.', at: 'bottom' },
			{ text: 'Look for Add to home screen, Add to desktop or Add shortcut, and tap it.', at: 'sheet' },
			{ text: 'No icon on the home screen? In the phone’s Settings → Apps → this browser → Permissions, allow home screen shortcuts, then add it again.' },
			{ text: 'Some browsers only add a shortcut that opens the browser. For the full-screen app, copy the link, open it in Chrome or Edge and add it there.' },
		],
		app: [
			{ text: 'Tap {more} at the top right.', at: 'top-right' },
			{ text: 'Choose Open in browser. On iPhone it may say Open in Safari or Open in default browser.', at: 'sheet' },
			{ text: 'This page then shows the steps for that browser. Can’t find the option? Copy the link and paste it into a browser.' },
		],
		'desktop-chrome': [
			{ text: 'At the right end of the address bar, click the {install} install icon.', at: 'top-right' },
			{ text: 'Click Install.', at: 'center' },
			{ text: 'No icon? In Chrome, click {menu} at the top right, then Cast, save, and share → Install Vibes. In Edge, click {more}, then Apps → Install this site as an app.' },
			{ text: 'From then on, open Vibes from your desktop, Start menu or Dock.' },
		],
		'desktop-safari': [
			{ text: 'Click File in the menu bar at the top of the screen.', at: 'top-left' },
			{ text: 'Click Add to Dock, then Add.', at: 'center' },
			{ text: 'From then on, open Vibes from the Dock. This needs macOS 14 or later; on older systems, use Chrome or Edge.' },
		],
		'desktop-firefox': [
			{ text: 'Firefox can’t install websites as apps yet.' },
			{ text: 'Copy the link, open it in Chrome, Edge or Safari, and follow the steps there.' },
		],
	}),
	copyLink: 'Copy the link',
	keys: {
		share: 'the Share button', more: 'the “···” button', menu: 'the “⋮” button', lines: 'the “≡” button', add: 'the Add icon', install: 'the install icon',
	},
	done: 'I’ve added it',
	doneToast: 'OK, no more reminders to add it.',
	inApp: name => `You opened this inside ${name}. Pages inside an app can’t go on the home screen, so open it in a browser first.`,
	inAppUnknown: 'You opened this inside an app. Pages inside an app can’t go on the home screen, so open it in a browser first.',
	apps: {
		wechat: 'WeChat', qq: 'QQ', weibo: 'Weibo', dingtalk: 'DingTalk', alipay: 'Alipay', douyin: 'Douyin', xiaohongshu: 'Xiaohongshu', feishu: 'Feishu',
		facebook: 'Facebook', instagram: 'Instagram', line: 'LINE',
	},
	standaloneTitle: 'You’re using Vibes from your home screen',
	standaloneLede: 'One more step: turn on notifications.',
	notifyTitle: 'Notifications',
	notifyText: 'You’ll hear when someone replies to you. You can turn them on or off later in Settings → Notifications.',
	notifyLogin: 'Log in to turn on notifications here.',
	home: 'Home',
};

export const INSTALL_TEXT = { zh, en };
export const installLabels = INSTALL_TEXT[lang.startsWith('zh') ? 'zh' : 'en'];
