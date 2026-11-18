/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { UiLang } from '@/misc/lojo-ui-lang.js';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { LojoContentService } from '@/core/LojoContentService.js';
import { APPS_ROSTER_KIND } from '@/misc/lojo-apps-roster.js';
import type { AppsRosterEntry } from '@/misc/lojo-apps-roster.js';
import { mergeApps, searchApps } from '@/misc/lojo-apps-search.js';
import {
	APP_ACTION_ID,
	APP_ACTION_PENDING_MS,
	APP_ACTION_PER_REPLY,
	APP_ACTION_RECENT_KEEP,
	appActionText,
	appBodyProblems,
	appSpecOps,
	cleanAppPath,
	describeBody,
	fillAppText,
	findAppOp,
	recentAppCards,
} from '@/misc/lojo-apps-action.js';
import type { AppActionRecent, AppSpecOp } from '@/misc/lojo-apps-action.js';

// 小程序搬出社区 (founder, 2026-11-12): every mini app runs on its own at /apps/<id>/, keeps its own data in its own
// schema and answers its own API. The community keeps just two things (migration 1795000000000-LojoApps.js):
// - lojo_app, the directory: each mini app registers itself when it starts (name, one line, its kinds of data, its
//   OpenAPI spec, where it listens inside the network, and who may read which kind by default);
// - lojo_app_activity, the summary index: one line per set a learner finished, so Vibi can answer "how was my week"
//   without asking every mini app.
// Vibi's four fixed tools (listApps, appSpec, appCall, recentActivity) go through here. appCall checks the grant
// (app × kind of data, default: Vibi only), then forwards to the mini app with the shared service key; the mini app
// checks the key and the scopes again.
// 第 6 步 (2026-11-17): listApps searches the launcher's roster joined with this directory (lojo-apps-search.ts); a
// write Vibi asks for (appCall with POST…, only operations marked x-vibes-action, grant `<kind>:do`) is not sent: it is
// kept here and shown as a 「确认」 card under her reply, and goes to the app only when the learner taps 确认
// (lojo-apps-action.ts; endpoints lojo/apps/actions/show and decide).

export type LojoApp = {
	id: string; name: string; summary: string; base: string; internal: string; version: string;
	kinds: Record<string, string>; defaultGrants: Record<string, string[]>; spec: any; updatedAt: Date;
};

export type LojoActivityLine = { what: string; right?: number | null; total?: number | null; note?: string; at?: string };

export type LojoAppActionStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled' | 'expired';

/** One write Vibi asked for, as the card shows it (the body stays on the server). */
export type LojoAppActionView = {
	id: string; app: string; appName: string; appUrl: string | null;
	text: { zh: string; en: string }; done: { zh: string | null; en: string | null };
	status: LojoAppActionStatus; createdAt: string; decidedAt: string | null; error: string | null;
};

type StoredAction = {
	id: string; userId: string; caller: string; app: string; appName: string; appUrl: string | null;
	kind: string; method: string; path: string; body: unknown;
	text: { zh: string; en: string }; done: { zh: string | null; en: string | null };
	status: Exclude<LojoAppActionStatus, 'expired'>; createdAt: string; decidedAt: string | null; error: string | null;
};

// Callers that may be granted access. Only the community's own tutor for now; outside agents need the consent page
// first (design doc §9, not built).
export const LOJO_APP_CALLERS = ['vibi'] as const;

const ID = /^[a-z][a-z0-9-]{1,30}$/;
const CALL_TIMEOUT_MS = 3000;
const CALL_MAX_BYTES = 48 * 1024;
const ANSWERS_TIMEOUT_MS = 1500;
const ACTION_TIMEOUT_MS = 5000;
// a card shows its state for 30 days (then it reads as expired); the ids for the next reply wait 10 minutes
const ACTION_KEEP_SECONDS = 30 * 24 * 60 * 60;
const ACTION_NEW_SECONDS = 10 * 60;
const actionKey = (id: string) => `lojoAppAction:${id}`;
const actionNewKey = (userId: string) => `lojoAppAction:new:${userId}`;
const actionRecentKey = (userId: string) => `lojoAppAction:recent:${userId}`;

export function lojoServiceKeyOk(given: unknown): boolean {
	const want = process.env.MINIAPP_SERVICE_KEY ?? '';
	if (want.length < 24 || typeof given !== 'string') return false;
	const a = Buffer.from(given);
	const b = Buffer.from(want);
	return a.length === b.length && timingSafeEqual(a, b);
}

@Injectable()
export class LojoAppsService {
	private cache: { at: number; apps: LojoApp[] } | null = null;

	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.config)
		private config: Config,

		private lojoContentService: LojoContentService,
	) {}

	public async register(m: any): Promise<LojoApp> {
		if (m == null || typeof m !== 'object') throw new Error('bad manifest');
		const id = String(m.id ?? '');
		if (!ID.test(id)) throw new Error('bad id');
		const base = `/apps/${id}/`;
		if (m.base != null && m.base !== base) throw new Error(`base must be ${base}`);
		const internal = String(m.internal ?? '');
		if (!/^http:\/\/[a-z0-9.-]+(:\d{2,5})?\/$/.test(internal)) throw new Error('internal must be like http://typing:8080/');
		const kinds: Record<string, string> = {};
		for (const [k, v] of Object.entries(m.kinds ?? {})) if (ID.test(k)) kinds[k] = String(v).slice(0, 200);
		const grants: Record<string, string[]> = {};
		for (const [c, ks] of Object.entries(m.defaultGrants ?? {})) {
			if (!(LOJO_APP_CALLERS as readonly string[]).includes(c) || !Array.isArray(ks)) continue;
			// `<kind>` reads that kind; `<kind>:do` lets the caller ask the learner to confirm a write of it (第 6 步)
			grants[c] = ks.map(String).filter(k => k.replace(/:do$/, '') in kinds);
		}
		const spec = m.spec != null && typeof m.spec === 'object' ? m.spec : null;
		if (spec != null && JSON.stringify(spec).length > 64 * 1024) throw new Error('spec too large');
		await this.db.query(
			`INSERT INTO "lojo_app" ("id","name","summary","base","internal","version","kinds","defaultGrants","spec","updatedAt")
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
			 ON CONFLICT ("id") DO UPDATE SET "name"=$2,"summary"=$3,"base"=$4,"internal"=$5,"version"=$6,"kinds"=$7,"defaultGrants"=$8,"spec"=$9,"updatedAt"=now()`,
			[id, String(m.name ?? id).slice(0, 64), String(m.summary ?? '').slice(0, 512), base, internal, String(m.version ?? '').slice(0, 32), JSON.stringify(kinds), JSON.stringify(grants), spec == null ? null : JSON.stringify(spec)],
		);
		this.cache = null;
		return (await this.get(id))!;
	}

	public async all(): Promise<LojoApp[]> {
		if (this.cache && Date.now() - this.cache.at < 30_000) return this.cache.apps;
		const apps = await this.db.query<LojoApp[]>('SELECT * FROM "lojo_app" ORDER BY "id"');
		this.cache = { at: Date.now(), apps };
		return apps;
	}

	public async get(id: string): Promise<LojoApp | null> {
		return (await this.all()).find(a => a.id === id) ?? null;
	}

	// The directory as Vibi sees it: the roster (launcher order, with links) joined with what each app registered, and
	// which kinds this caller may read. With a query, only the apps that match, best first (total 0: there is none).
	public async listFor(callerId: string, opts: { query?: string | null; category?: string | null } = {}) {
		const roster = (this.lojoContentService.publicPack(APPS_ROSTER_KIND)?.data as { apps?: AppsRosterEntry[] } | undefined)?.apps ?? [];
		const merged = mergeApps(roster, await this.all(), callerId, this.config.url);
		const { terms: _terms, ...found } = searchApps(merged, opts);
		return found;
	}

	public granted(app: LojoApp, callerId: string, kind: string): boolean {
		return (app.defaultGrants[callerId] ?? []).includes(kind);
	}

	private async appUrl(appId: string): Promise<string | null> {
		const { apps } = await this.listFor('vibi');
		return apps.find(a => a.id === appId)?.url ?? null;
	}

	// What Vibi may call in one app: the reads (GET, with the kind each returns) and the writes she may ask the learner
	// to confirm (x-vibes-action), with their body in one line and the sentence the card will show.
	public async specFor(app: LojoApp, callerId: string) {
		const ops = appSpecOps(app.spec);
		return {
			id: app.id, name: app.name, version: app.version, url: await this.appUrl(app.id),
			paths: ops.filter(o => o.method === 'GET').map(o => ({ path: o.path, method: o.method, kind: o.kind, granted: this.granted(app, callerId, o.kind), summary: o.summary, params: o.params })),
			actions: ops.filter(o => o.method !== 'GET' && o.action != null).map(o => ({
				path: o.path, method: o.method, kind: o.kind, granted: this.granted(app, callerId, `${o.kind}:do`), summary: o.summary,
				body: describeBody(o.body), confirm: o.action!.zh,
			})),
		};
	}

	// One call Vibi makes for this learner, after the grant check. A read is forwarded and its answer returned; a write
	// is only kept, as a card for the learner to confirm (propose). Errors come back as an object the model can read.
	public async call(callerId: string, userId: string, appId: string, path: string, query: Record<string, string>, method = 'GET', body: unknown = null) {
		const app = await this.get(appId);
		if (app == null) return { error: { code: 'NO_SUCH_APP', message: `no app ${appId}` } };
		const clean = cleanAppPath(path);
		const op = findAppOp(appSpecOps(app.spec), method, clean);
		if (method.toUpperCase() !== 'GET') return await this.propose(callerId, userId, app, op, method.toUpperCase(), clean, body);
		if (op == null) return { error: { code: 'NO_SUCH_PATH', message: `${appId} has no GET ${clean}` } };
		if (!this.granted(app, callerId, op.kind)) return { error: { code: 'NOT_GRANTED', message: `${callerId} may not read ${appId}:${op.kind}` } };
		const qs = new URLSearchParams();
		for (const [k, v] of Object.entries(query ?? {})) if (/^[a-zA-Z]{1,20}$/.test(k)) qs.set(k, String(v).slice(0, 100));
		const url = `${app.internal}api/v1/${clean}${qs.size ? `?${qs}` : ''}`;
		try {
			const r = await fetch(url, {
				headers: {
					'x-vibes-service': process.env.MINIAPP_SERVICE_KEY ?? '',
					'x-vibes-user': userId,
					'x-vibes-caller': callerId,
					'x-vibes-scopes': `${appId}:${op.kind}`,
				},
				signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
				redirect: 'error',
			});
			const text = await r.text();
			if (text.length > CALL_MAX_BYTES) return { error: { code: 'TOO_LARGE', message: 'answer too large; ask for fewer items (limit)' } };
			try { return JSON.parse(text); } catch { return { error: { code: 'BAD_ANSWER', message: `${appId} answered ${r.status}` } }; }
		} catch (e) {
			return { error: { code: 'APP_DOWN', message: `${appId} did not answer (${(e as Error).name})` } };
		}
	}

	// ---------- 第 6 步: writes the learner confirms ----------

	private async propose(callerId: string, userId: string, app: LojoApp, op: AppSpecOp | null, method: string, path: string, body: unknown) {
		if (op == null || op.action == null) return { error: { code: 'NO_SUCH_PATH', message: `${app.id} has no ${method} ${path} that you may ask for (see actions in appSpec)` } };
		if (!this.granted(app, callerId, `${op.kind}:do`)) return { error: { code: 'NOT_GRANTED', message: `${callerId} may not ask to change ${app.id}:${op.kind}` } };
		const problems = appBodyProblems(op.body, body);
		if (problems.length > 0) return { error: { code: 'BAD_BODY', message: problems.join('; ') } };
		const newKey = actionNewKey(userId);
		if (await this.redisClient.llen(newKey) >= APP_ACTION_PER_REPLY) return { error: { code: 'TOO_MANY', message: `at most ${APP_ACTION_PER_REPLY} cards in one reply` } };
		const id = randomBytes(5).toString('hex');
		const action: StoredAction = {
			id, userId, caller: callerId, app: app.id, appName: app.name, appUrl: await this.appUrl(app.id),
			kind: op.kind, method, path, body: body ?? null,
			text: { zh: fillAppText(op.action.zh, body), en: fillAppText(op.action.en, body) },
			done: { zh: op.action.doneZh && fillAppText(op.action.doneZh, body), en: op.action.doneEn && fillAppText(op.action.doneEn, body) },
			status: 'pending', createdAt: new Date().toISOString(), decidedAt: null, error: null,
		};
		await this.redisClient.set(actionKey(id), JSON.stringify(action), 'EX', ACTION_KEEP_SECONDS);
		await this.redisClient.rpush(newKey, id);
		await this.redisClient.expire(newKey, ACTION_NEW_SECONDS);
		const recentKey = actionRecentKey(userId);
		await this.redisClient.lpush(recentKey, id);
		await this.redisClient.ltrim(recentKey, 0, APP_ACTION_RECENT_KEEP - 1);
		await this.redisClient.expire(recentKey, ACTION_KEEP_SECONDS);
		return { ok: true, pending: true, actionId: id, confirm: action.text.zh, note: 'A confirm card is shown under your reply. Nothing is written until the learner taps 确认; do not say it is done.' };
	}

	/** The marker messages for the writes Vibi asked for in this reply (sent after her words), with the sentence in the
	 * learner's interface language (the card shows it in that language anyway; this is what the chat list and a card
	 * that cannot load show). */
	public async actionCards(userId: string, lang: UiLang = 'zh'): Promise<string[]> {
		const key = actionNewKey(userId);
		const ids = await this.redisClient.lrange(key, 0, APP_ACTION_PER_REPLY - 1).catch(() => [] as string[]);
		await this.redisClient.del(key).catch(() => {});
		const out: string[] = [];
		for (const id of ids) {
			const a = await this.loadAction(id);
			if (a != null && a.userId === userId) out.push(appActionText(a.text[lang] || a.text.zh, a.id));
		}
		return out;
	}

	/** This learner's latest cards and what became of them, newest first (sent to Vibi with every /chat, /event and prompt). */
	public async recentActions(userId: string): Promise<AppActionRecent[]> {
		const ids = await this.redisClient.lrange(actionRecentKey(userId), 0, APP_ACTION_RECENT_KEEP - 1);
		const views: LojoAppActionView[] = [];
		for (const id of ids) {
			const a = await this.loadAction(id);
			if (a != null && a.userId === userId) views.push(this.view(a));
		}
		return recentAppCards(views);
	}

	private async loadAction(id: string): Promise<StoredAction | null> {
		if (!APP_ACTION_ID.test(id)) return null;
		const raw = await this.redisClient.get(actionKey(id));
		if (raw == null) return null;
		try { return JSON.parse(raw) as StoredAction; } catch { return null; }
	}

	private view(a: StoredAction): LojoAppActionView {
		const expired = a.status === 'pending' && Date.now() - Date.parse(a.createdAt) > APP_ACTION_PENDING_MS;
		return {
			id: a.id, app: a.app, appName: a.appName, appUrl: a.appUrl, text: a.text, done: a.done,
			status: expired ? 'expired' : a.status, createdAt: a.createdAt, decidedAt: a.decidedAt, error: a.error,
		};
	}

	/** The card's state, for its owner only (null: no such card, or not theirs). */
	public async showAction(userId: string, id: string): Promise<LojoAppActionView | null> {
		const a = await this.loadAction(id);
		return a == null || a.userId !== userId ? null : this.view(a);
	}

	// The learner's tap. 确认 sends the kept request to the app, as this learner, with the confirm id; 取消 sends nothing.
	// A failed one may be tried again; a done, cancelled or expired one stays as it is. One tap at a time per card.
	public async decideAction(userId: string, id: string, decision: 'confirm' | 'cancel'): Promise<LojoAppActionView | null> {
		const lock = `lojoAppAction:lock:${id}`;
		if (await this.redisClient.set(lock, '1', 'EX', 15, 'NX') !== 'OK') {
			const now = await this.showAction(userId, id);
			return now == null ? null : { ...now, status: 'running' };
		}
		try {
			const a = await this.loadAction(id);
			if (a == null || a.userId !== userId) return null;
			const now = this.view(a);
			const open = now.status === 'pending' || (now.status === 'failed' && decision === 'confirm');
			if (!open) return now;
			const save = async (patch: Partial<StoredAction>) => {
				Object.assign(a, patch);
				const ttl = await this.redisClient.ttl(actionKey(id));
				await this.redisClient.set(actionKey(id), JSON.stringify(a), 'EX', ttl > 0 ? ttl : ACTION_KEEP_SECONDS);
			};
			if (decision === 'cancel') {
				await save({ status: 'cancelled', decidedAt: new Date().toISOString() });
				return this.view(a);
			}
			await save({ status: 'running', error: null });
			const error = await this.sendAction(a);
			await save({ status: error == null ? 'done' : 'failed', error, decidedAt: new Date().toISOString() });
			return this.view(a);
		} finally {
			await this.redisClient.del(lock).catch(() => {});
		}
	}

	// null when the app took it; otherwise what went wrong, in a few words for the card.
	private async sendAction(a: StoredAction): Promise<string | null> {
		const app = await this.get(a.app);
		if (app == null) return 'NO_SUCH_APP';
		// checked again at the tap: the app may have changed its spec or taken the grant back since
		const op = findAppOp(appSpecOps(app.spec), a.method, a.path);
		if (op == null || op.action == null || op.kind !== a.kind) return 'NO_SUCH_PATH';
		if (!this.granted(app, a.caller, `${op.kind}:do`)) return 'NOT_GRANTED';
		try {
			const r = await fetch(`${app.internal}api/v1/${a.path}`, {
				method: a.method,
				headers: {
					'content-type': 'application/json',
					'x-vibes-service': process.env.MINIAPP_SERVICE_KEY ?? '',
					'x-vibes-user': a.userId,
					'x-vibes-caller': a.caller,
					'x-vibes-scopes': `${a.app}:${a.kind}:do`,
					'x-vibes-confirmed': a.id,
				},
				body: a.body == null ? undefined : JSON.stringify(a.body),
				signal: AbortSignal.timeout(ACTION_TIMEOUT_MS),
				redirect: 'error',
			});
			if (r.ok) return null;
			const text = (await r.text()).slice(0, 2000);
			let code = `HTTP_${r.status}`;
			try { code = String((JSON.parse(text) as { error?: { code?: unknown } }).error?.code ?? code); } catch { /* not JSON */ }
			return code.slice(0, 64);
		} catch (e) {
			return `APP_DOWN (${(e as Error).name})`.slice(0, 64);
		}
	}

	// 私信「任务」标签的自动打勾 (2026-11-15): how many answers a learner gave in a mini app since `since` (their local
	// midnight), by group or station. Not Vibi's grant: the community itself reads with the caller `plan` and the one scope
	// `<app>:answers`. Up to 5 pages of 100, 1.5 s for all of them, kept 5 s
	// (only to spare the app when a page is opened twice at once: back from a round, the count must be the new one). null when the app did not answer in time;
	// the page then just does not tick (only the log hears of it).
	private answerCache = new Map<string, { at: number; value: { total: number; by: Record<string, number> } }>();

	public async answersToday(userId: string, appId: 'dictation' | 'vocab', since: Date): Promise<{ total: number; by: Record<string, number> } | null> {
		const key = `${userId}|${appId}|${since.toISOString()}`;
		const hit = this.answerCache.get(key);
		if (hit && Date.now() - hit.at < 5_000) return hit.value;
		const app = await this.get(appId);
		if (app == null) return null;
		const signal = AbortSignal.timeout(ANSWERS_TIMEOUT_MS);
		const by: Record<string, number> = {};
		let total = 0;
		let cursor: string | null = null;
		try {
			for (let page = 0; page < 5; page++) {
				const qs = new URLSearchParams({ since: since.toISOString(), limit: '100' });
				if (cursor) qs.set('cursor', cursor);
				const r = await fetch(`${app.internal}api/v1/answers?${qs}`, {
					headers: {
						'x-vibes-service': process.env.MINIAPP_SERVICE_KEY ?? '',
						'x-vibes-user': userId,
						'x-vibes-caller': 'plan',
						'x-vibes-scopes': `${appId}:answers`,
					},
					signal,
					redirect: 'error',
				});
				if (!r.ok) return null;
				const body = await r.json() as { items?: any[]; next?: string | null; cursor?: string | null };
				for (const row of body.items ?? []) {
					// dictation: one row per word with how many times right and wrong; vocab: one row per word answered
					const ref = String(appId === 'dictation' ? row.set : row.stop);
					const n = appId === 'dictation' ? (Number(row.right) || 0) + (Number(row.wrong) || 0) : 1;
					by[ref] = (by[ref] ?? 0) + n;
					total += n;
				}
				cursor = body.next ?? body.cursor ?? null;
				if (!cursor) break;
			}
		} catch {
			return null;
		}
		const value = { total, by };
		if (this.answerCache.size > 1000) this.answerCache.clear();
		this.answerCache.set(key, { at: Date.now(), value });
		return value;
	}

	public async report(userId: string, appId: string, line: LojoActivityLine): Promise<void> {
		if (await this.get(appId) == null) throw new Error('unknown app');
		const at = line.at != null ? new Date(line.at) : new Date();
		if (Number.isNaN(at.getTime())) throw new Error('bad at');
		const num = (v: unknown) => (typeof v === 'number' && Number.isSafeInteger(v) ? v : null);
		await this.db.query(
			'INSERT INTO "lojo_app_activity" ("userId","app","what","right","total","note","at") VALUES ($1,$2,$3,$4,$5,$6,$7)',
			[userId, appId, String(line.what ?? '').slice(0, 200), num(line.right), num(line.total), String(line.note ?? '').slice(0, 200), at],
		);
	}

	// 资料页「学习」标签（core/LojoLearnService.ts）要的几样，只读：
	// - days：过去 N 天每天（北京时间）学了几次，按小程序分开数。读摘要索引，另外加上闯关过关（闯关不往摘要里报）；
	// - levels：闯关过了哪些关、什么时候过的；
	// - joinedAt：「哪一季加入」。
	public async learner(userId: string, days: number) {
		const since = new Date(Date.now() - days * 86400_000);
		const [rows, quest, user] = await Promise.all([
			this.db.query<{ day: string; app: string; n: number }[]>(
				`SELECT to_char("at" AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD') AS "day", "app", count(*)::int AS "n"
				 FROM "lojo_app_activity" WHERE "userId" = $1 AND "at" >= $2 GROUP BY 1, 2
				 UNION ALL
				 SELECT to_char(coalesce("endedAt", "createdAt") AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD'), 'quest', count(*)::int
				 FROM "lojo_quest_attempt" WHERE "userId" = $1 AND "status" = 'passed' AND "createdAt" >= $2 GROUP BY 1, 2`,
				[userId, since],
			),
			this.db.query<{ levels: Record<string, { passedAt?: string }> }[]>('SELECT "levels" FROM "lojo_quest" WHERE "userId" = $1', [userId]),
			this.db.query<{ id: string }[]>('SELECT "id" FROM "user" WHERE "id" = $1', [userId]),
		]);
		if (user.length === 0) return null;
		const out = new Map<string, { day: string; n: number; apps: Record<string, number> }>();
		for (const r of rows) {
			const d = out.get(r.day) ?? { day: r.day, n: 0, apps: {} };
			d.n += r.n; d.apps[r.app] = (d.apps[r.app] ?? 0) + r.n;
			out.set(r.day, d);
		}
		const levels = Object.entries(quest[0]?.levels ?? {}).flatMap(([id, l]) => (l?.passedAt ? [{ id, at: l.passedAt }] : []));
		// aidx：前 8 位是 2000-01-01 起的毫秒数（36 进制）
		const joinedAt = new Date(parseInt(userId.slice(0, 8), 36) + 946684800000).toISOString();
		return {
			days: [...out.values()].sort((a, b) => a.day.localeCompare(b.day)),
			levels: levels.sort((a, b) => a.at.localeCompare(b.at)),
			joinedAt,
		};
	}

	public async recent(userId: string, opts: { since?: Date | null; app?: string | null; limit: number }) {
		const rows = await this.db.query<{ app: string; what: string; right: number | null; total: number | null; note: string; at: Date }[]>(
			`SELECT "app","what","right","total","note","at" FROM "lojo_app_activity" WHERE "userId" = $1
			 AND ($2::timestamptz IS NULL OR "at" >= $2) AND ($3::varchar IS NULL OR "app" = $3)
			 ORDER BY "at" DESC LIMIT $4`,
			[userId, opts.since ?? null, opts.app ?? null, opts.limit],
		);
		return rows.map(r => ({ app: r.app, what: r.what, right: r.right, total: r.total, note: r.note, at: new Date(r.at).toISOString() }));
	}
}
