/* 同义词连连看（Word Swaps）v0.4
   一局 2 分 30 秒、3 颗心。一屏 16 张卡 = 7 对同义 + 1 对陷阱（长得像、意思不同）。
   点两张同义的（或按住一张拖到另一张）→ 一笔墨线连上，墨点收走，下方写中文和区别；点下方这张卡能看详情（例句、发音、差在哪）。
   配错不扣心（只断连击）；配到陷阱扣 1 颗心，Mia 说为什么。
   3 秒内接着连算连击，分数 ×连击数（最多 ×5）；连到 5 回 1 颗心。消完一屏 +10 秒，补一屏新的，
   新一屏第一对接着刚才的意思往下走（意思链）。看详情时计时停住。
   「今日一屏」：按日期定好的一屏，同一天谁打都是这一屏，清完就结束，比用时（只记在这台手机上）。
   打完报给社区：练一组补 1 颗心（≥10 对、≥2 分钟，服务器判）。只在挂进社区（同一个网址、登录了）时报。 */
import { TOPICS } from './data.js';
import { DETAILS } from './details.js';
import { DETAILS_NEW } from './details-new.js';

const DET = { ...DETAILS, ...DETAILS_NEW };
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ROUND_MS = 150_000, DAILY_MS = 90_000, HEARTS = 3, REAL = 7, COMBO_MS = 3000, CLEAR_BONUS_MS = 10_000;
const STAR_AT = [10, 20, 30];
const APP_ID = 'synonym-match';
const qs = new URLSearchParams(location.search);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 锦囊：j21、j22 由「攻略」写，社区里的网址（slug）还没定，定了填在这里；没填时只显示书名、标「快上架」。
const GUIDES = [
	{ id: 'j21', title: '认识不等于认得出', sub: '单词都认识，换个说法就认不出来了', slug: null },
	{ id: 'j22', title: '像同义的不一定能换', sub: 'nearly ≠ about：长得像的词差在哪', slug: null },
];

/* ---------- 声音、震动 ---------- */
const SND_KEY = 'vibes.synonym.sound';
let soundOn = true;
try { soundOn = localStorage.getItem(SND_KEY) !== '0'; } catch { /* 私密模式 */ }
const S = {};
let actx = null;
function play(n, v = 1) {
	if (!soundOn) return;
	if (!S[n]) { S[n] = new Audio(`./sounds/${n}.mp3`); S[n].preload = 'auto'; }
	const a = S[n].cloneNode(); a.volume = Math.min(1, v); a.play().catch(() => {});
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
	tune([523 * k, 659 * k], 'triangle', 0.06, 0.18, 0.1);
	if (level >= 3) setTimeout(() => tune([659 * k * 2], 'sine', 0.05, 0.25, 0.08), 110);
}
const buzz = p => { if (soundOn && navigator.vibrate) try { navigator.vibrate(p); } catch { /* 不支持 */ } };
function drawSnd() { $('#sndBtn').textContent = soundOn ? '🔊' : '🔇'; }
$('#sndBtn').onclick = () => { soundOn = !soundOn; try { localStorage.setItem(SND_KEY, soundOn ? '1' : '0'); } catch { /* */ } drawSnd(); play('tap'); };
drawSnd();

// 读单词：用手机自带的英式发音（不联网、不花钱）；读的时候不看声音开关，因为是自己点的
function speak(text) {
	if (!('speechSynthesis' in window)) { toast('这个浏览器读不了发音'); return; }
	const ss = speechSynthesis; ss.cancel();
	const u = new SpeechSynthesisUtterance(text);
	const vs = ss.getVoices();
	u.voice = vs.find(v => v.lang === 'en-GB') ?? vs.find(v => /^en[-_]/i.test(v.lang)) ?? null;
	u.lang = u.voice?.lang ?? 'en-GB'; u.rate = 0.92;
	ss.speak(u);
}

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
if (fromQuest) { $('#mapBtn').href = $('#backLink').href; $('#mapBtn').classList.remove('hide'); }

/* ---------- 本机记录 ---------- */
const BEST_KEY = 'vibes.synonym.best', LOCAL_WB = 'vibes.synonym.wordbook', DAYS_KEY = 'vibes.synonym.days', DAILY_KEY = 'vibes.synonym.daily';
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } };
const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return dayStr(d); };
// 每个场景打过哪几天（只记在这台手机上），用来画「连了几天」和最近 7 天的点
function markDay(id) { const all = load(DAYS_KEY, {}); const l = all[id] ?? []; const t = dayStr(); if (!l.includes(t)) { l.push(t); all[id] = l.slice(-60); save(DAYS_KEY, all); } }
function streakOf(id) {
	const l = new Set(load(DAYS_KEY, {})[id] ?? []);
	let i = l.has(daysAgo(0)) ? 0 : 1, n = 0; // 今天还没打，昨天连着也算没断
	while (l.has(daysAgo(i))) { n++; i++; }
	return n;
}
const last7 = id => { const l = new Set(load(DAYS_KEY, {})[id] ?? []); return [6, 5, 4, 3, 2, 1, 0].map(i => l.has(daysAgo(i))); };

/* ---------- 词对索引：详情页用 ---------- */
const LOOK = new Map();
TOPICS.forEach(t => { t.pairs.forEach(p => LOOK.set(`${p.a}|${p.b}`, { pair: p, topic: t })); t.traps.forEach(p => LOOK.set(`trap:${p.a}|${p.b}`, { trap: p, topic: t })); });
const pairKey = p => `${p.a}|${p.b}`;

/* ---------- 开局页 ---------- */
let topic = TOPICS.find(t => t.id === qs.get('topic')) ?? TOPICS[0];
function starsOf(n) { return STAR_AT.filter(x => n >= x).length; }
function drawHome() {
	const best = load(BEST_KEY, {});
	$('#topics').innerHTML = TOPICS.map(t => {
		const s = best[t.id] ? starsOf(best[t.id].pairs) : 0;
		return `<button class="tp" role="tab" data-id="${t.id}" aria-selected="${t.id === topic.id}">${t.zh}${s ? `<span class="st">${'★'.repeat(s)}</span>` : ''}</button>`;
	}).join('');
	$('#tCount').textContent = TOPICS.length;
	$('#tZh').textContent = topic.zh; $('#tEn').textContent = topic.en;
	$('#homeSay').innerHTML = topic.mia;
	const b = best[topic.id], sk = streakOf(topic.id);
	$('#best').innerHTML = (b ? `最好成绩 <b>${b.score}</b> 分 · 一局消了 ${b.pairs} 对` : '') + (sk >= 2 ? `${b ? ' · ' : ''}连打 <b>${sk}</b> 天` : '');
	$$('.tp').forEach(el => { el.onclick = () => { topic = TOPICS.find(t => t.id === el.dataset.id); play('tap'); drawHome(); }; });
	const sel = $('.tp[aria-selected="true"]'); if (sel) sel.scrollIntoView({ inline: 'center', block: 'nearest' });
	const d = load(DAILY_KEY, {});
	$('#dailySub').textContent = d.date === dayStr() ? `今天最快 ${(d.ms / 1000).toFixed(1)} 秒` : `今天：${dailyTopic().zh}`;
}

/* ---------- 全部场景 ---------- */
function openScenes() {
	const best = load(BEST_KEY, {});
	$('#sgrid').innerHTML = TOPICS.map(t => {
		const s = best[t.id] ? starsOf(best[t.id].pairs) : 0, sk = streakOf(t.id);
		return `<button class="scard${t.id === topic.id ? ' on' : ''}" data-id="${t.id}">
			<b>${t.zh}</b><i lang="en">${t.en}</i>
			<span class="sn">${t.pairs.length} 对 · ${t.traps.length} 个陷阱</span>
			<span class="sst">${[0, 1, 2].map(i => `<em class="${i < s ? 'on' : ''}">★</em>`).join('')}</span>
			<span class="dots" title="最近 7 天">${last7(t.id).map(x => `<u class="${x ? 'on' : ''}"></u>`).join('')}${sk >= 2 ? `<small>连 ${sk} 天</small>` : ''}</span>
		</button>`;
	}).join('');
	$$('.scard').forEach(el => { el.onclick = () => { topic = TOPICS.find(t => t.id === el.dataset.id); play('tap'); closePanel('#scenes'); drawHome(); }; });
	openPanel('#scenes');
}
function openPanel(id) {
	const el = $(id); el.classList.remove('hide'); el.scrollTop = 0;
	if (!RM) el.animate([{ transform: 'translateX(40px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.2,.9,.3,1)' });
}
function closePanel(id) { $(id).classList.add('hide'); }

/* ---------- 一局 ---------- */
let G = null;
const shuffle = (a, r = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = r() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
// 今日一屏：按日期算种子，同一天、同一个版本，谁打都是同一屏
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const daySeed = () => Number(dayStr().replaceAll('-', ''));
const dailyTopic = () => TOPICS[Math.floor(Date.UTC(...dayStr().split('-').map((x, i) => i === 1 ? x - 1 : +x)) / 86_400_000) % TOPICS.length];

function newGame(daily = false) {
	const t = daily ? dailyTopic() : topic;
	const rng = daily ? mulberry(daySeed()) : Math.random;
	G = {
		topic: t, daily, rng, hearts: HEARTS, score: 0, pairs: 0, combo: 0, bestCombo: 0, lastMatchAt: 0,
		startedAt: 0, endAt: 0, running: false, paused: false, sel: null,
		deck: shuffle(t.pairs.slice(), rng), lastG: null,
		traps: shuffle(t.traps.slice(), rng), trapHit: 0, trapDodged: 0, screens: 0,
		missed: new Map(), matched: [], lastKey: null, said10: false, fuse: null,
	};
}

// 抽一屏：7 对，同一屏同一条意思链只出一对、同一个词只出一次；第一对尽量接着上一屏最后消掉的意思链
function drawScreen() {
	const r = G.rng;
	if (G.deck.length < REAL) G.deck = shuffle(G.topic.pairs.filter(p => !G.deck.includes(p)), r).concat(G.deck);
	const trap = G.traps[G.screens % G.traps.length];
	G.screens++;
	const pick = [], gs = new Set(), words = new Set([trap.a, trap.b]);
	const free = p => !pick.includes(p) && !words.has(p.a) && !words.has(p.b);
	const take = p => { pick.push(p); gs.add(p.g); words.add(p.a); words.add(p.b); const i = G.deck.indexOf(p); if (i >= 0) G.deck.splice(i, 1); };
	if (G.lastG) { const p = G.deck.find(x => x.g === G.lastG && free(x)); if (p) take(p); }
	for (const p of G.deck.slice()) { if (pick.length >= REAL) break; if (free(p) && !gs.has(p.g)) take(p); }
	for (const p of [...G.deck, ...shuffle(G.topic.pairs.slice(), r)]) { if (pick.length >= REAL) break; if (free(p)) take(p); }
	const cards = [];
	pick.forEach((p, i) => { cards.push({ w: p.a, pid: i, pair: p }); cards.push({ w: p.b, pid: i, pair: p }); });
	cards.push({ w: trap.a, pid: 'trap', trap }); cards.push({ w: trap.b, pid: 'trap', trap });
	G.trapNow = trap; G.trapTouched = false;
	G.left = pick.length;
	return shuffle(cards, r);
}

// 字号自己缩到放得下：单词不在中间乱断，短语只在空格处换行，最多两行。
// 长单词（approximately、subsequently）缩到 13 号还放不下，就按音节加连字符断成两行（hyphens:auto），再不行缩到 9 号。
// 量宽度用 Range（文字真实占的宽），span 自己的 scrollWidth 在 block + max-width 下量不准。
function fit(el) {
	const sp = el.firstElementChild; const one = !sp.textContent.includes(' ');
	const rg = document.createRange(); rg.selectNodeContents(sp);
	const set = f => { sp.style.fontSize = f + 'px'; };
	const tooBig = (lines) => rg.getBoundingClientRect().width > el.clientWidth - 10 || sp.offsetHeight > el.clientHeight - 8 || (lines === 1 && sp.offsetHeight > parseFloat(sp.style.fontSize) * 1.3);
	sp.style.hyphens = sp.style.webkitHyphens = 'manual';
	let f = 18; set(f);
	while (f > (one ? 13 : 11) && tooBig(one ? 1 : 2)) set(f -= 0.5);
	if (!tooBig(one ? 1 : 2)) return;
	if (one) { sp.style.hyphens = sp.style.webkitHyphens = 'auto'; f = 15; set(f); }
	while (f > 9 && tooBig(2)) set(f -= 0.5);
}
function renderScreen(drop = true) {
	const cards = drawScreen();
	const board = $('#board'); board.innerHTML = '';
	cards.forEach((c, i) => {
		const el = document.createElement('button');
		el.className = 'card'; el.style.setProperty('--r', `${(Math.random() * 4 - 2).toFixed(1)}deg`);
		el.innerHTML = `<span lang="en">${c.w}</span>`; el.setAttribute('aria-label', c.w);
		el._c = c;
		el.addEventListener('pointerdown', e => dragStart(e, el));
		['pointerup', 'pointercancel'].forEach(e => el.addEventListener(e, () => el.classList.remove('down')));
		el.addEventListener('click', () => { if (dragEat) { dragEat = false; return; } tapCard(el); });
		board.appendChild(el); fit(el);
		if (document.fonts?.status !== 'loaded') document.fonts.ready.then(() => fit(el));
		if (drop && !RM) el.animate([{ transform: `translateY(-60px) rotate(${Math.random() * 20 - 10}deg)`, opacity: 0 }, { opacity: 1, offset: 0.4 }, { transform: `rotate(${el.style.getPropertyValue('--r')})`, opacity: 1 }], { duration: 350, delay: i * 30, easing: 'cubic-bezier(.34,1.5,.64,1)', fill: 'backwards' });
	});
}

function setLearn(html, key = null) {
	const l = $('#learn'); G.lastKey = key;
	l.innerHTML = html + (key ? '<span class="more">例句 ›</span>' : '');
	l.classList.toggle('open', !!key);
	if (!RM) l.animate([{ transform: 'scale(.97)' }, { transform: 'none' }], { duration: 180, easing: 'ease-out' });
}
function miaSay(html) { const b = $('#playSay'); b.innerHTML = html; if (!RM) b.animate([{ transform: 'scale(.85)', transformOrigin: '0 100%' }, { transform: 'none', transformOrigin: '0 100%' }], { duration: 420, easing: 'cubic-bezier(.34,1.8,.64,1)' }); }
function miaFrown(ms = 1400) {
	const m = $('#playMia'); m.querySelector('.eyes').style.display = 'none'; m.querySelector('.frown').style.display = '';
	clearTimeout(miaFrown.t); miaFrown.t = setTimeout(() => { m.querySelector('.eyes').style.display = ''; m.querySelector('.frown').style.display = 'none'; }, ms);
}

function tapCard(el) {
	if (!G?.running || G.paused || el.classList.contains('gone') || el._done) return;
	if (G.sel === el) { el.classList.remove('sel'); G.sel = null; play('tap', 0.4); return; }
	if (!G.sel) { el.classList.add('sel'); G.sel = el; play('tap', 0.7); buzz(8); return; }
	const a = G.sel, b = el; G.sel = null; a.classList.remove('sel');
	const ca = a._c, cb = b._c;
	if (ca.pid === 'trap' && cb.pid === 'trap') return hitTrap(a, b);
	if (ca.pid === cb.pid) return match(a, b);
	miss(a, b);
}

/* ---------- 拖着连：按住一张卡，拖到另一张上松手 ---------- */
let drag = null, dragEat = false;
function dragStart(e, el) {
	if (!G?.running || G.paused || el._done) return;
	el.classList.add('down');
	drag = { el, x: e.clientX, y: e.clientY, on: false, id: e.pointerId };
}
function wireLayer() {
	let svg = $('#wire');
	if (!svg) {
		svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.id = 'wire'; svg.setAttribute('class', 'wire');
		$('.boardwrap').appendChild(svg);
	}
	return svg;
}
const centerIn = (el, wr) => { const r = el.getBoundingClientRect(); return { x: r.left - wr.left + r.width / 2, y: r.top - wr.top + r.height / 2 }; };
// 两点之间一笔微弯的墨线
const curve = (p, q) => { const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1, k = Math.min(14, L * 0.12); return `M${p.x.toFixed(1)} ${p.y.toFixed(1)} Q${(mx - dy / L * k).toFixed(1)} ${(my + dx / L * k).toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`; };
document.addEventListener('pointermove', e => {
	if (!drag || e.pointerId !== drag.id) return;
	if (!drag.on && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 12) return;
	const wr = $('.boardwrap').getBoundingClientRect();
	if (!drag.on) {
		drag.on = true; drag.el.classList.remove('down');
		if (G.sel && G.sel !== drag.el) G.sel.classList.remove('sel');
		G.sel = drag.el; drag.el.classList.add('sel'); play('tap', 0.6); buzz(8);
		drag.path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); drag.path.setAttribute('class', 'live'); wireLayer().appendChild(drag.path);
	}
	const c = centerIn(drag.el, wr);
	drag.path.setAttribute('d', curve(c, { x: e.clientX - wr.left, y: e.clientY - wr.top }));
	const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('#board .card');
	$$('#board .card.hover').forEach(x => { if (x !== over) x.classList.remove('hover'); });
	if (over && over !== drag.el && !over._done) over.classList.add('hover');
});
document.addEventListener('pointerup', e => {
	if (!drag || e.pointerId !== drag.id) return;
	const d = drag; drag = null;
	d.el.classList.remove('down');
	if (!d.on) return; // 没拖动，就是普通的点，交给 click
	dragEat = true; setTimeout(() => { dragEat = false; }, 60); // 吃掉松手后浏览器补发的那一下 click
	d.path?.remove(); $$('#board .card.hover').forEach(x => x.classList.remove('hover'));
	const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('#board .card');
	if (over && over !== d.el && !over._done && G?.running && G.sel === d.el) tapCard(over);
});
document.addEventListener('pointercancel', () => { if (drag) { drag.path?.remove(); drag.el.classList.remove('down'); drag = null; } });

/* ---------- 连上、配错、踩陷阱 ---------- */
function match(a, b) {
	const p = a._c.pair, now = performance.now();
	a._done = b._done = true; a.style.pointerEvents = b.style.pointerEvents = 'none'; // 飞走的卡不再挡手
	G.combo = now - G.lastMatchAt < COMBO_MS ? G.combo + 1 : 1;
	G.lastMatchAt = now; G.bestCombo = Math.max(G.bestCombo, G.combo);
	const mult = Math.min(G.combo, 5), gain = 100 * mult;
	G.score += gain; G.pairs++; G.left--; G.lastG = p.g;
	const k = pairKey(p); if (!G.matched.includes(k)) G.matched.push(k);
	a.classList.add('ok'); b.classList.add('ok');
	play('stamp', 0.6); comboTune(G.combo); buzz(12);
	connect(a, b, p.zh, gain);
	setLearn(`<div><span class="pair" lang="en">${p.a}<em>＝</em>${p.b}</span><span class="zh">${p.zh}</span></div><div class="tip">${p.tip}</div>`, k);
	showCombo(G.combo);
	if (G.combo === 5) {
		if (G.hearts < HEARTS) { G.hearts++; drawHearts(); play('heartup', 0.7); miaSay('满了！<b>回 1 颗心</b>'); }
		else miaSay('×5 满了！心本来就是满的。');
	} else if (G.combo === 3) miaSay('<b>手感来了</b>，接着连。');
	drawHud(true);
	if (G.left === 1) $$('#board .card').forEach(c => { if (!c._done && c._c.pid !== 'trap') c.classList.add('last'); });
	if (G.left === 0) setTimeout(clearScreen, RM ? 200 : 620);
}

function miss(a, b) {
	breakCombo(true);
	[a, b].forEach(el => { if (el._c.pair) G.missed.set(pairKey(el._c.pair), { pair: el._c.pair }); });
	[a, b].forEach(el => el.classList.add('no'));
	play('fail', 0.5); buzz([30, 40, 30]);
	shake([a, b]);
	const key = a._c.pair ? pairKey(a._c.pair) : b._c.pair ? pairKey(b._c.pair) : null;
	setLearn(`<div><span class="pair" lang="en">${a._c.w}<em>≠</em>${b._c.w}</span></div><div class="tip">${a._c.pair ? `${a._c.w}：${a._c.pair.zh}` : a._c.w}　·　${b._c.pair ? `${b._c.w}：${b._c.pair.zh}` : b._c.w}</div>`, key);
	setTimeout(() => [a, b].forEach(el => el.classList.remove('no')), 450);
	// 配错不扣心：让人敢试，代价是连击断掉；只有踩陷阱扣心
}

function hitTrap(a, b) {
	breakCombo(true); G.trapHit++; G.trapTouched = true;
	const t = a._c.trap, k = `trap:${t.a}|${t.b}`;
	G.missed.set(k, { trap: t });
	[a, b].forEach(el => el.classList.add('trap'));
	play('warn', 0.84); buzz([40, 30, 80]); shake([a, b]);
	// 板子往下一沉、两张卡中间盖个「陷阱」小章、Mia 皱眉
	if (!RM) $('#board').animate([{ transform: 'none' }, { transform: 'translateY(4px)', offset: 0.4 }, { transform: 'none' }], { duration: 120, easing: 'ease-out' });
	const wrap = $('.boardwrap'), wr = wrap.getBoundingClientRect(), ca = centerIn(a, wr), cb = centerIn(b, wr);
	const st = document.createElement('div'); st.className = 'tstamp'; st.textContent = '陷阱';
	st.style.left = `${Math.min(Math.max((ca.x + cb.x) / 2, 50), wr.width - 50)}px`; st.style.top = `${(ca.y + cb.y) / 2}px`;
	wrap.appendChild(st);
	st.animate([{ transform: 'rotate(-14deg) scale(2.2)', opacity: 0 }, { transform: 'rotate(-14deg) scale(1)', opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.8 }, { transform: 'rotate(-14deg) scale(1)', opacity: 0 }], { duration: RM ? 500 : 900, easing: 'ease-out' }).onfinish = () => st.remove();
	miaFrown();
	setLearn(`<div><span class="pair" lang="en">${t.a}<em>≠</em>${t.b}</span><span class="zh">陷阱</span></div><div class="tip">${t.why}</div>`, k);
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
	play('heartbreak', 0.96); buzz(G.hearts <= 0 ? 120 : 60);
	const after = () => { drawHearts(); if (G.hearts <= 0) endGame('hearts'); };
	if (svg && !RM) svg.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.6)', offset: 0.2 }, { transform: 'translateY(30px) rotate(40deg)', opacity: 0 }], { duration: 620, easing: 'ease-in' }).onfinish = after;
	else after();
	if (G.hearts <= 0) G.running = false;
}

/* 连上：两张卡之间画一笔墨线（0.11 秒）→ 停一下（顿帧）→ 两张卡飞到上面那张的位置并到一起 →
   墨点盖住（卡宽 0.8 倍、毛边）→ 溅墨点 → 空出来的位置贴一张中文便签 0.9 秒。分数 +N 飘进右上角。 */
function connect(a, b, zh, gain) {
	const wrap = $('.boardwrap'), wr = wrap.getBoundingClientRect();
	const ca = centerIn(a, wr), cb = centerIn(b, wr);
	const ra = a.getBoundingClientRect();
	const [top, low] = (ca.y < cb.y - 4 || (Math.abs(ca.y - cb.y) <= 4 && ca.x <= cb.x)) ? [a, b] : [b, a];
	const T = top === a ? ca : cb;
	const done = () => { a.classList.add('gone'); b.classList.add('gone'); };
	$$('.boardwrap .note').forEach(n => n.remove());
	const note = document.createElement('div'); note.className = 'note'; note.textContent = zh;
	note.style.left = `${Math.min(Math.max(T.x, 64), wr.width - 64)}px`; note.style.top = `${T.y}px`;
	flyText(`+${gain}`, { x: (ca.x + cb.x) / 2 + wr.left, y: (ca.y + cb.y) / 2 + wr.top }, $('#score'));
	if (RM) { done(); wrap.appendChild(note); setTimeout(() => note.remove(), 900); return; }
	// 1 墨线
	const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	line.setAttribute('class', 'line'); line.setAttribute('d', curve(ca, cb)); wireLayer().appendChild(line);
	const len = line.getTotalLength();
	line.style.strokeDasharray = `${len}`;
	line.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 110, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'forwards' });
	// 2 顿帧：两张卡鼓一下停住
	[a, b].forEach(el => { const r = el.style.getPropertyValue('--r'); el.animate([{ transform: `rotate(${r})` }, { transform: `rotate(${r}) scale(1.1)` }], { duration: 110, fill: 'forwards', easing: 'ease-out' }); });
	const HOLD = 180; // 110 画线 + 70 顿
	// 3 飞到一起
	setTimeout(() => {
		line.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).onfinish = () => line.remove();
		[[a, ca], [b, cb]].forEach(([el, c]) => {
			const r = el.style.getPropertyValue('--r');
			el.animate([{ transform: `rotate(${r}) scale(1.1)` }, { transform: `translate(${T.x - c.x}px,${T.y - c.y}px) rotate(0deg) scale(.86)` }], { duration: 120, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' });
		});
		// 4 墨点：卡宽 0.8 倍
		const d = ra.width * 0.8;
		const ink = document.createElement('div'); ink.className = 'ink';
		Object.assign(ink.style, { width: `${d}px`, height: `${d}px`, left: `${T.x - d / 2}px`, top: `${T.y - d / 2}px` });
		wrap.appendChild(ink);
		ink.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.15)', offset: 0.5 }, { transform: 'scale(.2)', opacity: 0 }], { duration: 340, delay: 100, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' }).onfinish = () => ink.remove();
		setTimeout(done, 170);
		// 5 溅墨点
		for (let i = 0; i < 7; i++) {
			const dot = document.createElement('div'); dot.className = 'dot';
			Object.assign(dot.style, { left: `${T.x}px`, top: `${T.y}px` });
			const s = 0.6 + Math.random() * 0.8; dot.style.width = dot.style.height = `${(7 * s).toFixed(1)}px`;
			wrap.appendChild(dot);
			const ang = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 30;
			dot.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * dist - 3}px,${Math.sin(ang) * dist - 3 + 10}px) scale(.4)`, opacity: 0 }], { duration: 420, delay: 180, easing: 'cubic-bezier(.2,.8,.4,1)', fill: 'backwards' }).onfinish = () => dot.remove();
		}
		// 6 便签
		setTimeout(() => {
			wrap.appendChild(note);
			note.animate([{ opacity: 0, transform: 'translate(-50%,-50%) rotate(-2deg) scale(.6)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-2deg) scale(1)', offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' }).onfinish = () => note.remove();
		}, 240);
	}, HOLD);
}

// 飘字：从一个点飞进目标（分数、计时条）
function flyText(text, from, target, cls = '') {
	const app = $('#app'), ar = app.getBoundingClientRect(), tr = target.getBoundingClientRect();
	const el = document.createElement('div'); el.className = `fly ${cls}`; el.textContent = text;
	el.style.left = `${from.x - ar.left}px`; el.style.top = `${from.y - ar.top}px`;
	app.appendChild(el);
	if (RM) { setTimeout(() => el.remove(), 500); return; }
	const dx = tr.left + tr.width / 2 - from.x, dy = tr.top + tr.height / 2 - from.y;
	el.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-90%) scale(1.15)', opacity: 1, offset: 0.25 }, { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.7)`, opacity: 0.9 }], { duration: 650, easing: 'cubic-bezier(.4,0,.6,1)' }).onfinish = () => el.remove();
}

/* ---------- 连击：上面一条 ×N，带一根 3 秒的引线；最后 1 秒变红抖，烧完没接上就断 ---------- */
function showCombo(n) {
	const el = $('#combo'), wrap = $('.boardwrap');
	wrap.classList.toggle('fire', n >= 4);
	stopFuse();
	if (n < 2) { el.style.opacity = 0; return; }
	el.innerHTML = `<span class="cx">×${Math.min(n, 5)}</span><small>${n >= 5 ? '连击 · 满' : '连击'}</small><i class="fuse"></i>`;
	el.style.opacity = 1;
	el.getAnimations().forEach(x => x.cancel());
	if (!RM) el.animate([{ transform: 'rotate(-8deg) scale(1.8)', opacity: 0 }, { transform: 'rotate(-4deg) scale(1)', opacity: 1, offset: 0.5 }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.34,1.6,.64,1)' });
	startFuse(COMBO_MS);
}
function startFuse(rem) {
	const fz = $('#combo .fuse'); if (!fz) return;
	const k = Math.max(0, rem / COMBO_MS);
	const anim = fz.animate([{ transform: `scaleX(${k})` }, { transform: 'scaleX(0)' }], { duration: rem, easing: 'linear', fill: 'forwards' });
	const hot = setTimeout(() => {
		fz.classList.add('hot');
		if (!RM) $('#combo').animate([0, -2, 2, -2, 2, 0].map(x => ({ transform: `translateX(${x}px)` })), { duration: 260, iterations: 4 });
	}, Math.max(0, rem - 1000));
	const end = setTimeout(() => breakCombo(false), rem);
	G.fuse = { anim, hot, end };
}
function stopFuse() { if (G?.fuse) { clearTimeout(G.fuse.hot); clearTimeout(G.fuse.end); G.fuse.anim.cancel(); G.fuse = null; } }
// 连击断了：标签墨点一散，轻轻一声
function breakCombo(byMistake) {
	const had = G.combo >= 2;
	G.combo = 0; stopFuse(); $('.boardwrap').classList.remove('fire');
	const el = $('#combo');
	if (!had || el.style.opacity === '0') { el.style.opacity = 0; return; }
	if (!byMistake) play('tap', 0.3);
	if (!RM) {
		const app = $('#app'), ar = app.getBoundingClientRect(), r = el.getBoundingClientRect();
		for (let i = 0; i < 6; i++) {
			const dot = document.createElement('div'); dot.className = 'dot'; dot.style.zIndex = 30;
			Object.assign(dot.style, { left: `${r.left - ar.left + 16 + Math.random() * 30}px`, top: `${r.top - ar.top + r.height / 2}px` });
			app.appendChild(dot);
			const ang = Math.random() * Math.PI * 2, dist = 12 + Math.random() * 18;
			dot.animate([{ transform: 'translate(-50%,-50%)', opacity: 0.9 }, { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 8}px) scale(.3)`, opacity: 0 }], { duration: 380, easing: 'ease-out' }).onfinish = () => dot.remove();
		}
	}
	el.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.9)' }], { duration: 200, fill: 'forwards' }).onfinish = () => { el.style.opacity = 0; el.getAnimations().forEach(x => x.cancel()); };
}

function clearScreen() {
	if (!G.running) return;
	if (!G.trapTouched) { G.trapDodged++; G.score += 200; }
	if (G.daily) { G.score += 300; drawHud(true); return endGame('daily'); }
	G.endAt += CLEAR_BONUS_MS; G.score += 300;
	// +10 秒的小签飞进计时条，计时条闪一下绿
	const br = $('#board').getBoundingClientRect();
	flyText('+10 秒', { x: br.left + br.width / 2, y: br.top + br.height / 2 }, $('.timer .bar'), 'sec');
	setTimeout(() => { const bar = $('.timer .bar'); bar.classList.add('gain'); setTimeout(() => bar.classList.remove('gain'), 600); }, 600);
	if (!G.trapTouched) { toast(`躲过了 ${G.trapNow.a} / ${G.trapNow.b}`); miaSay('陷阱都没碰，<b>眼神好</b>。'); }
	play('whoosh', 0.6); setTimeout(() => play('bookflip', 0.6), 120);
	drawHud(true);
	renderScreen(true);
}

// 分数滚着变
let shownScore = 0;
function drawHud(roll = false) {
	const el = $('#score'), to = G.score, from = shownScore; shownScore = to;
	if (!roll || RM || to === from) el.textContent = to;
	else {
		const t0 = performance.now();
		const step = now => { const k = Math.min(1, (now - t0) / 380); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1 && shownScore === to) requestAnimationFrame(step); };
		requestAnimationFrame(step);
		el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 300, delay: 350 });
	}
	$('#pCount').textContent = G.daily ? `今日一屏 · 还剩 ${G.left} 对` : G.pairs >= 10 ? `已消 ${G.pairs} 对 ✓` : `已消 ${G.pairs} 对 · 再 ${10 - G.pairs} 对补心`;
}

let raf = 0, lastTick = 0;
function loop() {
	if (!G.running || G.paused) return;
	const left = Math.max(0, G.endAt - Date.now());
	const total = Math.max(G.daily ? DAILY_MS : ROUND_MS, left);
	$('#bar').style.transform = `scaleX(${left / total})`;
	const s = Math.ceil(left / 1000);
	$('#clock').textContent = `${s / 60 | 0}:${String(s % 60).padStart(2, '0')}`;
	$('.timer').classList.toggle('hot', left <= 10_000);
	if (left <= 10_000 && !G.said10) { G.said10 = true; miaSay('最后 10 秒，<b>挑最有把握的</b>。'); }
	if (left <= 10_000 && s !== lastTick && s > 0) { lastTick = s; play('tick', 0.5); }
	if (left <= 0) return endGame('time');
	raf = requestAnimationFrame(loop);
}

/* ---------- 暂停：看详情、切到后台时计时停住，回来把停的时间补上 ---------- */
function pauseGame() {
	if (!G?.running || G.paused) return false;
	G.paused = true; G.pausedAt = Date.now(); G.pausedPerf = performance.now(); cancelAnimationFrame(raf);
	if (G.fuse) { G.fuseRem = Math.max(0, COMBO_MS - (performance.now() - G.lastMatchAt)); stopFuse(); } else G.fuseRem = 0;
	return true;
}
function resumeGame() {
	if (!G?.paused) return;
	const dt = Date.now() - G.pausedAt;
	G.endAt += dt; G.startedAt += dt; G.lastMatchAt += performance.now() - G.pausedPerf;
	G.paused = false;
	if (G.fuseRem > 0 && G.combo >= 2) startFuse(G.fuseRem);
	if (G.running) raf = requestAnimationFrame(loop);
}

function show(id) { ['#home', '#play'].forEach(s => $(s).classList.toggle('hide', s !== id)); }

async function startGame(daily = false) {
	newGame(daily);
	show('#play');
	shownScore = 0;
	$('#pTopic').textContent = daily ? `今日一屏 · ${G.topic.zh}` : `${G.topic.zh} · ${G.topic.en}`;
	$('#learn').innerHTML = '<span class="hint">先找一对你最有把握的。连上之后点这里看例句。</span>'; $('#learn').classList.remove('open');
	miaSay(daily ? '今天人人都是这一屏。<b>清完就停表</b>，比谁快。' : '这屏藏着 1 对<b>长得像</b>的陷阱，别配它。');
	$('#combo').style.opacity = 0; $('.boardwrap').classList.remove('fire');
	$$('.boardwrap .note, #wire').forEach(n => n.remove());
	drawHearts(); drawHud();
	const ms = daily ? DAILY_MS : (Number(qs.get('roundms')) || ROUND_MS);
	$('#bar').style.transform = 'scaleX(1)'; $('#clock').textContent = `${ms / 60000 | 0}:${String(Math.round(ms / 1000) % 60).padStart(2, '0')}`; $('.timer').classList.remove('hot');
	renderScreen(false);
	$$('#board .card').forEach(c => { c.style.visibility = 'hidden'; });
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
	G.startedAt = Date.now(); G.endAt = G.startedAt + ms; G.running = true;
	raf = requestAnimationFrame(loop);
}

/* ---------- 结算 ---------- */
function stamp(text, sub) {
	const el = $('#stamp'); el.innerHTML = `${text}<small>${sub}</small>`;
	play('stamp');
	return el.animate([{ transform: 'rotate(-14deg) scale(2.4)', opacity: 0 }, { transform: 'rotate(-14deg) scale(1)', opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.8 }, { transform: 'rotate(-14deg) scale(1)', opacity: 0 }], { duration: RM ? 700 : 1300, easing: 'ease-out', fill: 'forwards' }).finished;
}

async function endGame(why) {
	if (G.ended) return; G.ended = true; G.running = false; G.paused = false; cancelAnimationFrame(raf); stopFuse();
	const endedAt = Date.now(), usedMs = endedAt - G.startedAt;
	if (G.sel) G.sel.classList.remove('sel');
	// 收尾的声音：心打光才放「输了」；时间到、自己不打了放一声 whoosh；破纪录在结算页放 milestone
	if (why === 'hearts') play('lose', 0.5); else play('whoosh', 0.6);
	if (G.pairs > 0) markDay(G.daily ? 'daily' : G.topic.id);
	let isRec = false, stars;
	if (G.daily) {
		const cleared = why === 'daily';
		stars = cleared ? 1 + (G.trapHit === 0 ? 1 : 0) + (usedMs <= 40_000 ? 1 : 0) : 0;
		await stamp(cleared ? '清完了' : why === 'time' ? '时间到' : why === 'quit' ? '这屏先到这' : '心打光了', cleared ? `用了 ${(usedMs / 1000).toFixed(1)} 秒` : `还差 ${G.left} 对`);
		const d = load(DAILY_KEY, {});
		if (cleared && (d.date !== dayStr() || usedMs < d.ms)) { isRec = true; save(DAILY_KEY, { date: dayStr(), ms: usedMs, score: G.score }); }
	} else {
		stars = starsOf(G.pairs);
		await stamp(why === 'time' ? '时间到' : why === 'quit' ? '这局先到这' : '心打光了', `消了 ${G.pairs} 对`);
		const best = load(BEST_KEY, {}), prev = best[G.topic.id];
		isRec = G.score > 0 && (!prev || G.score > prev.score);
		if (isRec) { best[G.topic.id] = { score: G.score, pairs: Math.max(G.pairs, prev?.pairs ?? 0) }; save(BEST_KEY, best); }
		else if (prev && G.pairs > prev.pairs) { prev.pairs = G.pairs; save(BEST_KEY, best); }
	}
	openSheet(isRec && stars >= 1, stars, endedAt, why);
	if (!G.daily) report(endedAt);
}

function wordRow(k, i, list) {
	const it = LOOK.get(k); if (!it) return '';
	return it.pair
		? `<li data-k="${esc(k)}"><div class="w"><b lang="en">${it.pair.a} ＝ ${it.pair.b}</b><i>${it.pair.zh} · ${it.pair.tip}</i></div>${list === 'missed' ? `<button class="mini" data-i="${i}">＋生词本</button>` : '<span class="go2">›</span>'}</li>`
		: `<li class="trapline" data-k="${esc(k)}"><div class="w"><b lang="en">${it.trap.a} ≠ ${it.trap.b}</b><i>${it.trap.why}</i></div>${list === 'missed' ? `<button class="mini" data-i="${i}">＋生词本</button>` : '<span class="go2">›</span>'}</li>`;
}

function openSheet(isRec, stars, endedAt, why) {
	$('#stars').innerHTML = [0, 1, 2].map(() => '<span>★</span>').join('');
	$('#rec').classList.toggle('hide', !isRec);
	$('#rec').textContent = G.daily ? '今天最快' : '新纪录';
	// 一颗星都没拿到：给一条进度，告诉还差多少
	const sb = $('#starbar');
	if (stars === 0) {
		const need = G.daily ? G.left : STAR_AT[0] - G.pairs;
		const k = G.daily ? (REAL - G.left) / REAL : G.pairs / STAR_AT[0];
		sb.innerHTML = `${G.daily ? `这屏还差 ${need} 对就清完` : `再消 ${need} 对拿第 1 颗星`}<i><b style="width:${Math.round(k * 100)}%"></b></i>`;
		sb.classList.remove('hide');
	} else sb.classList.add('hide');
	const secs = Math.round((endedAt - G.startedAt) / 1000);
	$('#stats').innerHTML = (G.daily
		? [`${G.topic.zh}`, why === 'daily' ? `用时 ${((endedAt - G.startedAt) / 1000).toFixed(1)} 秒` : `连上 ${G.pairs} 对`, `最长连了 ${G.bestCombo} 对`]
		: [`消对 ${G.pairs} 对`, `最长连了 ${G.bestCombo} 对`, `用时 ${secs / 60 | 0}:${String(secs % 60).padStart(2, '0')}`])
		.map(t => `<span>${t}</span>`).join('') + (G.trapHit === 0 && G.trapDodged > 0 ? '<span class="eye">一个陷阱都没踩</span>' : '');
	$('#questLine').innerHTML = G.daily ? (() => { const d = load(DAILY_KEY, {}); return d.date === dayStr() ? `今天这台手机上最快 <b>${(d.ms / 1000).toFixed(1)} 秒</b>，明天换一屏。` : '明天换一屏。'; })() : '';
	// 这局连上的：每一对点开看详情
	$('#doneBox').classList.toggle('hide', G.matched.length === 0);
	$('#doneList').innerHTML = G.matched.map((k, i) => wordRow(k, i, 'done')).join('');
	$$('#doneList li').forEach(li => { li.onclick = () => openDetail(li.dataset.k); });
	const keys = [...G.missed.keys()], ms = [...G.missed.values()];
	$('#missedBox').classList.toggle('hide', ms.length === 0);
	$('#missed').innerHTML = keys.map((k, i) => wordRow(k, i, 'missed')).join('');
	$$('#missed .mini').forEach(btn => { btn.onclick = e => { e.stopPropagation(); addWords([ms[+btn.dataset.i]], [btn]); }; });
	$$('#missed li').forEach(li => { li.onclick = () => openDetail(li.dataset.k); });
	$('#addAll').onclick = () => addWords(ms, $$('#missed .mini'));
	$('#switchBtn').textContent = G.daily ? '回首页' : '换个场景';
	$('#veil').classList.remove('hide');
	requestAnimationFrame(() => $('#sheet').classList.add('open'));
	$('#sheet').scrollTop = 0;
	$$('#stars span').forEach((s, i) => {
		if (i >= stars) return;
		setTimeout(() => {
			s.classList.add('on'); tune([523 * Math.pow(1.26, i)], 'triangle', 0, 0.3, 0.12);
			if (!RM) s.animate([{ transform: 'scale(.3)' }, { transform: 'scale(1.35)', offset: 0.45 }, { transform: 'scale(.92)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 520 });
		}, 450 + i * 380);
	});
	if (stars >= 1) setTimeout(() => play(isRec ? 'milestone' : 'chest', 0.6), 450 + stars * 380);
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
	let okN = 0;
	for (const [m, b] of todo) {
		const words = m.pair
			? [{ text: m.pair.a, meaning: m.pair.zh, usage: `同义替换：${m.pair.a} = ${m.pair.b}。${m.pair.tip}` }]
			: [{ text: m.trap.a, meaning: m.trap.why, usage: `易混：${m.trap.a} ≠ ${m.trap.b}` }];
		try {
			if (!tk) throw new Error('nologin');
			for (const w of words) await api('lojo/words/add', { item: { text: w.text, kind: w.text.includes(' ') ? 'phrase' : 'word', meaning: w.meaning, usage: w.usage }, source: 'manual' });
			okN++;
		} catch {
			const list = load(LOCAL_WB, []); words.forEach(w => { if (!list.some(x => x.text === w.text)) list.push({ ...w, at: Date.now() }); }); save(LOCAL_WB, list);
		}
		b.classList.add('done'); b.textContent = '已记下';
	}
	toast(okN ? `已进生词本 ${okN} 条` : '先存在这台手机上了，登录后再点一次就能进生词本');
}

/* ---------- 词对详情：意思、词性、发音、例句、差在哪、进生词本、相关锦囊 ---------- */
let detailPaused = false;
function openDetail(k) {
	const it = LOOK.get(k); if (!it) return;
	const d = DET[k] ?? {};
	const isTrap = !!it.trap, p = it.pair ?? it.trap;
	detailPaused = pauseGame();
	$('#dPaused').classList.toggle('hide', !detailPaused);
	$('#dTitle').textContent = isTrap ? '长得像，不能换' : '这一对能互换';
	const word = (w, pos, zh) => `<div class="dw"><button class="say" data-say="${esc(w)}" aria-label="读 ${esc(w)}">🔊</button><div><b lang="en">${w}</b><span>${pos ? `<em>${pos}</em>` : ''}${zh ?? ''}</span></div></div>`;
	const src = isTrap ? '' : p.src === 'wn' ? 'WordNet 3.0 里两词在同一义项' : '按常见用法整理，WordNet 没直接收这对';
	const guides = GUIDES.map(g => g.slug
		? `<a class="gd" href="/guides/${encodeURIComponent(g.slug)}"><b>${g.title}</b><small>${g.sub}</small><span>›</span></a>`
		: `<div class="gd off"><b>${g.title}</b><small>${g.sub}</small><span>快上架</span></div>`).join('');
	$('#dBody').innerHTML = `
		<div class="dpair"><span lang="en">${p.a}</span><em>${isTrap ? '≠' : '＝'}</em><span lang="en">${p.b}</span></div>
		<p class="dzh">${isTrap ? '陷阱' : p.zh}<small>${it.topic.zh}</small></p>
		<div class="dwords">${word(p.a, d.pa, d.za)}${word(p.b, d.pb, d.zb)}</div>
		<section class="dsec"><h3>${isTrap ? '为什么不能换' : '差在哪'}</h3><p>${isTrap ? p.why : p.tip}</p>${d.diff ? `<p>${d.diff}</p>` : ''}${d.col ? `<p class="col"><b>常见搭配</b><span lang="en">${d.col}</span></p>` : ''}</section>
		${d.ex?.length ? `<section class="dsec"><h3>雅思话题例句</h3>${d.ex.map(e => `<div class="ex"><button class="say" data-say="${esc(e.en)}" aria-label="读例句">🔊</button><div><p lang="en">${e.en}</p><p class="zh">${e.zh}${e.t ? `<small>${e.t}</small>` : ''}</p></div></div>`).join('')}<p class="srcn">例句由 Vibes College 原创，不出自真题或词书。${src ? `同义关系：${src}。` : ''}</p></section>` : ''}
		<button class="go small dadd" id="dAdd">加进生词本</button>
		<section class="dsec"><h3>相关锦囊</h3>${guides}</section>`;
	$$('#dBody .say').forEach(b => { b.onclick = () => { speak(b.dataset.say); b.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 220 }); }; });
	$('#dAdd').onclick = () => addWords([isTrap ? { trap: p } : { pair: p }], [$('#dAdd')]);
	play('bookflip', 0.5);
	openPanel('#detail');
}
function closeDetail() {
	closePanel('#detail');
	if ('speechSynthesis' in window) speechSynthesis.cancel();
	if (detailPaused) { detailPaused = false; if (!document.hidden) resumeGame(); }
}

function closeSheet() { $('#sheet').classList.remove('open'); $('#veil').classList.add('hide'); }

/* ---------- 按钮 ---------- */
$('#goBtn').onclick = () => { play('tap'); startGame(false); };
$('#dailyBtn').onclick = () => { play('tap'); startGame(true); };
$('#againBtn').onclick = () => { const d = G?.daily; closeSheet(); startGame(d); };
$('#switchBtn').onclick = () => { const d = G?.daily; closeSheet(); show('#home'); drawHome(); if (!d) openScenes(); };
$('#quitBtn').onclick = () => { if (G?.running) endGame('quit'); };
$('#allBtn').onclick = () => { play('tap'); openScenes(); };
$('#scenesBack').onclick = () => closePanel('#scenes');
$('#detailBack').onclick = closeDetail;
$('#learn').onclick = () => { if (G?.lastKey) openDetail(G.lastKey); };
document.addEventListener('visibilitychange', () => {
	if (document.hidden) { if (pauseGame()) G.visPause = true; }
	else if (G?.visPause) { G.visPause = false; if (!detailPaused) resumeGame(); }
});
drawHome();
if (!RM) $('#demo').classList.add('run');
if (qs.has('autostart')) startGame(qs.get('autostart') === 'daily');

// 给测试脚本用：读当前屏的配对（不影响玩）
window.__sm = { state: () => G, topics: TOPICS, openDetail, openScenes, fit };
