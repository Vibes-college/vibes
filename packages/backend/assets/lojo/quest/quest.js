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
const URLQ = new URLSearchParams(window.location.search);
/* ?s=<画面名>：预览某个画面，用假数据、不连服务器。正式站（app.vibes.college）上不认这个参数。 */
const SP = URLQ.get('s') ?? Q?.query?.s ?? null;
const PREVIEW = SP != null && window.location.hostname !== 'app.vibes.college';
const api = (ep, params) => PREVIEW ? fakeApi(ep, params || {})
	: (Q && typeof Q.api === 'function') ? Promise.resolve(Q.api(ep, params || {})) : fetchApi(ep, params);
function go(path) {
	if (!path) return;
	if (PREVIEW) { toast('预览：这里会跳到 ' + path, 2000); return; }
	if (/^https?:\/\//.test(path)) { window.open(path, '_blank', 'noopener'); return; }
	if (Q && typeof Q.go === 'function') Q.go(path); else window.location.href = path;
}
const QUERY = (() => {
	if (Q && Q.query) return { book: Q.query.book ?? null, level: Q.query.level ?? null, from: Q.query.from ?? null };
	return { book: URLQ.get('book'), level: URLQ.get('level'), from: URLQ.get('from') };
})();

/* ================= 小工具 ================= */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const svgNS = 'http://www.w3.org/2000/svg';
const show = (el, d = 'flex') => { (typeof el === 'string' ? $(el) : el).style.display = d; };
const hide = el => { (typeof el === 'string' ? $(el) : el).style.display = 'none'; };

/* 减少动态效果（系统设置里打开了）：动画快 3 倍，不回弹，不跑无限循环；声音照常 */
const RM = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
if (RM) {
	gsap.globalTimeline.timeScale(3);
	const fix = v => (v && typeof v.ease === 'string' && /^(back|elastic|bounce)/.test(v.ease)) ? { ...v, ease: 'power1.out' } : v;
	const wrap = (orig, kind) => function (t, a, b, c) {
		if (kind === 'fromTo') {
			if (b && b.repeat === -1) return orig.call(this, t, a, { ...b, ...(b.yoyo ? a : {}), duration: 0, repeat: 0, delay: 0 }, c);
			return orig.call(this, t, a, fix(b), c);
		}
		if (a && a.repeat === -1) return orig.call(this, t, { duration: 0 }, b);
		return orig.call(this, t, fix(a), b);
	};
	gsap.to = wrap(gsap.to.bind(gsap), 'to'); gsap.from = wrap(gsap.from.bind(gsap), 'from'); gsap.fromTo = wrap(gsap.fromTo.bind(gsap), 'fromTo');
	const TP = gsap.core.Timeline.prototype;
	TP.to = wrap(TP.to, 'to'); TP.from = wrap(TP.from, 'from'); TP.fromTo = wrap(TP.fromTo, 'fromTo');
}

/* ================= 声音（Kenney，CC0，见 sounds/CREDITS.txt） ================= */
const SOUNDS = ['tap', 'open', 'stamp', 'pass', 'fail', 'heartbreak', 'whoosh', 'scratch', 'chest', 'milestone', 'freeze', 'heartup', 'warn', 'reset', 'tick', 'bosshit', 'lose', 'latch', 'dooropen', 'bookslide', 'bookflip', 'bookclose', 'bagin', 'lighton', 'freezeuse', 'page', 'offline'];
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
	if (c === 'NOT_RETESTABLE') return '这关现在不用回测';
	if (c === 'INVALID_EXAM_DATE') return '日期不对：要选明天以后、两年以内的一天';
	if (c === 'NO_AUDIO') return '录音暂时出不来，先看文字';
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
	// 顶栏：心是 0 时只放 1 颗空心 + 回满倒计时，不挤
	$('#hearts').innerHTML = n <= 0 ? heartSVG(false) : h;
	['#qHearts', '#bHearts'].forEach(s => { $(s).innerHTML = h; });
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
	// 顶栏只在心是 0 时写倒计时（♡ 07:10）；有心时胶囊放 5 颗心 + 外面的「+」，375 宽放不下倒计时
	t.textContent = shownHearts <= 0 ? leftText(left).slice(0, 5) : ''; t.title = `${refillLabel()} 回满 5 颗`;
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
	if (n.kind === 'level') { // 手机上地图铺满屏宽（约 0.9 倍）：圆点 ≥28px、关卡号 ≥12px。过了的关，关卡号和星星画在 nodeTags 里（不跟着褪色）
		const done = n.state === 'done', locked = n.state === 'locked';
		return `<circle r="${cur ? 18 : 16}" fill="${cur ? '#FCE7DF' : done ? '#FFFDF8' : '#F6F1E7'}" stroke="${cur ? '#E8603F' : '#141E52'}" stroke-width="${cur ? 2.6 : 1.8}" ${locked ? 'stroke-dasharray="3 3"' : ''}/>` +
			(done ? `<g transform="scale(1.35)">${CHECK}</g>` : `<text y="5" text-anchor="middle" font-size="${n.label.length > 3 ? 12.5 : 14}" fill="${cur ? '#E8603F' : '#8f846f'}">${lab}</text>`) +
			(n.practice && !done ? `<circle r="${cur ? 23 : 21}" fill="none" stroke="#3E9E7A" stroke-width="1.5" stroke-dasharray="3 4"/>` : '');
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
		if (n.kind === 'level') g.insertAdjacentHTML('beforeend', '<circle class="hit" r="25" fill="transparent"/>'); // 点击区域 ≥44×44
		const inner = document.createElementNS(svgNS, 'g'); inner.setAttribute('class', 'ndi'); inner.innerHTML = nodeInner(n, tg && tg.id === n.id && n.kind === 'level'); g.appendChild(inner);
		if (n.state === 'locked' && n.kind !== 'boss') { inner.setAttribute('opacity', '.42'); inner.setAttribute('filter', 'url(#gray)'); }
		if (n.age === 'fade') inner.setAttribute('opacity', '.45');
		if (n.age === 'gray') { inner.setAttribute('filter', 'url(#gray)'); inner.setAttribute('opacity', '.4'); }
		if (n.kind === 'level' && n.state === 'done') {
			const muted = n.age ? ' fill="#6E7088"' : '';
			g.insertAdjacentHTML('beforeend', `<text class="lab" y="34" text-anchor="middle" font-size="13.5"${muted}>${esc(n.label)}</text>` +
				(n.stars ? `<text class="lab" y="48" text-anchor="middle" font-size="12" fill="#C99520" letter-spacing="1">${'★'.repeat(Math.min(3, n.stars))}<tspan fill="#d8ccb4">${'★'.repeat(Math.max(0, 3 - n.stars))}</tspan></text>` : ''));
		}
		if (n.kind !== 'start') g.addEventListener('click', () => { bounce(inner); nodeTap(n.id); });
		nodes.appendChild(g);
	});
	placeNotes();
	gsap.to('.recEdge', { strokeDashoffset: -22, duration: 1, repeat: -1, ease: 'none' });
	// 练习关的图例
	const prac = D.chapter.nodes.some(n => n.kind === 'level' && n.practice && n.state !== 'done');
	$('#pracNote').innerHTML = prac ? '<circle cx="6" cy="0" r="6" fill="none" stroke="#3E9E7A" stroke-width="1.3" stroke-dasharray="2 3"/><text x="16" y="3.5" font-size="9.5" font-weight="800" fill="#3E9E7A" font-family="PingFang SC,sans-serif">练手关 · 不扣心</text>' : '';
	// 图钉
	if (tg) { show('#pinPos', 'inline'); $('#pinPos').setAttribute('transform', tg.kind === 'boss' ? `translate(${tg.x - 44} ${tg.y})` : `translate(${tg.x} ${tg.y - 20})`); } else hide('#pinPos');
	// 手机上地图比一屏高：打开时（和当前关换了以后）停在当前这一关
	if (tg && tg.id !== mapAt) { mapAt = tg.id; requestAnimationFrame(() => mapScrollTo(tg)); }
}
let mapAt = null;
function mapScrollTo(n) {
	const w = $('#mapwrap'), sc = $('#map').getBoundingClientRect().width / 390;
	if (w.scrollHeight <= w.clientHeight + 1) return;
	w.scrollTop = Math.max(0, n.y * sc - w.clientHeight * 0.45);
}
// 「7 天没碰」「14 天没回测」这类状态字：在关卡下方、右边、左边里挑一个不压线、不压别的关、不出图的位置
function placeNotes() {
	const notes = { fade: ['7 天没碰 · 在褪色', '#B9472C'], gray: ['14 天没回测 · 灰了', '#7a7a7a'] };
	const rects = [], hit = (A, B) => A[0] < B[2] && A[2] > B[0] && A[1] < B[3] && A[3] > B[1];
	$$('#edges path').forEach(p => { const L = p.getTotalLength(); for (let d = 0; d <= L; d += 4) { const q = p.getPointAtLength(d); rects.push([q.x - 2, q.y - 2, q.x + 2, q.y + 2]); } });
	D.chapter.nodes.forEach(m => {
		if (m.kind === 'level' || m.kind === 'boss') rects.push([m.x - 22, m.y - 22, m.x + 22, m.y + (m.state === 'done' ? (m.stars ? 52 : 38) : 22)]);
		else if (m.kind === 'start') rects.push([m.x - 16, m.y - 8, m.x + 16, m.y + 26]);
		else rects.push([m.x - 34, m.y - 26, m.x + 34, m.y + 38]);
	});
	D.chapter.nodes.forEach(n => {
		if (!notes[n.age] || n.kind !== 'level') return;
		const [txt, color] = notes[n.age], fs = 12.5;
		const g = $('#nd-' + n.id);
		g.insertAdjacentHTML('beforeend', `<text class="note" x="0" y="0" font-size="${fs}" fill="${color}">${txt}</text>`);
		const t = g.lastElementChild, w = t.getComputedTextLength() + 4;
		const below = n.state === 'done' ? (n.stars ? 66 : 52) : 38;
		const cands = [[n.x + 26, n.y + 5, 'start'], [n.x - 26, n.y + 5, 'end'], [n.x, n.y + below, 'middle'], [n.x + 26, n.y + 24, 'start'], [n.x - 26, n.y + 24, 'end'], [n.x + 24, n.y + 44, 'start'], [n.x - 24, n.y + 44, 'end'], [n.x + 26, n.y - 12, 'start'], [n.x - 26, n.y - 12, 'end'], [n.x, n.y - 28, 'middle']];
		const box = ([x, y, a]) => { const l = a === 'start' ? x : a === 'end' ? x - w : x - w / 2; return [l, y - fs, l + w, y + 3]; };
		const free = c => { const B = box(c); return B[0] >= 4 && B[2] <= 386 && B[1] >= 4 && B[3] <= 596 && !rects.some(R => hit(R, B)); };
		const c = cands.find(free) ?? cands[2];
		t.setAttribute('x', c[0] - n.x); t.setAttribute('y', c[1] - n.y); t.setAttribute('text-anchor', c[2]);
		rects.push(box(c));
	});
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
		$('#todayS').textContent = tg.practice ? `练手关 · ${tg.ask} 题对 ${tg.need} 题过 · 不扣心` : `${tg.ask} 题对 ${tg.need} 题过 · 答错扣 1 颗心`;
		go.textContent = tg.practice && tg.tries === 0 ? '出发' : '开打';
	}
	$('#todayE').textContent = `经验 ${D.xp}` + (D.todayXp ? ` · 今天 +${D.todayXp}` : '');
	$('#fineT').textContent = D.chapter.disclaimer || '练习难度，不是官方分数';
}
function miaLine() {
	const tg = target(), h = D.hearts;
	if (h <= 0) return `心打光了。两条路各补 1 颗：<b>读锦囊做小验证</b>，或<b>去装备练一组</b>；不补就等${refillLabel()} 回满。`;
	if (D.lastFail && NODE[D.lastFail.levelId]?.state === 'open') {
		const rec = D.books.find(b => b.recommended);
		return `上次 ${esc(NODE[D.lastFail.levelId].label)} 没过。` + (rec ? `书屋里我给你挑了 <b>${rec.no} 号「${esc(rec.spine)}」</b>，读完再打。` : '再打一次会换新题。');
	}
	if (tg?.kind === 'boss' && !D.bossReady) return 'Boss 门前要<b>备战三件</b>：书屋带一本锦囊、装备练一组、情报站看一眼。';
	if (tg?.kind === 'boss') return '备战齐了，门开了。进去就打。';
	if (!D.streak.doneToday && D.streak.days > 0) return `火苗 <b>${D.streak.days}</b> 天，今天还没续上。过一关、或补一次心，就算今天练过。`;
	if (tg?.practice) return '绿虚线圈的是<b>练手关</b>，答错不扣心，放心打。';
	return `今天这一步：<b>${esc(tg?.label ?? '')}</b>。心有 <b>${h}</b> 颗。`;
}
function render() {
	drawTop(); drawMap(); drawDock(); drawCount();
	miaSay(miaLine());
}

/* 离考场倒数：有日子就倒数 + 还剩几关；没定就请他定 */
function levelsLeft() { return D.chapter.nodes.filter(n => (n.kind === 'level' || n.kind === 'boss') && n.state !== 'done').length; }
function drawCount() {
	const c = $('#count');
	if (D.examDate == null) c.innerHTML = '<span>离考场</span><b style="font-size:20px">还没定日子</b><button class="dbtn" id="dateBtn">设考试日期 ›</button>';
	else c.innerHTML = `<span>离考场还有</span><b id="days">${D.daysLeft ?? 0}</b><span>天 · 还有 ${levelsLeft()} 关</span><button class="dbtn set" id="dateBtn">${esc(D.examDate)} ›</button>`;
	$('#dateBtn').onclick = () => openExamSheet();
	if (D.examDate == null || !D.behind) hideBehind();
}
/* 落后提醒：服务器算（最近 7 天的速度 × 剩下的天数），页面只管每天最多弹一次 */
const BEHIND_KEY = 'vibesQuestBehind';
let behindShown = false;
function hideBehind() { behindShown = false; gsap.set('#behind', { opacity: 0, yPercent: -140, y: 0, visibility: 'hidden' }); }
function maybeBehind(force) {
	if (!D?.behind || D.examDate == null) return;
	let seen = null; try { seen = localStorage.getItem(BEHIND_KEY); } catch (e) { seen = null; }
	if (!force && seen === D.day) return;
	try { localStorage.setItem(BEHIND_KEY, D.day); } catch (e) { /* 存不了就这次照弹 */ }
	const tg = NODE[D.behind.target];
	$('#behindT').textContent = tg ? D.behind.copy.replace(`走不到 ${D.behind.target}`, `走不到 ${tg.label}`) : D.behind.copy;
	$('#catchUp').textContent = `今天多打 ${Math.max(1, D.behind.n)} 关`;
	behindShown = true;
	gsap.timeline().set('#behind', { visibility: 'visible', yPercent: 0 }).fromTo('#behind', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' })
		.add(() => play('warn', 0.8), 0).fromTo('#behind', { x: 0 }, { x: 5, duration: 0.06, repeat: 5, yoyo: true }, 0.5);
	setTimeout(() => { if (behindShown) gsap.to('#behind', { opacity: 0, y: -20, duration: 0.4, onComplete: hideBehind }); }, 9000);
}
$('#catchUp').onclick = () => { play('tap'); gsap.to('#behind', { opacity: 0, duration: 0.25, onComplete: hideBehind }); const tg = target(); if (tg) nodeTap(tg.id); };

function intro() {
	const tl = gsap.timeline();
	tl.from('#nodes .nd', { scale: 0, transformOrigin: '50% 50%', stagger: 0.04, duration: 0.35, ease: 'back.out(3)' }, 0)
		.add(() => play('scratch', 0.7), 0.2)
		.from('#pin', { y: -60, opacity: 0, duration: 0.6, ease: 'bounce.out' }, 0.8)
		.from('#mia', { x: -60, opacity: 0, duration: 0.45, ease: 'back.out(1.6)' }, 0.9)
		.from('#ch2', { opacity: 0, duration: 0.6 }, 0.6)
		.from('#count', { y: -10, opacity: 0, duration: 0.35 }, 0.5);
	if ($$('.inkE').length) tl.to('.inkE', { strokeDashoffset: 0, duration: 0.35, stagger: 0.07, ease: 'power1.inOut' }, 0.15);
	gsap.to('#pin', { scale: 1.12, transformOrigin: '50% 100%', duration: 0.45, repeat: -1, yoyo: true, ease: 'sine.inOut' });
	gsap.to('#miaHeart', { scale: 1.18, transformOrigin: '50% 50%', duration: 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut', repeatDelay: 0.6 });
	gsap.to('#flag', { skewY: 8, transformOrigin: '0 50%', duration: 0.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
	gsap.to('#flameSvg', { scaleY: 1.15, transformOrigin: '50% 100%', duration: 0.3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
	if (!RM) setInterval(() => gsap.fromTo('#miaEyes', { scaleY: 1 }, { scaleY: 0.1, transformOrigin: '50% 26px', duration: 0.08, yoyo: true, repeat: 1 }), 3200);
}
/* 进场动画之后：第一次来走引导；漏了一天的通知（服务器只给一次）；再处理地址栏 */
function afterIntro() {
	if (!D.onboarded || SP === 'new') { startCoach(); return; }
	const nt = D.notice;
	if (nt?.kind === 'freeze') { showFreezeUse(nt.used); return; }
	if (nt?.kind === 'lost') { showStreakLost(nt.days, nt.best); return; }
	if (PREVIEW && previewAfter()) return;
	handleQuery();
	maybeBehind();
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
			hideLoader();
			intro();
			setTimeout(afterIntro, 900);
		}
		return r;
	}).catch(e => {
		if (firstPaint) {
			hideLoader(true);
			$('#errP').innerHTML = e?.code === 'NOT_SIGNED_IN' ? '要先登录社区，才能记下你的进度。' : '网卡了一下，或者我们这边出了点小问题。<br>你的进度、连胜和心都存着，不会丢。';
			$('#errRetry').textContent = e?.code === 'NOT_SIGNED_IN' ? '去登录' : '再试一次';
			$('#errRetry').dataset.login = e?.code === 'NOT_SIGNED_IN' ? '1' : '';
			$('#errCode').textContent = e?.code ? '错误码 ' + e.code + ' · 一直这样，就截图发到公会' : '一直这样，就截图发到公会';
			show('#errScr');
		} else if (isOffline(e)) goOffline(); else toast(errText(e));
		throw e;
	}).finally(() => { loading = null; });
	return loading;
}
const refreshQuiet = () => refresh().catch(() => {});
$('#errRetry').onclick = () => {
	play('tap');
	if ($('#errRetry').dataset.login) { go('/'); return; }
	hide('#errScr'); showLoader(); refreshQuiet();
};
$('#errHome').onclick = () => { play('tap'); go('/'); };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && D && !busy() && !PREVIEW) refreshQuiet(); });
const busy = () => $('#quiz').style.display === 'flex' || $('#boss').style.display === 'flex' || $('#shelf').style.display === 'block';

/* ?book= 翻到哪本；?level= 打开哪关；?from=<小程序> 是练完一组从小程序回来 */
const FROM_ZH = { dictation: '听写', typing: '机考打字', vocab: '词汇线', grammar: '语法线', wordbook: '生词本', 'photo-words': '拍照单词' };
function handleQuery() {
	if (QUERY.book && bookBySlug(QUERY.book)) { enterShelf('browse', { open: QUERY.book }); return; }
	if (QUERY.level && NODE[QUERY.level]) {
		const n = NODE[QUERY.level];
		if (QUERY.from && QUERY.from !== 'quest') miaSay(`从${esc(FROM_ZH[QUERY.from] ?? '小程序')}回来了。心现在 <b>${D.hearts}</b> 颗${D.prep.gear ? '，备战「装备」打勾了' : ''}。`);
		if (n.kind === 'boss') bossSheet(); else if (n.kind === 'level') nodeTap(n.id);
	}
}
/* 去小程序练一组：带上 from=quest 和这关，练完那边会给个「回闯关」 */
function gearGo(path, levelId) {
	if (!path) return;
	if (/^https?:/.test(path)) { go(path); return; }
	go(path + (path.includes('?') ? '&' : '?') + 'from=quest' + (levelId ? '&level=' + encodeURIComponent(levelId) : ''));
}

/* ================= 抽屉 ================= */
const sheet = $('#sheet'), scrim = $('#scrim'), body = $('#sheetBody');
/* 开抽屉前，把还挂着的宝箱 / Boss 胜利 / 冻结卡 / 通知层收掉，免得叠在一起 */
function killOverlays() {
	['#winOv', '#chestOv', '#frzOv', '#fuOv'].forEach(s => { const el = $(s); if (!el || el.style.display !== 'flex') return; gsap.killTweensOf(el); gsap.killTweensOf(s + ' *'); hide(el); el.style.opacity = 1; });
	gsap.killTweensOf('#rays');
}
function openSheet(html, bind) {
	killOverlays();
	play('open'); body.innerHTML = html; if (bind) bind(body);
	sheet.scrollTop = 0;
	gsap.to(scrim, { opacity: 1, duration: 0.25 }); scrim.style.pointerEvents = 'auto';
	gsap.fromTo(sheet, { y: '105%' }, { y: '0%', duration: 0.5, ease: 'back.out(1.3)' });
	gsap.from('#sheetBody > *:not(.stick)', { y: 16, opacity: 0, stagger: 0.05, delay: 0.12, duration: 0.3 });
}
function closeSheet(silent) { if (!silent) play('tap', 0.6); gsap.to(sheet, { y: '105%', duration: 0.3, ease: 'power2.in' }); gsap.to(scrim, { opacity: 0, duration: 0.25 }); scrim.style.pointerEvents = 'none'; }
scrim.onclick = () => closeSheet(); sheet.querySelector('[data-close]').onclick = () => closeSheet();

function nodeTap(id) {
	const n = NODE[id]; if (!n) return;
	if (n.kind === 'level') {
		if (n.state === 'locked') { play('fail', 0.4); toast('这关还没开：先过前面连着它的一关'); return; }
		if (n.state === 'done' && n.retestable) { retestSheet(n); return; }
		levelSheet(n); return;
	}
	if (n.kind === 'boss') { bossSheet(); return; }
	if (n.kind === 'shelf') { enterShelf('browse', { fromEl: $('#nd-' + id) }); return; }
	if (n.state === 'locked') { play('fail', 0.4); toast('还没走到这里：先过前面的关'); return; }
	if (n.kind === 'gear') gearSheet(n);
	if (n.kind === 'news') newsSheet(n);
}
function levelSheet(n) {
	const out = !n.practice && D.hearts <= 0;
	const kind = n.practice ? '练手关' : '';
	const html = `<h4>${esc(n.label)} ${kind} · ${esc(n.name ?? '')}</h4>
		<div class="sub">${esc(n.zh ?? '')} · ${n.ask} 题，对 ${n.need} 题过${n.practice ? ' · <b style="color:#3E9E7A">练手 · 不扣心</b>' : ' · 答错扣 1 颗心'}</div>
		${n.hint ? `<div class="hint">${md(n.hint)}</div>` : ''}
		<div class="card">${n.state === 'done' ? `过了 ✓ · 最好对 ${n.best ?? 0} 题。再打会换一组题。` : n.tries ? `打过 ${n.tries} 次，最好对 ${n.best ?? 0} 题。再打会换一组题。` : n.practice ? '练手关答错不扣心，每题打完告诉你为什么。打完这关，今天的火苗就点着了。' : '第一次打。今天第一次过关还有宝箱。'}</div>
		${n.gear ? `<div class="card">卡住了可以先去装备「${esc(n.gear.zh)}」练一组。</div>` : ''}
		${out ? '<button class="sbtn" data-a="refill">心打光了 · 去补心</button>' : `<button class="sbtn" data-a="start">${n.state === 'done' ? '再打一遍' : `开打 ${esc(n.label)}`}</button>`}`;
	openSheet(html, b => {
		b.querySelector('[data-a="start"]')?.addEventListener('click', () => { closeSheet(true); startLevel(n.id); });
		b.querySelector('[data-a="refill"]')?.addEventListener('click', () => { closeSheet(true); showEmpty('map'); });
	});
}
/* 回测：过了的关 7 天没碰会褪色、14 天灰掉；3 题对 2 题重新点亮，不扣心 */
function retestSheet(n) {
	openSheet(`<h4>${esc(n.label)} 回测 · ${esc(n.name ?? '')}</h4><div class="sub">${n.age === 'gray' ? '14 天没回测，这关灰了' : '7 天没碰，这关在褪色'}</div>
		<div class="card">3 题，约 3 分钟。<b>对 2 题重新点亮</b>，7 天内不再褪色。</div>
		<div class="card">回测<b>不扣心</b>，也算今天练过。</div>
		<button class="sbtn navy" data-a="retest">回测 3 题</button>
		<button class="sbtn line" data-a="again" style="margin-top:8px">不回测，整关再打一遍</button>`, b => {
		b.querySelector('[data-a="retest"]').onclick = () => { closeSheet(true); startLevel(n.id, { retest: true }); };
		b.querySelector('[data-a="again"]').onclick = () => { closeSheet(true); setTimeout(() => levelSheet(n), 320); };
	});
}
function gearSheet(n) {
	const g = n.gear;
	const tg = target();
	openSheet(`<h4>装备站 · ${esc(g?.zh ?? '')}</h4><div class="sub">社区里的小程序，免费</div>
		<div class="card">练完一组（10 题以上、2 分钟以上）补 1 颗心，每天一次。练完也给 Boss 备战「装备」打勾。${g && !g.givesHeart ? '<br><b>这个装备暂时不补心</b>，只算备战。' : ''}</div>
		<div class="card">今天装备这条路：${D.refilledToday.gear ? '<b>已经补过 1 颗心</b>' : '还没用'}</div>
		<button class="sbtn" data-a="go">去「${esc(g?.zh ?? '装备')}」练一组</button>`, b => {
		b.querySelector('[data-a="go"]').onclick = () => { play('whoosh', 0.6); closeSheet(true); gearGo(g?.path ?? '/dictation', tg?.kind === 'level' ? tg.id : null); };
	});
}
function newsSheet(n) {
	const tags = n.tags ?? [];
	openSheet(`<h4>情报站</h4><div class="sub">社区时间线里，跟这几关有关的帖子</div>
		<div class="card">看看同一关的人在聊什么、踩过什么坑。<br><b>情报不补心，只算 Boss 准备。</b></div>
		<div id="newsList"><div class="sub">正在拉最新的帖子…</div></div>
		<div style="margin-top:6px">${tags.map(t => `<button class="tagBtn" data-tag="${esc(t)}">看全部 #${esc(t)}</button>`).join('')}</div>
		<div class="sub" style="margin-top:10px" id="newsSt">${D.prep.news ? '备战「情报」已经打勾 ✓' : '正在记下：备战「情报」…'}</div>`, b => {
		b.querySelectorAll('[data-tag]').forEach(el => { el.onclick = () => { play('whoosh', 0.6); closeSheet(true); go('/tags/' + encodeURIComponent(el.dataset.tag)); }; });
		newsPreview(tags);
	});
	const tg = target();
	api('lojo/quest/news', { levelId: tg && tg.kind !== 'boss' ? tg.id : (tg?.id ?? null) }).then(r => {
		const was = D.prep.news; D.prep = r.prep; D.bossReady = r.prep.guide && r.prep.gear && r.prep.news;
		const st = $('#newsSt'); if (st) st.textContent = '备战「情报」已经打勾 ✓';
		if (r.xp) toast(`看了情报 · 经验 +${r.xp}`, 1600);
		if (!was) { play('pass', 0.6); refreshQuiet().then(() => gsap.from('#pp-news', { scale: 2.4, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(3)' })); }
	}).catch(e => { const st = $('#newsSt'); if (st) st.textContent = '没记上：' + errText(e); });
}
// 情报预览：每个话题标签拉最新几条，合并去重（Boss 的帖子同时带两个标签），只放第一段约 80 字，点开进帖子
function newsSnippet(text) {
	// 帖子第一行是关卡开头语（Stop 1-4 · … / Chapter 1 boss · …），每条都一样，预览里跳过；也去掉标签、More/Source 行
	const t = String(text ?? '').replace(/^(Stop [\w-]+|Chapter \d+ boss) · [^.\n]*\.\s*/i, '')
		.split('\n').filter(l => !/^\s*(More|Source)s?:/i.test(l)).join(' ')
		.replace(/#\S+/g, '').replace(/\s+/g, ' ').trim();
	return t.length > 80 ? t.slice(0, 80) + '…' : t;
}
function publicNotesByTag(tag) {
	if (PREVIEW) return Promise.resolve([]);
	return fetch('/api/notes/search-by-tag', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', body: JSON.stringify({ tag, limit: 5 }) })
		.then(r => r.ok ? r.json() : []).then(x => Array.isArray(x) ? x.filter(n => n.visibility === 'public') : []);
}
function newsPreview(tags) {
	const box = $('#newsList'); if (!box) return;
	if (!tags.length) { box.innerHTML = '<div class="sub">这一关还没有情报。</div>'; return; }
	Promise.all(tags.map(t => publicNotesByTag(t).catch(() => []))).then(lists => {
		const seen = new Set(), notes = [];
		for (const n of lists.flat()) if (n && n.id && !seen.has(n.id) && (n.text ?? '').trim()) { seen.add(n.id); notes.push(n); }
		notes.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
		const el = $('#newsList'); if (!el) return;
		if (!notes.length) { el.innerHTML = '<div class="sub">这一关还没有人发帖，去话题里发第一条吧。</div>'; return; }
		el.innerHTML = notes.slice(0, 3).map(n => `<button class="card newsItem" data-note="${esc(n.id)}" style="display:block;width:100%;text-align:left;cursor:pointer;font:inherit;color:inherit">
			<span>${esc(newsSnippet(n.text))}</span><br><span class="sub">@${esc(n.user?.username ?? '')} · 点开看全文 ›</span></button>`).join('');
		el.querySelectorAll('[data-note]').forEach(x => { x.onclick = () => { play('whoosh', 0.6); closeSheet(true); go('/notes/' + encodeURIComponent(x.dataset.note)); }; });
	}).catch(() => { const el = $('#newsList'); if (el) el.innerHTML = '<div class="sub">帖子没拉到，点下面的话题看。</div>'; });
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
			if (k === 'gear') { const g = Object.values(NODE).find(n => n.kind === 'gear'); if (g?.state === 'locked') toast('装备站还没走到'); else { const tg = target(); gearGo(g?.gear?.path ?? '/dictation', tg?.kind === 'level' ? tg.id : null); } }
			if (k === 'news') { const n = Object.values(NODE).find(x => x.kind === 'news'); if (!n || n.state === 'locked') toast('情报站还没走到'); else newsSheet(n); }
		};
	});
}
function bossSheet() {
	const n = Object.values(NODE).find(x => x.kind === 'boss'); if (!n) return;
	const locked = n.state === 'locked', B = D.chapter.boss;
	const ready = !locked && D.bossReady;
	const miss = ['guide', 'gear', 'news'].filter(k => !D.prep[k]).map(k => PREP[k][1]);
	const say = locked ? ''
		: !D.bossReady ? `还差${miss.join('、')}，备齐了门就开。点下面哪一件就去哪。`
			: D.bossLosses ? `上一局输了。再输一次备战就清零，要不要先去书屋翻翻？` : '三件都齐了。别急，一题一题来。';
	const html = `<h4>${esc(n.name ?? 'Boss')}</h4><div class="sub">第一章的门${n.zh ? ' · ' + esc(n.zh) : ''}</div>
		<div class="hint">打掉 <b>${B.hp}</b> 格血就赢，错 <b>${B.maxWrong}</b> 题就输<br>连输 2 次备战清零</div>
		${say ? `<div class="card">${say}</div>` : ''}
		${prepRows()}
		${ready ? `<div class="stick">${D.hearts > 0 ? '<button class="sbtn navy" data-a="fight">打 Boss</button>' : '<button class="sbtn" data-a="refill">心打光了 · 去补心</button>'}</div>` : ''}`;
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
		.to(['.top', '.dock', '#count', '#behind'], { opacity: 0, duration: 0.25 }, '<')
		.add(() => { play('stamp'); ['#inkC', '#inkC2'].forEach(c => { $(c).setAttribute('cx', sx / app.width * 390); $(c).setAttribute('cy', sy / app.height * 844); }); }, '-=.12')
		.to('#inkC', { attr: { r: 1000 }, duration: 0.5, ease: 'power2.in' }, '-=.12')
		.to('#inkC2', { attr: { r: 1000 }, duration: 0.45, ease: 'power2.in' }, '-=.16')
		.add(after)
		.set('#inkC,#inkC2', { attr: { r: 0 } });
}
function restoreMap() {
	gsap.set('#mapwrap', { scale: 1, opacity: 1 });
	gsap.to(['.top', '.dock', '#count'], { opacity: 1, duration: 0.3 });
	if (behindShown) gsap.to('#behind', { opacity: 1, duration: 0.3 });
}
function backToMap(then) {
	hide('#quiz'); hide('#boss'); hide('#pqEnd'); gsap.set('#stamp', { scale: 0, opacity: 0 });
	gsap.to(['#fail', '#bossLose'], { y: '140%', duration: 0.3 });
	stopAudio(); clearInterval(wordTimer); restoreMap();
	return refresh().then(() => { if (then) then(); }, () => {});
}
$('#go').onclick = () => {
	const tg = target(); if (!tg) return;
	if (tg.kind === 'boss') { if (!D.bossReady || tg.state === 'locked' || D.hearts <= 0) { play('fail', 0.6); bossSheet(); return; } }
	startLevel(tg.id);
};
let starting = false;
function startLevel(id, opt) {
	if (starting) return; starting = true;
	const n = NODE[id];
	api('lojo/quest/start', { levelId: id, retest: !!opt?.retest }).then(st => {
		D.hearts = st.hearts;
		AT = { ...st, node: n, i: 0, marks: [], end: null, practice: st.mode === 'practice' || st.mode === 'retest' };
		const visible = $('#quiz').style.display === 'flex' || $('#boss').style.display === 'flex';
		const open = () => { if (st.mode === 'boss') openBoss(); else openQuiz(); };
		if (visible) { gsap.to(['#fail', '#bossLose'], { y: '140%', duration: 0.3 }); hide('#pqEnd'); open(); } else zoomInto(n, open);
	}).catch(e => {
		if (e?.code === 'NO_HEARTS') { play('fail', 0.6); showEmpty($('#quiz').style.display === 'flex' ? 'fail' : 'out'); return; }
		if (e?.code === 'BOSS_NOT_READY') { play('fail', 0.6); backToMap(bossSheet); return; }
		if (e?.code === 'LEVEL_LOCKED' || e?.code === 'NOT_RETESTABLE') { play('fail', 0.6); toast(errText(e)); return; }
		if (isOffline(e)) { goOffline(); return; }
		toast(errText(e));
	}).finally(() => { starting = false; });
}

/* ================= 题：四种题型 + 听力 ================= */
const TYPE_ZH = { gap: '填空', choice: '选择', TFNG: '判断', build: '拼句' };
const SKILL_ZH = { listening: '听力', reading: '阅读', grammar: '语法', vocab: '词汇', mixed: '综合' };
const TFNG_OPTS = [{ key: 'TRUE', text: 'TRUE' }, { key: 'FALSE', text: 'FALSE' }, { key: 'NOT GIVEN', text: 'NOT GIVEN' }];
function limitText(l) {
	if (!l) return '';
	if (l.words && l.number) return `不超过 ${l.words} 个词，和/或一个数字`;
	if (l.words) return `不超过 ${l.words} 个词`;
	if (l.number) return '填一个数字';
	return '';
}
const nl = s => esc(s).replace(/\n/g, '<br>');
function paintQ(pre, q) {
	const P = s => $('#' + pre + s);
	P('Pass').textContent = q.passage ?? '';
	const head = pre === 'b' ? `第 ${AT.i + 1} 题 · 打掉 ${AT.hp ?? D.chapter.boss.hp} 格血就赢` : `第 ${AT.i + 1} / ${AT.total} 题 · 对 ${AT.need} 题过`;
	const lead = q.type === 'TFNG' ? '这句话跟原文对得上吗？' : q.type === 'build' ? '' : '';
	P('Stmt').innerHTML = `<small>${head} · ${TYPE_ZH[q.type] ?? ''}</small>${lead ? `<small style="margin-top:2px">${lead}</small>` : ''}${nl(q.question)}`;
	const box = P('Opts');
	if (q.type === 'choice' || q.type === 'TFNG') {
		const opts = q.options?.length ? q.options : TFNG_OPTS;
		const long = opts.some(o => String(o.text).length > 14);
		box.innerHTML = opts.map(o => `<button class="opt${long ? ' long' : ''}" data-k="${esc(o.key)}">${q.type === 'choice' ? `<b>${esc(o.key)}.</b> ` : ''}${esc(o.text)}</button>`).join('');
		box.querySelectorAll('.opt').forEach(b => { b.onclick = () => submitAnswer(pre, b.dataset.k, b); });
	} else if (q.type === 'gap') {
		box.innerHTML = `<div class="gapRow"><input class="gapIn" type="text" inputmode="text" enterkeyhint="done" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" maxlength="60" placeholder="在这里填" aria-label="填空">
			<div class="limit">${limitText(q.limit)}</div><button class="subBtn" disabled>交答案</button></div>`;
		const inp = box.querySelector('.gapIn'), btn = box.querySelector('.subBtn');
		inp.oninput = () => { btn.disabled = !inp.value.trim(); };
		inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) { e.preventDefault(); submitAnswer(pre, inp.value.trim(), inp); } };
		btn.onclick = () => { if (inp.value.trim()) submitAnswer(pre, inp.value.trim(), inp); };
	} else if (q.type === 'build') {
		const chips = q.chips ?? [];
		box.innerHTML = `<div class="gapRow"><div class="built" aria-live="polite"></div><div class="chips">${chips.map((c, i) => `<button class="chip2" data-i="${i}">${esc(c)}</button>`).join('')}</div><button class="subBtn" disabled>交答案</button></div>`;
		const built = box.querySelector('.built'), btn = box.querySelector('.subBtn');
		const sync = () => { btn.disabled = built.children.length !== chips.length; };
		box.querySelectorAll('.chips .chip2').forEach(c => {
			c.onclick = () => {
				if (c.classList.contains('used') || c.disabled) return;
				play('tap', 0.6); c.classList.add('used');
				const t = document.createElement('button'); t.className = 'chip2'; t.textContent = c.textContent; t.dataset.i = c.dataset.i;
				t.onclick = () => { if (t.disabled) return; play('tap', 0.4); c.classList.remove('used'); t.remove(); sync(); };
				built.appendChild(t); gsap.from(t, { scale: 0.7, duration: 0.25, ease: 'back.out(3)' }); sync();
			};
		});
		btn.onclick = () => { const v = [...built.children].map(x => x.textContent).join(' '); if (v) submitAnswer(pre, v, built); };
	}
	paintAudio(pre, q);
}

/* 听力：服务器现做录音（lines 按顺序播）；做不出来就给文字稿 */
const audioCache = {};
let audNow = null;
function stopAudio() { if (audNow) { audNow.stop = true; audNow.el?.pause(); audNow = null; } $$('.audBtn.on').forEach(b => b.classList.remove('on')); }
function paintAudio(pre, q) {
	const box = $('#' + pre + 'Aud');
	stopAudio(); box.innerHTML = '';
	if (!q.audio) return;
	box.innerHTML = '<button class="audBtn" disabled><span class="ic">▶</span>正在准备录音…</button>';
	const qid = q.id, at = AT.attemptId;
	const got = audioCache[qid] ?? (audioCache[qid] = api('lojo/quest/audio', { attemptId: at, qid }).catch(e => { delete audioCache[qid]; throw e; }));
	got.then(r => {
		if (!AT || AT.questions[AT.i]?.id !== qid) return;
		if (r?.skip) { skipQ(pre, q, r.skip.next); return; }
		if (!r?.lines?.length) { fallbackText(box, r?.fallback ?? [], q); return; }
		box.innerHTML = '<button class="audBtn"><span class="ic">▶</span>播放录音<small>可以多听几遍</small></button>';
		const b = box.querySelector('.audBtn');
		b.onclick = () => playLines(b, r.lines, r.rate ?? 1);
	}).catch(e => {
		if (!AT || AT.questions[AT.i]?.id !== qid) return;
		if (isOffline(e)) { box.innerHTML = '<div class="fallback"><div class="fh">断网了，录音放不出来</div>连上以后点这里再试。</div>'; box.querySelector('.fallback').onclick = () => paintAudio(pre, q); return; }
		fallbackText(box, e?.fallback ?? [], q, () => paintAudio(pre, q));
	});
}
function fallbackText(box, lines, q, retry) {
	// 填空题不给文字稿（答案就在里面）；服务器那边会换题，这里只在连不上服务器时出现：点了再试
	if (q?.type === 'gap' || !lines.length) {
		box.innerHTML = `<div class="fallback"><div class="fh">录音暂时出不来</div>${retry ? '点这里再试一次。' : '这题先按题面作答。'}</div>`;
		if (retry) box.querySelector('.fallback').onclick = retry;
		return;
	}
	box.innerHTML = `<div class="fallback"><div class="fh">录音暂时出不来，先看文字</div>${lines.map(l => `<p>${l.who ? `<b>${esc(l.who)}</b>` : ''}${esc(l.text)}</p>`).join('')}</div>`;
}
// 填空题的录音出不来：这题跳过（服务器已换成同一关另一道题，不记对错、不扣心）。连着跳 3 道还是出不来，这关先停
function skipQ(pre, q, next) {
	const box = $('#' + pre + 'Aud');
	AT.skips = (AT.skips ?? 0) + 1;
	const stop = !next || AT.skips >= 3;
	lockQ(pre, true);
	$('#' + pre + 'Opts').style.display = 'none';
	box.innerHTML = `<div class="skipCard"><div class="fh">录音暂时出不来 · 这题先跳过，不扣心</div>` +
		(stop ? '<p>录音这会儿一直出不来，这关先停在这儿，心和进度都没动。过一会儿再来。</p><button class="btn2 coral">回地图</button>'
			: '<p>听力题要听着做才算数，换一道给你。</p><button class="btn2 coral">换下一题</button>') + '</div>';
	gsap.from(box.firstChild, { y: 12, opacity: 0, duration: 0.3, ease: 'back.out(1.6)' });
	box.querySelector('button').onclick = () => {
		play('tap');
		$('#' + pre + 'Opts').style.display = '';
		if (stop) { backToMap(); return; }
		AT.questions[AT.i] = next;
		if (pre === 'b') showBQ(false); else showQ(false);
	};
}
function playLines(btn, lines, rate) {
	stopAudio();
	const run = { stop: false, el: null }; audNow = run;
	btn.classList.add('on'); btn.querySelector('.ic').textContent = '♪';
	let k = 0;
	const next = () => {
		if (run.stop) return;
		if (k >= lines.length) { btn.classList.remove('on'); btn.querySelector('.ic').textContent = '↻'; btn.childNodes[1].textContent = '再听一遍'; audNow = null; return; }
		const a = new Audio(lines[k++].url); a.playbackRate = rate; a.preservesPitch = true; run.el = a;
		a.onended = next; a.onerror = next;
		a.play().catch(() => { btn.classList.remove('on'); btn.querySelector('.ic').textContent = '▶'; audNow = null; toast('点一下再播放'); });
	};
	next();
}

/* 交答案：选择 / 判断 / 填空 / 拼句 共用 */
let answering = false, pending = null;
function lockQ(pre, on) { $('#' + pre + 'Opts').querySelectorAll('button,input').forEach(b => { b.disabled = on; }); }
function submitAnswer(pre, value, el) {
	if (answering || !AT || AT.end || AT.marks[AT.i] !== undefined) return;
	const q = AT.questions[AT.i]; if (!q) return; answering = true;
	lockQ(pre, true);
	api('lojo/quest/answer', { attemptId: AT.attemptId, qid: q.id, answer: value }).then(r => {
		pending = null; okOnline();
		AT.marks[AT.i] = r.correct; AT.end = r.end; D.hearts = r.hearts;
		if (pre === 'b') bossJudged(r, el, q); else quizJudged(r, el, q);
	}).catch(e => {
		if (isOffline(e)) { pending = { pre, value, el }; goOffline(); return; }
		lockQ(pre, false);
		toast(errText(e));
		if (e?.code === 'NO_SUCH_ATTEMPT' || e?.code === 'WRONG_QUESTION') backToMap();
	}).finally(() => { answering = false; });
}
function markEl(el, ok) {
	if (!el) return;
	el.classList.add(ok ? 'ok' : 'no');
	if (!ok) gsap.fromTo(el, { x: 0 }, { x: 8, duration: 0.06, repeat: 5, yoyo: true, ease: 'none', clearProps: 'x' });
}
function explain(r, rightWord) {
	return (r.correct ? `<b>${rightWord}</b>` : `<b>答案是 ${esc(r.answer)}。</b>`) + esc(r.why ?? '') + (r.evidence ? `<div class="evid">${esc(r.evidence)}</div>` : '');
}
function quizJudged(r, el, q) {
	markEl(el, r.correct);
	if (r.correct) { play('tap'); tune([660, 880], 'triangle', 0.07, 0.2, 0.08); } else {
		play('fail');
		if (q.type === 'choice' || q.type === 'TFNG') $$('#qOpts .opt').find(b => r.answer === b.dataset.k || r.answer.startsWith(b.dataset.k + '.'))?.classList.add('ok');
	}
	if (r.heartLost) setTimeout(() => loseHeart('#qHearts', r.hearts), 250);
	const d = $$('#qDots i')[AT.i]; if (d) { d.className = r.correct ? 'ok' : 'no'; d.textContent = r.correct ? '✓' : '✕'; gsap.from(d, { scale: 1.8, duration: 0.35, ease: 'back.out(3)' }); }
	gsap.to('#qbar', { width: `${Math.round(r.progress.answered / r.progress.total * 100)}%`, duration: 0.4 });
	const ex = $('#qEx'); ex.className = 'qex' + (r.correct ? '' : ' bad');
	$('#qExT').innerHTML = explain(r, '对了。') +
		(!r.correct && AT.practice ? `<br>${AT.mode === 'retest' ? '回测' : '练手关'}，不扣心。` : '') + (r.heartLost ? `<br>扣 1 颗心，还剩 ${r.hearts} 颗。` : '');
	$('#qNext').textContent = r.end ? '看结果' : '下一题';
	show(ex, 'block'); gsap.from(ex, { y: 12, opacity: 0, duration: 0.3 });
	setTimeout(() => ex.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' }), 50);
}

/* ================= 题关 ================= */
const quiz = $('#quiz');
function openQuiz() {
	hide('#boss'); hide('#pqEnd'); show(quiz); quiz.scrollTop = 0;
	const n = AT.node;
	const free = AT.mode === 'retest' ? '<span class="free">回测 · 不扣心</span>' : AT.practice ? '<span class="free">练手 · 不扣心</span>' : '<span class="warn">答错扣 1 颗心</span>';
	const skills = [...new Set(AT.questions.map(q => q.skill).filter(Boolean))].map(s => SKILL_ZH[s] ?? s);
	$('#qTag').innerHTML = `<span>${esc(n.label)} · ${esc(n.name ?? n.zh ?? '')}</span>${free}` + (skills.length ? `<span class="skill">${esc(skills.join(' · '))}</span>` : '');
	$('#qHint').innerHTML = AT.hint ? md(AT.hint) : ''; $('#qHint').style.display = AT.hint ? '' : 'none';
	$('#qDots').innerHTML = AT.questions.map(() => '<i></i>').join('');
	drawHearts(D.hearts);
	gsap.set('#qbar', { width: '0%' });
	showQ(true);
}
function showQ(first) {
	$$('#qDots i').forEach((d, i) => { d.className = AT.marks[i] === true ? 'ok' : AT.marks[i] === false ? 'no' : i === AT.i ? 'cur' : ''; d.textContent = AT.marks[i] === true ? '✓' : AT.marks[i] === false ? '✕' : ''; });
	paintQ('q', AT.questions[AT.i]);
	hide('#qEx');
	gsap.from(first ? '#quiz > *:not(.qex):not(#pqEnd)' : '#qAud,#qPass,#qStmt,#qOpts', { y: first ? 30 : 16, opacity: 0, stagger: 0.05, duration: 0.3, ease: 'back.out(1.6)' });
	const inp = $('#qOpts .gapIn'); if (inp && !first) setTimeout(() => inp.focus({ preventScroll: true }), 320);
}
$('#qNext').onclick = () => {
	if (!AT || AT.marks[AT.i] === undefined) return; // 这题还没判完
	play('tap'); stopAudio();
	if (AT.end) { if (!AT.ended) { AT.ended = true; endLevel(AT.end); } return; }
	if (AT.i + 1 >= AT.questions.length) return;
	AT.i++; showQ(false);
};
$('#qBack').onclick = () => { play('tap'); backToMap(); };

/* 结果里的逐题回顾：错题在前，超过 2 条先折起来 */
function reviewHtml(end) {
	const rows = end.review.map(r => `<div class="${r.correct ? '' : 'no'}"><i>${r.correct ? '✓' : '✕'}</i><span>第 ${r.n} 题${r.correct ? `：${esc(r.answer)}` : `：你填 ${esc(r.given || '（空）')}，答案 <b>${esc(r.answer)}</b>`}。${esc(r.why ?? '')}${!r.correct && r.evidence ? `<span class="evid" style="display:block">${esc(r.evidence)}</span>` : ''}</span></div>`);
	const wrong = end.review.map((r, i) => (r.correct ? -1 : i)).filter(i => i >= 0);
	const right = end.review.map((r, i) => (r.correct ? i : -1)).filter(i => i >= 0);
	const order = [...wrong, ...right];
	const fold = wrong.length > 2;
	return order.map((i, k) => (fold && k >= 2 ? rows[i].replace('<div class="', '<div data-more style="display:none" class="') : rows[i])).join('') +
		(fold ? `<button class="more" data-more-btn>还有 ${order.length - 2} 题 · 展开</button>` : '');
}
document.addEventListener('click', e => {
	const b = e.target.closest?.('[data-more-btn]'); if (!b) return;
	play('tap', 0.5); b.parentElement.querySelectorAll('[data-more]').forEach(x => { x.style.display = ''; }); b.remove();
});
function endLevel(end) {
	if (AT.mode === 'retest' || (AT.mode === 'practice' && end.passed)) { practiceEnd(end); return; }
	if (end.passed) passFlow(end); else failFlow(end);
}

/* 练手关 / 回测 的结果：小章 + 一行字，不开宝箱 */
function practiceEnd(end) {
	const lab = esc(AT.node.label), retest = AT.mode === 'retest';
	const passed = retest ? end.passed : true;
	$('#pqStamp').className = 'pqStamp' + (retest && passed ? ' coral' : '');
	$('#pqStamp').firstChild.textContent = retest ? (passed ? '亮' : '再') : '过';
	$('#pqStamp small').textContent = retest ? '回测' : '练手关';
	$('#pqEndH').textContent = retest ? (passed ? `${AT.node.label} 重新点亮` : '还差一点') : '练手关过了';
	$('#pqEndS').innerHTML = retest
		? (passed ? `对 ${end.right} / ${end.total} · 这关不再褪色，7 天后再回测` : `对 ${end.right} / ${end.total} · 要对 ${end.need} 题才亮。没扣心，明天再测`)
		: `对 ${end.right} / ${end.total} · 练手关，答错不扣心`;
	$('#pqXp').textContent = end.xp ? `+${end.xp} 经验` : '';
	gsap.to('#qbar', { width: '100%', duration: 0.4 });
	show('#pqEnd');
	gsap.from('#pqEnd .ovcard', { scale: 0.7, opacity: 0, duration: 0.35, ease: 'back.out(2)' });
	gsap.fromTo('#pqStamp', { scale: 2.2, opacity: 0, rotation: -30 }, { scale: 1, opacity: 1, rotation: -12, duration: 0.35, ease: 'back.out(3)', delay: 0.15 });
	setTimeout(() => { play(passed ? 'stamp' : 'fail', passed ? 1 : 0.5); if (passed) tune([523, 659, 784], 'triangle', 0.09, 0.3, 0.1); }, 180);
	$('#pqDone').onclick = () => {
		play('tap');
		backToMap(() => {
			flameThenFreeze(end.streak, null, () => miaSay(retest ? (passed ? `${lab} 又亮了。` : `${lab} 明天再测一次，不扣心。`) : `${lab} 热身完了。下一步，看图钉。`));
		});
	};
	void lab;
}

/* 过关：盖章（整页最上层）→ 宝箱 → 回地图 → 火苗 → 冻结卡 */
function passFlow(end) {
	$('#stamp small').textContent = `${AT.node.label} · 经验 +${end.xp}`;
	gsap.to('#qbar', { width: '100%', duration: 0.5, ease: 'power2.out' });
	const loot = end.chest || end.sideChest;
	gsap.timeline({ delay: 0.15 })
		.add(() => { play('stamp'); setTimeout(() => { play('pass'); tune([523, 659, 784, 1046], 'triangle', 0.09, 0.35, 0.13); }, 120); })
		.fromTo('#stamp', { scale: 2.4, opacity: 0, rotation: -30 }, { scale: 1, opacity: 1, rotation: -14, duration: 0.28, ease: 'back.out(3)' })
		.to('#quiz', { x: 4, duration: 0.04, repeat: 5, yoyo: true, clearProps: 'x' }, '<.05')
		.to({}, { duration: 0.9 })
		.add(() => (loot ? openChest(end, () => afterPass(end)) : afterPass(end)))
		.to('#stamp', { opacity: 0, duration: 0.3 }, '+=.25');
}
function openChest(end, done) {
	const ov = $('#chestOv'); show(ov);
	const c = end.chest, sc = end.sideChest;
	const pv = c?.preview && bookBySlug(c.preview);
	$('#chestOv h4').textContent = c ? '今日首胜宝箱' : '支线宝箱';
	$('#chestOv .sub').textContent = c ? '每天第一次过关，开一个' : '第一次打通这条支线';
	$('#loot').innerHTML = (c ? `<div><span class="big">+${c.xp}</span>经验 · 今天第一次过关</div>` : '') +
		(sc ? `<div><span class="big">+${sc.xp}</span>经验 · 支线打通</div>` : '') +
		((c?.freeze || sc?.freeze) ? '<div><span class="big">❄</span>1 张冻结卡（漏一天自动用掉，连胜不断）</div>' : '') +
		(pv ? `<div><span class="big">📕</span>锦囊预览：${pv.no} 号「${esc(pv.spine)}」，书屋里亮着</div>` : '');
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
	const id = AT.node.id, lab = AT.node.label;
	backToMap(() => {
		gsap.set('#stamp', { scale: 0, opacity: 0 });
		const g = $(`#nd-${id} .ndi`); if (g) { play('stamp'); gsap.from(g, { scale: 2.2, transformOrigin: '50% 50%', duration: 0.4, ease: 'back.out(3)' }); }
		if ($$('.inkE').length) gsap.from('.inkE', { opacity: 0, duration: 0.4 });
		setTimeout(() => flameThenFreeze(end.streak, end.chest?.freeze, () => miaSay(end.firstPass ? `${esc(lab)} 过了！经验 +${end.xp}。下一步，看图钉。` : `又过了一次，经验 +${end.xp}。`)), 700);
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

/* 没过：错在哪 + 一个主按钮（Mia 推荐的锦囊）+ 两个线框 + 两个小链接 */
function failFlow(end) {
	const n = AT.node, out = !n.practice && (end.outOfHearts || D.hearts <= 0);
	$('#failH').textContent = out ? '心打光了，这关没过' : '这关没过';
	$('#failP').innerHTML = `对 <b>${end.right}</b> 题，要对 ${end.need} 题才过。心还剩 <b>${D.hearts}</b> 颗。` +
		(end.failStreak >= 2 ? `<br>这关连着没过 ${end.failStreak} 次了，先别急着重打。` : '');
	$('#failReview').innerHTML = reviewHtml(end);
	const rec = end.recommended;
	$('#failMia').style.display = D.tutorId ? '' : 'none';
	$('#failShelf').innerHTML = rec ? `去书屋<small>Mia 推荐 ${rec.no} 号「${esc(rec.spine)}」</small>` : '去书屋<small>挑一本锦囊读完再打</small>';
	$('#failShelf').classList.add('rec');
	const g = n.gear;
	const sub = n.practice ? `${esc(g?.zh ?? '听写')} · 练一组手感更稳`
		: D.hearts >= MAXH() ? '先练一组再回来'
			: g && !g.givesHeart ? `${esc(g.zh)} · 只算备战，不补心`
				: D.refilledToday.gear ? `${esc(g?.zh ?? '听写')} · 今天这条路补过心了` : `${esc(g?.zh ?? '听写')} · 练完补 1 颗心`;
	$('#failGear').innerHTML = `去装备练一组<small>${sub}</small>`;
	$('#failRetry').textContent = out ? '先补心' : '再打一次';
	$('#failMap').textContent = '回地图';
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
$('#failGear').onclick = () => { play('whoosh', 0.6); gearGo(AT?.node?.gear?.path ?? '/dictation', AT?.node?.id); };
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
	const n = AT.node, hp = AT.hp ?? D.chapter.boss.hp;
	$('#bhp').innerHTML = [...Array(hp)].map(() => '<i></i>').join('');
	$('#bName').textContent = n.name ?? 'Boss';
	$('#bRule').textContent = `打掉 ${hp} 格血就赢 · 错 ${AT.maxWrong} 题就输 · 答错扣 1 颗心`;
	drawHearts(D.hearts);
	showBQ(true);
	gsap.from('#bossFig', { y: -40, scale: 0.6, duration: 0.6, ease: 'bounce.out' });
	play('bosshit', 0.5);
	clearInterval(wordTimer);
	if (!RM) wordTimer = setInterval(() => gsap.to('#bossCard', { scaleX: 0, transformOrigin: '75px 78px', duration: 0.15, yoyo: true, repeat: 1, onRepeat: () => { wi = (wi + 1) % WORDS.length; $('#bossWord').textContent = WORDS[wi]; } }), 1300);
}
function showBQ(first) {
	paintQ('b', AT.questions[AT.i]);
	hide('#bEx');
	gsap.from(first ? '#boss .bname,#boss .brule,#bAud,#bPass,#bStmt,#bOpts' : '#bAud,#bPass,#bStmt,#bOpts', { y: 20, opacity: 0, stagger: 0.05, duration: 0.3 });
}
function bossJudged(r, el, q) {
	markEl(el, r.correct);
	if (r.correct) {
		play('pass', 0.7);
		const segs = $$('#bhp i'); segs.forEach((s, i) => { s.className = i >= segs.length - r.progress.right ? 'gone' : ''; });
		gsap.fromTo('#bossBody', { x: -10 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,.3)' });
	} else {
		play('bosshit');
		if (q.type === 'choice' || q.type === 'TFNG') $$('#bOpts .opt').find(b => r.answer === b.dataset.k || r.answer.startsWith(b.dataset.k + '.'))?.classList.add('ok');
		gsap.fromTo('#boss', { x: 0 }, { x: 9, duration: 0.05, repeat: 7, yoyo: true, ease: 'none', clearProps: 'x' });
		gsap.fromTo('#bossBody', { scale: 1 }, { scale: 1.12, transformOrigin: '75px 140px', duration: 0.15, yoyo: true, repeat: 3 });
		if (r.heartLost) {
			const d = document.createElement('div'); d.className = 'dmg'; d.textContent = '−1 ❤'; const br = (el ?? $('#bOpts')).getBoundingClientRect(), ar = AR();
			$('#app').appendChild(d); gsap.fromTo(d, { left: br.right - ar.left - 80, top: br.top - ar.top - 10, opacity: 1 }, { top: '-=50', opacity: 0, duration: 0.9, onComplete: () => d.remove() });
			setTimeout(() => loseHeart('#bHearts', r.hearts), 150);
		}
	}
	const ex = $('#bEx'); ex.className = 'qex' + (r.correct ? '' : ' bad');
	$('#bExT').innerHTML = explain(r, '打中了！');
	$('#bNext').textContent = r.end ? '看结果' : '下一题';
	show(ex, 'block'); gsap.from(ex, { y: 12, opacity: 0, duration: 0.3 });
	setTimeout(() => ex.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' }), 50);
}
$('#bNext').onclick = () => {
	if (!AT || AT.marks[AT.i] === undefined) return;
	play('tap'); stopAudio();
	if (AT.end) { if (!AT.ended) { AT.ended = true; if (AT.end.passed) bossWin(AT.end); else bossLose(AT.end); } return; }
	if (AT.i + 1 >= AT.questions.length) return;
	AT.i++; showBQ(false);
};
$('#bBack').onclick = () => { play('tap'); backToMap(); };
function confetti() {
	if (RM) return;
	const a = AR(), colors = ['#E8603F', '#ECB637', '#3E9E7A', '#2340A3', '#FFFDF8'];
	for (let i = 0; i < 60; i++) {
		const c = document.createElement('div'); c.className = 'confetti'; c.style.background = colors[i % colors.length]; $('#app').appendChild(c);
		gsap.set(c, { left: a.width / 2, top: a.height * 0.38, rotation: Math.random() * 360 });
		gsap.to(c, { x: (Math.random() - 0.5) * a.width * 1.1, y: (Math.random() - 0.2) * a.height * 0.9, rotation: '+=' + (Math.random() * 720 - 360), opacity: 0, duration: 1.4 + Math.random() * 0.9, ease: 'power2.out', onComplete: () => c.remove() });
	}
}
const BADGE_ZH = { 'ielts-c1': '第一章打通' };
function bossWin(end) {
	clearInterval(wordTimer);
	gsap.to('#bossBody', { y: 60, rotation: 25, opacity: 0, transformOrigin: '75px 140px', duration: 0.6, ease: 'power2.in' });
	play('milestone'); setTimeout(() => tune([523, 659, 784, 1046, 1318], 'triangle', 0.1, 0.4, 0.13), 200);
	const ov = $('#winOv'); show(ov);
	$('#winSub').textContent = end.firstPass ? '第一章的门开了。第二章还在画，画好了第一时间叫你。' : '又赢了一次，手感还在。';
	$('#winLoot').innerHTML = `<div><span class="big">+${end.xp}</span>经验${end.chest ? '（含今日首胜宝箱）' : ''}</div>` +
		(end.badge ? `<div><span class="big">🏅</span>徽章「${esc(BADGE_ZH[end.badge] ?? end.badge)}」，挂在你的主页上</div>` : '') +
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
		$('#bossRetry').textContent = end.prepReset ? '回地图重新备战' : D.hearts > 0 ? '再打一次' : '心打光了 · 去补心';
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
const BOOK_TOP = 112;
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
$('#toGuides').onclick = () => { play('whoosh', 0.6); go('/guides'); };
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
	p.innerHTML = items.length
		? `<h4>背包 · ${items.length} / 3</h4><p>最多装 3 本，新的进来，最早的那本放回书架。</p>` + items.map(b => `<div class="bagItem"><i style="background:${esc(b.color)}"></i>${b.no} 号 · ${esc(b.title)}</div>`).join('') + '<button class="btn2" id="bagClose">收起</button>'
		: '<svg class="bagEmptyIc" viewBox="0 0 70 70"><path d="M24 16 q0 -12 11 -12 q11 0 11 12" fill="none" stroke="#a99e88" stroke-width="3.5" stroke-linecap="round"/><path d="M10 22 q0 -6 6 -6 h38 q6 0 6 6 v34 q0 10 -10 10 h-30 q-10 0 -10 -10z" fill="#F6F1E7" stroke="#a99e88" stroke-width="2.5" stroke-dasharray="4 4"/></svg>' +
			'<h4 style="text-align:center">背包还是空的</h4><p style="text-align:center">关卡没过时，走进书屋挑一本锦囊，<br>放进背包，就能带进关卡里随时翻。</p><button class="btn2" id="bagClose">知道了</button>';
	show(p, 'block'); gsap.fromTo(p, { y: 240 }, { y: 0, duration: 0.45, ease: 'back.out(1.5)' });
	gsap.from('#bagPanel > *', { y: 12, opacity: 0, stagger: 0.05, delay: 0.12, duration: 0.25 });
	$('#bagClose').onclick = () => { play('tap', 0.6); gsap.to(p, { y: 260, duration: 0.3, ease: 'power2.in', onComplete: () => hide(p) }); };
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
	const sn = $('#streakNote'); sn.classList.toggle('hide', !!D.streak.doneToday || n >= max); sn.classList.remove('lit');
	sn.innerHTML = `今天还没练：<b>补 1 颗心也算今天练过</b>，火苗${D.streak.days ? ` ${D.streak.days} 天` : ''}就续上`;
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
	play('whoosh', 0.6); gearGo(refillGear().path, D.lastFail?.levelId ?? null);
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

/* ================= 第一次进来：3 步引导 ================= */
function rel(el) { const a = AR(), r = el.getBoundingClientRect(); return { x: r.left - a.left, y: r.top - a.top, w: r.width, h: r.height }; }
const COACH = [
	{ el: () => $('#mapwrap'), pad: -6, t: '我是 <b>Mia</b>，你的向导。这是你的雅思地图：从<b>起点</b>一关一关往上走，右上角那座房子是<b>考场</b>。' },
	{ el: () => [$('#streakChip'), $('#heartChip')], pad: 5, t: '<b>火苗</b>是连胜，每天打一关就续上；漏一天会断。<b>心</b>每天 5 颗，正式关答错扣 1 颗。' },
	{ el: () => $('#count'), pad: 6, t: '最后一件：<b>哪天考雅思？</b>定了日子，这行就开始倒数；走慢了我会提醒你。', exam: true },
];
let ci = 0;
function coachStep(i) {
	ci = i; const s = COACH[i], rs = [].concat(s.el()).map(rel);
	const x = Math.min(...rs.map(r => r.x)) - s.pad, y = Math.min(...rs.map(r => r.y)) - s.pad;
	const x2 = Math.max(...rs.map(r => r.x + r.w)) + s.pad, y2 = Math.max(...rs.map(r => r.y + r.h)) + s.pad;
	$('#coachT').innerHTML = s.t; $$('#coachCard .dots i').forEach((d, j) => { d.className = j === i ? 'on' : ''; });
	$('#coachX').innerHTML = s.exam ? examHTML(D.examDate) : '';
	if (s.exam) wireExam($('#coachX'), $('#coachNext'));
	$('#coachNext').textContent = i < 2 ? '下一步' : '就这天'; $('#coachNext').disabled = !!s.exam && !D.examDate;
	$('#coachSkip').textContent = i < 2 ? '跳过' : '还没定，跳过';
	const card = $('#coachCard'); card.style.top = '0px'; const ch = card.offsetHeight, H = AR().height;
	const top = (H - y2 > ch + 24) ? y2 + 14 : Math.max(10, y - ch - 14);
	const box = { left: x, top: y, width: x2 - x, height: y2 - y };
	if (i === 0) gsap.set('#coachHole', box); else gsap.to('#coachHole', { ...box, duration: 0.45, ease: 'power3.inOut' });
	gsap.fromTo(card, { top: top + 16, opacity: 0 }, { top, opacity: 1, duration: 0.35, delay: i ? 0.25 : 0, ease: 'back.out(1.6)' });
	play('page', 0.8);
}
function startCoach() { const c = $('#coach'); show(c, 'block'); gsap.fromTo(c, { opacity: 0 }, { opacity: 1, duration: 0.3 }); coachStep(0); }
function endCoach(examDate, skippedDate) {
	gsap.to('#coach', { opacity: 0, duration: 0.25, onComplete: () => { hide('#coach'); $('#coach').style.opacity = 1; } });
	const p = { onboarded: true }; if (examDate) p.examDate = examDate;
	api('lojo/quest/settings', p).then(r => {
		D = r; render(); if (examDate) rollDays();
		afterCoach(!!examDate, skippedDate);
	}).catch(e => { toast(errText(e)); afterCoach(false, skippedDate); });
}
$('#coachNext').onclick = () => {
	if (ci < 2) { play('tap'); coachStep(ci + 1); return; }
	play('tap'); endCoach($('#coachX input')?.value || null, false);
};
$('#coachSkip').onclick = () => { play('tap'); endCoach(null, ci === 2); };
function afterCoach(dated, skippedDate) {
	const p = target(), lab = p ? esc(p.label) : '1-1';
	miaSay(dated ? `日子记下了。前 3 关是<b>练手关</b>，答错不扣心。现在打 <b>${lab}</b>，点亮第一天火苗。`
		: skippedDate ? `没事，想好了点上面的「<b>设考试日期</b>」。先打 <b>${lab} 练手关</b>，错了不扣心。`
			: `先打 <b>${lab} 练手关</b>，3 道题热身，错了不扣心。`);
	gsap.fromTo('#go', { scale: 1 }, { scale: 1.06, duration: 0.35, yoyo: true, repeat: 3, ease: 'sine.inOut', delay: 0.6 });
}

/* ================= 考试日期：引导第 3 步和改日期抽屉共用 ================= */
const DAY = 864e5, WK = '日一二三四五六';
const dayD = v => new Date(v + 'T00:00:00');
const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const todayStr = () => D?.day ?? ymd(new Date());
const daysTo = v => Math.round((dayD(v) - dayD(todayStr())) / DAY);
function examHTML(cur) {
	const t = dayD(todayStr()).getTime(), min = ymd(new Date(t + DAY)), max = ymd(new Date(t + 730 * DAY));
	return `<div class="exam"><label class="ticket"><span class="tk">考试<br>日期</span><span class="tv">${cur ? `<b>${esc(cur)}</b><small>周${WK[dayD(cur).getDay()]}</small>` : '<b class="ph">点这里选一天</b><small>准考证上那天，大概的也行</small>'}</span><span class="tc">${cur ? '改' : '选'} ›</span>
		<input type="date" min="${min}" max="${max}" value="${esc(cur ?? '')}" aria-label="考试日期"></label>
		<div class="pv">${cur ? `离考场 <b>${daysTo(cur)}</b> 天。` : '&nbsp;'}</div></div>`;
}
function wireExam(box, btn) {
	const inp = box.querySelector('input'), pv = box.querySelector('.pv'), tv = box.querySelector('.tv'), tc = box.querySelector('.tc');
	inp.onchange = () => {
		const v = inp.value; if (!v) { btn.disabled = true; return; }
		const n = daysTo(v);
		if (n < 1 || n > 730) { pv.className = 'pv err'; pv.textContent = n < 1 ? '要选明天以后的日子。' : '只能选两年以内的日子。'; btn.disabled = true; play('fail', 0.5); return; }
		pv.className = 'pv'; tv.innerHTML = `<b>${esc(v)}</b><small>周${WK[dayD(v).getDay()]}</small>`; tc.textContent = '改 ›';
		pv.innerHTML = `离考场 <b>${n}</b> 天。${n < 30 ? '时间紧，先打主线，支线有空再说。' : '够一章一章打过去。'}`;
		gsap.fromTo(pv.querySelector('b'), { scale: 1.7 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,.35)', transformOrigin: '50% 70%' });
		gsap.fromTo(box.querySelector('.ticket'), { rotation: -1.5 }, { rotation: 0, duration: 0.4, ease: 'back.out(3)' });
		play('tick'); btn.disabled = false;
	};
}
function rollDays() {
	const el = $('#days'); if (!el) return;
	const n = D.daysLeft ?? 0, o = { v: 0 }; play('scratch', 0.8);
	gsap.to(o, { v: n, duration: 0.8, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); }, onComplete: () => { play('stamp', 0.6); bounce(el); } });
}
function saveExam(v) {
	return api('lojo/quest/settings', { examDate: v }).then(r => {
		D = r; render();
		if (v) { rollDays(); toast(`考试日期 ${v} · 离考场 ${D.daysLeft ?? daysTo(v)} 天`, 1800); maybeBehind(true); } else toast('日期清掉了 · 倒数和落后提醒先关了', 2000);
	}).catch(e => toast(errText(e)));
}
function openExamSheet() {
	if (!D) return; play('tap');
	const cur = D.examDate;
	openSheet(`<h4>${cur ? '改考试日期' : '哪天考雅思？'}</h4><div class="sub">${cur ? '改了以后倒数天数和落后提醒跟着变。' : '定了日子，地图上会倒数，走慢了 Mia 会提醒你。'}</div>${examHTML(cur)}
		<button class="sbtn" id="exOk"${cur ? '' : ' disabled'}>就这天</button>
		<div class="exLinks">${cur ? '<button class="clr" id="exClr">清掉日期</button>' : '<span></span>'}<button id="exLater">${cur ? '不改了' : '还没定，先不填'}</button></div>`, b => {
		const box = b.querySelector('.exam'), ok = b.querySelector('#exOk');
		wireExam(box, ok);
		ok.onclick = () => { const v = box.querySelector('input').value; if (!v) return; closeSheet(true); setTimeout(() => saveExam(v), 280); };
		b.querySelector('#exLater').onclick = () => closeSheet();
		const clr = b.querySelector('#exClr');
		if (clr) clr.onclick = () => {
			if (!clr.dataset.sure) { clr.dataset.sure = '1'; clr.textContent = '再点一下确认清掉'; play('warn', 0.7); return; }
			closeSheet(true); setTimeout(() => saveExam(null), 280);
		};
	});
}

/* ================= 漏了一天：冻结卡自动用掉 / 连胜断了（服务器只通知一次） ================= */
function weekHTML(lost, used) {
	const t = dayD(todayStr()).getTime();
	return [...Array(7)].map((_, i) => {
		const back = 6 - i, d = new Date(t - back * DAY);
		const missed = back >= 1 && back <= Math.max(1, used || 1);
		const cls = back === 0 ? 'today' : missed ? (lost ? 'broke' : 'miss') : 'on';
		return `<div class="wd ${cls}" data-back="${back}"><i>${back === 0 ? '今天' : missed ? '?' : '🔥'}</i>${back === 0 ? '今' : '周' + WK[d.getDay()]}</div>`;
	}).join('');
}
function fuOpen(lost, h, sub, ok, used) {
	const ov = $('#fuOv'); ov.className = 'overlay' + (lost ? ' lost' : ''); show(ov);
	$('#week').innerHTML = weekHTML(lost, used);
	$('#fuH').textContent = h; $('#fuSub').textContent = sub; $('#fuTxt').innerHTML = '&nbsp;'; $('#fuOk').textContent = ok;
	return gsap.timeline().from('#fuOv .ovcard', { scale: 0.6, opacity: 0, duration: 0.35, ease: 'back.out(2)' })
		.from('#week .wd', { y: 16, opacity: 0, stagger: 0.06, duration: 0.25, ease: 'back.out(2)' });
}
function showFreezeUse(used) {
	used = Math.max(1, used || 1);
	const missed = $$('#week .wd'); void missed;
	fuOpen(false, used > 1 ? `漏了 ${used} 天` : '昨天漏了一天', '你有冻结卡，它自动顶上了', '好，今天接着打', used)
		.add(() => play('warn', 0.7))
		.to('#week .wd.miss i', { x: 4, duration: 0.05, repeat: 7, yoyo: true, ease: 'none' })
		.add(() => {
			const slots = $$('#week .wd.miss');
			slots.forEach((w, k) => setTimeout(() => {
				const from = rel($('#frzChip')), to = rel(w.querySelector('i'));
				const f = document.createElement('div'); f.className = 'flyIce';
				f.innerHTML = '<svg viewBox="0 0 30 38" width="30" height="38"><rect x="1" y="1" width="28" height="36" rx="7" fill="#E3F0FA" stroke="#2B6FA3" stroke-width="2"/><g stroke="#2B6FA3" stroke-width="2.4" stroke-linecap="round"><path d="M15 9v20M7 14l16 10M7 24l16-10"/></g></svg>';
				$('#app').appendChild(f); gsap.set(f, { left: from.x + from.w / 2 - 15, top: from.y + from.h / 2 - 19, scale: 0.5 });
				gsap.fromTo('#frzChip', { scale: 1.4 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,.35)' }); play('freezeuse');
				gsap.timeline().to(f, { scale: 1.5, rotation: -12, duration: 0.25, ease: 'back.out(3)' })
					.to(f, { left: to.x, top: to.y - 60, duration: 0.35, ease: 'power2.out' })
					.to(f, { top: to.y, rotation: 0, scale: 1, duration: 0.22, ease: 'power3.in' })
					.add(() => {
						f.remove(); w.className = 'wd ice'; w.querySelector('i').textContent = '❄'; play('freeze', 0.7);
						gsap.fromTo(w.querySelector('i'), { scale: 1.6 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,.3)' });
						if (k === slots.length - 1) {
							$('#fuTxt').innerHTML = `冻结卡替你守住了连胜 · 还是 <b>${D.streak.days}</b> 天<br>冻结卡剩 <b>${D.streak.freezes} / 2</b>。今天打 1 关，火苗接着烧。`;
							gsap.from('#fuTxt,#fuOk', { y: 10, opacity: 0, stagger: 0.08, duration: 0.3 });
						}
					});
			}, k * 500));
		}, '+=.1');
	fuAfter = `冻结卡顶住了，连胜还是 <b>${D.streak.days}</b> 天。今天打 1 关就续上。`;
}
function showStreakLost(days, best) {
	const was = days ?? 0;
	fuOpen(true, '连胜断了', '昨天没打，也没有冻结卡', '今天重新点火', 1)
		.to('#week .wd.broke i', { x: 4, duration: 0.05, repeat: 7, yoyo: true, ease: 'none' })
		.add(() => { $$('#week .wd.broke i').forEach(i => { i.textContent = '✕'; }); play('lose'); })
		.add(() => $$('#week .wd.on').reverse().forEach((w, j) => setTimeout(() => { w.classList.add('out'); play('tick', 0.4); }, j * 110)), '+=.1')
		.add(() => {
			const o = { v: was };
			gsap.to(o, { v: 0, duration: 0.8, ease: 'power2.in', onUpdate: () => { $('#streakN').textContent = Math.round(o.v); },
				onComplete: () => { $('#streakN').textContent = D.streak.days; $('#streakChip').classList.add('cold'); gsap.fromTo('#streakChip', { x: -5 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,.3)' }); } });
		}, '<')
		.add(() => {
			$('#fuTxt').innerHTML = `最长纪录 <b>${best ?? was} 天</b>，留在你的主页上。<br>今天打 1 关，从 1 天重新烧起来；连到 7 天送冻结卡，下次漏一天它替你顶上。`;
			gsap.from('#fuTxt,#fuOk', { y: 10, opacity: 0, stagger: 0.08, duration: 0.3 });
		}, '+=.6');
	fuAfter = '没事，从今天重新点火。打一关，火苗回到 <b>1</b> 天。';
}
let fuAfter = '';
$('#fuOk').onclick = () => {
	play('tap');
	gsap.to('#fuOv', { opacity: 0, duration: 0.25, onComplete: () => {
		hide('#fuOv'); $('#fuOv').style.opacity = 1; drawTop();
		if (fuAfter) miaSay(fuAfter);
		gsap.fromTo('#go', { scale: 1 }, { scale: 1.05, duration: 0.25, yoyo: true, repeat: 3 });
		if (PREVIEW && previewAfter()) return;
		handleQuery(); maybeBehind();
	} });
};

/* ================= 加载中 / 断网 ================= */
let loadTl = null, loadWait = null;
function showLoader() {
	clearTimeout(loadWait);
	loadWait = setTimeout(() => { // 300ms 内回来就不闪加载画面
		const L = $('#loader'); show(L); gsap.set(L, { opacity: 1 });
		const ink = $('#loadInk'), len = ink.getTotalLength(); ink.style.strokeDasharray = len;
		loadTl?.kill();
		loadTl = gsap.timeline({ repeat: -1 }).fromTo(ink, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: 'power1.inOut',
			onUpdate() { const p = ink.getPointAtLength(len * this.progress()); $('#loadPin').setAttribute('transform', `translate(${p.x} ${p.y - 4})`); } })
			.to(ink, { opacity: 0, duration: 0.25 }).set(ink, { opacity: 1 });
	}, 300);
}
function hideLoader(immediate) {
	clearTimeout(loadWait);
	const L = $('#loader'); if (L.style.display !== 'flex') return;
	const done = () => { hide(L); L.style.opacity = 1; loadTl?.kill(); loadTl = null; };
	if (immediate) done(); else gsap.to(L, { opacity: 0, duration: 0.35, onComplete: done });
}
const isOffline = e => !navigator.onLine || e?.code === 'NETWORK' || e instanceof TypeError;
let offShown = false;
function goOffline() {
	const b = $('#offBar'); b.className = ''; show(b); gsap.killTweensOf(b);
	$('#offIc').textContent = '📡'; $('#offT').textContent = '断网了 · 答案先存在手机上，连上自动交'; $('#offRetry').style.display = '';
	if (!offShown) { play('offline'); gsap.fromTo(b, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' }); }
	offShown = true;
}
function okOnline(n) {
	if (!offShown) return; offShown = false;
	const b = $('#offBar'); b.className = 'ok'; $('#offIc').textContent = '✓'; $('#offRetry').style.display = 'none';
	$('#offT').textContent = n ? `连上了 · 存着的 ${n} 题已经交上去` : '连上了'; play('pass', 0.6);
	gsap.fromTo(b, { scale: 1.05 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
	gsap.to(b, { y: -20, opacity: 0, duration: 0.35, delay: 2, onComplete: () => { hide(b); gsap.set(b, { y: 0, opacity: 1 }); } });
}
function reconnect() {
	if (!offShown) return;
	$('#offT').textContent = '正在重连…'; $('#offRetry').style.display = 'none';
	gsap.to('#offIc', { rotation: 360, duration: 0.8, ease: 'none', onComplete: () => gsap.set('#offIc', { rotation: 0 }) });
	if (PREVIEW && SP === 'offline') { setTimeout(() => okOnline(1), 1200); return; }
	if (pending) { const p = pending; pending = null; offShown = true; resend(p); return; }
	refresh().then(() => okOnline(0), () => { $('#offT').textContent = '还是连不上 · 过一会儿再点'; $('#offRetry').style.display = ''; });
}
function resend(p) {
	if (!AT) { okOnline(0); return; }
	const q = AT.questions[AT.i]; answering = true;
	api('lojo/quest/answer', { attemptId: AT.attemptId, qid: q.id, answer: p.value }).then(r => {
		okOnline(1);
		AT.marks[AT.i] = r.correct; AT.end = r.end; D.hearts = r.hearts;
		if (p.pre === 'b') bossJudged(r, p.el, q); else quizJudged(r, p.el, q);
	}).catch(e => {
		if (isOffline(e)) { pending = p; goOffline(); return; }
		okOnline(0); lockQ(p.pre, false); toast(errText(e));
	}).finally(() => { answering = false; });
}
$('#offRetry').onclick = () => { play('tap'); reconnect(); };
window.addEventListener('online', () => reconnect());

/* ================= 画面目录（只在预览里有） ================= */
const STATES = [
	['', '地图', '老用户 · 打到 1-6 · 1-1、1-2 该回测了'],
	['new', '第一次进来', '3 步引导 · 定考试日期'],
	['practice', '练手关', '1-1 · 答错不扣心'],
	['gap', '填空题', '听写名字 · 回车交'],
	['choice', '选择题', '按字母选'],
	['tfng', '判断题', 'TRUE / FALSE / NOT GIVEN'],
	['build', '拼句题', '点词块拼句子，再点一下拿掉'],
	['listen', '听力', '按顺序播几段录音'],
	['retest', '回测', '3 题 · 不扣心 · 对 2 题重新点亮'],
	['pass', '过关', '盖章 → 宝箱 → 火苗'],
	['fail', '没过', 'Mia 推荐的锦囊 · 装备 · 错题折叠'],
	['pfail', '练手关没过', '不扣心 · 装备小字不提补心'],
	['boss', 'Boss 门前', '备战三件齐了'],
	['bosswin', '打赢 Boss', '徽章 + 彩纸'],
	['bosslose', '输给 Boss', '再输一次备战清零'],
	['freeze', '冻结卡自动用掉', '昨天漏了一天，有冻结卡'],
	['streaklost', '连胜断了', '昨天漏了一天，没有冻结卡'],
	['refillstreak', '补心算连胜', '今天还没打，心打光了'],
	['empty', '心打光了', '两条路补心 + 等回满'],
	['examdate', '改考试日期', '能改也能清掉'],
	['nodate', '还没定日子', '倒数那行请你定日子'],
	['behind', '落后提醒', '照这个速度考前走不到'],
	['bagempty', '背包空', '书屋里点背包'],
	['loading', '加载中', '铺地图的等待画面'],
	['error', '出错', '地图没加载出来'],
	['offline', '断网', '顶部提示 · 点「重连」'],
];
function statesSheet() {
	const base = window.location.pathname;
	openSheet('<h4>画面目录</h4><div class="sub">预览用的假数据，不连服务器，不记进度。</div>' +
		STATES.map(([k, t, d]) => `<a class="stl${k === (SP ?? '') ? ' cur' : ''}" href="${base}${k ? '?s=' + k : '?s='}"><span><b>${esc(t)}</b><small>${esc(d)}</small></span><em>${k === (SP ?? '') ? '现在' : '打开 ›'}</em></a>`).join(''));
}
if (PREVIEW) { $('#statesBtn').classList.remove('hide'); $('#statesBtn').onclick = () => statesSheet(); }

/* 预览：进场以后自动打开对应的画面 */
function previewAfter() {
	const k = SP, later = (f, ms = 300) => { setTimeout(f, ms); return true; };
	const afterOpen = f => { const t = setInterval(() => { if (AT && ($('#quiz').style.display === 'flex' || $('#boss').style.display === 'flex')) { clearInterval(t); setTimeout(f, 400); } }, 100); };
	if (['practice', 'gap', 'choice', 'tfng', 'build', 'listen'].includes(k)) return later(() => startLevel('1-1'));
	if (k === 'retest') return later(() => nodeTap('1-1'));
	if (k === 'pfail') return later(() => { startLevel('1-1'); afterOpen(() => { const e = FAKE.endNow(false); AT.end = e; AT.ended = true; endLevel(e); }); });
	if (k === 'pass' || k === 'fail') return later(() => { startLevel('1-6'); afterOpen(() => { const e = FAKE.endNow(k === 'pass'); AT.end = e; AT.ended = true; endLevel(e); }); });
	if (k === 'boss') return later(() => bossSheet());
	if (k === 'bosswin' || k === 'bosslose') return later(() => { startLevel('boss'); afterOpen(() => { const e = FAKE.endNow(k === 'bosswin'); AT.end = e; AT.ended = true; if (e.passed) bossWin(e); else bossLose(e); }); });
	if (k === 'refillstreak' || k === 'empty') return later(() => showEmpty('map'));
	if (k === 'examdate') return later(() => openExamSheet());
	if (k === 'behind') return later(() => maybeBehind(true));
	if (k === 'bagempty') return later(() => { enterShelf('browse', { fromEl: $('#nd-shelf') }); setTimeout(() => $('#bag').click(), 3400); });
	if (k === 'offline') return later(() => goOffline());
	return false;
}

/* 预览用的假服务器：形状照 lojo/quest/* 的真接口，内容是写死的几道题 */
const FAKE = (() => {
	const N = [["start","start",195,570,"起点"],["1-1","level",195,520,"1-1","名字和字母","听力 · 一个字母一个字母地听","main",1,"listening","gap",3,2,9,"dictation"],["1-2","level",120,470,"1-2","数字和日期","听力 · 数字、日期、价钱","main",1,"listening","gap",3,2,9,"dictation"],["1-3","level",195,420,"1-3","约时间","听力 · 先提的常常被否掉","main",1,"listening","choice",3,2,9,"dictation"],["1-4","level",110,365,"1-4","对得上吗","阅读 · TRUE / FALSE / NOT GIVEN","main",0,"reading","TFNG",5,4,2,"vocab:5.3"],["1-5","level",120,300,"1-5","换个说法","阅读 · 同一个意思换了说法","main",0,"reading","choice",5,4,2,"vocab:5.3"],["1-6","level",170,170,"1-6","综合关","听力 + 阅读 + 语法","main",0,"mixed","choice",5,4,2,"dictation"],["1-7","level",285,340,"1-7","词汇 1","词汇 · 拼对","vocab",0,"vocab","gap",5,4,2,"wordbook"],["1-8","level",300,280,"1-8","词汇 2","词汇 · 换说法","vocab",0,"vocab","choice",5,4,2,"vocab:5.3"],["1-9","level",290,220,"1-9","词汇 3","词汇 · 搭配","vocab",0,"vocab","choice",5,4,2,"vocab:5.3"],["1-10","level",40,320,"1-10","拼句 1","语法 · 主谓宾","grammar",0,"grammar","build",5,4,2,"grammar:6.3"],["1-11","level",40,250,"1-11","拼句 2","语法 · 时态","grammar",0,"grammar","build",5,4,2,"grammar:6.3"],["1-12","level",45,180,"1-12","拼句 3","语法 · 从句","grammar",0,"grammar","build",5,4,2,"grammar:6.3"],["boss","boss",195,90,"Boss","换装者","同一个意思换了身衣服（听力 + 阅读）","main",0,"mixed",null,6,5,2,null],["gear","gear",300,490,"装备站","装备站","去小程序练一组，补 1 颗心","station",0,null,null,null,null,null,"dictation"],["intel","news",305,395,"情报站","情报站","同一关的人在聊什么","station",0,null,null,null,null,null,null],["shelf","shelf",200,250,"锦囊书屋","锦囊书屋","读一本锦囊","station",0,null,null,null,null,null,null]];
	const E0 = [["start","1-1"],["1-1","1-2"],["1-2","1-3"],["1-3","1-4"],["1-4","1-5"],["1-5","1-6"],["1-6","boss"],["1-3","1-7"],["1-7","1-8"],["1-8","1-9"],["1-9","1-6"],["1-4","1-10"],["1-10","1-11"],["1-11","1-12"],["1-1","gear"],["1-3","intel"],["1-5","shelf"]];
	const E = E0.map(([a, b]) => [a, b, ['gear', 'intel', 'shelf'].includes(b) ? 'station' : (N.find(n => n[0] === b)?.[7] ?? 'main')]);
	const GEAR = g => { const [app, stop] = String(g ?? 'dictation').split(':');
		if (app === 'vocab') return { app, path: `/vocab/${stop}?scope=all`, zh: `词汇线 ${stop} 站`, givesHeart: true };
		if (app === 'grammar') return { app, path: `/grammar/${stop}`, zh: `语法线 ${stop} 站`, givesHeart: false };
		if (app === 'wordbook') return { app, path: '/wordbook', zh: '生词本', givesHeart: true };
		return { app: 'dictation', path: '/dictation', zh: '听写', givesHeart: true }; };
	const BOOKS = [{"no": 1, "slug": "ielts-know-test-yourself", "spine": "合上书考自己", "title": "背单词多看几遍，不如合上书考自己", "summary": "「再看一遍」练的是认得它，「合上书考自己」练的是到考场上把它想出来。同样的时间，多考自己，少看。", "color": "#2340A3", "kind": "反常识", "evidence": "研究", "app": {"id": "wordbook", "zh": "生词本", "path": "/wordbook"}, "quiz": [{"q": "背完一组单词，还剩 5 分钟。哪种做法更能让你在考场上想起它们？", "o": ["把这组词从头再看一遍", "遮住英文，看着中文自己拼一遍"]}, {"q": "一个词你每次见到都认得，听写时却拼不出来。这说明什么？", "o": ["你只练过「认得它」，没练过「把它想出来」", "还没见够次数，再多看几遍就好"]}, {"q": "拼写卡上一个词拼错了，看了答案。接下来怎么做最好？", "o": ["反正答案看过了，跳过它", "过一会儿合上答案，再考自己一次"]}]}, {"no": 2, "slug": "ielts-know-spacing", "spine": "隔几天见一次才记得住", "title": "一口气背完的单词，过几天就还回去了；隔几天见一次才记得住", "summary": "一口气背完，刚背完测确实记得，过几天就忘了一大半。同样的复习次数，隔开几天做，记得多得多。", "color": "#3E9E7A", "kind": "通用规律", "evidence": "研究", "app": {"id": "wordbook", "zh": "生词本", "path": "/wordbook"}, "quiz": [{"q": "今天背了 50 个新词，晚上马上自测，全对。这能说明什么？", "o": ["已经记牢了，这批词可以不用再管", "只说明现在记得，过几天还得再见一次"]}, {"q": "同一批词都复习 3 次，哪种安排一周后记得更多？", "o": ["今天、后天、下周各复习 1 次", "今天一口气连着复习 3 遍"]}, {"q": "生词本里今天有 30 个词到期，另外 200 个还没到期。今天怎么做？", "o": ["趁有空，把 230 个一起刷一遍", "做完 30 个到期的就停"]}]}, {"no": 3, "slug": "ielts-know-read-easy-first", "spine": "先读得懂才读得多", "title": "4–5 分别急着刷剑桥真题：先读得懂，才读得多", "summary": "读顺一篇文章，大概要认识 98% 的词。生词一半的真题，读一篇累一篇。先读几乎不用查词典的文章，才读得多、记得住。", "color": "#ECB637", "kind": "反常识", "evidence": "研究", "app": {"id": "graded-reading", "zh": "分级阅读", "path": "https://vibes.college/read/artisan/"}, "quiz": [{"q": "一篇文章每行都有两三个生词，查了半天才读完。对 4–5 分的你，这篇算哪种材料？", "o": ["太难了，这样读不了几篇就会放弃", "正合适，越难进步越快"]}, {"q": "为什么说「先读得懂，才读得多」？", "o": ["读得懂的文章词汇简单，考试不考", "一个词要见很多次才记得住，只有读得懂的文章你才读得下去、读得多"]}, {"q": "那剑桥真题什么时候做？", "o": ["先把简单文章读顺，再拿来练题型和时间", "永远别做，只读简单的"]}]}, {"no": 4, "slug": "ielts-know-hear-known-words", "spine": "认识的词没听出来", "title": "听不懂，往往不是没学过这个词，是认识的词没听出来", "summary": "听不懂，第一反应是再去背新词。可很多时候卡住的是你早就认识的词：一连读、一说快，就认不出来了。", "color": "#E8603F", "kind": "反常识", "evidence": "研究 + 单人经验", "app": {"id": "dictation", "zh": "听写", "path": "/dictation"}, "quiz": [{"q": "听写时没写出 vegetable，可一看原文，你明明认识它。最可能的原因是？", "o": ["词汇量不够，要多背新词", "你认识它写出来的样子，没认出它读出来的样子"]}, {"q": "对 4–5 分的人，听力先补哪一块更划算？", "o": ["把已经认识的词和它真实的读音对上", "先背完一本新的词汇书"]}, {"q": "做完一组听写，哪种对答案的方法最有用？", "o": ["只看对了几题，记个分数", "把写错的词找出来，对着原文再听那一句"]}]}]; // 前 4 本锦囊的公开部分（题目答案只在服务器上，预览里交卷一律算对）
	const Q = {
		gap1: { id: 'pv-gap-1', type: 'gap', skill: 'listening', passage: null, question: 'Surname: ______', limit: { words: 1 }, audio: true, ans: 'Hartley', acc: ['hartley'], why: '一个字母一个字母地听：H-A-R-T-L-E-Y。', evidence: 'Can I take your surname, please? Yes, it\'s Hartley. H, A, R, T, L, E, Y.', lines: [['Woman', 'Can I take your surname, please?'], ['Man', 'Yes, it\'s Hartley. H, A, R, T, L, E, Y.']] },
		gap2: { id: 'pv-gap-2', type: 'gap', skill: 'listening', passage: null, question: 'Address: 22 ______ Road', limit: { words: 1 }, audio: true, ans: 'Wexford', acc: ['wexford'], why: 'X 读作 /eks/，别听成 S。', evidence: 'And which road do you live on? Wexford Road. That\'s W, E, X, F, O, R, D.', lines: [['Woman', 'And which road do you live on?'], ['Man', 'Wexford Road. That\'s W, E, X, F, O, R, D.']] },
		hall: { id: 'pv-gap-3', type: 'gap', skill: 'listening', passage: null, question: 'Hall holds up to ______ people', limit: { words: 1, number: true }, audio: true, ans: '60', acc: ['60', 'sixty'], why: '数字题写阿拉伯数字最稳，sixty 也算对。', evidence: 'The main hall holds up to sixty people.', lines: [['Man', 'How big is the main hall?'], ['Woman', 'The main hall holds up to sixty people.']] },
		choice: { id: 'pv-choice-1', type: 'choice', skill: 'listening', passage: null, question: 'Which day will they meet?', options: [{ key: 'A', text: 'Wednesday' }, { key: 'B', text: 'Monday' }, { key: 'C', text: 'Tuesday' }], audio: true, ans: 'A', why: '先提的 Monday 被否掉了，最后定的是 Wednesday。', evidence: 'Can we meet on Monday? Monday\'s difficult for me. How about Wednesday? Wednesday\'s fine.', lines: [['Man', 'Can we meet on Monday?'], ['Woman', 'Monday\'s difficult for me. How about Wednesday?'], ['Man', 'Wednesday\'s fine.']] },
		tfng: { id: 'pv-tfng-1', type: 'TFNG', skill: 'reading', passage: 'The community garden opened in 2019. Local families can rent a small plot for £25 a year. Water and basic tools are provided free of charge.', question: 'Gardeners have to buy their own tools.', options: [{ key: 'TRUE', text: 'TRUE' }, { key: 'FALSE', text: 'FALSE' }, { key: 'NOT GIVEN', text: 'NOT GIVEN' }], audio: false, ans: 'FALSE', why: '原文说基本工具免费提供，跟「要自己买」正好相反。', evidence: 'Water and basic tools are provided free of charge.' },
		build: { id: 'pv-build-1', type: 'build', skill: 'grammar', passage: null, question: '很多学生在图书馆学习。', chips: ['study', 'many students', 'in the library'], audio: false, ans: 'many students study in the library', acc: ['many students study in the library'], why: '主语 many students + 谓语 study，地点放最后。', evidence: '英语的语序：谁 + 做什么 + 在哪。' },
	};
	const SETS = {
		practice: ['gap1', 'gap2', 'choice'], gap: ['gap1', 'gap2', 'hall'], choice: ['choice', 'tfng', 'gap1'], tfng: ['tfng', 'choice', 'build'],
		build: ['build', 'tfng', 'choice'], listen: ['choice', 'gap1', 'hall'], retest: ['gap1', 'choice', 'tfng'],
		level: ['tfng', 'choice', 'hall', 'build', 'gap2'], boss: ['choice', 'tfng', 'hall', 'build', 'gap1', 'gap2'],
	};
	const k = SP ?? '';
	const today = (() => { const d = new Date(Date.now() + 8 * 3600e3); return d.toISOString().slice(0, 10); })();
	const fresh = k === 'new';
	const S = {
		hearts: ['empty', 'refillstreak'].includes(k) ? 0 : k === 'fail' ? 2 : fresh ? 5 : 4,
		examDate: fresh || k === 'nodate' ? null : ymd(new Date(dayD(today).getTime() + 88 * DAY)),
		onboarded: !fresh, bag: [], prep: ['boss', 'bosswin', 'bosslose'].includes(k) ? { guide: true, gear: true, news: true } : { guide: false, gear: true, news: false },
		streak: fresh ? 0 : k === 'streaklost' ? 0 : 6, freezes: k === 'freeze' || fresh ? 0 : 1, doneToday: !['refillstreak', 'freeze', 'streaklost', 'new'].includes(k) && k !== '' ? true : false,
		xp: fresh ? 0 : 240, bossLosses: k === 'bosslose' ? 1 : 0,
	};
	const AT2 = {};
	function stateOf(id, kind) {
		if (id === 'start') return 'done';
		if (fresh) return id === '1-1' ? 'open' : 'locked';
		const done = ['1-1', '1-2', '1-3', '1-4', '1-5', 'gear', 'intel', 'shelf'];
		if (['boss', 'bosswin', 'bosslose'].includes(k)) return kind === 'boss' ? 'open' : kind === 'level' ? 'done' : 'open';
		if (done.includes(id)) return kind === 'level' ? 'done' : 'open';
		if (['1-6', '1-7', '1-10'].includes(id)) return 'open';
		return 'locked';
	}
	function show() {
		const daysLeft = S.examDate ? Math.round((dayD(S.examDate) - dayD(today)) / DAY) : null;
		const nodes = N.map(([id, kind, x, y, label, name, zh, branch, practice, skill, type, ask, need, maxWrong, gear]) => {
			const state = stateOf(id, kind);
			const age = !fresh && id === '1-1' ? 'fade' : !fresh && id === '1-2' ? 'gray' : null;
			return { id, kind, x, y, label, name: name ?? label, zh: zh ?? '', hint: zh ?? '', branch: branch ?? 'main', skill: skill ?? null, type: type ?? null, practice: !!practice,
				ask: ask ?? null, need: need ?? null, maxWrong: maxWrong ?? null, hashtags: ['IELTS_' + id.replace('-', '_')], tags: ['IELTS_' + id.replace('-', '_')], shelf: [1, 3],
				heartCost: practice ? 0 : 1, gear: kind === 'level' || kind === 'gear' ? GEAR(gear) : null, state, best: state === 'done' ? 3 : null, tries: state === 'done' ? 1 : 0,
				failStreak: 0, stars: state === 'done' && kind === 'level' ? 2 : 0, age, retestable: !!age };
		});
		const rec = k === 'fail' ? 3 : null;
		return {
			now: new Date().toISOString(), day: today, hearts: S.hearts, maxHearts: 5, nextRefillAt: new Date(Date.now() + 3 * 3600e3 + 125e3).toISOString(),
			refilledToday: { guide: false, gear: false },
			streak: { days: S.streak, doneToday: S.doneToday, best: k === 'streaklost' ? 12 : 9, freezes: S.freezes, freezesNeeded: 0 },
			xp: S.xp, todayXp: S.doneToday ? 20 : 0, prep: { ...S.prep }, bossReady: S.prep.guide && S.prep.gear && S.prep.news, bossLosses: S.bossLosses,
			chestToday: false, bag: [...S.bag], badges: [], lastFail: k === 'fail' ? { levelId: '1-6', cause: 'not-given', failStreak: 1 } : null, tutorId: 'preview',
			examDate: S.examDate, daysLeft, onboarded: S.onboarded,
			behind: k === 'behind' && S.examDate ? { target: 'boss', n: 2, copy: '照这个速度，考前走不到 boss。今天多过 2 关就追上了。' } : null,
			notice: k === 'freeze' ? { kind: 'freeze', used: 1 } : k === 'streaklost' ? { kind: 'lost', days: 12, best: 12 } : null,
			chapter: { id: 'ielts-c1', version: 1, title: '第一章 · 打底', band: '练习难度 4.0–5.0', disclaimer: '练习难度，不是官方分数', boss: { hp: 5, maxWrong: 2, total: 6 }, branches: {}, edges: E, nodes },
			books: BOOKS.map(b => ({ ...b, ref: 'j' + b.no, id: 'ielts-c1-k' + b.no, verify: '', path: '/guides/' + b.slug, gear: GEAR(b.app.id === 'grammar' ? 'grammar:6.3' : b.app.id), givesHeart: b.app.id !== 'grammar',
				checkedToday: false, inBag: S.bag.includes(b.slug), lit: rec === b.no, recommended: rec === b.no })),
		};
	}
	const pub = q => ({ id: q.id, type: q.type, skill: q.skill, passage: q.passage, question: q.question, options: q.options ?? null, chips: q.chips ? [...q.chips].reverse() : null, limit: q.limit ?? null, audio: q.audio });
	const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
	function start(p) {
		const node = N.find(n => n[0] === p.levelId); if (!node) throw { code: 'NO_SUCH_LEVEL' };
		const boss = node[1] === 'boss', retest = !!p.retest, practice = !!node[8];
		const mode = boss ? 'boss' : retest ? 'retest' : practice ? 'practice' : 'level';
		if (!practice && !retest && S.hearts <= 0) throw { code: 'NO_HEARTS' };
		const set = boss ? SETS.boss : retest ? SETS.retest : SETS[k] ?? (practice ? SETS.practice : SETS.level);
		const qs = set.map(x => Q[x]);
		const need = boss ? 5 : qs.length <= 3 ? 2 : 4, maxWrong = boss ? 2 : qs.length - need + 1;
		const id = 'pv-' + Math.random().toString(36).slice(2, 8);
		AT2[id] = { mode, qs, need, maxWrong, right: 0, wrong: 0, answered: 0, rows: [], node };
		return { attemptId: id, levelId: p.levelId, mode, kind: boss ? 'boss' : 'level', practice: mode === 'practice' || mode === 'retest', set: 'A', need, total: qs.length, maxWrong,
			heartCost: mode === 'level' || mode === 'boss' ? 1 : 0, hp: boss ? 5 : null, hint: boss ? null : mode === 'practice' ? '练手关：答错不扣心，每题都告诉你为什么。' : null, hearts: S.hearts, questions: qs.map(pub) };
	}
	function endOf(a, passed) {
		const xp = passed ? (a.mode === 'practice' || a.mode === 'retest' ? 10 : a.mode === 'boss' ? 60 : 20) : 0;
		const rows = a.rows.length ? a.rows : a.qs.map((q, i) => ({ n: i + 1, qid: q.id, correct: passed ? i !== 2 : i < 1, given: passed || i < 1 ? q.ans : (q.type === 'TFNG' ? 'NOT GIVEN' : q.type === 'choice' ? 'B' : q.type === 'build' ? 'study many students in the library' : 'Hartly'), answer: q.type === 'choice' ? `A. ${q.options[0].text}` : q.ans, why: q.why, evidence: q.evidence, cause: 'not-given' }));
		const right = rows.filter(r => r.correct).length;
		return { passed, mode: a.mode, right, total: a.qs.length, need: a.need, outOfHearts: S.hearts <= 0, xp, stars: passed ? 2 : 0,
			chest: passed && a.mode === 'level' ? { xp: 15, freeze: true, preview: BOOKS[2].slug } : passed && a.mode === 'boss' ? { xp: 15, freeze: false, preview: null } : null, sideChest: null,
			badge: passed && a.mode === 'boss' ? 'ielts-c1' : null,
			streak: passed ? { days: S.streak + 1, changed: !S.doneToday, gotFreeze: a.mode === 'level' && S.streak + 1 === 7, usedFreezes: 0 } : null,
			firstPass: passed, failStreak: passed ? 0 : 2, cause: passed ? null : 'not-given', bossLosses: a.mode === 'boss' && !passed ? S.bossLosses + 1 : S.bossLosses,
			prepReset: a.mode === 'boss' && !passed && S.bossLosses + 1 >= 2, prep: { ...S.prep }, review: rows,
			recommended: passed ? null : { slug: BOOKS[2].slug, no: 3, ref: 'j3', spine: BOOKS[2].spine, path: '/guides/' + BOOKS[2].slug, shelf: [1, 3] } };
	}
	function answer(p) {
		const a = AT2[p.attemptId]; if (!a) throw { code: 'NO_SUCH_ATTEMPT' };
		const q = a.qs.find(x => x.id === p.qid); if (!q) throw { code: 'WRONG_QUESTION' };
		const ok = q.type === 'choice' || q.type === 'TFNG' ? String(p.answer).toUpperCase() === q.ans : (q.acc ?? [q.ans]).map(norm).includes(norm(p.answer));
		a.answered++; if (ok) a.right++; else a.wrong++;
		const lose = !ok && (a.mode === 'level' || a.mode === 'boss') && S.hearts > 0; if (lose) S.hearts--;
		const disp = q.type === 'choice' ? `${q.ans}. ${q.options.find(o => o.key === q.ans).text}` : q.ans;
		a.rows.push({ n: a.answered, qid: q.id, correct: ok, given: String(p.answer), answer: disp, why: q.why, evidence: q.evidence, cause: ok ? null : 'not-heard' });
		const done = a.mode === 'boss' ? (a.right >= 5 || a.wrong >= a.maxWrong || a.answered >= a.qs.length)
			: a.answered >= a.qs.length || a.wrong >= a.maxWrong || ((a.mode === 'level') && S.hearts <= 0 && !ok);
		const end = done ? endOf(a, a.right >= a.need) : null;
		if (end?.passed) S.doneToday = true;
		return { correct: ok, answer: disp, why: q.why, evidence: q.evidence, cause: ok ? null : 'not-heard', heartLost: lose, hearts: S.hearts,
			progress: { answered: a.answered, right: a.right, wrong: a.wrong, need: a.need, maxWrong: a.maxWrong, total: a.qs.length }, end };
	}
	function audio(p) {
		const a = AT2[p.attemptId]; const q = a?.qs.find(x => x.id === p.qid); if (!q?.lines) throw { code: 'NO_AUDIO' };
		if (k === 'listen') return { lines: q.lines.map(([who], i) => ({ who, url: './sounds/' + (i % 2 ? 'tick' : 'page') + '.mp3' })), rate: 1 };
		if (q.type === 'gap') { // 跟服务器一样：填空题没有录音就换一道，不给文字稿
			const i = a.qs.indexOf(q), used = a.qs.map(x => x.id);
			const pick = Object.values(Q).filter(x => !used.includes(x.id)).sort((x, y) => !!x.lines - !!y.lines)[0] ?? null;
			if (pick) a.qs[i] = pick;
			return { lines: [], rate: 1, skip: { next: pick ? pub(pick) : null } };
		}
		return { lines: [], rate: 1, fallback: q.lines.map(([who, text]) => ({ who, text })) };
	}
	const handle = (ep, p) => {
		const e = ep.replace('lojo/quest/', '');
		if (e === 'show') return show();
		if (e === 'start') return start(p);
		if (e === 'answer') return answer(p);
		if (e === 'audio') return audio(p);
		if (e === 'settings') { if ('examDate' in p) S.examDate = p.examDate; if (p.onboarded != null) S.onboarded = p.onboarded; return show(); }
		if (e === 'take') { if (!S.bag.includes(p.slug)) S.bag = [...S.bag, p.slug].slice(-3); S.prep.guide = true; return { bag: [...S.bag], prep: { ...S.prep } }; }
		if (e === 'check') { const b = BOOKS.find(x => x.slug === p.slug); const results = b.quiz.map((_, i) => ({ correct: true, answer: p.answers[i], why: '' })); const right = results.filter(r => r.correct).length; const passed = right >= 2; const refilled = passed && S.hearts < 5; if (refilled) S.hearts++; if (passed) { S.prep.guide = true; if (!S.bag.includes(b.slug)) S.bag = [...S.bag, b.slug].slice(-3); } return { passed, right, refilled, reason: !passed ? 'failed' : refilled ? null : 'full', hearts: S.hearts, results, streak: null, prep: { ...S.prep } }; }
		if (e === 'news') { S.prep.news = true; return { xp: 2, prep: { ...S.prep } }; }
		if (e === 'board') return { open: false, players: 0, min: 5, since: today, top: [], me: null };
		if (e === 'ask-tutor') return { tutorId: 'preview', result: 'ok' };
		return {};
	};
	return {
		handle,
		endNow(passed) { const a = AT2[AT.attemptId]; return endOf({ ...a, rows: [] }, passed); },
	};
})();
function fakeApi(ep, p) {
	return new Promise((res, rej) => setTimeout(() => { try { res(JSON.parse(JSON.stringify(FAKE.handle(ep, p)))); } catch (e) { rej(e); } }, 150));
}

/* ================= 开始 ================= */
if (PREVIEW && SP === 'error') { $('#errP').innerHTML = '网卡了一下，或者我们这边出了点小问题。<br>你的进度、连胜和心都存着，不会丢。'; $('#errCode').textContent = '错误码 NETWORK · 一直这样，就截图发到公会'; show('#errScr'); }
else if (PREVIEW && SP === 'loading') showLoader();
else { showLoader(); refreshQuiet(); }

/* 跟社区的约定（社区那边的 Vue 页面照这个实现）：
   window.__vibesQuest = {
     api(endpoint, params) → Promise<结果>；失败时 reject({ code, message })，code 是服务器的错误码（如 NO_HEARTS）
     go(path)              → 在社区里跳转（站内路径，如 /dictation、/guides/xxx、/chat/user/<id>、/tags/xxx）
     query: { book?, level?, from?, s? } → 打开时直接翻到哪本锦囊 / 哪一关；from 是从哪个小程序练完回来（dictation、typing…）；
                             s 是预览画面名，只在非正式站生效，用假数据、不连服务器（画面目录里有全部名字）
   }
   这一页放在 /lojo-assets/quest/index.html，用 iframe 嵌进社区的 /quest 页面。
   单独打开时：api 直接 POST /api/<endpoint>，用 localStorage 里 account.token；go 直接换地址；query 读地址栏（book、level、from、s）。 */
})();
