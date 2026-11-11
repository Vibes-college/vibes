/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关各章共用的类型。每章的数据在 misc/lojo-quest-ch<N>.ts，由 apps/community/scripts/quest-chapter.mjs 生成。

// 错因键（第一章 7 个，第二到四章各加几个；同票顺序在每章的 causeOrder）
export type QuestCause = string;

export type QuestAudio = { voices: Record<string, string>; rate: number; lines: { who: string; text: string }[] };

export type QuestQuestion = {
	id: string;
	set: string;
	// multi = 五选二（第三章起）；YNNG 判法同 TFNG
	type: 'gap' | 'choice' | 'TFNG' | 'YNNG' | 'build' | 'multi';
	// Boss 混合时：这题是听力还是阅读
	skill: string | null;
	// 阅读原文（表格每行用 | 分列）
	passage: string | null;
	// 题干；gap 里 ______ 是空
	question: string;
	options: { key: string; text: string }[] | null;
	// build 的词块（发给页面前打乱）
	chips: string[] | null;
	// 选项 key，或填空、连词成句的标准写法；multi 是排好序的 key 用逗号连起来（"C,E"）
	answer: string;
	accept: string[];
	limit: { words?: number; number?: boolean } | null;
	ignoreSpaces: boolean;
	caseInsensitive: boolean;
	// gap、build 做错时的错因
	cause: QuestCause | null;
	// choice、TFNG、YNNG、multi：每个错误选项的错因
	causes: Record<string, QuestCause> | null;
	// multi：要选几个、两个都错时记的错因
	pick: number | null;
	bothWrongCause: QuestCause | null;
	// 录音只放一遍（第四章 4-9）
	playOnce: boolean;
	// 一整场讲座切成几段（第三章 3-3）：第几段、共几段
	lecture: { id: string; part: number; of: number } | null;
	// 决定答案的那句原文或录音稿（给 Mia、做完给看）
	evidence: string;
	why: string;
	audio: QuestAudio | null;
	tags: string[];
};

export type QuestNodeKind = 'start' | 'level' | 'gear' | 'news' | 'shelf' | 'boss';

// 限时关（第四章 4-6 和 Boss）：服务器按开局时间判超时
export type QuestTimed = {
	totalSeconds: number;
	warnAtSecondsLeft: number;
	// 普通关：时间到这一下合起来扣几颗心
	timeoutHeartCost: number;
	// Boss：没答的每题扣几颗心、一局最多扣几颗、没答的打不打中 Boss
	heartPerUnanswered: number;
	maxHeartsPerTry: number | null;
	hitsBoss: boolean;
	audioCounts: boolean;
	card: string;
};

export type QuestNode = {
	id: string;
	// 第几章
	ch: number;
	kind: QuestNodeKind;
	x: number;
	y: number;
	label: string;
	name: string | null;
	zh: string | null;
	// main / vocab / grammar / station
	branch: string;
	// 练手关：答错不扣心
	practice: boolean;
	skill: string | null;
	type: string | null;
	stations: string[];
	// 情报帖的话题
	hashtags: string[];
	// 「去装备练一组」去哪：dictation、vocab:5.N、grammar:6.N、typing、wordbook、synonym-match:<话题>
	gear: string | null;
	// 「补 1 颗心」去哪（语法关指到词汇线）；gear 本身补不补心；两个按钮的字
	heartGear: string | null;
	gearGivesHeart: boolean;
	gearButton: string | null;
	heartButton: string | null;
	// 没过关时书屋亮的锦囊（j1…），第一本是推荐
	shelf: string[];
	// 这一关某个错因先推哪本（第四章 4-8：vocab → j31）
	causeGuide: Record<string, string> | null;
	heartCost: number;
	// 一次出几题、对几题过、错几题输
	ask: number | null;
	need: number | null;
	maxWrong: number | null;
	sets: string[];
	retest: boolean;
	// 题按文件顺序出、不打乱（讲座）
	keepOrder: boolean;
	timed: QuestTimed | null;
	pool: QuestQuestion[] | null;
};

// 每章的规则数字（numbers.json 里各章不一样的那些）
export type QuestRules = {
	level: { ask: number; need: number; maxWrong: number; minHeartsToStart: number; minHeartsToStartPractice: number; lowHeartsButton: string };
	retest: { questions: number; passAt: number; heartCost: number };
	boss: { hp: number; maxWrong: number; total: number; prepRequired: number; prepOf: number; extraPrepAfterLossesInARow: number | null; resetPrepAfterLossesInARow: number | null; prep: { id: string; zh: string }[] };
	chest: { sideAt: string | null; sideXp: number; clearXp: number; badge: string };
	// 五选二：对一半记什么错因；Boss 里怎么算（给玩家看的字）
	multi: { oneRightCause: string; inBossZh: string; oneRightZh: string } | null;
	// 限时关玩家看到的字（numbers.json timed.copy）
	timedCopy: Record<string, string> | null;
};

export type QuestChapter = {
	id: string;
	no: number;
	version: string;
	title: string;
	band: string;
	disclaimer: string;
	// 哪个点是 Boss、起点（第一章是 boss / start，第二章起带章号前缀）
	bossId: string;
	startId: string;
	boss: { hp: number; maxWrong: number; total: number };
	branches: Record<string, { zh: string; note: string }>;
	nodes: QuestNode[];
	// [from, to, branch]：任意一条来路的 from 过了，to 就开
	edges: [string, string, string][];
	// 主错因同票时按这个顺序取
	causeOrder: QuestCause[];
	rules: QuestRules;
};
