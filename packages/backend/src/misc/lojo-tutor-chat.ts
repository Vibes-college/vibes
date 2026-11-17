/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibi（AI tutor）回私信时不碰数据库和 redis 的小计算，从 core/LojoTutorService.ts 搬出来（2026-11-16 拆大文件，行为不变）：
// 聊天记录变成给模型的对话、Mastra 版只发她没看过的消息、"现在几点"那一行、开场理由、用量累加和解析、
// 保险丝提醒的文字、聊天搜索的条件和排序。服务里同名的方法只是入口。

import type { MiChatMessage } from '@/models/ChatMessage.js';
import { localDay, localHour } from '@/misc/lojo-tutor.js';
import type { ProactiveState, TutorMemory } from '@/misc/lojo-tutor.js';
import { isTutorAwayText } from '@/misc/lojo-tutor-quest.js';
import { hitScore } from '@/misc/lojo-tutor-progress.js';
import { fillPrompt } from '@/misc/lojo-tutor-prompts.js';
import type { TutorPrompts } from '@/misc/lojo-tutor-prompts.js';
import type { ChatHit } from '@/misc/lojo-tutor-progress.js';

export type TutorChatTurn = { role: 'user' | 'assistant' | 'system'; content: string };
// The same shape as ModelUsage in core/LojoUsageService.ts (misc does not import from core).
type Usage = { hit: number; miss: number; out: number };
type SearchTerms = { en: string[]; zh: string[] };

const DAY = 24 * 60 * 60 * 1000;

// The model account has no balance or a bad key (HTTP 402 / 401): the tutor is "away". Other errors give null.
export const tutorModelDownReason = (err: unknown): string | null => /^HTTP (401|402)\b/.exec(err instanceof Error ? err.message : '')?.[1] ?? null;

// Who gets a feature switched on in redis: "all", or user ids separated by commas; empty or missing = nobody.
export function tutorListHas(raw: string | null | undefined, userId: string): boolean {
	const who = raw?.trim() ?? '';
	return who === 'all' || who.split(',').map(x => x.trim()).includes(userId);
}

// Oldest first, consecutive messages merged. The tutor's turns are written in the JSON shape it answers with:
// plain-text turns in the history made DeepSeek's JSON mode return empty answers now and then.
export function tutorChatTurns(tutorId: string, messages: MiChatMessage[]): TutorChatTurn[] {
	const turns: { role: 'user' | 'assistant'; texts: string[] }[] = [];
	for (const message of messages) {
		// The 👉 line under a quest answer is added by the app, not written by her: left out, so she does not copy it.
		// The fixed "away" messages are not hers either, and left out so she does not copy them once she is back.
		if (message.fromUserId === tutorId && isTutorAwayText(message.text)) continue;
		// The change cards under her replies (私信任务标签) are the app's, not hers.
		if (message.fromUserId === tutorId && message.text?.startsWith('【任务改动】')) continue;
		// So are the draft cards for their computer (发到我的电脑): she wrote them with draftAgentTask and keeps that in her memory.
		if (message.fromUserId === tutorId && message.text?.startsWith('【给电脑的指令】')) continue;
		const text = (message.text ?? (message.fileId ? '(sent a file)' : '')).split('\n').filter(line => !line.startsWith('👉 ')).join('\n').trim();
		if (text === '') continue;
		const role = message.fromUserId === tutorId ? 'assistant' : 'user';
		if (turns.at(-1)?.role === role) turns.at(-1)!.texts.push(text);
		else turns.push({ role, texts: [text] });
	}
	return turns.map(turn => ({
		role: turn.role,
		content: turn.role === 'assistant' ? JSON.stringify({ messages: turn.texts, voice: false }) : turn.texts.join('\n'),
	}));
}

// What Mia on Mastra has not seen yet (messages oldest first). seen is "<the learner message she last answered>|<how
// many messages she sent after it>": the messages after it, minus the ones she sent herself. Without it (or when it is
// no longer in the chat), the messages since the tutor last wrote.
export function mastraFreshMessages(messages: MiChatMessage[], tutorId: string, seen: string | null): MiChatMessage[] {
	const seenId = seen?.split('|')[0] ?? null;
	const seenSent = Number(seen?.split('|')[1] ?? 0);
	const at = seenId != null ? messages.findIndex(m => m.id === seenId) : -1;
	if (at !== -1) {
		let skip = seenSent;
		return messages.slice(at + 1).filter(m => !(m.fromUserId === tutorId && skip-- > 0));
	}
	return messages.slice(messages.findLastIndex(m => m.fromUserId === tutorId) + 1);
}

// The learner's newest message if it still needs an answer, else null (messages oldest first). answered is the newest
// learner message an answer was already written for (kept in redis). Without it, or when it is no longer in the chat:
// the old rule, unanswered unless the tutor wrote last. That rule alone dropped a message sent while her answer was
// still going out in parts, because her next part came after it (AI tutor, 2026-11-17).
export function tutorUnanswered(messages: MiChatMessage[], tutorId: string, answered: string | null): MiChatMessage | null {
	const newest = messages.findLast(m => m.fromUserId !== tutorId);
	if (newest == null) return null;
	if (answered != null && messages.some(m => m.id === answered)) return newest.id === answered ? null : newest;
	return messages.at(-1)?.fromUserId === tutorId ? null : newest;
}

// Why she writes first today, for the prompt: the first chat, an exam within 21 days, or a daily check-in (the words are
// TutorPrompts openerFirst, openerExam, openerDaily).
export function tutorOpenerReason(prompts: Pick<TutorPrompts, 'openerFirst' | 'openerExam' | 'openerDaily'>, memory: TutorMemory, history: TutorChatTurn[], now = Date.now()): string {
	if (history.length === 0) return prompts.openerFirst;
	const examDate = memory.profile.examDate ? Date.parse(memory.profile.examDate) : NaN;
	const daysToExam = Math.ceil((examDate - now) / DAY);
	if (daysToExam > 0 && daysToExam <= 21) return fillPrompt(prompts.openerExam, { days: String(daysToExam) });
	return prompts.openerDaily;
}

// To the day and part of the day: Mia needs no more, and a time to the minute would change the prompt every call.
export function tutorNowText(tz: string, now = new Date()): string {
	const weekday = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'long' }).format(now);
	const hour = localHour(now, tz);
	const part = hour < 5 ? 'late at night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : hour < 23 ? 'evening' : 'late at night';
	return `${localDay(now, tz)} ${weekday} ${part} (${tz === 'Asia/Shanghai' ? 'Beijing time' : tz})`;
}

// Adds up the tokens of the calls behind one answer (retries included), to charge them as one.
export function tutorUsageMeter(): { add: (u: Usage) => void; total: () => Usage | null } {
	let sum: Usage | null = null;
	return {
		add: u => { sum = { hit: (sum?.hit ?? 0) + u.hit, miss: (sum?.miss ?? 0) + u.miss, out: (sum?.out ?? 0) + u.out }; },
		total: () => sum,
	};
}

// The tokens mia-mastra reported for one reply; null when it reported none or some calls' usage was lost.
export function mastraReportedUsage(usage: unknown): Usage | null {
	const u = usage as { hit?: unknown; miss?: unknown; out?: unknown; unreported?: unknown } | undefined;
	const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : null);
	return u && n(u.hit) != null && n(u.miss) != null && n(u.out) != null && !(n(u.unreported) ?? 0)
		? { hit: n(u.hit)!, miss: n(u.miss)!, out: n(u.out)! } : null;
}

// One learner's "writes first" state in redis (a hash of strings) and their own switch in settings.
export function tutorProactiveState(state: Record<string, string>, settings: unknown): ProactiveState {
	const num = (value: string | undefined) => (value != null && value !== '' ? Number(value) : null);
	return {
		muted: (settings as { proactive?: boolean } | undefined)?.proactive === false,
		lastProactiveAt: num(state.lastProactiveAt),
		// Before 2026-11-15 there was one first message a day, kept only as lastProactiveAt.
		lastCheckInAt: num(state.lastCheckInAt) ?? (state.proactiveTimes == null ? num(state.lastProactiveAt) : null),
		proactiveTimes: (state.proactiveTimes ?? (state.lastProactiveAt ?? '')).split(',').filter(x => x !== '').map(Number).filter(Number.isFinite),
		unanswered: num(state.unanswered) ?? 0,
		lastLearnerAt: num(state.lastLearnerAt),
		lastTutorAt: num(state.lastTutorAt),
	};
}

// The log line and the admins' notification when the site-wide fuse is half used or blown.
export function tutorFuseText(news: 'half' | 'full', used: number, limit: number): { log: string; header: string; body: string } {
	return news === 'half' ? {
		log: `tutor daily fuse 50%: ${used} of ${limit} model calls used today (UTC)`,
		header: 'Vibi 全站保险丝：今天已用一半',
		body: `今天（UTC）Vibi 已调用模型 ${used} 次，上限 ${limit}。到上限后所有人都暂停回复，北京时间早上 8 点恢复。上限可用 LOJO_TUTOR_DAILY_LIMIT 改。`,
	} : {
		log: `tutor daily fuse blown: ${limit} model calls used today (UTC); Vibi answers no one until 00:00 UTC`,
		header: 'Vibi 全站保险丝：今天已拉断',
		body: `今天（UTC）Vibi 已到上限 ${limit} 次，所有人暂停回复，北京时间早上 8 点恢复。用户聊天页底部会看到提示。`,
	};
}

// The word part of searchChat's query: $1 and $2 are the tutor and the learner, then one parameter per condition.
// English words through Postgres full-text search, Chinese pairs as substrings; only messages older than beforeId.
export function chatSearchFilter(tutorId: string, learnerId: string, terms: SearchTerms, beforeId: string | null | undefined): { params: unknown[]; match: string; before: string } {
	const params: unknown[] = [tutorId, learnerId];
	const conds: string[] = [];
	if (terms.en.length > 0) {
		params.push(terms.en.map(w => w.replace(/[^a-z-]/g, '')).filter(w => w !== '').join(' | '));
		conds.push(`to_tsvector('simple', m."text") @@ to_tsquery('simple', $${params.length})`);
	}
	for (const z of terms.zh) {
		params.push(`%${z}%`);
		conds.push(`m."text" LIKE $${params.length}`);
	}
	let before = '';
	if (beforeId) {
		params.push(beforeId);
		before = `AND m."id" < $${params.length}`;
	}
	return { params, match: conds.join(' OR '), before };
}

// The rows it found, scored: the fixed "away" messages left out, best first, then newest.
export function chatSearchHits(rows: { id: string; fromUserId: string; text: string }[], tutorId: string, terms: SearchTerms, dateOf: (id: string) => Date, opts: { limit?: number; minScore?: number }): ChatHit[] {
	return rows
		.filter(r => !(r.fromUserId === tutorId && isTutorAwayText(r.text)))
		.map(r => ({ id: r.id, at: dateOf(r.id).toISOString(), who: (r.fromUserId === tutorId ? 'tutor' : 'learner') as ChatHit['who'], text: r.text, score: hitScore(r.text, terms) }))
		.filter(h => h.score >= (opts.minScore ?? 1))
		.sort((a, b) => b.score - a.score || (a.id < b.id ? 1 : -1))
		.slice(0, opts.limit ?? 5);
}
