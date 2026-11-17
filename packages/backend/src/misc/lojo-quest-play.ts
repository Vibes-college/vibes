/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关一局的规矩，不碰数据库：这是哪种局、对几题过、错几题输、开局要几颗心、答一题扣不扣心、什么时候收卷、
// 算不算全对、限时关时间到扣几颗心。LojoQuestService 照这些走；单独放一个文件是为了能用假数据测
// （test/unit/LojoQuestPlay.ts，2026-11-16 拆出来，行为没变）。

import { MAX_HEARTS } from '@/misc/lojo-quest.js';
import { routePerfect } from '@/misc/lojo-quest-route.js';
import type { QuestNode, QuestRules, QuestTimed } from '@/misc/lojo-quest-types.js';

export type QuestMode = 'practice' | 'level' | 'retest' | 'boss' | 'probe';
export type QuestTryRules = { need: number; maxWrong: number; total: number; heartCost: number };
export type QuestGrade = 'right' | 'half' | 'wrong';
type Answer = { correct: boolean; half?: boolean };

// 摸底 > 回测 > Boss > 练手关 > 普通关
export function questModeOf(node: Pick<QuestNode, 'probe' | 'kind' | 'practice'>, retest: boolean): QuestMode {
	return node.probe ? 'probe' : retest ? 'retest' : node.kind === 'boss' ? 'boss' : node.practice ? 'practice' : 'level';
}

// need / maxWrong / total / heart cost of a try, from the node's chapter rules (R). Levels: 5 questions, 4 right passes,
// 2 wrong fails. Boss: 6, 5 hits (its hp) win, 2 wrong or no hearts lose. Retest: 3 from both sets, 2 right passes, no
// hearts. 练手关 is a level whose heartCost is 0.
export function questRulesOf(node: Pick<QuestNode, 'pool' | 'heartCost'>, mode: QuestMode, R: QuestRules): QuestTryRules {
	// 摸底：10 题全做完才收卷，不过关也不输，不扣心
	if (mode === 'probe') {
		const n = node.pool?.length ?? 0;
		return { need: n + 1, maxWrong: n + 1, total: n, heartCost: 0 };
	}
	if (mode === 'retest') {
		const r = R.retest;
		return { need: r.passAt, maxWrong: r.questions - r.passAt + 1, total: r.questions, heartCost: r.heartCost };
	}
	if (mode === 'boss') return { need: R.boss.hp, maxWrong: R.boss.maxWrong, total: R.boss.total, heartCost: node.heartCost };
	return { need: R.level.need, maxWrong: R.level.maxWrong, total: R.level.ask, heartCost: node.heartCost };
}

// 开新关至少要几颗心（11e：普通关和 Boss 2 颗，练手关 0；正式站第一章照旧 1 颗，R 由调用方按站点给）。不扣心的局不看心。
export function questMinHearts(rules: Pick<QuestTryRules, 'heartCost'>, mode: QuestMode, R: QuestRules): number {
	return rules.heartCost > 0 ? (mode === 'practice' ? R.level.minHeartsToStartPractice : R.level.minHeartsToStart) : 0;
}

// After one answer (answers already has it): whether a heart goes and how many are left, the counts, and whether the try
// ends. A wrong answer costs heartCost while there is a heart; 选两个对一半 costs nothing and is neither right nor wrong.
// The Boss is lost when hearts run out; a level just goes on (0 hearts only stops the next start).
export function questAfterAnswer(a: { mode: QuestMode; rules: QuestTryRules; grade: QuestGrade; hearts: number; answers: readonly Answer[]; total: number }) {
	const heartLost = a.grade === 'wrong' && a.rules.heartCost > 0 && a.hearts > 0;
	const hearts = heartLost ? Math.max(0, Math.min(MAX_HEARTS, a.hearts - a.rules.heartCost)) : a.hearts;
	const right = a.answers.filter(x => x.correct).length;
	const wrong = a.answers.filter(x => !x.correct && !x.half).length;
	const outOfHearts = a.mode === 'boss' && hearts <= 0 && a.grade === 'wrong';
	let ended: null | 'passed' | 'failed' = null;
	if (a.mode === 'probe') ended = a.answers.length >= a.total ? 'passed' : null;
	else if (right >= a.rules.need) ended = 'passed';
	else if (wrong >= a.rules.maxWrong || outOfHearts || a.answers.length >= a.total) ended = 'failed';
	return { heartLost, hearts, right, wrong, outOfHearts, ended };
}

// 全对：过了，而且一局一题没错（对够就收卷，所以不看题数）。三段闯关、原地图、回测、Boss 都一样：原来旧地图要
// 「对的题数 = 整套题数」，可对够就收卷，这个数永远到不了（bug A，2026-11-16 照 11-13 三段闯关的修法对齐）
export function questPerfect(answers: readonly Answer[], passed: boolean): boolean {
	return routePerfect(answers, passed);
}

// 限时关时间到，扣几颗心：普通关合起来扣 timeoutHeartCost 颗；Boss 没答的每题扣 heartPerUnanswered 颗，连同这局已经
// 答错扣的，一局最多 maxHeartsPerTry 颗。不扣心的局、没有剩下的题，不扣；最多扣到 0。
export function questTimeoutLoss(a: { mode: QuestMode; heartCost: number; timed: Pick<QuestTimed, 'timeoutHeartCost' | 'heartPerUnanswered' | 'maxHeartsPerTry'>; left: number; wrongBefore: number; hearts: number }): number {
	if (a.heartCost <= 0 || a.left <= 0) return 0;
	const t = a.timed;
	const lost = a.mode === 'boss'
		? Math.max(0, Math.min(a.left * t.heartPerUnanswered, (t.maxHeartsPerTry ?? Infinity) - a.wrongBefore * a.heartCost))
		: t.timeoutHeartCost;
	return Math.min(lost, a.hearts);
}
