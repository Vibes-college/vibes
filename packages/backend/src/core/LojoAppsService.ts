/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DI } from '@/di-symbols.js';

// 小程序搬出社区 (founder, 2026-11-12): every mini app runs on its own at /apps/<id>/, keeps its own data in its own
// schema and answers its own API. The community keeps just two things (migration 1795000000000-LojoApps.js):
// - lojo_app, the directory: each mini app registers itself when it starts (name, one line, its kinds of data, its
//   OpenAPI spec, where it listens inside the network, and who may read which kind by default);
// - lojo_app_activity, the summary index: one line per set a learner finished, so Vibi can answer "how was my week"
//   without asking every mini app.
// Vibi's four fixed tools (listApps, appSpec, appCall, recentActivity) go through here. appCall checks the grant
// (app × kind of data, default: Vibi only), then forwards to the mini app with the shared service key; the mini app
// checks the key and the scopes again.

export type LojoApp = {
	id: string; name: string; summary: string; base: string; internal: string; version: string;
	kinds: Record<string, string>; defaultGrants: Record<string, string[]>; spec: any; updatedAt: Date;
};

export type LojoActivityLine = { what: string; right?: number | null; total?: number | null; note?: string; at?: string };

// Callers that may be granted access. Only the community's own tutor for now; outside agents need the consent page
// first (design doc §9, not built).
export const LOJO_APP_CALLERS = ['vibi'] as const;

const ID = /^[a-z][a-z0-9-]{1,30}$/;
const CALL_TIMEOUT_MS = 3000;
const CALL_MAX_BYTES = 48 * 1024;

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
			grants[c] = ks.map(String).filter(k => k in kinds);
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

	// The directory as Vibi sees it: what each app is and which kinds this caller may read. Sorted by id so the text
	// stays the same from call to call.
	public async listFor(callerId: string) {
		return (await this.all()).map(a => ({
			id: a.id, name: a.name, summary: a.summary, url: a.base,
			kinds: Object.entries(a.kinds).map(([k, d]) => ({ kind: k, about: d, granted: this.granted(a, callerId, k) })),
		}));
	}

	public granted(app: LojoApp, callerId: string, kind: string): boolean {
		return (app.defaultGrants[callerId] ?? []).includes(kind);
	}

	// The paths of the spec Vibi may call: GET only, with the kind each one reads.
	public specFor(app: LojoApp, callerId: string) {
		const paths: { path: string; kind: string; granted: boolean; summary: string; params: string[] }[] = [];
		for (const [p, ops] of Object.entries<any>(app.spec?.paths ?? {})) {
			const get = ops?.get;
			if (get == null) continue;
			const kind = String(get['x-vibes-kind'] ?? ops['x-vibes-kind'] ?? '');
			if (!kind) continue;
			paths.push({ path: p.replace(/^\/+/, '').replace(/^api\/v1\//, ''), kind, granted: this.granted(app, callerId, kind), summary: String(get.summary ?? '').slice(0, 200), params: (get.parameters ?? []).map((x: any) => String(x.name)).filter(Boolean) });
		}
		return { id: app.id, name: app.name, version: app.version, paths };
	}

	// Forward one read to the app for this learner, after the grant check. Returns the app's answer, or an error object
	// the model can read.
	public async call(callerId: string, userId: string, appId: string, path: string, query: Record<string, string>) {
		const app = await this.get(appId);
		if (app == null) return { error: { code: 'NO_SUCH_APP', message: `no app ${appId}` } };
		const clean = path.replace(/^\/+/, '').replace(/^api\/v1\//, '');
		const spec = this.specFor(app, callerId).paths.find(p => p.path === clean);
		if (spec == null) return { error: { code: 'NO_SUCH_PATH', message: `${appId} has no GET ${clean}` } };
		if (!spec.granted) return { error: { code: 'NOT_GRANTED', message: `${callerId} may not read ${appId}:${spec.kind}` } };
		const qs = new URLSearchParams();
		for (const [k, v] of Object.entries(query ?? {})) if (/^[a-zA-Z]{1,20}$/.test(k)) qs.set(k, String(v).slice(0, 100));
		const url = `${app.internal}api/v1/${clean}${qs.size ? `?${qs}` : ''}`;
		try {
			const r = await fetch(url, {
				headers: {
					'x-vibes-service': process.env.MINIAPP_SERVICE_KEY ?? '',
					'x-vibes-user': userId,
					'x-vibes-caller': callerId,
					'x-vibes-scopes': `${appId}:${spec.kind}`,
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
