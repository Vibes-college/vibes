/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* 三段闯关（2026-11-13）：基础 → 专项 → 冲刺，照闯关体验设计的样稿（冲刺1111/闯关体验/三段地图/）。
   服务器在 lojo/quest/show 里给 route（星星、开没开、建设中、回炉、整套进行到哪），页面不自己算规则。
   quest.js 在 route 存在时调这里：画三段地图、站里的抽屉、方法卡、示范题；打关还是走 quest.js 原来的流程，
   冲刺的计时关走社区的老关卡页（/gate/ielts/<关>?quest=<站>&sets=…）。 */
window.VibesRoute = function (X) {
	const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
	const esc = X.esc, J = window.Juice;
	const D = () => X.D(), R = () => X.D()?.route;
	const SK = { reading: '阅读', listening: '听力' };
	const LOCK = '<svg class="lockico" viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="7" rx="2" fill="currentColor"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
	const COURSE = 'ielts';
	let view = null, subjF = null, subjS = 'listening', lastStars = null;

	const snd = (n, v) => { J.sound = X.soundOn(); J.play(n, v); };
	const stable = s => (s ?? 0) >= 2;
	const live = x => x.state !== 'building';

	/* ---------- 找站 ---------- */
	function all() {
		const r = R(); if (!r) return [];
		const out = [];
		for (const sk of r.base.skills) for (const x of sk.stations) out.push({ x, where: 'base', skill: sk.skill });
		for (const k of ['reading', 'listening']) for (const c of r.focus.skills[k].chains) for (const x of c.stations) out.push({ x, where: 'focus', skill: k, chain: c });
		for (const k of ['reading', 'listening']) for (const x of r.sprint[k].stations) out.push({ x, where: 'sprint', skill: k });
		for (const x of r.sprint.mixed.stations) out.push({ x, where: 'mixed', skill: 'mixed' });
		return out;
	}
	const find = id => all().find(f => f.x.id === id) ?? null;
	const recycleChains = () => new Set(R()?.recycle ?? []);
	// 回炉的小标挂在题型串的第一站
	const recycleOn = f => f.chain && recycleChains().has(f.chain.id) && f.chain.stations.find(live)?.id === f.x.id;

	/* ---------- 一科在哪 ---------- */
	function where(skill) {
		const r = R(), sk = r.focus.skills[skill];
		if (!r.focus.open) {
			const g = r.base.gate;
			return { stage: 0, f: g.done / Math.max(1, g.must.length), txt: `基础 · 必过 ${g.done}/${g.must.length}` };
		}
		if (!sk.stable) {
			const c = sk.chains.find(x => x.id === sk.active);
			return { stage: 1, f: sk.done / Math.max(1, sk.total), txt: c ? `专项 · ${c.id} ${c.zh}` : '专项' };
		}
		const sp = r.sprint[skill], i = sp.stations.find(x => live(x) && !stable(x.stars));
		return { stage: 2, f: sp.done / Math.max(1, sp.total), txt: i ? `冲刺 · ${i.id}` : '冲刺 · 都练稳了' };
	}
	function defaultView() {
		const r = R();
		if (!r.focus.open) return 'base';
		if (r.sprint.reading.open && r.sprint.listening.open) return 'sprint';
		return 'focus';
	}

	/* ---------- 画一个站 ---------- */
	function stationHTML(f, opts = {}) {
		const x = f.x, cls = ['st'];
		const state = x.state === 'building' ? 'build' : x.state === 'locked' ? 'lock' : 'open';
		if (state === 'build') cls.push('build');
		else if (state === 'lock') cls.push('lock');
		else { if (x.stars >= 3) cls.push('s3'); else if (x.stars >= 2) cls.push('s2'); if (x.stars >= 1 || opts.cur) cls.push('lit'); }
		if (opts.cur) cls.push('cur');
		if (x.tier === 'advanced' && !x.required) cls.push('adv');
		if (opts.timed) cls.push('timed');
		let badge = '';
		if (state === 'open') {
			if (recycleOn(f)) badge = '<span class="badge fire">回炉</span>';
			else if (x.stars === 1 && !opts.cur) badge = '<span class="badge fix">补</span>';
		}
		if (badge) cls.push('has-badge');
		const stars = state === 'build' || opts.nostar ? '' : [0, 1, 2].map(k => `<span class="${k < x.stars ? 'on' : ''}">★</span>`).join('');
		let sub = '';
		if (state === 'build') sub = '<span class="sub bd">建设中</span>';
		else if (x.tier === 'advanced' && !x.required) sub = '<span class="sub adv">进阶·选做</span>';
		else sub = `<span class="sub">${esc(opts.subText ?? '')}</span>`;
		const face = state === 'lock' ? LOCK : state === 'build' ? '🚧' : esc(opts.face ?? (/^[RLSB]/.test(x.id) && x.id.includes('-') ? x.id.split('-').pop() : x.id));
		return `<div class="${cls.join(' ')}" data-id="${esc(x.id)}" data-state="${state}">
			${opts.cur ? '<span class="here">在练</span>' : ''}${badge}
			<button class="node" aria-label="${esc(x.id)} ${esc(x.zh ?? '')}">${face}</button>
			<span class="lbl">${esc(x.id)}</span><span class="stars">${stars}</span>${sub}</div>`;
	}
	// 一排站里第一个开着、还没练稳的站是「在练」
	function row(list, mark) {
		let given = !mark;
		return '<div class="stations">' + list.map(f => {
			const cur = !given && f.x.state === 'open' && !stable(f.x.stars) && f.x.required !== false;
			if (cur) given = true;
			return stationHTML(f, { cur, ...(f.opts ?? {}) });
		}).join('') + '</div>';
	}

	/* ---------- 基础 ---------- */
	function drawBase() {
		const r = R(), g = r.base.gate;
		const ok = g.done >= g.must.length;
		let h = `<div class="mini">${ok ? '✅' : '🧱'} <span>${ok ? `<b>基础必过 ${g.must.length} 站都 ★★ 了</b>，专项已经开了。基础站随时能回来练，不挡路。`
			: r.focus.open && r.focus.byPlacement ? `<b>定级到了 ${esc(String(r.focus.placementBand ?? ''))} 分</b>，专项先开了。基础必过 ${g.done}/${g.must.length}，有空回来补。`
				: `<b>必过 ${g.must.length} 站拿到 ★★</b>（${g.must.map(esc).join('、')}）就开专项。现在 ${g.done}/${g.must.length}。`}</span></div>`;
		const GEAR = { dictation: ['🎧', '听写', '/dictation'], typing: ['⌨️', '打字', '/apps/typing/'], wordbook: ['📒', '生词本', '/apps/wordbook/'] };
		const gear = (r.base.gear ?? []).filter(k => GEAR[k]);
		if (gear.length) h += `<div class="layer-h">装备站 <small>小程序，练底子</small></div><div class="row" style="margin:8px 14px 0">${gear.map(k => `<button class="gear" data-gear="${k}">${GEAR[k][0]} ${GEAR[k][1]}<small>小程序</small></button>`).join('')}</div>`;
		for (const sk of r.base.skills) {
			const zh = sk.skill === 'vocab' ? '词汇线' : sk.skill === 'grammar' ? '语法线' : sk.skill;
			const list = sk.stations.map(x => ({ x: { ...x, zh }, where: 'base', opts: { face: x.id, subText: g.must.includes(x.id) ? '◆ 必过' : '' } }));
			h += `<div class="chain"><div class="ch-h"><i>${sk.skill === 'vocab' ? '词' : '语'}</i><b>${zh}</b><span class="pill ${sk.done >= sk.total ? 'ok' : 'lk'}">练稳 ${sk.done}/${sk.total}</span></div><p class="ch-sub">带 ◆ 的是必过站，其余随时练</p>${row(list, true)}</div>`;
		}
		$('#rt-base').innerHTML = h;
	}

	/* ---------- 专项 ---------- */
	function drawFocus() {
		const r = R(), skill = subjF, sk = r.focus.skills[skill];
		let h = '';
		if (!r.focus.open) h += `<div class="mini">🔒 <span><b>专项还没开。</b>基础必过 ${r.base.gate.must.length} 站拿到 ★★，或者定级到 ${r.base.gate.orPlacementAtLeast} 分以上就开。</span></div>`;
		const pr = sk.probe;
		h += `<div class="mini probe" data-probe="${esc(pr.id)}">🧭 <span><b>${esc(pr.zh)}</b> · ${pr.questions} 题，每个题型抽 2 题。做完按你最常错的题型重排顺序。</span>`
			+ (pr.done ? '<span class="pill ok" style="margin-left:auto">已做</span>' : r.focus.open ? '<button class="go" data-probe-go>摸底</button>' : '') + '</div>';
		for (const c of sk.chains) {
			const isNow = c.id === sk.active;
			const cls = c.building ? 'locked' : isNow ? 'now' : c.stable ? 'stable' : c.open ? '' : 'locked';
			const pill = c.building ? '<span class="pill bd">建设中</span>' : isNow ? '<span class="pill now">● 正在练</span>' : c.stable ? '<span class="pill ok">✓ 练稳</span>'
				: c.open ? '' : `<span class="pill lk">${LOCK.replace('lockico', 'lockico" style="width:10px;height:10px')} 前一个题型练稳后开</span>`;
			const sub = c.building ? '题目在写，先不挡路，不算进「这一科练稳」' : `必练 ${c.done} / ${c.total} 站练稳` + (c.stations.some(x => x.tier === 'advanced' && !x.required) ? ' · 进阶站选做（目标 7 分及以上变必练）' : '');
			const list = c.stations.map(x => ({ x, where: 'focus', skill, chain: c }));
			h += `<div class="chain ${cls}" data-chain="${esc(c.id)}"><div class="ch-h"><i>${esc(c.id)}</i><b>${esc(c.zh)}</b>${pill}${c.methodCard ? `<button class="card-btn" data-card="${esc(c.id)}">📜 方法卡</button>` : ''}</div><p class="ch-sub">${sub}</p>${row(list, isNow)}</div>`;
		}
		$('#rt-focusBody').innerHTML = h;
		$$('#rt-subjF button').forEach(b => b.classList.toggle('on', b.dataset.s === subjF));
		$('#rt-subjNote').textContent = `练稳 ${sk.chains.filter(c => c.stable && !c.building).length} / ${sk.chains.filter(c => !c.building).length} 个题型`;
		$('#rt-tgt').textContent = r.target ? `目标 ${r.target} 分 ›` : '设目标分 ›';
	}

	/* ---------- 冲刺 ---------- */
	function sprintSub(x) {
		if (x.short) return '缩短版';
		if (x.minutes) return `${x.minutes} 分钟`;
		if (x.kind === 'set') return '整套';
		return x.id.startsWith('SL') ? '只放一遍' : '';
	}
	function drawSprint() {
		const r = R(), skill = subjS, sp = r.sprint[skill];
		const fs = r.focus.skills;
		let h = runCard();
		const list = sp.stations.map(x => ({ x, where: 'sprint', skill, opts: { timed: true, subText: sprintSub(x) } }));
		h += `<div class="layer-h">${SK[skill]}计时 <small>${sp.open ? (skill === 'listening' ? '老关卡，录音只放一遍' : '老关卡，计时') : `${SK[skill]}专项练稳后开`}</small></div><div class="chain ${sp.open ? 'now' : 'locked'}">${row(list, sp.open)}</div>`;
		const short = sp.stations.find(x => x.short);
		if (short) h += `<div class="short"><b>${esc(short.id)} 是缩短版：${esc(short.note ?? '3 篇 30 题 45 分钟')}。</b>真考是 3 篇 40 题 60 分钟；我们每篇现在 10 题，先练这个长度，补齐题目后换成正式版。</div>`;
		const mx = r.sprint.mixed;
		h += `<div class="layer-h">混合关 <small>${mx.open ? '每章的 Boss，听力阅读混着考' : '听力、阅读专项都练稳后开'}</small></div><div class="chain ${mx.open ? '' : 'locked'}">${row(mx.stations.map(x => ({ x, where: 'mixed', opts: { face: 'B' } })), mx.open)}</div>`;
		const mk = r.sprint.mock;
		const mOpen = mk.state === 'open';
		h += `<div class="layer-h">模考</div><div class="mock ${mOpen ? '' : 'locked'}" data-mock="1"><span style="font-size:26px">${mk.state === 'building' ? '🚧' : mOpen ? '📝' : '🔒'}</span><span><b>听力整套 + 阅读整套</b><small>连着做，结束后看正确率和各题型对了几题。<br>${mk.state === 'building' ? '题目还在准备（建设中）' : mOpen ? '' : 'SL-5、SR-5 都拿到 ★ 后开'}</small></span><span class="nostar">不给星</span></div>`;
		if (mk.report) h += reportHTML(mk.report);
		$('#rt-sprintBody').innerHTML = h;
		$$('#rt-subjS button').forEach(b => b.classList.toggle('on', b.dataset.s === subjS));
		void fs;
	}
	function chainZh(id) {
		const r = R();
		for (const k of ['reading', 'listening']) { const c = r.focus.skills[k].chains.find(x => x.id === id); if (c) return `${c.id} ${c.zh}`; }
		return id === 'other' ? '其他' : id;
	}
	function reportHTML(rep) {
		const rows = Object.entries(rep.byChain ?? {}).sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total)
			.map(([c, x]) => `<tr><td>${esc(chainZh(c))}</td><td>${x.right} / ${x.total}</td></tr>`).join('');
		return `<div class="report"><b>上次模考</b> · ${esc(rep.at.slice(0, 10))} · 对 ${rep.right} / ${rep.total}（${Math.round(rep.right / Math.max(1, rep.total) * 100)}%）<table>${rows}</table><small style="color:var(--weak)">按题型分，最弱的在上面。这是练习难度，不是官方分数。</small></div>`;
	}
	// 整套（SR-5、SL-5）或模考在做：第几部分、去哪一关
	function runCard() {
		const run = R().run;
		if (!run) return '';
		const i = run.parts.findIndex(p => p == null);
		const name = run.station === R().sprint.mock.id ? '模考' : run.station;
		return `<div class="run"><b>${esc(name)} 做到第 ${i + 1} / ${run.parts.length} 部分</b>：${esc(run.gates[i])}。做完一部分回这里接着下一部分${run.station === 'SR-5' ? '，45 分钟从开始算' : ''}。
			<div class="row"><button class="a" data-run-go>去做第 ${i + 1} 部分 ›</button><button class="c" data-run-cancel>不做了</button></div></div>`;
	}

	/* ---------- 顶部 ---------- */
	function drawTop() {
		$$('#rt-cells .cell').forEach(c => c.classList.toggle('on', c.dataset.v === view));
		$$('#routewrap .view').forEach(v => v.classList.toggle('on', v.id === 'rt-' + view));
		$('#rt-tracks').innerHTML = [['listening', '听力', '听'], ['reading', '阅读', '读']].map(([k, zh, ch]) => {
			const w = where(k), pct = Math.min(99, (w.stage + Math.min(1, w.f)) / 3 * 100);
			return `<div class="track"><b>${zh}</b><div class="rail"><div class="fill" style="width:${pct}%"></div><i class="tick" style="left:33.3%"></i><i class="tick" style="left:66.6%"></i><span class="pin" style="left:${pct}%">${ch}</span></div><em>${esc(w.txt)}</em></div>`;
		}).join('');
	}

	const SHELL = `
		<div class="stagebar"><div class="cells" id="rt-cells">
			<button class="cell" data-v="base">基础<small>单词 · 语法</small></button>
			<button class="cell" data-v="focus">专项<small>按题型练</small></button>
			<button class="cell" data-v="sprint">冲刺<small>按考试计时</small></button>
		</div><div id="rt-tracks"></div></div>
		<section class="view" id="rt-base"></section>
		<section class="view" id="rt-focus"><div class="subj" id="rt-subjF"><button data-s="reading">阅读</button><button data-s="listening">听力</button><span id="rt-subjNote"></span></div>
			<div class="row" style="margin:2px 14px 0"><button class="tgt" id="rt-tgt"></button></div><div id="rt-focusBody"></div></section>
		<section class="view" id="rt-sprint"><div class="subj" id="rt-subjS"><button data-s="listening">听力</button><button data-s="reading">阅读</button><span>10 题对 8 题算过线</span></div><div id="rt-sprintBody"></div></section>
		<div class="legend" id="rt-legend"></div>
		<p class="disc" id="rt-disc"></p>`;
	const LEGEND = [
		['background:var(--okBg);border-color:var(--ok)', '★★ 练稳，下一站开了'],
		['background:var(--mustard);border-color:var(--gold)', '★★★ 累计两次一题不错'],
		['border-color:var(--cta);box-shadow:0 0 0 3px rgba(232,96,63,.3)', '在练：正在打的那一站'],
		['background:var(--lockBg);border-color:var(--lock)', '锁住：前一站 ★★ 后开'],
		['border:2px dashed var(--build);background:#EDEAE4', '建设中：不挡路'],
		['border-style:dashed;width:14px;height:14px', '进阶·选做'],
	].map(([s, t]) => `<div><i class="lg" style="${s}"></i>${t}</div>`).join('')
		+ '<div><span class="badge fire" style="position:static;animation:none">回炉</span>这类题最近常错</div><div><span class="badge fix" style="position:static">补</span>点亮了，还没练稳</div>';

	function ensureShell() {
		let w = $('#routewrap');
		if (w) return w;
		w = document.createElement('div'); w.id = 'routewrap'; w.className = 'rt';
		w.innerHTML = SHELL;
		$('#mapwrap').appendChild(w);
		$('#rt-legend').innerHTML = LEGEND;
		const pg = document.createElement('div'); pg.className = 'rt rtpage'; pg.id = 'rt-page';
		$('#app').appendChild(pg);
		const st = document.createElement('div'); st.className = 'rt-stamp'; st.id = 'rt-stamp';
		$('#app').appendChild(st);
		w.addEventListener('click', onClick);
		pg.addEventListener('click', onPageClick);
		return w;
	}

	/* ---------- 画整张 ---------- */
	function draw() {
		const app = $('#app');
		if (!R()) { app.classList.remove('route'); return; }
		ensureShell();
		app.classList.add('route');
		if (view == null) view = defaultView();
		if (subjF == null) subjF = R().focus.skills.reading.stable && !R().focus.skills.listening.stable ? 'listening' : 'reading';
		$('#rt-disc').textContent = R().disclaimer ?? '这是练习难度，不是官方分数。';
		drawTop();
		if (view === 'base') drawBase();
		if (view === 'focus') drawFocus();
		if (view === 'sprint') drawSprint();
		$$('#routewrap .st.cur').forEach(n => { const sc = n.parentElement; sc.scrollLeft = Math.max(0, n.offsetLeft - sc.clientWidth / 2 + 32); });
		celebrate();
		recycleToast();
	}
	// 回到地图时：哪站星星涨了、哪站新开了，就在那站上响一下
	function celebrate() {
		const now = {};
		for (const f of all()) now[f.x.id] = { s: f.x.stars, st: f.x.state };
		const was = lastStars; lastStars = now;
		if (!was) return;
		let delay = 250;
		for (const [id, v] of Object.entries(now)) {
			const p = was[id]; if (!p) continue;
			const el = $(`#routewrap .st[data-id="${CSS.escape(id)}"] .node`);
			if (v.s > p.s) {
				const k = v.s - 1;
				setTimeout(() => { snd('lighton', 0.4); J.star(Math.min(2, k)); if (el) { gsap.fromTo(el, { scale: 1.6 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }); const b = el.getBoundingClientRect(); J.burst(b.left + b.width / 2, b.top + b.height / 2, 12); } }, delay);
				delay += 450;
				if (p.s < 2 && v.s >= 2) setTimeout(() => X.toast(`${id} 练稳了！`), delay);
			} else if (p.st === 'locked' && v.st !== 'locked' && v.st !== 'building') {
				setTimeout(() => { snd('stamp', 0.6); if (el) { el.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: 'smooth' }); gsap.fromTo(el, { scale: 0.3 }, { scale: 1, duration: 0.55, ease: 'back.out(2.6)' }); const b = el.getBoundingClientRect(); J.burst(b.left + b.width / 2, b.top + b.height / 2, 14); } X.toast(`${id} 开了`); }, delay);
				delay += 500;
			}
		}
	}
	// 回炉：一天最多提醒一次
	function recycleToast() {
		const rc = R().recycle ?? [];
		if (!rc.length) return;
		const key = 'vibesRouteRecycle', day = D().day ?? new Date().toISOString().slice(0, 10);
		let seen = null; try { seen = localStorage.getItem(key); } catch (e) { seen = null; }
		if (seen === day) return;
		try { localStorage.setItem(key, day); } catch (e) { /* 存不了就只提醒这一次 */ }
		setTimeout(() => X.toast(`🔥 ${rc.map(chainZh).join('、')} 最近常错，回去练一套（不扣星）`, 3200), 1200);
	}

	/* ---------- Vibi 一句话、底栏按钮 ---------- */
	function curStation() {
		const r = R();
		const rc = r.recycle?.[0];
		if (rc) { const f = all().find(g => g.chain?.id === rc && recycleOn(g)); if (f) return f; }
		if (!r.focus.open) return all().find(f => f.where === 'base' && f.x.state === 'open' && !stable(f.x.stars) && r.base.gate.must.includes(f.x.id)) ?? all().find(f => f.where === 'base' && f.x.state === 'open' && !stable(f.x.stars));
		for (const k of [subjF ?? 'reading', subjF === 'listening' ? 'reading' : 'listening']) {
			const sk = r.focus.skills[k];
			if (!sk.stable) { const c = sk.chains.find(x => x.id === sk.active); const x = c?.stations.find(y => y.state === 'open' && !stable(y.stars) && y.required); if (x) return find(x.id); }
			else { const x = r.sprint[k].stations.find(y => y.state === 'open' && !stable(y.stars)); if (x) return find(x.id); }
		}
		return null;
	}
	function line() {
		const r = R(), d = D();
		if (d.hearts <= 0) return '心打光了。<b>读本锦囊</b>或<b>练一组</b>，各补 1 颗。冲刺的计时关不用心。';
		if (r.run) return `${esc(r.run.station === r.sprint.mock.id ? '模考' : r.run.station)} 还在做：接着做第 ${r.run.parts.findIndex(p => p == null) + 1} 部分。`;
		const rc = r.recycle?.[0];
		if (rc) return `${esc(chainZh(rc))} 最近错得有点多，<b>先回去练一套</b>？练完不扣星，回炉的小标就摘掉。`;
		const f = curStation();
		if (!f) return '这一段都练稳了。去冲刺，或者回头把 ★★ 刷成 ★★★。';
		const x = f.x;
		if (x.stars === 1) return `${esc(x.id)} 再过线 1 次就<b>练稳</b>，下一站就开。`;
		if (f.where === 'base') return `先把基础打牢：<b>${esc(x.id)}</b> 连着过线两次就练稳。`;
		return `下一站 <b>${esc(x.id)} ${esc(x.zh ?? '')}</b>：对 4 题拿第 1 颗星，连着过线两次就练稳。`;
	}
	function dock() {
		const f = curStation(), go = $('#go');
		go.classList.remove('boss'); go.disabled = !f && !R().run;
		if (R().run) { $('#todayH').textContent = `${R().run.station === R().sprint.mock.id ? '模考' : R().run.station} 进行中`; $('#todayS').textContent = '接着做下一部分'; go.textContent = '接着做'; return; }
		if (!f) { $('#todayH').textContent = '都练稳了'; $('#todayS').textContent = '回头刷 ★★★，或者做模考'; go.textContent = '看地图'; go.disabled = true; return; }
		$('#todayH').textContent = `${f.x.id} · ${f.x.zh ?? ''}`;
		$('#todayS').textContent = f.where === 'sprint' ? '计时 · 10 题对 8 题过线' : '5 题 · 对 4 题过线';
		go.textContent = '去这站';
	}
	function goNow() {
		if (R().run) { runGo(); return; }
		const f = curStation(); if (!f) return;
		view = f.where === 'base' ? 'base' : f.where === 'focus' ? 'focus' : 'sprint';
		if (f.where === 'focus') subjF = f.skill; else if (f.where === 'sprint') subjS = f.skill;
		draw();
		openStation(f.x.id);
	}

	/* ---------- 点 ---------- */
	function onClick(e) {
		const t = e.target;
		const cell = t.closest('#rt-cells .cell'); if (cell) { view = cell.dataset.v; snd('tap', 0.5); draw(); gsap.from('#routewrap .view.on', { y: 8, opacity: 0, duration: 0.22 }); return; }
		const sf = t.closest('#rt-subjF button'); if (sf) { subjF = sf.dataset.s; snd('tap', 0.5); draw(); return; }
		const ss = t.closest('#rt-subjS button'); if (ss) { subjS = ss.dataset.s; snd('tap', 0.5); draw(); return; }
		if (t.closest('#rt-tgt')) { targetSheet(); return; }
		const g = t.closest('[data-gear]'); if (g) { snd('tap', 0.5); X.gearGo({ dictation: '/dictation', typing: '/apps/typing/', wordbook: '/apps/wordbook/' }[g.dataset.gear], null); return; }
		const pg = t.closest('[data-probe]'); if (pg) { probeSheet(pg.dataset.probe); return; }
		const cb = t.closest('[data-card]'); if (cb) { openCard(cb.dataset.card); return; }
		if (t.closest('[data-run-go]')) { runGo(); return; }
		if (t.closest('[data-run-cancel]')) { runCancel(); return; }
		if (t.closest('[data-mock]')) { mockTap(); return; }
		const n = t.closest('.st .node'); if (!n) return;
		const s = n.closest('.st');
		if (s.dataset.state === 'lock') { snd('fail', 0.25); J.shake(n, 4); X.toast('前一站拿到 ★★ 就开'); return; }
		if (s.dataset.state === 'build') { snd('tap', 0.4); X.toast('这一站的题还在写，先跳过，不挡路'); return; }
		openStation(s.dataset.id);
	}

	/* ---------- 站里：抽屉 ---------- */
	function hintOf(f) {
		const x = f.x, node = x.level ? X.NODE()[x.level] : null;
		const sprint = f.where === 'sprint' && x.kind !== 'level';
		if (recycleOn(f)) return `🔥 <b>回炉</b>：最近 7 天这类题错得多。再过线一次就摘掉，不扣星。`;
		if (x.stars >= 3) return '三颗都满了。随时回来练手，保持手感。';
		if (x.stars === 2) return sprint ? '练稳了。再有 2 次对 9 成以上（累计）就有第 3 颗。' : '练稳了。再有 2 次一题不错（累计）就有第 3 颗。';
		if (x.stars === 1) return '<b>再连着过线</b>就练稳，下一站就开。星星不会掉。';
		if (sprint) return '10 题对 8 题拿第 1 颗星，连着过线两次练稳；★★★ 要两次对 9 题以上。';
		return node?.timed ? '限时关：对 4 题拿第 1 颗星，连着过线两次就练稳。' : '对 4 题拿第 1 颗星，连着过线两次就练稳。';
	}
	function openStation(id) {
		const f = find(id); if (!f) return;
		const x = f.x, node = x.level ? X.NODE()[x.level] : null;
		const sprintGate = f.where === 'sprint' && x.kind !== 'level';
		const stars = [0, 1, 2].map(k => `<span class="${k < x.stars ? 'on' : ''}">★</span>`).join('');
		const tries = sprintGate ? x.tries : node?.tries ?? 0;
		const best = sprintGate ? x.best : node?.best;
		const last = tries ? `打过 ${tries} 次${best != null ? (sprintGate ? `，最好对 ${best}%` : `，最好对 ${best} 题`) : ''}` : '还没打过正式挑战';
		let s1 = '', s2 = '', s3;
		if (f.chain?.methodCard) s1 = '<button class="stp" data-go="1"><span class="n">1</span><span><b>学方法</b><small>方法卡 + 一道分步示范题 · 不计分</small></span><span class="go">›</span></button>';
		const gear = node?.gear;
		if (gear && !sprintGate) s2 = `<button class="stp" data-go="2"><span class="n">${s1 ? 2 : 1}</span><span><b>练手</b><small>去「${esc(gear.zh)}」练一组 · 不扣心 · 可以跳过</small></span><span class="go">›</span></button>`;
		const k = (s1 ? 1 : 0) + (s2 ? 1 : 0) + 1;
		const s3small = sprintGate
			? (x.kind === 'set' ? (x.short ? `缩短版：${esc(x.note ?? '3 篇 30 题 45 分钟')} · 对 24 题过线` : `整套 ${x.compose?.length ?? ''} 部分 · 连着做`) : '10 题 · 对 8 题过线 · 计时')
			: node?.kind === 'boss' ? 'Boss · 听力阅读混合' : node ? `${node.ask ?? 5} 题 · 对 ${node.need ?? 4} 题过线` : '';
		s3 = `<button class="stp main" data-go="3"><span class="n">${k}</span><span><b>正式挑战</b><small>${s3small}</small></span><span class="go">›</span></button>`;
		const html = `<div class="rt rts"><div class="sh-h"><b>${esc(x.id)} · ${esc(x.zh ?? node?.zh ?? '')}</b></div>
			<div class="sh-stars">${stars}</div><div class="last">${esc(last)}${x.level && f.where !== 'base' ? ` · 关卡 ${esc(x.level)}` : ''}</div>
			<div class="hint">${hintOf(f)}${x.short ? '<br><small>真考是 3 篇 40 题 60 分钟，这是缩短版。</small>' : ''}</div>
			<div class="steps3">${s1}${s2}${s3}</div>
			<div class="rulebox">★ 过线一次 · ★★ 最近两次都过线 = 练稳，开下一站 · ★★★ ${sprintGate ? '累计两次对 9 成以上' : '累计两次一题不错'} · 星星只涨不掉</div></div>`;
		X.openSheet(html, b => {
			b.querySelector('[data-go="1"]')?.addEventListener('click', () => { X.closeSheet(true); openCard(f.chain.id); });
			b.querySelector('[data-go="2"]')?.addEventListener('click', () => { X.closeSheet(true); X.gearGo(gear.path, x.level); });
			b.querySelector('[data-go="3"]')?.addEventListener('click', () => { X.closeSheet(true); formal(f); });
		});
	}
	// 正式挑战：关卡走原来的流程；计时老关卡去社区的关卡页；整套先占一个整套
	function formal(f) {
		const x = f.x;
		if (x.level) { setTimeout(() => X.nodeTap(x.level), 320); return; }
		if (x.kind === 'gate') {
			const ready = (x.ready?.[0] ?? []).length ? x.ready[0] : x.gates ?? [];
			const gate = ready[Math.floor(Math.random() * ready.length)];
			gateGo(gate, x.id, x.sets);
			return;
		}
		if (x.kind === 'set') startRun(x.id);
	}
	const gateGo = (gate, station, sets) => { snd('tap', 0.5); X.go(`/gate/${COURSE}/${encodeURIComponent(gate)}?quest=${encodeURIComponent(station)}&sets=${encodeURIComponent((sets ?? []).join(','))}`); };
	function startRun(station) {
		X.api('lojo/quest/run', { station }).then(r => { X.setD(r); draw(); runGo(); }).catch(e => X.toast(X.errText(e)));
	}
	function runGo() {
		const run = R()?.run; if (!run) return;
		const i = run.parts.findIndex(p => p == null); if (i < 0) return;
		gateGo(run.gates[i], run.station, run.sets);
	}
	function runCancel() {
		X.api('lojo/quest/run', { station: R().run.station, cancel: true }).then(r => { X.setD(r); X.toast('这次整套不做了，做过的部分不算星'); X.render(); }).catch(e => X.toast(X.errText(e)));
	}
	function mockTap() {
		const mk = R().sprint.mock;
		if (mk.state === 'building') { snd('tap', 0.4); X.toast('模考的题还在准备，先跳过'); return; }
		if (mk.state === 'locked') { snd('fail', 0.25); X.toast('SL-5、SR-5 都拿到 ★ 后开'); return; }
		X.openSheet(`<div class="rt rts"><div class="sh-h"><b>模考 · 听力整套 + 阅读整套</b></div>
			<div class="hint">先听力 4 部分，再阅读 3 篇，连着做。做完看总正确率和每个题型对了几题。<b>模考不给星</b>，只看哪类题最弱。</div>
			<div class="steps3"><button class="stp main" data-go="m"><span class="n">▶</span><span><b>开始模考</b><small>用 C 套题 · 一部分做完回来接着下一部分</small></span><span class="go">›</span></button></div></div>`,
		b => b.querySelector('[data-go="m"]').addEventListener('click', () => { X.closeSheet(true); startRun(mk.id); }));
	}
	function probeSheet(id) {
		const r = R(), sk = Object.values(r.focus.skills).find(s => s.probe.id === id);
		if (!sk) return;
		if (!r.focus.open) { snd('fail', 0.25); X.toast('专项开了才能摸底'); return; }
		const p = sk.probe;
		const res = p.done && p.wrong ? Object.entries(p.wrong).filter(([, n]) => n > 0).map(([c, n]) => `${esc(chainZh(c))} 错 ${n}`).join('、') : '';
		X.openSheet(`<div class="rt rts"><div class="sh-h"><b>${esc(p.zh)}</b></div>
			<div class="hint">${p.questions} 题，每个题型抽 2 题，<b>不扣心、不给星</b>。做完按你最常错的题型重排专项的顺序：最弱的先练。</div>
			${p.done ? `<div class="last">上次摸底 ${esc((p.at ?? '').slice(0, 10))}${res ? ` · ${res}` : ' · 都对了'}</div>` : ''}
			<div class="steps3"><button class="stp main" data-go="p"><span class="n">🧭</span><span><b>${p.done ? '再摸底一次' : '开始摸底'}</b><small>约 ${p.questions} 分钟</small></span><span class="go">›</span></button></div></div>`,
		b => b.querySelector('[data-go="p"]').addEventListener('click', () => { X.closeSheet(true); X.unlockAudio(); X.startLevel(p.id); }));
	}
	function targetSheet() {
		const cur = R().target;
		const opts = ['', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'].map(v => `<option value="${v}" ${String(cur ?? '') === v || (cur != null && Number(v) === cur) ? 'selected' : ''}>${v ? v + ' 分' : '还没定'}</option>`).join('');
		X.openSheet(`<div class="rt rts"><div class="sh-h"><b>目标分</b></div>
			<div class="hint">目标 <b>7 分及以上</b>，专项里的进阶站（R4-2、R5-2、L5 后三站）变成必练。改了不会锁回已经开的站。</div>
			<select id="rt-tsel" style="width:100%;height:44px;border-radius:12px;border:1.5px solid var(--ink);font-size:16px;margin-top:10px;background:var(--panel)">${opts}</select>
			<div class="steps3"><button class="stp main" data-go="t"><span class="n">✓</span><span><b>保存</b></span><span class="go">›</span></button></div></div>`,
		b => b.querySelector('[data-go="t"]').addEventListener('click', () => {
			const v = b.querySelector('#rt-tsel').value;
			X.api('lojo/quest/settings', { target: v ? Number(v) : null }).then(() => { X.closeSheet(true); X.refresh(); X.toast(v ? `目标 ${v} 分` : '目标分清掉了'); }).catch(e => X.toast(X.errText(e)));
		}));
	}

	/* ---------- 方法卡、示范题（整页） ---------- */
	let curChain = null, dStep = 0, dq = null;
	function chainById(id) { for (const k of ['reading', 'listening']) { const c = R().focus.skills[k].chains.find(x => x.id === id); if (c) return { c, skill: k }; } return null; }
	function openPage(html) { const p = $('#rt-page'); p.innerHTML = html; p.scrollTop = 0; requestAnimationFrame(() => p.classList.add('on')); }
	function closePage() { $('#rt-page').classList.remove('on'); }
	function openCard(cid) {
		const hit = chainById(cid); if (!hit) return;
		const c = hit.c; curChain = c;
		const src = c.methodSource || '';
		openPage(`<div class="pg-h"><button class="back" data-back>‹</button><b>${SK[hit.skill]} · ${esc(c.id)} ${esc(c.zh)} · 学方法</b><span class="prog"><i class="on"></i><i></i></span></div>
			<div class="mcard" id="rt-mcard"><div class="kick">📜 方法卡 <span>${esc(c.id)}</span></div><span class="time">约 20 秒读完</span>
				<h2>${esc(c.zh)}</h2><div class="txt">${String(c.methodCard).split(/(?<=。)/).filter(Boolean).map(t => `<p>${esc(t)}</p>`).join('')}</div>
				${/^0\d/.test(src) ? `<span class="src">📕 出自锦囊 ${esc(src.split('；')[0])}</span>` : ''}</div>
			${c.demoQ ? '<button class="big" data-demo>看一道示范题 ›</button>' : ''}
			<button class="big ghost" data-skip>${c.demoQ ? '我会了，直接去练' : '去练这一站 ›'}</button>`);
		snd('bookflip', 0.6);
		gsap.fromTo('#rt-mcard', { rotateX: 14, y: 24, opacity: 0 }, { rotateX: 0, y: 0, opacity: 1, duration: 0.42, ease: 'power3.out', delay: 0.12 });
		gsap.fromTo('#rt-mcard .txt p', { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.12, delay: 0.35 });
	}
	function openDemo() {
		const c = curChain; dq = c.demoQ; dStep = 0;
		const steps = c.demo?.steps ?? [];
		const TT = { TFNG: '判断题', YNNG: '判断题', gap: '填空', choice: '选择', multi: '选两个' };
		let q = `<span class="tag">示范 · 不计分</span><span class="tag" style="background:var(--accent)">${esc(TT[dq.type] ?? dq.type)}</span>`;
		if (dq.passage) q += `<div class="pass" id="rt-dPass" style="margin-top:8px">${esc(dq.passage)}</div>`;
		if (dq.listening) q += '<div class="audio" style="margin-top:8px"><i>🎧</i>听力题：录音原文在第 2 步</div>';
		const opts = dq.options ?? (dq.type === 'TFNG' ? ['TRUE', 'FALSE', 'NOT GIVEN'].map(k => ({ key: k, text: k })) : dq.type === 'YNNG' ? ['YES', 'NO', 'NOT GIVEN'].map(k => ({ key: k, text: k })) : null);
		if (opts && dq.type !== 'gap') q += `<div class="qq">${esc(dq.question ?? '')}</div><div class="opts" id="rt-opts">${opts.map(o => `<button class="opt" data-k="${esc(o.key)}">${esc(o.key === o.text ? o.text : o.key + '. ' + o.text)}</button>`).join('')}</div>`;
		else q += `<div class="qq">${esc(dq.question ?? '').replace(/_{3,}/, '<u id="rt-gap">　</u>')}</div>`;
		openPage(`<div class="pg-h"><button class="back" data-back>‹</button><b>${esc(c.id)} ${esc(c.zh)} · 示范题</b><span class="prog"><i class="on"></i><i class="on"></i></span></div>
			<div class="qbox">${q}</div>
			<div class="dsteps">${steps.map((s, i) => `<div class="dstep" id="rt-ds${i}"><div class="t"><i>${i + 1}</i>${esc(s.title)}</div><div class="x">${esc(s.text)}</div></div>`).join('')}
				<div class="dstep ask" id="rt-dsAsk"><div class="t"><i>?</i>你会选哪个？</div><div class="x">点一个选项试试，或者直接点「看答案」。猜错不扣心。</div></div></div>
			<div style="height:10px"></div>
			<button class="big next" id="rt-dNext">第 1 步 ›</button>
			<div id="rt-dEnd" style="display:none"><button class="big" data-skip>去练这一站 ›</button></div>`);
		snd('tap', 0.5);
	}
	function markEvidence() {
		const p = $('#rt-dPass'); if (!p || !dq.passage) return;
		const hl = curChain.demo?.highlight;
		const sents = dq.passage.split(/(?<=[.!?])\s+/);
		const ans = String(dq.answer ?? '').toLowerCase();
		const key = hl || sents.find(s => ans && s.toLowerCase().includes(ans)) || null;
		if (!key || !dq.passage.includes(key)) return;
		p.innerHTML = esc(dq.passage).replace(esc(key), `<mark>${esc(key)}</mark>`);
		requestAnimationFrame(() => setTimeout(() => p.querySelector('mark')?.classList.add('lit'), 60));
	}
	function reveal(picked) {
		const steps = curChain.demo?.steps ?? [], last = steps.length - 1;
		const opts = $('#rt-opts');
		if (opts) { opts.classList.remove('open'); $$('#rt-opts .opt').forEach(o => { if (String(dq.answer).split(',').includes(o.dataset.k)) o.classList.add('right'); else if (o.dataset.k === picked) o.classList.add('wrong'); }); }
		const g = $('#rt-gap'); if (g) g.textContent = dq.answer;
		if (last >= 0) { $('#rt-ds' + last).classList.add('on'); gsap.from('#rt-ds' + last, { y: 12, opacity: 0, duration: 0.25 }); }
		$('#rt-dsAsk').classList.remove('on');
		const right = !picked || String(dq.answer).split(',').includes(picked);
		const sp = $('#rt-stamp'); sp.textContent = picked ? (right ? '答对了' : '就是这里容易错') : '就是这样';
		sp.style.color = sp.style.borderColor = right ? '#2F7D5B' : '#E8603F';
		gsap.fromTo(sp, { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.22, ease: 'power3.in', onComplete: () => gsap.to(sp, { opacity: 0, delay: 0.7, duration: 0.3 }) });
		J.sound = X.soundOn();
		if (right) { J.play('pass', 0.5); J.combo(3); } else J.breakSoft(2);
		$('#rt-dNext').style.display = 'none'; $('#rt-dEnd').style.display = '';
	}
	function demoNext() {
		const steps = curChain.demo?.steps ?? [], last = steps.length - 1;
		if (dStep < last) {
			const el = $('#rt-ds' + dStep); el.classList.add('on');
			gsap.from(el, { y: 12, opacity: 0, duration: 0.25, ease: 'power2.out' });
			J.sound = X.soundOn(); J.note([659.25, 783.99, 987.77][dStep] || 880, 0, 0.18); snd('tap', 0.4);
			if (/原文|依据|录音/.test(steps[dStep].title)) markEvidence();
			dStep++;
			if (dStep === last) {
				const opts = $('#rt-opts');
				if (opts) { opts.classList.add('open'); $('#rt-dsAsk').classList.add('on'); gsap.from('#rt-dsAsk', { y: 12, opacity: 0, duration: 0.25 }); }
				$('#rt-dNext').textContent = '看答案 ›';
			} else $('#rt-dNext').textContent = `第 ${dStep + 1} 步 ›`;
			setTimeout(() => $('#rt-dNext').scrollIntoView({ block: 'end', behavior: X.RM ? 'auto' : 'smooth' }), 80);
		} else reveal(null);
	}
	// 「去练这一站」：回到地图，打开这个题型里在练的那一站
	function toStation() {
		closePage();
		const c = curChain, x = c.stations.find(y => y.state === 'open' && !stable(y.stars) && y.required) ?? c.stations.find(y => y.state === 'open' || y.state === 'done');
		if (x) setTimeout(() => openStation(x.id), 300); else X.toast('这个题型还没开：前一个题型练稳后开');
	}
	function onPageClick(e) {
		const t = e.target;
		if (t.closest('[data-back]')) { snd('tap', 0.4); closePage(); return; }
		if (t.closest('[data-demo]')) { openDemo(); return; }
		if (t.closest('[data-skip]')) { snd('tap', 0.5); toStation(); return; }
		if (t.closest('#rt-dNext')) { demoNext(); return; }
		const o = t.closest('#rt-opts.open .opt'); if (o) reveal(o.dataset.k);
	}

	/* ---------- 答题：连击和难题爆点 ---------- */
	let combo = 0;
	function judged(r, el, q) {
		if (!r.correct) { if (combo >= 2) { J.sound = X.soundOn(); J.breakSoft(combo); } combo = 0; return false; }
		combo++;
		J.sound = X.soundOn();
		if (q?.hard) {
			J.bigHit(() => { const b = el?.getBoundingClientRect?.(); if (b) J.burst(b.left + b.width / 2, b.top + b.height / 2, 18, undefined, 90); });
			return true;
		}
		if (combo >= 2) { J.combo(combo); return true; }
		return false;
	}
	const resetCombo = () => { combo = 0; };

	// 冲刺站、摸底在旧地图里没有点：给 startLevel 一个能用的样子
	function node(id) {
		const r = R(); if (!r) return null;
		for (const k of ['reading', 'listening']) { const p = r.focus.skills[k].probe; if (p.id === id) return { id, label: id, name: p.zh, zh: p.zh, kind: 'level', practice: true, ask: p.questions, need: 0 }; }
		return null;
	}
	// ?level=<站> 从老关卡页回来：打开那一站
	function handle(id) {
		const f = find(id); if (!f) return false;
		view = f.where === 'base' ? 'base' : f.where === 'focus' ? 'focus' : 'sprint';
		if (f.where === 'focus') subjF = f.skill; else if (f.where === 'sprint') subjS = f.skill;
		draw();
		setTimeout(() => openStation(id), 400);
		return true;
	}

	return { draw, line, dock, goNow, judged, resetCombo, node, handle, on: () => !!R(), closePage };
};
