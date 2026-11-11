/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关第4章：地图、关卡、题库（138 题，全部原创）和规则数字。版本 ch4-2026-11-11h。
// 由 apps/community/scripts/quest-chapter.mjs 从路线图的「关卡数据」（chapter-4.json、questions/*.json、numbers.json）生成，不要手改。
// 答案、accept、evidence、录音稿只在服务器上：页面拿到的题目不带这些，作答由 lojo/quest/answer 判。
// 坐标是 390 宽、600 高画布里的位置。难度是「练习难度」，不是官方分数。

import type { QuestCause, QuestChapter } from '@/misc/lojo-quest-types.js';

export type { QuestAudio, QuestCause, QuestChapter, QuestNode, QuestNodeKind, QuestQuestion, QuestRules, QuestTimed } from '@/misc/lojo-quest-types.js';

export const QUEST_CH4: QuestChapter = {
	"id": "ielts-c4",
	"no": 4,
	"version": "ch4-2026-11-11h",
	"title": "第四章 · 提速",
	"band": "练习难度 6.5–7.0",
	"disclaimer": "练习难度，不是官方分数",
	"bossId": "4-boss",
	"startId": "4-start",
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
			"note": "4-3 之后可以不走阅读，走词汇绕到 4-6；两条路过任一条都能进 4-6"
		},
		"grammar": {
			"zh": "语法支线",
			"note": "4-4 之后开，不挡主线；4-12 过了开支线宝箱"
		},
		"station": {
			"zh": "站点",
			"note": "不是关卡，路过就开"
		}
	},
	"nodes": [
		{
			"practice": false,
			"skill": null,
			"type": null,
			"stations": [],
			"hashtags": [],
			"gear": null,
			"heartGear": null,
			"gearGivesHeart": false,
			"gearButton": null,
			"heartButton": null,
			"shelf": [],
			"causeGuide": null,
			"heartCost": 0,
			"ask": null,
			"need": null,
			"maxWrong": null,
			"sets": [],
			"retest": false,
			"keepOrder": false,
			"timed": null,
			"pool": null,
			"id": "4-start",
			"ch": 4,
			"kind": "start",
			"x": 195,
			"y": 570,
			"label": "起点",
			"name": null,
			"zh": null,
			"branch": "main"
		},
		{
			"practice": true,
			"skill": "listening",
			"type": "choice",
			"stations": [
				"1.8"
			],
			"hashtags": [
				"IELTS_1_8"
			],
			"gear": "dictation",
			"heartGear": "dictation",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j26",
				"j28",
				"j4"
			],
			"causeGuide": null,
			"heartCost": 0,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"keepOrder": false,
			"timed": null,
			"pool": [
				{
					"id": "4-1-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What will the speaker talk about second?",
					"options": [
						{
							"key": "A",
							"text": "how bees first came into cities"
						},
						{
							"key": "B",
							"text": "lessons from keepers in Harwick"
						},
						{
							"key": "C",
							"text": "the dangers facing the bees"
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
						"A": "signpost",
						"B": "signpost"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "then, the main risks to the bees themselves",
					"why": "then 是第二站。main risks = dangers；history 是第一站，Harwick 是最后。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Good morning. Today I want to look at urban beekeeping, and I'll do this in three stages. First, a short history of how bees came into cities; then, the main risks to the bees themselves; and finally, what rooftop keepers in the town of Harwick have learned."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-1-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "How many main parts will the talk have?",
					"options": [
						{
							"key": "A",
							"text": "three"
						},
						{
							"key": "B",
							"text": "two"
						},
						{
							"key": "C",
							"text": "four"
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
						"A": "signpost",
						"C": "signpost"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "There are really just two questions I want to answer this morning.",
					"why": "开头就报了数：just two questions。关名叫「三件事」，但讲座不一定正好三件。",
					"audio": {
						"voices": {
							"N": "us-sarah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "There are really just two questions I want to answer this morning. The first is why glass was so expensive in the fourteenth century, and once we've dealt with that, we'll ask who could actually afford it."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-1-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What will the talk finish with?",
					"options": [
						{
							"key": "A",
							"text": "why people left the villages"
						},
						{
							"key": "B",
							"text": "how water was stored"
						},
						{
							"key": "C",
							"text": "which crops farmers grew"
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
						"B": "signpost",
						"C": "signpost"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "We'll end with the reasons the villages were abandoned.",
					"why": "end with 是最后一站。abandoned = 人走了，换成了 left。",
					"audio": {
						"voices": {
							"N": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "I've divided today's session into four parts. We'll start with the climate of the valley, move on to the crops farmers chose, and after that look at how water was stored. We'll end with the reasons the villages were abandoned."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-1-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What will the speaker do first?",
					"options": [
						{
							"key": "A",
							"text": "describe the experiment"
						},
						{
							"key": "B",
							"text": "explain the choice of location"
						},
						{
							"key": "C",
							"text": "discuss whether the results apply elsewhere"
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
						"A": "signpost",
						"C": "signpost"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Before I describe the experiment itself, I need to explain why the researchers chose such a small island.",
					"why": "Before I describe… 先说出来的不一定先讲。先讲的是为什么选小岛。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Before I describe the experiment itself, I need to explain why the researchers chose such a small island. After the experiment, we'll consider whether the results apply anywhere else."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-1-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What will the lecture begin with?",
					"options": [
						{
							"key": "A",
							"text": "how the brain works during sleep"
						},
						{
							"key": "B",
							"text": "why most lectures start with the brain"
						},
						{
							"key": "C",
							"text": "how tiredness affects what people do"
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
						"A": "signpost",
						"B": "signpost"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "we'll start with what changes in our behaviour when we're tired",
					"why": "先听到 brain，但讲者说 the other way round：大脑放最后，先讲行为。",
					"audio": {
						"voices": {
							"N": "us-hannah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Most lectures on sleep begin with the brain. I'm going to do it the other way round: we'll start with what changes in our behaviour when we're tired, and only at the end will we get to the brain."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-1-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which period will be discussed last?",
					"options": [
						{
							"key": "A",
							"text": "the arrival of the railway"
						},
						{
							"key": "B",
							"text": "the time after the telephone arrived"
						},
						{
							"key": "C",
							"text": "the age of horse riders"
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
						"A": "signpost",
						"C": "signpost"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "and the years after the telephone appeared",
					"why": "三段按时间排，and 后面那个就是最后一段。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Today's topic is the history of the postal service in Corland, and I'll cover three periods: the age of horse riders, the arrival of the railway, and the years after the telephone appeared."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-1-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "When will plants with deep roots be discussed?",
					"options": [
						{
							"key": "A",
							"text": "at the start"
						},
						{
							"key": "B",
							"text": "they will not be discussed today"
						},
						{
							"key": "C",
							"text": "after the break"
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
						"A": "signpost",
						"B": "signpost"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "we'll leave the ones with very deep roots until after the break",
					"why": "leave… until after the break = 留到休息之后再讲，不是不讲。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "I'll be talking about two kinds of desert plant today. Let's begin with the ones that store water, and we'll leave the ones with very deep roots until after the break."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-1-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which reason does the speaker consider most important?",
					"options": [
						{
							"key": "A",
							"text": "poor planning"
						},
						{
							"key": "B",
							"text": "the weather"
						},
						{
							"key": "C",
							"text": "competition from roads"
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
						"B": "signpost",
						"C": "signpost"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "and most importantly, poor planning",
					"why": "先说了按重要性从小到大排，所以第一个 weather 最不重要，最后一个最重要。",
					"audio": {
						"voices": {
							"N": "us-ethan"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "There are four reasons the Delmore canal failed, and I'll take them in order of importance, starting with the least important: the weather, then cost, then competition from roads, and most importantly, poor planning."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-1-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What will the first half of the talk focus on?",
					"options": [
						{
							"key": "A",
							"text": "the results of the survey"
						},
						{
							"key": "B",
							"text": "what the audience expects"
						},
						{
							"key": "C",
							"text": "how the survey questions were designed"
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
						"A": "signpost",
						"B": "signpost"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "explain how the questions were written first",
					"why": "You might expect… but 后面才是讲者真正的安排。结果放后半场。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "You might expect me to begin with the results of the survey, but I think it makes more sense to explain how the questions were written first. The results will come in the second half."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-1-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What does the speaker say about the third part?",
					"options": [
						{
							"key": "A",
							"text": "It is the most important."
						},
						{
							"key": "B",
							"text": "It will be brief."
						},
						{
							"key": "C",
							"text": "It is about how coral forms."
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
						"A": "signpost",
						"C": "signpost"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "though the third is short",
					"why": "the third is short、a few minutes 都在说第三段很短。",
					"audio": {
						"voices": {
							"N": "us-selene"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Today has three parts, though the third is short. We'll look at how coral forms, then at why it is losing colour, and I'll finish with a few minutes on a project in the Pell Islands."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				}
			],
			"id": "4-1",
			"ch": 4,
			"kind": "level",
			"x": 115,
			"y": 525,
			"label": "4-1",
			"name": "今天讲三件事",
			"zh": "听力 · 听讲座开头那句，猜后面怎么讲",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "listening",
			"type": "gap",
			"stations": [
				"1.8"
			],
			"hashtags": [
				"IELTS_1_8"
			],
			"gear": "dictation",
			"heartGear": "dictation",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j28",
				"j26",
				"j16"
			],
			"causeGuide": null,
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"keepOrder": false,
			"timed": null,
			"pool": [
				{
					"id": "4-2-A-1",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Earliest maps: mainly made for ______",
					"options": null,
					"chips": null,
					"answer": "taxation",
					"accept": [
						"tax",
						"taxes"
					],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Many people assume that the first maps were made for navigation, to help travellers find their way. That's a reasonable guess, since that's what most maps are used for today. In fact, the earliest maps we have were mostly made for taxation: they showed who owned which fields, so that rulers knew who",
					"why": "navigation 是大家以为的，In fact 后面才是讲者的说法：为了收税。两个词都放得进空，要听清转折。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Many people assume that the first maps were made for navigation, to help travellers find their way. That's a reasonable guess, since that's what most maps are used for today. In fact, the earliest maps we have were mostly made for taxation: they showed who owned which fields, so that rulers knew whom to tax."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-2-A-2",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Recent finding: some octopus species hunt ______",
					"options": null,
					"chips": null,
					"answer": "in groups",
					"accept": [],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "It was once thought that octopuses always hunted alone. They are, after all, rarely seen together in aquariums. However, divers near Calvara have now filmed several species hunting in groups, sometimes alongside fish. So the old picture needs to change.",
					"why": "alone 是旧说法，However 后面是新发现：成群捕猎。alone 也放得进空，是陷阱。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "It was once thought that octopuses always hunted alone. They are, after all, rarely seen together in aquariums. However, divers near Calvara have now filmed several species hunting in groups, sometimes alongside fish. So the old picture needs to change."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-2-A-3",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Biggest problem for city birds: ______",
					"options": null,
					"chips": null,
					"answer": "noise",
					"accept": [
						"traffic noise"
					],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The biggest problem for city birds, according to our survey, is noise from traffic. However, light at night also causes some difficulties, especially for birds that migrate. But compared with noise, the effect of light was small.",
					"why": "反例：However 后面只是补一句次要的 light，最后 compared with noise, the effect of light was small 又拉回来。重点在转折前面。however 后面「多半」是重点，不是每次都是。",
					"audio": {
						"voices": {
							"N": "us-ethan"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "The biggest problem for city birds, according to our survey, is noise from traffic. However, light at night also causes some difficulties, especially for birds that migrate. But compared with noise, the effect of light was small."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-2-A-4",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The Romans ______ concrete by adding volcanic ash",
					"options": null,
					"chips": null,
					"answer": "improved",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Textbooks often say that the Romans invented concrete. However, a simpler kind was already being used in the region centuries earlier. What the Romans actually did was improve it, by adding volcanic ash, which let it set even under water.",
					"why": "教科书说 invented，However 后面讲者纠正：更早就有了，罗马人是 improve。invented 也放得进空。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Textbooks often say that the Romans invented concrete. However, a simpler kind was already being used in the region centuries earlier. What the Romans actually did was improve it, by adding volcanic ash, which let it set even under water."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-2-A-5",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Chalk: consists almost entirely of ______",
					"options": null,
					"chips": null,
					"answer": "shells",
					"accept": [
						"sea shells",
						"seashells"
					],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "People usually think of chalk as a soft, rather useless rock, and many assume it is simply hardened mud. In fact, it is made almost entirely of shells: the shells of tiny sea creatures, piled up on the sea floor over millions of years.",
					"why": "mud 是很多人以为的，In fact 后面是真的：小海洋生物的壳。题干 consists almost entirely of 是 made almost entirely of 的改写；mud 也放得进空。",
					"audio": {
						"voices": {
							"N": "us-hannah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "People usually think of chalk as a soft, rather useless rock, and many assume it is simply hardened mud. In fact, it is made almost entirely of shells: the shells of tiny sea creatures, piled up on the sea floor over millions of years."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-2-B-1",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The tower was originally used for ______",
					"options": null,
					"chips": null,
					"answer": "storing grain",
					"accept": [
						"grain storage",
						"grain"
					],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Most visitors believe the tower was built for defence, and with walls this thick, you can see why. However, the town records show it was really used for storing grain. There's no mention of soldiers there at all.",
					"why": "defence 是游客以为的，However 后面是记录里写的：存粮食。defence 也放得进空。",
					"audio": {
						"voices": {
							"N": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Most visitors believe the tower was built for defence, and with walls this thick, you can see why. However, the town records show it was really used for storing grain. There's no mention of soldiers there at all."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-2-B-2",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Bats find food mainly by ______",
					"options": null,
					"chips": null,
					"answer": "sound",
					"accept": [
						"echoes"
					],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Early researchers believed that bats found food mainly by smell. Their noses are, after all, unusually large. In fact, experiments in the 1930s showed that they rely chiefly on sound, listening for the echoes of their own calls.",
					"why": "smell 是早期研究者的说法，In fact 后面改成 sound。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Early researchers believed that bats found food mainly by smell. Their noses are, after all, unusually large. In fact, experiments in the 1930s showed that they rely chiefly on sound, listening for the echoes of their own calls."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-2-B-3",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Method that helped memory more: ______",
					"options": null,
					"chips": null,
					"answer": "handwriting",
					"accept": [
						"writing",
						"by hand"
					],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "At the Fennick Institute, students who took notes by hand remembered more a week later than those who typed. However, typing was faster, and many students preferred it for that reason. But for remembering, handwriting came out clearly ahead.",
					"why": "反例：However 后面说打字更快，只是让一步；最后 But for remembering 又回到手写。题目问的是记忆，答案在转折前。",
					"audio": {
						"voices": {
							"N": "us-sarah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "At the Fennick Institute, students who took notes by hand remembered more a week later than those who typed. However, typing was faster, and many students preferred it for that reason. But for remembering, handwriting came out clearly ahead."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-2-B-4",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Speaker's view: main cause of the decline was ______",
					"options": null,
					"chips": null,
					"answer": "trade routes",
					"accept": [
						"trade"
					],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The traditional explanation for the town's decline was disease, and there certainly were outbreaks in the 1600s. In contrast, I would argue that the real cause was a change in trade routes. Ships simply stopped coming.",
					"why": "disease 是传统解释；In contrast, I would argue 后面是讲者自己的看法。disease 也放得进空。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "The traditional explanation for the town's decline was disease, and there certainly were outbreaks in the 1600s. In contrast, I would argue that the real cause was a change in trade routes. Ships simply stopped coming."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "4-2-B-5",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Overall, worms mainly ______ the soil",
					"options": null,
					"chips": null,
					"answer": "improve",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Worms mainly improve the soil, by mixing in dead leaves and letting air reach the roots. However, they can occasionally damage the soil around very young seedlings, though this is rare. So on balance, gardeners should welcome them.",
					"why": "反例：However 后面的 damage 是少数情况（occasionally、rare），最后 on balance 又回到「改良土壤」。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Worms mainly improve the soil, by mixing in dead leaves and letting air reach the roots. However, they can occasionally damage the soil around very young seedlings, though this is rare. So on balance, gardeners should welcome them."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				}
			],
			"id": "4-2",
			"ch": 4,
			"kind": "level",
			"x": 210,
			"y": 465,
			"label": "4-2",
			"name": "转折之后",
			"zh": "听力 · however、in fact 后面才是重点，跟着填笔记",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "listening",
			"type": "gap",
			"stations": [
				"1.9"
			],
			"hashtags": [
				"IELTS_1_9"
			],
			"gear": "typing",
			"heartGear": "typing",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j6",
				"j26",
				"j14"
			],
			"causeGuide": null,
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"keepOrder": true,
			"timed": null,
			"pool": [
				{
					"id": "4-3-A-1",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Material dropped by the river: ______",
					"options": null,
					"chips": null,
					"answer": "sediment",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Today we're looking at river deltas. A delta forms where a river slows down as it reaches the sea and drops the material it has been carrying. Geographers call this material sediment.",
					"why": "sediment 沉积物。拼写：sedi-ment，中间是 i。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Today we're looking at river deltas. A delta forms where a river slows down as it reaches the sea and drops the material it has been carrying. Geographers call this material sediment."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "4-3-A-2",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Farmers depend on ______ as well as rain",
					"options": null,
					"chips": null,
					"answer": "irrigation",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Because this material is so rich, deltas have been farmed for thousands of years. But farmers can't rely on rain alone, so they have always depended on irrigation.",
					"why": "irrigation 灌溉。两个 r：ir-ri-ga-tion。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Because this material is so rich, deltas have been farmed for thousands of years. But farmers can't rely on rain alone, so they have always depended on irrigation."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "4-3-A-3",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Dams trapping material: still only a ______",
					"options": null,
					"chips": null,
					"answer": "hypothesis",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Now, deltas are changing shape. One explanation, which is still only a hypothesis, is that dams upstream are trapping the material.",
					"why": "hypothesis 假说，还没证实。拼写 hypo-the-sis，开头是 hy，不是 hi。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Now, deltas are changing shape. One explanation, which is still only a hypothesis, is that dams upstream are trapping the material."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "4-3-A-4",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Coast giving way to the sea: ______",
					"options": null,
					"chips": null,
					"answer": "erosion",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "If less material arrives, the coast slowly gives way to the sea. This process is known as erosion.",
					"why": "erosion 侵蚀。只有一个 r、一个 s。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "If less material arrives, the coast slowly gives way to the sea. This process is known as erosion."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "4-3-A-5",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Restoring river flow needs ______ between countries",
					"options": null,
					"chips": null,
					"answer": "collaboration",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Some countries are now trying to restore the natural flow of rivers, but this requires careful collaboration between neighbouring states.",
					"why": "collaboration 合作。两个 l：col-la-bo-ra-tion。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Some countries are now trying to restore the natural flow of rivers, but this requires careful collaboration between neighbouring states."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "4-3-B-1",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Drying works because bacteria need ______",
					"options": null,
					"chips": null,
					"answer": "moisture",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "This morning's topic is how people kept food before refrigerators. The oldest method is drying, which works because bacteria cannot grow without moisture.",
					"why": "moisture 水分。结尾是 -ture，不是 -cher。",
					"audio": {
						"voices": {
							"N": "us-selene"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "This morning's topic is how people kept food before refrigerators. The oldest method is drying, which works because bacteria cannot grow without moisture."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "4-3-B-2",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Salt: heavily taxed by ______",
					"options": null,
					"chips": null,
					"answer": "governments",
					"accept": [
						"government"
					],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Salt was the next big step. It draws water out of meat and fish, and it was so valuable that it was taxed heavily by governments.",
					"why": "government 中间有 n：gover-n-ment，最常漏。",
					"audio": {
						"voices": {
							"N": "us-selene"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Salt was the next big step. It draws water out of meat and fish, and it was so valuable that it was taxed heavily by governments."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "4-3-B-3",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Cheese and yoghurt are made by ______",
					"options": null,
					"chips": null,
					"answer": "fermentation",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Then there is fermentation, which is how we get cheese and yoghurt. Here, useful bacteria are actually encouraged.",
					"why": "fermentation 发酵。fer-men-ta-tion。",
					"audio": {
						"voices": {
							"N": "us-selene"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Then there is fermentation, which is how we get cheese and yoghurt. Here, useful bacteria are actually encouraged."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "4-3-B-4",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Main purpose of smoke: a ______",
					"options": null,
					"chips": null,
					"answer": "preservative",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Smoking food added flavour, but its main purpose was to act as a preservative.",
					"why": "要填的是 main purpose 后面那个词，不是 flavour。preservative 防腐剂，结尾 -ative。",
					"audio": {
						"voices": {
							"N": "us-selene"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Smoking food added flavour, but its main purpose was to act as a preservative."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "4-3-B-5",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Canning: developed for ______ needs",
					"options": null,
					"chips": null,
					"answer": "military",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Finally, canning was invented in response to a military need: armies had to carry food over long distances.",
					"why": "military 军事的。mili-tary，中间两个 i。",
					"audio": {
						"voices": {
							"N": "us-selene"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Finally, canning was invented in response to a military need: armies had to carry food over long distances."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				}
			],
			"id": "4-3",
			"ch": 4,
			"kind": "level",
			"x": 270,
			"y": 405,
			"label": "4-3",
			"name": "讲座笔记 · 进阶",
			"zh": "听力 · 一整场讲座分 5 段，信息更密，学术词拼错就算错",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "reading",
			"type": "choice",
			"stations": [
				"2.8"
			],
			"hashtags": [
				"IELTS_2_8"
			],
			"gear": "synonym-match:academic",
			"heartGear": "synonym-match:academic",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j30",
				"j21",
				"j22"
			],
			"causeGuide": null,
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"keepOrder": false,
			"timed": null,
			"pool": [
				{
					"id": "4-4-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Long before modern power stations, some coastal communities used tide mills to grind grain. A tide mill works by trapping sea water in a pond at high tide and releasing it through a wheel as the tide falls. Because tides are predictable, millers could plan their work weeks in advance, which was not possible with wind. Windmills, by contrast, sometimes stood idle for days. A tide miller could also hold water in the pond overnight and grind whenever it suited him.\nMost tide mills in the region of Aldmouth were built between 1200 and 1600. A few continued working into the twentieth century, but the majority closed once steam engines became cheaper. Rising sea levels are sometimes blamed for their decline, but historians at the Corran Trust have found little evidence for this. The Trust estimates that around forty mills once operated along the Aldmouth coast; only two survive today, and one of them is now a museum, where visitors can watch the wheel turn whenever the tide goes out.\nEngineers have recently shown renewed interest in the idea. Modern tidal schemes are far larger, but they rely on the same principle of storing water and releasing it later. Supporters say a single scheme could supply electricity to thousands of homes. Critics point out that such schemes can change the habitat of wading birds, and some proposed projects have been delayed while their effects on wildlife are studied.",
					"question": "Millers at tide mills could plan their work weeks ahead",
					"options": [
						{
							"key": "A",
							"text": "because windmills often stood idle for days."
						},
						{
							"key": "B",
							"text": "once another source of power became cheaper."
						},
						{
							"key": "C",
							"text": "while their impact on wildlife is examined."
						},
						{
							"key": "D",
							"text": "because the rise and fall of the sea could be forecast."
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "paraphrase",
						"B": "paraphrase",
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Because tides are predictable, millers could plan their work weeks in advance",
					"why": "predictable = could be forecast。风车会停好几天是拿来对比的，不是潮汐磨坊能提前排工的原因。",
					"audio": null,
					"tags": [
						"sentence-ending",
						"paraphrase"
					]
				},
				{
					"id": "4-4-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Long before modern power stations, some coastal communities used tide mills to grind grain. A tide mill works by trapping sea water in a pond at high tide and releasing it through a wheel as the tide falls. Because tides are predictable, millers could plan their work weeks in advance, which was not possible with wind. Windmills, by contrast, sometimes stood idle for days. A tide miller could also hold water in the pond overnight and grind whenever it suited him.\nMost tide mills in the region of Aldmouth were built between 1200 and 1600. A few continued working into the twentieth century, but the majority closed once steam engines became cheaper. Rising sea levels are sometimes blamed for their decline, but historians at the Corran Trust have found little evidence for this. The Trust estimates that around forty mills once operated along the Aldmouth coast; only two survive today, and one of them is now a museum, where visitors can watch the wheel turn whenever the tide goes out.\nEngineers have recently shown renewed interest in the idea. Modern tidal schemes are far larger, but they rely on the same principle of storing water and releasing it later. Supporters say a single scheme could supply electricity to thousands of homes. Critics point out that such schemes can change the habitat of wading birds, and some proposed projects have been delayed while their effects on wildlife are studied.",
					"question": "Most of the Aldmouth tide mills closed",
					"options": [
						{
							"key": "A",
							"text": "because the sea level rose."
						},
						{
							"key": "B",
							"text": "so that electricity could reach thousands of homes."
						},
						{
							"key": "C",
							"text": "once another source of power became cheaper."
						},
						{
							"key": "D",
							"text": "because windmills often stood idle for days."
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
						"A": "paraphrase",
						"B": "paraphrase",
						"D": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "the majority closed once steam engines became cheaper",
					"why": "steam engines = another source of power。海平面上升是有人这么说，可 Corran Trust 找不到证据。",
					"audio": null,
					"tags": [
						"sentence-ending",
						"paraphrase"
					]
				},
				{
					"id": "4-4-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Long before modern power stations, some coastal communities used tide mills to grind grain. A tide mill works by trapping sea water in a pond at high tide and releasing it through a wheel as the tide falls. Because tides are predictable, millers could plan their work weeks in advance, which was not possible with wind. Windmills, by contrast, sometimes stood idle for days. A tide miller could also hold water in the pond overnight and grind whenever it suited him.\nMost tide mills in the region of Aldmouth were built between 1200 and 1600. A few continued working into the twentieth century, but the majority closed once steam engines became cheaper. Rising sea levels are sometimes blamed for their decline, but historians at the Corran Trust have found little evidence for this. The Trust estimates that around forty mills once operated along the Aldmouth coast; only two survive today, and one of them is now a museum, where visitors can watch the wheel turn whenever the tide goes out.\nEngineers have recently shown renewed interest in the idea. Modern tidal schemes are far larger, but they rely on the same principle of storing water and releasing it later. Supporters say a single scheme could supply electricity to thousands of homes. Critics point out that such schemes can change the habitat of wading birds, and some proposed projects have been delayed while their effects on wildlife are studied.",
					"question": "The Corran Trust has found little evidence that the mills closed",
					"options": [
						{
							"key": "A",
							"text": "because the sea level rose."
						},
						{
							"key": "B",
							"text": "once another source of power became cheaper."
						},
						{
							"key": "C",
							"text": "because windmills often stood idle for days."
						},
						{
							"key": "D",
							"text": "while their impact on wildlife is examined."
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
						"C": "same-word",
						"D": "same-word"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Rising sea levels are sometimes blamed for their decline, but historians at the Corran Trust have found little evidence for this.",
					"why": "被 Corran Trust 否掉的是「海平面上升」这个说法。蒸汽机更便宜是原文认定的原因，不是没证据。",
					"audio": null,
					"tags": [
						"distractor"
					]
				},
				{
					"id": "4-4-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Long before modern power stations, some coastal communities used tide mills to grind grain. A tide mill works by trapping sea water in a pond at high tide and releasing it through a wheel as the tide falls. Because tides are predictable, millers could plan their work weeks in advance, which was not possible with wind. Windmills, by contrast, sometimes stood idle for days. A tide miller could also hold water in the pond overnight and grind whenever it suited him.\nMost tide mills in the region of Aldmouth were built between 1200 and 1600. A few continued working into the twentieth century, but the majority closed once steam engines became cheaper. Rising sea levels are sometimes blamed for their decline, but historians at the Corran Trust have found little evidence for this. The Trust estimates that around forty mills once operated along the Aldmouth coast; only two survive today, and one of them is now a museum, where visitors can watch the wheel turn whenever the tide goes out.\nEngineers have recently shown renewed interest in the idea. Modern tidal schemes are far larger, but they rely on the same principle of storing water and releasing it later. Supporters say a single scheme could supply electricity to thousands of homes. Critics point out that such schemes can change the habitat of wading birds, and some proposed projects have been delayed while their effects on wildlife are studied.",
					"question": "Modern tidal schemes resemble tide mills",
					"options": [
						{
							"key": "A",
							"text": "so that electricity could reach thousands of homes."
						},
						{
							"key": "B",
							"text": "in that water is held back and released later."
						},
						{
							"key": "C",
							"text": "because the rise and fall of the sea could be forecast."
						},
						{
							"key": "D",
							"text": "once another source of power became cheaper."
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
						"A": "paraphrase",
						"C": "paraphrase",
						"D": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "they rely on the same principle of storing water and releasing it later",
					"why": "same principle = resemble。storing = held back，releasing = released。供电给几千户是支持者的说法，不是两者的相同点。",
					"audio": null,
					"tags": [
						"sentence-ending",
						"paraphrase"
					]
				},
				{
					"id": "4-4-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Long before modern power stations, some coastal communities used tide mills to grind grain. A tide mill works by trapping sea water in a pond at high tide and releasing it through a wheel as the tide falls. Because tides are predictable, millers could plan their work weeks in advance, which was not possible with wind. Windmills, by contrast, sometimes stood idle for days. A tide miller could also hold water in the pond overnight and grind whenever it suited him.\nMost tide mills in the region of Aldmouth were built between 1200 and 1600. A few continued working into the twentieth century, but the majority closed once steam engines became cheaper. Rising sea levels are sometimes blamed for their decline, but historians at the Corran Trust have found little evidence for this. The Trust estimates that around forty mills once operated along the Aldmouth coast; only two survive today, and one of them is now a museum, where visitors can watch the wheel turn whenever the tide goes out.\nEngineers have recently shown renewed interest in the idea. Modern tidal schemes are far larger, but they rely on the same principle of storing water and releasing it later. Supporters say a single scheme could supply electricity to thousands of homes. Critics point out that such schemes can change the habitat of wading birds, and some proposed projects have been delayed while their effects on wildlife are studied.",
					"question": "Some new tidal projects have been held up",
					"options": [
						{
							"key": "A",
							"text": "because the sea level rose."
						},
						{
							"key": "B",
							"text": "so that electricity could reach thousands of homes."
						},
						{
							"key": "C",
							"text": "while their impact on wildlife is examined."
						},
						{
							"key": "D",
							"text": "in that water is held back and released later."
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
						"A": "paraphrase",
						"B": "paraphrase",
						"D": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "some proposed projects have been delayed while their effects on wildlife are studied",
					"why": "delayed = held up，effects = impact，studied = examined。",
					"audio": null,
					"tags": [
						"sentence-ending",
						"paraphrase"
					]
				},
				{
					"id": "4-4-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Mosses have no roots, so they take in water and nutrients directly from the air. They can also survive on walls and roofs where few other plants grow. For this reason, scientists have long used them to monitor air quality. A moss sample collected from a roadside will often contain traces of metals released by traffic.\nIn a study in the city of Varden, researchers from Holloway University placed moss bags at 150 sites. Each bag held a handful of moss collected from a clean forest far from the city. After eight weeks, samples near busy junctions held up to four times as much zinc as those in parks. Surprisingly, samples from a few quiet streets also showed high levels, which the team links to old industrial sites nearby. The team cautions, however, that moss records only some kinds of pollution; it says little about gases such as ozone.\nMoss monitoring is cheap compared with electronic sensors, which can cost thousands of pounds each. Volunteers can hang and collect the bags, so a city can cover many more locations. Nevertheless, the samples must still be analysed in a laboratory, and this usually takes several weeks, so the method cannot warn people about pollution on a particular day. For that purpose, Varden still relies on its twelve electronic sensors. Officials say the two methods work best when used together.",
					"question": "Scientists find moss useful for checking air quality",
					"options": [
						{
							"key": "A",
							"text": "because it absorbs what it needs from the air rather than the soil."
						},
						{
							"key": "B",
							"text": "because the bags can be put up by unpaid helpers."
						},
						{
							"key": "C",
							"text": "because it fails to record certain gases."
						},
						{
							"key": "D",
							"text": "because traffic at busy junctions is heavy."
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
						"B": "paraphrase",
						"C": "paraphrase",
						"D": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Mosses have no roots, so they take in water and nutrients directly from the air.",
					"why": "no roots、directly from the air = 不从土里吸，从空气里吸。志愿者能挂是「便宜、能多测」的原因，不是能测空气的原因。",
					"audio": null,
					"tags": [
						"sentence-ending",
						"paraphrase"
					]
				},
				{
					"id": "4-4-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Mosses have no roots, so they take in water and nutrients directly from the air. They can also survive on walls and roofs where few other plants grow. For this reason, scientists have long used them to monitor air quality. A moss sample collected from a roadside will often contain traces of metals released by traffic.\nIn a study in the city of Varden, researchers from Holloway University placed moss bags at 150 sites. Each bag held a handful of moss collected from a clean forest far from the city. After eight weeks, samples near busy junctions held up to four times as much zinc as those in parks. Surprisingly, samples from a few quiet streets also showed high levels, which the team links to old industrial sites nearby. The team cautions, however, that moss records only some kinds of pollution; it says little about gases such as ozone.\nMoss monitoring is cheap compared with electronic sensors, which can cost thousands of pounds each. Volunteers can hang and collect the bags, so a city can cover many more locations. Nevertheless, the samples must still be analysed in a laboratory, and this usually takes several weeks, so the method cannot warn people about pollution on a particular day. For that purpose, Varden still relies on its twelve electronic sensors. Officials say the two methods work best when used together.",
					"question": "Some moss from quiet streets in Varden contained high levels of metal",
					"options": [
						{
							"key": "A",
							"text": "because traffic at busy junctions is heavy."
						},
						{
							"key": "B",
							"text": "because of former factories in the area."
						},
						{
							"key": "C",
							"text": "because it absorbs what it needs from the air rather than the soil."
						},
						{
							"key": "D",
							"text": "because moss results take weeks to arrive."
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
						"A": "paraphrase",
						"C": "paraphrase",
						"D": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "which the team links to old industrial sites nearby",
					"why": "old industrial sites = former factories。题目说的是安静的街，车多是繁忙路口的事。",
					"audio": null,
					"tags": [
						"sentence-ending",
						"paraphrase"
					]
				},
				{
					"id": "4-4-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Mosses have no roots, so they take in water and nutrients directly from the air. They can also survive on walls and roofs where few other plants grow. For this reason, scientists have long used them to monitor air quality. A moss sample collected from a roadside will often contain traces of metals released by traffic.\nIn a study in the city of Varden, researchers from Holloway University placed moss bags at 150 sites. Each bag held a handful of moss collected from a clean forest far from the city. After eight weeks, samples near busy junctions held up to four times as much zinc as those in parks. Surprisingly, samples from a few quiet streets also showed high levels, which the team links to old industrial sites nearby. The team cautions, however, that moss records only some kinds of pollution; it says little about gases such as ozone.\nMoss monitoring is cheap compared with electronic sensors, which can cost thousands of pounds each. Volunteers can hang and collect the bags, so a city can cover many more locations. Nevertheless, the samples must still be analysed in a laboratory, and this usually takes several weeks, so the method cannot warn people about pollution on a particular day. For that purpose, Varden still relies on its twelve electronic sensors. Officials say the two methods work best when used together.",
					"question": "Moss cannot give a full picture of air pollution",
					"options": [
						{
							"key": "A",
							"text": "because traffic at busy junctions is heavy."
						},
						{
							"key": "B",
							"text": "because sensors cost thousands of pounds each."
						},
						{
							"key": "C",
							"text": "because it fails to record certain gases."
						},
						{
							"key": "D",
							"text": "because of former factories in the area."
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
						"A": "qualifier",
						"B": "qualifier",
						"D": "qualifier"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "moss records only some kinds of pollution; it says little about gases such as ozone",
					"why": "only some kinds = 不完整；says little about gases = 有些气体测不出。",
					"audio": null,
					"tags": [
						"qualifier"
					]
				},
				{
					"id": "4-4-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Mosses have no roots, so they take in water and nutrients directly from the air. They can also survive on walls and roofs where few other plants grow. For this reason, scientists have long used them to monitor air quality. A moss sample collected from a roadside will often contain traces of metals released by traffic.\nIn a study in the city of Varden, researchers from Holloway University placed moss bags at 150 sites. Each bag held a handful of moss collected from a clean forest far from the city. After eight weeks, samples near busy junctions held up to four times as much zinc as those in parks. Surprisingly, samples from a few quiet streets also showed high levels, which the team links to old industrial sites nearby. The team cautions, however, that moss records only some kinds of pollution; it says little about gases such as ozone.\nMoss monitoring is cheap compared with electronic sensors, which can cost thousands of pounds each. Volunteers can hang and collect the bags, so a city can cover many more locations. Nevertheless, the samples must still be analysed in a laboratory, and this usually takes several weeks, so the method cannot warn people about pollution on a particular day. For that purpose, Varden still relies on its twelve electronic sensors. Officials say the two methods work best when used together.",
					"question": "Varden can test far more locations with moss",
					"options": [
						{
							"key": "A",
							"text": "because it absorbs what it needs from the air rather than the soil."
						},
						{
							"key": "B",
							"text": "because traffic at busy junctions is heavy."
						},
						{
							"key": "C",
							"text": "because of former factories in the area."
						},
						{
							"key": "D",
							"text": "because the bags can be put up by unpaid helpers."
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "paraphrase",
						"B": "paraphrase",
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Volunteers can hang and collect the bags, so a city can cover many more locations.",
					"why": "volunteers = unpaid helpers，hang = put up。",
					"audio": null,
					"tags": [
						"sentence-ending",
						"paraphrase"
					]
				},
				{
					"id": "4-4-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Mosses have no roots, so they take in water and nutrients directly from the air. They can also survive on walls and roofs where few other plants grow. For this reason, scientists have long used them to monitor air quality. A moss sample collected from a roadside will often contain traces of metals released by traffic.\nIn a study in the city of Varden, researchers from Holloway University placed moss bags at 150 sites. Each bag held a handful of moss collected from a clean forest far from the city. After eight weeks, samples near busy junctions held up to four times as much zinc as those in parks. Surprisingly, samples from a few quiet streets also showed high levels, which the team links to old industrial sites nearby. The team cautions, however, that moss records only some kinds of pollution; it says little about gases such as ozone.\nMoss monitoring is cheap compared with electronic sensors, which can cost thousands of pounds each. Volunteers can hang and collect the bags, so a city can cover many more locations. Nevertheless, the samples must still be analysed in a laboratory, and this usually takes several weeks, so the method cannot warn people about pollution on a particular day. For that purpose, Varden still relies on its twelve electronic sensors. Officials say the two methods work best when used together.",
					"question": "Varden still depends on electronic sensors",
					"options": [
						{
							"key": "A",
							"text": "because sensors cost thousands of pounds each."
						},
						{
							"key": "B",
							"text": "because the bags can be put up by unpaid helpers."
						},
						{
							"key": "C",
							"text": "because moss results take weeks to arrive."
						},
						{
							"key": "D",
							"text": "because of former factories in the area."
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
						"A": "paraphrase",
						"B": "paraphrase",
						"D": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "this usually takes several weeks, so the method cannot warn people about pollution on a particular day",
					"why": "要等几周，不能当天预警，所以当天预警还得靠传感器（For that purpose）。传感器贵是不用它的理由，方向反了。",
					"audio": null,
					"tags": [
						"sentence-ending",
						"paraphrase"
					]
				}
			],
			"id": "4-4",
			"ch": 4,
			"kind": "level",
			"x": 130,
			"y": 360,
			"label": "4-4",
			"name": "前半句找后半句",
			"zh": "阅读 · 前半句配后半句，语法和意思都要通",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "reading",
			"type": "choice",
			"stations": [
				"2.9"
			],
			"hashtags": [
				"IELTS_2_9"
			],
			"gear": "vocab:5.8",
			"heartGear": "vocab:5.8",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j29",
				"j20",
				"j17"
			],
			"causeGuide": null,
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"keepOrder": false,
			"timed": null,
			"pool": [
				{
					"id": "4-5-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Salt marshes are areas of coastal grassland that are flooded by the sea at high tide. They were once regarded as wasteland, and many were drained to create farmland. Today, however, they are valued for several reasons.\nFirst, the plants slow down incoming waves, which reduces damage to sea walls during storms. Second, marsh soil stores large amounts of carbon, often more per hectare than a forest. Third, the marshes provide shelter for young fish, which later move out into open water.\nAt Penhallow, a scheme begun in 2015 deliberately let the sea back onto former fields. Within five years, more than thirty plant species had returned. Local farmers were initially opposed, but most now accept the scheme because it was combined with payments for the land they gave up.",
					"question": "Summary: In the past, salt marshes were seen as having no ______, so many were drained for farming.",
					"options": [
						{
							"key": "A",
							"text": "value"
						},
						{
							"key": "B",
							"text": "nutrients"
						},
						{
							"key": "C",
							"text": "food"
						},
						{
							"key": "D",
							"text": "protection"
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
						"B": "summary-fit",
						"C": "summary-fit",
						"D": "summary-fit"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "They were once regarded as wasteland",
					"why": "wasteland = 没用的地 = 没有 value。四个都是名词，都放得进，要看意思。",
					"audio": null,
					"tags": [
						"summary"
					]
				},
				{
					"id": "4-5-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Salt marshes are areas of coastal grassland that are flooded by the sea at high tide. They were once regarded as wasteland, and many were drained to create farmland. Today, however, they are valued for several reasons.\nFirst, the plants slow down incoming waves, which reduces damage to sea walls during storms. Second, marsh soil stores large amounts of carbon, often more per hectare than a forest. Third, the marshes provide shelter for young fish, which later move out into open water.\nAt Penhallow, a scheme begun in 2015 deliberately let the sea back onto former fields. Within five years, more than thirty plant species had returned. Local farmers were initially opposed, but most now accept the scheme because it was combined with payments for the land they gave up.",
					"question": "Summary: Marsh plants lower the ______ of incoming waves, which reduces damage to sea walls.",
					"options": [
						{
							"key": "A",
							"text": "height"
						},
						{
							"key": "B",
							"text": "speed"
						},
						{
							"key": "C",
							"text": "value"
						},
						{
							"key": "D",
							"text": "food"
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
						"A": "summary-fit",
						"C": "summary-fit",
						"D": "summary-fit"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "the plants slow down incoming waves",
					"why": "slow down = 降低速度。height 读着也通，但原文没说浪变矮。",
					"audio": null,
					"tags": [
						"summary"
					]
				},
				{
					"id": "4-5-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Salt marshes are areas of coastal grassland that are flooded by the sea at high tide. They were once regarded as wasteland, and many were drained to create farmland. Today, however, they are valued for several reasons.\nFirst, the plants slow down incoming waves, which reduces damage to sea walls during storms. Second, marsh soil stores large amounts of carbon, often more per hectare than a forest. Third, the marshes provide shelter for young fish, which later move out into open water.\nAt Penhallow, a scheme begun in 2015 deliberately let the sea back onto former fields. Within five years, more than thirty plant species had returned. Local farmers were initially opposed, but most now accept the scheme because it was combined with payments for the land they gave up.",
					"question": "Summary: Per hectare, marsh soil may hold more ______ than a forest.",
					"options": [
						{
							"key": "A",
							"text": "nutrients"
						},
						{
							"key": "B",
							"text": "height"
						},
						{
							"key": "C",
							"text": "protection"
						},
						{
							"key": "D",
							"text": "carbon"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "summary-fit",
						"B": "summary-fit",
						"C": "summary-fit"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "marsh soil stores large amounts of carbon, often more per hectare than a forest",
					"why": "stores = hold。nutrients 听着像土里的东西，但原文比的是 carbon。",
					"audio": null,
					"tags": [
						"summary"
					]
				},
				{
					"id": "4-5-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Salt marshes are areas of coastal grassland that are flooded by the sea at high tide. They were once regarded as wasteland, and many were drained to create farmland. Today, however, they are valued for several reasons.\nFirst, the plants slow down incoming waves, which reduces damage to sea walls during storms. Second, marsh soil stores large amounts of carbon, often more per hectare than a forest. Third, the marshes provide shelter for young fish, which later move out into open water.\nAt Penhallow, a scheme begun in 2015 deliberately let the sea back onto former fields. Within five years, more than thirty plant species had returned. Local farmers were initially opposed, but most now accept the scheme because it was combined with payments for the land they gave up.",
					"question": "Summary: For young fish, the marshes offer ______ before they move out into open water.",
					"options": [
						{
							"key": "A",
							"text": "food"
						},
						{
							"key": "B",
							"text": "nutrients"
						},
						{
							"key": "C",
							"text": "protection"
						},
						{
							"key": "D",
							"text": "speed"
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
						"A": "summary-fit",
						"B": "summary-fit",
						"D": "summary-fit"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "the marshes provide shelter for young fish",
					"why": "shelter = protection。food 读着最顺，但原文没说小鱼在这里吃什么。",
					"audio": null,
					"tags": [
						"summary"
					]
				},
				{
					"id": "4-5-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Salt marshes are areas of coastal grassland that are flooded by the sea at high tide. They were once regarded as wasteland, and many were drained to create farmland. Today, however, they are valued for several reasons.\nFirst, the plants slow down incoming waves, which reduces damage to sea walls during storms. Second, marsh soil stores large amounts of carbon, often more per hectare than a forest. Third, the marshes provide shelter for young fish, which later move out into open water.\nAt Penhallow, a scheme begun in 2015 deliberately let the sea back onto former fields. Within five years, more than thirty plant species had returned. Local farmers were initially opposed, but most now accept the scheme because it was combined with payments for the land they gave up.",
					"question": "Summary: Most farmers dropped their objections after receiving ______ for the land they lost.",
					"options": [
						{
							"key": "A",
							"text": "permission"
						},
						{
							"key": "B",
							"text": "protection"
						},
						{
							"key": "C",
							"text": "value"
						},
						{
							"key": "D",
							"text": "compensation"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "summary-fit",
						"B": "summary-fit",
						"C": "summary-fit"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "it was combined with payments for the land they gave up",
					"why": "payments for the land they gave up = compensation 补偿。permission 读着也通，原文没有。",
					"audio": null,
					"tags": [
						"summary"
					]
				},
				{
					"id": "4-5-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Repair cafés are events where volunteers help people fix broken household items instead of throwing them away. The first ones appeared about fifteen years ago, and there are now thousands worldwide.\nA survey of 600 visitors in the city of Ostley found that the most common items brought in were small electrical goods such as lamps and toasters. Around two thirds of these were repaired successfully. Clothing was the second most common category.\nOrganisers say the events are not only about saving money. Many visitors stay to watch and learn, and some later become volunteers themselves. However, repairs are becoming harder because a growing number of products are glued together rather than screwed, which makes them difficult to open. Some governments are now considering laws that would require manufacturers to make spare parts available.",
					"question": "Summary: Repair cafés aim to cut down on household ______.",
					"options": [
						{
							"key": "A",
							"text": "repairs"
						},
						{
							"key": "B",
							"text": "parts"
						},
						{
							"key": "C",
							"text": "skills"
						},
						{
							"key": "D",
							"text": "waste"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "summary-fit",
						"B": "summary-fit",
						"C": "summary-fit"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "instead of throwing them away",
					"why": "不扔 = 减少 waste。repairs 方向反了：修的越多越好。",
					"audio": null,
					"tags": [
						"summary"
					]
				},
				{
					"id": "4-5-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Repair cafés are events where volunteers help people fix broken household items instead of throwing them away. The first ones appeared about fifteen years ago, and there are now thousands worldwide.\nA survey of 600 visitors in the city of Ostley found that the most common items brought in were small electrical goods such as lamps and toasters. Around two thirds of these were repaired successfully. Clothing was the second most common category.\nOrganisers say the events are not only about saving money. Many visitors stay to watch and learn, and some later become volunteers themselves. However, repairs are becoming harder because a growing number of products are glued together rather than screwed, which makes them difficult to open. Some governments are now considering laws that would require manufacturers to make spare parts available.",
					"question": "Summary: With about two thirds of small electrical goods fixed, the cafés have a high success ______.",
					"options": [
						{
							"key": "A",
							"text": "rate"
						},
						{
							"key": "B",
							"text": "category"
						},
						{
							"key": "C",
							"text": "confidence"
						},
						{
							"key": "D",
							"text": "parts"
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
						"B": "summary-fit",
						"C": "summary-fit",
						"D": "summary-fit"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Around two thirds of these were repaired successfully.",
					"why": "三分之二修好了 = 成功率高：success rate。category 原文有，但说的是物品种类。",
					"audio": null,
					"tags": [
						"summary"
					]
				},
				{
					"id": "4-5-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Repair cafés are events where volunteers help people fix broken household items instead of throwing them away. The first ones appeared about fifteen years ago, and there are now thousands worldwide.\nA survey of 600 visitors in the city of Ostley found that the most common items brought in were small electrical goods such as lamps and toasters. Around two thirds of these were repaired successfully. Clothing was the second most common category.\nOrganisers say the events are not only about saving money. Many visitors stay to watch and learn, and some later become volunteers themselves. However, repairs are becoming harder because a growing number of products are glued together rather than screwed, which makes them difficult to open. Some governments are now considering laws that would require manufacturers to make spare parts available.",
					"question": "Summary: Visitors come not only to save money but also to gain ______.",
					"options": [
						{
							"key": "A",
							"text": "confidence"
						},
						{
							"key": "B",
							"text": "skills"
						},
						{
							"key": "C",
							"text": "parts"
						},
						{
							"key": "D",
							"text": "waste"
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
						"A": "summary-fit",
						"C": "summary-fit",
						"D": "summary-fit"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Many visitors stay to watch and learn",
					"why": "stay to watch and learn = 学本事：skills。confidence 读着也通，原文没说。",
					"audio": null,
					"tags": [
						"summary"
					]
				},
				{
					"id": "4-5-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Repair cafés are events where volunteers help people fix broken household items instead of throwing them away. The first ones appeared about fifteen years ago, and there are now thousands worldwide.\nA survey of 600 visitors in the city of Ostley found that the most common items brought in were small electrical goods such as lamps and toasters. Around two thirds of these were repaired successfully. Clothing was the second most common category.\nOrganisers say the events are not only about saving money. Many visitors stay to watch and learn, and some later become volunteers themselves. However, repairs are becoming harder because a growing number of products are glued together rather than screwed, which makes them difficult to open. Some governments are now considering laws that would require manufacturers to make spare parts available.",
					"question": "Summary: Some visitors later come back as ______.",
					"options": [
						{
							"key": "A",
							"text": "organisers"
						},
						{
							"key": "B",
							"text": "confidence"
						},
						{
							"key": "C",
							"text": "helpers"
						},
						{
							"key": "D",
							"text": "category"
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
						"A": "summary-fit",
						"B": "summary-fit",
						"D": "summary-fit"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "some later become volunteers themselves",
					"why": "volunteers = helpers。organisers 原文有，但说的是主办方，不是来客后来变成的。",
					"audio": null,
					"tags": [
						"summary"
					]
				},
				{
					"id": "4-5-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Repair cafés are events where volunteers help people fix broken household items instead of throwing them away. The first ones appeared about fifteen years ago, and there are now thousands worldwide.\nA survey of 600 visitors in the city of Ostley found that the most common items brought in were small electrical goods such as lamps and toasters. Around two thirds of these were repaired successfully. Clothing was the second most common category.\nOrganisers say the events are not only about saving money. Many visitors stay to watch and learn, and some later become volunteers themselves. However, repairs are becoming harder because a growing number of products are glued together rather than screwed, which makes them difficult to open. Some governments are now considering laws that would require manufacturers to make spare parts available.",
					"question": "Summary: Repairs are getting harder because more products are held together with ______ instead of screws.",
					"options": [
						{
							"key": "A",
							"text": "parts"
						},
						{
							"key": "B",
							"text": "glue"
						},
						{
							"key": "C",
							"text": "waste"
						},
						{
							"key": "D",
							"text": "skills"
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
						"A": "summary-fit",
						"C": "summary-fit",
						"D": "summary-fit"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "a growing number of products are glued together rather than screwed",
					"why": "glued together = 用胶粘。parts 原文有，说的是备用零件那条法规。",
					"audio": null,
					"tags": [
						"summary"
					]
				}
			],
			"id": "4-5",
			"ch": 4,
			"kind": "level",
			"x": 175,
			"y": 280,
			"label": "4-5",
			"name": "哪个词放得进去",
			"zh": "阅读 · 摘要填空，词库比空多，先定词性再看意思",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "reading",
			"type": "mixed",
			"stations": [
				"2.8"
			],
			"hashtags": [
				"IELTS_2_8"
			],
			"gear": "synonym-match:academic",
			"heartGear": "synonym-match:academic",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j27",
				"j30",
				"j31"
			],
			"causeGuide": null,
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"keepOrder": false,
			"timed": {
				"totalSeconds": 360,
				"warnAtSecondsLeft": 30,
				"timeoutHeartCost": 1,
				"heartPerUnanswered": 1,
				"maxHeartsPerTry": 2,
				"hitsBoss": false,
				"audioCounts": false,
				"card": "限时关 · 5 题 6 分钟。沙漏不停，切出去也在计时，时间到自动交卷，没答的算错。"
			},
			"pool": [
				{
					"id": "4-6-A-1",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "A  Dr Helen Okafor of Westbury College asked 90 students to learn a passage about volcanoes. Half were told they would be tested on it; the other half were told they would have to teach it to a younger pupil. Although neither group actually taught anyone, the second group remembered more of the passage a week later. Okafor believes that expecting to teach makes learners organise information more carefully, but she admits her study cannot show which part of the preparation made the difference.\nB  Professor Martin Aaltonen of Norrby University went further and had students actually teach. Some explained the material to a camera, others to a live audience of classmates. Both groups did better on later tests than students who simply re-read their notes. Surprisingly, the audience made almost no difference. Aaltonen argues that the benefit comes from having to explain ideas aloud in one's own words, not from social pressure.\nC  Dr Priya Nandakumar is less enthusiastic. In her classroom trials at schools in Easton, students who taught each other did learn more, but only when the topic was fairly simple. With complex material, such as chemistry equations, many 'teachers' passed on their own mistakes, and their partners learned them too. She suggests that peer teaching should be used mainly for revision, after a teacher has checked students' understanding.\nAll three researchers agree on one point: the effect is strongest when learners must produce an explanation rather than simply listen to one. Where they differ is in how much classroom time schools should give the method, and at what stage of learning it should be used.",
					"question": "The students in Okafor's study who expected to teach later taught a younger pupil.",
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Although neither group actually taught anyone",
					"why": "两组都没真的去教，只是「以为要教」。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "4-6-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Helen Okafor of Westbury College asked 90 students to learn a passage about volcanoes. Half were told they would be tested on it; the other half were told they would have to teach it to a younger pupil. Although neither group actually taught anyone, the second group remembered more of the passage a week later. Okafor believes that expecting to teach makes learners organise information more carefully, but she admits her study cannot show which part of the preparation made the difference.\nB  Professor Martin Aaltonen of Norrby University went further and had students actually teach. Some explained the material to a camera, others to a live audience of classmates. Both groups did better on later tests than students who simply re-read their notes. Surprisingly, the audience made almost no difference. Aaltonen argues that the benefit comes from having to explain ideas aloud in one's own words, not from social pressure.\nC  Dr Priya Nandakumar is less enthusiastic. In her classroom trials at schools in Easton, students who taught each other did learn more, but only when the topic was fairly simple. With complex material, such as chemistry equations, many 'teachers' passed on their own mistakes, and their partners learned them too. She suggests that peer teaching should be used mainly for revision, after a teacher has checked students' understanding.\nAll three researchers agree on one point: the effect is strongest when learners must produce an explanation rather than simply listen to one. Where they differ is in how much classroom time schools should give the method, and at what stage of learning it should be used.",
					"question": "Who found that it made little difference whether anyone was listening?",
					"options": [
						{
							"key": "A",
							"text": "Helen Okafor"
						},
						{
							"key": "B",
							"text": "Martin Aaltonen"
						},
						{
							"key": "C",
							"text": "Priya Nandakumar"
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
						"A": "speaker",
						"C": "speaker"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Surprisingly, the audience made almost no difference.",
					"why": "Aaltonen 让学生对着镜头或对着同学讲，有没有观众差别不大。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase"
					]
				},
				{
					"id": "4-6-A-3",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "A  Dr Helen Okafor of Westbury College asked 90 students to learn a passage about volcanoes. Half were told they would be tested on it; the other half were told they would have to teach it to a younger pupil. Although neither group actually taught anyone, the second group remembered more of the passage a week later. Okafor believes that expecting to teach makes learners organise information more carefully, but she admits her study cannot show which part of the preparation made the difference.\nB  Professor Martin Aaltonen of Norrby University went further and had students actually teach. Some explained the material to a camera, others to a live audience of classmates. Both groups did better on later tests than students who simply re-read their notes. Surprisingly, the audience made almost no difference. Aaltonen argues that the benefit comes from having to explain ideas aloud in one's own words, not from social pressure.\nC  Dr Priya Nandakumar is less enthusiastic. In her classroom trials at schools in Easton, students who taught each other did learn more, but only when the topic was fairly simple. With complex material, such as chemistry equations, many 'teachers' passed on their own mistakes, and their partners learned them too. She suggests that peer teaching should be used mainly for revision, after a teacher has checked students' understanding.\nAll three researchers agree on one point: the effect is strongest when learners must produce an explanation rather than simply listen to one. Where they differ is in how much classroom time schools should give the method, and at what stage of learning it should be used.",
					"question": "Nandakumar found that peer teaching helped students with every kind of topic.",
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
						"TRUE": "qualifier",
						"NOT GIVEN": "not-given"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "but only when the topic was fairly simple",
					"why": "only when the topic was fairly simple：只有内容简单时才有用，every 说过头了。",
					"audio": null,
					"tags": [
						"qualifier"
					]
				},
				{
					"id": "4-6-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Helen Okafor of Westbury College asked 90 students to learn a passage about volcanoes. Half were told they would be tested on it; the other half were told they would have to teach it to a younger pupil. Although neither group actually taught anyone, the second group remembered more of the passage a week later. Okafor believes that expecting to teach makes learners organise information more carefully, but she admits her study cannot show which part of the preparation made the difference.\nB  Professor Martin Aaltonen of Norrby University went further and had students actually teach. Some explained the material to a camera, others to a live audience of classmates. Both groups did better on later tests than students who simply re-read their notes. Surprisingly, the audience made almost no difference. Aaltonen argues that the benefit comes from having to explain ideas aloud in one's own words, not from social pressure.\nC  Dr Priya Nandakumar is less enthusiastic. In her classroom trials at schools in Easton, students who taught each other did learn more, but only when the topic was fairly simple. With complex material, such as chemistry equations, many 'teachers' passed on their own mistakes, and their partners learned them too. She suggests that peer teaching should be used mainly for revision, after a teacher has checked students' understanding.\nAll three researchers agree on one point: the effect is strongest when learners must produce an explanation rather than simply listen to one. Where they differ is in how much classroom time schools should give the method, and at what stage of learning it should be used.",
					"question": "Who recommends using peer teaching mainly after a teacher has checked understanding?",
					"options": [
						{
							"key": "A",
							"text": "Helen Okafor"
						},
						{
							"key": "B",
							"text": "Martin Aaltonen"
						},
						{
							"key": "C",
							"text": "Priya Nandakumar"
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
						"A": "speaker",
						"B": "speaker"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "She suggests that peer teaching should be used mainly for revision, after a teacher has checked students' understanding.",
					"why": "C 段 Nandakumar 建议先让老师检查，再让学生互教复习。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase"
					]
				},
				{
					"id": "4-6-A-5",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "A  Dr Helen Okafor of Westbury College asked 90 students to learn a passage about volcanoes. Half were told they would be tested on it; the other half were told they would have to teach it to a younger pupil. Although neither group actually taught anyone, the second group remembered more of the passage a week later. Okafor believes that expecting to teach makes learners organise information more carefully, but she admits her study cannot show which part of the preparation made the difference.\nB  Professor Martin Aaltonen of Norrby University went further and had students actually teach. Some explained the material to a camera, others to a live audience of classmates. Both groups did better on later tests than students who simply re-read their notes. Surprisingly, the audience made almost no difference. Aaltonen argues that the benefit comes from having to explain ideas aloud in one's own words, not from social pressure.\nC  Dr Priya Nandakumar is less enthusiastic. In her classroom trials at schools in Easton, students who taught each other did learn more, but only when the topic was fairly simple. With complex material, such as chemistry equations, many 'teachers' passed on their own mistakes, and their partners learned them too. She suggests that peer teaching should be used mainly for revision, after a teacher has checked students' understanding.\nAll three researchers agree on one point: the effect is strongest when learners must produce an explanation rather than simply listen to one. Where they differ is in how much classroom time schools should give the method, and at what stage of learning it should be used.",
					"question": "Aaltonen's study lasted longer than Okafor's.",
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "went further and had students actually teach",
					"why": "went further 说的是做法更进一步，不是时间更长。两项研究多长，原文都没说。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "4-6-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Laura Benedetti of Calloway University tested 120 office workers doing a proof-reading task. Those who worked in silence found the most errors. Workers who listened to songs with lyrics performed worst, while instrumental music had only a small effect. Benedetti concludes that words in music compete with the words on the page.\nB  Dr Daniel Osei at the Danford Institute studied a different kind of work: repetitive tasks such as sorting parcels. In his trials, workers who chose their own music sorted about ten per cent faster than those in silence. However, when the music was chosen by a manager, the advantage disappeared. Osei believes that the sense of control, rather than the music itself, explains the result.\nC  Professor Ingrid Halvorsen has studied musicians' own practice habits. She found that most professional musicians avoid listening to music while they study written scores, but many play it while doing household jobs. Halvorsen warns against treating 'music at work' as a single question; the answer, she says, depends almost entirely on the task.\nThe three studies were carried out separately and used different methods, so their figures cannot be directly compared. Even so, each points to the same broad conclusion: whether music helps depends on what the listener is trying to do.",
					"question": "Who suggests that choosing your own music matters more than the music itself?",
					"options": [
						{
							"key": "A",
							"text": "Laura Benedetti"
						},
						{
							"key": "B",
							"text": "Daniel Osei"
						},
						{
							"key": "C",
							"text": "Ingrid Halvorsen"
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
						"A": "speaker",
						"C": "speaker"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Osei believes that the sense of control, rather than the music itself, explains the result.",
					"why": "sense of control = 自己能选。经理选的音乐就没效果了。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase"
					]
				},
				{
					"id": "4-6-B-2",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "A  Dr Laura Benedetti of Calloway University tested 120 office workers doing a proof-reading task. Those who worked in silence found the most errors. Workers who listened to songs with lyrics performed worst, while instrumental music had only a small effect. Benedetti concludes that words in music compete with the words on the page.\nB  Dr Daniel Osei at the Danford Institute studied a different kind of work: repetitive tasks such as sorting parcels. In his trials, workers who chose their own music sorted about ten per cent faster than those in silence. However, when the music was chosen by a manager, the advantage disappeared. Osei believes that the sense of control, rather than the music itself, explains the result.\nC  Professor Ingrid Halvorsen has studied musicians' own practice habits. She found that most professional musicians avoid listening to music while they study written scores, but many play it while doing household jobs. Halvorsen warns against treating 'music at work' as a single question; the answer, she says, depends almost entirely on the task.\nThe three studies were carried out separately and used different methods, so their figures cannot be directly compared. Even so, each points to the same broad conclusion: whether music helps depends on what the listener is trying to do.",
					"question": "In Benedetti's study, instrumental music had no effect on performance.",
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
						"TRUE": "qualifier",
						"NOT GIVEN": "not-given"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "while instrumental music had only a small effect",
					"why": "only a small effect 是「影响小」，不是「没影响」。",
					"audio": null,
					"tags": [
						"qualifier"
					]
				},
				{
					"id": "4-6-B-3",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "A  Dr Laura Benedetti of Calloway University tested 120 office workers doing a proof-reading task. Those who worked in silence found the most errors. Workers who listened to songs with lyrics performed worst, while instrumental music had only a small effect. Benedetti concludes that words in music compete with the words on the page.\nB  Dr Daniel Osei at the Danford Institute studied a different kind of work: repetitive tasks such as sorting parcels. In his trials, workers who chose their own music sorted about ten per cent faster than those in silence. However, when the music was chosen by a manager, the advantage disappeared. Osei believes that the sense of control, rather than the music itself, explains the result.\nC  Professor Ingrid Halvorsen has studied musicians' own practice habits. She found that most professional musicians avoid listening to music while they study written scores, but many play it while doing household jobs. Halvorsen warns against treating 'music at work' as a single question; the answer, she says, depends almost entirely on the task.\nThe three studies were carried out separately and used different methods, so their figures cannot be directly compared. Even so, each points to the same broad conclusion: whether music helps depends on what the listener is trying to do.",
					"question": "Osei's workers who chose their own music worked faster than those who worked in silence.",
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
						"FALSE": "paraphrase",
						"NOT GIVEN": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "workers who chose their own music sorted about ten per cent faster than those in silence",
					"why": "自己选音乐的分拣快了约一成。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "4-6-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Laura Benedetti of Calloway University tested 120 office workers doing a proof-reading task. Those who worked in silence found the most errors. Workers who listened to songs with lyrics performed worst, while instrumental music had only a small effect. Benedetti concludes that words in music compete with the words on the page.\nB  Dr Daniel Osei at the Danford Institute studied a different kind of work: repetitive tasks such as sorting parcels. In his trials, workers who chose their own music sorted about ten per cent faster than those in silence. However, when the music was chosen by a manager, the advantage disappeared. Osei believes that the sense of control, rather than the music itself, explains the result.\nC  Professor Ingrid Halvorsen has studied musicians' own practice habits. She found that most professional musicians avoid listening to music while they study written scores, but many play it while doing household jobs. Halvorsen warns against treating 'music at work' as a single question; the answer, she says, depends almost entirely on the task.\nThe three studies were carried out separately and used different methods, so their figures cannot be directly compared. Even so, each points to the same broad conclusion: whether music helps depends on what the listener is trying to do.",
					"question": "Who studied people whose job is making music?",
					"options": [
						{
							"key": "A",
							"text": "Laura Benedetti"
						},
						{
							"key": "B",
							"text": "Daniel Osei"
						},
						{
							"key": "C",
							"text": "Ingrid Halvorsen"
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
						"A": "speaker",
						"B": "speaker"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Professor Ingrid Halvorsen has studied musicians' own practice habits.",
					"why": "musicians = 以音乐为业的人。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase"
					]
				},
				{
					"id": "4-6-B-5",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "A  Dr Laura Benedetti of Calloway University tested 120 office workers doing a proof-reading task. Those who worked in silence found the most errors. Workers who listened to songs with lyrics performed worst, while instrumental music had only a small effect. Benedetti concludes that words in music compete with the words on the page.\nB  Dr Daniel Osei at the Danford Institute studied a different kind of work: repetitive tasks such as sorting parcels. In his trials, workers who chose their own music sorted about ten per cent faster than those in silence. However, when the music was chosen by a manager, the advantage disappeared. Osei believes that the sense of control, rather than the music itself, explains the result.\nC  Professor Ingrid Halvorsen has studied musicians' own practice habits. She found that most professional musicians avoid listening to music while they study written scores, but many play it while doing household jobs. Halvorsen warns against treating 'music at work' as a single question; the answer, she says, depends almost entirely on the task.\nThe three studies were carried out separately and used different methods, so their figures cannot be directly compared. Even so, each points to the same broad conclusion: whether music helps depends on what the listener is trying to do.",
					"question": "All professional musicians avoid music while reading scores.",
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
						"TRUE": "qualifier",
						"NOT GIVEN": "not-given"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "most professional musicians avoid listening to music while they study written scores",
					"why": "原文是 most（大多数），题目是 all（全部）。",
					"audio": null,
					"tags": [
						"qualifier"
					]
				}
			],
			"id": "4-6",
			"ch": 4,
			"kind": "level",
			"x": 270,
			"y": 195,
			"label": "4-6",
			"name": "六分钟长文",
			"zh": "阅读 · 一篇长文、三位研究者，5 题限时 6 分钟",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "vocab",
			"type": "choice",
			"stations": [
				"5.8"
			],
			"hashtags": [
				"IELTS_5_8"
			],
			"gear": "vocab:5.8",
			"heartGear": "vocab:5.8",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j32",
				"j20",
				"j29"
			],
			"causeGuide": null,
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"keepOrder": false,
			"timed": null,
			"pool": [
				{
					"id": "4-7-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The new rules had a significant ______ on the number of visitors.",
					"options": [
						{
							"key": "A",
							"text": "effect"
						},
						{
							"key": "B",
							"text": "effective"
						},
						{
							"key": "C",
							"text": "effectively"
						},
						{
							"key": "D",
							"text": "effectiveness"
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
						"B": "word-form",
						"C": "word-form",
						"D": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The new rules had a significant effect on the number of visitors.",
					"why": "a significant 后面要名词，而且是「对……的影响」：have an effect on。effectiveness 是「有效程度」，意思不对。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-7-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Small cars are usually more ______ to run than large ones, because they use less fuel.",
					"options": [
						{
							"key": "A",
							"text": "economic"
						},
						{
							"key": "B",
							"text": "economics"
						},
						{
							"key": "C",
							"text": "economical"
						},
						{
							"key": "D",
							"text": "economy"
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
						"A": "word-form",
						"B": "word-form",
						"D": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Small cars are usually more economical to run than large ones, because they use less fuel.",
					"why": "economical = 省钱的；economic = 经济方面的（economic growth）。词根一样，意思不一样。use less fuel 说的是省钱。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-7-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The signing of the agreement was a ______ moment for both countries.",
					"options": [
						{
							"key": "A",
							"text": "historical"
						},
						{
							"key": "B",
							"text": "historic"
						},
						{
							"key": "C",
							"text": "history"
						},
						{
							"key": "D",
							"text": "historian"
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
						"A": "word-form",
						"C": "word-form",
						"D": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The signing of the agreement was a historic moment for both countries.",
					"why": "historic = 有历史意义的、重大的（a historic moment）；historical = 跟历史有关的（historical records）。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-7-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Some plants are highly ______ to small changes in temperature.",
					"options": [
						{
							"key": "A",
							"text": "sensible"
						},
						{
							"key": "B",
							"text": "sensory"
						},
						{
							"key": "C",
							"text": "sensational"
						},
						{
							"key": "D",
							"text": "sensitive"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "word-form",
						"B": "word-form",
						"C": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Some plants are highly sensitive to small changes in temperature.",
					"why": "sensitive to = 对……敏感；sensible = 明智的、有常识的。都是 sens- 开头，意思差很远。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-7-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "A question says: \"The researchers compared two schools.\" Which sentence from a passage says the same thing?",
					"options": [
						{
							"key": "A",
							"text": "A comparison of the two schools was carried out."
						},
						{
							"key": "B",
							"text": "The two schools were comparable in size."
						},
						{
							"key": "C",
							"text": "The schools were in comparatively quiet areas."
						},
						{
							"key": "D",
							"text": "Both schools had a computer room."
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
						"B": "word-form",
						"C": "word-form",
						"D": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "A question says: \"The researchers compared two schools.\" Which sentence from a passage says the same thing?",
					"why": "compared → comparison，换了词形，说的是同一件事。comparable（差不多的）、comparatively（相对地）词根一样，意思不是「比较了」。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-7-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "There is little ______ that the method works in older adults.",
					"options": [
						{
							"key": "A",
							"text": "evident"
						},
						{
							"key": "B",
							"text": "evidence"
						},
						{
							"key": "C",
							"text": "evidently"
						},
						{
							"key": "D",
							"text": "evidenced"
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
						"A": "word-form",
						"C": "word-form",
						"D": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "There is little evidence that the method works in older adults.",
					"why": "little 后面要不可数名词：little evidence that…",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-7-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The project needed a ______ amount of money, far more than the council had expected.",
					"options": [
						{
							"key": "A",
							"text": "considerate"
						},
						{
							"key": "B",
							"text": "considered"
						},
						{
							"key": "C",
							"text": "considering"
						},
						{
							"key": "D",
							"text": "considerable"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "word-form",
						"B": "word-form",
						"C": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The project needed a considerable amount of money, far more than the council had expected.",
					"why": "considerable = 相当大的；considerate = 体贴的。far more than expected 说的是钱多。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-7-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Prices rose for three ______ years before finally falling in 2019.",
					"options": [
						{
							"key": "A",
							"text": "successful"
						},
						{
							"key": "B",
							"text": "succession"
						},
						{
							"key": "C",
							"text": "successive"
						},
						{
							"key": "D",
							"text": "successfully"
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
						"A": "word-form",
						"B": "word-form",
						"D": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Prices rose for three successive years before finally falling in 2019.",
					"why": "successive = 连续的；successful = 成功的。three successive years = 连着三年。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-7-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Visitors are asked to be ______ of the local customs.",
					"options": [
						{
							"key": "A",
							"text": "respectful"
						},
						{
							"key": "B",
							"text": "respectable"
						},
						{
							"key": "C",
							"text": "respective"
						},
						{
							"key": "D",
							"text": "respecting"
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
						"B": "word-form",
						"C": "word-form",
						"D": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Visitors are asked to be respectful of the local customs.",
					"why": "be respectful of = 尊重；respectable = 体面的；respective = 各自的。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-7-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "A question says: \"the analysis of the water samples\". Which sentence from a passage refers to the same step?",
					"options": [
						{
							"key": "A",
							"text": "An analyst chose where the samples would be taken."
						},
						{
							"key": "B",
							"text": "The samples were taken from three rivers."
						},
						{
							"key": "C",
							"text": "The analytical team visited the rivers in spring."
						},
						{
							"key": "D",
							"text": "The water samples were analysed in a laboratory."
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "word-form",
						"B": "word-form",
						"C": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "A question says: \"the analysis of the water samples\". Which sentence from a passage refers to the same step?",
					"why": "analysis → analysed，换了词形，说的是同一步：化验水样。analyst、analytical 词根一样，说的却是选点、去河边。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				}
			],
			"id": "4-7",
			"ch": 4,
			"kind": "level",
			"x": 355,
			"y": 345,
			"label": "4-7",
			"name": "一个词变四样",
			"zh": "词汇 · 一个词变出名词、动词、形容词、副词，放进句子",
			"branch": "vocab"
		},
		{
			"practice": false,
			"skill": "vocab",
			"type": "choice",
			"stations": [
				"5.9"
			],
			"hashtags": [
				"IELTS_5_9"
			],
			"gear": "vocab:5.9",
			"heartGear": "vocab:5.9",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j31",
				"j18",
				"j1"
			],
			"causeGuide": {
				"vocab": "j31"
			},
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"keepOrder": false,
			"timed": null,
			"pool": [
				{
					"id": "4-8-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Older drivers show a ______ to slow down at junctions, even when the road is clear.",
					"options": [
						{
							"key": "A",
							"text": "tendency"
						},
						{
							"key": "B",
							"text": "ability"
						},
						{
							"key": "C",
							"text": "permission"
						},
						{
							"key": "D",
							"text": "pressure"
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
						"C": "vocab",
						"D": "vocab"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Older drivers show a tendency to slow down at junctions, even when the road is clear.",
					"why": "a tendency to do = 往往会做，even when the road is clear 说明是习惯。ability 乍看搭得上，但「放慢的能力」谁都有，说不通。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-8-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The ______ of the discovery was not appreciated until decades later, when it led to a new vaccine.",
					"options": [
						{
							"key": "A",
							"text": "origin"
						},
						{
							"key": "B",
							"text": "accuracy"
						},
						{
							"key": "C",
							"text": "significance"
						},
						{
							"key": "D",
							"text": "timing"
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
						"B": "vocab",
						"D": "vocab"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The significance of the discovery was not appreciated until decades later, when it led to a new vaccine.",
					"why": "后来才明白它有多重要：significance。origin 也能 not appreciated，可 led to a new vaccine 说的是意义。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-8-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Because of the ______ of fresh water on the island, every drop was stored.",
					"options": [
						{
							"key": "A",
							"text": "quality"
						},
						{
							"key": "B",
							"text": "temperature"
						},
						{
							"key": "C",
							"text": "abundance"
						},
						{
							"key": "D",
							"text": "scarcity"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"B": "vocab",
						"C": "vocab"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Because of the scarcity of fresh water on the island, every drop was stored.",
					"why": "每一滴都存起来，说明淡水少：scarcity。abundance 意思反了，quality 搭得上但不是原因。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-8-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Many patients expressed ______ about trying the new treatment, fearing side effects.",
					"options": [
						{
							"key": "A",
							"text": "eagerness"
						},
						{
							"key": "B",
							"text": "reluctance"
						},
						{
							"key": "C",
							"text": "curiosity"
						},
						{
							"key": "D",
							"text": "confidence"
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
						"C": "vocab",
						"D": "vocab"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Many patients expressed reluctance about trying the new treatment, fearing side effects.",
					"why": "fearing side effects 担心副作用，所以是不情愿：reluctance。另外三个都是正面的。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-8-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The hall has a ______ of about 400 people.",
					"options": [
						{
							"key": "A",
							"text": "volume"
						},
						{
							"key": "B",
							"text": "proportion"
						},
						{
							"key": "C",
							"text": "capacity"
						},
						{
							"key": "D",
							"text": "majority"
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
						"B": "vocab",
						"D": "vocab"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The hall has a capacity of about 400 people.",
					"why": "场地能容纳多少人用 capacity。volume 是体积，proportion 是比例，都搭不上「400 人」。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-8-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "With so little money, the council has made road repairs its main ______ this year, ahead of new parks.",
					"options": [
						{
							"key": "A",
							"text": "priority"
						},
						{
							"key": "B",
							"text": "outcome"
						},
						{
							"key": "C",
							"text": "capacity"
						},
						{
							"key": "D",
							"text": "standard"
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
						"C": "vocab",
						"D": "vocab"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "With so little money, the council has made road repairs its main priority this year, ahead of new parks.",
					"why": "ahead of new parks = 排在前面：priority 优先要做的事。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-8-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "There is growing ______ among officials that the policy has not worked.",
					"options": [
						{
							"key": "A",
							"text": "hope"
						},
						{
							"key": "B",
							"text": "demand"
						},
						{
							"key": "C",
							"text": "recognition"
						},
						{
							"key": "D",
							"text": "pressure"
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
						"B": "vocab",
						"D": "vocab"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "There is growing recognition among officials that the policy has not worked.",
					"why": "recognition that… = 越来越多人承认……。hope that 语法通，但没人会盼着政策失败。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-8-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The ______ of the damage only became clear when the full data arrived.",
					"options": [
						{
							"key": "A",
							"text": "origin"
						},
						{
							"key": "B",
							"text": "outcome"
						},
						{
							"key": "C",
							"text": "purpose"
						},
						{
							"key": "D",
							"text": "extent"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "vocab",
						"B": "vocab",
						"C": "vocab"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The extent of the damage only became clear when the full data arrived.",
					"why": "extent = 程度、范围：损失有多大，要等完整数据才知道。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-8-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The study challenges the ______ that bigger schools are always better.",
					"options": [
						{
							"key": "A",
							"text": "assistance"
						},
						{
							"key": "B",
							"text": "assumption"
						},
						{
							"key": "C",
							"text": "quality"
						},
						{
							"key": "D",
							"text": "demand"
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
						"C": "vocab",
						"D": "vocab"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The study challenges the assumption that bigger schools are always better.",
					"why": "that 后面是一个想当然的看法：assumption。always better 正是被挑战的「想当然」。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "4-8-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The ______ of the results was tested by repeating the experiment three times.",
					"options": [
						{
							"key": "A",
							"text": "reliability"
						},
						{
							"key": "B",
							"text": "popularity"
						},
						{
							"key": "C",
							"text": "purpose"
						},
						{
							"key": "D",
							"text": "origin"
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
						"C": "vocab",
						"D": "vocab"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The reliability of the results was tested by repeating the experiment three times.",
					"why": "重复三次实验，检验的是结果靠不靠得住：reliability。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				}
			],
			"id": "4-8",
			"ch": 4,
			"kind": "level",
			"x": 275,
			"y": 280,
			"label": "4-8",
			"name": "看不见摸不着的词",
			"zh": "词汇 · significance、tendency 这类词，读懂意思",
			"branch": "vocab"
		},
		{
			"practice": false,
			"skill": "vocab",
			"type": "gap",
			"stations": [
				"5.9"
			],
			"hashtags": [
				"IELTS_5_9"
			],
			"gear": "typing",
			"heartGear": "typing",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j6",
				"j18",
				"j4"
			],
			"causeGuide": null,
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"keepOrder": false,
			"timed": null,
			"pool": [
				{
					"id": "4-9-A-1",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Spell the word you heard: ______ (a thing that happens and can be observed)",
					"options": null,
					"chips": null,
					"answer": "phenomenon",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": true,
					"lecture": null,
					"evidence": "phenomenon. This phenomenon has been observed in many rivers.",
					"why": "phenomenon 现象。phe-no-me-non，开头 ph。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "N",
								"text": "phenomenon. This phenomenon has been observed in many rivers."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "4-9-A-2",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Spell the word you heard: ______ (standards used to judge something)",
					"options": null,
					"chips": null,
					"answer": "criteria",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": true,
					"lecture": null,
					"evidence": "criteria. The criteria for funding are listed on the website.",
					"why": "criteria 标准，是复数。结尾 -ia。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "N",
								"text": "criteria. The criteria for funding are listed on the website."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "4-9-A-3",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Spell the word you heard: ______ (a careful study of something)",
					"options": null,
					"chips": null,
					"answer": "analysis",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": true,
					"lecture": null,
					"evidence": "analysis. A detailed analysis of the data took six months.",
					"why": "analysis 分析。中间是 y：ana-ly-sis。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "N",
								"text": "analysis. A detailed analysis of the data took six months."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "4-9-A-4",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Spell the word you heard: ______ (large or important)",
					"options": null,
					"chips": null,
					"answer": "significant",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": true,
					"lecture": null,
					"evidence": "significant. There was a significant rise in prices.",
					"why": "significant。sig-ni-fi-cant，结尾 -ant。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "N",
								"text": "significant. There was a significant rise in prices."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "4-9-A-5",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Spell the word you heard: ______ (the conditions around something)",
					"options": null,
					"chips": null,
					"answer": "environment",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": true,
					"lecture": null,
					"evidence": "environment. The environment of the cave stays cool all year.",
					"why": "environment 中间有个 n：enviro-n-ment，最常漏。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "N",
								"text": "environment. The environment of the cave stays cool all year."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "4-9-B-1",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Spell the word you heard: ______ (needed)",
					"options": null,
					"chips": null,
					"answer": "necessary",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": true,
					"lecture": null,
					"evidence": "necessary. It is not necessary to bring food.",
					"why": "necessary：一个 c、两个 s。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "N",
								"text": "necessary. It is not necessary to bring food."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "4-9-B-2",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Spell the word you heard: ______ (something that happens)",
					"options": null,
					"chips": null,
					"answer": "occurrence",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": true,
					"lecture": null,
					"evidence": "occurrence. Floods are a common occurrence in spring.",
					"why": "occurrence：两个 c、两个 r，结尾 -ence。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "N",
								"text": "occurrence. Floods are a common occurrence in spring."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "4-9-B-3",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Spell the word you heard: ______ (the study of the mind)",
					"options": null,
					"chips": null,
					"answer": "psychology",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": true,
					"lecture": null,
					"evidence": "psychology. She studied psychology at university.",
					"why": "psychology 开头的 p 不发音。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "N",
								"text": "psychology. She studied psychology at university."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "4-9-B-4",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Spell the word you heard: ______ (a place to live or stay)",
					"options": null,
					"chips": null,
					"answer": "accommodation",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": true,
					"lecture": null,
					"evidence": "accommodation. Students can apply for accommodation on campus.",
					"why": "accommodation：两个 c、两个 m。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "N",
								"text": "accommodation. Students can apply for accommodation on campus."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "4-9-B-5",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Spell the word you heard: ______ (a list of questions)",
					"options": null,
					"chips": null,
					"answer": "questionnaire",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": true,
					"lecture": null,
					"evidence": "questionnaire. Each visitor completed a short questionnaire.",
					"why": "questionnaire 问卷：两个 n，结尾 -aire。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 0.9,
						"lines": [
							{
								"who": "N",
								"text": "questionnaire. Each visitor completed a short questionnaire."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				}
			],
			"id": "4-9",
			"ch": 4,
			"kind": "level",
			"x": 340,
			"y": 230,
			"label": "4-9",
			"name": "听一遍就拼",
			"zh": "词汇 · 讲座里的学术词，听一遍拼出来",
			"branch": "vocab"
		},
		{
			"practice": false,
			"skill": "grammar",
			"type": "choice",
			"stations": [
				"6.9"
			],
			"hashtags": [
				"IELTS_6_9"
			],
			"gear": "grammar:6.9",
			"heartGear": "vocab:5.8",
			"gearGivesHeart": false,
			"gearButton": "去练一组（不补心）",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j10",
				"j25",
				"j3"
			],
			"causeGuide": null,
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"keepOrder": false,
			"timed": null,
			"pool": [
				{
					"id": "4-10-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Not only ______ the bridge cheaper to build, but it was also faster.",
					"options": [
						{
							"key": "A",
							"text": "was"
						},
						{
							"key": "B",
							"text": "it was"
						},
						{
							"key": "C",
							"text": "did"
						},
						{
							"key": "D",
							"text": "were"
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
						"C": "grammar",
						"D": "grammar"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Not only was the bridge cheaper to build, but it was also faster.",
					"why": "Not only 放句首，后面要倒装：was the bridge。",
					"audio": null,
					"tags": [
						"g-invert"
					]
				},
				{
					"id": "4-10-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Rarely ______ such a large group of birds been recorded.",
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
							"text": "it has"
						},
						{
							"key": "D",
							"text": "had been"
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
						"C": "grammar",
						"D": "grammar"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Rarely has such a large group of birds been recorded.",
					"why": "Rarely 句首倒装；主语是 a large group，单数用 has。",
					"audio": null,
					"tags": [
						"g-invert"
					]
				},
				{
					"id": "4-10-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "It was the cost, not the design, ______ caused the delay.",
					"options": [
						{
							"key": "A",
							"text": "what"
						},
						{
							"key": "B",
							"text": "which it"
						},
						{
							"key": "C",
							"text": "when"
						},
						{
							"key": "D",
							"text": "that"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"B": "grammar",
						"C": "grammar"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "It was the cost, not the design, that caused the delay.",
					"why": "强调句 It was … that …。去掉 It was 和 that，句子还通：the cost caused the delay。",
					"audio": null,
					"tags": [
						"g-invert"
					]
				},
				{
					"id": "4-10-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Only after the results were checked ______ published.",
					"options": [
						{
							"key": "A",
							"text": "the report was"
						},
						{
							"key": "B",
							"text": "did the report"
						},
						{
							"key": "C",
							"text": "was the report"
						},
						{
							"key": "D",
							"text": "the report"
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
						"B": "grammar",
						"D": "grammar"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Only after the results were checked was the report published.",
					"why": "Only after… 放句首，主句要倒装：was the report published。",
					"audio": null,
					"tags": [
						"g-invert"
					]
				},
				{
					"id": "4-10-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "It was only after the third flood ______ the town agreed to build the wall.",
					"options": [
						{
							"key": "A",
							"text": "when"
						},
						{
							"key": "B",
							"text": "which"
						},
						{
							"key": "C",
							"text": "that"
						},
						{
							"key": "D",
							"text": "then"
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
						"B": "grammar",
						"D": "grammar"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "It was only after the third flood that the town agreed to build the wall.",
					"why": "强调句 It was … that…：把 only after the third flood 拿掉，句子还完整（the town agreed to build the wall），所以中间用 that，不用 when。",
					"audio": null,
					"tags": [
						"g-invert"
					]
				},
				{
					"id": "4-10-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Never before ______ the town seen so many visitors.",
					"options": [
						{
							"key": "A",
							"text": "had"
						},
						{
							"key": "B",
							"text": "has been"
						},
						{
							"key": "C",
							"text": "did"
						},
						{
							"key": "D",
							"text": "it had"
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
						"C": "grammar",
						"D": "grammar"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Never before had the town seen so many visitors.",
					"why": "Never before 句首倒装：had the town seen。",
					"audio": null,
					"tags": [
						"g-invert"
					]
				},
				{
					"id": "4-10-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What surprised the researchers ______ how quickly the plants returned.",
					"options": [
						{
							"key": "A",
							"text": "were"
						},
						{
							"key": "B",
							"text": "it was"
						},
						{
							"key": "C",
							"text": "that"
						},
						{
							"key": "D",
							"text": "was"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "grammar",
						"B": "grammar",
						"C": "grammar"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "What surprised the researchers was how quickly the plants returned.",
					"why": "What… 整个从句当主语，看作单数，用 was。",
					"audio": null,
					"tags": [
						"g-invert"
					]
				},
				{
					"id": "4-10-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Not until the 1700s ______ coal widely used in the village.",
					"options": [
						{
							"key": "A",
							"text": "it was"
						},
						{
							"key": "B",
							"text": "did"
						},
						{
							"key": "C",
							"text": "was"
						},
						{
							"key": "D",
							"text": "had"
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
						"B": "grammar",
						"D": "grammar"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Not until the 1700s was coal widely used in the village.",
					"why": "Not until… 句首，主句倒装：was coal widely used（被动）。",
					"audio": null,
					"tags": [
						"g-invert"
					]
				},
				{
					"id": "4-10-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "It is not the price ______ worries most buyers, but the quality.",
					"options": [
						{
							"key": "A",
							"text": "what"
						},
						{
							"key": "B",
							"text": "that"
						},
						{
							"key": "C",
							"text": "who"
						},
						{
							"key": "D",
							"text": "where"
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
						"C": "grammar",
						"D": "grammar"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "It is not the price that worries most buyers, but the quality.",
					"why": "强调句 It is … that …，被强调的是 the price，是物，不用 who。",
					"audio": null,
					"tags": [
						"g-invert"
					]
				},
				{
					"id": "4-10-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Little ______ the volunteers know how popular the event would become.",
					"options": [
						{
							"key": "A",
							"text": "do"
						},
						{
							"key": "B",
							"text": "did"
						},
						{
							"key": "C",
							"text": "had"
						},
						{
							"key": "D",
							"text": "were"
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
						"C": "grammar",
						"D": "grammar"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Little did the volunteers know how popular the event would become.",
					"why": "Little 句首表示「根本没想到」，要倒装；know 是原形，前面借 did。",
					"audio": null,
					"tags": [
						"g-invert"
					]
				}
			],
			"id": "4-10",
			"ch": 4,
			"kind": "level",
			"x": 35,
			"y": 325,
			"label": "4-10",
			"name": "倒过来说",
			"zh": "语法 · Not only、Rarely 放句首要倒装，还有 It is… that 强调句",
			"branch": "grammar"
		},
		{
			"practice": false,
			"skill": "grammar",
			"type": "choice",
			"stations": [
				"6.9"
			],
			"hashtags": [
				"IELTS_6_9"
			],
			"gear": "grammar:6.9",
			"heartGear": "vocab:5.9",
			"gearGivesHeart": false,
			"gearButton": "去练一组（不补心）",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j25",
				"j10",
				"j3"
			],
			"causeGuide": null,
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"keepOrder": false,
			"timed": null,
			"pool": [
				{
					"id": "4-11-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The canal, which was finished in 1802, ______ used by coal boats for a century.",
					"options": [
						{
							"key": "A",
							"text": "were"
						},
						{
							"key": "B",
							"text": "was"
						},
						{
							"key": "C",
							"text": "it was"
						},
						{
							"key": "D",
							"text": "being"
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
						"A": "long-sentence",
						"C": "long-sentence",
						"D": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The canal, which was finished in 1802, was used by coal boats for a century.",
					"why": "跳过两个逗号中间那段：The canal was used…。主语单数用 was。",
					"audio": null,
					"tags": [
						"g-paren"
					]
				},
				{
					"id": "4-11-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Dr Okafor, together with two colleagues, ______ the results last year.",
					"options": [
						{
							"key": "A",
							"text": "published"
						},
						{
							"key": "B",
							"text": "were published"
						},
						{
							"key": "C",
							"text": "publishing"
						},
						{
							"key": "D",
							"text": "have published"
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
						"B": "long-sentence",
						"C": "long-sentence",
						"D": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Dr Okafor, together with two colleagues, published the results last year.",
					"why": "together with… 是插入语，不改变主语。主语是 Dr Okafor，要谓语动词。",
					"audio": null,
					"tags": [
						"g-paren"
					]
				},
				{
					"id": "4-11-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Calvara, a small island off the coast, ______ fewer than 300 residents.",
					"options": [
						{
							"key": "A",
							"text": "have"
						},
						{
							"key": "B",
							"text": "having"
						},
						{
							"key": "C",
							"text": "with"
						},
						{
							"key": "D",
							"text": "has"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "long-sentence",
						"B": "long-sentence",
						"C": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Calvara, a small island off the coast, has fewer than 300 residents.",
					"why": "a small island off the coast 是同位语。主干是 Calvara has…",
					"audio": null,
					"tags": [
						"g-paren"
					]
				},
				{
					"id": "4-11-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The results, as the authors themselves admit, ______ based on a small sample.",
					"options": [
						{
							"key": "A",
							"text": "is"
						},
						{
							"key": "B",
							"text": "being"
						},
						{
							"key": "C",
							"text": "are"
						},
						{
							"key": "D",
							"text": "admit"
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
						"A": "long-sentence",
						"B": "long-sentence",
						"D": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The results, as the authors themselves admit, are based on a small sample.",
					"why": "跳过 as the authors themselves admit，主干是 The results are based…。",
					"audio": null,
					"tags": [
						"g-paren"
					]
				},
				{
					"id": "4-11-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which word is the subject of the main verb? \"The plan, despite strong support from local traders, was rejected.\"",
					"options": [
						{
							"key": "A",
							"text": "traders"
						},
						{
							"key": "B",
							"text": "plan"
						},
						{
							"key": "C",
							"text": "support"
						},
						{
							"key": "D",
							"text": "despite"
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
						"A": "long-sentence",
						"C": "long-sentence",
						"D": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Which word is the subject of the main verb? \"The plan, despite strong support from local traders, was rejected.\"",
					"why": "两个逗号中间是插入语。被拒的是 the plan，不是 traders。",
					"audio": null,
					"tags": [
						"g-paren"
					]
				},
				{
					"id": "4-11-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The book, along with its maps, ______ now kept in the city library.",
					"options": [
						{
							"key": "A",
							"text": "are"
						},
						{
							"key": "B",
							"text": "is"
						},
						{
							"key": "C",
							"text": "being"
						},
						{
							"key": "D",
							"text": "it is"
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
						"A": "long-sentence",
						"C": "long-sentence",
						"D": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The book, along with its maps, is now kept in the city library.",
					"why": "along with its maps 不算进主语。主语 the book 单数用 is。",
					"audio": null,
					"tags": [
						"g-paren"
					]
				},
				{
					"id": "4-11-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Penhallow, where the scheme began, ______ visited by thousands of birdwatchers each year.",
					"options": [
						{
							"key": "A",
							"text": "are"
						},
						{
							"key": "B",
							"text": "it is"
						},
						{
							"key": "C",
							"text": "which is"
						},
						{
							"key": "D",
							"text": "is"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "long-sentence",
						"B": "long-sentence",
						"C": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Penhallow, where the scheme began, is visited by thousands of birdwatchers each year.",
					"why": "跳过 where the scheme began，主干是 Penhallow is visited…。",
					"audio": null,
					"tags": [
						"g-paren"
					]
				},
				{
					"id": "4-11-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Dr Lindqvist, ______ of the report, believes the costs were underestimated.",
					"options": [
						{
							"key": "A",
							"text": "who the author"
						},
						{
							"key": "B",
							"text": "he is the author"
						},
						{
							"key": "C",
							"text": "the author"
						},
						{
							"key": "D",
							"text": "authored"
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
						"A": "long-sentence",
						"B": "long-sentence",
						"D": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Dr Lindqvist, the author of the report, believes the costs were underestimated.",
					"why": "两个逗号中间是同位语，直接放名词短语 the author。",
					"audio": null,
					"tags": [
						"g-paren"
					]
				},
				{
					"id": "4-11-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which word is the subject of the main verb? \"The survey, carried out by students in three towns, found little change.\"",
					"options": [
						{
							"key": "A",
							"text": "survey"
						},
						{
							"key": "B",
							"text": "students"
						},
						{
							"key": "C",
							"text": "towns"
						},
						{
							"key": "D",
							"text": "change"
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
						"B": "long-sentence",
						"C": "long-sentence",
						"D": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Which word is the subject of the main verb? \"The survey, carried out by students in three towns, found little change.\"",
					"why": "carried out by students… 是插入的修饰。发现变化很少的是 the survey。",
					"audio": null,
					"tags": [
						"g-paren"
					]
				},
				{
					"id": "4-11-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The new heater, ______, still uses too much power.",
					"options": [
						{
							"key": "A",
							"text": "however it is efficient"
						},
						{
							"key": "B",
							"text": "it is efficient however"
						},
						{
							"key": "C",
							"text": "efficient however it is"
						},
						{
							"key": "D",
							"text": "however efficient it may be"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "long-sentence",
						"B": "long-sentence",
						"C": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The new heater, however efficient it may be, still uses too much power.",
					"why": "however + 形容词 + 主语 + 动词 = 不管多么……。插在逗号中间，主干照样是 The new heater still uses too much power。",
					"audio": null,
					"tags": [
						"g-paren"
					]
				}
			],
			"id": "4-11",
			"ch": 4,
			"kind": "level",
			"x": 95,
			"y": 245,
			"label": "4-11",
			"name": "跳过两个逗号",
			"zh": "语法 · 跳过两个逗号中间那段，主干照样读通",
			"branch": "grammar"
		},
		{
			"practice": false,
			"skill": "grammar",
			"type": "mixed",
			"stations": [
				"6.9"
			],
			"hashtags": [
				"IELTS_6_9"
			],
			"gear": "grammar:6.9",
			"heartGear": "synonym-match:academic",
			"gearGivesHeart": false,
			"gearButton": "去练一组（不补心）",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j25",
				"j31",
				"j10"
			],
			"causeGuide": null,
			"heartCost": 1,
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"sets": [
				"A",
				"B"
			],
			"retest": true,
			"keepOrder": false,
			"timed": null,
			"pool": [
				{
					"id": "4-12-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What is the main verb? \"The canals that once carried coal through the hills near Ostley, many of which were dug by hand by workers who were paid by the yard, gradually fell out of use as cheaper railways spread across the region in the nineteenth century.\"",
					"options": [
						{
							"key": "A",
							"text": "carried"
						},
						{
							"key": "B",
							"text": "were dug"
						},
						{
							"key": "C",
							"text": "fell"
						},
						{
							"key": "D",
							"text": "spread"
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
						"A": "long-sentence",
						"B": "long-sentence",
						"D": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "What is the main verb? \"The canals that once carried coal through the hills near Ostley, many of which were dug by hand by workers who were paid by the yard, gradually fell out of use as cheaper railways spread across the region in the nineteenth century.\"",
					"why": "主干是 The canals … gradually fell out of use。carried 在 that 从句里，were dug 在 which 从句里，spread 在 as 从句里。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "4-12-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What is the main clause? \"Although the new timetable was criticised by passengers at first, mainly because it meant waiting longer for trains that had once run every ten minutes, most of them now prefer it, partly because the trains are far more reliable.\"",
					"options": [
						{
							"key": "A",
							"text": "most of them now prefer it"
						},
						{
							"key": "B",
							"text": "the new timetable was criticised by passengers"
						},
						{
							"key": "C",
							"text": "trains that had once run every ten minutes"
						},
						{
							"key": "D",
							"text": "the trains are far more reliable"
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
						"B": "long-sentence",
						"C": "long-sentence",
						"D": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "What is the main clause? \"Although the new timetable was criticised by passengers at first, mainly because it meant waiting longer for trains that had once run every ten minutes, most of them now prefer it, partly because the trains are far more reliable.\"",
					"why": "Although 引导让步从句，because 引导原因。剩下能独立成句的是 most of them now prefer it。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "4-12-A-3",
					"set": "A",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "把主干拼出来（有 2 块用不上）：\"The decision to close the two smaller branches, which the board had delayed for almost a year in the hope that visitor numbers would recover, was finally announced in a short statement on Friday.\"",
					"options": null,
					"chips": [
						"The decision",
						"was",
						"finally announced",
						"had delayed",
						"the board"
					],
					"answer": "The decision was finally announced",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "long-sentence",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The decision was finally announced",
					"why": "主语是 The decision（to close… 和 which 从句都是修饰）；the board had delayed 是从句里的主语和动词，真正的谓语是 was finally announced。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "4-12-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What is the subject of \"remains\"? \"The question of whether bees can recognise individual human faces, which several research teams in different countries have tried to answer over the past twenty years, remains open.\"",
					"options": [
						{
							"key": "A",
							"text": "bees"
						},
						{
							"key": "B",
							"text": "several research teams"
						},
						{
							"key": "C",
							"text": "human faces"
						},
						{
							"key": "D",
							"text": "The question"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "long-sentence",
						"B": "long-sentence",
						"C": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "What is the subject of \"remains\"? \"The question of whether bees can recognise individual human faces, which several research teams in different countries have tried to answer over the past twenty years, remains open.\"",
					"why": "主语 The question，谓语 remains，中间是 of whether… 和 which… 两段修饰。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "4-12-A-5",
					"set": "A",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "把这句的主干按顺序拼出来（有 2 块用不上）：\"Most visitors to the new science museum, many of whom arrive with nothing more than a free afternoon and a little curiosity, stay for over three hours.\"",
					"options": null,
					"chips": [
						"Most visitors",
						"stay",
						"for over three hours",
						"arrive",
						"many of whom"
					],
					"answer": "Most visitors stay for over three hours",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "long-sentence",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Most visitors stay for over three hours",
					"why": "去掉介词短语和 many of whom 从句，主干是 Most visitors stay for over three hours。arrive 是从句里的动词。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "4-12-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What is the main verb? \"The library, which was designed in 1902 but left unfinished because the city ran out of money during a long dispute over taxes, was eventually completed by a group of local businesses that wanted a reading room for their workers.\"",
					"options": [
						{
							"key": "A",
							"text": "was designed"
						},
						{
							"key": "B",
							"text": "was completed"
						},
						{
							"key": "C",
							"text": "ran out"
						},
						{
							"key": "D",
							"text": "wanted"
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
						"A": "long-sentence",
						"C": "long-sentence",
						"D": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "What is the main verb? \"The library, which was designed in 1902 but left unfinished because the city ran out of money during a long dispute over taxes, was eventually completed by a group of local businesses that wanted a reading room for their workers.\"",
					"why": "主干 The library … was eventually completed。其他动词都在 which、because、that 从句里。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "4-12-B-2",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "把主干拼出来（有 2 块用不上）：\"Passengers who were allowed to choose their own seats on the early-morning trains during the three-month trial complained less.\"",
					"options": null,
					"chips": [
						"Passengers",
						"complained",
						"less",
						"were allowed",
						"the trial"
					],
					"answer": "Passengers complained less",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "long-sentence",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Passengers complained less",
					"why": "who 从句一直到 trial 才结束，主干是 Passengers complained less。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "4-12-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What is the main clause? \"Because timber brought in by rail from the northern forests was far cheaper to buy than timber cut by hand in the local hills, the sawmill at Easton, which had employed half the town, closed in 1932.\"",
					"options": [
						{
							"key": "A",
							"text": "the sawmill at Easton closed in 1932"
						},
						{
							"key": "B",
							"text": "timber brought in by rail was far cheaper"
						},
						{
							"key": "C",
							"text": "which had employed half the town"
						},
						{
							"key": "D",
							"text": "timber cut by hand in the local hills"
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
						"B": "long-sentence",
						"C": "long-sentence",
						"D": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "What is the main clause? \"Because timber brought in by rail from the northern forests was far cheaper to buy than timber cut by hand in the local hills, the sawmill at Easton, which had employed half the town, closed in 1932.\"",
					"why": "Because 从句在前，which 从句插在中间。主句是 the sawmill at Easton closed in 1932。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "4-12-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What is the subject of \"report\"? \"Volunteers from a local society that has spent several winters counting the birds on the mudflats at the mouth of the river report that numbers have doubled.\"",
					"options": [
						{
							"key": "A",
							"text": "a local society"
						},
						{
							"key": "B",
							"text": "the birds"
						},
						{
							"key": "C",
							"text": "the mudflats"
						},
						{
							"key": "D",
							"text": "Volunteers"
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "long-sentence",
						"B": "long-sentence",
						"C": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "What is the subject of \"report\"? \"Volunteers from a local society that has spent several winters counting the birds on the mudflats at the mouth of the river report that numbers have doubled.\"",
					"why": "主语是 Volunteers。that has spent… 修饰 society，不是主语。report 没有 -s，也说明主语是复数。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "4-12-B-5",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "把这句的主干按顺序拼出来（有 2 块用不上）：\"The runners who trained at high altitude for six weeks before the race, although most of them found the thin air difficult at first, finished faster.\"",
					"options": null,
					"chips": [
						"The runners",
						"finished",
						"faster",
						"trained",
						"the race"
					],
					"answer": "The runners finished faster",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "long-sentence",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The runners finished faster",
					"why": "who 从句和 although 从句都去掉，主干是 The runners finished faster。trained 是从句里的动词。",
					"audio": null,
					"tags": [
						"g-long"
					]
				}
			],
			"id": "4-12",
			"ch": 4,
			"kind": "level",
			"x": 50,
			"y": 165,
			"label": "4-12",
			"name": "长句拆三层",
			"zh": "语法 · 40 词以上的长句，拆成主干、从句、修饰",
			"branch": "grammar"
		},
		{
			"practice": false,
			"skill": "mixed",
			"type": "mixed",
			"stations": [
				"1.9",
				"2.9"
			],
			"hashtags": [
				"IELTS_1_9",
				"IELTS_2_9"
			],
			"gear": "synonym-match:academic",
			"heartGear": "synonym-match:academic",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j27",
				"j28",
				"j9"
			],
			"causeGuide": null,
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
			"keepOrder": false,
			"timed": {
				"totalSeconds": 480,
				"warnAtSecondsLeft": 30,
				"timeoutHeartCost": 1,
				"heartPerUnanswered": 1,
				"maxHeartsPerTry": 2,
				"hitsBoss": false,
				"audioCounts": true,
				"card": "绕路者翻过沙漏：6 题，8 分钟。切出去也在计时，时间到自动交卷，没答的算错。"
			},
			"pool": [
				{
					"id": "boss-A-1",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Early lighthouses on this coast mostly marked ______",
					"options": null,
					"chips": null,
					"answer": "rocks",
					"accept": [
						"dangerous rocks"
					],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Many people assume that lighthouses were mainly built to mark harbours. It's an easy mistake, because that's what most modern harbour lights do. In fact, the early ones on this coast mostly marked dangerous rocks. Several stood miles from any harbour at all.",
					"why": "harbours 是大家以为的，In fact 后面才是讲者的说法：标出礁石。harbours 也放得进空。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Many people assume that lighthouses were mainly built to mark harbours. It's an easy mistake, because that's what most modern harbour lights do. In fact, the early ones on this coast mostly marked dangerous rocks. Several stood miles from any harbour at all."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "boss-A-2",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Keepers' records now help scientists study the ______",
					"options": null,
					"chips": null,
					"answer": "atmosphere",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The keepers had to record the weather every four hours, even at night. For a long time, nobody read these notebooks. Now, though, they are proving useful to scientists who study the atmosphere above the sea.",
					"why": "atmosphere 大气：at-mo-sphere，中间是 ph，不是 f。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "The keepers had to record the weather every four hours, even at night. For a long time, nobody read these notebooks. Now, though, they are proving useful to scientists who study the atmosphere above the sea."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "boss-A-3",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "A typical station was home to ______",
					"options": null,
					"chips": null,
					"answer": "two or three families",
					"accept": [
						"2 or 3 families",
						"families"
					],
					"limit": {
						"words": 4
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Most stations housed two or three families, who shared the work between them. However, a few remote rocks did have a single keeper living alone. But those were the exceptions, not the rule.",
					"why": "反例：However 后面的独居看守是少数（exceptions），重点在转折前：两三家人。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Most stations housed two or three families, who shared the work between them. However, a few remote rocks did have a single keeper living alone. But those were the exceptions, not the rule."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "boss-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Sea glass is broken glass that has been worn smooth by waves and sand. Collectors prize it, and some pieces sell for surprisingly high prices. The most valuable colours are those that were rarely used in the first place, such as red and orange, because few bottles were ever made in them. Green and brown pieces, by contrast, are common and fetch very little.\nOn the beaches near Lynholt, however, collectors report that sea glass is becoming harder to find, even though many of them walk the same stretch of beach every morning at low tide. One reason is that plastic has largely replaced glass in packaging. Another is that fewer people now throw rubbish into the sea, which is, of course, good news for the environment. Prices have risen in recent years as more people have taken up collecting, and some dealers now travel from abroad to buy the rarest colours.\nA local group, the Lynholt Shore Society, has begun recording where and when pieces are found. Members note the place and date of each find and then return the piece to the beach, so that others can enjoy finding it too. They admit that the records are incomplete, since many finds are never reported. Even so, the society believes the data may eventually show how currents move material along the coast. Some members suspect that storms are now carrying glass further out to sea, but so far there is no evidence for this.",
					"question": "Summary: Red and orange sea glass is valuable because it is ______.",
					"options": [
						{
							"key": "A",
							"text": "uncommon"
						},
						{
							"key": "B",
							"text": "smooth"
						},
						{
							"key": "C",
							"text": "ancient"
						},
						{
							"key": "D",
							"text": "fragile"
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
						"B": "summary-fit",
						"C": "summary-fit",
						"D": "summary-fit"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "because few bottles were ever made in them",
					"why": "这两色瓶子本来就做得少 = uncommon。smooth 是所有海玻璃都有的，ancient 原文没说。",
					"audio": null,
					"tags": [
						"summary"
					]
				},
				{
					"id": "boss-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Sea glass is broken glass that has been worn smooth by waves and sand. Collectors prize it, and some pieces sell for surprisingly high prices. The most valuable colours are those that were rarely used in the first place, such as red and orange, because few bottles were ever made in them. Green and brown pieces, by contrast, are common and fetch very little.\nOn the beaches near Lynholt, however, collectors report that sea glass is becoming harder to find, even though many of them walk the same stretch of beach every morning at low tide. One reason is that plastic has largely replaced glass in packaging. Another is that fewer people now throw rubbish into the sea, which is, of course, good news for the environment. Prices have risen in recent years as more people have taken up collecting, and some dealers now travel from abroad to buy the rarest colours.\nA local group, the Lynholt Shore Society, has begun recording where and when pieces are found. Members note the place and date of each find and then return the piece to the beach, so that others can enjoy finding it too. They admit that the records are incomplete, since many finds are never reported. Even so, the society believes the data may eventually show how currents move material along the coast. Some members suspect that storms are now carrying glass further out to sea, but so far there is no evidence for this.",
					"question": "Sea glass on the Lynholt beaches is becoming scarcer partly because",
					"options": [
						{
							"key": "A",
							"text": "collectors are paying higher prices for it."
						},
						{
							"key": "B",
							"text": "the Shore Society removes the pieces it finds."
						},
						{
							"key": "C",
							"text": "plastic is now used for much of the packaging."
						},
						{
							"key": "D",
							"text": "storms are carrying it further out to sea."
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
						"A": "paraphrase",
						"B": "paraphrase",
						"D": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "One reason is that plastic has largely replaced glass in packaging.",
					"why": "原因之一是包装改用塑料。价格涨是另一件事；协会会把玻璃放回海滩；风暴那条原文说没有证据。",
					"audio": null,
					"tags": [
						"sentence-ending",
						"paraphrase"
					]
				},
				{
					"id": "boss-A-6",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "Sea glass is broken glass that has been worn smooth by waves and sand. Collectors prize it, and some pieces sell for surprisingly high prices. The most valuable colours are those that were rarely used in the first place, such as red and orange, because few bottles were ever made in them. Green and brown pieces, by contrast, are common and fetch very little.\nOn the beaches near Lynholt, however, collectors report that sea glass is becoming harder to find, even though many of them walk the same stretch of beach every morning at low tide. One reason is that plastic has largely replaced glass in packaging. Another is that fewer people now throw rubbish into the sea, which is, of course, good news for the environment. Prices have risen in recent years as more people have taken up collecting, and some dealers now travel from abroad to buy the rarest colours.\nA local group, the Lynholt Shore Society, has begun recording where and when pieces are found. Members note the place and date of each find and then return the piece to the beach, so that others can enjoy finding it too. They admit that the records are incomplete, since many finds are never reported. Even so, the society believes the data may eventually show how currents move material along the coast. Some members suspect that storms are now carrying glass further out to sea, but so far there is no evidence for this.",
					"question": "The Lynholt Shore Society has a record of every piece of sea glass found locally.",
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
						"TRUE": "qualifier",
						"NOT GIVEN": "not-given"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "They admit that the records are incomplete",
					"why": "incomplete 不完整，题目说 every piece，说过头了。",
					"audio": null,
					"tags": [
						"qualifier"
					]
				},
				{
					"id": "boss-B-1",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Winter crossings cancelled: water too ______",
					"options": null,
					"chips": null,
					"answer": "rough",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Before the bridge, people crossed the estuary by ferry. In summer, this worked well enough. But crossings were often cancelled in winter, because the water was simply too rough.",
					"why": "rough 波浪大。拼写 r-o-u-g-h，结尾的 gh 读 f。",
					"audio": {
						"voices": {
							"N": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Before the bridge, people crossed the estuary by ferry. In summer, this worked well enough. But crossings were often cancelled in winter, because the water was simply too rough."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "boss-B-2",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Engineers' greatest concern: ______",
					"options": null,
					"chips": null,
					"answer": "safety",
					"accept": [
						"ship safety"
					],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "You might think the engineers' main worry was cost, and the budget certainly was tight. In contrast, the records show that their greatest concern was safety, above all the safety of passing ships.",
					"why": "cost 是「你可能以为」；In contrast 后面才是记录里写的：安全。cost 也放得进空。",
					"audio": {
						"voices": {
							"N": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "You might think the engineers' main worry was cost, and the budget certainly was tight. In contrast, the records show that their greatest concern was safety, above all the safety of passing ships."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "boss-B-3",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Type of bridge: a ______ bridge",
					"options": null,
					"chips": null,
					"answer": "transporter",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The design they chose was quite unusual. An ordinary bridge would have blocked tall ships. So they built what is known as a transporter bridge, and only a handful were ever built anywhere.",
					"why": "transporter：trans-por-ter，结尾 -er。",
					"audio": {
						"voices": {
							"N": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "The design they chose was quite unusual. An ordinary bridge would have blocked tall ships. So they built what is known as a transporter bridge, and only a handful were ever built anywhere."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "boss-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "For most of the nineteenth century, the only way across the Brenmoor estuary was a rowing ferry, owned by two families who charged a penny for each passenger. Crossings were frequently cancelled in winter, when strong winds made the water too rough. Local traders complained that goods were often left waiting on the quay for days, and some moved their business to towns with better roads.\nA bridge was first proposed in 1868, but the plan was rejected because ships needed to reach the port further upstream. The ferry owners had also protested, fearing for their trade, but the council records show that their objection played no part in the decision. A tunnel was considered next, but engineers doubted it could be kept dry. The solution, eventually adopted in 1894, was a transporter bridge: a high frame from which a moving platform carried passengers and carts just above the water. Construction took almost four years.\nThe bridge was not an immediate success. Local newspapers at first called it an expensive toy, and one even predicted that it would be pulled down within ten years. Fares were higher than the ferry's, and many people continued to use the boats for several years. Some passengers also disliked the open platform in bad weather. By 1910, though, the bridge was carrying more than twice as many passengers as the ferry ever had, and the last ferry stopped running two years later.",
					"question": "Summary: Traders were unhappy because goods were frequently ______ on the quay.",
					"options": [
						{
							"key": "A",
							"text": "damaged"
						},
						{
							"key": "B",
							"text": "stolen"
						},
						{
							"key": "C",
							"text": "delayed"
						},
						{
							"key": "D",
							"text": "sold"
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
						"A": "summary-fit",
						"B": "summary-fit",
						"D": "summary-fit"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "goods were often left waiting on the quay for days",
					"why": "left waiting = 被耽搁。damaged、stolen 读着都通，原文没说。",
					"audio": null,
					"tags": [
						"summary"
					]
				},
				{
					"id": "boss-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "For most of the nineteenth century, the only way across the Brenmoor estuary was a rowing ferry, owned by two families who charged a penny for each passenger. Crossings were frequently cancelled in winter, when strong winds made the water too rough. Local traders complained that goods were often left waiting on the quay for days, and some moved their business to towns with better roads.\nA bridge was first proposed in 1868, but the plan was rejected because ships needed to reach the port further upstream. The ferry owners had also protested, fearing for their trade, but the council records show that their objection played no part in the decision. A tunnel was considered next, but engineers doubted it could be kept dry. The solution, eventually adopted in 1894, was a transporter bridge: a high frame from which a moving platform carried passengers and carts just above the water. Construction took almost four years.\nThe bridge was not an immediate success. Local newspapers at first called it an expensive toy, and one even predicted that it would be pulled down within ten years. Fares were higher than the ferry's, and many people continued to use the boats for several years. Some passengers also disliked the open platform in bad weather. By 1910, though, the bridge was carrying more than twice as many passengers as the ferry ever had, and the last ferry stopped running two years later.",
					"question": "The bridge proposed in 1868 was turned down because",
					"options": [
						{
							"key": "A",
							"text": "it would have blocked ships heading for the port."
						},
						{
							"key": "B",
							"text": "the ferry owners protested against it."
						},
						{
							"key": "C",
							"text": "engineers doubted it could be kept dry."
						},
						{
							"key": "D",
							"text": "winter winds would have made it unsafe."
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
						"B": "paraphrase",
						"C": "paraphrase",
						"D": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "the plan was rejected because ships needed to reach the port further upstream",
					"why": "船要开到上游港口，桥会挡路。船东抗议过，但记录说不是否决的原因；「保持干燥」说的是后来的隧道方案。",
					"audio": null,
					"tags": [
						"sentence-ending",
						"paraphrase"
					]
				},
				{
					"id": "boss-B-6",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "For most of the nineteenth century, the only way across the Brenmoor estuary was a rowing ferry, owned by two families who charged a penny for each passenger. Crossings were frequently cancelled in winter, when strong winds made the water too rough. Local traders complained that goods were often left waiting on the quay for days, and some moved their business to towns with better roads.\nA bridge was first proposed in 1868, but the plan was rejected because ships needed to reach the port further upstream. The ferry owners had also protested, fearing for their trade, but the council records show that their objection played no part in the decision. A tunnel was considered next, but engineers doubted it could be kept dry. The solution, eventually adopted in 1894, was a transporter bridge: a high frame from which a moving platform carried passengers and carts just above the water. Construction took almost four years.\nThe bridge was not an immediate success. Local newspapers at first called it an expensive toy, and one even predicted that it would be pulled down within ten years. Fares were higher than the ferry's, and many people continued to use the boats for several years. Some passengers also disliked the open platform in bad weather. By 1910, though, the bridge was carrying more than twice as many passengers as the ferry ever had, and the last ferry stopped running two years later.",
					"question": "Not all travellers were happy to stand on an uncovered platform when the weather was poor.",
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
						"FALSE": "paraphrase",
						"NOT GIVEN": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Some passengers also disliked the open platform in bad weather",
					"why": "Not all… were happy = Some… disliked；uncovered = open；poor weather = bad weather。整句换了说法，意思一样。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "boss-C-1",
					"set": "C",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Main danger in salt making: the ______",
					"options": null,
					"chips": null,
					"answer": "open fires",
					"accept": [
						"fires"
					],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "signpost",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "People usually picture salt making as a quiet, simple job. However, it was extremely hot and dangerous work. And the main risk was not the boiling water itself, but the open fires burning under the pans.",
					"why": "not the boiling water… but the open fires：not A but B，B 才是答案。boiling water 也放得进空。",
					"audio": {
						"voices": {
							"N": "us-ethan"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "People usually picture salt making as a quiet, simple job. However, it was extremely hot and dangerous work. And the main risk was not the boiling water itself, but the open fires burning under the pans."
							}
						]
					},
					"tags": [
						"lecture",
						"signpost"
					]
				},
				{
					"id": "boss-C-2",
					"set": "C",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Loss of woodland: ______",
					"options": null,
					"chips": null,
					"answer": "deforestation",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Huge amounts of firewood were burned every year. As a result, the surrounding woodland gradually disappeared, a process we would now call deforestation. By the 1600s, wood had to be brought in by cart.",
					"why": "deforestation：de-forest-ation，中间是 forest。",
					"audio": {
						"voices": {
							"N": "us-ethan"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Huge amounts of firewood were burned every year. As a result, the surrounding woodland gradually disappeared, a process we would now call deforestation. By the 1600s, wood had to be brought in by cart."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "boss-C-3",
					"set": "C",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Residents sent a ______ to the council",
					"options": null,
					"chips": null,
					"answer": "petition",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "spelling",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "When coal arrived, output rose, and so did the smoke. Residents first complained to the salt makers directly. When that failed, they sent a formal petition to the council.",
					"why": "petition 请愿书。pe-ti-tion，t 不双写。complained 是先找盐场，没用才写请愿书。",
					"audio": {
						"voices": {
							"N": "us-ethan"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "When coal arrived, output rose, and so did the smoke. Residents first complained to the salt makers directly. When that failed, they sent a formal petition to the council."
							}
						]
					},
					"tags": [
						"spelling",
						"plural"
					]
				},
				{
					"id": "boss-C-4",
					"set": "C",
					"type": "choice",
					"skill": null,
					"passage": "In the village of Ardley, salt was produced for centuries by boiling sea water in large metal pans. The work was hot and dangerous, and it required enormous quantities of firewood, so nearby woodland gradually disappeared. By the 1600s, wood had to be brought in by cart from several miles away. Most of the salt was sold in nearby market towns, where it was used to preserve meat and fish through the winter.\nWhen coal became available in the 1700s, the industry changed. Coal was brought to the village by boat from mines further along the coast, and it soon replaced wood entirely. Coal burned at a higher temperature, which allowed larger pans to be used. Output rose sharply, but so did smoke, and residents petitioned the local council about the dirt on their washing. The council ordered the works to build taller chimneys, which helped a little.\nArdley's salt works closed in 1921, unable to compete with salt mined underground elsewhere, which was far cheaper to extract. Several other salt villages along the coast had already closed for the same reason. Archaeologists from Tolland University have since excavated two of them. They suggest that up to sixty people may have worked at the site at its peak, although written records mention only about half that number. The difference may be because women and children, who often worked in the pan houses, were rarely listed by name.",
					"question": "Summary: Coal allowed salt makers to use bigger pans because it produced more ______.",
					"options": [
						{
							"key": "A",
							"text": "smoke"
						},
						{
							"key": "B",
							"text": "heat"
						},
						{
							"key": "C",
							"text": "salt"
						},
						{
							"key": "D",
							"text": "steam"
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
						"A": "summary-fit",
						"C": "summary-fit",
						"D": "summary-fit"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Coal burned at a higher temperature, which allowed larger pans to be used.",
					"why": "higher temperature = more heat。smoke、salt 也变多了，但那是结果，不是能用大锅的原因。",
					"audio": null,
					"tags": [
						"summary"
					]
				},
				{
					"id": "boss-C-5",
					"set": "C",
					"type": "choice",
					"skill": null,
					"passage": "In the village of Ardley, salt was produced for centuries by boiling sea water in large metal pans. The work was hot and dangerous, and it required enormous quantities of firewood, so nearby woodland gradually disappeared. By the 1600s, wood had to be brought in by cart from several miles away. Most of the salt was sold in nearby market towns, where it was used to preserve meat and fish through the winter.\nWhen coal became available in the 1700s, the industry changed. Coal was brought to the village by boat from mines further along the coast, and it soon replaced wood entirely. Coal burned at a higher temperature, which allowed larger pans to be used. Output rose sharply, but so did smoke, and residents petitioned the local council about the dirt on their washing. The council ordered the works to build taller chimneys, which helped a little.\nArdley's salt works closed in 1921, unable to compete with salt mined underground elsewhere, which was far cheaper to extract. Several other salt villages along the coast had already closed for the same reason. Archaeologists from Tolland University have since excavated two of them. They suggest that up to sixty people may have worked at the site at its peak, although written records mention only about half that number. The difference may be because women and children, who often worked in the pan houses, were rarely listed by name.",
					"question": "The Ardley salt works closed because",
					"options": [
						{
							"key": "A",
							"text": "the woodland had disappeared."
						},
						{
							"key": "B",
							"text": "residents complained about the smoke."
						},
						{
							"key": "C",
							"text": "the coal supply ran out."
						},
						{
							"key": "D",
							"text": "salt from mines cost much less to produce."
						}
					],
					"chips": null,
					"answer": "D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "paraphrase",
						"B": "paraphrase",
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "unable to compete with salt mined underground elsewhere, which was far cheaper to extract",
					"why": "竞争不过地下开采的盐，更便宜。树林消失和烟是早先的事，煤用完原文没说。",
					"audio": null,
					"tags": [
						"sentence-ending",
						"paraphrase"
					]
				},
				{
					"id": "boss-C-6",
					"set": "C",
					"type": "TFNG",
					"skill": null,
					"passage": "In the village of Ardley, salt was produced for centuries by boiling sea water in large metal pans. The work was hot and dangerous, and it required enormous quantities of firewood, so nearby woodland gradually disappeared. By the 1600s, wood had to be brought in by cart from several miles away. Most of the salt was sold in nearby market towns, where it was used to preserve meat and fish through the winter.\nWhen coal became available in the 1700s, the industry changed. Coal was brought to the village by boat from mines further along the coast, and it soon replaced wood entirely. Coal burned at a higher temperature, which allowed larger pans to be used. Output rose sharply, but so did smoke, and residents petitioned the local council about the dirt on their washing. The council ordered the works to build taller chimneys, which helped a little.\nArdley's salt works closed in 1921, unable to compete with salt mined underground elsewhere, which was far cheaper to extract. Several other salt villages along the coast had already closed for the same reason. Archaeologists from Tolland University have since excavated two of them. They suggest that up to sixty people may have worked at the site at its peak, although written records mention only about half that number. The difference may be because women and children, who often worked in the pan houses, were rarely listed by name.",
					"question": "Women and children at the salt works earned less than the men did.",
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "women and children, who often worked in the pan houses, were rarely listed by name",
					"why": "原文只说妇女和孩子常在锅房干活、很少被记名字，工钱一个字没提。「很少被记名字」容易让人联想到地位低、钱少，那是脑补。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				}
			],
			"id": "4-boss",
			"ch": 4,
			"kind": "boss",
			"x": 195,
			"y": 90,
			"label": "Boss",
			"name": "绕路者",
			"zh": "Boss · 6 题 8 分钟：听转折、拼学术词、按词性填空、揪出说过头的句子（听力 + 阅读）",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": null,
			"type": null,
			"stations": [],
			"hashtags": [],
			"gear": "dictation",
			"heartGear": null,
			"gearGivesHeart": false,
			"gearButton": null,
			"heartButton": null,
			"shelf": [],
			"causeGuide": null,
			"heartCost": 0,
			"ask": null,
			"need": null,
			"maxWrong": null,
			"sets": [],
			"retest": false,
			"keepOrder": false,
			"timed": null,
			"pool": null,
			"id": "4-gear",
			"ch": 4,
			"kind": "gear",
			"x": 40,
			"y": 500,
			"label": "装备站",
			"name": "装备站",
			"zh": "去装备里练一组，补 1 颗心（语法装备不补心）",
			"branch": "station"
		},
		{
			"practice": false,
			"skill": null,
			"type": null,
			"stations": [],
			"hashtags": [
				"IELTS_1_9",
				"IELTS_2_9"
			],
			"gear": null,
			"heartGear": null,
			"gearGivesHeart": false,
			"gearButton": null,
			"heartButton": null,
			"shelf": [],
			"causeGuide": null,
			"heartCost": 0,
			"ask": null,
			"need": null,
			"maxWrong": null,
			"sets": [],
			"retest": false,
			"keepOrder": false,
			"timed": null,
			"pool": null,
			"id": "4-intel",
			"ch": 4,
			"kind": "news",
			"x": 355,
			"y": 470,
			"label": "情报站",
			"name": "情报站",
			"zh": "去公会看情报帖（不补心，算 Boss 备战的 1 项）",
			"branch": "station"
		},
		{
			"practice": false,
			"skill": null,
			"type": null,
			"stations": [],
			"hashtags": [],
			"gear": null,
			"heartGear": null,
			"gearGivesHeart": false,
			"gearButton": null,
			"heartButton": null,
			"shelf": [],
			"causeGuide": null,
			"heartCost": 0,
			"ask": null,
			"need": null,
			"maxWrong": null,
			"sets": [],
			"retest": false,
			"keepOrder": false,
			"timed": null,
			"pool": null,
			"id": "4-shelf",
			"ch": 4,
			"kind": "shelf",
			"x": 180,
			"y": 215,
			"label": "锦囊书屋",
			"name": "锦囊书屋",
			"zh": "读一本锦囊、做 3 题对 2 题，补 1 颗心",
			"branch": "station"
		}
	],
	"edges": [
		[
			"4-start",
			"4-1",
			"main"
		],
		[
			"4-1",
			"4-2",
			"main"
		],
		[
			"4-2",
			"4-3",
			"main"
		],
		[
			"4-3",
			"4-4",
			"main"
		],
		[
			"4-4",
			"4-5",
			"main"
		],
		[
			"4-5",
			"4-6",
			"main"
		],
		[
			"4-6",
			"4-boss",
			"main"
		],
		[
			"4-3",
			"4-7",
			"vocab"
		],
		[
			"4-7",
			"4-8",
			"vocab"
		],
		[
			"4-8",
			"4-9",
			"vocab"
		],
		[
			"4-9",
			"4-6",
			"vocab"
		],
		[
			"4-4",
			"4-10",
			"grammar"
		],
		[
			"4-10",
			"4-11",
			"grammar"
		],
		[
			"4-11",
			"4-12",
			"grammar"
		],
		[
			"4-1",
			"4-gear",
			"station"
		],
		[
			"4-3",
			"4-intel",
			"station"
		],
		[
			"4-5",
			"4-shelf",
			"station"
		]
	],
	"causeOrder": [
		"time-out",
		"too-hard",
		"long-sentence",
		"grammar",
		"fact-opinion",
		"half-right",
		"main-idea",
		"vocab",
		"word-form",
		"not-given",
		"paraphrase",
		"speaker",
		"direction",
		"same-word",
		"summary-fit",
		"qualifier",
		"signpost",
		"not-heard",
		"spelling"
	],
	"rules": {
		"level": {
			"ask": 5,
			"need": 4,
			"maxWrong": 2,
			"minHeartsToStart": 2,
			"minHeartsToStartPractice": 0,
			"lowHeartsButton": "只剩 1 颗心，先去补一颗"
		},
		"retest": {
			"questions": 3,
			"passAt": 2,
			"heartCost": 0
		},
		"boss": {
			"hp": 5,
			"maxWrong": 2,
			"total": 6,
			"prepRequired": 2,
			"prepOf": 3,
			"extraPrepAfterLossesInARow": 2,
			"resetPrepAfterLossesInARow": null,
			"prep": [
				{
					"id": "guide",
					"zh": "读一本锦囊并过小测（推荐《卡住就先选》）"
				},
				{
					"id": "gear",
					"zh": "去装备练一组（机考打字，或任意一件装备）"
				},
				{
					"id": "intel",
					"zh": "去公会看 1 篇情报帖（#IELTS_1_9 或 #IELTS_2_9）"
				}
			]
		},
		"chest": {
			"sideAt": "4-12",
			"sideXp": 30,
			"clearXp": 100,
			"badge": "ielts-c4"
		},
		"multi": {
			"oneRightCause": "half-right",
			"inBossZh": "Boss 里有 1 道选两个：两个都对才算打中；对一半，不扣血也不扣心。",
			"oneRightZh": "对一半：不扣心，但不算答对（不计入过关的 4 题，不算连胜）"
		},
		"timedCopy": {
			"cardLevel": "限时关 · 5 题 6 分钟。沙漏不停，切出去也在计时，时间到自动交卷，没答的算错。",
			"cardBoss": "绕路者翻过沙漏：6 题，8 分钟。切出去也在计时，时间到自动交卷，没答的算错。",
			"miaFirstTimed": "这关有沙漏。哪题卡住了，就先选一个最像的，往下走。",
			"miaFirstTimedNote": "闯关答一题当场判一题、当场扣心，答过的题不能回头改（路线图 11-11 定），所以不写「回头再看」。待品牌策略审",
			"timer": "⌛ {m}:{ss}",
			"timerAria": "剩余时间 {m} 分 {s} 秒",
			"lastSeconds": "还剩 30 秒",
			"lastSecondsStyle": "数字变红，只说一次，不闪，不响",
			"timeUp": "时间到 · 收卷了",
			"timeUpHoldMs": "1000",
			"unanswered": "还有 {n} 题没答，按错算。",
			"passLevel": "{level} 拿下了 · 用了 {m} 分 {s} 秒",
			"faster": "比上次快 {sec} 秒",
			"slower": "",
			"failByTime": "对 {right} 题，时间到时还有 {n} 题没答。",
			"miaFailByTime": "这次是时间不够。书屋里那本《卡住就先选》讲卡住了怎么办，读完再来。",
			"bossWin": "绕路者倒了！第四章打通 · 用了 {m} 分 {s} 秒",
			"bossLoseByTime": "沙漏漏完了，绕路者赢了这一局。"
		}
	}
};
