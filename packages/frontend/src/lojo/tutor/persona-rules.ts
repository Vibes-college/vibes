/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 每个学员自己的 Momo（创始人 2026-11-16 23:35 / 23:54、11-17 00:13 PT）：名字的规矩和头像网址，不碰 Vue，方便测。
// 规矩跟后台一样（packages/backend/src/misc/lojo-tutor-persona.ts），这里只为了边打字边提示；后台还会再查一遍，
// 另外拦站点设置里的「用户名禁用词」。

export const DEFAULT_TUTOR_NAME = 'Momo';
export const PERSONA_NAME_MAX = 10;
// Pretending to be staff, a teacher or a real person (拟人化互动办法: the learner must always know it is an AI).
export const PERSONA_BANNED_WORDS = ['老师', '客服', '官方', '管理员', '真人', '人工', '教授', '助教', 'teacher', 'official', 'admin'];
// Names to try in the 「起名」 step (made up, any will do).
export const PERSONA_NAME_IDEAS = ['Momo', 'Leo', 'Kiki', 'Nova', '豆豆', '阿布'];

// Spaces at both ends trimmed, runs of spaces made one, control characters (new lines too) taken out.
export function cleanPersonaName(raw: string): string {
	// eslint-disable-next-line no-control-regex
	return raw.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
}

// What is wrong with a name, in words for the learner; null when it is fine.
export function personaNameWarning(raw: string): string | null {
	const name = cleanPersonaName(raw);
	if (name === '') return `起个名字吧，不想起就用 ${DEFAULT_TUTOR_NAME}`;
	if ([...name].length > PERSONA_NAME_MAX) return `最多 ${PERSONA_NAME_MAX} 个字`;
	const lower = name.toLowerCase();
	const bad = PERSONA_BANNED_WORDS.find(word => lower.includes(word));
	if (bad != null) return `「${bad}」容易让人以为是真人或官方，换一个吧`;
	return null;
}

// The head only, with a white outline (backend ServerService /lojo-head/:seed, lojo-tuosai.ts tuosaiHead).
// Browsers keep a head for 7 days, so v goes up whenever the drawing changes (2: shaded and sharp, 2026-11-17).
export const PERSONA_HEAD_VERSION = 2;
export function personaHeadUrl(seed: string, sticker = true): string {
	return `/lojo-head/${encodeURIComponent(seed)}?v=${PERSONA_HEAD_VERSION}${sticker ? '&sticker=1' : ''}`;
}

// The face a learner has before picking one: the server's default (lojo-tutor-persona.ts defaultPersonaSeed).
export function defaultPersonaSeed(userId: string): string {
	return `momo:${userId}`;
}

// The faces a learner can save (backend PERSONA_SEED_PATTERN); the default one, momo:<id>, is not saved as such.
export function isSavableSeed(seed: string): boolean {
	return /^[A-Za-z0-9]{1,32}$/.test(seed);
}

// A new face for 「换一个」: letters and digits only, as the server accepts (PERSONA_SEED_PATTERN).
export function randomPersonaSeed(random: (n: number) => Uint8Array = n => crypto.getRandomValues(new Uint8Array(n))): string {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	return Array.from(random(10), b => chars[b % chars.length]).join('');
}

// The first thing the learner's Momo says once named (the 「打招呼」 step). It says it is an AI in the first sentence.
export function personaHello(name: string): string {
	return `嗨，我是 ${name}，你的学搭子。我是 AI，不是真人，陪你练英语、排每天的任务。先说说，你在准备什么？`;
}
