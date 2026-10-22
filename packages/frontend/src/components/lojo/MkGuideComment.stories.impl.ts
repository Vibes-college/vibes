/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { action } from 'storybook/actions';
import type { StoryObj } from '@storybook/vue3';
import { note } from '../../../.storybook/fakes.js';
import MkGuideComment from './MkGuideComment.vue';

export const Default = {
	render(args) {
		return {
			components: { MkGuideComment },
			setup: () => ({ args, onReply: action('reply'), onDelete: action('delete') }),
			template: '<div style="width: min(420px, 100%);"><MkGuideComment v-bind="args" @reply="onReply" @delete="onDelete" /></div>',
		};
	},
	args: {
		comment: {
			id: 'guide-comment-story',
			threadId: 'guide-thread-story',
			replyToId: null,
			note: { ...note(), text: '可以再加一份搬家前的打包清单，按房间分开会更方便。', files: [], reactions: { '❤': 3 }, myReaction: '❤' },
		},
	},
	parameters: { layout: 'centered' },
} satisfies StoryObj<typeof MkGuideComment>;

export const Reply = {
	...Default,
	args: {
		...Default.args,
		replyName: '阿棠',
		comment: { ...Default.args.comment, replyToId: 'previous-comment' },
	},
} satisfies StoryObj<typeof MkGuideComment>;
