// SPDX-License-Identifier: AGPL-3.0-only
// 用社区的配色：社区把算好的主题存在 localStorage 的 theme 里（theme.ts requestUpdateThemeCache），照样铺成 --MI_THEME-*。
// 没有（没打开过社区）就用浅色默认值（style.css 里写了）。
export function applyCommunityTheme() {
	let props: Record<string, string> | null = null;
	try { props = JSON.parse(localStorage.getItem('theme') ?? 'null'); } catch { /* 坏了就用默认 */ }
	if (props == null) return;
	const root = document.documentElement;
	for (const [k, v] of Object.entries(props)) if (typeof v === 'string' || typeof v === 'number') root.style.setProperty(`--MI_THEME-${k}`, String(v));
	const bg = String(props.bg ?? '');
	const m = /^#([0-9a-f]{6})/i.exec(bg) ?? null;
	let dark = false;
	if (m) { const n = parseInt(m[1], 16); dark = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) < 128; } else if (/rgb/.test(bg)) { const [r, g, b] = bg.match(/\d+/g)!.map(Number); dark = 0.299 * r + 0.587 * g + 0.114 * b < 128; }
	root.dataset.colorScheme = dark ? 'dark' : 'light';
	root.style.setProperty('color-scheme', dark ? 'dark' : 'light');
	if (props.htmlThemeColor) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', String(props.htmlThemeColor));
}
