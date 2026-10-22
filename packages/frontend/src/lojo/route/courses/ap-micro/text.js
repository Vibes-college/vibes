/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* AP 微观经济学：线路图上这门课特有的文字（通用界面文字在社区代码的 strings.js 里） */

/* 每条线的短名，用在地图上的线路牌 */
export const SHORT = {
	'1': { zh: '基本概念', en: 'Basics' },
	'2': { zh: '供给与需求', en: 'Supply & Demand' },
	'3': { zh: '成本与完全竞争', en: 'Costs & Competition' },
	'4': { zh: '不完全竞争', en: 'Imperfect Competition' },
	'5': { zh: '要素市场', en: 'Factor Markets' },
	'6': { zh: '市场失灵', en: 'Market Failure' },
};

/* 面板、快线说明卡等 */
export const TEXT = {
	zh: {
		eyebrow: 'Vibes · AP 经济学 · 线路图',
		title: 'AP 微观经济学',
		lede: '36 个考点连成 6 条线。金色的边际快线，是整门课反复在讲的那一句话。走到哪一站，都有同行的人。',
		linesN: '6 条 · 另有快线和冲刺线',
		xRow: '边际快线',
		xRowS: '1.6 · 3.5 · 5.3 · 6.1 四站换乘',
		pRowS: '画图规范 → FRQ → 全真模考 → 考场',
		xNote: '<b>这一站在边际快线上。</b>它和另外三站说的是同一句话：多做一点值不值，看多出来的收益，是否大于多出来的成本。',
		beyondS: '考完之后，经济学还能带你去的地方：比赛、写作、专业和真实的项目。它们也是申请时最好的材料。',
		examL: '考场 · 2027 年 5 月',
		xTag: '边际快线 · MB = MC',
		xEye: '边际快线',
		xTitle: '整门课，反复在说一句话',
		xBody: ['多做一点值不值？', '看多出来的收益，是否大于多出来的成本。'],
		xForm: [['1.6 消费者', 'MU / P'], ['3.5 厂商', 'MR = MC'], ['5.3 雇人', 'MRP = MRC'], ['6.1 社会', 'MSB = MSC']],
		xRowR: 'MB = MC',
		xChip: '边际快线换乘',
	},
	en: {
		eyebrow: 'VIBES · AP ECONOMICS · ROUTE MAP',
		title: 'AP Microeconomics',
		lede: '36 topics on 6 lines. The gold Marginal Express is the one idea the whole course keeps coming back to. Wherever you are, someone is riding with you.',
		linesN: '6, plus the express and the final stretch',
		xRow: 'Marginal Express',
		xRowS: 'Transfers at 1.6 · 3.5 · 5.3 · 6.1',
		pRowS: 'Graphing → FRQs → Practice exam → Exam',
		xNote: '<b>This stop is on the Marginal Express.</b> It says the same thing as the other three: doing a bit more is worth it only if the extra benefit beats the extra cost.',
		beyondS: 'Where economics can take you after the exam: competitions, writing, majors and real projects, which also make great application material.',
		examL: 'Exam · May 2027',
		xTag: 'Marginal Express · MB = MC',
		xEye: 'MARGINAL EXPRESS',
		xTitle: 'One idea, four stations',
		xBody: ['Is doing a bit more worth it?', 'Only if the extra benefit beats the extra cost.'],
		xForm: [['1.6 consumers', 'MU / P'], ['3.5 firms', 'MR = MC'], ['5.3 hiring', 'MRP = MRC'], ['6.1 society', 'MSB = MSC']],
		xRowR: 'MB = MC',
		xChip: 'Express transfer',
	},
};

/* 导览解说词（小火车开一圈） */
export const TOUR = {
	zh: {
		intro: '这是 AP 微观经济学的线路图。36 个考点，连成 6 条线。',
		l1: '1 号线：基本经济概念。从「稀缺性」出发，一站一站往前走。',
		xfer: '到「边际效用」，换乘金色的边际快线。',
		ride: '快线上的四站，说的其实是同一句话——',
		mbmc: '边际收益 = 边际成本。整门微观，都绕着它转。',
		lines: ['2 号线：供给与需求。价格怎么定，短缺和过剩从哪来。', '3 号线：成本与完全竞争。企业怎么算账，生产多少最划算。', '4 号线：不完全竞争。垄断、价格歧视和博弈论。', '5 号线：要素市场。工资和雇佣，也是供给与需求。', '6 号线：市场失灵。市场管不好的地方，政府怎么办。'],
		side: '虚线是支线。不考，但好玩。',
		crowd: '每一站都有站台留言。卡住了，就问问同站的人。',
		final: '最后，冲刺线开往考场。',
		exits: '出站之后，还有更远的地方：竞赛、写作、大学专业。',
		end: '从你在的这一站开始吧。',
		go: '开始这一站 →',
		again: '再看一遍',
		skip: '跳过',
	},
	en: {
		intro: 'This is the route map for AP Microeconomics. 36 topics on 6 lines.',
		l1: 'Line 1: basic concepts. It starts at "Scarcity" and goes stop by stop.',
		xfer: 'At "Marginal utility", transfer to the gold Marginal Express.',
		ride: 'The four stops on the express all say the same thing:',
		mbmc: 'Marginal benefit = marginal cost. All of micro turns on it.',
		lines: ['Line 2: supply and demand. How prices form, and where shortages and surpluses come from.', 'Line 3: costs and perfect competition. How firms decide how much to make.', 'Line 4: imperfect competition. Monopoly, price discrimination and game theory.', 'Line 5: factor markets. Wages and hiring are supply and demand too.', 'Line 6: market failure. What happens when markets get it wrong.'],
		side: 'Dashed lines are side trips. Not tested, just fun.',
		crowd: 'Every stop has its own platform notes. Stuck? Ask the people at your stop.',
		final: 'Finally, the last stretch heads to the exam.',
		exits: 'Past the exit: competitions, writing, a university major.',
		end: 'Start from the stop you\'re at.',
		go: 'Start this stop →',
		again: 'Watch again',
		skip: 'Skip',
	},
};

/* 新手引导里和这门课有关的部分 */
export const OB = {
	zh: {
		wEye: '欢迎来到 Vibes · AP 经济学',
		wText: '50 秒看懂这张线路图：36 个考点怎么连在一起，边际快线为什么是主线。',
		qs: [
			{ k: 'examYear', t: '你哪一年考 AP 微观？', o: [['2027', '2027 年 5 月'], ['2028', '2028 年 5 月'], ['0', '还没定']] },
			{
				k: 'start',
				t: '你现在学到哪儿了？',
				o: [['1.1', '刚开始', '从 1 号线出发'], ['3.1', '学完了供给与需求', '从 3 号线出发'], ['4.1', '大半已经学完', '从 4 号线出发'], ['p1', '在复习', '从冲刺线出发']],
			},
			{ k: 'pace', t: '每周大概能花多少时间？', o: [['2', '约 1 小时', '每周 2 站'], ['5', '约 3 小时', '每周 5 站'], ['8', '5 小时以上', '每周 8 站']] },
		],
		cText: '你在 AP 微观的线路上，走出了第一步。',
	},
	en: {
		wEye: 'WELCOME TO VIBES · AP ECONOMICS',
		wText: 'In 50 seconds: how the 36 topics connect, and why the Marginal Express is the main line.',
		qs: [
			{ k: 'examYear', t: 'When do you take AP Micro?', o: [['2027', 'May 2027'], ['2028', 'May 2028'], ['0', 'Not sure yet']] },
			{
				k: 'start',
				t: 'How far along are you?',
				o: [['1.1', 'Just starting', 'Start on Line 1'], ['3.1', 'Done with supply & demand', 'Start on Line 3'], ['4.1', 'Mostly done', 'Start on Line 4'], ['p1', 'Reviewing', 'Start on the final stretch']],
			},
			{
				k: 'pace',
				t: 'How much time per week?',
				o: [['2', 'About 1 hour', '2 stops a week'], ['5', 'About 3 hours', '5 stops a week'], ['8', '5+ hours', '8 stops a week']],
			},
		],
		cText: 'You\'ve taken your first step on the AP Micro line.',
	},
};
