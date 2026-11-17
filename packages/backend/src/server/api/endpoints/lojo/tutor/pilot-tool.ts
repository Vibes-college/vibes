/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// For Mia on Mastra (prototypes/mia-mastra in the workspace): the lookups Mia's tools need, so that service never reads
// the community's own tables for them. The service sends the shared secret LOJO_TUTOR_MASTRA_SECRET; an admin may call
// it too (for checks by hand).

import { timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import { lojoTutorIds } from '@/misc/lojo-tutor.js';
import { ApiError } from '@/server/api/error.js';
import { RoleService } from '@/core/RoleService.js';
import { LojoAppsService } from '@/core/LojoAppsService.js';
import { LojoWordService } from '@/core/LojoWordService.js';
import { LojoPlanService, restDayNo } from '@/core/LojoPlanService.js';

// The shared secret, compared in constant time; with no secret set, only admins get in.
function secretOk(given: string | null | undefined): boolean {
	const want = process.env.LOJO_TUTOR_MASTRA_SECRET ?? '';
	if (want.length < 16 || typeof given !== 'string') return false;
	const a = Buffer.from(given);
	const b = Buffer.from(want);
	return a.length === b.length && timingSafeEqual(a, b);
}

// 私信任务标签: Vibi's tools on the learner's plan. plan only reads; the other seven change it.
const PLAN_TOOLS = ['plan', 'setPlan', 'addTask', 'moveTask', 'setStatus', 'planWeek', 'replanFromToday', 'undo'] as const;

export const meta = {
	tags: ['lojo', 'admin'],
	requireCredential: false,
	description: 'Mia on Mastra: Mia\'s fixed prompt, the progress card, keyword search of the learner\'s chat with Mia, their wordbook, the mistakes of a quest level, the mini app tools (listApps, appSpec, appCall, recentActivity: 小程序搬出社区, 2026-11-12), and the task tab tools (plan, setPlan, addTask, moveTask, setStatus, planWeek, replanFromToday, undo: 私信任务标签, 2026-11-15; the seven writes need the turn token sent with /chat or /event), and draftAgentTask (发到我的电脑, 2026-11-15: a card the learner sends from their own browser; needs the turn token too). Needs the shared secret, or an admin.',
	errors: {
		noSuchTutor: { message: 'No such tutor.', code: 'NO_SUCH_TUTOR', id: '0b6d1b8e-3a0c-4a51-9a8e-6a0f5c2d7e11' },
		forbidden: { message: 'Forbidden.', code: 'FORBIDDEN', id: '5c1f3f0e-8f7a-4b8e-9f43-2b1d6f9a0c77' },
	},
	res: { type: 'object', optional: false, nullable: false },
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		tool: { type: 'string', enum: ['prompt', 'progress', 'searchChat', 'wordbook', 'levelMistakes', 'listApps', 'appSpec', 'appCall', 'recentActivity', ...PLAN_TOOLS, 'draftAgentTask'] },
		secret: { type: 'string', maxLength: 200, nullable: true },
		learnerId: { type: 'string', format: 'misskey:id' },
		tutorId: { type: 'string', format: 'misskey:id', nullable: true },
		query: { type: 'string', maxLength: 1000 },
		levelId: { type: 'string', maxLength: 64, nullable: true },
		limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
		app: { type: 'string', maxLength: 32, nullable: true },
		path: { type: 'string', maxLength: 100, nullable: true },
		params: { type: 'object', nullable: true },
		days: { type: 'integer', minimum: 1, maximum: 90, default: 7 },
		// the task tab tools
		turnToken: { type: 'string', maxLength: 100, nullable: true },
		examDate: { type: 'string', maxLength: 10, nullable: true },
		dailyMinutes: { type: 'integer', nullable: true },
		target: { type: 'number', nullable: true },
		current: { type: 'number', nullable: true },
		restDay: { type: 'string', enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], nullable: true },
		title: { type: 'string', maxLength: 128, nullable: true },
		date: { type: 'string', maxLength: 10, nullable: true },
		minutes: { type: 'integer', nullable: true },
		kind: { type: 'string', enum: ['task', 'checkin'], nullable: true },
		ref: { type: 'string', maxLength: 32, nullable: true },
		autoDone: { type: 'object', nullable: true },
		taskId: { type: 'string', maxLength: 32, nullable: true },
		toDate: { type: 'string', maxLength: 10, nullable: true },
		status: { type: 'string', enum: ['todo', 'doing', 'done', 'removed'], nullable: true },
		weekStart: { type: 'string', maxLength: 10, nullable: true },
		changeId: { type: 'string', maxLength: 32, nullable: true },
		// 发到我的电脑: the instruction Vibi drafts (draftAgentTask)
		instruction: { type: 'string', maxLength: 4000, nullable: true },
	},
	required: ['tool', 'learnerId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private lojoTutorService: LojoTutorService,
		private roleService: RoleService,
		private lojoAppsService: LojoAppsService,
		private lojoWordService: LojoWordService,
		private lojoPlanService: LojoPlanService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (!secretOk(ps.secret) && !(me != null && await this.roleService.isAdministrator(me))) throw new ApiError(meta.errors.forbidden);
			const tutorId = ps.tutorId ?? lojoTutorIds()[0];
			if (tutorId == null || !lojoTutorIds().includes(tutorId)) throw new ApiError(meta.errors.noSuchTutor);
			// A write needs this conversation's turn token: on time, for this learner, who is talking with Vibi. An admin
			// checking by hand needs none. Refused writes answer like the scheduler does, so Vibi can say why.
			if (ps.tool !== 'plan' && ([...PLAN_TOOLS, 'draftAgentTask'] as readonly string[]).includes(ps.tool) && !(me != null && await this.roleService.isAdministrator(me))) {
				const why = await this.lojoTutorService.checkTurnToken(ps.turnToken ?? null, ps.learnerId);
				if (why != null) return { ok: false, reason: why };
			}
			const L = ps.learnerId;
			switch (ps.tool) {
				case 'plan':
					return await this.lojoPlanService.vibiPlan(L);
				case 'setPlan': {
					const restDay = ps.restDay != null ? restDayNo(ps.restDay) : undefined;
					// current 0 = never taken it: the placement week first (需求 第二节「没考过雅思」)
					const current = ps.current == null ? null : ps.current === 0 ? 'unknown' : String(ps.current);
					return await this.lojoPlanService.setPlan(L, 'vibi', {
						examDate: ps.examDate ?? null, dailyMinutes: ps.dailyMinutes ?? null, target: ps.target == null ? null : String(ps.target), current, ...(restDay != null ? { restDay } : {}),
					});
				}
				case 'addTask':
					return await this.lojoPlanService.addTask(L, 'vibi', { title: ps.title ?? '', date: ps.date ?? null, minutes: ps.minutes ?? 0, kind: ps.kind ?? null, app: ps.app ?? null, ref: ps.ref ?? null, autoDone: ps.autoDone ?? null });
				case 'moveTask':
					return await this.lojoPlanService.moveTask(L, 'vibi', { taskId: ps.taskId ?? '', toDate: ps.toDate ?? '' });
				case 'setStatus':
					return await this.lojoPlanService.setStatus(L, 'vibi', { taskId: ps.taskId ?? '', status: ps.status ?? '' });
				case 'planWeek':
					return await this.lojoPlanService.planWeek(L, 'vibi', { weekStart: ps.weekStart ?? null });
				case 'replanFromToday':
					return await this.lojoPlanService.replanFromToday(L, 'vibi');
				case 'undo':
					return await this.lojoPlanService.undo(L, 'vibi', { changeId: ps.changeId ?? '' });
				case 'draftAgentTask':
					return await this.lojoTutorService.draftAgentTask(L, ps.instruction ?? '');
				case 'prompt':
					return await this.lojoTutorService.pilotPrompt(tutorId, ps.learnerId);
				case 'progress':
					return { card: await this.lojoTutorService.progressCard(ps.learnerId) };
				case 'searchChat':
					return { hits: await this.lojoTutorService.searchChat(tutorId, ps.learnerId, ps.query ?? '', { limit: ps.limit, minScore: 1 }) };
				case 'wordbook': {
					const facts = await this.lojoTutorService.wordbookFacts(ps.learnerId);
					// from the wordbook mini app (小程序搬出社区); a word is due when the earlier of its two cards is
					const words = await this.lojoWordService.recent(ps.learnerId, ps.limit * 4);
					const due = (w: typeof words[number]) => (w.recognize.due < w.spell.due ? w.recognize.due : w.spell.due);
					return { ...facts, recent: words.map(w => ({ text: w.text, meaning: w.meaning.slice(0, 80), due: due(w).slice(0, 10) })) };
				}
				case 'levelMistakes':
					return { mistakes: await this.lojoTutorService.questMistakes?.(ps.learnerId, ps.levelId ?? null) ?? null };
				// The mini app tools. Vibi is the only caller for now; what it may read is the directory's grants.
				case 'listApps':
					return { apps: await this.lojoAppsService.listFor('vibi') };
				case 'appSpec': {
					const app = ps.app ? await this.lojoAppsService.get(ps.app) : null;
					return app ? this.lojoAppsService.specFor(app, 'vibi') : { error: { code: 'NO_SUCH_APP', message: `no app ${ps.app ?? ''}` } };
				}
				case 'appCall': {
					const query: Record<string, string> = {};
					for (const [k, v] of Object.entries(ps.params ?? {})) if (v != null && typeof v !== 'object') query[k] = String(v);
					return await this.lojoAppsService.call('vibi', ps.learnerId, ps.app ?? '', ps.path ?? '', query);
				}
				case 'recentActivity':
					return { lines: await this.lojoAppsService.recent(ps.learnerId, { since: new Date(Date.now() - ps.days * 86400_000), app: ps.app ?? null, limit: ps.limit * 4 }) };
			}
		});
	}
}
