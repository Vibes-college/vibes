/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// Gate route map (闯关线路图) for course packs with META.kind 'gates' (IELTS). Renders inside the ShadowRoot owned by pages/lojo/route.vue.
// Every stop is a gate with one short test: pass it to unlock the next stop, or jump ahead. Progress comes from the server
// (bridge.progress → lojo/gates/progress) and the gates run on their own page (bridge.openGate → /gate/<course>/<gate>),
// as does a line's placement test (/gate/<course>/placement-<n>), offered until the learner has placed or passed a stop on it;
// the account registry (bridge.load / bridge.save) only remembers that the welcome card and the tour were seen.
// A course with a TOUR script (courses/<id>/text.js) opens with it, as the AP maps did (runtime.js): the whole map first, a
// little train riding the lines with one caption at a time, from the whole map to each line, ending with what to do first.
// A stop's 同路人 (who else tried it lately) come from bridge.peers → lojo/gates/peers; the server decides who may show.
// A pack may have a WARMUP line (IELTS: 0 号线 · 机考打字): not a gate line but a short one on its own page, listed first
// and offered to a newcomer before the placement test; its progress comes from bridge.warmup, its page opens with bridge.openPath.
// Shares panzoom.js and route.css with the topic map (runtime.js); the gate-only pieces are in gate-map.css.
import { PanZoom } from './panzoom.js';
import { GATE_UI } from './gate-strings.js';
import baseCss from './route.css?inline';
import css from './gate-map.css?inline';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// band labels: offset from the stop and text-anchor, per side
const LAB = { n: [0, -32, 'middle'], s: [0, 52, 'middle'], e: [32, 9, 'start'], w: [-32, 9, 'end'], ne: [24, -24, 'start'], nw: [-24, -24, 'end'], se: [24, 44, 'start'], sw: [-24, 44, 'end'] };
// interchange labels are two lines, the band and then the name; this is where the band line sits
const IXLAB = { ne: [40, -66, 'start'], nw: [-40, -66, 'end'], se: [40, 62, 'start'], sw: [-40, 62, 'end'], n: [0, -70, 'middle'], s: [0, 64, 'middle'], e: [44, -4, 'start'], w: [-44, -4, 'end'] };
const STATES = ['passed', 'open', 'locked', 'soon'];
// an interchange is drawn once; when its two lines disagree, it shows the state that needs attention first
const RANK = { open: 3, passed: 2, locked: 1, soon: 0 };
const COLOR = n => `var(--l${n})`;
// 词汇、语法两条线的站有自己的页面：先在词表上练、先看讲解，再闯关
const STUDY = { vocab: { path: '/apps/vocab/', icon: 'vocabulary' }, grammar: { path: '/apps/grammar/', icon: 'book-2' } };
const pathD = (p, r = 28) => {
	let d = `M${p[0][0]} ${p[0][1]}`;
	for (let i = 1; i < p.length; i++) {
		const [x, y] = p[i];
		if (i < p.length - 1) {
			const [px, py] = p[i - 1], [nx, ny] = p[i + 1], l1 = Math.hypot(x - px, y - py), l2 = Math.hypot(nx - x, ny - y), rr = Math.min(r, l1 / 2, l2 / 2);
			d += ` L${(x - (x - px) / l1 * rr).toFixed(1)} ${(y - (y - py) / l1 * rr).toFixed(1)} Q${x} ${y} ${(x + (nx - x) / l2 * rr).toFixed(1)} ${(y + (ny - y) / l2 * rr).toFixed(1)}`;
		} else d += ` L${x} ${y}`;
	}
	return d;
};
const lockG = (x, y, s = 1) => `<g class="glock" transform="translate(${x} ${y}) scale(${s})"><path d="M-3.6 -1.5 V-4.4 A3.6 3.6 0 0 1 3.6 -4.4 V-1.5"/><rect x="-6" y="-1.5" width="12" height="9" rx="2"/></g>`;
const checkP = (x, y, s = 1) => `<path d="M${x - 7.5 * s} ${y + .5 * s} l${5 * s} ${5 * s} l${10 * s} ${-11 * s}" class="chk"/>`;
const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const NS = 'http://www.w3.org/2000/svg';

function normalize(raw) {
	const s = raw && typeof raw === 'object' ? raw : {};
	// toured: the tour was watched or skipped (added 2026-11-01, so everyone who had only seen the old card gets it once)
	return { onboarded: !!s.onboarded, hinted: !!s.hinted, toured: !!s.toured };
}

// course: a gate course pack (courses/<id>/index.js); catalog: [{ id, short:{zh,en}, ready }] for the course chips
export async function mount(shadow, bridge, course, catalog = []) {
	const { META, LINES, INTERCHANGES = [], CANVAS, POS, PATHS, TAGPOS = {}, BBOX, WARMUP = null } = course;
	const LANG = bridge.lang === 'en' ? 'en' : 'zh';
	const T = k => course.TEXT[LANG][k] ?? GATE_UI[LANG][k];
	const L = o => (o && (o[LANG] ?? o.zh)) || '';
	// the course's tour script (courses/<id>/text.js TOUR); without one the map keeps its single welcome card
	const X = course.TOUR ? course.TOUR[LANG] ?? course.TOUR.zh : null;
	const icon = name => `<i class="ti" style="--i:url(${bridge.assets}icons/${name}.svg)"></i>`;

	/* ---------- stops ---------- */
	const NODES = {}, ORDER = [], IX = {};
	LINES.forEach(l => l.stations.forEach((s, i) => { NODES[s.id] = { ...s, n: l.n, i, line: l }; ORDER.push(s.id); }));
	INTERCHANGES.forEach(x => x.ids.forEach(id => { IX[id] = x; }));
	const FIRST = (LINES.find(l => l.live) || LINES[0]).stations[0].id;
	// an interchange's gate is named after its first stop (2.4 → 1.4)
	const gateOf = id => IX[id] ? IX[id].ids[0] : id;
	const otherOf = id => IX[id] ? IX[id].ids.find(i => i !== id) : null;
	const band = id => Number(NODES[id].band).toFixed(1);
	const lineName = id => esc(L(NODES[id].line));
	const stTitle = id => T('stTitle')(lineName(id), band(id));
	const prevOf = id => { const n = NODES[id]; return n.i > 0 ? n.line.stations[n.i - 1].id : null; };
	const nextOf = id => { const n = NODES[id]; return n.line.stations[n.i + 1]?.id ?? null; };
	// one hashtag per stop, the same scheme as the topic maps (#IELTS_1_3); platform notes also flow into the timeline
	const tagOf = id => `${META.tag}_${id.replace('.', '_')}`;

	/* ---------- progress, from the server ---------- */
	// A stop missing from the reply (sets not imported yet, or a failed call) is "soon": no sets, no attempts.
	let SP = {}, LP = {}, LAST = null;
	function absorb(p) {
		const by = {};
		(p && Array.isArray(p.stations) ? p.stations : []).forEach(s => { if (s && NODES[s.id]) by[s.id] = s; });
		SP = {};
		ORDER.forEach(id => {
			const s = by[id];
			SP[id] = s ? { state: STATES.includes(s.state) ? s.state : 'soon', sets: +s.sets || 0, attempts: +s.attempts || 0, best: s.best ?? null, total: s.total ?? null, pass: s.pass ?? null,
				time: s.time ?? null, failStreak: +s.failStreak || 0, passedAt: s.passedAt || null, via: s.via || null }
				: { state: 'soon', sets: 0, attempts: 0, best: null, total: null, pass: null, time: null, failStreak: 0, passedAt: null, via: null };
		});
		const rows = p && Array.isArray(p.lines) ? p.lines : [];
		LP = {};
		LINES.forEach(l => {
			const ids = l.stations.map(s => s.id), r = rows.find(x => x && x.line === l.n);
			LP[l.n] = { live: r ? !!r.live && !!l.live : !!l.live && ids.some(id => SP[id].state !== 'soon'),
				current: r && NODES[r.current] ? r.current : ids.find(id => SP[id].state === 'open') ?? null,
				passed: ids.filter(id => SP[id].state === 'passed').length, total: ids.length,
				placement: { available: !!r?.placement?.available, station: NODES[r?.placement?.station] ? r.placement.station : null } };
		});
		LAST = p && p.last && NODES[p.last.station] ? p.last : null;
	}
	// the warm-up line's progress: { passed, total, done }, or null while unknown
	let WP = null;
	const absorbWarm = w => { if (w && typeof w === 'object') WP = { passed: Array.isArray(w.passed) ? w.passed.length : +w.passed || 0, total: +w.total || WARMUP.stops, done: !!w.done }; };
	// a failed read keeps what is on screen
	const warmNow = () => WARMUP && bridge.warmup ? bridge.warmup(WARMUP.id).catch(() => null) : Promise.resolve(null);
	const passedN = () => ORDER.filter(id => SP[id].state === 'passed').length;
	// attempts belong to a gate; the two stops of an interchange share theirs
	const triesN = () => { const g = {}; ORDER.forEach(id => { g[gateOf(id)] = Math.max(g[gateOf(id)] || 0, SP[id].attempts); }); return Object.values(g).reduce((a, b) => a + b, 0); };
	// "I'm here": the next gate on the line you tried last, or the first stop for a newcomer; nothing while no gate is open yet
	function pinStop() {
		if (!ORDER.some(id => SP[id].state !== 'soon')) return null;
		const ln = LAST ? NODES[LAST.station].n : (LINES.find(l => LP[l.n].live) || LINES[0]).n;
		return LP[ln].current || (LAST ? LAST.station : FIRST);
	}
	// a line's placement test ("placement-1"), offered until the learner has placed on the line or passed a stop of it
	const placeTest = n => { const lp = LP[n]; return lp && lp.live && lp.placement.available && !lp.placement.station && !lp.passed ? `placement-${n}` : null; };
	const placeCard = (pt, button) => `<div class="gst place"><div class="gst-h">${icon('compass')}<b>${T('placeQ')}</b></div><p>${T('placeS')}</p>${button ? `<button class="pillbtn" data-place="${pt}">${T('placeGo')} →</button>` : ''}</div>`;
	const shownAt = id => IX[id] ? IX[id].ids.reduce((a, b) => RANK[SP[b].state] > RANK[SP[a].state] ? b : a) : id;
	const behind = id => NODES[id].line.stations.slice(0, NODES[id].i).filter(s => SP[s.id].state !== 'passed').length;

	/* ---------- saved to the account: only the welcome card and the phone hint ---------- */
	const [saved, first, warm] = await Promise.all([bridge.load().catch(() => null), bridge.progress().then(p => ({ p }), e => ({ e })), warmNow()]);
	const S = normalize(saved);
	let saveTimer = 0, hintTimer = 0, dirty = false, disposed = false, paused = false;
	const flush = () => { if (!dirty) return; dirty = false; bridge.save(JSON.parse(JSON.stringify(S))).catch(() => { dirty = true; bridge.toast(T('saveFailed')); }); };
	const save = () => { dirty = true; clearTimeout(saveTimer); saveTimer = setTimeout(flush, 500); };
	const keep = (k, v) => { S[k] = v; save(); };
	absorb(first.p ?? null);
	absorbWarm(warm);
	if (first.e) { console.warn('gate progress', first.e); bridge.toast(T('progressFailed')); }

	/* ---------- shell ---------- */
	shadow.innerHTML = `<style>${baseCss}${css}</style><div class="rt gm">
		<div class="mapwrap" id="mapwrap"><svg class="mapsvg" id="mapsvg"><g id="world"></g></svg></div>
		<aside class="panel" id="panel"><div class="grip"></div><button class="minibar" id="minibar"></button>
			<button class="pcollapse" id="pcollapse" aria-label="collapse">${icon('chevron-left')}</button>
			<div class="pbody" id="pbody"></div><div class="pfoot" id="pfoot"></div></aside>
		<button class="popen" id="popen">${icon('route')}<span>${esc(T('title'))}</span>${icon('chevron-right')}</button>
		<div class="ctrl"><button id="zin" aria-label="zoom in">${icon('plus')}</button><button id="zout" aria-label="zoom out">${icon('minus')}</button>
			<button id="zfit" aria-label="fit">${icon('map')}</button><button id="legbtn" aria-label="legend">${icon('info-circle')}</button></div>
		<div class="legend" id="legend"></div><div class="tip" id="tip"></div><div class="hint" id="hint"></div>
		<div class="tourcap" id="tourcap" role="status" aria-live="polite"><div class="tc-bar"><b></b></div><div class="tc-row"><div class="tc-t"></div><div class="tc-acts"></div></div></div>
		<div class="obm" id="obm"></div>
	</div>`;
	const R = shadow.querySelector('.rt');
	const $ = s => R.querySelector(s), $$ = s => R.querySelectorAll(s);
	const mobile = () => R.clientWidth < 860;
	let CUR = null, TAB = 'gate', FOCUS = null, PZ;

	/* ---------- map ---------- */
	// one stop: passed = filled with a check, open = thick ring that breathes, locked = muted with a lock, soon = dashed
	function marker(x, y, st, c, r = 17, pulse = true) {
		let h = '';
		if (st === 'open' && pulse) h += `<circle cx="${x}" cy="${y}" r="${r}" class="gpulse" style="--c:${c}"/>`;
		h += `<circle cx="${x}" cy="${y}" r="${r}" class="gs ${st}" style="--c:${c}"/>`;
		if (st === 'passed') h += checkP(x, y, r / 17);
		else if (st === 'locked') h += lockG(x, y, r / 17);
		return h;
	}

	function ixMarker(x) {
		const [a, b] = x.ids, [px, py] = POS[a], sa = SP[a].state, sb = SP[b].state, ca = COLOR(NODES[a].n), cb = COLOR(NODES[b].n);
		const open = sa === 'open' ? ca : sb === 'open' ? cb : null;
		let h = open ? `<circle cx="${px}" cy="${py}" r="27" class="gpulse" style="--c:${open}"/>` : '';
		h += `<circle cx="${px}" cy="${py}" r="27" class="ix gix${sa === 'soon' && sb === 'soon' ? ' soon' : ''}"/>`;
		// both lines open and in different states: each half shows its own line
		if (sa !== sb && sa !== 'soon' && sb !== 'soon') return h + `<path d="M${px} ${py - 15} A15 15 0 0 0 ${px} ${py + 15}Z" class="gs half ${sa}" style="--c:${ca}"/><path d="M${px} ${py - 15} A15 15 0 0 1 ${px} ${py + 15}Z" class="gs half ${sb}" style="--c:${cb}"/>`;
		const id = shownAt(a);
		return h + marker(px, py, SP[id].state, COLOR(NODES[id].n), 15, false);
	}

	function bandLabel(id) {
		const [x, y, side] = POS[id], [dx, dy, an] = LAB[side] || LAB.w;
		return `<text class="lab blab ${SP[id].state}" data-l="${NODES[id].n}" x="${x + dx}" y="${y + dy}" text-anchor="${an}">${band(id)}</text>`;
	}

	function ixLabel(x) {
		const a = x.ids[0], [px, py, side] = POS[a], [dx, dy, an] = IXLAB[side] || IXLAB.se, soon = x.ids.every(i => SP[i].state === 'soon');
		return `<text class="lab ixlab${soon ? ' soon' : ''}" data-l="${x.ids.map(i => NODES[i].n).join(' ')}" x="${px + dx}" y="${py + dy}" text-anchor="${an}">${band(a)}<tspan class="ixn" x="${px + dx}" dy="1.3em">${esc(L(x))}</tspan></text>`;
	}

	function renderMap() {
		let g = `<rect x="-3000" y="-3000" width="9000" height="8000" class="paper"/>`;
		LINES.forEach(l => {
			const p = PATHS[l.n]; if (!p) return;
			g += `<g data-l="${l.n}" class="gtrack${LP[l.n].live ? '' : ' soon'}"><path d="${pathD(p)}" class="case"/><path d="${pathD(p)}" class="line" style="stroke:${COLOR(l.n)}"/></g>`;
		});
		LINES.forEach(l => {
			const t = TAGPOS[l.n]; if (!t) return;
			const [x, y, an = 'start'] = t, lp = LP[l.n], txt = lp.live ? T('tagLive')(l.n, esc(L(l)), lp.passed, lp.total) : T('tagSoon')(l.n, esc(L(l)));
			g += `<g class="ltag gtag${lp.live ? '' : ' soon'}" data-l="${l.n}" data-x="${x}" data-an="${an}" style="--c:${COLOR(l.n)}"><rect x="${x}" y="${y - 30}" width="40" height="42" rx="12"/><text x="${x}" y="${y - 2}" class="ltt">${txt}</text></g>`;
		});
		const drawn = new Set();
		ORDER.forEach(id => {
			if (drawn.has(id) || !POS[id]) return;
			const x = IX[id], [px, py] = POS[id], shown = shownAt(id);
			(x ? x.ids : [id]).forEach(i => drawn.add(i));
			const sel = CUR && (x ? x.ids.includes(CUR) : CUR === id), ls = x ? x.ids.map(i => NODES[i].n).join(' ') : NODES[id].n;
			g += `<g class="stn${sel ? ' sel' : ''}" data-id="${shown}" data-key="${gateOf(id)}" data-l="${ls}" role="button" tabindex="0" aria-label="${stTitle(shown)} · ${T('state')[SP[shown].state]}">
				<circle cx="${px}" cy="${py}" r="40" class="hitc"/>${x ? ixMarker(x) : marker(px, py, SP[id].state, COLOR(NODES[id].n))}</g>${x ? ixLabel(x) : bandLabel(id)}`;
		});
		const me = pinStop();
		if (me && POS[me]) {
			const [x, y] = POS[me], big = !!IX[me], lift = big ? 56 : 46, open = (IX[me] ? IX[me].ids : [me]).some(i => SP[i].state === 'open');
			// an open gate already breathes; the pin only adds its own pulse elsewhere
			g += `<g transform="translate(${x} ${y})"><g class="me">${open ? '' : `<circle r="${big ? 36 : 30}" class="pulse"/>`}<g transform="translate(0 -${lift})"><path d="M0 24 C-6 13 -18 4 -18 -9 A18 18 0 1 1 18 -9 C18 4 6 13 0 24Z"/><circle cx="0" cy="-9" r="6" class="mehole"/></g><text y="-${lift + 40}" class="metxt">${T('here')}</text></g></g>`;
		}
		$('#world').innerHTML = g;
		// size each line tag to its text; TAGPOS anchors it like text (start / middle / end)
		$$('#world .gtag').forEach(t => {
			const tx = t.querySelector('text'), r = t.querySelector('rect'), w = tx.getComputedTextLength() + 34, x = +t.dataset.x, an = t.dataset.an;
			const x0 = an === 'middle' ? x - w / 2 : an === 'end' ? x - w : x - 12;
			r.setAttribute('x', x0.toFixed(1)); r.setAttribute('width', w.toFixed(1)); tx.setAttribute('x', (x0 + 17).toFixed(1));
		});
		// mid-tour (the server's progress can come in then): the train and its trails stay, and the tour keeps its focus
		if (TOUR.on) { if (TOUR.layer) $('#world').appendChild(TOUR.layer); return; }
		if (FOCUS) $('#world').setAttribute('data-focus', FOCUS); else $('#world').removeAttribute('data-focus');
	}

	// a gate that just changed (and the stops it lit up) pops once
	function pop(key) { const s = $(`#world .stn[data-key="${key}"]`); if (!s) return; s.classList.remove('pass'); void s.getBBox(); s.classList.add('pass'); }

	/* ---------- panel ---------- */
	const SHEET = { state: 'peek', px: 228 };
	const sheetPx = s => { const H = R.clientHeight; return s === 'min' ? 62 : s === 'peek' ? Math.min(228, H * .45) : s === 'half' ? Math.round(H * .54) : H - 12; };

	function sheet(s) { SHEET.state = s; SHEET.px = mobile() ? sheetPx(s) : 0; R.style.setProperty('--sheet', SHEET.px + 'px'); $('#panel').classList.toggle('min', mobile() && s === 'min'); }

	const inset = () => R.classList.contains('touring') ? (mobile() ? { l: 0, t: 8, r: 0, b: 200 } : { l: 0, t: 24, r: 0, b: 150 })
		: mobile() ? { l: 0, t: 8, r: 0, b: SHEET.px } : { l: R.classList.contains('pclosed') ? 0 : 432, t: 16, r: 64, b: 0 };

	function lineSub(l) {
		const lp = LP[l.n];
		if (!lp.live) return T('lineSoon');
		if (lp.current) return T('next')(band(lp.current));
		return lp.passed === lp.total ? T('lineDone') : T('lineWait');
	}

	function overview() {
		const tl = T('tiles'), done = passedN(), me = pinStop(), pt = placeTest(NODES[me || FIRST].n);
		const fresh = !LAST && !done;
		// a newcomer is offered the warm-up line first; the placement test card then carries its own button
		const warmFirst = !!WARMUP && fresh && !WP?.done;
		const tb = X ? `<button class="tourbtn" id="tourbtn"><i class="tb-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5 L19 12 L8 18.5Z"/></svg></i><span><b>${esc(X.btn)}</b><small>${esc(X.btnS)}</small></span><em aria-hidden="true">→</em></button>` : '';
		const lede = `<p class="lede">${T('lede')}</p>`;
		let h = `<div class="eyebrow">${T('eyebrow')}</div><h1 class="ptitle">${T('title')}</h1>${mobile() ? tb + lede : lede + tb}${pt ? placeCard(pt, warmFirst) : ''}
			<div class="tiles two"><div class="tile"><small>${tl[0]}</small><b>${done}<span> / ${ORDER.length}</span></b></div>
			<div class="tile"><small>${tl[1]}</small><b>${triesN()}<span> ${T('timesZ')}</span></b></div></div>
			<div class="sh"><h3>${T('linesH')}</h3><span>${T('linesN')}</span></div>`;
		if (WARMUP) {
			const sub = WP?.done ? T('warmDone') : T('warmSub')(WARMUP.stops, WARMUP.minutes);
			h += `<button class="row warm" data-warm><i class="dot" style="background:${esc(WARMUP.color)}"></i><span class="t"><b>${T('lineName')(WARMUP.n ?? 0, esc(L(WARMUP)))}</b><small>${sub}</small></span><span class="r">${WP ? WP.passed : 0} / ${WP ? WP.total : WARMUP.stops}</span></button>`;
		}
		// open lines first (vocabulary and grammar before the writing and speaking lines that aren't ready), in number order
		[...LINES.filter(l => LP[l.n].live), ...LINES.filter(l => !LP[l.n].live)].forEach(l => {
			const lp = LP[l.n];
			// in Chinese the line's English name comes along: the learners are learning these words too
			const en = LANG === 'zh' && l.en ? ` <span class="ren" lang="en">${esc(l.en)}</span>` : '';
			h += `<button class="row${lp.live ? '' : ' soon'}" data-line="${l.n}"><i class="dot" style="background:${COLOR(l.n)}"></i><span class="t"><b>${T('lineName')(l.n, esc(L(l)))}${en}</b><small>${lineSub(l)}</small></span><span class="r">${lp.passed} / ${lp.total}</span></button>`;
		});
		h += `<div class="sh"><h3>${T('subjH')}</h3></div><div class="chips">${catalog.map(c => `<button class="chipb${c.id === META.id ? ' on' : ''}" data-course="${esc(c.id)}">${esc(L(c.short))}</button>`).join('')}<button class="chipb" data-catalog>${T('allMaps')}</button></div>`;
		h += `<p class="legal">${T('legal')}</p>`;
		$('#pbody').innerHTML = h;
		$('#minibar').innerHTML = `<b>${T('title')}</b><span>${done} / ${ORDER.length}</span>`;
		const label = !me ? T('startAt')(band(FIRST)) : fresh ? T('startAt')(band(me)) : T('contL') + stTitle(me);
		// a newcomer gets the warm-up line, or else the placement test, next to "start at 4.0", where the thumb is
		$('#pfoot').innerHTML = warmFirst
			? `<div class="gfoot"><button class="cta ghost" id="gohere">${icon('current-location')}<span class="ctat">${label}</span></button><button class="cta" data-warm>${icon('keyboard')}<span class="ctat">${T('warmGoShort')}</span></button></div>`
			: pt
			? `<div class="gfoot"><button class="cta ghost" id="gohere">${icon('current-location')}<span class="ctat">${label}</span></button><button class="cta" data-place="${pt}">${icon('compass')}<span class="ctat">${T('placeGo')}</span></button></div>`
			: `<button class="cta" id="gohere">${icon('current-location')}<span class="ctat">${label}</span></button>`;
		$$('#pbody [data-line]').forEach(b => { b.onclick = () => focusLine(b.dataset.line); });
		$$('#pbody [data-course]').forEach(b => { b.onclick = () => { if (b.dataset.course !== META.id) bridge.openCourse(b.dataset.course); }; });
		$('#pbody [data-catalog]').onclick = () => bridge.openCatalog();
		$$('#panel [data-place]').forEach(b => { b.onclick = () => bridge.openGate(b.dataset.place); });
		$$('#panel [data-warm]').forEach(b => { b.onclick = () => bridge.openPath(WARMUP.path); });
		$('#gohere').onclick = () => go(pinStop() || FIRST);
		const tbb = $('#tourbtn'); if (tbb) tbb.onclick = () => tourStart();
		sheet(SHEET.state === 'full' ? 'half' : SHEET.state);
	}

	const day = iso => new Date(iso).toLocaleDateString(LANG === 'zh' ? 'zh-CN' : 'en', { month: 'short', day: 'numeric' });

	function gateBody(id) {
		const n = NODES[id], s = SP[id], x = IX[id], o = otherOf(id);
		// the line's own rule (listening: the recording plays once), and a reading stop's time limit
		const extra = [(T('lineRule') || {})[n.n], s.time ? T('timeRule')(s.time) : ''].filter(Boolean).join(LANG === 'zh' ? '；' : '; ');
		const rule = s.total && s.pass ? T('rule')(s.total, s.pass, extra) : s.pass ? T('rulePass')(s.pass, extra) : T('ruleNoNum')(extra), meta = [];
		if (s.best != null && s.total && s.state !== 'passed') meta.push(`${T('best')} ${s.best} / ${s.total}`);
		if (s.attempts) meta.push(T('tries')(s.attempts));
		const metaH = meta.length ? `<div class="meta">${meta.join(' · ')}</div>` : '';
		let h = '';
		if (s.state === 'passed') {
			h += `<div class="gst passed"><div class="gst-h"><i class="gst-ic"><svg viewBox="-12 -12 24 24">${checkP(0, 0, .62)}</svg></i><b>${T('state').passed}</b>${s.passedAt ? `<small>${T('passedOn')(day(s.passedAt))}</small>` : ''}</div>`;
			if (s.best != null && s.total) h += `<div class="gst-score"><small>${T('best')}</small><b>${s.best}<span> / ${s.total}</span></b></div>`;
			else if (s.via && T('via')[s.via]) h += `<p>${T('via')[s.via]}</p>`;
			h += metaH + '</div>';
		} else if (s.state === 'open') {
			h += `<div class="gst open" style="--c:${COLOR(n.n)}"><div class="gst-h"><i class="gst-ic"></i><b>${T('state').open}</b></div><p>${rule}</p>${metaH}</div>`;
			const pt = placeTest(n.n);
			if (pt && !s.attempts) h += placeCard(pt, true);
		} else if (s.state === 'locked') {
			h += `<div class="gst locked"><div class="gst-h"><i class="gst-ic"><svg viewBox="-12 -12 24 24">${lockG(0, 1, .95)}</svg></i><b>${T('state').locked}</b></div><p>${T('lockedMsg')(behind(id))}</p><div class="meta">${rule}</div>${metaH}</div>`;
		} else h += `<div class="soon"><b>${T('soonMsg')}</b><p>${T('soonS')}</p></div>`;
		if (s.failStreak >= 3 && s.state !== 'soon' && s.state !== 'passed') {
			const p = prevOf(id);
			h += `<div class="gst warn"><p>${T('streak')(s.failStreak, p ? band(p) : null)}</p>${p ? `<button class="pillbtn ghost" data-go="${p}">${T('goPrev')(band(p))}</button>` : ''}</div>`;
		}
		const study = STUDY[n.line.id];
		if (study) h += `<button class="pillbtn gstudy" data-path="${study.path}${id}">${icon(study.icon)}${T('study')[n.line.id]}</button>`;
		const rows = ['part', 'focus', 'types', 'pace', 'length'].filter(k => n[k]);
		if (rows.length) h += `<div class="h4">${T('infoH')}</div><dl class="grows">${rows.map(k => `<div><dt>${((T('rowsBy') || {})[n.line.id] || T('rows'))[k]}</dt><dd>${esc(L(n[k]))}</dd></div>`).join('')}</dl>`;
		if (x) {
			h += `<div class="gnote gix-note"><b>${T('ixH')(esc(L(x)))}</b><p>${esc(L({ zh: x.dzh, en: x.den }))}</p>${x.why ? `<p><span>${T('ixWhy')}</span>${esc(L(x.why))}</p>` : ''}`;
			if (LP[n.n].live && !LP[NODES[o].n].live) h += `<p class="gix-half">${T('ixHalf')(lineName(o), lineName(id))}</p>`;
			h += '</div>';
		}
		return h;
	}

	function peersBody(id) {
		return `<div class="card"><div class="h">${T('postsH')}<span class="tagname">#${tagOf(id)}</span></div><div class="s">${T('peersS')}</div>
			<div class="notes" id="notes"><div class="s">${T('loading')}</div></div>
			<div class="cardacts"><button class="pillbtn" id="write">${T('write')}</button><button class="pillbtn ghost" id="seeall">${T('all')}</button></div></div>
			<div class="card" id="groupcard" hidden></div>
			<div class="card"><div class="h">${T('teachH')}</div><div class="s">${SP[id].state === 'passed' ? T('teachDone') : T('teachTodo')}</div></div>`;
	}

	// the main action sits in the panel footer, so it stays in reach on a phone. It opens this very stop (2.4, not 1.4):
	// an interchange's sets are drawn for the line the learner is on.
	function footer(id) {
		const s = SP[id], g = id, cur = LP[NODES[id].n].current;
		if (s.state === 'passed') { const nx = nextOf(id); return `<div class="gfoot"><button class="cta ghost" data-gate="${g}">${icon('refresh')}${T('again')}</button>${nx ? `<button class="cta" data-go="${nx}">${T('goNext')(band(nx))} →</button>` : ''}</div>`; }
		if (s.state === 'open') return `<div class="gfoot"><button class="cta" data-gate="${g}">${s.attempts ? T('retry') : T('start')} →</button></div>`;
		if (s.state === 'locked') return `<div class="gfoot">${cur && cur !== id ? `<button class="cta ghost" data-go="${cur}">${T('goOpen')(band(cur))}</button>` : ''}<button class="cta" data-gate="${g}">${T('jump')} →</button></div>`;
		const me = pinStop();
		return me && me !== id ? `<div class="gfoot"><button class="cta ghost" data-go="${me}">${icon('current-location')}<span class="ctat">${T('cta')}</span></button></div>` : '';
	}

	function station(id, keepScroll = false) {
		const n = NODES[id], s = SP[id], c = COLOR(n.n), o = otherOf(id), top = keepScroll ? $('#pbody').scrollTop : 0;
		if (TAB !== 'gate' && TAB !== 'peers') TAB = 'gate';
		let tags = `<span class="tg" style="background:${c}">${T('lineN')(n.n)} · ${id}</span>`;
		if (o) tags += `<button class="tg ixc" data-go="${o}"><i style="background:${COLOR(NODES[o].n)}"></i>${T('ixChip')(lineName(o), o)}</button>`;
		tags += `<span class="tg gst-${s.state}">${T('state')[s.state]}</span>`;
		$('#pbody').innerHTML = `<button class="back" id="back"><i>${icon('chevron-left')}</i>${T('back')}</button>
			<div class="tagrow">${tags}</div><h1 class="ptitle">${stTitle(id)}</h1><div class="en-full">${T('practice')}</div>
			<div class="fellows" id="fellows" hidden></div>
			<div class="tabs">${['gate', 'peers'].map(t => `<button data-t="${t}" class="${t === TAB ? 'on' : ''}">${T('tabs')[t]}</button>`).join('')}</div>
			<div id="tabbody">${TAB === 'gate' ? gateBody(id) : peersBody(id)}</div>`;
		$('#pbody').scrollTop = top;
		$('#minibar').innerHTML = `<b><em style="color:${c}">${id}</em> ${stTitle(id)}</b><span>${T('state')[s.state]}</span>`;
		$('#pfoot').innerHTML = footer(id);
		$('#back').onclick = () => { CUR = null; bridge.setHash(null); overview(); renderMap(); };
		$$('#pbody .tabs button').forEach(b => { b.onclick = () => { TAB = b.dataset.t; station(id); }; });
		$$('#panel [data-go]').forEach(b => { b.onclick = () => go(b.dataset.go); });
		$$('#panel [data-gate], #panel [data-place]').forEach(b => { b.onclick = () => bridge.openGate(b.dataset.gate ?? b.dataset.place); });
		$$('#panel [data-path]').forEach(b => { b.onclick = () => bridge.openPath(b.dataset.path); });
		if (TAB === 'peers') loadPeers(id);
		loadFellows(id);
		if (SHEET.state === 'peek' || SHEET.state === 'min') sheet('half');
	}

	// 同路人: who else tried this gate in the last 30 days, as a row of faces (kept for a minute, as switching tabs redraws
	// the stop). Nothing shows when no one has: there are no stand-ins.
	const FELLOWS = new Map();
	const face = u => u.avatarUrl ? `<img src="${esc(u.avatarUrl)}" alt="">` : '<i class="av0"></i>';

	async function loadFellows(id) {
		let hit = FELLOWS.get(id);
		if (!hit || Date.now() - hit.at > 60000) {
			try { hit = { at: Date.now(), data: await bridge.peers(id, 6) }; } catch { return; }
			FELLOWS.set(id, hit);
		}
		const box = $('#fellows'), { total, users } = hit.data;
		if (!box || !box.isConnected || CUR !== id || total === 0 || users.length === 0) return;
		const names = users.slice(0, total > 2 ? 2 : total).map(u => esc(u.name || u.username));
		box.hidden = false;
		box.innerHTML = `<button class="fface" id="fopen"><span class="fh">${T('fellowH')} · ${T('fellowWhen')}</span>
			<span class="favs">${users.map(face).join('')}</span><span class="ft">${T('fellows')(names, total > 2 ? total - 2 : 0)}</span></button>`;
		$('#fopen').onclick = () => fellowList(id);
	}

	async function fellowList(id) {
		let all;
		try { all = await bridge.peers(id, 50); } catch { return; }
		const box = $('#fellows');
		if (!box || !box.isConnected || CUR !== id) return;
		box.innerHTML = `<div class="card"><div class="h">${T('fellowsAll')(all.total)}</div>${all.total > all.users.length ? `<div class="s">${T('fellowsCut')(all.users.length)}</div>` : ''}
			<div class="notes">${all.users.map(u => `<button class="note" data-user="${esc(u.username)}">${face(u)}<span><b>${esc(u.name || u.username)}</b><small>@${esc(u.username)}</small></span></button>`).join('')}</div>
			<div class="cardacts"><button class="pillbtn ghost" id="fclose">${T('fellowsClose')}</button></div></div>`;
		box.querySelectorAll('[data-user]').forEach(b => { b.onclick = () => bridge.openUser(b.dataset.user); });
		$('#fclose').onclick = () => loadFellows(id);
	}

	function ago(iso) {
		const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000), rtf = new Intl.RelativeTimeFormat(LANG === 'zh' ? 'zh-CN' : 'en', { numeric: 'auto' });
		for (const [u, k] of [['day', 86400], ['hour', 3600], ['minute', 60]]) if (s >= k) return rtf.format(-Math.floor(s / k), u);
		return rtf.format(-Math.floor(s), 'second');
	}

	async function loadPeers(id) {
		const tag = tagOf(id), box = $('#notes');
		$('#write').onclick = () => bridge.compose(`#${tag} `);
		$('#seeall').onclick = () => bridge.openTag(tag);
		try {
			const notes = await bridge.notes(tag, 5);
			if (!box.isConnected) return;
			box.innerHTML = notes.length ? notes.map(nt => {
				const u = nt.user || {}, t = String(nt.text || '').replace(new RegExp(`#${tag}\\b`, 'gi'), '').trim();
				return `<button class="note" data-note="${esc(nt.id)}">${u.avatarUrl ? `<img src="${esc(u.avatarUrl)}" alt="">` : '<i class="av0"></i>'}<span><b>${esc(u.name || '@' + (u.username || ''))}</b><small>${esc(ago(nt.createdAt))}</small><em>${esc(t.length > 140 ? t.slice(0, 140) + '…' : t)}</em></span></button>`;
			}).join('')
				: `<div class="s">${T('postsEmpty')}</div>`;
			box.querySelectorAll('[data-note]').forEach(b => { b.onclick = () => bridge.openNote(b.dataset.note); });
		} catch { if (box.isConnected) box.innerHTML = `<div class="s">${T('loadFail')}</div>`; }
		const ch = await bridge.channel(NODES[id].n).catch(() => null), card = $('#groupcard');
		if (!ch || !card || !card.isConnected) return;
		const paint = () => {
			card.hidden = false;
			card.innerHTML = `<div class="h">${esc(ch.name)}</div><div class="s">${T('groupS')} · ${T('members')(ch.usersCount ?? 0)}</div>
				<div class="cardacts"><button class="pillbtn${ch.isFollowing ? ' done' : ''}" id="gjoin">${ch.isFollowing ? T('joined') : T('join')}</button><button class="pillbtn ghost" id="gopen">${T('open')}</button></div>`;
			$('#gjoin').onclick = async () => { const on = !ch.isFollowing; try { await bridge.follow(ch.id, on); ch.isFollowing = on; ch.usersCount = (ch.usersCount ?? 0) + (on ? 1 : -1); paint(); } catch { /* the native error toast already explained it */ } };
			$('#gopen').onclick = () => bridge.openChannel(ch.id);
		};
		paint();
	}

	/* ---------- navigation ---------- */
	const fitAll = () => PZ.fit(.97, BBOX);

	function go(id) {
		if (!NODES[id]) return; CUR = id; TAB = 'gate';
		bridge.setHash(id); FOCUS = null; R.classList.remove('pclosed'); station(id); renderMap();
		const p = POS[id]; if (p) requestAnimationFrame(() => PZ.focus(p[0], p[1], Math.max(PZ.v.k, mobile() ? .72 : .75)));
	}

	// frame one whole line: everything tagged with it (track, stops, bands, tag)
	function lineBox(n) {
		const w = $('#world'), had = w.classList.contains('zlow'); w.classList.remove('zlow');
		let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
		w.querySelectorAll(`[data-l~="${n}"]`).forEach(e => {
			const b = e.getBBox(); if (!b.width && !b.height) return;
			x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
		});
		if (had) w.classList.add('zlow'); const p = mobile() ? 30 : 60; return { x: x0 - p, y: y0 - p, w: x1 - x0 + 2 * p, h: y1 - y0 + 2 * p };
	}

	function focusLine(n) {
		FOCUS = FOCUS === n ? null : n; renderMap();
		if (!FOCUS) return fitAll();
		PZ.fit(.94, lineBox(n));
		if (mobile() && SHEET.state !== 'peek') sheet('peek');
	}

	function sheetDrag() {
		const g = $('.grip'), p = $('#panel'); let y0 = 0, h0 = 0, t0 = 0, dy = 0, on = false;
		g.addEventListener('pointerdown', e => { if (!mobile()) return; on = true; y0 = e.clientY; h0 = SHEET.px; t0 = performance.now(); dy = 0; try { g.setPointerCapture(e.pointerId); } catch { /* synthetic events */ } p.classList.add('dragging'); });
		g.addEventListener('pointermove', e => { if (!on) return; dy = e.clientY - y0; const h = Math.max(56, Math.min(sheetPx('full'), h0 - dy)); R.style.setProperty('--sheet', h + 'px'); p.classList.toggle('min', h < 120); });
		g.addEventListener('pointerup', () => {
			if (!on) return; on = false; p.classList.remove('dragging');
			if (Math.abs(dy) < 6) return sheet({ min: 'peek', peek: 'half', half: 'full', full: 'half' }[SHEET.state]);
			const v = dy / Math.max(1, performance.now() - t0), h = h0 - dy;
			const up = { min: 'peek', peek: 'half', half: 'full', full: 'full' }, down = { full: 'half', half: 'peek', peek: 'min', min: 'min' };
			if (v < -.5) return sheet(up[SHEET.state]); if (v > .5) return sheet(down[SHEET.state]);
			sheet(['min', 'peek', 'half', 'full'].reduce((a, b) => Math.abs(sheetPx(b) - h) < Math.abs(sheetPx(a) - h) ? b : a));
		});
	}

	/* ---------- tour: a little train rides the map and the camera follows it, as on the AP maps (runtime.js) ---------- */
	// The course's steps (TOUR.steps), one caption each, from the whole map to each line, then what to do first. Every await
	// goes through tween(), which a stopped or restarted tour rejects, so a stale run can't go on. With reduced motion the
	// camera jumps, no train rides and no stop pops; the captions keep their time.
	const STEPS = course.TOUR?.steps ?? [];
	const TOUR = { on: false, raf: 0, cam: null, target: null, follow: .12, step: 0, runId: 0, layer: null, train: null, ang: 0 };
	// one caption per step, and the last one with what to do next
	const TOTAL_STEPS = STEPS.length + 1;
	const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const moving = ms => (calm() ? 1 : ms);
	const svgEl = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); (parent || TOUR.layer).appendChild(e); return e; };
	const kRide = () => mobile() ? .6 : .8;

	function camLoop() {
		if (!TOUR.on) return;
		const c = TOUR.cam, t = TOUR.target, a = calm() ? 1 : TOUR.follow;
		c.x += (t.x - c.x) * a; c.y += (t.y - c.y) * a; c.k += (t.k - c.k) * (calm() ? 1 : a * .7);
		PZ.focus(c.x, c.y, c.k, false);
		TOUR.raf = requestAnimationFrame(camLoop);
	}

	const tween = (dur, fn) => {
		const id = TOUR.runId;
		return new Promise((res, rej) => {
			const t0 = performance.now();
			const step = t => {
				if (!TOUR.on || TOUR.runId !== id) return rej(new Error('stopped'));
				const p = Math.min(1, (t - t0) / Math.max(1, dur)); fn(p);
				if (p < 1) requestAnimationFrame(step); else res();
			};
			requestAnimationFrame(step);
		});
	};
	const wait = ms => tween(ms, () => {});

	function fly(x, y, k, dur) {
		const s = { ...TOUR.target }; TOUR.follow = .2;
		return tween(moving(dur), p => { const e = ease(p); TOUR.target = { x: s.x + (x - s.x) * e, y: s.y + (y - s.y) * e, k: s.k + (k - s.k) * e }; });
	}

	const flyBox = (b, dur, pad = .94, max = 1.1) => fly(b.x + b.w / 2, b.y + b.h / 2, Math.min(PZ.fitK(pad, b), max), dur);
	const focusOn = n => { const w = $('#world'); w.setAttribute('data-focus', String(n)); w.classList.add('t-line'); };
	const unfocus = () => { const w = $('#world'); w.removeAttribute('data-focus'); w.classList.remove('t-line'); };

	// the stops a moving point has reached pop, once each
	function popNear(pt, hit) {
		if (calm()) return;
		for (const id of ORDER) {
			if (hit.has(id) || !POS[id]) continue;
			if (Math.hypot(POS[id][0] - pt.x, POS[id][1] - pt.y) < 16) { hit.add(id); pop(gateOf(id)); }
		}
	}

	// the train rides a line from 4.0 to 8.0 and leaves a white trail; the camera rides along (k: its zoom)
	function ride(n, dur, k) {
		const d = pathD(PATHS[n]), path = svgEl('path', { d, fill: 'none', stroke: 'none' }), len = path.getTotalLength();
		const trail = svgEl('path', { d, class: 'trail', 'stroke-dasharray': len, 'stroke-dashoffset': len });
		if (!calm()) TOUR.layer.appendChild(TOUR.train);
		TOUR.follow = .14;
		const hit = new Set();
		return tween(dur, p => {
			const at = calm() ? len : len * ease(p), pt = path.getPointAtLength(at), ah = path.getPointAtLength(Math.min(len, at + 2));
			if (at + 2 <= len) TOUR.ang = Math.atan2(ah.y - pt.y, ah.x - pt.x) * 180 / Math.PI;
			TOUR.train.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${TOUR.ang.toFixed(1)})`);
			trail.setAttribute('stroke-dashoffset', (len - at).toFixed(1));
			if (!calm()) TOUR.target = { x: pt.x, y: pt.y, k };
			popNear(pt, hit);
		});
	}

	// one whole line: the others fade, the camera frames it, a white trail runs along it and its stops pop
	async function showLine(n, text, same) {
		caption(text, { same });
		focusOn(n);
		await flyBox(lineBox(n), 950);
		const trail = svgEl('path', { d: pathD(PATHS[n]), class: 'trail' }), len = trail.getTotalLength();
		trail.setAttribute('stroke-dasharray', len); trail.setAttribute('stroke-dashoffset', len);
		const hit = new Set();
		await tween(moving(1400), q => {
			const e = ease(q);
			trail.setAttribute('stroke-dashoffset', (len * (1 - e)).toFixed(1));
			popNear(trail.getPointAtLength(len * e), hit);
		});
		await wait(calm() ? 2200 : 800);
		trail.remove();
	}

	// the caption bar: the step's words, how far the tour has come, and Skip; the last one carries what to do next
	function caption(text, opts = {}) {
		const c = $('#tourcap'), t = c.querySelector('.tc-t');
		if (!opts.same) TOUR.step = Math.min(TOTAL_STEPS, TOUR.step + 1);
		if (!opts.same || t.textContent !== text) { t.classList.remove('in'); void c.offsetWidth; t.textContent = text; t.classList.add('in'); }
		c.querySelector('.tc-bar b').style.width = `${TOUR.step / TOTAL_STEPS * 100}%`;
		c.dataset.step = String(TOUR.step);
		const acts = c.querySelector('.tc-acts');
		if (!opts.end) {
			if (!acts.querySelector('#tskip')) acts.innerHTML = `<button class="tc-skip" id="tskip">${esc(X.skip)}</button>`;
			$('#tskip').onclick = () => finishTour();
			return;
		}
		acts.innerHTML = opts.end.map(([k, label], i) => `<button class="pillbtn${i ? ' ghost' : ''}" data-tact="${k}">${esc(label)}${i ? '' : ' →'}</button>`).join('')
			+ `<button class="tc-skip" data-tact="look">${esc(X.look)}</button>`;
		acts.querySelectorAll('[data-tact]').forEach(b => { b.onclick = () => endAct(b.dataset.tact); });
	}

	// what to do after the tour: a newcomer's first step, else the placement test, else back to their stop
	function nextStep() {
		const me = pinStop() || FIRST, fresh = !LAST && !passedN(), pt = placeTest(NODES[me].n);
		const goLabel = fresh ? T('startAt')(band(me)) : X.go(T('stTitle')(L(NODES[me].line), band(me)));
		if (WARMUP && fresh && !WP?.done) return { text: X.endNew(WARMUP.minutes, !!pt), acts: [['warm', X.warm], pt ? ['place', X.place] : ['go', goLabel]] };
		if (pt) return { text: X.endPlace, acts: [['place', X.place], ['go', goLabel]] };
		return { text: X.endBack, acts: [['go', goLabel], ['again', X.again]] };
	}

	function endAct(k) {
		if (k === 'again') { tourStop(true); setTimeout(tourStart, 50); return; }
		const me = pinStop() || FIRST, pt = placeTest(NODES[me].n);
		finishTour();
		if (k === 'warm' && WARMUP) bridge.openPath(WARMUP.path);
		else if (k === 'place' && pt) bridge.openGate(pt);
		else if (k === 'go') go(me);
	}

	async function tourRun() {
		for (const st of STEPS) {
			const text = X[st.say] ?? '';
			if (st.do === 'all') {
				unfocus(); caption(text);
				await flyBox(BBOX, 1300, .97, 9); await wait(calm() ? 2600 : 1700);
			} else if (st.do === 'ride' && PATHS[st.line]) {
				caption(text); focusOn(st.line);
				const a = LINES.find(l => l.n === st.line).stations[0].id;
				if (calm()) { await flyBox(lineBox(st.line), 1); await ride(st.line, 3000, null); } else { await fly(POS[a][0], POS[a][1], kRide(), 1100); await ride(st.line, 5200, kRide()); await wait(400); }
				// the train and its white trail go, or line 1 would look different from the others for the rest of the tour
				TOUR.train.remove(); TOUR.layer.querySelectorAll('.trail').forEach(t => t.remove());
			} else if (st.do === 'interchanges') {
				unfocus(); caption(text);
				const ids = INTERCHANGES.map(x => x.ids[0]).filter(id => POS[id]);
				if (ids.length) {
					const xs = ids.map(id => POS[id][0]), ys = ids.map(id => POS[id][1]), pad = 260;
					await flyBox({ x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + 2 * pad, h: Math.max(...ys) - Math.min(...ys) + 2 * pad }, 1000);
					for (const id of ids) { if (!calm()) pop(gateOf(id)); await wait(420); }
				}
				await wait(calm() ? 2200 : 1000);
			} else if (st.do === 'lines') {
				for (const [i, n] of (st.lines ?? []).entries()) if (PATHS[n]) await showLine(n, text, i > 0);
			} else if (st.do === 'jump') {
				caption(text); focusOn(st.line);
				await flyBox(lineBox(st.line), 900);
				const run = LINES.find(l => l.n === st.line).stations.slice(0, 5).map(s => s.id);
				if (!calm()) { pop(gateOf(run[run.length - 1])); await wait(500); for (const id of run.slice(0, -1).reverse()) { pop(gateOf(id)); await wait(150); } }
				await wait(calm() ? 2600 : 1400);
			}
		}
		unfocus();
		const next = nextStep();
		caption(next.text, { end: next.acts });
		await flyBox(BBOX, 1200, .97, 9);
	}

	function tourStart() {
		if (!X || TOUR.on || disposed) return;
		closeModal();
		TOUR.on = true; TOUR.step = 0; TOUR.runId++;
		$('#legend').classList.remove('on'); $('#hint').classList.remove('on');
		R.classList.add('touring');
		FOCUS = null;
		if (CUR) { CUR = null; overview(); }
		TOUR.layer = svgEl('g', { class: 'tourlayer' }, $('#world'));
		TOUR.train = svgEl('g', { class: 'train' });
		TOUR.train.innerHTML = '<circle r="36" class="glow"/><rect x="-30" y="-15" width="60" height="30" rx="15" class="car"/><rect x="-14" y="-7" width="10" height="14" rx="3" class="win"/><rect x="2" y="-7" width="10" height="14" rx="3" class="win"/><path d="M22 -6 L28 0 L22 6" class="nose"/>';
		TOUR.train.remove(); TOUR.ang = 0;
		const c = PZ.center(); TOUR.cam = { ...c }; TOUR.target = { ...c };
		camLoop();
		tourRun().catch(() => { /* stopped */ });
	}

	// keepView: the camera stays where the tour left it (else the whole map)
	function tourStop(keepView) {
		if (!TOUR.on) return;
		TOUR.on = false; TOUR.runId++; cancelAnimationFrame(TOUR.raf);
		R.classList.remove('touring');
		unfocus();
		if (TOUR.layer) TOUR.layer.remove();
		TOUR.layer = null;
		renderMap(); overview();
		if (!keepView) fitAll();
	}

	// watched to the end, or skipped: the map doesn't open with it again (the panel's button plays it again)
	function finishTour() { tourStop(true); keep('toured', true); keep('onboarded', true); }

	/* ---------- welcome: shown once ---------- */
	function modal(html, cls = '') { const m = $('#obm'); m.className = 'obm on ' + cls; m.innerHTML = `<div class="obcard">${html}</div>`; return m; }

	const closeModal = () => { $('#obm').className = 'obm'; };

	// with a tour: a little train on a track, what the tour is for, and Start / Skip
	function tourWelcome() {
		modal(`<div class="obtrain" aria-hidden="true"><svg viewBox="0 0 120 40"><path d="M6 28 H114" class="obrail"/><circle cx="20" cy="28" r="7" class="obstop"/><circle cx="100" cy="28" r="7" class="obstop"/><g class="obcar"><rect x="40" y="16" width="40" height="22" rx="11"/><rect x="50" y="22" width="7" height="10" rx="2" class="obwin"/><rect x="62" y="22" width="7" height="10" rx="2" class="obwin"/></g></svg></div>
			<div class="obeye">${esc(X.wEye)}</div><h2>${esc(X.wTitle)}</h2><p>${esc(X.wText)}</p>
			<div class="obacts"><button class="cta" id="obtour">${esc(X.wGo)} →</button><button class="obtext" id="obskip">${esc(X.wSkip)}</button></div>`, 'welcome');
		$('#obtour').onclick = () => { closeModal(); tourStart(); };
		$('#obskip').onclick = () => { closeModal(); keep('toured', true); keep('onboarded', true); };
	}

	function welcome() {
		const st = T('state'), me = pinStop() || FIRST, fresh = !LAST && !passedN(), sep = LANG === 'zh' ? '' : ' ', pt = placeTest(NODES[me].n);
		const live = LINES.filter(l => LP[l.n].live).map(l => T('lineName')(l.n, esc(L(l))));
		const stops = [['passed', 40], ['open', 130], ['locked', 220]].map(([k, x]) => marker(x, 26, k, 'var(--l1)', 13) + `<text x="${x}" y="68" class="wlab">${st[k]}</text>`).join('');
		// a newcomer: the warm-up line first, then the placement test (or "start at 4.0"); otherwise as before
		const warmFirst = !!WARMUP && fresh && !WP?.done;
		const place = (ghost) => `<button class="cta${ghost ? ' ghost' : ''}" id="obplace">${icon('compass')}${T('placeGo')} →</button>`;
		const goBtn = (ghost) => `<button class="cta${ghost ? ' ghost' : ''}" id="obgo">${fresh ? T('startAt')(band(me)) : T('wGoNext')(stTitle(me))} →</button>`;
		const acts = warmFirst
			? `<button class="cta" id="obwarm">${icon('keyboard')}${T('warmGo')(WARMUP.minutes)} →</button>${pt ? place(true) : goBtn(true)}`
			: `${pt ? place(false) : ''}${goBtn(!!pt)}`;
		modal(`<svg class="gwel" viewBox="0 0 260 76" aria-hidden="true"><path d="M30 26 H230" class="wtrack"/>${stops}</svg>
			<div class="obeye">${T('wEye')}</div><h2>${T('wTitle')}</h2>
			<p>${T('wText')}${live.length && live.length < LINES.length ? sep + T('wLive')(live.join(LANG === 'zh' ? '、' : ', ')) : ''}</p>${warmFirst ? `<p>${T('wWarm')(WARMUP.stops, WARMUP.minutes)}</p>` : pt ? `<p>${T('wPlace')}</p>` : ''}<p class="obnote">${T('wNote')}</p>
			<div class="obacts">${acts}<button class="obtext" id="obskip">${T('wSkip')}</button></div>`, 'welcome');
		const on = (sel, f) => { const b = $(sel); if (b) b.onclick = () => { closeModal(); keep('onboarded', true); f(); }; };
		on('#obwarm', () => bridge.openPath(WARMUP.path));
		on('#obplace', () => bridge.openGate(pt));
		on('#obgo', () => go(me));
		$('#obskip').onclick = () => { closeModal(); keep('onboarded', true); };
	}

	/* ---------- wiring ---------- */
	const tip = $('#tip'), world = $('#world');
	PZ = PanZoom($('#mapsvg'), world, { w: CANVAS.w, h: CANVAS.h, min: .15, max: 2.4, inset,
		onChange: v => { world.classList.toggle('zlow', v.k < .56); const m = $('#mapwrap'); m.style.backgroundSize = `${40 * v.k}px ${40 * v.k}px`; m.style.backgroundPosition = `${v.x}px ${v.y}px`; } });
	world.addEventListener('pointerover', e => {
		const s = e.target.closest('.stn'), id = s && s.dataset.id; if (!id || !NODES[id] || e.pointerType === 'touch') return;
		tip.innerHTML = `<i style="background:${COLOR(NODES[id].n)}"></i><span>${id}</span>${stTitle(id)} · ${T('state')[SP[id].state]}`; tip.classList.add('on');
	});
	world.addEventListener('pointermove', e => { const r = R.getBoundingClientRect(); tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 16}px)`; });
	world.addEventListener('pointerout', e => { if (e.target.closest('.stn')) tip.classList.remove('on'); });
	world.addEventListener('click', e => {
		const s = e.target.closest('.stn');
		if (s && NODES[s.dataset.id]) return go(s.dataset.id);
		if (FOCUS) { FOCUS = null; renderMap(); }
		if (mobile() && SHEET.state !== 'min') sheet('min');
	});
	world.addEventListener('keydown', e => {
		const s = e.target.closest && e.target.closest('.stn');
		if (s && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(s.dataset.id); }
	});
	sheetDrag();
	$('#zin').onclick = () => PZ.zoomBy(1.3); $('#zout').onclick = () => PZ.zoomBy(1 / 1.3);
	$('#zfit').onclick = () => { FOCUS = null; renderMap(); fitAll(); };
	$('#legbtn').onclick = () => $('#legend').classList.toggle('on');
	$('#pcollapse').onclick = () => R.classList.add('pclosed');
	$('#popen').onclick = () => R.classList.remove('pclosed');
	$('#minibar').onclick = () => sheet(CUR ? 'half' : 'peek');
	const swatch = k => `<svg viewBox="-17 -17 34 34">${k === 'ix' ? `<circle r="13" class="ix gix"/>${marker(0, 0, 'passed', 'var(--l1)', 7)}` : marker(0, 0, k, 'var(--l1)', 10, false)}</svg>`;
	$('#legend').innerHTML = `<b>${T('legendH')}</b>` + T('legend').map(([k, s]) => `<div><i class="lgs">${swatch(k)}</i>${s}</div>`).join('');
	const onKey = e => {
		if (e.key !== 'Escape' || paused) return;
		if (TOUR.on) finishTour(); else if ($('#obm').classList.contains('on')) $('#obskip')?.click(); else if (CUR) $('#back').click();
	};
	window.addEventListener('keydown', onKey);

	R.classList.toggle('narrow', mobile());
	sheet('peek'); overview(); renderMap();
	const start = bridge.initialHash && NODES[bridge.initialHash] ? bridge.initialHash : null;
	// not toured yet: the whole map first, never one line (founder, 2026-11-01)
	const firstLook = !!X && !S.toured;
	if (start) { fitAll(); go(start); } else if (mobile() && !firstLook) {
		const [x, y] = POS[pinStop() || FIRST]; PZ.focus(x - 10, y + 110, .72, false);
		if (!S.hinted && S.onboarded) { const h = $('#hint'); h.textContent = T('hint'); h.classList.add('on'); keep('hinted', true); hintTimer = setTimeout(() => h.classList.remove('on'), 3600); }
	} else fitAll();
	if (!start && (X ? !S.toured : !S.onboarded)) setTimeout(() => { if (!disposed && !paused) (X ? tourWelcome : welcome)(); }, 500);

	return {
		fit: () => { FOCUS = null; renderMap(); fitAll(); },
		legend: () => $('#legend').classList.toggle('on'),
		// the page menu's 带我走一遍 (only for a course with a tour)
		tour: X ? () => tourStart() : undefined,
		// re-read progress (e.g. back from a gate) and redraw; a failed call keeps what is on screen
		async refresh() {
			if (disposed) return;
			let p, w;
			try { [p, w] = await Promise.all([bridge.progress(), warmNow()]); } catch (e) { console.warn('gate progress', e); if (!disposed) bridge.toast(T('refreshFailed')); return; }
			if (disposed) return;
			const was = {}; ORDER.forEach(id => { was[id] = SP[id].state; });
			absorb(p); absorbWarm(w); renderMap();
			if (CUR) station(CUR, true); else overview();
			new Set(ORDER.filter(id => was[id] !== SP[id].state && SP[id].state !== 'soon').map(gateOf)).forEach(pop);
		},
		// left mid-tour: it stops, and opens again next time
		pause() { paused = true; tourStop(true); flush(); },
		resume() { paused = false; },
		resize() {
			const was = R.classList.contains('narrow'); R.classList.toggle('narrow', mobile()); sheet(SHEET.state);
			if (was !== mobile()) { if (CUR) station(CUR); else overview(); } if (!CUR && !mobile()) fitAll();
		},
		destroy() { disposed = true; TOUR.on = false; cancelAnimationFrame(TOUR.raf); clearTimeout(saveTimer); clearTimeout(hintTimer); flush(); PZ.stop(); window.removeEventListener('keydown', onKey); shadow.innerHTML = ''; },
	};
}
