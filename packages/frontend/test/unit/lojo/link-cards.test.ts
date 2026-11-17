/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import * as mfm from 'mfm-js';
import { hideTrailingPreviewUrl, listeningPlayerUrl, youTubeVideoIdOf } from '@/lojo/link-cards.js';

const YT = 'https://www.youtube.com/watch?v=arj7oStGLkU';

function shown(text: string, previewUrls: string[] = [YT]): string {
	return mfm.toString(hideTrailingPreviewUrl(mfm.parse(text), previewUrls));
}

describe('帖子末尾的链接变成卡片后不在正文里重复', () => {
	test('最后一行是有卡片的链接：去掉这行和前面的空行', () => {
		expect(shown(`拖延症大师的脑子里在想什么？\n\n${YT}`)).toBe('拖延症大师的脑子里在想什么？');
		expect(shown(`拖延症大师的脑子里在想什么？\n${YT}\n\n`)).toBe('拖延症大师的脑子里在想什么？');
		expect(shown(`看这个 ${YT}`)).toBe('看这个');
	});

	test('整条帖子只有一个链接：正文留空，只剩卡片', () => {
		expect(hideTrailingPreviewUrl(mfm.parse(YT), [YT])).toEqual([]);
	});

	test('引用块后面的链接也去掉', () => {
		expect(shown(`> 一句话\n${YT}`)).toBe('> 一句话');
	});

	test('这些情况不动：链接在句子中间、没有卡片、紧贴着字、[文字](链接)', () => {
		const middle = `${YT} 这个视频很好`;
		expect(shown(middle)).toBe(middle);
		const noCard = `看这个\nhttps://example.com/a`;
		expect(shown(noCard)).toBe(noCard);
		const glued = `看这个:${YT}`;
		expect(shown(glued)).toBe(glued);
		const labelled = `看这个\n[TED](${YT})`;
		expect(shown(labelled)).toBe(labelled);
	});

	test('前面的链接还在，只去掉最后一个', () => {
		const two = `第一个 https://example.com/a\n${YT}`;
		expect(shown(two, ['https://example.com/a', YT])).toBe('第一个 https://example.com/a');
	});
});

describe('YouTube 卡片的播放键打开精听播放器', () => {
	test('认出各种写法的视频链接', () => {
		for (const u of [
			YT,
			'https://youtube.com/watch?v=arj7oStGLkU&t=647s',
			'https://m.youtube.com/watch?v=arj7oStGLkU',
			'https://music.youtube.com/watch?v=arj7oStGLkU',
			'https://youtu.be/arj7oStGLkU?si=abc',
			'https://www.youtube.com/shorts/arj7oStGLkU',
		]) {
			expect(youTubeVideoIdOf(new URL(u)), u).toBe('arj7oStGLkU');
		}
	});

	test('B站、假冒域名、不像视频 id 的都不认', () => {
		for (const u of [
			'https://www.bilibili.com/video/BV1F5Ny6gE1L',
			'https://youtube.com.evil.example/watch?v=arj7oStGLkU',
			'https://www.youtube.com/watch?v=arj7oStGLkU%22%3E%3Cimg',
			'https://www.youtube.com/@TED',
		]) {
			expect(youTubeVideoIdOf(new URL(u)), u).toBeNull();
		}
	});

	test('播放器地址', () => {
		expect(listeningPlayerUrl('arj7oStGLkU')).toBe('/apps/player/?v=arj7oStGLkU#youtube');
	});
});
