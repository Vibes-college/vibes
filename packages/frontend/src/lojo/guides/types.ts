/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Misskey from 'misskey-js';

export type GuideBlock = {
	id: string;
	type: 'heading' | 'paragraph' | 'image' | 'video' | 'audio' | 'checklist' | 'resource';
	text?: string;
	level?: 2 | 3;
	url?: string;
	caption?: string;
	items?: string[];
	resource?: {
		kind: 'tool' | 'service' | 'map' | 'guide';
		title: string;
		description: string;
		url: string;
		meta?: string;
	};
};

export type GuideAnchor = {
	revision: number;
	startBlockId: string;
	startOffset: number;
	endBlockId: string;
	endOffset: number;
	exact: string;
	prefix: string;
	suffix: string;
};

export type Guide = {
	id: string;
	title: string;
	summary: string;
	category: string;
	city: string;
	coverUrl: string | null;
	status: 'draft' | 'published';
	isDemo: boolean;
	featured?: boolean;
	revision: number;
	blocks: GuideBlock[];
	author: Misskey.entities.UserLite;
	createdAt: string;
	updatedAt: string;
	isSaved: boolean;
	commentCount: number;
};

export type GuideThread = {
	id: string;
	guideId: string;
	anchor: GuideAnchor | null;
	likeCount: number;
	isLiked: boolean;
	commentCount: number;
	createdAt: string;
};

export type GuideComment = {
	id: string;
	threadId: string;
	replyToId: string | null;
	note: Misskey.entities.Note;
	anchor?: GuideAnchor | null;
};

export type GuideSaveInput = Pick<Guide, 'title' | 'summary' | 'category' | 'city' | 'blocks' | 'status'> & {
	guideId?: string;
	expectedRevision?: number;
	coverUrl?: string | null;
	isDemo?: boolean;
};

// The four bookshelves. Order is the shelf order on the guides page.
export const guideCategories = [
	{ id: 'housing', title: '租房', icon: 'ti ti-building' },
	{ id: 'ai', title: 'AI 技能', icon: 'ti ti-sparkles' },
	{ id: 'career', title: '求职', icon: 'ti ti-briefcase' },
	{ id: 'abroad', title: '留学申请', icon: 'ti ti-plane-departure' },
] as const;

// Earlier demo categories. Existing guides keep them; new guides cannot pick them.
export const legacyGuideCategories = [
	{ id: 'life', title: '生活', icon: 'ti ti-coffee' },
	{ id: 'sport', title: '运动', icon: 'ti ti-run' },
	{ id: 'pets', title: '养宠', icon: 'ti ti-paw' },
	{ id: 'travel', title: '出游', icon: 'ti ti-route' },
] as const;
