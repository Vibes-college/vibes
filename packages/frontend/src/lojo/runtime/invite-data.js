/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// Fictional invitations for exploring the local prototype, never real attendance.
const rows = [
 ['weekly-ai', 'ai', '周四一起做 AI 小工具', 'AI 小工具共创', '2026-10-08T19:30', 2, 'weekly', [114.157, 22.282], '中环 · 共创空间待定', ['林间', '小南'], '各带一个正在做的小工具，轮流演示，再留一小时一起改。', '带电脑，有一个想试的点子就可以。', 'ai-build'],
 ['weekly-web3', 'web3', '周二 Web3 技术共读', 'Web3 技术共读', '2026-10-06T19:00', 1.5, 'weekly', [114.15, 22.286], '上环 · 集合地点待定', ['阿衡'], '每周选一个协议或开源项目，读文档、看代码，留下共同笔记。', '围绕技术讨论，每次提前选好材料。', 'web3-notes'],
 ['weekly-run', 'running', '周三下班一起夜跑', '周三夜跑', '2026-10-07T19:30', 1, 'weekly', [114.164, 22.286], '中环海滨一带 · 集合点待定', ['阿树', '小满'], '每周三下班一起跑，路线和距离先在讨论里约好。', '轻松跑，能边跑边聊天；约 3 公里，可跑走结合。', 'night-run'],
 ['weekly-fitness', 'fitness', '每周两小时，一起健身', '周五一起健身', '2026-10-09T19:00', 2, 'weekly', [114.173, 22.279], '湾仔一带 · 场馆待定', ['阿哲'], '固定周五见面，各自按自己的训练安排练，结束后交流记录。', '各自训练，不提供教学；确认场馆后各自购票。', 'steady-fitness'],
 ['weekly-dogs', 'dogwalk', '周六早上一起遛狗', '周六遛狗', '2026-10-03T09:00', 1, 'weekly', [114.145, 22.286], '上环一带 · 集合点待定', ['豆豆'], '沿街区走一小时，提前聊聊各家狗狗的性格，路线一起定。', '全程牵绳，先确认彼此能否适应结伴。', 'dog-walk'],
 ['weekly-tennis', 'tennis', '周日一起练网球', '周日练网球', '2026-10-04T16:00', 1.5, 'weekly', [114.168, 22.276], '金钟一带 · 球场待定', ['小林'], '找两三个人固定练球，先约同一时段，再一起确认场地。', '能简单对拉即可；场地费按实际人数 AA。', 'ball-game'],
 ['climbing', 'climbing', '周六一起去攀岩', '周六攀岩', '2026-10-10T14:00', 2, 'once', [114.156, 22.28], '中环一带 · 岩馆待定', ['小鹿'], '想找一两个人去室内抱石，先确定岩馆、入场要求和时段。', '各自购买入场券；首次体验按场馆要求参加指导。', 'first-climb'],
 ['basketball', 'basketball', '周日晚打半场篮球', '周日篮球', '2026-10-04T19:00', 1.5, 'weekly', [114.178, 22.28], '湾仔一带 · 球场待定', ['木子', '阿文', '小海'], '下班后打一会儿半场，轮换休息，场地提前在讨论里确认。', '不计胜负，先说清经验和强度。', 'ball-game'],
 ['football', 'football', '周末五人制足球', '周末足球', '2026-10-11T16:00', 1.5, 'once', [114.183, 22.28], '湾仔一带 · 球场待定', ['阿远', '小岛', '阿白'], '想凑一场五人制，人数确定后再订场地。', '有基础即可，场地费用确认后 AA。', 'ball-game'],
 ['hiking', 'hiking', '周末一起登山', '周末登山', '2026-10-10T09:00', 4, 'once', [114.14, 22.283], '西营盘一带 · 集合点待定', ['米粒'], '先交流想走的路线、路程和经验，再决定这次行程。', '路线待定；出发前共同确认交通、天气和返程时间。', 'weekend-hike']
];
export const inviteExamples = rows.map(([id, category, name, short, start, hours, repeat, coord, venue, people, intro, level, guideId]) => {const startAt = new Date(start + ':00+08:00'), endAt = new Date(+startAt + hours * 3600000); return { id: 'invite-' + id, kind: 'invite', source: 'demo', scope: 'luma', sample: true, category, name, short, startAt: startAt.toISOString(), endAt: endAt.toISOString(), timezone: 'Asia/Hong_Kong', recurrence: repeat === 'weekly' ? { frequency: 'weekly', until: '2027-03-31' } : null, coord, venue, people, capacity: category === 'football' ? 10 : category === 'basketball' ? 6 : 4, host: people[0], intro, level, guideId, price: 0, currency: 'HK$', cost: category === 'tennis' || category === 'football' ? '场地确认后按实际费用 AA；尚未订场。' : category === 'fitness' || category === 'climbing' ? '各自购买场馆入场券，费用待场馆确认。' : '邀约不收组织费；个人消费自理。', feeMode: ['tennis', 'football'].includes(category) ? 'aa' : ['fitness', 'climbing'].includes(category) ? 'self' : 'free', meeting: venue, bring: '', flow: [], policy: '可随时退出同行，变更安排在讨论里沟通。', discussion: intro, replies: [], featured: ['weekly-ai', 'weekly-run', 'weekly-dogs'].includes(id) };});
