/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import type { MiDriveFile, NotesRepository, UsersRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import type { MiChatMessage } from '@/models/ChatMessage.js';
import { ChatService } from '@/core/ChatService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { RegistryApiService } from '@/core/RegistryApiService.js';
import { IdService } from '@/core/IdService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { LojoEnglishService } from '@/core/LojoEnglishService.js';
import { LojoSpeechService } from '@/core/LojoSpeechService.js';
import type Logger from '@/logger.js';
import { looksEnglish } from '@/misc/lojo-english.js';
import {
	applyMemoryUpdate,
	defaultTutorCard,
	emptyMemory,
	localDay,
	lojoTutorIds,
	memoryUpdateSystemPrompt,
	normalizeMemory,
	normalizeMemoryUpdate,
	normalizeTutorCard,
	normalizeTutorReply,
	proactiveDecision,
	tutorSystemPrompt,
} from '@/misc/lojo-tutor.js';
import type { ProactiveState, TutorCard, TutorMemory } from '@/misc/lojo-tutor.js';

const SCOPE = ['lojo', 'tutor'];
const HISTORY = 24;
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

type ChatTurn = { role: 'user' | 'assistant'; content: string };

// The AI tutor in direct messages: replies with memory, sometimes as a voice message, and writes first at most once a day.
// Phase 1 of docs/research/ai-dm-companion.md. Tutor accounts are listed in LOJO_TUTOR_IDS.
@Injectable()
export class LojoTutorService implements OnModuleInit, OnApplicationShutdown {
	private readonly tutors = lojoTutorIds();
	private readonly tz = process.env.LOJO_TUTOR_TZ || 'Asia/Shanghai';
	private readonly hours = (process.env.LOJO_TUTOR_HOURS || '9-21').split('-').map(Number);
	private readonly proactive = process.env.LOJO_TUTOR_PROACTIVE !== '0';
	// Model calls per UTC day for all tutors together, and replies per learner per day.
	private readonly dailyLimit = Number(process.env.LOJO_TUTOR_DAILY_LIMIT) || 3000;
	private readonly learnerDailyReplies = Number(process.env.LOJO_TUTOR_LEARNER_DAILY_REPLIES) || 60;
	private readonly skipUsernames = (process.env.LOJO_TUTOR_SKIP_USERNAMES ?? 'vibes_editors').split(',').map(x => x.trim()).filter(x => x !== '');
	private pendingReplies = new Map<string, NodeJS.Timeout>();
	private tick: NodeJS.Timeout | null = null;
	private logger: Logger;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,
		private chatService: ChatService,
		private globalEventService: GlobalEventService,
		private registryApiService: RegistryApiService,
		private idService: IdService,
		private loggerService: LoggerService,
		private lojoEnglishService: LojoEnglishService,
		private lojoSpeechService: LojoSpeechService,
	) {
		this.logger = this.loggerService.getLogger('lojo-tutor');
	}

	onModuleInit() {
		if (this.tutors.length === 0) return;
		this.redisForSub.on('message', this.onRedisMessage);
		if (this.proactive) {
			this.tick = setInterval(() => this.proactiveTick().catch(err => this.logger.warn(`proactive round failed: ${err}`)), 15 * MINUTE);
			this.tick.unref();
		}
	}

	@bindThis
	public onApplicationShutdown(): void {
		this.redisForSub.off('message', this.onRedisMessage);
		if (this.tick) clearInterval(this.tick);
		for (const timer of this.pendingReplies.values()) clearTimeout(timer);
	}

	// A learner's message reaches the tutor's own chat stream: chatUserStream:<tutorId>-<learnerId>.
	@bindThis
	private onRedisMessage(_: string, data: string): void {
		const obj = JSON.parse(data);
		if (typeof obj.channel !== 'string' || !obj.channel.startsWith('chatUserStream:')) return;
		const [tutorId, learnerId] = obj.channel.slice('chatUserStream:'.length).split('-');
		if (!this.tutors.includes(tutorId) || obj.message?.type !== 'message' || obj.message.body?.fromUserId !== learnerId) return;
		this.onLearnerMessage(tutorId, learnerId).catch(err => this.logger.warn(`learner message handling failed: ${err}`));
	}

	// Wait until the learner stops typing for a moment, like a person would, then answer everything at once.
	private async onLearnerMessage(tutorId: string, learnerId: string): Promise<void> {
		const key = `${tutorId}:${learnerId}`;
		await this.redisClient.hset(this.stateKey(tutorId, learnerId), { lastLearnerAt: Date.now(), unanswered: 0 });
		clearTimeout(this.pendingReplies.get(key));
		this.pendingReplies.set(key, setTimeout(() => {
			this.pendingReplies.delete(key);
			this.reply(tutorId, learnerId).catch(err => this.logger.warn(`reply failed: ${err}`));
		}, 5000 + Math.random() * 3000));
	}

	private async reply(tutorId: string, learnerId: string, attempt = 1): Promise<void> {
		// Every web process hears the message; only one answers. If an answer is still being written, try again shortly.
		if (await this.redisClient.set(`lojoTutor:replying:${tutorId}:${learnerId}`, '1', 'EX', 120, 'NX') !== 'OK') {
			if (attempt < 4) setTimeout(() => this.reply(tutorId, learnerId, attempt + 1).catch(err => this.logger.warn(`reply failed: ${err}`)), 10000);
			return;
		}
		try {
			const [tutor, learner] = await Promise.all([
				this.usersRepository.findOneByOrFail({ id: tutorId }),
				this.usersRepository.findOneByOrFail({ id: learnerId }),
			]);
			const day = new Date().toISOString().slice(0, 10);
			const replies = await this.count(`lojoTutor:replies:${tutorId}:${learnerId}:${day}`);
			if (replies > this.learnerDailyReplies) {
				// Once a day, say so instead of going quiet.
				if (await this.redisClient.set(`lojoTutor:break:${tutorId}:${learnerId}:${day}`, '1', 'EX', 2 * 24 * 60 * 60, 'NX') === 'OK') {
					await this.send(tutor, learner, ['I need a little break now 😊 Let\'s pick this up tomorrow!'], false, undefined);
				}
				return;
			}
			const [card, memory, history] = await Promise.all([this.card(tutorId), this.memory(learnerId, tutorId), this.history(tutorId, learnerId)]);
			// Already answered (another attempt got there first).
			if (history.length === 0 || history[history.length - 1].role === 'assistant') return;
			if (!(await this.spendBudget())) return;
			this.typing(learnerId, tutorId);
			const system = tutorSystemPrompt(card, memory, { learnerName: this.nameOf(learner), now: this.nowText() });
			const answer = await this.lojoEnglishService.chatJson([{ role: 'system', content: system }, ...history], 0.8, 900, normalizeTutorReply);
			await this.send(tutor, learner, answer.messages, answer.voice, card.extensions.vibes?.voice);
			this.updateMemory(tutorId, learnerId).catch(err => this.logger.warn(`notes update failed: ${err}`));
		} finally {
			await this.redisClient.del(`lojoTutor:replying:${tutorId}:${learnerId}`);
		}
	}

	// Short typing pauses between messages, and the first short English message as a voice message when asked for.
	private async send(tutor: MiUser, learner: MiUser, messages: string[], voice: boolean, voiceId: string | undefined): Promise<void> {
		const voiced = voice ? messages.findIndex(text => looksEnglish(text) && text.length <= 300) : -1;
		for (const [i, text] of messages.entries()) {
			if (i > 0) {
				this.typing(learner.id, tutor.id);
				await new Promise(resolve => setTimeout(resolve, Math.min(4000, Math.max(1200, text.length * 35))));
			}
			let file: MiDriveFile | null = null;
			if (i === voiced) {
				file = await this.lojoSpeechService.speakFile(text, voiceId).catch(err => {
					this.logger.warn(`voice message failed, sending text only: ${err}`);
					return null;
				});
			}
			await this.chatService.createMessageToUser({ id: tutor.id, host: null }, learner, { text, file });
		}
		await this.redisClient.hset(this.stateKey(tutor.id, learner.id), { lastTutorAt: Date.now() });
	}

	// After a reply, refresh the learner notes from the latest exchange (at most once a minute per learner).
	private async updateMemory(tutorId: string, learnerId: string): Promise<void> {
		if (await this.redisClient.set(`lojoTutor:notesLock:${tutorId}:${learnerId}`, '1', 'EX', 60, 'NX') !== 'OK') return;
		if (!(await this.spendBudget())) return;
		const [memory, history] = await Promise.all([this.memory(learnerId, tutorId), this.history(tutorId, learnerId, 12)]);
		const input = JSON.stringify({
			today: this.nowText(),
			notes: { profile: memory.profile, facts: memory.facts.map(({ id, text }) => ({ id, text })), summary: memory.summary },
			conversation: history.map(turn => ({ from: turn.role === 'user' ? 'learner' : 'tutor', text: turn.content })),
		});
		const update = await this.lojoEnglishService.chatJson([
			{ role: 'system', content: memoryUpdateSystemPrompt },
			{ role: 'user', content: input },
		], 0.2, 1200, normalizeMemoryUpdate);
		const next = applyMemoryUpdate(memory, update, new Date(), () => this.idService.gen());
		await this.registryApiService.set(learnerId, null, SCOPE, tutorId, next);
	}

	// Every 15 minutes: write first to learners who have not heard from the tutor today (rules in proactiveDecision).
	private async proactiveTick(): Promise<void> {
		if (await this.redisClient.set('lojoTutor:tick', '1', 'EX', 10 * 60, 'NX') !== 'OK') return;
		const tutorId = this.tutors[0];
		const query = this.usersRepository.createQueryBuilder('user')
			.where('user.host IS NULL')
			.andWhere('user.isSuspended = false')
			.andWhere('user.isDeleted = false')
			.andWhere('user.isBot = false')
			.andWhere('user.lastActiveDate > :since', { since: new Date(Date.now() - 30 * DAY) })
			.andWhere('user.id NOT IN (:...tutors)', { tutors: this.tutors });
		if (this.skipUsernames.length > 0) query.andWhere('user.usernameLower NOT IN (:...skip)', { skip: this.skipUsernames.map(x => x.toLowerCase()) });
		const learners = await query.orderBy('user.lastActiveDate', 'DESC').take(200).getMany();
		let sent = 0;
		for (const learner of learners) {
			if (sent >= 30) break;
			const state = await this.proactiveState(tutorId, learner.id);
			const decision = proactiveDecision(state, new Date(), { tz: this.tz, startHour: this.hours[0], endHour: this.hours[1] });
			if (!decision.ok) continue;
			try {
				if (await this.writeFirst(tutorId, learner.id)) sent++;
			} catch (err) {
				this.logger.warn(`first message to ${learner.id} failed: ${err}`);
			}
		}
		if (sent > 0) this.logger.info(`wrote first to ${sent} learner(s)`);
	}

	// Also used by the admin endpoint lojo/tutor/poke to try it out.
	public async writeFirst(tutorId: string, learnerId: string): Promise<boolean> {
		if (!this.tutors.includes(tutorId)) return false;
		if (await this.redisClient.set(`lojoTutor:replying:${tutorId}:${learnerId}`, '1', 'EX', 120, 'NX') !== 'OK') return false;
		try {
			if (!(await this.spendBudget())) return false;
			const [tutor, learner] = await Promise.all([
				this.usersRepository.findOneByOrFail({ id: tutorId }),
				this.usersRepository.findOneByOrFail({ id: learnerId }),
			]);
			const [card, memory, history, recentPosts] = await Promise.all([
				this.card(tutorId), this.memory(learnerId, tutorId), this.history(tutorId, learnerId), this.recentPosts(),
			]);
			// If the learner's last message is still unanswered, answer it instead of opening a new topic.
			const unanswered = history.at(-1)?.role === 'user';
			const system = tutorSystemPrompt(card, memory, {
				learnerName: this.nameOf(learner),
				now: this.nowText(),
				opener: unanswered ? undefined : { reason: this.openerReason(memory, history), recentPosts },
			});
			// The model needs at least one turn after the system prompt; an empty chat starts from a neutral cue.
			const turns: ChatTurn[] = history.length > 0 ? history : [{ role: 'user', content: '(The learner has not written yet.)' }];
			const answer = await this.lojoEnglishService.chatJson([{ role: 'system', content: system }, ...turns], 0.9, 600, normalizeTutorReply);
			this.typing(learnerId, tutorId);
			await this.send(tutor, learner, unanswered ? answer.messages : answer.messages.slice(0, 2), answer.voice, card.extensions.vibes?.voice);
			if (!unanswered) {
				const key = this.stateKey(tutorId, learnerId);
				await this.redisClient.hset(key, { lastProactiveAt: Date.now() });
				await this.redisClient.hincrby(key, 'unanswered', 1);
			}
			this.updateMemory(tutorId, learnerId).catch(err => this.logger.warn(`notes update failed: ${err}`));
			return true;
		} finally {
			await this.redisClient.del(`lojoTutor:replying:${tutorId}:${learnerId}`);
		}
	}

	private openerReason(memory: TutorMemory, history: ChatTurn[]): string {
		if (history.length === 0) return 'first time: greet them, introduce yourself in one line, and ask what they are preparing for';
		const examDate = memory.profile.examDate ? Date.parse(memory.profile.examDate) : NaN;
		const daysToExam = Math.ceil((examDate - Date.now()) / DAY);
		if (daysToExam > 0 && daysToExam <= 21) return `their exam is in ${daysToExam} days`;
		return 'a friendly daily check-in';
	}

	private async proactiveState(tutorId: string, learnerId: string): Promise<ProactiveState> {
		const [state, settings] = await Promise.all([
			this.redisClient.hgetall(this.stateKey(tutorId, learnerId)),
			this.registryApiService.getItem(learnerId, null, SCOPE, 'settings'),
		]);
		const num = (value: string | undefined) => (value != null && value !== '' ? Number(value) : null);
		return {
			muted: (settings?.value as { proactive?: boolean } | undefined)?.proactive === false,
			lastProactiveAt: num(state.lastProactiveAt),
			unanswered: num(state.unanswered) ?? 0,
			lastLearnerAt: num(state.lastLearnerAt),
			lastTutorAt: num(state.lastTutorAt),
		};
	}

	private async card(tutorId: string): Promise<TutorCard> {
		const item = await this.registryApiService.getItem(tutorId, null, SCOPE, 'card');
		return item ? normalizeTutorCard(item.value) : defaultTutorCard;
	}

	private async memory(learnerId: string, tutorId: string): Promise<TutorMemory> {
		const item = await this.registryApiService.getItem(learnerId, null, SCOPE, tutorId);
		return item ? normalizeMemory(item.value) : emptyMemory();
	}

	// Oldest first, consecutive messages merged. The tutor's turns are written in the JSON shape it answers with:
	// plain-text turns in the history made DeepSeek's JSON mode return empty answers now and then.
	private async history(tutorId: string, learnerId: string, limit = HISTORY): Promise<ChatTurn[]> {
		const messages: MiChatMessage[] = await this.chatService.userTimeline(tutorId, learnerId, limit);
		const turns: { role: ChatTurn['role']; texts: string[] }[] = [];
		for (const message of messages.reverse()) {
			const text = message.text ?? (message.fileId ? '(sent a file)' : '');
			if (text === '') continue;
			const role = message.fromUserId === tutorId ? 'assistant' : 'user';
			if (turns.at(-1)?.role === role) turns.at(-1)!.texts.push(text);
			else turns.push({ role, texts: [text] });
		}
		return turns.map(turn => ({
			role: turn.role,
			content: turn.role === 'assistant' ? JSON.stringify({ messages: turn.texts, voice: false }) : turn.texts.join('\n'),
		}));
	}

	// Three recent English posts on the site, something specific to bring up when writing first.
	private async recentPosts(): Promise<string[]> {
		const notes = await this.notesRepository.createQueryBuilder('note')
			.innerJoinAndSelect('note.user', 'user')
			.where('note.userHost IS NULL')
			.andWhere('note.visibility = \'public\'')
			.andWhere('note.replyId IS NULL')
			.andWhere('note.text IS NOT NULL')
			.andWhere('note.id > :since', { since: this.idService.gen(Date.now() - 7 * DAY) })
			.orderBy('note.id', 'DESC')
			.take(20)
			.getMany();
		return notes.filter(note => looksEnglish(note.text)).slice(0, 3)
			.map(note => `${this.nameOf(note.user!)}: ${note.text!.replace(/\s+/g, ' ').slice(0, 160)}`);
	}

	private typing(learnerId: string, tutorId: string): void {
		this.globalEventService.publishChatUserStream(learnerId, tutorId, 'typing', { userId: tutorId });
	}

	private async spendBudget(): Promise<boolean> {
		const used = await this.count(`lojoTutor:budget:${new Date().toISOString().slice(0, 10)}`);
		if (used > this.dailyLimit) {
			if (used === this.dailyLimit + 1) this.logger.warn(`daily limit of ${this.dailyLimit} tutor model calls reached`);
			return false;
		}
		return true;
	}

	private async count(key: string): Promise<number> {
		return this.redisClient.multi().incr(key).expire(key, 2 * 24 * 60 * 60).exec()
			.then(res => Number(res?.[0]?.[1] ?? 0), () => Number.POSITIVE_INFINITY);
	}

	private stateKey(tutorId: string, learnerId: string): string {
		return `lojoTutor:state:${tutorId}:${learnerId}`;
	}

	private nameOf(user: MiUser): string {
		return user.name ?? user.username;
	}

	private nowText(): string {
		const now = new Date();
		const time = new Intl.DateTimeFormat('en-GB', { timeZone: this.tz, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
		return `${localDay(now, this.tz)} ${time} (${this.tz === 'Asia/Shanghai' ? 'Beijing time' : this.tz})`;
	}
}
