/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// What Vibes added to 设置: the 关于 group, 生产者视角 (settings/create.vue) and 连接我的电脑 (lojo/agent/ConnectSection.vue).
// n: the name the learner gave their Momo.
import { pickLang } from './lang.js';

const zh = {
	guildRules: '公会守则',
	builtOn: '基于 Misskey · 源代码',

	// 生产者视角
	creatorTitle: '生产者视角',
	creatorCaption: '打开后，自己的帖子和 Vibes 编辑部的帖子下面，「翻译讲解」换成「创作讲解」：AI 按我们拆过的爆款做法出营销方案，你说说自己怎么想，它写成文案，再交给你的 agent 做成图和视频。只想学习的时候，关上。',
	creatorSources: '别人的帖子先不能拿来改编，要等授权的规矩定下来。',
	creatorOff: '关着 · 学习者',
	creatorOn: '开着 · 生产者',
	openStudio: '打开创作台',
	saveFailed: '没存上，稍后再试',

	// 连接我的电脑
	connectTitle: '连接我的电脑',
	connectLead: (n: string) => `${n} 起草的指令，你点一下就能发到自己电脑上的 Claude Code 或 Codex 去做。`,
	more: '更多',
	folder: '工作文件夹',
	change: '更换',
	offlineNote: '连不上：确认电脑开着、Paseo 在运行，再点右上角「⋯」里的「检查连接」。',
	step1: '在电脑上打开 Paseo',
	step1Sub: { before: '还没装？到 ', after: ' 下载，免费、开源。' },
	step2: '复制配对链接，贴到这里',
	connectedTo: (host: string) => `已连上 ${host}`,
	crumbs: ['设置', '配对设备', '复制链接'],
	connecting: '连接中…',
	connect: '连接',
	step3: '选一个工作文件夹',
	step3Sub: '电脑上的 agent 会在这个文件夹里干活。',
	step3SubLater: '电脑上的 agent 会在这个文件夹里干活。以后可以换。',
	readingFolders: '正在读电脑上的文件夹…',
	otherFolder: '别的文件夹，比如 ~/Desktop/my-app',
	folderPath: '文件夹路径，比如 ~/Desktop/my-app',
	done: '完成',
	cancel: '取消',
	howTitle: '这是怎么工作的？',
	how1: '配对链接只存在这个浏览器里，不传到 Vibes 的服务器，也不写进日志。',
	how2: '消息走 Paseo 的端到端加密中继，中继看不到内容。',
	how3: (n: string) => `${n} 只能起草，发不发每次都由你点；agent 要运行命令或改文件时，也会先在卡片上问你。`,
	how4: '换浏览器、换手机要重新连一次。第一次连接要下载约 640 KB 的连接组件。',
	myComputer: '我的电脑',
	online: '在线',
	onlineMs: (s: string) => `在线 · ${s} 秒`,
	offline: '离线',
	checking: '正在检查…',
	badLink: '这不是 Paseo 的配对链接。它应该以 https://app.paseo.sh/#offer= 开头。',
	connectFailed: '没连上。确认电脑开着、Paseo 在运行，再试一次。',
	folderSaved: (n: string) => `好了，${n} 的指令会发到这个文件夹`,
	checkConnection: '检查连接',
	disconnect: '断开这台电脑',
	disconnectConfirm: (n: string) => `断开后，这个浏览器会删掉配对链接，${n} 的指令就发不过去了。要再用得重新贴一次链接。`,
	disconnectOk: '断开',
};

const en: typeof zh = {
	guildRules: 'Guild rules',
	builtOn: 'Built on Misskey · Source code',

	creatorTitle: 'Creator view',
	creatorCaption: 'When this is on, under your own posts and Vibes editorial posts, “Explain” becomes “Creator notes”: AI suggests marketing plans based on the viral formats we have broken down, you say what you think, it writes the copy, and your agent turns it into images and video. Turn it off when you just want to learn.',
	creatorSources: 'Other people\'s posts can\'t be adapted yet, until the rules on permission are settled.',
	creatorOff: 'Off · Learner',
	creatorOn: 'On · Creator',
	openStudio: 'Open Studio',
	saveFailed: 'Didn\'t save. Try again later.',

	connectTitle: 'Connect my computer',
	connectLead: (n: string) => `Send the instructions ${n} drafts to Claude Code or Codex on your own computer in one tap.`,
	more: 'More',
	folder: 'Working folder',
	change: 'Change',
	offlineNote: 'Can\'t connect. Make sure your computer is on and Paseo is running, then choose “Check connection” in the “⋯” menu at the top right.',
	step1: 'Open Paseo on your computer',
	step1Sub: { before: 'Not installed? Get it at ', after: '. It\'s free and open source.' },
	step2: 'Copy the pairing link and paste it here',
	connectedTo: (host: string) => `Connected to ${host}`,
	crumbs: ['Settings', 'Pair device', 'Copy link'],
	connecting: 'Connecting…',
	connect: 'Connect',
	step3: 'Choose a working folder',
	step3Sub: 'The agent on your computer works in this folder.',
	step3SubLater: 'The agent on your computer works in this folder. You can change it later.',
	readingFolders: 'Reading folders on your computer…',
	otherFolder: 'Another folder, e.g. ~/Desktop/my-app',
	folderPath: 'Folder path, e.g. ~/Desktop/my-app',
	done: 'Done',
	cancel: 'Cancel',
	howTitle: 'How does this work?',
	how1: 'The pairing link stays in this browser only. It is not sent to the Vibes server or written to any log.',
	how2: 'Messages go through Paseo\'s end-to-end encrypted relay, which can\'t read them.',
	how3: (n: string) => `${n} can only draft. You decide each time whether to send, and the agent asks you on the card before it runs a command or changes a file.`,
	how4: 'A new browser or phone needs to connect again. The first connection downloads about 640 KB.',
	myComputer: 'My computer',
	online: 'Online',
	onlineMs: (s: string) => `Online · ${s}s`,
	offline: 'Offline',
	checking: 'Checking…',
	badLink: 'This isn\'t a Paseo pairing link. It should start with https://app.paseo.sh/#offer=',
	connectFailed: 'Couldn\'t connect. Make sure your computer is on and Paseo is running, then try again.',
	folderSaved: (n: string) => `Done. ${n}'s instructions will go to this folder.`,
	checkConnection: 'Check connection',
	disconnect: 'Disconnect this computer',
	disconnectConfirm: (n: string) => `This browser will forget the pairing link, and ${n}'s instructions can't be sent any more. To use it again, paste the link again.`,
	disconnectOk: 'Disconnect',
};

export const settingsTable = { zh, en };
export const settingsText = pickLang(settingsTable);
