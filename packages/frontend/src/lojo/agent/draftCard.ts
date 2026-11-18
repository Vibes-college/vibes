/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 发到我的电脑: Vibi's draft for the learner's computer arrives as a marker message (agentDraftText in backend
// core/LojoTutorService.ts); the chat page draws it as DraftCard.vue. The learner's hand-back starts with RESULT_HEAD
// (bridge.ts) and is drawn as ResultCard.vue.

import { RESULT_HEAD } from './bridge.js';

const MARK = /^【给电脑的指令】（草稿号 ([0-9a-f]+)）\n([\s\S]+)$/; // vibes-i18n-keep: message protocol

export function parseAgentDraft(text: string | null | undefined): { draftId: string; text: string } | null {
	const m = text ? MARK.exec(text) : null;
	return m ? { draftId: m[1], text: m[2] } : null;
}

export function parseAgentResult(text: string | null | undefined): { head: string; did: string; body: string } | null {
	if (!text?.startsWith(RESULT_HEAD)) return null;
	const nl = text.indexOf('\n');
	if (nl === -1) return { head: text, did: '', body: '' };
	let body = text.slice(nl + 1);
	let did = '';
	const m = /^做了什么：(.*)\n\n/.exec(body); // vibes-i18n-keep: message protocol
	if (m) {
		did = m[1];
		body = body.slice(m[0].length);
	}
	return { head: text.slice(0, nl), did, body };
}

// The card's words are in lojo/locales/agent.ts (2026-11-17).
