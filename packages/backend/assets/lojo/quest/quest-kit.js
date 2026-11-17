/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* 闯关页 quest.js 里不碰页面、也不读页面状态的小函数：转义、报错和倒计时的字、心的图、章名、情报摘要、填空的字数要求、
   结果的逐题回顾、计时器的字、日期、定级测试照稿子朗读的时长。2026-11-16 从 quest.js 原样搬来（拆大文件，行为不变）。
   index.html 要在 quest.js 前面装它；后端单元测试 test/unit/LojoQuestKit.ts 直接装这个文件来测。 */
(() => {
'use strict';

/* ================= 小工具 ================= */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
function errText(e) {
	const c = e?.code;
	if (c === 'NO_HEARTS') return '心打光了';
	if (c === 'LEVEL_LOCKED') return '这关还没开：先过前面连着它的一关';
	if (c === 'BOSS_NOT_READY') return '备战还没齐';
	if (c === 'NO_SUCH_ATTEMPT') return '这一局已经结束了，回地图重新开';
	if (c === 'NOT_RETESTABLE') return '这关现在不用回测';
	if (c === 'INVALID_EXAM_DATE') return '日期不对：要选明天以后、两年以内的一天';
	if (c === 'NO_AUDIO') return '录音暂时出不来，先看文字';
	if (c === 'NOT_SIGNED_IN') return '先登录社区';
	if (c === 'TRIAL_SAVE') return '存档后解锁';
	if (c === 'PLACEMENT_TOO_SOON') return '30 天里能测一次';
	if (c === 'PLACEMENT_NO_FIRST_PART') return '第一段没存上，从第一段重新测';
	if (c === 'RATE_LIMIT_EXCEEDED') return '点得太快了，歇一下再来';
	return '网卡了一下，再试一次';
}
function leftText(ms) {
	const s = Math.max(0, Math.round(ms / 1000));
	return [s / 3600 | 0, (s % 3600 / 60) | 0, s % 60].map(x => String(x).padStart(2, '0')).join(':');
}

/* ================= 心 ================= */
const heartSVG = on => `<svg viewBox="0 0 16 16"><path d="M8 4 c-1.5 -3 -7 -2.5 -6 1.5 c.6 2.4 3.6 4.4 6 6.5 c2.4 -2.1 5.4 -4.1 6 -6.5 c1 -4 -4.5 -4.5 -6 -1.5z" fill="${on ? '#E8603F' : '#E9E1D2'}" stroke="#141E52" stroke-width="1.2"/></svg>`;

/* ================= 地图：章名 ================= */
const chWord = c => String(c.title).split(' · ')[0]; // 「专项关」（旧地图是「第二章」）
const chSub = c => String(c.title).split(' · ')[1] ?? ''; // 旧地图的「换挡」；新地图没有

/* ================= 抽屉：情报预览 ================= */
// 情报预览：每个话题标签拉最新几条，合并去重（Boss 的帖子同时带两个标签），只放第一段约 80 字，点开进帖子
function newsSnippet(text) {
	// 帖子第一行是关卡开头语（Stop 1-4 · … / Chapter 1 boss · …），每条都一样，预览里跳过；也去掉标签、More/Source 行
	const t = String(text ?? '').replace(/^(Stop [\w-]+|Chapter \d+ boss) · [^.\n]*\.\s*/i, '')
		.split('\n').filter(l => !/^\s*(More|Source)s?:/i.test(l)).join(' ')
		.replace(/#\S+/g, '').replace(/\s+/g, ' ').trim();
	return t.length > 80 ? t.slice(0, 80) + '…' : t;
}

/* ================= 题 ================= */
const isPick = t => t === 'choice' || t === 'TFNG' || t === 'YNNG' || t === 'multi';
function limitText(l) {
	if (!l) return '';
	if (l.words && l.number) return `不超过 ${l.words} 个词，和/或一个数字`;
	if (l.words) return `不超过 ${l.words} 个词`;
	if (l.number) return '填一个数字';
	return '';
}
const nl = s => esc(s).replace(/\n/g, '<br>');
/* 结果里的逐题回顾：错题在前，超过 2 条先折起来 */
function reviewHtml(end) {
	const rows = end.review.map(r => `<div class="${r.correct ? '' : r.half ? 'half' : 'no'}"><i>${r.correct ? '✓' : r.half ? '½' : '✕'}</i><span>第 ${r.n} 题${r.correct ? `：${esc(r.answer)}` : r.timeout ? `：没答（时间到），答案 <b>${esc(r.answer)}</b>` : `：${r.half ? '对一半，' : ''}你填 ${esc(r.given || '（空）')}，答案 <b>${esc(r.answer)}</b>`}。${esc(r.why ?? '')}${!r.correct && r.evidence ? `<span class="evid" style="display:block">${esc(r.evidence)}</span>` : ''}</span></div>`);
	const wrong = end.review.map((r, i) => (r.correct ? -1 : i)).filter(i => i >= 0);
	const right = end.review.map((r, i) => (r.correct ? i : -1)).filter(i => i >= 0);
	const order = [...wrong, ...right];
	const fold = wrong.length > 2;
	return order.map((i, k) => (fold && k >= 2 ? rows[i].replace('<div class="', '<div data-more style="display:none" class="') : rows[i])).join('') +
		(fold ? `<button class="more" data-more-btn>还有 ${order.length - 2} 题 · 展开</button>` : '');
}

/* ================= 限时关 ================= */
const tmFmt = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const tmUsed = t => { const e = t?.elapsedSeconds ?? 0; return { m: Math.floor(e / 60), s: e % 60 }; };
const tplFill = (tpl, o) => String(tpl ?? '').replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));

/* ================= 考试日期 ================= */
const dayD = v => new Date(v + 'T00:00:00');
const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

/* ================= 定级测试：照稿子朗读的时长和进度 ================= */
const plWords = s => String(s).split(/\s+/).filter(Boolean).length;
const plDur = (s, part) => plWords(s) / 2.4 / (part.rate || 1);
const plCues = part => { let t = 0; return part.script.map(l => { const c = t; t += plDur(l, part); return c; }); };
const plLen = part => Math.max(5, Math.ceil(part.script.reduce((n, l) => n + plDur(l, part), 0)));
const plLineAt = (part, t) => { const c = plCues(part); let i = 0; while (i + 1 < c.length && c[i + 1] <= t + 0.01) i++; return i; };
// 接着放：倒回这句开头；这句刚开头不到 1 秒就再倒一句
function plResumePoint(part, at) {
	const c = plCues(part); if (!c.length) return Math.max(0, at - 3);
	let i = 0; while (i + 1 < c.length && c[i + 1] <= at) i++;
	if (at - c[i] < 1 && i > 0) i--;
	return c[i];
}
const plFmt = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const bjMD = iso => { const d = new Date(Date.parse(iso) + 8 * 3600e3); return `${d.getUTCMonth() + 1} 月 ${d.getUTCDate()} 日`; };

window.QuestKit = {
	esc, md, errText, leftText,
	heartSVG,
	chWord, chSub,
	newsSnippet,
	isPick, limitText, nl, reviewHtml,
	tmFmt, tmUsed, tplFill,
	dayD, ymd,
	plWords, plDur, plCues, plLen, plLineAt, plResumePoint, plFmt, bjMD,
};
})();
