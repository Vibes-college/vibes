/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关的玩法数字（心、连胜、XP、星星、宝箱……全闯关共用），和第一章的主错因顺序。这些是规则，不含题目和答案，所以留在代码里。
// 题目、地图和各章规则（答案在里面）不在代码里：在 Vibes 工作区 courses/english/ielts/quest/ch<N>.json，用
// apps/community/scripts/quest-import.mjs 导进数据库（2026-11-12 起），见 misc/lojo-quest-content.ts。
// 由 apps/community/scripts/quest-chapter.mjs 从路线图的 numbers.json 生成（生成第一章时一起写），不要手改。

import type { QuestCause } from '@/misc/lojo-quest-types.js';

// 第一章的主错因顺序（旧名字，misc/lojo-quest.ts 用）
export const QUEST_CAUSE_ORDER: QuestCause[] = ["too-hard", "grammar", "vocab", "not-given", "same-word", "not-heard", "spelling"];

// numbers.json 原样（心、连胜、XP 这些全闯关共用的数字一律以这里为准；各章不一样的在每章的 rules）
export const QUEST_NUMBERS = {
	"version": "ch1-2026-11-11c",
	"timezone": "Asia/Shanghai",
	"hearts": {
		"max": 5,
		"start": 5,
		"costPerWrong": 1,
		"practiceCost": 0,
		"autoRefillAt": [
			"08:00",
			"20:00"
		],
		"autoRefillTo": 5,
		"earnBack": {
			"whenBelow": 5,
			"perPath": 1,
			"perPathPerDay": 1,
			"guide": {
				"quizCount": 3,
				"quizPassAt": 2,
				"sameGuideOncePerDay": true
			},
			"gear": {
				"minItems": 10,
				"minSeconds": 120,
				"api": "POST /api/lojo/quest/refill"
			},
			"intel": 0,
			"buy": false
		},
		"zeroHearts": "心少于 2 颗，开不了新关（练手关不限）。去锦囊书屋或装备站补一颗，或者等北京时间 8:00、20:00 回满"
	},
	"level": {
		"questionsPerTry": 5,
		"failAtWrong": 2,
		"passAtCorrect": 4,
		"minHeartsToStart": 2,
		"minHeartsToStartPractice": 0,
		"lowHeartsButton": "只剩 1 颗心，先去补一颗",
		"newSetOnRetry": true,
		"setsPerLevel": 2,
		"afterAllSets": "两套都用过以后，重新打乱两套的题再出（题号不重复上一次）",
		"retest": {
			"questions": 3,
			"passAt": 2,
			"heartCost": 0,
			"from": "这一关两套题里随机抽"
		}
	},
	"boss": {
		"questionsPerTry": 6,
		"hp": 5,
		"loseAtWrong": 2,
		"loseAtHearts": 0,
		"sets": 3,
		"prep": [
			{
				"id": "guide",
				"zh": "读一本锦囊并过小测（推荐《一字不差的多半不是答案》）"
			},
			{
				"id": "gear",
				"zh": "去装备练一组（本关装备或任意装备）"
			},
			{
				"id": "intel",
				"zh": "看 1 篇情报帖（#IELTS_1_4 或 #IELTS_2_4）"
			}
		],
		"prepRequired": 2,
		"prepOf": 3,
		"prepCountsHeartRefill": true,
		"extraPrepAfterLossesInARow": 2,
		"extraPrepRule": "3 项里做 2 项就能挑战；Boss 连输 2 次后要再做 1 项（没做的那项，或任意一项重做），已做的不清空"
	},
	"streak": {
		"countsAs": [
			"过一关（含回测）",
			"补回 1 颗心"
		],
		"reminderAt": "21:00",
		"reminderOnlyIfNotDoneToday": true,
		"freeze": {
			"earnEveryDays": 7,
			"max": 2,
			"autoUseOnMissedDay": true,
			"buy": false
		},
		"milestones": [
			3,
			7,
			14,
			30,
			60,
			100
		]
	},
	"xp": {
		"levelPass": 20,
		"perfectBonus": 5,
		"practicePass": 10,
		"bossWin": 50,
		"retestPass": 10,
		"guideQuizPass": 5,
		"gearSet": 5,
		"intelRead": 2,
		"sideChest": 30,
		"doubleXp": {
			"trigger": "新的一章开张",
			"hours": 24,
			"appliesTo": "本章所有 XP，宝箱也算"
		}
	},
	"chest": {
		"dailyFirstWin": {
			"xp": 30,
			"bonus": [
				{
					"item": "freeze",
					"chance": 0.1,
					"onlyIfBelowMax": true
				},
				{
					"item": "guide-preview",
					"chance": 0.2
				}
			]
		},
		"sideQuest": {
			"at": "1-12",
			"xp": 30,
			"item": "freeze",
			"onlyIfBelowMax": true
		},
		"chapterClear": {
			"at": "boss",
			"xp": 100,
			"badge": "ielts-c1"
		}
	},
	"map": {
		"fadeAfterDays": 7,
		"grayAfterDays": 14,
		"relight": "回测过了就重新亮，并且加一颗星",
		"stars": {
			"pass": 1,
			"perfect": 2,
			"retestAdds": 1,
			"max": 3
		}
	},
	"behind": {
		"paceWindowDays": 7,
		"rule": "按最近 7 天每天平均过几关，算到「我的考试日期」还能走到哪；落后目标 ≥2 关就在地图顶上提示，每天最多一次",
		"minGapLevels": 2,
		"maxPerDay": 1,
		"needsExamDate": true,
		"copy": "照这个速度，考前走不到 {target}。今天多过 {n} 关就追上了。"
	},
	"shelfRule": {
		"lit": 3,
		"recommend": "默认推荐本关 shelf 第一本；本次主错因对应的锦囊不是第一本时，把它换到第一本",
		"sameLevelFailsInARow": {
			"count": 2,
			"recommend": "j7"
		},
		"mainCause": "见 错因和evidence说明.md「主错因」"
	},
	"unlock": {
		"rule": "一关的任意一条来路（edges 的 from）过了，这关就开；站点路过就开",
		"boss": "1-6 过了，并且备战 3 项里做完 2 项"
	}
} as const;
