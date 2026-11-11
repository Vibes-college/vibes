/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关第一章：地图、关卡、题库（138 题，全部原创）和规则数字。版本 ch1-2026-11-11a。
// 由 apps/community/scripts/quest-chapter.mjs 从路线图的「关卡数据」（chapter-1.json、questions/*.json、numbers.json）生成，不要手改。
// 答案、accept、evidence、录音稿只在服务器上：页面拿到的题目不带这些，作答由 lojo/quest/answer 判。
// 坐标是 390 宽画布里的位置（原型 v2）。难度是「练习难度」，不是官方分数。

export type QuestCause = 'same-word' | 'not-given' | 'not-heard' | 'spelling' | 'vocab' | 'grammar' | 'too-hard';
// 主错因同票时按这个顺序取（错因和evidence说明.md）
export const QUEST_CAUSE_ORDER: QuestCause[] = ['too-hard', 'grammar', 'vocab', 'not-given', 'same-word', 'not-heard', 'spelling'];

export type QuestAudio = { voices: Record<string, string>; rate: number; lines: { who: string; text: string }[] };

export type QuestQuestion = {
	id: string;
	set: string;
	type: 'gap' | 'choice' | 'TFNG' | 'build';
	// Boss 混合时：这题是听力还是阅读
	skill: string | null;
	// 阅读原文（表格每行用 | 分列）
	passage: string | null;
	// 题干；gap 里 ______ 是空
	question: string;
	options: { key: string; text: string }[] | null;
	// build 的词块（发给页面前打乱）
	chips: string[] | null;
	// 选项 key，或填空、连词成句的标准写法
	answer: string;
	accept: string[];
	limit: { words?: number; number?: boolean } | null;
	ignoreSpaces: boolean;
	caseInsensitive: boolean;
	// gap、build 做错时的错因
	cause: QuestCause | null;
	// choice、TFNG：每个错误选项的错因
	causes: Record<string, QuestCause> | null;
	// 决定答案的那句原文或录音稿（给 Mia、做完给看）
	evidence: string;
	why: string;
	audio: QuestAudio | null;
	tags: string[];
};

export type QuestNodeKind = 'start' | 'level' | 'gear' | 'news' | 'shelf' | 'boss';

export type QuestNode = {
	id: string;
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
	// 「去装备练一组」去哪：dictation、vocab:5.N、grammar:6.N、typing、wordbook
	gear: string | null;
	// 没过关时书屋亮的锦囊（j1…j10），第一本是推荐
	shelf: string[];
	heartCost: number;
	// 一次出几题、对几题过、错几题输
	ask: number | null;
	need: number | null;
	maxWrong: number | null;
	sets: string[];
	retest: boolean;
	pool: QuestQuestion[] | null;
};

export type QuestChapter = {
	id: string;
	version: string;
	title: string;
	band: string;
	disclaimer: string;
	boss: { hp: number; maxWrong: number; total: number };
	branches: Record<string, { zh: string; note: string }>;
	nodes: QuestNode[];
	// [from, to, branch]：任意一条来路的 from 过了，to 就开
	edges: [string, string, string][];
};

// numbers.json 原样（规则数字一律以这里为准）
export const QUEST_NUMBERS = {
	"version": "ch1-2026-11-11a",
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
		"zeroHearts": "0 颗心不能开新关，可以去锦囊或装备补，或等 08:00 / 20:00"
	},
	"level": {
		"questionsPerTry": 5,
		"failAtWrong": 2,
		"passAtCorrect": 4,
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
				"zh": "读一本锦囊（推荐 j5）并过小测"
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
		"prepRequired": 3,
		"prepCountsHeartRefill": true,
		"resetPrepAfterLossesInARow": 2
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
		"boss": "1-6 过了，并且备战 3 项都做完"
	}
} as const;

export const QUEST_CH1: QuestChapter = {
	"id": "ielts-c1",
	"version": "ch1-2026-11-11a",
	"title": "第一章 · 打底",
	"band": "练习难度 4.0–5.0",
	"disclaimer": "练习难度，不是官方分数",
	"boss": {
		"hp": 5,
		"maxWrong": 2,
		"total": 6
	},
	"branches": {
		"main": {
			"zh": "主线",
			"note": "一路走到 Boss"
		},
		"vocab": {
			"zh": "词汇岔路",
			"note": "1-3 之后可以不走阅读，走词汇绕到 1-6；两条路过任一条都能进 1-6"
		},
		"grammar": {
			"zh": "语法支线",
			"note": "1-4 之后开，不挡主线；1-12 过了开支线宝箱"
		},
		"station": {
			"zh": "站点",
			"note": "不是关卡，路过就开"
		}
	},
	"nodes": [
		{
			"id": "start",
			"kind": "start",
			"x": 195,
			"y": 570,
			"label": "起点",
			"name": null,
			"zh": null,
			"branch": "main",
			"practice": false,
			"skill": null,
			"type": null,
			"stations": [],
			"hashtags": [],
			"gear": null,
			"shelf": [],
			"heartCost": 0,
			"ask": null,
			"need": null,
			"maxWrong": null,
			"sets": [],
			"retest": false,
			"pool": null
		},
		{
			"id": "1-1",
			"kind": "level",
			"x": 195,
			"y": 520,
			"label": "1-1",
			"name": "名字和字母",
			"zh": "听力 · 一个字母一个字母地听",
			"branch": "main",
			"practice": true,
			"skill": "listening",
			"type": "gap",
			"stations": [
				"1.1"
			],
			"hashtags": [
				"IELTS_1_1"
			],
			"gear": "dictation",
			"shelf": [
				"j4",
				"j6",
				"j7"
			],
			"heartCost": 0,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"pool": [
				{
					"id": "1-1-A-1",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Surname: ______",
					"options": null,
					"chips": null,
					"answer": "Hartley",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "Can I take your surname, please? Yes, it's Hartley. H, A, R, T, L, E, Y.",
					"why": "一个字母一个字母地听：H-A-R-T-L-E-Y。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "A",
								"text": "Can I take your surname, please?"
							},
							{
								"who": "B",
								"text": "Yes, it's Hartley. H, A, R, T, L, E, Y."
							}
						]
					},
					"tags": [
						"spelling",
						"form"
					]
				},
				{
					"id": "1-1-A-2",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Address: 22 ______ Road",
					"options": null,
					"chips": null,
					"answer": "Wexford",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "And which road do you live on? Wexford Road. That's W, E, X, F, O, R, D.",
					"why": "X 读作 /eks/，别听成 S。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "A",
								"text": "And which road do you live on?"
							},
							{
								"who": "B",
								"text": "Wexford Road. That's W, E, X, F, O, R, D."
							}
						]
					},
					"tags": [
						"spelling",
						"form"
					]
				},
				{
					"id": "1-1-A-3",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Postcode: ______",
					"options": null,
					"chips": null,
					"answer": "CB39JT",
					"accept": [],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": true,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "What's the postcode there? It's C, B, three, nine, J, T.",
					"why": "英国邮编字母和数字混着读，B 和 three 之间不停顿。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "A",
								"text": "What's the postcode there?"
							},
							{
								"who": "B",
								"text": "It's C, B, three, nine, J, T."
							}
						]
					},
					"tags": [
						"spelling",
						"form",
						"numbers"
					]
				},
				{
					"id": "1-1-A-4",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Guide: Mrs ______",
					"options": null,
					"chips": null,
					"answer": "Quinlan",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "Who will be your guide on the tour? Mrs Quinlan. Q, U, I, N, L, A, N.",
					"why": "Q 读作 /kjuː/，后面几乎总跟 U。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "A",
								"text": "Who will be your guide on the tour?"
							},
							{
								"who": "B",
								"text": "Mrs Quinlan. Q, U, I, N, L, A, N."
							}
						]
					},
					"tags": [
						"spelling",
						"form"
					]
				},
				{
					"id": "1-1-A-5",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Hotel: The ______",
					"options": null,
					"chips": null,
					"answer": "Abbott",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "Which hotel are we staying at? The Abbott. That's A, double B, O, double T.",
					"why": "「double B」就是两个 B，写成 bb。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "B",
								"text": "Which hotel are we staying at?"
							},
							{
								"who": "A",
								"text": "The Abbott. That's A, double B, O, double T."
							}
						]
					},
					"tags": [
						"spelling",
						"form"
					]
				},
				{
					"id": "1-1-B-1",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Family name: ______",
					"options": null,
					"chips": null,
					"answer": "Rourke",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "And your family name? Rourke. R, O, U, R, K, E.",
					"why": "名字的拼法跟发音对不上，只能靠一个个字母。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "A",
								"text": "And your family name?"
							},
							{
								"who": "B",
								"text": "Rourke. R, O, U, R, K, E."
							}
						]
					},
					"tags": [
						"spelling",
						"form"
					]
				},
				{
					"id": "1-1-B-2",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Meeting point: ______ village hall",
					"options": null,
					"chips": null,
					"answer": "Ashby",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "Where do we meet on Saturday? At Ashby village hall. A, S, H, B, Y.",
					"why": "H 读作 /eɪtʃ/，别漏写。",
					"audio": {
						"voices": {
							"A": "au-friendly",
							"B": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "A",
								"text": "Where do we meet on Saturday?"
							},
							{
								"who": "B",
								"text": "At Ashby village hall. A, S, H, B, Y."
							}
						]
					},
					"tags": [
						"spelling",
						"form"
					]
				},
				{
					"id": "1-1-B-3",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Postcode: ______",
					"options": null,
					"chips": null,
					"answer": "LS82WN",
					"accept": [],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": true,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "Could I have your postcode? L, S, eight, two, W, N.",
					"why": "W 读作 double-u，是一个字母，不是两个 U。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "A",
								"text": "Could I have your postcode?"
							},
							{
								"who": "B",
								"text": "L, S, eight, two, W, N."
							}
						]
					},
					"tags": [
						"spelling",
						"form",
						"numbers"
					]
				},
				{
					"id": "1-1-B-4",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Course code: ______",
					"options": null,
					"chips": null,
					"answer": "HG47",
					"accept": [],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": true,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "Do you know the course code? Yes, it's H, G, four, seven.",
					"why": "H 和 G 都是常被听错的字母：G 读作 /dʒiː/。",
					"audio": {
						"voices": {
							"A": "au-friendly",
							"B": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "A",
								"text": "Do you know the course code?"
							},
							{
								"who": "B",
								"text": "Yes, it's H, G, four, seven."
							}
						]
					},
					"tags": [
						"spelling",
						"form"
					]
				},
				{
					"id": "1-1-B-5",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Contact: Mr ______",
					"options": null,
					"chips": null,
					"answer": "Jarvis",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "Who should I ask for when I arrive? Ask for Mr Jarvis. J, A, R, V, I, S.",
					"why": "J 读作 /dʒeɪ/，和 G /dʒiː/ 只差一个元音。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "B",
								"text": "Who should I ask for when I arrive?"
							},
							{
								"who": "A",
								"text": "Ask for Mr Jarvis. J, A, R, V, I, S."
							}
						]
					},
					"tags": [
						"spelling",
						"form"
					]
				}
			]
		},
		{
			"id": "1-2",
			"kind": "level",
			"x": 120,
			"y": 470,
			"label": "1-2",
			"name": "数字和日期",
			"zh": "听力 · 价格、日期、电话、时间",
			"branch": "main",
			"practice": true,
			"skill": "listening",
			"type": "gap",
			"stations": [
				"1.2"
			],
			"hashtags": [
				"IELTS_1_2"
			],
			"gear": "dictation",
			"shelf": [
				"j4",
				"j6",
				"j7"
			],
			"heartCost": 0,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"pool": [
				{
					"id": "1-2-A-1",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Adult ticket: £______",
					"options": null,
					"chips": null,
					"answer": "14.50",
					"accept": [
						"14.5"
					],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "How much is an adult ticket? Adult tickets are fourteen pounds fifty.",
					"why": "fourteen 重音在后，forty 重音在前；pounds fifty 是 .50。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "B",
								"text": "How much is an adult ticket?"
							},
							{
								"who": "A",
								"text": "Adult tickets are fourteen pounds fifty."
							}
						]
					},
					"tags": [
						"numbers",
						"form"
					]
				},
				{
					"id": "1-2-A-2",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Start date: ______ March",
					"options": null,
					"chips": null,
					"answer": "13",
					"accept": [
						"13th",
						"thirteenth"
					],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "When does the course start? On the thirteenth of March.",
					"why": "thirteenth 结尾的 -teenth 拉长，thirtieth 是 -tieth。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "B",
								"text": "When does the course start?"
							},
							{
								"who": "A",
								"text": "On the thirteenth of March."
							}
						]
					},
					"tags": [
						"numbers",
						"form"
					]
				},
				{
					"id": "1-2-A-3",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Phone: ______",
					"options": null,
					"chips": null,
					"answer": "02079460018",
					"accept": [],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": true,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "What's the best number to call? Oh two oh, seven nine four six, oh oh one eight.",
					"why": "电话里的 0 读作 oh；「oh oh」就是 00。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "B",
								"text": "What's the best number to call?"
							},
							{
								"who": "A",
								"text": "Oh two oh, seven nine four six, oh oh one eight."
							}
						]
					},
					"tags": [
						"numbers",
						"form"
					]
				},
				{
					"id": "1-2-A-4",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Bus leaves: ______ am",
					"options": null,
					"chips": null,
					"answer": "7.45",
					"accept": [
						"7:45",
						"07.45",
						"07:45"
					],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "What time does the bus leave? At quarter to eight in the morning.",
					"why": "quarter to eight 是八点差一刻，也就是 7:45，不是 8:15。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "B",
								"text": "What time does the bus leave?"
							},
							{
								"who": "A",
								"text": "At quarter to eight in the morning."
							}
						]
					},
					"tags": [
						"numbers",
						"form"
					]
				},
				{
					"id": "1-2-A-5",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Hall holds up to ______ people",
					"options": null,
					"chips": null,
					"answer": "60",
					"accept": [
						"sixty"
					],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "How big is the hall? We've got sixteen tables, and the hall holds up to sixty people.",
					"why": "问的是能坐多少人，sixteen 是桌子数。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "B",
								"text": "How big is the hall?"
							},
							{
								"who": "A",
								"text": "We've got sixteen tables, and the hall holds up to sixty people."
							}
						]
					},
					"tags": [
						"numbers",
						"form",
						"distractor"
					]
				},
				{
					"id": "1-2-B-1",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Deposit: £______",
					"options": null,
					"chips": null,
					"answer": "30",
					"accept": [
						"thirty"
					],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "Do I pay everything now? No, just the deposit, which is thirty pounds. The other ninety you pay on the day.",
					"why": "定金是 thirty，ninety 是余款。",
					"audio": {
						"voices": {
							"A": "au-friendly",
							"B": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "A",
								"text": "Do I pay everything now?"
							},
							{
								"who": "B",
								"text": "No, just the deposit, which is thirty pounds. The other ninety you pay on the day."
							}
						]
					},
					"tags": [
						"numbers",
						"form"
					]
				},
				{
					"id": "1-2-B-2",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Date: Tuesday ______",
					"options": null,
					"chips": null,
					"answer": "21",
					"accept": [
						"21st",
						"twenty-first"
					],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "When is my appointment? It's on Tuesday the twenty-first.",
					"why": "twenty-first 是 21 号，first 那个音很短。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "B",
								"text": "When is my appointment?"
							},
							{
								"who": "A",
								"text": "It's on Tuesday the twenty-first."
							}
						]
					},
					"tags": [
						"numbers",
						"form"
					]
				},
				{
					"id": "1-2-B-3",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Closes at: ______ pm",
					"options": null,
					"chips": null,
					"answer": "5.30",
					"accept": [
						"5:30"
					],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "What time does the museum close? It closes at half past five.",
					"why": "half past five 是五点半。",
					"audio": {
						"voices": {
							"A": "au-friendly",
							"B": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "A",
								"text": "What time does the museum close?"
							},
							{
								"who": "B",
								"text": "It closes at half past five."
							}
						]
					},
					"tags": [
						"numbers",
						"form"
					]
				},
				{
					"id": "1-2-B-4",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Room: ______",
					"options": null,
					"chips": null,
					"answer": "409",
					"accept": [],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "Which room are we in? Room four oh nine, on the fourth floor.",
					"why": "房间号一位一位读，中间的 oh 是 0。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "B",
								"text": "Which room are we in?"
							},
							{
								"who": "A",
								"text": "Room four oh nine, on the fourth floor."
							}
						]
					},
					"tags": [
						"numbers",
						"form"
					]
				},
				{
					"id": "1-2-B-5",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Walk length: ______ km",
					"options": null,
					"chips": null,
					"answer": "18",
					"accept": [
						"eighteen"
					],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"evidence": "How long is the walk? About eighteen kilometres, so bring plenty of water.",
					"why": "eighteen 尾巴长，重音在 -teen；eighty 重音在前。",
					"audio": {
						"voices": {
							"A": "au-friendly",
							"B": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "A",
								"text": "How long is the walk?"
							},
							{
								"who": "B",
								"text": "About eighteen kilometres, so bring plenty of water."
							}
						]
					},
					"tags": [
						"numbers",
						"form"
					]
				}
			]
		},
		{
			"id": "1-3",
			"kind": "level",
			"x": 195,
			"y": 420,
			"label": "1-3",
			"name": "他改口了",
			"zh": "听力 · 先说的不算，改口后的才算",
			"branch": "main",
			"practice": true,
			"skill": "listening",
			"type": "choice",
			"stations": [
				"1.3"
			],
			"hashtags": [
				"IELTS_1_3"
			],
			"gear": "dictation",
			"shelf": [
				"j4",
				"j5",
				"j7"
			],
			"heartCost": 0,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"pool": [
				{
					"id": "1-3-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which day will they meet?",
					"options": [
						{
							"key": "A",
							"text": "Wednesday"
						},
						{
							"key": "B",
							"text": "Monday"
						},
						{
							"key": "C",
							"text": "Tuesday"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "not-heard",
						"C": "not-heard"
					},
					"evidence": "Can we meet on Monday? Monday's difficult for me. How about Wednesday? Wednesday's fine.",
					"why": "先提的 Monday 被否掉了，最后定的是 Wednesday。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "B",
								"text": "Can we meet on Monday?"
							},
							{
								"who": "A",
								"text": "Monday's difficult for me. How about Wednesday?"
							},
							{
								"who": "B",
								"text": "Wednesday's fine."
							}
						]
					},
					"tags": [
						"distractor"
					]
				},
				{
					"id": "1-3-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which room does he book?",
					"options": [
						{
							"key": "A",
							"text": "the large room"
						},
						{
							"key": "B",
							"text": "the small room"
						},
						{
							"key": "C",
							"text": "the medium room"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "not-heard",
						"C": "not-heard"
					},
					"evidence": "I'd like to book the large room. Actually, there are only six of us, so the small one will do.",
					"why": "Actually 后面是改口，听到它就要等最后一句。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "B",
								"text": "I'd like to book the large room. Actually, there are only six of us, so the small one will do."
							}
						]
					},
					"tags": [
						"distractor"
					]
				},
				{
					"id": "1-3-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "How much will the guidebook cost this week?",
					"options": [
						{
							"key": "A",
							"text": "£12"
						},
						{
							"key": "B",
							"text": "£19"
						},
						{
							"key": "C",
							"text": "£9"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "not-heard",
						"B": "not-heard"
					},
					"evidence": "The guidebook is usually twelve pounds, but it's on sale this week for nine.",
					"why": "usually 是平时的价，this week 是本周的价。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "The guidebook is usually twelve pounds, but it's on sale this week for nine."
							}
						]
					},
					"tags": [
						"distractor",
						"numbers",
						"form"
					]
				},
				{
					"id": "1-3-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "How should he travel this weekend?",
					"options": [
						{
							"key": "A",
							"text": "by coach"
						},
						{
							"key": "B",
							"text": "by train"
						},
						{
							"key": "C",
							"text": "by car"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "not-heard",
						"C": "not-heard"
					},
					"evidence": "Should I take the train? The train's quicker, but there's work on the line this weekend, so take the coach.",
					"why": "but 后面才是建议：坐 coach（长途大巴）。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "B",
								"text": "Should I take the train?"
							},
							{
								"who": "A",
								"text": "The train's quicker, but there's work on the line this weekend, so take the coach."
							}
						]
					},
					"tags": [
						"distractor"
					]
				},
				{
					"id": "1-3-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The phone number ends in …",
					"options": [
						{
							"key": "A",
							"text": "0542"
						},
						{
							"key": "B",
							"text": "0547"
						},
						{
							"key": "C",
							"text": "0457"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "not-heard",
						"C": "not-heard"
					},
					"evidence": "My number is oh one one seven, four nine six, oh five four two. Sorry, oh five four seven.",
					"why": "Sorry 之后是更正过的号码。",
					"audio": {
						"voices": {
							"A": "au-friendly",
							"B": "uk-historian"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "B",
								"text": "My number is oh one one seven, four nine six, oh five four two. Sorry, oh five four seven."
							}
						]
					},
					"tags": [
						"distractor",
						"numbers",
						"form"
					]
				},
				{
					"id": "1-3-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What time do they start this week?",
					"options": [
						{
							"key": "A",
							"text": "9.00"
						},
						{
							"key": "B",
							"text": "10.30"
						},
						{
							"key": "C",
							"text": "9.30"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "not-heard",
						"B": "not-heard"
					},
					"evidence": "We usually start at nine. Oh, but this week it's half past nine, because of the staff meeting.",
					"why": "usually 是平常，this week 才是这周的时间。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "We usually start at nine. Oh, but this week it's half past nine, because of the staff meeting."
							}
						]
					},
					"tags": [
						"distractor",
						"numbers",
						"form"
					]
				},
				{
					"id": "1-3-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What will the speaker bring?",
					"options": [
						{
							"key": "A",
							"text": "a salad"
						},
						{
							"key": "B",
							"text": "pasta"
						},
						{
							"key": "C",
							"text": "a cake"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "not-heard",
						"C": "not-heard"
					},
					"evidence": "I was going to bring pasta, but Sam's bringing that, so I'll make a salad.",
					"why": "was going to 是原来的打算，后来改成了 salad。",
					"audio": {
						"voices": {
							"A": "au-friendly",
							"B": "uk-historian"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "I was going to bring pasta, but Sam's bringing that, so I'll make a salad."
							}
						]
					},
					"tags": [
						"distractor"
					]
				},
				{
					"id": "1-3-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "How much will he pay?",
					"options": [
						{
							"key": "A",
							"text": "£30"
						},
						{
							"key": "B",
							"text": "£20"
						},
						{
							"key": "C",
							"text": "£50"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "not-heard",
						"C": "not-heard"
					},
					"evidence": "Seats in the front row are thirty pounds, and the back row is twenty. I'll go for the back, then.",
					"why": "他选了 back row，就是 twenty。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "Seats in the front row are thirty pounds, and the back row is twenty."
							},
							{
								"who": "B",
								"text": "I'll go for the back, then."
							}
						]
					},
					"tags": [
						"distractor",
						"numbers",
						"form"
					]
				},
				{
					"id": "1-3-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which floor is the meeting on?",
					"options": [
						{
							"key": "A",
							"text": "the first floor"
						},
						{
							"key": "B",
							"text": "the second floor"
						},
						{
							"key": "C",
							"text": "the third floor"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "not-heard",
						"B": "not-heard"
					},
					"evidence": "The meeting is on the second floor. Oh, wait, it's moved. It's on the third floor now, room three B.",
					"why": "it's moved 说明换了地方，now 后面是新地点。",
					"audio": {
						"voices": {
							"A": "uk-brit",
							"B": "us-ethan"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "The meeting is on the second floor. Oh, wait, it's moved. It's on the third floor now, room three B."
							}
						]
					},
					"tags": [
						"distractor"
					]
				},
				{
					"id": "1-3-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What should you do at the bank?",
					"options": [
						{
							"key": "A",
							"text": "turn right"
						},
						{
							"key": "B",
							"text": "turn left"
						},
						{
							"key": "C",
							"text": "go straight on"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "not-heard",
						"C": "not-heard"
					},
					"evidence": "Turn left at the bank. No, sorry, turn right at the bank, then go straight on.",
					"why": "No, sorry 是改口：在银行右转，之后才直走。",
					"audio": {
						"voices": {
							"A": "au-friendly",
							"B": "uk-historian"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "B",
								"text": "Turn left at the bank. No, sorry, turn right at the bank, then go straight on."
							}
						]
					},
					"tags": [
						"distractor"
					]
				}
			]
		},
		{
			"id": "1-4",
			"kind": "level",
			"x": 110,
			"y": 365,
			"label": "1-4",
			"name": "通知和时刻表",
			"zh": "阅读 · 在通知、价目表里找信息",
			"branch": "main",
			"practice": false,
			"skill": "reading",
			"type": "mixed",
			"stations": [
				"2.1"
			],
			"hashtags": [
				"IELTS_2_1"
			],
			"gear": "vocab:5.3",
			"shelf": [
				"j3",
				"j5",
				"j7"
			],
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"pool": [
				{
					"id": "1-4-A-1",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": "City Library – opening hours\nDay | Hours\nMonday to Thursday | 9 am – 8 pm\nFriday | 9 am – 5 pm\nSaturday | 10 am – 2 pm\nSunday | Closed",
					"question": "On Fridays the library closes at ______ pm.",
					"options": null,
					"chips": null,
					"answer": "5",
					"accept": [
						"5.00",
						"5:00",
						"five"
					],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "too-hard",
					"causes": null,
					"evidence": "City Library – opening hours\nDay | Hours\nMonday to Thursday | 9 am – 8 pm\nFriday | 9 am – 5 pm\nSaturday | 10 am – 2 pm\nSunday | Closed",
					"why": "先找到 Friday 那一行，再看后一个时间。",
					"audio": null,
					"tags": [
						"short-answer"
					]
				},
				{
					"id": "1-4-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Bike hire: £4 for the first hour, then £2 for each extra hour. Helmets are free. You pay a £20 deposit, which you get back when you return the bike.",
					"question": "How much does it cost to hire a bike for three hours?",
					"options": [
						{
							"key": "A",
							"text": "£6"
						},
						{
							"key": "B",
							"text": "£8"
						},
						{
							"key": "C",
							"text": "£12"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "too-hard",
						"C": "too-hard"
					},
					"evidence": "Bike hire: £4 for the first hour, then £2 for each extra hour. Helmets are free. You pay a £20 deposit, which you get back when you return the bike.",
					"why": "第一小时 £4，后两小时各 £2，一共 £8；押金会退，不算。",
					"audio": null,
					"tags": [
						"short-answer"
					]
				},
				{
					"id": "1-4-A-3",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": "Cooking Club meets every second Thursday in Room 12. Please bring your own apron; all ingredients are provided. Places are limited to ten, so sign up at the front desk.",
					"question": "Members must bring their own ______.",
					"options": null,
					"chips": null,
					"answer": "apron",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "too-hard",
					"causes": null,
					"evidence": "Cooking Club meets every second Thursday in Room 12. Please bring your own apron; all ingredients are provided. Places are limited to ten, so sign up at the front desk.",
					"why": "bring your own 后面就是答案；食材是提供的。",
					"audio": null,
					"tags": [
						"short-answer"
					]
				},
				{
					"id": "1-4-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Lost property: anything left on our buses is kept at the main depot for 30 days. After that, it is given to a local charity.",
					"question": "What happens to lost items after 30 days?",
					"options": [
						{
							"key": "A",
							"text": "They are sold."
						},
						{
							"key": "B",
							"text": "They are thrown away."
						},
						{
							"key": "C",
							"text": "They go to a charity."
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "too-hard",
						"B": "too-hard"
					},
					"evidence": "Lost property: anything left on our buses is kept at the main depot for 30 days. After that, it is given to a local charity.",
					"why": "After that 指 30 天以后：given to a local charity。",
					"audio": null,
					"tags": [
						"short-answer"
					]
				},
				{
					"id": "1-4-A-5",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": "Number 7 bus – weekend timetable\nLeaves Market Square at 08.15, 09.45 and 11.15, then every hour until 18.15.",
					"question": "The second bus of the day leaves at ______.",
					"options": null,
					"chips": null,
					"answer": "9.45",
					"accept": [
						"09.45",
						"9:45",
						"09:45"
					],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "too-hard",
					"causes": null,
					"evidence": "Number 7 bus – weekend timetable\nLeaves Market Square at 08.15, 09.45 and 11.15, then every hour until 18.15.",
					"why": "按顺序数：08.15 是第一班，09.45 是第二班。",
					"audio": null,
					"tags": [
						"short-answer"
					]
				},
				{
					"id": "1-4-B-1",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": "Swimming pool prices\nAdult | £4.80\nChild (5–15) | £2.60\nUnder 5 | Free\nFamily (2 adults + 2 children) | £12.00",
					"question": "Children under five swim for ______.",
					"options": null,
					"chips": null,
					"answer": "free",
					"accept": [
						"nothing"
					],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "too-hard",
					"causes": null,
					"evidence": "Swimming pool prices\nAdult | £4.80\nChild (5–15) | £2.60\nUnder 5 | Free\nFamily (2 adults + 2 children) | £12.00",
					"why": "Under 5 那一行写着 Free。",
					"audio": null,
					"tags": [
						"short-answer"
					]
				},
				{
					"id": "1-4-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Car park charges: up to 2 hours – free; 2 to 4 hours – £3; over 4 hours – £8.",
					"question": "How much do you pay to park for three hours?",
					"options": [
						{
							"key": "A",
							"text": "£3"
						},
						{
							"key": "B",
							"text": "nothing"
						},
						{
							"key": "C",
							"text": "£8"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "too-hard",
						"C": "too-hard"
					},
					"evidence": "Car park charges: up to 2 hours – free; 2 to 4 hours – £3; over 4 hours – £8.",
					"why": "3 小时落在 2 到 4 小时这一档。",
					"audio": null,
					"tags": [
						"short-answer"
					]
				},
				{
					"id": "1-4-B-3",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": "NOTICE: The lift is out of order until Friday 14 June. Please use the stairs next to reception. We are sorry for any trouble this causes.",
					"question": "People should use the stairs next to ______.",
					"options": null,
					"chips": null,
					"answer": "reception",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "too-hard",
					"causes": null,
					"evidence": "NOTICE: The lift is out of order until Friday 14 June. Please use the stairs next to reception. We are sorry for any trouble this causes.",
					"why": "next to 后面就是位置。",
					"audio": null,
					"tags": [
						"short-answer"
					]
				},
				{
					"id": "1-4-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Book sale this Saturday, 10 am – 3 pm, in the school hall. Paperbacks 50p, hardbacks £1. All the money raised will pay for a new playground.",
					"question": "What will the money be used for?",
					"options": [
						{
							"key": "A",
							"text": "the school library"
						},
						{
							"key": "B",
							"text": "a new playground"
						},
						{
							"key": "C",
							"text": "repairs to the hall"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "too-hard",
						"C": "too-hard"
					},
					"evidence": "Book sale this Saturday, 10 am – 3 pm, in the school hall. Paperbacks 50p, hardbacks £1. All the money raised will pay for a new playground.",
					"why": "money raised will pay for 后面是用途。",
					"audio": null,
					"tags": [
						"short-answer"
					]
				},
				{
					"id": "1-4-B-5",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": "Riverside Café\nWeekdays | 7.30 – 18.00\nSaturday | 8.00 – 16.00\nSunday | 9.00 – 14.00",
					"question": "On Sundays the café opens at ______.",
					"options": null,
					"chips": null,
					"answer": "9",
					"accept": [
						"9.00",
						"9:00",
						"09.00",
						"09:00",
						"nine"
					],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "too-hard",
					"causes": null,
					"evidence": "Riverside Café\nWeekdays | 7.30 – 18.00\nSaturday | 8.00 – 16.00\nSunday | 9.00 – 14.00",
					"why": "找 Sunday 那一行，前一个是开门时间。",
					"audio": null,
					"tags": [
						"short-answer"
					]
				}
			]
		},
		{
			"id": "1-5",
			"kind": "level",
			"x": 120,
			"y": 300,
			"label": "1-5",
			"name": "对、错、没提到",
			"zh": "阅读 · TRUE / FALSE / NOT GIVEN 入门",
			"branch": "main",
			"practice": false,
			"skill": "reading",
			"type": "TFNG",
			"stations": [
				"2.2"
			],
			"hashtags": [
				"IELTS_2_2"
			],
			"gear": "vocab:5.4",
			"shelf": [
				"j9",
				"j5",
				"j7"
			],
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"pool": [
				{
					"id": "1-5-A-1",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "The community garden opened in 2019. Local families can rent a small plot for £25 a year. Water and basic tools are provided free of charge.",
					"question": "Gardeners have to buy their own tools.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "FALSE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"NOT GIVEN": "not-given"
					},
					"evidence": "The community garden opened in 2019. Local families can rent a small plot for £25 a year. Water and basic tools are provided free of charge.",
					"why": "原文说工具免费提供，和「要自己买」相反。",
					"audio": null,
					"tags": [
						"tfng"
					]
				},
				{
					"id": "1-5-A-2",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "The museum's new dinosaur room attracted over 40,000 visitors in its first month. Most of them were families with young children.",
					"question": "The dinosaur room is the museum's most popular exhibition.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "NOT GIVEN",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"FALSE": "not-given"
					},
					"evidence": "The museum's new dinosaur room attracted over 40,000 visitors in its first month. Most of them were families with young children.",
					"why": "只说来了 4 万人，没跟别的展比，所以是没提到。",
					"audio": null,
					"tags": [
						"tfng"
					]
				},
				{
					"id": "1-5-A-3",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "Students who join the language exchange meet a partner twice a week: once to practise English, and once to practise the partner's language.",
					"question": "Partners practise two different languages.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "TRUE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"FALSE": "same-word",
						"NOT GIVEN": "same-word"
					},
					"evidence": "Students who join the language exchange meet a partner twice a week: once to practise English, and once to practise the partner's language.",
					"why": "一次练英语、一次练对方的语言，就是两种语言。",
					"audio": null,
					"tags": [
						"tfng"
					]
				},
				{
					"id": "1-5-A-4",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "The town's first cinema was built in 1923. It closed in the 1970s, but the building still stands and is now a supermarket.",
					"question": "The cinema building was knocked down.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "FALSE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"NOT GIVEN": "not-given"
					},
					"evidence": "The town's first cinema was built in 1923. It closed in the 1970s, but the building still stands and is now a supermarket.",
					"why": "still stands 是「还在」，和「被拆了」相反。",
					"audio": null,
					"tags": [
						"tfng"
					]
				},
				{
					"id": "1-5-A-5",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "Volunteers at the animal shelter must be at least 16 years old. They work one four-hour shift each week.",
					"question": "Volunteers are paid for their work.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "NOT GIVEN",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"FALSE": "not-given"
					},
					"evidence": "Volunteers at the animal shelter must be at least 16 years old. They work one four-hour shift each week.",
					"why": "原文只讲年龄和班次，没说给不给钱。",
					"audio": null,
					"tags": [
						"tfng"
					]
				},
				{
					"id": "1-5-B-1",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "The night market runs every Friday from 6 pm to 11 pm. Around 60 stalls sell street food, clothes and handmade jewellery.",
					"question": "The market is open on Friday evenings.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "TRUE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"FALSE": "same-word",
						"NOT GIVEN": "same-word"
					},
					"evidence": "The night market runs every Friday from 6 pm to 11 pm. Around 60 stalls sell street food, clothes and handmade jewellery.",
					"why": "6 pm 到 11 pm 就是周五晚上。",
					"audio": null,
					"tags": [
						"tfng"
					]
				},
				{
					"id": "1-5-B-2",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "The night market has moved from the car park to the riverside, where there is more space for stalls.",
					"question": "The night market has more stalls than before.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "NOT GIVEN",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"FALSE": "not-given"
					},
					"evidence": "The night market has moved from the car park to the riverside, where there is more space for stalls.",
					"why": "空间大了，不等于摊位真的多了。",
					"audio": null,
					"tags": [
						"tfng"
					]
				},
				{
					"id": "1-5-B-3",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "All flights to the island were cancelled on Monday because of strong winds. Ferries, however, ran as normal.",
					"question": "Ferries were also cancelled on Monday.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "FALSE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"NOT GIVEN": "not-given"
					},
					"evidence": "All flights to the island were cancelled on Monday because of strong winds. Ferries, however, ran as normal.",
					"why": "however 引出相反情况：轮渡照常。",
					"audio": null,
					"tags": [
						"tfng"
					]
				},
				{
					"id": "1-5-B-4",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "The college offers evening classes in Spanish and Italian. A French class will be added next year if enough people are interested.",
					"question": "The college teaches French at the moment.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "FALSE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"NOT GIVEN": "not-given"
					},
					"evidence": "The college offers evening classes in Spanish and Italian. A French class will be added next year if enough people are interested.",
					"why": "法语课是「明年、而且要人够才开」，现在没有。",
					"audio": null,
					"tags": [
						"tfng"
					]
				},
				{
					"id": "1-5-B-5",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "A study followed 300 office workers for six months. Those who walked to work said they felt less tired in the afternoon.",
					"question": "Walking to work helped people sleep better at night.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "NOT GIVEN",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"FALSE": "not-given"
					},
					"evidence": "A study followed 300 office workers for six months. Those who walked to work said they felt less tired in the afternoon.",
					"why": "原文讲下午不那么累，没讲晚上睡眠。",
					"audio": null,
					"tags": [
						"tfng"
					]
				}
			]
		},
		{
			"id": "1-6",
			"kind": "level",
			"x": 170,
			"y": 170,
			"label": "1-6",
			"name": "换了说法",
			"zh": "阅读 · 题目换了说法的判断题",
			"branch": "main",
			"practice": false,
			"skill": "reading",
			"type": "TFNG",
			"stations": [
				"2.3"
			],
			"hashtags": [
				"IELTS_2_3"
			],
			"gear": "synonym-match:city",
			"shelf": [
				"j5",
				"j9",
				"j7"
			],
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"pool": [
				{
					"id": "1-6-A-1",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "Most visitors come to the island in summer, when the ferry runs every hour. In winter, the service is cut to two crossings a day.",
					"question": "The ferry runs less often in the colder months.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "TRUE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"FALSE": "same-word",
						"NOT GIVEN": "same-word"
					},
					"evidence": "Most visitors come to the island in summer, when the ferry runs every hour. In winter, the service is cut to two crossings a day.",
					"why": "colder months = winter，less often = 每天只有两班。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "1-6-A-2",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "Last year the city library extended its opening hours, because students asked for more space to study in the evening.",
					"question": "The library now stays open later than it used to.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "TRUE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"FALSE": "same-word",
						"NOT GIVEN": "same-word"
					},
					"evidence": "Last year the city library extended its opening hours, because students asked for more space to study in the evening.",
					"why": "extended its opening hours 换个说法就是开得更晚。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "1-6-A-3",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "Although the bridge was designed to last a century, engineers found serious cracks only forty years after it opened.",
					"question": "The bridge developed problems sooner than expected.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "TRUE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"FALSE": "same-word",
						"NOT GIVEN": "same-word"
					},
					"evidence": "Although the bridge was designed to last a century, engineers found serious cracks only forty years after it opened.",
					"why": "设计用 100 年，40 年就裂了，就是比预想的早。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "1-6-A-4",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "The supermarket cut the number of plastic bags it gave out by charging customers 10p for each one.",
					"question": "The supermarket stopped giving out plastic bags.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "FALSE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"NOT GIVEN": "not-given"
					},
					"evidence": "The supermarket cut the number of plastic bags it gave out by charging customers 10p for each one.",
					"why": "cut the number 是减少，不是停掉。",
					"audio": null,
					"tags": [
						"tfng"
					]
				},
				{
					"id": "1-6-A-5",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "The festival, which began as a small gathering of local musicians, now attracts performers from more than twenty countries.",
					"question": "The festival was started by a famous musician.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "NOT GIVEN",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"FALSE": "not-given"
					},
					"evidence": "The festival, which began as a small gathering of local musicians, now attracts performers from more than twenty countries.",
					"why": "只说一开始是本地乐手的小聚会，没说是谁办的。",
					"audio": null,
					"tags": [
						"tfng"
					]
				},
				{
					"id": "1-6-B-1",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "Few residents attended the meeting about the new road, so the council has decided to hold a second one online.",
					"question": "Attendance at the first meeting was low.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "TRUE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"FALSE": "same-word",
						"NOT GIVEN": "same-word"
					},
					"evidence": "Few residents attended the meeting about the new road, so the council has decided to hold a second one online.",
					"why": "few residents attended = attendance was low。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "1-6-B-2",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "Prices of fresh vegetables rose sharply last winter after heavy rain damaged crops in the south.",
					"question": "Bad weather led to an increase in vegetable prices.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "TRUE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"FALSE": "same-word",
						"NOT GIVEN": "same-word"
					},
					"evidence": "Prices of fresh vegetables rose sharply last winter after heavy rain damaged crops in the south.",
					"why": "heavy rain = bad weather，rose = increase。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "1-6-B-3",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "The new train line will cut the journey between the two cities from three hours to ninety minutes.",
					"question": "The journey will take half as long as before.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "TRUE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"FALSE": "same-word",
						"NOT GIVEN": "same-word"
					},
					"evidence": "The new train line will cut the journey between the two cities from three hours to ninety minutes.",
					"why": "3 小时变 90 分钟，正好一半。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "1-6-B-4",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "The researchers postponed the experiment because some of the equipment had not arrived.",
					"question": "The experiment was cancelled.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "FALSE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"NOT GIVEN": "not-given"
					},
					"evidence": "The researchers postponed the experiment because some of the equipment had not arrived.",
					"why": "postponed 是推迟，cancelled 是取消，不是一回事。",
					"audio": null,
					"tags": [
						"tfng"
					]
				},
				{
					"id": "1-6-B-5",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "Many employees prefer working from home, according to a survey of 2,000 office staff.",
					"question": "Most managers also prefer working from home.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "NOT GIVEN",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"FALSE": "not-given"
					},
					"evidence": "Many employees prefer working from home, according to a survey of 2,000 office staff.",
					"why": "调查的是员工，没提经理。",
					"audio": null,
					"tags": [
						"tfng"
					]
				}
			]
		},
		{
			"id": "1-7",
			"kind": "level",
			"x": 285,
			"y": 340,
			"label": "1-7",
			"name": "会认也会拼",
			"zh": "词汇 · 听一遍，拼出来",
			"branch": "vocab",
			"practice": false,
			"skill": "vocab",
			"type": "gap",
			"stations": [
				"5.1"
			],
			"hashtags": [
				"IELTS_5_1"
			],
			"gear": "dictation",
			"shelf": [
				"j1",
				"j6",
				"j2"
			],
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"pool": [
				{
					"id": "1-7-A-1",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The price includes ______ and meals.",
					"options": null,
					"chips": null,
					"answer": "accommodation",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"evidence": "accommodation. The price includes accommodation and meals. accommodation.",
					"why": "两个 c、两个 m。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "accommodation. The price includes accommodation and meals. accommodation."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "1-7-A-2",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "We should protect the ______.",
					"options": null,
					"chips": null,
					"answer": "environment",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"evidence": "environment. We should protect the environment. environment.",
					"why": "中间有个不发音的 n：environ-ment。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "environment. We should protect the environment. environment."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "1-7-A-3",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The class is on ______.",
					"options": null,
					"chips": null,
					"answer": "Wednesday",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"evidence": "Wednesday. The class is on Wednesday. Wednesday.",
					"why": "d 不发音，但要写：Wed-nes-day。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "Wednesday. The class is on Wednesday. Wednesday."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "1-7-A-4",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Is it ______ to book in advance?",
					"options": null,
					"chips": null,
					"answer": "necessary",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"evidence": "necessary. Is it necessary to book in advance? necessary.",
					"why": "一个 c、两个 s。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "necessary. Is it necessary to book in advance? necessary."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "1-7-A-5",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "We had lunch at a small ______.",
					"options": null,
					"chips": null,
					"answer": "restaurant",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"evidence": "restaurant. We had lunch at a small restaurant. restaurant.",
					"why": "中间是 -au-：restaurant。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "restaurant. We had lunch at a small restaurant. restaurant."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "1-7-B-1",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The ______ plans to build more homes.",
					"options": null,
					"chips": null,
					"answer": "government",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"evidence": "government. The government plans to build more homes. government.",
					"why": "中间的 n 不太发音：govern-ment。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "government. The government plans to build more homes. government."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "1-7-B-2",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The exam is in ______.",
					"options": null,
					"chips": null,
					"answer": "February",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"evidence": "February. The exam is in February. February.",
					"why": "第一个 r 常被吞掉：Feb-ru-ary。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "February. The exam is in February. February."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "1-7-B-3",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "I study at the ______ after work.",
					"options": null,
					"chips": null,
					"answer": "library",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"evidence": "library. I study at the library after work. library.",
					"why": "两个 r：li-brar-y。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "library. I study at the library after work. library."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "1-7-B-4",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The ______ of the film was slow.",
					"options": null,
					"chips": null,
					"answer": "beginning",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"evidence": "beginning. The beginning of the film was slow. beginning.",
					"why": "加 -ing 前双写 n：beginning。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "beginning. The beginning of the film was slow. beginning."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "1-7-B-5",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Please keep the two groups ______.",
					"options": null,
					"chips": null,
					"answer": "separate",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"evidence": "separate. Please keep the two groups separate. separate.",
					"why": "中间是 a：sep-a-rate。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "separate. Please keep the two groups separate. separate."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				}
			]
		},
		{
			"id": "1-8",
			"kind": "level",
			"x": 300,
			"y": 280,
			"label": "1-8",
			"name": "固定搭配",
			"zh": "词汇 · make / do / take 用哪个",
			"branch": "vocab",
			"practice": false,
			"skill": "vocab",
			"type": "choice",
			"stations": [
				"5.2"
			],
			"hashtags": [
				"IELTS_5_2"
			],
			"gear": "vocab:5.3",
			"shelf": [
				"j1",
				"j2",
				"j7"
			],
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"pool": [
				{
					"id": "1-8-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "I need to ______ a decision by Friday.",
					"options": [
						{
							"key": "A",
							"text": "do"
						},
						{
							"key": "B",
							"text": "have"
						},
						{
							"key": "C",
							"text": "make"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"B": "vocab"
					},
					"evidence": "I need to make a decision by Friday.",
					"why": "make a decision 是固定搭配。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "1-8-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Could you ______ me a favour?",
					"options": [
						{
							"key": "A",
							"text": "do"
						},
						{
							"key": "B",
							"text": "make"
						},
						{
							"key": "C",
							"text": "give"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "vocab",
						"C": "vocab"
					},
					"evidence": "Could you do me a favour?",
					"why": "do someone a favour，帮个忙。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "1-8-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "She ______ the exam last week and passed.",
					"options": [
						{
							"key": "A",
							"text": "made"
						},
						{
							"key": "B",
							"text": "took"
						},
						{
							"key": "C",
							"text": "played"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"C": "vocab"
					},
					"evidence": "She took the exam last week and passed.",
					"why": "take an exam，参加考试。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "1-8-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Please ______ attention to the instructions.",
					"options": [
						{
							"key": "A",
							"text": "give"
						},
						{
							"key": "B",
							"text": "put"
						},
						{
							"key": "C",
							"text": "pay"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"B": "vocab"
					},
					"evidence": "Please pay attention to the instructions.",
					"why": "pay attention to，注意。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "1-8-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "There was ______ rain last night, so the roads are wet.",
					"options": [
						{
							"key": "A",
							"text": "heavy"
						},
						{
							"key": "B",
							"text": "strong"
						},
						{
							"key": "C",
							"text": "big"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "vocab",
						"C": "vocab"
					},
					"evidence": "There was heavy rain last night, so the roads are wet.",
					"why": "大雨是 heavy rain，不说 strong rain。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "1-8-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "It is important to ______ a good impression at an interview.",
					"options": [
						{
							"key": "A",
							"text": "do"
						},
						{
							"key": "B",
							"text": "make"
						},
						{
							"key": "C",
							"text": "get"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"C": "vocab"
					},
					"evidence": "It is important to make a good impression at an interview.",
					"why": "make a good impression，留下好印象。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "1-8-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Please ______ a seat. The doctor will see you soon.",
					"options": [
						{
							"key": "A",
							"text": "sit"
						},
						{
							"key": "B",
							"text": "put"
						},
						{
							"key": "C",
							"text": "take"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"B": "vocab"
					},
					"evidence": "Please take a seat. The doctor will see you soon.",
					"why": "take a seat，请坐；sit 后面不直接跟 a seat。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "1-8-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "He is trying to ______ money for a new laptop.",
					"options": [
						{
							"key": "A",
							"text": "save"
						},
						{
							"key": "B",
							"text": "keep"
						},
						{
							"key": "C",
							"text": "hold"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "vocab",
						"C": "vocab"
					},
					"evidence": "He is trying to save money for a new laptop.",
					"why": "攒钱是 save money。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "1-8-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The traffic was ______, so I was late for work.",
					"options": [
						{
							"key": "A",
							"text": "strong"
						},
						{
							"key": "B",
							"text": "heavy"
						},
						{
							"key": "C",
							"text": "thick"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"C": "vocab"
					},
					"evidence": "The traffic was heavy, so I was late for work.",
					"why": "堵车是 heavy traffic。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "1-8-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "You should ______ notes during the lecture.",
					"options": [
						{
							"key": "A",
							"text": "make"
						},
						{
							"key": "B",
							"text": "write"
						},
						{
							"key": "C",
							"text": "take"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"B": "vocab"
					},
					"evidence": "You should take notes during the lecture.",
					"why": "上课记笔记常说 take notes。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				}
			]
		},
		{
			"id": "1-9",
			"kind": "level",
			"x": 290,
			"y": 220,
			"label": "1-9",
			"name": "近义说法",
			"zh": "词汇 · 同一个意思的另一种说法",
			"branch": "vocab",
			"practice": false,
			"skill": "vocab",
			"type": "choice",
			"stations": [
				"5.3"
			],
			"hashtags": [
				"IELTS_5_3"
			],
			"gear": "synonym-match:general",
			"shelf": [
				"j5",
				"j1",
				"j2"
			],
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"pool": [
				{
					"id": "1-9-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which word means the same as \"purchase\"?",
					"options": [
						{
							"key": "A",
							"text": "buy"
						},
						{
							"key": "B",
							"text": "sell"
						},
						{
							"key": "C",
							"text": "borrow"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "vocab",
						"C": "vocab"
					},
					"evidence": "Which word means the same as \"purchase\"?",
					"why": "purchase = buy，文章里常用 purchase，题目里换成 buy。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"paraphrase"
					]
				},
				{
					"id": "1-9-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which word means the same as \"assist\"?",
					"options": [
						{
							"key": "A",
							"text": "ask"
						},
						{
							"key": "B",
							"text": "help"
						},
						{
							"key": "C",
							"text": "accept"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"C": "vocab"
					},
					"evidence": "Which word means the same as \"assist\"?",
					"why": "assist = help。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"paraphrase"
					]
				},
				{
					"id": "1-9-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which word means the same as \"sufficient\"?",
					"options": [
						{
							"key": "A",
							"text": "expensive"
						},
						{
							"key": "B",
							"text": "special"
						},
						{
							"key": "C",
							"text": "enough"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"B": "vocab"
					},
					"evidence": "Which word means the same as \"sufficient\"?",
					"why": "sufficient = enough。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"paraphrase"
					]
				},
				{
					"id": "1-9-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which phrase means the same as \"postpone\"?",
					"options": [
						{
							"key": "A",
							"text": "put off"
						},
						{
							"key": "B",
							"text": "call off"
						},
						{
							"key": "C",
							"text": "take off"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "vocab",
						"C": "vocab"
					},
					"evidence": "Which phrase means the same as \"postpone\"?",
					"why": "postpone = put off（推迟）；call off 是取消。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"paraphrase"
					]
				},
				{
					"id": "1-9-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which word means the same as \"approximately\"?",
					"options": [
						{
							"key": "A",
							"text": "exactly"
						},
						{
							"key": "B",
							"text": "about"
						},
						{
							"key": "C",
							"text": "at least"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"C": "vocab"
					},
					"evidence": "Which word means the same as \"approximately\"?",
					"why": "approximately = about，大约。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"paraphrase"
					]
				},
				{
					"id": "1-9-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which word means the same as \"obtain\"?",
					"options": [
						{
							"key": "A",
							"text": "lose"
						},
						{
							"key": "B",
							"text": "keep"
						},
						{
							"key": "C",
							"text": "get"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"B": "vocab"
					},
					"evidence": "Which word means the same as \"obtain\"?",
					"why": "obtain = get。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"paraphrase"
					]
				},
				{
					"id": "1-9-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Prices declined last year. Which word means the same as \"declined\" here?",
					"options": [
						{
							"key": "A",
							"text": "fell"
						},
						{
							"key": "B",
							"text": "rose"
						},
						{
							"key": "C",
							"text": "stayed the same"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "vocab",
						"C": "vocab"
					},
					"evidence": "Prices declined last year. Which word means the same as \"declined\" here?",
					"why": "说价格时 decline = fall，下降。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"paraphrase"
					]
				},
				{
					"id": "1-9-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which word means the same as \"major\" in \"a major problem\"?",
					"options": [
						{
							"key": "A",
							"text": "small"
						},
						{
							"key": "B",
							"text": "main"
						},
						{
							"key": "C",
							"text": "later"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"C": "vocab"
					},
					"evidence": "Which word means the same as \"major\" in \"a major problem\"?",
					"why": "major = main / serious，主要的。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"paraphrase"
					]
				},
				{
					"id": "1-9-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which word means the same as \"attempt\"?",
					"options": [
						{
							"key": "A",
							"text": "win"
						},
						{
							"key": "B",
							"text": "refuse"
						},
						{
							"key": "C",
							"text": "try"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"B": "vocab"
					},
					"evidence": "Which word means the same as \"attempt\"?",
					"why": "attempt = try。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"paraphrase"
					]
				},
				{
					"id": "1-9-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which phrase means the same as \"residents\"?",
					"options": [
						{
							"key": "A",
							"text": "people who live in a place"
						},
						{
							"key": "B",
							"text": "people who visit a place"
						},
						{
							"key": "C",
							"text": "people who work in a place"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "vocab",
						"C": "vocab"
					},
					"evidence": "Which phrase means the same as \"residents\"?",
					"why": "residents 是住在那儿的人，不是游客。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"paraphrase"
					]
				}
			]
		},
		{
			"id": "1-10",
			"kind": "level",
			"x": 40,
			"y": 320,
			"label": "1-10",
			"name": "句子主干",
			"zh": "语法 · 把词块排成句子",
			"branch": "grammar",
			"practice": false,
			"skill": "grammar",
			"type": "build",
			"stations": [
				"6.1"
			],
			"hashtags": [
				"IELTS_6_1"
			],
			"gear": "grammar:6.1",
			"shelf": [
				"j10",
				"j3",
				"j7"
			],
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"pool": [
				{
					"id": "1-10-A-1",
					"set": "A",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "很多学生在图书馆学习。",
					"options": null,
					"chips": [
						"study",
						"many students",
						"in the library"
					],
					"answer": "many students study in the library",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"evidence": "many students study in the library",
					"why": "主语 many students + 谓语 study，地点放最后。",
					"audio": null,
					"tags": [
						"g-core"
					]
				},
				{
					"id": "1-10-A-2",
					"set": "A",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "我哥哥在一家银行工作。",
					"options": null,
					"chips": [
						"works",
						"my brother",
						"at a bank"
					],
					"answer": "my brother works at a bank",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"evidence": "my brother works at a bank",
					"why": "主语是单数 my brother，动词加 s。",
					"audio": null,
					"tags": [
						"g-agree"
					]
				},
				{
					"id": "1-10-A-3",
					"set": "A",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "这座城市有两座博物馆。",
					"options": null,
					"chips": [
						"two museums",
						"there are",
						"in this city"
					],
					"answer": "there are two museums in this city",
					"accept": [
						"in this city there are two museums"
					],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"evidence": "there are two museums in this city",
					"why": "「某地有某物」用 there are，不用 have。",
					"audio": null,
					"tags": [
						"g-there"
					]
				},
				{
					"id": "1-10-A-4",
					"set": "A",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "公交车每天早上七点出发。",
					"options": null,
					"chips": [
						"leaves",
						"the bus",
						"at seven",
						"every morning"
					],
					"answer": "the bus leaves at seven every morning",
					"accept": [
						"every morning the bus leaves at seven",
						"the bus leaves every morning at seven"
					],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"evidence": "the bus leaves at seven every morning",
					"why": "先主语 the bus，再谓语 leaves，时间放后面。",
					"audio": null,
					"tags": [
						"g-core"
					]
				},
				{
					"id": "1-10-A-5",
					"set": "A",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "她昨天给我发了一封邮件。",
					"options": null,
					"chips": [
						"sent",
						"she",
						"me",
						"an email",
						"yesterday"
					],
					"answer": "she sent me an email yesterday",
					"accept": [
						"yesterday she sent me an email"
					],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"evidence": "she sent me an email yesterday",
					"why": "send 后面先人后物：sent me an email。",
					"audio": null,
					"tags": [
						"g-core"
					]
				},
				{
					"id": "1-10-B-1",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "我的室友每天做饭。",
					"options": null,
					"chips": [
						"cooks",
						"my flatmate",
						"every day"
					],
					"answer": "my flatmate cooks every day",
					"accept": [
						"every day my flatmate cooks"
					],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"evidence": "my flatmate cooks every day",
					"why": "主语 my flatmate + 谓语 cooks。",
					"audio": null,
					"tags": [
						"g-core"
					]
				},
				{
					"id": "1-10-B-2",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "那家商店卖新鲜水果。",
					"options": null,
					"chips": [
						"sells",
						"that shop",
						"fresh fruit"
					],
					"answer": "that shop sells fresh fruit",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"evidence": "that shop sells fresh fruit",
					"why": "主谓宾：that shop / sells / fresh fruit。",
					"audio": null,
					"tags": [
						"g-core"
					]
				},
				{
					"id": "1-10-B-3",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "公园里有很多树。",
					"options": null,
					"chips": [
						"are",
						"there",
						"many trees",
						"in the park"
					],
					"answer": "there are many trees in the park",
					"accept": [
						"in the park there are many trees"
					],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"evidence": "there are many trees in the park",
					"why": "there are + 复数名词。",
					"audio": null,
					"tags": [
						"g-there"
					]
				},
				{
					"id": "1-10-B-4",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "我们周末看了一场电影。",
					"options": null,
					"chips": [
						"watched",
						"we",
						"a film",
						"at the weekend"
					],
					"answer": "we watched a film at the weekend",
					"accept": [
						"at the weekend we watched a film"
					],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"evidence": "we watched a film at the weekend",
					"why": "过去的事用 watched。",
					"audio": null,
					"tags": [
						"g-core"
					]
				},
				{
					"id": "1-10-B-5",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "这门课帮学生提高写作。",
					"options": null,
					"chips": [
						"helps",
						"this course",
						"students",
						"improve their writing"
					],
					"answer": "this course helps students improve their writing",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"evidence": "this course helps students improve their writing",
					"why": "help 某人 do 某事：helps students improve。",
					"audio": null,
					"tags": [
						"g-core"
					]
				}
			]
		},
		{
			"id": "1-11",
			"kind": "level",
			"x": 40,
			"y": 250,
			"label": "1-11",
			"name": "单数复数和时态",
			"zh": "语法 · 动词跟着主语和时间变",
			"branch": "grammar",
			"practice": false,
			"skill": "grammar",
			"type": "choice",
			"stations": [
				"6.2"
			],
			"hashtags": [
				"IELTS_6_2"
			],
			"gear": "grammar:6.2",
			"shelf": [
				"j10",
				"j3",
				"j7"
			],
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"pool": [
				{
					"id": "1-11-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Every student ______ a library card.",
					"options": [
						{
							"key": "A",
							"text": "have"
						},
						{
							"key": "B",
							"text": "has"
						},
						{
							"key": "C",
							"text": "having"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"C": "grammar"
					},
					"evidence": "Every student has a library card.",
					"why": "every + 单数名词，动词用单数 has。",
					"audio": null,
					"tags": [
						"g-agree"
					]
				},
				{
					"id": "1-11-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The number of cars in the city ______ grown quickly.",
					"options": [
						{
							"key": "A",
							"text": "have"
						},
						{
							"key": "B",
							"text": "are"
						},
						{
							"key": "C",
							"text": "has"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"B": "grammar"
					},
					"evidence": "The number of cars in the city has grown quickly.",
					"why": "主语是 the number（数量），单数，用 has。",
					"audio": null,
					"tags": [
						"g-agree"
					]
				},
				{
					"id": "1-11-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "I ______ in Beijing since 2020.",
					"options": [
						{
							"key": "A",
							"text": "have lived"
						},
						{
							"key": "B",
							"text": "live"
						},
						{
							"key": "C",
							"text": "lived"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "grammar",
						"C": "grammar"
					},
					"evidence": "I have lived in Beijing since 2020.",
					"why": "since 2020 一直到现在，用现在完成时。",
					"audio": null,
					"tags": [
						"g-perfect"
					]
				},
				{
					"id": "1-11-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Last summer we ______ to Qingdao by train.",
					"options": [
						{
							"key": "A",
							"text": "go"
						},
						{
							"key": "B",
							"text": "went"
						},
						{
							"key": "C",
							"text": "have gone"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"C": "grammar"
					},
					"evidence": "Last summer we went to Qingdao by train.",
					"why": "last summer 是过去的时间，用过去时 went。",
					"audio": null,
					"tags": [
						"g-past"
					]
				},
				{
					"id": "1-11-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Information about the course ______ on the website.",
					"options": [
						{
							"key": "A",
							"text": "are"
						},
						{
							"key": "B",
							"text": "were"
						},
						{
							"key": "C",
							"text": "is"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"B": "grammar"
					},
					"evidence": "Information about the course is on the website.",
					"why": "information 不可数，用 is。",
					"audio": null,
					"tags": [
						"g-agree"
					]
				},
				{
					"id": "1-11-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "My parents ______ in a small town.",
					"options": [
						{
							"key": "A",
							"text": "live"
						},
						{
							"key": "B",
							"text": "lives"
						},
						{
							"key": "C",
							"text": "living"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "grammar",
						"C": "grammar"
					},
					"evidence": "My parents live in a small town.",
					"why": "parents 是复数，动词不加 s。",
					"audio": null,
					"tags": [
						"g-agree"
					]
				},
				{
					"id": "1-11-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "There ______ a lot of people at the station yesterday.",
					"options": [
						{
							"key": "A",
							"text": "was"
						},
						{
							"key": "B",
							"text": "were"
						},
						{
							"key": "C",
							"text": "is"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"C": "grammar"
					},
					"evidence": "There were a lot of people at the station yesterday.",
					"why": "people 是复数，yesterday 是过去，用 were。",
					"audio": null,
					"tags": [
						"g-agree",
						"g-past"
					]
				},
				{
					"id": "1-11-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "She usually ______ the bus to work.",
					"options": [
						{
							"key": "A",
							"text": "take"
						},
						{
							"key": "B",
							"text": "is taking"
						},
						{
							"key": "C",
							"text": "takes"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"B": "grammar"
					},
					"evidence": "She usually takes the bus to work.",
					"why": "usually 说习惯，用一般现在时，she 后面加 s。",
					"audio": null,
					"tags": [
						"g-now",
						"g-agree"
					]
				},
				{
					"id": "1-11-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "By the time we arrived, the film ______.",
					"options": [
						{
							"key": "A",
							"text": "had started"
						},
						{
							"key": "B",
							"text": "started"
						},
						{
							"key": "C",
							"text": "has started"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "grammar",
						"C": "grammar"
					},
					"evidence": "By the time we arrived, the film had started.",
					"why": "电影开始在「我们到」之前，过去的过去用 had started。",
					"audio": null,
					"tags": [
						"g-perfect"
					]
				},
				{
					"id": "1-11-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Each of the rooms ______ its own bathroom.",
					"options": [
						{
							"key": "A",
							"text": "have"
						},
						{
							"key": "B",
							"text": "has"
						},
						{
							"key": "C",
							"text": "are having"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"C": "grammar"
					},
					"evidence": "Each of the rooms has its own bathroom.",
					"why": "each of … 主语是 each，单数，用 has。",
					"audio": null,
					"tags": [
						"g-agree"
					]
				}
			]
		},
		{
			"id": "1-12",
			"kind": "level",
			"x": 45,
			"y": 180,
			"label": "1-12",
			"name": "被动语态",
			"zh": "语法 · 东西「被」做了",
			"branch": "grammar",
			"practice": false,
			"skill": "grammar",
			"type": "choice",
			"stations": [
				"6.3"
			],
			"hashtags": [
				"IELTS_6_3"
			],
			"gear": "grammar:6.3",
			"shelf": [
				"j10",
				"j3",
				"j7"
			],
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"pool": [
				{
					"id": "1-12-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The museum ______ in 1923.",
					"options": [
						{
							"key": "A",
							"text": "built"
						},
						{
							"key": "B",
							"text": "has built"
						},
						{
							"key": "C",
							"text": "was built"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"B": "grammar"
					},
					"evidence": "The museum was built in 1923.",
					"why": "博物馆是「被建」的，过去的事：was + built。",
					"audio": null,
					"tags": [
						"g-pv-form"
					]
				},
				{
					"id": "1-12-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "English ______ in many countries.",
					"options": [
						{
							"key": "A",
							"text": "is spoken"
						},
						{
							"key": "B",
							"text": "speaks"
						},
						{
							"key": "C",
							"text": "is speaking"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "grammar",
						"C": "grammar"
					},
					"evidence": "English is spoken in many countries.",
					"why": "英语是被人说的：is + spoken。",
					"audio": null,
					"tags": [
						"g-pv-form"
					]
				},
				{
					"id": "1-12-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The results will ______ next week.",
					"options": [
						{
							"key": "A",
							"text": "announce"
						},
						{
							"key": "B",
							"text": "be announced"
						},
						{
							"key": "C",
							"text": "announced"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"C": "grammar"
					},
					"evidence": "The results will be announced next week.",
					"why": "将来的被动：will be + 过去分词。",
					"audio": null,
					"tags": [
						"g-pv-tense"
					]
				},
				{
					"id": "1-12-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The windows ______ every Friday.",
					"options": [
						{
							"key": "A",
							"text": "clean"
						},
						{
							"key": "B",
							"text": "are cleaning"
						},
						{
							"key": "C",
							"text": "are cleaned"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"B": "grammar"
					},
					"evidence": "The windows are cleaned every Friday.",
					"why": "窗户是被擦的，每周的习惯用 are cleaned。",
					"audio": null,
					"tags": [
						"g-pv-form"
					]
				},
				{
					"id": "1-12-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The bridge is being repaired.\n这句话是什么意思？",
					"options": [
						{
							"key": "A",
							"text": "Someone is repairing the bridge now."
						},
						{
							"key": "B",
							"text": "The bridge is repairing itself."
						},
						{
							"key": "C",
							"text": "The repairs are finished."
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "grammar",
						"C": "grammar"
					},
					"evidence": "The bridge is being repaired.\n这句话是什么意思？",
					"why": "is being repaired = 正在被修，还没修完。",
					"audio": null,
					"tags": [
						"g-pv-form"
					]
				},
				{
					"id": "1-12-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The letter ______ yesterday.",
					"options": [
						{
							"key": "A",
							"text": "sent"
						},
						{
							"key": "B",
							"text": "was sent"
						},
						{
							"key": "C",
							"text": "was send"
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"C": "grammar"
					},
					"evidence": "The letter was sent yesterday.",
					"why": "信是被寄的，yesterday 用 was + sent；send 要变成 sent。",
					"audio": null,
					"tags": [
						"g-pv-form"
					]
				},
				{
					"id": "1-12-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Breakfast ______ from 7 to 10 am.",
					"options": [
						{
							"key": "A",
							"text": "serves"
						},
						{
							"key": "B",
							"text": "is serving"
						},
						{
							"key": "C",
							"text": "is served"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"B": "grammar"
					},
					"evidence": "Breakfast is served from 7 to 10 am.",
					"why": "早餐是被供应的：is served。",
					"audio": null,
					"tags": [
						"g-pv-form"
					]
				},
				{
					"id": "1-12-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "A new road ______ next year.",
					"options": [
						{
							"key": "A",
							"text": "will be built"
						},
						{
							"key": "B",
							"text": "will build"
						},
						{
							"key": "C",
							"text": "builds"
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "grammar",
						"C": "grammar"
					},
					"evidence": "A new road will be built next year.",
					"why": "路是被修的，明年：will be built。",
					"audio": null,
					"tags": [
						"g-pv-tense"
					]
				},
				{
					"id": "1-12-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "All the tickets have already been sold.\n这句话是什么意思？",
					"options": [
						{
							"key": "A",
							"text": "You can still buy a ticket."
						},
						{
							"key": "B",
							"text": "There are no tickets left."
						},
						{
							"key": "C",
							"text": "They are selling tickets now."
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"C": "grammar"
					},
					"evidence": "All the tickets have already been sold.\n这句话是什么意思？",
					"why": "have been sold 是已经卖完了。",
					"audio": null,
					"tags": [
						"g-pv-form"
					]
				},
				{
					"id": "1-12-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "This photo ______ by my sister.",
					"options": [
						{
							"key": "A",
							"text": "took"
						},
						{
							"key": "B",
							"text": "was took"
						},
						{
							"key": "C",
							"text": "was taken"
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"B": "grammar"
					},
					"evidence": "This photo was taken by my sister.",
					"why": "by my sister 说明是被拍的：was + taken（不是 took）。",
					"audio": null,
					"tags": [
						"g-pv-form"
					]
				}
			]
		},
		{
			"id": "boss",
			"kind": "boss",
			"x": 195,
			"y": 90,
			"label": "Boss",
			"name": "换装者",
			"zh": "Boss · 同一个意思换了身衣服（听力 + 阅读）",
			"branch": "main",
			"practice": false,
			"skill": "mixed",
			"type": "mixed",
			"stations": [
				"1.4",
				"2.4"
			],
			"hashtags": [
				"IELTS_1_4",
				"IELTS_2_4"
			],
			"gear": "synonym-match:general",
			"shelf": [
				"j5",
				"j4",
				"j9"
			],
			"heartCost": 1,
			"ask": 6,
			"need": 5,
			"maxWrong": 2,
			"sets": [
				"A",
				"B",
				"C"
			],
			"retest": false,
			"pool": [
				{
					"id": "boss-A-1",
					"set": "A",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "哪一句跟你听到的意思一样？",
					"options": [
						{
							"key": "A",
							"text": "The concert has been postponed."
						},
						{
							"key": "B",
							"text": "The concert has been cancelled."
						},
						{
							"key": "C",
							"text": "The concert was put on last month."
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "same-word",
						"C": "same-word"
					},
					"evidence": "Because of the storm, the concert has been put off until next month.",
					"why": "put off = postponed；put on 只是长得像。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Because of the storm, the concert has been put off until next month."
							}
						]
					},
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-A-2",
					"set": "A",
					"type": "TFNG",
					"skill": "reading",
					"passage": "The museum offers free entry to visitors under 18 on weekdays.",
					"question": "Teenagers do not have to pay to visit the museum from Monday to Friday.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "TRUE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"FALSE": "same-word",
						"NOT GIVEN": "same-word"
					},
					"evidence": "The museum offers free entry to visitors under 18 on weekdays.",
					"why": "under 18 ≈ teenagers，free = do not have to pay，weekdays = Monday to Friday。",
					"audio": null,
					"tags": [
						"paraphrase"
					]
				},
				{
					"id": "boss-A-3",
					"set": "A",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "哪一句跟你听到的意思一样？",
					"options": [
						{
							"key": "A",
							"text": "Lots of students signed up."
						},
						{
							"key": "B",
							"text": "Very few students signed up."
						},
						{
							"key": "C",
							"text": "Students had to sign by hand."
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "same-word",
						"C": "same-word"
					},
					"evidence": "Only a handful of students signed up for the trip.",
					"why": "a handful of = very few；hand 是陷阱。",
					"audio": {
						"voices": {
							"N": "us-sarah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Only a handful of students signed up for the trip."
							}
						]
					},
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-A-4",
					"set": "A",
					"type": "TFNG",
					"skill": "reading",
					"passage": "Sales of electric bikes doubled between 2021 and 2023.",
					"question": "Twice as many electric bikes were sold in 2023 as in 2021.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "TRUE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"FALSE": "same-word",
						"NOT GIVEN": "same-word"
					},
					"evidence": "Sales of electric bikes doubled between 2021 and 2023.",
					"why": "doubled = twice as many。",
					"audio": null,
					"tags": [
						"paraphrase"
					]
				},
				{
					"id": "boss-A-5",
					"set": "A",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "哪一句跟你听到的意思一样？",
					"options": [
						{
							"key": "A",
							"text": "The early train is always late."
						},
						{
							"key": "B",
							"text": "He packed his bag for the early train."
						},
						{
							"key": "C",
							"text": "The early train is always crowded."
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "same-word",
						"B": "same-word"
					},
					"evidence": "I'd rather not take the early train. It's always packed.",
					"why": "packed 说车厢时是「挤满了」= crowded。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "I'd rather not take the early train. It's always packed."
							}
						]
					},
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-A-6",
					"set": "A",
					"type": "TFNG",
					"skill": "reading",
					"passage": "The café has replaced its plastic cups with paper ones.",
					"question": "The café no longer uses any disposable cups.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "FALSE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"NOT GIVEN": "not-given"
					},
					"evidence": "The café has replaced its plastic cups with paper ones.",
					"why": "纸杯也是一次性的，只是换了材料。",
					"audio": null,
					"tags": [
						"paraphrase"
					]
				},
				{
					"id": "boss-B-1",
					"set": "B",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "哪一句跟你听到的意思一样？",
					"options": [
						{
							"key": "A",
							"text": "The library now closes later."
						},
						{
							"key": "B",
							"text": "The library is now open for ten hours."
						},
						{
							"key": "C",
							"text": "The library now opens at ten."
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "same-word",
						"C": "same-word"
					},
					"evidence": "The library's opening hours have been extended until ten at night.",
					"why": "extended until ten at night = 关门更晚。",
					"audio": {
						"voices": {
							"N": "us-sarah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "The library's opening hours have been extended until ten at night."
							}
						]
					},
					"tags": [
						"paraphrase"
					]
				},
				{
					"id": "boss-B-2",
					"set": "B",
					"type": "TFNG",
					"skill": "reading",
					"passage": "The council plans to reduce the speed limit near schools.",
					"question": "The speed limit near schools has already been lowered.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "FALSE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"NOT GIVEN": "not-given"
					},
					"evidence": "The council plans to reduce the speed limit near schools.",
					"why": "plans to 是打算，还没做。",
					"audio": null,
					"tags": [
						"paraphrase"
					]
				},
				{
					"id": "boss-B-3",
					"set": "B",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "哪一句跟你听到的意思一样？",
					"options": [
						{
							"key": "A",
							"text": "The evening classes start later now."
						},
						{
							"key": "B",
							"text": "Fewer people go to the evening classes now."
						},
						{
							"key": "C",
							"text": "More people are paying the fees."
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "same-word",
						"C": "same-word"
					},
					"evidence": "Attendance at the evening classes has dropped since the fees went up.",
					"why": "attendance has dropped = fewer people go。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Attendance at the evening classes has dropped since the fees went up."
							}
						]
					},
					"tags": [
						"paraphrase"
					]
				},
				{
					"id": "boss-B-4",
					"set": "B",
					"type": "TFNG",
					"skill": "reading",
					"passage": "Most of the hotel's guests are business travellers.",
					"question": "The majority of people who stay at the hotel are travelling for work.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "TRUE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"FALSE": "same-word",
						"NOT GIVEN": "same-word"
					},
					"evidence": "Most of the hotel's guests are business travellers.",
					"why": "most = the majority，business travellers = travelling for work。",
					"audio": null,
					"tags": [
						"paraphrase"
					]
				},
				{
					"id": "boss-B-5",
					"set": "B",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "哪一句跟你听到的意思一样？",
					"options": [
						{
							"key": "A",
							"text": "Show your ticket at the exit."
						},
						{
							"key": "B",
							"text": "Fill in a form at the entrance."
						},
						{
							"key": "C",
							"text": "Bring something that shows who you are."
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "same-word",
						"B": "same-word"
					},
					"evidence": "You'll need to show some form of ID at the entrance.",
					"why": "ID 是身份证明；form of 是「某种」，不是表格。",
					"audio": {
						"voices": {
							"N": "us-sarah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "You'll need to show some form of ID at the entrance."
							}
						]
					},
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-B-6",
					"set": "B",
					"type": "TFNG",
					"skill": "reading",
					"passage": "The bridge was closed for repairs for six weeks last spring.",
					"question": "The repairs cost more than expected.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "NOT GIVEN",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"FALSE": "not-given"
					},
					"evidence": "The bridge was closed for repairs for six weeks last spring.",
					"why": "只说修了六周，没提花了多少钱。",
					"audio": null,
					"tags": [
						"tfng"
					]
				},
				{
					"id": "boss-C-1",
					"set": "C",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "哪一句跟你听到的意思一样？",
					"options": [
						{
							"key": "A",
							"text": "The new hall is much larger."
						},
						{
							"key": "B",
							"text": "The new hall is far away."
						},
						{
							"key": "C",
							"text": "The old hall was bigger."
						}
					],
					"chips": null,
					"answer": "A",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "same-word",
						"C": "same-word"
					},
					"evidence": "The new sports hall is far bigger than the old one.",
					"why": "far bigger = much larger；far 在这里不是「远」。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "The new sports hall is far bigger than the old one."
							}
						]
					},
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-C-2",
					"set": "C",
					"type": "TFNG",
					"skill": "reading",
					"passage": "Volunteers are not required to have any previous experience.",
					"question": "People with no experience can volunteer.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "TRUE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"FALSE": "same-word",
						"NOT GIVEN": "same-word"
					},
					"evidence": "Volunteers are not required to have any previous experience.",
					"why": "not required to have experience = 没经验也行。",
					"audio": null,
					"tags": [
						"paraphrase"
					]
				},
				{
					"id": "boss-C-3",
					"set": "C",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "哪一句跟你听到的意思一样？",
					"options": [
						{
							"key": "A",
							"text": "The manager turned the request over."
						},
						{
							"key": "B",
							"text": "The manager refused the request."
						},
						{
							"key": "C",
							"text": "The manager lowered my pay."
						}
					],
					"chips": null,
					"answer": "B",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "same-word",
						"C": "same-word"
					},
					"evidence": "My manager turned down my request for a day off.",
					"why": "turn down a request = refuse；down 不是降工资。",
					"audio": {
						"voices": {
							"N": "us-sarah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "My manager turned down my request for a day off."
							}
						]
					},
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-C-4",
					"set": "C",
					"type": "TFNG",
					"skill": "reading",
					"passage": "The number of international students at the university has fallen slightly.",
					"question": "There has been a sharp drop in international students.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "FALSE",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"NOT GIVEN": "not-given"
					},
					"evidence": "The number of international students at the university has fallen slightly.",
					"why": "slightly 是稍微，sharp 是大幅，程度相反。",
					"audio": null,
					"tags": [
						"paraphrase"
					]
				},
				{
					"id": "boss-C-5",
					"set": "C",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "哪一句跟你听到的意思一样？",
					"options": [
						{
							"key": "A",
							"text": "Essays can be handed in after Friday."
						},
						{
							"key": "B",
							"text": "Essays must be handwritten on Friday."
						},
						{
							"key": "C",
							"text": "Essays must be in by Friday."
						}
					],
					"chips": null,
					"answer": "C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "same-word",
						"B": "same-word"
					},
					"evidence": "Please hand in your essays no later than Friday.",
					"why": "no later than Friday = by Friday。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Please hand in your essays no later than Friday."
							}
						]
					},
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-C-6",
					"set": "C",
					"type": "TFNG",
					"skill": "reading",
					"passage": "The park is popular with dog owners in the early morning.",
					"question": "Dogs are not allowed in the park after 10 am.",
					"options": [
						{
							"key": "TRUE",
							"text": "TRUE"
						},
						{
							"key": "FALSE",
							"text": "FALSE"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "NOT GIVEN",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"TRUE": "same-word",
						"FALSE": "not-given"
					},
					"evidence": "The park is popular with dog owners in the early morning.",
					"why": "只说早上遛狗的人多，没说几点以后不许进。",
					"audio": null,
					"tags": [
						"tfng"
					]
				}
			]
		},
		{
			"id": "gear",
			"kind": "gear",
			"x": 300,
			"y": 490,
			"label": "装备站",
			"name": "装备站",
			"zh": "去小程序练一组，补 1 颗心",
			"branch": "station",
			"practice": false,
			"skill": null,
			"type": null,
			"stations": [],
			"hashtags": [],
			"gear": "dictation",
			"shelf": [],
			"heartCost": 0,
			"ask": null,
			"need": null,
			"maxWrong": null,
			"sets": [],
			"retest": false,
			"pool": null
		},
		{
			"id": "intel",
			"kind": "news",
			"x": 305,
			"y": 395,
			"label": "情报站",
			"name": "情报站",
			"zh": "看社区里的情报帖（不补心，Boss 备战要看 1 篇）",
			"branch": "station",
			"practice": false,
			"skill": null,
			"type": null,
			"stations": [],
			"hashtags": [
				"IELTS_1_4",
				"IELTS_2_4"
			],
			"gear": null,
			"shelf": [],
			"heartCost": 0,
			"ask": null,
			"need": null,
			"maxWrong": null,
			"sets": [],
			"retest": false,
			"pool": null
		},
		{
			"id": "shelf",
			"kind": "shelf",
			"x": 200,
			"y": 250,
			"label": "锦囊书屋",
			"name": "锦囊书屋",
			"zh": "读一本锦囊、做 3 题对 2 题，补 1 颗心",
			"branch": "station",
			"practice": false,
			"skill": null,
			"type": null,
			"stations": [],
			"hashtags": [],
			"gear": null,
			"shelf": [],
			"heartCost": 0,
			"ask": null,
			"need": null,
			"maxWrong": null,
			"sets": [],
			"retest": false,
			"pool": null
		}
	],
	"edges": [
		[
			"start",
			"1-1",
			"main"
		],
		[
			"1-1",
			"1-2",
			"main"
		],
		[
			"1-2",
			"1-3",
			"main"
		],
		[
			"1-3",
			"1-4",
			"main"
		],
		[
			"1-4",
			"1-5",
			"main"
		],
		[
			"1-5",
			"1-6",
			"main"
		],
		[
			"1-6",
			"boss",
			"main"
		],
		[
			"1-3",
			"1-7",
			"vocab"
		],
		[
			"1-7",
			"1-8",
			"vocab"
		],
		[
			"1-8",
			"1-9",
			"vocab"
		],
		[
			"1-9",
			"1-6",
			"vocab"
		],
		[
			"1-4",
			"1-10",
			"grammar"
		],
		[
			"1-10",
			"1-11",
			"grammar"
		],
		[
			"1-11",
			"1-12",
			"grammar"
		],
		[
			"1-1",
			"gear",
			"station"
		],
		[
			"1-3",
			"intel",
			"station"
		],
		[
			"1-5",
			"shelf",
			"station"
		]
	]
};
