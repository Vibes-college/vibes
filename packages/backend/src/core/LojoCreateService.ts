/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { RegistryApiService } from '@/core/RegistryApiService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { GetterService } from '@/server/api/GetterService.js';
import type { MiMeta } from '@/models/_.js';
import type { MiLocalUser } from '@/models/User.js';
import type Logger from '@/logger.js';
import { ApiError } from '@/server/api/error.js';
import { lojoCreateErrors } from '@/server/api/lojo-schemas.js';
import {
	copyFields,
	copyMessages,
	copyText,
	createConfigProblems,
	fixedList,
	LojoCreateInvalidResponse,
	normalizePlans,
	planText,
	plansMessages,
	reviewMessages,
	toCreateConfig,
	unnamedPeople,
	unsupportedNumbers,
	verifyFixed,
} from '@/misc/lojo-create.js';
import type {
	LojoCreateConfig,
	LojoCreateCopy,
	LojoCreateDraft,
	LojoCreateInput,
	LojoCreateMessage,
	LojoCreatePlan,
	LojoCreateSource,
} from '@/misc/lojo-create.js';

const ENDPOINT = 'https://api.deepseek.com/chat/completions';
// Plans and copy are worth the stronger model; flash answers when it fails.
const DEFAULT_MODEL = 'deepseek-v4-pro';
const FALLBACK_MODEL = 'deepseek-flash';
// Bump when the plans prompt changes, so plans made by the old prompt are not reused.
const PLANS_VERSION = 4;
const PLANS_TTL_SEC = 60 * 60 * 24 * 7;
const POST_MAX_CHARS = 2000;
// Each person's drafts live in their own account registry, so they can see and delete them at /registry too.
const SCOPE = ['lojo', 'create'];
const DRAFT_PREFIX = 'draft:';
const MAX_DRAFTS = 100;
// The formats and the source accounts, imported by an admin, kept in the root account's registry: private, not in this source.
const ADMIN_SCOPE = ['lojo', 'createAdmin'];
const CONFIG_KEY = 'config';

type ChatCompletion = {
	choices?: { finish_reason?: string; message?: { content?: string | null } }[];
};

type Plans = { plans: LojoCreatePlan[]; model: string; at: string };
type Source = LojoCreateSource & { id: string; username: string };

@Injectable()
export class LojoCreateService {
	private readonly apiKey = process.env.DEEPSEEK_API_KEY ?? '';
	private readonly model = process.env.LOJO_CREATE_MODEL || DEFAULT_MODEL;
	// Site-wide ceiling on model calls per UTC day (a plan is one call, copy is two), on top of the per-user endpoint limits.
	private readonly dailyLimit = Number(process.env.LOJO_CREATE_DAILY_LIMIT) || 600;
	private configCache: { at: number; value: LojoCreateConfig } | null = null;
	// A double tap on the same post shares one model call.
	private inflight = new Map<string, Promise<Plans>>();
	private logger: Logger;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.meta)
		private meta: MiMeta,

		private httpRequestService: HttpRequestService,
		private loggerService: LoggerService,
		private registryApiService: RegistryApiService,
		private getterService: GetterService,
		private noteEntityService: NoteEntityService,
	) {
		this.logger = this.loggerService.getLogger('lojo-create');
	}

	// ---------- config ----------

	public async config(): Promise<LojoCreateConfig> {
		if (this.configCache != null && Date.now() - this.configCache.at < 60 * 1000) return this.configCache.value;
		const rootId = this.meta.rootUserId;
		const item = rootId != null ? await this.registryApiService.getItem(rootId, null, ADMIN_SCOPE, CONFIG_KEY) : null;
		const value = toCreateConfig(item?.value);
		this.configCache = { at: Date.now(), value };
		return value;
	}

	public async importConfig(raw: unknown): Promise<{ forms: number; sources: number }> {
		const problems = createConfigProblems(raw);
		if (problems.length > 0) {
			throw new ApiError({ ...lojoCreateErrors.invalidConfig, message: `${lojoCreateErrors.invalidConfig.message} ${problems.slice(0, 20).join('; ')}` }, { problems });
		}
		const rootId = this.meta.rootUserId;
		if (rootId == null) throw new ApiError(lojoCreateErrors.invalidConfig);
		const value: LojoCreateConfig = { ...toCreateConfig(raw), importedAt: new Date().toISOString() };
		await this.registryApiService.set(rootId, null, ADMIN_SCOPE, CONFIG_KEY, value);
		this.configCache = null;
		return { forms: value.forms.length, sources: value.sources.length };
	}

	public async status() {
		const config = await this.config();
		return { available: this.apiKey !== '', forms: config.forms.length, sources: config.sources };
	}

	// ---------- the post ----------

	// Only posts the person can already read, and for now only their own posts and the listed accounts' (the editors):
	// turning someone else's post into marketing needs their permission, and that rule is not written yet.
	private async source(noteId: string, me: MiLocalUser): Promise<Source> {
		const note = await this.getterService.getNote(noteId).catch(err => {
			if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(lojoCreateErrors.noSuchNote);
			throw err;
		});
		if (!(await this.noteEntityService.isVisibleForMe(note, me.id))) throw new ApiError(lojoCreateErrors.noSuchNote);
		const packed = await this.noteEntityService.pack(note, me);
		if (packed.isHidden) throw new ApiError(lojoCreateErrors.noSuchNote);

		const config = await this.config();
		const own = note.userId === me.id;
		const listed = packed.user.host == null && config.sources.includes(packed.user.username);
		if (!own && !listed) throw new ApiError(lojoCreateErrors.notASource);

		let text = note.text ?? '';
		if (note.cw != null) text = `${note.cw}\n-----\n${text}`;
		if (text.trim() === '') throw new ApiError(lojoCreateErrors.emptyNote);
		return {
			id: note.id,
			text: text.slice(0, POST_MAX_CHARS),
			author: packed.user.name ?? packed.user.username,
			username: packed.user.username,
			createdAt: packed.createdAt,
		};
	}

	// ---------- plans ----------

	private plansKey(userId: string, noteId: string) {
		return `lojoCreate:plans:${PLANS_VERSION}:${userId}:${noteId}`;
	}

	private async cachedPlans(userId: string, noteId: string): Promise<Plans | null> {
		const raw = await this.redisClient.get(this.plansKey(userId, noteId)).catch(() => null);
		if (raw == null) return null;
		try {
			return JSON.parse(raw) as Plans;
		} catch {
			return null;
		}
	}

	// Plans are kept per person and post for a week: two creators on the same post get their own, so their posts differ.
	public async plans(me: MiLocalUser, noteId: string, refresh: boolean): Promise<Plans> {
		if (this.apiKey === '') throw new ApiError(lojoCreateErrors.unavailable);
		const src = await this.source(noteId, me);
		if (!refresh) {
			const hit = await this.cachedPlans(me.id, src.id);
			if (hit != null) return hit;
		}
		const key = this.plansKey(me.id, src.id);
		const running = this.inflight.get(key);
		if (running != null) return running;
		const job = (async () => {
			const config = await this.config();
			const { data, model } = await this.ask(plansMessages(src, config.forms), 0.7, 3500);
			const plans = normalizePlans(data, config.forms).map((p) => {
				// Plans get no second pass; made-up numbers and people are at least named, and the copy's second pass
				// removes them.
				const numbers = unsupportedNumbers(planText(p), src.text);
				// People only in what gets published: the steps also say things like 「用一张名人的截图开头」.
				const people = unnamedPeople([p.hook, p.title].join('\n'), src.text);
				if (numbers.length === 0 && people.length === 0) return p;
				const quoted = (list: string[]) => list.map(n => `「${n}」`).join('');
				const risk = [
					numbers.length > 0 ? `${quoted(numbers)}原帖里没有，写文案时删掉或者找到出处。` : '',
					people.length > 0 ? `${quoted(people)}查不到是谁：换成真实的人和出处，找不到就别用。` : '',
					/^无[。.]?$/.test(p.risk.trim()) ? '' : p.risk,
				].join('');
				return { ...p, risk: risk.slice(0, 400) };
			});
			if (plans.length === 0) throw new ApiError(lojoCreateErrors.failed);
			const out: Plans = { plans, model, at: new Date().toISOString() };
			await this.redisClient.set(key, JSON.stringify(out), 'EX', PLANS_TTL_SEC).catch(err => this.logger.warn(`cache write failed: ${err}`));
			return out;
		})().finally(() => this.inflight.delete(key));
		this.inflight.set(key, job);
		return job;
	}

	// ---------- copy ----------

	// The plan comes from the person's own plans for the post, not from the request.
	public async copy(me: MiLocalUser, noteId: string, planIndex: number, input: LojoCreateInput): Promise<LojoCreateDraft> {
		if (this.apiKey === '') throw new ApiError(lojoCreateErrors.unavailable);
		const src = await this.source(noteId, me);
		const plan = (await this.cachedPlans(me.id, src.id))?.plans[planIndex];
		if (plan == null) throw new ApiError(lojoCreateErrors.plansExpired);
		const config = await this.config();
		const form = plan.form !== '' ? config.forms.find(f => f.name === plan.form) ?? null : null;
		const video = /视频/.test(plan.medium);
		// What the copy may say: the post, and what the creator said about their own idea and story.
		const known = [src.text, input.idea, input.story].join('\n');

		const first = await this.ask(copyMessages(src, plan, form, input), 0.5, 3500);
		const draftCopy: LojoCreateCopy = { titles: [], cover: '', body: '', script: '', pin: '', ai: '', checks: [], ...copyFields(first.data) };
		if (draftCopy.body === '') throw new ApiError(lojoCreateErrors.failed);

		let final = draftCopy;
		let fixed: string[] = [];
		let reviewed = false;
		try {
			const firstText = copyText(draftCopy);
			const review = await this.ask(reviewMessages(src, draftCopy, input, video, unsupportedNumbers(firstText, known), unnamedPeople(firstText, known)), 0.2, 3500);
			final = { ...draftCopy, ...copyFields(review.data) };
			const claims = verifyFixed(draftCopy, final, fixedList(review.data));
			fixed = claims.fixed;
			if (claims.unconfirmed.length > 0) {
				final = { ...final, checks: [...final.checks, ...claims.unconfirmed.map(c => ({ level: 'warn' as const, text: `自查说改了，其实没改成：${c}` }))].slice(0, 12) };
			}
			reviewed = true;
		} catch (err) {
			// The first copy is still worth showing; the page says it was not checked.
			if (err instanceof ApiError && err.code === lojoCreateErrors.quotaExceeded.code) throw err;
			this.logger.warn(`review failed: ${err instanceof Error ? err.message : String(err)}`);
		}

		// Whatever made-up number or person is still there is marked 要改, whether or not the second pass ran.
		const finalText = copyText(final);
		const left = [
			...unsupportedNumbers(finalText, known).map(n => ({ n, text: `「${n}」原帖里没有这个数：删掉，或者找到出处再用` })),
			...unnamedPeople(finalText, known).map(n => ({ n, text: `「${n}」查不到是谁：换成真实的人和出处，或者删掉` })),
		].filter(l => !final.checks.some(c => c.text.includes(l.n)));
		if (left.length > 0) final = { ...final, checks: [...left.map(l => ({ level: 'must' as const, text: l.text })), ...final.checks].slice(0, 12) };

		const now = new Date().toISOString();
		const draft: LojoCreateDraft = {
			...final,
			id: randomBytes(6).toString('hex'),
			noteId: src.id,
			noteBy: src.author,
			noteUser: src.username,
			noteText: src.text.slice(0, 400),
			plan,
			formHow: form?.how ?? '',
			input,
			chosenTitle: final.titles[0] ?? '',
			fixed,
			model: first.model,
			reviewed,
			createdAt: now,
			updatedAt: now,
		};
		await this.registryApiService.set(me.id, null, SCOPE, `${DRAFT_PREFIX}${draft.id}`, draft);
		await this.trimDrafts(me.id).catch(err => this.logger.warn(`trimming drafts failed: ${err}`));
		return draft;
	}

	// Keep the newest MAX_DRAFTS.
	private async trimDrafts(userId: string) {
		const items = (await this.registryApiService.getAllItemsOfScope(userId, null, SCOPE)).filter(item => item.key.startsWith(DRAFT_PREFIX));
		if (items.length <= MAX_DRAFTS) return;
		items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
		for (const item of items.slice(MAX_DRAFTS)) await this.registryApiService.remove(userId, null, SCOPE, item.key);
	}

	// ---------- DeepSeek ----------

	private async spendBudget() {
		const key = `lojoCreate:budget:${new Date().toISOString().slice(0, 10)}`;
		const used = await this.redisClient.multi().incr(key).expire(key, 60 * 60 * 48).exec()
			.then(res => Number(res?.[0]?.[1] ?? 0), () => 0);
		if (used > this.dailyLimit) {
			if (used === this.dailyLimit + 1) this.logger.warn(`daily limit of ${this.dailyLimit} model calls reached`);
			throw new ApiError(lojoCreateErrors.quotaExceeded);
		}
	}

	// The configured model first, once more on a malformed answer, then the fallback model.
	private async ask(messages: LojoCreateMessage[], temperature: number, maxTokens: number): Promise<{ data: unknown; model: string }> {
		await this.spendBudget();
		const models = this.model === FALLBACK_MODEL ? [this.model] : [this.model, FALLBACK_MODEL];
		let last: unknown = null;
		for (const model of models) {
			for (let attempt = 1; attempt <= 2; attempt++) {
				try {
					return { data: await this.request(model, messages, temperature, maxTokens), model };
				} catch (err) {
					last = err;
					if (!(err instanceof LojoCreateInvalidResponse)) break;
				}
			}
		}
		this.logger.warn(`DeepSeek request failed: ${last instanceof Error ? last.message : String(last)}`);
		throw new ApiError(lojoCreateErrors.failed);
	}

	private async request(model: string, messages: LojoCreateMessage[], temperature: number, maxTokens: number): Promise<unknown> {
		const res = await this.httpRequestService.send(ENDPOINT, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				model,
				messages,
				response_format: { type: 'json_object' },
				thinking: { type: 'disabled' },
				temperature,
				max_tokens: maxTokens,
				stream: false,
			}),
			// Plans take about 25 s.
			timeout: 120 * 1000,
			// ENDPOINT is a fixed constant, so the private-address guard (meant for user-supplied URLs) adds nothing here.
			// Allowing it keeps the call working behind fake-IP proxies that resolve hosts to 198.18.0.0/15.
			isLocalAddressAllowed: true,
		}, { throwErrorWhenResponseNotOk: false });

		if (!res.ok) {
			const detail = (await res.text().catch(() => '')).slice(0, 300);
			throw new Error(`HTTP ${res.status} ${detail}`);
		}

		const json = await res.json() as ChatCompletion;
		const choice = json.choices?.[0];
		const content = choice?.message?.content ?? '';
		if (choice?.finish_reason === 'length') throw new Error('answer hit max_tokens');
		if (choice?.finish_reason !== 'stop' || content.trim() === '') {
			throw new LojoCreateInvalidResponse(`finish_reason=${choice?.finish_reason ?? 'none'}`);
		}
		try {
			return JSON.parse(content);
		} catch {
			throw new LojoCreateInvalidResponse('content is not JSON');
		}
	}
}
