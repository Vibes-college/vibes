/* 换个说法（Word Swaps）v0.2
   一局 2 分 30 秒、3 颗心。一屏 16 张卡 = 7 对同义 + 1 对陷阱（长得像、意思不同）。
   点两张同义的 → 墨点收走，下方写中文和用法区别；配错不扣心（只断连击）；配到陷阱扣 1 颗心，Mia 说为什么。
   3 秒内接着配对算连击，分数 ×连击数（最多 ×5）；连到 5 回 1 颗心。消完一屏 +10 秒，补一屏新的，
   新一屏第一对接着刚才的意思往下走（意思链）。
   打完报给社区：练一组补 1 颗心（≥10 对、≥2 分钟，服务器判）。只在挂进社区（同一个网址、登录了）时报。 */
import { TOPICS } from './data.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ROUND_MS = 150_000, HEARTS = 3, REAL = 7, COMBO_MS = 3000, CLEAR_BONUS_MS = 10_000;
const STAR_AT = [10, 20, 30];
const APP_ID = 'synonym-match';
const qs = new URLSearchParams(location.search);

/* ---------- 声音、震动 ---------- */
const SND_KEY = 'vibes.synonym.sound';
let soundOn = true;
try { soundOn = localStorage.getItem(SND_KEY) !== '0'; } catch { /* 私密模式 */ }
const S = {};
let actx = null;
function play(n, v = 1) {
	if (!soundOn) return;
	if (!S[n]) { S[n] = new Audio(`./sounds/${n}.mp3`); S[n].preload = 'auto'; }
	const a = S[n].cloneNode(); a.volume = v; a.play().catch(() => {});
}
function tune(notes, type = 'triangle', gap = 0.06, len = 0.18, vol = 0.1) {
	if (!soundOn) return;
	try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
	const t0 = actx.currentTime + 0.01;
	notes.forEach((f, i) => {
		const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f;
		g.gain.setValueAtTime(0, t0 + i * gap); g.gain.linearRampToValueAtTime(vol, t0 + i * gap + 0.012); g.gain.exponentialRampToValueAtTime(0.0008, t0 + i * gap + len);
		o.connect(g).connect(actx.destination); o.start(t0 + i * gap); o.stop(t0 + i * gap + len + 0.05);
	});
}
// 连击音一级比一级高：每多连一对整体升一个全音，最多 6 级；×3 起末尾加高八度
function comboTune(level) {
	const k = Math.pow(1.122, Math.min(level - 1, 6));
	const n = [523 * k, 659 * k];
	tune(n, 'triangle', 0.06, 0.18, 0.1);
	if (level >= 3) setTimeout(() => tune([659 * k * 2], 'sine', 0.05, 0.25, 0.08), 110);
}
const buzz = p => { if (soundOn && navigator.vibrate) try { navigator.vibrate(p); } catch { /* 不支持 */ } };
function drawSnd() { $('#sndBtn').textContent = soundOn ? '🔊' : '🔇'; }
$('#sndBtn').onclick = () => { soundOn = !soundOn; try { localStorage.setItem(SND_KEY, soundOn ? '1' : '0'); } catch { /* */ } drawSnd(); play('tap'); };
drawSnd();

function toast(t, ms = 2000) {
	const el = $('#toast'); el.textContent = t;
	el.getAnimations().forEach(a => a.cancel());
	el.animate([{ opacity: 0, transform: 'translate(-50%,-8px)' }, { opacity: 1, transform: 'translate(-50%,0)', offset: 0.1 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: ms, fill: 'forwards' });
}

/* ---------- 心 ---------- */
const heartSVG = on => `<svg viewBox="0 0 16 16"><path d="M8 4 c-1.5 -3 -7 -2.5 -6 1.5 c.6 2.4 3.6 4.4 6 6.5 c2.4 -2.1 5.4 -4.1 6 -6.5 c1 -4 -4.5 -4.5 -6 -1.5z" fill="${on ? '#E8603F' : '#E9E1D2'}" stroke="#141E52" stroke-width="1.2"/></svg>`;
function drawHearts() { $('#hearts').innerHTML = [...Array(HEARTS)].map((_, i) => heartSVG(i < G.hearts)).join(''); }

/* ---------- 社区（挂在 app.vibes.college 下时才有） ---------- */
const token = () => { try { return JSON.parse(localStorage.getItem('account') ?? 'null')?.token ?? ''; } catch { return ''; } };
async function api(ep, body) {
	const r = await fetch(`/api/${ep}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ i: token(), ...body }) });
	if (!r.ok) throw new Error(String(r.status));
	return r.status === 204 ? null : r.json();
}
const fromQuest = qs.get('from') === 'quest';
const questLevel = /^[\w.-]{1,40}$/.test(qs.get('level') ?? '') ? qs.get('level') : null;
$('#backLink').href = fromQuest ? (questLevel ? `/quest?level=${encodeURIComponent(questLevel)}&from=${APP_ID}` : '/quest') : (token() ? '/' : '#');
if (!fromQuest && !token()) $('#backLink').style.visibility = 'hidden';
// 从闯关进来的，结算页多一个「回地图」
if (fromQuest) { $('#mapBtn').href = $('#backLink').href; $('#mapBtn').classList.remove('hide'); }

/* ---------- 本机记录 ---------- */
const BEST_KEY = 'vibes.synonym.best', LOCAL_WB = 'vibes.synonym.wordbook';
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } };

/* ---------- 开局页 ---------- */
let topic = TOPICS.find(t => t.id === qs.get('topic')) ?? TOPICS[0];
function starsOf(n) { return STAR_AT.filter(x => n >= x).length; }
function drawHome() {
	const best = load(BEST_KEY, {});
	$('#topics').innerHTML = TOPICS.map(t => {
		const s = best[t.id] ? starsOf(best[t.id].pairs) : 0;
		return `<button class="tp" role="tab" data-id="${t.id}" aria-selected="${t.id === topic.id}">${t.zh}${s ? `<span class="st">${'★'.repeat(s)}</span>` : ''}</button>`;
	}).join('');
	$('#tZh').textContent = topic.zh; $('#tEn').textContent = topic.en;
	$('#homeSay').innerHTML = topic.mia;
	const b = best[topic.id];
	$('#best').innerHTML = b ? `最好成绩 <b>${b.score}</b> 分 · 一局消了 ${b.pairs} 对` : '';
	$$('.tp').forEach(el => { el.onclick = () => { topic = TOPICS.find(t => t.id === el.dataset.id); play('tap'); drawHome(); }; });
	const sel = $('.tp[aria-selected="true"]'); if (sel) sel.scrollIntoView({ inline: 'center', block: 'nearest' });
}
drawHome();
if (!RM) $('#demo').classList.add('run');

/* ---------- 一局 ---------- */
let G = null;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

function newGame() {
	G = {
		topic, hearts: HEARTS, score: 0, pairs: 0, combo: 0, bestCombo: 0, lastMatchAt: 0,
		startedAt: 0, endAt: 0, running: false, sel: null, busy: false,
		deck: shuffle(topic.pairs.slice()), used: new Set(), lastG: null,
		traps: shuffle(topic.traps.slice()), trapHit: 0, trapDodged: 0, screens: 0,
		missed: new Map(), // key -> {pair|trap}
	};
}

// 抽一屏：7 对，同一屏同一条意思链只出一对、同一个词只出一次；第一对尽量接着上一屏最后消掉的意思链
function drawScreen() {
	if (G.deck.length < REAL) G.deck = shuffle(G.topic.pairs.filter(p => !G.deck.includes(p)).concat(G.deck));
	const trap = G.traps[G.screens % G.traps.length];
	G.screens++;
	const pick = [], gs = new Set(), words = new Set([trap.a, trap.b]);
	const free = p => !pick.includes(p) && !words.has(p.a) && !words.has(p.b);
	const take = p => { pick.push(p); gs.add(p.g); words.add(p.a); words.add(p.b); const i = G.deck.indexOf(p); if (i >= 0) G.deck.splice(i, 1); };
	if (G.lastG) { const p = G.deck.find(x => x.g === G.lastG && free(x)); if (p) take(p); }
	for (const p of G.deck.slice()) { if (pick.length >= REAL) break; if (free(p) && !gs.has(p.g)) take(p); }
	// 意思链太挤凑不满 7 对时，放宽「一条链一对」（同一个词仍然只出一次）
	for (const p of [...G.deck, ...shuffle(G.topic.pairs.slice())]) { if (pick.length >= REAL) break; if (free(p)) take(p); }
	const cards = [];
	pick.forEach((p, i) => { cards.push({ w: p.a, pid: i, pair: p }); cards.push({ w: p.b, pid: i, pair: p }); });
	cards.push({ w: trap.a, pid: 'trap', trap }); cards.push({ w: trap.b, pid: 'trap', trap });
	G.trapNow = trap; G.trapTouched = false;
	G.left = pick.length;
	return shuffle(cards);
}

// 字号自己缩到放得下：单词不在中间断开，短语只在空格处换行，最多两行
function fit(el) {
	const sp = el.firstElementChild; let f = 18;
	sp.style.fontSize = f + 'px';
	const tooBig = () => sp.scrollWidth > el.clientWidth - 12 || sp.offsetHeight > el.clientHeight - 8 || (!sp.textContent.includes(' ') && sp.offsetHeight > f * 1.3);
	while (f > 11 && tooBig()) { f -= 0.5; sp.style.fontSize = f + 'px'; }
}
function renderScreen(drop = true) {
	const cards = drawScreen();
	const board = $('#board'); board.innerHTML = '';
	cards.forEach((c, i) => {
		const el = document.createElement('button');
		el.className = 'card'; el.style.setProperty('--r', `${(Math.random() * 4 - 2).toFixed(1)}deg`);
		el.innerHTML = `<span lang="en">${c.w}</span>`; el.setAttribute('aria-label', c.w);
		el._c = c;
		el.addEventListener('pointerdown', () => el.classList.add('down'));
		['pointerup', 'pointerleave', 'pointercancel'].forEach(e => el.addEventListener(e, () => el.classList.remove('down')));
		el.addEventListener('click', () => tapCard(el));
		board.appendChild(el); fit(el);
		if (drop && !RM) el.animate([{ transform: `translateY(-60px) rotate(${Math.random() * 20 - 10}deg)`, opacity: 0 }, { opacity: 1, offset: 0.4 }, { transform: `rotate(${el.style.getPropertyValue('--r')})`, opacity: 1 }], { duration: 350, delay: i * 30, easing: 'cubic-bezier(.34,1.5,.64,1)', fill: 'backwards' });
	});
}

function setLearn(html) { const l = $('#learn'); l.innerHTML = html; if (!RM) l.animate([{ transform: 'scale(.97)' }, { transform: 'none' }], { duration: 180, easing: 'ease-out' }); }
function miaSay(html) { const b = $('#playSay'); b.innerHTML = html; if (!RM) b.animate([{ transform: 'scale(.85)', transformOrigin: '0 100%' }, { transform: 'none', transformOrigin: '0 100%' }], { duration: 420, easing: 'cubic-bezier(.34,1.8,.64,1)' }); }

function tapCard(el) {
	if (!G?.running || el.classList.contains('gone') || el._done) return;
	if (G.sel === el) { el.classList.remove('sel'); G.sel = null; play('tap', 0.4); return; }
	if (!G.sel) { el.classList.add('sel'); G.sel = el; play('tap', 0.7); buzz(8); return; }
	const a = G.sel, b = el; G.sel = null; a.classList.remove('sel');
	const ca = a._c, cb = b._c;
	if (ca.pid === 'trap' && cb.pid === 'trap') return hitTrap(a, b);
	if (ca.pid === cb.pid) return match(a, b);
	miss(a, b);
}

function pairKey(p) { return `${p.a}|${p.b}`; }

function match(a, b) {
	const p = a._c.pair, now = performance.now();
	a._done = b._done = true;
	G.combo = now - G.lastMatchAt < COMBO_MS ? G.combo + 1 : 1;
	G.lastMatchAt = now; G.bestCombo = Math.max(G.bestCombo, G.combo);
	const mult = Math.min(G.combo, 5);
	G.score += 100 * mult; G.pairs++; G.left--; G.lastG = p.g;
	a.classList.add('ok'); b.classList.add('ok');
	play('stamp', 0.6); comboTune(G.combo); buzz(12);
	inkAway(a, b, p.zh);
	setLearn(`<div><span class="pair" lang="en">${p.a}<em>＝</em>${p.b}</span><span class="zh">${p.zh}</span></div><div class="tip">${p.tip}</div>`);
	showCombo(G.combo);
	if (G.combo === 5 && G.hearts < HEARTS) { G.hearts++; drawHearts(); play('heartup', 0.7); toast('连击 ×5，回 1 颗心'); }
	drawHud();
	if (G.left === 1) $$('#board .card').forEach(c => { if (!c._done && c._c.pid !== 'trap') c.classList.add('last'); });
	if (G.left === 0) setTimeout(clearScreen, RM ? 150 : 420);
}

function miss(a, b) {
	G.combo = 0;
	[a, b].forEach(el => { if (el._c.pair) G.missed.set(pairKey(el._c.pair), { pair: el._c.pair }); });
	[a, b].forEach(el => el.classList.add('no'));
	play('fail', 0.5); buzz([30, 40, 30]);
	shake([a, b]);
	setLearn(`<div><span class="pair" lang="en">${a._c.w}<em>≠</em>${b._c.w}</span></div><div class="tip">${a._c.pair ? `${a._c.w}：${a._c.pair.zh}` : a._c.w}　·　${b._c.pair ? `${b._c.w}：${b._c.pair.zh}` : b._c.w}</div>`);
	setTimeout(() => [a, b].forEach(el => el.classList.remove('no')), 450);
	// 配错不扣心：让人敢试，代价是连击断掉；只有踩陷阱扣心
}

function hitTrap(a, b) {
	G.combo = 0; G.trapHit++; G.trapTouched = true;
	const t = a._c.trap;
	G.missed.set(`trap:${t.a}|${t.b}`, { trap: t });
	[a, b].forEach(el => el.classList.add('trap'));
	play('warn', 0.7); buzz([30, 40, 30]); shake([a, b]);
	setLearn(`<div><span class="pair" lang="en">${t.a}<em>≠</em>${t.b}</span><span class="zh">陷阱</span></div><div class="tip">${t.why}</div>`);
	miaSay(`陷阱！<b>${t.a}</b> 和 <b>${t.b}</b> 只是长得像。`);
	setTimeout(() => [a, b].forEach(el => el.classList.remove('trap')), 600);
	loseHeart();
}

function shake(els) {
	if (RM) { els.forEach(el => el.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 300 })); return; }
	els.forEach(el => el.animate([0, -6, 6, -6, 6, -3, 0].map(x => ({ transform: `rotate(${el.style.getPropertyValue('--r')}) translateX(${x}px)` })), { duration: 300 }));
}

function loseHeart() {
	G.hearts--;
	const svg = $$('#hearts svg')[G.hearts];
	play('heartbreak', 0.8); buzz(G.hearts <= 0 ? 120 : 60);
	const after = () => { drawHearts(); if (G.hearts <= 0) endGame('hearts'); };
	if (svg && !RM) svg.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.6)', offset: 0.2 }, { transform: 'translateY(30px) rotate(40deg)', opacity: 0 }], { duration: 620, easing: 'ease-in' }).onfinish = after;
	else after();
	if (G.hearts <= 0) G.running = false;
}

// 墨点收走：两张卡往一起靠、放大，中心冒墨点盖住整张卡，墨点退去留一张便签，溅出几颗墨点
function inkAway(a, b, zh) {
	const wrap = $('.boardwrap'), wr = wrap.getBoundingClientRect();
	const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
	const ca = { x: ra.left - wr.left + ra.width / 2, y: ra.top - wr.top + ra.height / 2 }, cb = { x: rb.left - wr.left + rb.width / 2, y: rb.top - wr.top + rb.height / 2 };
	const done = () => { a.classList.add('gone'); b.classList.add('gone'); };
	// 便签放两张卡中间，不出板子
	const mid = { x: Math.min(Math.max((ca.x + cb.x) / 2, 70), wr.width - 70), y: (ca.y + cb.y) / 2 };
	const note = document.createElement('div'); note.className = 'note'; note.textContent = zh;
	note.style.left = `${mid.x}px`; note.style.top = `${mid.y}px`;
	$$('.boardwrap .note').forEach(n => n.remove()); // 下一对来了，上一张便签让位
	if (RM) { done(); wrap.appendChild(note); setTimeout(() => note.remove(), 1400); return; }
	[[a, ca, cb], [b, cb, ca]].forEach(([el, c, o]) => {
		const dx = Math.sign(o.x - c.x) * 6, dy = Math.sign(o.y - c.y) * 6, r = el.style.getPropertyValue('--r');
		el.animate([{ transform: `rotate(${r})` }, { transform: `rotate(${r}) translate(${dx}px,${dy}px) scale(1.08)` }], { duration: 120, fill: 'forwards', easing: 'ease-out' });
		const ink = document.createElement('div'); ink.className = 'ink';
		const d = Math.hypot(ra.width, ra.height) + 6;
		Object.assign(ink.style, { width: `${d}px`, height: `${d}px`, left: `${c.x - d / 2 + dx}px`, top: `${c.y - d / 2 + dy}px` });
		wrap.appendChild(ink);
		ink.animate([{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1)', opacity: 1, offset: 0.55 }, { transform: 'scale(.15)', opacity: 0 }], { duration: 340, delay: 90, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' }).onfinish = () => ink.remove();
		for (let i = 0; i < 5; i++) {
			const dot = document.createElement('div'); dot.className = 'dot';
			Object.assign(dot.style, { left: `${c.x}px`, top: `${c.y}px` });
			wrap.appendChild(dot);
			const ang = Math.random() * Math.PI * 2, dist = 26 + Math.random() * 26;
			dot.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * dist - 3}px,${Math.sin(ang) * dist - 3 + 14}px) scale(.4)`, opacity: 0 }], { duration: 480, delay: 260, easing: 'cubic-bezier(.2,.8,.4,1)', fill: 'backwards' }).onfinish = () => dot.remove();
		}
	});
	setTimeout(done, 260);
	setTimeout(() => {
		wrap.appendChild(note);
		note.animate([{ opacity: 0, transform: 'translate(-50%,-50%) rotate(-2deg) scale(.6)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-2deg) scale(1)', offset: 0.12 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 1400, easing: 'ease-out' }).onfinish = () => note.remove();
	}, 300);
}

function showCombo(n) {
	const el = $('#combo'), wrap = $('.boardwrap');
	wrap.classList.toggle('fire', n >= 4);
	if (n < 2) return;
	el.innerHTML = `×${Math.min(n, 5)}<small>${n >= 5 ? '连击 · 满' : '连击'}</small>`;
	el.getAnimations().forEach(x => x.cancel());
	el.animate([{ opacity: 0, transform: 'translateX(-50%) rotate(-14deg) scale(2.4)' }, { opacity: 1, transform: 'translateX(-50%) rotate(-14deg) scale(1)', offset: 0.35 }, { opacity: 1, offset: 0.8 }, { opacity: 0, transform: 'translateX(-50%) rotate(-14deg) scale(1)' }], { duration: RM ? 600 : 900, easing: 'ease-out', fill: 'forwards' });
}

function clearScreen() {
	if (!G.running) return;
	G.endAt += CLEAR_BONUS_MS; G.score += 300;
	if (!G.trapTouched) { G.trapDodged++; G.score += 200; }
	toast(G.trapTouched ? '清屏 +10 秒' : `清屏 +10 秒 · 躲过了 ${G.trapNow.a} / ${G.trapNow.b}`);
	play('whoosh', 0.6); setTimeout(() => play('bookflip', 0.6), 120);
	drawHud();
	renderScreen(true);
}

function drawHud() {
	$('#score').textContent = G.score;
	$('#pCount').textContent = G.pairs >= 10 ? `已消 ${G.pairs} 对 ✓` : `已消 ${G.pairs} 对 · 再 ${10 - G.pairs} 对补心`;
}

let raf = 0, lastTick = 0;
function loop() {
	if (!G.running) return;
	const left = Math.max(0, G.endAt - Date.now());
	const total = Math.max(ROUND_MS, left);
	$('#bar').style.transform = `scaleX(${left / total})`;
	const s = Math.ceil(left / 1000);
	$('#clock').textContent = `${s / 60 | 0}:${String(s % 60).padStart(2, '0')}`;
	$('.timer').classList.toggle('hot', left <= 10_000);
	if (left <= 10_000 && s !== lastTick && s > 0) { lastTick = s; play('tick', 0.5); }
	if (left <= 0) return endGame('time');
	raf = requestAnimationFrame(loop);
}

function show(id) { ['#home', '#play'].forEach(s => $(s).classList.toggle('hide', s !== id)); }

async function startGame() {
	newGame();
	show('#play');
	$('#pTopic').textContent = `${topic.zh} · ${topic.en}`;
	$('#learn').innerHTML = '<span class="hint">先找一对你最有把握的。</span>';
	miaSay('这屏藏着 1 对<b>长得像</b>的陷阱，别配它。');
	$('#combo').style.opacity = 0; $('.boardwrap').classList.remove('fire');
	drawHearts(); drawHud();
	$('#bar').style.transform = 'scaleX(1)'; $('#clock').textContent = '2:30'; $('.timer').classList.remove('hot');
	renderScreen(false);
	$$('#board .card').forEach(c => { c.style.visibility = 'hidden'; });
	// 3、2、1
	const cnt = $('#count');
	for (const n of [3, 2, 1]) {
		cnt.textContent = n; play('tick', 0.7);
		if (!RM) cnt.animate([{ transform: 'scale(2.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 650, fill: 'forwards' });
		await new Promise(r => setTimeout(r, qs.has('fast') ? 30 : 650));
	}
	cnt.textContent = '';
	$$('#board .card').forEach((c, i) => {
		c.style.visibility = '';
		if (!RM) c.animate([{ transform: 'translateY(-60px)', opacity: 0 }, { transform: `rotate(${c.style.getPropertyValue('--r')})`, opacity: 1 }], { duration: 350, delay: i * 30, easing: 'cubic-bezier(.34,1.5,.64,1)', fill: 'backwards' });
	});
	play('whoosh', 0.5);
	G.startedAt = Date.now(); G.endAt = G.startedAt + (Number(qs.get('roundms')) || ROUND_MS); G.running = true;
	raf = requestAnimationFrame(loop);
}

/* ---------- 结算 ---------- */
function stamp(text, sub) {
	const el = $('#stamp'); el.innerHTML = `${text}<small>${sub}</small>`;
	play('stamp');
	return el.animate([{ transform: 'rotate(-14deg) scale(2.4)', opacity: 0 }, { transform: 'rotate(-14deg) scale(1)', opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.8 }, { transform: 'rotate(-14deg) scale(1)', opacity: 0 }], { duration: RM ? 700 : 1300, easing: 'ease-out', fill: 'forwards' }).finished;
}

async function endGame(why) {
	if (G.ended) return; G.ended = true; G.running = false; cancelAnimationFrame(raf);
	const endedAt = Date.now();
	if (G.sel) G.sel.classList.remove('sel');
	play('lose', 0.5);
	await stamp(why === 'time' ? '时间到' : why === 'quit' ? '这局先到这' : '心打光了', `消了 ${G.pairs} 对`);
	const best = load(BEST_KEY, {}), prev = best[G.topic.id];
	const isRec = G.score > 0 && (!prev || G.score > prev.score);
	if (isRec) { best[G.topic.id] = { score: G.score, pairs: Math.max(G.pairs, prev?.pairs ?? 0) }; save(BEST_KEY, best); }
	else if (prev && G.pairs > prev.pairs) { prev.pairs = G.pairs; save(BEST_KEY, best); }
	openSheet(isRec, endedAt);
	report(endedAt);
}

function openSheet(isRec, endedAt) {
	const stars = starsOf(G.pairs);
	$('#stars').innerHTML = [0, 1, 2].map(() => '<span>★</span>').join('');
	$('#rec').classList.toggle('hide', !isRec);
	const secs = Math.round((endedAt - G.startedAt) / 1000);
	$('#stats').innerHTML = [`消对 ${G.pairs} 对`, `最长连了 ${G.bestCombo} 对`, `用时 ${secs / 60 | 0}:${String(secs % 60).padStart(2, '0')}`]
		.map(t => `<span>${t}</span>`).join('') + (G.trapHit === 0 && G.trapDodged > 0 ? '<span class="eye">一个陷阱都没踩</span>' : '');
	$('#questLine').innerHTML = '';
	const ms = [...G.missed.values()];
	$('#missedBox').classList.toggle('hide', ms.length === 0);
	$('#missed').innerHTML = ms.map((m, i) => m.pair
		? `<li><div class="w"><b lang="en">${m.pair.a} ＝ ${m.pair.b}</b><i>${m.pair.zh} · ${m.pair.tip}</i></div><button class="mini" data-i="${i}">＋生词本</button></li>`
		: `<li class="trapline"><div class="w"><b lang="en">${m.trap.a} ≠ ${m.trap.b}</b><i>${m.trap.why}</i></div><button class="mini" data-i="${i}">＋生词本</button></li>`).join('');
	$$('#missed .mini').forEach(btn => { btn.onclick = () => addWords([ms[+btn.dataset.i]], [btn]); });
	$('#addAll').onclick = () => addWords(ms, $$('#missed .mini'));
	$('#veil').classList.remove('hide');
	requestAnimationFrame(() => $('#sheet').classList.add('open'));
	// 星星一颗颗亮
	$$('#stars span').forEach((s, i) => {
		if (i >= stars) return;
		setTimeout(() => {
			s.classList.add('on'); tune([523 * Math.pow(1.26, i)], 'triangle', 0, 0.3, 0.12);
			if (!RM) s.animate([{ transform: 'scale(.3)' }, { transform: 'scale(1.35)', offset: 0.45 }, { transform: 'scale(.92)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 520 });
		}, 450 + i * 380);
	});
	setTimeout(() => play(stars === 3 ? 'milestone' : 'chest', 0.6), 450 + stars * 380);
	// 分数滚上去
	const t0 = performance.now(), target = G.score;
	const roll = now => { const k = Math.min(1, (now - t0) / 900); $('#fScore').textContent = Math.round(target * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(roll); };
	requestAnimationFrame(roll);
	if (isRec) setTimeout(confetti, 600);
}

function confetti() {
	if (RM) return;
	const app = $('#app'), w = app.clientWidth, h = app.clientHeight, colors = ['#E8603F', '#ECB637', '#3E9E7A', '#2340A3', '#FFFDF8'];
	for (let i = 0; i < 50; i++) {
		const c = document.createElement('div'); c.className = 'confetti'; c.style.background = colors[i % colors.length];
		c.style.left = `${w / 2}px`; c.style.top = `${h * 0.3}px`; app.appendChild(c);
		c.animate([{ transform: `rotate(${Math.random() * 360}deg)`, opacity: 1 }, { transform: `translate(${(Math.random() - 0.5) * w * 1.1}px,${(Math.random() - 0.1) * h * 0.7}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 1400 + Math.random() * 900, easing: 'cubic-bezier(.2,.8,.4,1)' }).onfinish = () => c.remove();
	}
}

// 报给社区：练一组（服务器判 ≥10 对、≥2 分钟、这个话题今天第一次）
async function report(endedAt) {
	const line = $('#questLine');
	if (!token()) {
		line.innerHTML = G.pairs >= 10 && endedAt - G.startedAt >= 120_000 ? '登录后，这样一局能<b>给闯关补 1 颗心</b>。' : '';
		return;
	}
	line.textContent = '正在记进闯关…';
	try {
		const r = await api('lojo/quest/refill', { app: APP_ID, setKey: `${APP_ID}:${G.topic.id}`, items: G.pairs, durationMs: Math.min(86_400_000, endedAt - G.startedAt), startedAt: G.startedAt });
		const why = { items: `再多配 ${Math.max(1, 10 - r.items)} 对，就能给闯关补 1 颗心`, time: '打满 2 分钟，下局就能给闯关补 1 颗心', duplicate: '这个话题今天给闯关补过心了，换个话题再补', pathUsed: '今天装备已经给闯关补过心了，这局记进 Boss 备战', full: '闯关的心是满的，这局记进 Boss 备战' };
		line.innerHTML = r.refilled ? `<b>给闯关补 1 颗心</b>，现在 ${r.hearts} 颗` : (why[r.reason] ?? (r.counted ? '这局记进闯关了' : '这局没记上'));
		if (r.refilled) play('heartup', 0.7);
	} catch {
		line.textContent = '这局没记上，网好了再打一局试试';
	}
}

async function addWords(items, btns) {
	const todo = items.map((m, i) => [m, btns[i]]).filter(([, b]) => b && !b.classList.contains('done'));
	if (!todo.length) return;
	play('tap');
	const tk = token();
	let okN = 0, localN = 0;
	for (const [m, b] of todo) {
		const words = m.pair
			? [{ text: m.pair.a, meaning: m.pair.zh, usage: `同义替换：${m.pair.a} = ${m.pair.b}。${m.pair.tip}` }]
			: [{ text: m.trap.a, meaning: m.trap.why, usage: `易混：${m.trap.a} ≠ ${m.trap.b}` }];
		try {
			if (!tk) throw new Error('nologin');
			for (const w of words) await api('lojo/words/add', { item: { text: w.text, kind: w.text.includes(' ') ? 'phrase' : 'word', meaning: w.meaning, usage: w.usage }, source: 'manual' });
			okN++;
		} catch {
			const list = load(LOCAL_WB, []); words.forEach(w => { if (!list.some(x => x.text === w.text)) list.push({ ...w, at: Date.now() }); }); save(LOCAL_WB, list); localN++;
		}
		b.classList.add('done'); b.textContent = '已记下';
	}
	toast(okN ? `已进生词本 ${okN} 条` : '先存在这台手机上了，登录后再点一次就能进生词本');
}

function closeSheet() { $('#sheet').classList.remove('open'); $('#veil').classList.add('hide'); }

/* ---------- 按钮 ---------- */
$('#goBtn').onclick = () => { play('tap'); startGame(); };
$('#againBtn').onclick = () => { closeSheet(); startGame(); };
$('#switchBtn').onclick = () => { closeSheet(); show('#home'); drawHome(); };
$('#quitBtn').onclick = () => { if (G?.running) endGame('quit'); };
document.addEventListener('visibilitychange', () => {
	// 切到后台暂停：回来时把离开的时间补上
	if (!G?.running) return;
	if (document.hidden) G.pausedAt = Date.now();
	else if (G.pausedAt) { G.endAt += Date.now() - G.pausedAt; G.startedAt += Date.now() - G.pausedAt; G.pausedAt = 0; }
});
if (qs.has('autostart')) startGame();

// 给测试脚本用：读当前屏的配对（不影响玩）
window.__sm = { state: () => G, topics: TOPICS };
