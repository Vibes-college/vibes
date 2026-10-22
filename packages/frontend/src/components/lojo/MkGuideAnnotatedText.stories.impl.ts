/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';
import type { StoryObj } from '@storybook/vue3';
import type { GuideBlock, GuideThread } from '@/lojo/guides/types.js';
import MkGuideAnnotatedText from './MkGuideAnnotatedText.vue';

export const Default = {
	render() {
		return {
			components: { MkGuideAnnotatedText },
			setup() {
				const blocks: GuideBlock[] = [{ id: 'first', type: 'paragraph', text: '出发前确认费用，结束后留好凭证。' }];
				const threads: GuideThread[] = [{
					id: 'discussion', guideId: 'example', createdAt: '2026-10-03T00:00:00Z',
					likeCount: 3, commentCount: 2, isLiked: false,
					anchor: { revision: 1, startBlockId: 'first', endBlockId: 'first', startOffset: 3, endOffset: 7, exact: '确认费用', prefix: '出发前', suffix: '，结束后留好凭证。' },
				}];
				const active = ref<string>();
				return { blocks, threads, active, open(ids: string[]) { active.value = ids[0]; } };
			},
			template: '<MkGuideAnnotatedText :blocks="blocks" :threads="threads" :revision="1" :activeThreadId="active" @open="open"><p data-guide-block="first">{{ blocks[0].text }}</p></MkGuideAnnotatedText>',
		};
	},
	parameters: { layout: 'padded' },
} satisfies StoryObj<typeof MkGuideAnnotatedText>;
