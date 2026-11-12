// SPDX-License-Identifier: AGPL-3.0-only
// 词汇线小程序（/apps/vocab/<站>）的后台：发前端页面、存每个人每一站拼对拼错的词、出只读接口给 Vibi。
// Caddy 把 /apps/vocab/* 去掉前缀转到这里。数据在社区同一台 Postgres 的 app_vocab schema 里。要登录。
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { start, caller, allowed, json, fail, list, readBody, community, registerApp } from './_kit/kit.mjs';
import { toProgress, emptyProgress, applyMarks } from './src/lojo/vocab/record.ts';
import { VOCAB } from './src/lojo/route/courses/ielts/vocab.js';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const APP = 'vocab';
const VERSION = fs.readFileSync(path.join(HERE, 'VERSION'), 'utf8').trim();
// 每一站的词（英式拼法，和前端记的一样）。站名给 Vibi 和摘要用。
const STOPS = VOCAB.stops.map(s => ({ id: s.id, name: `${s.id} ${s.topic}`, words: new Set(s.groups.flatMap(g => g.words.map(w => w.w))) }));
const STOP = new Map(STOPS.map(s => [s.id, s]));
const TOTAL = STOPS.reduce((n, s) => n + s.words.size, 0);
const sql = postgres(process.env.DATABASE_URL, { max: 3, idle_timeout: 30, connection: { search_path: 'app_vocab' } });
const REPORT_AFTER_MS = Number(process.env.REPORT_AFTER_MS ?? 3 * 60 * 1000);

// 每个人一行整份记录（前端用）；每答一个词记一行（接口 answers 用，也凑成摘要报给社区）。
async function migrate() {
	await sql`create table if not exists progress (user_id text primary key, value jsonb not null, updated_at timestamptz not null default now())`;
	await sql`create table if not exists answers (id bigserial primary key, user_id text not null, stop text not null, word text not null, "right" boolean not null, at timestamptz not null)`;
	await sql`create index if not exists answers_user_at on answers (user_id, at desc)`;
}

async function readProgress(userId) {
	const [row] = await sql`select value from progress where user_id = ${userId}`;
	return row ? toProgress(row.value) : null;
}

// 这台设备答的词，按顺序放到存着的那份上（record.ts applyMarks，和搬家前前端做的合并一样），另一台设备记的不会被盖掉。
// 不是这条线上的站或词不收。
function cleanMarks(raw) {
	if (!Array.isArray(raw) || raw.length > 500) throw Object.assign(new Error('marks 要是数组，最多 500 个'), { status: 400 });
	const now = Date.now();
	return raw.filter(m => m != null && typeof m === 'object' && STOP.get(m.stop)?.words.has(m.word) && typeof m.right === 'boolean')
		.map(m => ({ stop: m.stop, word: m.word, right: m.right, at: Number.isFinite(m.at) && m.at > 0 && m.at <= now + 60_000 ? Math.floor(m.at) : now }));
}

async function addMarks(userId, marks) {
	return sql.begin(async tx => {
		const [row] = await tx`select value from progress where user_id = ${userId} for update`;
		const merged = applyMarks(row ? toProgress(row.value) : emptyProgress(), marks);
		await tx`insert into progress (user_id, value, updated_at) values (${userId}, ${tx.json(merged)}, now()) on conflict (user_id) do update set value = excluded.value, updated_at = now()`;
		for (const m of marks) await tx`insert into answers (user_id, stop, word, "right", at) values (${userId}, ${m.stop}, ${m.word}, ${m.right}, ${new Date(m.at)})`;
		return merged;
	});
}

// 摘要不能一个词报一行：同一个人停下来 3 分钟后，把这段时间练的合成一行报给社区（Vibi 的「最近练了什么」）。
// 进程重启时还没报的会丢，只丢摘要，练习记录本身已经存好了。
const pending = new Map();
function queueReport(userId, marks, merged) {
	if (marks.length === 0) return;
	const p = pending.get(userId) ?? { stops: new Map(), timer: null };
	for (const m of marks) {
		const s = p.stops.get(m.stop) ?? { right: 0, wrong: 0 };
		if (m.right) s.right++; else s.wrong++;
		p.stops.set(m.stop, s);
	}
	p.merged = merged;
	clearTimeout(p.timer);
	p.timer = setTimeout(() => { pending.delete(userId); sendReport(userId, p); }, REPORT_AFTER_MS);
	pending.set(userId, p);
}

function sendReport(userId, p) {
	let right = 0, total = 0, missed = 0;
	const parts = [];
	for (const [stop, s] of p.stops) {
		right += s.right; total += s.right + s.wrong;
		parts.push(`${STOP.get(stop)?.name ?? stop} ${s.right}/${s.right + s.wrong}`);
		missed += p.merged.stops[stop]?.missed.length ?? 0;
	}
	community('lojo/apps/report', { userId, app: APP, line: {
		what: `词汇线 ${parts.join('，')}`, right, total,
		note: missed > 0 ? `这几站拼错待复习 ${missed} 个` : '这几站没有拼错待复习的词',
		at: new Date().toISOString(),
	} }).catch(e => console.warn('report failed', e.message));
}

const cursorOf = q => { const c = Number(q.get('cursor')); return Number.isSafeInteger(c) && c > 0 ? c : null; };
const limitOf = q => Math.max(1, Math.min(100, Number(q.get('limit')) || 20));
const timeOf = v => { if (v == null) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? undefined : d; };

// 每站一行：几个词、拼对过几个（第一次就对，没看提示）、现在拼错待复习的词、最近一次练的时间。练都没练过的站也列出来。
function summaryOf(prog) {
	return STOPS.map(s => {
		const r = prog?.stops[s.id];
		const learned = (r?.learned ?? []).filter(w => s.words.has(w));
		const missed = (r?.missed ?? []).filter(w => s.words.has(w));
		return { stop: s.id, name: s.name, words: s.words.size, learned: learned.length, missed, lastAt: r?.at ? new Date(r.at).toISOString() : null };
	});
}

async function routes(req, res, url) {
	const p = url.pathname;
	if (p === '/api.json' || p === '/app.json') {
		res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-cache' });
		res.end(fs.readFileSync(path.join(HERE, p.slice(1))));
		return;
	}
	if (!p.startsWith('/api/')) return false;
	const who = await caller(req);
	if (who == null) return fail(res, 401, 'UNAUTHORIZED', '先登录社区');

	if (p === '/api/v1/progress' && req.method === 'GET') {
		if (!allowed(who, APP, 'progress')) return fail(res, 403, 'FORBIDDEN', '没有读词汇线进度的授权');
		const prog = await readProgress(who.userId);
		const items = summaryOf(prog);
		return json(res, 200, { ...list(APP, 'progress', items), summary: { learned: items.reduce((n, s) => n + s.learned, 0), total: TOTAL, missed: items.reduce((n, s) => n + s.missed.length, 0), stopsPractised: items.filter(s => s.lastAt).length }, ...(who.kind === 'user' ? { progress: prog } : {}) });
	}
	if (p === '/api/v1/marks' && req.method === 'POST') {
		if (who.kind !== 'user') return fail(res, 403, 'FORBIDDEN', '只有本人能写');
		const marks = cleanMarks((await readBody(req)).marks);
		const merged = marks.length > 0 ? await addMarks(who.userId, marks) : (await readProgress(who.userId)) ?? emptyProgress();
		queueReport(who.userId, marks, merged);
		return json(res, 200, { progress: merged });
	}
	if (p === '/api/v1/answers' && req.method === 'GET') {
		if (!allowed(who, APP, 'answers')) return fail(res, 403, 'FORBIDDEN', '没有读词汇线记录的授权');
		const q = url.searchParams, since = timeOf(q.get('since')), until = timeOf(q.get('until'));
		if (since === undefined || until === undefined) return fail(res, 400, 'BAD_TIME', 'since/until 要用 ISO 8601');
		const cur = cursorOf(q), lim = limitOf(q);
		const rows = await sql`select id, stop, word, "right", at from answers where user_id = ${who.userId}
			${since ? sql`and at >= ${since}` : sql``} ${until ? sql`and at < ${until}` : sql``} ${cur ? sql`and id < ${cur}` : sql``}
			order by id desc limit ${lim + 1}`;
		const page = rows.slice(0, lim);
		return json(res, 200, list(APP, 'answers', page.map(r => ({ stop: r.stop, stopName: STOP.get(r.stop)?.name ?? r.stop, word: r.word, right: r.right, at: r.at.toISOString() })), rows.length > lim ? String(page.at(-1).id) : null));
	}
	return fail(res, 404, 'NOT_FOUND', '没有这个接口');
}

await migrate();
start({ port: Number(process.env.PORT ?? 8080), root: path.join(HERE, 'dist'), routes });
registerApp({ ...JSON.parse(fs.readFileSync(path.join(HERE, 'app.json'), 'utf8')), version: VERSION, internal: process.env.APP_INTERNAL_URL ?? 'http://vocab:8080/', spec: JSON.parse(fs.readFileSync(path.join(HERE, 'api.json'), 'utf8')) });
