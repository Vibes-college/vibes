/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 锦囊书屋的书和每本 3 题小验证（2026-11-17 起）：不在代码里，在数据库 lojo_content（kind = quest-books）里。
// 源文件在 Vibes 工作区 courses/english/ielts/quest/books.json（apps/community/scripts/quest-books.mjs 从「攻略」的锦囊
// index.json 生成），用 apps/community/scripts/content-import.mjs 导入；每次导入记一个版本，可以退回上一版，不用重启。
// 代码公开（AGPL），小验证带答案，书单改得快，所以只有格式和规则留在这里。答案只在服务器上，不发给页面。
//
// 还没导入过（新库）时书屋是空的：地图、关卡照常，结算和「问 Momo」里不推荐锦囊。

export type QuestBook = {
	no: number; ref: string; id: string; slug: string; spine: string; title: string; summary: string; kind: string; evidence: string; color: string;
	/** 「读全文」打开哪篇攻略（攻略 slug）；没写或 null 就用书自己的 slug。2026-11-17 旧攻略下架后指到四篇新攻略（雅思听力、阅读、口语、写作） */
	guide?: string | null;
	app: { id: string; zh: string; path: string | null };
	verify: string; verifyUrl: string | null;
	/** 去哪几关验证（关卡 id，"*" = 任何一关） */
	verifyLevels: string[];
	/** 「练一组」去哪（同关卡 gear 写法）；null = 没有装备 */
	gear: string | null; fallbackGear: string | null;
	/** false = 这本的装备只能练、不补心 */
	givesHeart: boolean;
	/** 关卡错题标了这些错因，书屋就亮这本 */
	causeKeys: string[];
	tags: string[]; when: string;
	/** a = 对的那个选项（从 0 数） */
	quiz: { id: string; q: string; o: string[]; a: number; why: string }[];
};

/** books.json：一次导入的全部 */
export type QuestBooksFile = { version: string; source: string; books: QuestBook[] };

// 玩法规则：每本几题、对几题算过、补几颗心（补心的数在 lojo-quest-numbers.ts 里，这里是导入时查格式用的）
export const QUEST_BOOK_RULES = { passAt: 2, count: 3, refillHearts: 1 } as const;

export const QUEST_BOOKS_KIND = 'quest-books';

let books: readonly QuestBook[] = [];
let booksVersion: string | null = null;

/** 导入、退回或者别的进程换了版本时，LojoQuestService 把在用的那一版放进来 */
export function setQuestBooks(file: QuestBooksFile, version: string | null = file.version): void {
	books = [...file.books].sort((a, b) => a.no - b.no);
	booksVersion = version;
}

export function clearQuestBooks(): void {
	books = [];
	booksVersion = null;
}

/** 书屋里现在的书，按编号（还没导入时是空的） */
export const questBooks = (): readonly QuestBook[] => books;
export const questBooksVersion = (): string | null => booksVersion;

/** 按错因找该亮的锦囊（第一本 causeKeys 里有这个错因的）。 */
export function bookForCause(cause: string): QuestBook | undefined {
	return books.find(b => b.causeKeys.includes(cause));
}

/* ---------- 导入前查格式：有一处不对，整批不导入 ---------- */

const isObj = (x: unknown): x is Record<string, unknown> => x != null && typeof x === 'object' && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === 'string' && x.length > 0;
const isText = (x: unknown): x is string => typeof x === 'string';
const isStrList = (x: unknown): x is string[] => Array.isArray(x) && x.every(isStr);
const strOrNull = (x: unknown) => x === null || isStr(x);

function bookProblems(b: unknown, i: number): string[] {
	if (!isObj(b)) return [`第 ${i + 1} 本: 不是一本书`];
	const at = isStr(b.ref) ? `${b.ref}` : `第 ${i + 1} 本`;
	const p: string[] = [];
	if (!Number.isInteger(b.no) || (b.no as number) < 1) p.push(`${at}: 编号 no 不对`);
	if (!isStr(b.ref) || !/^j\d+$/.test(b.ref)) p.push(`${at}: ref 要写成 j<数字>`);
	if (!isStr(b.slug) || !/^[a-z0-9-]+$/.test(b.slug)) p.push(`${at}: slug 只能有小写字母、数字和 -`);
	if (b.guide !== undefined && b.guide !== null && !(isStr(b.guide) && /^[a-z0-9-]+$/.test(b.guide))) p.push(`${at}: guide 要是攻略的 slug（小写字母、数字和 -）或 null`);
	for (const k of ['id', 'spine', 'title', 'summary', 'kind', 'color']) if (!isStr(b[k])) p.push(`${at}: 缺 ${k}`);
	for (const k of ['evidence', 'verify', 'when']) if (!isText(b[k])) p.push(`${at}: ${k} 要是文字（可以是空的）`);
	if (!isObj(b.app) || !isStr(b.app.id) || !isStr(b.app.zh) || !strOrNull(b.app.path)) p.push(`${at}: app 要有 id、zh、path`);
	if (!strOrNull(b.verifyUrl)) p.push(`${at}: verifyUrl 要是文字或 null`);
	for (const k of ['verifyLevels', 'causeKeys', 'tags']) if (!isStrList(b[k])) p.push(`${at}: ${k} 要是文字列表`);
	if (!strOrNull(b.gear) || !strOrNull(b.fallbackGear)) p.push(`${at}: gear、fallbackGear 要是文字或 null`);
	if (typeof b.givesHeart !== 'boolean') p.push(`${at}: givesHeart 要是 true 或 false`);
	if (!Array.isArray(b.quiz) || b.quiz.length !== QUEST_BOOK_RULES.count) {
		p.push(`${at}: 小验证要 ${QUEST_BOOK_RULES.count} 题`);
		return p;
	}
	for (const [j, q] of (b.quiz as unknown[]).entries()) {
		const qa = `${at} 第 ${j + 1} 题`;
		if (!isObj(q)) { p.push(`${qa}: 不是一道题`); continue; }
		if (!isStr(q.id) || !isStr(q.q) || !isStr(q.why)) p.push(`${qa}: 要有 id、题目 q、讲解 why`);
		if (!Array.isArray(q.o) || q.o.length < 2 || !q.o.every(isStr)) p.push(`${qa}: 至少 2 个选项`);
		else if (!Number.isInteger(q.a) || (q.a as number) < 0 || (q.a as number) >= q.o.length) p.push(`${qa}: 答案 a 不在选项里`);
	}
	return p;
}

/** books.json 有什么问题（空 = 可以导入），大白话 */
export function questBooksProblems(file: unknown): string[] {
	if (!isObj(file)) return ['不是 books.json 的格式（要有 version、source、books）'];
	const p: string[] = [];
	if (!isStr(file.version)) p.push('缺 version');
	if (!isText(file.source)) p.push('source 要是文字');
	if (!Array.isArray(file.books) || file.books.length === 0) return [...p, '没有书'];
	p.push(...file.books.flatMap((b, i) => bookProblems(b, i)));
	if (p.length > 0) return p;
	const list = file.books as QuestBook[];
	for (const k of ['no', 'ref', 'id', 'slug'] as const) {
		const seen = new Set<unknown>();
		for (const b of list) {
			if (seen.has(b[k])) p.push(`${k} ${String(b[k])} 重复`);
			seen.add(b[k]);
		}
	}
	const qids = new Set<string>();
	for (const b of list) for (const q of b.quiz) {
		if (qids.has(q.id)) p.push(`题号 ${q.id} 重复`);
		qids.add(q.id);
	}
	return p;
}
