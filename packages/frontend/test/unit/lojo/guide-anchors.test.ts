/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, describe, expect, test } from 'vitest';
import type { GuideAnchor, GuideBlock } from '@/lojo/guides/types.js';
import { hitTestAnnotations, restoreRange, restoreTextRanges, serializeSelection } from '@/lojo/guides/anchors.js';

function fixture(): { root: HTMLElement; blocks: GuideBlock[]; selection: Selection } {
	const root = document.createElement('article');
	root.innerHTML = '<h2 data-guide-block="title">出发前</h2><p data-guide-block="first">先确认<strong>费用🧳</strong>，再出发。</p><figure data-guide-block="photo"><img alt="沿途照片"></figure><p data-guide-block="second">提前确认费用，留好凭证。</p><p data-guide-block="third">提前确认费用，不要急。</p>';
	document.body.append(root);
	return {
		root,
		blocks: [
			{ id: 'title', type: 'heading', text: '出发前' },
			{ id: 'first', type: 'paragraph', text: '先确认费用🧳，再出发。' },
			{ id: 'photo', type: 'image', url: '/photo.jpg' },
			{ id: 'second', type: 'paragraph', text: '提前确认费用，留好凭证。' },
			{ id: 'third', type: 'paragraph', text: '提前确认费用，不要急。' },
		],
		selection: document.getSelection()!,
	};
}

function select(selection: Selection, start: Node, startOffset: number, end: Node, endOffset: number): void {
	const range = document.createRange();
	range.setStart(start, startOffset);
	range.setEnd(end, endOffset);
	selection.removeAllRanges();
	selection.addRange(range);
}

afterEach(() => {
	document.getSelection()?.removeAllRanges();
	document.body.replaceChildren();
});

describe('guide quote anchors', () => {
	test('preserves UTF-16 positions through nested formatting and a later DOM re-render', () => {
		const { root, blocks, selection } = fixture();
		const paragraph = root.querySelector('[data-guide-block="first"]')!;
		const bold = paragraph.querySelector('strong')!;
		select(selection, bold.firstChild!, 0, paragraph.lastChild!, 1);
		const anchor = serializeSelection(root, blocks, 3, selection)!;
		expect(anchor).toMatchObject({ revision: 3, startBlockId: 'first', startOffset: 3, endOffset: 8, exact: '费用🧳，' });
		paragraph.innerHTML = '先确<span>认费</span><em>用🧳，再出发。</em>';
		expect(restoreRange(root, blocks, anchor, 3)?.toString()).toBe('费用🧳，');
	});

	test('canonicalizes cross-paragraph quotes and excludes interleaved media from drawing', () => {
		const { root, blocks, selection } = fixture();
		const first = root.querySelector('[data-guide-block="first"]')!;
		const second = root.querySelector('[data-guide-block="second"]')!;
		select(selection, first.querySelector('strong')!.firstChild!, 0, second.firstChild!, 6);
		const anchor = serializeSelection(root, blocks, 1, selection)!;
		expect(anchor.exact).toBe('费用🧳，再出发。\n\n提前确认费用');
		expect(anchor).toMatchObject({ startBlockId: 'first', startOffset: 3, endBlockId: 'second', endOffset: 6 });
		expect(restoreTextRanges(root, blocks, anchor, 1).map(range => range.toString())).toEqual(['费用🧳，再出发。', '提前确认费用']);
	});

	test('distinguishes repeated phrases by block identity rather than the first text match', () => {
		const { root, blocks, selection } = fixture();
		const third = root.querySelector('[data-guide-block="third"]')!;
		select(selection, third.firstChild!, 0, third.firstChild!, 6);
		const anchor = serializeSelection(root, blocks, 1, selection)!;
		expect(anchor.exact).toBe('提前确认费用');
		expect(restoreRange(root, blocks, anchor, 1)?.startContainer.parentElement).toBe(third);
		third.remove();
		expect(restoreRange(root, blocks, anchor, 1)).toBeNull();
	});

	test('rejects outdated revisions, changed source text, and same-quote anchors with wrong context', () => {
		const { root, blocks, selection } = fixture();
		const second = root.querySelector('[data-guide-block="second"]')!;
		select(selection, second.firstChild!, 0, second.firstChild!, 6);
		const anchor = serializeSelection(root, blocks, 7, selection)!;
		expect(restoreRange(root, blocks, anchor, 8)).toBeNull();
		expect(restoreRange(root, blocks, { ...anchor, suffix: 'different' }, 7)).toBeNull();
		second.textContent = '先问其他事情。';
		expect(restoreRange(root, blocks, anchor, 7)).toBeNull();
	});

	test('rejects unsupported offsets and duplicate block identities', () => {
		const { root, blocks, selection } = fixture();
		const second = root.querySelector('[data-guide-block="second"]')!;
		select(selection, second.firstChild!, 0, second.firstChild!, 6);
		const anchor = serializeSelection(root, blocks, 1, selection)!;
		for (const startOffset of [-1, 0.5, 999, NaN]) {
			expect(restoreRange(root, blocks, { ...anchor, startOffset }, 1)).toBeNull();
		}
		expect(restoreRange(root, [...blocks, blocks[0]], anchor, 1)).toBeNull();
		root.append(second.cloneNode(true));
		expect(restoreRange(root, blocks, anchor, 1)).toBeNull();
	});

	test('rejects a programmatic boundary that cuts an emoji surrogate pair in half', () => {
		const { root, blocks, selection } = fixture();
		const emoji = root.querySelector('strong')!.firstChild!;
		select(selection, emoji, 2, emoji, 3);
		expect(serializeSelection(root, blocks, 1, selection)).toBeNull();
		select(selection, emoji, 2, emoji, 4);
		expect(serializeSelection(root, blocks, 1, selection)?.exact).toBe('🧳');
	});

	test('does not serialize collapsed or partially outside article selections', () => {
		const { root, blocks, selection } = fixture();
		const text = root.querySelector('[data-guide-block="second"]')!.firstChild!;
		select(selection, text, 2, text, 2);
		expect(serializeSelection(root, blocks, 1, selection)).toBeNull();
		const outside = document.createTextNode('Outside');
		document.body.append(outside);
		select(selection, text, 0, outside, 3);
		expect(serializeSelection(root, blocks, 1, selection)).toBeNull();
	});

	test('handles element boundary selections without relying on text-node endpoints', () => {
		const { root, blocks, selection } = fixture();
		select(selection, root, 1, root, 4);
		const anchor = serializeSelection(root, blocks, 1, selection)!;
		expect(anchor.startBlockId).toBe('first');
		expect(anchor.endBlockId).toBe('second');
		expect(anchor.exact).toBe('先确认费用🧳，再出发。\n\n提前确认费用，留好凭证。');
	});

	test('fails safely when an included paragraph is missing or its DOM text differs', () => {
		const { root, blocks, selection } = fixture();
		select(selection, root, 0, root, 5);
		root.querySelector('[data-guide-block="second"]')!.textContent = 'Unexpected injected content';
		expect(serializeSelection(root, blocks, 1, selection)).toBeNull();
		const empty: GuideAnchor = { revision: 1, startBlockId: 'second', endBlockId: 'second', startOffset: 0, endOffset: 0, exact: '', prefix: '', suffix: '' };
		expect(restoreRange(root, blocks, empty, 1)).toBeNull();
	});

	test('does not silently shorten the quote when its first or last paragraph differs from saved content', () => {
		const { root, blocks, selection } = fixture();
		const first = root.querySelector('[data-guide-block="first"]')!;
		const second = root.querySelector('[data-guide-block="second"]')!;
		first.textContent = 'New leading content';
		select(selection, first.firstChild!, 0, second.firstChild!, 3);
		expect(serializeSelection(root, blocks, 1, selection)).toBeNull();
		first.textContent = blocks[1].text!;
		second.textContent = 'New trailing content';
		select(selection, first.firstChild!, 3, second.firstChild!, 5);
		expect(serializeSelection(root, blocks, 1, selection)).toBeNull();
	});
});

describe('guide discussion hit testing', () => {
	test('returns all overlapping threads with the shortest quotation first, without merging them', () => {
		const regions = [
			{ id: 'whole', textLength: 25, rects: [{ left: 10, top: 10, width: 300, height: 20 }] },
			{ id: 'phrase', textLength: 4, rects: [{ left: 40, top: 10, width: 50, height: 20 }] },
			{ id: 'next', textLength: 8, rects: [{ left: 10, top: 40, width: 70, height: 20 }] },
		];
		expect(hitTestAnnotations(regions, 50, 20)).toEqual(['phrase', 'whole']);
		expect(hitTestAnnotations(regions, 50, 32)).toEqual(['phrase', 'whole']);
		expect(hitTestAnnotations(regions, 50, 38)).toEqual([]);
		expect(hitTestAnnotations(regions, 500, 500)).toEqual([]);
	});
});
