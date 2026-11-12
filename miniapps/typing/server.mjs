// SPDX-License-Identifier: AGPL-3.0-only
// 机考打字小程序（/apps/typing/）的后台：发前端页面、存每个人的打字进度、按设计稿 9.1 出只读接口。
// Caddy 把 /apps/typing/* 去掉前缀转到这里。数据在社区同一台 Postgres 的 app_typing schema 里。
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { start, caller, allowed, json, fail, list, readBody, community, registerApp } from './_kit/kit.mjs';
import { mergeProgress, toProgress, emptyProgress, passedIds } from './src/lojo/typing/record.ts';
import { TYPING } from './src/lojo/route/courses/ielts/typing.js';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const APP = 'typing';
const VERSION = fs.readFileSync(path.join(HERE, 'VERSION'), 'utf8').trim();
const STOPS = TYPING.stops.map((s, i) => ({ id: s.id, n: i + 1, name: s.zh }));
const IDS = STOPS.map(s => s.id);
const sql = postgres(process.env.DATABASE_URL, { max: 3, idle_timeout: 30, connection: { search_path: 'app_typing' } });

// 每个人一行：整份进度（前端合并用）；每次打完一站另记一行（接口 tries 用，也往社区报一行摘要）。
async function migrate() {
	await sql`create table if not exists progress (user_id text primary key, value jsonb not null, updated_at timestamptz not null default now())`;
	await sql`create table if not exists tries (id bigserial primary key, user_id text not null, stop text not null, passed boolean not null, at timestamptz not null, best jsonb)`;
	await sql`create index if not exists tries_user_at on tries (user_id, at desc)`;
}

async function readProgress(userId) {
	const [row] = await sql`select value from progress where user_id = ${userId}`;
	return row ? toProgress(row.value) : null;
}

// 新进度和存着的合并（不会丢别的设备打的）；哪几站的次数多了，就各记一行、往社区摘要索引报一行。
async function writeProgress(userId, incoming) {
	return sql.begin(async tx => {
		const [row] = await tx`select value from progress where user_id = ${userId} for update`;
		const before = row ? toProgress(row.value) : emptyProgress();
		const merged = mergeProgress(before, toProgress(incoming), IDS);
		await tx`insert into progress (user_id, value, updated_at) values (${userId}, ${tx.json(merged)}, now()) on conflict (user_id) do update set value = excluded.value, updated_at = now()`;
		const fresh = [];
		for (const s of STOPS) {
			const a = before.stops[s.id], b = merged.stops[s.id];
			if (b == null || (b.tries ?? 0) <= (a?.tries ?? 0)) continue;
			const passed = (b.passedAt ?? 0) > 0;
			await tx`insert into tries (user_id, stop, passed, at, best) values (${userId}, ${s.id}, ${passed}, ${new Date(b.at || Date.now())}, ${b.best ? tx.json(b.best) : null})`;
			fresh.push({ s, b, passed, newTries: b.tries - (a?.tries ?? 0) });
		}
		return { merged, fresh };
	});
}

function report(userId, fresh, merged) {
	for (const { s, b, passed, newTries } of fresh) {
		const score = b.best?.score != null && b.best?.total != null ? `${b.best.score}/${b.best.total}` : null;
		community('lojo/apps/report', { userId, app: APP, line: {
			what: `第 ${s.n} 站 ${s.name}`,
			right: b.best?.score ?? null, total: b.best?.total ?? null,
			note: `${passed ? '已过关' : '还没过'}${score ? `，最好 ${score}` : ''}${newTries > 1 ? `，这次记了 ${newTries} 次` : ''}；整条线过了 ${passedIds(merged, IDS).length}/${IDS.length} 站`,
			at: new Date(b.at || Date.now()).toISOString(),
		} }).catch(e => console.warn('report failed', e.message));
	}
}

// 分页：cursor 就是上一页最后一行的 id。
const cursorOf = q => { const c = Number(q.get('cursor')); return Number.isSafeInteger(c) && c > 0 ? c : null; };
const limitOf = q => Math.max(1, Math.min(100, Number(q.get('limit')) || 20));
const timeOf = v => { if (v == null) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? undefined : d; };

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
		if (!allowed(who, APP, 'progress')) return fail(res, 403, 'FORBIDDEN', '没有读打字进度的授权');
		const prog = await readProgress(who.userId);
		const items = STOPS.map(s => { const r = prog?.stops[s.id]; return { stop: s.id, n: s.n, name: s.name, tries: r?.tries ?? 0, passed: (r?.passedAt ?? 0) > 0, passedAt: r?.passedAt ? new Date(r.passedAt).toISOString() : null, passedOn: r?.passedOn ?? null, best: r?.best ?? null, lastAt: r?.at ? new Date(r.at).toISOString() : null }; });
		return json(res, 200, { ...list(APP, 'progress', items), summary: { passed: prog ? passedIds(prog, IDS).length : 0, total: IDS.length, practiceMinutes: Math.round((prog?.practiceMs ?? 0) / 60000), finishedAt: prog?.finishedAt ? new Date(prog.finishedAt).toISOString() : null }, ...(who.kind === 'user' ? { progress: prog } : {}) });
	}
	if (p === '/api/v1/progress' && req.method === 'PUT') {
		if (who.kind !== 'user') return fail(res, 403, 'FORBIDDEN', '只有本人能写');
		const body = await readBody(req);
		const { merged, fresh } = await writeProgress(who.userId, body.progress);
		report(who.userId, fresh, merged);
		return json(res, 200, { progress: merged });
	}
	if (p === '/api/v1/tries' && req.method === 'GET') {
		if (!allowed(who, APP, 'tries')) return fail(res, 403, 'FORBIDDEN', '没有读打字记录的授权');
		const q = url.searchParams, since = timeOf(q.get('since')), until = timeOf(q.get('until'));
		if (since === undefined || until === undefined) return fail(res, 400, 'BAD_TIME', 'since/until 要用 ISO 8601');
		const cur = cursorOf(q), lim = limitOf(q);
		const rows = await sql`select id, stop, passed, at, best from tries where user_id = ${who.userId}
			${since ? sql`and at >= ${since}` : sql``} ${until ? sql`and at < ${until}` : sql``} ${cur ? sql`and id < ${cur}` : sql``}
			order by id desc limit ${lim + 1}`;
		const page = rows.slice(0, lim);
		const name = Object.fromEntries(STOPS.map(s => [s.id, s]));
		return json(res, 200, list(APP, 'tries', page.map(r => ({ stop: r.stop, n: name[r.stop]?.n ?? null, name: name[r.stop]?.name ?? r.stop, passed: r.passed, at: r.at.toISOString(), best: r.best })), rows.length > lim ? String(page.at(-1).id) : null));
	}
	return fail(res, 404, 'NOT_FOUND', '没有这个接口');
}

await migrate();
start({ port: Number(process.env.PORT ?? 8080), root: path.join(HERE, 'dist'), routes });
registerApp({ ...JSON.parse(fs.readFileSync(path.join(HERE, 'app.json'), 'utf8')), version: VERSION, internal: process.env.APP_INTERNAL_URL ?? 'http://typing:8080/', spec: JSON.parse(fs.readFileSync(path.join(HERE, 'api.json'), 'utf8')) });
