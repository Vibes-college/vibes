// SPDX-License-Identifier: AGPL-3.0-only
// Mia on Mastra (community engineering, 2026-11-11). The community sends it a learner's new message(s) for the learners
// switched over (redis key lojoTutor:mastra, see LojoTutorService); it answers one at a time over HTTP and keeps its own
// memory in a separate schema (mia_mastra) of the community's Postgres. Listens only inside the Docker network.
//
// Uses only: message history, working memory (resource scope, delivered as a state signal, not in the system prompt),
// observational memory (Observer and Reflector on deepseek-flash, compression at OM_MESSAGE_TOKENS, activates after
// idle), and tools that call back into the community (lojo/tutor/pilot-tool, shared secret): progress card, chat search,
// wordbook, a level's mistakes, and the four mini app tools (listApps, appSpec, appCall, recentActivity). No vectors (no pgvector, no embeddings), no ee/ features, no workflows.
//
// Every DeepSeek call, Mia's own and the Observer's and Reflector's, goes through one fetch wrapper that pins the model
// to deepseek-flash with thinking off and appends a line to usage.jsonl (cache hit and miss tokens, output, time, role).
//
// Env: DEEPSEEK_API_KEY, PG_URL, COMMUNITY_URL, MASTRA_SECRET (shared with the community's LOJO_TUTOR_MASTRA_SECRET),
//      PORT (default 4330), DATA_DIR (default ./data), OM_MESSAGE_TOKENS (default 20000), OM_REFLECT_TOKENS (default
//      Mastra's 40000), REPLY_TIMEOUT_MS (default 60000: the longest a reply may take, see chat()).
// Every model call also prints one line like the community's: model usage source=mastra.<role> learner=... hit= miss=
// out= ms=, so `docker logs` shows the cache hit rate. Each /chat answer also carries `usage` (hit, miss, out tokens of
// every call for that learner since the last answer), which the community charges to the learner's allowance.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';

process.env.MASTRA_TELEMETRY_DISABLED = '1';

const env = k => {
	const v = process.env[k];
	if (!v) throw new Error(`missing env ${k}`);
	return v;
};
const DATA = process.env.DATA_DIR ?? './data';
fs.mkdirSync(DATA, { recursive: true });
const USAGE = path.join(DATA, 'usage.jsonl');
const MODEL = 'deepseek-flash';
// The longest one reply may take (v0.4.1, 2026-11-13). On 11-12 one DeepSeek call hung for 809 s and, since replies go
// one at a time, every learner after it waited. Now each model call is cut off at this, and so is the whole reply: the
// learner gets a short note instead, and the next learner's reply starts right away.
const REPLY_MS = Number(process.env.REPLY_TIMEOUT_MS ?? 60000);
const TIMEOUT_NOTE = ['我这边刚才卡住了，没来得及回你 😅', '能再发一次吗？这次我马上看。'];
// DeepSeek price page (zh-cn, read 2026-11-11), deepseek-flash, yuan per million tokens, off-peak (00:30–08:30
// Beijing); peak is twice this.
const PRICE = { hit: 0.02, miss: 1, out: 4 };
const offPeak = d => {
	const m = ((d.getUTCHours() + 8) % 24) * 60 + d.getUTCMinutes();
	return m >= 30 && m < 510;
};

// ---- one fetch for everything ----
const realFetch = globalThis.fetch;
let current = { learner: null, turn: null };
// Which learner a model call is for: the reply call and any Observer/Reflector call it sets off, even one that finishes
// after the reply went out. Their tokens are added up per learner and handed back with the next reply (pending), so the
// community can charge the learner's allowance by real cost (2026-11-12).
const als = new AsyncLocalStorage();
const pending = new Map(); // learnerId -> { hit, miss, out, calls, unreported }
const recording = new Set(); // usage still being read from a response
const addUsage = (learner, hit, miss, out, reported) => {
	if (!learner) return;
	const u = pending.get(learner) ?? { hit: 0, miss: 0, out: 0, calls: 0, unreported: 0 };
	u.hit += hit; u.miss += miss; u.out += out; u.calls += 1;
	if (!reported) u.unreported += 1;
	pending.set(learner, u);
};
const roleOf = body => {
	const first = body.messages?.find(m => m.role === 'system');
	const text = typeof first?.content === 'string' ? first.content : JSON.stringify(first?.content ?? '');
	// Her name comes from the community (Vibi since 2026-11-12); the old wording is still recognised.
	if (/You are [^,\n]{1,40}, the AI on Vibes/.test(text.slice(0, 2000)) || text.startsWith('You are Mia') || text.includes('the English tutor on Vibes')) return 'mia';
	if (/reflect/i.test(text.slice(0, 3000))) return 'reflector';
	if (/observ/i.test(text.slice(0, 3000))) return 'observer';
	return 'other';
};
globalThis.fetch = async (input, init = {}) => {
	const url = typeof input === 'string' ? input : input.url;
	if (/posthog/i.test(url)) return new Response('', { status: 204 }); // telemetry is off; this is the backstop
	if (!url.startsWith('https://api.deepseek.com')) return realFetch(input, init);
	const body = JSON.parse(init.body);
	body.model = MODEL;
	body.thinking = { type: 'disabled' };
	if (body.stream) body.stream_options = { include_usage: true };
	const role = roleOf(body);
	// the last request of each kind, to check what goes where in the prompt (test data only)
	fs.writeFileSync(path.join(DATA, `last-${role}.json`), JSON.stringify(body, null, 1));
	const started = Date.now();
	const who = als.getStore()?.learner ?? current.learner;
	// every model call, Observer and Reflector too, gives up after REPLY_MS
	const signal = init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(REPLY_MS)]) : AbortSignal.timeout(REPLY_MS);
	let res;
	try {
		res = await realFetch(input, { ...init, signal, body: JSON.stringify(body) });
	} catch (err) {
		const ms = Date.now() - started;
		fs.appendFileSync(USAGE, JSON.stringify({ at: new Date().toISOString(), role, learner: who, turn: current.turn, status: 'aborted', hit: 0, miss: 0, out: 0, ms, yuan: 0, tools: body.tools?.length ?? 0 }) + '\n');
		console.log(`model usage source=mastra.${role} learner=${who ?? ''} model=${body.model} hit=0 miss=0 out=0 ms=${ms} status=aborted`);
		throw err;
	}
	let done;
	const reading = new Promise(r => { done = r; });
	recording.add(reading);
	const record = usage => {
		const at = new Date();
		const hit = usage?.prompt_cache_hit_tokens ?? 0;
		const miss = usage?.prompt_cache_miss_tokens ?? Math.max(0, (usage?.prompt_tokens ?? 0) - hit);
		const out = usage?.completion_tokens ?? 0;
		const yuan = (hit * PRICE.hit + miss * PRICE.miss + out * PRICE.out) / 1e6 * (offPeak(at) ? 1 : 2);
		const ms = Date.now() - started;
		// a refused call (not ok) is not billed; an ok one whose usage could not be read is "unreported"
		addUsage(who, hit, miss, out, usage != null || !res.ok);
		recording.delete(reading);
		done();
		fs.appendFileSync(USAGE, JSON.stringify({ at: at.toISOString(), role, learner: who, turn: current.turn, status: res.status, hit, miss, out, ms, yuan, tools: body.tools?.length ?? 0 }) + '\n');
		console.log(`model usage source=mastra.${role} learner=${who ?? ''} model=${body.model} hit=${hit} miss=${miss} out=${out} ms=${ms} status=${res.status}`);
	};
	if (!res.ok) {
		record(null);
		return res;
	}
	const copy = res.clone();
	if (body.stream) {
		(async () => {
			const text = await copy.text();
			let usage = null;
			for (const line of text.split('\n')) {
				if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
				try {
					const j = JSON.parse(line.slice(6));
					if (j.usage) usage = j.usage;
				} catch { /* partial line */ }
			}
			record(usage);
		})().catch(() => record(null));
	} else {
		copy.json().then(j => record(j.usage)).catch(() => record(null));
	}
	return res;
};

const { Agent } = await import('@mastra/core/agent');
const { createTool } = await import('@mastra/core/tools');
const { Memory } = await import('@mastra/memory');
const { PostgresStore } = await import('@mastra/pg');
const { createDeepSeek } = await import('@ai-sdk/deepseek');
const { z } = await import('zod');

const deepseek = createDeepSeek({ apiKey: env('DEEPSEEK_API_KEY') });
const model = deepseek(MODEL);

// ---- the community side ----
const COMMUNITY = env('COMMUNITY_URL').replace(/\/$/, '');
const SECRET = env('MASTRA_SECRET');
async function community(tool, params) {
	const res = await realFetch(`${COMMUNITY}/api/lojo/tutor/pilot-tool`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ secret: SECRET, tool, ...params }) });
	if (!res.ok) throw new Error(`pilot-tool ${tool}: ${res.status} ${(await res.text()).slice(0, 200)}`);
	return res.json();
}
const learnerOf = ctx => ctx?.requestContext?.get?.('learnerId') ?? current.learner;

const tools = {
	progress: createTool({
		id: 'progress',
		description: 'Where the learner is on Vibes right now, read from the app: quest map (chapter, levels passed, next level, hearts, streak, last failed level and why), route map gates, wordbook (words saved, due today). Use it whenever they ask about their progress, levels, hearts or words to review.',
		inputSchema: z.object({}),
		execute: async (_input, ctx) => (await community('progress', { learnerId: learnerOf(ctx) })).card,
	}),
	searchChat: createTool({
		id: 'searchChat',
		description: 'Search older messages between you and the learner by keywords (English words or Chinese words). Use it when they ask whether you remember something that is not in the chat above or in what you know about them.',
		inputSchema: z.object({ query: z.string().describe('the words to look for') }),
		execute: async ({ query }, ctx) => {
			const { hits } = await community('searchChat', { learnerId: learnerOf(ctx), query, limit: 5 });
			return hits.length === 0 ? 'Nothing found.' : hits.map(h => `${h.at.slice(0, 10)} ${h.who === 'learner' ? 'they said' : 'you said'}: ${h.text.slice(0, 200)}`).join('\n');
		},
	}),
	wordbook: createTool({
		id: 'wordbook',
		description: 'The learner\'s wordbook: how many words, how many due for review today, and the most recent words with their next review day.',
		inputSchema: z.object({}),
		execute: async (_input, ctx) => community('wordbook', { learnerId: learnerOf(ctx), limit: 5 }),
	}),
	levelMistakes: createTool({
		id: 'levelMistakes',
		description: 'The learner\'s wrong answers on a quest level (their last three tries): the question and why it was wrong, never the right answer. Leave levelId out for the level they last failed.',
		inputSchema: z.object({ levelId: z.string().optional().describe('e.g. 2-3') }),
		execute: async ({ levelId }, ctx) => (await community('levelMistakes', { learnerId: learnerOf(ctx), levelId: levelId ?? null })).mistakes ?? 'No finished tries on that level.',
	}),
	// Mini apps (小程序搬出社区, 2026-11-12): four fixed tools for every mini app, however many there are. The list of
	// tools never changes, so the cached prompt prefix stays the same; what an app can answer is read at run time.
	listApps: createTool({
		id: 'listApps',
		description: 'The mini apps on Vibes (typing, dictation, vocabulary, grammar, wordbook…): what each is, and which kinds of the learner\'s data you may read in it. Call it first when the learner asks about practice done in a mini app.',
		inputSchema: z.object({}),
		execute: async (_input, ctx) => (await community('listApps', { learnerId: learnerOf(ctx) })).apps
			.map(a => `${a.id} (${a.name}, ${a.url}): ${a.summary} | data: ${a.kinds.map(k => `${k.kind}${k.granted ? '' : ' (not allowed)'} = ${k.about}`).join('; ')}`).join('\n'),
	}),
	appSpec: createTool({
		id: 'appSpec',
		description: 'What one mini app can answer: its read paths, the kind of data each returns, and their parameters. Call it before appCall.',
		inputSchema: z.object({ app: z.string().describe('the app id from listApps, e.g. typing') }),
		execute: async ({ app }, ctx) => {
			const r = await community('appSpec', { learnerId: learnerOf(ctx), app });
			if (r.error) return `${r.error.code}: ${r.error.message}`;
			return r.paths.map(p => `${p.path} [${p.kind}${p.granted ? '' : ', not allowed'}]${p.params.length ? ` params: ${p.params.join(', ')}` : ''} — ${p.summary}`).join('\n');
		},
	}),
	appCall: createTool({
		id: 'appCall',
		description: 'Read the learner\'s data from a mini app: one path from appSpec, with its parameters. Answers JSON, or an error code with what went wrong.',
		inputSchema: z.object({
			app: z.string().describe('the app id, e.g. typing'),
			path: z.string().describe('a path from appSpec, e.g. progress'),
			params: z.record(z.string()).optional().describe('query parameters, e.g. {"limit":"5"}'),
		}),
		execute: async ({ app, path, params }, ctx) => JSON.stringify(await community('appCall', { learnerId: learnerOf(ctx), app, path, params: params ?? {} })),
	}),
	recentActivity: createTool({
		id: 'recentActivity',
		description: 'One line per practice set the learner finished in any mini app over the last days, newest first (app, what, score, note, when). Use it for "how was my week" or "what did I practise lately".',
		inputSchema: z.object({ days: z.number().int().min(1).max(60).optional().describe('how many days back, default 7'), app: z.string().optional().describe('only this app') }),
		execute: async ({ days, app }, ctx) => {
			const { lines } = await community('recentActivity', { learnerId: learnerOf(ctx), days: days ?? 7, app: app ?? null, limit: 5 });
			return lines.length === 0 ? 'Nothing in those days.' : lines.map(l => `${l.at.slice(0, 16).replace('T', ' ')} ${l.app} · ${l.what}${l.total != null ? ` ${l.right}/${l.total}` : ''}${l.note ? ` · ${l.note}` : ''}`).join('\n');
		},
	}),
};

// ---- memory: separate schema, no vectors ----
const storage = new PostgresStore({ id: 'mia-mastra', connectionString: env('PG_URL'), schemaName: 'mia_mastra' });
// 20,000 tokens of chat (about 50 exchanges, a long evening) stay word for word before the Observer's notes replace
// them. Cached tokens cost 1/50 of new ones, so carrying them is cheap, and fewer, larger compressions break the cache
// less often (measured 11-11/12, see CHANGELOG v0.3.0). 7,000 compressed every ~17 exchanges.
const OM_TOKENS = Number(process.env.OM_MESSAGE_TOKENS ?? 20000);
// Reflector: Mastra's default is 40000 tokens of observations; OM_REFLECT_TOKENS lowers it for short tests only.
const REFLECT_TOKENS = process.env.OM_REFLECT_TOKENS ? Number(process.env.OM_REFLECT_TOKENS) : undefined;
const memory = new Memory({
	storage,
	options: {
		workingMemory: {
			enabled: true,
			scope: 'resource',
			useStateSignals: true,
			template: '# About the learner\n- Name:\n- Goal (exam, date, target score; only the current ones):\n- Strengths and weak spots:\n- Interests:\n- Study routine:\n- Things they asked you to remember:\n- Things they asked you to forget (only say that something was forgotten; never the thing itself):\n',
		},
		observationalMemory: {
			model, // Observer and Reflector both on deepseek-flash
			activateAfterIdle: '5m',
			observation: { messageTokens: OM_TOKENS },
			...(REFLECT_TOKENS ? { reflection: { observationTokens: REFLECT_TOKENS } } : {}),
		},
	},
});

// ---- Mia: the fixed prompt (word for word from the community) and the tool rules, the same for every learner ----
const TOOL_RULES = [
	'',
	'Tools: progress, wordbook and levelMistakes read the app; searchChat finds older messages with this learner. Use them only when the question needs them; never say you cannot see their progress before trying progress.',
	'Your notes about the learner are your working memory (setWorkingMemory). In the same turn, before you answer, save anything lasting they tell you: their goal, exam, exam date, target score, scores, weak spots, interests, job, study routine, and anything they ask you to remember. When they ask you to forget something, remove it and only note that something was forgotten.',
	'When something changes (a new exam date, a new target score), replace the old value in your working memory; do not keep it. Never present an old value as current; if they ask what it used to be, you may say it was changed.',
	'Each learner message starts with a line in square brackets from the app (the time now, their name on Vibes, sometimes a quest level they asked about). It is not written by the learner; never quote it.',
	'Reply with the JSON object only, no other text.',
].join('\n');

// The card can change in the admin panel; it is read again at most every 10 minutes. Nothing personal is in it (the
// name and the time go into the learner's message), so all learners share the same start of the request.
let fixed = { text: null, at: 0 };
async function instructions() {
	if (fixed.text == null || Date.now() - fixed.at > 10 * 60 * 1000) {
		try {
			const { system } = await community('prompt', { learnerId: current.learner });
			fixed = { text: system + '\n' + TOOL_RULES, at: Date.now() };
		} catch (err) {
			if (fixed.text == null) throw err;
			fixed.at = Date.now(); // keep the last one while the community restarts
		}
	}
	return fixed.text;
}
const agent = new Agent({ id: 'mia', name: 'Mia', instructions: () => instructions(), model, tools, memory });

function parseReply(text) {
	const m = text.match(/\{[\s\S]*\}/);
	if (m) {
		try {
			const j = JSON.parse(m[0]);
			if (Array.isArray(j.messages)) return { messages: j.messages.map(String).filter(s => s.trim()), voice: !!j.voice, json: true };
		} catch { /* fall through */ }
	}
	// Broken JSON (11-12: `{"messages": ["…", "…", "voice": false}`): never show it raw. Take the string values (a string
	// not followed by a colon) after "messages"; the keys and true/false are dropped.
	const at = text.search(/"messages"\s*:/);
	if (at !== -1) {
		const values = [...text.slice(at).matchAll(/"((?:[^"\\]|\\.)*)"(\s*:)?/g)].filter(x => !x[2]).map(x => {
			try { return JSON.parse(`"${x[1]}"`); } catch { return x[1]; }
		}).filter(v => v.trim());
		if (values.length > 0) return { messages: values, voice: /"voice"\s*:\s*true/.test(text), json: false, repaired: true };
	}
	return { messages: [text.trim()].filter(Boolean), voice: false, json: false };
}

let queue = Promise.resolve();
// turns: what happened in the chat since Mia last answered here, oldest first: the learner's messages, and messages she
// sent from the community's own path (a daily check-in, an answer on a failed level), so this memory has them too.
// The time, the name and an optional quest note go into a bracket line on the last learner message: everything before
// it (fixed prompt, tools, earlier chat) stays the same from call to call and is read from the cache.
async function chat({ learnerId, text, turns, now, name, extra }) {
	current = { learner: learnerId, turn: Date.now() };
	if (now == null || name == null) ({ now, name } = await community('prompt', { learnerId }));
	const list = (Array.isArray(turns) && turns.length > 0 ? turns : [{ role: 'user', content: String(text ?? '') }])
		.filter(t => (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string' && t.content.trim() !== '')
		.map(t => ({ role: t.role, content: t.content }));
	const last = list.findLastIndex(t => t.role === 'user');
	if (last === -1) throw new Error('no learner message');
	list[last] = { role: 'user', content: `[${now} · name on Vibes: ${name}${extra ? ` · ${extra}` : ''}]\n${list[last].content}` };
	const started = Date.now();
	// The whole reply (all its steps and tool calls) stops at REPLY_MS; the learner gets TIMEOUT_NOTE and the queue moves on.
	const stop = new AbortController();
	let timer;
	const late = new Promise(resolve => { timer = setTimeout(() => { stop.abort(); resolve(null); }, REPLY_MS); });
	const run = als.run({ learner: learnerId }, () => agent.generate(list, {
		memory: { thread: `mia-${learnerId}`, resource: learnerId },
		maxSteps: 4,
		modelSettings: { temperature: 0.8, maxOutputTokens: 900 },
		abortSignal: stop.signal,
	}));
	const result = await Promise.race([run.catch(err => (stop.signal.aborted ? null : Promise.reject(err))), late]).finally(() => clearTimeout(timer));
	if (result == null || stop.signal.aborted) {
		run.catch(() => null);
		console.log(`reply timed out learner=${learnerId} ms=${Date.now() - started}`);
		const usage = pending.get(learnerId) ?? { hit: 0, miss: 0, out: 0, calls: 0, unreported: 0 };
		pending.delete(learnerId);
		return { messages: TIMEOUT_NOTE, voice: false, json: false, timedOut: true, usage, ms: Date.now() - started, steps: null, toolCalls: [] };
	}
	// the last call's usage is read from its response just after generate returns; wait for it (at most 3 s)
	await Promise.race([Promise.all([...recording]), new Promise(r => setTimeout(r, 3000))]);
	// every DeepSeek call for this learner since the last reply: this reply's, and Observer/Reflector calls that
	// finished after the previous reply went out. unreported: calls whose usage could not be read.
	const usage = pending.get(learnerId) ?? { hit: 0, miss: 0, out: 0, calls: 0, unreported: 0 };
	pending.delete(learnerId);
	return { ...parseReply(result.text ?? ''), usage, ms: Date.now() - started, steps: result.steps?.length ?? null, toolCalls: (result.steps ?? []).flatMap(s => (s.toolCalls ?? []).map(c => c.toolName ?? c.payload?.toolName)) };
}

async function notes(learnerId) {
	const wm = await memory.getWorkingMemory({ threadId: `mia-${learnerId}`, resourceId: learnerId }).catch(err => `error: ${err.message}`);
	return { workingMemory: wm };
}

// ---- moving the community's old notes (registry: profile, facts, summary) into working memory ----
// Repeatable: a learner who already has working memory here is skipped unless force; the old notes are only read.
const { default: pg } = await import('pg');
const db = new pg.Pool({ connectionString: env('PG_URL'), max: 2 });
const line = (label, ...parts) => `- ${label}: ${parts.filter(x => x != null && String(x).trim() !== '').join('; ')}`;
function notesMarkdown(name, m) {
	const p = m.profile ?? {};
	const list = x => (Array.isArray(x) ? x.join(', ') : x);
	const out = [
		'# About the learner',
		line('Name', name),
		line('Goal (exam, date, target score; only the current ones)', p.goal, p.exam, p.examDate && `exam date ${p.examDate}`, p.targetScore && `target ${p.targetScore}`),
		line('Strengths and weak spots', p.level && `level about ${p.level}`, p.weakPoints && `weak: ${list(p.weakPoints)}`),
		line('Interests', list(p.interests)),
		line('Study routine', p.routine),
		line('Preferences', p.preferences),
		'- Things they asked you to remember:',
		'- Things they asked you to forget (only say that something was forgotten; never the thing itself):',
	];
	const facts = (m.facts ?? []).map(f => f?.text).filter(Boolean);
	if (facts.length > 0) out.push(`- Earlier notes (from your old notes, ${String(m.updatedAt ?? '').slice(0, 10) || 'before the move'}):`, ...facts.map(t => `  - ${t}`));
	if (m.summary) out.push(`- Earlier chats in short: ${m.summary}`);
	return out.join('\n') + '\n';
}
async function migrate({ tutorId, learnerId, force, dryRun }) {
	if (typeof tutorId !== 'string' || !/^[0-9a-z]{8,32}$/.test(tutorId)) throw new Error('tutorId needed');
	const { rows } = await db.query(
		`SELECT r."userId" AS id, r.value, u.name, u.username FROM registry_item r JOIN "user" u ON u.id = r."userId"
		 WHERE r.key = $1 AND r.scope = ARRAY['lojo','tutor']::varchar[] AND r.domain IS NULL ${learnerId ? 'AND r."userId" = $2' : ''}`,
		learnerId ? [tutorId, learnerId] : [tutorId]);
	const done = { moved: 0, skipped: 0, empty: 0, ids: [] };
	for (const r of rows) {
		const m = r.value ?? {};
		if (!m.summary && !(m.facts ?? []).length && Object.keys(m.profile ?? {}).length === 0) { done.empty++; continue; }
		const existing = await memory.getWorkingMemory({ threadId: `mia-${r.id}`, resourceId: r.id }).catch(() => null);
		if (existing && existing.trim() !== '' && !force) { done.skipped++; continue; }
		if (!dryRun) await memory.updateWorkingMemory({ threadId: `mia-${r.id}`, resourceId: r.id, workingMemory: notesMarkdown(r.name ?? r.username, m) });
		done.moved++;
		done.ids.push(r.id);
	}
	return done;
}

const readJson = req => new Promise((resolve, reject) => {
	let b = '';
	req.on('data', c => { b += c; });
	req.on('end', () => {
		try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); }
	});
});
http.createServer(async (req, res) => {
	const send = (code, obj) => {
		res.writeHead(code, { 'content-type': 'application/json' });
		res.end(JSON.stringify(obj));
	};
	try {
		if (req.method === 'GET' && req.url === '/health') return send(200, { ok: true });
		const body = req.method === 'POST' ? await readJson(req) : {};
		if (req.method === 'POST' && body.secret !== SECRET) return send(403, { error: 'forbidden' });
		if (req.url === '/chat') {
			// one reply at a time per process, so usage lines belong to the right learner and turn
			const p = queue.then(() => chat(body));
			queue = p.catch(() => null);
			return send(200, await p);
		}
		if (req.url === '/notes') return send(200, await notes(body.learnerId));
		if (req.url === '/migrate') return send(200, await migrate(body));
		send(404, { error: 'not found' });
	} catch (err) {
		console.error(err);
		send(500, { error: String(err?.message ?? err).slice(0, 500) });
	}
}).listen(Number(process.env.PORT ?? 4330), () => console.log(`mia-mastra on ${process.env.PORT ?? 4330}`));
