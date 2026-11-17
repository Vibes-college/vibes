/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* Vibes 手感包 · 样稿（v0.1，2026-11-13，闯关体验设计）
 * 闯关和同义词连连看共用一套声音和动效，让学员觉得是一家的。
 * 声音：Kenney CC0 音效（sounds/CREDITS.txt）+ 浏览器现场合成的音符（我们自己做的，没有版权问题）。
 * 动效：GSAP（vendor/，GSAP 标准许可，免费可商用）。
 * 2026-11-13 社区工程搬进闯关（三段闯关的连击和难题爆点），从样稿原样拷来。
 */
(function () {
	const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
	let on = true, actx = null;
	const S = {};
	function play(n, v = 1, rate = 1) {
		if (!on) return;
		if (!S[n]) { S[n] = new Audio(`./sounds/${n}.mp3`); S[n].preload = 'auto'; }
		const a = S[n].cloneNode(); a.volume = Math.min(1, v); a.playbackRate = rate; a.play().catch(() => {});
	}
	function ctx() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } return actx; }
	// 一个音：f 频率，at 延迟秒，len 长度，vol 音量，type 波形
	function note(f, at = 0, len = 0.2, vol = 0.09, type = 'triangle') {
		const c = ctx(); if (!c || !on) return;
		const t = c.currentTime + 0.01 + at, o = c.createOscillator(), g = c.createGain();
		o.type = type; o.frequency.value = f;
		g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0008, t + len);
		o.connect(g).connect(c.destination); o.start(t); o.stop(t + len + 0.05);
	}
	// 低音「咚」：给第 4 级以上和难题爆点加分量
	function thump(at = 0, vol = 0.22) {
		const c = ctx(); if (!c || !on) return;
		const t = c.currentTime + 0.01 + at, o = c.createOscillator(), g = c.createGain();
		o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
		g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
		o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.25);
	}
	const buzz = p => { if (on && navigator.vibrate) try { navigator.vibrate(p); } catch { /* */ } };

	// 连击音阶：C 大调五声音阶往上爬（do re mi sol la do' re' mi' sol' la'），怎么连都不刺耳
	const LADDER = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];
	const step = i => LADDER[Math.min(i, LADDER.length - 1)];

	/* 连对第 n 题（n 从 1 开始）。一级比一级强：
	 * 1：两个音（跟现在闯关答对一样轻）
	 * 2：三个音往上走
	 * 3：三个音 + 高八度闪一下（「手感来了」）
	 * 4：四个音 + 低音咚 + 轻震
	 * 5+：琶音 + 咚 + 叮当 jingle（每 5 连一次），之后每多 1 连只升调不再加料，免得吵 */
	function combo(n) {
		const b = Math.max(0, n - 1);
		if (n === 1) { play('tap', 0.6); note(step(b), 0, 0.18); note(step(b + 2), 0.06, 0.2); return 1; }
		if (n === 2) { play('tap', 0.6); [0, 1, 2].forEach((k, i) => note(step(b + k), i * 0.055, 0.2, 0.09)); return 2; }
		if (n === 3) { play('stamp', 0.45); [0, 2, 4].forEach((k, i) => note(step(b + k), i * 0.055, 0.22, 0.1)); note(step(b + 4) * 2, 0.2, 0.3, 0.05, 'sine'); buzz(10); return 3; }
		if (n === 4) { play('stamp', 0.6); thump(0, 0.16); [0, 2, 4, 5].forEach((k, i) => note(step(b + k), i * 0.05, 0.25, 0.1)); note(step(b + 5) * 2, 0.22, 0.35, 0.05, 'sine'); buzz(14); return 4; }
		play('stamp', 0.7); thump(0, 0.2);
		[0, 2, 4, 5, 7].forEach((k, i) => note(step(Math.min(b, 4) + k), i * 0.045, 0.28, 0.1));
		if (n % 5 === 0) setTimeout(() => play('milestone', 0.55), 260);
		buzz([16, 40, 16]); return 5;
	}
	// 难题答对的爆点：先定格 0.12 秒（hit-stop），再咚 + 低三音 + 大和弦一起响
	function bigHit(cb) {
		setTimeout(() => {
			play('bosshit', 0.7); thump(0, 0.3);
			[523.25, 659.25, 783.99, 1046.5].forEach(f => note(f, 0.02, 0.6, 0.07));
			[1318.51, 1567.98, 2093].forEach((f, i) => note(f, 0.18 + i * 0.06, 0.35, 0.04, 'sine'));
			buzz([20, 30, 30]); cb && cb();
		}, RM ? 0 : 120);
	}
	// 断连击：不用刺耳的错误音。一声轻轻往下的「噗」，像吹灭蜡烛
	function breakSoft(had) {
		if (had >= 2) { note(392, 0, 0.18, 0.05, 'sine'); note(293.66, 0.09, 0.3, 0.045, 'sine'); }
		else play('fail', 0.35);
	}
	// 点亮第 i 颗星（0,1,2）：三个越来越高的铃音，第三颗加宝箱 jingle
	function star(i) {
		play('lighton', 0.4);
		note([1318.51, 1567.98, 2093][i], 0.03, 0.5, 0.08, 'sine');
		note([659.25, 783.99, 1046.5][i], 0.03, 0.4, 0.05);
		if (i === 2) setTimeout(() => play('chest', 0.6), 250);
		buzz(8);
	}
	// 锦囊命中：翻书声 + 两音上扬
	function guideHit() { play('bookflip', 0.7); note(783.99, 0.08, 0.2); note(1174.66, 0.16, 0.35, 0.08); }

	/* ---------- 动效 ---------- */
	function burst(x, y, n = 10, colors = ['#ECB637', '#E8603F', '#3E9E7A', '#2340A3'], spread = 70, host = document.body) {
		if (RM) return;
		for (let i = 0; i < n; i++) {
			const d = document.createElement('i'); d.className = 'jz-dot';
			d.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]}`;
			host.appendChild(d);
			const a = Math.random() * Math.PI * 2, r = spread * (0.5 + Math.random() * 0.7);
			gsap.to(d, { x: Math.cos(a) * r, y: Math.sin(a) * r - 10, scale: 0.2, opacity: 0, duration: 0.6 + Math.random() * 0.3, ease: 'power2.out', onComplete: () => d.remove() });
		}
	}
	function shake(el, px = 6) { if (RM) return; gsap.fromTo(el, { x: 0 }, { x: px, duration: 0.05, repeat: 5, yoyo: true, ease: 'none', clearProps: 'x' }); }

	window.Juice = { play, note, combo, bigHit, breakSoft, star, guideHit, burst, shake, RM, set sound(v) { on = v; }, get sound() { return on; } };
})();
