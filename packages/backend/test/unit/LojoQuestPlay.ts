/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关的假数据测试（2026-11-16）：导入检查、过关判定、扣心、地图解锁。题目、章节、存档都是编的（示例），不连数据库，
// 公开仓库里也能跑。最后一段用工作区里的真题目（courses/english/ielts/quest），没有就跳过。
//
// 已知的真 bug 先写成 test.fails（preflight 不收 todo / 跳过的测试）：它「过」是因为 bug 还在，修好那天会变红，再把
// .fails 去掉。11-16 查出的 A、B、C 三处当天修好，都已经是普通测试。

import { existsSync, readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { questAfterAnswer, questMinHearts, questModeOf, questPerfect, questRulesOf, questTimeoutLoss } from '@/misc/lojo-quest-play.js';
import type { QuestGrade, QuestMode, QuestTryRules } from '@/misc/lojo-quest-play.js';
import { clearQuestContent, questContentProblems, setQuestContent } from '@/misc/lojo-quest-content.js';
import { oldChapterOpen } from '@/misc/lojo-quest-route.js';
import { MAX_HEARTS } from '@/misc/lojo-quest.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';
import type { MiLojoQuest, MiLojoQuestPlacement } from '@/models/LojoQuest.js';
import type { QuestChapter, QuestNode, QuestNodeKind, QuestQuestion, QuestRules, QuestTimed } from '@/misc/lojo-quest-types.js';

/* ---------- 假数据（示例） ---------- */

const q = (over: Partial<QuestQuestion> = {}): QuestQuestion => ({
	id: 'q1', set: 'A', type: 'gap', skill: null, passage: null, question: '示例题干 ______', options: null, chips: null, answer: 'cat', accept: [], limit: null,
	ignoreSpaces: false, caseInsensitive: true, cause: 'not-heard', causes: null, pick: null, bothWrongCause: null, playOnce: false, lecture: null,
	evidence: '示例原文', why: '', audio: null, tags: [], ...over,
});

const playable = (kind: QuestNodeKind) => kind === 'level' || kind === 'boss';
const node = (id: string, ch: number, kind: QuestNodeKind, over: Partial<QuestNode> = {}): QuestNode => ({
	id, ch, kind, x: 0, y: 0, label: id, name: null, zh: null, branch: 'main', practice: false, skill: null, type: null, stations: [], hashtags: [],
	gear: null, heartGear: null, gearGivesHeart: false, gearButton: null, heartButton: null, shelf: [], causeGuide: null,
	heartCost: playable(kind) ? 1 : 0, ask: null, need: null, maxWrong: null, sets: ['A'], retest: true, keepOrder: false, timed: null,
	pool: playable(kind) ? [1, 2, 3, 4, 5, 6].map(i => q({ id: `${id}-q${i}` })) : null,
	...over,
});

// 跟真题目的数字一样（numbers.json：5 题对 4 过、错 2 输；Boss 6 题 5 血；回测 3 题对 2 过、不扣心）
const RULES: QuestRules = {
	level: { ask: 5, need: 4, maxWrong: 2, minHeartsToStart: 2, minHeartsToStartPractice: 0, lowHeartsButton: '示例' },
	retest: { questions: 3, passAt: 2, heartCost: 0 },
	boss: { hp: 5, maxWrong: 2, total: 6, prepRequired: 2, prepOf: 3, extraPrepAfterLossesInARow: 2, resetPrepAfterLossesInARow: null, prep: [] },
	chest: { sideAt: null, sideXp: 10, clearXp: 30, badge: '示例徽章' },
	multi: null,
	timedCopy: null,
};

// 一章：起点 → 1 → 2 → 3 → Boss，1 旁边挂一个装备站。第一章的 id 照真存档（start、boss），第一关是练手关（像 词1）。
const ids = (no: number) => ({
	start: no === 1 ? 'start' : `${no}-start`, boss: no === 1 ? 'boss' : `${no}-boss`, l1: `${no}-1`, l2: `${no}-2`, l3: `${no}-3`, gear: `${no}-gear`,
});
const chapter = (no: number, over: Partial<QuestChapter> = {}): QuestChapter => {
	const i = ids(no);
	return {
		id: `ch${no}`, no, version: '示例', title: `第${no}页`, band: '', disclaimer: '', bossId: i.boss, startId: i.start,
		boss: { hp: 5, maxWrong: 2, total: 6 }, branches: { main: { zh: '主线', note: '' } },
		nodes: [
			node(i.start, no, 'start'),
			node(i.l1, no, 'level', no === 1 ? { practice: true, heartCost: 0 } : {}),
			node(i.l2, no, 'level'),
			node(i.l3, no, 'level'),
			node(i.gear, no, 'gear'),
			node(i.boss, no, 'boss'),
		],
		edges: [[i.start, i.l1, 'main'], [i.l1, i.l2, 'main'], [i.l2, i.l3, 'main'], [i.l1, i.gear, 'station'], [i.l3, i.boss, 'main']],
		causeOrder: ['not-heard'],
		rules: RULES,
		...over,
	};
};
const fourChapters = () => [1, 2, 3, 4].map(no => chapter(no));
// a deep copy to break on purpose
const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const anyNode = (c: unknown, id: string) => (c as { nodes: Record<string, unknown>[] }).nodes.find(n => n.id === id)!;
const firstQ = (c: unknown, id: string) => (anyNode(c, id).pool as Record<string, unknown>[])[0];

/* ---------- 1. 导入检查（questContentProblems：导入接口和 quest-import.mjs 都用它，有一处不对整批不收） ---------- */

describe('闯关导入：假章节', () => {
	test('四章都对：没有问题，原有的关一个不少也没问题', () => {
		const all = fourChapters();
		expect(questContentProblems(all)).toEqual([]);
		expect(questContentProblems(all, all.flatMap(c => c.nodes.map(n => n.id)))).toEqual([]);
	});

	test('不是一批章节：不是列表、空列表、null 都不收', () => {
		for (const bad of [null, undefined, {}, 'ch1', [], { no: 1 }]) expect(questContentProblems(bad)).toEqual(['没有章节']);
		expect(questContentProblems([42])).toEqual(['第 1 份: 不是一章']);
	});

	test('一章缺字段：章号、id、标题、Boss、起点、规则、错因顺序', () => {
		const c = copy(chapter(1)) as unknown as Record<string, unknown>;
		delete c.title;
		delete c.bossId;
		delete c.causeOrder;
		c.no = 0;
		const p = questContentProblems([c]);
		expect(p).toContain('第 1 份: 章号 no 不对');
		expect(p).toContain('第0章: 缺 title');
		expect(p).toContain('第0章: 缺 bossId');
		expect(p).toContain('第0章: 缺 causeOrder');

		const r = copy(chapter(1)) as unknown as { rules: Record<string, unknown> };
		delete r.rules.boss;
		expect(questContentProblems([r])).toEqual(['第1章: rules 缺 boss']);

		const b = copy(chapter(1)) as unknown as Record<string, unknown>;
		delete b.branches;
		expect(questContentProblems([b])).toEqual(['第1章: 缺 boss / rules / branches']);
	});

	test('一章没有关卡', () => {
		expect(questContentProblems([{ ...chapter(1), nodes: [] }])).toEqual(['第1章: 没有关卡']);
		expect(questContentProblems([{ ...chapter(1), nodes: null }])).toEqual(['第1章: 没有关卡']);
	});

	test('关卡格式不对：缺 id、id 重复、章号对不上、不认识的类型、缺 heartCost、缺 shelf / sets、没有题', () => {
		const c = copy(chapter(1));
		delete anyNode(c, '1-2').heartCost;
		anyNode(c, '1-3').heartCost = 0.5;
		anyNode(c, '1-gear').kind = 'shop';
		anyNode(c, '1-1').ch = 2;
		delete anyNode(c, 'boss').sets;
		(c as unknown as { nodes: unknown[] }).nodes.push({ kind: 'level' }, { ...anyNode(c, '1-3') });
		const p = questContentProblems([c]);
		expect(p).toContain('第1章 1-2: 缺 heartCost');
		expect(p).toContain('第1章 1-3: 缺 heartCost');
		expect(p).toContain('第1章 1-gear: 不认识的类型 shop');
		expect(p).toContain('第1章 1-1: ch 应该是 1');
		expect(p).toContain('第1章 boss: 缺 shelf / sets');
		expect(p).toContain('第1章: 有个点缺 id');
		expect(p).toContain('第1章: 点 1-3 重复');

		const empty = copy(chapter(1));
		anyNode(empty, '1-2').pool = [];
		anyNode(empty, 'boss').pool = null;
		expect(questContentProblems([empty])).toEqual(['第1章 1-2: 没有题', '第1章 boss: 没有题']);
	});

	test('题目缺字段：id、题型、题干、答案、accept、evidence', () => {
		const c = copy(chapter(1));
		const x = firstQ(c, '1-2');
		delete x.answer;
		delete x.evidence;
		x.accept = 'cat';
		x.question = '';
		const y = (anyNode(c, '1-3').pool as Record<string, unknown>[])[1];
		delete y.id;
		y.type = 'essay';
		const p = questContentProblems([c]);
		expect(p).toEqual(expect.arrayContaining([
			'第1章 1-2 1-2-q1: 缺题干', '第1章 1-2 1-2-q1: 缺答案', '第1章 1-2 1-2-q1: accept 不是列表', '第1章 1-2 1-2-q1: 缺 evidence',
			'第1章 1-3: 题目缺 id', '第1章 1-3 undefined: 不认识的题型 essay',
		]));
		const notObj = copy(chapter(1));
		(anyNode(notObj, '1-2').pool as unknown[])[0] = 'Q1';
		expect(questContentProblems([notObj])).toEqual(['第1章 1-2: 题目不是对象']);
	});

	test('选择题：答案要在选项里；五选二每个答案都要在；选项格式要对', () => {
		const opts = [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }, { key: 'C', text: 'c' }];
		const c = copy(chapter(1));
		const pool = anyNode(c, '1-2').pool as Record<string, unknown>[];
		Object.assign(pool[0], { type: 'choice', options: opts, answer: 'D' });
		Object.assign(pool[1], { type: 'multi', options: opts, answer: 'B,Z', pick: 2 });
		Object.assign(pool[2], { type: 'choice', options: [{ text: 'no key' }], answer: 'A' });
		Object.assign(pool[3], { type: 'choice', options: opts, answer: 'B' });
		Object.assign(pool[4], { type: 'multi', options: opts, answer: 'A,C', pick: 2 });
		expect(questContentProblems([c])).toEqual([
			'第1章 1-2 1-2-q1: 答案 D 不在选项里',
			'第1章 1-2 1-2-q2: 答案 Z 不在选项里',
			'第1章 1-2 1-2-q3: 选项格式不对',
		]);
	});

	test('连词成句要有词块，可以没有题干；录音格式要对；同一关题号不能重复', () => {
		const c = copy(chapter(1));
		const pool = anyNode(c, '1-2').pool as Record<string, unknown>[];
		Object.assign(pool[0], { type: 'build', question: '', chips: null, answer: 'a b' });
		Object.assign(pool[1], { type: 'build', question: '', chips: ['b', 'a'], answer: 'a b' });
		Object.assign(pool[2], { audio: { voices: {}, rate: 1 } });
		Object.assign(pool[3], { id: '1-2-q5' });
		expect(questContentProblems([c])).toEqual([
			'第1章 1-2 1-2-q1: build 没有 chips',
			'第1章 1-2 1-2-q3: 录音格式不对',
			'第1章 1-2: 题号 1-2-q5 重复',
		]);
	});

	test('Boss、起点、连线要指着存在的点', () => {
		const c = copy(chapter(1));
		c.bossId = 'nope';
		c.startId = 'gone';
		c.edges.push(['1-3', 'ghost', 'main']);
		expect(questContentProblems([c])).toEqual(['第1章: Boss nope 不在点里', '第1章: 起点 gone 不在点里', '第1章: 线路 ["1-3","ghost","main"] 有不存在的点']);
		expect(questContentProblems([{ ...chapter(1), edges: null }])).toEqual(['第1章: 缺 edges']);
	});

	test('整批：章号重复、没有第一章、同一个关出现在两章、删掉了有人存档的关', () => {
		expect(questContentProblems([chapter(1), chapter(2), chapter(2)])).toEqual(['章号重复：1, 2, 2', '点 2-start 在第 2 章和第 2 章都有', '点 2-1 在第 2 章和第 2 章都有', '点 2-2 在第 2 章和第 2 章都有', '点 2-3 在第 2 章和第 2 章都有', '点 2-gear 在第 2 章和第 2 章都有', '点 2-boss 在第 2 章和第 2 章都有']);
		expect(questContentProblems([chapter(2), chapter(3)])).toEqual(['没有第一章']);
		const twice = chapter(2);
		twice.nodes = twice.nodes.map(n => (n.id === '2-3' ? { ...n, id: '1-3' } : n));
		twice.edges = twice.edges.map(([a, b, br]) => [a === '2-3' ? '1-3' : a, b === '2-3' ? '1-3' : b, br]);
		expect(questContentProblems([chapter(1), twice])).toEqual(['点 1-3 在第 1 章和第 2 章都有']);
		expect(questContentProblems(fourChapters(), ['1-1', '5-1', 'old-9'])).toEqual(['这些关已经有人的进度或在用的版本里有，新版里没有：5-1, old-9（关卡 id 不能改，也不能删）']);
	});

	test('有一处不对整批不收；几章的问题一次列全', () => {
		const a = copy(chapter(1));
		firstQ(a, '1-2').answer = '';
		const b = copy(chapter(3));
		anyNode(b, '3-3').heartCost = '1';
		expect(questContentProblems([a, chapter(2), b, chapter(4)])).toEqual(['第1章 1-2 1-2-q1: 缺答案', '第3章 3-3: 缺 heartCost']);
	});

	// 缺口 C（2026-11-16 写测试时发现，同一天修好）：一关的题比「对几题过」还少，这关永远过不了，原来导入检查不拦。
	test('C：一关的题比「对几题过」还少，不收；刚好够就收', () => {
		const c = copy(chapter(1));
		anyNode(c, '1-2').pool = (anyNode(c, '1-2').pool as unknown[]).slice(0, RULES.level.need - 1);
		expect(questContentProblems([c]).join()).toContain(`第1章 1-2: 只有 ${RULES.level.need - 1} 题，比「对 ${RULES.level.need} 题过」还少`);
		anyNode(c, '1-2').pool = (anyNode(chapter(1), '1-2').pool as unknown[]).slice(0, RULES.level.need);
		expect(questContentProblems([c])).toEqual([]);
		anyNode(c, 'boss').pool = (anyNode(c, 'boss').pool as unknown[]).slice(0, RULES.boss.hp - 1);
		expect(questContentProblems([c]).join()).toContain(`第1章 boss: 只有 ${RULES.boss.hp - 1} 题，比「对 ${RULES.boss.hp} 题过」还少`);
	});
});

/* ---------- 2. 过关判定 和 3. 扣心（questAfterAnswer 跟 LojoQuestService.answer 走同一份） ---------- */

const gradeOf = (g: string): QuestGrade => (g === 'R' ? 'right' : g === 'H' ? 'half' : 'wrong');

// Play a try answer by answer, the way the service does, until it ends. grades: R right, W wrong, H 选两个对一半.
function play(mode: QuestMode, rules: QuestTryRules, grades: string, hearts: number = MAX_HEARTS) {
	const answers: { correct: boolean; half?: boolean }[] = [];
	let out = questAfterAnswer({ mode, rules, grade: 'right', hearts, answers: [], total: rules.total });
	let h = hearts;
	for (const g of grades) {
		answers.push({ correct: g === 'R', ...(g === 'H' ? { half: true } : {}) });
		out = questAfterAnswer({ mode, rules, grade: gradeOf(g), hearts: h, answers, total: rules.total });
		h = out.hearts;
		if (out.ended) break;
	}
	return { ended: out.ended, answered: answers.length, right: out.right, wrong: out.wrong, hearts: h, outOfHearts: out.outOfHearts };
}

const LEVEL = questRulesOf(node('x', 1, 'level'), 'level', RULES);
const PRACTICE = questRulesOf(node('x', 1, 'level', { practice: true, heartCost: 0 }), 'practice', RULES);
const BOSS = questRulesOf(node('x', 1, 'boss'), 'boss', RULES);
const RETEST = questRulesOf(node('x', 1, 'level'), 'retest', RULES);

describe('闯关一局：是哪种局、要对几题', () => {
	test('摸底 > 回测 > Boss > 练手关 > 普通关', () => {
		expect(questModeOf(node('x', 1, 'level', { probe: true }), true)).toBe('probe');
		expect(questModeOf(node('x', 1, 'boss'), true)).toBe('retest');
		expect(questModeOf(node('x', 1, 'boss', { practice: true }), false)).toBe('boss');
		expect(questModeOf(node('x', 1, 'level', { practice: true }), false)).toBe('practice');
		expect(questModeOf(node('x', 1, 'level'), false)).toBe('level');
	});

	test('每种局的数字从这一章的规则来；扣几颗心看这一关', () => {
		expect(LEVEL).toEqual({ need: 4, maxWrong: 2, total: 5, heartCost: 1 });
		expect(PRACTICE).toEqual({ need: 4, maxWrong: 2, total: 5, heartCost: 0 });
		expect(BOSS).toEqual({ need: 5, maxWrong: 2, total: 6, heartCost: 1 });
		// 回测：3 题对 2 过，错 2 输（3 - 2 + 1），不扣心，哪怕这关平时扣 2 颗
		expect(RETEST).toEqual({ need: 2, maxWrong: 2, total: 3, heartCost: 0 });
		expect(questRulesOf(node('x', 1, 'level', { heartCost: 2 }), 'retest', RULES).heartCost).toBe(0);
		// 摸底：题全做完才收卷，不会中途输，不扣心
		expect(questRulesOf(node('x', 1, 'level', { probe: true, heartCost: 1 }), 'probe', RULES)).toEqual({ need: 7, maxWrong: 7, total: 6, heartCost: 0 });
	});
});

describe('闯关过关判定（普通关 5 题对 4 过、错 2 输）', () => {
	test('连对 4 题：第 4 题就过关，不用做第 5 题', () => {
		expect(play('level', LEVEL, 'RRRRR')).toMatchObject({ ended: 'passed', answered: 4, right: 4, wrong: 0 });
	});

	test('错 1 题还能过：第 5 题对上就过', () => {
		expect(play('level', LEVEL, 'RWRRR')).toMatchObject({ ended: 'passed', answered: 5, right: 4, wrong: 1 });
		expect(play('level', LEVEL, 'RRRWR')).toMatchObject({ ended: 'passed', answered: 5 });
	});

	test('错 2 题就输，不管前面对了几题', () => {
		expect(play('level', LEVEL, 'WW')).toMatchObject({ ended: 'failed', answered: 2 });
		expect(play('level', LEVEL, 'RWRW')).toMatchObject({ ended: 'failed', answered: 4, right: 2, wrong: 2 });
		expect(play('level', LEVEL, 'RRRWW')).toMatchObject({ ended: 'failed', answered: 5, right: 3 });
	});

	test('还没到线就不收卷', () => {
		expect(play('level', LEVEL, 'RRR')).toMatchObject({ ended: null, answered: 3 });
		expect(play('level', LEVEL, 'RW')).toMatchObject({ ended: null });
	});

	test('选两个对一半：不算对也不算错；题做完还没对够 4 题就是没过', () => {
		expect(play('level', LEVEL, 'RRRHH')).toMatchObject({ ended: 'failed', answered: 5, right: 3, wrong: 0 });
		expect(play('level', LEVEL, 'RHRRR')).toMatchObject({ ended: 'passed', answered: 5, right: 4, wrong: 0 });
		expect(play('level', LEVEL, 'HHHH')).toMatchObject({ ended: null, wrong: 0 });
	});

	test('练手关过关判定跟普通关一样', () => {
		expect(play('practice', PRACTICE, 'RRRR')).toMatchObject({ ended: 'passed', answered: 4 });
		expect(play('practice', PRACTICE, 'WW')).toMatchObject({ ended: 'failed', answered: 2 });
	});

	test('Boss：6 题打中 5 下赢，错 2 题输', () => {
		expect(play('boss', BOSS, 'RRRRR')).toMatchObject({ ended: 'passed', answered: 5 });
		expect(play('boss', BOSS, 'RRWRRR')).toMatchObject({ ended: 'passed', answered: 6 });
		expect(play('boss', BOSS, 'RWRRW')).toMatchObject({ ended: 'failed', answered: 5 });
		// 对一半不打中 Boss：6 题打中 4 下，题做完了没赢
		expect(play('boss', BOSS, 'RRHRRH')).toMatchObject({ ended: 'failed', answered: 6, right: 4, wrong: 0 });
	});

	test('回测：3 题对 2 过，错 2 输', () => {
		expect(play('retest', RETEST, 'RR')).toMatchObject({ ended: 'passed', answered: 2 });
		expect(play('retest', RETEST, 'WRR')).toMatchObject({ ended: 'passed', answered: 3 });
		expect(play('retest', RETEST, 'RWW')).toMatchObject({ ended: 'failed', answered: 3 });
		expect(play('retest', RETEST, 'WW')).toMatchObject({ ended: 'failed', answered: 2 });
	});

	test('摸底：全错也做到最后一题，收卷算「做完」', () => {
		const probe = questRulesOf(node('x', 1, 'level', { probe: true }), 'probe', RULES);
		expect(play('probe', probe, 'WWWWW')).toMatchObject({ ended: null, answered: 5 });
		expect(play('probe', probe, 'WWWWWW')).toMatchObject({ ended: 'passed', answered: 6, hearts: MAX_HEARTS });
	});
});

describe('闯关扣心', () => {
	test('普通关答错扣 1 颗，答对、对一半不扣', () => {
		expect(play('level', LEVEL, 'W').hearts).toBe(MAX_HEARTS - 1);
		expect(play('level', LEVEL, 'RWRRR').hearts).toBe(MAX_HEARTS - 1);
		expect(play('level', LEVEL, 'WW').hearts).toBe(MAX_HEARTS - 2);
		expect(play('level', LEVEL, 'RHRRR').hearts).toBe(MAX_HEARTS);
		const out = questAfterAnswer({ mode: 'level', rules: LEVEL, grade: 'half', hearts: 3, answers: [{ correct: false, half: true }], total: 5 });
		expect(out).toMatchObject({ heartLost: false, hearts: 3 });
	});

	test('一关扣 2 颗的，答错扣 2 颗；最多扣到 0', () => {
		const two = { ...LEVEL, heartCost: 2 };
		expect(play('level', two, 'W').hearts).toBe(MAX_HEARTS - 2);
		expect(play('level', two, 'W', 1).hearts).toBe(0);
	});

	test('词1 这样的练手关：答错不扣心，0 颗心也能开', () => {
		const ci1 = node('1-1', 1, 'level', { practice: true, heartCost: 0, label: '词1' });
		const mode = questModeOf(ci1, false);
		const rules = questRulesOf(ci1, mode, RULES);
		expect(mode).toBe('practice');
		expect(play(mode, rules, 'RWRRR').hearts).toBe(MAX_HEARTS);
		expect(play(mode, rules, 'WW', 1)).toMatchObject({ ended: 'failed', hearts: 1 });
		expect(questAfterAnswer({ mode, rules, grade: 'wrong', hearts: 2, answers: [{ correct: false }], total: 5 }).heartLost).toBe(false);
		expect(questMinHearts(rules, mode, RULES)).toBe(0);
	});

	test('开新关要几颗心：普通关和 Boss 2 颗，回测、摸底不看心', () => {
		expect(questMinHearts(LEVEL, 'level', RULES)).toBe(2);
		expect(questMinHearts(BOSS, 'boss', RULES)).toBe(2);
		expect(questMinHearts(RETEST, 'retest', RULES)).toBe(0);
		expect(questMinHearts({ heartCost: 0 }, 'probe', RULES)).toBe(0);
		// 正式站第一章用旧规矩（1 颗），由服务按站点把规则换掉再传进来，见下面「地图解锁」
		expect(questMinHearts(LEVEL, 'level', { ...RULES, level: { ...RULES.level, minHeartsToStart: 1 } })).toBe(1);
	});

	test('回测答错不扣心', () => {
		expect(play('retest', RETEST, 'WW').hearts).toBe(MAX_HEARTS);
	});

	test('普通关心扣光了这一局照样打完（只是下一局开不了）', () => {
		const out = play('level', LEVEL, 'WRRRR', 1);
		expect(out).toMatchObject({ ended: 'passed', hearts: 0, outOfHearts: false });
		expect(questAfterAnswer({ mode: 'level', rules: LEVEL, grade: 'wrong', hearts: 0, answers: [{ correct: false }], total: 5 })).toMatchObject({ heartLost: false, hearts: 0, ended: null });
	});

	test('Boss 心扣光了就输，哪怕还没错 2 题', () => {
		expect(play('boss', BOSS, 'RRW', 1)).toMatchObject({ ended: 'failed', answered: 3, hearts: 0, outOfHearts: true, wrong: 1 });
		// 只剩 0 颗时答对不算输
		expect(questAfterAnswer({ mode: 'boss', rules: BOSS, grade: 'right', hearts: 0, answers: [{ correct: true }], total: 6 })).toMatchObject({ outOfHearts: false, ended: null });
	});

	const timed = (over: Partial<QuestTimed> = {}) => ({ timeoutHeartCost: 1, heartPerUnanswered: 1, maxHeartsPerTry: 3, ...over });
	test('限时关时间到：普通关一共扣 timeoutHeartCost 颗', () => {
		expect(questTimeoutLoss({ mode: 'level', heartCost: 1, timed: timed(), left: 3, wrongBefore: 1, hearts: 5 })).toBe(1);
		expect(questTimeoutLoss({ mode: 'level', heartCost: 1, timed: timed({ timeoutHeartCost: 2 }), left: 1, wrongBefore: 0, hearts: 1 })).toBe(1);
		// 都答完了、练手关、心已经是 0：不扣
		expect(questTimeoutLoss({ mode: 'level', heartCost: 1, timed: timed(), left: 0, wrongBefore: 1, hearts: 5 })).toBe(0);
		expect(questTimeoutLoss({ mode: 'practice', heartCost: 0, timed: timed(), left: 3, wrongBefore: 0, hearts: 5 })).toBe(0);
		expect(questTimeoutLoss({ mode: 'level', heartCost: 1, timed: timed(), left: 3, wrongBefore: 0, hearts: 0 })).toBe(0);
	});

	test('限时关时间到：Boss 没答的每题扣 1 颗，连同这局答错扣的最多 3 颗', () => {
		expect(questTimeoutLoss({ mode: 'boss', heartCost: 1, timed: timed(), left: 2, wrongBefore: 0, hearts: 5 })).toBe(2);
		expect(questTimeoutLoss({ mode: 'boss', heartCost: 1, timed: timed(), left: 4, wrongBefore: 0, hearts: 5 })).toBe(3);
		expect(questTimeoutLoss({ mode: 'boss', heartCost: 1, timed: timed(), left: 4, wrongBefore: 1, hearts: 5 })).toBe(2);
		expect(questTimeoutLoss({ mode: 'boss', heartCost: 1, timed: timed(), left: 4, wrongBefore: 3, hearts: 5 })).toBe(0);
		expect(questTimeoutLoss({ mode: 'boss', heartCost: 1, timed: timed({ maxHeartsPerTry: null }), left: 4, wrongBefore: 1, hearts: 5 })).toBe(4);
		expect(questTimeoutLoss({ mode: 'boss', heartCost: 1, timed: timed(), left: 4, wrongBefore: 0, hearts: 1 })).toBe(1);
	});
});

describe('闯关全对', () => {
	const all = (n: number) => Array.from({ length: n }, () => ({ correct: true }));
	test('过了，而且一局一题没错，就是全对', () => {
		expect(questPerfect(all(4), true)).toBe(true);
		expect(questPerfect([...all(3), { correct: false }, { correct: true }], true)).toBe(false);
		expect(questPerfect(all(4), false)).toBe(false);
		expect(questPerfect([], true)).toBe(false);
	});

	test('对一半（½）不算对，不是全对', () => {
		expect(questPerfect([...all(3), { correct: false, half: true }, { correct: true }], true)).toBe(false);
	});

	// bug A（2026-11-16 写测试时发现，同一天修好）：原来旧地图（正式站现在用的原地图三章 v2）要「对的题数 = 整套题数」，
	// 可对够 4 题这局就结束了，第 5 题根本不会出，所以一题不错过关也拿不到 ★★ 和全对加的 5 XP。回测（对 2 收卷）、
	// Boss（打中 5 下收卷）一样。现在照 11-13 三段闯关的修法：一局一题没错就算。
	test('bug A：连对 4 题过关算全对；回测连对 2 题、Boss 连中 5 下也算', () => {
		const r = play('level', LEVEL, 'RRRRR');
		expect(r).toMatchObject({ ended: 'passed', answered: 4 });
		expect(questPerfect(all(r.answered), true)).toBe(true);
		const rt = play('retest', RETEST, 'RRR');
		expect(rt).toMatchObject({ ended: 'passed', answered: 2 });
		expect(questPerfect(all(rt.answered), true)).toBe(true);
		const b = play('boss', BOSS, 'RRRRRR');
		expect(b).toMatchObject({ ended: 'passed', answered: 5 });
		expect(questPerfect(all(b.answered), true)).toBe(true);
	});
});

/* ---------- 4. 地图解锁（LojoQuestService 自己算，页面只照 open 画：没开的章画铅笔稿 +「正在修路」） ---------- */

type Row = Omit<MiLojoQuest, 'user'>;
type States = Record<string, 'done' | 'open' | 'locked'>;
// LojoQuestService's own unlock, reached without a database: only the parts that work out the map from a learner's row.
type Inside = {
	newRow(userId: string, now: Date): Row;
	chapterOpen(row: Row, no: number): boolean;
	nodeStates(row: Row): States;
	packChapter(c: QuestChapter, row: Row, states: States, today: string): { open: boolean; beaten: boolean; nodes: { id: string; state: string }[] };
	rulesFor(no: number): QuestRules;
};
const PROD_URL = 'https://app.vibes.college';
const LAN_URL = 'https://lan.example';
const service = (url: string) => new LojoQuestService(
	{ url } as never, {} as never, {} as never, {} as never, {} as never, {} as never, {} as never, {} as never, {} as never,
) as unknown as Inside;
const NOW = new Date('2026-11-16T12:00:00Z');
const PASSED = { passedAt: '2026-11-15T12:00:00Z', lastAt: '2026-11-15T12:00:00Z', stars: 1 };

describe('闯关地图解锁（假章节）', () => {
	const chapters = fourChapters();
	// 原地图三章 v2 有藏起来的格子（3-6）：id 留着，不画、不开
	chapters[2].nodes.push(node('3-hidden', 3, 'level', { hidden: true }));
	beforeAll(() => setQuestContent(1, '示例', chapters));
	afterAll(() => clearQuestContent());

	const rowWith = (s: Inside, passed: string[], over: Partial<Row> = {}): Row => ({
		...s.newRow('u', NOW), levels: Object.fromEntries(passed.map(id => [id, PASSED])), ...over,
	});
	const opens = (s: Inside, row: Row) => [1, 2, 3, 4].map(no => s.chapterOpen(row, no));
	const placedCh2 = { placement: { ch2: ['2-1'] } as unknown as MiLojoQuestPlacement };

	test('正式站：只开基础关（第一章）；专项关、冲刺关不开，页面画「正在修路」，里面的关都锁着', () => {
		const prod = service(PROD_URL);
		const rows = [rowWith(prod, []), rowWith(prod, ['1-1', '1-2', '1-3', 'boss']), rowWith(prod, ['boss', '2-boss', '3-boss'], placedCh2)];
		for (const row of rows) {
			expect(opens(prod, row)).toEqual([true, false, false, false]);
			const states = prod.nodeStates(row);
			const packed = chapters.map(c => prod.packChapter(c, row, states, '2026-11-16'));
			expect(packed.map(c => c.open)).toEqual([true, false, false, false]);
			for (const c of chapters.slice(1)) for (const n of c.nodes) expect(states[n.id], n.id).toBe('locked');
		}
	});

	test('测试站：打赢上一章 Boss 开下一章；定级到第二章也开第二章', () => {
		const lan = service(LAN_URL);
		expect(opens(lan, rowWith(lan, []))).toEqual([true, false, false, false]);
		expect(opens(lan, rowWith(lan, ['1-1', '1-2', '1-3']))).toEqual([true, false, false, false]);
		expect(opens(lan, rowWith(lan, ['boss']))).toEqual([true, true, false, false]);
		expect(opens(lan, rowWith(lan, ['boss', '2-boss']))).toEqual([true, true, true, false]);
		expect(opens(lan, rowWith(lan, ['boss', '2-boss', '3-boss']))).toEqual([true, true, true, true]);
		expect(opens(lan, rowWith(lan, [], placedCh2))).toEqual([true, true, false, false]);
		// 输了的 Boss 不算
		expect(opens(lan, { ...rowWith(lan, []), levels: { boss: { tries: 3, failStreak: 3 } } })).toEqual([true, false, false, false]);
	});

	test('服务里的章节解锁和 oldChapterOpen（三段闯关拍旧地图快照用的那份）一致', () => {
		for (const [url, live] of [[PROD_URL, true], [LAN_URL, false]] as const) {
			const s = service(url);
			for (const passed of [[], ['boss'], ['boss', '2-boss'], ['2-boss'], ['boss', '2-boss', '3-boss']]) {
				for (const placed of [false, true]) {
					const row = rowWith(s, passed, placed ? placedCh2 : {});
					const old = oldChapterOpen(chapters, row.levels, { live, placedCh2: placed });
					expect(opens(s, row), `${url} ${passed.join('+')} ${placed}`).toEqual([1, 2, 3, 4].map(old));
				}
			}
		}
	});

	test('过了上一关开下一关；没过（只打过）不开', () => {
		for (const url of [PROD_URL, LAN_URL]) {
			const s = service(url);
			const at = (passed: string[], over: Partial<Row> = {}) => s.nodeStates(rowWith(s, passed, over));
			expect(at([])).toMatchObject({ 'start': 'done', '1-1': 'open', '1-2': 'locked', '1-3': 'locked', '1-gear': 'locked', 'boss': 'locked' });
			expect(at(['1-1'])).toMatchObject({ '1-1': 'done', '1-2': 'open', '1-3': 'locked', '1-gear': 'open', 'boss': 'locked' });
			expect(at(['1-1', '1-2'])).toMatchObject({ '1-2': 'done', '1-3': 'open', 'boss': 'locked' });
			expect(at(['1-1', '1-2', '1-3'])).toMatchObject({ '1-3': 'done', 'boss': 'open' });
			expect(at(['1-1', '1-2', '1-3', 'boss'])).toMatchObject({ boss: 'done' });
			expect(s.nodeStates({ ...rowWith(s, []), levels: { '1-1': { tries: 4, best: 3, failStreak: 4 } } })).toMatchObject({ '1-1': 'open', '1-2': 'locked' });
			// 装备站：Boss 备战那一项做了就算 done
			expect(at(['1-1'], { prep: { gear: true } })['1-gear']).toBe('done');
		}
	});

	test('藏起来的格子不画在地图上，也一直锁着', () => {
		const lan = service(LAN_URL);
		const row = rowWith(lan, ['boss', '2-boss', '3-1', '3-2', '3-3']);
		const states = lan.nodeStates(row);
		expect(states['3-hidden']).toBe('locked');
		expect(lan.packChapter(chapters[2], row, states, '2026-11-16').nodes.map(n => n.id)).not.toContain('3-hidden');
	});

	test('正式站第一章用旧规矩：开关要 1 颗心；测试站和别的章 2 颗', () => {
		expect(service(PROD_URL).rulesFor(1).level.minHeartsToStart).toBe(1);
		expect(service(PROD_URL).rulesFor(2).level.minHeartsToStart).toBe(2);
		expect(service(LAN_URL).rulesFor(1).level.minHeartsToStart).toBe(2);
	});
});

/* ---------- 真题目（工作区 courses/english/ielts/quest，正式站用的「原地图三章 v2」排法）；没有就跳过 ---------- */

const CONTENT_DIR = process.env.QUEST_CONTENT_DIR ?? new URL('../../../../../../../courses/english/ielts/quest/', import.meta.url).pathname;
type Slot = { from: string; label?: string; practice?: boolean; heartCost?: number };
type Layout = { chapters: { no: number; slots: Record<string, Slot> }[] };
const hasLayout = existsSync(`${CONTENT_DIR}/map-v2.json`) && existsSync(`${CONTENT_DIR}/ch1.json`);
const LAYOUT: Layout | null = hasLayout ? JSON.parse(readFileSync(`${CONTENT_DIR}/map-v2.json`, 'utf8')) as Layout : null;
const REAL: QuestChapter[] = hasLayout ? [1, 2, 3, 4].map(n => JSON.parse(readFileSync(`${CONTENT_DIR}/ch${n}.json`, 'utf8')) as QuestChapter) : [];
// Each slot after quest-import.mjs --layout: the level it takes (from), with its own practice / heartCost when the slot
// gives them, else the old level's (same rule as the importer: s.practice ?? o.practice, s.heartCost ?? o.heartCost).
const slotLevels = () => {
	const old = new Map(REAL.flatMap(c => c.nodes.map(n => [n.id, n] as const)));
	return LAYOUT!.chapters.flatMap(page => Object.entries(page.slots).map(([id, s]) => {
		const o = old.get(s.from)!;
		return { ...o, id, ch: page.no, label: s.label ?? o.label, practice: s.practice ?? o.practice, heartCost: s.heartCost ?? o.heartCost };
	}));
};

describe.skipIf(!hasLayout)('闯关真题目：原地图三章 v2', () => {
	test('词1（基础关第一格）是练手关：答错不扣心、0 颗心也能开', () => {
		const ci1 = slotLevels().find(n => n.id === '1-1')!;
		expect(ci1.label).toBe('词1');
		const mode = questModeOf(ci1, false);
		const rules = questRulesOf(ci1, mode, REAL[0].rules);
		expect(mode).toBe('practice');
		expect(rules.heartCost).toBe(0);
		expect(play(mode, rules, 'WRRRR').hearts).toBe(MAX_HEARTS);
		expect(questMinHearts(rules, mode, REAL[0].rules)).toBe(0);
	});

	test('基础关其余各关、冲刺关每关答错扣 1 颗心', () => {
		const levels = slotLevels().filter(n => (n.ch === 1 && n.id !== '1-1') || n.ch === 4);
		expect(levels.length).toBeGreaterThan(10);
		for (const n of levels) expect([n.id, n.practice, n.heartCost]).toEqual([n.id, false, 1]);
	});

	// bug B（2026-11-16 写测试时发现，同一天修好）：专项关 6 个听力格子（2-1 听1、2-2 听2、2-4 听4、2-6 听6、3-8 听8、
	// 3-10 听10）原来没写 practice / heartCost，照导入规则从原来各章的第一关（练手关）继承了「练手关、不扣心」。闯关体验设计
	// 11-16 确认全图只有 词1 是练手关；map-v2.json 20261116c 给这 6 格写明 practice:false、heartCost:1，quest-import.mjs
	// 也不再收这种没写明的格子。
	test('bug B：排好后只有 词1 是练手关', () => {
		const practice = slotLevels().filter(n => n.practice || n.heartCost === 0).map(n => n.id);
		expect(practice).toEqual(['1-1']);
	});
});
