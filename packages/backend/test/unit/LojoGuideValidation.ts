/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { normalizeGuideText, validateGuideAnchor, validateGuideBlocks } from '@/core/LojoGuideValidation.js';
import type { GuideAnchor, GuideBlock } from '@/models/LojoGuide.js';

function paragraph(id: string, text: string): GuideBlock {
	return { id, type: 'paragraph', text };
}

function anchor(overrides: Partial<GuideAnchor> = {}): GuideAnchor {
	return {
		revision: 3,
		startBlockId: 'first',
		startOffset: 0,
		endBlockId: 'first',
		endOffset: 4,
		exact: '确认费用',
		prefix: '',
		suffix: '',
		...overrides,
	};
}

function expectValidationError(run: () => unknown, code: 'INVALID_GUIDE' | 'INVALID_ANCHOR' | 'STALE_GUIDE'): void {
	try {
		run();
		throw new Error('Expected guide validation to reject the input.');
	} catch (error) {
		expect(error).toBeInstanceOf(Error);
		expect(error).toMatchObject({ code });
	}
}

describe('LOJO guide context parity with the browser', () => {
	test('canonical context crosses block boundaries and uses 32 UTF-16 units', () => {
		const before = '前'.repeat(40);
		const after = '后'.repeat(40);
		const blocks = [paragraph('before', before), paragraph('first', '确认费用'), paragraph('after', after)];
		const result = validateGuideAnchor(blocks, 3, anchor({ prefix: 'forged', suffix: 'forged' }));
		expect(result.prefix).toBe('前'.repeat(30) + '\n\n');
		expect(result.suffix).toBe('\n\n' + '后'.repeat(30));
		expect(result.exact).toBe('确认费用');
	});
});

describe('LOJO guide content boundary', () => {
	test('retains ordinary guide blocks and allows an empty draft', () => {
		const blocks: GuideBlock[] = [
			{ id: 'heading', type: 'heading', text: '搬家前', level: 2 },
			paragraph('first', '确认费用，并记录约定。'),
			{ id: 'photo', type: 'image', url: '/files/moving.jpg', caption: '现场记录' },
			{ id: 'video', type: 'video', url: 'https://example.com/moving.mp4' },
			{ id: 'audio', type: 'audio', url: 'http://example.com/moving.mp3' },
			{ id: 'checklist', type: 'checklist', items: ['确认报价', '检查物品'] },
			{ id: 'tool', type: 'resource', resource: { kind: 'tool', title: '拍照工具', description: '记录现场', url: 'https://example.com/tool' } },
		];
		expect(validateGuideBlocks(blocks)).toEqual(blocks);
		expect(validateGuideBlocks([])).toEqual([]);
	});

	test('rejects duplicate block identities', () => {
		expectValidationError(() => validateGuideBlocks([paragraph('same', '第一段'), paragraph('same', '第二段')]), 'INVALID_GUIDE');
	});

	test('rejects oversized individual text, block counts, and UTF-8 payloads', () => {
		expectValidationError(() => validateGuideBlocks([paragraph('first', '字'.repeat(20001))]), 'INVALID_GUIDE');
		expectValidationError(() => validateGuideBlocks(Array.from({ length: 201 }, (_, index) => paragraph(`block-${index}`, '正文'))), 'INVALID_GUIDE');
		const multibyte = Array.from({ length: 9 }, (_, index) => paragraph(`block-${index}`, '字'.repeat(20000)));
		expect(JSON.stringify(multibyte).length).toBeLessThan(500000);
		expect(Buffer.byteLength(JSON.stringify(multibyte), 'utf8')).toBeGreaterThan(500000);
		expectValidationError(() => validateGuideBlocks(multibyte), 'INVALID_GUIDE');
	});

	test.each([
		'javascript:alert(1)',
		'data:text/html,<script>alert(1)</script>',
		'file:///etc/passwd',
		'//example.com/image.jpg',
		'/\\example.com/image.jpg',
		'https://example.com/\\image.jpg',
		'https://example.com/\nimage.jpg',
	])('rejects unsafe media and resource URLs: %s', (url) => {
		for (const type of ['image', 'video', 'audio'] as const) {
			expectValidationError(() => validateGuideBlocks([{ id: 'media', type, url }]), 'INVALID_GUIDE');
		}
		expectValidationError(() => validateGuideBlocks([
			{ id: 'resource', type: 'resource', resource: { kind: 'tool', title: '工具', description: '工具说明', url } },
		]), 'INVALID_GUIDE');
	});
});

describe('LOJO guide quote anchors', () => {
	test('normalizes rendered whitespace for comparison', () => {
		expect(normalizeGuideText(' \t确认\u00a0费用\n\n后\u3000出发  ')).toBe('确认 费用 后 出发');
	});

	test('derives quote and context from source rather than trusting client context', () => {
		const result = validateGuideAnchor([paragraph('first', '先确认费用再出发')], 3, anchor({
			startOffset: 1,
			endOffset: 5,
			prefix: '伪造的前文',
			suffix: '伪造的后文',
		}));
		expect(result).toMatchObject({ exact: '确认费用', prefix: '先', suffix: '再出发' });
	});

	test('preserves canonical whitespace while accepting normalized selected text', () => {
		const text = '确认\u00a0费用\n后出发';
		const result = validateGuideAnchor([paragraph('first', text)], 3, anchor({ endOffset: text.length, exact: '确认 费用 后出发' }));
		expect(result.exact).toBe(text);
	});

	test('keeps equal quotes in different paragraphs attached to the requested paragraph', () => {
		const blocks = [paragraph('first', '确认费用。'), paragraph('second', '确认费用。')];
		const result = validateGuideAnchor(blocks, 3, anchor({ startBlockId: 'second', endBlockId: 'second' }));
		expect(result.startBlockId).toBe('second');
		expect(result.endBlockId).toBe('second');
	});

	test('keeps equal quotes in one paragraph attached to their offsets', () => {
		const result = validateGuideAnchor([paragraph('first', '确认费用，再确认费用。')], 3, anchor({ startOffset: 6, endOffset: 10 }));
		expect(result).toMatchObject({ startOffset: 6, endOffset: 10, exact: '确认费用', prefix: '确认费用，再', suffix: '。' });
	});

	test('uses UTF-16 offsets for a complete emoji', () => {
		const result = validateGuideAnchor([paragraph('first', '甲🐈乙')], 3, anchor({ startOffset: 1, endOffset: 3, exact: '🐈' }));
		expect(result).toMatchObject({ startOffset: 1, endOffset: 3, exact: '🐈', prefix: '甲', suffix: '乙' });
	});

	test('rejects offsets that split a surrogate pair even if the supplied fragment matches', () => {
		const text = '甲🐈乙';
		for (const [startOffset, endOffset] of [[1, 2], [2, 3]]) {
			expectValidationError(() => validateGuideAnchor([paragraph('first', text)], 3, anchor({ startOffset, endOffset, exact: text.slice(startOffset, endOffset) })), 'INVALID_ANCHOR');
		}
	});

	test('joins selected text blocks across media and checklists using paragraph separators', () => {
		const blocks: GuideBlock[] = [
			paragraph('first', '先确认费用'),
			{ id: 'photo', type: 'image', url: '/files/photo.jpg' },
			{ id: 'checklist', type: 'checklist', items: ['不属于选区正文'] },
			{ id: 'middle', type: 'heading', level: 2, text: '再核对物品' },
			paragraph('last', '然后出发吧'),
		];
		const result = validateGuideAnchor(blocks, 3, anchor({ startOffset: 1, endBlockId: 'last', endOffset: 4, exact: '确认费用 再核对物品 然后出发' }));
		expect(result.exact).toBe('确认费用\n\n再核对物品\n\n然后出发');
	});

	test('rejects non-text endpoints even if their caption or checklist contains the quote', () => {
		const blocks: GuideBlock[] = [
			paragraph('first', '确认费用'),
			{ id: 'photo', type: 'image', url: '/files/photo.jpg', caption: '确认费用' },
			{ id: 'checklist', type: 'checklist', items: ['确认费用'] },
		];
		for (const blockId of ['photo', 'checklist']) {
			expectValidationError(() => validateGuideAnchor(blocks, 3, anchor({ startBlockId: blockId, endBlockId: blockId })), 'INVALID_ANCHOR');
		}
	});

	test('rejects a stale revision instead of silently attaching a quote to revised text', () => {
		expectValidationError(() => validateGuideAnchor([paragraph('first', '确认费用')], 4, anchor()), 'STALE_GUIDE');
	});

	test('rejects mismatched quote text and missing block identities', () => {
		const blocks = [paragraph('first', '确认费用')];
		expectValidationError(() => validateGuideAnchor(blocks, 3, anchor({ exact: '确认时间' })), 'INVALID_ANCHOR');
		expectValidationError(() => validateGuideAnchor(blocks, 3, anchor({ startBlockId: 'missing' })), 'INVALID_ANCHOR');
		expectValidationError(() => validateGuideAnchor(blocks, 3, anchor({ endBlockId: 'missing' })), 'INVALID_ANCHOR');
	});

	test('rejects reverse block order and empty selections', () => {
		const blocks = [paragraph('first', '确认费用'), paragraph('last', '确认时间')];
		expectValidationError(() => validateGuideAnchor(blocks, 3, anchor({ startBlockId: 'last', endBlockId: 'first' })), 'INVALID_ANCHOR');
		expectValidationError(() => validateGuideAnchor(blocks, 3, anchor({ startOffset: 2, endOffset: 2, exact: '' })), 'INVALID_ANCHOR');
		expectValidationError(() => validateGuideAnchor([paragraph('first', '   ')], 3, anchor({ endOffset: 3, exact: '   ' })), 'INVALID_ANCHOR');
	});

	test.each([
		{ startOffset: -1 },
		{ startOffset: 1.5 },
		{ startOffset: 5 },
		{ endOffset: -1 },
		{ endOffset: 1.5 },
		{ endOffset: 5 },
		{ startOffset: 3, endOffset: 2 },
	])('rejects invalid range offsets: %j', (offsets) => {
		expectValidationError(() => validateGuideAnchor([paragraph('first', '确认费用')], 3, anchor(offsets)), 'INVALID_ANCHOR');
	});
});
