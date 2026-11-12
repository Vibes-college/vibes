// SPDX-License-Identifier: AGPL-3.0-only
// 生词本小程序（/apps/wordbook/）的后台：发前端页面，存每个人的生词、两张复习卡（认得、拼写）和每次复习，出接口。
// 规则（每天 10 个新词、FSRS 排期、连续天数）在 src/lib/lojo-words.ts，跟社区原来那份一样。
// 数据在社区同一台 Postgres 的 app_wordbook schema 里，表和列跟社区原来的 lojo_word* 一样，搬过来 id 不变。
// 谁能写：本人（带社区登录）；或者服务器之间（社区、听写、词汇、拍照学词）带口令、带 wordbook:write，而且只能写
// x-vibes-user 那一个人的词。导入、删词、复习只收本人和社区。Vibi 只有读的授权，写不了。
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { start, caller, allowed, json, fail, list, readBody, community, registerApp } from './_kit/kit.mjs';
import { CARD_KINDS, LEARN_AHEAD_MS, MAX_WORDS, NEW_WORDS_PER_DAY, QUEUE_MAX, WORD_KINDS, WORD_SOURCES, dayEnd, dayOf, dayStart, newCard, newLeft, preview, review, stateName, streak, validKey, wordKey } from './src/lib/lojo-words.ts';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const APP = 'wordbook';
const VERSION = fs.readFileSync(path.join(HERE, 'VERSION'), 'utf8').trim();
const sql = postgres(process.env.DATABASE_URL, { max: 4, idle_timeout: 30, connection: { search_path: 'app_wordbook' } });

// 谁能从服务器那边写：加词收这几个小程序和社区（社区替帖子讲解、闯关错题转来）；别的写法只收社区。
const ADD_CALLERS = ['community', 'dictation', 'vocab', 'photo-words'];
const OTHER_WRITE_CALLERS = ['community'];

async function migrate() {
	await sql`create table if not exists word (
		id varchar(32) primary key, "userId" varchar(32) not null, key varchar(256) not null, text varchar(256) not null,
		kind varchar(16) not null, meaning varchar(1024) not null default '', usage varchar(2048) not null default '',
		example varchar(1024) not null default '', "exampleZh" varchar(1024) not null default '', source varchar(16) not null,
		"noteId" varchar(32), "createdAt" timestamptz not null)`;
	await sql`create unique index if not exists word_user_key on word ("userId", key)`;
	await sql`create index if not exists word_user_created on word ("userId", "createdAt" desc, id desc)`;
	await sql`create table if not exists card (
		id varchar(32) primary key, "wordId" varchar(32) not null references word(id) on delete cascade, "userId" varchar(32) not null,
		kind varchar(16) not null, due timestamptz not null, stability double precision not null, difficulty double precision not null,
		"elapsedDays" integer not null, "scheduledDays" integer not null, "learningSteps" integer not null, reps integer not null,
		lapses integer not null, state smallint not null, "lastReview" timestamptz)`;
	await sql`create index if not exists card_user_due on card ("userId", due)`;
	await sql`create unique index if not exists card_word_kind on card ("wordId", kind)`;
	await sql`create table if not exists review (
		id varchar(32) primary key, "cardId" varchar(32) not null references card(id) on delete cascade, "userId" varchar(32) not null,
		rating smallint not null, state smallint not null, due timestamptz not null, stability double precision not null,
		difficulty double precision not null, "elapsedDays" integer not null, "lastElapsedDays" integer not null,
		"scheduledDays" integer not null, "learningSteps" integer not null, "reviewedAt" timestamptz not null, "durationMs" integer)`;
	await sql`create index if not exists review_card on review ("cardId")`;
	await sql`create index if not exists review_user_at on review ("userId", "reviewedAt")`;
}

// —— id：跟社区一样的 aidx（8 位时间 + 4 位本机 + 4 位计数，共 16 位 0-9a-z），搬过来的旧 id 和新 id 能混排 ——
const TIME2000 = 946684800000;
const NODE = Array.from({ length: 4 }, () => '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 36)]).join('');
let counter = 0;
const genId = t => { counter++; return Math.max(0, t - TIME2000).toString(36).padStart(8, '0').slice(-8) + NODE + counter.toString(36).padStart(4, '0').slice(-4); };

// —— 打包成社区原来接口的样子（前端照旧用）——
const iso = d => (d == null ? null : new Date(d).toISOString());
const packCard = c => ({ id: c.id, wordId: c.wordId, kind: c.kind, state: stateName(c.state), due: iso(c.due), reps: c.reps, lapses: c.lapses, lastReview: iso(c.lastReview) });
function pack(w, cards) {
	const recognize = cards.find(x => x.kind === 'recognize'), spell = cards.find(x => x.kind === 'spell');
	if (recognize == null || spell == null) return null;
	return { id: w.id, text: w.text, kind: w.kind, meaning: w.meaning, usage: w.usage, example: w.example, exampleZh: w.exampleZh, source: w.source, noteId: w.noteId, createdAt: iso(w.createdAt), recognize: packCard(recognize), spell: packCard(spell) };
}
async function packMany(words, db = sql) {
	if (words.length === 0) return new Map();
	const cards = await db`select * from card where "wordId" in ${db(words.map(w => w.id))}`;
	const by = new Map();
	for (const c of cards) by.set(c.wordId, [...(by.get(c.wordId) ?? []), c]);
	const out = new Map();
	for (const w of words) { const p = pack(w, by.get(w.id) ?? []); if (p) out.set(w.id, p); }
	return out;
}
const columnsOf = c => ({ due: c.due, stability: c.stability, difficulty: c.difficulty, elapsedDays: c.elapsedDays, scheduledDays: c.scheduledDays, learningSteps: c.learningSteps, reps: c.reps, lapses: c.lapses, state: c.state, lastReview: c.lastReview });

// —— 读 ——
async function listWords(userId, limit, cursor) {
	const cur = cursor ? /^(\d{13})-([0-9a-z]{6,32})$/.exec(cursor) : null;
	const rows = await sql`select * from word where "userId" = ${userId}
		${cur ? sql`and ("createdAt", id) < (${new Date(Number(cur[1]))}, ${cur[2]})` : sql``}
		order by "createdAt" desc, id desc limit ${limit + 1}`;
	const page = rows.slice(0, limit);
	const packed = await packMany(page);
	const last = page.at(-1);
	return { items: page.flatMap(w => packed.get(w.id) ?? []), next: rows.length > limit && last ? `${new Date(last.createdAt).getTime()}-${last.id}` : null };
}

// 今天要复习的（和社区原来一样的顺序）：1 到期的老卡；2 认得卡看过了的词的拼写卡；3 新词，新的在前，到今天的额度为止；
// 4 其余都做完后，20 分钟内到步的学习卡。
async function today(userId, tzOffset, now = new Date()) {
	const start = dayStart(now, tzOffset), end = dayEnd(now, tzOffset), ahead = new Date(now.getTime() + LEARN_AHEAD_MS);
	const [seen, spellNew, [{ n: introduced }], unseen, [{ n: reviewedToday }], days, [{ n: total }], [later]] = await Promise.all([
		sql`select * from card where "userId" = ${userId} and ((state = 2 and due < ${end}) or (state in (1, 3) and due <= ${ahead})) order by due asc`,
		sql`select c.* from card c join card r on r."wordId" = c."wordId" and r.kind = 'recognize'
			where c."userId" = ${userId} and c.kind = 'spell' and c.state = 0 and r.state <> 0 order by r."lastReview" asc limit ${QUEUE_MAX}`,
		sql`select count(*)::int n from review v join card c on c.id = v."cardId" where v."userId" = ${userId} and v."reviewedAt" >= ${start} and v.state = 0 and c.kind = 'recognize'`,
		sql`select c.* from card c join word w on w.id = c."wordId" where c."userId" = ${userId} and c.kind = 'recognize' and c.state = 0 order by w."createdAt" desc limit ${NEW_WORDS_PER_DAY}`,
		sql`select count(*)::int n from review where "userId" = ${userId} and "reviewedAt" >= ${start}`,
		sql`select distinct to_char(("reviewedAt" at time zone 'UTC') - make_interval(mins => ${tzOffset}), 'YYYY-MM-DD') as day from review where "userId" = ${userId} and "reviewedAt" > ${new Date(now.getTime() - 400 * 86400000)}`,
		sql`select count(*)::int n from word where "userId" = ${userId}`,
		sql`select min(due) due from card where "userId" = ${userId} and state in (1, 3) and due > ${ahead}`,
	]);
	const fresh = unseen.slice(0, newLeft(introduced));
	const dueNow = seen.filter(c => c.state === 2 || c.due <= now);
	const soon = seen.filter(c => !(c.state === 2 || c.due <= now));
	const ordered = [...dueNow, ...spellNew, ...fresh, ...soon].slice(0, QUEUE_MAX);
	const wordIds = [...new Set(ordered.map(c => c.wordId))];
	const words = wordIds.length > 0 ? await sql`select * from word where id in ${sql(wordIds)}` : [];
	const packed = await packMany(words);
	const due = { recognize: 0, spell: 0 };
	for (const c of [...dueNow, ...spellNew]) due[c.kind]++;
	const next = c => { const p = preview(columnsOf(c), now, tzOffset); return { again: iso(p.again), hard: iso(p.hard), good: iso(p.good), easy: iso(p.easy) }; };
	return {
		queue: ordered.flatMap(c => { const word = packed.get(c.wordId); return word ? [{ word, card: packCard(c), first: c.state === 0, next: next(c) }] : []; }),
		recognizeDue: due.recognize, spellDue: due.spell, newLeft: fresh.length, newPerDay: NEW_WORDS_PER_DAY, reviewedToday,
		streak: streak(days.map(d => d.day), dayOf(now, tzOffset)), total, later: later?.due ? iso(later.due) : null,
	};
}

async function lastAt(userId) {
	const [r] = await sql`select greatest((select max("reviewedAt") from review where "userId" = ${userId}), (select max("createdAt") from word where "userId" = ${userId})) at`;
	return iso(r?.at);
}

// 闯关和 Vibi 用的几个数：总词数、现在要复习几张、今天复习了几张、连续几天、最近一次动它的时间；
// 闯关另外问「某时间前到期的卡有几张」（判断生词本够不够补心）和「某段时间里复习了几张」（补心核对）。
async function stats(userId, q) {
	const tz = intOf(q.get('tzOffset'), -840, 840) ?? -480;
	const t = await today(userId, tz);
	const out = { words: t.total, dueNow: t.recognizeDue + t.spellDue, newLeft: t.newLeft, reviewedToday: t.reviewedToday, streak: t.streak, lastAt: await lastAt(userId) };
	const dueBefore = timeOf(q.get('dueBefore')), from = timeOf(q.get('reviewsFrom')), to = timeOf(q.get('reviewsTo'));
	if (dueBefore) out.dueBefore = (await sql`select count(*)::int n from card where "userId" = ${userId} and due < ${dueBefore}`)[0].n;
	if (from && to) out.reviewsBetween = (await sql`select count(*)::int n from review where "userId" = ${userId} and "reviewedAt" >= ${from} and "reviewedAt" <= ${to}`)[0].n;
	return out;
}

// —— 写 ——
class AppError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
const KINDS = new Set(WORD_KINDS), SOURCES = new Set(WORD_SOURCES);
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
function cleanItem(it) {
	if (it == null || typeof it !== 'object' || typeof it.text !== 'string') throw new AppError(400, 'INVALID_WORD', '词不对');
	return { text: it.text.trim().slice(0, 256), kind: KINDS.has(it.kind) ? it.kind : 'word', meaning: str(it.meaning, 1024), usage: str(it.usage, 2048), example: str(it.example, 1024), exampleZh: str(it.exampleZh, 1024) };
}
const sourceOf = s => { if (!SOURCES.has(s)) throw new AppError(400, 'INVALID_SOURCE', `source 只能是 ${WORD_SOURCES.join(' / ')}`); return s; };
const noteOf = v => (v == null ? null : /^[0-9a-z]{6,32}$/.test(String(v)) ? String(v) : null);

async function insert(tx, userId, key, item, source, noteId, createdAt, now) {
	const word = { id: genId(createdAt.getTime()), userId, key, text: item.text, kind: item.kind, meaning: item.meaning, usage: item.usage ?? '', example: item.example ?? '', exampleZh: item.exampleZh ?? '', source, noteId, createdAt };
	await tx`insert into word ${tx(word)}`;
	const cards = CARD_KINDS.map(kind => ({ id: genId(now.getTime()), wordId: word.id, userId, kind, ...newCard(now) }));
	await tx`insert into card ${tx(cards)}`;
	return pack(word, cards);
}

async function addWord(userId, item, source, noteId) {
	const key = wordKey(item.text);
	if (!validKey(key)) throw new AppError(400, 'INVALID_WORD', '词是空的或太长');
	const [have] = await sql`select * from word where "userId" = ${userId} and key = ${key}`;
	if (have) return { created: false, word: (await packMany([have])).get(have.id) };
	if ((await sql`select count(*)::int n from word where "userId" = ${userId}`)[0].n >= MAX_WORDS) throw new AppError(400, 'TOO_MANY_WORDS', `生词本最多 ${MAX_WORDS} 个`);
	const now = new Date();
	try {
		return { created: true, word: await sql.begin(tx => insert(tx, userId, key, item, source, noteId, now, now)) };
	} catch (e) {
		if (e.code !== '23505') throw e; // 同一个词同时存了两次
		const [w] = await sql`select * from word where "userId" = ${userId} and key = ${key}`;
		return { created: false, word: (await packMany([w])).get(w.id) };
	}
}

async function importWords(userId, entries) {
	const have = new Set((await sql`select key from word where "userId" = ${userId}`).map(w => w.key));
	let room = MAX_WORDS - have.size, added = 0;
	const now = new Date();
	for (const e of entries.slice(0, MAX_WORDS)) {
		let item; try { item = cleanItem(e?.item); } catch { continue; }
		const key = wordKey(item.text);
		if (!validKey(key) || have.has(key) || !SOURCES.has(e.source)) continue;
		if (room <= 0) break;
		have.add(key);
		const addedAt = Number.isFinite(e.addedAt) ? Math.max(0, Math.min(e.addedAt, now.getTime())) : now.getTime();
		try { await sql.begin(tx => insert(tx, userId, key, item, e.source, noteOf(e.noteId), new Date(addedAt), now)); added++; room--; } catch (err) { if (err.code !== '23505') throw err; }
	}
	return { added };
}

async function reviewCard(userId, cardId, rating, durationMs, reps, tzOffset) {
	return sql.begin(async tx => {
		const [card] = await tx`select * from card where id = ${cardId} and "userId" = ${userId} for update`;
		if (card == null) throw new AppError(404, 'NO_SUCH_CARD', '没有这张卡');
		if (reps != null && reps !== card.reps) return { applied: false, card: packCard(card) };
		const now = new Date();
		const r = review(columnsOf(card), now, rating, tzOffset);
		await tx`update card set ${tx(r.card)} where id = ${card.id}`;
		await tx`insert into review ${tx({ id: genId(now.getTime()), cardId: card.id, userId, ...r.log, durationMs })}`;
		noteReview(userId, card.kind, rating);
		return { applied: true, card: packCard({ ...card, ...r.card }) };
	});
}

// 往社区摘要索引报一行：一个人停下来 5 分钟没再复习，就把这一轮记成一行（复习了几张、记得几张）。
const rounds = new Map();
function noteReview(userId, kind, rating) {
	const r = rounds.get(userId) ?? { n: 0, good: 0, spell: 0, at: Date.now(), timer: null };
	r.n++; if (rating >= 3) r.good++; if (kind === 'spell') r.spell++;
	clearTimeout(r.timer);
	r.timer = setTimeout(() => { rounds.delete(userId); community('lojo/apps/report', { userId, app: APP, line: { what: `复习了 ${r.n} 张卡`, right: r.good, total: r.n, note: `其中拼写 ${r.spell} 张；记得 ${r.good}/${r.n}`, at: new Date(r.at).toISOString() } }).catch(e => console.warn('report failed', e.message)); }, 5 * 60_000);
	r.timer.unref?.();
	rounds.set(userId, r);
}

// 每人每小时的上限，和社区原来的接口一样（加词 600、复习 3000、导入 20）。
const hits = new Map();
function limited(userId, op, max) {
	const k = `${op}:${userId}`, now = Date.now();
	const h = hits.get(k);
	if (h == null || h.until < now) { hits.set(k, { n: 1, until: now + 3600_000 }); if (hits.size > 20000) hits.clear(); return false; }
	return ++h.n > max;
}

function canWrite(who, op) {
	if (who.kind === 'user') return true;
	if (!who.scopes.includes(`${APP}:write`)) return false;
	return (op === 'add' ? ADD_CALLERS : OTHER_WRITE_CALLERS).includes(who.caller);
}

const intOf = (v, min, max) => { if (v == null || v === '') return null; const n = Number(v); return Number.isInteger(n) && n >= min && n <= max ? n : undefined; };
const timeOf = v => { if (v == null || v === '') return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
const ID = /^[0-9a-z]{6,32}$/;

async function routes(req, res, url) {
	const p = url.pathname, q = url.searchParams;
	if (p === '/api.json' || p === '/app.json') {
		res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-cache' });
		res.end(fs.readFileSync(path.join(HERE, p.slice(1))));
		return;
	}
	if (!p.startsWith('/api/')) return false;
	const who = await caller(req);
	if (who == null) return fail(res, 401, 'UNAUTHORIZED', '先登录社区');
	const uid = who.userId;
	try {
		if (p === '/api/v1/words' && req.method === 'GET') {
			if (!allowed(who, APP, 'words')) return fail(res, 403, 'FORBIDDEN', '没有读生词的授权');
			const lim = intOf(q.get('limit'), 1, MAX_WORDS) ?? 20;
			const r = await listWords(uid, lim, q.get('cursor'));
			return json(res, 200, list(APP, 'words', r.items, r.next));
		}
		if (p === '/api/v1/today' && req.method === 'GET') {
			if (!allowed(who, APP, 'reviews')) return fail(res, 403, 'FORBIDDEN', '没有读复习的授权');
			const tz = intOf(q.get('tzOffset'), -840, 840);
			if (tz === undefined) return fail(res, 400, 'BAD_TZ', 'tzOffset 要在 -840 到 840 之间');
			return json(res, 200, await today(uid, tz ?? 0));
		}
		if (p === '/api/v1/stats' && req.method === 'GET') {
			if (!allowed(who, APP, 'reviews')) return fail(res, 403, 'FORBIDDEN', '没有读复习的授权');
			return json(res, 200, { app: APP, kind: 'reviews', ...(await stats(uid, q)) });
		}
		if (p === '/api/v1/reviews' && req.method === 'GET') {
			if (!allowed(who, APP, 'reviews')) return fail(res, 403, 'FORBIDDEN', '没有读复习的授权');
			const since = timeOf(q.get('since')), until = timeOf(q.get('until')), lim = intOf(q.get('limit'), 1, 100) ?? 20;
			const cur = ID.test(q.get('cursor') ?? '') ? q.get('cursor') : null;
			const rows = await sql`select v.id, v.rating, v.state, v."reviewedAt", v."durationMs", c.kind, w.text from review v join card c on c.id = v."cardId" join word w on w.id = c."wordId"
				where v."userId" = ${uid} ${since ? sql`and v."reviewedAt" >= ${since}` : sql``} ${until ? sql`and v."reviewedAt" < ${until}` : sql``} ${cur ? sql`and v.id < ${cur}` : sql``}
				order by v.id desc limit ${lim + 1}`;
			const page = rows.slice(0, lim);
			return json(res, 200, list(APP, 'reviews', page.map(r => ({ word: r.text, card: r.kind, rating: r.rating, remembered: r.rating >= 3, firstTime: r.state === 0, at: iso(r.reviewedAt), durationMs: r.durationMs })), rows.length > lim ? page.at(-1).id : null));
		}
		if (p === '/api/v1/words' && req.method === 'POST') {
			if (!canWrite(who, 'add')) return fail(res, 403, 'FORBIDDEN', '没有往这个人的生词本加词的授权');
			if (limited(uid, 'add', 600)) return fail(res, 429, 'RATE_LIMIT', '加得太快了，过一会儿再试');
			const b = await readBody(req);
			return json(res, 200, await addWord(uid, cleanItem(b.item), sourceOf(b.source), noteOf(b.noteId)));
		}
		if (p === '/api/v1/words/import' && req.method === 'POST') {
			if (!canWrite(who, 'import')) return fail(res, 403, 'FORBIDDEN', '没有导入的授权');
			if (limited(uid, 'import', 20)) return fail(res, 429, 'RATE_LIMIT', '导入太多次了，过一会儿再试');
			const b = await readBody(req, 4 * 1024 * 1024);
			if (!Array.isArray(b.entries)) return fail(res, 400, 'BAD_REQUEST', 'entries 要是数组');
			return json(res, 200, await importWords(uid, b.entries));
		}
		const del = /^\/api\/v1\/words\/([0-9a-z]{6,32})$/.exec(p);
		if (del && req.method === 'DELETE') {
			if (!canWrite(who, 'remove')) return fail(res, 403, 'FORBIDDEN', '没有删词的授权');
			const r = await sql`delete from word where id = ${del[1]} and "userId" = ${uid}`;
			if (r.count === 0) return fail(res, 404, 'NO_SUCH_WORD', '没有这个词');
			res.writeHead(204); res.end(); return;
		}
		if (p === '/api/v1/reviews' && req.method === 'POST') {
			if (!canWrite(who, 'review')) return fail(res, 403, 'FORBIDDEN', '没有记复习的授权');
			if (limited(uid, 'review', 3000)) return fail(res, 429, 'RATE_LIMIT', '复习得太快了，过一会儿再试');
			const b = await readBody(req);
			const rating = intOf(b.rating, 1, 4), tz = intOf(b.tzOffset, -840, 840), reps = intOf(b.reps, 0, 1e6), dur = intOf(b.durationMs, 0, 3600000);
			if (!ID.test(String(b.cardId ?? '')) || rating == null || rating === undefined || tz === undefined || reps === undefined || dur === undefined) return fail(res, 400, 'BAD_REQUEST', 'cardId、rating(1-4)、tzOffset、reps、durationMs 不对');
			return json(res, 200, await reviewCard(uid, b.cardId, rating, dur ?? null, reps ?? null, tz ?? 0));
		}
	} catch (e) {
		if (e instanceof AppError) return fail(res, e.status, e.code, e.message);
		throw e;
	}
	return fail(res, 404, 'NOT_FOUND', '没有这个接口');
}

await migrate();
start({ port: Number(process.env.PORT ?? 8080), root: path.join(HERE, 'dist'), routes });
registerApp({ ...JSON.parse(fs.readFileSync(path.join(HERE, 'app.json'), 'utf8')), version: VERSION, internal: process.env.APP_INTERNAL_URL ?? 'http://wordbook:8080/', spec: JSON.parse(fs.readFileSync(path.join(HERE, 'api.json'), 'utf8')) });
