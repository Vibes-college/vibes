/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 每个学员自己的 Momo（创始人 2026-11-16 23:35 / 23:54、11-17 00:13 PT）：学员给自己那只 AI 学搭子挑的脸和起的名字。
// - seed：画脸用（lojo-tuosai.ts tuosaiHead，网址 /lojo-head/<seed>），一串字母和数字，最多 32 个。
// - name：最多 10 个字。不能冒充老师、客服、官方或真人；站点设置里的「用户名禁用词」也拦。
// - 没设置过的学员（包括老账号）：seed 用 momo:<userId>，每人自然不一样，不用写库；名字用 Momo。
// 存在学员自己的 registry 里（scope lojo/tutor，key persona）。学员能直接改自己的 registry，所以每次读都再过一遍。
// 公开的 @tutor_mia 账号照旧用默认名字和默认脸；只有学员自己看到的地方换成 TA 那只。

import { tutorText } from '@/misc/lojo-tutor-text.js';
import type { UiLang } from '@/misc/lojo-ui-lang.js';
import { tutorPublic } from '@/misc/lojo-tutor.js';

export const PERSONA_KEY = 'persona';
export const PERSONA_NAME_MAX = 10;
export const PERSONA_SEED_PATTERN = '^[A-Za-z0-9]{1,32}$';
// Pretending to be staff, a teacher or a real person (拟人化互动办法: the learner must always know it is an AI).
export const PERSONA_BANNED_WORDS = ['老师', '客服', '官方', '管理员', '真人', '人工', '教授', '助教', 'teacher', 'official', 'admin'];

export type TutorPersona = {
	seed: string;
	name: string;
	// false until the learner picks a face or a name (or skips the step after signing up)
	chosen: boolean;
};

export const defaultPersonaSeed = (userId: string) => `momo:${userId}`;

export function defaultPersona(userId: string): TutorPersona {
	return { seed: defaultPersonaSeed(userId), name: tutorPublic.name, chosen: false };
}

// Spaces at both ends trimmed, runs of spaces made one, control characters (new lines too) taken out.
export function cleanPersonaName(raw: string): string {
	// eslint-disable-next-line no-control-regex
	return raw.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
}

export type PersonaNameProblem = 'empty' | 'long' | 'banned';

// isProhibited: the site's prohibited words for user names (UtilityService.isKeyWordIncluded with meta.prohibitedWordsForNameOfUser)
export function personaNameProblem(name: string, isProhibited: (name: string) => boolean = () => false): PersonaNameProblem | null {
	if (name === '') return 'empty';
	if ([...name].length > PERSONA_NAME_MAX) return 'long';
	const lower = name.toLowerCase();
	if (PERSONA_BANNED_WORDS.some(word => lower.includes(word))) return 'banned';
	if (isProhibited(name)) return 'banned';
	return null;
}

export function isPersonaSeed(value: unknown): value is string {
	return typeof value === 'string' && new RegExp(PERSONA_SEED_PATTERN).test(value);
}

// What is saved, checked again on every read: a bad seed or name falls back to the default one.
export function normalizePersona(raw: unknown, userId: string, isProhibited?: (name: string) => boolean): TutorPersona {
	const fallback = defaultPersona(userId);
	if (raw == null || typeof raw !== 'object') return fallback;
	const value = raw as Record<string, unknown>;
	const name = typeof value.name === 'string' ? cleanPersonaName(value.name) : '';
	return {
		seed: isPersonaSeed(value.seed) ? value.seed : fallback.seed,
		name: personaNameProblem(name, isProhibited) == null ? name : fallback.name,
		chosen: true,
	};
}

// The first thing the learner's Momo says, once named after signing up (lojo/tutor/persona/update with greet). A fixed
// line, no model call; it says it is an AI in the first sentence (拟人化互动办法). The sign-up step shows the same words
// (frontend lojo/tutor/persona-rules.ts personaHello). In the learner's interface language (misc/lojo-tutor-text.ts).
export function personaHello(name: string, lang: UiLang = 'zh'): string {
	return tutorText(lang).hello(name);
}
