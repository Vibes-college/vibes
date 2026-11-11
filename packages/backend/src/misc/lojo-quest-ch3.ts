/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关第3章：地图、关卡、题库（138 题，全部原创）和规则数字。版本 ch3-2026-11-11f。
// 由 apps/community/scripts/quest-chapter.mjs 从路线图的「关卡数据」（chapter-3.json、questions/*.json、numbers.json）生成，不要手改。
// 答案、accept、evidence、录音稿只在服务器上：页面拿到的题目不带这些，作答由 lojo/quest/answer 判。
// 坐标是 390 宽、600 高画布里的位置。难度是「练习难度」，不是官方分数。

import type { QuestCause, QuestChapter } from '@/misc/lojo-quest-types.js';

export type { QuestAudio, QuestCause, QuestChapter, QuestNode, QuestNodeKind, QuestQuestion, QuestRules, QuestTimed } from '@/misc/lojo-quest-types.js';

export const QUEST_CH3: QuestChapter = {
	"id": "ielts-c3",
	"no": 3,
	"version": "ch3-2026-11-11f",
	"title": "第三章 · 拆招",
	"band": "练习难度 6.0–6.5",
	"disclaimer": "练习难度，不是官方分数",
	"bossId": "3-boss",
	"startId": "3-start",
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
			"note": "3-3 之后可以不走阅读，走词汇绕到 3-6；两条路过任一条都能进 3-6"
		},
		"grammar": {
			"zh": "语法支线",
			"note": "3-4 之后开，不挡主线；3-12 过了开支线宝箱"
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
			"id": "3-start",
			"ch": 3,
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
				"1.6"
			],
			"hashtags": [
				"IELTS_1_6"
			],
			"gear": "dictation",
			"heartGear": "dictation",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j19",
				"j26",
				"j15"
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
					"id": "3-1-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Why did the students change their topic?",
					"options": [
						{
							"key": "A",
							"text": "They were no longer interested in food waste."
						},
						{
							"key": "B",
							"text": "The old topic had already been studied a lot."
						},
						{
							"key": "C",
							"text": "The tutor asked them to change it."
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "there's already so much written about it",
					"why": "so much written about it = 已经有很多人研究过。他们不是不感兴趣，是嫌做的人太多。",
					"audio": {
						"voices": {
							"T": "uk-historian",
							"N": "us-hannah",
							"L": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Dr Hale, we've decided to change our topic."
							},
							{
								"who": "T",
								"text": "Oh? I thought you were happy with food waste."
							},
							{
								"who": "L",
								"text": "We were, but there's already so much written about it. We'd rather look at how students choose where to live."
							}
						]
					},
					"tags": [
						"discussion",
						"paraphrase"
					]
				},
				{
					"id": "3-1-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Why does Leo want a bigger survey?",
					"options": [
						{
							"key": "A",
							"text": "to compare two groups of students"
						},
						{
							"key": "B",
							"text": "to finish the project faster"
						},
						{
							"key": "C",
							"text": "because the tutor said fifty was too few"
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "so we can compare first-year and final-year students",
					"why": "first-year and final-year students 换成了 two groups of students。嫌 50 太少的是 Leo，不是老师。",
					"audio": {
						"voices": {
							"T": "uk-historian",
							"N": "us-hannah",
							"L": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "T",
								"text": "How many people will you survey?"
							},
							{
								"who": "N",
								"text": "We planned on fifty, but Leo thinks that's too few."
							},
							{
								"who": "L",
								"text": "Yes, I'd like at least a hundred, so we can compare first-year and final-year students."
							}
						]
					},
					"tags": [
						"discussion",
						"paraphrase"
					]
				},
				{
					"id": "3-1-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What does the tutor say about online questionnaires?",
					"options": [
						{
							"key": "A",
							"text": "They are cheaper than paper."
						},
						{
							"key": "B",
							"text": "Students prefer them."
						},
						{
							"key": "C",
							"text": "People take a long time to answer them."
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
						"B": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "in my experience the replies come back slowly",
					"why": "the replies come back slowly = people take a long time to answer。",
					"audio": {
						"voices": {
							"T": "uk-historian",
							"N": "us-hannah",
							"L": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "L",
								"text": "Should we put the questionnaire online?"
							},
							{
								"who": "T",
								"text": "You could, but in my experience the replies come back slowly. Handing out paper copies in lectures usually works better."
							},
							{
								"who": "N",
								"text": "Fine, paper it is."
							}
						]
					},
					"tags": [
						"discussion",
						"paraphrase"
					]
				},
				{
					"id": "3-1-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What advice does the tutor give?",
					"options": [
						{
							"key": "A",
							"text": "Put all the numbers in one chart."
						},
						{
							"key": "B",
							"text": "Avoid using charts."
						},
						{
							"key": "C",
							"text": "Focus on the most unexpected results."
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
						"B": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Pick the two or three findings that surprised you most.",
					"why": "surprised you most = most unexpected。A 用了原词 chart 和 number，可老师说的是 don't。",
					"audio": {
						"voices": {
							"T": "uk-historian",
							"N": "us-hannah",
							"L": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "We're not sure how to present the results."
							},
							{
								"who": "T",
								"text": "A chart is fine, but don't put every number in it. Pick the two or three findings that surprised you most."
							}
						]
					},
					"tags": [
						"discussion",
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "3-1-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "When must the project be handed in?",
					"options": [
						{
							"key": "A",
							"text": "on the ninth"
						},
						{
							"key": "B",
							"text": "on the twelfth"
						},
						{
							"key": "C",
							"text": "after the holiday"
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "This year it's been moved forward to the ninth",
					"why": "12 号是去年的；moved forward = 提前，提前到 9 号。",
					"audio": {
						"voices": {
							"T": "uk-historian",
							"N": "us-hannah",
							"L": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "L",
								"text": "When's the deadline again? The twelfth?"
							},
							{
								"who": "T",
								"text": "That was last year. This year it's been moved forward to the ninth, because of the holiday."
							}
						]
					},
					"tags": [
						"discussion",
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "3-1-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Why did they choose the library?",
					"options": [
						{
							"key": "A",
							"text": "They work in the library."
						},
						{
							"key": "B",
							"text": "No one has measured the noise there yet."
						},
						{
							"key": "C",
							"text": "The tutor suggested it."
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "nobody has actually measured it",
					"why": "nobody has actually measured it = no one has measured the noise yet。",
					"audio": {
						"voices": {
							"T": "au-friendly",
							"S": "us-ethan",
							"A": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "A",
								"text": "We'd like to study noise in the library for our project."
							},
							{
								"who": "T",
								"text": "Interesting. Why the library?"
							},
							{
								"who": "S",
								"text": "Because lots of students complain they can't concentrate there, but nobody has actually measured it."
							}
						]
					},
					"tags": [
						"discussion",
						"paraphrase"
					]
				},
				{
					"id": "3-1-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "How often will they record the noise?",
					"options": [
						{
							"key": "A",
							"text": "every two hours"
						},
						{
							"key": "B",
							"text": "every hour"
						},
						{
							"key": "C",
							"text": "only in the evening"
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Every two hours would be enough … I agree with Amy.",
					"why": "每小时是 Sam 的提议；老师同意的是 Amy 的「每两小时」。",
					"audio": {
						"voices": {
							"T": "au-friendly",
							"S": "us-ethan",
							"A": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "S",
								"text": "We could record the noise every hour."
							},
							{
								"who": "A",
								"text": "That's a lot of data. Every two hours would be enough, and we could do mornings and evenings."
							},
							{
								"who": "T",
								"text": "I agree with Amy."
							}
						]
					},
					"tags": [
						"discussion",
						"paraphrase"
					]
				},
				{
					"id": "3-1-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "How will they get a sound meter?",
					"options": [
						{
							"key": "A",
							"text": "buy one"
						},
						{
							"key": "B",
							"text": "share one with another group"
						},
						{
							"key": "C",
							"text": "borrow one from a department"
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
						"B": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The science department lends them out for free.",
					"why": "lends them out = 可以借。buy 是 Amy 原来的打算，被老师否了。",
					"audio": {
						"voices": {
							"T": "au-friendly",
							"S": "us-ethan",
							"A": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "T",
								"text": "Have you thought about the equipment?"
							},
							{
								"who": "A",
								"text": "We were going to buy a sound meter."
							},
							{
								"who": "T",
								"text": "There's no need. The science department lends them out for free. Just book one a week ahead."
							}
						]
					},
					"tags": [
						"discussion",
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "3-1-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What was the problem with the first draft?",
					"options": [
						{
							"key": "A",
							"text": "The parts were in the wrong order."
						},
						{
							"key": "B",
							"text": "The ideas were weak."
						},
						{
							"key": "C",
							"text": "It was too short."
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The problem was the order.",
					"why": "the order = 先后顺序。老师先说了 ideas were fine，A 正好说反。",
					"audio": {
						"voices": {
							"T": "au-friendly",
							"S": "us-ethan",
							"A": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "S",
								"text": "What was wrong with our first draft?"
							},
							{
								"who": "T",
								"text": "The ideas were fine. The problem was the order. You described the results before you explained how you collected them."
							}
						]
					},
					"tags": [
						"discussion",
						"paraphrase"
					]
				},
				{
					"id": "3-1-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What can the students do with the other group?",
					"options": [
						{
							"key": "A",
							"text": "write one report together"
						},
						{
							"key": "B",
							"text": "use the same equipment"
						},
						{
							"key": "C",
							"text": "give a joint presentation"
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "You can share the equipment with them",
					"why": "share the equipment = use the same equipment。报告必须各写各的。",
					"audio": {
						"voices": {
							"T": "au-friendly",
							"S": "us-ethan",
							"A": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "A",
								"text": "Can we work with the other group?"
							},
							{
								"who": "T",
								"text": "You can share the equipment with them, but each group has to write its own report."
							}
						]
					},
					"tags": [
						"discussion",
						"paraphrase"
					]
				}
			],
			"id": "3-1",
			"ch": 3,
			"kind": "level",
			"x": 285,
			"y": 520,
			"label": "3-1",
			"name": "课堂讨论",
			"zh": "听力 · 老师和两个学生讨论作业，选对的说法",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "listening",
			"type": "multi",
			"stations": [
				"1.7"
			],
			"hashtags": [
				"IELTS_1_7"
			],
			"gear": "dictation",
			"heartGear": "dictation",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j24",
				"j4",
				"j19"
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
					"id": "3-2-A-1",
					"set": "A",
					"type": "multi",
					"skill": null,
					"passage": null,
					"question": "Which TWO things must volunteers be able to do?",
					"options": [
						{
							"key": "A",
							"text": "show previous experience"
						},
						{
							"key": "B",
							"text": "speak a second language"
						},
						{
							"key": "C",
							"text": "talk to groups of people with confidence"
						},
						{
							"key": "D",
							"text": "attend training before the first day"
						},
						{
							"key": "E",
							"text": "come in one weekend a month or more"
						}
					],
					"chips": null,
					"answer": "C,E",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "half-right",
						"B": "half-right",
						"D": "half-right"
					},
					"pick": 2,
					"bothWrongCause": "not-heard",
					"playOnce": false,
					"lecture": null,
					"evidence": "we need you here at least one weekend in every month … you need to be happy standing up in front of a group and talking",
					"why": "can't be flexible about = 必须；happy standing up in front of a group and talking = talk to groups with confidence。经验是 welcome 但 not a requirement；培训「以前」在开始前一周，现在改到第一天上午；外语只是 a bonus。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "So, what do we look for in volunteers? Previous experience is always welcome, but we've had people who'd never done anything like this and were brilliant, so we don't treat it as a requirement. Training used to happen the week before you start; now it all takes place on your first morning. What we really can't be flexible about is availability: we need you here at least one weekend in every month. And because most of the job is leading tours, you need to be happy standing up in front of a group and talking. A second language? It's a bonus on some tours, nothing more."
							}
						]
					},
					"tags": [
						"choice",
						"distractor"
					]
				},
				{
					"id": "3-2-A-2",
					"set": "A",
					"type": "multi",
					"skill": null,
					"passage": null,
					"question": "Which TWO things about the trip were positive?",
					"options": [
						{
							"key": "A",
							"text": "the guide"
						},
						{
							"key": "B",
							"text": "the journey"
						},
						{
							"key": "C",
							"text": "the time at the lake"
						},
						{
							"key": "D",
							"text": "the food"
						},
						{
							"key": "E",
							"text": "what they learnt"
						}
					],
					"chips": null,
					"answer": "A,E",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "half-right",
						"C": "half-right",
						"D": "half-right"
					},
					"pick": 2,
					"bothWrongCause": "paraphrase",
					"playOnce": false,
					"lecture": null,
					"evidence": "The guide was brilliant, honestly. … I learnt more about rivers in a day than in a whole term.",
					"why": "夸了导游和学到的东西；车慢、湖边只待一小时、午饭难吃都是缺点。",
					"audio": {
						"voices": {
							"J": "au-felix",
							"M": "us-hannah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "J",
								"text": "What did you think of the field trip?"
							},
							{
								"who": "M",
								"text": "The guide was brilliant, honestly. But the bus took ages, and we only had an hour at the lake."
							},
							{
								"who": "J",
								"text": "True. And lunch was terrible. Still, I learnt more about rivers in a day than in a whole term."
							}
						]
					},
					"tags": [
						"choice",
						"discussion",
						"paraphrase"
					]
				},
				{
					"id": "3-2-A-3",
					"set": "A",
					"type": "multi",
					"skill": null,
					"passage": null,
					"question": "Which TWO changes will happen next month?",
					"options": [
						{
							"key": "A",
							"text": "The pool will open earlier."
						},
						{
							"key": "B",
							"text": "Prices will go up."
						},
						{
							"key": "C",
							"text": "The gym will open for longer."
						},
						{
							"key": "D",
							"text": "Members can book classes without calling."
						},
						{
							"key": "E",
							"text": "New classes will be added."
						}
					],
					"chips": null,
					"answer": "A,D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "half-right",
						"C": "half-right",
						"E": "half-right"
					},
					"pick": 2,
					"bothWrongCause": "not-heard",
					"playOnce": false,
					"lecture": null,
					"evidence": "the pool will open at six instead of seven … you'll be able to reserve a place in any class through our app, so there'll be no need to ring reception",
					"why": "six instead of seven = 提早一小时；no need to ring reception = without calling。涨价 put off until next year，健身房延长 hasn't approved，新瑜伽课 not before the spring：三个都提到了，都不是下个月。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Right, a few updates for next month. You may have heard a rumour that membership fees are going up; I can tell you that's been put off until next year. What is happening is that the pool will open at six instead of seven. The gym was going to stay open until eleven, but the council hasn't approved that yet, so for now it still closes at ten. We're hoping to add some new yoga classes, though not before the spring. And the other change: you'll be able to reserve a place in any class through our app, so there'll be no need to ring reception."
							}
						]
					},
					"tags": [
						"choice",
						"distractor"
					]
				},
				{
					"id": "3-2-A-4",
					"set": "A",
					"type": "multi",
					"skill": null,
					"passage": null,
					"question": "Which TWO reasons does David give for his choice?",
					"options": [
						{
							"key": "A",
							"text": "a work placement on the course"
						},
						{
							"key": "B",
							"text": "his friends studied there"
						},
						{
							"key": "C",
							"text": "financial support"
						},
						{
							"key": "D",
							"text": "the size of the campus"
						},
						{
							"key": "E",
							"text": "the city"
						}
					],
					"chips": null,
					"answer": "A,C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "half-right",
						"D": "half-right",
						"E": "half-right"
					},
					"pick": 2,
					"bothWrongCause": "not-heard",
					"playOnce": false,
					"lecture": null,
					"evidence": "there's a year working in a company … without the scholarship I simply couldn't have afforded it",
					"why": "a year working in a company = work placement；scholarship = financial support。朋友是「一开始」的打算，后来没去成；城市他喜欢，但 I'd have come anyway，说明不是原因。",
					"audio": {
						"voices": {
							"L": "us-hannah",
							"D": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "L",
								"text": "Why did you choose this university in the end?"
							},
							{
								"who": "D",
								"text": "At first I was going to go wherever my friends went, but they all ended up somewhere else. What actually decided it was the course: there's a year working in a company, which none of the others offered. People assume I came for the city, and I do love it, but I'd have come anyway. And without the scholarship I simply couldn't have afforded it."
							}
						]
					},
					"tags": [
						"choice",
						"distractor"
					]
				},
				{
					"id": "3-2-A-5",
					"set": "A",
					"type": "multi",
					"skill": null,
					"passage": null,
					"question": "Which TWO things can students bring into the reading room?",
					"options": [
						{
							"key": "A",
							"text": "a phone with the sound on"
						},
						{
							"key": "B",
							"text": "a laptop"
						},
						{
							"key": "C",
							"text": "a cup of coffee"
						},
						{
							"key": "D",
							"text": "a sandwich"
						},
						{
							"key": "E",
							"text": "water in a closed bottle"
						}
					],
					"chips": null,
					"answer": "B,E",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "half-right",
						"C": "half-right",
						"D": "half-right"
					},
					"pick": 2,
					"bothWrongCause": "paraphrase",
					"playOnce": false,
					"lecture": null,
					"evidence": "Laptops are fine, and so is water, as long as it's in a bottle with a lid.",
					"why": "a bottle with a lid = a closed bottle。咖啡是 hot drink，三明治是 food，都留在外面。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Students often ask what they can bring into the reading room. Laptops are fine, and so is water, as long as it's in a bottle with a lid. Hot drinks and food have to stay outside, and phones must be on silent."
							}
						]
					},
					"tags": [
						"choice",
						"discussion",
						"paraphrase"
					]
				},
				{
					"id": "3-2-B-1",
					"set": "B",
					"type": "multi",
					"skill": null,
					"passage": null,
					"question": "Which TWO parts count towards the final mark?",
					"options": [
						{
							"key": "A",
							"text": "weekly quizzes"
						},
						{
							"key": "B",
							"text": "an exam"
						},
						{
							"key": "C",
							"text": "a talk given with other students"
						},
						{
							"key": "D",
							"text": "attendance"
						},
						{
							"key": "E",
							"text": "a written report"
						}
					],
					"chips": null,
					"answer": "C,E",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "half-right",
						"B": "half-right",
						"D": "half-right"
					},
					"pick": 2,
					"bothWrongCause": "not-heard",
					"playOnce": false,
					"lecture": null,
					"evidence": "half the mark comes from a presentation that you'll prepare and give in teams of three in week six … The rest of the mark depends on a written report",
					"why": "a presentation … in teams of three = a talk given with other students；the rest of the mark = 另一半分。考试是去年的，already gone；出勤 doesn't count；每周小测 thought about，没采用。",
					"audio": {
						"voices": {
							"N": "us-selene"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Let me explain how this module is assessed, because it's changed since last year. Last year there was a final exam, but students found it too stressful, so that's gone. Instead, half the mark comes from a presentation that you'll prepare and give in teams of three in week six. Some of you asked whether attendance counts. It doesn't, although I will notice if you're not here. The rest of the mark depends on a written report, due at the end of term. We did think about weekly quizzes, but decided they'd add too much work."
							}
						]
					},
					"tags": [
						"choice",
						"distractor"
					]
				},
				{
					"id": "3-2-B-2",
					"set": "B",
					"type": "multi",
					"skill": null,
					"passage": null,
					"question": "Which TWO good points does Sam mention?",
					"options": [
						{
							"key": "A",
							"text": "the location"
						},
						{
							"key": "B",
							"text": "the drinks"
						},
						{
							"key": "C",
							"text": "the seats"
						},
						{
							"key": "D",
							"text": "the low prices"
						},
						{
							"key": "E",
							"text": "the calm atmosphere"
						}
					],
					"chips": null,
					"answer": "B,E",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "half-right",
						"C": "half-right",
						"D": "half-right"
					},
					"pick": 2,
					"bothWrongCause": "paraphrase",
					"playOnce": false,
					"lecture": null,
					"evidence": "The coffee was excellent, and it was really quiet",
					"why": "coffee = the drinks；really quiet = calm atmosphere。离校远、椅子不舒服是缺点，价格没提。",
					"audio": {
						"voices": {
							"K": "au-friendly",
							"S": "us-ethan"
						},
						"rate": 1,
						"lines": [
							{
								"who": "K",
								"text": "How was the new café?"
							},
							{
								"who": "S",
								"text": "The coffee was excellent, and it was really quiet, so I got loads of work done. But it's a bit far from campus, and the chairs aren't very comfortable."
							}
						]
					},
					"tags": [
						"choice",
						"discussion",
						"paraphrase"
					]
				},
				{
					"id": "3-2-B-3",
					"set": "B",
					"type": "multi",
					"skill": null,
					"passage": null,
					"question": "Which TWO things are visitors asked to do today?",
					"options": [
						{
							"key": "A",
							"text": "not take photos"
						},
						{
							"key": "B",
							"text": "carry their rubbish back"
						},
						{
							"key": "C",
							"text": "walk in pairs"
						},
						{
							"key": "D",
							"text": "use the bins on the trail"
						},
						{
							"key": "E",
							"text": "stay on the path"
						}
					],
					"chips": null,
					"answer": "B,E",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "half-right",
						"C": "half-right",
						"D": "half-right"
					},
					"pick": 2,
					"bothWrongCause": "not-heard",
					"playOnce": false,
					"lecture": null,
					"evidence": "Please don't wander off the path … anything you bring in, you take back out with you",
					"why": "don't wander off the path = stay on the path；anything you bring in, you take back out = 垃圾自己带回去。两人一组「平时」要，今天 not necessary；垃圾桶 used to be，已经拆了；拍照随便拍。",
					"audio": {
						"voices": {
							"N": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Before we set off, just a couple of things. I'd normally ask you to walk in pairs, but since the group's small today, that's not necessary. Please don't wander off the path: the plants on either side are protected. There used to be bins along the trail, but they attracted animals, so they've been removed, which means anything you bring in, you take back out with you. Photos? Go ahead, as many as you like."
							}
						]
					},
					"tags": [
						"choice",
						"distractor"
					]
				},
				{
					"id": "3-2-B-4",
					"set": "B",
					"type": "multi",
					"skill": null,
					"passage": null,
					"question": "Which TWO things does Amy want?",
					"options": [
						{
							"key": "A",
							"text": "work near home"
						},
						{
							"key": "B",
							"text": "high pay"
						},
						{
							"key": "C",
							"text": "hours that suit her timetable"
						},
						{
							"key": "D",
							"text": "a chance to use a foreign language"
						},
						{
							"key": "E",
							"text": "a job linked to her degree"
						}
					],
					"chips": null,
					"answer": "C,D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "half-right",
						"B": "half-right",
						"E": "half-right"
					},
					"pick": 2,
					"bothWrongCause": "paraphrase",
					"playOnce": false,
					"lecture": null,
					"evidence": "I want something that fits around my lectures, and I'd like to use my Spanish.",
					"why": "fits around my lectures = hours that suit her timetable；Spanish = a foreign language。跟专业相关是 not essential。",
					"audio": {
						"voices": {
							"T": "us-ethan",
							"A": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "T",
								"text": "What do you want from a part-time job?"
							},
							{
								"who": "A",
								"text": "Honestly, the money isn't the main thing. I want something that fits around my lectures, and I'd like to use my Spanish."
							},
							{
								"who": "T",
								"text": "Not something related to your degree?"
							},
							{
								"who": "A",
								"text": "That would be nice, but it's not essential."
							}
						]
					},
					"tags": [
						"choice",
						"discussion",
						"paraphrase"
					]
				},
				{
					"id": "3-2-B-5",
					"set": "B",
					"type": "multi",
					"skill": null,
					"passage": null,
					"question": "Which TWO problems did cyclists complain about most?",
					"options": [
						{
							"key": "A",
							"text": "steep roads"
						},
						{
							"key": "B",
							"text": "cars blocking cycle lanes"
						},
						{
							"key": "C",
							"text": "too few secure places to park bikes"
						},
						{
							"key": "D",
							"text": "expensive repairs"
						},
						{
							"key": "E",
							"text": "bad weather"
						}
					],
					"chips": null,
					"answer": "B,C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "half-right",
						"D": "half-right",
						"E": "half-right"
					},
					"pick": 2,
					"bothWrongCause": "not-heard",
					"playOnce": false,
					"lecture": null,
					"evidence": "By far the most frequent complaint was drivers leaving their cars in bike lanes, followed closely by how hard it is to find somewhere secure to lock a bike in the town centre.",
					"why": "by far the most frequent + followed closely = 排第一、第二。天气 came up 但 far less often，修车贵 not near the top：五个都被提到，要听排名。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "We surveyed three hundred local cyclists. We'd expected the weather to top the list of complaints, and it did come up, but far less often than we'd thought. Hills were barely mentioned. The cost of repairs came up quite a few times, though it wasn't near the top. By far the most frequent complaint was drivers leaving their cars in bike lanes, followed closely by how hard it is to find somewhere secure to lock a bike in the town centre."
							}
						]
					},
					"tags": [
						"choice",
						"distractor"
					]
				}
			],
			"id": "3-2",
			"ch": 3,
			"kind": "level",
			"x": 200,
			"y": 440,
			"label": "3-2",
			"name": "选两个",
			"zh": "听力 · 五个选项选两个，两个都对才算答对",
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
				"j26",
				"j15",
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
					"id": "3-3-A-1",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Topic of study: how people use public ______ in a park",
					"options": null,
					"chips": null,
					"answer": "benches",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": {
						"id": "3-3-A",
						"part": 1,
						"of": 5
					},
					"evidence": "looking at how people use public benches",
					"why": "开头这句话就是整场讲座的路线图：方法 → 发现 → 建议。复数 benches，少了 es 算错。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Good morning. Today I'll describe a small study we carried out in Marlow Park, looking at how people use public benches. I'll start with how we collected the data, then go through what we found, and finish with what we've told the council."
							}
						]
					},
					"tags": [
						"form",
						"word-limit",
						"spelling",
						"plural"
					]
				},
				{
					"id": "3-3-A-2",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Length of study: ______ weeks",
					"options": null,
					"chips": null,
					"answer": "6",
					"accept": [
						"six"
					],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": {
						"id": "3-3-A",
						"part": 2,
						"of": 5
					},
					"evidence": "in the end we had six weeks",
					"why": "a whole term 是原计划，in the end 后面才是实际的六周。early afternoon 是时段，不是答案。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "So, first, the method. We'd originally planned to watch the benches for a whole term, but in the end we had six weeks, and we went mainly in the early afternoon, when the park is busiest."
							}
						]
					},
					"tags": [
						"numbers",
						"form"
					]
				},
				{
					"id": "3-3-A-3",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Biggest influence on use: ______",
					"options": null,
					"chips": null,
					"answer": "shade",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "paraphrase",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": {
						"id": "3-3-A",
						"part": 3,
						"of": 5
					},
					"evidence": "The single most important factor turned out to be shade",
					"why": "Moving on 提示换到「发现」这一段。most important factor = biggest influence。新旧 made almost no difference；three times 是干扰的数字。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Moving on to what we found. We'd assumed the newest benches would be the most popular, but their age made almost no difference. The single most important factor turned out to be shade: benches under trees were used three times as often as those in the sun."
							}
						]
					},
					"tags": [
						"lecture",
						"paraphrase"
					]
				},
				{
					"id": "3-3-A-4",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "People chose benches where they could watch other ______",
					"options": null,
					"chips": null,
					"answer": "people",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "paraphrase",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": {
						"id": "3-3-A",
						"part": 4,
						"of": 5
					},
					"evidence": "What they wanted was a view of other people.",
					"why": "a view of other people = 能看到别人。笔记把 view 换成了 watch。even when … in the shade 说明这一条比「阴凉」还管用。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "The second finding surprised us more. People rarely chose benches that faced a wall, even when those benches were in the shade. What they wanted was a view of other people."
							}
						]
					},
					"tags": [
						"lecture",
						"paraphrase"
					]
				},
				{
					"id": "3-3-A-5",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Advice: put new benches close to ______",
					"options": null,
					"chips": null,
					"answer": "footpaths",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "paraphrase",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": {
						"id": "3-3-A",
						"part": 5,
						"of": 5
					},
					"evidence": "they should be placed near footpaths",
					"why": "near = close to。quiet corners 是议会的想法，讲者说 the opposite。footpaths 是复数。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Finally, our recommendations. The council had suggested putting new benches in quiet corners, away from the noise. Our advice is the opposite: they should be placed near footpaths."
							}
						]
					},
					"tags": [
						"lecture",
						"paraphrase",
						"spelling",
						"plural"
					]
				},
				{
					"id": "3-3-B-1",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Two groups: notes written by hand vs notes ______ on a laptop",
					"options": null,
					"chips": null,
					"answer": "typed",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "not-heard",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": {
						"id": "3-3-B",
						"part": 1,
						"of": 5
					},
					"evidence": "students who typed them on a laptop",
					"why": "开头先给了路线图：两组 → 结果 → 建议。typed them = 打字记的笔记。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "In this lecture I'll report on a study of note-taking. I'll describe the two groups first, then the results, and then what I think it means for you. We compared students who wrote notes by hand with students who typed them on a laptop."
							}
						]
					},
					"tags": [
						"form",
						"word-limit"
					]
				},
				{
					"id": "3-3-B-2",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Typists produced about ______ times as many words",
					"options": null,
					"chips": null,
					"answer": "2",
					"accept": [
						"two"
					],
					"limit": {
						"words": 1,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "paraphrase",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": {
						"id": "3-3-B",
						"part": 2,
						"of": 5
					},
					"evidence": "they wrote roughly twice as many words",
					"why": "twice as many = 2 times as many。a little faster 是速度，不是字数。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Let's look at the results. You might expect the typists to be a little faster, and they were, but the real difference was in the amount: they wrote roughly twice as many words."
							}
						]
					},
					"tags": [
						"lecture",
						"paraphrase",
						"numbers",
						"form"
					]
				},
				{
					"id": "3-3-B-3",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "After one ______, hand-writers recalled more",
					"options": null,
					"chips": null,
					"answer": "week",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "paraphrase",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": {
						"id": "3-3-B",
						"part": 3,
						"of": 5
					},
					"evidence": "It was only when we tested them again a week later that the hand-writers remembered more of the main ideas.",
					"why": "the next day 测的时候 hardly any difference；a week later 才拉开。remembered = recalled。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "However, that's not the whole story. We tested both groups the next day, and there was hardly any difference. It was only when we tested them again a week later that the hand-writers remembered more of the main ideas."
							}
						]
					},
					"tags": [
						"lecture",
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "3-3-B-4",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Reason: hand-writers have to ______ rather than copy",
					"options": null,
					"chips": null,
					"answer": "summarise",
					"accept": [
						"summarize"
					],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "paraphrase",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": {
						"id": "3-3-B",
						"part": 4,
						"of": 5
					},
					"evidence": "students are forced to summarise instead of copying every word",
					"why": "「纸不分心」是 some people think，讲者说 little evidence。are forced to = have to；instead of = rather than。英式 -ise、美式 -ize 都算对。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Why might that be? Some people think it's because paper is less distracting, but we found little evidence for that. Our explanation is that writing by hand is slower, so students are forced to summarise instead of copying every word."
							}
						]
					},
					"tags": [
						"lecture",
						"paraphrase",
						"spelling",
						"plural"
					]
				},
				{
					"id": "3-3-B-5",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Advice: do not ______ laptops; type less and use your own words",
					"options": null,
					"chips": null,
					"answer": "ban",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "paraphrase",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": {
						"id": "3-3-B",
						"part": 5,
						"of": 5
					},
					"evidence": "My advice is not to ban laptops.",
					"why": "真考听力填空用录音里原样出现的词：录音是 ban，就写 ban，不用改词形。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "So what does this mean for you? My advice is not to ban laptops. It's to use them differently: type less, and put things in your own words."
							}
						]
					},
					"tags": [
						"lecture",
						"paraphrase"
					]
				}
			],
			"id": "3-3",
			"ch": 3,
			"kind": "level",
			"x": 130,
			"y": 385,
			"label": "3-3",
			"name": "讲座笔记",
			"zh": "听力 · 一整场讲座分 5 段，边听边填笔记，笔记换了说法",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "reading",
			"type": "TFNG",
			"stations": [
				"2.6"
			],
			"hashtags": [
				"IELTS_2_6"
			],
			"gear": "synonym-match:study-work",
			"heartGear": "synonym-match:study-work",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j21",
				"j9",
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
					"id": "3-4-A-1",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "Over the past ten years, many offices have removed walls so that staff sit together in one large room. The idea was that people would talk more and share ideas, and that companies would save money on space. Supporters also argued that managers would find it easier to see what their teams were doing.\nA study at the Kessel Institute followed 120 office workers for a year after their company moved to an open-plan floor. Face-to-face conversations fell by about a third, while emails between colleagues rose. Many workers reported wearing headphones to block out noise, and several said they now waited until colleagues had gone home before making personal phone calls. The researchers interviewed staff of all ages and heard similar complaints in every age group.\nThe company later added a small number of quiet rooms that staff could book. Use of these rooms was high from the first week. Managers said they believed the rooms had been worth the cost, and the company is now planning to add more on other floors. Not every employee was convinced, however: some said the rooms were nearly always booked by the same few people.",
					"question": "Open-plan offices were designed to increase communication between staff.",
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
					"evidence": "The idea was that people would talk more and share ideas",
					"why": "talk more and share ideas = increase communication。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "3-4-A-2",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "Over the past ten years, many offices have removed walls so that staff sit together in one large room. The idea was that people would talk more and share ideas, and that companies would save money on space. Supporters also argued that managers would find it easier to see what their teams were doing.\nA study at the Kessel Institute followed 120 office workers for a year after their company moved to an open-plan floor. Face-to-face conversations fell by about a third, while emails between colleagues rose. Many workers reported wearing headphones to block out noise, and several said they now waited until colleagues had gone home before making personal phone calls. The researchers interviewed staff of all ages and heard similar complaints in every age group.\nThe company later added a small number of quiet rooms that staff could book. Use of these rooms was high from the first week. Managers said they believed the rooms had been worth the cost, and the company is now planning to add more on other floors. Not every employee was convinced, however: some said the rooms were nearly always booked by the same few people.",
					"question": "After the move, workers spoke to each other in person more often.",
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
					"evidence": "Face-to-face conversations fell by about a third",
					"why": "face-to-face = in person，原文说少了三分之一，题目说多了。多了的是 emails。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "3-4-A-3",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "Over the past ten years, many offices have removed walls so that staff sit together in one large room. The idea was that people would talk more and share ideas, and that companies would save money on space. Supporters also argued that managers would find it easier to see what their teams were doing.\nA study at the Kessel Institute followed 120 office workers for a year after their company moved to an open-plan floor. Face-to-face conversations fell by about a third, while emails between colleagues rose. Many workers reported wearing headphones to block out noise, and several said they now waited until colleagues had gone home before making personal phone calls. The researchers interviewed staff of all ages and heard similar complaints in every age group.\nThe company later added a small number of quiet rooms that staff could book. Use of these rooms was high from the first week. Managers said they believed the rooms had been worth the cost, and the company is now planning to add more on other floors. Not every employee was convinced, however: some said the rooms were nearly always booked by the same few people.",
					"question": "Most of the workers in the study were under thirty.",
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
					"evidence": "The researchers interviewed staff of all ages and heard similar complaints in every age group.",
					"why": "原文提到了年龄：各个年龄的人都访谈了、抱怨都差不多。可是哪个年龄段的人多，一个字没说。提到相关的事 ≠ 说到了题目这一步。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "3-4-A-4",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "Over the past ten years, many offices have removed walls so that staff sit together in one large room. The idea was that people would talk more and share ideas, and that companies would save money on space. Supporters also argued that managers would find it easier to see what their teams were doing.\nA study at the Kessel Institute followed 120 office workers for a year after their company moved to an open-plan floor. Face-to-face conversations fell by about a third, while emails between colleagues rose. Many workers reported wearing headphones to block out noise, and several said they now waited until colleagues had gone home before making personal phone calls. The researchers interviewed staff of all ages and heard similar complaints in every age group.\nThe company later added a small number of quiet rooms that staff could book. Use of these rooms was high from the first week. Managers said they believed the rooms had been worth the cost, and the company is now planning to add more on other floors. Not every employee was convinced, however: some said the rooms were nearly always booked by the same few people.",
					"question": "Staff started using the quiet rooms soon after they were introduced.",
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
					"evidence": "Use of these rooms was high from the first week.",
					"why": "high from the first week = soon after they were introduced。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "3-4-A-5",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "Over the past ten years, many offices have removed walls so that staff sit together in one large room. The idea was that people would talk more and share ideas, and that companies would save money on space. Supporters also argued that managers would find it easier to see what their teams were doing.\nA study at the Kessel Institute followed 120 office workers for a year after their company moved to an open-plan floor. Face-to-face conversations fell by about a third, while emails between colleagues rose. Many workers reported wearing headphones to block out noise, and several said they now waited until colleagues had gone home before making personal phone calls. The researchers interviewed staff of all ages and heard similar complaints in every age group.\nThe company later added a small number of quiet rooms that staff could book. Use of these rooms was high from the first week. Managers said they believed the rooms had been worth the cost, and the company is now planning to add more on other floors. Not every employee was convinced, however: some said the rooms were nearly always booked by the same few people.",
					"question": "Productivity fell after the company moved to an open-plan floor.",
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
					"evidence": "Face-to-face conversations fell by about a third, while emails between colleagues rose.",
					"why": "原文说「当面交流」少了、邮件多了、有人戴耳机，可工作产出（productivity）变没变全文没说。fell 是原文里的词，很容易被它带着选 TRUE。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "3-4-B-1",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "Language-learning apps have become very popular, especially among adults who cannot attend regular classes. Most of these apps give short daily lessons and reward users for practising every day. Some also send reminders to users' phones if they miss a day. Many can be downloaded at no cost, although the most useful features are usually only available to paying subscribers.\nIn a survey of 2,000 app users carried out by the Larkfield Language Centre, nine out of ten said they enjoyed the lessons. However, fewer than one in five had kept using the same app for more than six months. Younger users were slightly more likely than older ones to keep going, but the difference was small. Those who stopped gave a range of reasons, from boredom to a lack of time, and some said they had simply switched to a different app.\nThe centre's researchers suggest that apps are useful for learning words but less useful for speaking, because users rarely talk to a real person. They recommend combining an app with conversation practice, and are now planning a second study to find out whether this approach leads to faster progress.",
					"question": "Most apps offer brief lessons every day.",
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
					"evidence": "Most of these apps give short daily lessons",
					"why": "short daily lessons = brief lessons every day。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "3-4-B-2",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "Language-learning apps have become very popular, especially among adults who cannot attend regular classes. Most of these apps give short daily lessons and reward users for practising every day. Some also send reminders to users' phones if they miss a day. Many can be downloaded at no cost, although the most useful features are usually only available to paying subscribers.\nIn a survey of 2,000 app users carried out by the Larkfield Language Centre, nine out of ten said they enjoyed the lessons. However, fewer than one in five had kept using the same app for more than six months. Younger users were slightly more likely than older ones to keep going, but the difference was small. Those who stopped gave a range of reasons, from boredom to a lack of time, and some said they had simply switched to a different app.\nThe centre's researchers suggest that apps are useful for learning words but less useful for speaking, because users rarely talk to a real person. They recommend combining an app with conversation practice, and are now planning a second study to find out whether this approach leads to faster progress.",
					"question": "The majority of users surveyed disliked the lessons.",
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
					"evidence": "nine out of ten said they enjoyed the lessons",
					"why": "十个里九个喜欢，题目说大多数不喜欢。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "3-4-B-3",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "Language-learning apps have become very popular, especially among adults who cannot attend regular classes. Most of these apps give short daily lessons and reward users for practising every day. Some also send reminders to users' phones if they miss a day. Many can be downloaded at no cost, although the most useful features are usually only available to paying subscribers.\nIn a survey of 2,000 app users carried out by the Larkfield Language Centre, nine out of ten said they enjoyed the lessons. However, fewer than one in five had kept using the same app for more than six months. Younger users were slightly more likely than older ones to keep going, but the difference was small. Those who stopped gave a range of reasons, from boredom to a lack of time, and some said they had simply switched to a different app.\nThe centre's researchers suggest that apps are useful for learning words but less useful for speaking, because users rarely talk to a real person. They recommend combining an app with conversation practice, and are now planning a second study to find out whether this approach leads to faster progress.",
					"question": "Most users continued with the same app for over six months.",
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
					"evidence": "fewer than one in five had kept using the same app for more than six months",
					"why": "fewer than one in five = 不到五分之一，不是大多数。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "3-4-B-4",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "Language-learning apps have become very popular, especially among adults who cannot attend regular classes. Most of these apps give short daily lessons and reward users for practising every day. Some also send reminders to users' phones if they miss a day. Many can be downloaded at no cost, although the most useful features are usually only available to paying subscribers.\nIn a survey of 2,000 app users carried out by the Larkfield Language Centre, nine out of ten said they enjoyed the lessons. However, fewer than one in five had kept using the same app for more than six months. Younger users were slightly more likely than older ones to keep going, but the difference was small. Those who stopped gave a range of reasons, from boredom to a lack of time, and some said they had simply switched to a different app.\nThe centre's researchers suggest that apps are useful for learning words but less useful for speaking, because users rarely talk to a real person. They recommend combining an app with conversation practice, and are now planning a second study to find out whether this approach leads to faster progress.",
					"question": "Most of the users who stopped had moved to another app.",
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
					"evidence": "some said they had simply switched to a different app",
					"why": "原文只说 some（有一些人）换了 app，没说有多少。some 不等于 most，也没说 most 没换，所以是没提到。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "3-4-B-5",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "Language-learning apps have become very popular, especially among adults who cannot attend regular classes. Most of these apps give short daily lessons and reward users for practising every day. Some also send reminders to users' phones if they miss a day. Many can be downloaded at no cost, although the most useful features are usually only available to paying subscribers.\nIn a survey of 2,000 app users carried out by the Larkfield Language Centre, nine out of ten said they enjoyed the lessons. However, fewer than one in five had kept using the same app for more than six months. Younger users were slightly more likely than older ones to keep going, but the difference was small. Those who stopped gave a range of reasons, from boredom to a lack of time, and some said they had simply switched to a different app.\nThe centre's researchers suggest that apps are useful for learning words but less useful for speaking, because users rarely talk to a real person. They recommend combining an app with conversation practice, and are now planning a second study to find out whether this approach leads to faster progress.",
					"question": "The researchers believe apps should be used together with speaking practice.",
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
					"evidence": "They recommend combining an app with conversation practice",
					"why": "combining … with conversation practice = used together with speaking practice。后面说还要再做研究，但「建议」这件事是明确的。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				}
			],
			"id": "3-4",
			"ch": 3,
			"kind": "level",
			"x": 250,
			"y": 295,
			"label": "3-4",
			"name": "对、错、没提到 · 进阶",
			"zh": "阅读 · TRUE / FALSE / NOT GIVEN",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "reading",
			"type": "YNNG",
			"stations": [
				"2.7"
			],
			"hashtags": [
				"IELTS_2_7"
			],
			"gear": "synonym-match:study-work",
			"heartGear": "synonym-match:study-work",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j23",
				"j9",
				"j25"
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
					"id": "3-5-A-1",
					"set": "A",
					"type": "YNNG",
					"skill": null,
					"passage": "Some parents argue that children today get too much homework. They claim it leaves no time for play and causes stress. A recent survey by a parents' group found that a third of families argue about homework every week.\nIn my view, the problem is not the amount but the type. Copying out answers teaches children very little, whereas a short task that asks them to explain an idea to someone at home can be valuable. Schools should therefore set less repetitive work, not simply less work.\nIt may be true that younger children benefit less from homework than teenagers, although the evidence on this is still unclear. Even so, that is not a reason for schools to stop setting it for younger children.",
					"question": "The kind of homework matters more than how much is set.",
					"options": [
						{
							"key": "YES",
							"text": "YES"
						},
						{
							"key": "NO",
							"text": "NO"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "YES",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"NO": "paraphrase",
						"NOT GIVEN": "fact-opinion"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "In my view, the problem is not the amount but the type.",
					"why": "In my view 后面是作者自己的看法：the type 比 the amount 重要。",
					"audio": null,
					"tags": [
						"ynng"
					]
				},
				{
					"id": "3-5-A-2",
					"set": "A",
					"type": "YNNG",
					"skill": null,
					"passage": "Some parents argue that children today get too much homework. They claim it leaves no time for play and causes stress. A recent survey by a parents' group found that a third of families argue about homework every week.\nIn my view, the problem is not the amount but the type. Copying out answers teaches children very little, whereas a short task that asks them to explain an idea to someone at home can be valuable. Schools should therefore set less repetitive work, not simply less work.\nIt may be true that younger children benefit less from homework than teenagers, although the evidence on this is still unclear. Even so, that is not a reason for schools to stop setting it for younger children.",
					"question": "Copying out answers is a useful way for children to learn.",
					"options": [
						{
							"key": "YES",
							"text": "YES"
						},
						{
							"key": "NO",
							"text": "NO"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "NO",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"YES": "same-word",
						"NOT GIVEN": "fact-opinion"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Copying out answers teaches children very little",
					"why": "teaches very little = 没什么用，跟题目相反。",
					"audio": null,
					"tags": [
						"ynng"
					]
				},
				{
					"id": "3-5-A-3",
					"set": "A",
					"type": "YNNG",
					"skill": null,
					"passage": "Some parents argue that children today get too much homework. They claim it leaves no time for play and causes stress. A recent survey by a parents' group found that a third of families argue about homework every week.\nIn my view, the problem is not the amount but the type. Copying out answers teaches children very little, whereas a short task that asks them to explain an idea to someone at home can be valuable. Schools should therefore set less repetitive work, not simply less work.\nIt may be true that younger children benefit less from homework than teenagers, although the evidence on this is still unclear. Even so, that is not a reason for schools to stop setting it for younger children.",
					"question": "Explaining ideas to family members can help children learn.",
					"options": [
						{
							"key": "YES",
							"text": "YES"
						},
						{
							"key": "NO",
							"text": "NO"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "YES",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"NO": "paraphrase",
						"NOT GIVEN": "fact-opinion"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "a short task that asks them to explain an idea to someone at home can be valuable",
					"why": "someone at home = family members；can be valuable = can help。",
					"audio": null,
					"tags": [
						"ynng"
					]
				},
				{
					"id": "3-5-A-4",
					"set": "A",
					"type": "YNNG",
					"skill": null,
					"passage": "Some parents argue that children today get too much homework. They claim it leaves no time for play and causes stress. A recent survey by a parents' group found that a third of families argue about homework every week.\nIn my view, the problem is not the amount but the type. Copying out answers teaches children very little, whereas a short task that asks them to explain an idea to someone at home can be valuable. Schools should therefore set less repetitive work, not simply less work.\nIt may be true that younger children benefit less from homework than teenagers, although the evidence on this is still unclear. Even so, that is not a reason for schools to stop setting it for younger children.",
					"question": "Homework causes stress in most families.",
					"options": [
						{
							"key": "YES",
							"text": "YES"
						},
						{
							"key": "NO",
							"text": "NO"
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
						"YES": "fact-opinion",
						"NO": "not-given"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "They claim it leaves no time for play and causes stress. … a third of families argue about homework every week",
					"why": "说「造成压力」的是 some parents，作者用 claim 转述，自己没表态；调查说的是三分之一的家庭，也不是「大多数」。",
					"audio": null,
					"tags": [
						"ynng"
					]
				},
				{
					"id": "3-5-A-5",
					"set": "A",
					"type": "YNNG",
					"skill": null,
					"passage": "Some parents argue that children today get too much homework. They claim it leaves no time for play and causes stress. A recent survey by a parents' group found that a third of families argue about homework every week.\nIn my view, the problem is not the amount but the type. Copying out answers teaches children very little, whereas a short task that asks them to explain an idea to someone at home can be valuable. Schools should therefore set less repetitive work, not simply less work.\nIt may be true that younger children benefit less from homework than teenagers, although the evidence on this is still unclear. Even so, that is not a reason for schools to stop setting it for younger children.",
					"question": "Schools should stop giving homework to young children.",
					"options": [
						{
							"key": "YES",
							"text": "YES"
						},
						{
							"key": "NO",
							"text": "NO"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "NO",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"YES": "same-word",
						"NOT GIVEN": "fact-opinion"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "that is not a reason for schools to stop setting it for younger children",
					"why": "stop setting it = stop giving，作者说「证据不清楚，但这不是停掉的理由」，明确不同意。前半句 It may be true 是让步，不是作者的结论。",
					"audio": null,
					"tags": [
						"ynng"
					]
				},
				{
					"id": "3-5-B-1",
					"set": "B",
					"type": "YNNG",
					"skill": null,
					"passage": "Bike-sharing schemes have spread to many cities, and their supporters say they reduce traffic. Whether they actually do is hard to judge, since few cities have collected reliable data before and after a scheme began.\nWhat seems clear to me is that the schemes work best when bikes are cheap to use for short trips. Where the first half hour is free, people use the bikes for errands they would otherwise have done by car or taxi. Charging by the minute, by contrast, discourages exactly the short journeys the schemes are meant to replace.\nCritics complain that shared bikes are left blocking pavements. This is a real nuisance, but it is a problem of management, not a reason to end the schemes. Cities that mark out parking zones have largely solved it.",
					"question": "It is difficult to know whether bike-sharing reduces traffic.",
					"options": [
						{
							"key": "YES",
							"text": "YES"
						},
						{
							"key": "NO",
							"text": "NO"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "YES",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"NO": "paraphrase",
						"NOT GIVEN": "fact-opinion"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Whether they actually do is hard to judge",
					"why": "hard to judge = difficult to know。「能减少交通」是 supporters 说的，作者自己说没法判断。",
					"audio": null,
					"tags": [
						"ynng"
					]
				},
				{
					"id": "3-5-B-2",
					"set": "B",
					"type": "YNNG",
					"skill": null,
					"passage": "Bike-sharing schemes have spread to many cities, and their supporters say they reduce traffic. Whether they actually do is hard to judge, since few cities have collected reliable data before and after a scheme began.\nWhat seems clear to me is that the schemes work best when bikes are cheap to use for short trips. Where the first half hour is free, people use the bikes for errands they would otherwise have done by car or taxi. Charging by the minute, by contrast, discourages exactly the short journeys the schemes are meant to replace.\nCritics complain that shared bikes are left blocking pavements. This is a real nuisance, but it is a problem of management, not a reason to end the schemes. Cities that mark out parking zones have largely solved it.",
					"question": "Short journeys on shared bikes should cost little or nothing.",
					"options": [
						{
							"key": "YES",
							"text": "YES"
						},
						{
							"key": "NO",
							"text": "NO"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "YES",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"NO": "paraphrase",
						"NOT GIVEN": "fact-opinion"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "the schemes work best when bikes are cheap to use for short trips",
					"why": "What seems clear to me 是作者的看法；cheap = cost little，第一个半小时免费 = nothing。",
					"audio": null,
					"tags": [
						"ynng"
					]
				},
				{
					"id": "3-5-B-3",
					"set": "B",
					"type": "YNNG",
					"skill": null,
					"passage": "Bike-sharing schemes have spread to many cities, and their supporters say they reduce traffic. Whether they actually do is hard to judge, since few cities have collected reliable data before and after a scheme began.\nWhat seems clear to me is that the schemes work best when bikes are cheap to use for short trips. Where the first half hour is free, people use the bikes for errands they would otherwise have done by car or taxi. Charging by the minute, by contrast, discourages exactly the short journeys the schemes are meant to replace.\nCritics complain that shared bikes are left blocking pavements. This is a real nuisance, but it is a problem of management, not a reason to end the schemes. Cities that mark out parking zones have largely solved it.",
					"question": "Charging per minute encourages people to make short journeys.",
					"options": [
						{
							"key": "YES",
							"text": "YES"
						},
						{
							"key": "NO",
							"text": "NO"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "NO",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"YES": "same-word",
						"NOT GIVEN": "fact-opinion"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Charging by the minute, by contrast, discourages exactly the short journeys",
					"why": "discourages 和 encourages 正好相反。",
					"audio": null,
					"tags": [
						"ynng"
					]
				},
				{
					"id": "3-5-B-4",
					"set": "B",
					"type": "YNNG",
					"skill": null,
					"passage": "Bike-sharing schemes have spread to many cities, and their supporters say they reduce traffic. Whether they actually do is hard to judge, since few cities have collected reliable data before and after a scheme began.\nWhat seems clear to me is that the schemes work best when bikes are cheap to use for short trips. Where the first half hour is free, people use the bikes for errands they would otherwise have done by car or taxi. Charging by the minute, by contrast, discourages exactly the short journeys the schemes are meant to replace.\nCritics complain that shared bikes are left blocking pavements. This is a real nuisance, but it is a problem of management, not a reason to end the schemes. Cities that mark out parking zones have largely solved it.",
					"question": "Bike-sharing schemes are more popular with young people than with older people.",
					"options": [
						{
							"key": "YES",
							"text": "YES"
						},
						{
							"key": "NO",
							"text": "NO"
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
						"YES": "fact-opinion",
						"NO": "not-given"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Bike-sharing schemes have spread to many cities",
					"why": "全文没比过年龄。",
					"audio": null,
					"tags": [
						"ynng"
					]
				},
				{
					"id": "3-5-B-5",
					"set": "B",
					"type": "YNNG",
					"skill": null,
					"passage": "Bike-sharing schemes have spread to many cities, and their supporters say they reduce traffic. Whether they actually do is hard to judge, since few cities have collected reliable data before and after a scheme began.\nWhat seems clear to me is that the schemes work best when bikes are cheap to use for short trips. Where the first half hour is free, people use the bikes for errands they would otherwise have done by car or taxi. Charging by the minute, by contrast, discourages exactly the short journeys the schemes are meant to replace.\nCritics complain that shared bikes are left blocking pavements. This is a real nuisance, but it is a problem of management, not a reason to end the schemes. Cities that mark out parking zones have largely solved it.",
					"question": "Badly parked bikes are a good reason to close the schemes.",
					"options": [
						{
							"key": "YES",
							"text": "YES"
						},
						{
							"key": "NO",
							"text": "NO"
						},
						{
							"key": "NOT GIVEN",
							"text": "NOT GIVEN"
						}
					],
					"chips": null,
					"answer": "NO",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"YES": "same-word",
						"NOT GIVEN": "fact-opinion"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "it is a problem of management, not a reason to end the schemes",
					"why": "「车乱停」是 critics 的抱怨；作者说这不是关掉的理由。",
					"audio": null,
					"tags": [
						"ynng"
					]
				}
			],
			"id": "3-5",
			"ch": 3,
			"kind": "level",
			"x": 195,
			"y": 255,
			"label": "3-5",
			"name": "作者怎么想",
			"zh": "阅读 · YES / NO / NOT GIVEN，分清作者的看法和别人的说法",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "reading",
			"type": "choice",
			"stations": [
				"2.7"
			],
			"hashtags": [
				"IELTS_2_7"
			],
			"gear": "synonym-match:study-work",
			"heartGear": "synonym-match:study-work",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j19",
				"j21",
				"j12"
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
					"id": "3-6-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Maya Holt studied 400 gym members and found that most of those who gave up did so in the first eight weeks. She argues that the early weeks matter most, and that gyms should give new members more support at the start.\nB  Professor Ivan Petrov takes a different view. In his research, people who exercised with a friend kept going for much longer than those who exercised alone. For him, the key is not timing but company.\nC  Dr Sara Lund points out that many people choose activities they do not enjoy because they believe these will work faster. Her studies suggest that enjoyment predicts whether someone continues better than any other factor.\nD  Dr Tom Reyes is more cautious. He notes that most studies rely on what people say about their own habits, which is often inaccurate, and calls for research using fitness trackers instead.",
					"question": "Who says that exercising alongside another person helps people continue?",
					"options": [
						{
							"key": "A",
							"text": "Maya Holt"
						},
						{
							"key": "B",
							"text": "Ivan Petrov"
						},
						{
							"key": "C",
							"text": "Sara Lund"
						},
						{
							"key": "D",
							"text": "Tom Reyes"
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
					"evidence": "people who exercised with a friend kept going for much longer than those who exercised alone",
					"why": "with a friend = alongside another person；kept going = continue。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase"
					]
				},
				{
					"id": "3-6-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Maya Holt studied 400 gym members and found that most of those who gave up did so in the first eight weeks. She argues that the early weeks matter most, and that gyms should give new members more support at the start.\nB  Professor Ivan Petrov takes a different view. In his research, people who exercised with a friend kept going for much longer than those who exercised alone. For him, the key is not timing but company.\nC  Dr Sara Lund points out that many people choose activities they do not enjoy because they believe these will work faster. Her studies suggest that enjoyment predicts whether someone continues better than any other factor.\nD  Dr Tom Reyes is more cautious. He notes that most studies rely on what people say about their own habits, which is often inaccurate, and calls for research using fitness trackers instead.",
					"question": "Who says that liking an activity is the best sign that someone will stick with it?",
					"options": [
						{
							"key": "A",
							"text": "Maya Holt"
						},
						{
							"key": "B",
							"text": "Ivan Petrov"
						},
						{
							"key": "C",
							"text": "Sara Lund"
						},
						{
							"key": "D",
							"text": "Tom Reyes"
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
					"evidence": "enjoyment predicts whether someone continues better than any other factor",
					"why": "enjoyment = liking；predicts … better than any other factor = the best sign。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase"
					]
				},
				{
					"id": "3-6-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Maya Holt studied 400 gym members and found that most of those who gave up did so in the first eight weeks. She argues that the early weeks matter most, and that gyms should give new members more support at the start.\nB  Professor Ivan Petrov takes a different view. In his research, people who exercised with a friend kept going for much longer than those who exercised alone. For him, the key is not timing but company.\nC  Dr Sara Lund points out that many people choose activities they do not enjoy because they believe these will work faster. Her studies suggest that enjoyment predicts whether someone continues better than any other factor.\nD  Dr Tom Reyes is more cautious. He notes that most studies rely on what people say about their own habits, which is often inaccurate, and calls for research using fitness trackers instead.",
					"question": "Who says that what people report about themselves may not be reliable?",
					"options": [
						{
							"key": "A",
							"text": "Maya Holt"
						},
						{
							"key": "B",
							"text": "Ivan Petrov"
						},
						{
							"key": "C",
							"text": "Sara Lund"
						},
						{
							"key": "D",
							"text": "Tom Reyes"
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
					"evidence": "most studies rely on what people say about their own habits, which is often inaccurate",
					"why": "what people say about their own habits = what people report about themselves；inaccurate = not reliable。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase"
					]
				},
				{
					"id": "3-6-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Maya Holt studied 400 gym members and found that most of those who gave up did so in the first eight weeks. She argues that the early weeks matter most, and that gyms should give new members more support at the start.\nB  Professor Ivan Petrov takes a different view. In his research, people who exercised with a friend kept going for much longer than those who exercised alone. For him, the key is not timing but company.\nC  Dr Sara Lund points out that many people choose activities they do not enjoy because they believe these will work faster. Her studies suggest that enjoyment predicts whether someone continues better than any other factor.\nD  Dr Tom Reyes is more cautious. He notes that most studies rely on what people say about their own habits, which is often inaccurate, and calls for research using fitness trackers instead.",
					"question": "Who says that the first two months are a critical period?",
					"options": [
						{
							"key": "A",
							"text": "Maya Holt"
						},
						{
							"key": "B",
							"text": "Ivan Petrov"
						},
						{
							"key": "C",
							"text": "Sara Lund"
						},
						{
							"key": "D",
							"text": "Tom Reyes"
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
					"evidence": "most of those who gave up did so in the first eight weeks",
					"why": "first eight weeks = first two months；the early weeks matter most = critical period。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase"
					]
				},
				{
					"id": "3-6-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Maya Holt studied 400 gym members and found that most of those who gave up did so in the first eight weeks. She argues that the early weeks matter most, and that gyms should give new members more support at the start.\nB  Professor Ivan Petrov takes a different view. In his research, people who exercised with a friend kept going for much longer than those who exercised alone. For him, the key is not timing but company.\nC  Dr Sara Lund points out that many people choose activities they do not enjoy because they believe these will work faster. Her studies suggest that enjoyment predicts whether someone continues better than any other factor.\nD  Dr Tom Reyes is more cautious. He notes that most studies rely on what people say about their own habits, which is often inaccurate, and calls for research using fitness trackers instead.",
					"question": "Who says that people sometimes pick a type of exercise because they expect quicker results?",
					"options": [
						{
							"key": "A",
							"text": "Maya Holt"
						},
						{
							"key": "B",
							"text": "Ivan Petrov"
						},
						{
							"key": "C",
							"text": "Sara Lund"
						},
						{
							"key": "D",
							"text": "Tom Reyes"
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
					"evidence": "many people choose activities they do not enjoy because they believe these will work faster",
					"why": "work faster = quicker results。一个人可以被选不止一次。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase"
					]
				},
				{
					"id": "3-6-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Lena Brandt measured street temperatures across one city during a hot summer. Streets lined with trees were noticeably cooler, and she argues that planting trees is the cheapest long-term solution.\nB  Engineer Paulo Moreno doubts that trees alone are enough, since they take years to grow. He has tested light-coloured roofs, which reflect sunlight, and found they cool buildings within the first summer.\nC  Dr Aisha Karim focuses on people rather than buildings. Her work shows that older residents living alone are most at risk on very hot days, and she wants cities to set up phone services that check on them.\nD  Professor Jon Ward questions how far any single city can act alone. In his view, without national rules on building design, local efforts will remain small.",
					"question": "Who says that changing the colour of roofs can bring quick results?",
					"options": [
						{
							"key": "A",
							"text": "Lena Brandt"
						},
						{
							"key": "B",
							"text": "Paulo Moreno"
						},
						{
							"key": "C",
							"text": "Aisha Karim"
						},
						{
							"key": "D",
							"text": "Jon Ward"
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
					"evidence": "He has tested light-coloured roofs, which reflect sunlight, and found they cool buildings within the first summer.",
					"why": "within the first summer = quick results。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase"
					]
				},
				{
					"id": "3-6-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Lena Brandt measured street temperatures across one city during a hot summer. Streets lined with trees were noticeably cooler, and she argues that planting trees is the cheapest long-term solution.\nB  Engineer Paulo Moreno doubts that trees alone are enough, since they take years to grow. He has tested light-coloured roofs, which reflect sunlight, and found they cool buildings within the first summer.\nC  Dr Aisha Karim focuses on people rather than buildings. Her work shows that older residents living alone are most at risk on very hot days, and she wants cities to set up phone services that check on them.\nD  Professor Jon Ward questions how far any single city can act alone. In his view, without national rules on building design, local efforts will remain small.",
					"question": "Who says that action is needed at a national level?",
					"options": [
						{
							"key": "A",
							"text": "Lena Brandt"
						},
						{
							"key": "B",
							"text": "Paulo Moreno"
						},
						{
							"key": "C",
							"text": "Aisha Karim"
						},
						{
							"key": "D",
							"text": "Jon Ward"
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
					"evidence": "without national rules on building design, local efforts will remain small",
					"why": "national rules = action at a national level。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase"
					]
				},
				{
					"id": "3-6-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Lena Brandt measured street temperatures across one city during a hot summer. Streets lined with trees were noticeably cooler, and she argues that planting trees is the cheapest long-term solution.\nB  Engineer Paulo Moreno doubts that trees alone are enough, since they take years to grow. He has tested light-coloured roofs, which reflect sunlight, and found they cool buildings within the first summer.\nC  Dr Aisha Karim focuses on people rather than buildings. Her work shows that older residents living alone are most at risk on very hot days, and she wants cities to set up phone services that check on them.\nD  Professor Jon Ward questions how far any single city can act alone. In his view, without national rules on building design, local efforts will remain small.",
					"question": "Who says that some groups of people are in greater danger than others in hot weather?",
					"options": [
						{
							"key": "A",
							"text": "Lena Brandt"
						},
						{
							"key": "B",
							"text": "Paulo Moreno"
						},
						{
							"key": "C",
							"text": "Aisha Karim"
						},
						{
							"key": "D",
							"text": "Jon Ward"
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
					"evidence": "older residents living alone are most at risk on very hot days",
					"why": "most at risk = in greater danger。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase"
					]
				},
				{
					"id": "3-6-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Lena Brandt measured street temperatures across one city during a hot summer. Streets lined with trees were noticeably cooler, and she argues that planting trees is the cheapest long-term solution.\nB  Engineer Paulo Moreno doubts that trees alone are enough, since they take years to grow. He has tested light-coloured roofs, which reflect sunlight, and found they cool buildings within the first summer.\nC  Dr Aisha Karim focuses on people rather than buildings. Her work shows that older residents living alone are most at risk on very hot days, and she wants cities to set up phone services that check on them.\nD  Professor Jon Ward questions how far any single city can act alone. In his view, without national rules on building design, local efforts will remain small.",
					"question": "Who says that a natural solution costs the least over time?",
					"options": [
						{
							"key": "A",
							"text": "Lena Brandt"
						},
						{
							"key": "B",
							"text": "Paulo Moreno"
						},
						{
							"key": "C",
							"text": "Aisha Karim"
						},
						{
							"key": "D",
							"text": "Jon Ward"
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
					"evidence": "planting trees is the cheapest long-term solution",
					"why": "trees = a natural solution；cheapest long-term = costs the least over time。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase"
					]
				},
				{
					"id": "3-6-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "A  Dr Lena Brandt measured street temperatures across one city during a hot summer. Streets lined with trees were noticeably cooler, and she argues that planting trees is the cheapest long-term solution.\nB  Engineer Paulo Moreno doubts that trees alone are enough, since they take years to grow. He has tested light-coloured roofs, which reflect sunlight, and found they cool buildings within the first summer.\nC  Dr Aisha Karim focuses on people rather than buildings. Her work shows that older residents living alone are most at risk on very hot days, and she wants cities to set up phone services that check on them.\nD  Professor Jon Ward questions how far any single city can act alone. In his view, without national rules on building design, local efforts will remain small.",
					"question": "Who says that one popular solution is too slow to help in the short term?",
					"options": [
						{
							"key": "A",
							"text": "Lena Brandt"
						},
						{
							"key": "B",
							"text": "Paulo Moreno"
						},
						{
							"key": "C",
							"text": "Aisha Karim"
						},
						{
							"key": "D",
							"text": "Jon Ward"
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
					"evidence": "Engineer Paulo Moreno doubts that trees alone are enough, since they take years to grow.",
					"why": "take years to grow = too slow。Brandt 也提到树，可她是支持种树的，这是「原词陷阱」。",
					"audio": null,
					"tags": [
						"features",
						"paraphrase",
						"distractor"
					]
				}
			],
			"id": "3-6",
			"ch": 3,
			"kind": "level",
			"x": 105,
			"y": 175,
			"label": "3-6",
			"name": "谁提出的",
			"zh": "阅读 · 把观点配给提出它的人",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "vocab",
			"type": "choice",
			"stations": [
				"5.6"
			],
			"hashtags": [
				"IELTS_5_6"
			],
			"gear": "synonym-match:academic",
			"heartGear": "synonym-match:academic",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j21",
				"j22",
				"j5"
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
					"id": "3-7-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "原文：\"The number of students applying to the course has risen sharply.\"\nWhich sentence means the same?",
					"options": [
						{
							"key": "A",
							"text": "The number of students on the course has risen sharply."
						},
						{
							"key": "B",
							"text": "Many more people now want to join the course."
						},
						{
							"key": "C",
							"text": "Slightly more people now want to join the course."
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The number of students applying to the course has risen sharply.",
					"why": "applying to = want to join；risen sharply = many more。B 原词全在，可「申请的人」变成了「在读的人」；C 方向对，sharply 被换成了 slightly，程度不对。",
					"audio": null,
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "3-7-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "原文：\"The findings were not consistent with earlier research.\"\nWhich sentence means the same?",
					"options": [
						{
							"key": "A",
							"text": "The earlier research was not consistent."
						},
						{
							"key": "B",
							"text": "The results only partly disagreed with previous studies."
						},
						{
							"key": "C",
							"text": "The results did not match those of previous studies."
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
						"B": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The findings were not consistent with earlier research.",
					"why": "not consistent with = did not match。B 把「不一致」安到了以前的研究自己身上；C 加了 only partly，原文没说只是部分不一致。",
					"audio": null,
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "3-7-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "原文：\"Participants were asked to estimate how long the task would take.\"\nWhich sentence means the same?",
					"options": [
						{
							"key": "A",
							"text": "People had to guess the time needed for the task."
						},
						{
							"key": "B",
							"text": "Participants were asked how long they had taken."
						},
						{
							"key": "C",
							"text": "People had to work out exactly how long the task would take."
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Participants were asked to estimate how long the task would take.",
					"why": "estimate = guess（估计）。B 把事前的 would take 改成了事后的 had taken；C 的 exactly 和 estimate 正好相反。",
					"audio": null,
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "3-7-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "原文：\"The theory has been widely criticised.\"\nWhich sentence means the same?",
					"options": [
						{
							"key": "A",
							"text": "Many people have found fault with the idea."
						},
						{
							"key": "B",
							"text": "The theory is used by a wide range of critics."
						},
						{
							"key": "C",
							"text": "A few people have found fault with the idea."
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The theory has been widely criticised.",
					"why": "widely = many people；criticised = found fault with。B 留着 wide 和 critic，意思全变了；C 把 widely 缩成了 a few。",
					"audio": null,
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "3-7-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "原文：\"The project was abandoned due to a lack of funding.\"\nWhich sentence means the same?",
					"options": [
						{
							"key": "A",
							"text": "The project lacked a plan, so the funding was abandoned."
						},
						{
							"key": "B",
							"text": "The project stopped because there was not enough money."
						},
						{
							"key": "C",
							"text": "The project was delayed because there was not enough money."
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The project was abandoned due to a lack of funding.",
					"why": "abandoned = stopped（不做了）。B 原词都在，因果倒了；C 原因对，可 delayed 只是推迟，不是放弃。",
					"audio": null,
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "3-7-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "原文：\"Most respondents were in favour of the proposal.\"\nWhich sentence means the same?",
					"options": [
						{
							"key": "A",
							"text": "The majority of people who answered supported the plan."
						},
						{
							"key": "B",
							"text": "Most respondents made a proposal of their own."
						},
						{
							"key": "C",
							"text": "All of the people who answered supported the plan."
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Most respondents were in favour of the proposal.",
					"why": "respondents = people who answered；in favour of = supported。B 借了 proposal，意思变了；C 把 most 说成了 all，过头了。",
					"audio": null,
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "3-7-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "原文：\"This method is considerably cheaper than the alternatives.\"\nWhich sentence means the same?",
					"options": [
						{
							"key": "A",
							"text": "This method is considered cheap by some people."
						},
						{
							"key": "B",
							"text": "This method is slightly cheaper than the others."
						},
						{
							"key": "C",
							"text": "Other methods cost a lot more than this one."
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
						"B": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "This method is considerably cheaper than the alternatives.",
					"why": "considerably = 很大程度上，不是 considered（被认为）。B 是长得像的陷阱；C 把「便宜很多」说成了「便宜一点」。",
					"audio": null,
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "3-7-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "原文：\"The data suggest a link between sleep and memory.\"\nWhich sentence means the same?",
					"options": [
						{
							"key": "A",
							"text": "The data suggest that people sleep better when their memory is good."
						},
						{
							"key": "B",
							"text": "The figures indicate that sleep and memory may be connected."
						},
						{
							"key": "C",
							"text": "The data show that sleep improves memory."
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The data suggest a link between sleep and memory.",
					"why": "suggest a link = 可能有关，没说谁影响谁。B 留着 suggest，却编出了一个方向；C 把 suggest 升成 show、把「有关」升成「改善」，说过头了。",
					"audio": null,
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "3-7-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "原文：\"The experiment was repeated in order to confirm the results.\"\nWhich sentence means the same?",
					"options": [
						{
							"key": "A",
							"text": "The results were confirmed, so the experiment did not need repeating."
						},
						{
							"key": "B",
							"text": "It was done again to prove that the whole theory was correct."
						},
						{
							"key": "C",
							"text": "It was done again to check that the findings were right."
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
						"B": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The experiment was repeated in order to confirm the results.",
					"why": "repeated = done again；confirm the results = 核实这次的结果。B 原词都在，顺序倒了；C 把「核实结果」放大成「证明整个理论」。",
					"audio": null,
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "3-7-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "原文：\"Few of the early predictions proved accurate.\"\nWhich sentence means the same?",
					"options": [
						{
							"key": "A",
							"text": "Most of the first forecasts turned out to be wrong."
						},
						{
							"key": "B",
							"text": "A few early predictions were accurate."
						},
						{
							"key": "C",
							"text": "None of the early predictions turned out to be right."
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Few of the early predictions proved accurate.",
					"why": "few = 很少（偏否定），a few = 有几个（偏肯定），B 只差一个 a；C 把 few 说成 none，绝对了。",
					"audio": null,
					"tags": [
						"paraphrase",
						"distractor"
					]
				}
			],
			"id": "3-7",
			"ch": 3,
			"kind": "level",
			"x": 35,
			"y": 340,
			"label": "3-7",
			"name": "认出换说法",
			"zh": "词汇 · 原句换了说法，哪句意思一样",
			"branch": "vocab"
		},
		{
			"practice": false,
			"skill": "vocab",
			"type": "gap",
			"stations": [
				"5.7"
			],
			"hashtags": [
				"IELTS_5_7"
			],
			"gear": "vocab:5.7",
			"heartGear": "vocab:5.7",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j18",
				"j6",
				"j1"
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
					"id": "3-8-A-1",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "This small ______ can measure your heart rate.",
					"options": null,
					"chips": null,
					"answer": "device",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "device. This small device can measure your heart rate. device.",
					"why": "device 是名词「设备」；devise 是动词「设计」，别拼混。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "device. This small device can measure your heart rate. device."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "3-8-A-2",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The ______ lasts for about ten hours.",
					"options": null,
					"chips": null,
					"answer": "battery",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "battery. The battery lasts for about ten hours. battery.",
					"why": "两个 t，结尾 -ery。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "battery. The battery lasts for about ten hours. battery."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "3-8-A-3",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "You need to update the ______ before you start.",
					"options": null,
					"chips": null,
					"answer": "software",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "software. You need to update the software before you start. software.",
					"why": "software 是一个词，不可数，不加 s。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "software. You need to update the software before you start. software."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "3-8-A-4",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The signal is sent by a ______.",
					"options": null,
					"chips": null,
					"answer": "satellite",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "satellite. The signal is sent by a satellite. satellite.",
					"why": "一个 t、两个 l：sa-tel-lite。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "satellite. The signal is sent by a satellite. satellite."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "3-8-A-5",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The team built a ______ to test the idea.",
					"options": null,
					"chips": null,
					"answer": "prototype",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "prototype. The team built a prototype to test the idea. prototype.",
					"why": "proto（最初的）+ type：原型。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "prototype. The team built a prototype to test the idea. prototype."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "3-8-B-1",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The engineers were proud of their new ______.",
					"options": null,
					"chips": null,
					"answer": "invention",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "invention. The engineers were proud of their new invention. invention.",
					"why": "invent + ion，中间不要多写 e。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "invention. The engineers were proud of their new invention. invention."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "3-8-B-2",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "She works as an ______ at a car company.",
					"options": null,
					"chips": null,
					"answer": "engineer",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "engineer. She works as an engineer at a car company. engineer.",
					"why": "结尾 -eer，两个 e。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "engineer. She works as an engineer at a car company. engineer."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "3-8-B-3",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The samples were tested in a ______.",
					"options": null,
					"chips": null,
					"answer": "laboratory",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "laboratory. The samples were tested in a laboratory. laboratory.",
					"why": "labor-a-tory，中间那个 a 英式口音常吞掉，拼的时候别漏。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "laboratory. The samples were tested in a laboratory. laboratory."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "3-8-B-4",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "He applied for a ______ to protect his design.",
					"options": null,
					"chips": null,
					"answer": "patent",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "patent. He applied for a patent to protect his design. patent.",
					"why": "patent = 专利，结尾 -ent。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "patent. He applied for a patent to protect his design. patent."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "3-8-B-5",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The new engine is more ______ and uses less fuel.",
					"options": null,
					"chips": null,
					"answer": "efficient",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "vocab",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "efficient. The new engine is more efficient and uses less fuel. efficient.",
					"why": "两个 f，结尾 -cient：ef-fi-cient。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "efficient. The new engine is more efficient and uses less fuel. efficient."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				}
			],
			"id": "3-8",
			"ch": 3,
			"kind": "level",
			"x": 115,
			"y": 275,
			"label": "3-8",
			"name": "科技与发明",
			"zh": "词汇 · 听一遍，拼出科技词",
			"branch": "vocab"
		},
		{
			"practice": false,
			"skill": "vocab",
			"type": "choice",
			"stations": [
				"5.7"
			],
			"hashtags": [
				"IELTS_5_7"
			],
			"gear": "vocab:5.7",
			"heartGear": "vocab:5.7",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j1",
				"j23",
				"j18"
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
					"id": "3-9-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The results ______ that the new teaching method works, but more research is needed.",
					"options": [
						{
							"key": "A",
							"text": "prove"
						},
						{
							"key": "B",
							"text": "suggest"
						},
						{
							"key": "C",
							"text": "deny"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The results suggest that the new teaching method works, but more research is needed.",
					"why": "more research is needed 说明还没定论，用 suggest（表明），不能用 prove（证明）。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "3-9-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "There is little ______ to support this claim; most of it is based on personal stories.",
					"options": [
						{
							"key": "A",
							"text": "evidence"
						},
						{
							"key": "B",
							"text": "opinion"
						},
						{
							"key": "C",
							"text": "argument"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "There is little evidence to support this claim; most of it is based on personal stories.",
					"why": "能「支持一个说法」的是 evidence（证据）。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "3-9-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Some researchers ______ that video games improve memory, although others disagree.",
					"options": [
						{
							"key": "A",
							"text": "confirm"
						},
						{
							"key": "B",
							"text": "ignore"
						},
						{
							"key": "C",
							"text": "claim"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Some researchers claim that video games improve memory, although others disagree.",
					"why": "although others disagree 说明有争议，用 claim（声称）；confirm 是证实，太肯定。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "3-9-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The study ______ 500 students from three different universities.",
					"options": [
						{
							"key": "A",
							"text": "consisted"
						},
						{
							"key": "B",
							"text": "took part"
						},
						{
							"key": "C",
							"text": "involved"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The study involved 500 students from three different universities.",
					"why": "involve sb = 让某人参与。consist 要接 of，take part 要接 in。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "3-9-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Prices have risen ______ over the last ten years, by around 2% each year.",
					"options": [
						{
							"key": "A",
							"text": "gradually"
						},
						{
							"key": "B",
							"text": "dramatically"
						},
						{
							"key": "C",
							"text": "suddenly"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Prices have risen gradually over the last ten years, by around 2% each year.",
					"why": "每年 2% 左右，是慢慢涨：gradually。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "3-9-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The aim of this essay is to ______ the causes of the problem.",
					"options": [
						{
							"key": "A",
							"text": "analysis"
						},
						{
							"key": "B",
							"text": "analytical"
						},
						{
							"key": "C",
							"text": "analyse"
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
						"B": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The aim of this essay is to analyse the causes of the problem.",
					"why": "to 后面要动词原形 analyse；analysis 是名词，analytical 是形容词。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "3-9-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Researchers need to ______ between a link and a cause.",
					"options": [
						{
							"key": "A",
							"text": "distinguish"
						},
						{
							"key": "B",
							"text": "differ"
						},
						{
							"key": "C",
							"text": "divide"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Researchers need to distinguish between a link and a cause.",
					"why": "distinguish between A and B = 区分 A 和 B。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "3-9-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The survey was ______ to people over the age of 18.",
					"options": [
						{
							"key": "A",
							"text": "reduced"
						},
						{
							"key": "B",
							"text": "limited"
						},
						{
							"key": "C",
							"text": "lowered"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The survey was limited to people over the age of 18.",
					"why": "be limited to = 只限于。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "3-9-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "A ______ of the participants said they felt better after the course; only a few did not.",
					"options": [
						{
							"key": "A",
							"text": "majority"
						},
						{
							"key": "B",
							"text": "minority"
						},
						{
							"key": "C",
							"text": "number"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "A majority of the participants said they felt better after the course; only a few did not.",
					"why": "only a few did not 反过来说明是大多数：majority。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "3-9-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The theory is ______ on only a small number of studies, so we should be careful.",
					"options": [
						{
							"key": "A",
							"text": "relied"
						},
						{
							"key": "B",
							"text": "depended"
						},
						{
							"key": "C",
							"text": "based"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The theory is based on only a small number of studies, so we should be careful.",
					"why": "be based on = 以……为基础。rely 和 depend 不这样用被动。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				}
			],
			"id": "3-9",
			"ch": 3,
			"kind": "level",
			"x": 35,
			"y": 210,
			"label": "3-9",
			"name": "学术常用词",
			"zh": "词汇 · suggest、claim、evidence 这些词怎么用",
			"branch": "vocab"
		},
		{
			"practice": false,
			"skill": "grammar",
			"type": "choice",
			"stations": [
				"6.7"
			],
			"hashtags": [
				"IELTS_6_7"
			],
			"gear": "grammar:6.7",
			"heartGear": "vocab:5.7",
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
					"id": "3-10-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "______ he said at the meeting surprised everyone.",
					"options": [
						{
							"key": "A",
							"text": "That"
						},
						{
							"key": "B",
							"text": "Which"
						},
						{
							"key": "C",
							"text": "What"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "What he said at the meeting surprised everyone.",
					"why": "said 后面缺宾语，缺东西用 what；that 引导的从句必须是完整的。",
					"audio": null,
					"tags": [
						"g-noun"
					]
				},
				{
					"id": "3-10-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Nobody knows ______ the plan will work.",
					"options": [
						{
							"key": "A",
							"text": "what"
						},
						{
							"key": "B",
							"text": "whether"
						},
						{
							"key": "C",
							"text": "which"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Nobody knows whether the plan will work.",
					"why": "「会不会成」是是否的问题，用 whether；后面句子完整，不用 what。",
					"audio": null,
					"tags": [
						"g-noun"
					]
				},
				{
					"id": "3-10-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The problem is ______ we don't have enough time.",
					"options": [
						{
							"key": "A",
							"text": "that"
						},
						{
							"key": "B",
							"text": "what"
						},
						{
							"key": "C",
							"text": "which"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The problem is that we don't have enough time.",
					"why": "we don't have enough time 是完整的句子，放在 is 后面用 that。",
					"audio": null,
					"tags": [
						"g-noun"
					]
				},
				{
					"id": "3-10-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "______ the new policy will actually reduce pollution in the city centre remains to be seen.",
					"options": [
						{
							"key": "A",
							"text": "That"
						},
						{
							"key": "B",
							"text": "Whether"
						},
						{
							"key": "C",
							"text": "What"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Whether the new policy will actually reduce pollution in the city centre remains to be seen.",
					"why": "主语从句很长，先找谓语 remains。remains to be seen = 还不知道，所以是「是否」：whether。That 表示已经确定，和 remains to be seen 矛盾；从句不缺成分，不用 What。",
					"audio": null,
					"tags": [
						"g-noun"
					]
				},
				{
					"id": "3-10-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The finding ______ older adults tend to sleep less than younger adults is now well documented.",
					"options": [
						{
							"key": "A",
							"text": "that"
						},
						{
							"key": "B",
							"text": "which"
						},
						{
							"key": "C",
							"text": "what"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The finding that older adults tend to sleep less than younger adults is now well documented.",
					"why": "that 后面是 the finding 的内容（同位语从句），句子完整。which 要缺成分；what 前面不能有名词。",
					"audio": null,
					"tags": [
						"g-noun"
					]
				},
				{
					"id": "3-10-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Researchers still disagree about ______ has caused the decline in the number of wild bees.",
					"options": [
						{
							"key": "A",
							"text": "that"
						},
						{
							"key": "B",
							"text": "what"
						},
						{
							"key": "C",
							"text": "whether"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Researchers still disagree about what has caused the decline in the number of wild bees.",
					"why": "has caused 前面缺主语，缺东西用 what。whether 和 that 后面都要完整的句子。",
					"audio": null,
					"tags": [
						"g-noun"
					]
				},
				{
					"id": "3-10-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "______ the experiment failed is still a mystery.",
					"options": [
						{
							"key": "A",
							"text": "What"
						},
						{
							"key": "B",
							"text": "Which"
						},
						{
							"key": "C",
							"text": "Why"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Why the experiment failed is still a mystery.",
					"why": "the experiment failed 句子完整，缺的是原因，用 why。",
					"audio": null,
					"tags": [
						"g-noun"
					]
				},
				{
					"id": "3-10-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The teacher asked ______ we had finished the reading.",
					"options": [
						{
							"key": "A",
							"text": "if"
						},
						{
							"key": "B",
							"text": "that"
						},
						{
							"key": "C",
							"text": "what"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The teacher asked if we had finished the reading.",
					"why": "问「有没有读完」，是一般疑问句变过来的，用 if / whether。",
					"audio": null,
					"tags": [
						"g-noun"
					]
				},
				{
					"id": "3-10-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The study did not examine ______ the participants who dropped out differed from those who stayed.",
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
							"text": "whether"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The study did not examine whether the participants who dropped out differed from those who stayed.",
					"why": "「有没有差别」是是否的问题，用 whether。从句里 the participants … differed 完整，不缺成分，所以不用 what；examine 后面接 that 不通。",
					"audio": null,
					"tags": [
						"g-noun"
					]
				},
				{
					"id": "3-10-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "There is no evidence ______ the drug is harmful.",
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
							"text": "which"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "There is no evidence that the drug is harmful.",
					"why": "that 后面是 evidence 的内容，句子完整，用 that。",
					"audio": null,
					"tags": [
						"g-noun"
					]
				}
			],
			"id": "3-10",
			"ch": 3,
			"kind": "level",
			"x": 300,
			"y": 260,
			"label": "3-10",
			"name": "名词性从句",
			"zh": "语法 · what、that、whether 引出的句子",
			"branch": "grammar"
		},
		{
			"practice": false,
			"skill": "grammar",
			"type": "choice",
			"stations": [
				"6.8"
			],
			"hashtags": [
				"IELTS_6_8"
			],
			"gear": "grammar:6.8",
			"heartGear": "vocab:5.7",
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
					"id": "3-11-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "She decided ______ abroad after graduation.",
					"options": [
						{
							"key": "A",
							"text": "studying"
						},
						{
							"key": "B",
							"text": "studied"
						},
						{
							"key": "C",
							"text": "to study"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "She decided to study abroad after graduation.",
					"why": "decide 后面接 to do。",
					"audio": null,
					"tags": [
						"g-nonfinite"
					]
				},
				{
					"id": "3-11-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "______ by many as the founder of the field, Professor Hart continued to publish well into her eighties.",
					"options": [
						{
							"key": "A",
							"text": "Regarding"
						},
						{
							"key": "B",
							"text": "Regarded"
						},
						{
							"key": "C",
							"text": "To regard"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Regarded by many as the founder of the field, Professor Hart continued to publish well into her eighties.",
					"why": "逗号后的主语是 Professor Hart，她是「被认为」的，用过去分词 Regarded（= She was regarded by many as …）。by many 也提示是被动。",
					"audio": null,
					"tags": [
						"g-nonfinite"
					]
				},
				{
					"id": "3-11-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The report ______ by the committee was published last week.",
					"options": [
						{
							"key": "A",
							"text": "written"
						},
						{
							"key": "B",
							"text": "writing"
						},
						{
							"key": "C",
							"text": "to write"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The report written by the committee was published last week.",
					"why": "报告是被写的，用过去分词 written（= which was written）。",
					"audio": null,
					"tags": [
						"g-nonfinite"
					]
				},
				{
					"id": "3-11-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "______ the bus, he had to walk to the station.",
					"options": [
						{
							"key": "A",
							"text": "Missed"
						},
						{
							"key": "B",
							"text": "To miss"
						},
						{
							"key": "C",
							"text": "Having missed"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Having missed the bus, he had to walk to the station.",
					"why": "先错过车，再走路；动作在前，主语是他自己，用 having done。",
					"audio": null,
					"tags": [
						"g-nonfinite"
					]
				},
				{
					"id": "3-11-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Participants ______ the online questionnaire were later contacted for a follow-up interview.",
					"options": [
						{
							"key": "A",
							"text": "completed"
						},
						{
							"key": "B",
							"text": "completing"
						},
						{
							"key": "C",
							"text": "to complete"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Participants completing the online questionnaire were later contacted for a follow-up interview.",
					"why": "参与者是自己去填问卷的，主动，用 doing（= who completed）。completed 放在这里要么被读成谓语（后面又有 were，一句两个谓语），要么变成「被完成的参与者」。",
					"audio": null,
					"tags": [
						"g-nonfinite"
					]
				},
				{
					"id": "3-11-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "It is important ______ enough sleep before an exam.",
					"options": [
						{
							"key": "A",
							"text": "getting"
						},
						{
							"key": "B",
							"text": "to get"
						},
						{
							"key": "C",
							"text": "got"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "It is important to get enough sleep before an exam.",
					"why": "It is important to do，it 是形式主语，真正的主语是 to get enough sleep。",
					"audio": null,
					"tags": [
						"g-nonfinite"
					]
				},
				{
					"id": "3-11-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The results, ______ in a leading journal last year, have since been questioned by other researchers.",
					"options": [
						{
							"key": "A",
							"text": "publishing"
						},
						{
							"key": "B",
							"text": "to publish"
						},
						{
							"key": "C",
							"text": "published"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The results, published in a leading journal last year, have since been questioned by other researchers.",
					"why": "两个逗号中间是插入的修饰：结果是「被发表」的，用过去分词 published（= which were published）。主干是 The results have since been questioned。",
					"audio": null,
					"tags": [
						"g-nonfinite"
					]
				},
				{
					"id": "3-11-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Further research is needed ______ whether the effect lasts beyond the first year.",
					"options": [
						{
							"key": "A",
							"text": "to establish"
						},
						{
							"key": "B",
							"text": "establishing"
						},
						{
							"key": "C",
							"text": "established"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Further research is needed to establish whether the effect lasts beyond the first year.",
					"why": "「需要更多研究」是为了「弄清楚」，表目的用 to do。学术文章结尾常见这句。",
					"audio": null,
					"tags": [
						"g-nonfinite"
					]
				},
				{
					"id": "3-11-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The question is too difficult ______ in five minutes.",
					"options": [
						{
							"key": "A",
							"text": "answering"
						},
						{
							"key": "B",
							"text": "to answer"
						},
						{
							"key": "C",
							"text": "answered"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The question is too difficult to answer in five minutes.",
					"why": "too … to do = 太……以至于不能。",
					"audio": null,
					"tags": [
						"g-nonfinite"
					]
				},
				{
					"id": "3-11-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "______ from the hill, the town looks very small.",
					"options": [
						{
							"key": "A",
							"text": "Seen"
						},
						{
							"key": "B",
							"text": "Seeing"
						},
						{
							"key": "C",
							"text": "To see"
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Seen from the hill, the town looks very small.",
					"why": "主语是 the town，小镇是「被看」的，用 seen。",
					"audio": null,
					"tags": [
						"g-nonfinite"
					]
				}
			],
			"id": "3-11",
			"ch": 3,
			"kind": "level",
			"x": 360,
			"y": 225,
			"label": "3-11",
			"name": "非谓语",
			"zh": "语法 · to do、doing、done 选哪个",
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
					"id": "3-12-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The students who had completed the online course before the start of term found the first lectures much easier to follow.\n这句话的主干是哪个？",
					"options": [
						{
							"key": "A",
							"text": "The students had completed the course."
						},
						{
							"key": "B",
							"text": "The term started."
						},
						{
							"key": "C",
							"text": "The students found the lectures easier."
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
						"B": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The students who had completed the online course before the start of term found the first lectures much easier to follow.\n这句话的主干是哪个？",
					"why": "谓语是 found；who had completed … 是挂在 students 后面的从句，不是主干。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "3-12-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "One of the main reasons why so many young people in large cities choose to rent rather than buy is the rising cost of housing.\nWhich word is the main verb of this sentence?",
					"options": [
						{
							"key": "A",
							"text": "is"
						},
						{
							"key": "B",
							"text": "choose"
						},
						{
							"key": "C",
							"text": "rent"
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
						"C": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "One of the main reasons why so many young people in large cities choose to rent rather than buy is the rising cost of housing.\nWhich word is the main verb of this sentence?",
					"why": "主语是 One of the main reasons，谓语是 is；why … buy 是修饰 reasons 的从句。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "3-12-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Built more than a century ago and repaired many times since, the bridge is still used by thousands of people every day.\nWhat is the subject of the main clause?",
					"options": [
						{
							"key": "A",
							"text": "a century"
						},
						{
							"key": "B",
							"text": "the bridge"
						},
						{
							"key": "C",
							"text": "thousands of people"
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
						"C": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Built more than a century ago and repaired many times since, the bridge is still used by thousands of people every day.\nWhat is the subject of the main clause?",
					"why": "逗号前是 built … since 修饰 the bridge；主句是 the bridge is still used。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "3-12-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What surprised the researchers most was not the size of the effect but how quickly it appeared.\nThe researchers were most surprised by …",
					"options": [
						{
							"key": "A",
							"text": "how large the effect was"
						},
						{
							"key": "B",
							"text": "how many researchers there were"
						},
						{
							"key": "C",
							"text": "how fast the effect appeared"
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
						"B": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "What surprised the researchers most was not the size of the effect but how quickly it appeared.\nThe researchers were most surprised by …",
					"why": "not A but B，重点在 B：how quickly it appeared。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "3-12-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The council, which had promised to reduce traffic in the town centre, has now approved plans for a new car park.\nWhat has the council done?",
					"options": [
						{
							"key": "A",
							"text": "reduced traffic in the town centre"
						},
						{
							"key": "B",
							"text": "approved plans for a car park"
						},
						{
							"key": "C",
							"text": "promised to build a car park"
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
						"C": "long-sentence"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The council, which had promised to reduce traffic in the town centre, has now approved plans for a new car park.\nWhat has the council done?",
					"why": "两个逗号中间是插进来的从句；主干是 The council has approved plans。",
					"audio": null,
					"tags": [
						"g-long",
						"distractor"
					]
				},
				{
					"id": "3-12-B-1",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "把这句的主干排出来（有 2 块用不上）：The new library, which opened last spring after two years of building work, attracts more visitors than expected.",
					"options": null,
					"chips": [
						"attracts",
						"last spring",
						"The new library",
						"opened",
						"more visitors"
					],
					"answer": "The new library attracts more visitors",
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
					"evidence": "The new library attracts more visitors",
					"why": "两个逗号中间是从句，opened 和 last spring 都在里面，不是主干。主干是 The new library attracts more visitors。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "3-12-B-2",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "把这句的主干排出来（有 2 块用不上）：The results of the survey, published yesterday by the education department, show a clear rise in reading.",
					"options": null,
					"chips": [
						"published",
						"show",
						"The results",
						"yesterday",
						"a clear rise"
					],
					"answer": "The results show a clear rise",
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
					"evidence": "The results show a clear rise",
					"why": "published yesterday … 是修饰 survey 的，published 不是谓语。谓语是 show，主语是 the results（复数，所以是 show 不是 shows）。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "3-12-B-3",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "把这句的主干排出来（有 2 块用不上）：Many of the problems that the team faced in the first year were caused by poor planning.",
					"options": null,
					"chips": [
						"were caused",
						"the team faced",
						"Many of the problems",
						"in the first year",
						"by poor planning"
					],
					"answer": "Many of the problems were caused by poor planning",
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
					"evidence": "Many of the problems were caused by poor planning",
					"why": "that the team faced in the first year 是修饰 problems 的从句；faced 不是谓语，were caused 才是。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "3-12-B-4",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "把这句的主干排出来（有 2 块用不上）：The idea that children learn best through play has influenced schools in many countries.",
					"options": null,
					"chips": [
						"children learn",
						"has influenced",
						"through play",
						"The idea",
						"schools"
					],
					"answer": "The idea has influenced schools",
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
					"evidence": "The idea has influenced schools",
					"why": "that children learn best through play 是 the idea 的内容；learn 不是整句的谓语，has influenced 才是。",
					"audio": null,
					"tags": [
						"g-long"
					]
				},
				{
					"id": "3-12-B-5",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "把这句的主干排出来（有 2 块用不上）：Anyone who wants to borrow equipment from the lab must fill in a form first.",
					"options": null,
					"chips": [
						"must fill in",
						"wants to borrow",
						"Anyone",
						"from the lab",
						"a form"
					],
					"answer": "Anyone must fill in a form",
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
					"evidence": "Anyone must fill in a form",
					"why": "who wants to borrow equipment from the lab 是修饰 anyone 的；谓语是 must fill in。",
					"audio": null,
					"tags": [
						"g-long"
					]
				}
			],
			"id": "3-12",
			"ch": 3,
			"kind": "level",
			"x": 280,
			"y": 160,
			"label": "3-12",
			"name": "拆长句",
			"zh": "语法 · 把长句拆回主干",
			"branch": "grammar"
		},
		{
			"practice": false,
			"skill": "mixed",
			"type": "mixed",
			"stations": [
				"1.7",
				"2.7"
			],
			"hashtags": [
				"IELTS_1_7",
				"IELTS_2_7"
			],
			"gear": "synonym-match:academic",
			"heartGear": "synonym-match:academic",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j21",
				"j24",
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
			"timed": null,
			"pool": [
				{
					"id": "boss-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "When will the new wing open?",
					"options": [
						{
							"key": "A",
							"text": "later in the year than planned"
						},
						{
							"key": "B",
							"text": "in March"
						},
						{
							"key": "C",
							"text": "shortly after the roof repairs begin"
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "realistically it won't be ready until the autumn",
					"why": "March 是原计划；修屋顶本身 won't take long，可材料要从国外订，所以是 autumn，比计划晚。C 用了原文的 repairs 和「不久」，正好掉进 won't take long 的坑。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "The museum's new wing was meant to open in March, and the builders were confident they'd make it. Then they found problems with the roof. The repairs themselves won't take long, but the materials have to be ordered from abroad, so realistically it won't be ready until the autumn."
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
					"type": "multi",
					"skill": null,
					"passage": null,
					"question": "Which TWO things did students value most about the study centre?",
					"options": [
						{
							"key": "A",
							"text": "the coffee bar"
						},
						{
							"key": "B",
							"text": "being able to stay late"
						},
						{
							"key": "C",
							"text": "the up-to-date computers"
						},
						{
							"key": "D",
							"text": "spaces where groups can talk"
						},
						{
							"key": "E",
							"text": "the silence in every room"
						}
					],
					"chips": null,
					"answer": "B,D",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"A": "half-right",
						"C": "half-right",
						"E": "half-right"
					},
					"pick": 2,
					"bothWrongCause": "paraphrase",
					"playOnce": false,
					"lecture": null,
					"evidence": "What came up again and again was being able to work there until midnight. … People also really valued the group rooms",
					"why": "until midnight = stay late；group rooms … talk = spaces where groups can talk。咖啡吧 hardly anyone 提；电脑 a bit old，和 up-to-date 相反；without disturbing anyone 说的是小组间能说话，不是到处都安静。",
					"audio": {
						"voices": {
							"N": "us-hannah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "We asked students who'd used the new study centre what they thought. A lot of us expected them to mention the coffee bar, but hardly anyone did. What came up again and again was being able to work there until midnight. People also really valued the group rooms, because you can talk there without disturbing anyone. A few said the computers were a bit old, but that didn't seem to put them off."
							}
						]
					},
					"tags": [
						"choice",
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What did the survey find about older people?",
					"options": [
						{
							"key": "A",
							"text": "They use the internet less."
						},
						{
							"key": "B",
							"text": "They rarely use the internet for family."
						},
						{
							"key": "C",
							"text": "They mostly go online to contact relatives."
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
						"B": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "they use it for different things, mainly keeping in touch with family",
					"why": "keeping in touch with family = contact relatives。A 是原话，可前面有 didn't find。",
					"audio": {
						"voices": {
							"N": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Our survey didn't find that older people use the internet less. What we did find is that they use it for different things, mainly keeping in touch with family."
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
					"skill": null,
					"passage": "In the town of Elsby, street lights were switched off after midnight for one year to save money. The council expected complaints, but only a handful were received.\nThe police reported no rise in crime during the trial. Some residents said they could see far more stars, and a local school began running night-time astronomy classes.\nThe council has now decided to keep the lights off on quiet roads, but not on main roads.",
					"question": "Few people complained about the lights being turned off.",
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
					"evidence": "only a handful were received",
					"why": "only a handful = few。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "boss-A-5",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "In the town of Elsby, street lights were switched off after midnight for one year to save money. The council expected complaints, but only a handful were received.\nThe police reported no rise in crime during the trial. Some residents said they could see far more stars, and a local school began running night-time astronomy classes.\nThe council has now decided to keep the lights off on quiet roads, but not on main roads.",
					"question": "Crime fell during the trial.",
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
					"evidence": "The police reported no rise in crime during the trial.",
					"why": "「没涨」不等于「降了」，原文没说降没降。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "boss-A-6",
					"set": "A",
					"type": "TFNG",
					"skill": null,
					"passage": "In the town of Elsby, street lights were switched off after midnight for one year to save money. The council expected complaints, but only a handful were received.\nThe police reported no rise in crime during the trial. Some residents said they could see far more stars, and a local school began running night-time astronomy classes.\nThe council has now decided to keep the lights off on quiet roads, but not on main roads.",
					"question": "The lights will now stay off on every road in Elsby.",
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
					"evidence": "keep the lights off on quiet roads, but not on main roads",
					"why": "只有安静的路关灯，主路不关。every road 说过头了。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "boss-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Why has the talk been moved?",
					"options": [
						{
							"key": "A",
							"text": "Room 4 is being painted."
						},
						{
							"key": "B",
							"text": "Fewer people signed up than expected."
						},
						{
							"key": "C",
							"text": "There are too many people for the original room."
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
						"B": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "far more people have signed up than we expected, so we've moved it to the main hall",
					"why": "far more people signed up = 原来的房间装不下。粉刷是 has been painted（已经刷完），而且说了 nothing wrong；C 留着 signed up 和 expected，方向反了。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Just a change to tonight's programme. The talk on climate history was going to be in Room 4. There's nothing wrong with Room 4 itself; it's just been painted, in fact. But far more people have signed up than we expected, so we've moved it to the main hall."
							}
						]
					},
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-B-2",
					"set": "B",
					"type": "multi",
					"skill": null,
					"passage": null,
					"question": "Which TWO things must applicants send?",
					"options": [
						{
							"key": "A",
							"text": "a letter of support from a tutor"
						},
						{
							"key": "B",
							"text": "a CV"
						},
						{
							"key": "C",
							"text": "an outline of a proposed project"
						},
						{
							"key": "D",
							"text": "a list of courses taken"
						},
						{
							"key": "E",
							"text": "proof of earlier research"
						}
					],
					"chips": null,
					"answer": "A,C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "half-right",
						"D": "half-right",
						"E": "half-right"
					},
					"pick": 2,
					"bothWrongCause": "paraphrase",
					"playOnce": false,
					"lecture": null,
					"evidence": "You do need a reference from a tutor … Your application should also include a short plan for the project you'd like to work on.",
					"why": "a reference from a tutor = a letter of support from a tutor；a short plan for the project = an outline of a proposed project。研究经验 don't need；CV 可以寄，但 won't look at it，不是必须的。",
					"audio": {
						"voices": {
							"N": "us-ethan"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "If you're applying for the summer research placement, there are a few things to know. You don't need to have done any research before; we'll teach you that. You do need a reference from a tutor, and the deadline for that is firm. Your application should also include a short plan for the project you'd like to work on. Some people send a CV as well, which is fine, but we won't actually look at it."
							}
						]
					},
					"tags": [
						"choice",
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What was the main effect of the new timetable?",
					"options": [
						{
							"key": "A",
							"text": "Buses ran on time more often."
						},
						{
							"key": "B",
							"text": "Waiting times fell greatly."
						},
						{
							"key": "C",
							"text": "Fewer buses were reliable."
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "But the bigger change was that buses became far more reliable.",
					"why": "far more reliable = ran on time more often。等车时间只是 slightly 减少，A 说 greatly 过头了。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "We expected the new timetable to reduce waiting times, and it did, slightly. But the bigger change was that buses became far more reliable."
							}
						]
					},
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-B-4",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "A software company called Brightwell let its staff work four days a week instead of five, with no cut in pay. The trial lasted six months.\nAt the end, managers reported that the amount of work completed had stayed about the same. Staff took fewer days off sick, and almost all of them asked to continue.\nHowever, the company's customer service team found it harder to answer calls on Fridays, and extra staff had to be hired for that day.",
					"question": "Employees earned less during the trial.",
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
					"evidence": "with no cut in pay",
					"why": "no cut in pay = 工资没少。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "boss-B-5",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "A software company called Brightwell let its staff work four days a week instead of five, with no cut in pay. The trial lasted six months.\nAt the end, managers reported that the amount of work completed had stayed about the same. Staff took fewer days off sick, and almost all of them asked to continue.\nHowever, the company's customer service team found it harder to answer calls on Fridays, and extra staff had to be hired for that day.",
					"question": "Output did not change much during the six months.",
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
					"evidence": "the amount of work completed had stayed about the same",
					"why": "the amount of work completed = output；stayed about the same = did not change much。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "boss-B-6",
					"set": "B",
					"type": "TFNG",
					"skill": null,
					"passage": "A software company called Brightwell let its staff work four days a week instead of five, with no cut in pay. The trial lasted six months.\nAt the end, managers reported that the amount of work completed had stayed about the same. Staff took fewer days off sick, and almost all of them asked to continue.\nHowever, the company's customer service team found it harder to answer calls on Fridays, and extra staff had to be hired for that day.",
					"question": "The trial cost the company more money overall.",
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
					"evidence": "extra staff had to be hired for that day",
					"why": "多雇了人，可病假也少了；总账全文没算，不能下结论。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "boss-C-1",
					"set": "C",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "What must students do?",
					"options": [
						{
							"key": "A",
							"text": "read the whole list"
						},
						{
							"key": "B",
							"text": "read three books from part of the list"
						},
						{
							"key": "C",
							"text": "read the second section before the seminars"
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Choose any three books from the first section",
					"why": "the first section = part of the list。C 用了原词 section 和 seminars，可第二部分是 optional，seminars 用的是第一部分。",
					"audio": {
						"voices": {
							"N": "us-selene"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "The reading list is long, I know, but you don't have to read all of it. Choose any three books from the first section; those are the ones the seminars are based on. The second section is optional, though it's worth a look if you're thinking of writing your essay on this topic."
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
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "According to the latest research, what was the castle mainly used for?",
					"options": [
						{
							"key": "A",
							"text": "housing a rich family"
						},
						{
							"key": "B",
							"text": "defending the area"
						},
						{
							"key": "C",
							"text": "carrying out research"
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
						"C": "paraphrase"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "the latest research shows it was mainly a home for a wealthy family",
					"why": "a home for a wealthy family = housing a rich family。defence 是 people often assume，被 but 推翻了。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "People often assume the castle was built for defence, but the latest research shows it was mainly a home for a wealthy family."
							}
						]
					},
					"tags": [
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-C-3",
					"set": "C",
					"type": "multi",
					"skill": null,
					"passage": null,
					"question": "Which TWO things do users get only if they pay?",
					"options": [
						{
							"key": "A",
							"text": "a saved record of their progress"
						},
						{
							"key": "B",
							"text": "use on several devices"
						},
						{
							"key": "C",
							"text": "no advertisements"
						},
						{
							"key": "D",
							"text": "the ability to use the app offline"
						},
						{
							"key": "E",
							"text": "unlimited lessons"
						}
					],
					"chips": null,
					"answer": "A,C",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": null,
					"causes": {
						"B": "half-right",
						"D": "half-right",
						"E": "half-right"
					},
					"pick": 2,
					"bothWrongCause": "paraphrase",
					"playOnce": false,
					"lecture": null,
					"evidence": "If you want to keep a record of your progress, though, you'll need the full version, which also removes the adverts.",
					"why": "keep a record of your progress = a saved record；removes the adverts = no advertisements。课程不限量、多设备是免费版就有的；离线 was going to be 付费，现在 made free for everyone。",
					"audio": {
						"voices": {
							"N": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "The free version of the app lets you do as many lessons as you like, and you can use it on more than one device. If you want to keep a record of your progress, though, you'll need the full version, which also removes the adverts. Offline use was going to be part of the paid version too, but that's now been made free for everyone."
							}
						]
					},
					"tags": [
						"choice",
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-C-4",
					"set": "C",
					"type": "TFNG",
					"skill": null,
					"passage": "In several towns, public libraries now lend seeds as well as books. Members take seeds home, grow the plants, and are asked to bring back some seeds from their harvest.\nThe idea is popular with gardeners, but organisers say fewer than half of the borrowers return any seeds. Some libraries have responded by running short classes on how to collect seeds.\nOne librarian in the town of Carrow said the classes had made a big difference, although she admitted that no figures had yet been collected.",
					"question": "Libraries expect members to give back some seeds after growing the plants.",
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
					"evidence": "are asked to bring back some seeds from their harvest",
					"why": "are asked to bring back = expect members to give back。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "boss-C-5",
					"set": "C",
					"type": "TFNG",
					"skill": null,
					"passage": "In several towns, public libraries now lend seeds as well as books. Members take seeds home, grow the plants, and are asked to bring back some seeds from their harvest.\nThe idea is popular with gardeners, but organisers say fewer than half of the borrowers return any seeds. Some libraries have responded by running short classes on how to collect seeds.\nOne librarian in the town of Carrow said the classes had made a big difference, although she admitted that no figures had yet been collected.",
					"question": "Most borrowers return some seeds.",
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
					"evidence": "fewer than half of the borrowers return any seeds",
					"why": "不到一半，不是大多数。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				},
				{
					"id": "boss-C-6",
					"set": "C",
					"type": "TFNG",
					"skill": null,
					"passage": "In several towns, public libraries now lend seeds as well as books. Members take seeds home, grow the plants, and are asked to bring back some seeds from their harvest.\nThe idea is popular with gardeners, but organisers say fewer than half of the borrowers return any seeds. Some libraries have responded by running short classes on how to collect seeds.\nOne librarian in the town of Carrow said the classes had made a big difference, although she admitted that no figures had yet been collected.",
					"question": "According to one librarian, the classes have been effective.",
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
					"evidence": "the classes had made a big difference",
					"why": "made a big difference = effective。题目只说「她认为有效」，没说有数据，所以是 TRUE。后面那句「还没收集数据」是陷阱，跟这道题不矛盾。",
					"audio": null,
					"tags": [
						"tfng",
						"paraphrase"
					]
				}
			],
			"id": "3-boss",
			"ch": 3,
			"kind": "boss",
			"x": 195,
			"y": 90,
			"label": "Boss",
			"name": "偷换者",
			"zh": "Boss · 对的选项换了说法，错的选项用了原词（听力 + 阅读）",
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
			"id": "3-gear",
			"ch": 3,
			"kind": "gear",
			"x": 340,
			"y": 480,
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
				"IELTS_1_7",
				"IELTS_2_7"
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
			"id": "3-intel",
			"ch": 3,
			"kind": "news",
			"x": 35,
			"y": 465,
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
			"id": "3-shelf",
			"ch": 3,
			"kind": "shelf",
			"x": 225,
			"y": 190,
			"label": "锦囊书屋",
			"name": "锦囊书屋",
			"zh": "读一本锦囊、做 3 题对 2 题，补 1 颗心",
			"branch": "station"
		}
	],
	"edges": [
		[
			"3-start",
			"3-1",
			"main"
		],
		[
			"3-1",
			"3-2",
			"main"
		],
		[
			"3-2",
			"3-3",
			"main"
		],
		[
			"3-3",
			"3-4",
			"main"
		],
		[
			"3-4",
			"3-5",
			"main"
		],
		[
			"3-5",
			"3-6",
			"main"
		],
		[
			"3-6",
			"3-boss",
			"main"
		],
		[
			"3-3",
			"3-7",
			"vocab"
		],
		[
			"3-7",
			"3-8",
			"vocab"
		],
		[
			"3-8",
			"3-9",
			"vocab"
		],
		[
			"3-9",
			"3-6",
			"vocab"
		],
		[
			"3-4",
			"3-10",
			"grammar"
		],
		[
			"3-10",
			"3-11",
			"grammar"
		],
		[
			"3-11",
			"3-12",
			"grammar"
		],
		[
			"3-1",
			"3-gear",
			"station"
		],
		[
			"3-3",
			"3-intel",
			"station"
		],
		[
			"3-5",
			"3-shelf",
			"station"
		]
	],
	"causeOrder": [
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
					"zh": "读一本锦囊并过小测（推荐《认识不等于认得出》）"
				},
				{
					"id": "gear",
					"zh": "去装备练一组（同义词连连看·学术话题，或任意一件装备）"
				},
				{
					"id": "intel",
					"zh": "去公会看 1 篇情报帖（#IELTS_1_7 或 #IELTS_2_7）"
				}
			]
		},
		"chest": {
			"sideAt": "3-12",
			"sideXp": 30,
			"clearXp": 100,
			"badge": "ielts-c3"
		},
		"multi": {
			"oneRightCause": "half-right",
			"inBossZh": "Boss 里有 1 道选两个：两个都对才算打中；对一半，不扣血也不扣心。",
			"oneRightZh": "对一半：不扣心，但不算答对（不计入过关的 4 题，不算连胜）"
		},
		"timedCopy": null
	}
};
