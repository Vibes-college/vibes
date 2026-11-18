/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 第 6 步 (2026-11-17): the 「确认」 card under Momo's reply when she asks to change something in a mini app for the
// learner (lojo/apps/ActionCard.vue). The sentence on the card comes from the mini app (its x-vibes-action), in both
// languages; the marker in the chat message (【请确认】) is not here: it is how the page recognises the message.
import { pickLang } from './lang.js';

const zh = {
	title: '请确认',
	hint: '点「确认」才会改；点「取消」什么都不改。',
	confirm: '确认',
	cancel: '取消',
	running: '正在改…',
	done: '改好了',
	open: (app: string) => `打开${app}`,
	cancelled: '已取消，什么都没改。',
	expired: '已过期（超过一天），什么都没改。还想改的话，再说一次。',
	failed: '没改成',
	down: '小程序暂时没有响应',
	refused: '小程序没有接受',
	retry: '再试一次',
	gone: '这张卡已经失效了。',
	loadFailed: '网络不太好，稍后再试。',
};

const en: typeof zh = {
	title: 'Please confirm',
	hint: 'Nothing changes until you tap Confirm. Cancel changes nothing.',
	confirm: 'Confirm',
	cancel: 'Cancel',
	running: 'Saving…',
	done: 'Done',
	open: (app: string) => `Open ${app}`,
	cancelled: 'Cancelled. Nothing was changed.',
	expired: 'Expired (after a day). Nothing was changed. Ask again if you still want it.',
	failed: 'Didn’t go through',
	down: 'the mini app isn’t answering right now',
	refused: 'the mini app didn’t accept it',
	retry: 'Try again',
	gone: 'This card is no longer valid.',
	loadFailed: 'Network trouble. Try again in a moment.',
};

export const appActionTable = { zh, en };
export const appActionText = pickLang(appActionTable);
