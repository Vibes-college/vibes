/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 第 6 步 (2026-11-17): Vibi may ask to change something in a mini app for the learner (add a word to the wordbook…),
// but never changes it herself. A mini app marks such an operation in its OpenAPI spec:
//   "post": { "x-vibes-kind": "words", "x-vibes-action": { "zh": "把「{item.text}」加进你的生词本", "en": "Add “{item.text}” to your wordbook",
//             "doneZh": "「{item.text}」已加进生词本", "doneEn": "“{item.text}” is in your wordbook" }, "requestBody": … }
// and grants Vibi `<kind>:do` in app.json. When Vibi calls it, the community keeps the request and puts a 「确认」 card
// under her reply; only the learner's tap sends it to the app (LojoAppsService.decideAction).
// The spec reading, the body check and the sentences are here, with no imports, so the unit tests need no database.

export type AppActionText = { zh: string; en: string; doneZh: string | null; doneEn: string | null };

export type AppSpecOp = {
	/** as Vibi writes it: no leading slash, no api/v1/ (words, words/{id}) */
	path: string;
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	kind: string;
	summary: string;
	/** GET: the query parameters */
	params: string[];
	/** writes: the JSON body's schema ($refs to components.schemas resolved), null when it takes none */
	body: Record<string, unknown> | null;
	/** writes: how to ask the learner; null for a write without it (Vibi cannot call those) */
	action: AppActionText | null;
};

export const APP_ACTION_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export const APP_ACTION_MAX_BODY = 4 * 1024;
/** cards under one reply at most */
export const APP_ACTION_PER_REPLY = 3;
/** a card can be confirmed for a day; after that it says it expired */
export const APP_ACTION_PENDING_MS = 24 * 60 * 60 * 1000;
export const APP_ACTION_ID = /^[0-9a-f]{10}$/;

// The marker message the chat page draws as the card (lojo/apps/actionCard.ts reads it); other clients see the sentence.
export const appActionText = (sentence: string, actionId: string) => `【请确认】${sentence}（确认号 ${actionId}）`;

// 第 6 步返工 (11-17): Vibi only hears "pending" when she asks; the learner's tap comes later, on the page. So every
// /chat, /event and prompt carries this learner's latest cards and what became of them, newest first, and she speaks
// by that (a cancelled word was not added). The index keeps the last 10 ids; she sees at most 8 from the last 7 days.
export const APP_ACTION_RECENT_KEEP = 10;
export const APP_ACTION_RECENT_SHOWN = 8;
export const APP_ACTION_RECENT_MS = 7 * 24 * 60 * 60 * 1000;

export type AppActionCardState = 'pending' | 'running' | 'done' | 'failed' | 'cancelled' | 'expired';
export type AppActionRecent = {
	id: string; app: string; appName: string;
	/** the sentence on the card, e.g. 把「resilient」加进你的生词本 */
	card: string;
	status: AppActionCardState;
	askedAt: string; decidedAt: string | null; error: string | null;
};

export function recentAppCards(
	views: { id: string; app: string; appName: string; text: { zh: string }; status: AppActionCardState; createdAt: string; decidedAt: string | null; error: string | null }[],
	now = Date.now(),
): AppActionRecent[] {
	const seen = new Set<string>();
	return views
		.filter(v => {
			const at = Date.parse(v.createdAt);
			if (seen.has(v.id) || !Number.isFinite(at) || now - at > APP_ACTION_RECENT_MS) return false;
			seen.add(v.id);
			return true;
		})
		.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
		.slice(0, APP_ACTION_RECENT_SHOWN)
		.map(v => ({ id: v.id, app: v.app, appName: v.appName, card: v.text.zh, status: v.status, askedAt: v.createdAt, decidedAt: v.decidedAt, error: v.error }));
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v != null && !Array.isArray(v);
const str = (v: unknown, max: number): string | null => (typeof v === 'string' && v.trim() !== '' ? v.trim().slice(0, max) : null);

export function cleanAppPath(p: string): string {
	return p.replace(/^\/+/, '').replace(/^api\/v1\//, '').replace(/\/+$/, '');
}

function normalizeAction(v: unknown): AppActionText | null {
	if (!isObj(v)) return null;
	const zh = str(v.zh, 200);
	const en = str(v.en, 200);
	if (zh == null && en == null) return null;
	return { zh: zh ?? en!, en: en ?? zh!, doneZh: str(v.doneZh, 200), doneEn: str(v.doneEn, 200) };
}

function resolve(spec: Obj, v: unknown, depth = 0): unknown {
	if (depth > 6) return v;
	if (Array.isArray(v)) return v.map(x => resolve(spec, x, depth + 1));
	if (!isObj(v)) return v;
	const ref = v.$ref;
	if (typeof ref === 'string') {
		const m = /^#\/components\/schemas\/([A-Za-z0-9_.-]+)$/.exec(ref);
		const target = m ? (spec.components as { schemas?: Obj } | undefined)?.schemas?.[m[1]] : undefined;
		return target == null ? {} : resolve(spec, target, depth + 1);
	}
	return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolve(spec, x, depth + 1)]));
}

/** Every operation of a spec Vibi may know about: reads with x-vibes-kind, and writes with x-vibes-kind. */
export function appSpecOps(spec: unknown): AppSpecOp[] {
	if (!isObj(spec) || !isObj(spec.paths)) return [];
	const out: AppSpecOp[] = [];
	for (const [p, ops] of Object.entries(spec.paths)) {
		if (!isObj(ops)) continue;
		for (const [m, op] of Object.entries(ops)) {
			const method = m.toUpperCase() as AppSpecOp['method'];
			if (!(APP_ACTION_METHODS as readonly string[]).includes(method) || !isObj(op)) continue;
			const kind = str(op['x-vibes-kind'] ?? (method === 'GET' ? ops['x-vibes-kind'] : null), 64);
			if (kind == null) continue;
			const schema = (op.requestBody as { content?: { 'application/json'?: { schema?: unknown } } } | undefined)?.content?.['application/json']?.schema;
			out.push({
				path: cleanAppPath(p),
				method,
				kind,
				summary: str(op.summary, 200) ?? '',
				params: method === 'GET' && Array.isArray(op.parameters) ? op.parameters.map(x => (isObj(x) && x.in !== 'path' ? String(x.name ?? '') : '')).filter(Boolean) : [],
				body: method === 'GET' || schema == null ? null : resolve(spec, schema) as Obj,
				action: method === 'GET' ? null : normalizeAction(op['x-vibes-action']),
			});
		}
	}
	return out;
}

/** The operation a call means: same method, and the path equal or matching its {placeholders}. */
export function findAppOp(ops: AppSpecOp[], method: string, path: string): AppSpecOp | null {
	const want = cleanAppPath(path);
	const m = method.toUpperCase();
	for (const op of ops) {
		if (op.method !== m) continue;
		if (op.path === want) return op;
		const re = new RegExp(`^${op.path.split('/').map(seg => (/^\{[A-Za-z0-9_]+\}$/.test(seg) ? '[0-9A-Za-z_-]{1,64}' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('/')}$`);
		if (re.test(want)) return op;
	}
	return null;
}

const typeName = (s: Obj): string => {
	if (Array.isArray(s.enum)) return s.enum.map(String).join('|');
	if (s.type === 'array') return `${isObj(s.items) ? typeName(s.items) : 'any'}[]`;
	if (s.type === 'object' || isObj(s.properties)) return `{${describeBody(s)}}`;
	return Array.isArray(s.type) ? s.type.join('|') : String(s.type ?? 'any');
};

/** A body schema in one short line for Vibi: name*: type (* = required). */
export function describeBody(schema: Obj | null): string {
	if (schema == null || !isObj(schema.properties)) return '';
	const req = Array.isArray(schema.required) ? schema.required.map(String) : [];
	return Object.entries(schema.properties).map(([k, v]) => `${k}${req.includes(k) ? '*' : ''}: ${isObj(v) ? typeName(v) : 'any'}`).join(', ');
}

function typeOk(s: Obj, v: unknown): boolean {
	const types = Array.isArray(s.type) ? s.type : s.type == null ? [] : [s.type];
	if (types.length === 0) return true;
	return types.some(t => (t === 'null' && v === null)
		|| (t === 'string' && typeof v === 'string')
		|| (t === 'integer' && Number.isInteger(v))
		|| (t === 'number' && typeof v === 'number' && Number.isFinite(v))
		|| (t === 'boolean' && typeof v === 'boolean')
		|| (t === 'array' && Array.isArray(v))
		|| (t === 'object' && isObj(v)));
}

function check(s: Obj, v: unknown, where: string, out: string[], depth: number): void {
	if (depth > 6 || out.length > 5) return;
	if (!typeOk(s, v)) {
		out.push(`${where} should be ${typeName(s)}`);
		return;
	}
	if (Array.isArray(s.enum) && !s.enum.includes(v)) out.push(`${where} should be one of ${s.enum.map(String).join(', ')}`);
	if (typeof v === 'string' && typeof s.maxLength === 'number' && v.length > s.maxLength) out.push(`${where} is longer than ${s.maxLength}`);
	if (isObj(v)) {
		for (const k of Array.isArray(s.required) ? s.required.map(String) : []) if (v[k] == null || v[k] === '') out.push(`${where === '' ? '' : `${where}.`}${k} is required`);
		const props = isObj(s.properties) ? s.properties : {};
		for (const [k, x] of Object.entries(v)) {
			const ps = props[k];
			if (isObj(ps)) check(ps, x, where === '' ? k : `${where}.${k}`, out, depth + 1);
			else if (s.additionalProperties === false) out.push(`${where === '' ? '' : `${where}.`}${k} is not allowed`);
		}
	}
	if (Array.isArray(v) && isObj(s.items)) v.slice(0, 50).forEach((x, i) => check(s.items as Obj, x, `${where}[${i}]`, out, depth + 1));
}

/** What is wrong with the body Vibi sent for a write (empty = fine). The app checks it again. */
export function appBodyProblems(schema: Obj | null, body: unknown): string[] {
	if (schema == null) return body == null || (isObj(body) && Object.keys(body).length === 0) ? [] : ['this action takes no body'];
	if (!isObj(body)) return ['body should be a JSON object'];
	if (JSON.stringify(body).length > APP_ACTION_MAX_BODY) return [`body is too large (at most ${APP_ACTION_MAX_BODY} characters)`];
	const out: string[] = [];
	check(schema, body, '', out, 0);
	return out;
}

/** A sentence with {a.b} filled from the body: one line, each value at most 60 characters; an unknown one is "…". */
export function fillAppText(template: string, body: unknown): string {
	return template.replace(/\{([A-Za-z0-9_.]+)\}/g, (_, path: string) => {
		let v: unknown = body;
		for (const k of path.split('.')) v = isObj(v) ? v[k] : undefined;
		if (typeof v !== 'string' && typeof v !== 'number') return '…';
		const s = String(v).replace(/\s+/g, ' ').trim();
		return s.length > 60 ? `${s.slice(0, 59)}…` : s || '…';
	}).slice(0, 300);
}
