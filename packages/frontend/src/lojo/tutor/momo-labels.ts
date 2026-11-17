/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 「认识你的 Momo」的字（创始人 2026-11-17 00:13 PT 定的小样：冲刺1111/Vibi/纯头像-1116/page.html），不进上游的翻译。
export const momoLabels = {
	stepTitle: '认识你的 Momo',
	editTitle: '换个样子 / 改名字',
	skip: '先跳过',

	pickTitle: '先挑一张你喜欢的脸',
	pickLead: '这是你的学搭子，只属于你',
	face: '你的学搭子的脸',
	recent: '刚才的',
	recentPick: '换回这张',
	shuffle: '换一个',
	pick: '就 TA 了',

	nameTitle: '给 TA 起个名字',
	nameLead: '以后私信里就叫这个名字',
	nameLabel: '名字',
	nameIdeas: '试试这些名字',
	// The real header after the name (pages/chat/room.vue nameSuffix, tutorPublic.title on the server).
	previewSuffix: '学搭子',
	previewCaption: '私信顶上会这样显示',
	back: '上一步',
	named: '好了',
	save: '保存',

	arrived: (name: string) => `${name} 来了`,
	ai: 'AI',
	startChat: '开始聊',
	profileFirst: '先设置资料',

	nameNotAllowed: '这个名字用不了，换一个吧',
	failed: '没存上，等一下再试',
	saved: '存好了',
};
