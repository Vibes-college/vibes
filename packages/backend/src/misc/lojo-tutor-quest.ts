/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes AI tutor in the quest map: after a failed level the learner taps "Ask Mia"; the server hands the tutor
// "this try" (which level, the questions they got wrong, why, hearts, streak, where they can go next) and she writes first.
// The quest knowledge (rules, causes, guides) lives in the tutor account's own registry (scope lojo/tutor, key quest),
// maintained by the AI tutor team; without it there is no quest mode. Plan: 闯关上线/Mia接入.md (2026-11-10).

const str = (value: unknown, max: number): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const obj = (value: unknown): Record<string, unknown> | null => (value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null);

export type QuestKnowledge = {
	version: string;
	rules: string;
	causes: Record<string, { zh: string; technique: string; tipZh?: string; guide: string | null }>;
};

export function normalizeQuestKnowledge(raw: unknown): QuestKnowledge | null {
	const r = obj(raw);
	if (r == null) return null;
	const rules = str(r.rules, 8000);
	if (rules === '') return null;
	const causes: QuestKnowledge['causes'] = {};
	for (const [tag, value] of Object.entries(obj(r.causes) ?? {}).slice(0, 30)) {
		const c = obj(value);
		if (c == null) continue;
		causes[tag] = { zh: str(c.zh, 200), technique: str(c.technique, 600), ...(str(c.tipZh, 120) !== '' ? { tipZh: str(c.tipZh, 120) } : {}), guide: str(c.guide, 40) || null };
	}
	return { version: str(r.version, 60), rules, causes };
}

// Which chapter a try is in: chapterNo (filled by the quest service from the chapter the level belongs to), else a
// "3-4" style level id, else chapter 1. The Boss is "boss" in every chapter, so it needs chapterNo.
export function questChapterNo(questTry: Pick<QuestTry, 'chapterNo' | 'level'>): number {
	if (questTry.chapterNo != null && questTry.chapterNo >= 1) return questTry.chapterNo;
	const m = /^(\d+)-/.exec(questTry.level.id);
	return m ? Math.max(1, Number(m[1])) : 1;
}

// Registry keys to try, in order: chapter N (N >= 2) reads quest-chN and falls back to quest; chapter 1 reads quest.
export function questKnowledgeKeys(chapterNo: number): string[] {
	return chapterNo >= 2 ? [`quest-ch${chapterNo}`, 'quest'] : ['quest'];
}

export type QuestKnowledgePick = { chapterNo: number; key: string; knowledge: QuestKnowledge; fellBackFrom: string | null };

// The first key whose value is usable knowledge (missing, or normalized to null, counts as unreadable).
export async function pickQuestKnowledge(questTry: Pick<QuestTry, 'chapterNo' | 'level'>, read: (key: string) => Promise<unknown>): Promise<QuestKnowledgePick | null> {
	const chapterNo = questChapterNo(questTry);
	const keys = questKnowledgeKeys(chapterNo);
	for (const key of keys) {
		const knowledge = normalizeQuestKnowledge(await read(key));
		if (knowledge != null) return { chapterNo, key, knowledge, fellBackFrom: key === keys[0] ? null : keys[0] };
	}
	return null;
}

export type QuestNext = { id: string; label: string; url: string; recommended?: boolean; readToday?: boolean; givesHeart?: boolean };

export type QuestWrong = { n: number; question: string; evidence: string; picked: string; answer: string; cause: string; why?: string };

// "This try", built by the quest service from the stored attempt. Field names follow 闯关上线/Mia接入.md section 2.
export type QuestTry = {
	v: 1;
	attemptId: string;
	at: string;
	chapter: string;
	// chapter number of the level (the Boss's id is "boss" in every chapter); picks quest-ch<N> knowledge
	chapterNo?: number;
	level: { id: string; name: string; kind: string; skill: string; type: string };
	result: { correct: number; total: number; needed: number; passed: boolean; failStreak: number };
	wrong: QuestWrong[];
	cause: string | null;
	hearts: { now: number; max: number; nextRefill: string | null; refilledToday: { guide: boolean; gear: boolean } };
	streak: { days: number; doneToday: boolean; freezeCards: number };
	boss: { losses: number; prep: { guide: boolean; gear: boolean; intel: boolean } } | null;
	next: QuestNext[];
};

// Trims what the quest service sends to sane sizes; null when it is not a try at all.
export function normalizeQuestTry(raw: unknown): QuestTry | null {
	const r = obj(raw);
	if (r == null) return null;
	const attemptId = str(r.attemptId, 64);
	const level = obj(r.level);
	const result = obj(r.result);
	if (attemptId === '' || level == null || result == null) return null;
	const hearts = obj(r.hearts) ?? {};
	const refilled = obj(hearts.refilledToday) ?? {};
	const streak = obj(r.streak) ?? {};
	const boss = obj(r.boss);
	const prep = obj(boss?.prep) ?? {};
	const wrong = (Array.isArray(r.wrong) ? r.wrong : []).slice(0, 12).map(obj).filter(w => w != null).map(w => ({
		n: num(w.n) ?? 0,
		question: str(w.question, 200),
		evidence: str(w.evidence, 300),
		picked: str(w.picked, 120),
		answer: str(w.answer, 120),
		cause: str(w.cause, 40),
		...(str(w.why, 200) !== '' ? { why: str(w.why, 200) } : {}),
	}));
	const next = (Array.isArray(r.next) ? r.next : []).slice(0, 6).map(obj).filter(n => n != null)
		.map(n => ({
			id: str(n.id, 60),
			label: str(n.label, 80),
			url: str(n.url, 300),
			...(n.recommended === true ? { recommended: true } : {}),
			...(typeof n.readToday === 'boolean' ? { readToday: n.readToday } : {}),
			...(n.givesHeart === true ? { givesHeart: true } : {}),
		}))
		.filter(n => n.id !== '' && n.label !== '' && (n.url.startsWith('/') || /^https?:\/\//.test(n.url)));
	return {
		v: 1,
		attemptId,
		at: str(r.at, 40),
		chapter: str(r.chapter, 60),
		...(num(r.chapterNo) != null && Number.isInteger(r.chapterNo) && (r.chapterNo as number) >= 1 ? { chapterNo: r.chapterNo as number } : {}),
		level: { id: str(level.id, 20), name: str(level.name, 60), kind: str(level.kind, 20), skill: str(level.skill, 20), type: str(level.type, 30) },
		result: {
			correct: num(result.correct) ?? 0,
			total: num(result.total) ?? 0,
			needed: num(result.needed) ?? 0,
			passed: result.passed === true,
			failStreak: num(result.failStreak) ?? 0,
		},
		wrong,
		cause: str(r.cause, 40) || null,
		hearts: {
			now: num(hearts.now) ?? 0,
			max: num(hearts.max) ?? 5,
			nextRefill: str(hearts.nextRefill, 20) || null,
			refilledToday: { guide: refilled.guide === true, gear: refilled.gear === true },
		},
		streak: { days: num(streak.days) ?? 0, doneToday: streak.doneToday === true, freezeCards: num(streak.freezeCards) ?? 0 },
		boss: boss == null ? null : { losses: num(boss.losses) ?? 0, prep: { guide: prep.guide === true, gear: prep.gear === true, intel: prep.intel === true } },
		next,
	};
}

// The quest part of the tutor's system prompt: the rules, the techniques for the causes in this try, where she may
// send them (ids and labels only: she never writes a URL), and the try itself without URLs.
// followUp: she already wrote first about this try and is now answering what the learner said next.
// The chapter's knowledge: the same for the whole quest-mode chat, so it goes in the cached part of the prompt.
export function questKnowledgeSection(knowledge: QuestKnowledge): string {
	return knowledge.rules;
}

// This try, its causes and where she can send them: changes as hearts come back, so it goes in the last message.
export function questTrySection(knowledge: QuestKnowledge, questTry: QuestTry, followUp = false): string {
	const tags = [...new Set([questTry.cause, ...questTry.wrong.map(w => w.cause)].filter((t): t is string => t != null && t !== ''))];
	const causes = tags.map(tag => knowledge.causes[tag]).map((c, i) => (c ? `- ${tags[i]}: ${c.zh}. Technique: ${c.technique}` : null)).filter(Boolean);
	const { next, ...rest } = questTry;
	const tryFacts = { ...rest, next: next.map(({ url: _url, ...n }) => n) };
	return [
		...(causes.length > 0 ? ['Causes in this try:', ...causes as string[], ''] : []),
		'You can send them to (set "next" to one id, or leave it out):',
		...(next.length > 0 ? next.map(n => `- ${n.id}: ${n.label}${n.recommended ? ' (recommended)' : ''}`) : ['- (nothing listed: leave "next" out)']),
		'',
		`This try: ${JSON.stringify(tryFacts)}`,
		...(followUp ? [
			'',
			'You already wrote first about this try (see the chat above). Now answer what they just said, like a person in a chat.',
			'Do not repeat the hearts, the cause summary or the next step you already gave. Only when they ask what to do next, how to get hearts back, or where to practise, say it again and set "next"; otherwise leave "next" out.',
			'Hearts and 补心 above are as of now; if they changed since you wrote first, go by these.',
		] : []),
	].join('\n');
}

export function questPromptSection(knowledge: QuestKnowledge, questTry: QuestTry, followUp = false): string {
	return [questKnowledgeSection(knowledge), '', questTrySection(knowledge, questTry, followUp)].join('\n');
}

// "👉 <label> <full URL>" for the step the tutor chose; null when she chose nothing listed.
export function questNextLine(questTry: QuestTry, nextId: string | undefined, baseUrl: string): string | null {
	if (nextId == null) return null;
	const step = questTry.next.find(n => n.id === nextId);
	if (step == null) return null;
	const url = step.url.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}${step.url}` : step.url;
	return `👉 ${step.label} ${url}`;
}

// When the model cannot be reached (no balance or a bad key), "Ask Vibi" still gets one fixed message built from this try
// and the quest knowledge: the cause, its one-line Chinese tip (tipZh), and the next step by the hearts rules she
// follows. No answers, no error words. Spec: 冲刺1111/Mia/兜底规格.md F2 (AI tutor, 2026-11-11).
export const TUTOR_AWAY_PREFIX = 'Vibi 这会儿不在线';
// Away messages sent before the rename to Vibi (2026-11-12) still start with this; they are left out of her context too.
const LEGACY_AWAY_PREFIXES = ['Mia 这会儿不在线'];
export function isTutorAwayText(text: string | null | undefined): boolean {
	if (text == null) return false;
	return text.startsWith(TUTOR_AWAY_PREFIX) || LEGACY_AWAY_PREFIXES.some(prefix => text.startsWith(prefix));
}

export function questAwayMessage(knowledge: QuestKnowledge | null, questTry: QuestTry): { messages: string[]; next?: string } {
	const cause = questTry.cause != null ? knowledge?.causes[questTry.cause] : undefined;
	const lines = [cause?.zh ? `${TUTOR_AWAY_PREFIX}，先给你留个路标：这一关主要卡在「${cause.zh}」。` : `${TUTOR_AWAY_PREFIX}，先给你留个路标。`];
	// The tip in Chinese written for this (AI tutor, ch1-2026-11-11f); without one the line is left out, never the English technique.
	if (cause?.tipZh) lines.push(cause.tipZh);
	const { now, nextRefill, refilledToday } = questTry.hearts;
	const book = questTry.next.find(n => n.id.startsWith('guide:') && n.recommended) ?? questTry.next.find(n => n.id.startsWith('guide:'));
	const gear = questTry.next.find(n => n.id.startsWith('gear:') && n.givesHeart);
	const retry = questTry.next.find(n => n.id === 'retry');
	let next: QuestNext | undefined;
	if (now >= 3 && retry) {
		lines.push(`你还有 ${now} 颗心，再打这一关会换新题。`);
		next = retry;
	} else if (!refilledToday.guide && book) {
		lines.push('先读这本锦囊，读完过小测能补 1 颗心。');
		next = book;
	} else if (!refilledToday.gear && gear) {
		lines.push('练一组这个装备，能补 1 颗心。');
		next = gear;
	} else if (book) {
		lines.push(nextRefill ? `心 ${nextRefill} 回满，先读读这本锦囊。` : '心明天回满，先读读这本锦囊。');
		next = book;
	}
	return { messages: [lines.join('\n')], ...(next ? { next: next.id } : {}) };
}
