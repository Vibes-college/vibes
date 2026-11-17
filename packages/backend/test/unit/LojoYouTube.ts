/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { getYouTubeStartSeconds, getYouTubeVideoId, summaryFromYouTubeOEmbed, youTubeOEmbedUrl } from '@/misc/lojo-youtube.js';

// 2026-11-16 从香港服务器上调 https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=arj7oStGLkU 拿到的原样
const TED_OEMBED = {
	title: 'Inside the Mind of a Master Procrastinator | Tim Urban | TED',
	author_name: 'TED',
	author_url: 'https://www.youtube.com/@TED',
	type: 'video',
	height: 113,
	width: 200,
	version: '1.0',
	provider_name: 'YouTube',
	provider_url: 'https://www.youtube.com/',
	thumbnail_height: 360,
	thumbnail_width: 480,
	thumbnail_url: 'https://i.ytimg.com/vi/arj7oStGLkU/hqdefault.jpg',
	html: '<iframe width="200" height="113" src="https://www.youtube.com/embed/arj7oStGLkU?feature=oembed" frameborder="0" allowfullscreen></iframe>',
};

describe('YouTube 链接预览（oEmbed）', () => {
	test('认出各种写法的视频链接', () => {
		for (const u of [
			'https://www.youtube.com/watch?v=arj7oStGLkU',
			'https://youtube.com/watch?v=arj7oStGLkU&t=647s',
			'https://m.youtube.com/watch?v=arj7oStGLkU',
			'https://music.youtube.com/watch?v=arj7oStGLkU',
			'https://youtu.be/arj7oStGLkU',
			'https://youtu.be/arj7oStGLkU?si=abc&t=30',
			'https://www.youtube.com/embed/arj7oStGLkU',
			'https://www.youtube.com/shorts/arj7oStGLkU',
			'https://www.youtube.com/live/arj7oStGLkU?feature=share',
		]) {
			expect(getYouTubeVideoId(new URL(u)), u).toBe('arj7oStGLkU');
		}
	});

	test('不是视频的链接、别的网站、假冒域名都不认', () => {
		for (const u of [
			'https://www.youtube.com/@TED',
			'https://www.youtube.com/watch',
			'https://www.youtube.com/watch?v=short',
			'https://www.youtube.com/watch?v=arj7oStGLkU<script>',
			'https://youtube.com.evil.example/watch?v=arj7oStGLkU',
			'https://notyoutube.com/watch?v=arj7oStGLkU',
			'https://www.bilibili.com/video/BV1F5Ny6gE1L',
			'ftp://youtu.be/arj7oStGLkU',
		]) {
			expect(getYouTubeVideoId(new URL(u)), u).toBeNull();
		}
	});

	test('开始时间换成秒', () => {
		expect(getYouTubeStartSeconds(new URL('https://youtu.be/arj7oStGLkU?t=647'))).toBe(647);
		expect(getYouTubeStartSeconds(new URL('https://youtu.be/arj7oStGLkU?t=647s'))).toBe(647);
		expect(getYouTubeStartSeconds(new URL('https://youtu.be/arj7oStGLkU?t=10m47s'))).toBe(647);
		expect(getYouTubeStartSeconds(new URL('https://youtu.be/arj7oStGLkU?t=1h2m3s'))).toBe(3723);
		expect(getYouTubeStartSeconds(new URL('https://www.youtube.com/embed/arj7oStGLkU?start=90'))).toBe(90);
		expect(getYouTubeStartSeconds(new URL('https://youtu.be/arj7oStGLkU'))).toBeNull();
		expect(getYouTubeStartSeconds(new URL('https://youtu.be/arj7oStGLkU?t=0'))).toBeNull();
		expect(getYouTubeStartSeconds(new URL('https://youtu.be/arj7oStGLkU?t=abc'))).toBeNull();
	});

	test('oEmbed 接口地址', () => {
		expect(youTubeOEmbedUrl('arj7oStGLkU')).toBe('https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Darj7oStGLkU&format=json');
	});

	test('oEmbed 结果拼成卡片：标题、频道、封面、播放器', () => {
		const url = 'https://www.youtube.com/watch?v=arj7oStGLkU';
		const s = summaryFromYouTubeOEmbed(url, 'arj7oStGLkU', null, TED_OEMBED);
		expect(s).toEqual({
			title: 'Inside the Mind of a Master Procrastinator | Tim Urban | TED',
			icon: 'https://www.youtube.com/favicon.ico',
			description: 'TED',
			thumbnail: 'https://i.ytimg.com/vi/arj7oStGLkU/hqdefault.jpg',
			thumbnailStyle: null,
			sitename: 'YouTube',
			player: {
				url: 'https://www.youtube.com/embed/arj7oStGLkU',
				width: 200,
				height: 113,
				allow: ['autoplay', 'encrypted-media', 'fullscreen', 'picture-in-picture'],
			},
			sensitive: false,
			activityPub: null,
			fediverseCreator: null,
			url,
		});
	});

	test('带开始时间时播放器从那一秒开始', () => {
		const s = summaryFromYouTubeOEmbed('https://youtu.be/arj7oStGLkU?t=647', 'arj7oStGLkU', 647, TED_OEMBED);
		expect(s?.player.url).toBe('https://www.youtube.com/embed/arj7oStGLkU?start=647');
	});

	test('外部数据不对劲时：没标题交回 summaly，封面不是 https 就用默认封面，宽高缺了按 16:9', () => {
		expect(summaryFromYouTubeOEmbed('https://youtu.be/arj7oStGLkU', 'arj7oStGLkU', null, { title: '' })).toBeNull();
		expect(summaryFromYouTubeOEmbed('https://youtu.be/arj7oStGLkU', 'arj7oStGLkU', null, { title: 42 })).toBeNull();
		const s = summaryFromYouTubeOEmbed('https://youtu.be/arj7oStGLkU', 'arj7oStGLkU', null, {
			title: 'x', thumbnail_url: 'javascript:alert(1)', width: '200', height: -1, author_name: 7,
		});
		expect(s?.thumbnail).toBe('https://i.ytimg.com/vi/arj7oStGLkU/hqdefault.jpg');
		expect(s?.player.width).toBe(1280);
		expect(s?.player.height).toBe(720);
		expect(s?.description).toBeNull();
	});
});
