/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { StoryObj } from '@storybook/vue3';
import MkLojoEntityLink from './MkLojoEntityLink.vue';

export const Building = {
	render(args) {
		return {
			components: { MkLojoEntityLink },
			setup() { return { args }; },
			template: '<MkLojoEntityLink v-bind="args"/>',
		};
	},
	args: { text: `${window.location.origin}/lojo#building/h1` },
	parameters: { layout: 'centered' },
} satisfies StoryObj<typeof MkLojoEntityLink>;

export const PrivatePlan = {
	...Building,
	args: { text: `${window.location.origin}/lojo#planner/private-plan` },
} satisfies StoryObj<typeof MkLojoEntityLink>;
