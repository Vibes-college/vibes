/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The single list of mini apps shown in the 小程序 launchpad (MkMiniAppsLaunchPad.vue). Shipping a new mini app
// means adding one entry here: id, icon, where it opens, and the intro copy shown the first time someone opens it.
// See AGENTS.md (repo root) 英语小程序 section for the rule behind this.
import type { Router } from '@/router.js';

export type MiniAppLink =
	| { kind: 'route'; to: string }
	| { kind: 'external'; href: string };

export interface MiniAppDef {
	id: string;
	name: string;
	icon: string;
	link: MiniAppLink;
	intro: {
		summary: string;
		audience: string;
		steps: string[];
		caveats: string[];
	};
}

export const miniApps: MiniAppDef[] = [
	{
		id: 'photo-words',
		name: '拍照单词',
		icon: 'ti ti-camera',
		link: { kind: 'external', href: '/photo/index.html' },
		intro: {
			summary: '拍一张照片，点一下你想学的东西，AI 帮你抠成贴纸，配上单词卡贴到墙上。',
			audience: '想通过身边实物学英语单词的人。',
			steps: [
				'拍一张照片，或者从相册选一张',
				'点一下你想学的东西（也可以圈出来）',
				'AI 抠图配卡：英文、音标、中文、例句',
				'按住卡片的角撕下来，贴到墙上收藏',
			],
			caveats: [
				'需要用到相机或相册权限',
				'贴的卡片存在这台手机本地，换手机不会带过去',
			],
		},
	},
	{
		id: 'synonym-match',
		name: '同义词连连看',
		icon: 'ti ti-arrows-exchange',
		link: { kind: 'external', href: '/synonym/index.html' },
		intro: {
			summary: '题目换了说法，你也认得出。点两张意思一样的卡，把它们连起来。',
			audience: '在练雅思阅读、听力，老是认不出题目换了说法的人。',
			steps: [
				'选一个话题，点开打',
				'一屏 16 张卡，点两张意思一样的消掉，3 秒内接着配是连击',
				'每屏有 1 对长得像、意思不同的陷阱卡，配上会扣心',
				'一局 2 分 30 秒，打完看没配上的词，一键进生词本',
			],
			caveats: [
				'有音效，可以在右上角关掉',
				'登录后满 10 对、2 分钟的一局能给闯关补 1 颗心',
			],
		},
	},
	{
		id: 'graded-reading',
		name: '分级阅读',
		icon: 'ti ti-book-2',
		link: { kind: 'external', href: 'https://vibes.college/read/artisan/' },
		intro: {
			summary: '一篇文章，雅思 5/6/7/8 四档难度随时切换，还能调中英文混读比例，点词点句看讲解。',
			audience: '想用感兴趣的文章练阅读的人。',
			steps: [
				'选一个贴近你现在水平的难度',
				'读文章：点不懂的词和句子看讲解',
				'读完做几道小题，检查理解对不对',
				'生词会自动存起来，方便以后复习',
			],
			caveats: [
				'会打开 vibes.college 上的一个独立页面，不是社区内部页面',
				'这里存的生词在这台设备上，还没有和社区的生词本打通',
			],
		},
	},
	{
		id: 'dictation',
		name: '听写',
		icon: 'ti ti-headphones',
		link: { kind: 'route', to: '/dictation' },
		intro: {
			summary: '听一句英语，把空着的词打出来，专门练拼写、数字日期、单复数这几个雅思听力最容易丢分的地方。',
			audience: '备考雅思听力、容易在拼写和数字上丢分的人。',
			steps: [
				'开始一组，每组 10 句',
				'听录音，把空着的词填进去',
				'打错了可以改，改对不算错',
				'做完看结果，连错两次的词会自动进生词本',
			],
			caveats: [],
		},
	},
	{
		id: 'typing',
		name: '机考打字',
		icon: 'ti ti-keyboard',
		link: { kind: 'external', href: '/apps/typing/' },
		intro: {
			summary: '机考雅思要在电脑上打字作答，这条线带你练完 5 站打字，帮你适应机考，一遍大约 15 分钟。',
			audience: '第一次在社区学习、还没打过机考雅思的新人。',
			steps: [
				'从地图最前面的站开始，按顺序走',
				'照着练习打字，系统会计时、看打得快不快、对不对',
				'五站都过了，直接接上后面的定级测试',
			],
			caveats: [],
		},
	},
	{
		id: 'vocab',
		name: '词汇线',
		icon: 'ti ti-vocabulary',
		link: { kind: 'route', to: '/vocab/5.1' },
		intro: {
			summary: '按雅思话题分组学词：词表配发音、音标、中文和例句，练法有拼写、听写、打字三种，错的词自动进生词本。',
			audience: '想系统过一遍雅思核心词汇的人。',
			steps: [
				'先看词表：英文、音标、中文、例句',
				'盖住英文或中文，自己先想一遍',
				'选一种练法：看义拼写、听音拼写或打字',
				'练完看小结，答错的词会自动进生词本',
			],
			caveats: [
				'这里直接打开词汇线第一站，完整 9 站排在雅思地图里，按顺序走效果最好',
			],
		},
	},
	{
		id: 'grammar',
		name: '语法线',
		icon: 'ti ti-text-grammar',
		link: { kind: 'route', to: '/grammar/6.1' },
		intro: {
			summary: '9 站语法讲解，每站先讲清楚一个语法点，再配闯关题，交卷后一次性看对错和讲解。',
			audience: '想补语法基础、避免雅思写作口语里常见语法错误的人。',
			steps: [
				'打开一站，先看讲解（可以跳到需要的小节）',
				'做完讲解后面的练习题',
				'交卷，一次性看哪里对、哪里错、为什么',
			],
			caveats: [
				'这里直接打开语法线第一站，完整 9 站排在雅思地图里',
			],
		},
	},
	{
		id: 'wordbook',
		name: '生词本复习',
		icon: 'ti ti-notebook',
		link: { kind: 'route', to: '/wordbook' },
		intro: {
			summary: '帖子讲解、听写、词汇线、语法线答错的生词都会自动进这里，按记忆曲线安排复习时间，到期才提醒你。',
			audience: '想把学过的生词真正记住、不想每天刷一堆新词的人。',
			steps: [
				'打开「今日」，看今天到期几张',
				'点「开始复习」',
				'认得卡看英文想中文，拼写卡听发音拼出来',
				'选「忘了/有点难/记得/很轻松」，系统会安排下次什么时候再考你',
			],
			caveats: [
				'每天最多学 10 个新词，学太多反而记不住',
				'可以导出到 Anki，但进度带不过去，只带词和释义',
			],
		},
	},
];

// Mirrors MkA's own behavior="browser" handling (see components/global/MkA.vue): same-tab real navigation for
// anything outside the SPA router, SPA navigation for an internal route.
export function openMiniAppLink(link: MiniAppLink, router: Router): void {
	if (link.kind === 'route') {
		router.pushByPath(link.to);
	} else {
		window.location.href = link.href;
	}
}
