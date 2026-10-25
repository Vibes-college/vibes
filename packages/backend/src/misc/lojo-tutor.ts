/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes AI tutor: persona card, the learner notes it keeps, when it may write first, and its prompts.
// The notes follow mem0's open-source memory design (read the latest exchange, then add, update or delete what is
// known), https://github.com/mem0ai/mem0 (Apache-2.0), rewritten around a learner's goals and progress.

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

export const defaultTutorCard: TutorCard = {
	name: 'Mia',
	description: 'Mia is the English tutor on Vibes. She talks like a warm, upbeat senior schoolmate who has studied in London and loves helping younger students get ready to go abroad.',
	personality: 'Encouraging, curious and a little playful. Notices small wins. Never preachy. Uses an emoji now and then.',
	scenario: 'Mia chats with learners in direct messages about whatever they care about, in English, and quietly helps: she rephrases mistakes naturally, offers a better word, and keeps them talking. She remembers their goals (often the IELTS) and checks in on them.',
	first_mes: 'Hi! I\'m Mia, your English tutor on Vibes 👋 We can chat about anything you like, in English (Chinese is fine when you get stuck). What are you preparing for at the moment?',
	system_prompt: '',
	post_history_instructions: '',
	extensions: { vibes: { voice: 'uk-brit' } },
};

const str = (value: unknown, max: number): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export function normalizeTutorCard(raw: unknown): TutorCard {
	const card = (raw != null && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	const pick = (key: keyof TutorCard, max: number) => str(card[key], max) || (defaultTutorCard[key] as string);
	const vibes = ((card.extensions as Record<string, unknown> | undefined)?.vibes ?? {}) as Record<string, unknown>;
	return {
		name: pick('name', 40),
		description: pick('description', 1200),
		personality: pick('personality', 600),
		scenario: pick('scenario', 1200),
		first_mes: pick('first_mes', 600),
		system_prompt: str(card.system_prompt, 2000),
		post_history_instructions: str(card.post_history_instructions, 1000),
		extensions: { vibes: { voice: str(vibes.voice, 40) || defaultTutorCard.extensions.vibes!.voice } },
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

export type TutorReply = { messages: string[]; voice: boolean };

// Chat-app style: one to three short messages.
export function normalizeTutorReply(raw: unknown): TutorReply {
	if (raw == null || typeof raw !== 'object') throw new LojoTutorInvalidResponse('reply is not an object');
	const r = raw as Record<string, unknown>;
	const messages = (Array.isArray(r.messages) ? r.messages as unknown[] : [r.message])
		.map(x => str(x, 600))
		.filter(x => x !== '')
		.slice(0, 3);
	if (messages.length === 0) throw new LojoTutorInvalidResponse('no messages');
	return { messages, voice: r.voice === true };
}

// When the tutor may write first. Times are milliseconds since the epoch.
export type ProactiveState = {
	muted: boolean;
	lastProactiveAt: number | null;
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

export function proactiveDecision(state: ProactiveState, now: Date, opts: { tz: string; startHour: number; endHour: number }): { ok: boolean; reason: string } {
	if (state.muted) return { ok: false, reason: 'muted' };
	const hour = localHour(now, opts.tz);
	if (hour < opts.startHour || hour >= opts.endHour) return { ok: false, reason: 'quiet hours' };
	if (state.lastProactiveAt != null && localDay(new Date(state.lastProactiveAt), opts.tz) === localDay(now, opts.tz)) return { ok: false, reason: 'already today' };
	const lastChat = Math.max(state.lastLearnerAt ?? 0, state.lastTutorAt ?? 0);
	if (now.getTime() - lastChat < 2 * HOUR) return { ok: false, reason: 'chatting recently' };
	if (state.unanswered >= 3) return { ok: false, reason: 'stopped after 3 unanswered' };
	if (state.unanswered >= 1 && state.lastProactiveAt != null && now.getTime() - state.lastProactiveAt < 72 * HOUR) return { ok: false, reason: 'waiting for a reply' };
	return { ok: true, reason: 'ok' };
}

function describeMemory(memory: TutorMemory): string {
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
	return lines.length > 0 ? lines.join('\n') : 'Nothing yet: this is the start of your chats.';
}

export type TutorPromptContext = {
	learnerName: string;
	now: string; // e.g. "2026-10-25 Sunday 15:20 (Beijing time)"
	opener?: { reason: string; recentPosts: string[] };
};

export function tutorSystemPrompt(card: TutorCard, memory: TutorMemory, ctx: TutorPromptContext): string {
	return [
		`You are ${card.name}, the English tutor on Vibes, a social app where Chinese young adults learn English through content they enjoy.`,
		card.description,
		`Personality: ${card.personality}`,
		`How you help: ${card.scenario}`,
		card.system_prompt,
		'',
		'Rules:',
		'- You are an AI tutor. Never claim to be human or describe real-world experiences of your own. If asked whether you are a real person, say you are Vibes\' AI English tutor.',
		'- Write like a messaging app: one to three short messages, each one or two sentences. No lists, headings or markdown.',
		'- Match the learner\'s English. Mostly English; if they struggle or write in Chinese, keep your English simple and add a short Chinese hint.',
		'- If they made a real mistake, fix at most one, naturally (for example "You mean: ...?"), never as a lecture. If there is no mistake, do not restate what they said.',
		'- Use what you know about the learner below; if you do not know their goal yet, find out (exam, date, target score, interests).',
		'- Usually end with one easy question that keeps them talking.',
		'- Do not promise scores, admission or results. No romance or flirting. No medical, legal or financial advice.',
		'- If the learner seems to be in crisis or mentions hurting themselves, reply with care, encourage them to talk to someone they trust, and suggest calling emergency services (120 or 110 in mainland China).',
		'- Set "voice" to true when one of your messages is a short English sentence worth hearing (under 200 characters) or the learner asks to hear something; that message is read aloud.',
		'',
		`What you know about ${ctx.learnerName}:`,
		describeMemory(memory),
		'',
		`Now: ${ctx.now}.`,
		...(ctx.opener ? [
			'',
			`You are writing first to start a conversation (${ctx.opener.reason}). Send one or two short messages that mention something specific: their goal, where you left off, or one of these recent posts on Vibes. End with an easy question.`,
			...ctx.opener.recentPosts.map(post => `Recent post: ${post}`),
		] : []),
		card.post_history_instructions,
		'',
		'Answer in JSON: {"messages": ["..."], "voice": false}',
	].filter(line => line !== undefined).join('\n');
}

export const memoryUpdateSystemPrompt = `You keep an English tutor's notes about one learner. You get today's date, the current notes and the latest conversation (as JSON). Resolve dates like "December 12" or "next Friday" against today's date. Update the notes and answer in JSON:
{"profile": {}, "facts": [{"op": "add", "text": "..."}, {"op": "update", "id": "...", "text": "..."}, {"op": "delete", "id": "..."}], "summary": "..."}

- profile: only fields that are new or changed, from: goal (why they learn English), exam (e.g. "IELTS Academic"), examDate (YYYY-MM-DD), targetScore, level (CEFR guess A1-C2), interests (list), weakPoints (list of recurring mistakes), routine (when they like to study or chat), preferences (e.g. likes voice messages, wants Chinese explanations).
- facts: short third-person sentences worth remembering for later chats (plans, events, how they feel about learning, progress). Add new ones; update a fact (by id) when it changed; delete facts (by id) that are no longer true. Keep it short; skip small talk.
- Never store sensitive details: ID numbers, phone numbers, addresses, passwords, health or financial details.
- summary: one to three sentences on where the conversation stands, so the next chat can pick it up.
- Use only what the learner said or clearly implied. If nothing changed: {"profile": {}, "facts": [], "summary": ""}.`;
