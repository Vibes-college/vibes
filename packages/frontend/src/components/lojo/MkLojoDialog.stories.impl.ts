/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw, ref } from 'vue';
import type { StoryObj } from '@storybook/vue3';
import type { LojoDialogController } from '@/lojo/native-dialog.js';
import MkLojoDialog from './MkLojoDialog.vue';
import { enhanceNativeControls } from '@/lojo/native-dialog-controls.js';
import { i18n } from '@/i18n.js';

export const Default = {
	render() {
		return {
			components: { MkLojoDialog },
			setup() {
				const closed = ref(false);
				let cleanup = () => {};
				const controller: LojoDialogController = markRaw({
					closed,
					title: ref(i18n.ts.edit),
					attach(host, context) {
						const dialog = window.document.createElement('dialog');
						dialog.className = 'lojo-native-dialog';
						dialog.open = true;
						const form = window.document.createElement('form');
						const label = window.document.createElement('label');
						label.textContent = i18n.ts.name;
						const input = window.document.createElement('input');
						input.required = true;
						label.append(input);
						const button = window.document.createElement('button');
						button.type = 'submit';
						button.textContent = i18n.ts.save;
						form.addEventListener('submit', event => event.preventDefault());
						form.append(label, button);
						dialog.append(form);
						host.append(dialog);
						cleanup = enhanceNativeControls(dialog, context);
					},
					close() { closed.value = true; cleanup(); },
				});
				return { controller };
			},
			template: '<MkLojoDialog :controller="controller"/>',
		};
	},
	parameters: { layout: 'fullscreen' },
} satisfies StoryObj<typeof MkLojoDialog>;
