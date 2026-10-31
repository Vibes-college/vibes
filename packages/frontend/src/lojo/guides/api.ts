/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Guide, GuideAnchor, GuideComment, GuideSaveInput, GuideThread } from './types.js';
import { misskeyApi } from '@/utility/misskey-api.js';

type ThreadTarget = { guideId: string; threadId?: string; anchor?: GuideAnchor };

// "ielts-listening-gaps": an imported guide's slug, words joined by hyphens; ids never have a hyphen.
export const isGuideSlug = (ref: string): boolean => /^[a-z0-9]+(-[a-z0-9]+)+$/.test(ref);

export const guideApi = {
	list: (params: { category?: string; search?: string; savedOnly?: boolean; mine?: boolean; featuredOnly?: boolean; limit?: number; offset?: number } = {}) => misskeyApi<Guide[]>('lojo/guides/list', params),
	// by id, or by an imported guide's slug
	show: (ref: string) => misskeyApi<Guide>('lojo/guides/show', isGuideSlug(ref) ? { slug: ref } : { guideId: ref }),
	save: (params: GuideSaveInput) => misskeyApi<Guide>('lojo/guides/save', params),
	bookmark: (guideId: string, saved: boolean) => misskeyApi<{ saved: boolean }>('lojo/guides/bookmark', { guideId, saved }),
	feature: (guideId: string, featured: boolean) => misskeyApi<Guide>('lojo/guides/feature', { guideId, featured }),
	threads: (guideId: string) => misskeyApi<GuideThread[]>('lojo/guides/threads/list', { guideId }),
	like: (params: ThreadTarget & { liked: boolean }) => misskeyApi<GuideThread>('lojo/guides/threads/like', params),
	comments: (params: { guideId: string; threadId?: string; limit?: number; untilId?: string }) => misskeyApi<GuideComment[]>('lojo/guides/comments/list', params),
	comment: (params: ThreadTarget & { text: string; fileIds?: string[]; replyToId?: string }) => misskeyApi<{ thread: GuideThread; comment: GuideComment }>('lojo/guides/comments/create', params),
	deleteComment: (commentId: string) => misskeyApi('lojo/guides/comments/delete', { commentId }),
};

// Vibes: full guides from the last list answers, so opening one draws at once (pages/lojo/guides/detail.vue) and
// refreshes in the background. In memory only; the newest MAX_RECENT are kept.
const MAX_RECENT = 100;
const recent = new Map<string, Guide>();

export function rememberGuides(guides: Guide[]): void {
	for (const guide of guides) {
		recent.delete(guide.id);
		recent.set(guide.id, guide);
	}
	while (recent.size > MAX_RECENT) {
		const oldest = recent.keys().next().value;
		if (oldest == null) break;
		recent.delete(oldest);
	}
}

export function recallGuide(id: string): Guide | null {
	return recent.get(id) ?? null;
}
