/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 课程内容进数据库 (2026-11-17): a course's dictation (听写: three sets of lines with a gap — spelling, numbers and
// dates, singular and plural — each with what the recording reads and the accepted answers) is imported into
// lojo_content as kind dictation-<course id> (apps/community/scripts/content-import.mjs) instead of being copied into
// the open-source code. The 听写 mini app (miniapps/dictation) reads it from lojo/content/pack, its page and its server
// (which names the sets and words in its records). It is practice marked on the learner's own device as it is typed
// (letter by letter for spelling), and the recording reads the answer out, so all of it is served: the same as when it
// was in the code. Gates (闯关), which decide progress, keep their answers on the server.
//
// The file: { version, source, pack }. pack is the course file's DICTATION: { perRound, guide, sets: [{ id, tag, zh, en,
// badge?, mode: live | enter, limit: null | { words, number }, instructions: null | { zh, en }, blurb?, how?, items: [{ id,
// answer: [...], line (with {}), say, hint?, rule?, lineZh?, ignoreSpaces?, kind?, number?: pl | sg | unc, near?: [...] }] }] }.
// An item's id is kept in learners' progress: the import script checks that ids already in use are still there.

export const DICTATION_PACK_RULES = {
	/** the IELTS sets are about 24 KB (2026-11-17) */
	maxBytes: 256 * 1024,
	maxVersion: 256,
} as const;

/** content kinds that are a course's dictation; the id after dictation- is the catalog id */
export const DICTATION_PACK_KINDS = ['dictation-ielts'] as const;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v != null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const isPos = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const strings = (v: unknown): boolean => Array.isArray(v) && v.every(isStr);
const bilingual = (v: unknown): boolean => isObj(v) && isStr(v.zh) && isStr(v.en);
const NUMBERS = ['pl', 'sg', 'unc'];

// What is wrong with one item (null = fine).
function itemProblem(v: Obj): string | null {
	if (!Array.isArray(v.answer) || v.answer.length === 0 || !strings(v.answer)) return '要有 answer（至少一个写法）';
	if (!isStr(v.line) || !v.line.includes('{}')) return '要有带 {} 的 line';
	if (!isStr(v.say)) return '要有 say（录音读的话）';
	if (v.near != null && !strings(v.near)) return 'near 要是一串写法';
	if (v.number != null && !NUMBERS.includes(v.number as string)) return 'number 要是 pl、sg 或 unc';
	if (v.ignoreSpaces != null && typeof v.ignoreSpaces !== 'boolean') return 'ignoreSpaces 要是 true 或 false';
	for (const k of ['hint', 'rule', 'lineZh', 'kind']) if (v[k] != null && typeof v[k] !== 'string') return `${k} 要是文字`;
	return null;
}

/** What is wrong with a dictation file (empty = fine), in plain words for the import script. */
export function dictationPackProblems(data: unknown): string[] {
	if (!isObj(data) || !isObj(data.pack)) return ['不是听写文件（要 { version, source, pack }）'];
	const out: string[] = [];
	if (!isStr(data.version)) out.push('缺 version');
	else if (data.version.length > DICTATION_PACK_RULES.maxVersion) out.push(`version 太长（最多 ${DICTATION_PACK_RULES.maxVersion} 字）`);
	const bytes = Buffer.byteLength(JSON.stringify(data.pack));
	if (bytes > DICTATION_PACK_RULES.maxBytes) out.push(`pack 太大：${Math.round(bytes / 1024)} KB（最多 ${DICTATION_PACK_RULES.maxBytes / 1024} KB）`);
	const p = data.pack;

	if (!isPos(p.perRound) || !Number.isInteger(p.perRound)) out.push('perRound 要是正整数（每组出几题）');
	if (!isStr(p.guide)) out.push('要有 guide（做错时链到的攻略）');
	if (!Array.isArray(p.sets) || p.sets.length === 0) {
		out.push('sets 没有组');
		return out;
	}
	const setIds = new Set<string>();
	const itemIds = new Set<string>();
	p.sets.forEach((s: unknown, i) => {
		if (!isObj(s) || !isStr(s.id) || !isStr(s.zh) || !isStr(s.en)) {
			out.push(`第 ${i + 1} 组: 要有 id、zh 和 en`);
			return;
		}
		if (setIds.has(s.id)) out.push(`组号 ${s.id} 重复`);
		setIds.add(s.id);
		if (s.mode !== 'live' && s.mode !== 'enter') out.push(`${s.id}: mode 要是 live 或 enter`);
		if (s.limit != null && (!isObj(s.limit) || !isPos(s.limit.words) || typeof s.limit.number !== 'boolean')) out.push(`${s.id}: limit 要是 null 或 { words, number }`);
		if (s.instructions != null && !bilingual(s.instructions)) out.push(`${s.id}: instructions 要是 null 或 { zh, en }`);
		if (!Array.isArray(s.items) || s.items.length === 0) {
			out.push(`${s.id}: 没有题`);
			return;
		}
		s.items.forEach((v: unknown, j) => {
			if (!isObj(v) || !isStr(v.id)) {
				out.push(`${s.id} 第 ${j + 1} 题: 要有 id`);
				return;
			}
			if (itemIds.has(v.id)) out.push(`题号 ${v.id} 重复`);
			itemIds.add(v.id);
			const problem = itemProblem(v);
			if (problem != null) out.push(`${v.id}: ${problem}`);
		});
	});
	return out;
}
