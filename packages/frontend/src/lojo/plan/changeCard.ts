/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 私信任务标签: under Vibi's reply the server sends one marker message per change she made to the plan
// (planChangeText in backend core/LojoTutorService.ts). The chat page draws it as a card (ChangeCard.vue).

import { ref } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';

const MARK = /^【任务改动】([\s\S]+)（改动号 ([0-9a-z]+)，可以在「任务」页撤销）$/; // vibes-i18n-keep: message protocol

export function parsePlanChange(text: string | null | undefined): { summary: string; changeId: string } | null {
	const m = text ? MARK.exec(text.trim()) : null;
	return m ? { summary: m[1], changeId: m[2] } : null;
}

type Recent = { stageNow: number | null; changes: { id: string; undone: boolean }[] };
let recent: { at: number; p: Promise<Recent> } | null = null;

// One read for all the cards on screen (the last 10 changes, and the stage now for the card's line colour).
export function recentPlanChanges(fresh = false): Promise<Recent> {
	if (!fresh && recent && Date.now() - recent.at < 5000) return recent.p;
	const p = misskeyApi('lojo/plan/show', {}).then((r: any) => ({
		stageNow: r?.stageNow ?? null,
		changes: (r?.recentChanges ?? []).map((c: any) => ({ id: c.id, undone: c.undone === true })),
	}), () => ({ stageNow: null, changes: [] }));
	recent = { at: Date.now(), p };
	return p;
}

// Vibi's account(s), so only her marker messages become cards (read once per page load).
export const planTutorIds = ref<string[]>([]);
let asked = false;
export function loadPlanTutorIds() {
	if (asked) return;
	asked = true;
	misskeyApi('lojo/tutor/public').then(r => { planTutorIds.value = r.ids; }, () => { asked = false; });
}
