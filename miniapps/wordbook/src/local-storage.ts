// SPDX-License-Identifier: AGPL-3.0-only
// 小程序和社区同一个网址，直接读社区存在浏览器里的东西（登录、语言、主题）。
export const miLocalStorage = {
	getItem: (key: string): string | null => window.localStorage.getItem(key),
	setItem: (key: string, value: string): void => window.localStorage.setItem(key, value),
	removeItem: (key: string): void => window.localStorage.removeItem(key),
	getItemAsJson: (key: string): any => { try { return JSON.parse(window.localStorage.getItem(key) ?? 'null') ?? undefined; } catch { return undefined; } },
};
