/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* global window:readonly, localStorage:readonly, MutationObserver:readonly, ResizeObserver:readonly, URL:readonly, requestAnimationFrame:readonly */
// LOJO rent map. One question first (where do you work?), then: which 片区 gets you there fastest,
// what it costs, what the 城中村/小区 inside look like, and who can show you around.
// Map, place search and every commute are live AMap (高德) results.
import { geo, agents, clips, records } from './rent-data.js';

const MODES = [
	{ id: 'transit', label: '地铁公交', hint: '高德公交方案里最快的一条' },
	{ id: 'ebike', label: '电动车', hint: '按骑行路线、约 20 km/h 估算' },
	{ id: 'bike', label: '自行车', hint: '高德骑行路线' },
	{ id: 'drive', label: '开车', hint: '不含找车位的时间' },
	{ id: 'walk', label: '步行', hint: '高德步行路线' },
];
// Shenzhen metro line colours, so a route reads like the station signs.
const LINE_COLORS = { '1号线': '#00B140', '2号线': '#F08300', '3号线': '#00A0E9', '4号线': '#E5002D', '5号线': '#A05EB5', '6号线': '#5DC1C7', '7号线': '#1C4FA1', '8号线': '#E9545E', '9号线': '#857467', '10号线': '#F2A7C1', '11号线': '#672146', '12号线': '#A192B2', '13号线': '#DA8D3C', '14号线': '#F3B21B', '16号线': '#2E3192', '20号线': '#86C9C8' };
const RAMP = ['#2340A3', '#D3DAF0'];
const STORE = 'lojo:rentmap';
const BUDGETS = [1000, 1500, 2000, 2500, 3000, 4000];

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = n => n == null ? '—' : `¥${Math.round(n).toLocaleString('en-US')}`;
// "腾讯滨海大厦(不对外开放)" -> "腾讯滨海大厦"; gates and towers keep their suffix.
const cleanName = name => (name ?? '').replace(/[（(](不对外开放|暂停营业|暂停开放|已关闭|内部)[)）]$/, '');
const lineName = name => (name ?? '').match(/(\d+号线)/)?.[1] ?? (name ?? '').replace(/\(.*$/, '');

function mix(a, b, t) {
	const h = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));
	const [A, B] = [h(a), h(b)];
	return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const icon = {
	work: svg('<path d="M4 21V6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v15M15 10h4a1 1 0 0 1 1 1v10M8 9h3M8 13h3M8 17h3M3 21h18"/>'),
	search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
	down: svg('<path d="M7 10l5 5 5-5"/>'),
	back: svg('<path d="M15 6l-6 6 6 6"/>'),
	pin: svg('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.2"/>'),
	check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
	transit: svg('<rect x="6" y="3.5" width="12" height="13" rx="3"/><path d="M6 10h12M9 17l-2 4M15 17l2 4"/><circle cx="9.5" cy="13.3" r=".6"/><circle cx="14.5" cy="13.3" r=".6"/>'),
	ebike: svg('<circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M6 17l4-7h5l3 7M14 6h3l-2 4M11.5 3l-1 4h2.5"/>'),
	bike: svg('<circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M6 17l3.5-7h6.5L18 17M9.5 10L8 6.5h2.5M12 17l3-7"/>'),
	drive: svg('<path d="M5 16v-4l2-5h10l2 5v4zM5 16v2.5M19 16v2.5"/><circle cx="8" cy="13.2" r=".6"/><circle cx="16" cy="13.2" r=".6"/>'),
	walk: svg('<circle cx="13" cy="4.5" r="1.6"/><path d="M10 21l2-6 3 3v4M9 12l2-4 3 1 2 3M12 15l-1-6"/>'),
};

let amapLoading = null;

function loadAMap(cfg) {
	if (window.AMap?.Map) return Promise.resolve(window.AMap);
	if (amapLoading) return amapLoading;
	// The security code never reaches the page on the site: AMap calls go through our proxy.
	window._AMapSecurityConfig = cfg.securityJsCode ? { securityJsCode: cfg.securityJsCode } : { serviceHost: new URL(cfg.serviceHost, window.location.href).href.replace(/\/$/, '') };
	amapLoading = new Promise((resolve, reject) => {
		const s = window.document.createElement('script');
		s.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(cfg.key)}&plugin=AMap.AutoComplete,AMap.PlaceSearch,AMap.Transfer,AMap.Riding,AMap.Driving,AMap.Walking`;
		s.async = true;
		s.onload = () => (window.AMap ? resolve(window.AMap) : reject(new Error('AMAP_LOAD_FAILED')));
		s.onerror = () => { amapLoading = null; reject(new Error('AMAP_LOAD_FAILED')); };
		window.document.head.appendChild(s);
	});
	return amapLoading;
}

export async function mountRentMap(container, { css = '', media = 'media/', amap } = {}) {
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let disposed = false;
	const timers = new Set();
	const later = (fn, ms) => { const t = window.setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };

	container.innerHTML = `<div class="rm-root">${css ? `<style>${css}</style>` : ''}
		<div class="rm-map" aria-label="租房地图"></div>
		<div class="rm-top">
			<div class="rm-ask">
				<button type="button" class="rm-askMain" data-search><span class="rm-askIcon">${icon.work}</span><span class="rm-askText"></span></button>
				<button type="button" class="rm-mode" data-mode aria-haspopup="listbox" aria-expanded="false"></button>
			</div>
			<div class="rm-menu" role="listbox" aria-label="怎么去上班" hidden></div>
		</div>
		<aside class="rm-sheet">
			<div class="rm-grip" aria-hidden="true"><span></span></div>
			<div class="rm-sheetScroll"><div class="rm-sheetBody"></div></div>
			<div class="rm-sheetCta"></div>
		</aside>
		<div class="rm-search" hidden>
			<div class="rm-searchBar">
				<button type="button" class="rm-iconBtn" data-close-search aria-label="返回">${icon.back}</button>
				<label class="rm-searchField">${icon.search}<input type="search" enterkeyhint="search" placeholder="公司、园区或写字楼" autocomplete="off"></label>
			</div>
			<div class="rm-searchList" role="listbox"></div>
		</div>
		<div class="rm-pop" hidden><div class="rm-popBackdrop" data-close-pop></div><div class="rm-popCard" role="dialog" aria-modal="true"></div></div>
		<div class="rm-player" hidden><div class="rm-playerBackdrop" data-close-player></div><div class="rm-playerStage"><div class="rm-playerTrack"></div><button type="button" class="rm-playerClose" data-close-player aria-label="关闭">×</button></div></div>
	</div>`;
	const root = container.querySelector('.rm-root');
	const $ = s => root.querySelector(s);
	const $$ = s => [...root.querySelectorAll(s)];
	const narrow = () => root.clientWidth <= 760;
	const ro = new ResizeObserver(() => root.classList.toggle('rm-narrow', narrow()));
	ro.observe(root);
	root.classList.toggle('rm-narrow', narrow());
	const asset = f => media + f;

	// ── state, remembered between visits ───────────────────
	const saved = (() => { try { return JSON.parse(localStorage.getItem(STORE) ?? '{}'); } catch { return {}; } })();
	const state = {
		work: saved.work ?? null, // { name, district, at: [lng, lat] }
		mode: MODES.some(m => m.id === saved.mode) ? saved.mode : 'transit',
		budget: saved.budget ?? null,
		area: null,
		place: null,
	};
	const persist = () => { try { localStorage.setItem(STORE, JSON.stringify({ work: state.work, mode: state.mode, budget: state.budget, recent: saved.recent ?? [] })); } catch {} };
	const areaById = Object.fromEntries(geo.areas.map(a => [a.id, a]));
	const placeById = Object.fromEntries(geo.places.map(p => [p.id, p]));
	const placeByName = Object.fromEntries(geo.places.map(p => [p.name, p]));
	const agentById = Object.fromEntries(agents.map(a => [a.id, a]));
	const clipsOf = { area: id => clips.filter(c => placeByName[c.place]?.area === id), place: id => clips.filter(c => placeByName[c.place]?.id === id) };
	const singleLow = a => a.price.single?.[0] ?? null;
	const fits = a => state.budget == null || (singleLow(a) ?? Infinity) <= state.budget;

	// ── map ────────────────────────────────────────────────
	const cfg = amap ?? await (await window.fetch('/lojo-amap/config')).json();
	if (!cfg.key) throw new Error('AMAP_NOT_CONFIGURED');
	const AMap = await loadAMap(cfg);
	if (disposed) return null;
	const map = new AMap.Map($('.rm-map'), {
		zoom: 13.2, center: [114.04, 22.524], viewMode: '2D', mapStyle: 'amap://styles/whitesmoke',
		features: ['bg', 'road', 'building'], resizeEnable: true, animateEnable: !reduce, jogEnable: !reduce,
	});
	// AMap writes its stylesheet into the document head; inside the site's shadow root we mirror it.
	const shadow = root.getRootNode();

	function copyStyles() {
		if (!(shadow instanceof window.ShadowRoot)) return;
		for (const el of window.document.head.querySelectorAll('style, link[rel=stylesheet]')) {
			if (el.dataset.rmCopied || !(/amap/i.test(el.textContent ?? '') || /amap/i.test(el.href ?? ''))) continue;
			el.dataset.rmCopied = '1';
			root.prepend(el.cloneNode(true));
		}
	}

	const mirror = new MutationObserver(copyStyles);
	mirror.observe(window.document.head, { childList: true });
	copyStyles();

	const areaPolys = {}, areaLabels = {}, labelMarkers = {};
	for (const a of geo.areas) {
		const poly = new AMap.Polygon({ path: a.ring, fillColor: '#8C93AE', fillOpacity: 0.3, strokeColor: '#FFFFFF', strokeWeight: 2, bubble: false, cursor: 'pointer', zIndex: 10 });
		poly.on('click', () => selectArea(a.id));
		const el = window.document.createElement('button');
		el.type = 'button';
		el.className = 'rm-areaLabel';
		el.addEventListener('click', e => { e.stopPropagation(); selectArea(a.id); });
		const m = new AMap.Marker({ position: a.center, content: el, anchor: 'center', zIndex: 120 });
		map.add([poly, m]);
		areaPolys[a.id] = poly;
		areaLabels[a.id] = el;
		labelMarkers[a.id] = m;
	}

	// Neighbouring 片区 (下沙/上沙) sit close together: nudge overlapping labels apart vertically.
	function declutter() {
		const items = geo.areas.map(a => ({ a, el: areaLabels[a.id], p: map.lngLatToContainer(a.center) }));
		const placed = [];
		for (const it of items.sort((x, y) => x.p.y - y.p.y)) {
			const w = it.el.offsetWidth || 70, h = it.el.offsetHeight || 40;
			let dy = 0;
			for (let g = 0; g < 6; g++) {
				const hit = placed.find(q => Math.abs(q.x - it.p.x) < (q.w + w) / 2 + 4 && Math.abs(q.y - (it.p.y + dy)) < (q.h + h) / 2 + 4);
				if (!hit) break;
				dy = hit.y - it.p.y + (hit.h + h) / 2 + 4;
			}
			labelMarkers[it.a.id].setOffset(new AMap.Pixel(0, dy));
			placed.push({ x: it.p.x, y: it.p.y + dy, w, h });
		}
	}

	map.on('moveend', declutter);
	map.on('zoomend', declutter);
	let placeOverlays = [], placePolys = {}, routeOverlays = [], workMarker = null;
	const clearPlaces = () => { map.remove(placeOverlays); placeOverlays = []; placePolys = {}; };
	const clearRoute = () => { map.remove(routeOverlays); routeOverlays = []; };

	// Keep what matters clear of the floating search bar and the sheet.
	function fit(overlays, maxZoom = 16.5) {
		// AMap v2 order: [top, bottom, left, right].
		const avoid = narrow() ? [80, Math.round(root.clientHeight * sheetF) + 16, 20, 20] : [90, 40, 440, 60];
		map.setFitView(overlays, reduce, avoid, maxZoom);
	}

	const fitCity = () => fit(Object.values(areaPolys), 14.2);

	// ── commute: live AMap routes, cached per destination + mode ──
	const routeCache = new Map();
	const cacheKey = (from, mode) => `${state.work.at.join(',')}|${mode}|${from.join(',')}`;
	const toPath = list => (list ?? []).map(p => (Array.isArray(p) ? p : [p.lng, p.lat]));

	function route(from, mode = state.mode) {
		if (!state.work) return Promise.resolve(null);
		const k = cacheKey(from, mode);
		if (routeCache.has(k)) return routeCache.get(k);
		const to = state.work.at;
		const p = new Promise(resolve => {
			try {
				if (mode === 'transit') {
					new AMap.Transfer({ city: '深圳', cityd: '深圳', policy: AMap.TransferPolicy.LEAST_TIME }).search(from, to, (st, res) => {
						const plan = st === 'complete' ? res.plans?.[0] : null;
						if (!plan) {
							// Close enough that AMap offers no transit: walking is the honest answer.
							if (st === 'no_data') route(from, 'walk').then(w => resolve(w && { ...w, mode: 'transit', walkOnly: true }));
							else resolve(null);
							return;
						}
						const segs = plan.segments.map(s => {
							const t = s.transit ?? {};
							const line = t.lines?.[0];
							const path = s.transit_mode === 'WALK' ? toPath(t.path ?? (t.steps ?? []).flatMap(x => x.path ?? [])) : toPath(t.path);
							return { kind: s.transit_mode, line: line ? lineName(line.name) : null, on: t.on_station?.name, path };
						});
						resolve({ mode, min: Math.round(plan.time / 60), walk: plan.walking_distance, cost: plan.cost, segs, legs: segs.filter(s => s.line) });
					});
				} else {
					const Svc = { ebike: AMap.Riding, bike: AMap.Riding, drive: AMap.Driving, walk: AMap.Walking }[mode];
					new Svc(mode === 'drive' ? { policy: AMap.DrivingPolicy.LEAST_TIME } : {}).search(from, to, (st, res) => {
						const r = st === 'complete' ? res.routes?.[0] : null;
						if (!r) { resolve(null); return; }
						const path = toPath((r.rides ?? r.steps ?? []).flatMap(x => x.path ?? []));
						const min = mode === 'ebike' ? Math.round(r.distance / 1000 / 20 * 60 + 3) : Math.round(r.time / 60);
						resolve({ mode, min, km: Math.round(r.distance / 100) / 10, segs: [{ kind: mode, path }], legs: [] });
					});
				}
			} catch { resolve(null); }
		});
		routeCache.set(k, p);
		return p;
	}

	const minutes = {};
	let paintToken = 0;

	async function refreshCommutes() {
		const token = ++paintToken;
		for (const a of geo.areas) minutes[a.id] = undefined;
		paintAreas();
		if (!state.area) renderSheet({ quiet: true });
		if (!state.work) return;
		// Two requests at a time keeps well inside AMap's rate limits.
		const queue = [...geo.areas];
		await Promise.all([0, 1].map(async () => {
			while (queue.length) {
				const a = queue.shift();
				const r = await route(a.center);
				if (token !== paintToken || disposed) return;
				minutes[a.id] = r;
				paintAreas();
				if (!state.area) renderSheet({ quiet: true });
			}
		}));
	}

	function paintAreas() {
		const vals = geo.areas.map(a => minutes[a.id]?.min).filter(v => v != null);
		const lo = Math.min(...vals), hi = Math.max(...vals);
		for (const a of geo.areas) {
			const r = minutes[a.id];
			const t = r && hi > lo ? (r.min - lo) / (hi - lo) : 0.3;
			const color = state.work && r ? mix(...RAMP, t) : '#8C93AE';
			const selected = state.area === a.id;
			areaPolys[a.id].setOptions({
				fillColor: color,
				fillOpacity: state.area ? (selected ? 0.05 : 0.02) : fits(a) ? 0.36 : 0.1,
				strokeColor: selected ? '#14204F' : '#FFFFFF',
				strokeWeight: 2,
				strokeStyle: selected ? 'dashed' : 'solid',
			});
			const el = areaLabels[a.id];
			el.classList.toggle('rm-dim', !fits(a));
			el.classList.toggle('rm-hide', !!state.area);
			el.style.setProperty('--c', state.work && r ? mix(...RAMP, Math.min(t, 0.4)) : '#14204F');
			const value = state.work ? (r ? `${r.min}<small>分钟</small>` : r === null ? '—' : '<i class="rm-dots"></i>') : `${money(singleLow(a))}<small>起</small>`;
			el.innerHTML = `<b>${esc(a.name)}</b><span>${value}</span>`;
		}
		requestAnimationFrame(declutter);
	}

	function drawWork() {
		if (workMarker) map.remove(workMarker);
		workMarker = null;
		if (!state.work) return;
		const el = window.document.createElement('div');
		el.className = 'rm-work';
		el.innerHTML = `<span class="rm-workDot">${icon.work}</span><span class="rm-workName">${esc(state.work.name)}</span>`;
		workMarker = new AMap.Marker({ position: state.work.at, content: el, anchor: 'bottom-center', zIndex: 140 });
		map.add(workMarker);
	}

	function drawRoute(r) {
		clearRoute();
		if (!r) return;
		for (const s of r.segs) {
			if (!s.path?.length) continue;
			const walk = s.kind === 'WALK' || s.kind === 'walk';
			const color = s.line ? (LINE_COLORS[s.line] ?? '#5A6275') : walk ? '#14204F' : '#2340A3';
			if (!walk) routeOverlays.push(new AMap.Polyline({ path: s.path, strokeColor: '#FFFFFF', strokeWeight: 9, lineJoin: 'round', lineCap: 'round', zIndex: 60 }));
			routeOverlays.push(new AMap.Polyline({ path: s.path, strokeColor: color, strokeWeight: walk ? 3 : 5.5, strokeOpacity: walk ? 0.65 : 1, strokeStyle: walk ? 'dashed' : 'solid', strokeDasharray: [4, 6], lineJoin: 'round', lineCap: 'round', zIndex: 61 }));
			if (s.line && s.on) {
				const chip = window.document.createElement('div');
				chip.className = 'rm-legChip';
				chip.style.setProperty('--lc', LINE_COLORS[s.line] ?? '#5A6275');
				chip.innerHTML = `<b>${esc(s.line)}</b>${esc(s.on)}`;
				routeOverlays.push(new AMap.Marker({ position: s.path[0], content: chip, anchor: 'bottom-center', offset: new AMap.Pixel(0, -6), zIndex: 130 }));
			}
		}
		map.add(routeOverlays);
	}

	// ── levels ─────────────────────────────────────────────
	function showPlaces(areaId) {
		clearPlaces();
		const area = areaById[areaId];
		for (const p of area.places.map(id => placeById[id])) {
			const village = p.kind === 'village', on = state.place === p.id;
			const poly = new AMap.Polygon({ path: p.ring, fillColor: village ? '#E8603F' : '#2340A3', fillOpacity: on ? 0.32 : 0.12, strokeColor: village ? '#C9502F' : '#2340A3', strokeWeight: on ? 2.5 : 1.4, strokeStyle: 'dashed', strokeDasharray: [6, 4], bubble: false, cursor: 'pointer', zIndex: on ? 25 : 20 });
			poly.on('click', () => selectPlace(p.id));
			const el = window.document.createElement('button');
			el.type = 'button';
			el.className = `rm-placeLabel${on ? ' rm-on' : ''}`;
			// Inside 下沙, "六坊" reads faster than "下沙六坊"; other names stay whole.
			const label = /^.+[一二三四五六七八九]坊$/.test(p.name) && p.name.startsWith(area.name) ? p.name.slice(area.name.length) : p.name;
			el.innerHTML = `${esc(label)}${records[p.name]?.length ? `<i>${records[p.name].length}</i>` : ''}`;
			el.addEventListener('click', e => { e.stopPropagation(); selectPlace(p.id); });
			placeOverlays.push(poly, new AMap.Marker({ position: p.center, content: el, anchor: 'center', zIndex: on ? 125 : 110 }));
			placePolys[p.id] = poly;
		}
		map.add(placeOverlays);
	}

	async function selectArea(id, { back = false } = {}) {
		state.area = id;
		state.place = null;
		toggleMenu(false);
		paintAreas();
		showPlaces(id);
		setSheet(narrow() ? 0.5 : null);
		renderSheet({ dir: back ? 'back' : 'fwd' });
		fit([areaPolys[id]]);
		const r = await route(areaById[id].center);
		if (state.area === id && !state.place) drawRoute(r);
	}

	async function selectPlace(id) {
		const p = placeById[id];
		state.area = p.area;
		state.place = id;
		toggleMenu(false);
		paintAreas();
		showPlaces(p.area);
		setSheet(narrow() ? 0.5 : null);
		renderSheet({ dir: 'fwd' });
		fit([placePolys[id]], 17.4);
		const r = await route(p.center);
		if (state.place === id) drawRoute(r);
	}

	function goCity() {
		state.area = null;
		state.place = null;
		clearPlaces();
		clearRoute();
		paintAreas();
		setSheet(narrow() ? 0.42 : null);
		renderSheet({ dir: 'back' });
		fitCity();
	}

	// ── top bar: where you work + how you get there ────────
	function renderTop() {
		const m = MODES.find(x => x.id === state.mode);
		$('.rm-askText').innerHTML = state.work ? `<small>上班地点</small><b>${esc(state.work.name)}</b>` : '<b class="rm-placeholder">你在哪上班？</b>';
		$('.rm-mode').innerHTML = `${icon[m.id]}<span>${m.label}</span>${icon.down}`;
		$('.rm-mode').hidden = !state.work;
		$('.rm-menu').innerHTML = MODES.map(x => `<button type="button" role="option" class="rm-menuItem${x.id === state.mode ? ' rm-on' : ''}" aria-selected="${x.id === state.mode}" data-pick-mode="${x.id}">${icon[x.id]}<span><b>${x.label}</b><small>${x.hint}</small></span>${x.id === state.mode ? icon.check : ''}</button>`).join('');
	}

	function toggleMenu(open = $('.rm-menu').hidden) {
		$('.rm-menu').hidden = !open;
		$('.rm-mode').setAttribute('aria-expanded', String(open));
	}

	async function setMode(mode) {
		state.mode = mode;
		persist();
		renderTop();
		clearRoute();
		const thing = state.place ? placeById[state.place] : state.area ? areaById[state.area] : null;
		if (thing) { renderSheet({ quiet: true }); route(thing.center).then(r => { if (state.mode === mode) drawRoute(r); }); }
		await refreshCommutes();
	}

	root.addEventListener('click', e => {
		const t = e.target.closest('[data-mode],[data-pick-mode],[data-search],[data-close-search],[data-close-pop],[data-close-player]');
		if (!t) { if (!$('.rm-menu').hidden && !e.target.closest('.rm-menu')) toggleMenu(false); return; }
		if (t.matches('[data-mode]')) toggleMenu();
		else if (t.matches('[data-pick-mode]')) { toggleMenu(false); if (state.mode !== t.dataset.pickMode) setMode(t.dataset.pickMode); } else if (t.matches('[data-search]')) openSearch();
		else if (t.matches('[data-close-search]')) closeSearch();
		else if (t.matches('[data-close-pop]')) closePop();
		else if (t.matches('[data-close-player]')) closePlayer();
	});

	// ── address search: AMap 输入提示, any place in Shenzhen ──
	const auto = new AMap.AutoComplete({ city: '深圳', citylimit: true });
	const placeSearch = new AMap.PlaceSearch({ city: '深圳', citylimit: true, pageSize: 1 });
	let searchTimer = 0, searchSeq = 0;
	const input = $('.rm-search input');

	function openSearch() {
		toggleMenu(false);
		$('.rm-search').hidden = false;
		input.value = '';
		renderSuggestions([]);
		requestAnimationFrame(() => input.focus());
	}

	function closeSearch() { $('.rm-search').hidden = true; input.blur(); }

	function renderSuggestions(tips, note = '') {
		const list = $('.rm-searchList');
		if (!input.value.trim()) {
			const recent = saved.recent ?? [];
			list.innerHTML = recent.length
				? `<p class="rm-listHead">最近</p>${recent.map((r, i) => `<button type="button" class="rm-tip" data-recent="${i}">${icon.pin}<span><b>${esc(r.name)}</b><small>${esc(r.district)}</small></span></button>`).join('')}`
				: '<p class="rm-empty">输入公司、园区或写字楼的名字<br>例如：腾讯滨海大厦、平安金融中心</p>';
			return;
		}
		const text = t => [t.district, t.address].filter(x => typeof x === 'string' && x).join(' · ');
		list.innerHTML = note ? `<p class="rm-empty">${esc(note)}</p>` : tips.map((t, i) => `<button type="button" class="rm-tip" data-tip="${i}">${icon.pin}<span><b>${esc(t.name)}</b><small>${esc(text(t))}</small></span></button>`).join('');
		list.querySelectorAll('[data-tip]').forEach(b => b.addEventListener('click', () => pickTip(tips[Number(b.dataset.tip)])));
	}

	input.addEventListener('input', () => {
		window.clearTimeout(searchTimer);
		const q = input.value.trim();
		if (!q) { renderSuggestions([]); return; }
		searchTimer = window.setTimeout(() => {
			const seq = ++searchSeq;
			auto.search(q, (st, res) => {
				if (seq !== searchSeq) return;
				const tips = st === 'complete' ? (res.tips ?? []).filter(t => t.id || t.location) : [];
				renderSuggestions(tips, tips.length ? '' : st === 'error' ? '搜索暂时不可用，请稍后重试' : '没有找到这个地方，换个说法试试');
			});
		}, 220);
	});
	$('.rm-searchList').addEventListener('click', e => {
		const b = e.target.closest('[data-recent]');
		if (b) setWork((saved.recent ?? [])[Number(b.dataset.recent)]);
	});

	function pickTip(t) {
		const finish = loc => {
			if (!loc) { renderSuggestions([], '这个地点没有坐标，换一个试试'); return; }
			setWork({ name: cleanName(t.name), district: typeof t.district === 'string' ? t.district : '', at: [loc.lng, loc.lat] });
		};
		if (t.location?.lng) finish(t.location);
		else placeSearch.getDetails(t.id, (st, res) => finish(st === 'complete' ? res.poiList?.pois?.[0]?.location : null));
	}

	function setWork(w) {
		state.work = w;
		saved.recent = [w, ...(saved.recent ?? []).filter(r => r.name !== w.name)].slice(0, 5);
		persist();
		closeSearch();
		renderTop();
		drawWork();
		clearRoute();
		if (state.area) goCity(); else fitCity();
		refreshCommutes();
	}

	// ── sheet ──────────────────────────────────────────────
	const sheet = $('.rm-sheet');
	let sheetF = 0.42;

	function setSheet(f) { if (f == null) return; sheetF = f; root.style.setProperty('--sheet', `${Math.round(f * 100)}%`); }

	setSheet(narrow() ? 0.42 : null);

	function renderSheet({ dir = 'none', quiet = false } = {}) {
		const scroller = $('.rm-sheetScroll');
		const keep = quiet ? scroller.scrollTop : 0;
		$('.rm-sheetBody').innerHTML = `<div class="rm-view${dir === 'fwd' ? ' rm-inFwd' : dir === 'back' ? ' rm-inBack' : ''}">${state.place ? placeView() : state.area ? areaView() : cityView()}</div>`;
		scroller.scrollTop = keep;
		wire();
		const cta = $('.rm-sheetCta');
		if (state.area) cta.innerHTML = `<button type="button" class="rm-cta" data-book>${state.place ? '预约看这里' : '预约带看'}</button>`;
		else if (!state.work) cta.innerHTML = `<button type="button" class="rm-cta rm-ctaDark" data-search>${icon.search}<span>输入上班地点</span></button>`;
		else cta.innerHTML = '';
		cta.classList.toggle('rm-show', !!cta.innerHTML);
		cta.querySelector('[data-book]')?.addEventListener('click', () => openBooking(null));
	}

	const budgetChip = () => `<button type="button" class="rm-chipBtn${state.budget ? ' rm-on' : ''}" data-budget>${state.budget ? `单间 ${money(state.budget)} 以内` : '单间预算'}${icon.down}</button>`;

	function routeSummary(r) {
		if (r === undefined) return '<i class="rm-skel"></i>';
		if (r === null) return '暂无路线';
		if (r.walkOnly) return '步行可达';
		if (r.mode === 'transit') return r.legs.length ? r.legs.map(l => esc(l.line)).join(' → ') : '步行';
		return `${r.km} 公里`;
	}

	function cityView() {
		const list = [...geo.areas].sort((a, b) => state.work ? (minutes[a.id]?.min ?? 999) - (minutes[b.id]?.min ?? 999) : (singleLow(a) ?? 1e9) - (singleLow(b) ?? 1e9));
		const mode = MODES.find(m => m.id === state.mode);
		const head = state.work
			? `<h2 class="rm-h">${mode.label}去${esc(state.work.name)}</h2>`
			: '<h2 class="rm-h">先说说你在哪上班</h2><p class="rm-lede">我们用高德实时算出每个片区到公司要多久，再看房租。</p>';
		return `${head}
		<div class="rm-filters">${budgetChip()}<span class="rm-count">福田南 · ${geo.areas.length} 个片区</span></div>
		<div class="rm-list">${list.map(a => {
			const r = minutes[a.id];
			return `<button type="button" class="rm-row${fits(a) ? '' : ' rm-dim'}" data-area="${a.id}">
				<span class="rm-rowMain"><b>${esc(a.name)}</b><small>${state.work ? routeSummary(r) : esc(a.metro)}</small></span>
				<span class="rm-rowSide">${state.work ? `<b class="rm-min">${r ? `${r.min}<small>分钟</small>` : r === null ? '—' : '<i class="rm-skel rm-skelNum"></i>'}</b>` : ''}<small>单间 ${money(singleLow(a))} 起${fits(a) ? '' : ' · 超预算'}</small></span>
			</button>`;
		}).join('')}</div>`;
	}

	function crumbs() {
		const a = areaById[state.area];
		return `<nav class="rm-crumbs"><button type="button" class="rm-iconBtn" data-nav="${state.place ? 'area' : 'city'}" aria-label="返回">${icon.back}</button><span>${state.place ? esc(a.name) : '全部片区'}</span></nav>`;
	}

	const commuteSlot = () => (state.work ? '<div class="rm-commute" data-commute><div class="rm-cmRow"><i class="rm-skel rm-skelBig"></i><i class="rm-skel"></i></div></div>' : `<button type="button" class="rm-commute rm-commuteEmpty" data-search>${icon.work}<span>输入上班地点，看从这里过去要多久</span></button>`);

	function fillCommute(thing) {
		const host = $('[data-commute]');
		if (!host) return;
		const mode = MODES.find(m => m.id === state.mode);
		route(thing.center).then(r => {
			if (!host.isConnected) return;
			if (!r) { host.innerHTML = `<p class="rm-muted">${mode.label}暂时没有可用路线</p>`; return; }
			const legs = r.walkOnly ? '<span class="rm-muted">步行可达</span>'
				: r.mode === 'transit' ? (r.legs.length ? r.legs.map(l => `<span class="rm-line${l.kind === 'BUS' ? ' rm-bus' : ''}" style="--lc:${LINE_COLORS[l.line] ?? '#5A6275'}">${l.kind === 'BUS' ? '公交 ' : ''}${esc(l.line)}</span>`).join('<i>→</i>') : '<span class="rm-muted">步行</span>')
				: `<span class="rm-muted">${r.km} 公里</span>`;
			const sub = r.mode === 'transit' && r.legs[0] ? `${esc(r.legs[0].on)}站上车 · 步行约 ${Math.max(1, Math.round((r.walk ?? 0) / 75))} 分钟${r.cost ? ` · ¥${r.cost}` : ''}` : mode.hint;
			host.innerHTML = `<div class="rm-cmRow"><span class="rm-cmIcon">${icon[r.mode]}</span><b class="rm-cmMin">${r.min}<small>分钟</small></b><span class="rm-cmLegs">${legs}</span></div><p class="rm-cmSub">到${esc(state.work.name)} · ${sub}</p>`;
		});
	}

	function priceLine(list) {
		const rng = (xs, k) => { const v = xs.map(p => p.price[k]).filter(Boolean); return v.length ? [Math.min(...v), Math.max(...v)] : null; };
		const fmt = r => r ? (r[0] === r[1] ? money(r[0]) : `${money(r[0])}–${Math.round(r[1]).toLocaleString('en-US')}`) : '—';
		const vill = list.filter(p => p.kind === 'village'), est = list.filter(p => p.kind === 'estate');
		const s = rng(vill, 'single');
		const tag = state.budget && s ? `<em class="${s[0] <= state.budget ? 'rm-ok' : 'rm-over'}">${s[0] <= state.budget ? '预算内有' : '超预算'}</em>` : '';
		return `<div class="rm-prices">
			<div><small>城中村单间${tag}</small><b>${fmt(s)}</b></div>
			<div><small>城中村一房</small><b>${fmt(rng(vill, 'one'))}</b></div>
			<div><small>小区一房</small><b>${fmt(rng(est, 'one'))}</b></div>
		</div><p class="rm-source">${list.some(p => p.price.mock) ? '价格含示例数据' : '深圳市住建局 城中村租赁参考价'}</p>`;
	}

	function clipStrip(list) {
		if (!list.length) return '';
		return `<section class="rm-sec"><h3>实拍<small>顾问拍摄 · 示例</small></h3><div class="rm-strip">${list.map(c => `<button type="button" class="rm-clip" data-clip="${c.id}"><img src="${asset(c.id + '.jpg')}" alt="" loading="lazy"><span><b>${c.rent ? money(c.rent) : '外景'}</b>${esc(c.place)}</span></button>`).join('')}</div></section>`;
	}

	function agentRows(areaId) {
		return `<section class="rm-sec"><h3>带你看房的顾问<small>示例</small></h3>${agents.filter(a => a.areas.includes(areaId)).map(a => `<button type="button" class="rm-agent" data-book="${a.id}">
			<img src="${asset(a.photo)}" alt=""><span class="rm-rowMain"><b>${esc(a.name)}<i class="rm-verified">实名</i></b><small>服务费 ${esc(a.promise.fee)} · 纠纷 ${a.stats.disputes} · 约 ${a.stats.reply} 分钟回复</small></span><span class="rm-chev">${icon.back}</span>
		</button>`).join('')}</section>`;
	}

	function areaView() {
		const a = areaById[state.area], ps = a.places.map(id => placeById[id]);
		return `${crumbs()}<h2 class="rm-title">${esc(a.name)}</h2><p class="rm-lede">${esc(a.portrait)}</p>
		${commuteSlot()}${priceLine(ps)}
		<section class="rm-sec"><h3>城中村和小区<small>${ps.length} 个</small></h3>
			${ps.map(p => `<button type="button" class="rm-placeRow" data-place="${p.id}"><i class="rm-kind rm-${p.kind}"></i><span class="rm-rowMain"><b>${esc(p.name)}</b><small>${p.kind === 'village' ? '城中村' : '小区'}${records[p.name]?.length ? ` · <em>${records[p.name].length} 条租客记录</em>` : ''}</small></span><span class="rm-rowSide"><small>${p.price.single ? `单间 ${money(p.price.single)}` : `一房 ${money(p.price.one)}`}</small></span></button>`).join('')}
		</section>
		${clipStrip(clipsOf.area(a.id))}${agentRows(a.id)}`;
	}

	function placeView() {
		const p = placeById[state.place], own = records[p.name] ?? [];
		return `${crumbs()}<h2 class="rm-title">${esc(p.name)}</h2>
		<p class="rm-tags"><span>${p.kind === 'village' ? '城中村' : '小区'}</span>${p.outline === 'osm' ? '' : '<span>边界为示意</span>'}</p>
		${commuteSlot()}
		<div class="rm-prices rm-prices2">
			<div><small>${p.price.single ? '单间' : '一房一厅'}</small><b>${money(p.price.single ?? p.price.one)}</b></div>
			<div><small>${p.price.single ? '一房一厅' : '两房'}</small><b>${money(p.price.single ? p.price.one : p.price.two)}</b></div>
		</div>
		<p class="rm-source">${p.price.mock ? '价格为示例' : `深圳市住建局 城中村租赁参考价（${esc(p.official)}）`}</p>
		<section class="rm-sec"><h3>租客记录<small>只列事实 · 示例</small></h3>
			${own.length ? own.map(r => `<div class="rm-record"><span>${esc(r.tag)}</span><p>${esc(r.text)}<small>${esc(r.when)}</small></p></div>`).join('') : '<p class="rm-muted">还没有记录。住过这里？写下一条事实，帮下一个人少踩坑。</p>'}
		</section>
		${clipStrip(clipsOf.place(p.id))}${agentRows(p.area)}`;
	}

	function wire() {
		$$('.rm-sheetBody [data-area]').forEach(b => b.addEventListener('click', () => selectArea(b.dataset.area)));
		$$('.rm-sheetBody [data-place]').forEach(b => b.addEventListener('click', () => selectPlace(b.dataset.place)));
		$$('.rm-sheetBody [data-nav]').forEach(b => b.addEventListener('click', () => (b.dataset.nav === 'city' ? goCity() : selectArea(state.area, { back: true }))));
		$$('.rm-sheetBody [data-book]').forEach(b => b.addEventListener('click', () => openBooking(b.dataset.book)));
		$$('.rm-sheetBody [data-budget]').forEach(b => b.addEventListener('click', openBudget));
		$$('.rm-sheetBody [data-clip]').forEach(b => b.addEventListener('click', () => {
			const list = state.place ? clipsOf.place(state.place) : clipsOf.area(state.area);
			openPlayer(list, list.findIndex(c => c.id === b.dataset.clip));
		}));
		const thing = state.place ? placeById[state.place] : state.area ? areaById[state.area] : null;
		if (thing && state.work) fillCommute(thing);
	}

	// ── drag the sheet (phones) ────────────────────────────
	{
		const grip = $('.rm-grip');
		let y0 = 0, f0 = 0, drag = false;
		grip.addEventListener('pointerdown', e => { drag = true; y0 = e.clientY; f0 = sheetF; sheet.classList.add('rm-dragging'); grip.setPointerCapture(e.pointerId); });
		grip.addEventListener('pointermove', e => { if (drag) root.style.setProperty('--sheet', `${Math.max(14, Math.min(90, (f0 + (y0 - e.clientY) / root.clientHeight) * 100))}%`); });
		grip.addEventListener('pointerup', e => {
			if (!drag) return;
			drag = false;
			sheet.classList.remove('rm-dragging');
			const f = f0 + (y0 - e.clientY) / root.clientHeight;
			const mid = state.area ? 0.5 : 0.42;
			// A tap on the handle toggles between half and full.
			setSheet(Math.abs(y0 - e.clientY) < 6 ? (f0 < 0.6 ? 0.9 : mid) : [0.16, mid, 0.9].reduce((b, s) => Math.abs(s - f) < Math.abs(b - f) ? s : b));
		});
	}

	// ── popovers: budget, booking ──────────────────────────
	const pop = $('.rm-pop'), popCard = $('.rm-popCard');
	const openPop = html => { popCard.innerHTML = html; pop.hidden = false; };
	const closePop = () => { pop.hidden = true; };

	function openBudget() {
		openPop(`<h3>单间预算</h3><p class="rm-muted">超出预算的片区会变浅，不会被藏起来。</p>
			<div class="rm-opts">${[null, ...BUDGETS].map(v => `<button type="button" class="rm-opt${state.budget === v ? ' rm-on' : ''}" data-b="${v ?? ''}">${v ? `${money(v)} 以内` : '不限'}</button>`).join('')}</div>`);
		popCard.querySelectorAll('[data-b]').forEach(b => b.addEventListener('click', () => {
			state.budget = b.dataset.b ? Number(b.dataset.b) : null;
			persist();
			closePop();
			paintAreas();
			renderSheet({ quiet: true });
		}));
	}

	const slots = ['今晚', '明天中午', '明天晚上', '周六', '周日'];

	function openBooking(agentId, clipId) {
		const clip = clipId && clips.find(c => c.id === clipId);
		const areaId = state.area ?? placeByName[clip?.place]?.area;
		const pool = agents.filter(a => a.areas.includes(areaId));
		let pick = agentById[agentId] ?? pool[0], slot = slots[1];
		const where = clip?.place ?? (state.place ? placeById[state.place].name : areaById[areaId].name);
		const promise = a => `<p class="rm-label">${esc(a.name)} 的承诺</p><ul class="rm-promise">${a.promise.items.map(t => `<li>${icon.check}${esc(t)}</li>`).join('')}</ul>`;
		openPop(`<h3>预约看${esc(where)}</h3><p class="rm-muted">通过 LOJO 发送，不公开你的电话</p>
			<div class="rm-agentPick">${pool.map(a => `<button type="button" class="rm-opt rm-optAgent${a.id === pick.id ? ' rm-on' : ''}" data-ag="${a.id}"><img src="${asset(a.photo)}" alt=""><span><b>${esc(a.name)}</b><small>服务费 ${esc(a.promise.fee)}</small></span></button>`).join('')}</div>
			<div class="rm-promiseBox">${promise(pick)}</div>
			<p class="rm-label">什么时候方便</p><div class="rm-opts rm-optsRow">${slots.map(s => `<button type="button" class="rm-opt${s === slot ? ' rm-on' : ''}" data-slot="${s}">${s}</button>`).join('')}</div>
			<textarea class="rm-note" rows="2" placeholder="想看什么样的？比如：朝南单间，能养猫">${clip ? `想看视频里这套：${esc(clip.title)}` : ''}</textarea>
			<button type="button" class="rm-cta" data-send>发送预约</button>`);
		popCard.querySelectorAll('[data-ag]').forEach(b => b.addEventListener('click', () => {
			pick = agentById[b.dataset.ag];
			popCard.querySelectorAll('[data-ag]').forEach(x => x.classList.toggle('rm-on', x === b));
			popCard.querySelector('.rm-promiseBox').innerHTML = promise(pick);
		}));
		popCard.querySelectorAll('[data-slot]').forEach(b => b.addEventListener('click', () => { slot = b.dataset.slot; popCard.querySelectorAll('[data-slot]').forEach(x => x.classList.toggle('rm-on', x === b)); }));
		popCard.querySelector('[data-send]').addEventListener('click', () => {
			popCard.innerHTML = `<div class="rm-done"><span class="rm-doneMark">${icon.check}</span><h3>已发给${esc(pick.name)}</h3><p class="rm-muted">${esc(slot)} · 一般 ${pick.stats.reply} 分钟内回复（示例）</p><button type="button" class="rm-cta" data-close-pop>好的</button></div>`;
		});
	}

	// ── vertical video player ──────────────────────────────
	const player = $('.rm-player'), track = $('.rm-playerTrack');
	let pList = [], pIndex = 0, wheelLock = 0, ty0 = null;

	function openPlayer(list, index) {
		pList = list;
		pIndex = Math.max(0, index);
		track.innerHTML = list.map((c, i) => {
			const ag = agentById[c.agent];
			return `<div class="rm-slide" style="top:${i * 100}%"><video src="${asset(c.id + '.mp4')}" poster="${asset(c.id + '.jpg')}" muted loop playsinline preload="${Math.abs(i - pIndex) <= 1 ? 'auto' : 'none'}"></video>
				<div class="rm-slideMeta"><p class="rm-slideWhere">${esc(c.place)} · 拍摄于 ${esc(c.shot)}</p><h4>${esc(c.title)}</h4><p class="rm-slidePrice">${c.rent ? `<b>${money(c.rent)}</b> /月` : '外景'}${c.size ? ` · ${c.size}㎡` : ''}</p>
				<button type="button" class="rm-slideAgent" data-from-clip="${c.id}" data-ag="${ag.id}"><img src="${asset(ag.photo)}" alt=""><span>${esc(ag.name)} 拍摄<b>找 TA 带看</b></span></button>
				<p class="rm-slideNote">示例素材 · 房源可能已租出</p></div></div>`;
		}).join('');
		track.style.transform = `translateY(${-pIndex * 100}%)`;
		player.hidden = false;
		requestAnimationFrame(() => player.classList.add('rm-open'));
		track.querySelectorAll('[data-from-clip]').forEach(b => b.addEventListener('click', () => { closePlayer(); openBooking(b.dataset.ag, b.dataset.fromClip); }));
		play();
	}

	function play() { track.querySelectorAll('video').forEach((v, i) => { if (Math.abs(i - pIndex) <= 1) v.preload = 'auto'; if (i === pIndex) { v.currentTime = 0; v.play().catch(() => {}); } else v.pause(); }); }

	function go(d) { const n = Math.max(0, Math.min(pList.length - 1, pIndex + d)); if (n === pIndex) return; pIndex = n; track.style.transform = `translateY(${-pIndex * 100}%)`; play(); }

	function closePlayer() {
		player.classList.remove('rm-open');
		track.querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); });
		later(() => { player.hidden = true; track.innerHTML = ''; }, reduce ? 0 : 300);
	}

	player.addEventListener('wheel', e => { e.preventDefault(); const now = Date.now(); if (now - wheelLock < 600 || Math.abs(e.deltaY) < 12) return; wheelLock = now; go(e.deltaY > 0 ? 1 : -1); }, { passive: false });
	player.addEventListener('touchstart', e => { ty0 = e.touches[0].clientY; }, { passive: true });
	player.addEventListener('touchend', e => { if (ty0 == null) return; const dy = e.changedTouches[0].clientY - ty0; ty0 = null; if (Math.abs(dy) > 50) go(dy < 0 ? 1 : -1); });
	const onKey = e => {
		if (e.key !== 'Escape') return;
		if (!player.hidden) closePlayer(); else if (!pop.hidden) closePop(); else if (!$('.rm-search').hidden) closeSearch(); else toggleMenu(false);
	};
	window.addEventListener('keydown', onKey);

	// ── boot ───────────────────────────────────────────────
	renderTop();
	drawWork();
	paintAreas();
	renderSheet();
	map.on('complete', () => { copyStyles(); fitCity(); });
	if (state.work) refreshCommutes();

	return {
		map, state, selectArea, selectPlace, goCity, setWork, setMode, openSearch,
		resize() { map.resize?.(); },
		destroy() {
			if (disposed) return;
			disposed = true;
			timers.forEach(t => window.clearTimeout(t));
			window.clearTimeout(searchTimer);
			window.removeEventListener('keydown', onKey);
			mirror.disconnect();
			ro.disconnect();
			track.querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); });
			map.destroy();
			container.innerHTML = '';
		},
	};
}
