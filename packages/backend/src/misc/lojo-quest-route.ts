/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 三段闯关 (冲刺1111 闯关排法, 创始人 2026-11-13 08:14 PT 同意): base → focus (one chain per question type) → sprint.
// The route itself is data: Vibes 工作区 courses/english/ielts/quest/route.json, imported with the chapters
// (apps/community/scripts/quest-import.mjs). The questions stay in the chapters; a station points at a level.
// Pure rules only (no database): stars, what is open, 回炉, the placement probe's order. LojoQuestService applies them.
//
// Never taken back: stars never drop, a station or chain once open stays open (state.opened), levels open under the old
// map stay open (state.kept), and an old ★★ (one perfect run, or a retest) counts as stable.

import type { MiLojoQuestLevel } from '@/models/LojoQuest.js';
import type { QuestChapter } from '@/misc/lojo-quest-types.js';

export type RouteSkill = 'reading' | 'listening';
export const ROUTE_SKILLS: RouteSkill[] = ['reading', 'listening'];

export type RouteStation = { id: string; zh: string; tier: 'entry' | 'standard' | 'advanced'; level: string | null; required: boolean; building: boolean };
export type RouteChain = {
	id: string; skill: RouteSkill; zh: string; methodCard: string; methodSource?: string;
	demo: { question: string; steps: { title: string; text: string }[] } | null;
	stations: RouteStation[];
};
export type RouteProbe = { id: string; zh: string; questions: { chain: string; question: string }[] };
export type RouteSprintStation = {
	id: string; zh: string; level?: string; gates?: string[]; compose?: string[][]; sets?: string[]; minutes?: number; short?: boolean; note?: string;
};
export type QuestRoute = {
	version: number; exam: string; updated: string; disclaimer?: string;
	stages: [
		{ id: 'base'; zh: string; gateToNext: { mustStations: string[]; stars: number; orPlacementAtLeast: number }; skills: Record<string, string[]>; gear: string[]; note?: string },
		{ id: 'focus'; zh: string; skills: Record<RouteSkill, { placement: RouteProbe; chains: RouteChain[] }> },
		{
			id: 'sprint'; zh: string;
			mixed: { id: string; zh: string; level: string; sets?: string[] }[];
			reading: RouteSprintStation[]; listening: RouteSprintStation[];
			mock: { id: string; zh: string; sets: string[]; stars: false; opensWhen: { stars: number; stations: string[] }; report?: string[] };
		},
	];
	stars: { level: { passAt: number; of: number }; sprint: { passAt: number; of: number } };
	unlock: string[];
	chainOrder: { default: Record<RouteSkill, string[]> };
	recycle: { windowDays: number; wrongAtLeast: number; from: string[]; orFullSetBelow: number; remindPerDay: number };
	tagToChain: { byLevel: Record<string, string>; reading: [string, string][]; listening: [string, string][] };
	hard: { questions: string[] };
};

// a sprint station built on the old gates (SR-2…, SL-…): its stars live here, not in the levels
export type RouteSprintRecord = { passedAt?: string; lastAt?: string; recent?: boolean[]; highs?: number; stars?: number; tries?: number; best?: number };
// a timed whole set (SR-5, SL-5) or the mock: one gate per group, in order
export type RouteTally = Record<string, { right: number; total: number }>;
export type RouteRun = { station: string; startedAt: string; sets: string[]; gates: string[]; parts: ({ attemptId: string; gate: string; score: number; total: number; at: string; byChain: RouteTally } | null)[] };
// the last whole set or mock handed in (inTime: SR-5 within its 45 minutes)
export type RouteRunResult = { station: string; score: number; total: number; elapsedMs: number; minutes: number | null; inTime: boolean; at: string; byChain: RouteTally };
// one counted result for 回炉: from a Boss (mixed), a sprint gate or the mock; full = a whole set
export type RouteEvent = { at: string; from: 'mixed' | 'sprint' | 'mock'; chain: string; right: number; total: number; full: boolean };
export type RouteProbeResult = { at: string; right: Record<string, number>; wrong: Record<string, number>; order: string[] };
export type RouteMockReport = { at: string; right: number; total: number; byChain: Record<string, { right: number; total: number }>; parts: { gate: string; score: number; total: number }[] };

export type MiLojoQuestRoute = {
	// levels open under the old map the first time this learner met the route (never locked again)
	kept?: string[];
	// stations, chains and stages ever open (never locked again)
	opened?: string[];
	// 目标分 (5.0–9.0); ≥ 7 makes the advanced stations required
	target?: number | null;
	probe?: Partial<Record<RouteSkill, RouteProbeResult>>;
	sprint?: Record<string, RouteSprintRecord>;
	run?: RouteRun | null;
	lastRun?: RouteRunResult | null;
	events?: RouteEvent[];
	mock?: RouteMockReport | null;
};

/* ---------- stars ---------- */

// After a formal try (level, practice level, Boss) or a retest. Returns the new record fields.
//   ★ = passed once; ★★ = the last two formal results both passes; ★★★ = two perfect runs in total, once at ★★.
//   A retest 3/3 counts as one perfect pass; a retest 2/3 only relights (no result recorded, no star).
//   Stars never drop: an old ★★ from one perfect run stays ★★.
export function routeStars(prev: Pick<MiLojoQuestLevel, 'stars' | 'recent' | 'perfects' | 'passedAt' | 'placed'>, how: { passed: boolean; perfect: boolean; retest: boolean }): { stars: number; recent: boolean[]; perfects: number } {
	const recent = prev.recent ?? [];
	const perfects = prev.perfects ?? 0;
	const old = prev.placed ? 0 : prev.stars ?? 0;
	if (how.retest && !how.perfect) return { stars: Math.max(prev.stars ?? 0, prev.placed ? 0 : 1), recent, perfects };
	const nextRecent = [...recent, how.passed].slice(-2);
	const nextPerfects = perfects + (how.passed && how.perfect ? 1 : 0);
	const everPassed = how.passed || (prev.passedAt != null && !prev.placed);
	// ★★★ = already ★★ (or two passes in a row now) and two perfect runs in total, not in a row (路线图 2026-11-13)
	const two = (nextRecent.length === 2 && nextRecent.every(x => x)) || old >= 2;
	const computed = two && nextPerfects >= 2 ? 3 : two ? 2 : everPassed ? 1 : 0;
	return { stars: Math.min(3, Math.max(old, computed, prev.stars ?? 0)), recent: nextRecent, perfects: nextPerfects };
}

// Sprint gates: pass at 8/10 (passAt/of of the score), ★★★ = two runs at 9/10 or more.
export function sprintStars(prev: RouteSprintRecord, score: number, total: number, at: string, passAt = 0.8, highAt = 0.9): RouteSprintRecord {
	const ratio = total > 0 ? score / total : 0;
	const passed = ratio >= passAt - 1e-9;
	const high = ratio >= highAt - 1e-9;
	const recent = [...(prev.recent ?? []), passed].slice(-2);
	const highs = (prev.highs ?? 0) + (high ? 1 : 0);
	const passedAt = prev.passedAt ?? (passed ? at : undefined);
	const two = (recent.length === 2 && recent.every(x => x)) || (prev.stars ?? 0) >= 2;
	const computed = two && highs >= 2 ? 3 : two ? 2 : passedAt ? 1 : 0;
	return {
		...prev, lastAt: at, passedAt, recent, highs, tries: (prev.tries ?? 0) + 1,
		best: Math.max(prev.best ?? 0, Math.round(ratio * 100)), stars: Math.max(prev.stars ?? 0, computed),
	};
}

export const stable = (stars: number | undefined) => (stars ?? 0) >= 2;

/* ---------- which chain a question counts for ---------- */

export function chainOf(route: QuestRoute, levelId: string | null, skill: string | null, tags: readonly string[]): string | null {
	if (levelId != null && route.tagToChain.byLevel[levelId] != null) return route.tagToChain.byLevel[levelId];
	const list = skill === 'reading' ? route.tagToChain.reading : skill === 'listening' ? route.tagToChain.listening : [...route.tagToChain.reading, ...route.tagToChain.listening];
	for (const [tag, chain] of list) if (tags.includes(tag)) return chain;
	return null;
}

// a gate station's skill: 1.x listening, 2.x reading
export const gateSkill = (gate: string): RouteSkill | null => (gate.startsWith('1.') ? 'listening' : gate.startsWith('2.') ? 'reading' : null);

/* ---------- 回炉 ---------- */

// Chains to send back to: in the last windowDays, ≥ wrongAtLeast wrong from mixed / sprint / mock, or a whole set below
// orFullSetBelow on that chain (at least 2 of its questions). Cleared by passing the chain's first station once after.
export function recycleChains(route: QuestRoute, events: readonly RouteEvent[], firstPassAt: (chain: string) => string | null, now: Date): string[] {
	const R = route.recycle;
	const from = now.getTime() - R.windowDays * 24 * 60 * 60 * 1000;
	const out: string[] = [];
	const chains = [...new Set(events.map(e => e.chain))];
	for (const chain of chains) {
		const cleared = firstPassAt(chain);
		const es = events.filter(e => e.chain === chain && R.from.includes(e.from) && Date.parse(e.at) >= from && (cleared == null || e.at > cleared));
		const wrong = es.reduce((s, e) => s + (e.total - e.right), 0);
		const low = es.some(e => e.full && e.total >= 2 && e.right / e.total < R.orFullSetBelow);
		if (wrong >= R.wrongAtLeast || low) out.push(chain);
	}
	return out;
}

export function pruneEvents(events: readonly RouteEvent[], now: Date, days: number): RouteEvent[] {
	const from = now.getTime() - days * 24 * 60 * 60 * 1000;
	return events.filter(e => Date.parse(e.at) >= from).slice(-200);
}

// right / total per chain from a list of (chain, correct)
export function tally(items: { chain: string | null; correct: boolean }[]): Record<string, { right: number; total: number }> {
	const out: Record<string, { right: number; total: number }> = {};
	for (const it of items) {
		if (it.chain == null) continue;
		const t = out[it.chain] ??= { right: 0, total: 0 };
		t.total += 1;
		if (it.correct) t.right += 1;
	}
	return out;
}

/* ---------- 摸底 ---------- */

// The probe's order: most wrong first, ties in the default order.
export function probeOrder(defaultOrder: readonly string[], wrong: Record<string, number>): string[] {
	return [...defaultOrder].sort((a, b) => (wrong[b] ?? 0) - (wrong[a] ?? 0) || defaultOrder.indexOf(a) - defaultOrder.indexOf(b));
}

/* ---------- what is open ---------- */

export type StationState = 'locked' | 'open' | 'done' | 'building';
export type RouteInput = {
	route: QuestRoute;
	levels: Record<string, MiLojoQuestLevel>;
	state: MiLojoQuestRoute;
	// 旧定级 station (1.1–1.9), for the focus door (≥ 5.0)
	placementStation: string | null;
	// a gate group ready on this site (imported, live, with these sets)
	gateReady: (gate: string, sets: readonly string[]) => boolean;
	now: Date;
};

// 1.1 = 4.0 … 1.9 = 8.0
export const placementBand = (station: string | null): number | null => {
	const m = station?.match(/^1\.(\d)$/);
	return m ? 4 + (Number(m[1]) - 1) * 0.5 : null;
};

const levelStars = (levels: Record<string, MiLojoQuestLevel>, id: string | null) => {
	if (id == null) return 0;
	const l = levels[id];
	return l?.stars ?? (l?.passedAt ? 1 : 0);
};
const levelPassed = (levels: Record<string, MiLojoQuestLevel>, id: string | null) => id != null && levels[id]?.passedAt != null;

export function routeView(inp: RouteInput) {
	const { route, levels, state } = inp;
	const kept = new Set(state.kept ?? []);
	const opened = new Set(state.opened ?? []);
	const newlyOpened: string[] = [];
	const target = state.target ?? null;
	const hard = target != null && target >= 7;
	const open = (id: string, computed: boolean, levelId?: string | null) => {
		const touched = levelId != null && (kept.has(levelId) || (levels[levelId]?.tries ?? 0) > 0);
		const o = computed || opened.has(id) || touched;
		if (o && !opened.has(id)) { opened.add(id); newlyOpened.push(id); }
		return o;
	};
	const levelState = (levelId: string | null, isOpen: boolean): StationState => (levelId == null ? 'building' : levelPassed(levels, levelId) ? 'done' : isOpen ? 'open' : 'locked');
	// level id → its state on the route (the map and start() use this)
	const states: Record<string, 'open' | 'locked' | 'done'> = {};
	const setLevel = (levelId: string | null, s: StationState) => {
		if (levelId == null || s === 'building') return;
		const prev = states[levelId];
		// a level on two places (never at present) takes the more open one
		if (prev == null || prev === 'locked' || (prev === 'open' && s === 'done')) states[levelId] = s;
	};
	const sprintRec = (id: string) => state.sprint?.[id] ?? {};

	// ---- base: two lines (vocab, grammar), each station opens when the one before is ★★
	const [base, focus, sprint] = route.stages;
	const baseSkills = Object.entries(base.skills).map(([skill, ids]) => {
		let prevStable = true;
		const stations = ids.map(levelId => {
			const o = open(`st:${levelId}`, prevStable, levelId);
			const s = levelState(levelId, o);
			setLevel(levelId, s);
			const stars = levelStars(levels, levelId);
			prevStable = stable(stars);
			return { id: levelId, level: levelId, state: s, stars };
		});
		return { skill, stations, done: stations.filter(x => stable(x.stars)).length, total: stations.length };
	});
	const must = base.gateToNext.mustStations;
	const baseGate = must.every(id => levelStars(levels, id) >= base.gateToNext.stars);
	const band = placementBand(inp.placementStation);
	const byPlacement = band != null && band >= base.gateToNext.orPlacementAtLeast;
	const focusOpen = open('stage:focus', baseGate || byPlacement);

	// ---- focus: per skill, chains in the probe's order (or the default); one chain being worked on at a time
	const required = (st: RouteStation) => !st.building && st.level != null && (st.required || (hard && st.tier === 'advanced'));
	const chainStable = (c: RouteChain) => c.stations.filter(required).every(st => stable(levelStars(levels, st.level)));
	const focusSkills = {} as Record<RouteSkill, ReturnType<typeof skillView>>;

	function skillView(skill: RouteSkill) {
		const sk = focus.skills[skill];
		const probe = state.probe?.[skill] ?? null;
		const ids = probe?.order?.length ? probe.order : route.chainOrder.default[skill];
		const ordered = ids.map(id => sk.chains.find(c => c.id === id)).filter((c): c is RouteChain => c != null);
		for (const c of sk.chains) if (!ordered.includes(c)) ordered.push(c);
		let active: string | null = null;
		let allBefore = focusOpen;
		const chains = ordered.map(c => {
			const st = chainStable(c);
			const cOpen = open(`chain:${c.id}`, allBefore, null) && focusOpen;
			if (cOpen && !st && active == null) active = c.id;
			allBefore = allBefore && st;
			let prevStable = true;
			const stations = c.stations.map(s => {
				if (s.building || s.level == null) return { id: s.id, zh: s.zh, tier: s.tier, level: s.level, required: required(s), optional: !required(s), state: 'building' as StationState, stars: 0 };
				const o = open(`st:${s.id}`, cOpen && prevStable, s.level);
				const state = levelState(s.level, o);
				setLevel(s.level, state);
				const stars = levelStars(levels, s.level);
				prevStable = stable(stars);
				return { id: s.id, zh: s.zh, tier: s.tier, level: s.level, required: required(s), optional: !required(s), state, stars };
			});
			const reqs = stations.filter(x => x.required);
			const building = c.stations.every(s => s.building || s.level == null);
			return {
				id: c.id, zh: c.zh, open: cOpen || stations.some(x => x.state === 'open' || x.state === 'done'), stable: st, building,
				methodCard: c.methodCard, methodSource: c.methodSource ?? null, demo: c.demo,
				stations, done: reqs.filter(x => stable(x.stars)).length, total: reqs.length,
			};
		});
		const skillStable = chains.every(c => c.stable);
		const totalReq = chains.reduce((s, c) => s + c.total, 0);
		const doneReq = chains.reduce((s, c) => s + c.done, 0);
		return {
			skill, active, stable: skillStable, chains, done: doneReq, total: totalReq,
			probe: { id: sk.placement.id, zh: sk.placement.zh, questions: sk.placement.questions.length, done: probe != null, at: probe?.at ?? null, wrong: probe?.wrong ?? null, right: probe?.right ?? null },
		};
	}

	for (const skill of ROUTE_SKILLS) focusSkills[skill] = skillView(skill);

	// ---- sprint: a skill's sprint opens when all its chains are stable; each station opens with the one before ★★
	const sprintStation = (s: RouteSprintStation, computed: boolean) => {
		if (s.level != null) {
			const o = open(`st:${s.id}`, computed, s.level);
			const st = levelState(s.level, o);
			setLevel(s.level, st);
			const stars = levelStars(levels, s.level);
			return { id: s.id, zh: s.zh, kind: 'level' as const, level: s.level, state: st, stars, gates: null, compose: null, sets: null, minutes: null, short: false, note: null, best: levels[s.level]?.best ?? null, ready: null, tries: levels[s.level]?.tries ?? 0 };
		}
		const groups = s.compose ?? (s.gates ? [s.gates] : []);
		const sets = s.sets ?? [];
		const readyGates = groups.map(g => g.filter(gate => inp.gateReady(gate, sets)));
		const ready = groups.length > 0 && readyGates.every(g => g.length > 0);
		const rec = sprintRec(s.id);
		const o = ready && open(`st:${s.id}`, computed, null);
		return {
			id: s.id, zh: s.zh, kind: s.compose ? 'set' as const : 'gate' as const, level: null,
			state: (!ready ? 'building' : rec.passedAt ? 'done' : o ? 'open' : 'locked') as StationState,
			stars: rec.stars ?? 0, gates: s.gates ?? null, compose: s.compose ?? null, sets, minutes: s.minutes ?? null, short: !!s.short, note: s.note ?? null,
			best: rec.best ?? null, ready: readyGates, tries: rec.tries ?? 0,
		};
	};
	const starsOfSprint = (x: { state: StationState; stars: number }) => (x.state === 'building' ? 2 : x.stars);
	const sprintLine = (list: RouteSprintStation[], computed: boolean) => {
		let prevOk = computed;
		return list.map(s => {
			const v = sprintStation(s, prevOk);
			// a station being built does not hold the next one back
			prevOk = prevOk && stable(starsOfSprint(v));
			return v;
		});
	};
	const sprintOpen = { reading: open('stage:sprint-reading', focusOpen && focusSkills.reading.stable), listening: open('stage:sprint-listening', focusOpen && focusSkills.listening.stable) };
	const mixedOpen = open('stage:mixed', focusOpen && focusSkills.reading.stable && focusSkills.listening.stable);
	const sprintReading = sprintLine(sprint.reading, sprintOpen.reading);
	const sprintListening = sprintLine(sprint.listening, sprintOpen.listening);
	const mixed = sprintLine(sprint.mixed.map(m => ({ id: m.id, zh: m.zh, level: m.level })), mixedOpen);
	const mk = sprint.mock;
	const all = [...sprintReading, ...sprintListening];
	const mockReady = mk.sets.length > 0 && [...(sprint.listening.at(-1)?.compose ?? []), ...(sprint.reading.at(-1)?.compose ?? [])].every(g => g.some(gate => inp.gateReady(gate, mk.sets)));
	const mockComputed = mk.opensWhen.stations.every(id => (all.find(x => x.id === id)?.stars ?? 0) >= mk.opensWhen.stars);
	const mockOpen = mockReady && open(`st:${mk.id}`, mockComputed, null);
	const mock = {
		id: mk.id, zh: mk.zh, sets: mk.sets, state: (!mockReady ? 'building' : mockOpen ? 'open' : 'locked') as StationState,
		report: state.mock ?? null,
	};

	// ---- 回炉: the badge on the chain's first station
	const firstLevel = (chainId: string) => {
		for (const sk of ROUTE_SKILLS) {
			const c = focus.skills[sk].chains.find(x => x.id === chainId);
			if (c) return c.stations.find(s => !s.building && s.level != null)?.level ?? null;
		}
		return null;
	};
	const recycle = recycleChains(route, state.events ?? [], chain => {
		const lv = firstLevel(chain);
		return lv ? levels[lv]?.lastPassAt ?? null : null;
	}, inp.now).filter(c => firstLevel(c) != null);

	// levels kept open from the old map stay open
	for (const id of kept) if (states[id] === 'locked') states[id] = 'open';

	const progress = (done: number, total: number) => ({ done, total });
	return {
		states,
		newlyOpened,
		view: {
			version: route.version, updated: route.updated, disclaimer: route.disclaimer ?? null, target,
			base: {
				id: base.id, zh: base.zh, open: true, gate: { must, stars: base.gateToNext.stars, orPlacementAtLeast: base.gateToNext.orPlacementAtLeast, done: must.filter(id => levelStars(levels, id) >= base.gateToNext.stars).length },
				skills: baseSkills, gear: base.gear, note: base.note ?? null,
			},
			focus: { id: focus.id, zh: focus.zh, open: focusOpen, byPlacement: byPlacement && !baseGate, placementBand: band, skills: focusSkills },
			sprint: {
				id: sprint.id, zh: sprint.zh,
				reading: { open: sprintOpen.reading, stations: sprintReading, ...progress(sprintReading.filter(x => stable(x.stars)).length, sprintReading.filter(x => x.state !== 'building').length) },
				listening: { open: sprintOpen.listening, stations: sprintListening, ...progress(sprintListening.filter(x => stable(x.stars)).length, sprintListening.filter(x => x.state !== 'building').length) },
				mixed: { open: mixedOpen, stations: mixed },
				mock,
			},
			recycle,
			run: state.run ?? null,
			lastRun: state.lastRun ?? null,
		},
	};
}

export type RouteView = ReturnType<typeof routeView>['view'];

// The sprint station of a gate (single gates only; SR-5 / SL-5 / the mock are runs)
export function sprintOfGate(route: QuestRoute, gate: string, set: string): RouteSprintStation | null {
	const sp = route.stages[2];
	return [...sp.reading, ...sp.listening].find(s => s.gates?.includes(gate) && (s.sets ?? []).includes(set)) ?? null;
}

// A run's groups and sets: SR-5, SL-5, or the mock (listening's whole set, then reading's)
export function runPlan(route: QuestRoute, station: string): { groups: string[][]; sets: string[]; minutes: number | null } | null {
	const sp = route.stages[2];
	if (station === sp.mock.id) {
		const L = sp.listening.find(s => s.compose)?.compose ?? [];
		const R = sp.reading.find(s => s.compose)?.compose ?? [];
		return { groups: [...L, ...R], sets: sp.mock.sets, minutes: null };
	}
	const s = [...sp.reading, ...sp.listening].find(x => x.id === station && x.compose);
	return s ? { groups: s.compose!, sets: s.sets ?? [], minutes: s.minutes ?? null } : null;
}

// Hard questions (连击爆点 only; no effect on passing, stars or hearts): the route's list, levelId/qid
export function hardSet(route: QuestRoute | null): Set<string> {
	return new Set(route?.hard?.questions ?? []);
}

/* ---------- the import check ---------- */

const isObj = (x: unknown): x is Record<string, unknown> => x != null && typeof x === 'object' && !Array.isArray(x);

// levelIds: every level and Boss in the chapters being imported; questionIds: every question id
export function routeProblems(r: unknown, levelIds: Set<string>, questionIds: Set<string>): string[] {
	if (!isObj(r)) return ['route.json 不是对象'];
	const p: string[] = [];
	const stages = r.stages as QuestRoute['stages'] | undefined;
	if (!Array.isArray(stages) || stages.length !== 3 || stages[0]?.id !== 'base' || stages[1]?.id !== 'focus' || stages[2]?.id !== 'sprint') return ['route.json: stages 要是 base、focus、sprint 三段'];
	const lv = (id: unknown, at: string) => { if (typeof id !== 'string' || !levelIds.has(id)) p.push(`${at}: 关卡 ${String(id)} 不在导入的章节里`); };
	for (const ids of Object.values(stages[0].skills ?? {})) for (const id of ids) lv(id, '基础');
	for (const id of stages[0].gateToNext?.mustStations ?? []) lv(id, '基础的门');
	const stationIds = new Set<string>();
	for (const skill of ROUTE_SKILLS) {
		const sk = stages[1].skills?.[skill];
		if (!isObj(sk) || !Array.isArray(sk.chains)) { p.push(`专项 ${skill}: 缺 chains`); continue; }
		for (const q of sk.placement?.questions ?? []) if (!questionIds.has(q.question)) p.push(`摸底 ${sk.placement.id}: 题 ${q.question} 不在章节里`);
		for (const c of sk.chains) {
			if (c.demo != null && !questionIds.has(c.demo.question)) p.push(`${c.id}: 示范题 ${c.demo.question} 不在章节里`);
			for (const s of c.stations) {
				if (stationIds.has(s.id)) p.push(`站号 ${s.id} 重复`);
				stationIds.add(s.id);
				if (s.level != null) lv(s.level, s.id);
				else if (!s.building) p.push(`${s.id}: 没有关卡，又没标建设中`);
			}
		}
		const order = (r.chainOrder as QuestRoute['chainOrder'] | undefined)?.default?.[skill] ?? [];
		for (const id of order) if (!sk.chains.some(c => c.id === id)) p.push(`chainOrder ${skill}: 没有题型 ${id}`);
	}
	for (const m of stages[2].mixed ?? []) lv(m.level, m.id);
	for (const s of [...(stages[2].reading ?? []), ...(stages[2].listening ?? [])]) {
		if (s.level != null) lv(s.level, s.id);
		else if (!s.gates && !s.compose) p.push(`${s.id}: 没有关卡也没有老关卡站号`);
	}
	const hard = (r.hard as QuestRoute['hard'] | undefined)?.questions ?? [];
	for (const h of hard) {
		const [levelId, qid] = h.split('/');
		if (!levelIds.has(levelId) || !questionIds.has(qid)) p.push(`难题 ${h}: 找不到`);
	}
	if (!isObj(r.tagToChain) || !isObj((r.tagToChain as Record<string, unknown>).byLevel)) p.push('route.json: 缺 tagToChain.byLevel');
	if (!isObj(r.recycle)) p.push('route.json: 缺 recycle');
	return p;
}

// The old one-chapter-at-a-time map (before route.json): which nodes are done, open or locked. The service uses it for
// the old map and, the first time a learner meets the route, to keep every level that was open there open for good.
export function oldMapStates(chapters: readonly QuestChapter[], levels: Record<string, MiLojoQuestLevel>, chapterOpen: (no: number) => boolean, prepOf: (no: number) => { guide: boolean; gear: boolean; news: boolean }): Record<string, 'done' | 'open' | 'locked'> {
	const states: Record<string, 'done' | 'open' | 'locked'> = {};
	for (const c of chapters) {
		const open = chapterOpen(c.no);
		const prep = prepOf(c.no);
		const passed = (id: string) => id === c.startId || levels[id]?.passedAt != null;
		for (const n of c.nodes) {
			if (!open) {
				states[n.id] = 'locked';
				continue;
			}
			if (n.kind === 'start') {
				states[n.id] = 'done';
				continue;
			}
			// Boss：连进来的每条线都要过完（原地图三章 v2：专项关听力线、阅读线都过完才能打 Boss）；别的点任意一条来路过了就开
			const into = c.edges.filter(([, b]) => b === n.id);
			const reached = n.kind === 'boss' ? into.length > 0 && into.every(([a]) => passed(a)) : into.some(([a]) => passed(a));
			const stationDone = (n.kind === 'gear' && prep.gear) || (n.kind === 'news' && prep.news) || (n.kind === 'shelf' && prep.guide);
			states[n.id] = !reached ? 'locked' : (passed(n.id) && (n.kind === 'level' || n.kind === 'boss')) || stationDone ? 'done' : 'open';
		}
	}
	return states;
}

// What the route keeps open from the old map: every level or Boss that was not locked there.
export function keptFromOldMap(chapters: readonly QuestChapter[], states: Record<string, 'done' | 'open' | 'locked'>): string[] {
	const kind = new Map(chapters.flatMap(c => c.nodes.map(n => [n.id, n.kind] as const)));
	return Object.keys(states).filter(id => states[id] !== 'locked' && (kind.get(id) === 'level' || kind.get(id) === 'boss'));
}

// The old map's chapter unlock (numbers.json), without the route: chapter 1 always; on the live site nothing more; else
// chapter 2 by placement into it or by beating chapter 1's Boss, chapters 3–4 by beating the one before.
export function oldChapterOpen(chapters: readonly QuestChapter[], levels: Record<string, MiLojoQuestLevel>, opts: { live: boolean; placedCh2: boolean }): (no: number) => boolean {
	const bossOf = new Map(chapters.map(c => [c.no, c.bossId]));
	return no => {
		if (no === 1) return true;
		if (opts.live) return false;
		if (no === 2 && opts.placedCh2) return true;
		const boss = bossOf.get(no - 1);
		return boss != null && levels[boss]?.passedAt != null;
	};
}

// The route's first state for a learner (拍旧地图快照, once): a learner who never touched the old map keeps nothing;
// otherwise every level or Boss open under the old map's own rules stays open (路线图 2026-11-13, 质量把关 拦路 1).
export function routeSnapshot(chapters: readonly QuestChapter[], levels: Record<string, MiLojoQuestLevel>, opts: { live: boolean; placedCh2: boolean }, prepOf: (no: number) => { guide: boolean; gear: boolean; news: boolean }): { kept: string[]; opened: string[] } {
	if (Object.keys(levels).length === 0) return { kept: [], opened: [] };
	return { kept: keptFromOldMap(chapters, oldMapStates(chapters, levels, oldChapterOpen(chapters, levels, opts), prepOf)), opened: [] };
}

// 全对 on the route: a passed run with not one wrong answer (a half-right pick counts as wrong). The run still ends as
// soon as enough are right, so 4 right in a row on a level, or 2 on a retest, is 全对 (路线图 2026-11-13, 拦路 2).
export function routePerfect(answers: readonly { correct: boolean }[], passed: boolean): boolean {
	return passed && answers.length > 0 && answers.every(a => a.correct);
}
