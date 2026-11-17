/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 课程内容进数据库 (2026-11-17): a course's typing line (0 号线 · 机考打字: numbers and symbols to copy, words to spell
// without autocorrect, a form to fill in as a recording plays, sentences, and a timed mock passage) is imported into
// lojo_content as kind typing-<course id> (apps/community/scripts/content-import.mjs) instead of being copied into the
// open-source code. The 机考打字 mini app (miniapps/typing) reads it from lojo/content/pack, its page and its server
// (which names the stops in its records). Every stop is practice judged on the learner's own device, so all of it,
// answers included, is served: the same as when it was in the code.
//
// The file: { version, source, pack }. pack is the course file's TYPING: { line: { n, zh, en, color }, goal: { wpm, acc },
// stops: [{ id, kind: copy | spell | listen | mock, zh, en, short?, blurb?, minutes?, need?, … }] }. A stop's id is kept
// in learners' progress: the import script checks that ids already in use are still there.

export const TYPING_PACK_RULES = {
	/** the IELTS line is about 10 KB (2026-11-17) */
	maxBytes: 128 * 1024,
	maxVersion: 256,
} as const;

/** content kinds that are a course's typing line; the id after typing- is the catalog id */
export const TYPING_PACK_KINDS = ['typing-ielts'] as const;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v != null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const strings = (v: unknown): boolean => Array.isArray(v) && v.length > 0 && v.every(isStr);

// What is wrong with one item of a stop, by the stop's kind (null = fine).
function itemProblem(kind: string, v: unknown): string | null {
	if (!isObj(v)) return '不是一条题';
	if (kind === 'copy') return isStr(v.target) ? null : '要有 target（要打的字）';
	if (kind === 'spell') return isStr(v.spell) && isStr(v.zh) && isStr(v.sentence) && v.sentence.includes('___') ? null : '要有 spell、zh 和带 ___ 的 sentence';
	return isStr(v.say) && isStr(v.note) && strings(v.answer) ? null : '要有 say、note 和 answer（至少一个答案）';
}

/** What is wrong with a typing file (empty = fine), in plain words for the import script. */
export function typingPackProblems(data: unknown): string[] {
	if (!isObj(data) || !isObj(data.pack)) return ['不是打字课文件（要 { version, source, pack }）'];
	const out: string[] = [];
	if (!isStr(data.version)) out.push('缺 version');
	else if (data.version.length > TYPING_PACK_RULES.maxVersion) out.push(`version 太长（最多 ${TYPING_PACK_RULES.maxVersion} 字）`);
	const bytes = Buffer.byteLength(JSON.stringify(data.pack));
	if (bytes > TYPING_PACK_RULES.maxBytes) out.push(`pack 太大：${Math.round(bytes / 1024)} KB（最多 ${TYPING_PACK_RULES.maxBytes / 1024} KB）`);
	const p = data.pack;

	if (!isObj(p.line) || typeof p.line.n !== 'number' || !isStr(p.line.zh) || !isStr(p.line.en)) out.push('line 要有数字 n 和 zh、en');
	if (!isObj(p.goal) || !isNum(p.goal.wpm) || !isNum(p.goal.acc)) out.push('goal 要有 wpm 和 acc（正数）');
	if (!Array.isArray(p.stops) || p.stops.length === 0) {
		out.push('stops 没有站');
		return out;
	}
	const seen = new Set<string>();
	p.stops.forEach((s: unknown, i) => {
		if (!isObj(s) || !isStr(s.id) || !isStr(s.zh) || !isStr(s.en)) {
			out.push(`第 ${i + 1} 站: 要有 id、zh 和 en`);
			return;
		}
		if (seen.has(s.id)) out.push(`站号 ${s.id} 重复`);
		seen.add(s.id);
		const kind = s.kind;
		if (kind === 'mock') {
			if (!isStr(s.text)) out.push(`${s.id}: 模拟要有 text（要打的那段）`);
			return;
		}
		if (kind !== 'copy' && kind !== 'spell' && kind !== 'listen') {
			out.push(`${s.id}: kind 要是 copy、spell、listen 或 mock`);
			return;
		}
		const items = kind === 'listen' ? s.rows : s.items;
		if (!Array.isArray(items) || items.length === 0) {
			out.push(`${s.id}: 没有题（${kind === 'listen' ? 'rows' : 'items'}）`);
			return;
		}
		items.forEach((v: unknown, j) => {
			const problem = itemProblem(kind, v);
			if (problem != null) out.push(`${s.id} 第 ${j + 1} 题: ${problem}`);
		});
		if (s.need != null && (!isNum(s.need) || s.need > items.length)) out.push(`${s.id}: need 要是正数，不能比题多（${items.length} 题）`);
	});
	return out;
}
