/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 《公会守则》（品牌策略定稿，2026-11-10，冲刺1111/新手前三分钟/文案.md 文末）。
// 注册弹窗的「公会守则」框和 /guild-rules 页都读这一份，改字只改这里。
export const GUILD_RULES_PATH = '/guild-rules';

export const GUILD_RULES: { head: string; body: string }[] = [
	{ head: '年满 18 岁才能加入。', body: '学生版还在做，做好了再开。' },
	{ head: '只聊学习，好好说话。', body: '不骂人、不引战、不发广告。' },
	{ head: '不加私下联系方式。', body: '别在帖子和私信里留微信、手机号；也别找人私下收钱代考、代写。' },
	{ head: '别人的东西注明出处。', body: '题目、笔记、截图，转之前说清从哪来；真题和付费资料别整份搬。' },
	{ head: '我们会管。', body: '违反上面几条，帖子会被删，严重的封号。看到不对劲，点帖子右上角「举报」。' },
];
