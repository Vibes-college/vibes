/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关第2章：地图、关卡、题库（138 题，全部原创）和规则数字。版本 ch2-2026-11-11i。
// 由 apps/community/scripts/quest-chapter.mjs 从路线图的「关卡数据」（chapter-2.json、questions/*.json、numbers.json）生成，不要手改。
// 答案、accept、evidence、录音稿只在服务器上：页面拿到的题目不带这些，作答由 lojo/quest/answer 判。
// 坐标是 390 宽、600 高画布里的位置。难度是「练习难度」，不是官方分数。

import type { QuestCause, QuestChapter } from '@/misc/lojo-quest-types.js';

export type { QuestAudio, QuestCause, QuestChapter, QuestNode, QuestNodeKind, QuestQuestion, QuestRules, QuestTimed } from '@/misc/lojo-quest-types.js';

export const QUEST_CH2: QuestChapter = {
	"id": "ielts-c2",
	"no": 2,
	"version": "ch2-2026-11-11i",
	"title": "第二章 · 换挡",
	"band": "练习难度 5.5–6.0",
	"disclaimer": "练习难度，不是官方分数",
	"bossId": "2-boss",
	"startId": "2-start",
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
			"note": "2-3 之后可以不走阅读，走词汇绕到 2-6；两条路过任一条都能进 2-6"
		},
		"grammar": {
			"zh": "语法支线",
			"note": "2-4 之后开，不挡主线；2-12 过了开支线宝箱"
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
			"id": "2-start",
			"ch": 2,
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
				"1.5"
			],
			"hashtags": [
				"IELTS_1_5"
			],
			"gear": "dictation",
			"heartGear": "dictation",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j11",
				"j16",
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
					"id": "2-1-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Where is the gift shop?",
					"options": [
						{
							"key": "A",
							"text": "the second door on the left, after the toilets"
						},
						{
							"key": "B",
							"text": "the first door on the left"
						},
						{
							"key": "C",
							"text": "the second door on the right"
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
						"B": "direction",
						"C": "direction"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Excuse me, where's the gift shop? Go through the main entrance and turn right. It's the second door on your left, just after the toilets.",
					"why": "先右转，再数左手边第二个门，在厕所后面。",
					"audio": {
						"voices": {
							"A": "us-ethan",
							"B": "uk-brit"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "Excuse me, where's the gift shop?"
							},
							{
								"who": "B",
								"text": "Go through the main entrance and turn right. It's the second door on your left, just after the toilets."
							}
						]
					},
					"tags": [
						"map"
					]
				},
				{
					"id": "2-1-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Where can visitors park?",
					"options": [
						{
							"key": "A",
							"text": "in front of the sports hall"
						},
						{
							"key": "B",
							"text": "next to the bus stop"
						},
						{
							"key": "C",
							"text": "behind the sports hall"
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
						"A": "direction",
						"B": "direction"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Where can I park? The car park is behind the sports hall, not in front of it. The space in front is only for buses.",
					"why": "not in front of it 把「前面」否掉了，前面只给巴士停。",
					"audio": {
						"voices": {
							"A": "us-ethan",
							"B": "uk-brit"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "Where can I park?"
							},
							{
								"who": "B",
								"text": "The car park is behind the sports hall, not in front of it. The space in front is only for buses."
							}
						]
					},
					"tags": [
						"map",
						"distractor"
					]
				},
				{
					"id": "2-1-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Where is the café?",
					"options": [
						{
							"key": "A",
							"text": "next to the playground"
						},
						{
							"key": "B",
							"text": "across the pond from the playground"
						},
						{
							"key": "C",
							"text": "at the start of the path"
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
						"A": "direction",
						"C": "direction"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Is there a café in the park? Yes. Walk straight down the path until you reach the pond. The café is on the opposite side of the pond from the playground.",
					"why": "on the opposite side of … from … = 在……的对面。",
					"audio": {
						"voices": {
							"A": "us-ethan",
							"B": "uk-brit"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "Is there a café in the park?"
							},
							{
								"who": "B",
								"text": "Yes. Walk straight down the path until you reach the pond. The café is on the opposite side of the pond from the playground."
							}
						]
					},
					"tags": [
						"map"
					]
				},
				{
					"id": "2-1-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Where is the computer room?",
					"options": [
						{
							"key": "A",
							"text": "on the first floor, at the end of the corridor"
						},
						{
							"key": "B",
							"text": "on the ground floor, beside reception"
						},
						{
							"key": "C",
							"text": "on the second floor, next to the stairs"
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
						"B": "direction",
						"C": "direction"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "I'm looking for the computer room. From reception, take the stairs up to the first floor. The computer room is at the end of the corridor, facing the lift.",
					"why": "up to the first floor，再走到走廊尽头。英式的 first floor 是中国说的二楼。",
					"audio": {
						"voices": {
							"A": "us-ethan",
							"B": "uk-brit"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "I'm looking for the computer room."
							},
							{
								"who": "B",
								"text": "From reception, take the stairs up to the first floor. The computer room is at the end of the corridor, facing the lift."
							}
						]
					},
					"tags": [
						"map"
					]
				},
				{
					"id": "2-1-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Where is the picnic area now?",
					"options": [
						{
							"key": "A",
							"text": "by the river"
						},
						{
							"key": "B",
							"text": "in the south corner, near the car park"
						},
						{
							"key": "C",
							"text": "in the north corner, near the main gate"
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
						"A": "direction",
						"B": "direction"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Is the picnic area still by the river? It used to be, but it's been moved. It's now in the north corner of the park, near the main gate.",
					"why": "used to be 是以前，now 后面才是现在的位置。",
					"audio": {
						"voices": {
							"A": "us-ethan",
							"B": "uk-brit"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "Is the picnic area still by the river?"
							},
							{
								"who": "B",
								"text": "It used to be, but it's been moved. It's now in the north corner of the park, near the main gate."
							}
						]
					},
					"tags": [
						"map",
						"distractor"
					]
				},
				{
					"id": "2-1-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Where is the bank?",
					"options": [
						{
							"key": "A",
							"text": "between the bakery and the post office"
						},
						{
							"key": "B",
							"text": "next to the station"
						},
						{
							"key": "C",
							"text": "opposite the traffic lights"
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
						"B": "direction",
						"C": "direction"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "How do I get to the bank? When you come out of the station, cross the road at the traffic lights. The bank is on the corner, between the bakery and the post office.",
					"why": "between A and B = 夹在两家店中间。",
					"audio": {
						"voices": {
							"A": "us-hannah",
							"B": "au-felix"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "How do I get to the bank?"
							},
							{
								"who": "B",
								"text": "When you come out of the station, cross the road at the traffic lights. The bank is on the corner, between the bakery and the post office."
							}
						]
					},
					"tags": [
						"map"
					]
				},
				{
					"id": "2-1-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which way should the visitor go?",
					"options": [
						{
							"key": "A",
							"text": "the first turning on the left"
						},
						{
							"key": "B",
							"text": "the second turning on the right"
						},
						{
							"key": "C",
							"text": "the second turning on the left"
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
						"A": "direction",
						"B": "direction"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Which way to the youth hostel? Take the second turning on the left. Not the first one, that's a dead end.",
					"why": "第一条左转是死路（dead end），要走第二条。",
					"audio": {
						"voices": {
							"A": "us-hannah",
							"B": "au-felix"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "Which way to the youth hostel?"
							},
							{
								"who": "B",
								"text": "Take the second turning on the left. Not the first one, that's a dead end."
							}
						]
					},
					"tags": [
						"map",
						"distractor"
					]
				},
				{
					"id": "2-1-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Where is the lecture theatre?",
					"options": [
						{
							"key": "A",
							"text": "inside the library"
						},
						{
							"key": "B",
							"text": "in the building behind the library"
						},
						{
							"key": "C",
							"text": "in the building next to the library"
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
						"A": "direction",
						"C": "direction"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Where's the lecture theatre? It's in Block C. Block C is the tall building directly behind the library.",
					"why": "directly behind the library = 图书馆正后面那栋楼。",
					"audio": {
						"voices": {
							"A": "us-hannah",
							"B": "au-felix"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "Where's the lecture theatre?"
							},
							{
								"who": "B",
								"text": "It's in Block C. Block C is the tall building directly behind the library."
							}
						]
					},
					"tags": [
						"map"
					]
				},
				{
					"id": "2-1-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Where is the information desk?",
					"options": [
						{
							"key": "A",
							"text": "next to the fountain"
						},
						{
							"key": "B",
							"text": "to the right of the bike racks"
						},
						{
							"key": "C",
							"text": "to the left of the bike racks"
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
						"A": "direction",
						"B": "direction"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Where can I get a map? At the information desk. Go past the fountain and keep going until you see the bike racks. The desk is just to the left of them.",
					"why": "喷泉只是路过的地方，终点是自行车架的左边。",
					"audio": {
						"voices": {
							"A": "us-hannah",
							"B": "au-felix"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "Where can I get a map?"
							},
							{
								"who": "B",
								"text": "At the information desk. Go past the fountain and keep going until you see the bike racks. The desk is just to the left of them."
							}
						]
					},
					"tags": [
						"map"
					]
				},
				{
					"id": "2-1-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "How do you get into the pool?",
					"options": [
						{
							"key": "A",
							"text": "through the front door"
						},
						{
							"key": "B",
							"text": "round the back of the building"
						},
						{
							"key": "C",
							"text": "through the gym"
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
						"A": "direction",
						"C": "direction"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "How do I get into the swimming pool? The pool entrance is round the back. Don't use the front door, that's for the gym.",
					"why": "round the back = 绕到后面；前门是健身房的。",
					"audio": {
						"voices": {
							"A": "us-hannah",
							"B": "au-felix"
						},
						"rate": 0.95,
						"lines": [
							{
								"who": "A",
								"text": "How do I get into the swimming pool?"
							},
							{
								"who": "B",
								"text": "The pool entrance is round the back. Don't use the front door, that's for the gym."
							}
						]
					},
					"tags": [
						"map",
						"distractor"
					]
				}
			],
			"id": "2-1",
			"ch": 2,
			"kind": "level",
			"x": 115,
			"y": 520,
			"label": "2-1",
			"name": "跟着路线走",
			"zh": "听力 · 听指路，找到终点在哪",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "listening",
			"type": "gap",
			"stations": [
				"1.5"
			],
			"hashtags": [
				"IELTS_1_5"
			],
			"gear": "dictation",
			"heartGear": "dictation",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j14",
				"j17",
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
					"id": "2-2-A-1",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Tour length: about ______ minutes",
					"options": null,
					"chips": null,
					"answer": "90",
					"accept": [
						"ninety"
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
					"lecture": null,
					"evidence": "Welcome to Brookfield Farm. The tour lasts about ninety minutes, and we'll finish in the dairy, where you can try our cheese.",
					"why": "ninety 重音在前，nineteen 重音在后。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Welcome to Brookfield Farm. The tour lasts about ninety minutes, and we'll finish in the dairy, where you can try our cheese."
							}
						]
					},
					"tags": [
						"form",
						"word-limit",
						"numbers"
					]
				},
				{
					"id": "2-2-A-2",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Dogs must be kept on a ______.",
					"options": null,
					"chips": null,
					"answer": "lead",
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
					"lecture": null,
					"evidence": "Please keep dogs on a lead at all times, because the sheep are easily frightened.",
					"why": "on a lead = 拴着狗绳，英式说法；美式说 leash。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Please keep dogs on a lead at all times, because the sheep are easily frightened."
							}
						]
					},
					"tags": [
						"form",
						"word-limit"
					]
				},
				{
					"id": "2-2-A-3",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Lunch: in the old ______",
					"options": null,
					"chips": null,
					"answer": "barn",
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
					"lecture": null,
					"evidence": "Lunch is served in the old barn, not in the farmhouse, which is now a private home.",
					"why": "farmhouse 被 not 否掉了。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Lunch is served in the old barn, not in the farmhouse, which is now a private home."
							}
						]
					},
					"tags": [
						"form",
						"word-limit",
						"distractor"
					]
				},
				{
					"id": "2-2-A-4",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Goat food: £______ a bag",
					"options": null,
					"chips": null,
					"answer": "1.20",
					"accept": [
						"1.2"
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
					"lecture": null,
					"evidence": "Children can feed the goats, but only with the food we sell at the entrance. It's one pound twenty a bag.",
					"why": "one pound twenty = £1.20。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "Children can feed the goats, but only with the food we sell at the entrance. It's one pound twenty a bag."
							}
						]
					},
					"tags": [
						"form",
						"word-limit",
						"numbers"
					]
				},
				{
					"id": "2-2-A-5",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Follow the red ______ back to the car park.",
					"options": null,
					"chips": null,
					"answer": "flags",
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
					"lecture": null,
					"evidence": "If you get lost, look for the red flags. They mark the path back to the car park.",
					"why": "录音里是复数 flags，少了 s 就算错。",
					"audio": {
						"voices": {
							"N": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "If you get lost, look for the red flags. They mark the path back to the car park."
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
					"id": "2-2-B-1",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Festival starts: ______ July",
					"options": null,
					"chips": null,
					"answer": "14",
					"accept": [
						"14th",
						"fourteenth"
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
					"lecture": null,
					"evidence": "The festival runs for three days, starting on the fourteenth of July.",
					"why": "three days 是天数，问的是哪天开始。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "The festival runs for three days, starting on the fourteenth of July."
							}
						]
					},
					"tags": [
						"form",
						"word-limit",
						"numbers"
					]
				},
				{
					"id": "2-2-B-2",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Cooking demonstrations: in the ______ tent",
					"options": null,
					"chips": null,
					"answer": "smaller",
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
					"lecture": null,
					"evidence": "All the music is in the main tent. The smaller tent is used for cooking demonstrations.",
					"why": "main tent 是放音乐的，做饭表演在 smaller tent。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "All the music is in the main tent. The smaller tent is used for cooking demonstrations."
							}
						]
					},
					"tags": [
						"form",
						"word-limit",
						"distractor"
					]
				},
				{
					"id": "2-2-B-3",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Weekend pass: £______",
					"options": null,
					"chips": null,
					"answer": "40",
					"accept": [
						"forty"
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
					"lecture": null,
					"evidence": "A ticket for a single day is eighteen pounds. A weekend pass is forty.",
					"why": "eighteen 是单日票，weekend pass 是 forty。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "A ticket for a single day is eighteen pounds. A weekend pass is forty."
							}
						]
					},
					"tags": [
						"form",
						"word-limit",
						"numbers"
					]
				},
				{
					"id": "2-2-B-4",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Bring a reusable ______.",
					"options": null,
					"chips": null,
					"answer": "bottle",
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
					"lecture": null,
					"evidence": "We ask everyone to bring a reusable bottle, as there are free water points across the site.",
					"why": "reusable 后面那个名词就是答案。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "We ask everyone to bring a reusable bottle, as there are free water points across the site."
							}
						]
					},
					"tags": [
						"form",
						"word-limit"
					]
				},
				{
					"id": "2-2-B-5",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Last shuttle bus: ______ pm",
					"options": null,
					"chips": null,
					"answer": "11.30",
					"accept": [
						"11:30"
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
					"lecture": null,
					"evidence": "The last shuttle bus back to the town centre leaves at half past eleven.",
					"why": "half past eleven = 11:30。",
					"audio": {
						"voices": {
							"N": "au-friendly"
						},
						"rate": 1,
						"lines": [
							{
								"who": "N",
								"text": "The last shuttle bus back to the town centre leaves at half past eleven."
							}
						]
					},
					"tags": [
						"form",
						"word-limit",
						"numbers"
					]
				}
			],
			"id": "2-2",
			"ch": 2,
			"kind": "level",
			"x": 245,
			"y": 455,
			"label": "2-2",
			"name": "讲解员的笔记",
			"zh": "听力 · 一个人讲，你记笔记（限一个词或数字）",
			"branch": "main"
		},
		{
			"practice": false,
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
				"j16",
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
					"id": "2-3-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Tom（男声）和 Amy（女声）。Who thinks the library is too noisy?",
					"options": [
						{
							"key": "A",
							"text": "Amy"
						},
						{
							"key": "B",
							"text": "Tom"
						},
						{
							"key": "C",
							"text": "both of them"
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
					"evidence": "I think the library's too noisy to work in these days. Really? I find it fine. It's the computer room that bothers me.",
					"why": "Amy 说 I find it fine，她嫌吵的是机房。",
					"audio": {
						"voices": {
							"T": "us-ethan",
							"A": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "T",
								"text": "I think the library's too noisy to work in these days."
							},
							{
								"who": "A",
								"text": "Really? I find it fine. It's the computer room that bothers me."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "2-3-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Tom（男声）和 Amy（女声）。Who thinks the reading list is too long?",
					"options": [
						{
							"key": "A",
							"text": "Tom"
						},
						{
							"key": "B",
							"text": "Amy"
						},
						{
							"key": "C",
							"text": "both of them"
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
					"evidence": "The reading list is far too long for one term. I agree. I've only finished half of it.",
					"why": "I agree = 同意，两个人看法一样。",
					"audio": {
						"voices": {
							"T": "us-ethan",
							"A": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "A",
								"text": "The reading list is far too long for one term."
							},
							{
								"who": "T",
								"text": "I agree. I've only finished half of it."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "2-3-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Tom（男声）和 Amy（女声）。Who prefers face-to-face interviews?",
					"options": [
						{
							"key": "A",
							"text": "Amy"
						},
						{
							"key": "B",
							"text": "Tom"
						},
						{
							"key": "C",
							"text": "both of them"
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
						"B": "speaker",
						"C": "speaker"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Should we do the survey online? I'd rather interview people face to face. You get better answers. Fair enough, but online is quicker.",
					"why": "Tom 的 fair enough 只是承认有道理，后面 but 才是他的看法。",
					"audio": {
						"voices": {
							"T": "us-ethan",
							"A": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "T",
								"text": "Should we do the survey online?"
							},
							{
								"who": "A",
								"text": "I'd rather interview people face to face. You get better answers."
							},
							{
								"who": "T",
								"text": "Fair enough, but online is quicker."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "2-3-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Tom（男声）和 Amy（女声）。Who finds the slides helpful?",
					"options": [
						{
							"key": "A",
							"text": "Amy"
						},
						{
							"key": "B",
							"text": "both of them"
						},
						{
							"key": "C",
							"text": "Tom"
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
					"evidence": "Dr Lee's lectures are hard to follow. They are at first, but I've found the slides really help.",
					"why": "说 slides really help 的是 Tom。",
					"audio": {
						"voices": {
							"T": "us-ethan",
							"A": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "A",
								"text": "Dr Lee's lectures are hard to follow."
							},
							{
								"who": "T",
								"text": "They are at first, but I've found the slides really help."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "2-3-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Tom（男声）和 Amy（女声）。Who first says Friday is too early?",
					"options": [
						{
							"key": "A",
							"text": "Amy"
						},
						{
							"key": "B",
							"text": "Tom"
						},
						{
							"key": "C",
							"text": "both of them"
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
						"B": "speaker",
						"C": "speaker"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Let's give our presentation on Friday. Friday's too soon. We haven't checked the data yet. You're right, actually. Let's wait.",
					"why": "先说 too soon 的是 Amy，Tom 后来才同意。",
					"audio": {
						"voices": {
							"T": "us-ethan",
							"A": "uk-brit"
						},
						"rate": 1,
						"lines": [
							{
								"who": "T",
								"text": "Let's give our presentation on Friday."
							},
							{
								"who": "A",
								"text": "Friday's too soon. We haven't checked the data yet."
							},
							{
								"who": "T",
								"text": "You're right, actually. Let's wait."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "2-3-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Jack（男声）和 Mei（女声）。Who liked the field trip most?",
					"options": [
						{
							"key": "A",
							"text": "Mei"
						},
						{
							"key": "B",
							"text": "both of them"
						},
						{
							"key": "C",
							"text": "Jack"
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
					"evidence": "The group project was the best part of the course. For me, it was the field trip.",
					"why": "For me 换了人：Jack 最喜欢的是 field trip。",
					"audio": {
						"voices": {
							"J": "au-felix",
							"M": "us-hannah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "M",
								"text": "The group project was the best part of the course."
							},
							{
								"who": "J",
								"text": "For me, it was the field trip."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "2-3-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Jack（男声）和 Mei（女声）。Who wants more sources?",
					"options": [
						{
							"key": "A",
							"text": "Mei"
						},
						{
							"key": "B",
							"text": "Jack"
						},
						{
							"key": "C",
							"text": "both of them"
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
						"B": "speaker",
						"C": "speaker"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "I don't think we need any more sources. We do. Two articles isn't enough.",
					"why": "Jack 说 don't need，Mei 说 We do。",
					"audio": {
						"voices": {
							"J": "au-felix",
							"M": "us-hannah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "J",
								"text": "I don't think we need any more sources."
							},
							{
								"who": "M",
								"text": "We do. Two articles isn't enough."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "2-3-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Jack（男声）和 Mei（女声）。Who thinks the deadline is unfair?",
					"options": [
						{
							"key": "A",
							"text": "Jack"
						},
						{
							"key": "B",
							"text": "Mei"
						},
						{
							"key": "C",
							"text": "both of them"
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
					"evidence": "The deadline is unfair. Unfair? Maybe not. But it's certainly tight.",
					"why": "Jack 重复了 unfair 却是在反问，他只承认时间紧。",
					"audio": {
						"voices": {
							"J": "au-felix",
							"M": "us-hannah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "M",
								"text": "The deadline is unfair."
							},
							{
								"who": "J",
								"text": "Unfair? Maybe not. But it's certainly tight."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "2-3-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Jack（男声）和 Mei（女声）。Who prefers to work in the morning?",
					"options": [
						{
							"key": "A",
							"text": "Jack"
						},
						{
							"key": "B",
							"text": "Mei"
						},
						{
							"key": "C",
							"text": "both of them"
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
					"evidence": "Working in the morning suits me. Me too. I'm useless after lunch.",
					"why": "Me too = 我也是。",
					"audio": {
						"voices": {
							"J": "au-felix",
							"M": "us-hannah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "J",
								"text": "Working in the morning suits me."
							},
							{
								"who": "M",
								"text": "Me too. I'm useless after lunch."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "2-3-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Jack（男声）和 Mei（女声）。Who will write about history?",
					"options": [
						{
							"key": "A",
							"text": "Mei"
						},
						{
							"key": "B",
							"text": "Jack"
						},
						{
							"key": "C",
							"text": "both of them"
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
					"evidence": "Shall we split the topic in two? That makes sense. I'll take the history part.",
					"why": "I'll take the history part 是 Jack 说的。",
					"audio": {
						"voices": {
							"J": "au-felix",
							"M": "us-hannah"
						},
						"rate": 1,
						"lines": [
							{
								"who": "M",
								"text": "Shall we split the topic in two?"
							},
							{
								"who": "J",
								"text": "That makes sense. I'll take the history part."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				}
			],
			"id": "2-3",
			"ch": 2,
			"kind": "level",
			"x": 180,
			"y": 405,
			"label": "2-3",
			"name": "谁说的",
			"zh": "听力 · 两个人意见不一样，分清哪句是谁的",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "reading",
			"type": "choice",
			"stations": [
				"2.5"
			],
			"hashtags": [
				"IELTS_2_5"
			],
			"gear": "vocab:5.5",
			"heartGear": "vocab:5.5",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j12",
				"j22",
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
					"id": "2-4-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "For centuries, people in dry regions have collected rainwater from their roofs. Today, some cities are returning to this idea. New buildings must store rain in underground tanks, and the water is used to flush toilets and water gardens, which reduces the demand on the public supply.",
					"question": "Choose the best heading for this paragraph.",
					"options": [
						{
							"key": "A",
							"text": "Why toilets waste so much water"
						},
						{
							"key": "B",
							"text": "The history of public water supplies"
						},
						{
							"key": "C",
							"text": "An old method finds a new use in cities"
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
						"A": "main-idea",
						"B": "main-idea"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "For centuries, people in dry regions have collected rainwater from their roofs. Today, some cities are returning to this idea. New buildings must store rain in underground tanks, and the water is used to flush toilets and water gardens, which reduces the demand on the public supply.",
					"why": "整段讲「老办法收雨水，城市重新用起来」；toilets 只是一个细节。",
					"audio": null,
					"tags": [
						"headings"
					]
				},
				{
					"id": "2-4-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Many people believe that cats are unfriendly animals that care only about food. In one experiment, however, cats were left in a room with food, toys and a person. Half of them preferred the person to the food or the toys.",
					"question": "Choose the best heading for this paragraph.",
					"options": [
						{
							"key": "A",
							"text": "What cats like to eat"
						},
						{
							"key": "B",
							"text": "Cats may be more social than we think"
						},
						{
							"key": "C",
							"text": "How to choose a toy for a cat"
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
						"A": "main-idea",
						"C": "main-idea"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Many people believe that cats are unfriendly animals that care only about food. In one experiment, however, cats were left in a room with food, toys and a person. Half of them preferred the person to the food or the toys.",
					"why": "however 后面才是作者要说的：一半的猫更想跟人待着，猫比想的更爱社交。",
					"audio": null,
					"tags": [
						"headings"
					]
				},
				{
					"id": "2-4-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Sleep does more than help us rest. While we sleep, the brain sorts through the day's experiences, keeping some memories and throwing others away. This is why students who sleep well after studying often remember more than those who stay up late.",
					"question": "Choose the best heading for this paragraph.",
					"options": [
						{
							"key": "A",
							"text": "The role of sleep in memory"
						},
						{
							"key": "B",
							"text": "Why students stay up late"
						},
						{
							"key": "C",
							"text": "How much rest do we need?"
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
						"B": "main-idea",
						"C": "main-idea"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Sleep does more than help us rest. While we sleep, the brain sorts through the day's experiences, keeping some memories and throwing others away. This is why students who sleep well after studying often remember more than those who stay up late.",
					"why": "每一句都在讲睡觉和记忆；stay up late 只是对比。",
					"audio": null,
					"tags": [
						"headings"
					]
				},
				{
					"id": "2-4-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "The first bicycles had no pedals: riders pushed themselves along with their feet. Later, pedals were added to the front wheel, which was made very large to increase speed. These \"high-wheelers\" were fast but dangerous, and many riders were hurt in falls.",
					"question": "Choose the best heading for this paragraph.",
					"options": [
						{
							"key": "A",
							"text": "How to ride safely in traffic"
						},
						{
							"key": "B",
							"text": "Why front wheels are larger"
						},
						{
							"key": "C",
							"text": "Early bicycle designs and their problems"
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
						"A": "main-idea",
						"B": "main-idea"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The first bicycles had no pedals: riders pushed themselves along with their feet. Later, pedals were added to the front wheel, which was made very large to increase speed. These \"high-wheelers\" were fast but dangerous, and many riders were hurt in falls.",
					"why": "讲的是早期几种车的样子和毛病；front wheel 只是其中一句。",
					"audio": null,
					"tags": [
						"headings"
					]
				},
				{
					"id": "2-4-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "Shopping centres in many towns are losing customers to online stores. Some owners have responded by turning empty shops into gyms, clinics and even schools. Instead of a place to buy things, the centre becomes a place to do things.",
					"question": "Choose the best heading for this paragraph.",
					"options": [
						{
							"key": "A",
							"text": "Shopping centres find new purposes"
						},
						{
							"key": "B",
							"text": "The rise of online shopping"
						},
						{
							"key": "C",
							"text": "Where to find a good gym"
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
						"B": "main-idea",
						"C": "main-idea"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Shopping centres in many towns are losing customers to online stores. Some owners have responded by turning empty shops into gyms, clinics and even schools. Instead of a place to buy things, the centre becomes a place to do things.",
					"why": "最后一句点题：从买东西的地方变成做事情的地方。",
					"audio": null,
					"tags": [
						"headings"
					]
				},
				{
					"id": "2-4-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Honeybees tell each other where to find food by moving in a special way. A bee returning to the hive performs a \"waggle dance\". The angle of the dance shows the direction of the flowers, and its length shows how far away they are.",
					"question": "Choose the best heading for this paragraph.",
					"options": [
						{
							"key": "A",
							"text": "How bees share directions"
						},
						{
							"key": "B",
							"text": "Why bees need flowers"
						},
						{
							"key": "C",
							"text": "The dangers bees face"
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
						"B": "main-idea",
						"C": "main-idea"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Honeybees tell each other where to find food by moving in a special way. A bee returning to the hive performs a \"waggle dance\". The angle of the dance shows the direction of the flowers, and its length shows how far away they are.",
					"why": "跳舞的角度 = 方向，长短 = 距离，整段在讲「怎么指路」。",
					"audio": null,
					"tags": [
						"headings"
					]
				},
				{
					"id": "2-4-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Working from home was once rare. Today, many companies let staff work from home for part of the week. Supporters say it saves travel time, but critics warn that new employees miss the chance to learn from experienced colleagues.",
					"question": "Choose the best heading for this paragraph.",
					"options": [
						{
							"key": "A",
							"text": "How to save travel time"
						},
						{
							"key": "B",
							"text": "Training programmes for new staff"
						},
						{
							"key": "C",
							"text": "Arguments for and against working from home"
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
						"A": "main-idea",
						"B": "main-idea"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Working from home was once rare. Today, many companies let staff work from home for part of the week. Supporters say it saves travel time, but critics warn that new employees miss the chance to learn from experienced colleagues.",
					"why": "Supporters say … but critics warn … = 正反两方的看法。",
					"audio": null,
					"tags": [
						"headings"
					]
				},
				{
					"id": "2-4-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Fast fashion, meaning cheap clothes made quickly, has made new styles affordable for almost everyone. But the cost to the environment is high. Making a single cotton T-shirt can use thousands of litres of water, and many clothes are thrown away after only a few wears.",
					"question": "Choose the best heading for this paragraph.",
					"options": [
						{
							"key": "A",
							"text": "How cotton is grown"
						},
						{
							"key": "B",
							"text": "The hidden cost of cheap clothing"
						},
						{
							"key": "C",
							"text": "The latest fashion trends"
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
						"A": "main-idea",
						"C": "main-idea"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Fast fashion, meaning cheap clothes made quickly, has made new styles affordable for almost everyone. But the cost to the environment is high. Making a single cotton T-shirt can use thousands of litres of water, and many clothes are thrown away after only a few wears.",
					"why": "But 之后全在讲代价，cotton 只是举例。",
					"audio": null,
					"tags": [
						"headings"
					]
				},
				{
					"id": "2-4-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "Learning a musical instrument as an adult is harder than as a child, but it is far from impossible. Adults often have less time to practise, but they can be better at planning their practice and understanding why a piece is difficult.",
					"question": "Choose the best heading for this paragraph.",
					"options": [
						{
							"key": "A",
							"text": "Adults can still learn music"
						},
						{
							"key": "B",
							"text": "Why children practise more"
						},
						{
							"key": "C",
							"text": "The most difficult instruments to play"
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
						"B": "main-idea",
						"C": "main-idea"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Learning a musical instrument as an adult is harder than as a child, but it is far from impossible. Adults often have less time to practise, but they can be better at planning their practice and understanding why a piece is difficult.",
					"why": "far from impossible = 完全做得到，是全段的观点。",
					"audio": null,
					"tags": [
						"headings"
					]
				},
				{
					"id": "2-4-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "In the past, maps were drawn by hand and could take years to complete. Mistakes were common, and some maps even showed islands that did not exist. Satellite images have changed this: modern maps can be updated within days.",
					"question": "Choose the best heading for this paragraph.",
					"options": [
						{
							"key": "A",
							"text": "Islands that do not exist"
						},
						{
							"key": "B",
							"text": "How map-making has improved"
						},
						{
							"key": "C",
							"text": "How satellites are launched"
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
						"A": "main-idea",
						"C": "main-idea"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "In the past, maps were drawn by hand and could take years to complete. Mistakes were common, and some maps even showed islands that did not exist. Satellite images have changed this: modern maps can be updated within days.",
					"why": "从手画到卫星，讲的是变化；不存在的岛只是一个例子。",
					"audio": null,
					"tags": [
						"headings"
					]
				}
			],
			"id": "2-4",
			"ch": 2,
			"kind": "level",
			"x": 290,
			"y": 345,
			"label": "2-4",
			"name": "段落标题",
			"zh": "阅读 · 这一段整体在讲什么",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "reading",
			"type": "choice",
			"stations": [
				"2.6"
			],
			"hashtags": [
				"IELTS_2_6"
			],
			"gear": "vocab:5.5",
			"heartGear": "vocab:5.5",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j12",
				"j21",
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
					"id": "2-5-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "A  In many cities, empty land between buildings is being turned into community gardens. Local people rent a small plot for a low yearly fee and grow their own vegetables.\nB  The benefits go beyond food. Gardeners say they feel less stressed, and neighbours who had never spoken now meet every weekend. Some gardens also run free classes for schoolchildren.\nC  However, the gardens face problems. Landowners sometimes want the land back so they can build on it, and waiting lists can be long: in one city, people wait up to three years for a plot.\nD  To solve this, some councils now include space for gardens when they plan new housing. Others allow gardens on the roofs of car parks and offices.",
					"question": "Which paragraph mentions how long people may have to wait?",
					"options": [
						{
							"key": "A",
							"text": "Paragraph A"
						},
						{
							"key": "B",
							"text": "Paragraph B"
						},
						{
							"key": "C",
							"text": "Paragraph C"
						},
						{
							"key": "D",
							"text": "Paragraph D"
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
						"B": "same-word",
						"D": "same-word"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "waiting lists can be long: in one city, people wait up to three years for a plot.",
					"why": "C 段：wait up to three years。",
					"audio": null,
					"tags": [
						"matching",
						"paraphrase"
					]
				},
				{
					"id": "2-5-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "A  In many cities, empty land between buildings is being turned into community gardens. Local people rent a small plot for a low yearly fee and grow their own vegetables.\nB  The benefits go beyond food. Gardeners say they feel less stressed, and neighbours who had never spoken now meet every weekend. Some gardens also run free classes for schoolchildren.\nC  However, the gardens face problems. Landowners sometimes want the land back so they can build on it, and waiting lists can be long: in one city, people wait up to three years for a plot.\nD  To solve this, some councils now include space for gardens when they plan new housing. Others allow gardens on the roofs of car parks and offices.",
					"question": "Which paragraph mentions how much it costs to use a plot?",
					"options": [
						{
							"key": "A",
							"text": "Paragraph A"
						},
						{
							"key": "B",
							"text": "Paragraph B"
						},
						{
							"key": "C",
							"text": "Paragraph C"
						},
						{
							"key": "D",
							"text": "Paragraph D"
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
					"evidence": "Local people rent a small plot for a low yearly fee and grow their own vegetables.",
					"why": "A 段：rent … for a low yearly fee。",
					"audio": null,
					"tags": [
						"matching",
						"paraphrase"
					]
				},
				{
					"id": "2-5-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "A  In many cities, empty land between buildings is being turned into community gardens. Local people rent a small plot for a low yearly fee and grow their own vegetables.\nB  The benefits go beyond food. Gardeners say they feel less stressed, and neighbours who had never spoken now meet every weekend. Some gardens also run free classes for schoolchildren.\nC  However, the gardens face problems. Landowners sometimes want the land back so they can build on it, and waiting lists can be long: in one city, people wait up to three years for a plot.\nD  To solve this, some councils now include space for gardens when they plan new housing. Others allow gardens on the roofs of car parks and offices.",
					"question": "Which paragraph mentions gardens on top of buildings?",
					"options": [
						{
							"key": "A",
							"text": "Paragraph A"
						},
						{
							"key": "B",
							"text": "Paragraph B"
						},
						{
							"key": "C",
							"text": "Paragraph C"
						},
						{
							"key": "D",
							"text": "Paragraph D"
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
						"A": "same-word",
						"B": "same-word",
						"C": "same-word"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Others allow gardens on the roofs of car parks and offices.",
					"why": "D 段：on the roofs of car parks and offices = on top of buildings。",
					"audio": null,
					"tags": [
						"matching",
						"paraphrase"
					]
				},
				{
					"id": "2-5-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "A  In many cities, empty land between buildings is being turned into community gardens. Local people rent a small plot for a low yearly fee and grow their own vegetables.\nB  The benefits go beyond food. Gardeners say they feel less stressed, and neighbours who had never spoken now meet every weekend. Some gardens also run free classes for schoolchildren.\nC  However, the gardens face problems. Landowners sometimes want the land back so they can build on it, and waiting lists can be long: in one city, people wait up to three years for a plot.\nD  To solve this, some councils now include space for gardens when they plan new housing. Others allow gardens on the roofs of car parks and offices.",
					"question": "Which paragraph mentions gardens being used for teaching children?",
					"options": [
						{
							"key": "A",
							"text": "Paragraph A"
						},
						{
							"key": "B",
							"text": "Paragraph B"
						},
						{
							"key": "C",
							"text": "Paragraph C"
						},
						{
							"key": "D",
							"text": "Paragraph D"
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
						"C": "same-word",
						"D": "same-word"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Some gardens also run free classes for schoolchildren.",
					"why": "B 段最后一句：free classes for schoolchildren。",
					"audio": null,
					"tags": [
						"matching",
						"paraphrase"
					]
				},
				{
					"id": "2-5-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": "A  In many cities, empty land between buildings is being turned into community gardens. Local people rent a small plot for a low yearly fee and grow their own vegetables.\nB  The benefits go beyond food. Gardeners say they feel less stressed, and neighbours who had never spoken now meet every weekend. Some gardens also run free classes for schoolchildren.\nC  However, the gardens face problems. Landowners sometimes want the land back so they can build on it, and waiting lists can be long: in one city, people wait up to three years for a plot.\nD  To solve this, some councils now include space for gardens when they plan new housing. Others allow gardens on the roofs of car parks and offices.",
					"question": "Which paragraph mentions a social benefit of gardening?",
					"options": [
						{
							"key": "A",
							"text": "Paragraph A"
						},
						{
							"key": "B",
							"text": "Paragraph B"
						},
						{
							"key": "C",
							"text": "Paragraph C"
						},
						{
							"key": "D",
							"text": "Paragraph D"
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
						"C": "same-word",
						"D": "same-word"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Gardeners say they feel less stressed, and neighbours who had never spoken now meet every weekend.",
					"why": "B 段：neighbours who had never spoken now meet。",
					"audio": null,
					"tags": [
						"matching",
						"paraphrase"
					]
				},
				{
					"id": "2-5-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "A  Fifty years ago, night trains crossed Europe every evening. As cheap flights became popular, passengers left, and many routes were closed.\nB  Recently, interest has returned. Travellers who worry about the climate are choosing trains, which produce far less carbon per passenger than planes.\nC  Running a night train is expensive, though. Each carriage carries fewer people than on a day train, because passengers need beds, and staff must work through the night.\nD  Some operators have found an answer in small \"pod\" cabins, which fit more travellers into each carriage while still giving everyone a private space to sleep.",
					"question": "Which paragraph describes a design that carries more people?",
					"options": [
						{
							"key": "A",
							"text": "Paragraph A"
						},
						{
							"key": "B",
							"text": "Paragraph B"
						},
						{
							"key": "C",
							"text": "Paragraph C"
						},
						{
							"key": "D",
							"text": "Paragraph D"
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
						"A": "same-word",
						"B": "same-word",
						"C": "same-word"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "small \"pod\" cabins, which fit more travellers into each carriage while still giving everyone a private space to sleep.",
					"why": "D 段：fit more travellers into each carriage。",
					"audio": null,
					"tags": [
						"matching",
						"paraphrase"
					]
				},
				{
					"id": "2-5-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "A  Fifty years ago, night trains crossed Europe every evening. As cheap flights became popular, passengers left, and many routes were closed.\nB  Recently, interest has returned. Travellers who worry about the climate are choosing trains, which produce far less carbon per passenger than planes.\nC  Running a night train is expensive, though. Each carriage carries fewer people than on a day train, because passengers need beds, and staff must work through the night.\nD  Some operators have found an answer in small \"pod\" cabins, which fit more travellers into each carriage while still giving everyone a private space to sleep.",
					"question": "Which paragraph explains why night trains are costly to run?",
					"options": [
						{
							"key": "A",
							"text": "Paragraph A"
						},
						{
							"key": "B",
							"text": "Paragraph B"
						},
						{
							"key": "C",
							"text": "Paragraph C"
						},
						{
							"key": "D",
							"text": "Paragraph D"
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
						"B": "same-word",
						"D": "same-word"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Running a night train is expensive, though. Each carriage carries fewer people than on a day train, because passengers need beds",
					"why": "C 段：expensive = costly，后面是原因。",
					"audio": null,
					"tags": [
						"matching",
						"paraphrase"
					]
				},
				{
					"id": "2-5-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "A  Fifty years ago, night trains crossed Europe every evening. As cheap flights became popular, passengers left, and many routes were closed.\nB  Recently, interest has returned. Travellers who worry about the climate are choosing trains, which produce far less carbon per passenger than planes.\nC  Running a night train is expensive, though. Each carriage carries fewer people than on a day train, because passengers need beds, and staff must work through the night.\nD  Some operators have found an answer in small \"pod\" cabins, which fit more travellers into each carriage while still giving everyone a private space to sleep.",
					"question": "Which paragraph explains why night trains lost passengers?",
					"options": [
						{
							"key": "A",
							"text": "Paragraph A"
						},
						{
							"key": "B",
							"text": "Paragraph B"
						},
						{
							"key": "C",
							"text": "Paragraph C"
						},
						{
							"key": "D",
							"text": "Paragraph D"
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
					"evidence": "As cheap flights became popular, passengers left, and many routes were closed.",
					"why": "A 段：as cheap flights became popular, passengers left。",
					"audio": null,
					"tags": [
						"matching",
						"paraphrase"
					]
				},
				{
					"id": "2-5-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "A  Fifty years ago, night trains crossed Europe every evening. As cheap flights became popular, passengers left, and many routes were closed.\nB  Recently, interest has returned. Travellers who worry about the climate are choosing trains, which produce far less carbon per passenger than planes.\nC  Running a night train is expensive, though. Each carriage carries fewer people than on a day train, because passengers need beds, and staff must work through the night.\nD  Some operators have found an answer in small \"pod\" cabins, which fit more travellers into each carriage while still giving everyone a private space to sleep.",
					"question": "Which paragraph mentions staff working unusual hours?",
					"options": [
						{
							"key": "A",
							"text": "Paragraph A"
						},
						{
							"key": "B",
							"text": "Paragraph B"
						},
						{
							"key": "C",
							"text": "Paragraph C"
						},
						{
							"key": "D",
							"text": "Paragraph D"
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
						"B": "same-word",
						"D": "same-word"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "staff must work through the night.",
					"why": "C 段：staff must work through the night = 通宵上班。",
					"audio": null,
					"tags": [
						"matching",
						"paraphrase"
					]
				},
				{
					"id": "2-5-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": "A  Fifty years ago, night trains crossed Europe every evening. As cheap flights became popular, passengers left, and many routes were closed.\nB  Recently, interest has returned. Travellers who worry about the climate are choosing trains, which produce far less carbon per passenger than planes.\nC  Running a night train is expensive, though. Each carriage carries fewer people than on a day train, because passengers need beds, and staff must work through the night.\nD  Some operators have found an answer in small \"pod\" cabins, which fit more travellers into each carriage while still giving everyone a private space to sleep.",
					"question": "Which paragraph gives an environmental reason for choosing trains?",
					"options": [
						{
							"key": "A",
							"text": "Paragraph A"
						},
						{
							"key": "B",
							"text": "Paragraph B"
						},
						{
							"key": "C",
							"text": "Paragraph C"
						},
						{
							"key": "D",
							"text": "Paragraph D"
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
						"C": "same-word",
						"D": "same-word"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Travellers who worry about the climate are choosing trains, which produce far less carbon per passenger than planes.",
					"why": "B 段：worry about the climate、less carbon。",
					"audio": null,
					"tags": [
						"matching",
						"paraphrase"
					]
				}
			],
			"id": "2-5",
			"ch": 2,
			"kind": "level",
			"x": 210,
			"y": 295,
			"label": "2-5",
			"name": "在哪一段",
			"zh": "阅读 · 这条信息藏在哪一段",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "reading",
			"type": "gap",
			"stations": [
				"2.5"
			],
			"hashtags": [
				"IELTS_2_5"
			],
			"gear": "synonym-match:general",
			"heartGear": "synonym-match:general",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j5",
				"j21",
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
			"keepOrder": false,
			"timed": null,
			"pool": [
				{
					"id": "2-6-A-1",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": "The town's first library opened in 1902 in a single room above the post office. It held only 300 books, all given by local families.",
					"question": "The first library was located above the ______.",
					"options": null,
					"chips": null,
					"answer": "post office",
					"accept": [],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "same-word",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The town's first library opened in 1902 in a single room above the post office. It held only 300 books, all given by local families.",
					"why": "located above = opened … above，后面两个词就是答案。",
					"audio": null,
					"tags": [
						"summary",
						"word-limit",
						"paraphrase"
					]
				},
				{
					"id": "2-6-A-2",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": "Volunteers planted more than 4,000 trees along the river. Within five years, the trees had reduced flooding in the nearby fields.",
					"question": "Thanks to the trees, there was less ______ in the fields.",
					"options": null,
					"chips": null,
					"answer": "flooding",
					"accept": [],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "same-word",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Volunteers planted more than 4,000 trees along the river. Within five years, the trees had reduced flooding in the nearby fields.",
					"why": "reduced flooding = less flooding。",
					"audio": null,
					"tags": [
						"summary",
						"word-limit",
						"paraphrase"
					]
				},
				{
					"id": "2-6-A-3",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": "The new app reminds users to drink water every two hours. Early testers said it helped them feel less tired in the afternoon.",
					"question": "Testers reported feeling less ______ later in the day.",
					"options": null,
					"chips": null,
					"answer": "tired",
					"accept": [],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "same-word",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The new app reminds users to drink water every two hours. Early testers said it helped them feel less tired in the afternoon.",
					"why": "in the afternoon = later in the day。",
					"audio": null,
					"tags": [
						"summary",
						"word-limit",
						"paraphrase"
					]
				},
				{
					"id": "2-6-A-4",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": "Unlike most frogs, the glass frog has see-through skin on its stomach, so its heart can be seen beating.",
					"question": "The glass frog's ______ is visible through its skin.",
					"options": null,
					"chips": null,
					"answer": "heart",
					"accept": [],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "same-word",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Unlike most frogs, the glass frog has see-through skin on its stomach, so its heart can be seen beating.",
					"why": "can be seen = visible；stomach 是皮透明的位置，看见的是心脏。",
					"audio": null,
					"tags": [
						"summary",
						"word-limit",
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "2-6-A-5",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": "Pupils who walked or cycled to school arrived with better concentration than those who came by car, according to a survey at one school.",
					"question": "Travelling to school by car was linked to poorer ______.",
					"options": null,
					"chips": null,
					"answer": "concentration",
					"accept": [],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "same-word",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Pupils who walked or cycled to school arrived with better concentration than those who came by car, according to a survey at one school.",
					"why": "反过来说：走路骑车的 better concentration，坐车的就是 poorer。",
					"audio": null,
					"tags": [
						"summary",
						"word-limit",
						"paraphrase"
					]
				},
				{
					"id": "2-6-B-1",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": "The bridge was built from local stone because transporting steel to the valley was too expensive.",
					"question": "Steel was not used because of the high cost of ______ it.",
					"options": null,
					"chips": null,
					"answer": "transporting",
					"accept": [],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "same-word",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The bridge was built from local stone because transporting steel to the valley was too expensive.",
					"why": "too expensive = high cost，贵的是「运过去」。",
					"audio": null,
					"tags": [
						"summary",
						"word-limit",
						"paraphrase"
					]
				},
				{
					"id": "2-6-B-2",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": "Most visitors come to the island in summer, but the best time to see whales is early spring.",
					"question": "Whale watching is best in ______.",
					"options": null,
					"chips": null,
					"answer": "early spring",
					"accept": [
						"spring"
					],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "same-word",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Most visitors come to the island in summer, but the best time to see whales is early spring.",
					"why": "summer 是人多的时候，看鲸鱼要 early spring。",
					"audio": null,
					"tags": [
						"summary",
						"word-limit",
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "2-6-B-3",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": "The museum's oldest object is a wooden comb, found by a farmer while he was digging a well.",
					"question": "A farmer discovered the comb when digging a ______.",
					"options": null,
					"chips": null,
					"answer": "well",
					"accept": [],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "same-word",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The museum's oldest object is a wooden comb, found by a farmer while he was digging a well.",
					"why": "found = discovered，while = when。",
					"audio": null,
					"tags": [
						"summary",
						"word-limit",
						"paraphrase"
					]
				},
				{
					"id": "2-6-B-4",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": "Some kinds of bamboo can grow up to 90 centimetres in a single day, which makes it one of the fastest-growing plants on Earth.",
					"question": "Bamboo may grow as much as ______ per day.",
					"options": null,
					"chips": null,
					"answer": "90 centimetres",
					"accept": [
						"90 centimeters",
						"90 cm",
						"90cm",
						"ninety centimetres",
						"ninety centimeters"
					],
					"limit": {
						"words": 2,
						"number": true
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "same-word",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Some kinds of bamboo can grow up to 90 centimetres in a single day, which makes it one of the fastest-growing plants on Earth.",
					"why": "up to = as much as；数字和单位一起填。",
					"audio": null,
					"tags": [
						"summary",
						"word-limit",
						"paraphrase"
					]
				},
				{
					"id": "2-6-B-5",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": "To save energy, the office switched off its heating at weekends and asked staff to wear warmer clothes.",
					"question": "Staff were asked to wear ______ to save energy.",
					"options": null,
					"chips": null,
					"answer": "warmer clothes",
					"accept": [],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "same-word",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "To save energy, the office switched off its heating at weekends and asked staff to wear warmer clothes.",
					"why": "两个词都要：只写 warmer 意思不完整。",
					"audio": null,
					"tags": [
						"summary",
						"word-limit",
						"paraphrase"
					]
				}
			],
			"id": "2-6",
			"ch": 2,
			"kind": "level",
			"x": 145,
			"y": 200,
			"label": "2-6",
			"name": "摘要填空",
			"zh": "阅读 · 从原文找词填进换了说法的句子",
			"branch": "main"
		},
		{
			"practice": false,
			"skill": "vocab",
			"type": "gap",
			"stations": [
				"5.4"
			],
			"hashtags": [
				"IELTS_5_4"
			],
			"gear": "vocab:5.4",
			"heartGear": "vocab:5.4",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j18",
				"j1",
				"j6"
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
					"id": "2-7-A-1",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Please keep your ______ with you at all times.",
					"options": null,
					"chips": null,
					"answer": "luggage",
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
					"evidence": "luggage. Please keep your luggage with you at all times. luggage.",
					"why": "两个 g：lu-gg-age，结尾 -age。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "luggage. Please keep your luggage with you at all times. luggage."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "2-7-A-2",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Check the ______ board for your gate.",
					"options": null,
					"chips": null,
					"answer": "departure",
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
					"evidence": "departure. Check the departure board for your gate. departure.",
					"why": "de-par-ture，结尾是 -ture，不是 -cher。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "departure. Check the departure board for your gate. departure."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "2-7-A-3",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Our ______ includes two days in Rome.",
					"options": null,
					"chips": null,
					"answer": "itinerary",
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
					"evidence": "itinerary. Our itinerary includes two days in Rome. itinerary.",
					"why": "i-tin-er-ar-y，中间的 -er- 读得很轻，别漏。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "itinerary. Our itinerary includes two days in Rome. itinerary."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "2-7-A-4",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Our final ______ is the coast.",
					"options": null,
					"chips": null,
					"answer": "destination",
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
					"evidence": "destination. Our final destination is the coast. destination.",
					"why": "des-ti-na-tion，四个音节一个个拼。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "destination. Our final destination is the coast. destination."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "2-7-A-5",
					"set": "A",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The train to the airport leaves from this ______.",
					"options": null,
					"chips": null,
					"answer": "platform",
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
					"evidence": "platform. The train to the airport leaves from this platform. platform.",
					"why": "plat + form，两个词拼在一起。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "platform. The train to the airport leaves from this platform. platform."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "2-7-B-1",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "She bought a small ______ at the airport.",
					"options": null,
					"chips": null,
					"answer": "souvenir",
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
					"evidence": "souvenir. She bought a small souvenir at the airport. souvenir.",
					"why": "结尾 -nir，不是 -neer。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "souvenir. She bought a small souvenir at the airport. souvenir."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "2-7-B-2",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "Every ______ must show a ticket.",
					"options": null,
					"chips": null,
					"answer": "passenger",
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
					"evidence": "passenger. Every passenger must show a ticket. passenger.",
					"why": "两个 s：pa-ss-en-ger。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "passenger. Every passenger must show a ticket. passenger."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "2-7-B-3",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "The ferry runs to a tight ______.",
					"options": null,
					"chips": null,
					"answer": "schedule",
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
					"evidence": "schedule. The ferry runs to a tight schedule. schedule.",
					"why": "sch- 开头，英音读 /ʃ/，美音读 /sk/，拼法一样。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "schedule. The ferry runs to a tight schedule. schedule."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "2-7-B-4",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "We took the ______ across the bay.",
					"options": null,
					"chips": null,
					"answer": "ferry",
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
					"evidence": "ferry. We took the ferry across the bay. ferry.",
					"why": "两个 r，结尾是 y。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "ferry. We took the ferry across the bay. ferry."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				},
				{
					"id": "2-7-B-5",
					"set": "B",
					"type": "gap",
					"skill": null,
					"passage": null,
					"question": "I have a ______ for two nights.",
					"options": null,
					"chips": null,
					"answer": "reservation",
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
					"evidence": "reservation. I have a reservation for two nights. reservation.",
					"why": "re-ser-va-tion：中间听起来像 z，拼的时候是 s。",
					"audio": {
						"voices": {
							"N": "uk-brit"
						},
						"rate": 0.85,
						"lines": [
							{
								"who": "N",
								"text": "reservation. I have a reservation for two nights. reservation."
							}
						]
					},
					"tags": [
						"vocab-spell"
					]
				}
			],
			"id": "2-7",
			"ch": 2,
			"kind": "level",
			"x": 90,
			"y": 325,
			"label": "2-7",
			"name": "交通与旅行",
			"zh": "词汇 · 听一遍，拼出旅行常用词",
			"branch": "vocab"
		},
		{
			"practice": false,
			"skill": "vocab",
			"type": "choice",
			"stations": [
				"5.5"
			],
			"hashtags": [
				"IELTS_5_5"
			],
			"gear": "vocab:5.5",
			"heartGear": "vocab:5.5",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j20",
				"j18",
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
					"id": "2-8-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Regular exercise can ______ the risk of heart disease.",
					"options": [
						{
							"key": "A",
							"text": "reduction"
						},
						{
							"key": "B",
							"text": "reduced"
						},
						{
							"key": "C",
							"text": "reduce"
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
					"evidence": "Regular exercise can reduce the risk of heart disease.",
					"why": "can 后面跟动词原形。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "2-8-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Doctors stress the ______ of a balanced diet.",
					"options": [
						{
							"key": "A",
							"text": "importance"
						},
						{
							"key": "B",
							"text": "important"
						},
						{
							"key": "C",
							"text": "importantly"
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
						"C": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Doctors stress the importance of a balanced diet.",
					"why": "the ___ of 中间要名词。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "2-8-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "She made a quick ______ after the injury.",
					"options": [
						{
							"key": "A",
							"text": "recover"
						},
						{
							"key": "B",
							"text": "recovery"
						},
						{
							"key": "C",
							"text": "recovered"
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
						"C": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "She made a quick recovery after the injury.",
					"why": "a quick 后面要名词。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "2-8-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Lack of sleep can make people feel ______.",
					"options": [
						{
							"key": "A",
							"text": "anxiety"
						},
						{
							"key": "B",
							"text": "anxiously"
						},
						{
							"key": "C",
							"text": "anxious"
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
					"evidence": "Lack of sleep can make people feel anxious.",
					"why": "feel 后面跟形容词，说人的状态。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "2-8-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The new treatment was ______ effective.",
					"options": [
						{
							"key": "A",
							"text": "surprise"
						},
						{
							"key": "B",
							"text": "surprisingly"
						},
						{
							"key": "C",
							"text": "surprising"
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
						"C": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The new treatment was surprisingly effective.",
					"why": "修饰形容词 effective 要用副词。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "2-8-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Swimming is a good way to improve your ______.",
					"options": [
						{
							"key": "A",
							"text": "fit"
						},
						{
							"key": "B",
							"text": "fitly"
						},
						{
							"key": "C",
							"text": "fitness"
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
					"evidence": "Swimming is a good way to improve your fitness.",
					"why": "your 后面要名词。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "2-8-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Too much sugar is ______ to your teeth.",
					"options": [
						{
							"key": "A",
							"text": "harmful"
						},
						{
							"key": "B",
							"text": "harm"
						},
						{
							"key": "C",
							"text": "harmfully"
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
						"C": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Too much sugar is harmful to your teeth.",
					"why": "is 后面说「有害的」，要形容词。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "2-8-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Researchers want to ______ how stress affects sleep.",
					"options": [
						{
							"key": "A",
							"text": "analysis"
						},
						{
							"key": "B",
							"text": "analyse"
						},
						{
							"key": "C",
							"text": "analytical"
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
						"C": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Researchers want to analyse how stress affects sleep.",
					"why": "want to 后面跟动词原形。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "2-8-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "He was breathing ______ after the race.",
					"options": [
						{
							"key": "A",
							"text": "heavily"
						},
						{
							"key": "B",
							"text": "heavy"
						},
						{
							"key": "C",
							"text": "heaviness"
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
						"C": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "He was breathing heavily after the race.",
					"why": "修饰动词 breathing 要用副词。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				},
				{
					"id": "2-8-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The ______ of patients said they felt better.",
					"options": [
						{
							"key": "A",
							"text": "major"
						},
						{
							"key": "B",
							"text": "majority"
						},
						{
							"key": "C",
							"text": "majorly"
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
						"C": "word-form"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The majority of patients said they felt better.",
					"why": "the ___ of 中间要名词：the majority of = 大多数。",
					"audio": null,
					"tags": [
						"vocab-meaning"
					]
				}
			],
			"id": "2-8",
			"ch": 2,
			"kind": "level",
			"x": 30,
			"y": 285,
			"label": "2-8",
			"name": "词形变一变",
			"zh": "词汇 · 看空格前后，选对词性",
			"branch": "vocab"
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
			"gear": "vocab:5.6",
			"heartGear": "vocab:5.6",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j13",
				"j18",
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
					"id": "2-9-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Prices went up and down many times during the year. In other words, they ______.",
					"options": [
						{
							"key": "A",
							"text": "declined"
						},
						{
							"key": "B",
							"text": "levelled off"
						},
						{
							"key": "C",
							"text": "fluctuated"
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
					"evidence": "Prices went up and down many times during the year. In other words, they fluctuated.",
					"why": "fluctuate = 忽高忽低。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"diagram"
					]
				},
				{
					"id": "2-9-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Rainfall stayed at about 50 mm every month. In other words, it ______.",
					"options": [
						{
							"key": "A",
							"text": "rose sharply"
						},
						{
							"key": "B",
							"text": "remained steady"
						},
						{
							"key": "C",
							"text": "dropped slightly"
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
					"evidence": "Rainfall stayed at about 50 mm every month. In other words, it remained steady.",
					"why": "stayed at about = remained steady。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"diagram"
					]
				},
				{
					"id": "2-9-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Forest cover went from 40% to 20%. In other words, it ______.",
					"options": [
						{
							"key": "A",
							"text": "halved"
						},
						{
							"key": "B",
							"text": "doubled"
						},
						{
							"key": "C",
							"text": "tripled"
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
					"evidence": "Forest cover went from 40% to 20%. In other words, it halved.",
					"why": "40 变 20 是减半：halved。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"diagram"
					]
				},
				{
					"id": "2-9-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "After rising quickly, the temperature stopped changing. In other words, it ______.",
					"options": [
						{
							"key": "A",
							"text": "fluctuated"
						},
						{
							"key": "B",
							"text": "plunged"
						},
						{
							"key": "C",
							"text": "levelled off"
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
					"evidence": "After rising quickly, the temperature stopped changing. In other words, it levelled off.",
					"why": "level off = 涨（跌）完后变平。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"diagram"
					]
				},
				{
					"id": "2-9-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Air pollution fell slowly over ten years. There was a ______ decline.",
					"options": [
						{
							"key": "A",
							"text": "gradual"
						},
						{
							"key": "B",
							"text": "sharp"
						},
						{
							"key": "C",
							"text": "sudden"
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
					"evidence": "Air pollution fell slowly over ten years. There was a gradual decline.",
					"why": "slowly over ten years = gradual。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"diagram"
					]
				},
				{
					"id": "2-9-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Sea ice reached its highest point in March. In other words, it ______ in March.",
					"options": [
						{
							"key": "A",
							"text": "peaked"
						},
						{
							"key": "B",
							"text": "bottomed out"
						},
						{
							"key": "C",
							"text": "fluctuated"
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
					"evidence": "Sea ice reached its highest point in March. In other words, it peaked in March.",
					"why": "highest point = peak。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"diagram"
					]
				},
				{
					"id": "2-9-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Bird numbers dropped by a huge amount in one year. There was a ______ fall.",
					"options": [
						{
							"key": "A",
							"text": "slight"
						},
						{
							"key": "B",
							"text": "steady"
						},
						{
							"key": "C",
							"text": "dramatic"
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
					"evidence": "Bird numbers dropped by a huge amount in one year. There was a dramatic fall.",
					"why": "一年里掉得特别多 = dramatic；slight 是一点点，steady 是稳稳地。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"diagram"
					]
				},
				{
					"id": "2-9-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Recycling rates rose from 10% to 30%. In other words, they ______.",
					"options": [
						{
							"key": "A",
							"text": "doubled"
						},
						{
							"key": "B",
							"text": "tripled"
						},
						{
							"key": "C",
							"text": "halved"
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
					"evidence": "Recycling rates rose from 10% to 30%. In other words, they tripled.",
					"why": "10 变 30 是三倍：tripled。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"diagram"
					]
				},
				{
					"id": "2-9-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Water use went down a little. There was a ______ decrease.",
					"options": [
						{
							"key": "A",
							"text": "slight"
						},
						{
							"key": "B",
							"text": "significant"
						},
						{
							"key": "C",
							"text": "sharp"
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
					"evidence": "Water use went down a little. There was a slight decrease.",
					"why": "a little = slight。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"diagram"
					]
				},
				{
					"id": "2-9-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "In the last year shown, wind power produced more electricity than coal for the first time. Wind power ______ coal.",
					"options": [
						{
							"key": "A",
							"text": "followed"
						},
						{
							"key": "B",
							"text": "matched"
						},
						{
							"key": "C",
							"text": "overtook"
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
					"evidence": "In the last year shown, wind power produced more electricity than coal for the first time. Wind power overtook coal.",
					"why": "第一次比它多 = overtook（超过）。",
					"audio": null,
					"tags": [
						"vocab-meaning",
						"diagram"
					]
				}
			],
			"id": "2-9",
			"ch": 2,
			"kind": "level",
			"x": 90,
			"y": 245,
			"label": "2-9",
			"name": "描述变化",
			"zh": "词汇 · 涨、跌、持平、波动怎么说",
			"branch": "vocab"
		},
		{
			"practice": false,
			"skill": "grammar",
			"type": "choice",
			"stations": [
				"6.4"
			],
			"hashtags": [
				"IELTS_6_4"
			],
			"gear": "grammar:6.4",
			"heartGear": "vocab:5.5",
			"gearGivesHeart": false,
			"gearButton": "去练一组（不补心）",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j10",
				"j15",
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
					"id": "2-10-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The museum was free, ______ we went there every weekend.",
					"options": [
						{
							"key": "A",
							"text": "so"
						},
						{
							"key": "B",
							"text": "but"
						},
						{
							"key": "C",
							"text": "or"
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
					"evidence": "The museum was free, so we went there every weekend.",
					"why": "免费 → 所以每周都去，是因果：so。",
					"audio": null,
					"tags": [
						"g-coord"
					]
				},
				{
					"id": "2-10-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "I wanted to join the club, ______ it was already full.",
					"options": [
						{
							"key": "A",
							"text": "so"
						},
						{
							"key": "B",
							"text": "or"
						},
						{
							"key": "C",
							"text": "but"
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
					"evidence": "I wanted to join the club, but it was already full.",
					"why": "想加入，可是满了，是转折：but。",
					"audio": null,
					"tags": [
						"g-coord"
					]
				},
				{
					"id": "2-10-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "You can pay by card, ______ you can pay in cash. It's up to you.",
					"options": [
						{
							"key": "A",
							"text": "but"
						},
						{
							"key": "B",
							"text": "or"
						},
						{
							"key": "C",
							"text": "so"
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
					"evidence": "You can pay by card, or you can pay in cash. It's up to you.",
					"why": "两种付款方式选一种：or。",
					"audio": null,
					"tags": [
						"g-coord"
					]
				},
				{
					"id": "2-10-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which sentence joins the two ideas correctly?",
					"options": [
						{
							"key": "A",
							"text": "It was raining, we stayed inside."
						},
						{
							"key": "B",
							"text": "It was raining, however we stayed inside."
						},
						{
							"key": "C",
							"text": "It was raining, so we stayed inside."
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
					"evidence": "Which sentence joins the two ideas correctly?",
					"why": "逗号不能把两个句子连起来；however 不是连词。",
					"audio": null,
					"tags": [
						"g-coord"
					]
				},
				{
					"id": "2-10-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The course is short. ______, it covers a lot of topics.",
					"options": [
						{
							"key": "A",
							"text": "Although"
						},
						{
							"key": "B",
							"text": "However"
						},
						{
							"key": "C",
							"text": "Because"
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
					"evidence": "The course is short. However, it covers a lot of topics.",
					"why": "句号后另起一句表示转折，用 However 加逗号；Although、Because 后面要接从句。",
					"audio": null,
					"tags": [
						"g-coord"
					]
				},
				{
					"id": "2-10-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "She studied hard, ______ she passed the exam.",
					"options": [
						{
							"key": "A",
							"text": "so"
						},
						{
							"key": "B",
							"text": "but"
						},
						{
							"key": "C",
							"text": "or"
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
					"evidence": "She studied hard, so she passed the exam.",
					"why": "努力 → 所以通过，是因果：so。",
					"audio": null,
					"tags": [
						"g-coord"
					]
				},
				{
					"id": "2-10-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The flat is small, ______ it has a lovely garden.",
					"options": [
						{
							"key": "A",
							"text": "so"
						},
						{
							"key": "B",
							"text": "but"
						},
						{
							"key": "C",
							"text": "or"
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
					"evidence": "The flat is small, but it has a lovely garden.",
					"why": "小，但有个漂亮花园，一坏一好是转折：but。",
					"audio": null,
					"tags": [
						"g-coord"
					]
				},
				{
					"id": "2-10-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Hurry up, ______ we will miss the bus.",
					"options": [
						{
							"key": "A",
							"text": "but"
						},
						{
							"key": "B",
							"text": "so"
						},
						{
							"key": "C",
							"text": "or"
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
					"evidence": "Hurry up, or we will miss the bus.",
					"why": "祈使句加 or = 不然就……",
					"audio": null,
					"tags": [
						"g-coord"
					]
				},
				{
					"id": "2-10-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which of these sentences is correct?",
					"options": [
						{
							"key": "A",
							"text": "The shop opens at nine, but it closes early on Sundays."
						},
						{
							"key": "B",
							"text": "The shop opens at nine, it closes early on Sundays."
						},
						{
							"key": "C",
							"text": "The shop opens at nine however it closes early on Sundays."
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
					"evidence": "Which of these sentences is correct?",
					"why": "两个句子之间要连词；however 不能直接连两个句子。",
					"audio": null,
					"tags": [
						"g-coord"
					]
				},
				{
					"id": "2-10-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "He likes reading, ______ he enjoys writing too.",
					"options": [
						{
							"key": "A",
							"text": "so"
						},
						{
							"key": "B",
							"text": "or"
						},
						{
							"key": "C",
							"text": "and"
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
					"evidence": "He likes reading, and he enjoys writing too.",
					"why": "两件喜欢的事并列，加 too 呼应：and。",
					"audio": null,
					"tags": [
						"g-coord"
					]
				}
			],
			"id": "2-10",
			"ch": 2,
			"kind": "level",
			"x": 345,
			"y": 310,
			"label": "2-10",
			"name": "并列句",
			"zh": "语法 · and、but、or、so 连起两个句子",
			"branch": "grammar"
		},
		{
			"practice": false,
			"skill": "grammar",
			"type": "build",
			"stations": [
				"6.5"
			],
			"hashtags": [
				"IELTS_6_5"
			],
			"gear": "grammar:6.5",
			"heartGear": "vocab:5.5",
			"gearGivesHeart": false,
			"gearButton": "去练一组（不补心）",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j10",
				"j15",
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
					"id": "2-11-A-1",
					"set": "A",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "我们待在家里，因为外面太冷了。",
					"options": null,
					"chips": [
						"we stayed at home",
						"because",
						"it was too cold"
					],
					"answer": "we stayed at home because it was too cold",
					"accept": [
						"because it was too cold we stayed at home"
					],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "we stayed at home because it was too cold",
					"why": "because 后面接原因。",
					"audio": null,
					"tags": [
						"g-adv"
					]
				},
				{
					"id": "2-11-A-2",
					"set": "A",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "虽然下雨了，我们还是去了海边。",
					"options": null,
					"chips": [
						"although it rained,",
						"we went",
						"to the beach"
					],
					"answer": "although it rained, we went to the beach",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "although it rained, we went to the beach",
					"why": "有了 although 就不要再加 but；从句在前，后面加逗号。",
					"audio": null,
					"tags": [
						"g-adv"
					]
				},
				{
					"id": "2-11-A-3",
					"set": "A",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "你到了就给我打电话。",
					"options": null,
					"chips": [
						"call me",
						"when",
						"you arrive"
					],
					"answer": "call me when you arrive",
					"accept": [
						"when you arrive call me"
					],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "call me when you arrive",
					"why": "when 后面用现在时 arrive 说将来，不写 will arrive。",
					"audio": null,
					"tags": [
						"g-adv"
					]
				},
				{
					"id": "2-11-A-4",
					"set": "A",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "如果明天下雨，比赛就取消。",
					"options": null,
					"chips": [
						"if it rains tomorrow,",
						"the match",
						"will be cancelled"
					],
					"answer": "if it rains tomorrow, the match will be cancelled",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "if it rains tomorrow, the match will be cancelled",
					"why": "if 从句用现在时 rains，主句才用 will。",
					"audio": null,
					"tags": [
						"g-adv"
					]
				},
				{
					"id": "2-11-A-5",
					"set": "A",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "他很累，因为他工作到很晚。",
					"options": null,
					"chips": [
						"he is tired",
						"because",
						"he worked late"
					],
					"answer": "he is tired because he worked late",
					"accept": [
						"because he worked late he is tired"
					],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "he is tired because he worked late",
					"why": "一个连词就够，because 和 so 不一起用。",
					"audio": null,
					"tags": [
						"g-adv"
					]
				},
				{
					"id": "2-11-B-1",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "虽然这本书很长，但是很好读。",
					"options": null,
					"chips": [
						"although the book is long,",
						"it is",
						"easy to read"
					],
					"answer": "although the book is long, it is easy to read",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "although the book is long, it is easy to read",
					"why": "中文说「虽然……但是」，英文只用 although，不加 but。",
					"audio": null,
					"tags": [
						"g-adv"
					]
				},
				{
					"id": "2-11-B-2",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "我做完作业就给你发消息。",
					"options": null,
					"chips": [
						"I will text you",
						"when",
						"I finish my homework"
					],
					"answer": "I will text you when I finish my homework",
					"accept": [
						"when I finish my homework I will text you"
					],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "I will text you when I finish my homework",
					"why": "when 后面用 finish，不用 will finish。",
					"audio": null,
					"tags": [
						"g-adv"
					]
				},
				{
					"id": "2-11-B-3",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "因为票卖完了，我们没去成音乐会。",
					"options": null,
					"chips": [
						"because the tickets sold out,",
						"we",
						"missed the concert"
					],
					"answer": "because the tickets sold out, we missed the concert",
					"accept": [],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "because the tickets sold out, we missed the concert",
					"why": "从句在前，加逗号再接主句。",
					"audio": null,
					"tags": [
						"g-adv"
					]
				},
				{
					"id": "2-11-B-4",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "如果你需要帮助，就问老师。",
					"options": null,
					"chips": [
						"ask the teacher",
						"if",
						"you need help"
					],
					"answer": "ask the teacher if you need help",
					"accept": [
						"if you need help ask the teacher"
					],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "ask the teacher if you need help",
					"why": "if 引出条件，放前放后都行。",
					"audio": null,
					"tags": [
						"g-adv"
					]
				},
				{
					"id": "2-11-B-5",
					"set": "B",
					"type": "build",
					"skill": null,
					"passage": null,
					"question": "我在等公交的时候看到了她。",
					"options": null,
					"chips": [
						"I saw her",
						"while",
						"I was waiting for the bus"
					],
					"answer": "I saw her while I was waiting for the bus",
					"accept": [
						"while I was waiting for the bus I saw her"
					],
					"limit": null,
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "grammar",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "I saw her while I was waiting for the bus",
					"why": "while 后面常用进行时，说「正在……的时候」。",
					"audio": null,
					"tags": [
						"g-adv"
					]
				}
			],
			"id": "2-11",
			"ch": 2,
			"kind": "level",
			"x": 270,
			"y": 250,
			"label": "2-11",
			"name": "状语从句",
			"zh": "语法 · because、although、when、if，排成句子",
			"branch": "grammar"
		},
		{
			"practice": false,
			"skill": "grammar",
			"type": "choice",
			"stations": [
				"6.6"
			],
			"hashtags": [
				"IELTS_6_6"
			],
			"gear": "grammar:6.6",
			"heartGear": "vocab:5.6",
			"gearGivesHeart": false,
			"gearButton": "去练一组（不补心）",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j10",
				"j3",
				"j7"
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
					"id": "2-12-A-1",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The teacher ______ helped me is from Canada.",
					"options": [
						{
							"key": "A",
							"text": "which"
						},
						{
							"key": "B",
							"text": "where"
						},
						{
							"key": "C",
							"text": "who"
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
					"evidence": "The teacher who helped me is from Canada.",
					"why": "前面是人（teacher），用 who。",
					"audio": null,
					"tags": [
						"g-rel"
					]
				},
				{
					"id": "2-12-A-2",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "This is the book ______ changed my mind.",
					"options": [
						{
							"key": "A",
							"text": "who"
						},
						{
							"key": "B",
							"text": "which"
						},
						{
							"key": "C",
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
						"C": "grammar"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "This is the book which changed my mind.",
					"why": "前面是东西（book），用 which。",
					"audio": null,
					"tags": [
						"g-rel"
					]
				},
				{
					"id": "2-12-A-3",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The town ______ I grew up is very small.",
					"options": [
						{
							"key": "A",
							"text": "where"
						},
						{
							"key": "B",
							"text": "which"
						},
						{
							"key": "C",
							"text": "who"
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
					"evidence": "The town where I grew up is very small.",
					"why": "grew up 后面缺的是地点（in the town），用 where。",
					"audio": null,
					"tags": [
						"g-rel"
					]
				},
				{
					"id": "2-12-A-4",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Which sentence uses who correctly?",
					"options": [
						{
							"key": "A",
							"text": "The man who lives next door he is a doctor."
						},
						{
							"key": "B",
							"text": "The man who lives next door is a doctor."
						},
						{
							"key": "C",
							"text": "The man lives next door is a doctor."
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
					"evidence": "Which sentence uses who correctly?",
					"why": "有了 who，后面不能再加 he；少了 who 句子就有两个谓语。",
					"audio": null,
					"tags": [
						"g-rel"
					]
				},
				{
					"id": "2-12-A-5",
					"set": "A",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "Students who ______ late must sign in at reception.",
					"options": [
						{
							"key": "A",
							"text": "arrives"
						},
						{
							"key": "B",
							"text": "arriving"
						},
						{
							"key": "C",
							"text": "arrive"
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
					"evidence": "Students who arrive late must sign in at reception.",
					"why": "who 指 students，复数，动词不加 s。",
					"audio": null,
					"tags": [
						"g-rel"
					]
				},
				{
					"id": "2-12-B-1",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "I met a woman ______ speaks five languages.",
					"options": [
						{
							"key": "A",
							"text": "which"
						},
						{
							"key": "B",
							"text": "who"
						},
						{
							"key": "C",
							"text": "whose"
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
					"evidence": "I met a woman who speaks five languages.",
					"why": "前面是人，后面直接接动词，用 who。",
					"audio": null,
					"tags": [
						"g-rel"
					]
				},
				{
					"id": "2-12-B-2",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The laptop ______ I bought last week has stopped working.",
					"options": [
						{
							"key": "A",
							"text": "who"
						},
						{
							"key": "B",
							"text": "where"
						},
						{
							"key": "C",
							"text": "that"
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
					"evidence": "The laptop that I bought last week has stopped working.",
					"why": "前面是东西，用 that 或 which。",
					"audio": null,
					"tags": [
						"g-rel"
					]
				},
				{
					"id": "2-12-B-3",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "My sister, ______ lives in Sydney, is visiting next month.",
					"options": [
						{
							"key": "A",
							"text": "who"
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
					"evidence": "My sister, who lives in Sydney, is visiting next month.",
					"why": "有逗号的从句不能用 that；人用 who。",
					"audio": null,
					"tags": [
						"g-rel"
					]
				},
				{
					"id": "2-12-B-4",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The café ______ we first met has closed.",
					"options": [
						{
							"key": "A",
							"text": "which"
						},
						{
							"key": "B",
							"text": "who"
						},
						{
							"key": "C",
							"text": "where"
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
					"evidence": "The café where we first met has closed.",
					"why": "met 后面缺的是地点（at the café），用 where。",
					"audio": null,
					"tags": [
						"g-rel"
					]
				},
				{
					"id": "2-12-B-5",
					"set": "B",
					"type": "choice",
					"skill": null,
					"passage": null,
					"question": "The project ______ results were published yesterday took three years.",
					"options": [
						{
							"key": "A",
							"text": "whose"
						},
						{
							"key": "B",
							"text": "which"
						},
						{
							"key": "C",
							"text": "who"
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
					"evidence": "The project whose results were published yesterday took three years.",
					"why": "「这个项目的结果」，表示「谁的」用 whose。",
					"audio": null,
					"tags": [
						"g-rel"
					]
				}
			],
			"id": "2-12",
			"ch": 2,
			"kind": "level",
			"x": 355,
			"y": 200,
			"label": "2-12",
			"name": "定语从句",
			"zh": "语法 · who、which、where 放在名词后面",
			"branch": "grammar"
		},
		{
			"practice": false,
			"skill": "mixed",
			"type": "mixed",
			"stations": [
				"1.6",
				"2.6"
			],
			"hashtags": [
				"IELTS_1_6",
				"IELTS_2_6"
			],
			"gear": "vocab:5.5",
			"heartGear": "vocab:5.5",
			"gearGivesHeart": true,
			"gearButton": "去练一组，补 1 颗心",
			"heartButton": "补 1 颗心",
			"shelf": [
				"j19",
				"j12",
				"j5"
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
					"skill": "listening",
					"passage": null,
					"question": "Kate（女声）和 Sam（男声）。Who wants to begin by reading existing studies?",
					"options": [
						{
							"key": "A",
							"text": "Sam"
						},
						{
							"key": "B",
							"text": "Kate"
						},
						{
							"key": "C",
							"text": "both of them"
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
						"B": "speaker",
						"C": "speaker"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "I reckon we should start the project with a survey. A survey takes ages. I'd rather look at existing studies first. I'm not sure. A survey gives us our own data.",
					"why": "Kate 说 I'm not sure，她还是想先做调查。",
					"audio": {
						"voices": {
							"K": "au-friendly",
							"S": "us-ethan"
						},
						"rate": 1,
						"lines": [
							{
								"who": "K",
								"text": "I reckon we should start the project with a survey."
							},
							{
								"who": "S",
								"text": "A survey takes ages. I'd rather look at existing studies first."
							},
							{
								"who": "K",
								"text": "I'm not sure. A survey gives us our own data."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "boss-A-2",
					"set": "A",
					"type": "choice",
					"skill": "reading",
					"passage": "Libraries are no longer just places to borrow books. Many now lend tools, musical instruments and even fishing rods. Visitors can also use 3D printers or record music in small studios.",
					"question": "Choose the best heading for this paragraph.",
					"options": [
						{
							"key": "A",
							"text": "How to borrow a fishing rod"
						},
						{
							"key": "B",
							"text": "The decline of reading"
						},
						{
							"key": "C",
							"text": "Libraries offer more than books"
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
						"A": "main-idea",
						"B": "main-idea"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Libraries are no longer just places to borrow books. Many now lend tools, musical instruments and even fishing rods. Visitors can also use 3D printers or record music in small studios.",
					"why": "no longer just … books 是全段的意思，fishing rods 只是例子。",
					"audio": null,
					"tags": [
						"headings"
					]
				},
				{
					"id": "boss-A-3",
					"set": "A",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "Kate（女声）和 Sam（男声）。Who thinks the lab session was the most useful?",
					"options": [
						{
							"key": "A",
							"text": "Kate"
						},
						{
							"key": "B",
							"text": "both of them"
						},
						{
							"key": "C",
							"text": "Sam"
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
					"evidence": "The lab session was the most useful part of the week. I'd agree, although the lecture on Tuesday came close.",
					"why": "I'd agree = 同意；came close 是「差一点也算」，不是反对。",
					"audio": {
						"voices": {
							"K": "au-friendly",
							"S": "us-ethan"
						},
						"rate": 1,
						"lines": [
							{
								"who": "S",
								"text": "The lab session was the most useful part of the week."
							},
							{
								"who": "K",
								"text": "I'd agree, although the lecture on Tuesday came close."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "boss-A-4",
					"set": "A",
					"type": "gap",
					"skill": "reading",
					"passage": "Coral reefs cover less than one percent of the ocean floor, yet they are home to about a quarter of all known marine species.",
					"question": "Although small in area, reefs support around a ______ of ocean species.",
					"options": null,
					"chips": null,
					"answer": "quarter",
					"accept": [],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "same-word",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Coral reefs cover less than one percent of the ocean floor, yet they are home to about a quarter of all known marine species.",
					"why": "yet 前面说小，后面说多：about a quarter。",
					"audio": null,
					"tags": [
						"summary",
						"word-limit",
						"paraphrase"
					]
				},
				{
					"id": "boss-A-5",
					"set": "A",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "Kate（女声）和 Sam（男声）。Who believes a leader is necessary?",
					"options": [
						{
							"key": "A",
							"text": "Sam"
						},
						{
							"key": "B",
							"text": "Kate"
						},
						{
							"key": "C",
							"text": "both of them"
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
						"B": "speaker",
						"C": "speaker"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Honestly, I don't think the group needs a leader. I disagree. Without one, nothing gets decided. Maybe, but I still think we can decide things together.",
					"why": "Sam 说 I disagree，没有 leader 就定不下来。",
					"audio": {
						"voices": {
							"K": "au-friendly",
							"S": "us-ethan"
						},
						"rate": 1,
						"lines": [
							{
								"who": "K",
								"text": "Honestly, I don't think the group needs a leader."
							},
							{
								"who": "S",
								"text": "I disagree. Without one, nothing gets decided."
							},
							{
								"who": "K",
								"text": "Maybe, but I still think we can decide things together."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "boss-A-6",
					"set": "A",
					"type": "choice",
					"skill": "reading",
					"passage": "When railways were first built, some landowners refused to let the lines cross their fields, saying the trains were noisy and dirty. Within a few years, however, many of them changed their minds, because places without a railway were losing trade.",
					"question": "Why did many landowners later change their minds?",
					"options": [
						{
							"key": "A",
							"text": "Trains had become quieter."
						},
						{
							"key": "B",
							"text": "Railway companies paid them."
						},
						{
							"key": "C",
							"text": "Without one, they were losing business."
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "When railways were first built, some landowners refused to let the lines cross their fields, saying the trains were noisy and dirty. Within a few years, however, many of them changed their minds, because places without a railway were losing trade.",
					"why": "because 后面：losing trade = losing business。",
					"audio": null,
					"tags": [
						"choice",
						"paraphrase"
					]
				},
				{
					"id": "boss-B-1",
					"set": "B",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "Lucy（女声）和 David（男声）。Who is unhappy with the new timetable?",
					"options": [
						{
							"key": "A",
							"text": "Lucy"
						},
						{
							"key": "B",
							"text": "both of them"
						},
						{
							"key": "C",
							"text": "David"
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
					"evidence": "The new timetable is a big improvement. For you, maybe. My classes now end at seven.",
					"why": "For you, maybe = 对你来说是吧，言外之意他不满意。",
					"audio": {
						"voices": {
							"L": "us-hannah",
							"D": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "L",
								"text": "The new timetable is a big improvement."
							},
							{
								"who": "D",
								"text": "For you, maybe. My classes now end at seven."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "boss-B-2",
					"set": "B",
					"type": "choice",
					"skill": "reading",
					"passage": "Most people think of deserts as hot, but the largest desert in the world is Antarctica. A desert is defined by how little rain or snow it receives, not by its temperature.",
					"question": "Choose the best heading for this paragraph.",
					"options": [
						{
							"key": "A",
							"text": "What really makes a desert"
						},
						{
							"key": "B",
							"text": "Life in Antarctica"
						},
						{
							"key": "C",
							"text": "The hottest places on Earth"
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
						"B": "main-idea",
						"C": "main-idea"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Most people think of deserts as hot, but the largest desert in the world is Antarctica. A desert is defined by how little rain or snow it receives, not by its temperature.",
					"why": "最后一句给定义：看降水，不看温度。Antarctica 只是例子。",
					"audio": null,
					"tags": [
						"headings"
					]
				},
				{
					"id": "boss-B-3",
					"set": "B",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "Lucy（女声）和 David（男声）。Who wanted to keep the introduction at first?",
					"options": [
						{
							"key": "A",
							"text": "David"
						},
						{
							"key": "B",
							"text": "Lucy"
						},
						{
							"key": "C",
							"text": "both of them"
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
					"evidence": "I think we should cut the introduction. Cut it? It's only one page. True, but it repeats the conclusion. Oh, I see what you mean. Let's cut it.",
					"why": "Lucy 一开始反问 Cut it?，后来才被说服。",
					"audio": {
						"voices": {
							"L": "us-hannah",
							"D": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "D",
								"text": "I think we should cut the introduction."
							},
							{
								"who": "L",
								"text": "Cut it? It's only one page."
							},
							{
								"who": "D",
								"text": "True, but it repeats the conclusion."
							},
							{
								"who": "L",
								"text": "Oh, I see what you mean. Let's cut it."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "boss-B-4",
					"set": "B",
					"type": "gap",
					"skill": "reading",
					"passage": "The city introduced a charge for plastic bags in 2019. In the following year, the number of bags handed out by shops fell by more than half.",
					"question": "After the charge, shops gave out less than ______ as many bags.",
					"options": null,
					"chips": null,
					"answer": "half",
					"accept": [],
					"limit": {
						"words": 1
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "same-word",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "The city introduced a charge for plastic bags in 2019. In the following year, the number of bags handed out by shops fell by more than half.",
					"why": "fell by more than half = 剩下不到一半。",
					"audio": null,
					"tags": [
						"summary",
						"word-limit",
						"paraphrase"
					]
				},
				{
					"id": "boss-B-5",
					"set": "B",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "Lucy（女声）和 David（男声）。Who prefers studying in a group?",
					"options": [
						{
							"key": "A",
							"text": "Lucy"
						},
						{
							"key": "B",
							"text": "both of them"
						},
						{
							"key": "C",
							"text": "David"
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
					"evidence": "Group study works best for me. Same here. I get bored on my own.",
					"why": "Same here = 我也是。",
					"audio": {
						"voices": {
							"L": "us-hannah",
							"D": "uk-historian"
						},
						"rate": 1,
						"lines": [
							{
								"who": "L",
								"text": "Group study works best for me."
							},
							{
								"who": "D",
								"text": "Same here. I get bored on my own."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "boss-B-6",
					"set": "B",
					"type": "choice",
					"skill": "reading",
					"passage": "Owls can turn their heads much further than humans can, but not all the way round. Because their eyes cannot move in their sockets, turning the head is the only way they can look to the side.",
					"question": "Why do owls turn their heads so far?",
					"options": [
						{
							"key": "A",
							"text": "Their heads can turn all the way round."
						},
						{
							"key": "B",
							"text": "Their necks are longer than ours."
						},
						{
							"key": "C",
							"text": "Their eyes cannot move."
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Owls can turn their heads much further than humans can, but not all the way round. Because their eyes cannot move in their sockets, turning the head is the only way they can look to the side.",
					"why": "Because 后面就是原因；all the way round 被 not 否掉了。",
					"audio": null,
					"tags": [
						"choice",
						"paraphrase"
					]
				},
				{
					"id": "boss-C-1",
					"set": "C",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "Rosa（女声）和 Pete（男声）。Who enjoyed the museum trip?",
					"options": [
						{
							"key": "A",
							"text": "Pete"
						},
						{
							"key": "B",
							"text": "Rosa"
						},
						{
							"key": "C",
							"text": "both of them"
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
					"evidence": "The museum trip was a waste of time. I wouldn't say that. The guide was excellent.",
					"why": "I wouldn't say that = 我不这么看，她觉得讲解很好。",
					"audio": {
						"voices": {
							"R": "us-selene",
							"P": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "P",
								"text": "The museum trip was a waste of time."
							},
							{
								"who": "R",
								"text": "I wouldn't say that. The guide was excellent."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "boss-C-2",
					"set": "C",
					"type": "choice",
					"skill": "reading",
					"passage": "Some of the world's busiest airports are building gardens, cinemas and even swimming pools. The aim is to turn waiting time into something passengers enjoy, so that they choose the same airport again.",
					"question": "Choose the best heading for this paragraph.",
					"options": [
						{
							"key": "A",
							"text": "Airports try to make waiting pleasant"
						},
						{
							"key": "B",
							"text": "Why flights are often delayed"
						},
						{
							"key": "C",
							"text": "How to build a swimming pool"
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
						"B": "main-idea",
						"C": "main-idea"
					},
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Some of the world's busiest airports are building gardens, cinemas and even swimming pools. The aim is to turn waiting time into something passengers enjoy, so that they choose the same airport again.",
					"why": "The aim is … 点出目的：让等待变得享受。",
					"audio": null,
					"tags": [
						"headings"
					]
				},
				{
					"id": "boss-C-3",
					"set": "C",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "Rosa（女声）和 Pete（男声）。Who first suggests working at the weekend?",
					"options": [
						{
							"key": "A",
							"text": "Rosa"
						},
						{
							"key": "B",
							"text": "both of them"
						},
						{
							"key": "C",
							"text": "Pete"
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
					"evidence": "We should ask the tutor for more time. I'd rather just work at the weekend. Hmm, you've got a point. Let's do that.",
					"why": "提议的是 Pete，Rosa 后来才同意。",
					"audio": {
						"voices": {
							"R": "us-selene",
							"P": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "R",
								"text": "We should ask the tutor for more time."
							},
							{
								"who": "P",
								"text": "I'd rather just work at the weekend."
							},
							{
								"who": "R",
								"text": "Hmm, you've got a point. Let's do that."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "boss-C-4",
					"set": "C",
					"type": "gap",
					"skill": "reading",
					"passage": "Children who read for fun at least once a week have larger vocabularies than those who only read for school, one survey of pupils found.",
					"question": "Reading for ______ was linked to a larger vocabulary.",
					"options": null,
					"chips": null,
					"answer": "fun",
					"accept": [],
					"limit": {
						"words": 2
					},
					"ignoreSpaces": false,
					"caseInsensitive": true,
					"cause": "same-word",
					"causes": null,
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Children who read for fun at least once a week have larger vocabularies than those who only read for school, one survey of pupils found.",
					"why": "只为学校读书的词汇量反而小，答案是 fun。",
					"audio": null,
					"tags": [
						"summary",
						"word-limit",
						"paraphrase",
						"distractor"
					]
				},
				{
					"id": "boss-C-5",
					"set": "C",
					"type": "choice",
					"skill": "listening",
					"passage": null,
					"question": "Rosa（女声）和 Pete（男声）。Who doubts that online lectures are as good?",
					"options": [
						{
							"key": "A",
							"text": "Pete"
						},
						{
							"key": "B",
							"text": "Rosa"
						},
						{
							"key": "C",
							"text": "both of them"
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
					"evidence": "Online lectures are just as good as live ones. I'm not convinced. You can't ask questions. You can, in the chat.",
					"why": "I'm not convinced = 我不信。",
					"audio": {
						"voices": {
							"R": "us-selene",
							"P": "au-felix"
						},
						"rate": 1,
						"lines": [
							{
								"who": "P",
								"text": "Online lectures are just as good as live ones."
							},
							{
								"who": "R",
								"text": "I'm not convinced. You can't ask questions."
							},
							{
								"who": "P",
								"text": "You can, in the chat."
							}
						]
					},
					"tags": [
						"discussion",
						"matching"
					]
				},
				{
					"id": "boss-C-6",
					"set": "C",
					"type": "choice",
					"skill": "reading",
					"passage": "Tomatoes were grown in parts of Europe for many years before people started eating them. At first they were kept as decorative plants, because many people believed the fruit was poisonous.",
					"question": "Why did people not eat tomatoes at first?",
					"options": [
						{
							"key": "A",
							"text": "They thought the fruit was poisonous."
						},
						{
							"key": "B",
							"text": "They were too expensive."
						},
						{
							"key": "C",
							"text": "They did not grow well."
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
					"pick": null,
					"bothWrongCause": null,
					"playOnce": false,
					"lecture": null,
					"evidence": "Tomatoes were grown in parts of Europe for many years before people started eating them. At first they were kept as decorative plants, because many people believed the fruit was poisonous.",
					"why": "because 后面：believed the fruit was poisonous。",
					"audio": null,
					"tags": [
						"choice",
						"paraphrase"
					]
				}
			],
			"id": "2-boss",
			"ch": 2,
			"kind": "boss",
			"x": 195,
			"y": 90,
			"label": "Boss",
			"name": "辩论台",
			"zh": "Boss · 听出谁说的，读出整段在讲什么（听力 + 阅读）",
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
			"id": "2-gear",
			"ch": 2,
			"kind": "gear",
			"x": 45,
			"y": 520,
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
				"IELTS_1_6",
				"IELTS_2_6"
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
			"id": "2-intel",
			"ch": 2,
			"kind": "news",
			"x": 55,
			"y": 425,
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
			"id": "2-shelf",
			"ch": 2,
			"kind": "shelf",
			"x": 150,
			"y": 300,
			"label": "锦囊书屋",
			"name": "锦囊书屋",
			"zh": "读一本锦囊、做 3 题对 2 题，补 1 颗心",
			"branch": "station"
		}
	],
	"edges": [
		[
			"2-start",
			"2-1",
			"main"
		],
		[
			"2-1",
			"2-2",
			"main"
		],
		[
			"2-2",
			"2-3",
			"main"
		],
		[
			"2-3",
			"2-4",
			"main"
		],
		[
			"2-4",
			"2-5",
			"main"
		],
		[
			"2-5",
			"2-6",
			"main"
		],
		[
			"2-6",
			"2-boss",
			"main"
		],
		[
			"2-3",
			"2-7",
			"vocab"
		],
		[
			"2-7",
			"2-8",
			"vocab"
		],
		[
			"2-8",
			"2-9",
			"vocab"
		],
		[
			"2-9",
			"2-6",
			"vocab"
		],
		[
			"2-4",
			"2-10",
			"grammar"
		],
		[
			"2-10",
			"2-11",
			"grammar"
		],
		[
			"2-11",
			"2-12",
			"grammar"
		],
		[
			"2-1",
			"2-gear",
			"station"
		],
		[
			"2-3",
			"2-intel",
			"station"
		],
		[
			"2-5",
			"2-shelf",
			"station"
		]
	],
	"causeOrder": [
		"too-hard",
		"grammar",
		"main-idea",
		"vocab",
		"word-form",
		"not-given",
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
					"zh": "读一本锦囊并过小测（推荐讲段落标题的那本）"
				},
				{
					"id": "gear",
					"zh": "去装备练一组（词汇线，或任意一件装备）"
				},
				{
					"id": "intel",
					"zh": "去公会看 1 篇情报帖（#IELTS_1_6 或 #IELTS_2_6）"
				}
			]
		},
		"chest": {
			"sideAt": "2-12",
			"sideXp": 30,
			"clearXp": 100,
			"badge": "ielts-c2"
		},
		"multi": null,
		"timedCopy": null
	}
};
