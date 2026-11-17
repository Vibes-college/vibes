/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 课程内容进数据库 (2026-11-17): a course's word lists (5 号线 · 词汇: the stops, their words with meaning, phonetics
// and example) are imported into lojo_content as kind vocab-<course id> (apps/community/scripts/content-import.mjs)
// instead of being copied into the open-source code. The vocabulary mini app (miniapps/vocab) and the gate result page
// (frontend lojo/gates/vocab.ts) read them from lojo/content/pack; the mini app's server follows the version in use.
// The words are study material that every learner sees; the gate's questions and answers are imported separately.
//
// The file: { version, source, pack }. pack is the course file's VOCAB: { line, color, gate, stops: [{ id, band,
// topic, en, level, fit, lede, uses, groups: [{ label, words: [{ w, alt?, ipa, pos, zh, ex }] }] }] }.

export const VOCAB_PACK_RULES = {
	/** the IELTS lists are about 50 KB (2026-11-17) */
	maxBytes: 512 * 1024,
	maxVersion: 256,
} as const;

/** content kinds that are a course's word lists; the id after vocab- is the catalog id */
export const VOCAB_PACK_KINDS = ['vocab-ielts'] as const;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v != null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** What is wrong with a word-list file (empty = fine), in plain words for the import script. */
export function vocabPackProblems(data: unknown): string[] {
	if (!isObj(data) || !isObj(data.pack)) return ['不是词表文件（要 { version, source, pack }）'];
	const out: string[] = [];
	if (!isStr(data.version)) out.push('缺 version');
	else if (data.version.length > VOCAB_PACK_RULES.maxVersion) out.push(`version 太长（最多 ${VOCAB_PACK_RULES.maxVersion} 字）`);
	const bytes = Buffer.byteLength(JSON.stringify(data.pack));
	if (bytes > VOCAB_PACK_RULES.maxBytes) out.push(`pack 太大：${Math.round(bytes / 1024)} KB（最多 ${VOCAB_PACK_RULES.maxBytes / 1024} KB）`);
	const p = data.pack;

	if (p.gate != null && (!isObj(p.gate) || Object.values(p.gate).some(v => typeof v !== 'number'))) out.push('gate 里要都是数字');
	if (!Array.isArray(p.stops) || p.stops.length === 0) {
		out.push('stops 没有站');
		return out;
	}
	const seen = new Set<string>();
	p.stops.forEach((s: unknown, i) => {
		const at = `第 ${i + 1} 站`;
		if (!isObj(s) || !isStr(s.id) || !isStr(s.topic) || !Array.isArray(s.groups) || s.groups.length === 0) {
			out.push(`${at}: 要有 id、topic 和至少一组词（groups）`);
			return;
		}
		if (seen.has(s.id)) out.push(`站号 ${s.id} 重复`);
		seen.add(s.id);
		if (s.uses != null && (!Array.isArray(s.uses) || !s.uses.every(isStr))) out.push(`${s.id}: uses 要是站号列表`);
		s.groups.forEach((g: unknown, j) => {
			if (!isObj(g) || !Array.isArray(g.words) || g.words.length === 0) {
				out.push(`${s.id} 第 ${j + 1} 组: 要有 words`);
				return;
			}
			g.words.forEach((w: unknown, k) => {
				if (!isObj(w) || !isStr(w.w) || !isStr(w.zh)) out.push(`${s.id} 第 ${j + 1} 组第 ${k + 1} 个词: 要有 w（词）和 zh（意思）`);
				else if (w.alt != null && (!Array.isArray(w.alt) || !w.alt.every(isStr))) out.push(`${s.id} ${w.w}: alt 要是文字列表`);
			});
		});
	});
	return out;
}
