/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';

// 课程内容进数据库 (2026-11-17): a course's route pack (the lines and stops, their words, the map layout and the tour
// captions; what lojo/route/courses/<id>/ used to hold in the frontend) is imported into lojo_content as kind
// course-<id> (apps/community/scripts/content-import.mjs) instead of being compiled into the open-source frontend. The
// gate pages read it from lojo/content/pack and keep a copy on the device. Nothing here is secret (question sets and
// answers are in gates/, imported separately), but it changes faster than the code and is the course's own content.
//
// The file: { version, source, pack }. pack is what the page reads, the same names the old module exported:
// META, LINES, WARMUP, INTERCHANGES, TAGS, PRACTICE (content), CANVAS, POS, PATHS, TAGPOS, BBOX (layout), TEXT, TOUR.
// Captions that take a value are strings with {0}, {1}… (the database holds JSON, so no functions).

export const COURSE_PACK_RULES = {
	/** the IELTS pack is about 31 KB (2026-11-17) */
	maxBytes: 256 * 1024,
	maxVersion: 256,
} as const;

/** content kinds that are course route packs; the id after course- is the catalog id */
export const COURSE_PACK_KINDS = ['course-ielts'] as const;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v != null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const bilingual = (v: unknown): boolean => isObj(v) && isStr(v.zh) && isStr(v.en);

/** What is wrong with a course pack file (empty = fine), in plain words for the import script. */
export function coursePackProblems(data: unknown): string[] {
	if (!isObj(data) || !isObj(data.pack)) return ['不是课程包文件（要 { version, source, pack }）'];
	const out: string[] = [];
	if (!isStr(data.version)) out.push('缺 version');
	else if (data.version.length > COURSE_PACK_RULES.maxVersion) out.push(`version 太长（最多 ${COURSE_PACK_RULES.maxVersion} 字）`);
	const bytes = Buffer.byteLength(JSON.stringify(data.pack));
	if (bytes > COURSE_PACK_RULES.maxBytes) out.push(`pack 太大：${Math.round(bytes / 1024)} KB（最多 ${COURSE_PACK_RULES.maxBytes / 1024} KB）`);
	const p = data.pack;

	if (!isObj(p.META) || !isStr(p.META.id) || !isStr(p.META.kind) || !isStr(p.META.storeKey)) out.push('META 要有 id、kind、storeKey');
	if (!Array.isArray(p.LINES) || p.LINES.length === 0) {
		out.push('LINES 没有线');
	} else {
		const seen = new Set<string>();
		p.LINES.forEach((l: unknown, i) => {
			const at = `LINES 第 ${i + 1} 条`;
			if (!isObj(l) || typeof l.n !== 'number' || !isStr(l.id) || !isStr(l.zh) || !isStr(l.en) || typeof l.live !== 'boolean' || !Array.isArray(l.stations)) {
				out.push(`${at}: 要有 n、id、zh、en、live、stations`);
				return;
			}
			l.stations.forEach((s: unknown, j) => {
				if (!isObj(s) || !isStr(s.id) || typeof s.band !== 'number') {
					out.push(`${at} 第 ${j + 1} 站: 要有 id 和 band`);
					return;
				}
				if (seen.has(s.id)) out.push(`站号 ${s.id} 重复`);
				seen.add(s.id);
			});
		});
	}
	if (!Array.isArray(p.INTERCHANGES)) out.push('INTERCHANGES 要是列表');
	for (const name of ['TAGS', 'PRACTICE', 'CANVAS', 'POS', 'PATHS']) if (!isObj(p[name])) out.push(`缺 ${name}`);
	if (!isObj(p.TEXT) || !['zh', 'en'].every(lang => isObj((p.TEXT as Obj)[lang]) && isStr(((p.TEXT as Obj)[lang] as Obj).title))) out.push('TEXT 要有 zh、en 两种的 title');
	if (isObj(p.TAGS)) for (const [k, v] of Object.entries(p.TAGS)) if (!bilingual(v)) out.push(`TAGS.${k} 要有 zh 和 en`);
	if (p.TOUR != null) {
		if (!isObj(p.TOUR)) {
			out.push('TOUR 要是对象');
		} else {
			for (const lang of ['zh', 'en']) {
				const t = p.TOUR[lang];
				if (!isObj(t)) { out.push(`TOUR.${lang} 缺`); continue; }
				for (const [k, v] of Object.entries(t)) if (typeof v !== 'string') out.push(`TOUR.${lang}.${k} 要是文字（带值的地方写 {0}）`);
			}
		}
	}
	return out;
}

/** The short name of one version's public data: the same data always gets the same hash. */
export function packHash(pack: unknown): string {
	return createHash('sha256').update(JSON.stringify(pack)).digest('hex').slice(0, 16);
}
