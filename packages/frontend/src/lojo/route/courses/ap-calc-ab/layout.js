/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* AP 微积分 AB 线路图版式（画布 3400 × 2160，单位 px）。
   8 条线横向排成 8 行，一行一个单元；金色的"变化率快线"竖着穿过 2.2、4.1、6.4、8.3，把导数和积分连起来。
   站点坐标由下面的规则算出来：每行从 X0[单元] 开始，每隔 SP 一站；站名上下交替。 */
import { UNITS, INTERESTS } from './content.js';

const SP = 150; // 相邻两站的距离
const ROW = u => 220 + (u - 1) * 230; // 第 u 条线所在的高度
const XE = 1100; // 快线所在的横坐标
// 每条线第一站的横坐标：有快线站的线，让快线站正好落在 XE；其他线让快线从两站正中间穿过
const X0 = { 1: 300, 2: XE - SP, 3: XE - 2.5 * SP, 4: XE, 5: XE - 3.5 * SP, 6: XE - 3 * SP, 7: XE - 2.5 * SP, 8: XE - 2 * SP };

export const CANVAS = { w: 3400, h: 2160 };
export const POS = { start: [170, ROW(1), 'w'] };
export const LINES = [];
for (const u of UNITS) {
	const y = ROW(u.n), x0 = X0[u.n], x1 = x0 + (u.topics.length - 1) * SP;
	u.topics.forEach((t, i) => { POS[t.id] = [x0 + i * SP, y, i % 2 ? 's' : 'n']; });
	LINES.push({ id: u.id, unit: u.n, path: [[x0, y], [x1, y]], tag: u.n === 1 ? [x0 + 40, y - 150] : [x0 - 300, y + 10] }); // 1 号线的线路牌放高一点，让出"你在这里"
}
// 竖着的快线附近，站名往外再挪一层，免得压在金线上或和相邻站名叠在一起：
// 快线站的站名放到右边；快线从两站之间穿过时，左边那站往左、右边那站往右
const OUT = (lab, east) => (lab[0] === 'n' ? 'n' : 's') + (east ? 'e' : 'w') + '2';
for (const u of UNITS) {
	const xs = u.topics.map(t => POS[t.id]);
	const on = xs.find(p => p[0] === XE);
	if (on) { on[2] = OUT(on[2], true); continue; }
	if (u.n === 1) continue; // 快线从 2 号线才开始
	const i = xs.findIndex(p => p[0] > XE);
	if (i > 0) { xs[i - 1][2] = OUT(xs[i - 1][2], false); xs[i][2] = OUT(xs[i][2], true); }
}

export const EXPRESS = { path: [[XE, ROW(2)], [XE, ROW(8)]], tag: [XE + 40, ROW(8) + 118] };

// 冲刺线接在 8 号线后面，开往考场；考场往上是四个出口
const P0 = POS['8.12'];
export const PREP = { path: [[P0[0], P0[1]], [P0[0] + 150, P0[1] + 150], [P0[0] + 640, P0[1] + 150]] };
Object.assign(POS, {
	p1: [P0[0] + 240, P0[1] + 150, 'n'], p2: [P0[0] + 380, P0[1] + 150, 's'], p3: [P0[0] + 520, P0[1] + 150, 'n'],
	exam: [P0[0] + 640, P0[1] + 150, 's'],
});
const EX = P0[0] + 640;
export const EXITS = { path: [[EX, P0[1] + 150], [EX, P0[1] - 470]] };
Object.assign(POS, { b1: [EX, P0[1] + 30, 'e'], b2: [EX, P0[1] - 90, 'e'], b3: [EX, P0[1] - 210, 'e'], b4: [EX, P0[1] - 330, 'e'] });

// 兴趣支线：站名在上面的站往下岔，站名在下面的站往上岔；个别会撞到别的站名的，单独给终点偏移
const SIDE_OFF = { i4: [170, -118] };
export const SIDE = {};
for (const i of INTERESTS) {
	const [x, y, lab] = POS[i.parent], down = lab[0] === 'n', [dx, dy] = SIDE_OFF[i.id] || [80, down ? 118 : -118];
	SIDE[i.id] = { from: i.parent, to: [x + dx, y + dy], lab: 'e' };
}

/* 整张网的范围（含起点文字），用于"回到全图" */
export const BBOX = { x: -120, y: 20, w: 3460, h: 2100 };
/* 快线说明卡的位置：右上角的空白处 */
export const XCARD = { x: 2640, y: 330 };
/* 导览最后一段：从最后一个快线站沿 8 号线开往考场 */
export const FINAL = [POS['8.3'].slice(0, 2), P0.slice(0, 2), [P0[0] + 150, P0[1] + 150], POS.exam.slice(0, 2)];
