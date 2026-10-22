/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { GuideAnchor, GuideBlock } from './types.js';

const CONTEXT_LENGTH = 32;

type TextBlock = GuideBlock & { text: string };

export type AnnotationRect = { left: number; top: number; width: number; height: number };
export type AnnotationHitRegion = { id: string; textLength: number; rects: AnnotationRect[] };

function textBlocks(blocks: GuideBlock[]): TextBlock[] {
	return blocks.filter((block): block is TextBlock => (block.type === 'paragraph' || block.type === 'heading') && typeof block.text === 'string');
}

function blockElements(root: HTMLElement): Map<string, HTMLElement> {
	const elements = new Map<string, HTMLElement>();
	for (const element of root.querySelectorAll<HTMLElement>('[data-guide-block]')) {
		const id = element.dataset.guideBlock;
		if (id == null || elements.has(id)) return new Map();
		elements.set(id, element);
	}
	return elements;
}

function comparePoints(document: Document, firstNode: Node, firstOffset: number, secondNode: Node, secondOffset: number): number {
	const first = document.createRange();
	const second = document.createRange();
	first.setStart(firstNode, firstOffset);
	second.setStart(secondNode, secondOffset);
	first.collapse(true);
	second.collapse(true);
	return first.compareBoundaryPoints(0, second);
}

function offsetInBlock(element: HTMLElement, node: Node, offset: number): number {
	const preceding = element.ownerDocument.createRange();
	preceding.selectNodeContents(element);
	preceding.setEnd(node, offset);
	return preceding.toString().length;
}

function sliceAnchor(blocks: TextBlock[], start: number, startOffset: number, end: number, endOffset: number): { exact: string; prefix: string; suffix: string } {
	const pieces = blocks.slice(start, end + 1).map((block, index) => block.text.slice(index === 0 ? startOffset : 0, index === end - start ? endOffset : undefined));
	const prefix = [...blocks.slice(0, start).map(block => block.text), blocks[start].text.slice(0, startOffset)].join('\n\n').slice(-CONTEXT_LENGTH);
	const suffix = [blocks[end].text.slice(endOffset), ...blocks.slice(end + 1).map(block => block.text)].join('\n\n').slice(0, CONTEXT_LENGTH);
	return { exact: pieces.join('\n\n'), prefix, suffix };
}

function isTextBoundary(text: string, offset: number): boolean {
	if (!Number.isInteger(offset) || offset < 0 || offset > text.length) return false;
	const previous = text.charCodeAt(offset - 1);
	const current = text.charCodeAt(offset);
	return !(previous >= 0xD800 && previous <= 0xDBFF && current >= 0xDC00 && current <= 0xDFFF);
}

/** Offsets are UTF-16 text offsets; paragraph boundaries are canonicalized to two line breaks. */
export function serializeSelection(root: HTMLElement, blocks: GuideBlock[], revision: number, selection: Selection | null): GuideAnchor | null {
	if (selection == null || selection.rangeCount !== 1 || selection.isCollapsed) return null;
	const range = selection.getRangeAt(0);
	if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
	const eligible = textBlocks(blocks);
	if (new Set(eligible.map(block => block.id)).size !== eligible.length) return null;
	const elements = blockElements(root);
	const selected: { index: number; start: number; end: number }[] = [];
	for (const [index, block] of eligible.entries()) {
		const element = elements.get(block.id);
		if (!element) continue;
		const contents = root.ownerDocument.createRange();
		contents.selectNodeContents(element);
		const startsBeforeEnd = comparePoints(root.ownerDocument, range.startContainer, range.startOffset, contents.endContainer, contents.endOffset) < 0;
		const endsAfterStart = comparePoints(root.ownerDocument, range.endContainer, range.endOffset, contents.startContainer, contents.startOffset) > 0;
		if (!startsBeforeEnd || !endsAfterStart) continue;
		if (element.textContent !== block.text) return null;
		const start = comparePoints(root.ownerDocument, range.startContainer, range.startOffset, contents.startContainer, contents.startOffset) <= 0 ? 0 : offsetInBlock(element, range.startContainer, range.startOffset);
		const end = comparePoints(root.ownerDocument, range.endContainer, range.endOffset, contents.endContainer, contents.endOffset) >= 0 ? block.text.length : offsetInBlock(element, range.endContainer, range.endOffset);
		if (end > start) selected.push({ index, start, end });
	}
	if (selected.length === 0) return null;
	const first = selected[0];
	const last = selected[selected.length - 1];
	if (!isTextBoundary(eligible[first.index].text, first.start) || !isTextBoundary(eligible[last.index].text, last.end)) return null;
	// A missing or changed rendered paragraph must not produce an apparently valid quote.
	for (const block of eligible.slice(first.index, last.index + 1)) {
		if (elements.get(block.id)?.textContent !== block.text) return null;
	}
	const quote = sliceAnchor(eligible, first.index, first.start, last.index, last.end);
	if (!quote.exact.trim()) return null;
	return {
		revision,
		startBlockId: eligible[first.index].id,
		startOffset: first.start,
		endBlockId: eligible[last.index].id,
		endOffset: last.end,
		...quote,
	};
}

function textPosition(element: HTMLElement, offset: number): { node: Node; offset: number } | null {
	const walker = element.ownerDocument.createTreeWalker(element, 4 /* SHOW_TEXT */);
	let remaining = offset;
	let node = walker.nextNode();
	while (node) {
		const length = node.textContent?.length ?? 0;
		if (remaining <= length) return { node, offset: remaining };
		remaining -= length;
		node = walker.nextNode();
	}
	return offset === 0 ? { node: element, offset: 0 } : null;
}

/** Fails closed on revised/ambiguous content; it never searches for the first matching phrase. */
export function restoreRange(root: HTMLElement, blocks: GuideBlock[], anchor: GuideAnchor, currentRevision?: number): Range | null {
	if (currentRevision != null && anchor.revision !== currentRevision) return null;
	if (!Number.isInteger(anchor.startOffset) || !Number.isInteger(anchor.endOffset)) return null;
	const eligible = textBlocks(blocks);
	if (new Set(eligible.map(block => block.id)).size !== eligible.length) return null;
	const start = eligible.findIndex(block => block.id === anchor.startBlockId);
	const end = eligible.findIndex(block => block.id === anchor.endBlockId);
	if (start < 0 || end < start) return null;
	if (!isTextBoundary(eligible[start].text, anchor.startOffset) || !isTextBoundary(eligible[end].text, anchor.endOffset)) return null;
	if (start === end && anchor.endOffset <= anchor.startOffset) return null;
	const quote = sliceAnchor(eligible, start, anchor.startOffset, end, anchor.endOffset);
	if (!quote.exact.trim() || quote.exact !== anchor.exact || quote.prefix !== anchor.prefix || quote.suffix !== anchor.suffix) return null;
	const elements = blockElements(root);
	for (const block of eligible.slice(start, end + 1)) {
		if (elements.get(block.id)?.textContent !== block.text) return null;
	}
	const first = textPosition(elements.get(anchor.startBlockId)!, anchor.startOffset);
	const last = textPosition(elements.get(anchor.endBlockId)!, anchor.endOffset);
	if (!first || !last) return null;
	const range = root.ownerDocument.createRange();
	range.setStart(first.node, first.offset);
	range.setEnd(last.node, last.offset);
	return range.collapsed ? null : range;
}

/** Draw each text block independently so interleaved media/resource cards are never highlighted. */
export function restoreTextRanges(root: HTMLElement, blocks: GuideBlock[], anchor: GuideAnchor, currentRevision?: number): Range[] {
	if (!restoreRange(root, blocks, anchor, currentRevision)) return [];
	const eligible = textBlocks(blocks);
	const start = eligible.findIndex(block => block.id === anchor.startBlockId);
	const end = eligible.findIndex(block => block.id === anchor.endBlockId);
	const elements = blockElements(root);
	return eligible.slice(start, end + 1).flatMap((block, index) => {
		const element = elements.get(block.id)!;
		const first = textPosition(element, index === 0 ? anchor.startOffset : 0)!;
		const last = textPosition(element, index === end - start ? anchor.endOffset : block.text.length)!;
		const range = root.ownerDocument.createRange();
		range.setStart(first.node, first.offset);
		range.setEnd(last.node, last.offset);
		return range.collapsed ? [] : [range];
	});
}

/** Return every overlapping discussion, most specific first, so the caller can offer a choice. */
export function hitTestAnnotations(regions: AnnotationHitRegion[], x: number, y: number): string[] {
	return regions
		.filter(region => region.rects.some(rect => x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height + 4))
		.sort((first, second) => first.textLength - second.textLength || first.id.localeCompare(second.id))
		.map(region => region.id);
}
