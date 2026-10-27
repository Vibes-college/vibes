/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// Gate route map (闯关线路图) for course packs with META.kind 'gates' (IELTS). Renders inside the ShadowRoot owned by pages/lojo/route.vue.
// Every stop is a gate with one short test: pass it to unlock the next stop, or jump ahead. Progress comes from the server
// (bridge.progress → lojo/gates/progress) and the gates run on their own page (bridge.openGate → /gate/<course>/<gate>);
// the account registry (bridge.load / bridge.save) only remembers that the welcome card was seen.
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

function normalize(raw) {
	const s = raw && typeof raw === 'object' ? raw : {};
	return { onboarded: !!s.onboarded, hinted: !!s.hinted };
}

// course: a gate course pack (courses/<id>/index.js); catalog: [{ id, short:{zh,en}, ready }] for the course chips
export async function mount(shadow, bridge, course, catalog = []) {
	const { META, LINES, INTERCHANGES = [], CANVAS, POS, PATHS, TAGPOS = {}, BBOX } = course;
	const LANG = bridge.lang === 'en' ? 'en' : 'zh';
	const T = k => course.TEXT[LANG][k] ?? GATE_UI[LANG][k];
	const L = o => (o && (o[LANG] ?? o.zh)) || '';
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
				failStreak: +s.failStreak || 0, passedAt: s.passedAt || null, via: s.via || null }
				: { state: 'soon', sets: 0, attempts: 0, best: null, total: null, pass: null, failStreak: 0, passedAt: null, via: null };
		});
		const rows = p && Array.isArray(p.lines) ? p.lines : [];
		LP = {};
		LINES.forEach(l => {
			const ids = l.stations.map(s => s.id), r = rows.find(x => x && x.line === l.n);
			LP[l.n] = { live: r ? !!r.live && !!l.live : !!l.live && ids.some(id => SP[id].state !== 'soon'),
				current: r && NODES[r.current] ? r.current : ids.find(id => SP[id].state === 'open') ?? null,
				passed: ids.filter(id => SP[id].state === 'passed').length, total: ids.length };
		});
		LAST = p && p.last && NODES[p.last.station] ? p.last : null;
	}
	const passedN = () => ORDER.filter(id => SP[id].state === 'passed').length;
	// attempts belong to a gate; the two stops of an interchange share theirs
	const triesN = () => { const g = {}; ORDER.forEach(id => { g[gateOf(id)] = Math.max(g[gateOf(id)] || 0, SP[id].attempts); }); return Object.values(g).reduce((a, b) => a + b, 0); };
	// "I'm here": the next gate on the line you tried last, or the first stop for a newcomer; nothing while no gate is open yet
	function pinStop() {
		if (!ORDER.some(id => SP[id].state !== 'soon')) return null;
		const ln = LAST ? NODES[LAST.station].n : (LINES.find(l => LP[l.n].live) || LINES[0]).n;
		return LP[ln].current || (LAST ? LAST.station : FIRST);
	}
	const shownAt = id => IX[id] ? IX[id].ids.reduce((a, b) => RANK[SP[b].state] > RANK[SP[a].state] ? b : a) : id;
	const behind = id => NODES[id].line.stations.slice(0, NODES[id].i).filter(s => SP[s.id].state !== 'passed').length;

	/* ---------- saved to the account: only the welcome card and the phone hint ---------- */
	const [saved, first] = await Promise.all([bridge.load().catch(() => null), bridge.progress().then(p => ({ p }), e => ({ e }))]);
	const S = normalize(saved);
	let saveTimer = 0, hintTimer = 0, dirty = false, disposed = false, paused = false;
	const flush = () => { if (!dirty) return; dirty = false; bridge.save(JSON.parse(JSON.stringify(S))).catch(() => { dirty = true; bridge.toast(T('saveFailed')); }); };
	const save = () => { dirty = true; clearTimeout(saveTimer); saveTimer = setTimeout(flush, 500); };
	const keep = (k, v) => { S[k] = v; save(); };
	absorb(first.p ?? null);
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
		if (FOCUS) $('#world').setAttribute('data-focus', FOCUS); else $('#world').removeAttribute('data-focus');
	}

	// a gate that just changed (and the stops it lit up) pops once
	function pop(key) { const s = $(`#world .stn[data-key="${key}"]`); if (!s) return; s.classList.remove('pass'); void s.getBBox(); s.classList.add('pass'); }

	/* ---------- panel ---------- */
	const SHEET = { state: 'peek', px: 228 };
	const sheetPx = s => { const H = R.clientHeight; return s === 'min' ? 62 : s === 'peek' ? Math.min(228, H * .45) : s === 'half' ? Math.round(H * .54) : H - 12; };

	function sheet(s) { SHEET.state = s; SHEET.px = mobile() ? sheetPx(s) : 0; R.style.setProperty('--sheet', SHEET.px + 'px'); $('#panel').classList.toggle('min', mobile() && s === 'min'); }

	const inset = () => mobile() ? { l: 0, t: 8, r: 0, b: SHEET.px } : { l: R.classList.contains('pclosed') ? 0 : 432, t: 16, r: 64, b: 0 };

	function lineSub(l) {
		const lp = LP[l.n];
		if (!lp.live) return T('lineSoon');
		if (lp.current) return T('next')(band(lp.current));
		return lp.passed === lp.total ? T('lineDone') : T('lineWait');
	}

	function overview() {
		const tl = T('tiles'), done = passedN(), me = pinStop();
		let h = `<div class="eyebrow">${T('eyebrow')}</div><h1 class="ptitle">${T('title')}</h1><p class="lede">${T('lede')}</p>
			<div class="tiles two"><div class="tile"><small>${tl[0]}</small><b>${done}<span> / ${ORDER.length}</span></b></div>
			<div class="tile"><small>${tl[1]}</small><b>${triesN()}<span> ${T('timesZ')}</span></b></div></div>
			<div class="sh"><h3>${T('linesH')}</h3><span>${T('linesN')}</span></div>`;
		LINES.forEach(l => {
			const lp = LP[l.n];
			h += `<button class="row${lp.live ? '' : ' soon'}" data-line="${l.n}"><i class="dot" style="background:${COLOR(l.n)}"></i><span class="t"><b>${T('lineName')(l.n, esc(L(l)))}</b><small>${lineSub(l)}</small></span><span class="r">${lp.passed} / ${lp.total}</span></button>`;
		});
		h += `<div class="sh"><h3>${T('subjH')}</h3></div><div class="chips">${catalog.map(c => `<button class="chipb${c.id === META.id ? ' on' : ''}" data-course="${esc(c.id)}">${esc(L(c.short))}</button>`).join('')}<button class="chipb" data-catalog>${T('allMaps')}</button></div>`;
		h += `<p class="legal">${T('legal')}</p>`;
		$('#pbody').innerHTML = h;
		$('#minibar').innerHTML = `<b>${T('title')}</b><span>${done} / ${ORDER.length}</span>`;
		const fresh = !LAST && !done, label = !me ? T('startAt')(band(FIRST)) : fresh ? T('startAt')(band(me)) : T('contL') + stTitle(me);
		$('#pfoot').innerHTML = `<button class="cta" id="gohere">${icon('current-location')}<span class="ctat">${label}</span></button>`;
		$$('#pbody [data-line]').forEach(b => { b.onclick = () => focusLine(b.dataset.line); });
		$$('#pbody [data-course]').forEach(b => { b.onclick = () => { if (b.dataset.course !== META.id) bridge.openCourse(b.dataset.course); }; });
		$('#pbody [data-catalog]').onclick = () => bridge.openCatalog();
		$('#gohere').onclick = () => go(pinStop() || FIRST);
		sheet(SHEET.state === 'full' ? 'half' : SHEET.state);
	}

	const day = iso => new Date(iso).toLocaleDateString(LANG === 'zh' ? 'zh-CN' : 'en', { month: 'short', day: 'numeric' });

	function gateBody(id) {
		const n = NODES[id], s = SP[id], x = IX[id], o = otherOf(id), extra = (T('lineRule') || {})[n.n] || '';
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
		} else if (s.state === 'locked') {
			h += `<div class="gst locked"><div class="gst-h"><i class="gst-ic"><svg viewBox="-12 -12 24 24">${lockG(0, 1, .95)}</svg></i><b>${T('state').locked}</b></div><p>${T('lockedMsg')(behind(id))}</p><div class="meta">${rule}</div>${metaH}</div>`;
		} else h += `<div class="soon"><b>${T('soonMsg')}</b><p>${T('soonS')}</p></div>`;
		if (s.failStreak >= 3 && s.state !== 'soon' && s.state !== 'passed') {
			const p = prevOf(id);
			h += `<div class="gst warn"><p>${T('streak')(s.failStreak, p ? band(p) : null)}</p>${p ? `<button class="pillbtn ghost" data-go="${p}">${T('goPrev')(band(p))}</button>` : ''}</div>`;
		}
		const rows = ['part', 'focus', 'types', 'pace'].filter(k => n[k]);
		if (rows.length) h += `<div class="h4">${T('infoH')}</div><dl class="grows">${rows.map(k => `<div><dt>${T('rows')[k]}</dt><dd>${esc(L(n[k]))}</dd></div>`).join('')}</dl>`;
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

	// the main action sits in the panel footer, so it stays in reach on a phone
	function footer(id) {
		const s = SP[id], g = gateOf(id), cur = LP[NODES[id].n].current;
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
			<div class="tabs">${['gate', 'peers'].map(t => `<button data-t="${t}" class="${t === TAB ? 'on' : ''}">${T('tabs')[t]}</button>`).join('')}</div>
			<div id="tabbody">${TAB === 'gate' ? gateBody(id) : peersBody(id)}</div>`;
		$('#pbody').scrollTop = top;
		$('#minibar').innerHTML = `<b><em style="color:${c}">${id}</em> ${stTitle(id)}</b><span>${T('state')[s.state]}</span>`;
		$('#pfoot').innerHTML = footer(id);
		$('#back').onclick = () => { CUR = null; bridge.setHash(null); overview(); renderMap(); };
		$$('#pbody .tabs button').forEach(b => { b.onclick = () => { TAB = b.dataset.t; station(id); }; });
		$$('#panel [data-go]').forEach(b => { b.onclick = () => go(b.dataset.go); });
		$$('#panel [data-gate]').forEach(b => { b.onclick = () => bridge.openGate(b.dataset.gate); });
		if (TAB === 'peers') loadPeers(id);
		if (SHEET.state === 'peek' || SHEET.state === 'min') sheet('half');
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

	/* ---------- welcome: shown once ---------- */
	function modal(html, cls = '') { const m = $('#obm'); m.className = 'obm on ' + cls; m.innerHTML = `<div class="obcard">${html}</div>`; return m; }

	const closeModal = () => { $('#obm').className = 'obm'; };

	function welcome() {
		const st = T('state'), me = pinStop() || FIRST, fresh = !LAST && !passedN(), sep = LANG === 'zh' ? '' : ' ';
		const live = LINES.filter(l => LP[l.n].live).map(l => T('lineName')(l.n, esc(L(l))));
		const stops = [['passed', 40], ['open', 130], ['locked', 220]].map(([k, x]) => marker(x, 26, k, 'var(--l1)', 13) + `<text x="${x}" y="68" class="wlab">${st[k]}</text>`).join('');
		modal(`<svg class="gwel" viewBox="0 0 260 76" aria-hidden="true"><path d="M30 26 H230" class="wtrack"/>${stops}</svg>
			<div class="obeye">${T('wEye')}</div><h2>${T('wTitle')}</h2>
			<p>${T('wText')}${live.length && live.length < LINES.length ? sep + T('wLive')(live.join(LANG === 'zh' ? '、' : ', ')) : ''}</p><p class="obnote">${T('wNote')}</p>
			<div class="obacts"><button class="cta" id="obgo">${fresh ? T('startAt')(band(me)) : T('wGoNext')(stTitle(me))} →</button><button class="obtext" id="obskip">${T('wSkip')}</button></div>`, 'welcome');
		$('#obgo').onclick = () => { closeModal(); keep('onboarded', true); go(me); };
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
	const onKey = e => { if (e.key !== 'Escape' || paused) return; if ($('#obm').classList.contains('on')) $('#obskip')?.click(); else if (CUR) $('#back').click(); };
	window.addEventListener('keydown', onKey);

	R.classList.toggle('narrow', mobile());
	sheet('peek'); overview(); renderMap();
	const start = bridge.initialHash && NODES[bridge.initialHash] ? bridge.initialHash : null;
	if (start) { fitAll(); go(start); } else if (mobile()) {
		const [x, y] = POS[pinStop() || FIRST]; PZ.focus(x - 10, y + 110, .72, false);
		if (!S.hinted && S.onboarded) { const h = $('#hint'); h.textContent = T('hint'); h.classList.add('on'); keep('hinted', true); hintTimer = setTimeout(() => h.classList.remove('on'), 3600); }
	} else fitAll();
	if (!S.onboarded && !start) setTimeout(() => { if (!disposed && !paused) welcome(); }, 500);

	return {
		fit: () => { FOCUS = null; renderMap(); fitAll(); },
		legend: () => $('#legend').classList.toggle('on'),
		// re-read progress (e.g. back from a gate) and redraw; a failed call keeps what is on screen
		async refresh() {
			if (disposed) return;
			let p;
			try { p = await bridge.progress(); } catch (e) { console.warn('gate progress', e); if (!disposed) bridge.toast(T('refreshFailed')); return; }
			if (disposed) return;
			const was = {}; ORDER.forEach(id => { was[id] = SP[id].state; });
			absorb(p); renderMap();
			if (CUR) station(CUR, true); else overview();
			new Set(ORDER.filter(id => was[id] !== SP[id].state && SP[id].state !== 'soon').map(gateOf)).forEach(pop);
		},
		pause() { paused = true; flush(); },
		resume() { paused = false; },
		resize() {
			const was = R.classList.contains('narrow'); R.classList.toggle('narrow', mobile()); sheet(SHEET.state);
			if (was !== mobile()) { if (CUR) station(CUR); else overview(); } if (!CUR && !mobile()) fitAll();
		},
		destroy() { disposed = true; clearTimeout(saveTimer); clearTimeout(hintTimer); flush(); PZ.stop(); window.removeEventListener('keydown', onKey); shadow.innerHTML = ''; },
	};
}
