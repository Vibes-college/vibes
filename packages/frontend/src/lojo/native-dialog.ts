/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw, ref } from 'vue';
import type { AppContext, Ref } from 'vue';
import MkLojoDialog from '@/components/lojo/MkLojoDialog.vue';
import { enhanceLojoDialogControls } from '@/lojo/native-dialog-controls.js';
import * as os from '@/os.js';

export type LojoDialogRequest = {
	title: string;
	element: HTMLDialogElement;
	onClose: () => void;
	registerPortal: (element: HTMLElement) => void;
	unregisterPortal: (element: HTMLElement) => void;
};

export type LojoDialogController = {
	closed: Ref<boolean>;
	title: Ref<string>;
	attach: (host: HTMLElement, context: AppContext) => void;
	close: () => void;
};

/** Keep the existing form nodes and delegated controllers inside a native window. */
export function openLojoDialog(request: LojoDialogRequest): { close: () => void; updateTitle: (title: string) => void } {
	const { element } = request;
	element.setAttribute('open', '');
	const marker = element.ownerDocument.createComment('lojo-dialog-return');
	element.before(marker);
	const closed = ref(false);
	const title = ref(request.title);
	let attached = false;
	let disposeControls: (() => void) | null = null;
	const controller: LojoDialogController = markRaw({
		closed,
		title,
		attach(host, context) {
			if (closed.value) return;
			request.registerPortal(element);
			attached = true;
			host.append(element);
			element.classList.add('lojo-native-dialog');
			disposeControls = enhanceLojoDialogControls(element, context);
		},
		close() {
			if (closed.value) return;
			closed.value = true;
			disposeControls?.();
			disposeControls = null;
			if (attached) request.unregisterPortal(element);
			attached = false;
			element.removeAttribute('open');
			if (marker.parentNode) marker.replaceWith(element);
			element.classList.remove('lojo-native-dialog');
			request.onClose();
		},
	});
	const { dispose } = os.popup(MkLojoDialog, { controller }, {
		closed: () => { controller.close(); dispose(); },
	});
	return { close: controller.close, updateTitle: value => { title.value = value; } };
}
