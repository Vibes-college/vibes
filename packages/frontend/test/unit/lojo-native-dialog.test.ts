/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';
import type { LojoDialogController } from '@/lojo/native-dialog.js';
import { openLojoDialog } from '@/lojo/native-dialog.js';

const mock = vi.hoisted(() => ({ controller: null as LojoDialogController | null, cleanup: vi.fn(), dispose: vi.fn() }));
vi.mock('@/components/lojo/MkLojoDialog.vue', () => ({ default: {} }));
vi.mock('@/lojo/native-dialog-controls.js', () => ({ enhanceLojoDialogControls: () => mock.cleanup }));
vi.mock('@/os.js', () => ({ popup: (_component: unknown, props: { controller: LojoDialogController }) => { mock.controller = props.controller; return { dispose: mock.dispose }; } }));

afterEach(() => { document.body.replaceChildren(); vi.clearAllMocks(); });

function fixture() {
	const owner = document.createElement('div');
	const host = document.createElement('div');
	const dialog = document.createElement('dialog');
	dialog.innerHTML = '<form><input name="draft" value="Saved input"></form>';
	owner.append(dialog);
	document.body.append(owner, host);
	const request = { title: 'Title', element: dialog, registerPortal: vi.fn(), unregisterPortal: vi.fn(), onClose: vi.fn() };
	const handle = openLojoDialog(request);
	return { owner, host, dialog, request, handle };
}

describe('native map modal lifecycle', () => {
	it('moves the same DOM through a portal and restores it before close notification', () => {
		const { owner, host, dialog, request, handle } = fixture();
		const input = dialog.querySelector('input');
		expect(dialog.open).toBe(true);
		mock.controller!.attach(host, createApp({})._context);
		expect(request.registerPortal).toHaveBeenCalledWith(dialog);
		expect(dialog.parentElement).toBe(host);
		expect(dialog.querySelector('input')).toBe(input);
		handle.updateTitle('Updated title');
		expect(mock.controller!.title.value).toBe('Updated title');
		request.onClose.mockImplementation(() => { expect(dialog.parentElement).toBe(owner); expect(dialog.open).toBe(false); });
		handle.close();
		handle.close();
		expect(request.onClose).toHaveBeenCalledOnce();
		expect(request.unregisterPortal).toHaveBeenCalledOnce();
		expect(mock.cleanup).toHaveBeenCalledOnce();
		expect(owner.childNodes).toHaveLength(1);
	});

	it('can be closed before the async native popup mounts without stealing the next dialog', () => {
		const { owner, host, dialog, request, handle } = fixture();
		handle.close();
		mock.controller!.attach(host, createApp({})._context);
		expect(dialog.parentElement).toBe(owner);
		expect(request.registerPortal).not.toHaveBeenCalled();
		expect(request.unregisterPortal).not.toHaveBeenCalled();
		expect(host.childNodes).toHaveLength(0);
	});
});
