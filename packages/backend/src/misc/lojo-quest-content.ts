/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关的题目和地图（2026-11-12 起）：不在代码里，在数据库 lojo_quest_content 里。源文件在 Vibes 工作区
// courses/english/ielts/quest/ch<N>.json，用 apps/community/scripts/quest-import.mjs 导入；每次导入记一个版本，可以退回上一版。
// 代码公开（AGPL），题目带答案，所以不进代码。
//
// 这里放当前在用的那一版，LojoQuestService 每几秒看一眼数据库里在用的是哪一版，换了就重新读（导入不用重启）。
// 还没导入过（新库）时，闯关的接口回 QUEST_NO_CONTENT，别的功能照常。

import { ApiError } from '@/server/api/error.js';
import type { QuestChapter, QuestNode, QuestQuestion } from '@/misc/lojo-quest-types.js';

export const questNoContent = { message: 'The quest levels have not been imported on this site yet.', code: 'QUEST_NO_CONTENT', id: '5b0b7d1e-6c2e-4b8f-9f3a-2d7e4c1a9e10' } as const;

type Content = { id: number; version: string; chapters: QuestChapter[]; nodes: Map<string, QuestNode> };
let content: Content | null = null;

export function setQuestContent(id: number, version: string, chapters: QuestChapter[]): void {
	const sorted = [...chapters].sort((a, b) => a.no - b.no);
	content = { id, version, chapters: sorted, nodes: new Map(sorted.flatMap(c => c.nodes.map(n => [n.id, n] as const))) };
}

export function clearQuestContent(): void {
	content = null;
}

// which version is in use (null before the first import)
export const questContentId = (): number | null => content?.id ?? null;
export const questContentVersion = (): string | null => content?.version ?? null;

function loaded(): Content {
	if (content == null) throw new ApiError(questNoContent);
	return content;
}

// every chapter, by number
export const questChapters = (): QuestChapter[] => loaded().chapters;
// 第一章：old saves, the trial level and the shared map
export const questFirstChapter = (): QuestChapter => loaded().chapters[0];
export const questChapterOf = (no: number): QuestChapter => questChapters().find(c => c.no === no) ?? questFirstChapter();
export const questNodeOf = (id: string): QuestNode | undefined => loaded().nodes.get(id);
export const questQuestionOf = (node: QuestNode | undefined, qid: string): QuestQuestion | undefined => node?.pool?.find(q => q.id === qid);

/* ---------- the import check: a batch with any problem is refused whole ---------- */

const TYPES = ['gap', 'choice', 'TFNG', 'YNNG', 'build', 'multi'];
const KINDS = ['start', 'level', 'gear', 'news', 'shelf', 'boss'];
const isObj = (x: unknown): x is Record<string, unknown> => x != null && typeof x === 'object' && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === 'string' && x.length > 0;
const isInt = (x: unknown): x is number => Number.isInteger(x);

function questionProblems(q: unknown, where: string): string[] {
	if (!isObj(q)) return [`${where}: 题目不是对象`];
	const p: string[] = [];
	const at = `${where} ${String(q.id)}`;
	if (!isStr(q.id)) p.push(`${where}: 题目缺 id`);
	if (!TYPES.includes(q.type as string)) p.push(`${at}: 不认识的题型 ${String(q.type)}`);
	if (!isStr(q.question) && q.type !== 'build') p.push(`${at}: 缺题干`);
	if (!isStr(q.answer)) p.push(`${at}: 缺答案`);
	if (!Array.isArray(q.accept)) p.push(`${at}: accept 不是列表`);
	if (!isStr(q.evidence)) p.push(`${at}: 缺 evidence`);
	const options = q.options as { key: string }[] | null;
	if (options != null && (!Array.isArray(options) || options.some(o => !isObj(o) || !isStr(o.key)))) p.push(`${at}: 选项格式不对`);
	else if (options != null && isStr(q.answer)) {
		const answers = q.type === 'multi' ? q.answer.split(',') : [q.answer];
		if (q.type !== 'gap' && q.type !== 'build') for (const a of answers) if (!options.some(o => o.key === a)) p.push(`${at}: 答案 ${a} 不在选项里`);
	}
	if (q.type === 'build' && !Array.isArray(q.chips)) p.push(`${at}: build 没有 chips`);
	if (q.audio != null && (!isObj(q.audio) || !Array.isArray(q.audio.lines))) p.push(`${at}: 录音格式不对`);
	return p;
}

function chapterProblems(c: unknown, i: number): string[] {
	if (!isObj(c)) return [`第 ${i + 1} 份: 不是一章`];
	const p: string[] = [];
	const at = `第${String(c.no)}章`;
	if (!isInt(c.no) || c.no < 1) p.push(`第 ${i + 1} 份: 章号 no 不对`);
	for (const k of ['id', 'version', 'title', 'bossId', 'startId']) if (!isStr(c[k])) p.push(`${at}: 缺 ${k}`);
	if (!isObj(c.boss) || !isObj(c.rules) || !isObj(c.branches)) p.push(`${at}: 缺 boss / rules / branches`);
	else for (const k of ['level', 'retest', 'boss', 'chest']) if (!isObj(c.rules[k])) p.push(`${at}: rules 缺 ${k}`);
	if (!Array.isArray(c.causeOrder)) p.push(`${at}: 缺 causeOrder`);
	if (!Array.isArray(c.nodes) || c.nodes.length === 0) return [...p, `${at}: 没有关卡`];
	const ids = new Set<string>();
	for (const n of c.nodes as unknown[]) {
		if (!isObj(n) || !isStr(n.id)) { p.push(`${at}: 有个点缺 id`); continue; }
		if (ids.has(n.id)) p.push(`${at}: 点 ${n.id} 重复`);
		ids.add(n.id);
		if (n.ch !== c.no) p.push(`${at} ${n.id}: ch 应该是 ${String(c.no)}`);
		if (!KINDS.includes(n.kind as string)) p.push(`${at} ${n.id}: 不认识的类型 ${String(n.kind)}`);
		if (!isInt(n.heartCost)) p.push(`${at} ${n.id}: 缺 heartCost`);
		if (!Array.isArray(n.shelf) || !Array.isArray(n.sets)) p.push(`${at} ${n.id}: 缺 shelf / sets`);
		if (n.kind === 'level' || n.kind === 'boss') {
			if (!Array.isArray(n.pool) || n.pool.length === 0) { p.push(`${at} ${n.id}: 没有题`); continue; }
			const qids = new Set<string>();
			for (const q of n.pool as unknown[]) {
				p.push(...questionProblems(q, `${at} ${n.id}`));
				if (isObj(q) && isStr(q.id)) {
					if (qids.has(q.id)) p.push(`${at} ${n.id}: 题号 ${q.id} 重复`);
					qids.add(q.id);
				}
			}
		}
	}
	if (isStr(c.bossId) && !ids.has(c.bossId)) p.push(`${at}: Boss ${c.bossId} 不在点里`);
	if (isStr(c.startId) && !ids.has(c.startId)) p.push(`${at}: 起点 ${c.startId} 不在点里`);
	if (!Array.isArray(c.edges)) p.push(`${at}: 缺 edges`);
	else for (const e of c.edges as unknown[]) if (!Array.isArray(e) || !ids.has(e[0]) || !ids.has(e[1])) p.push(`${at}: 线路 ${JSON.stringify(e)} 有不存在的点`);
	return p;
}

// Problems with a batch of chapters, in plain words (empty = fine). keepIds: level / Boss ids that learners' saves or
// the version in use already have; a batch that drops any of them is refused, so nobody's progress points at nothing.
export function questContentProblems(chapters: unknown, keepIds: Iterable<string> = []): string[] {
	if (!Array.isArray(chapters) || chapters.length === 0) return ['没有章节'];
	const p = chapters.flatMap((c, i) => chapterProblems(c, i));
	if (p.length > 0) return p;
	const list = chapters as QuestChapter[];
	const nos = list.map(c => c.no);
	if (new Set(nos).size !== nos.length) p.push(`章号重复：${nos.join(', ')}`);
	if (!nos.includes(1)) p.push('没有第一章');
	const all = new Map<string, number>();
	for (const c of list) for (const n of c.nodes) {
		if (all.has(n.id)) p.push(`点 ${n.id} 在第 ${all.get(n.id)} 章和第 ${c.no} 章都有`);
		all.set(n.id, c.no);
	}
	const missing = [...new Set(keepIds)].filter(id => !all.has(id));
	if (missing.length > 0) p.push(`这些关已经有人的进度或在用的版本里有，新版里没有：${missing.join(', ')}（关卡 id 不能改，也不能删）`);
	return p;
}
