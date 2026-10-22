/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* AP 微积分 AB：线路图上这门课特有的文字（通用界面文字在社区代码的 strings.js 里） */

/* 每条线的短名，用在地图上的线路牌 */
export const SHORT = {
	'1': { zh: '极限与连续', en: 'Limits' },
	'2': { zh: '导数的定义', en: 'Derivatives' },
	'3': { zh: '链式与隐函数', en: 'Chain & Implicit' },
	'4': { zh: '情境中的导数', en: 'In Context' },
	'5': { zh: '分析函数', en: 'Analyzing Functions' },
	'6': { zh: '积分与累积', en: 'Integration' },
	'7': { zh: '微分方程', en: 'Differential Equations' },
	'8': { zh: '积分的应用', en: 'Applications' },
};

/* 面板、快线说明卡等 */
export const TEXT = {
	zh: {
		eyebrow: 'Vibes · AP 微积分 · 线路图',
		title: 'AP 微积分 AB',
		lede: '81 个考点连成 8 条线。竖着的金色快线，串起整门课只问的两件事：变得多快，一共攒了多少。走到哪一站，都有同行的人。',
		linesN: '8 条 · 另有快线和冲刺线',
		xRow: '变化率快线', xRowS: '2.2 · 4.1 · 6.4 · 8.3 四站换乘', xRowR: '导数 ⇄ 积分',
		pRowS: 'FRQ 写法 → 计算器题 → 全真模考 → 考场',
		xNote: '<b>这一站在变化率快线上。</b>它和另外三站说的是同一件事：导数问"变得多快"，积分问"一共攒了多少"，两者互为逆运算。',
		beyondS: '考完之后，微积分还能带你去的地方：用代码玩数学、亲手训练一个小 AI、大学专业和真实的建模项目。',
		examL: '考场 · 2027 年 5 月',
		xTag: '变化率快线 · 导数 ⇄ 积分', xEye: '变化率快线', xTitle: '整门课，就是一个来回',
		xBody: ['导数问：变得多快？', '积分问：一共攒了多少？两者互为逆运算。'],
		xForm: [['2.2 导数', 'f′(x)'], ['4.1 带上单位', 'dy/dt'], ['6.4 基本定理', '(∫f)′ = f'], ['8.3 攒起来', '∫ rate dt']],
		xChip: '变化率快线换乘',
	},
	en: {
		eyebrow: 'VIBES · AP CALCULUS · ROUTE MAP',
		title: 'AP Calculus AB',
		lede: '81 topics on 8 lines. The gold express running down the middle ties together the only two questions calculus asks: how fast is it changing, and how much has built up. Wherever you are, someone is riding with you.',
		linesN: '8, plus the express and the final stretch',
		xRow: 'Rate Express', xRowS: 'Transfers at 2.2 · 4.1 · 6.4 · 8.3', xRowR: 'd/dx ⇄ ∫',
		pRowS: 'FRQs → calculator questions → practice exam → exam',
		xNote: '<b>This stop is on the Rate Express.</b> It says the same thing as the other three: a derivative asks "how fast", an integral asks "how much in total", and each undoes the other.',
		beyondS: 'Where calculus can take you after the exam: math in code, training a tiny AI yourself, a university major and real modeling projects.',
		examL: 'Exam · May 2027',
		xTag: 'Rate Express · d/dx ⇄ ∫', xEye: 'RATE EXPRESS', xTitle: 'The whole course is one round trip',
		xBody: ['Derivative: how fast is it changing?', 'Integral: how much has built up? Each undoes the other.'],
		xForm: [['2.2 derivative', 'f′(x)'], ['4.1 with units', 'dy/dt'], ['6.4 the FTC', '(∫f)′ = f'], ['8.3 adding up', '∫ rate dt']],
		xChip: 'Express transfer',
	},
};

/* 导览解说词（小火车开一圈） */
export const TOUR = {
	zh: {
		intro: '这是 AP 微积分 AB 的线路图。81 个考点，连成 8 条线。',
		l1: '1 号线：极限与连续。从「瞬间也会变化吗？」出发，一站一站往前走。',
		xfer: '看中间那条竖着的金线：变化率快线。',
		ride: '快线上的四站，说的是同一个来回——',
		mbmc: '导数问"变得多快"，积分问"一共攒了多少"。它们互为逆运算，这就是整门微积分。',
		lines: [
			'2 号线：导数的定义和基本法则。割线怎么变成切线。',
			'3 号线：链式法则和隐函数求导。AI 训练用的反向传播，就从这里来。',
			'4 号线：真实情境里的导数：运动、相关变化率、近似。',
			'5 号线：用导数分析函数。最大值、最小值、最优化。',
			'6 号线：积分与累积。把一小段一小段加起来。',
			'7 号线：微分方程。用变化率描述增长和衰减。',
			'8 号线：积分的应用。面积、体积、平均值。',
		],
		side: '虚线是支线。不考，但好玩。',
		crowd: '每一站都有站台留言。卡住了，就问问同站的人。',
		final: '最后，冲刺线开往考场。',
		exits: '出站之后：用代码玩微积分、亲手训练一个小 AI、大学里的数学。',
		end: '从你在的这一站开始吧。', go: '开始这一站 →', again: '再看一遍', skip: '跳过',
	},
	en: {
		intro: 'This is the route map for AP Calculus AB. 81 topics on 8 lines.',
		l1: 'Line 1: limits and continuity. It starts at "Change at an instant?" and goes stop by stop.',
		xfer: 'See the gold line running down the middle: the Rate Express.',
		ride: 'Its four stops all describe the same round trip:',
		mbmc: 'A derivative asks "how fast", an integral asks "how much in total". Each undoes the other. That is all of calculus.',
		lines: [
			'Line 2: what a derivative is, and the basic rules. How a secant turns into a tangent.',
			'Line 3: the chain rule and implicit differentiation. Backpropagation, the way AI is trained, comes from here.',
			'Line 4: derivatives in real situations: motion, related rates, approximation.',
			'Line 5: analyzing functions with derivatives. Maxima, minima, optimization.',
			'Line 6: integration and accumulation. Adding up lots of small pieces.',
			'Line 7: differential equations. Describing growth and decay by their rates.',
			'Line 8: applications of integration. Areas, volumes, average values.',
		],
		side: 'Dashed lines are side trips. Not tested, just fun.',
		crowd: 'Every stop has its own platform notes. Stuck? Ask the people at your stop.',
		final: 'Finally, the last stretch heads to the exam.',
		exits: 'Past the exit: calculus in code, training a tiny AI, math at university.',
		end: "Start from the stop you're at.", go: 'Start this stop →', again: 'Watch again', skip: 'Skip',
	},
};

/* 新手引导里和这门课有关的部分 */
export const OB = {
	zh: {
		wEye: '欢迎来到 Vibes · AP 微积分',
		wText: '50 秒看懂这张线路图：81 个考点怎么连在一起，为什么导数和积分是一个来回。',
		qs: [
			{ k: 'examYear', t: '你哪一年考 AP 微积分 AB？', o: [['2027', '2027 年 5 月'], ['2028', '2028 年 5 月'], ['0', '还没定']] },
			{ k: 'start', t: '你现在学到哪儿了？', o: [['1.1', '刚开始', '从 1 号线出发'], ['2.1', '学完了极限', '从 2 号线出发'], ['6.1', '导数基本学完了', '从 6 号线出发'], ['p1', '在复习', '从冲刺线出发']] },
			{ k: 'pace', t: '每周大概能花多少时间？', o: [['3', '约 1 小时', '每周 3 站'], ['6', '约 3 小时', '每周 6 站'], ['10', '5 小时以上', '每周 10 站']] },
		],
		cText: '你在 AP 微积分的线路上，走出了第一步。',
	},
	en: {
		wEye: 'WELCOME TO VIBES · AP CALCULUS',
		wText: 'In 50 seconds: how the 81 topics connect, and why derivatives and integrals are one round trip.',
		qs: [
			{ k: 'examYear', t: 'When do you take AP Calculus AB?', o: [['2027', 'May 2027'], ['2028', 'May 2028'], ['0', 'Not sure yet']] },
			{ k: 'start', t: 'How far along are you?', o: [['1.1', 'Just starting', 'Start on Line 1'], ['2.1', 'Done with limits', 'Start on Line 2'], ['6.1', 'Mostly done with derivatives', 'Start on Line 6'], ['p1', 'Reviewing', 'Start on the final stretch']] },
			{ k: 'pace', t: 'How much time per week?', o: [['3', 'About 1 hour', '3 stops a week'], ['6', 'About 3 hours', '6 stops a week'], ['10', '5+ hours', '10 stops a week']] },
		],
		cText: "You've taken your first step on the AP Calculus line.",
	},
};
