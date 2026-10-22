/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { convertLojoPlaces, createLojoPlaceSearch, normalizeLojoPlaceQuery } from '@/server/web/LojoPlaceSearch.js';

const place = { geometry: { type: 'Point', coordinates: [114, 22] }, properties: { name: '公园', osm_type: 'N', osm_id: 123, city: '深圳' } };

describe('LOJO explicit place search', () => {
	test('normalizes names and rejects control characters, empty and long queries', () => {
		expect(normalizeLojoPlaceQuery('  深圳　公园  ')).toBe('深圳 公园');
		for (const value of ['', 'a', null, ['公园'], '公园\n', '字'.repeat(121)]) {
			expect(() => normalizeLojoPlaceQuery(value)).toThrow();
		}
	});

	test('drops malformed and duplicate coordinates while retaining public source attribution', () => {
		const result = convertLojoPlaces({ features: [place, place, { ...place, geometry: { type: 'Point', coordinates: [181, 22] } }, { geometry: { type: 'Polygon' } }] });
		expect(result.places).toHaveLength(1);
		expect(result.places[0]).toMatchObject({ placeId: 'osm:node:123', sourceUrl: 'https://www.openstreetmap.org/node/123', coord: [114, 22] });
		expect(result.attribution).toContain('OpenStreetMap');
	});

	test('deduplicates concurrent requests and caches independent results', async () => {
		let finish!: (value: Response) => void;
		const upstream = vi.fn<typeof fetch>().mockImplementation(() => new Promise(resolve => { finish = resolve; }));
		const search = createLojoPlaceSearch(upstream);
		const first = search('深圳公园');
		const duplicate = search('深圳公园');
		await Promise.resolve();
		expect(upstream).toHaveBeenCalledTimes(1);
		finish(new Response(JSON.stringify({ features: [place] })));
		const [a, b] = await Promise.all([first, duplicate]);
		a.places[0].name = 'changed';
		expect(b.places[0].name).toBe('公园');
		expect((await search('深圳公园')).places[0].name).toBe('公园');
		expect(upstream).toHaveBeenCalledTimes(1);
		const request = upstream.mock.calls[0];
		expect(String(request[0])).toBe('https://photon.komoot.io/api/?q=%E6%B7%B1%E5%9C%B3%E5%85%AC%E5%9B%AD&limit=8');
		expect(request[1]?.redirect).toBe('error');
	});

	test('rejects oversized upstream responses', async () => {
		const upstream = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { headers: { 'content-length': '300000' } }));
		await expect(createLojoPlaceSearch(upstream)('深圳公园')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
	});
});
