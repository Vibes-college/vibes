/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 发到我的电脑: Vibi's draft for the learner's computer arrives as a marker message (agentDraftText in backend
// core/LojoTutorService.ts); the chat page draws it as DraftCard.vue. The learner's hand-back starts with RESULT_HEAD
// (bridge.ts) and is drawn as ResultCard.vue.

import { RESULT_HEAD } from './bridge.js';

const MARK = /^【给电脑的指令】（草稿号 ([0-9a-f]+)）\n([\s\S]+)$/;

export function parseAgentDraft(text: string | null | undefined): { draftId: string; text: string } | null {
	const m = text ? MARK.exec(text) : null;
	return m ? { draftId: m[1], text: m[2] } : null;
}

export function parseAgentResult(text: string | null | undefined): { head: string; did: string; body: string } | null {
	if (!text?.startsWith(RESULT_HEAD)) return null;
	const nl = text.indexOf('\n');
	if (nl === -1) return { head: text, did: '', body: '' };
	let body = text.slice(nl + 1);
	let did = '';
	const m = /^做了什么：(.*)\n\n/.exec(body);
	if (m) {
		did = m[1];
		body = body.slice(m[0].length);
	}
	return { head: text.slice(0, nl), did, body };
}

export const draftLabels = {
	title: '给电脑的指令',
	edit: '改一改',
	editDone: '改好了',
	send: '发到我的电脑',
	sending: '正在发…',
	notPaired: '连上你的电脑，就能一键发过去',
	goConnect: '去连接',
	noFolder: '还没选在哪个文件夹做',
	goChoose: '去选',
	working: '正在做',
	checking: '正在连上你的电脑…',
	unreachable: '暂时看不到进度',
	asking: '等你点头',
	done: '做完了',
	error: '出错了',
	stopped: '已停下',
	lost: '电脑上找不到这个任务了',
	offline: '连不上你的电脑（可能睡着了，或 Paseo 关了），正在重试…',
	elsewhere: '这个任务是在别的浏览器里发的，进度要在那边看。',
	stop: '停下',
	stopConfirm: '让电脑上的 agent 停下？已经做完的部分不会撤回。',
	earlier: (n: number) => `前面还有 ${n} 条`,
	fold: '收起',
	process: '看过程',
	steps: (n: number) => `${n} 步`,
	took: (t: string) => `用时 ${t}`,
	wants: '想要',
	changed: (n: number) => `改了 ${n} 个文件`,
	showAll: '展开全部',
	showLess: '收起',
	noAnswer: '它没有留下文字说明。',
	handBack: (n: string) => `让 ${n} 总结`,
	handedBack: (n: string) => `已交给 ${n}，TA 的总结在下面`,
	handBackHint: (n: string) => `把 agent 的回复交给 ${n}，TA 挑出要紧的告诉你。不点就不上传。`,
	sendFailed: '没发出去：',
	needText: '指令是空的',
	resultCardTitle: '电脑上 agent 的回复',
	resultCardNote: (n: string) => `外部内容，${n} 只当参考`,
	showMore: '展开',
};
