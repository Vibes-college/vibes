/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoryObj } from '@storybook/vue3';
import MkLojoInstallPrompt from './MkLojoInstallPrompt.vue';

export const Default = {
	render(args) {
		return {
			components: { MkLojoInstallPrompt },
			setup() {
				return { args };
			},
			template: '<MkLojoInstallPrompt v-bind="args"/>',
		};
	},
	args: {
		mode: 'install',
	},
	parameters: { layout: 'fullscreen' },
} satisfies StoryObj<typeof MkLojoInstallPrompt>;

export const Installed = {
	...Default,
	args: {
		mode: 'installed',
	},
} satisfies StoryObj<typeof MkLojoInstallPrompt>;
