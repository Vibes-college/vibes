// SPDX-License-Identifier: AGPL-3.0-only
// 调社区接口（同一个网址的 /api/…），带社区的登录凭证。出错时抛出 { code, message }，和社区前端一样。
import { token } from '../i.js';
export async function misskeyApi<T = any>(endpoint: string, data: Record<string, unknown> = {}): Promise<T> {
	const t = token();
	const res = await fetch(`/api/${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(t ? { ...data, i: t } : data), credentials: 'omit' });
	if (res.status === 204) return undefined as T;
	const body = await res.json().catch(() => ({}));
	if (!res.ok) throw body?.error ?? { code: 'HTTP_' + res.status, message: res.statusText };
	return body as T;
}
// 调小程序自己的接口：/apps/<名字>/api/v1/…，用 Authorization 带社区登录。
export async function appApi<T = any>(base: string, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
	const t = token();
	const res = await fetch(`${base}api/v1/${path}`, { method: init.method ?? 'GET', headers: { ...(t ? { authorization: `Bearer ${t}` } : {}), ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}) }, body: init.body !== undefined ? JSON.stringify(init.body) : undefined });
	const body = await res.json().catch(() => ({}));
	if (!res.ok) throw body?.error ?? { code: 'HTTP_' + res.status, message: res.statusText };
	return body as T;
}
