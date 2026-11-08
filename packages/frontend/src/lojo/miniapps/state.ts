/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Which mini apps' intro screen this account has already seen. Logged in, it's kept in the account registry so it
// follows across devices; logged out, local storage is the only thing we have.
import { reactive } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

export const SCOPE = ['lojo', 'miniApps'];
const SEEN_KEY = 'seen';
const LOCAL_KEY = 'lojo:miniApps:seen';

const errorCode = (err: unknown) => (err as { code?: string } | null)?.code;

function isSeenMap(v: unknown): v is Record<string, true> {
	return v != null && typeof v === 'object';
}

function readLocal(): Record<string, true> {
	try {
		const raw = window.localStorage.getItem(LOCAL_KEY);
		if (raw == null) return {};
		const parsed = JSON.parse(raw);
		return isSeenMap(parsed) ? parsed : {};
	} catch {
		return {};
	}
}

function writeLocal(seen: Record<string, true>): void {
	try {
		window.localStorage.setItem(LOCAL_KEY, JSON.stringify(seen));
	} catch {
		// private mode or full storage: the intro just shows again next time, nothing else depends on this
	}
}

export const seenMiniApps = reactive<Record<string, true>>($i == null ? readLocal() : {});

let loading: Promise<void> | null = null;

// Read once per visit; a failed read is tried again on the next call.
export function loadMiniAppsSeen(): Promise<void> {
	if ($i == null) return Promise.resolve();
	loading ??= misskeyApi('i/registry/get', { scope: SCOPE, key: SEEN_KEY }).then((value) => {
		if (isSeenMap(value)) Object.assign(seenMiniApps, value);
	}, (err) => {
		if (errorCode(err) !== 'NO_SUCH_KEY') throw err;
	}).then(() => undefined, () => {
		loading = null;
	});
	return loading;
}

export function hasSeenMiniApp(id: string): boolean {
	return seenMiniApps[id] === true;
}

export async function markMiniAppSeen(id: string): Promise<void> {
	if (seenMiniApps[id] === true) return;
	seenMiniApps[id] = true;
	if ($i == null) {
		writeLocal(seenMiniApps);
		return;
	}
	try {
		await misskeyApi('i/registry/set', { scope: SCOPE, key: SEEN_KEY, value: { ...seenMiniApps } });
	} catch (err) {
		delete seenMiniApps[id];
		throw err;
	}
}
