/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DataSource, IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import type { MiDriveFile, NotesRepository, UserProfilesRepository, UsersRepository } from '@/models/_.js';
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
import { LojoUsageService, fuseNews, tutorBudgetKey, tutorDailyLimit, type ModelUsage } from '@/core/LojoUsageService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { UtilityService } from '@/core/UtilityService.js';
import type { MiMeta } from '@/models/Meta.js';
import { defaultPersona, normalizePersona, PERSONA_KEY, personaHello } from '@/misc/lojo-tutor-persona.js';
import type { TutorPersona } from '@/misc/lojo-tutor-persona.js';
import { LojoPlanService } from '@/core/LojoPlanService.js';
import { LojoAppsService } from '@/core/LojoAppsService.js';
import type { AppActionRecent } from '@/misc/lojo-apps-action.js';
import type { PlanEvent } from '@/core/LojoPlanService.js';
import { hourIn, todayIn } from '@/misc/lojo-plan.js';
import { randomBytes } from 'node:crypto';
import type { MiLocalUser } from '@/models/User.js';
import type Logger from '@/logger.js';
import type { Config } from '@/config.js';
import { looksEnglish } from '@/misc/lojo-english.js';
import {
	applyMemoryUpdate,
	emptyMemory,
	localDay,
	lojoTutorIds,
	normalizeMemory,
	normalizeMemoryUpdate,
	normalizeTutorCard,
	normalizeTutorReply,
	NOTES_EVERY,
	asksToRememberOrForget,
	proactiveDecision,
	proactivePerDay,
	proactiveSentToday,
	tutorContextMessage,
	tutorFixedPrompt,
	tutorSystemPrompt,
	tutorPublic,
} from '@/misc/lojo-tutor.js';
import { normalizeTutorPrompts, PROMPTS_KEY } from '@/misc/lojo-tutor-prompts.js';
import type { TutorPrompts } from '@/misc/lojo-tutor-prompts.js';
import type { ProactiveState, TutorCard, TutorMemory, TutorReply } from '@/misc/lojo-tutor.js';
import { normalizeQuestTry, pickQuestKnowledge, questAwayMessage, questKnowledgeSection, questNextLine, questTrySection } from '@/misc/lojo-tutor-quest.js';
import { tutorText } from '@/misc/lojo-tutor-text.js';
import { MODE_KEY, modeCardText, modeNoticeText, normalizeModeCard, normalizeTutorMode } from '@/misc/lojo-tutor-mode.js';
import type { TutorMode } from '@/misc/lojo-tutor-mode.js';
import { learnerUiLang } from '@/misc/lojo-ui-lang.js';
import type { QuestKnowledge, QuestTry } from '@/misc/lojo-tutor-quest.js';
import { progressCardText, RECALL_MIN_SCORE, recallText, searchTerms } from '@/misc/lojo-tutor-progress.js';
import type { ChatHit, QuestMistakes, QuestProgressFacts, WordbookFacts } from '@/misc/lojo-tutor-progress.js';
import {
	chatSearchFilter,
	chatSearchHits,
	mastraFreshMessages,
	mastraReportedUsage,
	tutorChatTurns,
	tutorFuseText,
	tutorListHas,
	tutorModelDownReason as modelDownReason,
	tutorNowText,
	tutorOpenerReason,
	tutorProactiveState,
	tutorUnanswered,
	tutorUsageMeter,
} from '@/misc/lojo-tutor-chat.js';
import type { TutorChatTurn as ChatTurn } from '@/misc/lojo-tutor-chat.js';

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
// After "Ask Vibi" on a failed level, her replies carry that try for two hours; a learner can ask at most 10 times a day.
const QUEST_TTL_SECONDS = 2 * 60 * 60;
const QUEST_DAILY = 10;

export type QuestAskResult = 'sent' | 'already' | 'limit' | 'off' | 'away';

// While the model account has no balance or a bad key (HTTP 402 / 401), the tutor is "away": no model calls, fixed
// messages instead, and the learners who wrote meanwhile get a real answer once it is back. 冲刺1111/Mia/兜底规格.md.
// Mia on Mastra (prototypes/mia-mastra): who gets her. "all", or user ids separated by commas; empty or missing = nobody.
// Read on every reply, so switching is one redis command and needs no restart (see apps/community/deploy/mia-mastra.sh).
const MASTRA_KEY = 'lojoTutor:mastra';
// 私信任务标签: how long the turn token sent with /chat and /event lets Vibi's task tools write.
const TURN_TOKEN_SECONDS = 10 * 60;
// The marker message for one change Vibi made (the chat page draws it as a card; lojo/plan/changeCard.ts reads it).
export const planChangeText = (summary: string, changeId: string) => `【任务改动】${summary}（改动号 ${changeId}，可以在「任务」页撤销）`;
// 发到我的电脑 (2026-11-15): Vibi drafts an instruction for the learner's own coding agent; the chat page draws the marker
// message as a card the learner edits and sends from their own browser through Paseo (lojo/agent/DraftCard.vue). Who has
// it: "all", or user ids separated by commas, in redis like MASTRA_KEY; empty or missing = nobody (the default).
const AGENT_BRIDGE_KEY = 'lojoAgent:users';
const AGENT_DRAFT_MAX = 1500;
export const agentDraftText = (draftId: string, text: string) => `【给电脑的指令】（草稿号 ${draftId}）\n${text}`;
const DOWN_KEY = 'lojoTutor:down';
const DOWN_TTL_SECONDS = 30 * 60;
const PENDING_KEY = 'lojoTutor:pending';
const AWAY_NOTE_TTL_SECONDS = 6 * 60 * 60;
const CATCH_UP_PER_ROUND = 30;
// The newest learner message an answer was written for (see tutorUnanswered); kept as long as her Mastra mark.
const ANSWERED_TTL_SECONDS = 90 * 24 * 60 * 60;

// The AI tutor in direct messages: replies with memory, sometimes as a voice message, and writes first at most once a day.
// Phase 1 of docs/research/ai-dm-companion.md. Tutor accounts are listed in LOJO_TUTOR_IDS.
// The calculations that touch neither the database nor redis are in misc/lojo-tutor-chat.ts; the methods of the same
// name here only call them.
@Injectable()
export class LojoTutorService implements OnModuleInit, OnApplicationShutdown {
	private readonly tutors = lojoTutorIds();
	private readonly tz = process.env.LOJO_TUTOR_TZ || 'Asia/Shanghai';
	private readonly hours = (process.env.LOJO_TUTOR_HOURS || '9-21').split('-').map(Number);
	private readonly proactive = process.env.LOJO_TUTOR_PROACTIVE !== '0';
	// Model calls per UTC day for all tutors together: a fuse for the whole site (default 20000, founder 2026-11-11; see
	// tutorDailyLimit). Each learner's own allowance is in LojoUsageService (5 hours + a week, counted in money).
	private readonly dailyLimit = tutorDailyLimit();
	// Who gets a notification when the fuse is half used and when it blows (besides the warning in the log): these
	// usernames, or by default the site's root admin.
	private readonly fuseNotify = (process.env.LOJO_TUTOR_FUSE_NOTIFY ?? '').split(',').map(x => x.trim()).filter(x => x !== '');
	private readonly mastraUrl = (process.env.LOJO_TUTOR_MASTRA_URL ?? '').replace(/\/$/, '');
	private readonly mastraSecret = process.env.LOJO_TUTOR_MASTRA_SECRET ?? '';
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
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,
		@Inject(DI.meta)
		private meta: MiMeta,
		private chatService: ChatService,
		private globalEventService: GlobalEventService,
		private registryApiService: RegistryApiService,
		private idService: IdService,
		private loggerService: LoggerService,
		private lojoEnglishService: LojoEnglishService,
		private lojoSpeechService: LojoSpeechService,
		private lojoGateService: LojoGateService,
		private lojoWordService: LojoWordService,
		private lojoUsageService: LojoUsageService,
		private notificationService: NotificationService,
		private lojoPlanService: LojoPlanService,
		private utilityService: UtilityService,
		private lojoAppsService: LojoAppsService,
	) {
		this.logger = this.loggerService.getLogger('lojo-tutor');
	}

	onModuleInit() {
		if (this.tutors.length === 0) return;
		this.applyPublicProfile().catch(err => this.logger.warn(`could not write the tutor's bio: ${err}`));
		this.redisForSub.on('message', this.onRedisMessage);
		// Every 15 minutes: check whether the model is back, answer who wrote while it was away, then write first.
		this.tick = setInterval(() => this.proactiveTick().catch(err => this.logger.warn(`proactive round failed: ${err}`)), 15 * MINUTE);
		this.tick.unref();
	}

	// The bio on the tutor's profile comes from tutorPublic (misc/lojo-tutor.ts), so it is changed in one place.
	// The display name too (the @tutor_mia username stays).
	private async applyPublicProfile(): Promise<void> {
		for (const userId of this.tutors) {
			const user = await this.usersRepository.findOneBy({ id: userId });
			if (user != null && user.name !== tutorPublic.name) {
				await this.usersRepository.update({ id: userId }, { name: tutorPublic.name });
				this.logger.info(`tutor name updated user=${userId}`);
			}
			const profile = await this.userProfilesRepository.findOneBy({ userId });
			if (profile == null || profile.description === tutorPublic.bio) continue;
			await this.userProfilesRepository.update({ userId }, { description: tutorPublic.bio });
			this.logger.info(`tutor bio updated user=${userId}`);
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
		const started = Date.now();
		try {
			const [tutor, learner] = await Promise.all([
				this.usersRepository.findOneByOrFail({ id: tutorId }),
				this.usersRepository.findOneByOrFail({ id: learnerId }),
			]);
			if (await this.isDown()) {
				await this.sayAway(tutor, learner);
				return;
			}
			// Allowance used up and no gems: she does not answer. Only the chat page says why and when it comes back;
			// Vibi herself never talks about allowances or paying (docs/decisions.md 2026-10-25).
			if (!(await this.lojoUsageService.canChat(learnerId))) return;
			// Learners switched over to Mia on Mastra get her; if she fails, the usual Mia below answers instead.
			if (await this.onMastra(learnerId)) {
				const done = await this.replyWithMastra(tutor, learner).catch(err => {
					this.logger.warn(`Mia on Mastra failed, the usual Mia answers: ${err}`);
					return false;
				});
				if (done) return;
			}
			const [{ card, prompts }, memory, history, progress, quest, persona, recent] = await Promise.all([
				this.setup(tutorId), this.sessionMemory(tutorId, learnerId), this.sessionHistory(tutorId, learnerId), this.progressCard(learnerId), this.questContext(tutorId, learnerId), this.persona(learnerId), this.recentMessages(tutorId, learnerId),
			]);
			// Already answered (another attempt got there first).
			const newest = await this.unanswered(tutorId, learnerId, recent);
			if (history.length === 0 || newest == null) return;
			// Without her words (misc/lojo-tutor-prompts.ts) she does not use the model: the away line, answered later.
			if (prompts == null) {
				await this.sayAway(tutor, learner);
				return;
			}
			const recall = await this.recall(tutorId, learnerId, history, prompts);
			if (!(await this.spendBudget())) return;
			// In the two hours after "Ask Vibi" she answers follow-ups with the try at hand, but with the hearts as of now and
			// without the 👉 link again: a link only goes out for a step not linked yet for this try (AI tutor, 2026-11-10:
			// repeating "0 hearts… read guide 7" and the link under every answer read like an ad).
			const questTry = quest && await this.withFreshHearts(learnerId, quest.questTry);
			const system = tutorSystemPrompt(prompts, card, memory, { questKnowledge: quest && questKnowledgeSection(quest.knowledge) });
			const context = tutorContextMessage(prompts, { now: this.nowText(), learnerName: this.nameOf(learner), tutorName: persona.name, progress, recall, quest: quest && questTry && questTrySection(prompts, quest.knowledge, questTry, true) });
			let answer: TutorReply;
			const usage = this.usageMeter();
			try {
				answer = await this.whileTyping(learnerId, tutorId, () => this.lojoEnglishService.chatJson([{ role: 'system', content: system }, ...history, { role: 'system', content: context }], 0.8, 900, normalizeTutorReply, `tutor.reply learner=${learnerId}`, usage.add));
			} catch (err) {
				if (!(await this.markDownOn(err))) throw err;
				await this.sayAway(tutor, learner);
				return;
			} finally {
				await this.chargeLearner(learnerId, 'tutor.reply', usage.total());
			}
			await this.send(tutor, learner, await this.withNextLink(tutorId, answer, questTry ?? undefined), answer.voice, card.extensions.vibes?.voice);
			await this.markAnswered(tutorId, learnerId, newest.id);
			const lastLearner = history.findLast(turn => turn.role === 'user')?.content ?? '';
			this.maybeUpdateMemory(tutorId, learnerId, asksToRememberOrForget(lastLearner)).catch(err => this.logger.warn(`notes update failed: ${err}`));
		} finally {
			await this.redisClient.del(`lojoTutor:replying:${tutorId}:${learnerId}`);
			await this.answerAgainIfWrote(tutorId, learnerId, started);
		}
	}

	// The learner wrote again while this answer was being written: answer that too, even when the tries that message
	// started gave up waiting for this one (a slow answer). An attempt that finds it answered already does nothing.
	private async answerAgainIfWrote(tutorId: string, learnerId: string, since: number): Promise<void> {
		const wroteAt = Number(await this.redisClient.hget(this.stateKey(tutorId, learnerId), 'lastLearnerAt').catch(() => null) ?? 0);
		if (wroteAt > since) setTimeout(() => this.reply(tutorId, learnerId).catch(err => this.logger.warn(`reply failed: ${err}`)), 3000);
	}

	// The last messages of this chat, oldest first, for tutorUnanswered.
	private async recentMessages(tutorId: string, learnerId: string): Promise<MiChatMessage[]> {
		return (await this.chatService.userTimeline(tutorId, learnerId, HISTORY)).reverse();
	}

	// The learner's newest message if no answer was written for it yet. fallback: Mastra's own mark, until this one is set.
	private async unanswered(tutorId: string, learnerId: string, messages: MiChatMessage[], fallback: string | null = null): Promise<MiChatMessage | null> {
		const answered = await this.redisClient.get(`lojoTutor:answered:${tutorId}:${learnerId}`).catch(() => null);
		return tutorUnanswered(messages, tutorId, answered ?? fallback);
	}

	private async markAnswered(tutorId: string, learnerId: string, messageId: string | undefined): Promise<void> {
		if (messageId == null) return;
		await this.redisClient.set(`lojoTutor:answered:${tutorId}:${learnerId}`, messageId, 'EX', ANSWERED_TTL_SECONDS);
	}

	private async onMastra(learnerId: string): Promise<boolean> {
		if (this.mastraUrl === '' || this.mastraSecret.length < 16) return false;
		return tutorListHas(await this.redisClient.get(MASTRA_KEY).catch(() => null), learnerId);
	}

	// Mia on Mastra keeps her own memory of this chat, so she is sent only what she has not seen: the messages after the
	// last learner message she answered, minus the ones she sent herself; a daily check-in or a quest answer from the
	// usual path is passed along as hers. The first time, only the learner's messages since the tutor last wrote (her
	// notes were moved over, and older chat is found with her search tool). Notes (updateMemory) are not rewritten for
	// these learners: Mastra keeps its own. Throws when she could not answer, so the usual Mia answers instead.
	private async replyWithMastra(tutor: MiUser, learner: MiUser): Promise<boolean> {
		const key = `lojoTutor:mastraSeen:${tutor.id}:${learner.id}`;
		const seen = await this.redisClient.get(key);
		const messages = (await this.chatService.userTimeline(tutor.id, learner.id, HISTORY)).reverse();
		const lastLearner = await this.unanswered(tutor.id, learner.id, messages, seen?.split('|')[0] ?? null);
		if (lastLearner == null) return true; // already answered
		const turns = this.toTurns(tutor.id, mastraFreshMessages(messages, tutor.id, seen));
		const quest = await this.questContext(tutor.id, learner.id);
		const questTry = quest && await this.withFreshHearts(learner.id, quest.questTry);
		const [{ card, prompts }, persona, cards, mode] = await Promise.all([this.setup(tutor.id), this.persona(learner.id), this.recentCards(learner.id), this.mode(learner.id)]);
		// The quest lines need her words; without them the usual Mia answers (with the away line).
		if (quest && questTry && prompts == null) throw new Error(`no prompts on the tutor account (registry ${PROMPTS_KEY})`);
		if (!(await this.spendBudget())) return true;
		const started = Date.now();
		// you: the name this learner gave her (mia-mastra v0.7.8+ puts it in the bracket line; older ones ignore it)
		// cards: this learner's latest confirm cards and what became of them (第 6 步返工, mia-mastra v0.8.1+ reads it)
		// mode: how the learner picked for her to talk (聊天模式 11-20, mia-mastra v0.11.0+; older ones ignore it)
		const res = await this.whileTyping(learner.id, tutor.id, () => this.postMastra('/chat', learner.id, {
			turns, now: this.nowText(), name: this.nameOf(learner), you: persona.name, cards, mode,
			extra: quest && questTry && prompts ? questTrySection(prompts, quest.knowledge, questTry, true).replace(/\s*\n\s*/g, ' ') : undefined,
		}));
		await this.chargeMastra(learner.id, res);
		const answer = normalizeTutorReply(res);
		this.logger.info(`mastra reply learner=${learner.id} turns=${turns.length} ms=${Date.now() - started} tools=${Array.isArray(res.toolCalls) ? res.toolCalls.join(',') : ''}`);
		const uiLang = await learnerUiLang(this.registryApiService, learner.id);
		// 聊天模式: she switched because the learner asked (「开毒舌」「正常点」): kept, and a grey line goes first. Her card
		// goes right under her words, in the mode she now talks in.
		const switchTo = res.mode == null ? null : normalizeTutorMode(res.mode);
		const switched = switchTo != null && switchTo !== mode ? await this.saveMode(learner.id, switchTo) : null;
		const nowMode = switched ?? mode;
		const modeCard = nowMode === 'normal' ? null : normalizeModeCard(res.card);
		const out = [
			...(switched != null ? [modeNoticeText(switched, uiLang)] : []),
			...await this.withNextLink(tutor.id, answer, questTry ?? undefined),
			...(modeCard != null && nowMode !== 'normal' ? [modeCardText(nowMode, modeCard)] : []),
			...await this.changeCards(learner.id, new Date(started - 1000)), ...await this.agentDraftCards(learner.id), ...await this.lojoAppsService.actionCards(learner.id, uiLang).catch(() => [] as string[]),
		];
		await this.redisClient.set(key, `${lastLearner.id}|${out.length}`, 'EX', 90 * 24 * 60 * 60);
		await this.send(tutor, learner, out, answer.voice, card.extensions.vibes?.voice);
		await this.markAnswered(tutor.id, learner.id, lastLearner.id);
		return true;
	}

	// Charged by the tokens it reports (mia-mastra v0.3.2+: every DeepSeek call for this learner since the last reply,
	// Observer and Reflector included). If it reports none, or some calls' usage was lost, the fixed estimate
	// (lojoUsage:config mastraReply) is charged instead and logged.
	private async chargeMastra(learnerId: string, res: { usage?: unknown }): Promise<void> {
		const reported = mastraReportedUsage(res.usage);
		if (reported) {
			await this.chargeLearner(learnerId, 'mastra.reply', reported);
		} else {
			this.logger.warn(`mastra usage not reported learner=${learnerId}; charged the estimate`);
			await this.chargeLearner(learnerId, 'mastra.est', null, (await this.lojoUsageService.config()).mastraReply);
		}
	}

	// Vibi on Mastra: /chat or /event, with this conversation's turn token (her task tools hand it back on writes).
	private async postMastra(path: '/chat' | '/event', learnerId: string, body: Record<string, unknown>) {
		const turnToken = await this.issueTurnToken(learnerId);
		const r = await fetch(`${this.mastraUrl}${path}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ secret: this.mastraSecret, learnerId, turnToken, ...body }),
			signal: AbortSignal.timeout(90 * 1000),
		});
		if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
		return await r.json() as { messages?: unknown; voice?: unknown; toolCalls?: unknown; usage?: unknown; mode?: unknown; card?: unknown };
	}

	// ---------- 私信任务标签 (2026-11-15): the turn token, the change cards, and Vibi writing first about the plan ----------

	// Good for 10 minutes and for this learner only. Kept in redis, so a leaked shared secret alone changes nobody's plan.
	private async issueTurnToken(learnerId: string): Promise<string> {
		const token = randomBytes(32).toString('base64url');
		await this.redisClient.set(`lojoPlan:turn:${token}`, learnerId, 'EX', TURN_TOKEN_SECONDS);
		return token;
	}

	// null when the write may go ahead; otherwise why not (said to Vibi, and logged).
	public async checkTurnToken(token: string | null, learnerId: string): Promise<string | null> {
		const owner = token ? await this.redisClient.get(`lojoPlan:turn:${token}`) : null;
		const why = token == null || token === '' ? 'no token'
			: owner == null ? 'expired'
			: owner !== learnerId ? 'other learner'
			: !(await this.onMastra(learnerId)) ? 'not talking with Vibi' : null;
		if (why == null) return null;
		this.logger.warn(`plan write refused learner=${learnerId}: ${why}`);
		return why === 'other learner' ? '这次对话的凭证不是这个学员的' : '这次对话的凭证过期了，请学员再发一句';
	}

	// One marker message per change Vibi made in this reply. The chat page draws it as a card with 「撤销」
	// (lojo/plan/ChangeCard.vue); other clients see a plain sentence.
	private async changeCards(learnerId: string, since: Date): Promise<string[]> {
		const changes = await this.lojoPlanService.changesSince(learnerId, 'vibi', since).catch(() => []);
		return changes.map(c => planChangeText(c.summary, c.id));
	}

	// ---------- 发到我的电脑 (2026-11-15) ----------

	private async agentBridgeOn(userId: string): Promise<boolean> {
		return tutorListHas(await this.redisClient.get(AGENT_BRIDGE_KEY).catch(() => null), userId);
	}

	// connected is only the learner's own yes/no from their browser; the pairing never comes to the server.
	public async agentBridgeState(userId: string, connected: boolean | null): Promise<{ enabled: boolean; connected: boolean }> {
		const enabled = await this.agentBridgeOn(userId);
		const key = `lojoAgent:connected:${userId}`;
		if (connected === true && enabled) await this.redisClient.set(key, '1');
		if (connected === false) await this.redisClient.del(key);
		return { enabled, connected: enabled && await this.redisClient.exists(key) === 1 };
	}

	// Vibi's draftAgentTask: keeps the draft until her reply is sent, then it goes out as a card under it. Nothing is sent
	// to any computer from here; only the learner's tap in their own browser does that.
	public async draftAgentTask(learnerId: string, instruction: string): Promise<{ ok: boolean; draftId?: string; reason?: string }> {
		const text = instruction.trim();
		if (!(await this.agentBridgeOn(learnerId))) return { ok: false, reason: 'not available for this learner yet' };
		if (await this.redisClient.exists(`lojoAgent:connected:${learnerId}`) !== 1) return { ok: false, reason: 'their computer is not connected (they can connect it in settings: 连接我的电脑)' };
		if (text === '') return { ok: false, reason: 'the instruction is empty' };
		if (text.length > AGENT_DRAFT_MAX) return { ok: false, reason: `too long (${text.length} characters, at most ${AGENT_DRAFT_MAX}); make it shorter` };
		const draftId = randomBytes(5).toString('hex');
		const key = `lojoAgent:drafts:${learnerId}`;
		await this.redisClient.rpush(key, JSON.stringify({ id: draftId, text }));
		await this.redisClient.expire(key, 10 * 60);
		this.logger.info(`agent draft learner=${learnerId} draft=${draftId} chars=${text.length}`);
		return { ok: true, draftId };
	}

	private async agentDraftCards(learnerId: string): Promise<string[]> {
		const key = `lojoAgent:drafts:${learnerId}`;
		const raw = await this.redisClient.lrange(key, 0, 4).catch(() => [] as string[]);
		await this.redisClient.del(key).catch(() => {});
		return raw.flatMap(r => {
			try {
				const d = JSON.parse(r) as { id: string; text: string };
				return [agentDraftText(d.id, d.text)];
			} catch {
				return [];
			}
		});
	}

	// Once an hour (from the 15-minute round): the plan's own work, and Vibi writing first about it when allowed —
	// in the learner's waking hours (LOJO_TUTOR_HOURS, their time zone), at most LOJO_TUTOR_PROACTIVE_PER_DAY (5) first
	// messages a day together with the daily check-in, only to learners on Vibi-on-Mastra, each late task or missed visit
	// asked about once, and none at all when LOJO_TUTOR_PROACTIVE=0.
	private async planHourly(): Promise<void> {
		const hourKey = new Date().toISOString().slice(0, 13);
		if (await this.redisClient.set(`lojoPlan:hourly:${hourKey}`, '1', 'EX', 3 * 60 * 60, 'NX') !== 'OK') return;
		const events = await this.lojoPlanService.hourly();
		const tutorId = this.tutors[0];
		let sent = 0;
		for (const ev of events) {
			try {
				if (await this.planEvent(tutorId, ev) === 'sent') sent++;
			} catch (err) {
				if (await this.markDownOn(err)) break;
				this.logger.warn(`plan event ${ev.kind} to ${ev.userId} failed: ${err}`);
			}
		}
		if (events.length > 0) this.logger.info(`plan hourly: ${events.length} event(s), ${sent} written`);
	}

	// force (the admin endpoint lojo/tutor/plan-poke, for trying it out): also outside waking hours, when muted or switched
	// off, and about a task or missed visit already asked about. The day's limit holds even then.
	public async planEvent(tutorId: string, ev: PlanEvent, opts: { force?: boolean } = {}): Promise<string> {
		if (!this.proactive && !opts.force) return 'switched off';
		if (!(await this.onMastra(ev.userId))) return 'not on Mastra';
		const state = await this.proactiveState(tutorId, ev.userId);
		if (state.muted && !opts.force) return 'muted';
		const plan = await this.lojoPlanService.vibiPlan(ev.userId);
		const tz = 'tz' in plan && typeof plan.tz === 'string' ? plan.tz : this.tz;
		const hour = hourIn(tz);
		if (!opts.force && (hour < this.hours[0] || hour >= this.hours[1])) return 'quiet hours';
		if (proactiveSentToday(state.proactiveTimes, new Date(), tz) >= proactivePerDay()) return 'daily limit';
		let tasks = ev.tasks;
		if (ev.kind === 'overdue' && !opts.force) {
			const asked = await Promise.all(tasks.map(t => this.redisClient.exists(`lojoPlan:overdueAsked:${t.id}`)));
			tasks = tasks.filter((_, i) => asked[i] === 0);
			if (tasks.length === 0) return 'already asked';
		}
		if (ev.kind === 'replanOffer' && !opts.force) {
			if (await this.redisClient.get(`lojoPlan:replanOffered:${ev.userId}`) === ev.seenAt) return 'already asked';
			if (state.lastLearnerAt != null && Date.now() - state.lastLearnerAt < 3 * DAY) return 'chatting recently';
		}
		if (await this.redisClient.set(`lojoTutor:replying:${tutorId}:${ev.userId}`, '1', 'EX', 120, 'NX') !== 'OK') return 'busy';
		try {
			if (!(await this.spendBudget())) return 'fuse';
			const [tutor, learner] = await Promise.all([
				this.usersRepository.findOneByOrFail({ id: tutorId }),
				this.usersRepository.findOneByOrFail({ id: ev.userId }),
			]);
			const [card, persona, cards, uiLang] = await Promise.all([this.card(tutorId), this.persona(learner.id), this.recentCards(learner.id), learnerUiLang(this.registryApiService, learner.id)]);
			// uiLang: she writes this one first, so in the learner's interface language (界面语言第②批)
			const res = await this.whileTyping(learner.id, tutor.id, () => this.postMastra('/event', learner.id, {
				kind: ev.kind, summary: ev.summary, tasks, now: this.nowText(), name: this.nameOf(learner), you: persona.name, cards, uiLang,
			}));
			await this.chargeMastra(learner.id, res);
			const answer = normalizeTutorReply(res);
			const out = answer.messages.slice(0, 2);
			await this.send(tutor, learner, out, answer.voice, card.extensions.vibes?.voice);
			// She keeps her own memory of this: her next /chat skips these messages (see replyWithMastra).
			const seenKey = `lojoTutor:mastraSeen:${tutor.id}:${learner.id}`;
			const seen = await this.redisClient.get(seenKey);
			if (seen != null) await this.redisClient.set(seenKey, `${seen.split('|')[0]}|${Number(seen.split('|')[1] ?? 0) + out.length}`, 'KEEPTTL');
			await this.markWroteFirst(tutorId, learner.id, false);
			if (ev.kind === 'overdue') for (const t of tasks) await this.redisClient.set(`lojoPlan:overdueAsked:${t.id}`, '1', 'EX', 60 * 24 * 60 * 60);
			if (ev.kind === 'replanOffer' && ev.seenAt) await this.redisClient.set(`lojoPlan:replanOffered:${ev.userId}`, ev.seenAt, 'EX', 60 * 24 * 60 * 60);
			this.logger.info(`plan event ${ev.kind} learner=${learner.id} messages=${out.length}${opts.force ? ' (forced)' : ''}`);
			return 'sent';
		} finally {
			await this.redisClient.del(`lojoTutor:replying:${tutorId}:${ev.userId}`);
		}
	}

	// Short typing pauses between messages, and the first short English message as a voice message when asked for.
	private async send(tutor: MiUser, learner: MiUser, messages: string[], voice: boolean, voiceId: string | undefined): Promise<void> {
		// Never a marker message (【对照卡·…】, 【说话方式】, 【任务改动】…): those are cards, not her words.
		const voiced = voice ? messages.findIndex(text => !text.startsWith('【') && looksEnglish(text) && text.length <= 300) : -1;
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
		// Mia on Mastra keeps her own notes for the learners switched over.
		if (await this.onMastra(learnerId)) return;
		if (await this.redisClient.set(`lojoTutor:notesLock:${tutorId}:${learnerId}`, '1', 'EX', 60, 'NX') !== 'OK') return;
		if (!(await this.spendBudget())) return;
		// Messages that arrive while this runs count towards the next update.
		const pending = Number(await this.redisClient.hget(this.stateKey(tutorId, learnerId), 'notesPending') ?? 0);
		// The same start as Mia's replies (her prompt and this chat), so the cache that her last reply filled answers most of
		// it; the notes task, the date and the current notes come last.
		const [{ card, prompts }, learner, sessionMemory, history, quest, memory] = await Promise.all([
			this.setup(tutorId), this.usersRepository.findOneBy({ id: learnerId }), this.sessionMemory(tutorId, learnerId),
			this.sessionHistory(tutorId, learnerId), this.questContext(tutorId, learnerId), this.memory(learnerId, tutorId),
		]);
		if (learner == null || prompts == null) return;
		const task = prompts.notesTask + '\n\n' + JSON.stringify({
			today: this.nowText(),
			notes: { profile: memory.profile, facts: memory.facts.map(({ id, text }) => ({ id, text })), summary: memory.summary },
		});
		// The notes come from the learner's own chatting, so they count towards the learner's allowance too.
		const usage = this.usageMeter();
		const update = await this.lojoEnglishService.chatJson([
			{ role: 'system', content: tutorSystemPrompt(prompts, card, sessionMemory, { questKnowledge: quest && questKnowledgeSection(quest.knowledge) }) },
			...history,
			{ role: 'system', content: task },
		], 0.2, 1200, normalizeMemoryUpdate, `tutor.notes learner=${learnerId}`, usage.add).finally(() => this.chargeLearner(learnerId, 'tutor.notes', usage.total()));
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
		await this.planHourly().catch(err => this.logger.warn(`plan hourly failed: ${err}`));
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
			const decision = proactiveDecision(state, new Date(), { tz: this.tz, startHour: this.hours[0], endHour: this.hours[1], perDay: proactivePerDay() });
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
			const [{ card, prompts }, memory, history, recentPosts, progress, persona, recent, uiLang] = await Promise.all([
				this.setup(tutorId), this.sessionMemory(tutorId, learnerId), this.sessionHistory(tutorId, learnerId), this.recentPosts(), this.progressCard(learnerId), this.persona(learnerId), this.recentMessages(tutorId, learnerId),
				learnerUiLang(this.registryApiService, learnerId),
			]);
			if (prompts == null) return false;
			// If the learner's last message is still unanswered, answer it instead of opening a new topic.
			const unanswered = history.at(-1)?.role === 'user';
			const system = tutorSystemPrompt(prompts, card, memory, {});
			const context = tutorContextMessage(prompts, {
				now: this.nowText(),
				learnerName: this.nameOf(learner),
				tutorName: persona.name,
				opener: unanswered ? undefined : { reason: this.openerReason(prompts, memory, history), recentPosts },
				progress,
				// only when she opens a new topic; an unanswered message is answered in the language it was written in
				uiLang: unanswered ? undefined : uiLang,
			});
			// The model answers the last turn. After the tutor's own messages that has to be a cue, not her last reply,
			// or she repeats it; an empty chat starts from a neutral cue too.
			const cue = history.length === 0 ? prompts.cueEmpty : prompts.cueWriteFirst;
			const turns: ChatTurn[] = unanswered ? history : [...history, { role: 'user', content: cue }];
			const answer = await this.whileTyping(learnerId, tutorId, () => this.lojoEnglishService.chatJson([{ role: 'system', content: system }, ...turns, { role: 'system', content: context }], 0.9, 600, normalizeTutorReply, `tutor.first learner=${learnerId}`));
			await this.send(tutor, learner, unanswered ? answer.messages : answer.messages.slice(0, 2), answer.voice, card.extensions.vibes?.voice);
			if (!unanswered) {
				await this.markWroteFirst(tutorId, learnerId, true);
			} else {
				await this.markAnswered(tutorId, learnerId, recent.findLast(m => m.fromUserId === learnerId)?.id);
				this.maybeUpdateMemory(tutorId, learnerId, false).catch(err => this.logger.warn(`notes update failed: ${err}`));
			}
			return true;
		} finally {
			await this.redisClient.del(`lojoTutor:replying:${tutorId}:${learnerId}`);
		}
	}

	// "Ask Vibi" on a failed level (endpoint lojo/quest/ask-tutor, after it checked the try is the learner's own, submitted
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
			const [{ card, prompts }, memory, history, progress, quest, persona, recent, uiLang] = await Promise.all([
				this.setup(tutorId), this.sessionMemory(tutorId, learnerId), this.sessionHistory(tutorId, learnerId), this.progressCard(learnerId), this.questContext(tutorId, learnerId), this.persona(learnerId), this.recentMessages(tutorId, learnerId),
				learnerUiLang(this.registryApiService, learnerId),
			]);
			if (quest == null) return;
			// Without her words, the same as when the model is away: where to go next, built from this try.
			if (prompts == null || await this.isDown()) {
				await this.sayAwayForQuest(tutor, learner, quest.knowledge, quest.questTry);
				return;
			}
			const system = tutorSystemPrompt(prompts, card, memory, { questKnowledge: questKnowledgeSection(quest.knowledge) });
			const context = tutorContextMessage(prompts, { now: this.nowText(), learnerName: this.nameOf(learner), tutorName: persona.name, progress, quest: questTrySection(prompts, quest.knowledge, quest.questTry), uiLang });
			// As in writeFirst, the model answers the last turn, so it ends with a cue (added to an unanswered message if there is one).
			const cue = prompts.cueQuest;
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
			// It answered their unanswered message too (see the cue above).
			if (history.at(-1)?.role === 'user') await this.markAnswered(tutorId, learnerId, recent.findLast(m => m.fromUserId === learnerId)?.id);
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
		await this.send(tutor, learner, [tutorText(await learnerUiLang(this.registryApiService, learner.id)).away(map)], false, undefined);
	}

	private async sayAwayForQuest(tutor: MiUser, learner: MiUser, knowledge: QuestKnowledge, questTry: QuestTry): Promise<void> {
		const away = questAwayMessage(knowledge, questTry, await learnerUiLang(this.registryApiService, learner.id));
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

	// The try from "Ask Vibi" in the last two hours, with the quest knowledge; null outside quest mode.
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
		const s = await this.lojoWordService.stats(learnerId, { tzOffset: -480 });
		if (s.words === 0) return { words: 0, dueToday: 0, reviewedToday: 0, updatedAt: null };
		return { words: s.words, dueToday: s.dueNow, reviewedToday: s.reviewedToday, updatedAt: s.lastAt };
	}

	// Older messages between this learner and the tutor that match the words of query: English words through Postgres
	// full-text search (to_tsvector 'simple'), Chinese as two-character substrings (Postgres splits no Chinese words
	// without an extension). Only messages older than beforeId when given. Best first, then newest.
	public async searchChat(tutorId: string, learnerId: string, query: string, opts: { beforeId?: string | null; limit?: number; minScore?: number } = {}): Promise<ChatHit[]> {
		const terms = searchTerms(query);
		if (terms.en.length === 0 && terms.zh.length === 0) return [];
		const { params, match, before } = chatSearchFilter(tutorId, learnerId, terms, opts.beforeId);
		const rows: { id: string; fromUserId: string; text: string }[] = await this.db.query(
			`SELECT m."id", m."fromUserId", m."text" FROM "chat_message" m
			WHERE ((m."fromUserId" = $1 AND m."toUserId" = $2) OR (m."fromUserId" = $2 AND m."toUserId" = $1))
			AND m."text" IS NOT NULL ${before} AND (${match})
			ORDER BY m."id" DESC LIMIT 200`,
			params,
		);
		return chatSearchHits(rows, tutorId, terms, id => this.idService.parse(id).date, opts);
	}

	// Keyword recall for a reply: the learner's last turn, searched in the messages older than the chat in the prompt.
	private async recall(tutorId: string, learnerId: string, history: ChatTurn[], prompts: TutorPrompts): Promise<string | null> {
		try {
			const from = await this.redisClient.hget(this.sessionKey(tutorId, learnerId), 'historyFrom');
			if (from == null) return null;
			const last = history.findLast(turn => turn.role === 'user')?.content ?? '';
			const hits = await this.searchChat(tutorId, learnerId, last, { beforeId: from, limit: 3, minScore: RECALL_MIN_SCORE });
			return recallText(hits, prompts);
		} catch (err) {
			this.logger.warn(`chat recall failed: ${err}`);
			return null;
		}
	}

	private openerReason(prompts: TutorPrompts, memory: TutorMemory, history: ChatTurn[]): string {
		return tutorOpenerReason(prompts, memory, history);
	}

	private async proactiveState(tutorId: string, learnerId: string): Promise<ProactiveState> {
		const [state, settings] = await Promise.all([
			this.redisClient.hgetall(this.stateKey(tutorId, learnerId)),
			this.registryApiService.getItem(learnerId, null, SCOPE, 'settings'),
		]);
		return tutorProactiveState(state, settings?.value);
	}

	// She wrote first (a check-in or a plan message): counts toward the day's limit and the "waiting for a reply" rules.
	private async markWroteFirst(tutorId: string, learnerId: string, checkIn: boolean): Promise<void> {
		const key = this.stateKey(tutorId, learnerId);
		const now = Date.now();
		const times = (await this.redisClient.hget(key, 'proactiveTimes') ?? '').split(',').filter(x => x !== '');
		await this.redisClient.hset(key, {
			lastProactiveAt: now,
			proactiveTimes: [...times, String(now)].slice(-12).join(','),
			...(checkIn ? { lastCheckInAt: now } : {}),
		});
		await this.redisClient.hincrby(key, 'unanswered', 1);
	}

	private async card(tutorId: string): Promise<TutorCard> {
		return (await this.setup(tutorId)).card;
	}

	// The tutor account's card (key card) and her words (key prompts, misc/lojo-tutor-prompts.ts), both in its own
	// registry. prompts is null when they are missing or broken: then she does not use the model.
	private async setup(tutorId: string): Promise<{ card: TutorCard; prompts: TutorPrompts | null }> {
		const [cardItem, promptsItem] = await Promise.all([
			this.registryApiService.getItem(tutorId, null, SCOPE, 'card'),
			this.registryApiService.getItem(tutorId, null, SCOPE, PROMPTS_KEY),
		]);
		const prompts = promptsItem ? normalizeTutorPrompts(promptsItem.value) : null;
		if (prompts == null) this.logger.warn(`tutor ${tutorId} has no usable prompts (registry ${SCOPE.join('/')} ${PROMPTS_KEY})`);
		return { card: normalizeTutorCard(cardItem?.value, prompts?.card), prompts };
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
		return tutorChatTurns(tutorId, messages);
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
		const used = await this.count(tutorBudgetKey(new Date()));
		const news = fuseNews(used, this.dailyLimit);
		if (news != null) this.tellFuse(news, used).catch(err => this.logger.warn(`could not tell admins about the fuse: ${err}`));
		return used <= this.dailyLimit;
	}

	private async tellFuse(news: 'half' | 'full', used: number): Promise<void> {
		const text = tutorFuseText(news, used, this.dailyLimit);
		this.logger.warn(text.log);
		const ids = this.fuseNotify.length > 0
			? (await this.usersRepository.findBy(this.fuseNotify.map(username => ({ usernameLower: username.toLowerCase(), host: IsNull() })))).map(u => u.id)
			: (await this.db.query(`SELECT "rootUserId" FROM "meta" WHERE "rootUserId" IS NOT NULL LIMIT 1`) as { rootUserId: string }[]).map(r => r.rootUserId);
		for (const id of ids) {
			this.notificationService.createNotification(id, 'app', {
				appAccessTokenId: null,
				customHeader: text.header,
				customBody: text.body,
				customIcon: null,
			});
		}
	}

	// Adds up the tokens of the calls behind one answer (retries included), to charge them as one.
	private usageMeter(): { add: (u: ModelUsage) => void; total: () => ModelUsage | null } {
		return tutorUsageMeter();
	}

	// What Vibi's answer cost, off the learner's allowance (then gems). Messages she writes first are not charged.
	private async chargeLearner(learnerId: string, source: string, usage: ModelUsage | null, fixedCost?: number): Promise<void> {
		if (usage == null && fixedCost == null) return;
		await this.lojoUsageService.charge(learnerId, `${source}:${this.idService.gen()}`, source, usage, fixedCost)
			.catch(err => this.logger.warn(`could not charge ${learnerId} for ${source}: ${err}`));
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
	// siteUrl (学习计划第一版补, 2026-11-20): the site's address for links Vibi writes in the chat (/guides/<slug>); her own
	// COMMUNITY_URL is the address inside the server, which a learner cannot open.
	public async pilotPrompt(tutorId: string, learnerId: string): Promise<{ system: string; now: string; name: string; you: string; cards: AppActionRecent[]; siteUrl: string }> {
		const [{ card, prompts }, learner, persona, cards] = await Promise.all([this.setup(tutorId), this.usersRepository.findOneByOrFail({ id: learnerId }), this.persona(learnerId), this.recentCards(learnerId)]);
		// (the pilot keeps the prompt it read last when this fails)
		if (prompts == null) throw new Error(`no prompts on the tutor account (registry ${PROMPTS_KEY})`);
		return { system: tutorFixedPrompt(prompts, card).trimEnd(), now: this.nowText(), name: this.nameOf(learner), you: persona.name, cards, siteUrl: this.config.url.replace(/\/+$/, '') };
	}

	// 第 6 步返工 (11-17): the learner's latest confirm cards and their state, for Vibi to speak by. Empty when redis
	// does not answer (she then says nothing about earlier cards, as before).
	private async recentCards(learnerId: string): Promise<AppActionRecent[]> {
		return await this.lojoAppsService.recentActions(learnerId).catch(() => [] as AppActionRecent[]);
	}

	// 每个学员自己的 Momo (misc/lojo-tutor-persona.ts): the face and name the learner picked, checked again on every read
	// (a learner can write their own registry directly).
	public async persona(learnerId: string): Promise<TutorPersona> {
		const item = await this.registryApiService.getItem(learnerId, null, SCOPE, PERSONA_KEY);
		return item == null ? defaultPersona(learnerId) : normalizePersona(item.value, learnerId, this.isProhibitedName);
	}

	// 聊天模式 (misc/lojo-tutor-mode.ts): how this learner picked for her to talk, checked again on every read.
	public async mode(learnerId: string): Promise<TutorMode> {
		const item = await this.registryApiService.getItem(learnerId, null, SCOPE, MODE_KEY);
		return normalizeTutorMode(item?.value);
	}

	// Whether the learner's replies come from Momo on Mastra, the only one who knows the modes (the menu shows only then).
	public async modesAvailable(learnerId: string): Promise<boolean> {
		return this.tutors.length > 0 && await this.onMastra(learnerId);
	}

	private async saveMode(learnerId: string, mode: TutorMode): Promise<TutorMode> {
		await this.registryApiService.set(learnerId, null, SCOPE, MODE_KEY, mode);
		return mode;
	}

	// From the menu under her name (lojo/tutor/mode/update): kept, and when it changed, the grey line in the chat (from
	// her, so her next reply sees it too).
	public async setMode(learner: MiUser, mode: TutorMode): Promise<TutorMode> {
		const was = await this.mode(learner.id);
		if (was === mode) return mode;
		await this.saveMode(learner.id, mode);
		const tutorId = this.tutors[0];
		const tutor = tutorId == null || tutorId === learner.id ? null : await this.usersRepository.findOneBy({ id: tutorId });
		if (tutor != null) {
			await this.chatService.createMessageToUser({ id: tutor.id, host: null }, learner, { text: modeNoticeText(mode, await learnerUiLang(this.registryApiService, learner.id)) })
				.catch(err => this.logger.warn(`mode notice not sent learner=${learner.id}: ${err}`));
		}
		return mode;
	}

	public async setPersona(learnerId: string, persona: { seed: string; name: string }): Promise<TutorPersona> {
		await this.registryApiService.set(learnerId, null, SCOPE, PERSONA_KEY, { seed: persona.seed, name: persona.name });
		return this.persona(learnerId);
	}

	// After the sign-up step 「认识你的 Momo」: the learner's Momo says hello under its new name, so the chat it opens is not
	// empty. Only into a chat with no messages yet, so it never repeats.
	public async greet(learner: MiUser, name: string): Promise<boolean> {
		const tutorId = this.tutors[0];
		if (tutorId == null || tutorId === learner.id) return false;
		if ((await this.chatService.userTimeline(tutorId, learner.id, 1)).length > 0) return false;
		const tutor = await this.usersRepository.findOneBy({ id: tutorId });
		if (tutor == null) return false;
		await this.send(tutor, learner, [personaHello(name, await learnerUiLang(this.registryApiService, learner.id))], false, undefined);
		return true;
	}

	// The site's prohibited words for user names (admin › moderation) apply to the name too.
	@bindThis
	public isProhibitedName(name: string): boolean {
		return this.utilityService.isKeyWordIncluded(name, this.meta.prohibitedWordsForNameOfUser);
	}

	private nameOf(user: MiUser): string {
		return user.name ?? user.username;
	}

	// To the day and part of the day: Mia needs no more, and a time to the minute would change the prompt every call.
	private nowText(): string {
		return tutorNowText(this.tz);
	}
}
