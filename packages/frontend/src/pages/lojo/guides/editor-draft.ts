/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { GuideBlock } from '@/lojo/guides/types.js';
import { miLocalStorage } from '@/local-storage.js';

export type GuideEditorContent = {
	title: string;
	summary: string;
	category: string;
	city: string;
	coverUrl: string;
	blocks: GuideBlock[];
};

export type GuideEditorDraft = {
	accountId: string;
	guideId: string | null;
	revision: number | null;
	updatedAt: number;
	content: GuideEditorContent;
};

type DraftStorage = Pick<typeof miLocalStorage, 'getItem' | 'setItem' | 'removeItem'>;

export function guideDraftKey(accountId: string, guideId?: string | null): `lojoGuideDraft:${string}` {
	return `lojoGuideDraft:${accountId}:${guideId ?? 'new'}`;
}

export function readGuideDraft(accountId: string, guideId?: string | null, storage: DraftStorage = miLocalStorage): GuideEditorDraft | null {
	try {
		const raw = storage.getItem(guideDraftKey(accountId, guideId));
		if (!raw) return null;
		const draft = JSON.parse(raw) as GuideEditorDraft;
		if (draft.accountId !== accountId || draft.guideId !== (guideId ?? null) || !draft.content || !Array.isArray(draft.content.blocks)) return null;
		if (draft.revision !== null && (!Number.isInteger(draft.revision) || draft.revision < 1)) return null;
		if (['title', 'summary', 'category', 'city', 'coverUrl'].some(key => typeof draft.content[key as keyof GuideEditorContent] !== 'string')) return null;
		if (!draft.content.blocks.every(block => typeof block.id === 'string' && ['heading', 'paragraph', 'image', 'video', 'audio', 'checklist', 'resource'].includes(block.type))) return null;
		return draft;
	} catch {
		return null;
	}
}

export function writeGuideDraft(draft: GuideEditorDraft, storage: DraftStorage = miLocalStorage): boolean {
	try {
		storage.setItem(guideDraftKey(draft.accountId, draft.guideId), JSON.stringify(draft));
		return true;
	} catch {
		return false;
	}
}

export function clearGuideDraft(accountId: string, guideId?: string | null, storage: DraftStorage = miLocalStorage): boolean {
	try {
		storage.removeItem(guideDraftKey(accountId, guideId));
		return true;
	} catch {
		return false;
	}
}
