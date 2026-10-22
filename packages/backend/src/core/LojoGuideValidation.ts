/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { GuideAnchor, GuideBlock } from '@/models/LojoGuide.js';

export class LojoGuideValidationError extends Error {
	constructor(public code: 'INVALID_GUIDE' | 'INVALID_ANCHOR' | 'STALE_GUIDE', message: string) {
		super(message);
	}
}

export function normalizeGuideText(text: string): string {
	return text.replace(/\s+/gu, ' ').trim();
}

export function isSafeGuideUrl(value: string): boolean {
	if (!value || value.length > 2048 || /[\\\u0000-\u0020\u007f]/u.test(value)) return false;
	if (value.startsWith('/') && !value.startsWith('//')) return true;
	try {
		const url = new URL(value);
		return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password;
	} catch {
		return false;
	}
}

export function validateGuideBlocks(blocks: GuideBlock[]): GuideBlock[] {
	const fail = (reason: string): never => { throw new LojoGuideValidationError('INVALID_GUIDE', reason); };
	if (!Array.isArray(blocks) || blocks.length > 200 || Buffer.byteLength(JSON.stringify(blocks), 'utf8') > 500000) fail('Guide is too large.');
	const ids = new Set<string>();
	for (const block of blocks) {
		if (!block || typeof block.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/u.test(block.id) || ids.has(block.id)) fail('Block identifiers must be unique.');
		ids.add(block.id);
		if (block.text != null && (typeof block.text !== 'string' || block.text.length > 20000)) fail('Block text is too large.');
		if (block.caption != null && (typeof block.caption !== 'string' || block.caption.length > 1000)) fail('Caption is too large.');
		if (block.url != null && !isSafeGuideUrl(block.url)) fail('Invalid resource URL.');
		switch (block.type) {
			case 'heading':
			case 'paragraph':
				if (block.type === 'heading' && block.level !== 2 && block.level !== 3) fail('Invalid heading level.');
				if (typeof block.text !== 'string') fail('Text is required.');
				break;
			case 'image':
			case 'video':
			case 'audio':
				if (!block.url || !isSafeGuideUrl(block.url)) fail('Media URL is required.');
				break;
			case 'checklist':
				if (!Array.isArray(block.items) || block.items.length > 100 || block.items.some(item => typeof item !== 'string' || item.length > 2000)) fail('Invalid checklist.');
				break;
			case 'resource': {
				const resource = block.resource;
				if (!resource || !['tool', 'service', 'map', 'guide'].includes(resource.kind) || !resource.title?.trim() || resource.title.length > 200 || typeof resource.description !== 'string' || resource.description.length > 2000 || (resource.meta != null && resource.meta.length > 500) || !isSafeGuideUrl(resource.url)) fail('Invalid resource.');
				break;
			}
			default:
				fail('Unsupported block type.');
		}
	}
	return blocks;
}

function validOffset(text: string, offset: number): boolean {
	if (!Number.isInteger(offset) || offset < 0 || offset > text.length) return false;
	const before = text.charCodeAt(offset - 1);
	const after = text.charCodeAt(offset);
	return !(before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff);
}

export function validateGuideAnchor(blocks: GuideBlock[], revision: number, anchor: GuideAnchor): GuideAnchor {
	const fail = (reason: string): never => { throw new LojoGuideValidationError('INVALID_ANCHOR', reason); };
	if (anchor.revision !== revision) throw new LojoGuideValidationError('STALE_GUIDE', 'Guide has changed. Reload before selecting text.');
	const textBlocks = blocks.filter(block => block.type === 'heading' || block.type === 'paragraph');
	const start = textBlocks.findIndex(block => block.id === anchor.startBlockId);
	const end = textBlocks.findIndex(block => block.id === anchor.endBlockId);
	if (start < 0 || end < start) return fail('Invalid block range.');
	const startText = textBlocks[start].text ?? '';
	const endText = textBlocks[end].text ?? '';
	if (!validOffset(startText, anchor.startOffset) || !validOffset(endText, anchor.endOffset) || (start === end && anchor.endOffset <= anchor.startOffset)) return fail('Invalid text offsets.');
	const exact = textBlocks.slice(start, end + 1).map((block, index) => {
		const text = block.text ?? '';
		return text.slice(index === 0 ? anchor.startOffset : 0, index === end - start ? anchor.endOffset : undefined);
	}).join('\n\n');
	if (!normalizeGuideText(exact) || exact.length > 10000 || normalizeGuideText(exact) !== normalizeGuideText(anchor.exact)) return fail('Selected text does not match the guide.');
	const fullText = textBlocks.map(block => block.text ?? '').join('\n\n');
	const blockStart = (index: number) => textBlocks.slice(0, index).reduce((offset, block) => offset + (block.text?.length ?? 0) + 2, 0);
	const globalStart = blockStart(start) + anchor.startOffset;
	const globalEnd = blockStart(end) + anchor.endOffset;
	return {
		revision,
		startBlockId: anchor.startBlockId,
		startOffset: anchor.startOffset,
		endBlockId: anchor.endBlockId,
		endOffset: anchor.endOffset,
		exact,
		prefix: fullText.slice(Math.max(0, globalStart - 32), globalStart),
		suffix: fullText.slice(globalEnd, globalEnd + 32),
	};
}
