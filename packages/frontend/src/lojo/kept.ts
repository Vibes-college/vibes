/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes: copies of server answers kept on the device, per account, so a page can draw at once from what it showed last
// time and refresh in the background. From mainland China a round trip to Hong Kong is 0.2–0.6 s with packet loss at
// peak (measured 2026-10-31); the founder's rule is that only AI features should wait for the network.
// Stored in IndexedDB (utility/idb-proxy.ts); signing out clears it (signout.ts). Copies older than MAX_AGE are not used.

import { get, set } from '@/utility/idb-proxy.js';
import { $i } from '@/i.js';

const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function keyOf(name: string): string | null {
	return $i != null ? `kept:${$i.id}:${name}` : null;
}

export async function readKept<T>(name: string): Promise<T | null> {
	const key = keyOf(name);
	if (key == null) return null;
	try {
		const entry = await get(key) as { at?: number; value?: T } | undefined;
		return entry?.at != null && entry.value !== undefined && Date.now() - entry.at < MAX_AGE ? entry.value : null;
	} catch {
		return null;
	}
}

export function keep(name: string, value: unknown): void {
	const key = keyOf(name);
	if (key == null || value === undefined) return;
	try {
		set(key, { at: Date.now(), value: JSON.parse(JSON.stringify(value)) }).catch(() => {
			// Not kept: the next visit loads from the server as before.
		});
	} catch {
		// A value that cannot be copied is not kept.
	}
}
