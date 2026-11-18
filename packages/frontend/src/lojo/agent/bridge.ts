/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 发到我的电脑 (2026-11-15, redone 11-16): the learner's own browser talks to the Paseo daemon on their own computer
// through Paseo's end-to-end encrypted relay (@getpaseo/client). The pairing link is kept in this browser only
// (localStorage); it is never sent to our server, never logged. The server only hears a yes/no (lojo/agent/bridge), so
// Vibi knows whether a draft card can be used. Nothing here runs unless the learner taps a button; reading the
// computer's name, folders and a sent task's progress starts nothing on it.
// @getpaseo/client is about 640 KB gzipped; it is imported only when it is first needed.

import { ref } from 'vue';
import { buildWorkLog, stepsSummary } from './worklog.js';
import type { Step, TimelineItem } from './worklog.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { myTutorName } from '@/lojo/tutor/persona.js';
import { agentText as L } from '@/lojo/locales/agent.js';

const STORE = 'vibes.agentBridge.v1';
const SENT = 'vibes.agentBridge.sent.v1';
const RELAY_DEFAULT = 'relay.paseo.sh:443';
// The daemon this was built and checked against (11-15): 0.15.4.
const APP_VERSION = '0.15.4';
// When the computer's agent was never used: Claude Code with Paseo's default model.
const DEFAULT_PROVIDER = 'claude';

export type PaseoOffer = { v: 2; serverId: string; daemonPublicKeyB64: string; relay: { endpoint: string; useTls?: boolean } };
// cwd: the working folder chosen in settings (every task runs there). config: provider/model last used there.
type Saved = { offer: PaseoOffer; pairedAt: string; clientId: string; host?: string; cwd?: string; config?: string };

function b64urlJson(s: string): unknown {
	const b = s.replace(/-/g, '+').replace(/_/g, '/');
	const bin = atob(b + '==='.slice((b.length + 3) % 4));
	return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
}

// The link Paseo shows when pairing a phone: https://app.paseo.sh/#offer=<base64url JSON>.
export function parseOfferLink(link: string): PaseoOffer | null {
	const m = /#offer=([A-Za-z0-9_-]+)/.exec(link.trim());
	if (!m) return null;
	try {
		const o = b64urlJson(m[1]) as PaseoOffer;
		if (o?.v !== 2 || typeof o.serverId !== 'string' || typeof o.daemonPublicKeyB64 !== 'string' || typeof o.relay?.endpoint !== 'string') return null;
		return o;
	} catch {
		return null;
	}
}

function load(): Saved | null {
	try {
		const s = JSON.parse(localStorage.getItem(STORE) ?? 'null') as Saved | null;
		return s?.offer ? s : null;
	} catch {
		return null;
	}
}

export const paired = ref<Saved | null>(load());

function save(s: Saved | null) {
	if (s) localStorage.setItem(STORE, JSON.stringify(s));
	else localStorage.removeItem(STORE);
	paired.value = s;
}

// Is it switched on for me, and does the server think a computer is connected (from this or another browser)?
export function bridgeState(connected?: boolean): Promise<{ enabled: boolean; connected: boolean }> {
	return misskeyApi('lojo/agent/bridge', connected == null ? {} : { connected }) as Promise<{ enabled: boolean; connected: boolean }>;
}

function relayUrl(o: PaseoOffer): string {
	const endpoint = o.relay.endpoint || RELAY_DEFAULT;
	const useTls = o.relay.useTls ?? endpoint.endsWith(':443');
	const u = new URL(`${useTls ? 'wss' : 'ws'}://${endpoint}/ws`);
	u.searchParams.set('serverId', o.serverId);
	u.searchParams.set('role', 'client');
	u.searchParams.set('v', '2');
	return u.toString();
}

// ---------- One shared connection ----------
// Cards and the settings page share it; it closes 20 seconds after the last one lets go.
// It is built like createPaseoClient (client 0.15.4), but keeps the daemon client for the computer's name and to stop
// a task (cancelAgent), which the high-level API does not offer.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Api = any;
type Daemon = any;
/* eslint-enable @typescript-eslint/no-explicit-any */
type Conn = { key: string; api: Api; daemon: Daemon; users: number; closeTimer: number | null; broken: boolean };

let conn: Promise<Conn> | null = null;

async function openConn(s: Saved): Promise<Conn> {
	const [{ createPaseoApi }, { DaemonClient }] = await Promise.all([
		import('@getpaseo/client'),
		import('@getpaseo/client/internal/daemon-client'),
	]);
	const daemon = new DaemonClient({
		url: relayUrl(s.offer), clientId: s.clientId, clientType: 'cli', appVersion: APP_VERSION,
		e2ee: { enabled: true, daemonPublicKeyB64: s.offer.daemonPublicKeyB64 },
		reconnect: { enabled: false }, connectTimeoutMs: 20000,
		// The default logger writes to the console; keep it quiet (nothing secret is in it, but it is noisy).
		logger: { debug() {}, info() {}, warn() {}, error() {} },
	});
	const api = createPaseoApi(daemon);
	try {
		await daemon.connect();
	} catch (err) {
		await daemon.close().catch(() => {});
		throw err;
	}
	return { key: s.offer.serverId + s.clientId, api, daemon, users: 0, closeTimer: null, broken: false };
}

async function closeConn(c: Conn) {
	if (conn != null && (await conn.catch(() => null)) === c) conn = null;
	try {
		await c.api.dispose();
	} catch { /* closing anyway */ }
	await c.daemon.close().catch(() => {});
}

async function acquire(s: Saved): Promise<Conn> {
	const key = s.offer.serverId + s.clientId;
	let c = conn ? await conn.catch(() => null) : null;
	if (c != null && (c.key !== key || c.broken || c.daemon.getConnectionState?.().status !== 'connected')) {
		void closeConn(c);
		c = null;
	}
	if (c == null) {
		conn = openConn(s);
		conn.catch(() => { conn = null; });
		c = await conn;
	}
	c.users++;
	if (c.closeTimer != null) {
		window.clearTimeout(c.closeTimer);
		c.closeTimer = null;
	}
	return c;
}

function release(c: Conn) {
	c.users = Math.max(0, c.users - 1);
	if (c.users === 0 && c.closeTimer == null) c.closeTimer = window.setTimeout(() => { void closeConn(c); }, 20000);
}

async function withConn<T>(fn: (c: Conn) => Promise<T>, s: Saved | null = paired.value): Promise<T> {
	if (!s) throw new Error('not paired');
	const c = await acquire(s);
	try {
		return await fn(c);
	} catch (err) {
		c.broken = true;
		throw err;
	} finally {
		release(c);
	}
}

// ---------- Pairing ----------

export type Folder = { path: string; name: string };
export type Computer = { host: string | null; folders: Folder[]; config: string | null };

function hostOf(c: Conn): string | null {
	const h = c.daemon.getLastServerInfoMessage?.()?.hostname;
	return typeof h === 'string' && h.trim() !== '' ? h.trim() : null;
}

function nameOf(path: string): string {
	return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

// The folders this computer works in: where its agents ran lately first, then the projects Paseo knows.
async function readComputer(c: Conn): Promise<Computer> {
	const [agents, projects] = await Promise.all([
		c.api.agents.list({ limit: 30 }).catch(() => ({ entries: [] })),
		c.api.projects.list().catch(() => ({ projects: [] })),
	]);
	const folders: Folder[] = [];
	const add = (path: unknown, name?: unknown) => {
		if (typeof path !== 'string' || path === '' || folders.some(f => f.path === path)) return;
		folders.push({ path, name: typeof name === 'string' && name !== '' ? name : nameOf(path) });
	};
	let config: string | null = null;
	for (const e of (agents.entries ?? []) as { agent?: { cwd?: string; provider?: string; model?: string | null } }[]) {
		add(e.agent?.cwd);
		if (config == null && e.agent?.provider && e.agent.model) config = `${e.agent.provider}/${e.agent.model}`;
	}
	for (const p of (projects.projects ?? []) as { projectRootPath?: string; projectCustomName?: string | null; projectDisplayName?: string }[]) {
		add(p.projectRootPath, p.projectCustomName || p.projectDisplayName);
	}
	return { host: hostOf(c), folders: folders.slice(0, 12), config };
}

// Pair this browser with the computer in the link: connect once to check, then keep the link here.
export async function connect(link: string): Promise<Computer> {
	const offer = parseOfferLink(link);
	if (!offer) throw new Error('bad-link');
	const clientId = `vibes-${crypto.getRandomValues(new Uint32Array(2)).join('')}`;
	const s: Saved = { offer, pairedAt: new Date().toISOString(), clientId };
	const computer = await withConn(readComputer, s);
	save({ ...s, host: computer.host ?? undefined, config: computer.config ?? undefined });
	await bridgeState(true).catch(() => {});
	return computer;
}

export function setFolder(path: string): void {
	if (paired.value) save({ ...paired.value, cwd: path.trim() });
}

export async function disconnect(): Promise<void> {
	const c = conn ? await conn.catch(() => null) : null;
	if (c) await closeConn(c);
	save(null);
	await bridgeState(false).catch(() => {});
}

// Is the computer there (settings opens with this)? Nothing is started on it.
export async function check(): Promise<Computer & { ms: number }> {
	const t0 = performance.now();
	return withConn(async c => {
		const ms = Math.round(performance.now() - t0);
		const computer = await readComputer(c);
		const s = paired.value;
		if (s && (computer.host !== (s.host ?? null) || (computer.config && computer.config !== s.config))) {
			save({ ...s, host: computer.host ?? s.host, config: computer.config ?? s.config });
		}
		return { ...computer, ms };
	});
}

export function agentName(config: string | null | undefined): string {
	const p = (config ?? DEFAULT_PROVIDER).split('/')[0];
	return p === 'claude' ? 'Claude Code' : p === 'codex' ? 'Codex' : p === 'opencode' ? 'OpenCode' : p;
}

// ---------- A sent card ----------

export type Permission = { id: string; title: string; command: string | null; actions: { id?: string; label: string; behavior: 'allow' | 'deny' }[] };

// What happened to one draft card in this browser (so the card shows it again after a reload).
export type SentState = {
	agentId: string;
	at: string;
	cwd?: string;
	status: 'running' | 'permission' | 'done' | 'error' | 'stopped' | 'lost';
	endedAt?: string;
	answer?: string;
	error?: string;
	steps?: Step[];
	files?: string[];
	count?: number;
	handedBack?: boolean;
};

// Cards sent before 11-16 kept 'idle' / 'timeout' and result.
type OldSent = Omit<SentState, 'status'> & { status: string; result?: string };

function readAll(): Record<string, SentState> {
	try {
		const all = JSON.parse(localStorage.getItem(SENT) ?? '{}') as Record<string, OldSent>;
		for (const st of Object.values(all)) {
			if (st.status === 'idle') st.status = 'done';
			if (st.status === 'timeout') st.status = 'running';
			if (st.result != null && st.answer == null) st.answer = st.result;
		}
		return all as Record<string, SentState>;
	} catch {
		return {};
	}
}

export function sentState(draftId: string): SentState | null {
	return readAll()[draftId] ?? null;
}

export function setSentState(draftId: string, st: SentState): void {
	const all = readAll();
	all[draftId] = st;
	// keep the newest 30
	const keep = Object.entries(all).sort((a, b) => b[1].at.localeCompare(a[1].at)).slice(0, 30);
	localStorage.setItem(SENT, JSON.stringify(Object.fromEntries(keep)));
}

// Start a new conversation on the computer, in the folder chosen in settings, with this instruction.
export async function send(draftId: string, instruction: string): Promise<SentState> {
	const s = paired.value;
	if (!s) throw new Error('not paired');
	if (!s.cwd) throw new Error('no-folder');
	const cwd = s.cwd;
	return withConn(async c => {
		const agent = await c.api.agents.create({
			config: { provider: s.config ?? DEFAULT_PROVIDER },
			cwd,
			title: `${myTutorName.value} · ${instruction.split('\n')[0].slice(0, 40)}`,
			prompt: instruction,
			labels: { from: 'vibes', draft: draftId },
		});
		const st: SentState = { agentId: agent.id, at: new Date().toISOString(), cwd, status: 'running' };
		setSentState(draftId, st);
		return st;
	});
}

export type Live = {
	st: SentState;
	steps: Step[];
	thinking: string | null;
	answer: string;
	files: string[];
	count: number;
	permission: Permission | null;
	// The computer could not be reached just now; it keeps trying.
	offline: boolean;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function permissionOf(p: any): Permission {
	const d = p?.detail ?? {};
	const command = d.type === 'shell' ? String(d.command ?? '') : (d.type === 'edit' || d.type === 'write') ? String(d.filePath ?? '') : null;
	const fallback = p?.name === 'Bash' || d.type === 'shell' ? L.runCommand : (d.type === 'edit' || d.type === 'write') ? L.editFile : (p?.title || p?.name || L.anAction);
	const actions = Array.isArray(p?.actions) && p.actions.length > 0
		? p.actions.map((a: any) => ({ id: a.id, label: String(a.label ?? ''), behavior: a.behavior === 'deny' ? 'deny' : 'allow' }))
		: [{ label: L.allow, behavior: 'allow' }, { label: L.deny, behavior: 'deny' }];
	return { id: String(p.id), title: p?.title && p.title !== p.name ? String(p.title) : fallback, command: command || (p?.description ? String(p.description) : null), actions };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const POLL_MS = 3000;
// Cards the learner stopped in this page, so a read that was already on its way does not call them done.
const stopAsked = new Set<string>();
const ANSWER_KEEP = 20000;

// Follow a sent task live: the card updates while the agent works, asks, finishes. Returns a stop function.
// Every change on the computer (a step, a permission request, the end) triggers a fresh read of the last part of the
// timeline; a slow poll covers anything missed. When it ends, the result is kept in this browser and watching stops.
export function watch(draftId: string, onChange: (live: Live) => void): () => void {
	let stopped = false;
	let c: Conn | null = null;
	let unsubscribe: (() => void) | null = null;
	let timer: number | null = null;
	let pending: number | null = null;
	let busy = false;
	let failures = 0;

	const st0 = sentState(draftId);
	if (!st0 || !paired.value) return () => {};
	let st: SentState = st0;

	const finish = () => {
		stopped = true;
		if (timer != null) window.clearTimeout(timer);
		if (pending != null) window.clearTimeout(pending);
		unsubscribe?.();
		unsubscribe = null;
		if (c) release(c);
		c = null;
	};

	const emit = (live: Omit<Live, 'st'>) => { if (!stopped) onChange({ st, ...live }); };

	async function refresh() {
		if (stopped || busy) return;
		busy = true;
		try {
			if (c == null) {
				c = await acquire(paired.value!);
				const ref = c.api.agents.ref(st.agentId);
				const sub = ref.timeline.subscribe(() => schedule(400));
				unsubscribe = () => { try { sub(); } catch { /* gone */ } };
				void sub.ready?.catch?.(() => {});
			}
			const ref = c.api.agents.ref(st.agentId);
			const page = await ref.timeline.refetch({ direction: 'tail', projection: 'projected', limit: 200 });
			failures = 0;
			const agent = page.agent ?? ref.current();
			if (page.error && !agent) {
				st = { ...st, status: 'lost', endedAt: new Date().toISOString() };
				setSentState(draftId, st);
				emit({ steps: st.steps ?? [], thinking: null, answer: st.answer ?? '', files: st.files ?? [], count: st.count ?? 0, permission: null, offline: false });
				finish();
				return;
			}
			const items = ((page.entries ?? []) as { item: TimelineItem }[]).map(e => e.item);
			const perms = (agent?.pendingPermissions ?? []) as unknown[];
			const status: string = agent?.status ?? 'running';
			// Right after it is created the agent can read idle for a moment, before it has done anything.
			const started = items.some(i => i.type !== 'user_message');
			const working = perms.length > 0 || status === 'running' || status === 'initializing' || (status === 'idle' && !started && Date.now() - Date.parse(st.at) < 60000);
			const log = buildWorkLog(items, st.cwd, working);
			if (working) {
				st = { ...st, status: perms.length > 0 ? 'permission' : 'running' };
			} else {
				const failed = status === 'error';
				// When it ended, not when this page found out: the card may be opened again hours later.
				const last = Date.parse(String(agent?.updatedAt ?? ''));
				const endedAt = Number.isFinite(last) && last > Date.parse(st.at) && last < Date.now() ? new Date(last).toISOString() : new Date().toISOString();
				st = {
					...st,
					status: failed ? 'error' : stopAsked.has(draftId) ? 'stopped' : 'done',
					endedAt,
					answer: log.answer.slice(0, ANSWER_KEEP),
					error: failed ? String(agent?.lastError ?? '') || undefined : undefined,
					steps: log.steps.slice(-60),
					files: log.files,
					count: log.count,
				};
			}
			setSentState(draftId, st);
			emit({ ...log, permission: perms.length > 0 ? permissionOf(perms[0]) : null, offline: false });
			if (!working) finish();
		} catch {
			// The computer is asleep, Paseo is closed, or the relay dropped: try again with a fresh connection.
			failures++;
			if (c) {
				c.broken = true;
				unsubscribe?.();
				unsubscribe = null;
				release(c);
				c = null;
			}
			emit({ steps: st.steps ?? [], thinking: null, answer: st.answer ?? '', files: st.files ?? [], count: st.count ?? 0, permission: null, offline: true });
		} finally {
			busy = false;
			if (!stopped) {
				if (timer != null) window.clearTimeout(timer);
				timer = window.setTimeout(() => { void refresh(); }, failures === 0 ? POLL_MS : Math.min(30000, POLL_MS * 2 ** failures));
			}
		}
	}

	function schedule(ms: number) {
		if (stopped || pending != null) return;
		pending = window.setTimeout(() => { pending = null; void refresh(); }, ms);
	}

	void refresh();
	return finish;
}

export async function answerPermission(draftId: string, p: Permission, action: Permission['actions'][number]): Promise<void> {
	const st = sentState(draftId);
	if (!st) return;
	await withConn(c => c.api.agents.ref(st.agentId).respondToPermission({
		requestId: p.id,
		response: action.behavior === 'allow'
			? { behavior: 'allow', ...(action.id ? { selectedActionId: action.id } : {}) }
			: { behavior: 'deny', ...(action.id ? { selectedActionId: action.id } : {}), message: 'The learner said no from Vibes.' },
	}));
}

// Stop the task on the computer (like Paseo's stop button). What it already did stays done.
export async function stopTask(draftId: string): Promise<void> {
	const st = sentState(draftId);
	if (!st) return;
	stopAsked.add(draftId);
	await withConn(c => c.daemon.cancelAgent(st.agentId));
}

// What goes back to Vibi when the learner taps 「让 Vibi 总结」: marked as outside content, with a line on what it did and
// the agent's answer, so Vibi can pick out what matters. A chat message holds at most 2000 characters
// (chat/messages/create-to-user), so a long answer keeps its beginning and its end, with the middle left out.
export const RESULT_HEAD = '[agent result · external';
export const HAND_BACK_MAX = 2000;

export function handBackText(draftId: string, st: SentState): string {
	const body = (st.answer || st.error || '').trim() || '(no text)';
	const took = st.endedAt ? Math.round((Date.parse(st.endedAt) - Date.parse(st.at)) / 1000) : null;
	let did = stepsSummary({ steps: st.steps ?? [], files: st.files ?? [] });
	if (did.length > 300) did = did.slice(0, 299) + '…';
	const head = (cut: boolean) => `${RESULT_HEAD} · draft ${draftId} · ${st.status === 'done' ? 'finished' : st.status}${took != null ? ` · ${took}s` : ''}${cut ? ' · cut short' : ''}]`;
	const didLine = did ? `做了什么：${did}\n\n` : ''; // vibes-i18n-keep: the marker draftCard.ts reads back
	const room = HAND_BACK_MAX - head(true).length - 1 - didLine.length;
	if (body.length <= room) return `${head(false)}\n${didLine}${body}`;
	const gap = '\n\n…（中间省略）…\n\n'; // vibes-i18n-keep: inside the message to Momo, which reads Chinese
	const end = Math.floor((room - gap.length) * 0.35);
	const start = room - gap.length - end;
	return `${head(true)}\n${didLine}${body.slice(0, start).trimEnd()}${gap}${body.slice(body.length - end).trimStart()}`;
}
