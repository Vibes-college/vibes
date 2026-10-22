/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import { enhanceNativeControls } from '@/lojo/native-dialog-controls.js';

vi.mock('@/i18n.js', () => ({ i18n: { ts: { attachFile: 'Attach file' } } }));
vi.mock('@/components/MkInput.vue', () => ({ default: defineComponent({ props: ['modelValue', 'type', 'required', 'disabled', 'readonly', 'placeholder'], setup: props => () => h('div', [h('input', { ...props, value: props.modelValue })]) }) }));
vi.mock('@/components/MkTextarea.vue', () => ({ default: defineComponent({ props: ['modelValue', 'required'], setup: props => () => h('div', [h('textarea', { required: props.required, value: props.modelValue })]) }) }));
vi.mock('@/components/MkButton.vue', () => ({ default: defineComponent({ props: ['type', 'disabled'], setup: (props, { slots }) => () => h('button', { type: props.type, disabled: props.disabled }, slots.default?.()) }) }));
vi.mock('@/components/MkSelect.vue', () => ({ default: defineComponent({ props: ['modelValue', 'items'], emits: ['update:modelValue'], setup: (props, { emit }) => () => h('button', { type: 'button', tabindex: '0', onClick: () => emit('update:modelValue', props.items[1].value) }, props.modelValue) }) }));
vi.mock('@/components/MkSwitch.vue', () => ({ default: defineComponent({ props: ['modelValue'], emits: ['update:modelValue'], setup: (props, { emit }) => () => h('input', { type: 'checkbox', checked: props.modelValue, onClick: () => emit('update:modelValue', !props.modelValue) }) }) }));

const cleanups: (() => void)[] = [];
afterEach(() => { cleanups.splice(0).forEach(cleanup => cleanup()); document.body.replaceChildren(); });

function fixture(markup: string, options = {}) {
	const root = document.createElement('div');
	root.innerHTML = markup;
	document.body.append(root);
	cleanups.push(enhanceNativeControls(root, createApp({})._context, options));
	return root;
}

describe('native map forms', () => {
	it('preserves form identities, actual form data and validation on native inputs', () => {
		const root = fixture('<form id="trip"><label>Title<input id="title" name="title" required maxlength="80" value="Weekend"></label><label>Days<input name="days" type="number" min="1" max="5" step="1" value="2" required></label><label>Note<textarea name="note" maxlength="100">Remember</textarea></label><button type="submit" data-action="save">Save</button></form>');
		const form = root.querySelector('form')!;
		const title = root.querySelector<HTMLInputElement>('#title')!;
		expect(root.querySelectorAll('[name="title"]')).toHaveLength(1);
		expect(title.required).toBe(true);
		expect(title.maxLength).toBe(80);
		expect(root.querySelector('label')).toBeNull();
		expect(new FormData(form).get('title')).toBe('Weekend');
		title.value = '';
		expect(form.checkValidity()).toBe(false);
		title.value = 'Updated';
		expect(new FormData(form).get('title')).toBe('Updated');
		const days = root.querySelector<HTMLInputElement>('[name="days"]')!;
		expect([days.min, days.max, days.step]).toEqual(['1', '5', '1']);
		const handler = vi.fn();
		form.addEventListener('click', event => { if ((event.target as HTMLElement).closest('[data-action="save"]')) { event.preventDefault(); handler(); } });
		root.querySelector<HTMLButtonElement>('[data-action="save"]')!.click();
		expect(handler).toHaveBeenCalledOnce();
	});

	it('keeps choice values in FormData and forwards change only once', () => {
		const root = fixture('<form><label>Day<select name="day"><option value="1">One</option><option value="2">Two</option></select></label><label>Pet<input name="pet" type="checkbox"></label></form>');
		const changes: string[] = [];
		root.addEventListener('change', event => changes.push((event.target as HTMLInputElement).name));
		root.querySelector<HTMLButtonElement>('[data-lojo-native] button')!.click();
		root.querySelector<HTMLInputElement>('[data-lojo-native] input')!.click();
		const data = new FormData(root.querySelector('form')!);
		expect(data.get('day')).toBe('2');
		expect(data.get('pet')).toBe('on');
		expect(changes.filter(name => name === 'day')).toHaveLength(1);
		expect(changes.filter(name => name === 'pet')).toHaveLength(1);
	});

	it('upgrades replacement content and leaves map marker buttons alone in page mode', async () => {
		const root = fixture('<button data-action="pin">Pin</button><form id="first"><input name="before" value="A"></form>', { formsOnly: true });
		expect(root.querySelector('[data-action="pin"]')?.closest('[data-lojo-native]')).toBeNull();
		root.querySelector('form')!.outerHTML = '<form id="second"><input name="after" value="B"><button type="submit">Save</button></form>';
		await new Promise(resolve => setTimeout(resolve, 10));
		await nextTick();
		expect(root.querySelectorAll('[data-lojo-native="field"]')).toHaveLength(1);
		expect(new FormData(root.querySelector('form')!).get('after')).toBe('B');
		expect(root.querySelector('[data-lojo-native="button"]')).not.toBeNull();
	});

	it('preserves dynamic nested labels and their accessible name after updates', () => {
		const root = fixture('<form><label><span id="invite-level-label">Experience</span><input name="level"></label></form>');
		const field = root.querySelector<HTMLInputElement>('[name="level"]')!;
		expect(field.getAttribute('aria-labelledby')).toBe('invite-level-label');
		root.querySelector('#invite-level-label')!.textContent = 'Preparation';
		expect(root.querySelector('#invite-level-label')?.textContent).toBe('Preparation');
		expect(field.hasAttribute('aria-label')).toBe(false);
	});
});
