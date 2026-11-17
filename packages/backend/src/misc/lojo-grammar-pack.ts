/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 课程内容进数据库 (2026-11-17): a course's grammar lessons (6 号线 · 语法: the stops, each stop's lesson in short parts
// with marked examples, the common mistakes, and which part each gate tag sends a learner back to) are imported into
// lojo_content as kind grammar-<course id> (apps/community/scripts/content-import.mjs) instead of being copied into the
// open-source code. The 语法课 mini app (miniapps/grammar) reads them from lojo/content/pack. The lessons are study
// material that every learner sees; the gates' questions and answers are imported separately.
//
// The file: { version, source, pack }. pack is the course file's GRAMMAR: { line, color, stops: [{ id, band, title, sub,
// focus }], lessons: { <stop>: { lede, minutes, mistakesAfter, writing, sections: [{ id, h, blocks: [{ p } | { ex, zh }
// | { table, head? }] }], mistakes: [{ bad, good, why }] } }, tags: { <stop>: { "<stop>/<tag>": { zh, see } } } }.
// How the example marks read ({s:…} [c:…]) is checked by the import script, with the mini app's own parser.

export const GRAMMAR_PACK_RULES = {
	/** the IELTS lessons are about 50 KB (2026-11-17) */
	maxBytes: 512 * 1024,
	maxVersion: 256,
} as const;

/** content kinds that are a course's grammar lessons; the id after grammar- is the catalog id */
export const GRAMMAR_PACK_KINDS = ['grammar-ielts'] as const;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v != null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const isBlock = (b: unknown): boolean => isObj(b) && (isStr(b.p) || (isStr(b.ex) && isStr(b.zh)) || (Array.isArray(b.table) && b.table.length > 0 && b.table.every(r => Array.isArray(r) && r.every(c => typeof c === 'string'))));

/** What is wrong with a grammar file (empty = fine), in plain words for the import script. */
export function grammarPackProblems(data: unknown): string[] {
	if (!isObj(data) || !isObj(data.pack)) return ['不是语法课文件（要 { version, source, pack }）'];
	const out: string[] = [];
	if (!isStr(data.version)) out.push('缺 version');
	else if (data.version.length > GRAMMAR_PACK_RULES.maxVersion) out.push(`version 太长（最多 ${GRAMMAR_PACK_RULES.maxVersion} 字）`);
	const bytes = Buffer.byteLength(JSON.stringify(data.pack));
	if (bytes > GRAMMAR_PACK_RULES.maxBytes) out.push(`pack 太大：${Math.round(bytes / 1024)} KB（最多 ${GRAMMAR_PACK_RULES.maxBytes / 1024} KB）`);
	const p = data.pack;

	if (!Array.isArray(p.stops) || p.stops.length === 0) {
		out.push('stops 没有站');
		return out;
	}
	const lessons = isObj(p.lessons) ? p.lessons : {};
	if (!isObj(p.lessons)) out.push('lessons 要是「站号 → 讲解」');
	const seen = new Set<string>();
	// stop → its section ids, for the tags below
	const sectionsOf = new Map<string, Set<string>>();
	p.stops.forEach((s: unknown, i) => {
		if (!isObj(s) || !isStr(s.id) || !isStr(s.title) || typeof s.band !== 'number' || !Number.isFinite(s.band)) {
			out.push(`第 ${i + 1} 站: 要有 id、title 和数字 band`);
			return;
		}
		if (seen.has(s.id)) out.push(`站号 ${s.id} 重复`);
		seen.add(s.id);
		const l = lessons[s.id];
		if (!isObj(l) || !Array.isArray(l.sections) || l.sections.length === 0) {
			out.push(`${s.id}: 没有讲解（lessons 里要有它，至少一节）`);
			return;
		}
		const ids = new Set<string>();
		l.sections.forEach((sec: unknown, j) => {
			if (!isObj(sec) || !isStr(sec.id) || !isStr(sec.h) || !Array.isArray(sec.blocks) || sec.blocks.length === 0) {
				out.push(`${s.id} 第 ${j + 1} 节: 要有 id、h（标题）和 blocks`);
				return;
			}
			if (ids.has(sec.id)) out.push(`${s.id} 节号 ${sec.id} 重复`);
			ids.add(sec.id);
			sec.blocks.forEach((b: unknown, k) => {
				if (!isBlock(b)) out.push(`${s.id} ${sec.id} 第 ${k + 1} 段: 要是 { p }、{ ex, zh } 或 { table }`);
			});
		});
		sectionsOf.set(s.id, ids);
		if (l.mistakes != null && (!Array.isArray(l.mistakes) || !l.mistakes.every(m => isObj(m) && isStr(m.bad) && isStr(m.good)))) out.push(`${s.id}: mistakes 每条要有 bad 和 good`);
	});

	if (p.tags != null && !isObj(p.tags)) out.push('tags 要是「站号 → 标签」');
	for (const [stop, mine] of Object.entries(isObj(p.tags) ? p.tags : {})) {
		const ids = sectionsOf.get(stop);
		if (ids == null || !isObj(mine)) {
			out.push(`tags ${stop}: 没有这一站，或不是「标签 → { zh, see }」`);
			continue;
		}
		for (const [key, t] of Object.entries(mine)) {
			if (!isObj(t) || !isStr(t.zh) || !isStr(t.see)) out.push(`${key}: 要有 zh 和 see`);
			else if (!ids.has(t.see)) out.push(`${key}: see ${t.see} 不是 ${stop} 讲解里的一节`);
		}
	}
	return out;
}
