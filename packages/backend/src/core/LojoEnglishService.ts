/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { RoleService } from '@/core/RoleService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { GetterService } from '@/server/api/GetterService.js';
import type { MiLocalUser } from '@/models/User.js';
import type Logger from '@/logger.js';
import { ApiError } from '@/server/api/error.js';
import { lojoEnglishErrors } from '@/server/api/lojo-schemas.js';
import {
	composeSystemPrompt,
	explainSystemPrompt,
	LojoEnglishInvalidResponse,
	normalizeDraft,
	normalizeExplanation,
	normalizeReplyIdeas,
	replySystemPrompt,
	withoutNewLinks,
} from '@/misc/lojo-english.js';
import type { LojoEnglishDraft, LojoEnglishExplanation, LojoEnglishLang, LojoEnglishReplyIdeas } from '@/misc/lojo-english.js';

const ENDPOINT = 'https://api.deepseek.com/chat/completions';
const DEFAULT_MODEL = 'deepseek-flash';
// Bump when a prompt changes, so cached answers from the old prompt are not reused.
const PROMPT_VERSION = 2;
const EXPLAIN_TTL_SEC = 60 * 60 * 24 * 30;
const REPLY_TTL_SEC = 60 * 60 * 24;
const POST_MAX_CHARS = 2000;

type ChatCompletion = {
	choices?: { finish_reason?: string; message?: { content?: string | null } }[];
};

@Injectable()
export class LojoEnglishService {
	private readonly apiKey = process.env.DEEPSEEK_API_KEY ?? '';
	private readonly model = process.env.LOJO_ENGLISH_MODEL || DEFAULT_MODEL;
	// Site-wide ceiling on model calls per UTC day, on top of the per-user endpoint limits.
	private readonly dailyLimit = Number(process.env.LOJO_ENGLISH_DAILY_LIMIT) || 3000;
	// Many readers opening the same post at once share one model call.
	private inflight = new Map<string, Promise<unknown>>();
	private logger: Logger;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		private httpRequestService: HttpRequestService,
		private loggerService: LoggerService,
		private roleService: RoleService,
		private getterService: GetterService,
		private noteEntityService: NoteEntityService,
	) {
		this.logger = this.loggerService.getLogger('lojo-english');
	}

	public async status(me: MiLocalUser) {
		const policies = await this.roleService.getUserPolicies(me.id);
		return { available: policies.canUseTranslator && this.apiKey !== '', allowed: policies.canUseTranslator };
	}

	// Only notes the user can already read are sent to the model, the same checks as notes/translate.
	public async noteText(noteId: string, me: MiLocalUser): Promise<{ text: string; replyId: string | null }> {
		const note = await this.getterService.getNote(noteId).catch(err => {
			if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(lojoEnglishErrors.noSuchNote);
			throw err;
		});
		if (!(await this.noteEntityService.isVisibleForMe(note, me.id))) throw new ApiError(lojoEnglishErrors.invisibleNote);
		const packed = await this.noteEntityService.pack(note, me);
		if (packed.isHidden) throw new ApiError(lojoEnglishErrors.invisibleNote);

		let text = note.text ?? '';
		if (note.cw != null) text = `${note.cw}\n-----\n${text}`;
		if (text.trim() === '') throw new ApiError(lojoEnglishErrors.emptyNote);
		return { text: text.slice(0, POST_MAX_CHARS), replyId: note.replyId };
	}

	public explain(text: string, lang: LojoEnglishLang): Promise<LojoEnglishExplanation> {
		const input = JSON.stringify({ post: text });
		return this.cached(`explain:${lang}`, input, EXPLAIN_TTL_SEC, false, () =>
			this.complete(explainSystemPrompt(lang), input, 0.3, 4000, normalizeExplanation));
	}

	public async compose(text: string): Promise<LojoEnglishDraft> {
		return this.complete(composeSystemPrompt, JSON.stringify({ draft: text }), 0.8, 3000, normalizeDraft);
	}

	public replyIdeas(text: string, context: string | null, refresh: boolean): Promise<LojoEnglishReplyIdeas> {
		const input = JSON.stringify(context ? { context, post: text } : { post: text });
		return this.cached('reply', input, REPLY_TTL_SEC, refresh, () =>
			this.complete(replySystemPrompt, input, 0.9, 1500, normalizeReplyIdeas));
	}

	private async cached<T>(kind: string, input: string, ttlSec: number, refresh: boolean, produce: () => Promise<T>): Promise<T> {
		const hash = createHash('sha256').update(input).digest('hex');
		const key = `lojoEnglish:${PROMPT_VERSION}:${this.model}:${kind}:${hash}`;
		if (!refresh) {
			const pending = this.inflight.get(key);
			if (pending) return pending as Promise<T>;
			// A Redis hiccup only costs a model call; it should not fail the request.
			const hit = await this.redisClient.get(key).catch(err => {
				this.logger.warn(`cache read failed: ${err}`);
				return null;
			});
			if (hit != null) {
				try {
					return JSON.parse(hit) as T;
				} catch {
					// A corrupt entry is regenerated below.
				}
			}
		}

		const promise = produce().then(async value => {
			await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSec).catch(err => this.logger.warn(`cache write failed: ${err}`));
			return value;
		}).finally(() => {
			if (this.inflight.get(key) === promise) this.inflight.delete(key);
		});
		this.inflight.set(key, promise);
		return promise;
	}

	// One retry on a malformed answer: JSON mode occasionally returns empty content.
	private async complete<T>(system: string, input: string, temperature: number, maxTokens: number, normalize: (raw: unknown) => T): Promise<T> {
		if (this.apiKey === '') throw new ApiError(lojoEnglishErrors.unavailable);
		for (let attempt = 1; ; attempt++) {
			await this.spendBudget();
			try {
				return withoutNewLinks(normalize(await this.request(system, input, temperature, maxTokens)), input);
			} catch (err) {
				if (attempt < 2 && err instanceof LojoEnglishInvalidResponse) continue;
				this.logger.warn(`DeepSeek request failed: ${err instanceof Error ? err.message : String(err)}`);
				throw new ApiError(lojoEnglishErrors.failed);
			}
		}
	}

	private async spendBudget() {
		const key = `lojoEnglish:budget:${new Date().toISOString().slice(0, 10)}`;
		const used = await this.redisClient.multi().incr(key).expire(key, 60 * 60 * 48).exec()
			.then(res => Number(res?.[0]?.[1] ?? 0), () => 0);
		if (used > this.dailyLimit) {
			if (used === this.dailyLimit + 1) this.logger.warn(`daily limit of ${this.dailyLimit} model calls reached`);
			throw new ApiError(lojoEnglishErrors.quotaExceeded);
		}
	}

	private async request(system: string, input: string, temperature: number, maxTokens: number): Promise<unknown> {
		const res = await this.httpRequestService.send(ENDPOINT, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				model: this.model,
				messages: [
					{ role: 'system', content: system },
					{ role: 'user', content: input },
				],
				response_format: { type: 'json_object' },
				thinking: { type: 'disabled' },
				temperature,
				max_tokens: maxTokens,
				stream: false,
			}),
			timeout: 60 * 1000,
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
		// A cut-off answer would be cut off again on retry, so it is not worth a second call.
		if (choice?.finish_reason === 'length') throw new Error('answer hit max_tokens');
		if (choice?.finish_reason !== 'stop' || content.trim() === '') {
			throw new LojoEnglishInvalidResponse(`finish_reason=${choice?.finish_reason ?? 'none'}`);
		}
		try {
			return JSON.parse(content);
		} catch {
			throw new LojoEnglishInvalidResponse('content is not JSON');
		}
	}
}
