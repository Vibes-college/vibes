/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';
import { clearGuideDraft, guideDraftKey, readGuideDraft, writeGuideDraft } from '@/pages/lojo/guides/editor-draft.js';
import type { GuideEditorDraft } from '@/pages/lojo/guides/editor-draft.js';

function memoryStorage() {
	const values = new Map<string, string>();
	return {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => { values.set(key, value); },
		removeItem: (key: string) => { values.delete(key); },
	};
}

function draft(accountId = 'alice', guideId: string | null = null): GuideEditorDraft {
	return {
		accountId, guideId, revision: guideId ? 4 : null, updatedAt: 100,
		content: {
			title: '深圳搬家', summary: '', category: 'life', city: '深圳', coverUrl: '',
			blocks: [{ id: 'stable-paragraph', type: 'paragraph', text: '核对报价后再预约。' }],
		},
	};
}

describe('guide editor local recovery', () => {
	it('keeps separate unsaved documents and accounts', () => {
		const storage = memoryStorage();
		writeGuideDraft(draft(), storage);
		writeGuideDraft(draft('alice', 'published-guide'), storage);
		expect(readGuideDraft('alice', null, storage)?.content.title).toBe('深圳搬家');
		expect(readGuideDraft('alice', 'published-guide', storage)?.revision).toBe(4);
		expect(readGuideDraft('bob', null, storage)).toBeNull();
		expect(readGuideDraft('alice', 'other-guide', storage)).toBeNull();
	});

	it('preserves stable blocks and the original revision for conflict detection', () => {
		const storage = memoryStorage();
		const original = draft('alice', 'guide');
		writeGuideDraft(original, storage);
		expect(readGuideDraft('alice', 'guide', storage)).toEqual(original);
		clearGuideDraft('alice', 'guide', storage);
		expect(readGuideDraft('alice', 'guide', storage)).toBeNull();
	});

	it('does not restore malformed or cross-account content', () => {
		const storage = memoryStorage();
		storage.setItem(guideDraftKey('alice'), '{invalid');
		expect(readGuideDraft('alice', null, storage)).toBeNull();
		storage.setItem(guideDraftKey('alice'), JSON.stringify(draft('bob')));
		expect(readGuideDraft('alice', null, storage)).toBeNull();
	});

	it('reports quota or disabled storage without discarding the editor content', () => {
		const storage = memoryStorage();
		storage.setItem = () => { throw new Error('QuotaExceededError'); };
		const current = draft();
		expect(writeGuideDraft(current, storage)).toBe(false);
		expect(current.content.blocks[0].text).toBe('核对报价后再预约。');
	});
});
