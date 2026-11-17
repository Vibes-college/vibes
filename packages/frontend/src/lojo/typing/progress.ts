/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 0 号线 · 机考打字 moved out to its own mini app at /apps/typing/ (小程序搬出社区, 2026-11-12), which keeps each
// learner's progress itself. The route map still shows how many stops are passed: it asks the mini app, with the
// learner's own sign-in, like the mini app's page does. Which stops the line has comes from the site (kind
// typing-ielts, a copy kept on this device first), not from this code.
import { toTypingContent } from './content.js';
import { $i } from '@/i.js';
import { loadPack } from '@/lojo/content-pack.js';

// The page.
export const TYPING_PATH = '/apps/typing/';

// For the route map: the stops of 0 号线 passed (their ids, in line order), out of how many, and whether that is all of
// them. Rejects when the mini app can't be asked (not when the learner never practised).
export async function loadTypingProgress(): Promise<{ passed: string[]; total: number; done: boolean }> {
	const token = $i?.token;
	// both at once: the line's stops, and the learner's record of them
	const [pack, done] = await Promise.all([
		loadPack('typing-ielts'),
		token == null ? Promise.resolve(new Set<string>()) : window.fetch(`${TYPING_PATH}api/v1/progress`, { headers: { authorization: `Bearer ${token}` } }).then(async r => {
			if (!r.ok) throw new Error(`typing progress ${r.status}`);
			const body = await r.json() as { items: { stop: string; passed: boolean }[] };
			return new Set(body.items.filter(i => i.passed).map(i => i.stop));
		}),
	]);
	const ids = toTypingContent(pack).stops.map(s => s.id);
	const passed = ids.filter(id => done.has(id));
	return { passed, total: ids.length, done: ids.length > 0 && passed.length === ids.length };
}
