/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// AP Microeconomics route map. Renders inside the ShadowRoot owned by pages/lojo/route.vue;
// everything Misskey-specific (storage, notes, channels, compose, navigation) goes through `bridge`.
import { UNITS, INTERESTS, SECTIONS, FEATURED } from './content.js';
import { CANVAS, LINES, EXPRESS, PREP, EXITS, POS, SIDE } from './layout.js';
import { PanZoom } from './panzoom.js';
import { UI, TOURTXT, OBT, SHORT } from './strings.js';
import css from './route.css?inline';

const NS = 'http://www.w3.org/2000/svg';
const EXPRESS_IDS = ['1.6', '3.5', '5.3', '6.1'], EXIT = { b1:'A', b2:'B', b3:'C', b4:'D' };
const EXAMDATE = { 2027:'2027-05-03', 2028:'2028-05-01' };   // AP exams start the first Monday of May
const BBOX = { x:-210, y:60, w:2720, h:1440 };              // the drawn network, including the start label
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const LAB = { n:[0, -30, 'middle'], s:[0, 46, 'middle'], e:[28, 8, 'start'], w:[-28, 8, 'end'], ne:[22, -22, 'start'], nw:[-22, -22, 'end'], se:[22, 36, 'start'], sw:[-22, 38, 'end'] };
const pathD = (p, r = 28) => { let d = `M${p[0][0]} ${p[0][1]}`;
	for (let i = 1; i < p.length; i++) { const [x, y] = p[i];
		if (i < p.length - 1) { const [px, py] = p[i - 1], [nx, ny] = p[i + 1], l1 = Math.hypot(x - px, y - py), l2 = Math.hypot(nx - x, ny - y), rr = Math.min(r, l1 / 2, l2 / 2);
			d += ` L${(x - (x - px) / l1 * rr).toFixed(1)} ${(y - (y - py) / l1 * rr).toFixed(1)} Q${x} ${y} ${(x + (nx - x) / l2 * rr).toFixed(1)} ${(y + (ny - y) / l2 * rr).toFixed(1)}`;
		} else d += ` L${x} ${y}`; }
	return d; };

/* nodes */
const NODES = {}, ORDER = [];
UNITS.forEach(u => u.topics.forEach(t => { NODES[t.id] = { ...t, kind:'topic', unit:u }; ORDER.push(t.id); }));
INTERESTS.forEach(i => { NODES[i.id] = { ...i, kind:'interest' }; });
SECTIONS.forEach(s => s.topics.forEach(t => { NODES[t.id] = { ...t, kind:s.kind }; }));
const lineOf = id => { const n = NODES[id]; return !n ? 0 : n.unit ? n.unit.n : n.kind === 'interest' ? lineOf(n.parent) : 0; };
const COLOR = n => `var(--l${n})`;
const dl = id => { const ln = lineOf(id) || 'p'; return EXPRESS_IDS.includes(id) ? `${ln} x` : `${ln}`; };
// one hashtag per stop: its platform notes are ordinary public notes, so they also flow into the timeline
const tagOf = id => /^\d\.\d$/.test(id) ? `APMicro_${id.replace('.', '_')}` : id[0] === 'i' ? `APMicro_side${id.slice(1)}` : id[0] === 'p' ? `APMicro_prep${id.slice(1)}` : `APMicro_exit${EXIT[id] || id}`;

function normalize(raw) {
	const s = raw && typeof raw === 'object' ? raw : {};
	return { st: s.st && typeof s.st === 'object' ? s.st : {}, onboarded: !!s.onboarded, examYear: +s.examYear || 2027, pace: +s.pace || 0,
		first: typeof s.first === 'string' ? s.first : null, firstSeen: s.firstSeen && typeof s.firstSeen === 'object' ? s.firstSeen : {},
		celebrated: !!s.celebrated, hinted: !!s.hinted };
}

export async function mount(shadow, bridge) {
	const LANG = bridge.lang === 'en' ? 'en' : 'zh';
	const T = k => UI[LANG][k], OB = k => OBT[LANG][k], X = TOURTXT[LANG];
	const L = o => (o && (o[LANG] ?? o.zh)) || '';
	const icon = name => `<i class="ti" style="--i:url(${bridge.assets}icons/${name}.svg)"></i>`;
	const media = p => `${bridge.assets}route/${p}`;

	/* ---------- state, saved to the account ---------- */
	const S = normalize(await bridge.load().catch(() => null));
	const ST = S.st;
	let saveTimer = 0, dirty = false, disposed = false, paused = false;
	const flush = () => { if (!dirty) return; dirty = false; bridge.save(JSON.parse(JSON.stringify(S))).catch(() => { dirty = true; bridge.toast(T('saveFailed')); }); };
	const save = () => { dirty = true; clearTimeout(saveTimer); saveTimer = setTimeout(flush, 500); };
	const keep = (k, v) => { S[k] = v; save(); };
	const setStatus = (id, v) => { if (v) ST[id] = v; else delete ST[id]; save(); };

	/* ---------- shell ---------- */
	shadow.innerHTML = `<style>${css}</style><div class="rt">
		<div class="mapwrap" id="mapwrap"><svg class="mapsvg" id="mapsvg"><g id="world"></g></svg></div>
		<aside class="panel" id="panel"><div class="grip"></div><button class="minibar" id="minibar"></button>
			<button class="pcollapse" id="pcollapse" aria-label="collapse">${icon('chevron-left')}</button>
			<div class="pbody" id="pbody"></div><div class="pfoot" id="pfoot"></div></aside>
		<button class="popen" id="popen">${icon('route')}<span>${esc(T('title'))}</span>${icon('chevron-right')}</button>
		<div class="ctrl"><button id="zin" aria-label="zoom in">${icon('plus')}</button><button id="zout" aria-label="zoom out">${icon('minus')}</button>
			<button id="zfit" aria-label="fit">${icon('map')}</button><button id="legbtn" aria-label="legend">${icon('info-circle')}</button></div>
		<div class="legend" id="legend"></div><div class="tip" id="tip"></div><div class="hint" id="hint"></div>
		<div class="tourcap" id="tourcap"><div class="tc-bar"><b></b></div><div class="tc-row"><div class="tc-t"></div><div class="tc-acts"></div></div></div>
		<div class="obm" id="obm"></div>
	</div>`;
	const R = shadow.querySelector('.rt');
	const $ = s => R.querySelector(s), $$ = s => R.querySelectorAll(s);
	const mobile = () => R.clientWidth < 860;
	const done = () => ORDER.filter(i => ST[i] === 'done').length;
	const weeks = () => Math.max(0, Math.ceil((new Date((EXAMDATE[S.examYear] || EXAMDATE[2027]) + 'T00:00:00') - new Date()) / (7 * 864e5)));
	const currentStop = () => ORDER.find(i => ST[i] === 'learning') || ORDER.find(i => !ST[i]) || null;
	let CUR = null, TAB = 'learn', FOCUS = null, PZ;

	/* ---------- map ---------- */
	function label(id, x, y, side, cls = '') {
		const n = NODES[id], [dx, dy, an] = LAB[side || 's'], f = cls.includes('big') ? 1.15 : 1;
		let txt;
		if (id === 'start') txt = T('startL'); else if (id === 'exam') txt = T('examL');
		else if (n.kind === 'topic') txt = `<tspan class="lc">${n.id}</tspan> ${esc(L(n))}`;
		else if (n.kind === 'beyond') { txt = esc(T('exitL')(EXIT[id]) + L(n)); cls += ' exit'; }
		else txt = esc(L(n));
		return `<text class="lab ${cls}" data-l="${dl(id)}" x="${x + dx * f}" y="${y + dy * f}" text-anchor="${an}">${txt}</text>`;
	}
	function renderMap() {
		let g = `<rect x="-3000" y="-3000" width="9000" height="8000" class="paper"/>`;
		const xf = T('xForm');
		g += `<g class="xcard" data-l="x"><rect class="xsh" x="1136" y="284" width="604" height="450" rx="30"/><rect class="bgc" x="1128" y="270" width="604" height="450" rx="30"/>
			<text x="1170" y="330" class="xe">${T('xEye')}</text><text x="1170" y="396" class="xh">${T('xTitle')}</text>
			${T('xBody').map((s, i) => `<text x="1170" y="${456 + i * 40}" class="xb">${s}</text>`).join('')}
			${xf.map(([k, v], i) => `<text x="${1170 + (i % 2) * 284}" y="${596 + Math.floor(i / 2) * 52}" class="xf"><tspan class="k">${k}　</tspan>${v}</text>`).join('')}</g>`;
		LINES.filter(l => l.tag).forEach(l => { const u = UNITS[l.unit - 1], [x, y] = l.tag, d = u.topics.filter(t => ST[t.id] === 'done').length;
			g += `<g class="ltag" data-l="${l.unit}"><rect x="${x - 12}" y="${y - 30}" width="200" height="40" rx="10" fill="${COLOR(l.unit)}"/>
				<text x="${x + 4}" y="${y - 3}" class="ltt">${T('lineN')(l.unit)} · ${esc(L(SHORT[l.unit]))}</text><text x="${x + 4}" y="${y + 34}" class="ltp">${T('lineProg')(d, u.topics.length)}</text></g>`; });
		g += `<g data-l="x"><path d="${pathD(EXPRESS.path)}" class="xcase"/><path d="${pathD(EXPRESS.path)}" class="xline"/><path d="${pathD(EXPRESS.link)}" class="xlink"/></g>`;
		const [tx, ty] = EXPRESS.tag;
		g += `<g class="xtag" data-l="x"><rect x="${tx - 12}" y="${ty - 30}" width="240" height="42" rx="21"/><text x="${tx + 8}" y="${ty - 2}">${T('xTag')}</text></g>`;
		g += `<g data-l="p"><path d="${pathD(PREP.path)}" class="case"/><path d="${pathD(PREP.path)}" class="prep"/><path d="${pathD(EXITS.path)}" class="exits"/>
			<text x="${PREP.path[0][0] + 40}" y="${PREP.path[0][1] - 26}" class="lab exit" style="font-size:16px">${T('prepLine')} →</text></g>`;
		LINES.forEach(l => { g += `<g data-l="${l.unit}"><path d="${pathD(l.path)}" class="case${l.spur ? ' spur' : ''}"/><path d="${pathD(l.path)}" class="line${l.spur ? ' spur' : ''}" style="stroke:${COLOR(l.unit)}"/></g>`; });
		Object.entries(SIDE).forEach(([id, s]) => { const [ax, ay] = POS[s.from], [bx, by] = s.to, ln = lineOf(id);
			g += `<g data-l="${ln}"><path d="M${ax} ${ay} L${bx} ${by}" class="sidep"/></g>
				<g class="stn" data-id="${id}" data-l="${ln}"><circle cx="${bx}" cy="${by}" r="36" class="hitc"/><circle cx="${bx}" cy="${by}" r="19" class="sidec"/><text x="${bx}" y="${by + 7}" class="sidei">✦</text></g>` + label(id, bx, by, s.lab, 'side'); });
		Object.entries(POS).forEach(([id, [x, y, side]]) => {
			const n = NODES[id], st = ST[id] || '', ix = EXPRESS_IDS.includes(id), f = FEATURED[id], ln = lineOf(id) || 'p';
			let s = '';
			if (id === 'start') s = `<circle cx="${x}" cy="${y}" r="30" class="startring"/><circle cx="${x}" cy="${y}" r="22" class="term"/><path d="M${x - 6} ${y - 9} L${x + 10} ${y} L${x - 6} ${y + 9}Z" class="termi"/>`;
			else if (id === 'exam') s = `<rect x="${x - 32}" y="${y - 32}" width="64" height="64" rx="20" class="exam"/><path d="M${x - 12} ${y + 12} L${x - 10} ${y + 2} L${x + 6} ${y - 14} L${x + 12} ${y - 8} L${x - 4} ${y + 8}Z" class="termi"/>`;
			else if (n.kind === 'prep' || n.kind === 'beyond') s = `<circle cx="${x}" cy="${y}" r="14" class="st ${n.kind} ${st}" style="--c:var(--ink)"/>`;
			else {
				const c = COLOR(ln);
				s = ix ? `<circle cx="${x}" cy="${y}" r="26" class="ix"/><circle cx="${x}" cy="${y}" r="15" class="ixin ${st}" style="--c:${c}"/>`
					: `<circle cx="${x}" cy="${y}" r="15" class="st ${st}" style="--c:${c}"/>`;
				if (st === 'done') s += `<path d="M${x - 7} ${y} l5 5 l9 -10" class="chk"/>`;
				if (f && f.video) s += `<g class="play" transform="translate(${x + (ix ? 24 : 16)} ${y - (ix ? 24 : 16)})"><circle r="13"/><path d="M-4 -6 L7 0 L-4 6Z"/></g>`;
			}
			g += `<g class="stn${CUR === id ? ' sel' : ''}" data-id="${id}" data-l="${dl(id)}"><circle cx="${x}" cy="${y}" r="38" class="hitc"/>${s}</g>` + label(id, x, y, side, ix || id === 'exam' || id === 'start' ? 'big' : '');
		});
		const me = currentStop(); if (me) { const [x, y] = POS[me];
			g += `<g transform="translate(${x} ${y})"><g class="me"><circle r="30" class="pulse"/><g transform="translate(0 -46)"><path d="M0 24 C-6 13 -18 4 -18 -9 A18 18 0 1 1 18 -9 C18 4 6 13 0 24Z"/><circle cx="0" cy="-9" r="6" class="mehole"/></g><text y="-86" class="metxt">${T('here')}</text></g></g>`; }
		$('#world').innerHTML = g;
		$$('#world .ltag, #world .xtag').forEach(t => { const tx = t.querySelector('text'), r = t.querySelector('rect'); r.setAttribute('width', tx.getComputedTextLength() + 34); });
		if (FOCUS) $('#world').setAttribute('data-focus', FOCUS); else $('#world').removeAttribute('data-focus');
	}

	/* ---------- panel ---------- */
	const SHEET = { state:'peek', px:228 };
	const sheetPx = s => { const H = R.clientHeight; return s === 'min' ? 62 : s === 'peek' ? Math.min(228, H * .45) : s === 'half' ? Math.round(H * .54) : H - 12; };
	function sheet(s) { SHEET.state = s; SHEET.px = mobile() ? sheetPx(s) : 0; R.style.setProperty('--sheet', SHEET.px + 'px'); $('#panel').classList.toggle('min', mobile() && s === 'min'); }
	const inset = () => R.classList.contains('touring') ? (mobile() ? { l:0, t:8, r:0, b:210 } : { l:0, t:24, r:0, b:170 })
		: mobile() ? { l:0, t:8, r:0, b:SHEET.px } : { l:R.classList.contains('pclosed') ? 0 : 432, t:16, r:64, b:0 };

	function overview() {
		const tl = T('tiles');
		const tb = `<button class="tourbtn" id="tourbtn"><i class="tb-ic"><svg viewBox="0 0 24 24"><path d="M8 5.5 L19 12 L8 18.5Z"/></svg></i><span><b>${T('tourBtn')}</b><small>${T('tourS')}</small></span><em>→</em></button>`;
		const lede = `<p class="lede">${T('lede')}</p>`;
		let h = `<div class="eyebrow">${T('eyebrow')}</div><h1 class="ptitle">${T('title')}</h1>${mobile() ? tb + lede : lede + tb}
			<div class="tiles"><div class="tile"><small>${tl[0]}</small><b>${done()}<span> / ${ORDER.length}</span></b></div>
			<div class="tile"><small>${tl[1]}</small><b>${weeks()}<span> ${T('weekZ')}</span></b></div></div>
			<div class="sh"><h3>${T('linesH')}</h3><span>${T('linesN')}</span></div>`;
		UNITS.forEach(u => { const d = u.topics.filter(t => ST[t.id] === 'done').length;
			h += `<button class="row" data-line="${u.n}"><i class="dot" style="background:${COLOR(u.n)}"></i><span class="t"><b>${T('lineName')(u.n, esc(L(u)))}</b><small>${T('lineSub')(u.topics.length, esc(L(u.topics[0])))}</small></span><span class="r">${d} / ${u.topics.length}</span></button>`; });
		h += `<button class="row" data-line="x"><i class="dot xdot"></i><span class="t"><b>${T('xRow')}</b><small>${T('xRowS')}</small></span><span class="r">MB = MC</span></button>`;
		h += `<button class="row" data-line="p"><i class="dot" style="background:var(--ink)"></i><span class="t"><b>${T('pRow')}</b><small>${T('pRowS')}</small></span><span class="r"></span></button>`;
		h += `<div class="sh"><h3>${T('sideH')}</h3><span>${T('sideN')}</span></div><div class="chips">${INTERESTS.map(i => `<button class="chipb side" data-go="${i.id}">✦ ${esc(L(i))}</button>`).join('')}</div>`;
		h += `<div class="sh"><h3>${T('subjH')}</h3><span>${T('subjN')}</span></div><div class="chips">${T('boards').map(([b, on]) => `<span class="chipb${on ? ' on' : ''}">${b}${on ? '' : ` · ${T('soon')}`}</span>`).join('')}</div>`;
		h += `<p class="legal">${T('legal')}</p>`;
		$('#pbody').innerHTML = h;
		$('#minibar').innerHTML = `<b>${T('title')}</b><span>${done()} / ${ORDER.length}</span>`;
		const cs = currentStop(), cl = cs && (ST[cs] === 'learning' || done()) ? `${T('contL')}${LANG === 'zh' ? '：' : ': '}${cs} ${esc(L(NODES[cs]))}` : T('cta');
		$('#pfoot').innerHTML = `<button class="cta" id="gohere">${icon('current-location')}<span class="ctat">${cl}</span></button>`;
		$$('#pbody [data-line]').forEach(b => { b.onclick = () => focusLine(b.dataset.line); });
		$$('#pbody [data-go]').forEach(b => { b.onclick = () => go(b.dataset.go); });
		$('#gohere').onclick = () => go(currentStop() || '1.1');
		$('#tourbtn').onclick = () => tourStart();
		sheet(SHEET.state === 'full' ? 'half' : SHEET.state);
	}

	function station(id) {
		const n = NODES[id], f = FEATURED[id] || {}, ln = lineOf(id), st = ST[id] || '';
		const tabs = n.kind === 'topic' ? ['learn', 'quiz', 'ai', 'peers'] : n.kind === 'prep' ? ['learn', 'peers'] : ['about', 'peers'];
		if (!tabs.includes(TAB)) TAB = tabs[0];
		let tags = '';
		if (n.kind === 'topic') tags = `<span class="tg" style="background:${COLOR(ln)}">${T('lineN')(ln)} · ${n.id}</span>${EXPRESS_IDS.includes(id) ? `<span class="tg gold">${T('xChip')}</span>` : ''}${f.video ? `<span class="tg vid">▶ ${T('vid')}</span>` : ''}`;
		else if (n.kind === 'interest') tags = `<span class="tg side">✦ ${T('sideChip')}</span>`;
		else tags = `<span class="tg ink">${n.kind === 'prep' ? T('prepChip') : T('beyondChip') + ' ' + EXIT[id]}</span>`;
		$('#pbody').innerHTML = `<button class="back" id="back"><i>${icon('chevron-left')}</i>${T('back')}</button>
			<div class="tagrow">${tags}</div><h1 class="ptitle">${esc(L(n))}</h1>${n.full ? `<div class="en-full">${esc(n.full)}</div>` : ''}
			${n.kind === 'topic' || n.kind === 'prep' ? `<div class="seg">${['learning', 'done', 'skip'].map(s => `<button data-s="${s}" class="${st === s ? 'on' : ''}">${T('status')[s]}</button>`).join('')}</div>` : ''}
			<div class="tabs">${tabs.map(t => `<button data-t="${t}" class="${t === TAB ? 'on' : ''}">${t === 'ai' ? `<img src="${media('moss.png')}" alt="">` : ''}${T('tabs')[t]}</button>`).join('')}</div>
			<div id="tabbody">${BODY[TAB](n, f)}</div>`;
		$('#pbody').scrollTop = 0;
		$('#minibar').innerHTML = `<b>${n.kind === 'topic' ? `<em style="color:${COLOR(ln)}">${n.id}</em> ` : ''}${esc(L(n))}</b><span>${T('status')[st] || ''}</span>`;
		const foot = TAB === 'learn' && n.kind === 'topic' ? (f.quiz ? ['quiz', T('goQuiz')] : ['ai', T('goAsk')]) : null;
		$('#pfoot').innerHTML = foot ? `<button class="cta" data-tab="${foot[0]}">${foot[1]}</button>` : `<button class="cta" id="gohere">${icon('current-location')}<span class="ctat">${T('cta')}</span></button>`;
		$('#back').onclick = () => { CUR = null; bridge.setHash(null); overview(); renderMap(); };
		$$('#pbody .seg button').forEach(b => { b.onclick = () => { setStatus(id, ST[id] === b.dataset.s ? '' : b.dataset.s); renderMap(); station(id); onboardDone(id); }; });
		$$('#pbody .tabs button').forEach(b => { b.onclick = () => { TAB = b.dataset.t; station(id); }; });
		$$('.rt [data-tab]').forEach(b => { b.onclick = () => { TAB = b.dataset.tab; station(id); }; });
		const gh = $('#gohere'); if (gh) gh.onclick = () => go(currentStop() || '1.1');
		wire(n, f);
		if (SHEET.state === 'peek' || SHEET.state === 'min') sheet('half');
		onboardStation(id);
	}

	const linkBtn = id => { const n = NODES[id]; if (!n) return ''; const ln = lineOf(id);
		return `<button data-go="${id}" class="${n.kind === 'interest' ? 'side' : ''}" style="--c:${ln ? COLOR(ln) : 'var(--ink)'}">${n.kind === 'topic' ? n.id + ' ' : ''}${esc(L(n))}</button>`; };
	const MATRIX = () => LANG === 'zh'
		? `<table class="mx"><tr><th></th><th>B 定高价</th><th>B 定低价</th></tr><tr><th>A 定高价</th><td>8, 8</td><td>2, 10</td></tr><tr><th>A 定低价</th><td>10, 2</td><td class="ne">4, 4</td></tr></table><div class="meta">每一格是（A 的利润，B 的利润）。</div>`
		: `<table class="mx"><tr><th></th><th>B high</th><th>B low</th></tr><tr><th>A high</th><td>8, 8</td><td>2, 10</td></tr><tr><th>A low</th><td>10, 2</td><td class="ne">4, 4</td></tr></table><div class="meta">Each cell is (A's profit, B's profit).</div>`;
	const SOON = (h, s, extra = '') => `<div class="soon"><b>${h}</b><p>${s}</p>${extra}</div>`;
	const RELATED = { '1.4':['2.9'], '2.9':['1.4'], '2.8':['4.2', '6.2'], '4.2':['2.8', '3.5', '6.4'], '6.4':['4.2'], '2.6':['3.7', '5.1', '6.1'], '3.7':['2.6', '4.1'], '5.1':['2.6'], '6.2':['2.8'],
		'1.6':['3.5', '5.3', '6.1'], '3.5':['1.6', '4.2', '5.3'], '5.3':['3.5', '6.1'], '6.1':['1.6', '3.5', '2.6'], '3.2':['4.2'] };

	const BODY = {
		learn(n, f) {
			if (n.kind === 'prep') return `<p class="lead">${esc(L({ zh:n.dzh, en:n.den }))}</p><div class="meta">${T('prepS')}</div>${n.id === 'p3' ? SOON(T('mockSoon'), '') : ''}`;
			let h = '';
			if (f.video) h += `<div class="vid"><video src="${media(L(f.video))}" poster="${media(L(f.poster))}" controls playsinline preload="metadata"></video></div><div class="vcap">${T('vcap')(L(f.vtitle))}</div>`;
			h += `<p class="lead">${esc(L({ zh:n.dzh, en:n.den }))}</p>`;
			if (EXPRESS_IDS.includes(n.id)) h += `<div class="gnote">${T('xNote')}</div>`;
			if (f.matrix) h += MATRIX();
			if (f.exam) h += `<div class="h4">${T('examH')}</div><ul class="pts">${L(f.exam).map(s => `<li class="${/常见丢分|Common mistake/.test(s) ? 'warn' : ''}">${esc(s)}</li>`).join('')}</ul>`;
			if (f.alevel) h += `<div class="meta">${esc(L(f.alevel))}${LANG === 'zh' ? '。' : '. '}${T('alevelNote')}</div>`;
			if (!f.video) h += SOON(T('soonV'), T('soonVs'));
			const i = ORDER.indexOf(n.id), side = INTERESTS.filter(x => x.parent === n.id), rel = RELATED[n.id] || [];
			h += `<div class="h4">${T('relH')}</div><div class="links">${i > 0 ? linkBtn(ORDER[i - 1]) : ''}${i + 1 < ORDER.length ? linkBtn(ORDER[i + 1]) : ''}</div>`;
			if (rel.length) h += `<div class="h4">${T('xferH')}</div><div class="links">${rel.map(linkBtn).join('')}</div>`;
			if (side.length) h += `<div class="h4">${T('branches')}</div><div class="links">${side.map(x => linkBtn(x.id)).join('')}</div>`;
			return h;
		},
		about(n) {
			let h = `<p class="lead">${esc(L({ zh:n.dzh, en:n.den }))}</p>`;
			if (n.kind === 'interest') { if (n.next) h += `<div class="gnote">${T('nextVideo')}</div>`; h += `<div class="h4">${T('relTo')}</div><div class="links">${linkBtn(n.parent)}</div>`; }
			else h += `<div class="meta">${T('beyondS')}</div>`;
			return h;
		},
		quiz(n, f) {
			if (!f.quiz) return SOON(T('soonQ'), T('soonQs'), `<button class="pillbtn" data-tab="ai">${T('goAsk')}</button>`);
			return `<p class="hint">${T('quizHint')}</p>` + (f.matrix ? MATRIX() + '<p></p>' : '') + f.quiz.map((q, qi) => `<div class="q" data-q="${qi}"><div class="qt">${qi + 1}. ${esc(L(q.q))}</div>
				${q.o.map((o, oi) => `<button data-o="${oi}">${String.fromCharCode(65 + oi)}　${esc(L(o))}</button>`).join('')}<div class="exp">${esc(L(q.x))}</div></div>`).join('') + `<div class="gate" id="gate"></div>`;
		},
		ai(n, f) {
			const qs = f.ai ? f.ai.map((x, i) => [L(x.q), i]) : T('aiGen').map((q, i) => [q, 'g' + i]);
			return `<div class="moss"><img src="${media('moss.png')}" alt=""><div><b>${T('moss')}</b><span class="ai">AI</span><small>${T('mossRole')}</small></div></div>
				<div class="chat" id="chat"><div class="msg ai">${esc(T('aiHello')(L(n)))}</div></div>
				<div class="sugg">${qs.map(([q, k]) => `<button data-k="${k}">${esc(q)}</button>`).join('')}</div>
				<form class="ask" id="ask"><input placeholder="${T('ask')}"><button>${T('send')}</button></form>`;
		},
		peers(n) {
			let h = `<div class="card"><div class="h">${T('postsH')}<span class="tagname">#${tagOf(n.id)}</span></div><div class="s">${T('peersS')}</div>
				<div class="notes" id="notes"><div class="s">${T('loading')}</div></div>
				<div class="cardacts"><button class="pillbtn" id="write">${T('write')}</button><button class="pillbtn ghost" id="seeall">${T('all')}</button></div></div>`;
			if (n.kind === 'topic') h += `<div class="card" id="groupcard" hidden></div>
				<div class="card"><div class="h">${T('teachH')}</div><div class="s">${ST[n.id] === 'done' ? T('teachDone') : T('teachTodo')}</div></div>`;
			return h;
		},
	};

	function ago(iso) {
		const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000), rtf = new Intl.RelativeTimeFormat(LANG === 'zh' ? 'zh-CN' : 'en', { numeric:'auto' });
		for (const [u, k] of [['day', 86400], ['hour', 3600], ['minute', 60]]) if (s >= k) return rtf.format(-Math.floor(s / k), u);
		return rtf.format(-Math.floor(s), 'second');
	}
	async function loadPeers(n) {
		const tag = tagOf(n.id), box = $('#notes');
		$('#write').onclick = () => bridge.compose(`#${tag} `);
		$('#seeall').onclick = () => bridge.openTag(tag);
		try {
			const notes = await bridge.notes(tag, 5);
			if (!box.isConnected) return;
			box.innerHTML = notes.length ? notes.map(nt => { const u = nt.user || {}, t = String(nt.text || '').replace(new RegExp(`#${tag}\\b`, 'gi'), '').trim();
				return `<button class="note" data-note="${esc(nt.id)}">${u.avatarUrl ? `<img src="${esc(u.avatarUrl)}" alt="">` : '<i class="av0"></i>'}<span><b>${esc(u.name || '@' + (u.username || ''))}</b><small>${esc(ago(nt.createdAt))}</small><em>${esc(t.length > 140 ? t.slice(0, 140) + '…' : t)}</em></span></button>`; }).join('')
				: `<div class="s">${T('postsEmpty')}</div>`;
			box.querySelectorAll('[data-note]').forEach(b => { b.onclick = () => bridge.openNote(b.dataset.note); });
		} catch { if (box.isConnected) box.innerHTML = `<div class="s">${T('loadFail')}</div>`; }
		if (n.kind !== 'topic') return;
		const ch = await bridge.channel(n.unit.n).catch(() => null), card = $('#groupcard');
		if (!ch || !card || !card.isConnected) return;
		const paint = () => { card.hidden = false;
			card.innerHTML = `<div class="h">${esc(ch.name)}</div><div class="s">${T('groupS')} · ${T('members')(ch.usersCount ?? 0)}</div>
				<div class="cardacts"><button class="pillbtn${ch.isFollowing ? ' done' : ''}" id="gjoin">${ch.isFollowing ? T('joined') : T('join')}</button><button class="pillbtn ghost" id="gopen">${T('open')}</button></div>`;
			$('#gjoin').onclick = async () => { const on = !ch.isFollowing; try { await bridge.follow(ch.id, on); ch.isFollowing = on; ch.usersCount = (ch.usersCount ?? 0) + (on ? 1 : -1); paint(); } catch { /* the native error toast already explained it */ } };
			$('#gopen').onclick = () => bridge.openChannel(ch.id); };
		paint();
	}

	function typeInto(el, text) { let i = 0; const id = setInterval(() => { if (disposed || !el.isConnected) return clearInterval(id); i += 3; el.textContent = text.slice(0, i); if (i >= text.length) clearInterval(id); $('#pbody').scrollTop = 1e6; }, 18); }
	function say(cls, text, typed) { const m = document.createElement('div'); m.className = 'msg ' + cls; $('#chat').appendChild(m); if (typed) typeInto(m, text); else m.textContent = text; }
	function wire(n, f) {
		$$('#pbody [data-go]').forEach(b => { b.onclick = () => go(b.dataset.go); });
		let right = 0;
		$$('#pbody .q').forEach(q => q.querySelectorAll('button').forEach(b => { b.onclick = () => {
			if (q.classList.contains('answered')) return; const a = f.quiz[+q.dataset.q].a, ok = +b.dataset.o === a;
			q.classList.add('answered'); b.classList.add(ok ? 'right' : 'wrong'); q.querySelector(`[data-o="${a}"]`).classList.add('right'); right += ok;
			if ($$('#pbody .q.answered').length === f.quiz.length) {
				const all = right === f.quiz.length, g = $('#gate');
				g.innerHTML = all ? `<b>${T('gateOK')}</b><button class="pillbtn" data-pass>${T('gateBtn')} ✓</button>` : `<b>${T('gateNo')(right, f.quiz.length)}</b><button class="pillbtn ghost" data-retry>${T('retry')}</button>`;
				g.className = 'gate on' + (all ? ' ok' : '');
				const p = g.querySelector('[data-pass]'); if (p) p.onclick = () => { setStatus(n.id, 'done'); renderMap(); station(n.id); onboardDone(n.id); };
				const r = g.querySelector('[data-retry]'); if (r) r.onclick = () => station(n.id);
			} }; }));
		$$('#pbody .sugg button').forEach(b => { b.onclick = () => { const k = b.dataset.k; say('me', b.textContent);
			const ans = f.ai && !String(k).startsWith('g') ? L(f.ai[+k].a) : L({ zh:n.dzh, en:n.den });
			setTimeout(() => say('ai', ans, true), 350); }; });
		const form = $('#ask'); if (form) form.onsubmit = e => { e.preventDefault(); const v = form.querySelector('input').value.trim(); if (!v) return; bridge.compose(`#${tagOf(n.id)} ${v}`); form.querySelector('input').value = ''; };
		if (TAB === 'peers') loadPeers(n);
	}

	/* ---------- navigation ---------- */
	const posOf = id => POS[id] || (SIDE[id] && SIDE[id].to);
	const fitAll = () => PZ.fit(.97, BBOX);
	function go(id) {
		if (!NODES[id]) return; CUR = id; TAB = NODES[id].kind === 'topic' || NODES[id].kind === 'prep' ? 'learn' : 'about';
		bridge.setHash(id); FOCUS = null; R.classList.remove('pclosed'); station(id); renderMap();
		const p = posOf(id); if (p) requestAnimationFrame(() => PZ.focus(p[0], p[1], Math.max(PZ.v.k, mobile() ? .72 : .75)));
	}
	function focusLine(k) {
		FOCUS = FOCUS === k ? null : k; renderMap();
		if (!FOCUS) return fitAll();
		let pts = [];
		if (k === 'x') pts = EXPRESS.path; else if (k === 'p') pts = PREP.path.concat(EXITS.path);
		else LINES.filter(l => l.unit === +k).forEach(l => { pts = pts.concat(l.path); });
		const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), pad = 120;
		PZ.fit(.92, { x:Math.min(...xs) - pad, y:Math.min(...ys) - pad, w:Math.max(...xs) - Math.min(...xs) + pad * 2, h:Math.max(...ys) - Math.min(...ys) + pad * 2 });
	}
	function sheetDrag() {
		const g = $('.grip'), p = $('#panel'); let y0 = 0, h0 = 0, t0 = 0, dy = 0, on = false;
		g.addEventListener('pointerdown', e => { if (!mobile()) return; on = true; y0 = e.clientY; h0 = SHEET.px; t0 = performance.now(); dy = 0; try { g.setPointerCapture(e.pointerId); } catch { /* synthetic events */ } p.classList.add('dragging'); });
		g.addEventListener('pointermove', e => { if (!on) return; dy = e.clientY - y0; const h = Math.max(56, Math.min(sheetPx('full'), h0 - dy)); R.style.setProperty('--sheet', h + 'px'); p.classList.toggle('min', h < 120); });
		g.addEventListener('pointerup', () => { if (!on) return; on = false; p.classList.remove('dragging');
			if (Math.abs(dy) < 6) return sheet({ min:'peek', peek:'half', half:'full', full:'half' }[SHEET.state]);
			const v = dy / Math.max(1, performance.now() - t0), h = h0 - dy;
			const up = { min:'peek', peek:'half', half:'full', full:'full' }, down = { full:'half', half:'peek', peek:'min', min:'min' };
			if (v < -.5) return sheet(up[SHEET.state]); if (v > .5) return sheet(down[SHEET.state]);
			sheet(['min', 'peek', 'half', 'full'].reduce((a, b) => Math.abs(sheetPx(b) - h) < Math.abs(sheetPx(a) - h) ? b : a)); });
	}

	/* ---------- tour: a little train rides the map, the camera follows ---------- */
	const TOUR = { on:false, raf:0, cam:null, target:null, follow:.12, step:0, runId:0 };
	const TOTAL_STEPS = 10;
	const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); (parent || TOUR.layer).appendChild(e); return e; };
	function camLoop() { if (!TOUR.on) return; const c = TOUR.cam, t = TOUR.target, a = TOUR.follow;
		c.x += (t.x - c.x) * a; c.y += (t.y - c.y) * a; c.k += (t.k - c.k) * a * .7; PZ.focus(c.x, c.y, c.k, false); TOUR.raf = requestAnimationFrame(camLoop); }
	// every await in the tour goes through tween(); a stopped or restarted tour rejects it, so a stale run can't keep going
	const tween = (dur, fn) => { const id = TOUR.runId; return new Promise((res, rej) => { const t0 = performance.now();
		const step = t => { if (!TOUR.on || TOUR.runId !== id) return rej(new Error('stopped')); const p = Math.min(1, (t - t0) / dur); fn(p); if (p < 1) requestAnimationFrame(step); else res(); };
		requestAnimationFrame(step); }); };
	const wait = ms => tween(ms, () => {});
	const kRide = () => mobile() ? .82 : .95, kExp = () => mobile() ? .66 : .7;
	const fly = (x, y, k, dur) => { const s = { ...TOUR.target }; TOUR.follow = .2;
		return tween(dur, p => { const e = ease(p); TOUR.target = { x:s.x + (x - s.x) * e, y:s.y + (y - s.y) * e, k:s.k + (k - s.k) * e }; }); };
	const flyFit = dur => fly(BBOX.x + BBOX.w / 2, BBOX.y + BBOX.h / 2, PZ.fitK(.97, BBOX), dur);
	function pass(id, opts = {}) {
		const s = $(`#world .stn[data-id="${id}"]`); if (s) { s.classList.remove('pass'); void s.getBBox(); s.classList.add('pass'); }
		if (opts.formulas && EXPRESS_IDS.includes(id)) { const [x, y] = POS[id], f = { '1.6':'MU / P', '3.5':'MR = MC', '5.3':'MRP = MRC', '6.1':'MSB = MSC' }[id];
			const g = el('g', { class:'fchip', transform:`translate(${x} ${y - 70})` }); el('rect', { x:-74, y:-26, width:148, height:44, rx:22 }, g); el('text', { y:5 }, g).textContent = f; }
	}
	function ride(points, dur, k, opts = {}) {
		const d = pathD(points), path = el('path', { d, fill:'none', stroke:'none' }), len = path.getTotalLength();
		const trail = el('path', { d, class:'trail', 'stroke-dasharray':len, 'stroke-dashoffset':len });
		TOUR.layer.appendChild(TOUR.train); TOUR.follow = .14;
		const hit = new Set();
		return tween(dur, p => {
			const e = ease(p), at = len * e, pt = path.getPointAtLength(at), ah = path.getPointAtLength(Math.min(len, at + 2));
			const ang = Math.atan2(ah.y - pt.y, ah.x - pt.x) * 180 / Math.PI;
			TOUR.train.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${(at + 2 > len ? TOUR.ang : ang).toFixed(1)})`); if (at + 2 <= len) TOUR.ang = ang;
			trail.setAttribute('stroke-dashoffset', (len - at).toFixed(1));
			TOUR.target = { x:pt.x, y:pt.y, k };
			for (const [id, [x, y]] of Object.entries(POS)) if (!hit.has(id) && Math.hypot(x - pt.x, y - pt.y) < 16) { hit.add(id); pass(id, opts); }
		});
	}
	// frame one whole line: measure everything tagged with it (track, stops, names, tag)
	function lineBox(u) {
		const w = $('#world'), had = w.classList.contains('zlow'); w.classList.remove('zlow');
		let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
		w.querySelectorAll(`[data-l~="${u}"]:not(.side)`).forEach(e => { const b = e.getBBox(); if (!b.width && !b.height) return;
			x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); });
		if (had) w.classList.add('zlow'); const p = mobile() ? 24 : 50; return { x:x0 - p, y:y0 - p, w:x1 - x0 + 2 * p, h:y1 - y0 + 2 * p };
	}
	async function showLine(u, text, same) {
		const w = $('#world'); caption(text, { same }); w.setAttribute('data-focus', String(u)); w.classList.add('t-line');
		const b = lineBox(u); await fly(b.x + b.w / 2, b.y + b.h / 2, Math.min(PZ.fitK(.94, b), 1.15), 950);
		const trails = LINES.filter(l => l.unit === u).map(l => { const p = el('path', { d:pathD(l.path), class:'trail' }), len = p.getTotalLength();
			p.setAttribute('stroke-dasharray', len); p.setAttribute('stroke-dashoffset', len); return [p, len]; });
		const hit = new Set();
		await tween(1500, q => { const e = ease(q); trails.forEach(([p, len]) => { p.setAttribute('stroke-dashoffset', (len * (1 - e)).toFixed(1));
			const pt = p.getPointAtLength(len * e); for (const [id, [x, y]] of Object.entries(POS)) if (!hit.has(id) && Math.hypot(x - pt.x, y - pt.y) < 16) { hit.add(id); pass(id); } }); });
		await wait(900); trails.forEach(([p]) => p.remove());
	}
	function caption(text, opts = {}) {
		const c = $('#tourcap'), t = c.querySelector('.tc-t'); TOUR.step = Math.min(TOTAL_STEPS, TOUR.step + (opts.same ? 0 : 1));
		t.classList.remove('in'); void c.offsetWidth; t.textContent = text; t.classList.add('in');
		c.querySelector('.tc-bar b').style.width = TOUR.step / TOTAL_STEPS * 100 + '%';
		const firstRun = opts.end && !S.onboarded;
		if (firstRun) t.textContent = OB('tEnd');
		c.querySelector('.tc-acts').innerHTML = firstRun ? `<button class="pillbtn" id="tob">${OB('tGo')} →</button><button class="pillbtn ghost" id="tlater">${OB('tLater')}</button>`
			: opts.end ? `<button class="pillbtn" id="tgo">${X.go}</button><button class="pillbtn ghost" id="tagain">${X.again}</button>`
				: `<button class="tc-skip" id="tskip">${X.skip}</button>`;
		const on = (sel, fn) => { const b = $(sel); if (b) b.onclick = fn; };
		on('#tskip', () => tourStop());
		on('#tgo', () => { tourStop(true); go(currentStop() || '1.1'); });
		on('#tagain', () => { tourStop(true); setTimeout(tourStart, 50); });
		on('#tob', () => { tourStop(true); onboardQuestions(); });
		on('#tlater', () => { tourStop(true); keep('onboarded', true); });
	}
	async function tourRun() {
		const w = $('#world'), P = id => POS[id].slice(0, 2);
		caption(X.intro); await fly(...P('start'), kRide(), 1500); await wait(400);
		caption(X.l1); await ride([P('start'), P('1.1')], 600, kRide()); await ride(LINES[0].path, 5600, kRide());
		caption(X.xfer); TOUR.follow = .12; TOUR.target = { ...TOUR.target, k:kExp() };
		w.classList.add('t-x'); await wait(1600);
		caption(X.ride); await ride([P('1.6'), P('6.1')], 6200, kExp(), { formulas:true });
		caption(X.mbmc, { same:true }); await wait(2100); w.classList.remove('t-x');
		TOUR.layer.querySelectorAll('.fchip').forEach(c => c.remove()); TOUR.train.remove();
		for (let i = 0; i < 5; i++) await showLine(i + 2, X.lines[i], i > 0);
		w.removeAttribute('data-focus'); w.classList.remove('t-line'); await flyFit(1100);
		caption(X.side); w.classList.add('t-side'); await wait(2000);
		caption(X.crowd); w.classList.remove('t-side');
		const sample = ORDER.filter((_, i) => i % 3 === 0); for (const id of sample) { pass(id); await wait(70); } await wait(800);
		caption(X.final); await fly(...P('6.1'), kRide(), 1300);
		await ride([P('6.1'), [2200, 1000], [2040, 1160], [2040, 1460], P('exam')], 4800, kRide());
		caption(X.exits); await ride(EXITS.path, 2300, kRide()); await wait(700);
		TOUR.train.remove();
		caption(X.end, { end:true }); await fly(...P(currentStop() || '1.1'), kRide(), 1500);
	}
	function tourStart() {
		if (TOUR.on || disposed) return; TOUR.on = true; TOUR.step = 0; TOUR.runId++;
		$('#legend').classList.remove('on'); R.classList.add('touring');
		TOUR.layer = el('g', { class:'tourlayer' }, $('#world'));
		TOUR.train = el('g', { class:'train' }); TOUR.train.innerHTML = `<circle r="36" class="glow"/><rect x="-30" y="-15" width="60" height="30" rx="15" class="car"/><rect x="-14" y="-7" width="10" height="14" rx="3" class="win"/><rect x="2" y="-7" width="10" height="14" rx="3" class="win"/><path d="M22 -6 L28 0 L22 6" class="nose"/>`;
		TOUR.train.remove(); TOUR.ang = 0;
		const c = PZ.center(); TOUR.cam = { ...c }; TOUR.target = { ...c };
		camLoop(); tourRun().catch(() => {});
	}
	function tourStop(keepView) {
		if (!TOUR.on) return; TOUR.on = false; TOUR.runId++; cancelAnimationFrame(TOUR.raf);
		R.classList.remove('touring');
		const w = $('#world'); w.classList.remove('t-x', 't-side', 't-line'); w.removeAttribute('data-focus');
		if (TOUR.layer) TOUR.layer.remove();
		overview(); renderMap();
		if (!keepView) PZ.focus(TOUR.cam.x, TOUR.cam.y, TOUR.cam.k, false);
	}

	/* ---------- onboarding: welcome → tour → 3 questions → route → first stop → first arrival ---------- */
	const ANS = {};
	function modal(html, cls = '') { const m = $('#obm'); m.className = 'obm on ' + cls; m.innerHTML = `<div class="obcard">${html}</div>`; return m; }
	const closeModal = () => { $('#obm').className = 'obm'; };
	function onboardWelcome() {
		modal(`<div class="obtrain"><svg viewBox="0 0 120 40"><path d="M6 28 H114" class="obrail"/><circle cx="20" cy="28" r="7" class="obstop"/><circle cx="100" cy="28" r="7" class="obstop"/><g class="obcar"><rect x="40" y="16" width="40" height="22" rx="11"/><rect x="50" y="22" width="7" height="10" rx="2" class="obwin"/><rect x="62" y="22" width="7" height="10" rx="2" class="obwin"/></g></svg></div>
			<div class="obeye">${OB('wEye')}</div><h2>${OB('wTitle')}</h2><p>${OB('wText')}</p>
			<div class="obacts"><button class="cta" id="obgo">${OB('wGo')} →</button><button class="obtext" id="obskip">${OB('wSkip')}</button></div>`, 'welcome');
		$('#obgo').onclick = () => { closeModal(); tourStart(); };
		$('#obskip').onclick = () => { closeModal(); keep('onboarded', true); };
	}
	function onboardQuestions(i = 0) {
		const qs = OB('qs'), q = qs[i];
		modal(`<div class="obstep">${OB('step')(i + 1, qs.length)}${i ? `<button class="obtext" id="obback">${OB('back')}</button>` : ''}</div>
			<h2>${q.t}</h2><div class="obopts">${q.o.map(([v, a, b]) => `<button class="obopt${ANS[q.k] === v ? ' on' : ''}" data-v="${v}"><b>${a}</b>${b ? `<small>${b}</small>` : ''}</button>`).join('')}</div>
			<div class="obbar"><b style="width:${(i + 1) / qs.length * 100}%"></b></div>`, 'quiz');
		$$('#obm .obopt').forEach(b => { b.onclick = () => { ANS[q.k] = b.dataset.v; if (i + 1 < qs.length) onboardQuestions(i + 1); else onboardResult(); }; });
		const bk = $('#obback'); if (bk) bk.onclick = () => onboardQuestions(i - 1);
	}
	function onboardResult() {
		const start = ANS.start || '1.1', pace = +(ANS.pace || 5), year = +(ANS.examYear || 0);
		const all = ORDER.concat(['p1', 'p2', 'p3']), left = all.length - all.indexOf(start), wks = Math.ceil(left / pace);
		const end = new Date(Date.now() + wks * 7 * 864e5), name = NODES[start] ? (NODES[start].kind === 'topic' ? start + ' ' : '') + L(NODES[start]) : start;
		let note = OB('rNoDate');
		if (EXAMDATE[year]) { const gap = Math.round((new Date(EXAMDATE[year] + 'T00:00:00') - end) / (7 * 864e5)); note = gap >= 0 ? OB('rAhead')(gap) : OB('rTight')(-gap); }
		modal(`<div class="obeye">${OB('rEye')}</div>
			<div class="obroute"><i></i><div><b>${OB('rFrom')(esc(name))}</b><small>${OB('rPace')(pace)} · ${OB('rDone')(end.getFullYear(), end.getMonth() + 1)}</small></div></div>
			<p>${note}</p><div class="obacts"><button class="cta" id="obstart">${OB('rGo')} →</button></div>`, 'result');
		$('#obstart').onclick = () => {
			S.examYear = year || 2027; S.pace = pace; if (!ST[start]) ST[start] = 'learning'; S.first = start; S.onboarded = true; save();
			closeModal(); go(start);
		};
	}
	function onboardStation(id) {
		if (S.first !== id || ST[id] === 'done' || !NODES[id] || NODES[id].kind !== 'topic') return;
		const seen = S.firstSeen, box = document.createElement('div'); box.className = 'obfirst';
		box.innerHTML = `<b>${OB('fTitle')}</b>` + OB('fSteps').map((s, i) => `<div class="${seen[i] ? 'ok' : ''}"><i>${seen[i] ? '✓' : i + 1}</i>${s}</div>`).join('');
		const tabs = $('#pbody .tabs'); if (tabs) tabs.parentNode.insertBefore(box, tabs);
		const mark = i => { if (seen[i]) return; seen[i] = 1; save(); const row = box.children[i + 1]; row.classList.add('ok'); row.querySelector('i').textContent = '✓'; };
		const v = $('#pbody video'); if (v) v.addEventListener('timeupdate', () => { if (v.currentTime > 5) mark(0); });
		if (TAB === 'quiz') mark(1);
	}
	async function onboardDone(id) {
		if (S.celebrated || ST[id] !== 'done') return;
		S.celebrated = true; save();
		const ln = lineOf(id) || 1, next = ORDER[ORDER.indexOf(id) + 1];
		const conf = Array.from({ length:26 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 7) * .07}s;--c:${['#E8603F', '#F2C14E', '#2340A3', '#3F8F86'][i % 4]};--r:${(i * 53) % 360}deg"></i>`).join('');
		modal(`<div class="confetti">${conf}</div><div class="obbadge">✓</div><h2>${OB('cTitle')}</h2><p>${OB('cText')}</p>
			<div class="obstat">${OB('cStat')(done(), ORDER.length)}</div><div id="obgroupbox"></div>
			<button class="obgroup" id="obsay"><span><b>${OB('cSay')}</b><small>${OB('cSayS')}</small></span><em>✎</em></button>
			<div class="obacts">${next ? `<button class="cta" id="obnext">${OB('cNext')} →</button>` : ''}</div>`, 'celebrate');
		$('#obsay').onclick = () => { closeModal(); bridge.compose(`#${tagOf(id)} ${OB('cSayText')}`); };
		const n = $('#obnext'); if (n) n.onclick = () => { closeModal(); if (!ST[next]) setStatus(next, 'learning'); go(next); };
		$('#obm').onclick = e => { if (e.target.id === 'obm') closeModal(); };
		const ch = await bridge.channel(ln).catch(() => null), box = $('#obgroupbox');
		if (!ch || !box || !box.isConnected) return;
		const paint = () => { box.innerHTML = `<button class="obgroup${ch.isFollowing ? ' on' : ''}" id="obgroup"><span><b>${ch.isFollowing ? OB('cJoined') : OB('cGroup')(ln)}</b><small>${OB('cGroupS')}</small></span><em>${ch.isFollowing ? '✓' : '+'}</em></button>`;
			$('#obgroup').onclick = async () => { if (ch.isFollowing) return; try { await bridge.follow(ch.id, true); ch.isFollowing = true; paint(); } catch { /* native toast */ } }; };
		paint();
	}

	/* ---------- wiring ---------- */
	const tip = $('#tip');
	PZ = PanZoom($('#mapsvg'), $('#world'), { w:CANVAS.w, h:CANVAS.h, min:.15, max:2.4, inset,
		onChange: v => { $('#world').classList.toggle('zlow', v.k < .62); const m = $('#mapwrap'); m.style.backgroundSize = `${40 * v.k}px ${40 * v.k}px`; m.style.backgroundPosition = `${v.x}px ${v.y}px`; },
		onInteract: () => { if (TOUR.on) tourStop(true); } });
	const world = $('#world');
	world.addEventListener('pointerover', e => { const s = e.target.closest('.stn'), n = s && NODES[s.dataset.id]; if (!n || e.pointerType === 'touch') return;
		tip.innerHTML = (n.kind === 'topic' ? `<i style="background:${COLOR(lineOf(n.id))}"></i><span>${n.id}</span>` : '') + esc(n.kind === 'beyond' ? T('exitL')(EXIT[n.id]) + L(n) : L(n)); tip.classList.add('on'); });
	world.addEventListener('pointermove', e => { const r = R.getBoundingClientRect(); tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 16}px)`; });
	world.addEventListener('pointerout', e => { if (e.target.closest('.stn')) tip.classList.remove('on'); });
	world.addEventListener('click', e => { const s = e.target.closest('.stn');
		if (s && s.dataset.id === 'start') return tourStart();
		if (s && NODES[s.dataset.id]) return go(s.dataset.id);
		if (FOCUS) { FOCUS = null; renderMap(); }
		if (mobile() && SHEET.state !== 'min') sheet('min'); });
	sheetDrag();
	$('#zin').onclick = () => PZ.zoomBy(1.3); $('#zout').onclick = () => PZ.zoomBy(1 / 1.3);
	$('#zfit').onclick = () => { FOCUS = null; renderMap(); fitAll(); };
	$('#legbtn').onclick = () => $('#legend').classList.toggle('on');
	$('#pcollapse').onclick = () => R.classList.add('pclosed');
	$('#popen').onclick = () => R.classList.remove('pclosed');
	$('#minibar').onclick = () => sheet(CUR ? 'half' : 'peek');
	$('#legend').innerHTML = `<b>${T('legendH')}</b>` + T('legend').map(([k, s]) => `<div><i class="lg ${k}"></i>${s}</div>`).join('');
	const onKey = e => { if (e.key !== 'Escape' || paused) return; if (TOUR.on) tourStop(); else if (CUR) $('#back').click(); };
	window.addEventListener('keydown', onKey);

	R.classList.toggle('narrow', mobile());
	sheet('peek'); overview(); renderMap();
	const start = bridge.initialHash && NODES[bridge.initialHash] ? bridge.initialHash : null;
	if (start) { fitAll(); go(start); }
	else if (mobile()) { const [x, y] = POS[currentStop() || '1.1']; PZ.focus(x - 10, y + 110, .72, false);
		if (!S.hinted) { const h = $('#hint'); h.textContent = T('hint'); h.classList.add('on'); keep('hinted', true); setTimeout(() => h.classList.remove('on'), 3600); } }
	else fitAll();
	if (!S.onboarded && !start) setTimeout(() => { if (!disposed && !paused) onboardWelcome(); }, 600);

	return {
		tour: () => tourStart(),
		fit: () => { FOCUS = null; renderMap(); fitAll(); },
		legend: () => $('#legend').classList.toggle('on'),
		pause() { paused = true; if (TOUR.on) tourStop(true); $$('video').forEach(v => v.pause()); flush(); },
		resume() { paused = false; },
		resize() { const was = R.classList.contains('narrow'); R.classList.toggle('narrow', mobile()); sheet(SHEET.state);
			if (was !== mobile()) { CUR ? station(CUR) : overview(); } if (!CUR && !TOUR.on && !mobile()) fitAll(); },
		destroy() { disposed = true; TOUR.on = false; cancelAnimationFrame(TOUR.raf); clearTimeout(saveTimer); flush(); PZ.stop(); window.removeEventListener('keydown', onKey); shadow.innerHTML = ''; },
	};
}
