/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关页面拿到的东西，不碰数据库：地图（每章的关和状态，从不给题目答案）、开一局时的题和计时、摸底交卷的结果、
// 定级横幅。LojoQuestService 读完数据库后照这些拼给页面。2026-11-16 从 LojoQuestService 搬出来，行为没变。

import {
	MAX_HEARTS, ageOf, behindOf, bookGear, dayOf, daysBetween, displayAnswer, gearPath, nextRefillAt, shuffle, streakNow,
} from '@/misc/lojo-quest.js';
import { questChapterOf, questChapters, questFindQuestion, questFirstChapter, questIsHard, questNodeOf, questQuestionOf } from '@/misc/lojo-quest-content.js';
import { questBooks } from '@/misc/lojo-quest-books.js';
import { ROUTE_SKILLS, probeOrder } from '@/misc/lojo-quest-route.js';
import { questRulesOf } from '@/misc/lojo-quest-play.js';
import { PLACEMENT_COOLDOWN_DAYS, PLACEMENT_VERSION } from '@/misc/lojo-quest-placement.js';
import { lojoTutorIds } from '@/misc/lojo-tutor.js';
import {
	questBossBeaten, questBossReady, questChapterOpen, questCurrentChapter, questGuidePath, questKnownRefs, questLastFail, questLevelOrder, questNodeStates, questPrepOf,
	questShelfOf, questSiteRules,
} from '@/misc/lojo-quest-learner.js';
import type { QuestNodeState, QuestRow } from '@/misc/lojo-quest-learner.js';
import type { QuestMode } from '@/misc/lojo-quest-play.js';
import type { QuestRoute, RouteSkill, RouteView } from '@/misc/lojo-quest-route.js';
import type { QuestChapter, QuestNode, QuestQuestion } from '@/misc/lojo-quest-types.js';
import type { MiLojoQuestAttempt, MiLojoQuestLevel, MiLojoQuestLog } from '@/models/LojoQuest.js';

// need / maxWrong / total / heart cost of a try, from the node's chapter (misc/lojo-quest-play.ts)
export const questTryRules = (node: QuestNode, mode: QuestMode) => questRulesOf(node, mode, questChapterOf(node.ch).rules);

// 限时关（第四章 4-6、Boss）：回测不限时
export const questTimedOf = (node: QuestNode, mode: QuestMode) => (mode === 'retest' ? null : node.timed);
export const questDeadlineOf = (node: QuestNode, at: { createdAt: Date }) => at.createdAt.getTime() + (node.timed?.totalSeconds ?? 0) * 1000;

// What the page gets about the clock: when it started and ends (server time), and the words to show.
export function questTimerOf(node: QuestNode, mode: QuestMode, at: { createdAt: Date }, now: Date) {
	const t = questTimedOf(node, mode);
	if (t == null) return null;
	const endsAt = questDeadlineOf(node, at);
	return {
		totalSeconds: t.totalSeconds, warnAtSecondsLeft: t.warnAtSecondsLeft, card: t.card,
		startedAt: at.createdAt.toISOString(), endsAt: new Date(endsAt).toISOString(), now: now.toISOString(),
		secondsLeft: Math.max(0, Math.ceil((endsAt - now.getTime()) / 1000)),
		copy: questChapterOf(node.ch).rules.timedCopy,
	};
}

// What the page gets for a question: never the answer, accept list, evidence or the recording's script. Chips shuffled.
// hard: on the route's list of hard questions (连击爆点 only; no effect on passing, stars or hearts)
export function questPublicQuestion(q: QuestQuestion, levelId: string | null = null) {
	let chips = q.chips;
	if (chips != null) {
		const target = q.answer.toLowerCase();
		for (let i = 0; i < 6; i++) {
			chips = shuffle(q.chips!);
			if (chips.join(' ').toLowerCase() !== target) break;
		}
	}
	return {
		id: q.id, type: q.type, skill: q.skill, passage: q.passage, question: q.question,
		options: q.options, chips, limit: q.limit, audio: q.audio != null,
		pick: q.pick, playOnce: q.playOnce, lecture: q.lecture,
		hard: levelId != null && questIsHard(levelId, q.id),
	};
}

// 三段闯关: each chain's 示范题 for the page (the question with its answer; the demo steps in route.json already give it).
// Not scored. Listening demos show the transcript in the steps, no recording.
export function questWithDemos(view: RouteView) {
	const demoOf = (demo: { question: string } | null | undefined) => {
		const q = demo ? questFindQuestion(demo.question) : undefined;
		return q ? { id: q.id, type: q.type, passage: q.passage ?? null, question: q.question ?? null, options: q.options ?? null, answer: displayAnswer(q), listening: q.audio != null } : null;
	};
	const skills = Object.fromEntries(Object.entries(view.focus.skills).map(([k, sk]) => [k, { ...sk, chains: sk.chains.map(c => ({ ...c, demoQ: demoOf(c.demo) })) }])) as unknown as typeof view.focus.skills;
	return { ...view, focus: { ...view.focus, skills } };
}

// 闯关定级: the banner (after saving, until closed, 1-2 first passed or one test done), whether a test can be taken
// now (once in 30 days), the last result and the first part kept from a test quit in its second part.
// placementOn: 定级只在测试站开（11-11）
export function questPlacementState(row: QuestRow, now: Date, placementOn: boolean) {
	const p = row.placement ?? {};
	const nextAt = p.placedAt ? new Date(Date.parse(p.placedAt) + PLACEMENT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000) : null;
	const realPass = (id: string) => row.levels[id]?.passedAt != null && !row.levels[id]?.placed;
	return {
		version: PLACEMENT_VERSION,
		on: placementOn,
		banner: placementOn && row.onboarded && !p.dismissedAt && !p.placedAt && !realPass('1-2'),
		canTest: placementOn && (nextAt == null || nextAt <= now),
		lastAt: p.placedAt ?? null,
		nextAt: nextAt?.toISOString() ?? null,
		station: p.station ?? null,
		startAt: p.startAt ?? null,
		kept: p.part1 != null,
	};
}

// One chapter for the map: its nodes and states (never the questions), whether it is open, Boss prep and the rules
// the page shows.
export function questPackChapter(c: QuestChapter, row: QuestRow, states: Record<string, QuestNodeState>, today: string, live: boolean) {
	const R = questSiteRules(c.no, live);
	return {
		id: c.id, no: c.no, version: c.version, title: c.title, band: c.band, cont: !!c.cont,
		// 页面上不再写「练习难度，不是官方分数」（创始人 11-10 删说明小字）；字段留着，免得改接口
		disclaimer: '', boss: c.boss,
		bossId: c.bossId, startId: c.startId,
		open: questChapterOpen(row, c.no, live),
		beaten: questBossBeaten(row, c.no),
		prep: questPrepOf(row, c.no),
		bossReady: questBossReady(row, c.no, live),
		bossLosses: row.levels[c.bossId]?.failStreak ?? 0,
		rules: {
			minHeartsToStart: R.level.minHeartsToStart, minHeartsToStartPractice: R.level.minHeartsToStartPractice, lowHeartsButton: R.level.lowHeartsButton,
			prepRequired: R.boss.prepRequired, prepOf: R.boss.prepOf, prep: R.boss.prep,
			extraPrepAfterLossesInARow: R.boss.extraPrepAfterLossesInARow, resetPrepAfterLossesInARow: R.boss.resetPrepAfterLossesInARow,
			multi: R.multi, timedCopy: R.timedCopy,
		},
		branches: c.branches,
		edges: c.edges,
		nodes: c.nodes.filter(n => !n.hidden).map(n => {
			const l: MiLojoQuestLevel | undefined = row.levels[n.id];
			const isLevel = n.kind === 'level' || n.kind === 'boss';
			// 7 days untouched fades, 14 turns gray; a passed retest relights
			// a level lit by the placement test never fades: it was not played
			const age = l?.passedAt && l.lastAt && !l.placed ? ageOf(dayOf(new Date(l.lastAt)), today) : null;
			return {
				id: n.id, ch: n.ch, kind: n.kind, x: n.x, y: n.y, label: n.label, name: n.name, zh: n.zh, hint: n.hint !== undefined ? n.hint : n.zh, branch: n.branch,
				skill: n.skill, type: n.type, practice: n.practice, ask: n.ask, need: n.need, maxWrong: n.maxWrong,
				hashtags: n.hashtags, tags: n.hashtags, shelf: questKnownRefs(n.shelf).map(r => Number(r.slice(1))), heartCost: n.heartCost,
				gear: isLevel || n.kind === 'gear' ? gearPath(n.gear) : null, state: states[n.id],
				// 「补 1 颗心」去哪（语法关指到词汇线）、本关装备补不补心、两个按钮的字
				heartGear: isLevel ? gearPath(n.heartGear ?? n.gear) : null, gearGivesHeart: n.gearGivesHeart, gearButton: n.gearButton, heartButton: n.heartButton,
				keepOrder: n.keepOrder,
				timed: n.timed ? { totalSeconds: n.timed.totalSeconds, warnAtSecondsLeft: n.timed.warnAtSecondsLeft, card: n.timed.card } : null,
				best: l?.best ?? null, tries: l?.tries ?? 0, failStreak: l?.failStreak ?? 0,
				stars: l?.stars ?? (l?.passedAt ? 1 : 0),
				age,
				retestable: n.retest && l?.passedAt != null && age != null,
				placed: !!l?.placed,
			};
		}),
	};
}

// The whole map page for a learner: hearts, streak, prep, the chapters, the guide shelf and the recommended book.
export function questPack(row: QuestRow, logs: MiLojoQuestLog[], now: Date, wordbookLow: boolean, openTimed: { attemptId: string; levelId: string; endsAt: string } | null, site: { live: boolean; placementOn: boolean }) {
	const live = site.live;
	const today = dayOf(now);
	const s = streakNow(row, today);
	const states = questNodeStates(row, live);
	const fail = questLastFail(row);
	const failNode = fail ? questNodeOf(fail.levelId) : undefined;
	const shelf = fail ? questShelfOf(failNode, fail.cause, fail.failStreak) : null;
	const rec = shelf?.book ?? null;
	const lit = new Set(shelf?.refs ?? []);
	const checked = new Set(logs.filter(l => l.kind === 'check' && l.data.passed === true).map(l => l.ref));
	const refilled = { guide: logs.some(l => l.kind === 'refill' && l.ref === 'guide'), gear: logs.some(l => l.kind === 'refill' && l.ref === 'gear') };
	const prep = questPrepOf(row);
	const cur = questCurrentChapter(row, live);
	const order = questLevelOrder(cur);
	const daysLeft = row.examDate ? Math.max(0, daysBetween(today, row.examDate)) : null;
	const passedDays: Record<string, string | undefined> = {};
	for (const id of order) {
		const at = row.levels[id]?.passedAt;
		passedDays[id] = at ? dayOf(new Date(at)) : undefined;
	}
	return {
		now: now.toISOString(),
		day: today,
		hearts: row.hearts,
		maxHearts: MAX_HEARTS,
		nextRefillAt: nextRefillAt(now).toISOString(),
		refilledToday: refilled,
		streak: { days: s.days, doneToday: s.doneToday, best: row.bestStreak, freezes: row.freezes, freezesNeeded: s.freezesNeeded },
		xp: row.xp,
		todayXp: logs.reduce((a, l) => a + l.xp, 0),
		prep,
		bossReady: questBossReady(row, 1, live),
		prepWaived: !!row.placement?.prepWaived,
		placement: questPlacementState(row, now, site.placementOn),
		bossLosses: row.bossLosses,
		chestToday: row.chestDay === today,
		bag: row.bag,
		badges: questChapters().filter(c => questBossBeaten(row, c.no)).map(c => c.rules.chest.badge),
		currentChapter: cur.no,
		lastFail: fail ? { levelId: fail.levelId, cause: fail.cause, failStreak: fail.failStreak } : null,
		tutorId: lojoTutorIds()[0] ?? null,
		examDate: row.examDate,
		daysLeft,
		onboarded: row.onboarded,
		behind: behindOf({ order, passed: passedDays, today, daysLeft }),
		notice: row.notice,
		chapter: questPackChapter(questFirstChapter(), row, states, today, live),
		// 四章（第二章起，正式站上是没开的铅笔稿）
		chapters: questChapters().map(c => questPackChapter(c, row, states, today, live)),
		openTimed,
		books: questBooks().map(b => {
			const g = bookGear(b, failNode?.gear, { wordbookLow, hearts: row.hearts });
			const gp = g ? gearPath(g) : null;
			return {
				no: b.no, ref: b.ref, id: b.id, slug: b.slug, spine: b.spine, title: b.title, summary: b.summary, kind: b.kind, evidence: b.evidence, color: b.color,
				app: b.app, verify: b.verify, path: questGuidePath(b), gear: gp, givesHeart: b.givesHeart && (gp?.givesHeart ?? false),
				quiz: b.quiz.map(q => ({ q: q.q, o: q.o })),
				checkedToday: checked.has(b.slug), inBag: row.bag.includes(b.slug), lit: lit.has(b.ref), recommended: rec?.no === b.no,
			};
		}),
	};
}

// What the page gets when a try starts or is picked up again.
export function questTryOut(at: Pick<MiLojoQuestAttempt, 'id' | 'levelId' | 'questionIds' | 'createdAt'>, node: QuestNode, mode: QuestMode, row: QuestRow, now: Date) {
	const rules = questTryRules(node, mode);
	const qs = at.questionIds.map(id => questQuestionOf(node, id)).filter((q): q is QuestQuestion => q != null);
	return {
		attemptId: at.id,
		levelId: at.levelId,
		ch: node.ch,
		mode,
		kind: node.kind,
		practice: node.practice,
		set: null as string | null,
		need: rules.need,
		total: qs.length,
		maxWrong: rules.maxWrong,
		heartCost: rules.heartCost,
		hp: mode === 'boss' ? questChapterOf(node.ch).boss.hp : null,
		hint: node.zh,
		hearts: row.hearts,
		multi: questChapterOf(node.ch).rules.multi,
		timer: questTimerOf(node, mode, at, now),
		questions: qs.map(q => questPublicQuestion(q, at.levelId)),
	};
}

// 摸底交卷：按题型数对错，错得最多的题型排前面，存在学员档案里（不进 levels，不给经验和星星）
export function questFinishProbe(row: QuestRow, at: MiLojoQuestAttempt, node: QuestNode, now: Date, route: QuestRoute | null, live: boolean) {
	const right = at.answers.filter(a => a.correct).length;
	let probe = null;
	if (route != null) {
		const skill = ROUTE_SKILLS.find(k => route.stages[1].skills[k].placement.id === node.id) as RouteSkill;
		const chainOfQ = new Map(route.stages[1].skills[skill].placement.questions.map(x => [x.question, x.chain]));
		const r: Record<string, number> = {};
		const w: Record<string, number> = {};
		for (const a of at.answers) {
			const c = chainOfQ.get(a.qid);
			if (c == null) continue;
			r[c] = (r[c] ?? 0) + (a.correct ? 1 : 0);
			w[c] = (w[c] ?? 0) + (a.correct ? 0 : 1);
		}
		probe = { at: now.toISOString(), right: r, wrong: w, order: probeOrder(route.chainOrder.default[skill], w) };
		row.route = { ...row.route ?? {}, probe: { ...row.route?.probe ?? {}, [skill]: probe } };
	}
	return {
		passed: true, mode: 'probe' as QuestMode, ch: node.ch, right, total: at.questionIds.length, need: at.questionIds.length, outOfHearts: false, half: 0,
		xp: 0, stars: 0, chest: null, sideChest: null, badge: null, streak: null, firstPass: false, failStreak: 0, cause: null,
		bossLosses: row.bossLosses, prepReset: false, prepExtra: false, prep: questPrepOf(row, node.ch), bossReady: questBossReady(row, node.ch, live), timer: null,
		review: at.answers.map((a, i) => {
			const q = questQuestionOf(node, a.qid);
			return {
				n: i + 1, qid: a.qid, correct: a.correct, half: !!a.half, timeout: !!a.timeout, given: q ? displayAnswer(q, a.given) : a.given,
				answer: q ? displayAnswer(q) : '', why: q?.why ?? '', evidence: q?.evidence ?? '', cause: a.cause,
			};
		}),
		recommended: null,
		probe,
	};
}
