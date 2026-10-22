/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { h, render } from 'vue';
import type { AppContext, Component, VNode } from 'vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** Upgrade trusted runtime form markup without replacing its business handlers. */
export function enhanceLojoDialogControls(root: HTMLElement, context: AppContext, options: { formsOnly?: boolean } = {}): () => void {
	const mounts = new Map<HTMLElement, () => void>();
	let stopped = false;
	let labelCounter = 0;

	function mount(host: HTMLElement, vnode: VNode, cleanup = () => {}) {
		vnode.appContext = context;
		render(vnode, host);
		mounts.set(host, () => { cleanup(); render(null, host); });
	}

	function hostFor(element: HTMLElement, kind: string): HTMLDivElement {
		const host = root.ownerDocument.createElement('div');
		host.dataset.lojoNative = kind;
		element.before(host);
		return host;
	}

	function labelFor(field: Field): string {
		const label = field.closest('label');
		if (!label) return field.getAttribute('aria-label') ?? field.getAttribute('placeholder') ?? '';
		const texts = [...label.childNodes].filter(node => node.nodeType === Node.TEXT_NODE);
		const directText = texts.map(node => node.textContent).join('').trim();
		const clone = label.cloneNode(true) as HTMLElement;
		clone.querySelectorAll('input,select,textarea,option').forEach(node => node.remove());
		const text = clone.textContent?.trim() || directText;
		// Keep labels that controllers update (for example the invite experience
		// prompt) as live DOM. The native input references them instead of taking
		// an immutable copy or showing the same prompt twice.
		if (!directText) {
			const liveLabels = [...label.children].filter(node => !node.matches('input,textarea,select')) as HTMLElement[];
			for (const node of liveLabels) if (!node.id) node.id = `lojo-native-label-${++labelCounter}`;
			if (liveLabels.length) field.setAttribute('aria-labelledby', liveLabels.map(node => node.id).join(' '));
		}
		texts.forEach(node => node.remove());
		// Each Mk control owns its label activation. An enclosing HTML label would
		// click a switch or file picker twice, so retain its layout as a div.
		const container = root.ownerDocument.createElement('div');
		for (const attribute of [...label.attributes]) if (attribute.name !== 'for') container.setAttribute(attribute.name, attribute.value);
		container.append(...label.childNodes);
		label.replaceWith(container);
		return text;
	}

	function copyAttributes(from: HTMLElement, to: HTMLElement) {
		for (const attribute of [...from.attributes]) {
			if (!['class', 'style', 'value', 'hidden'].includes(attribute.name)) to.setAttribute(attribute.name, attribute.value);
		}
	}

	function updateBackingField(field: Field, value: string | number | boolean) {
		if (field instanceof HTMLInputElement && field.type === 'checkbox') field.checked = Boolean(value);
		else field.value = String(value);
		field.dispatchEvent(new Event('input', { bubbles: true }));
		field.dispatchEvent(new Event('change', { bubbles: true }));
	}

	function enhanceChoice(field: HTMLSelectElement | HTMLInputElement, label: string) {
		const host = hostFor(field, 'field');
		const checkbox = field instanceof HTMLInputElement;
		const modelValue = field instanceof HTMLInputElement ? field.checked : field.value;
		field.hidden = true;
		field.dataset.lojoBacking = '';
		const component: Component = checkbox ? MkSwitch : MkSelect;
		const renderChoice = (value: string | boolean, error = '') => {
			const vnode = h(component, {
				modelValue: value,
				disabled: field.disabled,
				...(field instanceof HTMLSelectElement ? { items: [...field.options].map(option => ({ value: option.value, label: option.textContent ?? '' })) } : {}),
				'onUpdate:modelValue': (next: string | boolean) => { updateBackingField(field, next); renderChoice(next); },
			}, { label: () => field.hasAttribute('aria-labelledby') ? '' : label, caption: () => error });
			vnode.appContext = context;
			render(vnode, host);
			const focusable = host.querySelector<HTMLElement>('input,[tabindex="0"]');
			if (field.hasAttribute('aria-labelledby')) focusable?.setAttribute('aria-labelledby', field.getAttribute('aria-labelledby')!);
			else focusable?.setAttribute('aria-label', label);
		};
		renderChoice(modelValue);
		const change = () => renderChoice(field instanceof HTMLInputElement ? field.checked : field.value);
		const focus = () => host.querySelector<HTMLElement>('input,[tabindex="0"]')?.focus();
		const invalid = (event: Event) => { event.preventDefault(); renderChoice(field instanceof HTMLInputElement ? field.checked : field.value, field.validationMessage); focus(); };
		field.addEventListener('invalid', invalid);
		field.addEventListener('focus', focus);
		field.addEventListener('change', change);
		mounts.set(host, () => { field.removeEventListener('invalid', invalid); field.removeEventListener('focus', focus); field.removeEventListener('change', change); render(null, host); });
	}

	function enhanceFile(field: HTMLInputElement, label: string) {
		const host = hostFor(field, 'file');
		field.hidden = true;
		field.dataset.lojoBacking = '';
		const draw = (error = '') => {
			const vnode = h('div', [
				h(MkButton, { onClick: () => field.click(), disabled: field.disabled }, { default: () => [h('i', { class: 'ti ti-photo' }), ' ', label || i18n.ts.attachFile] }),
				h('div', { 'aria-live': 'polite' }, [...(field.files ?? [])].map(file => file.name).join(', ')),
				h('div', { role: 'alert' }, error),
			]);
			vnode.appContext = context;
			render(vnode, host);
		};
		const change = () => queueMicrotask(() => { if (!stopped && root.contains(host)) draw(); });
		const invalid = (event: Event) => { event.preventDefault(); draw(field.validationMessage); host.querySelector('button')?.focus(); };
		field.addEventListener('change', change);
		field.addEventListener('invalid', invalid);
		draw();
		mounts.set(host, () => { field.removeEventListener('change', change); field.removeEventListener('invalid', invalid); render(null, host); });
	}

	function enhanceField(field: Field) {
		if (field instanceof HTMLInputElement && ['hidden', 'radio', 'range'].includes(field.type)) return;
		const label = labelFor(field);
		if (field instanceof HTMLSelectElement || (field instanceof HTMLInputElement && field.type === 'checkbox')) { enhanceChoice(field, label); return; }
		if (field instanceof HTMLInputElement && field.type === 'file') { enhanceFile(field, label); return; }
		const host = hostFor(field, 'field');
		const component: Component = field instanceof HTMLTextAreaElement ? MkTextarea : MkInput;
		const vnode = h(component, {
			modelValue: field.type === 'number' && field.value !== '' ? Number(field.value) : field.value,
			type: field.type,
			required: field.required,
			disabled: field.disabled,
			readonly: field.readOnly,
			placeholder: field.placeholder,
			spellcheck: field.spellcheck,
		}, { label: () => field.hasAttribute('aria-labelledby') ? '' : label });
		mount(host, vnode);
		const input = host.querySelector<HTMLInputElement | HTMLTextAreaElement>('input,textarea')!;
		copyAttributes(field, input);
		if (!field.hasAttribute('aria-labelledby')) input.setAttribute('aria-label', label);
		field.replaceWith(host);
	}

	function enhanceButton(button: HTMLButtonElement) {
		if (button.classList.contains('dialog-close')) return;
		const host = hostFor(button, 'button');
		const vnode = h(MkButton, {
			type: button.type,
			primary: button.classList.contains('dark') || button.type === 'submit' || button.classList.contains('active'),
			full: button.classList.contains('wide'),
			disabled: button.disabled,
		}, { default: () => h('span', { innerHTML: button.innerHTML }) });
		mount(host, vnode);
		const nativeButton = host.querySelector('button')!;
		copyAttributes(button, nativeButton);
		button.replaceWith(host);
	}

	function enhance() {
		if (stopped) return;
		for (const [host, cleanup] of mounts) {
			if (!root.contains(host)) { cleanup(); mounts.delete(host); }
		}
		for (const field of root.querySelectorAll<Field>('input,textarea,select')) {
			if (options.formsOnly && !field.closest('form')) continue;
			if (field.closest('[data-lojo-native]') || field.hasAttribute('data-lojo-backing')) continue;
			enhanceField(field);
		}
		for (const button of root.querySelectorAll<HTMLButtonElement>('button')) {
			if (options.formsOnly && !button.closest('form')) continue;
			if (!button.closest('[data-lojo-native]')) enhanceButton(button);
		}
	}

	const observer = new MutationObserver(enhance);
	enhance();
	observer.observe(root, { childList: true, subtree: true });
	return () => {
		stopped = true;
		observer.disconnect();
		for (const cleanup of mounts.values()) cleanup();
		mounts.clear();
	};
}

export const enhanceNativeControls = enhanceLojoDialogControls;
