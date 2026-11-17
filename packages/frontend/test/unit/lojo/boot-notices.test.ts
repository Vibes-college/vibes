/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { showsMisskeyUpdatedPopup } from '@/lojo/boot-notices.js';

// 升级后的英文「Misskey has been updated!」弹窗不弹（创始人 2026-11-16）。第二条看 main-boot.ts 原文：以后跟上游
// 合并时，要是把那一句入口弄丢了，弹窗会悄悄回来，这条会变红。
describe('开机提示', () => {
	test('Misskey 升级弹窗不弹', () => {
		expect(showsMisskeyUpdatedPopup()).toBe(false);
	});

	test('main-boot.ts 弹 MkUpdated 之前先问 showsMisskeyUpdatedPopup()', () => {
		// 前端测试在 packages/frontend 下跑（这里的 import.meta.url 不是文件路径）
		const src = readFileSync(resolve(process.cwd(), 'src/boot/main-boot.ts'), 'utf8');
		const at = src.indexOf("import('@/components/MkUpdated.vue')");
		expect(at).toBeGreaterThan(0);
		const gate = src.slice(src.lastIndexOf('if (', at), at);
		expect(gate).toContain('showsMisskeyUpdatedPopup()');
	});
});
