/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const ENDPOINT = 'https://photon.komoot.io/api/';
const MAX_BYTES = 256 * 1024;

export class LojoPlaceSearchError extends Error {
	constructor(message: string, public status = 502, public code = 'SEARCH_UNAVAILABLE', public retryAfter?: number) {
		super(message);
	}
}

type Place = { placeId: string; name: string; address: string; coord: number[]; source: string; sourceUrl: string };
type SearchResult = { places: Place[]; attribution: string };
type Feature = { geometry?: { type?: string; coordinates?: number[] }; properties?: Record<string, unknown> };

export function normalizeLojoPlaceQuery(value: unknown): string {
	if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/u.test(value)) throw new LojoPlaceSearchError('请输入地点名称', 400, 'INVALID_QUERY');
	const query = value.normalize('NFKC').trim().replace(/\s+/gu, ' ');
	if ([...query].length < 2 || [...query].length > 120) throw new LojoPlaceSearchError('地点名称需为 2–120 个字', 400, 'INVALID_QUERY');
	return query;
}

function cleanText(value: unknown, max = 256): string {
	return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/gu, ' ').trim().slice(0, max) : '';
}

export function convertLojoPlaces(data: unknown): SearchResult {
	if (!data || typeof data !== 'object' || !('features' in data) || !Array.isArray(data.features)) throw new LojoPlaceSearchError('地点服务返回了无效结果', 502, 'INVALID_RESPONSE');
	const places: Place[] = [];
	const seen = new Set<string>();
	for (const feature of data.features as Feature[]) {
		const point = feature.geometry;
		const info = feature.properties;
		if (point?.type !== 'Point' || !Array.isArray(point.coordinates) || !info) continue;
		const [lng, lat] = point.coordinates;
		if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) continue;
		const name = cleanText(info.name, 120) || cleanText(info.street, 120) || cleanText(info.city, 120);
		if (!name) continue;
		const osmType = ({ N: 'node', W: 'way', R: 'relation' } as Record<string, string>)[String(info.osm_type)];
		const osmId = String(info.osm_id ?? '');
		const validOSM = Boolean(osmType && /^\d{1,20}$/u.test(osmId) && Number(osmId) > 0);
		const placeId = validOSM ? `osm:${osmType}:${osmId}` : `photon:${lng},${lat}`;
		if (seen.has(placeId)) continue;
		seen.add(placeId);
		const address = [info.country, info.state, info.city, info.district, info.locality, info.street, info.housenumber].map(v => cleanText(v, 100)).filter(Boolean);
		places.push({ placeId, name, address: [...new Set(address)].join(' · ').slice(0, 280), coord: [lng, lat], source: 'OpenStreetMap', sourceUrl: validOSM ? `https://www.openstreetmap.org/${osmType}/${osmId}` : `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}` });
		if (places.length === 8) break;
	}
	return { places, attribution: '© OpenStreetMap contributors' };
}

async function readJSON(response: Response): Promise<unknown> {
	if (Number(response.headers.get('content-length')) > MAX_BYTES) {
		await response.body?.cancel();
		throw new LojoPlaceSearchError('地点服务返回了无效结果', 502, 'INVALID_RESPONSE');
	}
	if (!response.body) throw new LojoPlaceSearchError('地点服务没有返回结果', 502, 'INVALID_RESPONSE');
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let length = 0;
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			length += value.byteLength;
			if (length > MAX_BYTES) {
				await reader.cancel();
				throw new LojoPlaceSearchError('地点服务返回了无效结果', 502, 'INVALID_RESPONSE');
			}
			chunks.push(value);
		}
		return JSON.parse(Buffer.concat(chunks).toString('utf8'));
	} finally {
		reader.releaseLock();
	}
}

// A fixed upstream, shared queue, bounded cache and timeout. Only explicitly
// submitted place names leave this server; no incoming headers or account data.
export function createLojoPlaceSearch(fetchImpl: typeof fetch = globalThis.fetch) {
	const cache = new Map<string, { expires: number; result: SearchResult }>();
	const pending = new Map<string, Promise<SearchResult>>();
	let tail: Promise<unknown> = Promise.resolve();
	let nextStart = 0;

	async function perform(query: string): Promise<SearchResult> {
		const wait = nextStart - Date.now();
		if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
		nextStart = Date.now() + 1000;
		const url = new URL(ENDPOINT);
		url.searchParams.set('q', query);
		url.searchParams.set('limit', '8');
		try {
			const response = await fetchImpl(url, { redirect: 'error', signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json', 'Accept-Language': 'zh,en;q=0.8', 'User-Agent': 'LOJO-TravelPlanner/0.1' } });
			if (response.status === 429) {
				const retry = Math.min(60, Math.max(1, Number(response.headers.get('retry-after')) || 5));
				nextStart = Date.now() + retry * 1000;
				throw new LojoPlaceSearchError('地点搜索较繁忙，请稍后重试', 429, 'SEARCH_BUSY', retry);
			}
			if (!response.ok) throw new LojoPlaceSearchError('地点搜索暂时不可用，请稍后重试');
			return convertLojoPlaces(await readJSON(response));
		} catch (error) {
			if (error instanceof LojoPlaceSearchError) throw error;
			throw new LojoPlaceSearchError('地点搜索暂时不可用，请稍后重试');
		}
	}

	return async (value: unknown): Promise<SearchResult> => {
		const query = normalizeLojoPlaceQuery(value);
		const key = query.toLocaleLowerCase('en');
		const saved = cache.get(key);
		if (saved && saved.expires > Date.now()) return structuredClone(saved.result);
		if (saved) cache.delete(key);
		const active = pending.get(key);
		if (active) return structuredClone(await active);
		if (pending.size >= 3) throw new LojoPlaceSearchError('地点搜索较繁忙，请稍后重试', 429, 'SEARCH_BUSY', 3);
		const task = tail.then(() => perform(query)).then(result => {
			cache.set(key, { expires: Date.now() + 24 * 60 * 60 * 1000, result });
			while (cache.size > 128) cache.delete(cache.keys().next().value!);
			return result;
		}).finally(() => pending.delete(key));
		pending.set(key, task);
		tail = task.catch(() => {});
		return structuredClone(await task);
	};
}
