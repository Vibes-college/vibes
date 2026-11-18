/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The words the AI 学搭子 (Momo) is told: who she is, her rules, how to answer, the notes task, the cues when she writes
// first. They are not in this code (founder 2026-11-17 02:49 PT: her rules belong to the private reply service). They live
// in the tutor account's own registry (scope lojo/tutor, key prompts), put there by the AI tutor team from a private
// repo, and are read on every reply. This file only knows their keys and fills in the gaps ({{key}}).
// Without them she does not use the model: replies get the fixed "away" line, writing first and notes are skipped.

import type { TutorCard } from '@/misc/lojo-tutor.js';

export const PROMPTS_KEY = 'prompts';

export type TutorPrompts = {
	version: string;
	// the persona card for fields the tutor account's own card (key card) leaves empty
	card: TutorCard;
	// The fixed start of the prompt. Gaps: name, description, personality, scenario, system_prompt,
	// post_history_instructions, format.
	system: string;
	formatPlain: string;
	formatQuest: string;
	notesHead: string;
	notesEmpty: string;
	// The last message. Gaps: now; name; name; reason; post.
	now: string;
	learnerName: string;
	tutorName: string;
	progressIntro: string;
	progressAfter: string;
	gatesIntro: string;
	gatesAfter: string;
	opener: string;
	recentPost: string;
	// Why she writes first. Gap in openerExam: days.
	openerFirst: string;
	openerExam: string;
	openerDaily: string;
	recallHead: string;
	recallFoot: string;
	questNextHead: string;
	questNextNone: string;
	questFollowUp: string;
	cueEmpty: string;
	cueWriteFirst: string;
	cueQuest: string;
	notesTask: string;
	// Optional (界面语言第②批, 2026-11-18): for what she writes first (writeFirst, the quest), a line saying which language
	// the learner's interface is in. Gap: language ('English' or 'Chinese'). Not used for replies. Without it, nothing is added.
	uiLanguage?: string;
};

const TEXT_KEYS = [
	'system', 'formatPlain', 'formatQuest', 'notesHead', 'notesEmpty',
	'now', 'learnerName', 'tutorName', 'progressIntro', 'progressAfter', 'gatesIntro', 'gatesAfter', 'opener', 'recentPost',
	'openerFirst', 'openerExam', 'openerDaily', 'recallHead', 'recallFoot',
	'questNextHead', 'questNextNone', 'questFollowUp', 'cueEmpty', 'cueWriteFirst', 'cueQuest', 'notesTask',
] as const satisfies readonly (keyof TutorPrompts)[];

const MAX_TEXT = 20000;
export const DEFAULT_VOICE = 'uk-brit';
const CARD_TEXT_KEYS = ['name', 'description', 'personality', 'scenario', 'first_mes', 'system_prompt', 'post_history_instructions'] as const;

// null when a key is missing or empty: then she does not use the model at all, rather than with half her rules.
// The texts are kept exactly as written (no trimming): the prompt has to stay byte for byte the same for the cache.
export function normalizeTutorPrompts(raw: unknown): TutorPrompts | null {
	if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const r = raw as Record<string, unknown>;
	const text: Partial<Record<(typeof TEXT_KEYS)[number], string>> = {};
	for (const key of TEXT_KEYS) {
		const value = r[key];
		if (typeof value !== 'string' || value === '' || value.length > MAX_TEXT) return null;
		text[key] = value;
	}
	const c = (r.card != null && typeof r.card === 'object' ? r.card : {}) as Record<string, unknown>;
	const card: Record<string, string> = {};
	for (const key of CARD_TEXT_KEYS) card[key] = typeof c[key] === 'string' ? (c[key] as string).trim() : '';
	if (card.name === '' || card.description === '' || card.personality === '' || card.scenario === '') return null;
	const voice = ((c.extensions as { vibes?: { voice?: unknown } } | undefined)?.vibes?.voice);
	return {
		...(text as Record<(typeof TEXT_KEYS)[number], string>),
		...(typeof r.uiLanguage === 'string' && r.uiLanguage !== '' && r.uiLanguage.length <= MAX_TEXT ? { uiLanguage: r.uiLanguage } : {}),
		version: typeof r.version === 'string' ? r.version.slice(0, 60) : '',
		card: { ...(card as Omit<TutorCard, 'extensions'>), extensions: { vibes: { voice: typeof voice === 'string' && voice.trim() !== '' ? voice.trim() : DEFAULT_VOICE } } },
	};
}

// Fills the {{key}} gaps in one pass: what is filled in is not read again, so a name with {{…}} or $ in it stays as it is.
// A gap with no value given is left as it is.
export function fillPrompt(template: string, vars: Record<string, string>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (gap, key: string) => (Object.hasOwn(vars, key) ? vars[key] : gap));
}
