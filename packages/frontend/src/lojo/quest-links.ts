/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 路线图下线后（2026-11-10），旧的站号（/map#2.1、练完页的「回路线图」）对到闯关第一章的哪一关。
// 按 Vibes 工作区 courses/english/ielts/quest/ch1.json 每关的 stations 抄过来；章节改了站号要跟着改。
const STATION_LEVEL: Record<string, string> = {
	'1.1': '1-1', '1.2': '1-2', '1.3': '1-3',
	'2.1': '1-4', '2.2': '1-5', '2.3': '1-6',
	'5.1': '1-7', '5.2': '1-8', '5.3': '1-9',
	'6.1': '1-10', '6.2': '1-11', '6.3': '1-12',
	'1.4': 'boss', '2.4': 'boss',
};

export function questLevelForStation(station: unknown): string | null {
	if (typeof station !== 'string') return null;
	return STATION_LEVEL[station.trim()] ?? null;
}

// 回闯关：对得上某一关就打开那一关，对不上就到地图
export function questUrlForStation(station: unknown): string {
	const level = questLevelForStation(station);
	return level != null ? `/quest?level=${level}` : '/quest';
}
