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
	causes: Record<string, { zh: string; technique: string; guide: string | null }>;
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
		causes[tag] = { zh: str(c.zh, 200), technique: str(c.technique, 600), guide: str(c.guide, 40) || null };
	}
	return { version: str(r.version, 60), rules, causes };
}

export type QuestNext = { id: string; label: string; url: string; recommended?: boolean; readToday?: boolean; givesHeart?: boolean };

export type QuestWrong = { n: number; question: string; evidence: string; picked: string; answer: string; cause: string };

// "This try", built by the quest service from the stored attempt. Field names follow 闯关上线/Mia接入.md section 2.
export type QuestTry = {
	v: 1;
	attemptId: string;
	at: string;
	chapter: string;
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
export function questPromptSection(knowledge: QuestKnowledge, questTry: QuestTry): string {
	const tags = [...new Set([questTry.cause, ...questTry.wrong.map(w => w.cause)].filter((t): t is string => t != null && t !== ''))];
	const causes = tags.map(tag => knowledge.causes[tag]).map((c, i) => (c ? `- ${tags[i]}: ${c.zh}. Technique: ${c.technique}` : null)).filter(Boolean);
	const { next, ...rest } = questTry;
	const tryFacts = { ...rest, next: next.map(({ url: _url, ...n }) => n) };
	return [
		knowledge.rules,
		'',
		...(causes.length > 0 ? ['Causes in this try:', ...causes as string[], ''] : []),
		'You can send them to (set "next" to one id, or leave it out):',
		...(next.length > 0 ? next.map(n => `- ${n.id}: ${n.label}${n.recommended ? ' (recommended)' : ''}`) : ['- (nothing listed: leave "next" out)']),
		'',
		`This try: ${JSON.stringify(tryFacts)}`,
	].join('\n');
}

// "👉 <label> <full URL>" for the step the tutor chose; null when she chose nothing listed.
export function questNextLine(questTry: QuestTry, nextId: string | undefined, baseUrl: string): string | null {
	if (nextId == null) return null;
	const step = questTry.next.find(n => n.id === nextId);
	if (step == null) return null;
	const url = step.url.startsWith('/') ? `${baseUrl.replace(/\/$/, '')}${step.url}` : step.url;
	return `👉 ${step.label} ${url}`;
}
