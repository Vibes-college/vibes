/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 第 6 步 (2026-11-17): when Vibi asks to change something in a mini app for the learner (add a word to the wordbook…),
// nothing is written yet: the server sends one marker message under her reply (appActionText in backend
// misc/lojo-apps-action.ts) and the chat page draws it as a 「确认」 card (ActionCard.vue). Only the learner's tap on
// 确认 sends it to the app (lojo/apps/actions/decide).

import { misskeyApi } from '@/utility/misskey-api.js';

const MARK = /^【请确认】([\s\S]+)（确认号 ([0-9a-f]{10})）$/; // vibes-i18n-keep: message protocol

export function parseAppAction(text: string | null | undefined): { sentence: string; actionId: string } | null {
	const m = text ? MARK.exec(text.trim()) : null;
	return m ? { sentence: m[1], actionId: m[2] } : null;
}

export type AppActionStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled' | 'expired';

/** The card's state as the server keeps it (lojo/apps/actions/show and decide answer this). */
export type AppActionView = {
	id: string; app: string; appName: string; appUrl: string | null;
	text: { zh: string; en: string }; done: { zh: string | null; en: string | null };
	status: AppActionStatus; createdAt: string; decidedAt: string | null; error: string | null;
};

/** null: no such card (or not this learner's); undefined: could not ask (network). */
export async function showAppAction(actionId: string): Promise<AppActionView | null | undefined> {
	try {
		return await misskeyApi('lojo/apps/actions/show', { actionId }) as unknown as AppActionView;
	} catch (e) {
		return (e as { code?: string } | null)?.code === 'NO_SUCH_ACTION' ? null : undefined;
	}
}

export async function decideAppAction(actionId: string, decision: 'confirm' | 'cancel'): Promise<AppActionView | null | undefined> {
	try {
		return await misskeyApi('lojo/apps/actions/decide', { actionId, decision }) as unknown as AppActionView;
	} catch (e) {
		return (e as { code?: string } | null)?.code === 'NO_SUCH_ACTION' ? null : undefined;
	}
}

/** What went wrong, for the card: the app not answering reads as that; anything else as its code. */
export function appActionErrorKind(error: string | null): 'down' | 'refused' | 'other' {
	if (error == null) return 'other';
	if (error.startsWith('APP_DOWN')) return 'down';
	if (/^(NOT_GRANTED|NO_SUCH_PATH|NO_SUCH_APP|HTTP_40[13])/.test(error)) return 'refused';
	return 'other';
}
