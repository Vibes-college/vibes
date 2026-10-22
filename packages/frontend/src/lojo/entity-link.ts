/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function mapRouteFromText(text: string | null | undefined, origin: string): string | null {
	for (const candidate of text?.match(/https?:\/\/[^\s<>\[\]()]+/g) ?? []) {
		try {
			const link = new URL(candidate);
			// Notes written before the route map took over /lojo still point at /lojo#…; both open the 落脚地图.
			if (link.origin !== origin || (link.pathname !== '/lojo' && link.pathname !== '/map' && link.pathname !== '/lojo/map') || link.search) continue;
			if (!/^#(?:building|place|animal|event|trip|housing-reference)\/[a-z\d_-]+$/i.test(link.hash)) continue;
			return `/lojo/map${link.hash}`;
		} catch {
			// A malformed external link is ordinary note content, not a map context.
		}
	}
	return null;
}
