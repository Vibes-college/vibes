/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 第一章锦囊（书屋的书）和各自的 3 题小验证。由 apps/community/scripts/quest-books.mjs 从「攻略」的锦囊 index.json 生成，不要手改。
// 来源：index.json v1.2.1（2026-11-11），对照表 ch1-2026-11-11a，关卡表 chapter-1.json ch1-2026-11-10f。答案只在服务器上。
export type QuestBook = {
	no: number; ref: string; id: string; slug: string; spine: string; title: string; summary: string; kind: string; evidence: string; color: string;
	app: { id: string; zh: string; path: string | null };
	verify: string; verifyUrl: string | null;
	/** 去哪几关验证（chapter-1.json 的关卡 id，"*" = 任何一关） */
	verifyLevels: string[];
	/** 「练一组」去哪（同关卡 gear 写法）；null = 没有装备 */
	gear: string | null; fallbackGear: string | null;
	/** false = 这本的装备只能练、不补心 */
	givesHeart: boolean;
	/** 关卡错题标了这些错因，书屋就亮这本 */
	causeKeys: string[];
	tags: string[]; when: string;
	quiz: { id: string; q: string; o: string[]; a: number; why: string }[];
};

export const QUEST_BOOK_RULES = { passAt: 2, count: 3, refillHearts: 1 } as const;

export const QUEST_BOOKS: QuestBook[] = [
	{
		"no": 1,
		"ref": "j1",
		"id": "ielts-c1-k1",
		"slug": "ielts-know-test-yourself",
		"spine": "合上书考自己",
		"title": "背单词多看几遍，不如合上书考自己",
		"summary": "「再看一遍」练的是认得它，「合上书考自己」练的是到考场上把它想出来。同样的时间，多考自己，少看。",
		"kind": "反常识",
		"evidence": "研究",
		"color": "#2340A3",
		"app": {
			"id": "wordbook",
			"zh": "生词本",
			"path": "/apps/wordbook/"
		},
		"verify": "闯关第一章词汇岔路 1-7「会认也会拼」、1-8「固定搭配」、1-9「近义说法」。拼写题考的正是你想不想得出来。",
		"verifyUrl": "/quest?level=1-7",
		"verifyLevels": [
			"1-7",
			"1-8",
			"1-9"
		],
		"gear": "wordbook",
		"fallbackGear": null,
		"givesHeart": true,
		"causeKeys": [
			"vocab"
		],
		"tags": [
			"vocab-spell",
			"spelling"
		],
		"when": "词汇关拼写题常错",
		"quiz": [
			{
				"id": "ielts-c1-k1-q1",
				"q": "背完一组单词，还剩 5 分钟。哪种做法更能让你在考场上想起它们？",
				"o": [
					"把这组词从头再看一遍",
					"遮住英文，看着中文自己拼一遍"
				],
				"a": 1,
				"why": "自己拼一遍就是在考自己，练的是「想出来」；再看一遍只练「认得」。"
			},
			{
				"id": "ielts-c1-k1-q2",
				"q": "一个词你每次见到都认得，听写时却拼不出来。这说明什么？",
				"o": [
					"你只练过「认得它」，没练过「把它想出来」",
					"还没见够次数，再多看几遍就好"
				],
				"a": 0,
				"why": "认得和想得出来是两种本事。看得再多，也只是加强前一种。"
			},
			{
				"id": "ielts-c1-k1-q3",
				"q": "拼写卡上一个词拼错了，看了答案。接下来怎么做最好？",
				"o": [
					"反正答案看过了，跳过它",
					"过一会儿合上答案，再考自己一次"
				],
				"a": 1,
				"why": "看答案只是「认得」了一次。隔一会儿再考一次，才是在练想出来。"
			}
		]
	},
	{
		"no": 2,
		"ref": "j2",
		"id": "ielts-c1-k2",
		"slug": "ielts-know-spacing",
		"spine": "隔几天见一次才记得住",
		"title": "一口气背完的单词，过几天就还回去了；隔几天见一次才记得住",
		"summary": "一口气背完马上测，确实都记得，可过几天就忘了一大半。同样复习几次，隔开几天做，过后还记得的更多。",
		"kind": "通用规律",
		"evidence": "研究",
		"color": "#3E9E7A",
		"app": {
			"id": "wordbook",
			"zh": "生词本",
			"path": "/apps/wordbook/"
		},
		"verify": "词汇岔路 1-7 到 1-9 过关一周以后，回去再打同一关，看还过不过得了。考前一周：把生词本里到期的词清零一次。",
		"verifyUrl": "/quest?level=1-7",
		"verifyLevels": [
			"1-7",
			"1-8",
			"1-9"
		],
		"gear": "wordbook",
		"fallbackGear": null,
		"givesHeart": true,
		"causeKeys": [],
		"tags": [
			"vocab-spell",
			"vocab-meaning"
		],
		"when": "词汇关过关 7 天后回测；或回测没过",
		"quiz": [
			{
				"id": "ielts-c1-k2-q1",
				"q": "今天背了 50 个新词，晚上马上自测，全对。这能说明什么？",
				"o": [
					"已经记牢了，这批词可以不用再管",
					"只说明现在记得，过几天还得再见一次"
				],
				"a": 1,
				"why": "刚背完测，集中背总是显得很好；过几天再测才看得出记没记住。"
			},
			{
				"id": "ielts-c1-k2-q2",
				"q": "同一批词都复习 3 次，哪种安排一周后记得更多？",
				"o": [
					"今天、后天、下周各复习 1 次",
					"今天一口气连着复习 3 遍"
				],
				"a": 0,
				"why": "次数一样，隔开几天做，一周后还记得的更多。"
			},
			{
				"id": "ielts-c1-k2-q3",
				"q": "生词本里今天有 30 个词到期，另外 200 个还没到期。今天怎么做？",
				"o": [
					"趁有空，把 230 个一起刷一遍",
					"做完 30 个到期的就停"
				],
				"a": 1,
				"why": "没到期的词你现在还记得，刷它们等于在复习已经会的。留到快忘的时候再见，记得更久。"
			}
		]
	},
	{
		"no": 3,
		"ref": "j3",
		"id": "ielts-c1-k3",
		"slug": "ielts-know-read-easy-first",
		"spine": "先读得懂才读得多",
		"title": "4–5 分别急着刷剑桥真题：先读得懂，才读得多",
		"summary": "读顺一篇文章，大概要认识 98% 的词。生词一半的真题，读一篇累一篇。先读几乎不用查词典的文章，才读得多、记得住。",
		"kind": "反常识",
		"evidence": "研究",
		"color": "#ECB637",
		"app": {
			"id": "graded-reading",
			"zh": "分级阅读",
			"path": "https://vibes.college/read/artisan/"
		},
		"verify": "闯关第一章阅读 1-4「通知和时刻表」、1-5「对、错、没提到」、1-6「换了说法」。",
		"verifyUrl": "/quest?level=1-4",
		"verifyLevels": [
			"1-4",
			"1-5",
			"1-6"
		],
		"gear": "graded-reading",
		"fallbackGear": null,
		"givesHeart": false,
		"causeKeys": [
			"too-hard"
		],
		"tags": [
			"form",
			"choice",
			"matching",
			"tfng",
			"sentence"
		],
		"when": "阅读关没过，或做题时间不够",
		"quiz": [
			{
				"id": "ielts-c1-k3-q1",
				"q": "一篇文章每行都有两三个生词，查了半天才读完。对 4–5 分的你，这篇算哪种材料？",
				"o": [
					"太难了，这样读不了几篇就会放弃",
					"正合适，越难进步越快"
				],
				"a": 0,
				"why": "生词这么密，读得懂的部分太少，既读不多也记不住。"
			},
			{
				"id": "ielts-c1-k3-q2",
				"q": "为什么说「先读得懂，才读得多」？",
				"o": [
					"读得懂的文章词汇简单，考试不考",
					"一个词要见很多次才记得住，只有读得懂的文章你才读得下去、读得多"
				],
				"a": 1,
				"why": "顺带记词靠的是见很多次，而能大量读的只有读得懂的文章。"
			},
			{
				"id": "ielts-c1-k3-q3",
				"q": "那剑桥真题什么时候做？",
				"o": [
					"先把简单文章读顺，再拿来练题型和时间",
					"永远别做，只读简单的"
				],
				"a": 0,
				"why": "真题用来熟悉题型和掐时间；打底期先读顺，不是不做真题。"
			}
		]
	},
	{
		"no": 4,
		"ref": "j4",
		"id": "ielts-c1-k4",
		"slug": "ielts-know-hear-known-words",
		"spine": "认识的词没听出来",
		"title": "听不懂，往往不是没学过这个词，是认识的词没听出来",
		"summary": "听不懂，第一反应是再去背新词。可很多时候卡住的是你早就认识的词：一连读、一说快，就认不出来了。",
		"kind": "反常识",
		"evidence": "研究 + 单人经验",
		"color": "#E8603F",
		"app": {
			"id": "dictation",
			"zh": "听写",
			"path": "/apps/dictation/"
		},
		"verify": "闯关第一章听力 1-1「名字和字母」、1-2「数字和日期」、1-3「他改口了」。录音只放一遍，跟考场一样。",
		"verifyUrl": "/quest?level=1-1",
		"verifyLevels": [
			"1-1",
			"1-2",
			"1-3"
		],
		"gear": "dictation",
		"fallbackGear": null,
		"givesHeart": true,
		"causeKeys": [
			"not-heard"
		],
		"tags": [
			"spelling",
			"numbers",
			"plural",
			"form"
		],
		"when": "听力关填空题常错",
		"quiz": [
			{
				"id": "ielts-c1-k4-q1",
				"q": "听写时没写出 vegetable，可一看原文，你明明认识它。最可能的原因是？",
				"o": [
					"词汇量不够，要多背新词",
					"你认识它写出来的样子，没认出它读出来的样子"
				],
				"a": 1,
				"why": "词是认识的，卡在把声音和这个词对上，这正是「认词」这一步。"
			},
			{
				"id": "ielts-c1-k4-q2",
				"q": "对 4–5 分的人，听力先补哪一块更划算？",
				"o": [
					"把已经认识的词和它真实的读音对上",
					"先背完一本新的词汇书"
				],
				"a": 0,
				"why": "很多听力问题出在认词：认识的词没听出来。再背新词补不上这一块。"
			},
			{
				"id": "ielts-c1-k4-q3",
				"q": "做完一组听写，哪种对答案的方法最有用？",
				"o": [
					"只看对了几题，记个分数",
					"把写错的词找出来，对着原文再听那一句"
				],
				"a": 1,
				"why": "写错的词就是你「认识却听不出」的词，对着原文听，才是在把读音对上。"
			}
		]
	},
	{
		"no": 5,
		"ref": "j5",
		"id": "ielts-c1-k5",
		"slug": "ielts-know-same-meaning",
		"spine": "一字不差的多半不是答案",
		"title": "在雅思里，跟题目一字不差的那句话，多半不是答案",
		"summary": "新手拿题目里的词去原文找一模一样的词。雅思偏偏反着出：答案那句通常换了说法，一字不差的那句常常是陷阱。",
		"kind": "反常识",
		"evidence": "官方 + 单人经验",
		"color": "#141E52",
		"app": {
			"id": "synonym-match",
			"zh": "同义词连连看",
			"path": "/synonym/index.html?topic=general"
		},
		"verify": "闯关第一章 Boss「换装者」：同义替换，听力、阅读都有。练习关 1-6「换了说法」、1-9「近义说法」也考这个。",
		"verifyUrl": "/quest?level=boss",
		"verifyLevels": [
			"boss",
			"1-6",
			"1-9"
		],
		"gear": "synonym-match:general",
		"fallbackGear": "vocab:5.4",
		"givesHeart": true,
		"causeKeys": [
			"same-word"
		],
		"tags": [
			"paraphrase",
			"distractor"
		],
		"when": "Boss 没过；或任何一关同义替换、干扰项常错",
		"quiz": [
			{
				"id": "ielts-c1-k5-q1",
				"q": "题目问 the cost of the trip。原文有两句：①「The trip was mentioned in the cost report.」②「You'll pay around £40 in total.」哪句更可能是答案？",
				"o": [
					"①，trip 和 cost 两个词都对上了",
					"②，一个原词都没有，说的却正是花多少钱"
				],
				"a": 1,
				"why": "①只是用了原词，没说多少钱；②换了说法，意思对上了。"
			},
			{
				"id": "ielts-c1-k5-q2",
				"q": "你在原文里找到一句话，用词跟题目一模一样。下一步？",
				"o": [
					"先看它的意思对不对得上，再看后面有没有被否定",
					"直接选它，省时间"
				],
				"a": 0,
				"why": "一字不差的那句常常是干扰项，要按意思核对。"
			},
			{
				"id": "ielts-c1-k5-q3",
				"q": "玩「同义词连连看」时，卡片上有 increase。它该跟哪张配？",
				"o": [
					"increasing，长得最像",
					"go up，长得不像，意思一样"
				],
				"a": 1,
				"why": "长得像的是陷阱卡。Boss 考的就是认出换过的说法，配意思不配长相。"
			}
		]
	},
	{
		"no": 6,
		"ref": "j6",
		"id": "ielts-c1-k6",
		"slug": "ielts-know-typing-speed",
		"spine": "打字慢就是丢分",
		"title": "机考的听力没有誊写时间，打字慢就是丢分",
		"summary": "纸笔考听力最后有 10 分钟把答案誊到答题卡上，机考没有，只有 2 分钟检查。听力要边听边打，写作两篇也全靠打字。",
		"kind": "真人经验",
		"evidence": "官方",
		"color": "#6E7088",
		"app": {
			"id": "typing",
			"zh": "机考打字",
			"path": "/apps/typing/"
		},
		"verify": "支线 0 号线「机考打字」。过了之后，闯关里的听力关答案也试着边听边打。",
		"verifyUrl": "/typing",
		"verifyLevels": [],
		"gear": "typing",
		"fallbackGear": null,
		"givesHeart": true,
		"causeKeys": [
			"spelling"
		],
		"tags": [],
		"when": "第一次进闯关地图；或 0 号线没过",
		"quiz": [
			{
				"id": "ielts-c1-k6-q1",
				"q": "纸笔考的老习惯是先在题本上记，最后统一誊。换到机考会怎样？",
				"o": [
					"没问题，机考一样留时间誊",
					"来不及：机考没有那 10 分钟誊写，只有 2 分钟检查"
				],
				"a": 1,
				"why": "机考听力不给誊写时间，要边听边打进去。"
			},
			{
				"id": "ielts-c1-k6-q2",
				"q": "你英文不错，可打字慢，平时靠输入法联想拼词。机考听力最可能在哪丢分？",
				"o": [
					"边听边打跟不上，或者拼错了没发现",
					"写作字数不够"
				],
				"a": 0,
				"why": "听力答案要边听边打，拼错就算错，打字慢和拼写不稳在这里最吃亏。"
			},
			{
				"id": "ielts-c1-k6-q3",
				"q": "你报的是机考，离考试还有一个月。下面哪件事更该先做？",
				"o": [
					"多做几套纸质真题练手写",
					"在电脑上练边听边打"
				],
				"a": 1,
				"why": "考场怎么考就怎么练。机考要练的是打字和边听边填。"
			}
		]
	},
	{
		"no": 7,
		"ref": "j7",
		"id": "ielts-c1-k7",
		"slug": "ielts-know-practice-weak-spot",
		"spine": "卡住多半在练已经会的",
		"title": "卡在一个地方不动，多半是一直在练已经会的",
		"summary": "卡住了，最常见的反应是每天多刷一套题。可一整套题，大部分时间花在你本来就会的题上。只练还不会的那一小块，练的时间才没白花。",
		"kind": "通用规律",
		"evidence": "研究 + 单人经验",
		"color": "#B9472C",
		"app": {
			"id": "dictation",
			"zh": "听写 · 常错词",
			"path": "/apps/dictation/"
		},
		"verify": "闯关第一章任何一关没过两次的时候。练完错得最多的那一类，再回来打同一关。",
		"verifyUrl": "/quest",
		"verifyLevels": [
			"*"
		],
		"gear": "level",
		"fallbackGear": null,
		"givesHeart": true,
		"causeKeys": [
			"same-mistake-again"
		],
		"tags": [],
		"when": "同一关连着没过 2 次",
		"quiz": [
			{
				"id": "ielts-c1-k7-q1",
				"q": "有一关连着两次没过，错的多半是地图题。下一步？",
				"o": [
					"先只练地图题，再回来打这一关",
					"马上把这一关整关再打一遍"
				],
				"a": 0,
				"why": "整关重打，大部分时间又花在会的题上。先补错得最多的那一类。"
			},
			{
				"id": "ielts-c1-k7-q2",
				"q": "每天刷一整套题，还是卡在原地。最可能的原因是？",
				"o": [
					"刷得还不够多，再加一套",
					"大部分时间花在本来就会的题上"
				],
				"a": 1,
				"why": "一套题里真正让你丢分的只有几道，加量也是在重复会的。"
			},
			{
				"id": "ielts-c1-k7-q3",
				"q": "研究说练习时长只能解释一小部分成绩差距。这对你意味着什么？",
				"o": [
					"练不练都差不多，主要看天赋",
					"怎么练比练多久要紧"
				],
				"a": 1,
				"why": "练习当然有用，只是要练在还不会的地方，光堆时间不够。"
			}
		]
	},
	{
		"no": 8,
		"ref": "j8",
		"id": "ielts-c1-k8",
		"slug": "ielts-know-self-correct",
		"spine": "要有人逼你自己改",
		"title": "天天跟外教聊，口语也可能不涨：要有人逼你自己改",
		"summary": "只说不改，错的说法会被你一遍遍练熟。有人提醒你「这里错了」、让你自己改过来，口语才真的在练。",
		"kind": "真人经验",
		"evidence": "研究 + 单人经验",
		"color": "#3E9E7A",
		"app": {
			"id": "mia",
			"zh": "Vibi",
			"path": null
		},
		"verify": "第一章还没有口语关。先在 Vibi 那里练；口语关开了以后，这本锦囊会挂上去。",
		"verifyUrl": null,
		"verifyLevels": [],
		"gear": null,
		"fallbackGear": null,
		"givesHeart": false,
		"causeKeys": [],
		"tags": [],
		"when": "第一章没有口语关，只在书屋里浏览时出现",
		"quiz": [
			{
				"id": "ielts-c1-k8-q1",
				"q": "你说 \"I go to Beijing last year\"。下面哪种回应更能帮你进步？",
				"o": [
					"「last year 的时候，动词要注意哦，你再说一遍？」",
					"「哦，你 went to Beijing last year 呀。」"
				],
				"a": 0,
				"why": "第一种提醒你哪里错了、让你自己改；第二种替你说对了，你很可能听过就算了。"
			},
			{
				"id": "ielts-c1-k8-q2",
				"q": "每天跟外教聊一小时，外教从不打断你纠错。几个月后最可能怎样？",
				"o": [
					"错误自己会慢慢消失",
					"说得更顺了，可老错误也练熟了"
				],
				"a": 1,
				"why": "没人指出来，错的说法会跟着一起被练熟。"
			},
			{
				"id": "ielts-c1-k8-q3",
				"q": "找 Vibi 练口语，怎么开口最有用？",
				"o": [
					"「只告诉我哪里错了，我自己先改」",
					"「帮我把这段改成地道的说法」"
				],
				"a": 0,
				"why": "自己改的那一下，才是在练。直接拿到改好的版本，下次多半还会错。"
			}
		]
	},
	{
		"no": 9,
		"ref": "j9",
		"id": "ielts-c1-k9",
		"slug": "ielts-know-not-given",
		"spine": "没说不等于说反了",
		"title": "文章没说，不等于文章说反了：判断题先找「证明它错」的那句",
		"summary": "FALSE 和 NOT GIVEN 最容易混。差别只有一个：FALSE 能在原文里指出一句证明它错的话，NOT GIVEN 指不出来。所以先找这句话，找不到才选 NOT GIVEN。",
		"kind": "反常识",
		"evidence": "官方说明 + 常见经验",
		"color": "#7A5BA8",
		"app": {
			"id": "vocab",
			"zh": "词汇线 5.4",
			"path": "/vocab/5.4"
		},
		"verify": "闯关第一章阅读 1-5「对、错、没提到」，和 Boss「换装者」里的判断题。",
		"verifyUrl": "/quest?level=1-5",
		"verifyLevels": [
			"1-5",
			"boss"
		],
		"gear": "vocab:5.4",
		"fallbackGear": null,
		"givesHeart": true,
		"causeKeys": [
			"not-given"
		],
		"tags": [
			"tfng"
		],
		"when": "判断题里 FALSE 和 NOT GIVEN 选反",
		"quiz": [
			{
				"id": "ielts-c1-k9-q1",
				"q": "原文：「这座桥 1890 年建成，最初只供行人通过。」题目：「这座桥建成时就能走汽车。」选哪个？",
				"o": [
					"NOT GIVEN，原文一个字没提汽车",
					"FALSE，「只供行人」已经证明它错了"
				],
				"a": 1,
				"why": "证明它错的那句换了说法：只供行人，就是不能走汽车。指得出这句，就是 FALSE。"
			},
			{
				"id": "ielts-c1-k9-q2",
				"q": "同一段原文，题目：「这座桥是全市最早的桥。」选哪个？",
				"o": [
					"NOT GIVEN，原文没拿它和别的桥比过",
					"FALSE，1890 年在一座城市里不算早"
				],
				"a": 0,
				"why": "原文找不到能证明它错的句子；「不算早」是你自己的常识，不是文章说的。"
			},
			{
				"id": "ielts-c1-k9-q3",
				"q": "一道题你在 FALSE 和 NOT GIVEN 之间拿不准。先做哪件事？",
				"o": [
					"在原文里找一句能证明题目错的话，找得到才选 FALSE",
					"先看原文提没提这件事，没看到就选 NOT GIVEN"
				],
				"a": 0,
				"why": "FALSE 的标准更清楚：有证据就是 FALSE。先问「提没提」，容易把换了说法的 FALSE 漏成 NOT GIVEN。"
			}
		]
	},
	{
		"no": 10,
		"ref": "j10",
		"id": "ielts-c1-k10",
		"slug": "ielts-know-grammar-rules",
		"spine": "语法挑常错的学",
		"title": "「母语者也没学过语法」不适用于你：挑常错的点，把规则学明白，再自己造一句",
		"summary": "凭语感蒙语法题，错的总是那几类。研究一致发现：学外语时，有针对性地学语法规则，效果大、还能保持。不用从头啃一整本书，挑你常错的点学明白，再自己用一遍。",
		"kind": "反常识",
		"evidence": "研究",
		"color": "#C2553A",
		"app": {
			"id": "grammar",
			"zh": "语法线",
			"path": "/grammar/6.1"
		},
		"verify": "闯关第一章语法支线 1-10「句子主干」、1-11「单数复数和时态」、1-12「被动语态」。错的那一类学完，回去再打这一关。",
		"verifyUrl": "/quest?level=1-10",
		"verifyLevels": [
			"1-10",
			"1-11",
			"1-12"
		],
		"gear": "level",
		"fallbackGear": null,
		"givesHeart": false,
		"causeKeys": [
			"grammar"
		],
		"tags": [
			"g-core",
			"g-there",
			"g-agree",
			"g-now",
			"g-past",
			"g-perfect",
			"g-pv-form",
			"g-pv-tense"
		],
		"when": "语法关没过",
		"quiz": [
			{
				"id": "ielts-c1-k10-q1",
				"q": "单复数题你老错。下面哪种做法更快见效？",
				"o": [
					"再刷几十道题，做多了自然有语感",
					"先把单复数的规则看明白，再做题"
				],
				"a": 1,
				"why": "研究发现，把规则讲明白比只靠多做、多看效果大。语感要靠规则先打底。"
			},
			{
				"id": "ielts-c1-k10-q2",
				"q": "一本语法书 20 章，你常错的只有 2 个点。怎么学最省时间？",
				"o": [
					"先把这 2 个点学明白",
					"从第 1 章开始按顺序啃"
				],
				"a": 0,
				"why": "研究里的做法就是一次专门学一个点。先补你错的，最快看到效果。"
			},
			{
				"id": "ielts-c1-k10-q3",
				"q": "被动语态的讲解看懂了，练习也全对。还差哪一步？",
				"o": [
					"用它自己造一句，说出来或写下来",
					"不差了，直接去下一站"
				],
				"a": 0,
				"why": "过一阵再测，自己造过句的用得更好。看懂和会用是两回事。"
			}
		]
	}
];

/** 按错因找该亮的锦囊（第一本 causeKeys 里有这个错因的）。 */
export function bookForCause(cause: string): QuestBook | undefined {
	return QUEST_BOOKS.find(b => b.causeKeys.includes(cause));
}
