/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* 闯关 · 纸上地图（正式版）。
   画面和动画来自闯关原型 v2（闯关体验设计）；数据全部来自服务器（lojo/quest/*），页面不自己算规则：
   心、连胜、冻结卡、经验、关卡开没开、Boss 备战，都以服务器回来的为准。
   跟社区的连接：社区页面在 window.__vibesQuest 上放 { api, go, query }，见文件末尾的说明。 */
(() => {
'use strict';

/* ================= 跟社区的连接 ================= */
let Q = null;
try { if (window.parent && window.parent !== window && window.parent.__vibesQuest) Q = window.parent.__vibesQuest; } catch (e) { Q = null; }
if (!Q && window.__vibesQuest) Q = window.__vibesQuest;

function fetchApi(ep, params) {
	let token = null;
	try { token = JSON.parse(localStorage.getItem('account') || 'null')?.token ?? null; } catch (e) { token = null; }
	if (!token) return Promise.reject({ code: 'NOT_SIGNED_IN', message: '先登录社区' });
	return fetch('/api/' + ep, {
		method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit',
		body: JSON.stringify({ ...(params || {}), i: token }),
	}).then(async res => {
		if (res.status === 204) return null;
		const body = await res.json().catch(() => null);
		if (!res.ok) throw { code: body?.error?.code ?? 'HTTP_' + res.status, message: body?.error?.message ?? '' };
		return body;
	}, () => { throw { code: 'NETWORK', message: '网络断了' }; });
}
const api = (ep, params) => (Q && typeof Q.api === 'function') ? Promise.resolve(Q.api(ep, params || {})) : fetchApi(ep, params);
function go(path) {
	if (!path) return;
	if (/^https?:\/\//.test(path)) { window.open(path, '_blank', 'noopener'); return; }
	if (Q && typeof Q.go === 'function') Q.go(path); else window.location.href = path;
}
const QUERY = (() => {
	if (Q && Q.query) return { book: Q.query.book ?? null, level: Q.query.level ?? null };
	const u = new URLSearchParams(window.location.search);
	return { book: u.get('book'), level: u.get('level') };
})();

/* ================= 小工具 ================= */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const svgNS = 'http://www.w3.org/2000/svg';
const show = (el, d = 'flex') => { (typeof el === 'string' ? $(el) : el).style.display = d; };
const hide = el => { (typeof el === 'string' ? $(el) : el).style.display = 'none'; };

/* ================= 声音（Kenney，CC0，见 sounds/CREDITS.txt） ================= */
const SOUNDS = ['tap', 'open', 'stamp', 'pass', 'fail', 'heartbreak', 'whoosh', 'scratch', 'chest', 'milestone', 'freeze', 'heartup', 'warn', 'reset', 'tick', 'bosshit', 'lose', 'latch', 'dooropen', 'bookslide', 'bookflip', 'bookclose', 'bagin', 'lighton'];
const SND_KEY = 'vibesQuestSound';
let soundOn = true;
try { soundOn = localStorage.getItem(SND_KEY) !== '0'; } catch (e) { soundOn = true; }
const S = {};
let actx = null;
SOUNDS.forEach(n => { S[n] = new Audio('./sounds/' + n + '.mp3'); S[n].preload = 'auto'; });
function play(n, v = 1) { if (!soundOn || !S[n]) return; const a = S[n].cloneNode(); a.volume = v; a.play().catch(() => {}); }
function tune(notes, type = 'triangle', gap = 0.09, len = 0.28, vol = 0.16) {
	if (!soundOn) return;
	try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
	const t0 = actx.currentTime + 0.02;
	notes.forEach((f, i) => {
		const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f;
		g.gain.setValueAtTime(0, t0 + i * gap); g.gain.linearRampToValueAtTime(vol, t0 + i * gap + 0.012); g.gain.exponentialRampToValueAtTime(0.0008, t0 + i * gap + len);
		o.connect(g).connect(actx.destination); o.start(t0 + i * gap); o.stop(t0 + i * gap + len + 0.05);
	});
}
function drawSnd() { $('#sndBtn').textContent = soundOn ? '🔊' : '🔇'; $('#sndBtn').title = soundOn ? '声音：开' : '声音：关'; }
$('#sndBtn').onclick = () => { soundOn = !soundOn; try { localStorage.setItem(SND_KEY, soundOn ? '1' : '0'); } catch (e) { /* 存不了就只管这一次 */ } drawSnd(); play('tap'); };
drawSnd();

function toast(t, ms = 1800) { const el = $('#toast'); el.textContent = t; gsap.killTweensOf(el); gsap.fromTo(el, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.25 }); gsap.to(el, { opacity: 0, duration: 0.3, delay: ms / 1000 }); }
function say(el, html) { el.innerHTML = html; gsap.fromTo(el, { scale: 0.85 }, { scale: 1, transformOrigin: '0 100%', duration: 0.45, ease: 'back.out(2)' }); }
const miaSay = h => say($('#miaSay'), h);
function bounce(el) { if (el) gsap.fromTo(el, { scale: 0.8 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,.35)', transformOrigin: '50% 50%' }); }
const AR = () => $('#app').getBoundingClientRect();
function ctr(el) { const a = AR(), r = el.getBoundingClientRect(); return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2, w: r.width, h: r.height }; }
function errText(e) {
	const c = e?.code;
	if (c === 'NO_HEARTS') return '心打光了';
	if (c === 'LEVEL_LOCKED') return '这关还没开：先过前面连着它的一关';
	if (c === 'BOSS_NOT_READY') return '备战还没齐';
	if (c === 'NO_SUCH_ATTEMPT') return '这一局已经结束了，回地图重新开';
	if (c === 'NOT_SIGNED_IN') return '先登录社区';
	if (c === 'RATE_LIMIT_EXCEEDED') return '点得太快了，歇一下再来';
	return '网卡了一下，再试一次';
}

/* ================= 服务器的数据 ================= */
let D = null;          // lojo/quest/show 最近一次的结果
let clockSkew = 0;     // 服务器时间 - 本机时间
let NODE = {};         // id → 节点
let firstPaint = true;
const serverNow = () => Date.now() + clockSkew;
const nodeById = id => NODE[id];
const bookBySlug = slug => D?.books.find(b => b.slug === slug);
const MAXH = () => D?.maxHearts ?? 5;

/* 回满时间：每天北京时间 8:00、20:00 */
function refillLabel() {
	if (!D) return '';
	const at = new Date(D.nextRefillAt), bj = d => new Date(d.getTime() + 8 * 3600e3);
	const h = bj(at).getUTCHours(), sameDay = bj(at).toISOString().slice(0, 10) === bj(new Date(serverNow())).toISOString().slice(0, 10);
	return h === 20 ? '今晚 20:00' : sameDay ? '早上 8:00' : '明早 8:00';
}
function leftText(ms) {
	const s = Math.max(0, Math.round(ms / 1000));
	return [s / 3600 | 0, (s % 3600 / 60) | 0, s % 60].map(x => String(x).padStart(2, '0')).join(':');
}

/* ================= 心 ================= */
const heartSVG = on => `<svg viewBox="0 0 16 16"><path d="M8 4 c-1.5 -3 -7 -2.5 -6 1.5 c.6 2.4 3.6 4.4 6 6.5 c2.4 -2.1 5.4 -4.1 6 -6.5 c1 -4 -4.5 -4.5 -6 -1.5z" fill="${on ? '#E8603F' : '#E9E1D2'}" stroke="#141E52" stroke-width="1.2"/></svg>`;
let shownHearts = 0;
function drawHearts(n) {
	shownHearts = n;
	const h = [...Array(MAXH())].map((_, i) => heartSVG(i < n)).join('');
	['#hearts', '#qHearts', '#bHearts'].forEach(s => { $(s).innerHTML = h; });
	const rc = $('#refillChip'), want = n < MAXH();
	if (want && rc.style.display !== 'flex') { rc.style.display = 'flex'; gsap.from(rc, { scale: 0, duration: 0.45, ease: 'back.out(3)' }); } else if (!want) rc.style.display = 'none';
	tickHeartClock();
}
function loseHeart(where, n) { // where：现在看得见的那排心
	play('heartbreak');
	const el = $$(where + ' svg')[n];
	if (el) gsap.timeline().to(el, { scale: 1.6, duration: 0.12 }).to(el, { y: 40, rotation: 40, opacity: 0, duration: 0.5, ease: 'power2.in' }).add(() => drawHearts(n));
	else drawHearts(n);
}
function gainHeart(fromEl, n, done) { // 一颗心从按钮飞到顶栏
	const a = AR(), f = fromEl.getBoundingClientRect(), t = $('#heartChip').getBoundingClientRect();
	const el = document.createElement('div'); el.className = 'flyHeart'; el.innerHTML = heartSVG(true); $('#app').appendChild(el);
	gsap.set(el, { left: f.left - a.left + f.width / 2 - 15, top: f.top - a.top + f.height / 2 - 15, scale: 0.4 });
	play('heartup');
	gsap.timeline().to(el, { scale: 1.6, duration: 0.25, ease: 'back.out(3)' })
		.to(el, { left: t.left - a.left + t.width / 2 - 15, top: t.top - a.top + t.height / 2 - 15, scale: 0.6, duration: 0.6, ease: 'power2.in' })
		.add(() => {
			el.remove(); drawHearts(n);
			gsap.fromTo('#heartChip', { scale: 1.35 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,.35)' }); tune([660, 880], 'sine', 0.08, 0.25, 0.1);
			if (done) done();
		});
}
let heartTimer = null;
function tickHeartClock() {
	const t = $('#heartT');
	if (!D || shownHearts >= MAXH()) { t.textContent = ''; t.title = ''; return; }
	const left = Date.parse(D.nextRefillAt) - serverNow();
	if (left <= 0) { t.textContent = ''; refresh(); return; }
	t.textContent = leftText(left); t.title = `${refillLabel()} 回满 5 颗`;
}
heartTimer = setInterval(tickHeartClock, 1000);

/* ================= 地图 ================= */
const CHECK = '<circle r="7" fill="none" stroke="#E8603F" stroke-width="1.5" transform="rotate(-12)"/><path d="M-3.5 0 l2.5 2.5 l4.5 -5" fill="none" stroke="#E8603F" stroke-width="1.8" stroke-linecap="round"/>';
const PREP = { guide: ['📕', '锦囊'], gear: ['🎧', '装备'], news: ['📰', '情报'] };

function target() { // 图钉插在哪：第一个开着没过的关；都过了就是 Boss
	if (!D) return null;
	const ns = D.chapter.nodes;
	return ns.find(n => n.kind === 'level' && n.state === 'open') ?? ns.find(n => n.kind === 'boss' && n.state !== 'locked') ?? null;
}
function edgePath(a, b, k) {
	const A = NODE[a], B = NODE[b], mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1, o = k * 14;
	return `M${A.x} ${A.y} Q${mx - dy / l * o} ${my + dx / l * o} ${B.x} ${B.y}`;
}
const cleared = n => n && (n.state === 'done' || (n.state === 'open' && n.kind !== 'level' && n.kind !== 'boss'));
function nodeInner(n, cur) {
	const lab = esc(n.label);
	if (n.kind === 'start') return '<circle r="6" fill="#141E52"/><text class="lab" y="20" text-anchor="middle">起点</text>';
	if (n.kind === 'level') {
		const done = n.state === 'done', locked = n.state === 'locked';
		return `<circle r="${cur ? 14 : 11}" fill="${cur ? '#FCE7DF' : done ? '#FFFDF8' : '#F6F1E7'}" stroke="${cur ? '#E8603F' : '#141E52'}" stroke-width="${cur ? 2.4 : 1.6}" ${locked ? 'stroke-dasharray="2 2"' : ''}/>` +
			(done ? CHECK : `<text y="4" text-anchor="middle" font-size="10" fill="${cur ? '#E8603F' : '#a99e88'}">${lab}</text>`) +
			(n.practice && !done ? `<circle r="${cur ? 18 : 15}" fill="none" stroke="#3E9E7A" stroke-width="1.3" stroke-dasharray="2 3"/>` : '') +
			(done ? `<text class="lab" y="25" text-anchor="middle" font-size="10">${lab}</text>` : '');
	}
	const tick = n.state === 'done' ? CHECK : '';
	if (n.kind === 'gear') return `<path d="M-18 14 V-2 h36 V14z" fill="#FFFDF8" stroke="#141E52" stroke-width="1.5"/><path d="M-21 -2 q5 7 10.5 0 q5 7 10.5 0 q5 7 10.5 0 q5 7 10.5 0 v-9 h-42z" fill="#3E9E7A" stroke="#141E52" stroke-width="1.5" stroke-linejoin="round"/><text x="0" y="11" text-anchor="middle" font-size="11">🎧</text><text class="lab" y="28" text-anchor="middle">${lab}</text><g transform="translate(20 -14)">${tick}</g>`;
	if (n.kind === 'news') return `<rect x="-18" y="-4" width="36" height="22" rx="2" fill="#FFFDF8" stroke="#141E52" stroke-width="1.5"/><path d="M-22 -4 h44 l-4 -10 h-36z" fill="#2340A3" stroke="#141E52" stroke-width="1.5" stroke-linejoin="round"/><rect x="-12" y="2" width="10" height="12" fill="#F6F1E7" stroke="#141E52"/><rect x="2" y="2" width="10" height="12" fill="#F6F1E7" stroke="#141E52"/><text class="lab" y="32" text-anchor="middle">${lab}</text><g transform="translate(22 -16)">${tick}</g>`;
	if (n.kind === 'shelf') return `<rect x="-20" y="-8" width="40" height="28" fill="#FFFDF8" stroke="#141E52" stroke-width="1.5"/><path d="M-25 -6 L0 -22 L25 -6 Z" fill="#E8603F" stroke="#141E52" stroke-width="1.5" stroke-linejoin="round"/><rect x="-14" y="-2" width="4" height="15" fill="#2340A3"/><rect x="-9" y="1" width="4" height="12" fill="#3E9E7A"/><rect x="-4" y="-1" width="4" height="14" fill="#ECB637"/><rect x="5" y="4" width="10" height="16" fill="#141E52"/><text class="lab" y="34" text-anchor="middle">${lab}</text><g transform="translate(24 -18)">${tick}</g>`;
	if (n.kind === 'boss') {
		const ready = D.bossReady && n.state !== 'locked';
		return `<path d="M-30 22 V-8 Q-30 -30 0 -30 Q30 -30 30 -8 V22Z" fill="#141E52" stroke="#141E52" stroke-width="1.5"/>
			<path id="bossDoor" d="M-16 22 V-4 Q-16 -16 0 -16 Q16 -16 16 -4 V22Z" fill="${ready ? '#ECB637' : '#2a336a'}" stroke="#ECB637" stroke-width="1.5"/>
			<text y="-19" text-anchor="middle" font-size="8.5" fill="#ECB637">BOSS</text><text y="8" text-anchor="middle" font-size="9.5" fill="${ready ? '#141E52' : '#FFFDF8'}">${n.state === 'done' ? '已打赢' : '守门人'}</text>
			<g id="prep" transform="translate(0 36)">
				<rect x="-50" y="-10" width="100" height="20" rx="10" fill="#FFFDF8" stroke="#141E52" stroke-width="1.3"/>
				<text x="-44" y="4" font-size="9" fill="#141E52">备战</text>
				${['guide', 'gear', 'news'].map((k, i) => { const on = D.prep[k]; return `<g id="pp-${k}" transform="translate(${-8 + i * 22} 0)"><circle r="8" fill="${on ? '#E3F2EA' : '#F6F1E7'}" stroke="${on ? '#3E9E7A' : '#cbbfa8'}" stroke-width="1.4" ${on ? '' : 'stroke-dasharray="2 2"'}/><text y="3.5" text-anchor="middle" font-size="9" opacity="${on ? 1 : 0.35}">${PREP[k][0]}</text></g>`; }).join('')}
			</g>`;
	}
	return '';
}
function drawMap() {
	NODE = {}; D.chapter.nodes.forEach(n => { NODE[n.id] = n; });
	const tg = target();
	const edges = $('#edges'), nodes = $('#nodes');
	gsap.killTweensOf('#recEdge');
	edges.innerHTML = ''; nodes.innerHTML = '';
	D.chapter.edges.forEach(([a, b], i) => {
		if (!NODE[a] || !NODE[b]) return;
		const d = edgePath(a, b, i % 2 ? 1 : -1);
		const s = cleared(NODE[a]) && NODE[b].state === 'done' ? 'done' : (cleared(NODE[a]) && tg && b === tg.id) ? 'rec' : 'todo';
		const base = document.createElementNS(svgNS, 'path'); base.setAttribute('d', d); base.setAttribute('fill', 'none');
		base.setAttribute('stroke', s === 'rec' ? '#E8603F' : '#cbbfa8'); base.setAttribute('stroke-width', s === 'rec' ? 3 : 2.6); base.setAttribute('stroke-dasharray', s === 'rec' ? '5 6' : '2 7'); base.setAttribute('stroke-linecap', 'round');
		if (s === 'rec') base.classList.add('recEdge');
		edges.appendChild(base);
		if (s === 'done') {
			const ink = document.createElementNS(svgNS, 'path'); ink.setAttribute('d', d); ink.setAttribute('class', 'inkE'); ink.setAttribute('fill', 'none'); ink.setAttribute('stroke', '#141E52'); ink.setAttribute('stroke-width', '3'); ink.setAttribute('stroke-linecap', 'round');
			edges.appendChild(ink);
			if (firstPaint) { const L = ink.getTotalLength(); ink.style.strokeDasharray = L; ink.style.strokeDashoffset = L; }
		}
	});
	D.chapter.nodes.forEach(n => {
		const g = document.createElementNS(svgNS, 'g'); g.setAttribute('class', 'nd' + (n.state === 'locked' ? ' locked' : '')); g.id = 'nd-' + n.id; g.dataset.id = n.id;
		g.setAttribute('transform', `translate(${n.x} ${n.y})`);
		const inner = document.createElementNS(svgNS, 'g'); inner.setAttribute('class', 'ndi'); inner.innerHTML = nodeInner(n, tg && tg.id === n.id && n.kind === 'level'); g.appendChild(inner);
		if (n.state === 'locked' && n.kind !== 'boss') { inner.setAttribute('opacity', '.42'); inner.setAttribute('filter', 'url(#gray)'); }
		if (n.age === 'fade') { inner.setAttribute('opacity', '.45'); g.insertAdjacentHTML('beforeend', '<text class="note" x="0" y="38" text-anchor="middle" fill="#B9472C">7 天没碰 · 在褪色</text>'); }
		if (n.age === 'gray') { inner.setAttribute('filter', 'url(#gray)'); inner.setAttribute('opacity', '.4'); g.insertAdjacentHTML('beforeend', '<text class="note" x="0" y="38" text-anchor="middle" fill="#8b8b8b">14 天没回测 · 灰了</text>'); }
		if (n.kind !== 'start') g.addEventListener('click', () => { bounce(inner); nodeTap(n.id); });
		nodes.appendChild(g);
	});
	gsap.to('.recEdge', { strokeDashoffset: -22, duration: 1, repeat: -1, ease: 'none' });
	// 练习关的图例
	const prac = D.chapter.nodes.some(n => n.kind === 'level' && n.practice && n.state !== 'done');
	$('#pracNote').innerHTML = prac ? '<circle cx="6" cy="0" r="6" fill="none" stroke="#3E9E7A" stroke-width="1.3" stroke-dasharray="2 3"/><text x="16" y="3.5" font-size="9.5" font-weight="800" fill="#3E9E7A" font-family="PingFang SC,sans-serif">练习关 · 答错不扣心</text>' : '';
	// 图钉
	if (tg) { show('#pinPos', 'inline'); $('#pinPos').setAttribute('transform', tg.kind === 'boss' ? `translate(${tg.x - 44} ${tg.y})` : `translate(${tg.x} ${tg.y - 16})`); } else hide('#pinPos');
}
function drawTop() {
	$('#streakN').textContent = D.streak.days;
	$('#streakChip').classList.toggle('cold', !D.streak.doneToday);
	$('#streakChip').title = D.streak.doneToday ? `连胜 ${D.streak.days} 天 · 今天练过了` : `连胜 ${D.streak.days} 天 · 今天还没练`;
	$('#frzN').textContent = D.streak.freezes;
	drawHearts(D.hearts);
}
function drawDock() {
	const tg = target(), go = $('#go');
	go.classList.remove('boss'); go.disabled = !tg;
	if (!tg) { $('#todayH').textContent = D.chapter.title; $('#todayS').textContent = '这一章没有能打的关了'; go.textContent = '等第二章'; }
	else if (tg.kind === 'boss') {
		const n = ['guide', 'gear', 'news'].filter(k => D.prep[k]).length;
		$('#todayH').textContent = tg.name || 'Boss';
		$('#todayS').textContent = tg.state === 'done' ? '打赢过了 · 想再练可以再挑战' : D.bossReady ? '备战 3 / 3 · 门开了' : `备战 ${n} / 3 · 还差${['guide', 'gear', 'news'].filter(k => !D.prep[k]).map(k => PREP[k][1]).join('、')}`;
		go.textContent = tg.state === 'done' ? '再挑战 Boss' : '打 Boss'; go.classList.add('boss');
	} else {
		$('#todayH').textContent = `${tg.label} · ${tg.name ?? ''}`;
		$('#todayS').textContent = tg.practice ? `练习关 · ${tg.ask} 题对 ${tg.need} 题过 · 答错不扣心` : `${tg.ask} 题对 ${tg.need} 题过 · 答错扣 1 颗心`;
		go.textContent = tg.practice && tg.tries === 0 ? '出发' : '开打';
	}
	$('#todayE').textContent = `经验 ${D.xp}` + (D.todayXp ? ` · 今天 +${D.todayXp}` : '');
}
function miaLine() {
	const tg = target(), h = D.hearts;
	if (h <= 0) return `心打光了。两条路各补 1 颗：<b>读锦囊做小验证</b>，或<b>去装备练一组</b>；不补就等${refillLabel()} 回满。`;
	if (D.lastFail && NODE[D.lastFail.levelId]?.state === 'open') {
		const rec = D.books.find(b => b.recommended);
		return `上次 ${esc(NODE[D.lastFail.levelId].label)} 没过。` + (rec ? `书屋里我给你挑了 <b>${rec.no} 号「${esc(rec.spine)}」</b>，读完再打。` : '再打一次会换新题。');
	}
	if (tg?.kind === 'boss' && !D.bossReady) return 'Boss 门前要<b>备战三件</b>：书屋带一本锦囊、装备练一组、情报站看一眼。';
	if (tg?.kind === 'boss') return '备战齐了，门开了。打掉 Boss <b>' + D.chapter.boss.hp + '</b> 格血就赢；错 <b>' + D.chapter.boss.maxWrong + '</b> 题就输。';
	if (!D.streak.doneToday && D.streak.days > 0) return `火苗 <b>${D.streak.days}</b> 天，今天还没续上。过一关、或补一次心，就算今天练过。`;
	if (tg?.practice) return '绿虚线圈的是<b>练习关</b>，答错不扣心，放心打。';
	return `今天这一步：<b>${esc(tg?.label ?? '')}</b>。心有 <b>${h}</b> 颗。`;
}
function render() {
	drawTop(); drawMap(); drawDock();
	miaSay(miaLine());
}

function intro() {
	const tl = gsap.timeline();
	tl.from('#nodes .nd', { scale: 0, transformOrigin: '50% 50%', stagger: 0.04, duration: 0.35, ease: 'back.out(3)' }, 0)
		.to('.inkE', { strokeDashoffset: 0, duration: 0.35, stagger: 0.07, ease: 'power1.inOut' }, 0.15)
		.add(() => play('scratch', 0.7), 0.2)
		.from('#pin', { y: -60, opacity: 0, duration: 0.6, ease: 'bounce.out' }, 0.8)
		.from('#mia', { x: -60, opacity: 0, duration: 0.45, ease: 'back.out(1.6)' }, 0.9)
		.from('#ch2', { opacity: 0, duration: 0.6 }, 0.6);
	gsap.to('#pin', { scale: 1.12, transformOrigin: '50% 100%', duration: 0.45, repeat: -1, yoyo: true, ease: 'sine.inOut' });
	gsap.to('#miaHeart', { scale: 1.18, transformOrigin: '50% 50%', duration: 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut', repeatDelay: 0.6 });
	gsap.to('#flag', { skewY: 8, transformOrigin: '0 50%', duration: 0.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
	gsap.to('#flameSvg', { scaleY: 1.15, transformOrigin: '50% 100%', duration: 0.3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
	setInterval(() => gsap.fromTo('#miaEyes', { scaleY: 1 }, { scaleY: 0.1, transformOrigin: '50% 26px', duration: 0.08, yoyo: true, repeat: 1 }), 3200);
}

/* 读服务器 → 画。第一次进来时画进场动画，然后处理 ?book= / ?level= */
let loading = null;
function refresh() {
	if (loading) return loading;
	loading = api('lojo/quest/show', {}).then(r => {
		D = r; clockSkew = Date.parse(r.now) - Date.now();
		render();
		hide('#errScr');
		if (firstPaint) {
			firstPaint = false;
			gsap.to('#loader', { opacity: 0, duration: 0.3, onComplete: () => { hide('#loader'); $('#loader').style.opacity = 1; } });
			intro();
			setTimeout(handleQuery, 900);
		}
		return r;
	}).catch(e => {
		if (firstPaint) {
			hide('#loader');
			$('#errP').innerHTML = e?.code === 'NOT_SIGNED_IN' ? '要先登录社区，才能记下你的进度。' : '网卡了一下，或者我们这边出了点小问题。<br>你的进度、连胜和心都存着，不会丢。';
			show('#errScr');
		} else toast(errText(e));
		throw e;
	}).finally(() => { loading = null; });
	return loading;
}
const refreshQuiet = () => refresh().catch(() => {});
$('#errRetry').onclick = () => { play('tap'); hide('#errScr'); show('#loader'); refreshQuiet(); };
$('#errHome').onclick = () => { play('tap'); go('/'); };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && D && !busy()) refreshQuiet(); });
const busy = () => $('#quiz').style.display === 'flex' || $('#boss').style.display === 'flex' || $('#shelf').style.display === 'block';

function handleQuery() {
	if (QUERY.book && bookBySlug(QUERY.book)) { enterShelf('browse', { open: QUERY.book }); return; }
	if (QUERY.level && NODE[QUERY.level]) {
		const n = NODE[QUERY.level];
		if (n.kind === 'boss') bossSheet(); else if (n.kind === 'level') levelSheet(n);
	}
}

/* ================= 抽屉 ================= */
const sheet = $('#sheet'), scrim = $('#scrim'), body = $('#sheetBody');
function openSheet(html, bind) {
	play('open'); body.innerHTML = html; if (bind) bind(body);
	gsap.to(scrim, { opacity: 1, duration: 0.25 }); scrim.style.pointerEvents = 'auto';
	gsap.fromTo(sheet, { y: '105%' }, { y: '0%', duration: 0.5, ease: 'back.out(1.3)' });
	gsap.from('#sheetBody > *', { y: 16, opacity: 0, stagger: 0.05, delay: 0.12, duration: 0.3 });
}
function closeSheet(silent) { if (!silent) play('tap', 0.6); gsap.to(sheet, { y: '105%', duration: 0.3, ease: 'power2.in' }); gsap.to(scrim, { opacity: 0, duration: 0.25 }); scrim.style.pointerEvents = 'none'; }
scrim.onclick = () => closeSheet(); sheet.querySelector('[data-close]').onclick = () => closeSheet();

function nodeTap(id) {
	const n = NODE[id]; if (!n) return;
	if (n.kind === 'level') { if (n.state === 'locked') { play('fail', 0.4); toast('这关还没开：先过前面连着它的一关'); return; } levelSheet(n); return; }
	if (n.kind === 'boss') { bossSheet(); return; }
	if (n.kind === 'shelf') { enterShelf('browse', { fromEl: $('#nd-' + id) }); return; }
	if (n.state === 'locked') { play('fail', 0.4); toast('还没走到这里：先过前面的关'); return; }
	if (n.kind === 'gear') gearSheet(n);
	if (n.kind === 'news') newsSheet(n);
}
function levelSheet(n) {
	const out = !n.practice && D.hearts <= 0;
	const html = `<h4>${esc(n.label)} · ${esc(n.name ?? '')}</h4>
		<div class="sub">${esc(n.type ?? '')} · ${n.ask} 题，对 ${n.need} 题过${n.practice ? ' · <b style="color:#3E9E7A">练习关，答错不扣心</b>' : ' · 答错扣 1 颗心'}</div>
		${n.hint ? `<div class="hint">${md(n.hint)}</div>` : ''}
		<div class="card">${n.state === 'done' ? `过了 ✓ · 最好对 ${n.best ?? 0} 题。再打会换一组题，经验 +5。` : n.tries ? `打过 ${n.tries} 次，最好对 ${n.best ?? 0} 题。再打会换一组题。` : '第一次打。过关经验 +20；今天第一次过关还有宝箱。'}</div>
		${n.gear ? `<div class="card">卡住了可以先去装备「${esc(n.gear.zh)}」练一组。</div>` : ''}
		${out ? '<button class="sbtn" data-a="refill">心打光了 · 去补心</button>' : `<button class="sbtn" data-a="start">${n.practice && !n.tries ? '出发' : '开打'}</button>`}`;
	openSheet(html, b => {
		b.querySelector('[data-a="start"]')?.addEventListener('click', () => { closeSheet(true); startLevel(n.id); });
		b.querySelector('[data-a="refill"]')?.addEventListener('click', () => { closeSheet(true); showEmpty('map'); });
	});
}
function gearSheet(n) {
	const g = n.gear;
	openSheet(`<h4>装备站 · ${esc(g?.zh ?? '')}</h4><div class="sub">社区里的小程序，免费</div>
		<div class="card">练完一组（10 题以上、2 分钟以上）补 1 颗心，每天一次。练完也给 Boss 备战「装备」打勾。${g && !g.givesHeart ? '<br><b>这个装备暂时不补心</b>，只算备战。' : ''}</div>
		<div class="card">今天装备这条路：${D.refilledToday.gear ? '<b>已经补过 1 颗心</b>' : '还没用'}</div>
		<button class="sbtn" data-a="go">去「${esc(g?.zh ?? '装备')}」练一组</button>`, b => {
		b.querySelector('[data-a="go"]').onclick = () => { play('whoosh', 0.6); closeSheet(true); go(g?.path ?? '/dictation'); };
	});
}
function newsSheet(n) {
	const tags = n.tags ?? [];
	openSheet(`<h4>情报站</h4><div class="sub">社区时间线里，跟这几关有关的帖子</div>
		<div class="card">看看同一关的人在聊什么、踩过什么坑。<br><b>情报不补心，只算 Boss 准备。</b></div>
		<div>${tags.map(t => `<button class="tagBtn" data-tag="${esc(t)}">#${esc(t)}</button>`).join('')}</div>
		<div class="sub" style="margin-top:10px" id="newsSt">${D.prep.news ? '备战「情报」已经打勾 ✓' : '正在记下：备战「情报」…'}</div>`, b => {
		b.querySelectorAll('[data-tag]').forEach(el => { el.onclick = () => { play('whoosh', 0.6); closeSheet(true); go('/tags/' + encodeURIComponent(el.dataset.tag)); }; });
	});
	const tg = target();
	api('lojo/quest/news', { levelId: tg && tg.kind !== 'boss' ? tg.id : (tg?.id ?? null) }).then(r => {
		const was = D.prep.news; D.prep = r.prep; D.bossReady = r.prep.guide && r.prep.gear && r.prep.news;
		const st = $('#newsSt'); if (st) st.textContent = '备战「情报」已经打勾 ✓';
		if (!was) { play('pass', 0.6); refreshQuiet().then(() => gsap.from('#pp-news', { scale: 2.4, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(3)' })); }
	}).catch(e => { const st = $('#newsSt'); if (st) st.textContent = '没记上：' + errText(e); });
}
function prepRows() {
	const gearN = NODE[Object.keys(NODE).find(k => NODE[k].kind === 'gear')];
	return `<div class="prepList">
		<div class="${D.prep.guide ? 'on' : ''}" data-p="guide"><span class="e">📕</span><span><b>锦囊</b><br>去书屋读一本，带上它或做完小验证</span><span class="st">${D.prep.guide ? '✓ 齐了' : '去书屋 ›'}</span></div>
		<div class="${D.prep.gear ? 'on' : ''}" data-p="gear"><span class="e">🎧</span><span><b>装备</b><br>去小程序练完一组（10 题、2 分钟以上）</span><span class="st">${D.prep.gear ? '✓ 齐了' : '去练 ›'}</span></div>
		<div class="${D.prep.news ? 'on' : ''}" data-p="news"><span class="e">📰</span><span><b>情报</b><br>去情报站看一眼同一关的人在聊什么</span><span class="st">${D.prep.news ? '✓ 齐了' : '去看 ›'}</span></div>
	</div>`;
	void gearN;
}
function bindPrep(b) {
	b.querySelectorAll('[data-p]').forEach(el => {
		el.style.cursor = 'pointer';
		el.onclick = () => {
			const k = el.dataset.p; closeSheet(true);
			if (k === 'guide') enterShelf('browse', { fromEl: $('#nd-' + (Object.values(NODE).find(n => n.kind === 'shelf')?.id ?? 'b1')) });
			if (k === 'gear') { const g = Object.values(NODE).find(n => n.kind === 'gear'); if (g?.state === 'locked') toast('装备站还没走到'); else go(g?.gear?.path ?? '/dictation'); }
			if (k === 'news') { const n = Object.values(NODE).find(x => x.kind === 'news'); if (!n || n.state === 'locked') toast('情报站还没走到'); else newsSheet(n); }
		};
	});
}
function bossSheet() {
	const n = Object.values(NODE).find(x => x.kind === 'boss'); if (!n) return;
	const locked = n.state === 'locked', B = D.chapter.boss;
	const html = `<h4>${esc(n.name ?? 'Boss')}</h4><div class="sub">第一章的门 · ${esc(n.type ?? '')}</div>
		${n.hint ? `<div class="hint">${md(n.hint)}</div>` : ''}
		${locked ? '<div class="card">前面连着门的关都过了，门才会出现。</div>' : ''}
		<div class="card">备战三件都打勾，门才开。打掉 <b>${B.hp}</b> 格血就赢，错 <b>${B.maxWrong}</b> 题就输；答错一题扣 1 颗心。<br><b>连输 2 次，备战三件清零</b>，要重新备齐。${D.bossLosses ? `<br>你已经输了 ${D.bossLosses} 次。` : ''}</div>
		${prepRows()}
		${!locked && D.bossReady ? (D.hearts > 0 ? '<button class="sbtn navy" data-a="fight">打 Boss</button>' : '<button class="sbtn" data-a="refill">心打光了 · 去补心</button>') : ''}`;
	openSheet(html, b => {
		bindPrep(b);
		b.querySelector('[data-a="fight"]')?.addEventListener('click', () => { closeSheet(true); startLevel(n.id); });
		b.querySelector('[data-a="refill"]')?.addEventListener('click', () => { closeSheet(true); showEmpty('map'); });
	});
}
function boardSheet() {
	openSheet('<h4>公会 · 本周榜</h4><div class="sub">本周的经验，周一 0:00（北京时间）起算</div><div id="boardBody" class="empty-board">正在翻榜…</div>');
	api('lojo/quest/board', {}).then(r => {
		const el = $('#boardBody'); if (!el) return;
		if (!r.open) { el.className = 'empty-board'; el.innerHTML = `本周还不到 ${r.min} 人上榜，人够了再开。<br><small style="color:#6E7088">现在 ${r.players} 人</small>`; return; }
		el.className = '';
		el.innerHTML = r.top.map(p => `<div class="rank${p.me ? ' me' : ''}"><span class="n">${p.rank}</span><span class="nm">${esc(p.name || p.username)}${p.username ? `<small>@${esc(p.username)}</small>` : ''}</span><span class="xp">${p.xp} 经验</span></div>`).join('') +
			(r.me && !r.top.some(p => p.me) ? `<div class="rank me"><span class="n">${r.me.rank}</span><span class="nm">你</span><span class="xp">${r.me.xp} 经验</span></div>` : '') +
			(r.me ? '' : '<div class="sub" style="margin-top:8px">这周还没有你的经验，过一关就上榜。</div>');
	}).catch(e => { const el = $('#boardBody'); if (el) el.textContent = errText(e); });
}
$('#lm-guild').onclick = e => { bounce(e.currentTarget); boardSheet(); };
$('#boardBtn').onclick = () => boardSheet();
$('#miaFace').onclick = () => { play('tap'); bounce($('#miaFace')); if (D) miaSay(miaLine()); };
$('#streakChip').onclick = () => { if (!D) return; play('tap'); toast(D.streak.doneToday ? `连胜 ${D.streak.days} 天，今天练过了` : `连胜 ${D.streak.days} 天 · 过一关或补一次心就续上`, 2200); };
$('#frzChip').onclick = () => { if (!D) return; play('tap'); toast(`冻结卡 ${D.streak.freezes} / 2 · 漏一天自动用一张，连胜不断`, 2400); };
$('#refillChip').onclick = e => { e.stopPropagation(); play('tap'); showEmpty('map'); };

/* ================= 开打：镜头推进 → 墨晕 ================= */
let AT = null; // 正在打的这一局：start 的结果 + 这局的进度
function zoomInto(n, after) {
	play('tap'); const goBtn = $('#go'); goBtn.classList.add('press'); setTimeout(() => goBtn.classList.remove('press'), 120);
	const wrap = $('#mapwrap'), svg = $('#map'), app = AR();
	const m = svg.getScreenCTM(); const sx = m.a * n.x + m.e - app.left, sy = m.d * n.y + m.f - app.top; const wr = wrap.getBoundingClientRect();
	gsap.timeline()
		.to('#pin', { y: -26, duration: 0.16, ease: 'power2.out' }).to('#pin', { y: 0, duration: 0.2, ease: 'bounce.out' })
		.add(() => play('whoosh'), '<')
		.to(wrap, { scale: 3.2, transformOrigin: `${sx - (wr.left - app.left)}px ${sy - (wr.top - app.top)}px`, duration: 0.6, ease: 'power3.in' }, '-=.1')
		.to(['.top', '.dock'], { opacity: 0, duration: 0.25 }, '<')
		.add(() => { play('stamp'); ['#inkC', '#inkC2'].forEach(c => { $(c).setAttribute('cx', sx / app.width * 390); $(c).setAttribute('cy', sy / app.height * 844); }); }, '-=.12')
		.to('#inkC', { attr: { r: 1000 }, duration: 0.5, ease: 'power2.in' }, '-=.12')
		.to('#inkC2', { attr: { r: 1000 }, duration: 0.45, ease: 'power2.in' }, '-=.16')
		.add(after)
		.set('#inkC,#inkC2', { attr: { r: 0 } });
}
function restoreMap() { gsap.set('#mapwrap', { scale: 1, opacity: 1 }); gsap.to(['.top', '.dock'], { opacity: 1, duration: 0.3 }); }
function backToMap(then) {
	hide('#quiz'); hide('#boss'); gsap.set('#stamp', { scale: 0, opacity: 0 });
	gsap.to(['#fail', '#bossLose'], { y: '140%', duration: 0.3 });
	clearInterval(wordTimer); restoreMap();
	return refresh().then(() => { if (then) then(); }, () => {});
}
$('#go').onclick = () => {
	const tg = target(); if (!tg) return;
	if (tg.kind === 'boss') { if (!D.bossReady || tg.state === 'locked') { play('fail', 0.6); bossSheet(); return; } }
	startLevel(tg.id);
};
let starting = false;
function startLevel(id) {
	if (starting) return; starting = true;
	const n = NODE[id];
	api('lojo/quest/start', { levelId: id }).then(st => {
		D.hearts = st.hearts;
		AT = { ...st, node: n, i: 0, marks: [], end: null };
		const visible = $('#quiz').style.display === 'flex' || $('#boss').style.display === 'flex';
		const open = () => { if (st.kind === 'boss') openBoss(); else openQuiz(); };
		if (visible) { gsap.to(['#fail', '#bossLose'], { y: '140%', duration: 0.3 }); open(); } else zoomInto(n, open);
	}).catch(e => {
		if (e?.code === 'NO_HEARTS') { play('fail', 0.6); showEmpty($('#quiz').style.display === 'flex' ? 'fail' : 'out'); return; }
		if (e?.code === 'BOSS_NOT_READY') { play('fail', 0.6); backToMap(bossSheet); return; }
		if (e?.code === 'LEVEL_LOCKED') { play('fail', 0.6); toast(errText(e)); return; }
		toast(errText(e));
	}).finally(() => { starting = false; });
}

/* ================= 题关 ================= */
const quiz = $('#quiz');
function openQuiz() {
	hide('#boss'); show(quiz); quiz.scrollTop = 0;
	const n = AT.node;
	$('#qTag').innerHTML = `<span class="demo">示例题</span><span>${esc(n.label)} · ${esc(n.type ?? '')}</span>` + (AT.practice ? '<span class="free">练习关 · 答错不扣心</span>' : '<span class="warn">答错扣 1 颗心</span>');
	$('#qHint').innerHTML = AT.hint ? md(AT.hint) : ''; $('#qHint').style.display = AT.hint ? '' : 'none';
	$('#qDots').innerHTML = AT.questions.map(() => '<i></i>').join('');
	drawHearts(D.hearts);
	gsap.set('#qbar', { width: '0%' });
	showQ(true);
}
function showQ(first) {
	const q = AT.questions[AT.i];
	$$('#qDots i').forEach((d, i) => { d.className = AT.marks[i] === true ? 'ok' : AT.marks[i] === false ? 'no' : i === AT.i ? 'cur' : ''; d.textContent = AT.marks[i] === true ? '✓' : AT.marks[i] === false ? '✕' : ''; });
	$('#qPass').textContent = q.p ?? ''; $('#qPass').style.display = q.p ? '' : 'none';
	$('#qStmt').innerHTML = `<small>第 ${AT.i + 1} / ${AT.total} 题 · 对 ${AT.need} 题过</small>${md(q.s)}`;
	const long = q.o.some(o => String(o).length > 14);
	$('#qOpts').innerHTML = q.o.map((o, i) => `<button class="opt${long ? ' long' : ''}" data-i="${i}">${esc(o)}</button>`).join('');
	$$('#qOpts .opt').forEach(b => { b.onclick = () => pick(b); });
	hide('#qEx');
	gsap.from(first ? '#quiz > *:not(.stamp):not(.qex)' : '#qPass,#qStmt,#qOpts .opt', { y: first ? 30 : 16, opacity: 0, stagger: 0.05, duration: 0.3, ease: 'back.out(1.6)' });
}
let answering = false;
function pick(btn) {
	if (answering || !AT || AT.end || AT.marks[AT.i] !== undefined) return;
	const q = AT.questions[AT.i]; if (!q) return; answering = true;
	const choice = +btn.dataset.i;
	$$('#qOpts .opt').forEach(b => { b.disabled = true; });
	api('lojo/quest/answer', { attemptId: AT.attemptId, qid: q.id, choice }).then(r => {
		AT.marks[AT.i] = r.correct; AT.end = r.end;
		const opts = $$('#qOpts .opt');
		if (r.correct) { btn.classList.add('ok'); play('tap'); tune([660, 880], 'triangle', 0.07, 0.2, 0.08); } else {
			btn.classList.add('no'); play('fail'); opts[r.answer]?.classList.add('ok');
			gsap.fromTo(btn, { x: 0 }, { x: 8, duration: 0.06, repeat: 5, yoyo: true, ease: 'none' });
		}
		D.hearts = r.hearts;
		if (r.heartLost) setTimeout(() => loseHeart('#qHearts', r.hearts), 250);
		const d = $$('#qDots i')[AT.i]; if (d) { d.className = r.correct ? 'ok' : 'no'; d.textContent = r.correct ? '✓' : '✕'; gsap.from(d, { scale: 1.8, duration: 0.35, ease: 'back.out(3)' }); }
		gsap.to('#qbar', { width: `${Math.round(r.progress.answered / r.progress.total * 100)}%`, duration: 0.4 });
		const ex = $('#qEx'); ex.className = 'qex' + (r.correct ? '' : ' bad');
		$('#qExT').innerHTML = (r.correct ? '<b>对了。</b>' : `<b>答案是 ${esc(q.o[r.answer])}。</b>`) + esc(r.why ?? '') +
			(!r.correct && AT.practice ? '<br>练习关，不扣心。' : '') + (r.heartLost ? `<br>扣 1 颗心，还剩 ${r.hearts} 颗。` : '');
		$('#qNext').textContent = r.end ? '看结果' : '下一题';
		show(ex, 'block'); gsap.from(ex, { y: 12, opacity: 0, duration: 0.3 });
		setTimeout(() => ex.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
	}).catch(e => {
		$$('#qOpts .opt').forEach(b => { b.disabled = false; });
		toast(errText(e));
		if (e?.code === 'NO_SUCH_ATTEMPT' || e?.code === 'WRONG_QUESTION') backToMap();
	}).finally(() => { answering = false; });
}
$('#qNext').onclick = () => {
	if (!AT || AT.marks[AT.i] === undefined) return; // 这题还没判完
	play('tap');
	if (AT.end) { if (!AT.ended) { AT.ended = true; endLevel(AT.end); } return; }
	if (AT.i + 1 >= AT.questions.length) return;
	AT.i++; showQ(false);
};
$('#qBack').onclick = () => { play('tap'); backToMap(); };

function reviewHtml(end) {
	return end.review.map(r => {
		const q = AT.questions.find(x => x.id === r.qid);
		const opt = i => esc(q?.o?.[i] ?? '');
		return `<div class="${r.correct ? '' : 'no'}"><i>${r.correct ? '✓' : '✕'}</i><span>第 ${r.n} 题${r.correct ? `：${opt(r.answer)}` : `：你选 ${opt(r.choice)}，答案 <b>${opt(r.answer)}</b>`}。${esc(r.why ?? '')}</span></div>`;
	}).join('');
}
function endLevel(end) { if (end.passed) passFlow(end); else failFlow(end); }

/* 过关：盖章 → 宝箱 → 回地图 → 火苗 → 冻结卡 */
function passFlow(end) {
	$('#stamp small').textContent = `${AT.node.label} · 经验 +${end.xp}`;
	gsap.to('#qbar', { width: '100%', duration: 0.5, ease: 'power2.out' });
	gsap.timeline({ delay: 0.15 })
		.add(() => { play('stamp'); setTimeout(() => { play('pass'); tune([523, 659, 784, 1046], 'triangle', 0.09, 0.35, 0.13); }, 120); })
		.to('#stamp', { scale: 1, opacity: 1, duration: 0.28, ease: 'back.out(3)' })
		.to('#quiz', { x: 4, duration: 0.04, repeat: 5, yoyo: true }, '<.05')
		.to({}, { duration: 0.8 })
		.add(() => (end.chest ? openChest(end, () => afterPass(end)) : afterPass(end)));
}
function openChest(end, done) {
	const ov = $('#chestOv'); show(ov);
	$('#loot').innerHTML = `<div><span class="big">+${end.chest.xp}</span>经验 · 今天第一次过关</div>` + (end.chest.freeze ? '<div><span class="big">❄</span>1 张冻结卡（漏一天自动用掉，连胜不断）</div>' : '');
	gsap.set('#loot,#chestOk', { opacity: 0, y: 14 }); gsap.set('#lid', { rotation: 0, y: 0 }); gsap.set('#rays', { opacity: 0 });
	gsap.timeline()
		.from('#chestOv .ovcard', { scale: 0.6, opacity: 0, duration: 0.35, ease: 'back.out(2)' })
		.to('#chestBox', { rotation: 5, transformOrigin: '50% 100%', duration: 0.06, repeat: 7, yoyo: true })
		.add(() => play('chest'))
		.to('#lid', { y: -26, rotation: -24, transformOrigin: '10% 100%', duration: 0.35, ease: 'back.out(2)' })
		.to('#rays', { opacity: 1, duration: 0.2 }, '<')
		.fromTo('#rays', { rotation: -8, transformOrigin: '75px 40px' }, { rotation: 8, duration: 1.2, ease: 'sine.inOut', repeat: -1, yoyo: true }, '<')
		.to('#loot,#chestOk', { opacity: 1, y: 0, stagger: 0.12, duration: 0.35, ease: 'back.out(2)' });
	$('#chestOk').onclick = () => { play('tap'); gsap.to(ov, { opacity: 0, duration: 0.25, onComplete: () => { hide(ov); ov.style.opacity = 1; gsap.killTweensOf('#rays'); done(); } }); };
}
function afterPass(end) {
	const id = AT.node.id;
	backToMap(() => {
		const g = $(`#nd-${id} .ndi`); if (g) { play('stamp'); gsap.from(g, { scale: 2.2, transformOrigin: '50% 50%', duration: 0.4, ease: 'back.out(3)' }); }
		gsap.from('.inkE', { opacity: 0, duration: 0.4 });
		setTimeout(() => flameThenFreeze(end.streak, end.chest?.freeze, () => miaSay(end.firstPass ? `${esc(AT.node.label)} 过了！经验 +${end.xp}。下一步，看图钉。` : `又过了一次，经验 +${end.xp}。`)), 700);
	});
}
function flameThenFreeze(streak, chestFreeze, done) {
	const next = () => (streak?.gotFreeze ? showFreeze(`连胜 ${streak.days} 天！`, '每连胜 7 天送 1 张', done) : done && done());
	if (streak?.usedFreezes) toast(`漏了 ${streak.usedFreezes} 天，用掉 ${streak.usedFreezes} 张冻结卡，连胜没断`, 2600);
	if (streak?.changed) {
		$('#streakN').textContent = streak.days; $('#streakChip').classList.remove('cold');
		play(streak.days % 7 ? 'pass' : 'milestone', 0.8);
		gsap.fromTo('#streakChip', { scale: 1.7 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1,.3)' });
		setTimeout(next, 800);
	} else next();
	void chestFreeze;
}
function showFreeze(title, sub, done) {
	const ov = $('#frzOv'); show(ov); $('#frzH').textContent = title; $('#frzSub').textContent = sub;
	const n = D.streak.freezes;
	['#slot1', '#slot2'].forEach((s, i) => { $(s).className = 'slot' + (i < n ? ' on' : ''); $(s).textContent = i < n ? '❄' : ''; });
	gsap.timeline().from('#frzOv .ovcard', { scale: 0.6, opacity: 0, duration: 0.35, ease: 'back.out(2)' })
		.from('#frzBig', { rotationY: 180, scale: 0.3, duration: 0.6, ease: 'back.out(1.6)' }).add(() => play('freeze'), '<.1')
		.add(() => { gsap.fromTo('#frzChip', { scale: 1.5 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1,.3)' }); });
	$('#frzOk').onclick = () => { play('tap'); gsap.to(ov, { opacity: 0, duration: 0.25, onComplete: () => { hide(ov); ov.style.opacity = 1; if (done) done(); } }); };
}

/* 没过：错在哪 + 四条路 */
function failFlow(end) {
	const n = AT.node, out = end.outOfHearts || (!AT.practice && D.hearts <= 0);
	$('#failH').textContent = out ? '心打光了，这关没过' : '这关没过';
	$('#failP').innerHTML = `对 <b>${end.right}</b> 题，要对 ${end.need} 题才过。` + (AT.practice ? '练习关，没扣心。' : `心还剩 <b>${D.hearts}</b> 颗。`) +
		(end.failStreak >= 2 ? `<br>这关连着没过 ${end.failStreak} 次了，先别急着重打。` : '');
	$('#failReview').innerHTML = reviewHtml(end);
	const rec = end.recommended;
	$('#failMia').style.display = D.tutorId ? '' : 'none';
	$('#failShelf').innerHTML = rec ? `去书屋<small>Mia 推荐 ${rec.no} 号「${esc(rec.spine)}」</small>` : '去书屋';
	$('#failShelf').classList.toggle('rec', !!rec);
	const g = n.gear;
	$('#failGear').innerHTML = `去装备练一组<small>${esc(g?.zh ?? '听写')}${g && !g.givesHeart ? ' · 只算备战，不补心' : ' · 练完补 1 颗心，每天一次'}</small>`;
	$('#failRetry').textContent = out ? '先补心，再打一次' : '再打一次（换新题）';
	gsap.to('#fail', { y: '0%', duration: 0.55, ease: 'back.out(1.4)', delay: 0.2 });
	$('#fail').scrollTop = 0;
	play('fail', 0.5);
}
function askMia(btn) {
	if (!D.tutorId || !AT) return;
	play('tap'); btn.disabled = true;
	const to = `/chat/user/${D.tutorId}`;
	api('lojo/quest/ask-tutor', { attemptId: AT.attemptId }).then(r => {
		if (r?.result === 'limit') toast('Mia 今天找你找得够多了，你直接跟她说就行', 2000);
	}).catch(() => {}).finally(() => { btn.disabled = false; go(to); });
}
$('#failMia').onclick = e => askMia(e.currentTarget);
$('#failShelf').onclick = () => { play('tap'); gsap.to('#fail', { y: '140%', duration: 0.3 }); enterShelf('stuck', { rec: AT?.end?.recommended?.slug, levelId: AT?.node?.id, fromEl: $('#failShelf') }); };
$('#failGear').onclick = () => { play('whoosh', 0.6); go(AT?.node?.gear?.path ?? '/dictation'); };
$('#failRetry').onclick = () => {
	play('tap');
	if (!AT.practice && D.hearts <= 0) { gsap.to('#fail', { y: '140%', duration: 0.3 }); showEmpty('fail'); return; }
	startLevel(AT.node.id);
};
$('#failMap').onclick = () => { play('tap'); backToMap(); };

/* ================= Boss ================= */
const bossEl = $('#boss');
const WORDS = ['rise', 'go up', 'increase'];
let wordTimer = null, wi = 0;
function openBoss() {
	hide(quiz); show(bossEl); bossEl.scrollTop = 0;
	const n = AT.node, hp = D.chapter.boss.hp;
	$('#bhp').innerHTML = [...Array(hp)].map(() => '<i></i>').join('');
	$('#bName').textContent = n.name ?? 'Boss';
	$('#bRule').textContent = `打掉 ${hp} 格血就赢 · 错 ${AT.maxWrong} 题就输 · 答错扣 1 颗心`;
	drawHearts(D.hearts);
	showBQ(true);
	gsap.from('#bossFig', { y: -40, scale: 0.6, duration: 0.6, ease: 'bounce.out' });
	play('bosshit', 0.5);
	clearInterval(wordTimer);
	wordTimer = setInterval(() => gsap.to('#bossCard', { scaleX: 0, transformOrigin: '75px 78px', duration: 0.15, yoyo: true, repeat: 1, onRepeat: () => { wi = (wi + 1) % WORDS.length; $('#bossWord').textContent = WORDS[wi]; } }), 1300);
}
function showBQ(first) {
	const q = AT.questions[AT.i];
	$('#bStmt').innerHTML = `<small>第 ${AT.i + 1} 题 · 挑出意思一样、说法不同的那句</small>${md(q.s)}`;
	$('#bOpts').innerHTML = q.o.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join('');
	$$('#bOpts .opt').forEach(b => { b.onclick = () => bossPick(b); });
	hide('#bEx');
	gsap.from(first ? '#boss .bname,#boss .brule,#bStmt,#bOpts .opt' : '#bStmt,#bOpts .opt', { y: 20, opacity: 0, stagger: 0.05, duration: 0.3 });
}
function bossPick(btn) {
	if (answering || !AT || AT.end || AT.marks[AT.i] !== undefined) return;
	const q = AT.questions[AT.i]; if (!q) return; answering = true;
	const choice = +btn.dataset.i;
	$$('#bOpts .opt').forEach(b => { b.disabled = true; });
	api('lojo/quest/answer', { attemptId: AT.attemptId, qid: q.id, choice }).then(r => {
		AT.marks[AT.i] = r.correct; AT.end = r.end; D.hearts = r.hearts;
		if (r.correct) {
			btn.classList.add('ok'); play('pass', 0.7);
			const segs = $$('#bhp i'); segs.forEach((s, i) => { s.className = i >= segs.length - r.progress.right ? 'gone' : ''; });
			gsap.fromTo('#bossBody', { x: -10 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,.3)' });
		} else {
			btn.classList.add('no'); play('bosshit'); $$('#bOpts .opt')[r.answer]?.classList.add('ok');
			gsap.fromTo('#boss', { x: 0 }, { x: 9, duration: 0.05, repeat: 7, yoyo: true, ease: 'none', clearProps: 'x' });
			gsap.fromTo('#bossBody', { scale: 1 }, { scale: 1.12, transformOrigin: '75px 140px', duration: 0.15, yoyo: true, repeat: 3 });
			if (r.heartLost) {
				const d = document.createElement('div'); d.className = 'dmg'; d.textContent = '−1 ❤'; const br = btn.getBoundingClientRect(), ar = AR();
				$('#app').appendChild(d); gsap.fromTo(d, { left: br.right - ar.left - 80, top: br.top - ar.top - 10, opacity: 1 }, { top: '-=50', opacity: 0, duration: 0.9, onComplete: () => d.remove() });
				setTimeout(() => loseHeart('#bHearts', r.hearts), 150);
			}
		}
		const ex = $('#bEx'); ex.className = 'qex' + (r.correct ? '' : ' bad');
		$('#bExT').innerHTML = (r.correct ? '<b>打中了！</b>' : `<b>答案是「${esc(q.o[r.answer])}」。</b>`) + esc(r.why ?? '');
		$('#bNext').textContent = r.end ? '看结果' : '下一题';
		show(ex, 'block'); gsap.from(ex, { y: 12, opacity: 0, duration: 0.3 });
		setTimeout(() => ex.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
	}).catch(e => {
		$$('#bOpts .opt').forEach(b => { b.disabled = false; });
		toast(errText(e));
		if (e?.code === 'NO_SUCH_ATTEMPT' || e?.code === 'WRONG_QUESTION') backToMap();
	}).finally(() => { answering = false; });
}
$('#bNext').onclick = () => {
	if (!AT || AT.marks[AT.i] === undefined) return;
	play('tap');
	if (AT.end) { if (!AT.ended) { AT.ended = true; if (AT.end.passed) bossWin(AT.end); else bossLose(AT.end); } return; }
	if (AT.i + 1 >= AT.questions.length) return;
	AT.i++; showBQ(false);
};
$('#bBack').onclick = () => { play('tap'); backToMap(); };
function confetti() {
	const a = AR(), colors = ['#E8603F', '#ECB637', '#3E9E7A', '#2340A3', '#FFFDF8'];
	for (let i = 0; i < 60; i++) {
		const c = document.createElement('div'); c.className = 'confetti'; c.style.background = colors[i % colors.length]; $('#app').appendChild(c);
		gsap.set(c, { left: a.width / 2, top: a.height * 0.38, rotation: Math.random() * 360 });
		gsap.to(c, { x: (Math.random() - 0.5) * a.width * 1.1, y: (Math.random() - 0.2) * a.height * 0.9, rotation: '+=' + (Math.random() * 720 - 360), opacity: 0, duration: 1.4 + Math.random() * 0.9, ease: 'power2.out', onComplete: () => c.remove() });
	}
}
function bossWin(end) {
	clearInterval(wordTimer);
	gsap.to('#bossBody', { y: 60, rotation: 25, opacity: 0, transformOrigin: '75px 140px', duration: 0.6, ease: 'power2.in' });
	play('milestone'); setTimeout(() => tune([523, 659, 784, 1046, 1318], 'triangle', 0.1, 0.4, 0.13), 200);
	const ov = $('#winOv'); show(ov);
	$('#winSub').textContent = end.firstPass ? '第一章的门开了。第二章还在画，画好了第一时间叫你。' : '又赢了一次，手感还在。';
	$('#winLoot').innerHTML = `<div><span class="big">+${end.xp}</span>经验${end.chest ? '（含今日首胜宝箱）' : ''}</div>` +
		(end.chest?.freeze ? '<div><span class="big">❄</span>宝箱里有 1 张冻结卡</div>' : '') +
		(end.streak?.changed ? `<div><span class="big">🔥${end.streak.days}</span>连胜续上了</div>` : '');
	gsap.from('#winOv .ovcard', { scale: 0.5, opacity: 0, duration: 0.5, ease: 'back.out(2)' });
	confetti(); setTimeout(confetti, 500);
	$('#winOk').onclick = () => {
		play('tap');
		gsap.to(ov, { opacity: 0, duration: 0.25, onComplete: () => {
			hide(ov); ov.style.opacity = 1; gsap.set('#bossBody', { clearProps: 'all' });
			backToMap(() => {
				if (end.streak?.gotFreeze) showFreeze(`连胜 ${end.streak.days} 天！`, '每连胜 7 天送 1 张', null);
				miaSay('Boss 倒了！第一章打通。第二章还在画，先回头把褪色的关再打一遍，手感不丢。');
			});
		} });
	};
}
function bossLose(end) {
	clearInterval(wordTimer); play('lose');
	const fill = () => {
		$('#bossLoseH').textContent = end.prepReset ? '连输 2 次 · 备战清零' : end.outOfHearts ? '心打光了，Boss 赢了这一局' : 'Boss 赢了这一局';
		$('#bossLoseP').innerHTML = `打掉 <b>${end.right}</b> 格血，要 ${end.need} 格才赢。心还剩 <b>${D.hearts}</b> 颗。<br>` +
			(end.prepReset ? '<b>备战三件清零了</b>：锦囊、装备、情报要重新备齐，门才会再开。' : end.bossLosses >= 1 ? '<b>再输 1 次，备战三件清零</b>，要重新去锦囊、装备、情报备齐。' : '');
		$('#bossReview').innerHTML = reviewHtml(end);
		$('#bossMia').style.display = D.tutorId ? '' : 'none';
		const canRetry = !end.prepReset && D.hearts > 0;
		$('#bossRetry').textContent = end.prepReset ? '回地图重新备战' : D.hearts > 0 ? '再打一次' : '先补心';
		$('#bossRetry').dataset.mode = end.prepReset ? 'map' : canRetry ? 'retry' : 'refill';
		gsap.to('#bossLose', { y: '0%', duration: 0.5, ease: 'back.out(1.4)' }); $('#bossLose').scrollTop = 0;
	};
	if (end.prepReset) setTimeout(() => resetPrep(fill), 400); else fill();
}
function resetPrep(done) {
	const ov = $('#resetOv'); show(ov); gsap.set('.pcard', { clearProps: 'all' }); gsap.set('.pcard .ck', { clearProps: 'all' });
	gsap.timeline()
		.from(ov, { opacity: 0, duration: 0.25 })
		.from('.pcard', { y: 40, opacity: 0, stagger: 0.08, duration: 0.3, ease: 'back.out(2)' })
		.add(() => play('reset'), '+=.15')
		.to('.pcard .ck', { scale: 0, rotation: 90, duration: 0.25, stagger: 0.1, ease: 'back.in(2)' })
		.to('.pcard', { y: 30, rotation: i => [-14, 6, 16][i], opacity: 0.35, filter: 'grayscale(1)', duration: 0.45, stagger: 0.08, ease: 'power2.in' }, '<.1')
		.to({}, { duration: 0.6 })
		.to(ov, { opacity: 0, duration: 0.25 })
		.add(() => { hide(ov); ov.style.opacity = 1; done(); });
}
$('#bossMia').onclick = e => askMia(e.currentTarget);
$('#bossRetry').onclick = e => {
	play('tap'); const m = e.currentTarget.dataset.mode;
	if (m === 'retry') { startLevel(AT.node.id); return; }
	if (m === 'refill') { gsap.to('#bossLose', { y: '140%', duration: 0.3 }); hide(bossEl); showEmpty('out'); return; }
	backToMap(bossSheet);
};
$('#bossQuit').onclick = () => { play('tap'); backToMap(); };

/* ================= 锦囊书屋 = 社区「攻略」板块里的一间屋子 ================= */
let shelf = { mode: 'browse', rec: null, levelId: null, picked: false, book: null, spine: null }, loops = [];
function stopLoops() { loops.forEach(t => t.kill()); loops = []; }
function arc(el, p0, c, p1, dur, ease, extra) {
	const o = { t: 0 };
	return gsap.to(o, { t: 1, duration: dur, ease, onUpdate() { const t = o.t, u = 1 - t; gsap.set(el, { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y, scale: extra.s0 + (extra.s1 - extra.s0) * t, rotation: extra.r0 + (extra.r1 - extra.r0) * t }); } });
}
function dust(x, y, n = 7) {
	const a = $('#shelf');
	for (let i = 0; i < n; i++) {
		const d = document.createElement('div'); d.className = 'dust'; a.appendChild(d);
		gsap.set(d, { left: x, top: y, scale: 0.6 + Math.random() * 0.8 }); gsap.to(d, { x: (Math.random() - 0.5) * 70, y: -10 - Math.random() * 40, opacity: 0, duration: 0.6 + Math.random() * 0.4, ease: 'power2.out', onComplete: () => d.remove() });
	}
}
function setBag(n, animate) {
	const roll = $('#bagN .roll'); n = Math.min(3, n);
	if (!animate) { gsap.set(roll, { y: -22 * n }); return; }
	gsap.timeline().to(roll, { y: -22 * Math.max(0, n - 1) + 4, duration: 0.08, ease: 'power1.out' }).to(roll, { y: -22 * n, duration: 0.42, ease: 'back.out(2.6)' })
		.fromTo('#bagN', { scale: 1.6 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1,.35)' }, '<');
	play('tick', 0.9); setTimeout(() => play('tick', 0.6), 90);
}
const isDark = c => !/^#(ECB637|CFE6DA|F6F1E7|FFFDF8)$/i.test(c);
function buildShelf() {
	const books = D.books;
	$('#row1Lab').textContent = `${D.chapter.title} · ${books.length} 本`;
	$('#row1').innerHTML = books.map(b => {
		const h = Math.min(198, 112 + [...b.spine].length * 13);
		return `<div class="spine" data-slug="${esc(b.slug)}" style="height:${h}px;background:${esc(b.color)};${isDark(b.color) ? '' : 'color:#141E52'}"><span class="halo"></span><span class="shw"><span class="sheen"></span></span><span class="no">${b.no}</span><span class="band" style="bottom:10px"></span>${esc(b.spine)}</div>`;
	}).join('');
	$('#row2').innerHTML = [118, 132, 104, 126, 112, 138, 120, 108].map(h => `<div class="spine lock" style="height:${h}px">🔒</div>`).join('');
	setBag(D.bag.length, false);
}
function shelfLit(mode) {
	if (mode === 'browse') return D.books.filter(b => b.lit || b.recommended).map(b => b.slug);
	const lit = D.books.filter(b => b.lit || b.recommended || b.slug === shelf.rec).map(b => b.slug);
	return lit.length ? lit : D.books.map(b => b.slug);
}
function recSlug() { return shelf.rec ?? D.books.find(b => b.recommended)?.slug ?? null; }
function enterShelf(mode, opt = {}) {
	if (!D) return;
	play('whoosh'); stopLoops(); closeSheet(true);
	shelf = { mode, rec: opt.rec ?? null, levelId: opt.levelId ?? null, picked: false, book: null, spine: null, from: opt.from ?? null };
	buildShelf();
	const lit = shelfLit(mode), rec = recSlug();
	['#book', '#bookBar', '#chk', '#bagPanel'].forEach(hide);
	$$('.recTag,.hadTag').forEach(e => e.remove());
	gsap.set('.shelfhead p,.rowlab', { opacity: 1 }); gsap.set('#shelfMia', { y: 0, opacity: 1 }); gsap.set('#bag', { y: 0 });
	$('#shelfSub').textContent = mode === 'refill' ? '读一本，做 3 题小验证 · 对 2 题补 1 颗心' : mode === 'stuck' ? '亮着的几本跟你这次的错有关' : '随便翻 · 读完做小验证还能补心';
	const rb = rec && bookBySlug(rec);
	$('#shelfSay').innerHTML = mode === 'stuck' && rb ? `你这次的错，我最推荐 <b>${rb.no} 号「${esc(rb.spine)}」</b>。读完带上它再打。`
		: mode === 'refill' ? (D.refilledToday.guide ? '今天锦囊这条路<b>已经补过 1 颗心</b>了。还能读、还能验证，只是不再补心。' : '挑一本读完，做 3 题小验证。<b>对 2 题</b>补 1 颗心。')
			: rb ? `随便翻。上次没过的那关，我推荐 <b>${rb.no} 号</b>。` : '没卡关也能来翻。读完做小验证，还算 Boss 备战「锦囊」。';
	const a = AR(), fromEl = opt.fromEl ?? $('#nd-b1') ?? $('#go'), r = fromEl.getBoundingClientRect();
	const fromScene = quiz.style.display === 'flex' ? '#quiz' : $('#empty').style.display === 'flex' ? '#empty' : '#mapwrap';
	shelf.fromScene = fromScene;
	gsap.timeline()
		.to(fromScene, { scale: 2.4, opacity: 0, transformOrigin: `${r.left - a.left + r.width / 2}px ${r.top - a.top + r.height / 2}px`, duration: 0.5, ease: 'power3.in' })
		.add(() => { show('#shelf', 'block'); gsap.set('#shelf', { opacity: 1 }); gsap.set('.door', { rotationY: 0, x: 0, opacity: 1, transformPerspective: 800 }); gsap.set('.door .knob', { rotation: 0 }); gsap.set('#lightSpill', { opacity: 0 }); })
		.from('.door.l', { x: '-100%', duration: 0.26, ease: 'power2.out' })
		.from('.door.r', { x: '100%', duration: 0.26, ease: 'power2.out' }, '<')
		.to('.door.l .knob', { rotation: -80, duration: 0.16, ease: 'power2.in' }, '+=.12')
		.to('.door.r .knob', { rotation: 80, duration: 0.16, ease: 'power2.in' }, '<')
		.add(() => play('latch'))
		.to('.door.l', { x: -3, duration: 0.04, yoyo: true, repeat: 3, ease: 'none' })
		.to('.door.r', { x: 3, duration: 0.04, yoyo: true, repeat: 3, ease: 'none' }, '<')
		.add(() => play('dooropen', 0.9), '+=.06')
		.to('#lightSpill', { opacity: 1, duration: 0.25, ease: 'power1.in' }, '<')
		.to('.door.l', { rotationY: -112, duration: 0.62, ease: 'power3.inOut' }, '<')
		.to('.door.r', { rotationY: 112, duration: 0.62, ease: 'power3.inOut' }, '<')
		.to('.door.l', { rotationY: -98, duration: 0.22, ease: 'sine.inOut' })
		.to('.door.r', { rotationY: 98, duration: 0.22, ease: 'sine.inOut' }, '<')
		.to('.door', { opacity: 0, duration: 0.2 })
		.to('#lightSpill', { opacity: 0, duration: 0.7, ease: 'power1.out' }, '<-.1')
		.from('#row1 .spine,#row2 .spine', { scaleY: 0.94, duration: 0.5, stagger: { each: 0.02, from: 'center' }, ease: 'elastic.out(1,.4)' }, '<-.4')
		.add(() => {
			$$('#row1 .spine').forEach(s => { s.classList.add('hot'); if (mode !== 'browse' && !lit.includes(s.dataset.slug)) s.classList.add('dim'); });
			$$('#row1 .spine').filter(s => lit.includes(s.dataset.slug) && (mode !== 'browse' || lit.length < D.books.length)).forEach((s, i) => {
				const h = s.querySelector('.halo');
				gsap.timeline({ delay: 0.15 + i * 0.3 }).add(() => play('lighton', 0.55))
					.to(h, { opacity: 0.9, duration: 0.05 }).to(h, { opacity: 0.15, duration: 0.06 }).to(h, { opacity: 1, duration: 0.05 }).to(h, { opacity: 0.3, duration: 0.08 })
					.to(h, { opacity: 1, scale: 1.06, duration: 0.18, ease: 'power2.out' })
					.add(() => {
						loops.push(gsap.fromTo(h, { opacity: 1, scale: 1.05 }, { opacity: 0.35, scale: 1, duration: 1.1, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.25 }));
						loops.push(gsap.fromTo(s.querySelector('.sheen'), { y: 0 }, { y: s.offsetHeight + 110, duration: 0.9, ease: 'power1.inOut', repeat: -1, repeatDelay: 2.2, delay: 0.4 + i * 0.35 }));
						if (s.dataset.slug === rec) loops.push(gsap.to(s, { y: -7, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
					});
			});
		}, '+=.05')
		.from('#shelfMia', { y: 120, duration: 0.45, ease: 'back.out(1.6)' }, '+=.25')
		.from('#bag', { y: 140, duration: 0.45, ease: 'back.out(1.6)' }, '<+.08')
		.add(() => { tagSpines(rec); if (opt.open) { const s = $(`#row1 .spine[data-slug="${CSS.escape(opt.open)}"]`); if (s) openBook(s); } }, '+=.3');
}
function tagSpines(rec) {
	$$('.recTag,.hadTag').forEach(e => e.remove());
	const sr = $('#shelf').getBoundingClientRect();
	D.books.forEach(b => {
		const s = $(`#row1 .spine[data-slug="${CSS.escape(b.slug)}"]`); if (!s) return; const r = s.getBoundingClientRect();
		if (b.slug === rec) {
			const tag = document.createElement('div'); tag.className = 'recTag'; tag.textContent = 'Mia 推荐'; $('#shelf').appendChild(tag);
			gsap.set(tag, { left: Math.max(4, Math.min(sr.width - tag.offsetWidth - 4, r.left - sr.left + r.width / 2 - tag.offsetWidth / 2)), top: r.top - sr.top - 34 });
			gsap.from(tag, { scale: 0, duration: 0.4, ease: 'back.out(3)' }); loops.push(gsap.to(tag, { y: -5, duration: 0.45, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
		} else if (b.checkedToday || b.inBag) {
			const h = document.createElement('div'); h.className = 'hadTag'; h.textContent = b.checkedToday ? '今天验过' : '在背包'; $('#shelf').appendChild(h);
			gsap.set(h, { left: Math.max(2, Math.min(sr.width - h.offsetWidth - 2, r.left - sr.left + r.width / 2 - h.offsetWidth / 2)), top: r.top - sr.top - 22 });
		}
	});
}
const BOOK_TOP = 88;
const bookH = () => Math.min(540, AR().height - BOOK_TOP - 96);
$('#row1').addEventListener('click', e => { const s = e.target.closest('.spine'); if (s && !shelf.picked) openBook(s); });
function doitLabel(b) {
	if (!b.app) return null;
	if (b.app.path == null) return D.tutorId ? `找 Mia 练 · ${esc(b.app.zh)}` : null;
	return /^https?:/.test(b.app.path) ? `打开「${esc(b.app.zh)}」↗` : `去「${esc(b.app.zh)}」`;
}
function openBook(s) {
	const b = bookBySlug(s.dataset.slug); if (!b) return;
	shelf.picked = true; shelf.book = b; shelf.spine = s; stopLoops();
	const BH = bookH();
	$('#bCh').textContent = D.chapter.title;
	$('#bt').textContent = b.title; $('#bw').textContent = b.summary;
	const dl = doitLabel(b);
	$('#ba').innerHTML = `${esc(b.app?.zh ?? '')}${b.when ? '' : ''}` + (dl ? `<button class="doit" data-a="do">${dl}</button>` : '');
	$('#bl').innerHTML = `${esc(b.verify ?? '')}<button class="doit alt" data-a="read">读全文</button>`;
	$('#bk').textContent = `锦囊 ${b.no} · ${b.kind ?? ''}${b.evidence ? ' · ' + b.evidence : ''}`;
	$('#cK').textContent = `锦囊 ${b.no} · ${b.kind ?? ''}`; $('#cT').textContent = b.title;
	const cv = $('#book .cover'); cv.style.background = b.color; cv.style.color = isDark(b.color) ? '#fff' : '#141E52';
	$('#ba [data-a="do"]')?.addEventListener('click', () => { play('whoosh', 0.6); if (b.app.path == null) go(`/chat/user/${D.tutorId}`); else go(b.app.path); });
	$('#bl [data-a="read"]').onclick = () => { play('whoosh', 0.6); go(b.path); };
	const book = $('#book'), a = AR(), sp = ctr(s);
	const p0 = { x: sp.x - a.width / 2, y: sp.y - (BOOK_TOP + BH / 2) }, p1 = { x: 0, y: 0 }, c = { x: p0.x * 0.25, y: Math.min(p0.y, 0) - 170 };
	gsap.to('.recTag,.hadTag', { opacity: 0, duration: 0.2 });
	gsap.timeline()
		.add(() => play('bookslide', 0.9))
		.to(s, { y: 3, scaleY: 0.98, duration: 0.08, ease: 'power2.out' })
		.to(s, { y: -18, scaleY: 1.02, duration: 0.42, ease: 'power1.out' })
		.to(s, { x: 1.2, duration: 0.035, yoyo: true, repeat: 5, ease: 'none' })
		.to(s.querySelector('.halo'), { opacity: 0, duration: 0.15 }, '<')
		.to(s, { y: -74, scaleY: 1, duration: 0.13, ease: 'power4.in' })
		.to('#row1 .spine,#row2 .spine', { opacity: 0.12, duration: 0.3 }, '<')
		.to('.shelfhead p,.rowlab', { opacity: 0.25, duration: 0.3 }, '<')
		.add(() => {
			const r = ctr(s); dust(r.x, r.y + r.h / 2, 8); s.style.visibility = 'hidden'; show(book, 'block');
			gsap.set('#book .cover', { rotationY: 0, opacity: 1 }); gsap.set('#book .page > *', { opacity: 1, y: 0 });
			gsap.set(book, { x: p0.x, y: p0.y, scale: 0.13, rotationY: -80, rotation: -10 });
			play('bookclose', 0.9);
			gsap.to(book, { rotationY: 0, duration: 0.34, ease: 'back.out(2.2)' });
			arc(book, p0, c, p1, 0.55, 'power3.out', { s0: 0.13, s1: 1.04, r0: -10, r1: -3 });
		})
		.to(book, { scale: 1, rotation: 0, duration: 0.6, ease: 'elastic.out(1,.45)' }, '+=.56')
		.add(() => play('bookflip', 0.9), '-=.25')
		.to('#book .cover', { rotationY: -170, duration: 0.62, ease: 'power2.inOut' }, '<')
		.from('#book .page > *', { opacity: 0, y: 8, stagger: 0.045, duration: 0.3, ease: 'power2.out' }, '<+.25')
		.to('#book .cover', { opacity: 0, duration: 0.1 })
		.add(() => { $('#book .page').scrollTop = 0; showBookBar(b); gsap.to('#shelfMia', { opacity: 0, duration: 0.3 }); });
}
function showBookBar(b) {
	const chk = $('#chkBtn'), take = $('#takeBtn');
	chk.innerHTML = b.checkedToday ? '今天验证过了<small>每本每天算一次，换一本还能验</small>'
		: `做小验证补心<small>${D.hearts >= MAXH() ? '心是满的，验证只算备战「锦囊」' : D.refilledToday.guide ? '今天锦囊补心用过了，验证只算备战' : '3 题，对 2 题补 1 颗心'}</small>`;
	chk.disabled = !!b.checkedToday; chk.style.opacity = b.checkedToday ? 0.55 : 1;
	take.textContent = b.inBag ? '在背包里 ✓' : '带上它';
	show('#bookBar'); gsap.from('#bookBar', { y: 80, opacity: 0, duration: 0.4, ease: 'back.out(1.6)' });
	say($('#shelfSay'), shelf.mode === 'stuck' && b.slug === recSlug() ? '对，就这本。带上它再打一次。' : '读完可以带上它，或者做 3 题小验证。');
}
function hideBookBar() { gsap.to('#bookBar', { opacity: 0, y: 30, duration: 0.2, onComplete: () => { hide('#bookBar'); gsap.set('#bookBar', { opacity: 1, y: 0 }); } }); }
function bookToBag(done) {
	gsap.to('#bag', { y: 0, duration: 0.3, ease: 'back.out(1.6)' });
	const book = $('#book'), a = AR(), bg = ctr($('#bag')), BH = bookH();
	const p1 = { x: bg.x - a.width / 2, y: bg.y - 6 - (BOOK_TOP + BH / 2) }, c = { x: p1.x * 0.35, y: -150 };
	hideBookBar();
	gsap.timeline()
		.set('#book .cover', { opacity: 1 })
		.to('#book .cover', { rotationY: 0, duration: 0.34, ease: 'power2.in' })
		.add(() => play('bookclose'))
		.to(book, { scaleY: 0.97, scaleX: 1.02, duration: 0.06, yoyo: true, repeat: 1 })
		.to(book, { y: -22, scale: 0.92, rotation: 4, duration: 0.22, ease: 'power2.out' }, '+=.05')
		.add(() => play('whoosh', 0.6))
		.to('#bagFlap', { rotation: -24, svgOrigin: '10 22', duration: 0.2, ease: 'power2.out' }, '<+.2')
		.add(() => arc(book, { x: 0, y: -22 }, { x: c.x, y: c.y }, p1, 0.55, 'power2.in', { s0: 0.92, s1: 0.07, r0: 4, r1: 220 }))
		.add(() => {
			hide(book); play('bagin');
			gsap.timeline().to('#bag', { scaleY: 0.78, scaleX: 1.16, duration: 0.08, ease: 'power2.out' })
				.to('#bag', { scaleY: 1.1, scaleX: 0.94, duration: 0.12, ease: 'power2.out' })
				.to('#bag', { scaleY: 1, scaleX: 1, duration: 0.6, ease: 'elastic.out(1,.35)' })
				.to('#bagFlap', { rotation: 0, svgOrigin: '10 22', duration: 0.25, ease: 'back.out(3)' }, '<');
			dust(bg.x, bg.y - 20, 6); setTimeout(() => setBag(D.bag.length, true), 140);
		}, '+=.56')
		.add(() => { if (done) done(); }, '+=1.05');
}
function bookBack(done) {
	gsap.to('#bag', { y: 0, duration: 0.3, ease: 'back.out(1.6)' });
	const book = $('#book'), a = AR(), s = shelf.spine, BH = bookH();
	s.style.visibility = 'visible'; gsap.set(s, { y: -74, opacity: 0 });
	const sp = ctr(s), p1 = { x: sp.x - a.width / 2, y: sp.y - (BOOK_TOP + BH / 2) }; s.style.visibility = 'hidden';
	hideBookBar();
	gsap.timeline().set('#book .cover', { opacity: 1 }).to('#book .cover', { rotationY: 0, duration: 0.34, ease: 'power2.in' }).add(() => play('bookclose'))
		.add(() => { arc(book, { x: 0, y: 0 }, { x: p1.x * 0.3, y: Math.min(p1.y, 0) - 120 }, p1, 0.45, 'power2.in', { s0: 1, s1: 0.13, r0: 0, r1: -8 }); gsap.to(book, { rotationY: -80, duration: 0.4, delay: 0.1 }); })
		.add(() => { hide(book); s.style.visibility = 'visible'; gsap.set(s, { opacity: 1 }); play('bookslide', 0.7); }, '+=.46')
		.to(s, { y: 0, duration: 0.35, ease: 'bounce.out' })
		.to('#row1 .spine,#row2 .spine', { opacity: 1, duration: 0.3 }, '<')
		.to('.shelfhead p,.rowlab', { opacity: 1, duration: 0.3 }, '<')
		.add(() => { shelf.picked = false; gsap.to('#shelfMia', { opacity: 1, y: 0, duration: 0.3 }); tagSpines(recSlug()); if (done) done(); }, '+=.2');
}
function leaveShelf(then) {
	stopLoops();
	gsap.to('#shelf', { opacity: 0, duration: 0.3, onComplete: () => {
		hide('#shelf'); $('#shelf').style.opacity = 1; ['#chk', '#bookBar', '#book', '#bagPanel'].forEach(hide);
		$$('.recTag,.hadTag').forEach(e => e.remove());
		gsap.set(['#quiz', '#mapwrap', '#empty'], { scale: 1, opacity: 1 });
		if (then) then();
	} });
}
function shelfExit() { // 从书屋回到来的地方
	const from = shelf.fromScene, mode = shelf.mode, lv = shelf.levelId;
	leaveShelf(() => {
		if (from === '#empty' || mode === 'refill') { showEmpty(emptyCtx, true); return; }
		if (from === '#quiz') { backToMap(() => { const n = lv && NODE[lv]; if (n && n.state !== 'done') levelSheet(n); }); return; }
		restoreMap(); refreshQuiet();
	});
}
$('#shelfBack').onclick = () => { play('tap'); shelfExit(); };
$('#putBack').onclick = () => { play('tap'); bookBack(); };
$('#takeBtn').onclick = () => {
	const b = shelf.book; if (!b) return;
	play('tap');
	if (b.inBag) { toast('它已经在背包里了'); return; }
	$('#takeBtn').disabled = true;
	api('lojo/quest/take', { slug: b.slug }).then(r => {
		const wasGuide = D.prep.guide;
		D.bag = r.bag; D.prep = r.prep; D.bossReady = r.prep.guide && r.prep.gear && r.prep.news; b.inBag = true;
		gsap.to('#shelfMia', { opacity: 1, duration: 0.3 });
		say($('#shelfSay'), '收好了。' + (wasGuide ? '' : '备战「锦囊」打勾 ✓。') + (shelf.levelId ? '回去再打一次？' : ''));
		bookToBag(() => shelfExit());
	}).catch(e => toast(errText(e))).finally(() => { $('#takeBtn').disabled = false; });
};
$('#bag').onclick = () => {
	if (shelf.picked) return; play('tap');
	const p = $('#bagPanel');
	const items = D.bag.map(slug => bookBySlug(slug)).filter(Boolean);
	p.innerHTML = `<h4>背包 · ${items.length} / 3</h4><p>最多装 3 本，新的进来，最早的那本放回书架。</p>` +
		(items.length ? items.map(b => `<div class="bagItem"><i style="background:${esc(b.color)}"></i>${b.no} 号 · ${esc(b.title)}</div>`).join('') : '<p>还是空的。读完一本点「带上它」。</p>') +
		'<button class="btn2" id="bagClose">收起</button>';
	show(p, 'block'); gsap.from(p, { y: 120, duration: 0.4, ease: 'back.out(1.5)' });
	$('#bagClose').onclick = () => { play('tap'); hide(p); };
};

/* 锦囊小验证：3 题，答完一起交给服务器判 */
let ck = { b: null, i: 0, answers: [] };
$('#chkBtn').onclick = () => {
	const b = shelf.book; if (!b || b.checkedToday) return;
	play('tap'); ck = { b, i: 0, answers: [] };
	$$('#chk .dots i').forEach(d => { d.className = ''; d.textContent = ''; d.style.background = ''; });
	$('#chkRes').innerHTML = ''; hide('#chkRes'); $('#chkBtns').innerHTML = '';
	hideBookBar(); gsap.to('#bag', { y: 150, duration: 0.3, ease: 'power2.in' });
	const c = $('#chk'); show(c, 'block'); gsap.from(c, { y: 160, duration: 0.45, ease: 'back.out(1.5)' }); showChkQ();
};
function showChkQ() {
	const q = ck.b.quiz[ck.i];
	$('#chkN').textContent = `小验证 ${ck.i + 1} / ${ck.b.quiz.length} · 对 2 题过`;
	$('#chkQ').textContent = q.q;
	$('#chkOpts').innerHTML = q.o.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join('');
	gsap.from('#chkQ,#chkOpts .opt', { y: 12, opacity: 0, stagger: 0.05, duration: 0.25 });
	$$('#chkOpts .opt').forEach(o => { o.onclick = () => chkPick(o); });
}
function chkPick(o) {
	if ($('#chkOpts').dataset.busy) return; $('#chkOpts').dataset.busy = '1';
	ck.answers.push(+o.dataset.i); play('tap');
	o.style.background = '#EEF0F7';
	const dot = $$('#chk .dots i')[ck.i]; if (dot) { dot.style.background = '#141E52'; gsap.from(dot, { scale: 1.8, duration: 0.3, ease: 'back.out(3)' }); }
	setTimeout(() => {
		$('#chkOpts').dataset.busy = '';
		ck.i++;
		if (ck.i < ck.b.quiz.length) showChkQ(); else submitCheck();
	}, 280);
}
function submitCheck() {
	const b = ck.b;
	$('#chkQ').textContent = '交卷中…'; $('#chkOpts').innerHTML = '';
	api('lojo/quest/check', { slug: b.slug, answers: ck.answers }).then(r => {
		$('#chkQ').textContent = '';
		$$('#chk .dots i').forEach((d, i) => { const ok = r.results[i]?.correct; d.style.background = ''; d.className = ok ? 'ok' : 'no'; d.textContent = ok ? '✓' : '✕'; });
		const rows = r.results.map((x, i) => `<div class="rr${x.correct ? '' : ' no'}"><i>${x.correct ? '✓' : '✕'}</i><span>${esc(b.quiz[i].q)}<br>答案：<b>${esc(b.quiz[i].o[x.answer])}</b>。${esc(x.why ?? '')}</span></div>`).join('');
		const msg = !r.passed ? `对 ${r.right} / 3，差一点（要对 2 题）。再读一遍，或者换一本。`
			: r.reason === 'duplicate' ? '这本今天已经验证过了，不重复算。换一本试试。'
				: r.refilled ? `对 ${r.right} / 3，过了！<b>补 1 颗心</b>，备战「锦囊」打勾，书进了背包。`
					: r.reason === 'full' ? `对 ${r.right} / 3，过了。心是满的（最多 5 颗），这次不补；备战「锦囊」打勾了。`
						: r.reason === 'pathUsed' ? `对 ${r.right} / 3，过了。今天锦囊这条路已经补过 1 颗心，明天再来；备战「锦囊」打勾了。`
							: `对 ${r.right} / 3，过了。备战「锦囊」打勾了。`;
		const res = $('#chkRes'); res.innerHTML = rows + `<div class="msg">${msg}</div>`; show(res, 'block'); gsap.from(res, { y: 10, opacity: 0, duration: 0.3 });
		const counted = r.passed && r.reason !== 'duplicate';
		D.prep = r.prep; D.bossReady = r.prep.guide && r.prep.gear && r.prep.news;
		if (counted) { b.checkedToday = true; if (!D.bag.includes(b.slug)) D.bag = [...D.bag, b.slug].slice(-3); b.inBag = true; }
		if (r.refilled) D.refilledToday.guide = true;
		const btns = $('#chkBtns');
		if (r.passed) {
			play('pass', 0.8);
			btns.innerHTML = '<button class="btn2 coral" id="chkOk">收好</button>';
			if (r.refilled) setTimeout(() => gainHeart($('#chk'), r.hearts), 300); else drawHearts(r.hearts);
			D.hearts = r.hearts;
			if (r.streak?.changed) setTimeout(() => { $('#streakN').textContent = r.streak.days; $('#streakChip').classList.remove('cold'); gsap.fromTo('#streakChip', { scale: 1.7 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1,.3)' }); }, 1300);
			$('#chkOk').onclick = () => {
				play('tap');
				gsap.to('#chk', { y: 40, opacity: 0, duration: 0.25, onComplete: () => { hide('#chk'); gsap.set('#chk', { y: 0, opacity: 1 }); } });
				const after = () => { if (r.streak?.gotFreeze) refresh().then(() => showFreeze(`连胜 ${r.streak.days} 天！`, '每连胜 7 天送 1 张', shelfExit), shelfExit); else shelfExit(); };
				if (counted) bookToBag(after); else bookBack(after);
			};
		} else {
			play('fail', 0.5);
			btns.innerHTML = '<div class="two" style="display:flex;gap:6px"><button class="btn2" id="chkRead" style="flex:1">再读一遍</button><button class="btn2 line" id="chkOther" style="flex:1">换一本</button></div>';
			$('#chkRead').onclick = () => { play('tap'); hide('#chk'); gsap.to('#bag', { y: 0, duration: 0.3 }); $('#book .page').scrollTop = 0; showBookBar(b); };
			$('#chkOther').onclick = () => { play('tap'); hide('#chk'); bookBack(); };
		}
		setTimeout(() => $('#chk').scrollIntoView?.({ block: 'nearest' }), 50);
	}).catch(e => {
		toast(errText(e));
		$('#chkBtns').innerHTML = '<button class="btn2" id="chkRetry">再交一次</button>';
		$('#chkRetry').onclick = () => { $('#chkBtns').innerHTML = ''; submitCheck(); };
	});
}

/* ================= 补心：两条路 + 等回满 ================= */
let wakeTimer = null, emptyCtx = 'map';
function refillGear() { // 上次没过那关的装备；那个装备不补心就换听写
	const lf = D.lastFail && NODE[D.lastFail.levelId];
	let g = lf?.gear ?? target()?.gear ?? null;
	if (!g || !g.givesHeart) g = { path: '/dictation', zh: '听写', givesHeart: true };
	return g;
}
function showEmpty(ctx, again) {
	if (!D) return;
	emptyCtx = ctx;
	const el = $('#empty'); show(el); gsap.set(el, { opacity: 1, scale: 1 }); el.scrollTop = 0;
	const n = D.hearts, max = MAXH(), rg = D.refilledToday;
	$('#refillShelf').classList.toggle('done', !!rg.guide); $('#refillGear').classList.toggle('done', !!rg.gear);
	$('#refillShelf .plus').textContent = rg.guide ? '✓ 今天补过' : '+1 ❤'; $('#refillGear .plus').textContent = rg.gear ? '✓ 今天补过' : '+1 ❤';
	const g = refillGear();
	$('#gearWayT').textContent = `去装备练一组 · ${g.zh}`;
	$('#emptyH').textContent = n <= 0 ? '心打光了' : `补心 · 现在 ${n} / ${max}`;
	$('#emptySub').textContent = n <= 0 ? '练习补心，两条路每天各补 1 颗；或者等下一次回满。'
		: n >= max ? '心是满的，最多 5 颗。' : '不用等打光。两条路每天各补 1 颗，补完接着打。';
	$('#waitT').textContent = `等${refillLabel()} 回满 5 颗`;
	$('#emptyBack').textContent = ctx === 'fail' ? '回到这关' : '回地图';
	const bh = n > 0 ? '#E8603F' : '#E9E1D2'; $$('#bigHeart path').forEach(p => p.setAttribute('fill', bh));
	if (!again) {
		gsap.from('#empty > *', { y: 24, opacity: 0, stagger: 0.05, duration: 0.3, ease: 'back.out(1.6)' });
		if (n <= 0) {
			play('fail', 0.5);
			gsap.fromTo('#bhL', { x: 0, rotation: 0 }, { x: -8, rotation: -10, transformOrigin: '55px 84px', duration: 0.5, delay: 0.3, ease: 'back.out(3)' });
			gsap.fromTo('#bhR', { x: 0, rotation: 0 }, { x: 8, rotation: 10, transformOrigin: '55px 84px', duration: 0.5, delay: 0.3, ease: 'back.out(3)' });
		} else { play('open', 0.7); gsap.set('#bhL,#bhR', { x: 0, rotation: 0 }); }
	} else if (n > 0) { gsap.to('#bhL,#bhR', { x: 0, rotation: 0, duration: 0.5, ease: 'back.out(2)' }); gsap.fromTo('#bigHeart', { scale: 1.3 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,.35)' }); }
	const tick = () => { const left = Date.parse(D.nextRefillAt) - serverNow(); $('#wakeT').textContent = leftText(left); if (left <= 0) { clearInterval(wakeTimer); refresh().then(() => showEmpty(emptyCtx, true), () => {}); } };
	clearInterval(wakeTimer); tick(); wakeTimer = setInterval(tick, 1000);
}
$('#refillShelf').onclick = e => {
	if (D.refilledToday.guide) { play('fail', 0.4); toast('今天锦囊这条路补过了，明天再来', 1800); return; }
	if (D.hearts >= MAXH()) { toast('心是满的，最多 5 颗', 1400); return; }
	play('tap'); enterShelf('refill', { fromEl: e.currentTarget });
};
$('#refillGear').onclick = () => {
	if (D.refilledToday.gear) { play('fail', 0.4); toast('今天装备这条路补过了，明天再来', 1800); return; }
	if (D.hearts >= MAXH()) { toast('心是满的，最多 5 颗', 1400); return; }
	play('whoosh', 0.6); go(refillGear().path);
};
$('#waitBtn').onclick = () => { play('tap'); toast(`${refillLabel()} 自动回满，不用守着`, 1800); };
$('#emptyBack').onclick = () => {
	play('tap'); clearInterval(wakeTimer);
	gsap.to('#empty', { opacity: 0, duration: 0.3, onComplete: () => {
		hide('#empty'); $('#empty').style.opacity = 1;
		if (emptyCtx === 'fail' && AT && AT.end && $('#quiz').style.display === 'flex') {
			$('#failRetry').textContent = D.hearts > 0 ? '再打一次（换新题）' : '先补心，再打一次';
			gsap.to('#fail', { y: '0%', duration: 0.45, ease: 'back.out(1.4)' });
		} else backToMap(() => miaSay(miaLine()));
	} });
};

/* ================= 开始 ================= */
show('#loader');
refreshQuiet();

/* 跟社区的约定（社区那边的 Vue 页面照这个实现）：
   window.__vibesQuest = {
     api(endpoint, params) → Promise<结果>；失败时 reject({ code, message })，code 是服务器的错误码（如 NO_HEARTS）
     go(path)              → 在社区里跳转（站内路径，如 /dictation、/guides/xxx、/chat/user/<id>、/tags/xxx）
     query: { book?, level? } → 打开时直接翻到哪本锦囊 / 哪一关
   }
   这一页放在 /lojo-assets/quest/index.html，用 iframe 嵌进社区的 /quest 页面。
   单独打开时：api 直接 POST /api/<endpoint>，用 localStorage 里 account.token；go 直接换地址；query 读地址栏。 */
})();
