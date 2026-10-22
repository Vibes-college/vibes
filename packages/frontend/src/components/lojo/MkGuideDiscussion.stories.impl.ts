/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { action } from 'storybook/actions';
import { HttpResponse, http } from 'msw';
import type { StoryObj } from '@storybook/vue3';
import { note, userLite } from '../../../.storybook/fakes.js';
import { commonHandlers } from '../../../.storybook/mocks.js';
import type { Guide, GuideAnchor, GuideThread } from '@/lojo/guides/types.js';
import MkGuideDiscussion from './MkGuideDiscussion.vue';

const anchor: GuideAnchor = {
	revision: 1, startBlockId: 'before-moving', startOffset: 0, endBlockId: 'before-moving', endOffset: 23,
	exact: '搬家前，先把楼层、距离与大件物品写进报价单。', prefix: '', suffix: '',
};
const guide: Guide = {
	id: 'guide-story', title: '第一次在深圳搬家', summary: '', category: 'life', city: '深圳', coverUrl: null,
	status: 'published', isDemo: true, revision: 1, blocks: [], author: userLite(),
	createdAt: '2026-10-03T00:00:00Z', updatedAt: '2026-10-03T00:00:00Z', isSaved: false, commentCount: 1,
};
const thread: GuideThread = { id: 'guide-thread-story', guideId: guide.id, anchor, likeCount: 12, isLiked: false, commentCount: 1, createdAt: guide.createdAt };

export const QuotedDiscussion = {
	render(args) {
		return {
			components: { MkGuideDiscussion },
			setup: () => ({ args, onClosed: action('closed'), onChanged: action('changed'), onLocate: action('locate') }),
			template: '<MkGuideDiscussion v-bind="args" @closed="onClosed" @changed="onChanged" @locate="onLocate" />',
		};
	},
	args: { guide, thread, anchor },
	parameters: {
		layout: 'fullscreen',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/lojo/guides/threads/list', () => HttpResponse.json([thread])),
				http.post('/api/lojo/guides/comments/list', () => HttpResponse.json([{ id: 'guide-comment-story', threadId: thread.id, replyToId: null, anchor, note: { ...note(), text: '我会再确认一下停车费和拆装费，避免到场后临时加价。', files: [] } }])),
			],
		},
	},
} satisfies StoryObj<typeof MkGuideDiscussion>;

export const ArticleDiscussion = {
	...QuotedDiscussion,
	args: { guide, thread: null, anchor: null },
} satisfies StoryObj<typeof MkGuideDiscussion>;
