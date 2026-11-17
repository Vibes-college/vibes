/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from '@/os.js';

// 「换个样子 / 改名字」 (the chat's ⋯ menu): the face and name steps of 「认识你的 Momo」 in a window of their own.
export async function openMomoEdit(): Promise<void> {
	const { dispose } = await os.popupAsyncWithDialog(import('./MomoSetupWindow.vue').then(x => x.default), {}, {
		closed: () => dispose(),
	});
}
