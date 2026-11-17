/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes（2026-11-16，时间线改转发 YouTube 视频）：YouTube 对正式站服务器的 IP 只给一张空壳页
// （标题「- YouTube」，没有封面，也没有播放器），summaly 从页面里读不出东西。
// YouTube 视频链接改问 YouTube 官方的 oEmbed 接口（https://www.youtube.com/oembed），再拼成 summaly 的结果，
// 卡片就有标题、封面和「播放」按钮（播放器是 youtube.com/embed/<id>）。oEmbed 出错时照旧走 summaly。

import type { SummalyResult } from '@misskey-dev/summaly';

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);

/** YouTube 视频链接里的视频 id；不是 YouTube 视频链接就返回 null。 */
export function getYouTubeVideoId(url: URL): string | null {
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

/** 链接里指定的开始时间（t=90、t=90s、t=1m30s、t=1h2m3s、start=90），换成秒；没有就返回 null。 */
export function getYouTubeStartSeconds(url: URL): number | null {
	const raw = url.searchParams.get('t') ?? url.searchParams.get('start');
	if (raw == null || raw === '') return null;
	let seconds: number;
	if (/^\d+s?$/.test(raw)) {
		seconds = parseInt(raw, 10);
	} else {
		const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
		if (!m) return null;
		seconds = (parseInt(m[1] ?? '0', 10) * 3600) + (parseInt(m[2] ?? '0', 10) * 60) + parseInt(m[3] ?? '0', 10);
	}
	return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : null;
}

export function youTubeOEmbedUrl(videoId: string): string {
	const params = new URLSearchParams({ url: `https://www.youtube.com/watch?v=${videoId}`, format: 'json' });
	return `https://www.youtube.com/oembed?${params.toString()}`;
}

/** oEmbed 接口返回的 JSON，只用到这几项；都按不可信的外部数据检查。 */
export type YouTubeOEmbed = {
	title?: unknown;
	author_name?: unknown;
	thumbnail_url?: unknown;
	width?: unknown;
	height?: unknown;
};

function positiveNumber(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

/** 把 oEmbed 的结果拼成 summaly 的格式；没有标题时返回 null（交回 summaly）。 */
export function summaryFromYouTubeOEmbed(url: string, videoId: string, startSeconds: number | null, oembed: YouTubeOEmbed): SummalyResult | null {
	if (typeof oembed.title !== 'string' || oembed.title.trim() === '') return null;

	const thumbnail = typeof oembed.thumbnail_url === 'string' && oembed.thumbnail_url.startsWith('https://')
		? oembed.thumbnail_url
		: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

	const player = new URL(`https://www.youtube.com/embed/${videoId}`);
	if (startSeconds != null) player.searchParams.set('start', String(startSeconds));

	// 卡片只用宽高比（竖屏的 Shorts 是竖的）；oEmbed 没给就按 16:9。
	const width = positiveNumber(oembed.width);
	const height = positiveNumber(oembed.height);

	return {
		title: oembed.title,
		icon: 'https://www.youtube.com/favicon.ico',
		description: typeof oembed.author_name === 'string' && oembed.author_name !== '' ? oembed.author_name : null,
		thumbnail,
		thumbnailStyle: null,
		sitename: 'YouTube',
		player: {
			url: player.toString(),
			width: width != null && height != null ? width : 1280,
			height: width != null && height != null ? height : 720,
			allow: ['autoplay', 'encrypted-media', 'fullscreen', 'picture-in-picture'],
		},
		sensitive: false,
		activityPub: null,
		fediverseCreator: null,
		url,
	};
}
