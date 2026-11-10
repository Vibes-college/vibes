/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关 · 装备补心: a mini app reports a finished set (lojo/quest/refill). The server decides whether it counts
// (at least 10 items and 2 minutes, once a day per set) and whether it gives a heart (1 a day on this path, max 5).
// Silent on failure. A refill is always said; when the learner came here from 闯关 the reason it did not is said too.

import { misskeyApi } from '@/utility/misskey-api.js';
import * as os from '@/os.js';
import { $i } from '@/i.js';

export type QuestSetApp = 'dictation' | 'typing' | 'vocab' | 'grammar' | 'wordbook';

type RefillResult = { counted: boolean; refilled: boolean; reason: string | null; hearts: number; items: number };

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

export function reportQuestSet(app: QuestSetApp, setKey: string, items: number, startedAt: number, endedAt = Date.now()) {
	if ($i == null || !(items > 0) || !(startedAt > 0)) return;
	const durationMs = Math.min(86_400_000, Math.max(0, Math.round(endedAt - startedAt)));
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	misskeyApi<RefillResult>('lojo/quest/refill' as any, { app, setKey: setKey.slice(0, 200), items: Math.round(items), durationMs, startedAt: Math.round(startedAt) } as any)
		.then(r => {
			if (r.refilled) {
				os.toast(`补回 1 颗心（现在 ${r.hearts}/5）`);
				return;
			}
			if (!cameFromQuest()) return;
			const text = why(r);
			if (text) os.toast(text);
		})
		.catch(() => { /* silent: practice works without 闯关 */ });
}
