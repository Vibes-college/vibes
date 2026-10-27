/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Gates on a route map (IELTS first): every station is a short test at one band level. Pass it to light the
// station up; passing a later station on the same line lights up the ones before it as well.
// A listening set comes with a recording script, a reading set with a passage and a time limit; an interchange set
// can have both, its listening questions first.
// Question sets are written in the Vibes workspace (courses/<subject>/<course>/gates/, format in its README.md) and
// imported into the database with apps/community/scripts/gates-import.mjs, so answers and scripts stay on the server.

export const gateTypes = ['form', 'choice', 'multi', 'map', 'match', 'judge', 'bank'] as const;
export type GateType = typeof gateTypes[number];
export const gateSkills = ['listening', 'reading'] as const;
export type GateSkill = typeof gateSkills[number];
export type GateLimit = { words: number; number: boolean };
export type GateText = { en: string; zh: string };

// The imported form: the import script has filled in every default, so nothing here is optional.
export type GateItem = {
	n: number[]; q: string | null; options: string[]; answer: string[]; ignoreSpaces: boolean; limit: GateLimit | null; tags: string[];
};
// letters: what can be picked, for every type but form and the A–C of choice and multi: map letters, A–H of a box,
// i–x of a list of headings, a passage's paragraph letters, or TRUE / FALSE / NOT GIVEN.
export type GateGroup = {
	type: GateType; instructions: GateText; title: string | null; lines: string[]; limit: GateLimit | null;
	image: string | null; letters: string[]; options: string[]; items: GateItem[];
	// missing on sets imported before reading: listening
	skill?: GateSkill;
};
export type GateScriptLine = { who: string | null; text: string | null; pause: number | null; answers: number[] };
// A paragraph (text, with its letter and heading if it has them) or a figure (image) of a reading passage.
// answers: the questions whose answer is in it, marked once the paper is handed in.
export type GateParagraph = {
	label: string | null; heading: string | null; text: string | null; image: string | null; caption: string | null; answers: number[];
};
export type GatePassage = { title: string; subtitle: string | null; paragraphs: GateParagraph[]; glossary: { word: string; meaning: string }[] };
export type GateSet = {
	id: string; station: string; set: string; band: number; part: number | null; pass: number; total: number;
	voices: Record<string, string>; rate: number; lines: number[]; script: GateScriptLine[]; groups: GateGroup[];
	// reading: the passage, and the minutes for the reading questions (missing on sets imported before reading)
	passage?: GatePassage | null;
	time?: number | null;
};
// A line's placement test: a first part, then a harder or easier second part chosen by its score, and a table from
// the two parts' total to the station the learner starts at. The stages are papers like any set (station 'placement-1').
export type GatePlacementPath = 'high' | 'low';
export type GatePlacement = {
	line: number; next: number;
	place: Record<GatePlacementPath, [number, string][]>;
	stages: { first: GateSet; high: GateSet; low: GateSet };
};
export type GateCourse = {
	id: string;
	title: string;
	lines: { n: number; live: boolean; name: string; stations: string[] }[];
	interchanges: string[][];
	tags: Record<string, GateText>;
	sets: GateSet[];
	// missing on courses imported before placement tests existed
	placements?: GatePlacement[];
};

export type GateReason = 'blank' | 'word-limit' | 'wrong';
export type GateItemResult = {
	n: number; correct: boolean; given: string; expected: string; accepted: string[]; reason: GateReason | null; tags: string[];
};

/* ---------- the paper as the learner sees it: no answers, no tags ---------- */

export function publicGroups(set: GateSet, imageUrl: (name: string) => string) {
	return set.groups.map(g => ({
		type: g.type,
		skill: g.skill ?? 'listening',
		instructions: g.instructions,
		title: g.title,
		lines: g.lines,
		limit: g.limit,
		image: g.image != null ? imageUrl(g.image) : null,
		letters: g.letters,
		options: g.options,
		items: g.items.map(i => ({
			n: i.n, q: i.q, options: i.options, choose: g.type === 'multi' ? i.answer.length : 1, limit: i.limit,
		})),
	}));
}

// The passage without what would give answers away: which paragraph holds which answer.
export function publicPassage(set: GateSet): GatePassage | null {
	const p = set.passage;
	return p ? { ...p, paragraphs: p.paragraphs.map(par => ({ ...par, answers: [] })) } : null;
}

/* ---------- marking ---------- */

// Case, spacing, curly quotes, full-width characters (typed with a Chinese input method) and a final full stop don't matter.
export function normalizeAnswer(text: string, ignoreSpaces = false): string {
	let t = text.normalize('NFKC').toLowerCase()
		.replace(/[‘’ʼ`´]/g, '\'')
		.replace(/[“”]/g, '"')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/[.。]+$/, '')
		.trim();
	if (ignoreSpaces) t = t.replace(/\s/g, '');
	return t;
}

const NUMBER_TOKEN = /^[£$€¥]?\d[\d.,:/]*(?:st|nd|rd|th|am|pm|%)?$/i;

// "ONE WORD AND/OR A NUMBER" is { words: 1, number: true }; a hyphenated word counts as one word.
export function overLimit(text: string, limit: GateLimit | null): boolean {
	if (limit == null) return false;
	const tokens = normalizeAnswer(text).split(' ').filter(t => t !== '');
	const numbers = tokens.filter(t => NUMBER_TOKEN.test(t)).length;
	if (!limit.number) return tokens.length > limit.words;
	return tokens.length - numbers > limit.words || numbers > 1;
}

function markText(item: GateItem, groupLimit: GateLimit | null, given: string): { correct: boolean; reason: GateReason | null } {
	const g = normalizeAnswer(given, item.ignoreSpaces);
	if (g === '') return { correct: false, reason: 'blank' };
	if (!item.ignoreSpaces && overLimit(given, item.limit ?? groupLimit)) return { correct: false, reason: 'word-limit' };
	const accepted = item.answer.map(a => normalizeAnswer(a, item.ignoreSpaces));
	// £45 for 45: the currency is already printed next to the gap
	const bare = g.replace(/^[£$€¥]\s*/, '');
	const ok = accepted.includes(g) || (bare !== g && /^\d/.test(bare) && accepted.includes(bare));
	return { correct: ok, reason: ok ? null : 'wrong' };
}

const letterOf = (value: string) => value.normalize('NFKC').trim().toUpperCase();
// One of the group's labels, in any case ('iv' for 'IV'), given back as the label itself; anything else as typed.
const pickOf = (group: GateGroup, value: string) => {
	const v = letterOf(value);
	return group.letters.find(l => l.toUpperCase() === v) ?? v;
};

// answers: question number → what the learner wrote or picked ('' or missing for a blank)
export function markSet(set: GateSet, answers: Map<number, string>): { score: number; items: GateItemResult[] } {
	const items: GateItemResult[] = [];
	for (const group of set.groups) {
		for (const item of group.items) {
			if (group.type === 'form') {
				const n = item.n[0], given = answers.get(n) ?? '';
				const { correct, reason } = markText(item, group.limit, given);
				items.push({ n, correct, given: given.trim(), expected: item.answer[0], accepted: item.answer, reason, tags: item.tags });
			} else if (group.type === 'multi') {
				// One question with several numbers: each right letter scores once, in any order.
				const unused = new Set(item.answer);
				const picks = item.n.map(n => ({ n, given: letterOf(answers.get(n) ?? '') }));
				const right = picks.map(p => {
					const ok = p.given !== '' && unused.has(p.given);
					if (ok) unused.delete(p.given);
					return ok;
				});
				const missing = [...unused];
				picks.forEach((p, i) => {
					items.push({
						n: p.n, correct: right[i], given: p.given,
						expected: right[i] ? p.given : missing.shift() ?? item.answer[i] ?? '',
						accepted: item.answer, reason: right[i] ? null : p.given === '' ? 'blank' : 'wrong', tags: item.tags,
					});
				});
			} else {
				const n = item.n[0], raw = answers.get(n) ?? '';
				const given = group.type === 'choice' ? letterOf(raw) : pickOf(group, raw);
				const correct = given !== '' && given === item.answer[0];
				items.push({ n, correct, given, expected: item.answer[0], accepted: item.answer, reason: correct ? null : given === '' ? 'blank' : 'wrong', tags: item.tags });
			}
		}
	}
	items.sort((a, b) => a.n - b.n);
	return { score: items.filter(i => i.correct).length, items };
}

// Tags of the questions answered wrong, most frequent first: what to practise.
export function weakTags(items: GateItemResult[]): { tag: string; count: number }[] {
	const counts = new Map<string, number>();
	for (const item of items) if (!item.correct) for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
	return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}

/* ---------- the map: which stations are lit ---------- */

export type GateAttemptFact = {
	kind: string; station: string; setId: string; lines: number[]; score: number | null; total: number; passed: boolean | null;
	startedAt: Date; submittedAt: Date | null; weak: { tag: string; count: number }[];
	// placement tests: the station the second part put the learner at
	placedAt: string | null;
};
export type GateStationState = 'passed' | 'open' | 'locked' | 'soon';
export type GateStationProgress = {
	id: string; line: number; gate: string; state: GateStationState;
	sets: number; attempts: number; best: number | null; total: number | null; pass: number | null;
	// reading: minutes for the reading questions
	time: number | null;
	failStreak: number; passedAt: Date | null; via: 'gate' | 'higher' | 'placement' | null;
};

// A paper by its id: a set ('1.3-B') or a placement stage ('placement-1:high').
export function paperOf(course: GateCourse, setId: string): GateSet | null {
	return course.sets.find(s => s.id === setId)
		?? course.placements?.flatMap(p => [p.stages.first, p.stages.high, p.stages.low]).find(s => s.id === setId)
		?? null;
}

export function gateOf(course: GateCourse, id: string): string {
	return course.interchanges.find(pair => pair.includes(id))?.[0] ?? id;
}

export function lineOf(course: GateCourse, id: string): number | null {
	return course.lines.find(l => l.stations.includes(id))?.n ?? null;
}

// Sets that count for station `id` on its own line: an interchange set counts for a line only if it covers it.
export function setsFor(course: GateCourse, id: string): GateSet[] {
	const gate = gateOf(course, id), line = lineOf(course, id);
	return course.sets.filter(s => s.station === gate && line != null && s.lines.includes(line));
}

export const placementStation = (line: number) => `placement-${line}`;

export function placementOf(course: GateCourse, line: number): GatePlacement | null {
	return course.placements?.find(p => p.line === line) ?? null;
}

// The station a placement total leads to: the first row of the path's table the total reaches.
export function placeAt(placement: GatePlacement, path: GatePlacementPath, total: number): string {
	const table = placement.place[path];
	return (table.find(([min]) => total >= min) ?? table[table.length - 1])[1];
}

// Where a placement actually starts the learner: the table's station, or, while that one has no sets yet, the closest
// station before it that has some. Nobody is sent to a stop that only says "coming soon".
export function placedStation(course: GateCourse, placement: GatePlacement, path: GatePlacementPath, total: number): string {
	const station = placeAt(placement, path, total);
	const stations = course.lines.find(l => l.n === placement.line)?.stations ?? [];
	for (let i = stations.indexOf(station); i >= 0; i--) if (setsFor(course, stations[i]).length > 0) return stations[i];
	return station;
}

export function gateProgress(course: GateCourse, attempts: GateAttemptFact[]) {
	const done = attempts.filter(a => a.submittedAt != null).sort((a, b) => a.submittedAt!.getTime() - b.submittedAt!.getTime());
	const stations: GateStationProgress[] = [];
	const lines = course.lines.map(line => {
		// The furthest placement on this line (the first time it was reached): a later, lower one never turns stations off.
		const placed = done.filter(a => a.station === placementStation(line.n) && a.placedAt != null && line.stations.includes(a.placedAt))
			.reduce<GateAttemptFact | null>((b, a) => (b == null || line.stations.indexOf(a.placedAt!) > line.stations.indexOf(b.placedAt!) ? a : b), null);
		const rows = line.stations.map(id => {
			// an interchange keeps one record per line: a listening-only set says nothing about reading
			const gate = gateOf(course, id), here = done.filter(a => a.station === gate && a.lines.includes(line.n));
			const passes = here.filter(a => a.passed);
			const best = here.reduce<GateAttemptFact | null>((b, a) => (b == null || (a.score ?? 0) > (b.score ?? 0) ? a : b), null);
			let failStreak = 0;
			for (let i = here.length - 1; i >= 0 && !here[i].passed; i--) failStreak++;
			const sets = setsFor(course, id);
			return {
				id, line: line.n, gate, sets: line.live ? sets.length : 0, attempts: here.length,
				best: best?.score ?? null, total: best?.total ?? sets[0]?.total ?? null, pass: sets[0]?.pass ?? null, time: sets[0]?.time ?? null, failStreak,
				passedAt: passes[0]?.submittedAt ?? null,
			};
		});
		// Passing a station lights up every station before it on the line.
		let laterPass: Date | null = null;
		const lit = new Map<string, { at: Date; via: 'gate' | 'higher' | 'placement' }>();
		for (let i = rows.length - 1; i >= 0; i--) {
			const r = rows[i];
			if (r.passedAt) {
				lit.set(r.id, { at: r.passedAt, via: 'gate' });
				if (laterPass == null || r.passedAt < laterPass) laterPass = r.passedAt;
			} else if (laterPass) lit.set(r.id, { at: laterPass, via: 'higher' });
		}
		// A placement starts the learner at a station: the ones before it count as passed.
		const placedIndex = placed ? line.stations.indexOf(placed.placedAt!) : -1;
		for (let i = 0; i < placedIndex; i++) if (!lit.has(rows[i].id)) lit.set(rows[i].id, { at: placed!.submittedAt!, via: 'placement' });
		let current: string | null = null;
		for (const r of rows) {
			const l = lit.get(r.id);
			let state: GateStationState;
			if (l) state = 'passed';
			else if (r.sets === 0) state = 'soon';
			else if (current == null) { state = 'open'; current = r.id; } else state = 'locked';
			stations.push({ ...r, state, passedAt: l?.at ?? null, via: l?.via ?? null });
		}
		return {
			line: line.n, live: line.live, current, passed: lit.size, total: rows.length,
			placement: {
				available: line.live && placementOf(course, line.n) != null,
				station: placed?.placedAt ?? null, at: placed?.submittedAt ?? null,
			},
		};
	});
	// Where the learner was last: a gate, or the station a placement put them at (a first part alone says nothing yet).
	const lastAttempt = done.filter(a => a.kind === 'gate' || a.placedAt != null).at(-1);
	return {
		lines, stations,
		last: lastAttempt ? { station: lastAttempt.placedAt ?? lastAttempt.station, at: lastAttempt.submittedAt! } : null,
	};
}

/* ---------- which set to give ---------- */

// A set the learner hasn't heard yet, in order (A, B, C…); once all are used, the one heard longest ago.
export function pickSet(sets: GateSet[], history: { setId: string; startedAt: Date }[]): GateSet | null {
	if (sets.length === 0) return null;
	const lastHeard = new Map<string, number>();
	for (const h of history) lastHeard.set(h.setId, Math.max(lastHeard.get(h.setId) ?? 0, h.startedAt.getTime()));
	const fresh = sets.find(s => !lastHeard.has(s.id));
	if (fresh) return fresh;
	return [...sets].sort((a, b) => lastHeard.get(a.id)! - lastHeard.get(b.id)!)[0];
}

/* ---------- what the AI tutor knows about it ---------- */

const bandText = (b: number) => b.toFixed(1);

// A few lines for the tutor's system prompt: where the learner is on each line and what they keep missing.
export function gateProfileText(course: GateCourse, attempts: GateAttemptFact[]): string | null {
	const done = attempts.filter(a => a.submittedAt != null);
	if (done.length === 0) return null;
	const progress = gateProgress(course, attempts);
	const bandOf = (station: string) => course.sets.find(s => s.station === gateOf(course, station))?.band;
	const out: string[] = [];
	for (const line of progress.lines) {
		const mine = done.filter(a => a.lines.includes(line.line)).sort((a, b) => b.submittedAt!.getTime() - a.submittedAt!.getTime());
		if (mine.length === 0) continue;
		const rows = progress.stations.filter(s => s.line === line.line);
		const top = [...rows].reverse().find(s => s.state === 'passed');
		const parts = [`${course.lines.find(l => l.n === line.line)?.name ?? `Line ${line.line}`}: ${top ? `passed up to the ${bandText(bandOf(top.id) ?? 0)} gate (${top.id})` : 'no gate passed yet'}`];
		if (line.current) parts.push(`next gate ${line.current} (${bandText(bandOf(line.current) ?? 0)})`);
		const placed = line.placement.station != null ? line.placement : null;
		if (placed) parts.push(`the placement test on ${placed.at!.toISOString().slice(0, 10)} started them at ${placed.station} (${bandText(bandOf(placed.station!) ?? 0)})`);
		const recent = mine.filter(a => a.kind === 'gate').slice(0, 3);
		if (recent.length > 0) parts.push(`recent tries: ${recent.map(a => `${a.station} ${a.score}/${a.total}${a.passed ? ' passed' : ''} on ${a.submittedAt!.toISOString().slice(0, 10)}`).join(', ')}`);
		const missed = new Map<string, number>();
		for (const a of recent) for (const w of a.weak) missed.set(w.tag, (missed.get(w.tag) ?? 0) + w.count);
		if (missed.size > 0) {
			parts.push(`often missed: ${[...missed].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag, n]) => `${course.tags[tag]?.en ?? tag} ×${n}`).join(', ')}`);
		}
		out.push(parts.join('; '));
	}
	return out.length > 0 ? out.join('\n') : null;
}

/* ---------- an import, before it reaches the database ---------- */

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => v != null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const allOf = <T>(v: unknown, ok: (x: unknown) => x is T): v is T[] => Array.isArray(v) && v.every(ok);
const isLimit = (v: unknown) => v === null || (isObj(v) && isNum(v.words) && typeof v.number === 'boolean');

function isItem(v: unknown): v is GateItem {
	return isObj(v) && allOf(v.n, isNum) && v.n.length > 0 && (v.q === null || isStr(v.q)) && allOf(v.options, isStr)
		&& allOf(v.answer, isStr) && v.answer.length > 0 && typeof v.ignoreSpaces === 'boolean' && isLimit(v.limit) && allOf(v.tags, isStr);
}

function isGroup(v: unknown): v is GateGroup {
	return isObj(v) && (gateTypes as readonly unknown[]).includes(v.type) && isObj(v.instructions) && isStr(v.instructions.en) && isStr(v.instructions.zh)
		&& (v.title === null || isStr(v.title)) && allOf(v.lines, isStr) && isLimit(v.limit) && (v.image === null || isStr(v.image))
		&& allOf(v.letters, isStr) && allOf(v.options, isStr) && allOf(v.items, isItem) && v.items.length > 0
		&& (v.skill === undefined || (gateSkills as readonly unknown[]).includes(v.skill));
}

const isNullStr = (v: unknown) => v === null || isStr(v);

function isParagraph(v: unknown): v is GateParagraph {
	return isObj(v) && isNullStr(v.label) && isNullStr(v.heading) && isNullStr(v.text) && isNullStr(v.image) && isNullStr(v.caption)
		&& allOf(v.answers, isNum) && (isStr(v.text) || isStr(v.image));
}

function isPassage(v: unknown): v is GatePassage {
	return isObj(v) && isStr(v.title) && isNullStr(v.subtitle) && allOf(v.paragraphs, isParagraph) && v.paragraphs.length > 0
		&& Array.isArray(v.glossary) && v.glossary.every(g => isObj(g) && isStr(g.word) && isStr(g.meaning));
}

function isLine(v: unknown): v is GateScriptLine {
	return isObj(v) && allOf(v.answers, isNum)
		&& ((v.pause === null && isStr(v.who) && isStr(v.text)) || (isNum(v.pause) && v.who === null && v.text === null));
}

function isSet(v: unknown): v is GateSet {
	return isObj(v) && isStr(v.id) && isStr(v.station) && isStr(v.set) && isNum(v.band) && (v.part === null || isNum(v.part))
		&& isNum(v.pass) && isNum(v.total) && isObj(v.voices) && Object.values(v.voices).every(isStr) && isNum(v.rate)
		&& allOf(v.lines, isNum) && allOf(v.script, isLine) && allOf(v.groups, isGroup) && v.groups.length > 0
		&& (v.passage === undefined || v.passage === null || isPassage(v.passage))
		&& (v.time === undefined || v.time === null || (isNum(v.time) && v.time > 0));
}

function isPlacement(v: unknown): v is GatePlacement {
	if (!isObj(v) || !isNum(v.line) || !isNum(v.next) || !isObj(v.place) || !isObj(v.stages)) return false;
	const place = v.place, stages = v.stages;
	const isTable = (rows: unknown) => Array.isArray(rows) && rows.length > 0
		&& rows.every((row: unknown) => Array.isArray(row) && row.length === 2 && isNum(row[0]) && isStr(row[1]));
	return isTable(place.high) && isTable(place.low) && isSet(stages.first) && isSet(stages.high) && isSet(stages.low);
}

// The import script has already checked the content; this only makes sure the shape can't break the server.
export function isGateCourse(v: unknown): v is GateCourse {
	return isObj(v) && isStr(v.id) && isStr(v.title)
		&& Array.isArray(v.lines) && v.lines.every(l => isObj(l) && isNum(l.n) && typeof l.live === 'boolean' && isStr(l.name) && allOf(l.stations, isStr))
		&& Array.isArray(v.interchanges) && v.interchanges.every(p => allOf(p, isStr) && p.length === 2)
		&& isObj(v.tags) && Object.values(v.tags).every(t => isObj(t) && isStr(t.en) && isStr(t.zh))
		&& allOf(v.sets, isSet)
		&& (v.placements === undefined || allOf(v.placements, isPlacement));
}
