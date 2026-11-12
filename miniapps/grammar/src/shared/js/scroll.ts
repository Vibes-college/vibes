/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 从社区 packages/frontend-shared/js/scroll.ts 抄来的一个函数（语法页只用到它）。
export function getScrollContainer(el: HTMLElement | null): HTMLElement | null {
	if (el == null || el.tagName === 'HTML') return null;
	const overflow = window.getComputedStyle(el).getPropertyValue('overflow-y');
	if (overflow === 'scroll' || overflow === 'auto') {
		return el;
	} else {
		return getScrollContainer(el.parentElement);
	}
}
