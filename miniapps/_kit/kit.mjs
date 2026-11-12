// SPDX-License-Identifier: AGPL-3.0-only
// 小程序共用工具包（miniapps/_kit）。每个小程序容器构建时拷一份，不跨容器共享运行时。
// 管四件事：认社区账号、服务器之间调用的口令、统一返回外壳、发静态文件。只用 Node 自带模块。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { timingSafeEqual } from 'node:crypto';

export const COMMUNITY = process.env.COMMUNITY_URL ?? 'http://web:3000';
const SERVICE_KEY = process.env.MINIAPP_SERVICE_KEY ?? '';

// —— 返回外壳（设计稿 9.1）——
export function json(res, status, body, extra = {}) {
	const s = JSON.stringify(body);
	res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra });
	res.end(s);
}
export const fail = (res, status, code, message) => json(res, status, { error: { code, message } });
export const list = (app, kind, items, next = null) => ({ app, kind, items, next });

export async function readBody(req, max = 256 * 1024) {
	let size = 0; const chunks = [];
	for await (const c of req) { size += c.length; if (size > max) throw Object.assign(new Error('too large'), { status: 413 }); chunks.push(c); }
	if (size === 0) return {};
	try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw Object.assign(new Error('bad json'), { status: 400 }); }
}

// —— 认社区账号：浏览器带社区存在 localStorage 的登录凭证来，拿去问社区 api/i，缓存 60 秒 ——
const who = new Map();
export async function userFromToken(token) {
	if (typeof token !== 'string' || token.length < 8 || token.length > 200) return null;
	const hit = who.get(token);
	if (hit && hit.until > Date.now()) return hit.user;
	const r = await fetch(`${COMMUNITY}/api/i`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ i: token }), signal: AbortSignal.timeout(4000) });
	if (r.status === 401 || r.status === 403 || r.status === 400) { who.set(token, { user: null, until: Date.now() + 10_000 }); return null; }
	if (!r.ok) throw Object.assign(new Error(`community api/i ${r.status}`), { status: 502 });
	const me = await r.json();
	const user = { id: me.id, username: me.username, birthday: me.birthday ?? null };
	who.set(token, { user, until: Date.now() + 60_000 });
	if (who.size > 5000) who.delete(who.keys().next().value);
	return user;
}
const bearer = req => /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1] ?? null;

// —— 服务器之间：社区（替 Vibi 转调、或闯关往生词本加词）带口令和用户 id 来 ——
function serviceOk(given) {
	if (SERVICE_KEY.length < 24 || typeof given !== 'string') return false;
	const a = Buffer.from(given), b = Buffer.from(SERVICE_KEY);
	return a.length === b.length && timingSafeEqual(a, b);
}
// 返回 { kind: 'user'|'service', userId, caller, scopes }，认不出就 null。
export async function caller(req) {
	const svc = req.headers['x-vibes-service'];
	if (svc != null) {
		if (!serviceOk(String(svc))) return null;
		const userId = String(req.headers['x-vibes-user'] ?? '');
		if (!/^[0-9a-z]{6,32}$/.test(userId)) return null;
		const scopes = String(req.headers['x-vibes-scopes'] ?? '').split(/[\s,]+/).filter(Boolean);
		return { kind: 'service', userId, caller: String(req.headers['x-vibes-caller'] ?? 'community'), scopes };
	}
	const user = await userFromToken(bearer(req));
	return user ? { kind: 'user', userId: user.id, user, caller: 'self', scopes: ['*'] } : null;
}
// 授权检查：本人读自己的都行；服务器转调必须带上社区查过的「小程序:数据类」授权。
export function allowed(who, app, kind) {
	if (who == null) return false;
	if (who.kind === 'user') return true;
	return who.scopes.includes(`${app}:${kind}`) || who.scopes.includes(`${app}:*`);
}

// —— 往社区报：摘要索引、上线时登记目录 ——
export async function community(endpoint, body) {
	const r = await fetch(`${COMMUNITY}/api/${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ serviceKey: SERVICE_KEY, ...body }), signal: AbortSignal.timeout(4000) });
	if (!r.ok) throw new Error(`${endpoint} ${r.status} ${(await r.text()).slice(0, 200)}`);
	return r.status === 204 ? null : r.json();
}
export async function registerApp(manifest, tries = 20) {
	for (let i = 0; i < tries; i++) {
		try { await community('lojo/apps/register', { app: manifest }); console.log(`registered ${manifest.id} v${manifest.version}`); return; } catch (e) { console.warn('register failed, retry', e.message); await new Promise(r => setTimeout(r, Math.min(30_000, 2000 * (i + 1)))); }
	}
}

// —— 静态文件（前端打包产物），找不到就回 index.html（前端自己有路由）——
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };
export function serveStatic(req, res, root, rel) {
	const clean = path.normalize('/' + decodeURIComponent(rel)).replace(/^\/+/, '');
	let file = path.join(root, clean);
	if (!file.startsWith(root)) return fail(res, 400, 'BAD_PATH', 'bad path');
	let st = fs.statSync(file, { throwIfNoEntry: false });
	if (st?.isDirectory()) { file = path.join(file, 'index.html'); st = fs.statSync(file, { throwIfNoEntry: false }); }
	if (!st) { file = path.join(root, 'index.html'); st = fs.statSync(file); }
	const hashed = /\/assets\/.+-[A-Za-z0-9_-]{8,}\.(js|css|woff2|svg|png|mp3)$/.test(file);
	res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'content-length': st.size, 'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache' });
	if (req.method === 'HEAD') return res.end();
	fs.createReadStream(file).pipe(res);
}

// —— 起服务：routes(req, res, url) 返回 false 就当静态文件处理 ——
export function start({ port, root, routes }) {
	const server = http.createServer(async (req, res) => {
		const url = new URL(req.url, 'http://x');
		try {
			if (url.pathname === '/healthz') return json(res, 200, { ok: true });
			if (await routes(req, res, url) !== false) return;
			if (req.method !== 'GET' && req.method !== 'HEAD') return fail(res, 405, 'METHOD', 'method not allowed');
			serveStatic(req, res, root, url.pathname);
		} catch (e) {
			const status = e.status ?? 500;
			if (status >= 500) console.error(e);
			if (!res.headersSent) fail(res, status, status >= 500 ? 'INTERNAL' : 'BAD_REQUEST', status >= 500 ? 'server error' : e.message);
		}
	});
	server.keepAliveTimeout = 65_000;
	server.listen(port, () => console.log(`listening on ${port}`));
	for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => server.close(() => process.exit(0)));
	return server;
}
