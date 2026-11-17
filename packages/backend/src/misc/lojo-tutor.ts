/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes AI tutor: persona card, the learner notes it keeps, when it may write first, and how its prompts are put
// together. The words of the prompts are not here: they are private and read from the tutor account's registry
// (misc/lojo-tutor-prompts.ts, founder 2026-11-17 02:49 PT).
// The notes follow mem0's open-source memory design (read the latest exchange, then add, update or delete what is
// known), https://github.com/mem0ai/mem0 (Apache-2.0), rewritten around a learner's goals and progress.

import { DEFAULT_VOICE, fillPrompt } from '@/misc/lojo-tutor-prompts.js';
import type { TutorPrompts } from '@/misc/lojo-tutor-prompts.js';

export class LojoTutorInvalidResponse extends Error {}

// Tutor accounts, by user id (LOJO_TUTOR_IDS="id1,id2"). They may message any learner first (founder, 2026-10-25),
// so ChatService skips the "who can message me" check for them; blocking a tutor still works.
const tutorIds = (process.env.LOJO_TUTOR_IDS ?? '').split(',').map(id => id.trim()).filter(id => id !== '');

export function lojoTutorIds(): string[] {
	return tutorIds;
}

export function isLojoTutor(userId: string): boolean {
	return tutorIds.includes(userId);
}

// AI 学搭子对外的名字、头衔、简介：全站只在这里改（2026-11-11 定名 Vibi，原来叫 Mia；创始人 2026-11-17 00:13 PT
// 改成 Momo，取小红书等社区里「momo」这个梗）。
// - name：默认名字。公开的 @tutor_mia 账号显示这个，网站每次启动时写进账号（LojoTutorService.applyPublicProfile）。
//   每个学员可以给自己那只另起名字、另挑脸（misc/lojo-tutor-persona.ts），学员自己看到的地方和她的自称都用学员起的。
//   @tutor_mia 这个用户名改不了，也不用改；代码里的 mia、vibi 字样是内部标识，用户看不到。
// - title：私信页顶部名字后面那段，写成「Momo · 学搭子」。只在中文界面显示，英文界面只写名字（创始人原话：不要 study buddy）。
//   名字旁边另有一个「AI」小标签，不算头衔，一直显示。前端从 lojo/tutor/public 读，改这里不用改前端。
// - bio：个人资料上的简介，启动时写进账号。要写明是 AI、不是真人。
// 闯关地图上的名字跟着学员起的走（assets/lojo/quest/quest.js 从 lojo/tutor/persona/show 读）。
// 守《广告法》：不写「最」，不承诺分数，不提别家。
export const tutorPublic = {
	name: 'Momo',
	title: '学搭子',
	bio: '我是 Momo，Vibes 上的 AI 学搭子（不是真人）。每个人的 Momo 长得都不一样，名字也可以自己起。你在各个板块学到哪了我都知道，可以陪你练、给你出题、帮你看看哪里还能更好，再告诉你下一步去哪。想聊什么，直接发消息给我就行。',
};

// The Character Card V3 fields the tutor uses (https://github.com/kwaroran/character-card-spec-v3, MIT).
export type TutorCard = {
	name: string;
	description: string;
	personality: string;
	scenario: string;
	first_mes: string;
	system_prompt: string;
	post_history_instructions: string;
	extensions: { vibes?: { voice?: string } };
};

// No persona text of its own: the fallback card comes with her private words (TutorPrompts.card).
const blankCard: TutorCard = {
	name: '', description: '', personality: '', scenario: '', first_mes: '', system_prompt: '', post_history_instructions: '',
	extensions: { vibes: { voice: DEFAULT_VOICE } },
};

const str = (value: unknown, max: number): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');

// The tutor account's card (registry key card); fields it leaves empty come from fallback.
export function normalizeTutorCard(raw: unknown, fallback: TutorCard = blankCard): TutorCard {
	const card = (raw != null && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	const pick = (key: keyof TutorCard, max: number) => str(card[key], max) || (fallback[key] as string);
	const vibes = ((card.extensions as Record<string, unknown> | undefined)?.vibes ?? {}) as Record<string, unknown>;
	return {
		name: pick('name', 40),
		description: pick('description', 1200),
		personality: pick('personality', 600),
		scenario: pick('scenario', 1200),
		first_mes: pick('first_mes', 600),
		system_prompt: str(card.system_prompt, 2000),
		post_history_instructions: str(card.post_history_instructions, 1000),
		extensions: { vibes: { voice: str(vibes.voice, 40) || fallback.extensions.vibes?.voice || DEFAULT_VOICE } },
	};
}

// What the tutor knows about one learner. Stored in the learner's own registry, so they can read and delete it.
export type TutorProfile = {
	goal?: string;
	exam?: string;
	examDate?: string;
	targetScore?: string;
	level?: string;
	interests?: string[];
	weakPoints?: string[];
	routine?: string;
	preferences?: string;
};
export type TutorFact = { id: string; text: string; updatedAt: string };
export type TutorMemory = { profile: TutorProfile; facts: TutorFact[]; summary: string; updatedAt: string | null };

const MAX_FACTS = 60;
const profileTextKeys = ['goal', 'exam', 'examDate', 'targetScore', 'level', 'routine', 'preferences'] as const;
const profileListKeys = ['interests', 'weakPoints'] as const;

export const emptyMemory = (): TutorMemory => ({ profile: {}, facts: [], summary: '', updatedAt: null });

function cleanProfile(raw: unknown): TutorProfile {
	const p = (raw != null && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	const out: TutorProfile = {};
	for (const key of profileTextKeys) {
		const value = str(p[key], 200);
		if (value !== '') out[key] = value;
	}
	for (const key of profileListKeys) {
		if (!Array.isArray(p[key])) continue;
		const list = [...new Set((p[key] as unknown[]).map(x => str(x, 80)).filter(x => x !== ''))].slice(0, 12);
		if (list.length > 0) out[key] = list;
	}
	return out;
}

export function normalizeMemory(raw: unknown): TutorMemory {
	const m = (raw != null && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	const facts = Array.isArray(m.facts)
		? (m.facts as unknown[]).flatMap(f => {
			const fact = (f ?? {}) as Record<string, unknown>;
			const id = str(fact.id, 40);
			const text = str(fact.text, 300);
			return id !== '' && text !== '' ? [{ id, text, updatedAt: str(fact.updatedAt, 40) }] : [];
		}).slice(-MAX_FACTS)
		: [];
	return { profile: cleanProfile(m.profile), facts, summary: str(m.summary, 600), updatedAt: str(m.updatedAt, 40) || null };
}

export type MemoryUpdate = {
	profile: TutorProfile;
	facts: ({ op: 'add'; text: string } | { op: 'update'; id: string; text: string } | { op: 'delete'; id: string })[];
	summary: string | null;
};

export function normalizeMemoryUpdate(raw: unknown): MemoryUpdate {
	if (raw == null || typeof raw !== 'object') throw new LojoTutorInvalidResponse('notes update is not an object');
	const u = raw as Record<string, unknown>;
	const facts: MemoryUpdate['facts'] = [];
	for (const f of Array.isArray(u.facts) ? u.facts as unknown[] : []) {
		const fact = (f ?? {}) as Record<string, unknown>;
		const id = str(fact.id, 40);
		const text = str(fact.text, 300);
		if (fact.op === 'add' && text !== '') facts.push({ op: 'add', text });
		else if (fact.op === 'update' && id !== '' && text !== '') facts.push({ op: 'update', id, text });
		else if (fact.op === 'delete' && id !== '') facts.push({ op: 'delete', id });
	}
	const summary = str(u.summary, 600);
	return { profile: cleanProfile(u.profile), facts, summary: summary !== '' ? summary : null };
}

export function applyMemoryUpdate(memory: TutorMemory, update: MemoryUpdate, now: Date, newId: () => string): TutorMemory {
	const stamp = now.toISOString();
	let facts = [...memory.facts];
	for (const change of update.facts) {
		if (change.op === 'add') {
			if (!facts.some(f => f.text.toLowerCase() === change.text.toLowerCase())) facts.push({ id: newId(), text: change.text, updatedAt: stamp });
		} else if (change.op === 'update') {
			facts = facts.map(f => (f.id === change.id ? { ...f, text: change.text, updatedAt: stamp } : f));
		} else {
			facts = facts.filter(f => f.id !== change.id);
		}
	}
	return {
		profile: { ...memory.profile, ...update.profile },
		facts: facts.slice(-MAX_FACTS),
		summary: update.summary ?? memory.summary,
		updatedAt: stamp,
	};
}

// next: in quest mode, the id of the one step she suggests (checked against the list by the caller).
export type TutorReply = { messages: string[]; voice: boolean; next?: string };

// Chat-app style: one to three short messages.
export function normalizeTutorReply(raw: unknown): TutorReply {
	if (raw == null || typeof raw !== 'object') throw new LojoTutorInvalidResponse('reply is not an object');
	const r = raw as Record<string, unknown>;
	const messages = (Array.isArray(r.messages) ? r.messages as unknown[] : [r.message])
		.map(x => str(x, 600))
		.filter(x => x !== '')
		.slice(0, 3);
	if (messages.length === 0) throw new LojoTutorInvalidResponse('no messages');
	const next = str(r.next, 60);
	return { messages, voice: r.voice === true, ...(next !== '' ? { next } : {}) };
}

// When the tutor may write first. Times are milliseconds since the epoch.
export type ProactiveState = {
	muted: boolean;
	lastProactiveAt: number | null; // the last message she wrote first, of any kind
	lastCheckInAt: number | null; // the last daily check-in (writeFirst), at most one a day
	proactiveTimes: number[]; // when she wrote first lately (check-ins and plan messages), newest last
	unanswered: number; // first messages sent since the learner last wrote
	lastLearnerAt: number | null;
	lastTutorAt: number | null;
};

const HOUR = 60 * 60 * 1000;

export function localDay(date: Date, tz: string): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function localHour(date: Date, tz: string): number {
	return Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hourCycle: 'h23' }).format(date));
}

// Messages she writes first, all kinds together (the daily check-in and the three plan messages: next week planned, a
// task three days late, three days without opening the task tab), per learner per day in the given time zone.
// Founder 2026-11-15: 「每天 1 条不至于，可以改为每天最多 5 条」. LOJO_TUTOR_PROACTIVE_PER_DAY changes it.
export function proactivePerDay(): number {
	const n = Number(process.env.LOJO_TUTOR_PROACTIVE_PER_DAY);
	return Number.isInteger(n) && n >= 0 ? n : 5;
}

export function proactiveSentToday(times: number[], now: Date, tz: string): number {
	const today = localDay(now, tz);
	return times.filter(t => localDay(new Date(t), tz) === today).length;
}

export function proactiveDecision(state: ProactiveState, now: Date, opts: { tz: string; startHour: number; endHour: number; perDay?: number }): { ok: boolean; reason: string } {
	if (state.muted) return { ok: false, reason: 'muted' };
	const hour = localHour(now, opts.tz);
	if (hour < opts.startHour || hour >= opts.endHour) return { ok: false, reason: 'quiet hours' };
	if (proactiveSentToday(state.proactiveTimes, now, opts.tz) >= (opts.perDay ?? proactivePerDay())) return { ok: false, reason: 'daily limit' };
	// The check-in itself stays once a day; the rest of the day's allowance is for the plan messages.
	if (state.lastCheckInAt != null && localDay(new Date(state.lastCheckInAt), opts.tz) === localDay(now, opts.tz)) return { ok: false, reason: 'already today' };
	const lastChat = Math.max(state.lastLearnerAt ?? 0, state.lastTutorAt ?? 0);
	if (now.getTime() - lastChat < 2 * HOUR) return { ok: false, reason: 'chatting recently' };
	if (state.unanswered >= 3) return { ok: false, reason: 'stopped after 3 unanswered' };
	if (state.unanswered >= 1 && state.lastProactiveAt != null && now.getTime() - state.lastProactiveAt < 72 * HOUR) return { ok: false, reason: 'waiting for a reply' };
	return { ok: true, reason: 'ok' };
}

function describeMemory(memory: TutorMemory, empty: string): string {
	const p = memory.profile;
	const lines = [
		p.goal && `Goal: ${p.goal}`,
		p.exam && `Exam: ${p.exam}${p.examDate ? ` on ${p.examDate}` : ''}${p.targetScore ? `, aiming for ${p.targetScore}` : ''}`,
		p.level && `Level (guess): ${p.level}`,
		p.interests?.length && `Interests: ${p.interests.join(', ')}`,
		p.weakPoints?.length && `Recurring mistakes: ${p.weakPoints.join('; ')}`,
		p.routine && `Routine: ${p.routine}`,
		p.preferences && `Preferences: ${p.preferences}`,
		...memory.facts.map(f => `- ${f.text}`),
		memory.summary && `Where you left off: ${memory.summary}`,
	].filter(Boolean);
	return lines.length > 0 ? lines.join('\n') : empty;
}

// The prompt is split for DeepSeek's prefix cache (only an identical start of the request is billed at the cache price,
// about 1/50 of a miss): tutorSystemPrompt holds what stays the same for a whole chat session (persona, rules, the
// chapter's quest knowledge, the notes as they were when the session began), the chat history only grows after it, and
// everything that changes goes in tutorContextMessage, sent last. Mia记忆技术拆解.md §4.3.
export type TutorStableContext = {
	// the chapter's knowledge in quest mode (questKnowledgeSection), the same for the two hours after "Ask Mia"
	questKnowledge?: string | null;
};

export type TutorPromptContext = {
	now: string; // to the day and part of day, e.g. "2026-10-25 Sunday afternoon (Beijing time)"
	// the learner's display name: here, not in tutorSystemPrompt, so every learner shares the same start of the prompt
	learnerName?: string;
	// the name this learner gave her (misc/lojo-tutor-persona.ts; Momo by default), here for the same reason
	tutorName?: string;
	opener?: { reason: string; recentPosts: string[] };
	// where they are on the route maps with gates (IELTS listening 1.3 …), from LojoGateService.profileText
	gates?: string | null;
	// quest mode after a failed level: this try (questTrySection, lojo-tutor-quest.ts)
	quest?: string | null;
	// the progress card (quest map, route map gates, wordbook; misc/lojo-tutor-progress.ts); takes the place of gates
	progress?: string | null;
	// older messages found by keyword (recallText)
	recall?: string | null;
};

// The fixed start (prompts.system with the card filled in), then the chapter's quest knowledge, then the notes.
// The default name comes from tutorPublic (one place), not the card, and is the same for every learner (prompt cache);
// the name this learner gave her is in tutorContextMessage.
export function tutorSystemPrompt(prompts: TutorPrompts, card: TutorCard, memory: TutorMemory, ctx: TutorStableContext): string {
	return [
		tutorFixedPrompt(prompts, card, ctx.questKnowledge ? prompts.formatQuest : prompts.formatPlain),
		...(ctx.questKnowledge ? ['', ctx.questKnowledge] : []),
		'',
		prompts.notesHead,
		describeMemory(memory, prompts.notesEmpty),
	].join('\n');
}

// The start of the prompt without the quest knowledge and the notes (the Mastra pilot's "prompt" tool).
export function tutorFixedPrompt(prompts: TutorPrompts, card: TutorCard, format = prompts.formatPlain): string {
	return fillPrompt(prompts.system, {
		name: tutorPublic.name,
		description: card.description,
		personality: card.personality,
		scenario: card.scenario,
		system_prompt: card.system_prompt,
		post_history_instructions: card.post_history_instructions,
		format,
	});
}

// Sent as the last message, after the chat history: the parts of the prompt that change from one reply to the next.
export function tutorContextMessage(prompts: TutorPrompts, ctx: TutorPromptContext): string {
	return [
		fillPrompt(prompts.now, { now: ctx.now }),
		...(ctx.learnerName ? [fillPrompt(prompts.learnerName, { name: ctx.learnerName })] : []),
		...(ctx.tutorName ? [fillPrompt(prompts.tutorName, { name: ctx.tutorName })] : []),
		...(ctx.progress ? ['', prompts.progressIntro, ctx.progress, prompts.progressAfter]
		: ctx.gates ? ['', prompts.gatesIntro, ctx.gates, prompts.gatesAfter] : []),
		...(ctx.opener ? [
			'',
			fillPrompt(prompts.opener, { reason: ctx.opener.reason }),
			...ctx.opener.recentPosts.map(post => fillPrompt(prompts.recentPost, { post })),
		] : []),
		...(ctx.recall ? ['', ctx.recall] : []),
		...(ctx.quest ? ['', ctx.quest] : []),
	].join('\n');
}

// When the notes are rewritten: after 6 learner messages, after a pause (handled by the caller), or right away when the
// learner asks Mia to remember or forget something.
export const NOTES_EVERY = 6;
export function asksToRememberOrForget(text: string): boolean {
	return /\b(remember|forget|don'?t forget)\s+(this|that|it|me|my|i|about)\b|记住|记一下|记得我|忘掉|忘了这|别记|不要记/i.test(text);
}
