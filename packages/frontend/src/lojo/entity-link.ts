/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function mapRouteFromText(text: string | null | undefined, origin: string): string | null {
	for (const candidate of text?.match(/https?:\/\/[^\s<>\[\]()]+/g) ?? []) {
		try {
			const link = new URL(candidate);
			if (link.origin !== origin || link.pathname !== '/lojo' || link.search) continue;
			if (!/^#(?:building|place|animal|event|trip|housing-reference)\/[a-z\d_-]+$/i.test(link.hash)) continue;
			return `/lojo${link.hash}`;
		} catch {
			// A malformed external link is ordinary note content, not a map context.
		}
	}
	return null;
}
