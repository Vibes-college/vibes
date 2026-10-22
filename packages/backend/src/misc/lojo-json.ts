/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const LOJO_STATE_MAX_BYTES = 12 * 1024 * 1024;

/** JSON values are stored as data, never merged into service/config objects. */
export function isSafeLojoJson(value: unknown, maxBytes: number): boolean {
	let remainingNodes = 100_000;
	const visit = (item: unknown, depth: number): boolean => {
		if (--remainingNodes < 0 || depth > 24) return false;
		if (item === null || typeof item === 'boolean') return true;
		if (typeof item === 'number') return Number.isFinite(item);
		if (typeof item === 'string') return item.length <= maxBytes;
		if (Array.isArray(item)) return item.length <= 2000 && item.every(child => visit(child, depth + 1));
		if (typeof item !== 'object' || Object.getPrototypeOf(item) !== Object.prototype) return false;
		return Object.entries(item).every(([key, child]) =>
			!['__proto__', 'prototype', 'constructor'].includes(key) && visit(child, depth + 1));
	};
	if (!visit(value, 0)) return false;
	return Buffer.byteLength(JSON.stringify(value), 'utf8') <= maxBytes;
}
