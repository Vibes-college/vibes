// SPDX-License-Identifier: AGPL-3.0-only
// 听写小程序（/apps/dictation/）的后台：发前端页面和课程录音、存每个人的听写进度、出只读接口给 Vibi。
// Caddy 把 /apps/dictation/* 去掉前缀转到这里。数据在社区同一台 Postgres 的 app_dictation schema 里。
// 没登录的人也能练（前端只用浏览器里的记录），所以页面和录音不要登录，/api/ 才要。
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { start, caller, allowed, json, fail, list, readBody, community, registerApp } from './_kit/kit.mjs';
import { toProgress, emptyProgress } from './src/lojo/dictation/logic.ts';
import { DICTATION } from './src/lojo/route/courses/ielts/dictation.js';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const APP = 'dictation';
const VERSION = fs.readFileSync(path.join(HERE, 'VERSION'), 'utf8').trim();
// 每道题属于哪一组；组名给 Vibi 和摘要用。
const SETS = DICTATION.sets.map(s => ({ id: s.id, name: s.zh, ids: s.items.map(it => it.id) }));
const ITEM = new Map(DICTATION.sets.flatMap(s => s.items.map(it => [it.id, { set: s.id, setName: s.zh, word: it.answer[0] }])));
const sql = postgres(process.env.DATABASE_URL, { max: 3, idle_timeout: 30, connection: { search_path: 'app_dictation' } });
const REPORT_AFTER_MS = Number(process.env.REPORT_AFTER_MS ?? 3 * 60 * 1000);

// 每个人一行整份进度（前端用）；每次存进度时，哪道题多对或多错了几次就记一行（接口 answers 用，也凑成摘要报给社区）。
async function migrate() {
	await sql`create table if not exists progress (user_id text primary key, value jsonb not null, updated_at timestamptz not null default now())`;
	await sql`create table if not exists answers (id bigserial primary key, user_id text not null, item text not null, set_id text not null, "right" int not null, wrong int not null, at timestamptz not null)`;
	await sql`create index if not exists answers_user_at on answers (user_id, at desc)`;
}

async function readProgress(userId) {
	const [row] = await sql`select value from progress where user_id = ${userId}`;
	return row ? toProgress(row.value) : null;
}

// 两台设备都练过时不丢：每道题留做得多的那份记录（一样多留后练的那份）。last、音效开关用新送来的。
function merge(before, incoming) {
	const out = { ...incoming, items: { ...before.items } };
	for (const [id, b] of Object.entries(incoming.items)) {
		const a = before.items[id];
		if (a == null || b.r + b.w > a.r + a.w || (b.r + b.w === a.r + a.w && b.at >= a.at)) out.items[id] = b;
	}
	return out;
}

async function writeProgress(userId, incoming) {
	return sql.begin(async tx => {
		const [row] = await tx`select value from progress where user_id = ${userId} for update`;
		const before = row ? toProgress(row.value) : emptyProgress();
		const merged = merge(before, toProgress(incoming));
		await tx`insert into progress (user_id, value, updated_at) values (${userId}, ${tx.json(merged)}, now()) on conflict (user_id) do update set value = excluded.value, updated_at = now()`;
		const fresh = [];
		for (const [id, b] of Object.entries(merged.items)) {
			const info = ITEM.get(id);
			if (info == null) continue;
			const a = before.items[id], right = b.r - (a?.r ?? 0), wrong = b.w - (a?.w ?? 0);
			if (right <= 0 && wrong <= 0) continue;
			const r = Math.max(0, right), w = Math.max(0, wrong);
			await tx`insert into answers (user_id, item, set_id, "right", wrong, at) values (${userId}, ${id}, ${info.set}, ${r}, ${w}, ${new Date(b.at || Date.now())})`;
			fresh.push({ id, set: info.set, right: r, wrong: w });
		}
		return { merged, fresh };
	});
}

// 一题一存，摘要不能一题报一行：同一个人停下来 3 分钟后，把这段时间练的合成一行报给社区（Vibi 的「最近练了什么」）。
// 进程重启时还没报的会丢，只丢摘要，练习记录本身已经存好了。
const pending = new Map();
function queueReport(userId, fresh, merged) {
	if (fresh.length === 0) return;
	const p = pending.get(userId) ?? { sets: new Map(), timer: null };
	for (const f of fresh) {
		const s = p.sets.get(f.set) ?? { right: 0, wrong: 0 };
		s.right += f.right; s.wrong += f.wrong;
		p.sets.set(f.set, s);
	}
	p.merged = merged;
	clearTimeout(p.timer);
	p.timer = setTimeout(() => { pending.delete(userId); sendReport(userId, p); }, REPORT_AFTER_MS);
	pending.set(userId, p);
}

function sendReport(userId, p) {
	let right = 0, total = 0;
	const parts = [];
	for (const [set, s] of p.sets) {
		right += s.right; total += s.right + s.wrong;
		parts.push(`${SETS.find(x => x.id === set)?.name ?? set} ${s.right}/${s.right + s.wrong}`);
	}
	const often = Object.entries(p.merged.items).filter(([id, r]) => r.o && ITEM.has(id)).length;
	community('lojo/apps/report', { userId, app: APP, line: {
		what: `听写 ${parts.join('，')}`, right, total,
		note: often > 0 ? `常错里还有 ${often} 个` : '常错清空了',
		at: new Date().toISOString(),
	} }).catch(e => console.warn('report failed', e.message));
}

const cursorOf = q => { const c = Number(q.get('cursor')); return Number.isSafeInteger(c) && c > 0 ? c : null; };
const limitOf = q => Math.max(1, Math.min(100, Number(q.get('limit')) || 20));
const timeOf = v => { if (v == null) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? undefined : d; };

function summaryOf(prog) {
	return SETS.map(s => {
		let practised = 0, right = 0, wrong = 0, lastAt = 0;
		const often = [];
		for (const id of s.ids) {
			const r = prog?.items[id];
			if (r == null || r.r + r.w === 0) continue;
			practised++; right += r.r; wrong += r.w; lastAt = Math.max(lastAt, r.at);
			if (r.o) often.push(ITEM.get(id).word);
		}
		return { set: s.id, name: s.name, items: s.ids.length, practised, right, wrong, often, lastAt: lastAt ? new Date(lastAt).toISOString() : null };
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
		if (!allowed(who, APP, 'progress')) return fail(res, 403, 'FORBIDDEN', '没有读听写进度的授权');
		const prog = await readProgress(who.userId);
		const items = summaryOf(prog);
		const often = prog ? Object.entries(prog.items).filter(([id, r]) => r.o && ITEM.has(id)).length : 0;
		return json(res, 200, { ...list(APP, 'progress', items), summary: { practised: items.reduce((n, s) => n + s.practised, 0), total: ITEM.size, often }, ...(who.kind === 'user' ? { progress: prog } : {}) });
	}
	if (p === '/api/v1/progress' && req.method === 'PUT') {
		if (who.kind !== 'user') return fail(res, 403, 'FORBIDDEN', '只有本人能写');
		const body = await readBody(req);
		const { merged, fresh } = await writeProgress(who.userId, body.progress);
		queueReport(who.userId, fresh, merged);
		return json(res, 200, { ok: true });
	}
	if (p === '/api/v1/answers' && req.method === 'GET') {
		if (!allowed(who, APP, 'answers')) return fail(res, 403, 'FORBIDDEN', '没有读听写记录的授权');
		const q = url.searchParams, since = timeOf(q.get('since')), until = timeOf(q.get('until'));
		if (since === undefined || until === undefined) return fail(res, 400, 'BAD_TIME', 'since/until 要用 ISO 8601');
		const cur = cursorOf(q), lim = limitOf(q);
		const rows = await sql`select id, item, set_id, "right", wrong, at from answers where user_id = ${who.userId}
			${since ? sql`and at >= ${since}` : sql``} ${until ? sql`and at < ${until}` : sql``} ${cur ? sql`and id < ${cur}` : sql``}
			order by id desc limit ${lim + 1}`;
		const page = rows.slice(0, lim);
		return json(res, 200, list(APP, 'answers', page.map(r => ({ item: r.item, word: ITEM.get(r.item)?.word ?? null, set: r.set_id, setName: SETS.find(s => s.id === r.set_id)?.name ?? r.set_id, right: r.right, wrong: r.wrong, at: r.at.toISOString() })), rows.length > lim ? String(page.at(-1).id) : null));
	}
	return fail(res, 404, 'NOT_FOUND', '没有这个接口');
}

await migrate();
start({ port: Number(process.env.PORT ?? 8080), root: path.join(HERE, 'dist'), routes });
registerApp({ ...JSON.parse(fs.readFileSync(path.join(HERE, 'app.json'), 'utf8')), version: VERSION, internal: process.env.APP_INTERNAL_URL ?? 'http://dictation:8080/', spec: JSON.parse(fs.readFileSync(path.join(HERE, 'api.json'), 'utf8')) });
