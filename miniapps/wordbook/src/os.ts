// SPDX-License-Identifier: AGPL-3.0-only
// 社区 os.js 的小替身：只要打字线用到的 toast、菜单、popups。
import { ref } from 'vue';
import type { MenuItem } from './types/menu.js';
export const popups = ref<{ id: number; component: unknown }[]>([]);
export function toast(message: string) {
	const el = document.createElement('div');
	el.className = 'mini-toast'; el.setAttribute('role', 'status'); el.textContent = message;
	document.body.appendChild(el);
	setTimeout(() => el.classList.add('out'), 2600);
	setTimeout(() => el.remove(), 3000);
}
export function popupMenu(items: (MenuItem | null)[], anchor?: HTMLElement | EventTarget | null) {
	document.querySelector('.mini-menu')?.remove();
	const menu = document.createElement('div');
	menu.className = 'mini-menu'; menu.setAttribute('role', 'menu');
	for (const it of items) {
		if (it == null) continue;
		if (it.type === 'divider') { menu.appendChild(document.createElement('hr')); continue; }
		const b = document.createElement(it.type === 'label' ? 'div' : 'button');
		b.textContent = (it as { text: string }).text;
		if (it.type !== 'label') { b.setAttribute('role', 'menuitem'); if ((it as { active?: boolean }).active) b.classList.add('active'); b.addEventListener('click', ev => { close(); (it as { action?: (e: MouseEvent) => void }).action?.(ev as MouseEvent); }); } else b.className = 'label';
		menu.appendChild(b);
	}
	const r = (anchor as HTMLElement | null)?.getBoundingClientRect?.();
	menu.style.top = `${Math.min((r?.bottom ?? 80) + 4, innerHeight - 260)}px`;
	menu.style.left = `${Math.max(8, Math.min(r?.left ?? 8, innerWidth - 248))}px`;
	document.body.appendChild(menu);
	const close = () => { menu.remove(); document.removeEventListener('pointerdown', outside, true); };
	const outside = (e: Event) => { if (!menu.contains(e.target as Node)) close(); };
	setTimeout(() => document.addEventListener('pointerdown', outside, true));
	return { dispose: close };
}
// 确认框：先用浏览器自带的（删词前问一句），返回社区 os.confirm 一样的 { canceled }。
export async function confirm(opts: { type?: string; title?: string; text?: string }): Promise<{ canceled: boolean }> {
	return { canceled: !window.confirm([opts.title, opts.text].filter(Boolean).join('\n')) };
}
