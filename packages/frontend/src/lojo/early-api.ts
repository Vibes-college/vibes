/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes: the boot loader (public/loader/boot.js, "Early requests") asks for the first page's notes as soon as the HTML
// has arrived, while the app's scripts are still downloading (2026-11-09: on a first visit the notes were only asked
// for 5–6 s in, after every script had run). The app's own request for the same thing takes that answer instead of
// asking again. A request that differs in any way (another timeline, another account, other options) is sent as usual.

type EarlyRequest = {
	endpoint: string;
	key: string;
	token: string | null;
	at: number;
	res: Promise<Response>;
};

// Kept answers older than this are not used: the app should have asked long before, so something else is going on.
const MAX_AGE_MS = 30_000;

// The same in boot.js: the request's options without the credential, in a fixed order.
export function earlyKey(data: Record<string, unknown>): string {
	return JSON.stringify(Object.keys(data).filter(k => k !== 'i' && data[k] !== undefined).sort().map(k => [k, data[k]]));
}

// The early answer for this request, once (a response can only be read once); null when there is none.
export function takeEarlyResponse(endpoint: string, data: Record<string, unknown>, token: string | null): Promise<Response> | null {
	const list = (window as Window & { vibesEarlyApi?: EarlyRequest[] }).vibesEarlyApi;
	if (!Array.isArray(list) || list.length === 0) return null;
	const key = earlyKey(data);
	const index = list.findIndex(e => e.endpoint === endpoint && e.key === key && e.token === token);
	if (index < 0) return null;
	const [early] = list.splice(index, 1);
	if (Date.now() - early.at > MAX_AGE_MS) return null;
	return early.res;
}

// Pages the app downloads ahead (lojo/prefetch.ts) wait for this, so they don't compete with the first page's notes.
let firstContent: (() => void) | null = null;
export const firstContentShown = new Promise<void>(resolve => {
	firstContent = resolve;
});
export function markFirstContentShown(): void {
	firstContent?.();
	firstContent = null;
}
