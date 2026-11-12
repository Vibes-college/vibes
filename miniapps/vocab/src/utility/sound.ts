// SPDX-License-Identifier: AGPL-3.0-only
// 社区的「不出声音」设置存在社区自己那里，小程序读不到；提示音由练习页上的开关管。页面在后台时不出声。
export function isMute(): boolean {
	return document.visibilityState === 'hidden';
}
