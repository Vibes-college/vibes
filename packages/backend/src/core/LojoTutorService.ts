/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DataSource } from 'typeorm';
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
import { LojoGateService } from '@/core/LojoGateService.js';
import { LojoWordService } from '@/core/LojoWordService.js';
import type { MiLocalUser } from '@/models/User.js';
import type Logger from '@/logger.js';
import type { Config } from '@/config.js';
import { looksEnglish } from '@/misc/lojo-english.js';
import {
	applyMemoryUpdate,
	defaultTutorCard,
	emptyMemory,
	localDay,
	localHour,
	lojoTutorIds,
	memoryUpdateSystemPrompt,
	normalizeMemory,
	normalizeMemoryUpdate,
	normalizeTutorCard,
	normalizeTutorReply,
	NOTES_EVERY,
	asksToRememberOrForget,
	proactiveDecision,
	tutorContextMessage,
	tutorSystemPrompt,
} from '@/misc/lojo-tutor.js';
import type { ProactiveState, TutorCard, TutorMemory, TutorReply } from '@/misc/lojo-tutor.js';
import { normalizeQuestTry, pickQuestKnowledge, questAwayMessage, questKnowledgeSection, questNextLine, questTrySection, TUTOR_AWAY_PREFIX } from '@/misc/lojo-tutor-quest.js';
import type { QuestKnowledge, QuestTry } from '@/misc/lojo-tutor-quest.js';
import { hitScore, progressCardText, RECALL_MIN_SCORE, recallText, searchTerms } from '@/misc/lojo-tutor-progress.js';
import type { ChatHit, QuestMistakes, QuestProgressFacts, WordbookFacts } from '@/misc/lojo-tutor-progress.js';

const SCOPE = ['lojo', 'tutor'];
const HISTORY = 30;
// The chat in the prompt grows from 30 to 80 messages and then drops the oldest 50 at once, so its start stays the same
// (and cached) between the jumps instead of moving by one every reply. Mia sends one to three messages per reply, so 80
// is about 25 exchanges; cached tokens cost 1/50 of new ones, so a longer chat costs little and jumps less often.
const HISTORY_MAX = 80;
// A chat session ends after 30 minutes without a message. Within one, the notes in the prompt are the ones read when it
// began (as Hermes Agent does), so the start of the prompt does not change; new notes are used from the next session.
const SESSION_SECONDS = 30 * 60;
const NOTES_DUE_KEY = 'lojoTutor:notesDue';
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
// After "Ask Mia" on a failed level, her replies carry that try for two hours; a learner can ask at most 10 times a day.
const QUEST_TTL_SECONDS = 2 * 60 * 60;
const QUEST_DAILY = 10;

export type QuestAskResult = 'sent' | 'already' | 'limit' | 'off' | 'away';

// While the model account has no balance or a bad key (HTTP 402 / 401), the tutor is "away": no model calls, fixed
// messages instead, and the learners who wrote meanwhile get a real answer once it is back. 冲刺1111/Mia/兜底规格.md.
const DOWN_KEY = 'lojoTutor:down';
const DOWN_TTL_SECONDS = 30 * 60;
const PENDING_KEY = 'lojoTutor:pending';
const AWAY_NOTE_TTL_SECONDS = 6 * 60 * 60;
const CATCH_UP_PER_ROUND = 30;
const modelDownReason = (err: unknown): string | null => /^HTTP (401|402)\b/.exec(err instanceof Error ? err.message : '')?.[1] ?? null;

type ChatTurn = { role: 'user' | 'assistant' | 'system'; content: string };

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
		@Inject(DI.config)
		private config: Config,
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,
		@Inject(DI.db)
		private db: DataSource,
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
		private lojoGateService: LojoGateService,
		private lojoWordService: LojoWordService,
	) {
		this.logger = this.loggerService.getLogger('lojo-tutor');
	}

	onModuleInit() {
		if (this.tutors.length === 0) return;
		this.redisForSub.on('message', this.onRedisMessage);
		// Every 15 minutes: check whether the model is back, answer who wrote while it was away, then write first.
		this.tick = setInterval(() => this.proactiveTick().catch(err => this.logger.warn(`proactive round failed: ${err}`)), 15 * MINUTE);
		this.tick.unref();
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
		this.onLearnerMessage(tutorId, learnerId, String(obj.message.body?.id ?? '')).catch(err => this.logger.warn(`learner message handling failed: ${err}`));
	}

	// Wait until the learner stops typing for a moment, like a person would, then answer everything at once.
	private async onLearnerMessage(tutorId: string, learnerId: string, messageId: string): Promise<void> {
		const key = `${tutorId}:${learnerId}`;
		await this.redisClient.hset(this.stateKey(tutorId, learnerId), { lastLearnerAt: Date.now(), unanswered: 0 });
		// Every web process hears the message; it is counted once towards the next notes update.
		if (messageId !== '' && await this.redisClient.set(`lojoTutor:seen:${messageId}`, '1', 'EX', 10 * 60, 'NX') === 'OK') {
			await this.redisClient.hincrby(this.stateKey(tutorId, learnerId), 'notesPending', 1);
			await this.redisClient.zadd(NOTES_DUE_KEY, Date.now(), key);
		}
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
			if (await this.isDown()) {
				await this.sayAway(tutor, learner);
				return;
			}
			const day = new Date().toISOString().slice(0, 10);
			const replies = await this.count(`lojoTutor:replies:${tutorId}:${learnerId}:${day}`);
			if (replies > this.learnerDailyReplies) {
				// Once a day, say so instead of going quiet.
				if (await this.redisClient.set(`lojoTutor:break:${tutorId}:${learnerId}:${day}`, '1', 'EX', 2 * 24 * 60 * 60, 'NX') === 'OK') {
					await this.send(tutor, learner, ['I need a little break now 😊 Let\'s pick this up tomorrow!'], false, undefined);
				}
				return;
			}
			const [card, memory, history, progress, quest] = await Promise.all([
				this.card(tutorId), this.sessionMemory(tutorId, learnerId), this.sessionHistory(tutorId, learnerId), this.progressCard(learnerId), this.questContext(tutorId, learnerId),
			]);
			// Already answered (another attempt got there first).
			if (history.length === 0 || history[history.length - 1].role === 'assistant') return;
			const recall = await this.recall(tutorId, learnerId, history);
			if (!(await this.spendBudget())) return;
			// In the two hours after "Ask Mia" she answers follow-ups with the try at hand, but with the hearts as of now and
			// without the 👉 link again: a link only goes out for a step not linked yet for this try (AI tutor, 2026-11-10:
			// repeating "0 hearts… read guide 7" and the link under every answer read like an ad).
			const questTry = quest && await this.withFreshHearts(learnerId, quest.questTry);
			const system = tutorSystemPrompt(card, memory, { questKnowledge: quest && questKnowledgeSection(quest.knowledge) });
			const context = tutorContextMessage({ now: this.nowText(), learnerName: this.nameOf(learner), progress, recall, quest: quest && questTry && questTrySection(quest.knowledge, questTry, true) });
			let answer: TutorReply;
			try {
				answer = await this.whileTyping(learnerId, tutorId, () => this.lojoEnglishService.chatJson([{ role: 'system', content: system }, ...history, { role: 'system', content: context }], 0.8, 900, normalizeTutorReply, `tutor.reply learner=${learnerId}`));
			} catch (err) {
				if (!(await this.markDownOn(err))) throw err;
				await this.sayAway(tutor, learner);
				return;
			}
			await this.send(tutor, learner, await this.withNextLink(tutorId, answer, questTry ?? undefined), answer.voice, card.extensions.vibes?.voice);
			const lastLearner = history.findLast(turn => turn.role === 'user')?.content ?? '';
			this.maybeUpdateMemory(tutorId, learnerId, asksToRememberOrForget(lastLearner)).catch(err => this.logger.warn(`notes update failed: ${err}`));
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

	// The notes are rewritten when the learner has written 6 messages since the last time, or asked to remember or forget
	// something, or failed a quest level (force); a chat that stopped for 30 minutes is caught by notesAfterPause.
	private async maybeUpdateMemory(tutorId: string, learnerId: string, force: boolean): Promise<void> {
		const pending = Number(await this.redisClient.hget(this.stateKey(tutorId, learnerId), 'notesPending') ?? 0);
		if (force || pending >= NOTES_EVERY) await this.updateMemory(tutorId, learnerId);
	}

	// Chats that stopped 30 minutes ago with messages not yet in the notes (every 15 minutes, with the proactive round).
	private async notesAfterPause(): Promise<void> {
		const due = await this.redisClient.zrangebyscore(NOTES_DUE_KEY, 0, Date.now() - SESSION_SECONDS * 1000, 'LIMIT', 0, 50);
		for (const pair of due) {
			await this.redisClient.zrem(NOTES_DUE_KEY, pair);
			const [tutorId, learnerId] = pair.split(':');
			if (!this.tutors.includes(tutorId) || learnerId == null) continue;
			if (Number(await this.redisClient.hget(this.stateKey(tutorId, learnerId), 'notesPending') ?? 0) === 0) continue;
			await this.updateMemory(tutorId, learnerId).catch(err => this.logger.warn(`notes update failed: ${err}`));
		}
	}

	// Refresh the learner notes from the latest messages (at most once a minute per learner). The model is the English
	// helper's (deepseek-flash unless LOJO_ENGLISH_MODEL says otherwise).
	private async updateMemory(tutorId: string, learnerId: string): Promise<void> {
		if (await this.redisClient.set(`lojoTutor:notesLock:${tutorId}:${learnerId}`, '1', 'EX', 60, 'NX') !== 'OK') return;
		if (!(await this.spendBudget())) return;
		// Messages that arrive while this runs count towards the next update.
		const pending = Number(await this.redisClient.hget(this.stateKey(tutorId, learnerId), 'notesPending') ?? 0);
		// The same start as Mia's replies (her prompt and this chat), so the cache that her last reply filled answers most of
		// it; the notes task, the date and the current notes come last.
		const [card, learner, sessionMemory, history, quest, memory] = await Promise.all([
			this.card(tutorId), this.usersRepository.findOneBy({ id: learnerId }), this.sessionMemory(tutorId, learnerId),
			this.sessionHistory(tutorId, learnerId), this.questContext(tutorId, learnerId), this.memory(learnerId, tutorId),
		]);
		if (learner == null) return;
		const task = memoryUpdateSystemPrompt + '\n\n' + JSON.stringify({
			today: this.nowText(),
			notes: { profile: memory.profile, facts: memory.facts.map(({ id, text }) => ({ id, text })), summary: memory.summary },
		});
		const update = await this.lojoEnglishService.chatJson([
			{ role: 'system', content: tutorSystemPrompt(card, sessionMemory, { questKnowledge: quest && questKnowledgeSection(quest.knowledge) }) },
			...history,
			{ role: 'system', content: task },
		], 0.2, 1200, normalizeMemoryUpdate, `tutor.notes learner=${learnerId}`);
		const next = applyMemoryUpdate(memory, update, new Date(), () => this.idService.gen());
		await this.registryApiService.set(learnerId, null, SCOPE, tutorId, next);
		await this.redisClient.hincrby(this.stateKey(tutorId, learnerId), 'notesPending', -pending);
	}

	// Every 15 minutes: write first to learners who have not heard from the tutor today (rules in proactiveDecision).
	private async proactiveTick(): Promise<void> {
		if (await this.redisClient.set('lojoTutor:tick', '1', 'EX', 10 * 60, 'NX') !== 'OK') return;
		if (await this.isDown()) {
			// Asking for the balance is free; no learner is written to until it says the account can take calls.
			if (await this.lojoEnglishService.modelAvailable() !== true) {
				await this.redisClient.expire(DOWN_KEY, DOWN_TTL_SECONDS);
				return;
			}
			await this.redisClient.del(DOWN_KEY);
			this.logger.info('tutor model back');
		}
		await this.catchUp();
		await this.notesAfterPause();
		if (!this.proactive) return;
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
				if (await this.markDownOn(err)) break;
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
			const [card, memory, history, recentPosts, progress] = await Promise.all([
				this.card(tutorId), this.sessionMemory(tutorId, learnerId), this.sessionHistory(tutorId, learnerId), this.recentPosts(), this.progressCard(learnerId),
			]);
			// If the learner's last message is still unanswered, answer it instead of opening a new topic.
			const unanswered = history.at(-1)?.role === 'user';
			const system = tutorSystemPrompt(card, memory, {});
			const context = tutorContextMessage({
				now: this.nowText(),
				learnerName: this.nameOf(learner),
				opener: unanswered ? undefined : { reason: this.openerReason(memory, history), recentPosts },
				progress,
			});
			// The model answers the last turn. After the tutor's own messages that has to be a cue, not her last reply,
			// or she repeats it; an empty chat starts from a neutral cue too.
			const cue = history.length === 0 ? '(The learner has not written yet.)' : '(The learner has not replied yet. Write first now, as described above.)';
			const turns: ChatTurn[] = unanswered ? history : [...history, { role: 'user', content: cue }];
			const answer = await this.whileTyping(learnerId, tutorId, () => this.lojoEnglishService.chatJson([{ role: 'system', content: system }, ...turns, { role: 'system', content: context }], 0.9, 600, normalizeTutorReply, `tutor.first learner=${learnerId}`));
			await this.send(tutor, learner, unanswered ? answer.messages : answer.messages.slice(0, 2), answer.voice, card.extensions.vibes?.voice);
			if (!unanswered) {
				const key = this.stateKey(tutorId, learnerId);
				await this.redisClient.hset(key, { lastProactiveAt: Date.now() });
				await this.redisClient.hincrby(key, 'unanswered', 1);
			} else {
				this.maybeUpdateMemory(tutorId, learnerId, false).catch(err => this.logger.warn(`notes update failed: ${err}`));
			}
			return true;
		} finally {
			await this.redisClient.del(`lojoTutor:replying:${tutorId}:${learnerId}`);
		}
	}

	// "Ask Mia" on a failed level (endpoint lojo/quest/ask-tutor, after it checked the try is the learner's own, submitted
	// and failed). Not a proactive message: no quiet hours, and it does not use up today's first message.
	// Returns at once; she shows "typing" and writes within seconds.
	public async openFromQuest(tutorId: string, learnerId: string, rawTry: unknown): Promise<QuestAskResult> {
		if (!this.tutors.includes(tutorId)) return 'off';
		const questTry = normalizeQuestTry(rawTry);
		if (questTry == null) return 'off';
		// No quest knowledge on the tutor account means no quest mode (the production tutor has none yet).
		if ((await this.questKnowledge(tutorId, questTry)) == null) return 'off';
		// Away: the quest page opens the recommended guide itself; this try and today's asks are not used up.
		if (await this.isDown()) return 'away';
		if (await this.redisClient.set(`lojoTutor:questOnce:${tutorId}:${questTry.attemptId}`, '1', 'EX', 3 * 24 * 60 * 60, 'NX') !== 'OK') return 'already';
		const asked = await this.count(`lojoTutor:questAsks:${tutorId}:${learnerId}:${localDay(new Date(), this.tz)}`);
		if (asked > QUEST_DAILY) return 'limit';
		await this.redisClient.set(this.questKey(tutorId, learnerId), JSON.stringify(questTry), 'EX', QUEST_TTL_SECONDS);
		this.writeForQuest(tutorId, learnerId).catch(err => this.logger.warn(`quest message to ${learnerId} failed: ${err}`));
		return 'sent';
	}

	private async writeForQuest(tutorId: string, learnerId: string, attempt = 1): Promise<void> {
		// Another reply may be on its way (the learner just wrote); try again shortly instead of talking over it.
		if (await this.redisClient.set(`lojoTutor:replying:${tutorId}:${learnerId}`, '1', 'EX', 120, 'NX') !== 'OK') {
			if (attempt < 4) setTimeout(() => this.writeForQuest(tutorId, learnerId, attempt + 1).catch(err => this.logger.warn(`quest message failed: ${err}`)), 8000);
			return;
		}
		try {
			if (!(await this.spendBudget())) return;
			const [tutor, learner] = await Promise.all([
				this.usersRepository.findOneByOrFail({ id: tutorId }),
				this.usersRepository.findOneByOrFail({ id: learnerId }),
			]);
			const [card, memory, history, progress, quest] = await Promise.all([
				this.card(tutorId), this.sessionMemory(tutorId, learnerId), this.sessionHistory(tutorId, learnerId), this.progressCard(learnerId), this.questContext(tutorId, learnerId),
			]);
			if (quest == null) return;
			if (await this.isDown()) {
				await this.sayAwayForQuest(tutor, learner, quest.knowledge, quest.questTry);
				return;
			}
			const system = tutorSystemPrompt(card, memory, { questKnowledge: questKnowledgeSection(quest.knowledge) });
			const context = tutorContextMessage({ now: this.nowText(), learnerName: this.nameOf(learner), progress, quest: questTrySection(quest.knowledge, quest.questTry) });
			// As in writeFirst, the model answers the last turn, so it ends with a cue (added to an unanswered message if there is one).
			const cue = '(The learner just failed this level and tapped "Ask Mia". Write first now, in quest mode as described above.)';
			const turns: ChatTurn[] = history.at(-1)?.role === 'user'
				? [...history.slice(0, -1), { role: 'user', content: `${history.at(-1)!.content}\n${cue}` }]
				: [...history, { role: 'user', content: cue }];
			let answer: TutorReply;
			try {
				answer = await this.whileTyping(learnerId, tutorId, () => this.lojoEnglishService.chatJson([{ role: 'system', content: system }, ...turns, { role: 'system', content: context }], 0.7, 900, normalizeTutorReply, `tutor.quest learner=${learnerId}`));
			} catch (err) {
				// The first learner to run into it still gets where to go next, built from this try without the model.
				if (!(await this.markDownOn(err))) throw err;
				await this.sayAwayForQuest(tutor, learner, quest.knowledge, quest.questTry);
				return;
			}
			await this.send(tutor, learner, await this.withNextLink(tutorId, answer, quest.questTry), answer.voice, card.extensions.vibes?.voice);
			// A failed level is worth writing down now.
			this.maybeUpdateMemory(tutorId, learnerId, true).catch(err => this.logger.warn(`notes update failed: ${err}`));
		} finally {
			await this.redisClient.del(`lojoTutor:replying:${tutorId}:${learnerId}`);
		}
	}

	private async isDown(): Promise<boolean> {
		return (await this.redisClient.exists(DOWN_KEY).catch(() => 0)) === 1;
	}

	// True when the error means the model account cannot take calls (no balance, bad key); the first one is logged once.
	// Timeouts and 5xx are passing trouble and do not count.
	private async markDownOn(err: unknown): Promise<boolean> {
		const reason = modelDownReason(err);
		if (reason == null) return false;
		if (await this.redisClient.set(DOWN_KEY, reason, 'EX', DOWN_TTL_SECONDS, 'NX') === 'OK') this.logger.warn(`tutor model unavailable: ${reason}`);
		return true;
	}

	// A DM while away: one fixed line per learner in six hours, and a real answer once the model is back (catchUp).
	private async sayAway(tutor: MiUser, learner: MiUser): Promise<void> {
		await this.redisClient.sadd(PENDING_KEY, `${tutor.id}:${learner.id}`);
		if (await this.redisClient.set(`lojoTutor:awayNote:${tutor.id}:${learner.id}`, '1', 'EX', AWAY_NOTE_TTL_SECONDS, 'NX') !== 'OK') return;
		const map = `${this.config.url.replace(/\/$/, '')}/quest`;
		await this.send(tutor, learner, [`${TUTOR_AWAY_PREFIX}，你的消息她回来会先看 🙏 想先练的话，👉 闯关地图 ${map}`], false, undefined);
	}

	private async sayAwayForQuest(tutor: MiUser, learner: MiUser, knowledge: QuestKnowledge, questTry: QuestTry): Promise<void> {
		const away = questAwayMessage(knowledge, questTry);
		await this.send(tutor, learner, await this.withNextLink(tutor.id, { ...away, voice: false }, questTry), false, undefined);
	}

	// Once the model is back: answer up to 30 learners who wrote while it was away and are still waiting.
	private async catchUp(): Promise<void> {
		const waiting = await this.redisClient.srandmember(PENDING_KEY, CATCH_UP_PER_ROUND);
		if (waiting.length === 0) return;
		let answered = 0;
		for (const pair of waiting) {
			const [tutorId, learnerId] = pair.split(':');
			await this.redisClient.srem(PENDING_KEY, pair);
			if (!this.tutors.includes(tutorId) || learnerId == null) continue;
			try {
				if ((await this.history(tutorId, learnerId, 6)).at(-1)?.role !== 'user') continue;
				await this.reply(tutorId, learnerId);
				if (await this.isDown()) break;
				answered++;
			} catch (err) {
				this.logger.warn(`catch-up reply to ${learnerId} failed: ${err}`);
			}
		}
		if (answered > 0) this.logger.info(`answered ${answered} learner(s) who wrote while the tutor was away`);
	}

	// The try from "Ask Mia" in the last two hours, with the quest knowledge; null outside quest mode.
	private async questContext(tutorId: string, learnerId: string): Promise<{ knowledge: QuestKnowledge; questTry: QuestTry } | null> {
		try {
			const raw = await this.redisClient.get(this.questKey(tutorId, learnerId));
			if (raw == null) return null;
			const questTry = normalizeQuestTry(JSON.parse(raw));
			const knowledge = questTry && await this.questKnowledge(tutorId, questTry, true);
			return questTry && knowledge ? { knowledge, questTry } : null;
		} catch (err) {
			this.logger.warn(`quest context failed: ${err}`);
			return null;
		}
	}

	// Knowledge for the try's chapter: quest-ch<N>, else quest (按章读知识-需求.md). With log, one line says which
	// draft Mia read (info), or a warn when chapter N's own draft is missing or invalid.
	private async questKnowledge(tutorId: string, questTry: QuestTry, log = false): Promise<QuestKnowledge | null> {
		const pick = await pickQuestKnowledge(questTry, async key => (await this.registryApiService.getItem(tutorId, null, SCOPE, key))?.value);
		if (log && pick != null) {
			if (pick.fellBackFrom != null) this.logger.warn(`${pick.fellBackFrom} missing or invalid, using ${pick.key} (${pick.knowledge.version})`);
			else this.logger.info(`quest knowledge: ch${pick.chapterNo} → ${pick.key} (${pick.knowledge.version})`);
		}
		return pick?.knowledge ?? null;
	}

	// The app writes the link for the step she chose, so it always opens; a step not on the list is dropped, and so is a
	// step already linked for this try (once per step per try).
	private async withNextLink(tutorId: string, answer: TutorReply, questTry: QuestTry | undefined): Promise<string[]> {
		const line = questTry ? questNextLine(questTry, answer.next, this.config.url) : null;
		if (line == null || questTry == null) return answer.messages;
		const key = `lojoTutor:questLinks:${tutorId}:${questTry.attemptId}`;
		const fresh = await this.redisClient.sadd(key, answer.next!);
		await this.redisClient.expire(key, QUEST_TTL_SECONDS);
		if (fresh === 0) return answer.messages;
		return [...answer.messages.slice(0, -1), `${answer.messages.at(-1)}\n${line}`];
	}

	// The quest service tells the tutor a learner's hearts now (set by LojoQuestService; it depends on this service).
	public questHearts: ((learnerId: string) => Promise<{ now: number; refilledToday: { guide: boolean; gear: boolean } }>) | null = null;

	private async withFreshHearts(learnerId: string, questTry: QuestTry): Promise<QuestTry> {
		if (this.questHearts == null) return questTry;
		try {
			const h = await this.questHearts(learnerId);
			return { ...questTry, hearts: { ...questTry.hearts, now: h.now, refilledToday: h.refilledToday } };
		} catch (err) {
			this.logger.warn(`quest hearts failed: ${err}`);
			return questTry;
		}
	}

	private questKey(tutorId: string, learnerId: string): string {
		return `lojoTutor:quest:${tutorId}:${learnerId}`;
	}

	// The learning record from the route map; a failure here only leaves it out of the prompt.
	private gates(learnerId: string): Promise<string | null> {
		return this.lojoGateService.profileText(learnerId).catch(err => {
			this.logger.warn(`gate record failed: ${err}`);
			return null;
		});
	}

	// Set by LojoQuestService (it depends on this service).
	public questProgress: ((learnerId: string) => Promise<QuestProgressFacts | null>) | null = null;
	public questMistakes: ((learnerId: string, levelId: string | null) => Promise<QuestMistakes | null>) | null = null;

	// The progress card (misc/lojo-tutor-progress.ts): quest map, route map gates and wordbook, read from the database on
	// every reply, without the model. A part that fails to load is shown as not started.
	public async progressCard(learnerId: string): Promise<string> {
		const soft = <T>(what: string, p: Promise<T> | null): Promise<T | null> => (p ?? Promise.resolve(null)).catch(err => {
			this.logger.warn(`progress card: ${what} failed: ${err}`);
			return null;
		});
		const [quest, gates, wordbook] = await Promise.all([
			soft('quest', this.questProgress?.(learnerId) ?? null), this.gates(learnerId), soft('wordbook', this.wordbookFacts(learnerId)),
		]);
		return progressCardText({ quest, gates, wordbook });
	}

	// Counted as the wordbook page counts them (recognize + spell due now), in Beijing time.
	public async wordbookFacts(learnerId: string): Promise<WordbookFacts> {
		const t = await this.lojoWordService.today({ id: learnerId } as MiLocalUser, -480);
		if (t.total === 0) return { words: 0, dueToday: 0, reviewedToday: 0, updatedAt: null };
		const [last] = await this.db.query<{ at: Date | null }[]>(
			'SELECT GREATEST((SELECT MAX("reviewedAt") FROM "lojo_word_review" WHERE "userId" = $1), (SELECT MAX("createdAt") FROM "lojo_word" WHERE "userId" = $1)) AS at',
			[learnerId],
		);
		return { words: t.total, dueToday: t.recognizeDue + t.spellDue, reviewedToday: t.reviewedToday, updatedAt: last?.at ? new Date(last.at).toISOString() : null };
	}

	// Older messages between this learner and the tutor that match the words of query: English words through Postgres
	// full-text search (to_tsvector 'simple'), Chinese as two-character substrings (Postgres splits no Chinese words
	// without an extension). Only messages older than beforeId when given. Best first, then newest.
	public async searchChat(tutorId: string, learnerId: string, query: string, opts: { beforeId?: string | null; limit?: number; minScore?: number } = {}): Promise<ChatHit[]> {
		const terms = searchTerms(query);
		if (terms.en.length === 0 && terms.zh.length === 0) return [];
		const params: unknown[] = [tutorId, learnerId];
		const conds: string[] = [];
		if (terms.en.length > 0) {
			params.push(terms.en.map(w => w.replace(/[^a-z-]/g, '')).filter(w => w !== '').join(' | '));
			conds.push(`to_tsvector('simple', m."text") @@ to_tsquery('simple', $${params.length})`);
		}
		for (const z of terms.zh) {
			params.push(`%${z}%`);
			conds.push(`m."text" LIKE $${params.length}`);
		}
		let before = '';
		if (opts.beforeId) {
			params.push(opts.beforeId);
			before = `AND m."id" < $${params.length}`;
		}
		const rows: { id: string; fromUserId: string; text: string }[] = await this.db.query(
			`SELECT m."id", m."fromUserId", m."text" FROM "chat_message" m
			WHERE ((m."fromUserId" = $1 AND m."toUserId" = $2) OR (m."fromUserId" = $2 AND m."toUserId" = $1))
			AND m."text" IS NOT NULL ${before} AND (${conds.join(' OR ')})
			ORDER BY m."id" DESC LIMIT 200`,
			params,
		);
		return rows
			.filter(r => !(r.fromUserId === tutorId && r.text.startsWith(TUTOR_AWAY_PREFIX)))
			.map(r => ({ id: r.id, at: this.idService.parse(r.id).date.toISOString(), who: (r.fromUserId === tutorId ? 'tutor' : 'learner') as ChatHit['who'], text: r.text, score: hitScore(r.text, terms) }))
			.filter(h => h.score >= (opts.minScore ?? 1))
			.sort((a, b) => b.score - a.score || (a.id < b.id ? 1 : -1))
			.slice(0, opts.limit ?? 5);
	}

	// Keyword recall for a reply: the learner's last turn, searched in the messages older than the chat in the prompt.
	private async recall(tutorId: string, learnerId: string, history: ChatTurn[]): Promise<string | null> {
		try {
			const from = await this.redisClient.hget(this.sessionKey(tutorId, learnerId), 'historyFrom');
			if (from == null) return null;
			const last = history.findLast(turn => turn.role === 'user')?.content ?? '';
			const hits = await this.searchChat(tutorId, learnerId, last, { beforeId: from, limit: 3, minScore: RECALL_MIN_SCORE });
			return recallText(hits);
		} catch (err) {
			this.logger.warn(`chat recall failed: ${err}`);
			return null;
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

	private sessionKey(tutorId: string, learnerId: string): string {
		return `lojoTutor:session:${tutorId}:${learnerId}`;
	}

	// The notes as they were when this chat session began (see SESSION_SECONDS); each use keeps the session open.
	private async sessionMemory(tutorId: string, learnerId: string): Promise<TutorMemory> {
		const key = this.sessionKey(tutorId, learnerId);
		const saved = await this.redisClient.hget(key, 'memory').catch(() => null);
		if (saved != null) {
			try {
				await this.redisClient.expire(key, SESSION_SECONDS);
				return normalizeMemory(JSON.parse(saved));
			} catch {
				// A corrupt snapshot is read again below.
			}
		}
		const memory = await this.memory(learnerId, tutorId);
		await this.redisClient.multi().hset(key, 'memory', JSON.stringify(memory)).expire(key, SESSION_SECONDS).exec().catch(() => null);
		return memory;
	}

	// The chat for the prompt, from a first message that stays put until there are more than 36 messages from it; then
	// it moves on so that the newest 24 are kept.
	private async sessionHistory(tutorId: string, learnerId: string): Promise<ChatTurn[]> {
		const key = this.sessionKey(tutorId, learnerId);
		const messages = (await this.chatService.userTimeline(tutorId, learnerId, HISTORY_MAX)).reverse();
		const from = await this.redisClient.hget(key, 'historyFrom').catch(() => null);
		let start = from != null ? messages.findIndex(m => m.id === from) : -1;
		if (start === -1) {
			start = Math.max(0, messages.length - HISTORY);
			if (messages[start] != null) await this.redisClient.multi().hset(key, 'historyFrom', messages[start].id).expire(key, SESSION_SECONDS).exec().catch(() => null);
		}
		return this.toTurns(tutorId, messages.slice(start));
	}

	// Oldest first, consecutive messages merged. The tutor's turns are written in the JSON shape it answers with:
	// plain-text turns in the history made DeepSeek's JSON mode return empty answers now and then.
	private async history(tutorId: string, learnerId: string, limit = HISTORY): Promise<ChatTurn[]> {
		const messages: MiChatMessage[] = await this.chatService.userTimeline(tutorId, learnerId, limit);
		return this.toTurns(tutorId, messages.reverse());
	}

	private toTurns(tutorId: string, messages: MiChatMessage[]): ChatTurn[] {
		const turns: { role: 'user' | 'assistant'; texts: string[] }[] = [];
		for (const message of messages) {
			// The 👉 line under a quest answer is added by the app, not written by her: left out, so she does not copy it.
			// The fixed "away" messages are not hers either, and left out so she does not copy them once she is back.
			if (message.fromUserId === tutorId && message.text?.startsWith(TUTOR_AWAY_PREFIX)) continue;
			const text = (message.text ?? (message.fileId ? '(sent a file)' : '')).split('\n').filter(line => !line.startsWith('👉 ')).join('\n').trim();
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

	// The learner's "typing" hint lasts 8 seconds, so it is renewed while the model writes and stops before the first message.
	private async whileTyping<T>(learnerId: string, tutorId: string, work: () => Promise<T>): Promise<T> {
		this.typing(learnerId, tutorId);
		const renew = setInterval(() => this.typing(learnerId, tutorId), 5000);
		try {
			return await work();
		} finally {
			clearInterval(renew);
		}
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

	// For the Mastra pilot (endpoint lojo/tutor/pilot-tool): Mia's fixed system prompt word for word, without her notes
	// (the pilot keeps its own working memory), and the "Now:" line and name of the last message.
	public async pilotPrompt(tutorId: string, learnerId: string): Promise<{ system: string; now: string; name: string }> {
		const [card, learner] = await Promise.all([this.card(tutorId), this.usersRepository.findOneByOrFail({ id: learnerId })]);
		const full = tutorSystemPrompt(card, emptyMemory(), {});
		const cut = full.lastIndexOf('\nWhat you know about ');
		return { system: cut === -1 ? full : full.slice(0, cut).trimEnd(), now: this.nowText(), name: this.nameOf(learner) };
	}

	private nameOf(user: MiUser): string {
		return user.name ?? user.username;
	}

	// To the day and part of the day: Mia needs no more, and a time to the minute would change the prompt every call.
	private nowText(): string {
		const now = new Date();
		const weekday = new Intl.DateTimeFormat('en-GB', { timeZone: this.tz, weekday: 'long' }).format(now);
		const hour = localHour(now, this.tz);
		const part = hour < 5 ? 'late at night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : hour < 23 ? 'evening' : 'late at night';
		return `${localDay(now, this.tz)} ${weekday} ${part} (${this.tz === 'Asia/Shanghai' ? 'Beijing time' : this.tz})`;
	}
}
