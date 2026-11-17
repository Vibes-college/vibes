/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes（2026-11-16，创始人经时间线转达）：帖子里的链接卡片。
// 1. 帖子最后一行的链接已经变成下面的卡片时，正文里不再重复显示这行链接（像 X 一样）。
//    只去掉正文末尾、前面是空白或换行的那一个裸链接；句子中间的链接、[文字](链接) 写法、没有卡片的链接都照旧显示。
// 2. YouTube 卡片的播放键打开我们自己的精听播放器（/apps/player/），带上这条视频的 id。

import type * as mfm from 'mfm-js';

/** 精听播放器在正式站上的地址（静态页，Caddy 的 /apps/player/ 路由）。 */
export const LISTENING_PLAYER_PATH = '/apps/player/';

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);

// 这些块本身就占满一行，后面跟的链接一定在新的一行。
const BLOCK_NODE_TYPES = new Set(['quote', 'blockCode', 'mathBlock', 'center', 'search']);

/**
 * 去掉正文末尾那个已经有卡片的裸链接，连同它前面的空白。
 * previewUrls 是会显示成卡片的链接（use-note 里的 urls）；不在里面的链接不动。
 */
export function hideTrailingPreviewUrl(nodes: mfm.MfmNode[], previewUrls: readonly string[]): mfm.MfmNode[] {
	let end = nodes.length;
	while (end > 0) {
		const node = nodes[end - 1];
		if (node.type === 'text' && node.props.text.trim() === '') end--;
		else break;
	}
	if (end === 0) return nodes;

	const last = nodes[end - 1];
	if (last.type !== 'url' || !previewUrls.includes(last.props.url)) return nodes;

	const before = end >= 2 ? nodes[end - 2] : null;
	if (before == null) return [];
	if (BLOCK_NODE_TYPES.has(before.type)) return nodes.slice(0, end - 1);
	if (before.type !== 'text' || !/\s$/.test(before.props.text)) return nodes;

	const kept = before.props.text.trimEnd();
	const head = nodes.slice(0, end - 2);
	return kept === '' ? head : [...head, { ...before, props: { ...before.props, text: kept } }];
}

/** YouTube 视频链接里的视频 id；不是 YouTube 视频链接就返回 null。和后端 misc/lojo-youtube.ts 的规则一样。 */
export function youTubeVideoIdOf(url: URL): string | null {
	if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
	const host = url.hostname.toLowerCase();
	let id: string | null = null;
	if (host === 'youtu.be') {
		id = url.pathname.split('/')[1] ?? null;
	} else if (YOUTUBE_HOSTS.has(host)) {
		if (url.pathname === '/watch') {
			id = url.searchParams.get('v');
		} else {
			const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
			if (m) id = m[1];
		}
	}
	return id != null && VIDEO_ID.test(id) ? id : null;
}

/** 精听播放器打开某条 YouTube 视频的地址：/apps/player/?v=<id>#youtube */
export function listeningPlayerUrl(videoId: string): string {
	return `${LISTENING_PLAYER_PATH}?v=${encodeURIComponent(videoId)}#youtube`;
}
