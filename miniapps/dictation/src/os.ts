// SPDX-License-Identifier: AGPL-3.0-only
// 社区 os.js 的小替身：只要听写用到的 toast、菜单、popups。
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
// 确认框（删词前问一句）：页面里弹一个小框，「确定」「取消」，Esc 或点外面算取消；返回和社区 os.confirm 一样的 { canceled }。
export function confirm(opts: { type?: string; title?: string; text?: string }): Promise<{ canceled: boolean }> {
	return new Promise(resolve => {
		const back = document.createElement('div');
		back.className = 'mini-dialog-back';
		const box = document.createElement('div');
		box.className = 'mini-dialog';
		box.setAttribute('role', 'alertdialog');
		box.setAttribute('aria-modal', 'true');
		if (opts.title) { const h = document.createElement('h2'); h.textContent = opts.title; box.append(h); }
		if (opts.text) { const p = document.createElement('p'); p.textContent = opts.text; box.append(p); }
		const row = document.createElement('div');
		row.className = 'mini-dialog-buttons';
		const cancel = document.createElement('button');
		cancel.type = 'button'; cancel.className = 'mk-btn'; cancel.textContent = '取消';
		const ok = document.createElement('button');
		ok.type = 'button'; ok.className = 'mk-btn primary'; ok.textContent = '确定';
		row.append(cancel, ok);
		box.append(row);
		back.append(box);
		const before = document.activeElement as HTMLElement | null;
		const done = (canceled: boolean) => {
			document.removeEventListener('keydown', onKey, true);
			back.remove();
			before?.focus?.();
			resolve({ canceled });
		};
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); done(true); } };
		cancel.addEventListener('click', () => done(true));
		ok.addEventListener('click', () => done(false));
		back.addEventListener('click', e => { if (e.target === back) done(true); });
		document.addEventListener('keydown', onKey, true);
		document.body.append(back);
		ok.focus();
	});
}
