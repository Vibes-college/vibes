/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关 · 装备补心: a mini app reports a finished set (lojo/quest/refill). The server decides whether it counts
// (at least 10 items and 2 minutes, once a day per set) and whether it gives a heart (1 a day on this path, max 5).
// Silent on failure. A refill is always said; when the learner came here from 闯关 the reason it did not is said too.
// Opened from 闯关 with ?from=quest&level=<id> in the address, the result is not a toast but a line on the set's own
// result page (QuestBack.vue) with a 回闯关 button back to that level.

import { shallowRef } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import * as os from '@/os.js';
import { $i } from '@/i.js';

export type QuestSetApp = 'dictation' | 'typing' | 'vocab' | 'grammar' | 'wordbook';

export type RefillResult = { counted: boolean; refilled: boolean; reason: string | null; hearts: number; items: number };

// Also written by the 闯关 frame's early bridge, before the app is up (backend server/web/LojoQuestInstant.ts).
const FROM_KEY = 'vibes.quest.from';
const FROM_FOR_MS = 2 * 60 * 60 * 1000;

// Set by the 闯关 page when it sends the learner to a mini app.
export function markFromQuest() {
	try {
		sessionStorage.setItem(FROM_KEY, String(Date.now()));
	} catch { /* private mode */ }
}

function cameFromQuest(): boolean {
	try {
		const at = Number(sessionStorage.getItem(FROM_KEY));
		return Number.isFinite(at) && Date.now() - at < FROM_FOR_MS;
	} catch {
		return false;
	}
}

// What 闯关 sent along: ?from=quest and the level to go back to.
export type QuestFrom = { level: string | null };

export function queryParam(fullPath: string, key: string): string | null {
	const at = fullPath.indexOf('?');
	if (at < 0) return null;
	try {
		return new URLSearchParams(fullPath.slice(at + 1).split('#')[0]).get(key);
	} catch {
		return null;
	}
}

export function questFrom(fullPath: string): QuestFrom | null {
	if (queryParam(fullPath, 'from') !== 'quest') return null;
	const level = queryParam(fullPath, 'level');
	return { level: level != null && /^[\w.-]{1,40}$/.test(level) ? level : null };
}

// Back to the 闯关 map, at the level the learner came from.
export function questBackPath(app: QuestSetApp, from: QuestFrom): string {
	return from.level != null ? `/quest?level=${encodeURIComponent(from.level)}&from=${app}` : '/quest';
}

// The last set reported from a page opened by 闯关, for its result page to show.
export type QuestOutcome =
	| { app: QuestSetApp; at: number; state: 'pending' }
	| { app: QuestSetApp; at: number; state: 'failed' }
	| { app: QuestSetApp; at: number; state: 'done'; refilled: boolean; hearts: number; text: string };

export const questOutcome = shallowRef<QuestOutcome | null>(null);

type Report = { app: QuestSetApp; setKey: string; items: number; durationMs: number; startedAt: number };
// a report that did not get through, sent again on 回闯关
let unsent: Report | null = null;

// The reason as a line on the result page (from 闯关).
function whyLine(r: RefillResult): string {
	switch (r.reason) {
		case 'items': return `还差 ${Math.max(1, 10 - r.items)} 题才算一组（一组至少 10 题），没补心`;
		case 'time': return '这组不到 2 分钟，没补心';
		case 'clock': return '这组的时间对不上，没补心';
		case 'duplicate': return '这组今天已经算过，换一组试试';
		case 'pathUsed': return '今天装备这条路已经补过 1 颗心，这组记进了 Boss 准备';
		case 'full': return '心是满的，这组记进了 Boss 准备';
		case 'noHeartApp': return '这条路不补心，这组记进了 Boss 准备';
		default: return r.counted ? '这组记下了' : '这组没算上，没补心';
	}
}

function why(r: RefillResult): string | null {
	switch (r.reason) {
		case 'items': return `这组只有 ${r.items} 题，满 10 题才算一组，没补心`;
		case 'time': return '这组不到 2 分钟，没补心';
		case 'duplicate': return '这组今天已经算过，换一组试试';
		case 'pathUsed': return '今天练装备这条路已经补过 1 颗心';
		case 'full': return '心是满的，这组记进了 Boss 准备';
		case 'noHeartApp': return '这组记进了 Boss 准备（这条线不补心）';
		default: return null;
	}
}

function send(rep: Report): Promise<RefillResult> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return misskeyApi<RefillResult>('lojo/quest/refill' as any, { ...rep } as any);
}

// fromQuest: the page was opened by 闯关 (?from=quest); its result page then shows the outcome instead of a toast.
export function reportQuestSet(app: QuestSetApp, setKey: string, items: number, startedAt: number, endedAt = Date.now(), fromQuest = false) {
	if ($i == null) return;
	if (!(items > 0) || !(startedAt > 0)) {
		if (fromQuest) questOutcome.value = { app, at: Date.now(), state: 'done', refilled: false, hearts: 0, text: whyLine({ counted: false, refilled: false, reason: 'items', hearts: 0, items: 0 }) };
		return;
	}
	const durationMs = Math.min(86_400_000, Math.max(0, Math.round(endedAt - startedAt)));
	const rep: Report = { app, setKey: setKey.slice(0, 200), items: Math.round(items), durationMs, startedAt: Math.round(startedAt) };
	const at = Date.now();
	if (fromQuest) questOutcome.value = { app, at, state: 'pending' };
	unsent = null;
	send(rep)
		.then(r => {
			if (fromQuest) {
				if (questOutcome.value?.at === at) questOutcome.value = { app, at, state: 'done', refilled: r.refilled, hearts: r.hearts, text: r.refilled ? `心 +1（现在 ${r.hearts}/5）` : whyLine(r) };
				return;
			}
			if (r.refilled) {
				os.toast(`补回 1 颗心（现在 ${r.hearts}/5）`);
				return;
			}
			if (!cameFromQuest()) return;
			const text = why(r);
			if (text) os.toast(text);
		})
		.catch(() => {
			// silent outside 闯关: practice works without it
			if (!fromQuest) return;
			unsent = rep;
			if (questOutcome.value?.at === at) questOutcome.value = { app, at, state: 'failed' };
			os.toast('没连上，这组已经记下，回闯关会再试');
		});
}

// On 回闯关: a report that did not get through goes once more (闯关 reads the hearts when it opens).
export function retryQuestSet(): Promise<void> {
	const rep = unsent;
	unsent = null;
	if (rep == null || $i == null) return Promise.resolve();
	return send(rep).then(() => undefined, () => undefined);
}
