/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Guide, GuideAnchor, GuideComment, GuideSaveInput, GuideThread } from './types.js';
import { misskeyApi } from '@/utility/misskey-api.js';

type ThreadTarget = { guideId: string; threadId?: string; anchor?: GuideAnchor };

export const guideApi = {
	list: (params: { category?: string; search?: string; savedOnly?: boolean; mine?: boolean; featuredOnly?: boolean; limit?: number; offset?: number } = {}) => misskeyApi<Guide[]>('lojo/guides/list', params),
	show: (guideId: string) => misskeyApi<Guide>('lojo/guides/show', { guideId }),
	save: (params: GuideSaveInput) => misskeyApi<Guide>('lojo/guides/save', params),
	bookmark: (guideId: string, saved: boolean) => misskeyApi<{ saved: boolean }>('lojo/guides/bookmark', { guideId, saved }),
	feature: (guideId: string, featured: boolean) => misskeyApi<Guide>('lojo/guides/feature', { guideId, featured }),
	threads: (guideId: string) => misskeyApi<GuideThread[]>('lojo/guides/threads/list', { guideId }),
	like: (params: ThreadTarget & { liked: boolean }) => misskeyApi<GuideThread>('lojo/guides/threads/like', params),
	comments: (params: { guideId: string; threadId?: string; limit?: number; untilId?: string }) => misskeyApi<GuideComment[]>('lojo/guides/comments/list', params),
	comment: (params: ThreadTarget & { text: string; fileIds?: string[]; replyToId?: string }) => misskeyApi<{ thread: GuideThread; comment: GuideComment }>('lojo/guides/comments/create', params),
	deleteComment: (commentId: string) => misskeyApi('lojo/guides/comments/delete', { commentId }),
};
