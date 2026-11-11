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
import { LojoGateService } from '@/core/LojoGateService.js';
import type Logger from '@/logger.js';
import type { Config } from '@/config.js';
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
import type { ProactiveState, TutorCard, TutorMemory, TutorReply } from '@/misc/lojo-tutor.js';
import { normalizeQuestKnowledge, normalizeQuestTry, questAwayMessage, questNextLine, questPromptSection, TUTOR_AWAY_PREFIX } from '@/misc/lojo-tutor-quest.js';
import type { QuestKnowledge, QuestTry } from '@/misc/lojo-tutor-quest.js';

const SCOPE = ['lojo', 'tutor'];
const HISTORY = 24;
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
		@Inject(DI.config)
		private config: Config,
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
		private lojoGateService: LojoGateService,
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
			const [card, memory, history, gates, quest] = await Promise.all([
				this.card(tutorId), this.memory(learnerId, tutorId), this.history(tutorId, learnerId), this.gates(learnerId), this.questContext(tutorId, learnerId),
			]);
			// Already answered (another attempt got there first).
			if (history.length === 0 || history[history.length - 1].role === 'assistant') return;
			if (!(await this.spendBudget())) return;
			// In the two hours after "Ask Mia" she answers follow-ups with the try at hand, but with the hearts as of now and
			// without the 👉 link again: a link only goes out for a step not linked yet for this try (AI tutor, 2026-11-10:
			// repeating "0 hearts… read guide 7" and the link under every answer read like an ad).
			const questTry = quest && await this.withFreshHearts(learnerId, quest.questTry);
			const system = tutorSystemPrompt(card, memory, { learnerName: this.nameOf(learner), now: this.nowText(), gates, quest: quest && questTry && questPromptSection(quest.knowledge, questTry, true) });
			let answer: TutorReply;
			try {
				answer = await this.whileTyping(learnerId, tutorId, () => this.lojoEnglishService.chatJson([{ role: 'system', content: system }, ...history], 0.8, 900, normalizeTutorReply));
			} catch (err) {
				if (!(await this.markDownOn(err))) throw err;
				await this.sayAway(tutor, learner);
				return;
			}
			await this.send(tutor, learner, await this.withNextLink(tutorId, answer, questTry ?? undefined), answer.voice, card.extensions.vibes?.voice);
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
			const [card, memory, history, recentPosts, gates] = await Promise.all([
				this.card(tutorId), this.memory(learnerId, tutorId), this.history(tutorId, learnerId), this.recentPosts(), this.gates(learnerId),
			]);
			// If the learner's last message is still unanswered, answer it instead of opening a new topic.
			const unanswered = history.at(-1)?.role === 'user';
			const system = tutorSystemPrompt(card, memory, {
				learnerName: this.nameOf(learner),
				now: this.nowText(),
				opener: unanswered ? undefined : { reason: this.openerReason(memory, history), recentPosts },
				gates,
			});
			// The model answers the last turn. After the tutor's own messages that has to be a cue, not her last reply,
			// or she repeats it; an empty chat starts from a neutral cue too.
			const cue = history.length === 0 ? '(The learner has not written yet.)' : '(The learner has not replied yet. Write first now, as described above.)';
			const turns: ChatTurn[] = unanswered ? history : [...history, { role: 'user', content: cue }];
			const answer = await this.whileTyping(learnerId, tutorId, () => this.lojoEnglishService.chatJson([{ role: 'system', content: system }, ...turns], 0.9, 600, normalizeTutorReply));
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

	// "Ask Mia" on a failed level (endpoint lojo/quest/ask-tutor, after it checked the try is the learner's own, submitted
	// and failed). Not a proactive message: no quiet hours, and it does not use up today's first message.
	// Returns at once; she shows "typing" and writes within seconds.
	public async openFromQuest(tutorId: string, learnerId: string, rawTry: unknown): Promise<QuestAskResult> {
		if (!this.tutors.includes(tutorId)) return 'off';
		const questTry = normalizeQuestTry(rawTry);
		if (questTry == null) return 'off';
		// No quest knowledge on the tutor account means no quest mode (the production tutor has none yet).
		if ((await this.questKnowledge(tutorId)) == null) return 'off';
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
			const [card, memory, history, gates, quest] = await Promise.all([
				this.card(tutorId), this.memory(learnerId, tutorId), this.history(tutorId, learnerId), this.gates(learnerId), this.questContext(tutorId, learnerId),
			]);
			if (quest == null) return;
			if (await this.isDown()) {
				await this.sayAwayForQuest(tutor, learner, quest.knowledge, quest.questTry);
				return;
			}
			const system = tutorSystemPrompt(card, memory, { learnerName: this.nameOf(learner), now: this.nowText(), gates, quest: questPromptSection(quest.knowledge, quest.questTry) });
			// As in writeFirst, the model answers the last turn, so it ends with a cue (added to an unanswered message if there is one).
			const cue = '(The learner just failed this level and tapped "Ask Mia". Write first now, in quest mode as described above.)';
			const turns: ChatTurn[] = history.at(-1)?.role === 'user'
				? [...history.slice(0, -1), { role: 'user', content: `${history.at(-1)!.content}\n${cue}` }]
				: [...history, { role: 'user', content: cue }];
			let answer: TutorReply;
			try {
				answer = await this.whileTyping(learnerId, tutorId, () => this.lojoEnglishService.chatJson([{ role: 'system', content: system }, ...turns], 0.7, 900, normalizeTutorReply));
			} catch (err) {
				// The first learner to run into it still gets where to go next, built from this try without the model.
				if (!(await this.markDownOn(err))) throw err;
				await this.sayAwayForQuest(tutor, learner, quest.knowledge, quest.questTry);
				return;
			}
			await this.send(tutor, learner, await this.withNextLink(tutorId, answer, quest.questTry), answer.voice, card.extensions.vibes?.voice);
			this.updateMemory(tutorId, learnerId).catch(err => this.logger.warn(`notes update failed: ${err}`));
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
			const knowledge = questTry && await this.questKnowledge(tutorId);
			return questTry && knowledge ? { knowledge, questTry } : null;
		} catch (err) {
			this.logger.warn(`quest context failed: ${err}`);
			return null;
		}
	}

	private async questKnowledge(tutorId: string): Promise<QuestKnowledge | null> {
		const item = await this.registryApiService.getItem(tutorId, null, SCOPE, 'quest');
		return item ? normalizeQuestKnowledge(item.value) : null;
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

	private nameOf(user: MiUser): string {
		return user.name ?? user.username;
	}

	private nowText(): string {
		const now = new Date();
		const time = new Intl.DateTimeFormat('en-GB', { timeZone: this.tz, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
		return `${localDay(now, this.tz)} ${time} (${this.tz === 'Asia/Shanghai' ? 'Beijing time' : this.tz})`;
	}
}
