/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 角落的 Momo 头像可以拖开（创始人 11-17 20:53 PT「挡住东西了就能移动开」）：lojo/agent/dock.ts。
import { beforeEach, describe, expect, test } from 'vitest';
import { clampDrag, DRAG_SLOP, isDrag, loadSpot, saveSpot, sideFor, TOP_GAP } from '@/lojo/agent/dock.js';

const KEY = 'vibes:vibi-spot';
const HEAD = { width: 52, height: 78 };
// 390 × 844 的手机，底栏 84px + 16px 边距
const PHONE = { width: 390, height: 844, minTop: TOP_GAP, minBottom: 100 };

describe('角落的 Momo 可以拖开（lojo/agent/dock.ts）', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	test('手指只挪了几个像素算轻点，照样打开聊天；挪多了才算拖', () => {
		expect(isDrag(0, 0)).toBe(false);
		expect(isDrag(3, 4)).toBe(false);
		expect(isDrag(DRAG_SLOP, 0)).toBe(true);
		expect(isDrag(0, -20)).toBe(true);
	});

	test('松手时贴到近的那一边', () => {
		expect(sideFor(40, 390)).toBe('left');
		expect(sideFor(194, 390)).toBe('left');
		expect(sideFor(196, 390)).toBe('right');
		expect(sideFor(380, 390)).toBe('right');
	});

	test('拖不出屏幕左右两边', () => {
		expect(clampDrag({ left: -50, top: 300 }, HEAD, PHONE).left).toBe(0);
		expect(clampDrag({ left: 999, top: 300 }, HEAD, PHONE).left).toBe(390 - 52);
	});

	test('盖不住手机底栏，顶上留出气泡的地方', () => {
		expect(clampDrag({ left: 100, top: 840 }, HEAD, PHONE).top).toBe(844 - 100 - 78);
		expect(clampDrag({ left: 100, top: -30 }, HEAD, PHONE).top).toBe(TOP_GAP);
		expect(clampDrag({ left: 100, top: 300 }, HEAD, PHONE)).toEqual({ left: 100, top: 300 });
	});

	test('屏幕小到放不下也不出错：停在最上面能停的地方', () => {
		expect(clampDrag({ left: 0, top: 50 }, HEAD, { width: 40, height: 120, minTop: 40, minBottom: 100 })).toEqual({ left: 0, top: 40 });
	});

	test('从没拖过：没有存的位置，用默认的右下角', () => {
		expect(loadSpot()).toBeNull();
	});

	test('位置只存在这台设备上，下次打开还在原处', () => {
		saveSpot({ side: 'left', y: 312.6 });
		expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toEqual({ side: 'left', y: 313 });
		expect(loadSpot()).toEqual({ side: 'left', y: 313 });
	});

	test('存的东西坏了就当没拖过', () => {
		for (const bad of ['{', '"left"', '{"side":"up","y":10}', '{"side":"left"}', '{"side":"right","y":"10"}', 'null']) {
			localStorage.setItem(KEY, bad);
			expect(loadSpot()).toBeNull();
		}
		localStorage.setItem(KEY, '{"side":"right","y":-20}');
		expect(loadSpot()).toEqual({ side: 'right', y: 0 });
	});
});
