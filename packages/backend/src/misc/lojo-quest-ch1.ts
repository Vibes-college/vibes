/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关第一章（示例题）：地图、关卡和题库。题目是我们自己写的示例题，等「路线图」交付正式关卡数据后替换。
// 答案只在服务器上：页面拿到的题目不带答案，作答由 lojo/quest/answer 判。
// 坐标是 390×844 设计稿里的位置（跟原型 v2 的地图一致）。

export type QuestCause = 'same-word' | 'not-given' | 'not-heard' | 'spelling' | 'vocab' | 'grammar' | 'too-hard';
// 主错因同票时按这个顺序取（路线图 ch1-2026-11-10f）
export const QUEST_CAUSE_ORDER: QuestCause[] = ['too-hard', 'grammar', 'vocab', 'not-given', 'same-word', 'not-heard', 'spelling'];

export type QuestQuestion = {
	id: string;
	// 短文或录音稿；没有就只看题干
	p?: string;
	// 题干
	s: string;
	o: string[];
	// 对的选项下标
	a: number;
	// 为什么（作答后给看）
	why: string;
	// 决定答案的那一句（给 Mia）
	ev?: string;
	cause: QuestCause;
};

export type QuestNodeKind = 'start' | 'level' | 'gear' | 'news' | 'shelf' | 'boss';

export type QuestNode = {
	id: string;
	kind: QuestNodeKind;
	x: number;
	y: number;
	label: string;
	name?: string;
	skill?: 'listening' | 'reading' | 'vocab';
	type?: string;
	hint?: string;
	// 练手关：答错不扣心
	practice?: boolean;
	// 一次出几题、对几题过
	ask?: number;
	need?: number;
	// 答错后「去装备练一组」去哪：dictation、vocab:5.N、grammar:6.N、typing、wordbook
	gear?: string;
	// 情报帖的话题
	tags?: string[];
	pool?: QuestQuestion[];
};

const TFNG = ['TRUE', 'FALSE', 'NOT GIVEN'];

export const QUEST_CH1 = {
	id: 'ielts-c1',
	title: '第一章 · 打底',
	band: '练习难度 4.0–5.0',
	boss: { hp: 3, maxWrong: 2 },
	nodes: [
		{ id: 'S', kind: 'start', x: 195, y: 540, label: '起点' },
		{
			id: '1-1', kind: 'level', x: 195, y: 488, label: '1-1', name: '听力 · 拼名字', skill: 'listening', type: '拼写', practice: true, ask: 3, need: 2, gear: 'dictation', tags: ['IELTS_1_1'],
			hint: '录音里把名字一个字母一个字母念出来。下面是录音稿，选出正确的拼法。',
			pool: [
				{ id: '1-1-a', p: '"My surname is Bennett. That\'s B, E, double N, E, double T."', s: '她的姓怎么拼？', o: ['Bennet', 'Bennett', 'Benett'], a: 1, why: 'double N = NN，double T = TT。', ev: 'B, E, double N, E, double T', cause: 'spelling' },
				{ id: '1-1-b', p: '"The street is Kellaway Road. K, E, double L, A, W, A, Y."', s: '街名怎么拼？', o: ['Kelaway', 'Kellaway', 'Kellawey'], a: 1, why: 'double L = LL，最后是 A, Y。', ev: 'K, E, double L, A, W, A, Y', cause: 'spelling' },
				{ id: '1-1-c', p: '"My phone number is oh-seven-seven, double five, three-one."', s: '电话号码是？', o: ['0775531', '7755310', '077531'], a: 0, why: '电话号码里的 oh = 0，double five = 55。', ev: 'oh-seven-seven, double five, three-one', cause: 'not-heard' },
				{ id: '1-1-d', p: '"It\'s Harriet Gray, G, R, A, Y, not E, Y."', s: '她的姓怎么拼？', o: ['Grey', 'Gray', 'Graye'], a: 1, why: '她特意说了是 A, Y，不是 E, Y。', ev: 'G, R, A, Y, not E, Y', cause: 'not-heard' },
				{ id: '1-1-e', p: '"The postcode is C, B, two, one, double R, A."', s: '邮编是？', o: ['CB21 RA', 'CB2 1RRA', 'CB21 RRA'], a: 2, why: 'double R = RR，前面是 CB21。', ev: 'C, B, two, one, double R, A', cause: 'spelling' },
			],
		},
		{
			id: '1-2', kind: 'level', x: 112, y: 440, label: '1-2', name: '听力 · 数字和日期', skill: 'listening', type: '数字日期', practice: true, ask: 3, need: 2, gear: 'dictation', tags: ['IELTS_1_2'],
			hint: '下面是录音稿。注意说话人中途改口的地方。',
			pool: [
				{ id: '1-2-a', p: '"The course starts on the 13th... sorry, the 30th of June."', s: '课程哪天开始？', o: ['13 June', '30 June', '3 June'], a: 1, why: '说话人改口了：sorry 后面那个才算。', ev: 'the 13th... sorry, the 30th of June', cause: 'not-heard' },
				{ id: '1-2-b', p: '"Tickets are fifteen pounds, but students pay fifty percent less."', s: '学生票多少钱？', o: ['£15', '£7.50', '£50'], a: 1, why: 'fifteen 的一半是 7.5；fifty 是「百分之五十」，不是价格。', ev: 'fifteen pounds ... fifty percent less', cause: 'not-heard' },
				{ id: '1-2-c', p: '"We meet every Tuesday at a quarter to eight."', s: '几点见面？', o: ['8:15', '7:45', '8:45'], a: 1, why: 'a quarter to eight = 差一刻八点 = 7:45。', ev: 'a quarter to eight', cause: 'not-heard' },
				{ id: '1-2-d', p: '"The flat is on the fourteenth floor, not the fortieth."', s: '公寓在几楼？', o: ['14', '40', '4'], a: 0, why: 'fourteenth（重音在后）= 14，fortieth = 40。', ev: 'the fourteenth floor, not the fortieth', cause: 'not-heard' },
				{ id: '1-2-e', p: '"The deposit was two hundred, but we\'ve lowered it to one-eighty."', s: '押金现在是多少？', o: ['200', '180', '118'], a: 1, why: '问的是现在：lowered it to 后面那个数。', ev: 'lowered it to one-eighty', cause: 'not-heard' },
			],
		},
		{ id: 'g1', kind: 'gear', x: 282, y: 440, label: '装备站 · 听写', gear: 'dictation' },
		{
			id: '1-3', kind: 'level', x: 195, y: 392, label: '1-3', name: '词汇 · 认得词义', skill: 'vocab', type: '词义', practice: true, ask: 3, need: 2, gear: 'vocab:5.3', tags: ['IELTS_1_3'],
			hint: '选出跟加粗的词意思最接近的那个。',
			pool: [
				{ id: '1-3-a', s: 'The museum is **free** on Sundays.', o: ['空闲的', '不收费的', '自由的'], a: 1, why: '说博物馆 free，指的是不要钱。', ev: 'free on Sundays', cause: 'vocab' },
				{ id: '1-3-b', s: 'Please **book** a table for four.', o: ['书', '预订', '记录'], a: 1, why: 'book 做动词时是「预订」。', ev: 'book a table', cause: 'vocab' },
				{ id: '1-3-c', s: 'The **fare** from the airport is £12.', o: ['车费', '集市', '公平'], a: 0, why: 'fare = 交通费用；fair 才是集市、公平。', ev: 'The fare from the airport', cause: 'vocab' },
				{ id: '1-3-d', s: 'Guests must **check out** by 11 a.m.', o: ['检查', '退房', '看一看'], a: 1, why: '酒店里 check out = 退房。', ev: 'check out by 11 a.m.', cause: 'vocab' },
				{ id: '1-3-e', s: 'Parking is **available** behind the hotel.', o: ['有的、可以用的', '贵的', '禁止的'], a: 0, why: 'available = 有、可用。', ev: 'Parking is available', cause: 'vocab' },
			],
		},
		{
			id: '1-4', kind: 'level', x: 105, y: 332, label: '1-4', name: '词汇 · 同义替换', skill: 'vocab', type: '同义替换', ask: 5, need: 4, gear: 'vocab:5.4', tags: ['IELTS_1_4'],
			hint: '雅思很少原词出现。选出意思一样、说法不同的那个。',
			pool: [
				{ id: '1-4-a', s: 'rise', o: ['raise', 'increase', 'arise'], a: 1, why: 'rise（上升）= increase。raise 是「把东西举起来」。', cause: 'same-word' },
				{ id: '1-4-b', s: 'cheap', o: ['inexpensive', 'cheerful', 'expensive'], a: 0, why: 'inexpensive = 不贵 = cheap。', cause: 'vocab' },
				{ id: '1-4-c', s: 'start', o: ['star', 'begin', 'stand'], a: 1, why: 'begin = start。star 只是长得像。', cause: 'same-word' },
				{ id: '1-4-d', s: 'help', o: ['assist', 'insist', 'resist'], a: 0, why: 'assist = help。另外两个只是词尾一样。', cause: 'same-word' },
				{ id: '1-4-e', s: 'buy', o: ['purchase', 'pursue', 'bye'], a: 0, why: 'purchase = buy；bye 只是读音一样。', cause: 'same-word' },
				{ id: '1-4-f', s: 'enough', o: ['sufficient', 'efficient', 'some'], a: 0, why: 'sufficient = 足够；efficient 是「高效」。', cause: 'vocab' },
				{ id: '1-4-g', s: 'about (= 大约)', o: ['above', 'approximately', 'around the corner'], a: 1, why: 'approximately = about 表示「大约」的时候。', cause: 'vocab' },
				{ id: '1-4-h', s: 'often', o: ['frequently', 'friendly', 'freely'], a: 0, why: 'frequently = often。', cause: 'same-word' },
			],
		},
		{ id: 'i1', kind: 'news', x: 292, y: 330, label: '情报站', tags: ['IELTS_1_4', 'IELTS_1_5'] },
		{
			id: '1-5', kind: 'level', x: 200, y: 280, label: '1-5', name: '阅读 · 判断题入门', skill: 'reading', type: '判断信息', ask: 5, need: 4, gear: 'vocab:5.4', tags: ['IELTS_1_5'],
			hint: '读短文，判断句子：TRUE 原文这样说；FALSE 原文说的相反；NOT GIVEN 原文没说。',
			pool: [
				{ id: '1-5-a', p: 'Most visitors come to the island in summer, when the ferry runs every hour. In winter, the service is cut to two crossings a day.', s: 'The ferry runs less often in the colder months.', o: TFNG, a: 0, why: 'colder months = winter；two crossings a day 比 every hour 少。', ev: 'In winter, the service is cut to two crossings a day.', cause: 'same-word' },
				{ id: '1-5-b', p: 'Most visitors come to the island in summer, when the ferry runs every hour. In winter, the service is cut to two crossings a day.', s: 'The ferry is cheaper in winter.', o: TFNG, a: 2, why: '原文只说了班次，没说票价。', ev: 'In winter, the service is cut to two crossings a day.', cause: 'not-given' },
				{ id: '1-5-c', p: 'The café opened in 2015. At first it only sold coffee, but two years later it began serving lunch as well.', s: 'The café has served food since it opened.', o: TFNG, a: 1, why: '一开始只卖咖啡，两年后才有午饭，所以跟原文相反。', ev: 'At first it only sold coffee', cause: 'same-word' },
				{ id: '1-5-d', p: 'The café opened in 2015. At first it only sold coffee, but two years later it began serving lunch as well.', s: 'Lunch was added to the menu in 2017.', o: TFNG, a: 0, why: '2015 + two years later = 2017。', ev: 'two years later it began serving lunch', cause: 'too-hard' },
				{ id: '1-5-e', p: 'Students can borrow up to six books at a time. Books must be returned within three weeks.', s: 'Students may keep books for up to 21 days.', o: TFNG, a: 0, why: 'three weeks = 21 days，换了说法。', ev: 'returned within three weeks', cause: 'same-word' },
				{ id: '1-5-f', p: 'Students can borrow up to six books at a time. Books must be returned within three weeks.', s: 'Students have to pay to borrow books.', o: TFNG, a: 2, why: '原文没提钱。', ev: 'Students can borrow up to six books at a time.', cause: 'not-given' },
				{ id: '1-5-g', p: 'The park closes at sunset. Dogs are welcome, but they must be kept on a lead near the lake.', s: 'Dogs are not allowed in the park.', o: TFNG, a: 1, why: 'Dogs are welcome = 可以带狗，句子说的相反。', ev: 'Dogs are welcome', cause: 'vocab' },
				{ id: '1-5-h', p: 'The park closes at sunset. Dogs are welcome, but they must be kept on a lead near the lake.', s: 'The lake is the most popular part of the park.', o: TFNG, a: 2, why: '原文提到湖，但没说它最受欢迎。', ev: 'kept on a lead near the lake', cause: 'not-given' },
			],
		},
		{ id: 'b1', kind: 'shelf', x: 300, y: 232, label: '锦囊站 · 书屋' },
		{
			id: '1-6', kind: 'level', x: 96, y: 226, label: '1-6', name: '阅读 · 判断题', skill: 'reading', type: '判断信息', ask: 5, need: 4, gear: 'vocab:5.4', tags: ['IELTS_1_6'],
			hint: 'TRUE 原文这样说；FALSE 原文说的相反；NOT GIVEN 原文没说。一字不差的那句多半是陷阱。',
			pool: [
				{ id: '1-6-a', p: 'Last year the city library extended its opening hours, because students asked for more space to study in the evening.', s: 'The library now stays open later than it used to.', o: TFNG, a: 0, why: 'extended its opening hours = 开得更久了。', ev: 'the city library extended its opening hours', cause: 'same-word' },
				{ id: '1-6-b', p: 'Last year the city library extended its opening hours, because students asked for more space to study in the evening.', s: 'Most library users are students.', o: TFNG, a: 2, why: '原文说学生提了要求，没说用户里学生最多。', ev: 'because students asked for more space', cause: 'not-given' },
				{ id: '1-6-c', p: 'House prices in the town rose sharply before 2010. Since then, they have changed very little.', s: 'House prices have risen sharply since 2010.', o: TFNG, a: 1, why: '时间对不上：大涨是在 2010 年以前，之后几乎没变。', ev: 'Since then, they have changed very little.', cause: 'same-word' },
				{ id: '1-6-d', p: 'House prices in the town rose sharply before 2010. Since then, they have changed very little.', s: 'House prices were stable for most of the 2010s.', o: TFNG, a: 0, why: 'changed very little = stable。', ev: 'Since then, they have changed very little.', cause: 'same-word' },
				{ id: '1-6-e', p: 'The new bus route was planned for May, but it was postponed until the autumn because of road works.', s: 'The bus route opened in May.', o: TFNG, a: 1, why: 'postponed = 推迟了，所以五月没开。', ev: 'it was postponed until the autumn', cause: 'vocab' },
				{ id: '1-6-f', p: 'The new bus route was planned for May, but it was postponed until the autumn because of road works.', s: 'Local people complained about the delay.', o: TFNG, a: 2, why: '原文只说推迟和原因，没说有没有人抱怨。', ev: 'because of road works', cause: 'not-given' },
				{ id: '1-6-g', p: 'Fewer than half of the members attended the annual meeting, so no vote could be taken.', s: 'Attendance at the meeting was low.', o: TFNG, a: 0, why: 'Fewer than half attended = 来的人少 = attendance was low。', ev: 'Fewer than half of the members attended', cause: 'same-word' },
				{ id: '1-6-h', p: 'Fewer than half of the members attended the annual meeting, so no vote could be taken.', s: 'The members voted to change the rules.', o: TFNG, a: 1, why: 'no vote could be taken = 没投成票。', ev: 'so no vote could be taken', cause: 'vocab' },
				{ id: '1-6-i', p: 'The factory, which once employed 2,000 workers, now has a staff of about 300.', s: 'The factory has fewer employees than before.', o: TFNG, a: 0, why: '2,000 → 300，人变少了；staff = employees。', ev: 'now has a staff of about 300', cause: 'same-word' },
				{ id: '1-6-j', p: 'The factory, which once employed 2,000 workers, now has a staff of about 300.', s: 'The factory closed because of falling sales.', o: TFNG, a: 2, why: '原文没说关门，也没说销量。', ev: 'now has a staff of about 300', cause: 'not-given' },
			],
		},
		{
			id: 'boss', kind: 'boss', x: 196, y: 150, label: 'Boss', name: 'Boss · 换说法的守门人', skill: 'reading', type: '同义替换', ask: 6, gear: 'dictation', tags: ['IELTS_1_6'],
			hint: '挑出意思一样、说法不同的那句。打掉 3 格血就赢；错 2 题就输。',
			pool: [
				{ id: 'boss-a', s: 'Prices went up sharply.', o: ['Prices went up slightly.', 'There was a steep rise in prices.', 'Prices went up and down.'], a: 1, why: 'went up sharply = a steep rise。', cause: 'same-word' },
				{ id: 'boss-b', s: 'Few people came to the talk.', o: ['Few people came to the talk again.', 'Attendance at the talk was low.', 'Many people came to the talk.'], a: 1, why: 'few people came = attendance was low。', cause: 'same-word' },
				{ id: 'boss-c', s: 'The plan was put off.', o: ['The plan was put on.', 'The plan was postponed.', 'The plan was put away.'], a: 1, why: 'put off = postpone 推迟。', cause: 'vocab' },
				{ id: 'boss-d', s: 'The shop is open every day.', o: ['The shop never closes at night.', 'The shop opens seven days a week.', 'The shop is open on weekdays.'], a: 1, why: 'every day = seven days a week。', cause: 'same-word' },
				{ id: 'boss-e', s: 'Most students passed the test.', o: ['The majority of students passed the test.', 'All the students passed the test.', 'Most students took the test.'], a: 0, why: 'most = the majority of。', cause: 'same-word' },
				{ id: 'boss-f', s: 'The museum is close to the station.', o: ['The museum is closed near the station.', 'The museum is near the station.', 'The museum closes at the station.'], a: 1, why: 'close to（读 /s/）= near；closed 是关门。', cause: 'same-word' },
			],
		},
	] as QuestNode[],
	edges: [
		['S', '1-1'], ['1-1', '1-2'], ['1-1', 'g1'], ['1-2', '1-3'], ['g1', '1-3'], ['1-3', '1-4'], ['1-3', 'i1'],
		['1-4', '1-5'], ['i1', '1-5'], ['1-5', '1-6'], ['1-5', 'b1'], ['1-6', 'boss'], ['b1', 'boss'],
	] as [string, string][],
};
