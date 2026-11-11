/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* 闯关地图的「画」：每章自己的底色和地标、章与章之间的门。全部原创手绘 SVG（闯关体验设计 11-11 定稿，地图-第二三章/原型）。
   坐标都在本章 390×600 里；quest.js 把四章从下往上叠起来（第一章在最下面），章与章之间留 120 高的门带。
   第四章的地标和第三扇门是社区工程照第二扇门先画的占位，等设计出定稿再换。 */
(() => {
'use strict';

const STYLE = {
	1: { tint: '#F6F1E7', deep: '#E8603F' },
	2: { tint: '#E9F0E2', deep: '#3E9E7A' },
	3: { tint: '#EAE8F3', deep: '#2340A3' },
	4: { tint: '#F5EEDC', deep: '#C99520' },
};
const TRAM1 = 0.52;

const LAND = {
	// 第一章：小河从左边流进来、在 1-2 和 1-3 之间拐下去出图；两段山丘线；右下角公会
	1: () => `
		<path d="M-10 398 C 50 394, 110 408, 140 430 S 157 462, 160 500 S 168 580, 168 612" fill="none" stroke="#BFD7E6" stroke-width="12" stroke-linecap="round" opacity=".5"/>
		<path d="M12 118 q22 -14 44 0 t44 0" fill="none" stroke="#d8ccb4" stroke-width="1.4"/><path d="M300 126 q21 -13 42 0 t42 0" fill="none" stroke="#d8ccb4" stroke-width="1.4"/>
		<g class="nd lm-guild" transform="translate(345 565)"><path d="M-24 14 L-11 -8 L2 14 Z" fill="#ECB637" stroke="#141E52" stroke-width="1.5" stroke-linejoin="round"/><path d="M0 14 L12 -3 L24 14 Z" fill="#CFE6DA" stroke="#141E52" stroke-width="1.5" stroke-linejoin="round"/><text class="lab" x="0" y="30" text-anchor="middle">公会 · 本周榜</text></g>`,
	// 第二章「换挡」：小铁路、换挡信号杆、小电车、导览站、Boss 两张辩论讲台和一串小旗、左下一小块田
	2: () => {
		const R = 'M268 614 C 304 590, 344 562, 402 532', B = 'M330 572 Q 362 582 402 580';
		return `
		<g opacity=".9">
			<path d="${R}" fill="none" stroke="#9d907a" stroke-width="11" stroke-dasharray="2.5 7"/>
			<path d="${R}" transform="translate(-1.6 -2.8)" fill="none" stroke="#5f5646" stroke-width="1.5"/><path d="${R}" transform="translate(1.6 2.8)" fill="none" stroke="#5f5646" stroke-width="1.5"/>
			<path d="${B}" fill="none" stroke="#9d907a" stroke-width="11" stroke-dasharray="2.5 7"/>
			<path d="${B}" transform="translate(0 -3.2)" fill="none" stroke="#5f5646" stroke-width="1.5"/><path d="${B}" transform="translate(0 3.2)" fill="none" stroke="#5f5646" stroke-width="1.5"/>
		</g>
		<path class="railPath" d="${R}" fill="none" stroke="none"/>
		<g transform="translate(320 470)">
			<rect x="-3" y="-44" width="6" height="58" rx="2" fill="#FFFDF8" stroke="#141E52" stroke-width="1.5"/>
			<rect x="-12" y="12" width="24" height="8" rx="2" fill="#141E52"/>
			<g transform="rotate(38 0 -38)"><rect x="0" y="-43" width="34" height="10" rx="3" fill="#FFFDF8" stroke="#141E52" stroke-width="1.5"/><rect x="6" y="-43" width="7" height="10" fill="#E8603F"/><rect x="20" y="-43" width="7" height="10" fill="#E8603F"/></g>
			<circle cy="-38" r="4" fill="#ECB637" stroke="#141E52" stroke-width="1.3"/>
			<text class="lab" x="0" y="36" text-anchor="middle" font-size="11">换挡信号</text>
		</g>
		<g class="tram2" transform="translate(360 500)"><g transform="rotate(-6)">
			<rect x="-17" y="-16" width="34" height="18" rx="5" fill="#3E9E7A" stroke="#141E52" stroke-width="1.5"/>
			<rect x="-12" y="-12" width="8" height="7" rx="1.5" fill="#FFFDF8" stroke="#141E52"/><rect x="-1" y="-12" width="8" height="7" rx="1.5" fill="#FFFDF8" stroke="#141E52"/><rect x="10" y="-12" width="4" height="7" rx="1" fill="#ECB637" stroke="#141E52"/>
			<path d="M-6 -16 l6 -7 l6 7" fill="none" stroke="#141E52" stroke-width="1.3"/>
			<circle cx="-9" cy="3" r="3" fill="#141E52"/><circle cx="9" cy="3" r="3" fill="#141E52"/></g></g>
		<g transform="translate(322 122)">
			<rect x="-22" y="-8" width="44" height="26" fill="#FFFDF8" stroke="#141E52" stroke-width="1.5"/>
			<path d="M-27 -8 q5.4 7 10.8 0 q5.4 7 10.8 0 q5.4 7 10.8 0 q5.4 7 10.8 0 q5.4 7 10.8 0 v-8 h-54z" fill="#ECB637" stroke="#141E52" stroke-width="1.5" stroke-linejoin="round"/>
			<rect x="-10" y="0" width="20" height="18" fill="#E9F0E2" stroke="#141E52"/>
			<line x1="34" y1="18" x2="34" y2="-40" stroke="#141E52" stroke-width="2"/>
			<path d="M34 -36 l14 -8 v18 l-14 -6z" fill="#E8603F" stroke="#141E52" stroke-width="1.4" stroke-linejoin="round"/>
			<path d="M53 -40 q5 5 0 10 M57 -44 q9 9 0 18" fill="none" stroke="#141E52" stroke-width="1.3" stroke-linecap="round"/>
			<text class="lab" x="4" y="34" text-anchor="middle" font-size="11">导览站</text>
		</g>
		<path d="M128 52 Q195 26 262 52" fill="none" stroke="#141E52" stroke-width="1.2"/>
		${[0, 1, 2, 3, 4, 5, 6].map(i => { const t = (i + 0.5) / 7, x = 128 + 134 * t, y = 52 - 52 * t * (1 - t); return `<path d="M${x - 5} ${y} h10 l-5 9z" fill="${['#E8603F', '#ECB637', '#3E9E7A'][i % 3]}" stroke="#141E52" stroke-width="1"/>`; }).join('')}
		${[[128, '?'], [262, '!']].map(([x, s]) => `<g transform="translate(${x} 96)"><path d="M-14 -12 h28 l-4 26 h-20z" fill="#CFE6DA" stroke="#141E52" stroke-width="1.5" stroke-linejoin="round"/><rect x="-16" y="-15" width="32" height="5" rx="1.5" fill="#FFFDF8" stroke="#141E52" stroke-width="1.3"/><g transform="translate(${x < 195 ? -14 : 14} -30)"><path d="M-9 -8 h18 a3 3 0 0 1 3 3 v9 a3 3 0 0 1 -3 3 h-10 l-5 5 v-5 h-3 a3 3 0 0 1 -3 -3 v-9 a3 3 0 0 1 3 -3z" fill="#FFFDF8" stroke="#141E52" stroke-width="1.3"/><text y="3.5" text-anchor="middle" font-size="10" fill="#E8603F">${s}</text></g></g>`).join('')}
		<g stroke="#b8c9a8" stroke-width="1.6" stroke-linecap="round">${[0, 1, 2, 3].map(i => `<path d="M${12 + i * 2} ${569 + i * 8} h${44 - i * 4}"/>`).join('')}</g>`;
	},
	// 第三章「拆招」：等高线、星点、学院钟楼、放大镜「看穿」、台阶、Boss 幕布和两张互换的面具
	3: () => `
		<g fill="none" stroke="#cdc7e0" stroke-width="1.3">
			<path d="M6 168 C 26 160, 50 172, 74 163"/>
			<path d="M296 372 C 318 362, 344 378, 386 366"/><path d="M304 412 C 326 402, 350 418, 386 406"/>
			<path d="M8 584 C 30 576, 56 590, 80 580"/>
		</g>
		${[[22, 72], [48, 100], [84, 66], [102, 118], [30, 132], [70, 140]].map(([x, y], i) => `<path d="M${x} ${y - 4} l1.2 2.8 l2.8 1.2 l-2.8 1.2 l-1.2 2.8 l-1.2 -2.8 l-2.8 -1.2 l2.8 -1.2z" fill="${i % 2 ? '#ECB637' : '#9fa6d6'}"/>`).join('')}
		<g transform="translate(328 106)">
			<rect x="-16" y="-40" width="32" height="70" fill="#FFFDF8" stroke="#141E52" stroke-width="1.5"/>
			<path d="M-20 -40 L0 -70 L20 -40Z" fill="#2340A3" stroke="#141E52" stroke-width="1.5" stroke-linejoin="round"/>
			<line x1="0" y1="-70" x2="0" y2="-84" stroke="#141E52" stroke-width="1.4"/><path d="M0 -84 l11 3 l-11 3z" fill="#ECB637" stroke="#141E52" stroke-width=".8"/>
			<circle cy="-20" r="10" fill="#EAE8F3" stroke="#141E52" stroke-width="1.5"/><path d="M0 -20 v-7 M0 -20 l5 3" stroke="#141E52" stroke-width="1.6" stroke-linecap="round"/>
			<path d="M-8 30 v-18 a8 8 0 0 1 16 0 v18" fill="#2340A3" stroke="#141E52" stroke-width="1.3"/>
			<rect x="16" y="-2" width="32" height="32" fill="#FFFDF8" stroke="#141E52" stroke-width="1.5"/><path d="M13 -2 h38 l-6 -10 h-26z" fill="#ECB637" stroke="#141E52" stroke-width="1.5" stroke-linejoin="round"/>
			${[23, 32, 41].map(x => `<line x1="${x}" y1="4" x2="${x}" y2="28" stroke="#141E52" stroke-width="2.2"/>`).join('')}
			<text class="lab" x="16" y="46" text-anchor="middle" font-size="11">学院</text>
		</g>
		<g transform="translate(104 526)">
			<line x1="11" y1="13" x2="26" y2="30" stroke="#141E52" stroke-width="6" stroke-linecap="round"/><line x1="11" y1="13" x2="26" y2="30" stroke="#ECB637" stroke-width="3" stroke-linecap="round"/>
			<circle r="17" fill="#DCE3F7" stroke="#141E52" stroke-width="2.2"/><path d="M-9 -6 a12 12 0 0 1 8 -7" fill="none" stroke="#FFFDF8" stroke-width="2.5" stroke-linecap="round"/>
			<text y="5" text-anchor="middle" font-size="14" fill="#2340A3">≠</text>
			<text class="lab" x="0" y="48" text-anchor="middle" font-size="11">看穿</text>
		</g>
		<path d="M330 590 h14 v-10 h14 v-10 h14 v-10 h14 v-10" fill="none" stroke="#9fa6d6" stroke-width="2" stroke-linejoin="round"/>
		<path d="M140 46 Q148 72 154 100 L168 100 Q164 72 166 46Z" fill="#E8603F" stroke="#141E52" stroke-width="1.3" opacity=".9"/>
		<path d="M250 46 Q242 72 236 100 L222 100 Q226 72 224 46Z" fill="#E8603F" stroke="#141E52" stroke-width="1.3" opacity=".9"/>
		<path d="M134 44 Q195 58 256 44" fill="none" stroke="#141E52" stroke-width="1.6"/>
		${[[110, 92, '#FFFDF8', '#141E52'], [280, 92, '#141E52', '#ECB637']].map(([x, y, f, s]) => `<g transform="translate(${x} ${y})"><path d="M-17 -6 q8 -7 17 -1 q9 -6 17 1 q1 10 -7 13 q-6 1 -10 -5 q-4 6 -10 5 q-8 -3 -7 -13z" fill="${f}" stroke="#141E52" stroke-width="1.5"/><ellipse cx="-7" cy="-1" rx="4" ry="3" fill="${s}"/><ellipse cx="7" cy="-1" rx="4" ry="3" fill="${s}"/><line x1="-17" y1="-4" x2="-24" y2="-8" stroke="#141E52" stroke-width="1.2"/></g>`).join('')}
		<path d="M118 74 Q195 20 272 74" fill="none" stroke="#2340A3" stroke-width="1.4" stroke-dasharray="3 4"/>
		<path d="M266 66 l7 9 l-11 1" fill="none" stroke="#2340A3" stroke-width="1.4" stroke-linejoin="round"/><path d="M124 66 l-7 9 l11 1" fill="none" stroke="#2340A3" stroke-width="1.4" stroke-linejoin="round"/>`,
	// 第四章「提速」：占位（社区工程画的），只放两只小沙漏，等设计定稿
	4: () => [[150, 140], [320, 560]].map(([x, y]) => `<g transform="translate(${x} ${y})" opacity=".55"><path d="M-7 -10 h14 M-7 10 h14" stroke="#141E52" stroke-width="1.6" stroke-linecap="round"/><path d="M-5 -10 C-5 -3 -1 -1 0 0 C1 -1 5 -3 5 -10Z M-5 10 C-5 3 -1 1 0 0 C1 1 5 3 5 10Z" fill="#FFFDF8" stroke="#141E52" stroke-width="1.2"/><path d="M-3 7 h6 l-3 -4z" fill="#D9B36A"/></g>`).join(''),
};

// 一排石头墙，把两章隔开（门两边）
function wall(y, dark) {
	let s = ''; const c = dark ? '#cfcadf' : '#ddd3bf', st = dark ? '#8d88a8' : '#a99e88';
	for (let x = -6; x < 400; x += 22) { if (x > 128 && x < 248) continue; s += `<rect x="${x}" y="${y - 7 + (x % 3)}" width="20" height="14" rx="6" fill="${c}" stroke="${st}" stroke-width="1.2"/>`; }
	return s;
}
// 第一扇门（第一章 → 第二章）：木门 + 封条；works = 打赢第一章、第二章还没开时的路障和「正在修路」小牌
function door1(y, sign, works) {
	return `<g class="nd door" data-door="1">
		${wall(y + 18, false)}
		<rect class="dglow" x="160" y="${y - 36}" width="70" height="72" fill="#FCE7A8" opacity="0"/>
		<rect x="148" y="${y - 44}" width="14" height="80" rx="3" fill="#cdbf9f" stroke="#141E52" stroke-width="1.5"/>
		<rect x="228" y="${y - 44}" width="14" height="80" rx="3" fill="#cdbf9f" stroke="#141E52" stroke-width="1.5"/>
		<g class="dL"><rect x="162" y="${y - 34}" width="33" height="70" fill="#D9A066" stroke="#141E52" stroke-width="1.5"/><path d="M170 ${y - 34} v70 M178 ${y - 34} v70 M186 ${y - 34} v70" stroke="#a8743f" stroke-width="1"/><path d="M162 ${y - 12} h33 M162 ${y + 18} h33" stroke="#141E52" stroke-width="1.5"/></g>
		<g class="dR"><rect x="195" y="${y - 34}" width="33" height="70" fill="#D9A066" stroke="#141E52" stroke-width="1.5"/><path d="M203 ${y - 34} v70 M211 ${y - 34} v70 M219 ${y - 34} v70" stroke="#a8743f" stroke-width="1"/><path d="M195 ${y - 12} h33 M195 ${y + 18} h33" stroke="#141E52" stroke-width="1.5"/></g>
		<g><rect x="138" y="${y - 60}" width="114" height="22" rx="4" fill="#FFFDF8" stroke="#141E52" stroke-width="1.6"/><text x="195" y="${y - 44}" text-anchor="middle" font-family="Songti SC,serif" font-weight="900" font-size="13" fill="#141E52">${sign}</text></g>
		<g class="dseal" transform="translate(195 ${y})"><path d="M0 -11 A11 11 0 0 0 0 11Z" fill="#E8603F" stroke="#B9472C" stroke-width="1.2"/><path d="M0 -11 A11 11 0 0 1 0 11Z" fill="#E8603F" stroke="#B9472C" stroke-width="1.2"/><text y="4.5" text-anchor="middle" font-family="Songti SC,serif" font-weight="900" font-size="12" fill="#FFFDF8">二</text></g>
		${works ? `<g>
			<g transform="translate(195 ${y + 47})"><path d="M-30 12 L-24 -6 M-18 12 L-24 -6 M18 12 L24 -6 M30 12 L24 -6" stroke="#141E52" stroke-width="2" stroke-linecap="round"/><rect x="-36" y="-11" width="72" height="9" rx="2" fill="#FFFDF8" stroke="#141E52" stroke-width="1.5"/>${[-30, -14, 2, 18].map(x => `<path d="M${x} -11 h8 l-5 9 h-8z" fill="#E8603F"/>`).join('')}</g>
			<g transform="translate(286 ${y + 4})"><line x1="0" y1="2" x2="0" y2="30" stroke="#141E52" stroke-width="2"/><rect x="-30" y="-16" width="60" height="22" rx="3" fill="#ECB637" stroke="#141E52" stroke-width="1.5"/><text y="-1" text-anchor="middle" font-size="11.5" font-weight="900" fill="#141E52" font-family="PingFang SC,sans-serif">正在修路</text></g>
		</g>` : ''}
	</g>`;
}
// 第二、三扇门：石拱 + 四块砖 + 金色封印（第三扇是占位，照第二扇换字）
function doorArch(k, y, sign, seal) {
	const top = y - 52, bot = y + 44;
	const blk = [[164, top + 22, 31, 36], [195, top + 22, 31, 36], [164, top + 58, 31, 38], [195, top + 58, 31, 38]];
	return `<g class="nd door" data-door="${k}">
		${wall(y + 30, true)}
		<rect class="dglow" x="162" y="${top + 16}" width="66" height="80" fill="#FCE7A8" opacity="0"/>
		<path d="M148 ${bot} V${top + 22} Q148 ${top - 4} 195 ${top - 4} Q242 ${top - 4} 242 ${top + 22} V${bot} H228 V${top + 26} Q228 ${top + 12} 195 ${top + 12} Q162 ${top + 12} 162 ${top + 26} V${bot}Z" fill="#4a5288" stroke="#141E52" stroke-width="1.6"/>
		<path d="M154 ${top + 22} Q154 ${top + 2} 195 ${top + 2} Q236 ${top + 2} 236 ${top + 22}" fill="none" stroke="#ECB637" stroke-width="1.4" stroke-dasharray="3 4"/>
		${blk.map(([x, by, w, h], i) => `<g class="db db${i}"><rect x="${x}" y="${by}" width="${w}" height="${h}" fill="${i % 3 ? '#2340A3' : '#2c4bb3'}" stroke="#141E52" stroke-width="1.4"/><path d="M${x + 6} ${by + 7} h${w - 12} M${x + 6} ${by + h - 7} h${w - 12}" stroke="#7d8fd6" stroke-width="1.2"/></g>`).join('')}
		<path class="dcross" d="M195 ${top + 22} v74 M164 ${top + 58} h62" stroke="#ECB637" stroke-width="1.5"/>
		<g class="dseal" transform="translate(195 ${top + 58})"><circle r="11" fill="#ECB637" stroke="#141E52" stroke-width="1.4"/><text y="4.5" text-anchor="middle" font-family="Songti SC,serif" font-weight="900" font-size="12" fill="#141E52">${seal}</text></g>
		<g><rect x="138" y="${top - 30}" width="114" height="22" rx="4" fill="#FFFDF8" stroke="#141E52" stroke-width="1.6"/><text x="195" y="${top - 14}" text-anchor="middle" font-family="Songti SC,serif" font-weight="900" font-size="13" fill="#141E52">${sign}</text></g>
	</g>`;
}
// 门开着的样子（静态，不放开门动画）
function openDoor(g) {
	if (!g) return;
	const q = s => g.querySelector(s);
	if (g.dataset.door === '1') {
		q('.dL')?.setAttribute('transform', 'translate(162 0) scale(.18 1) translate(-162 0)');
		q('.dR')?.setAttribute('transform', 'translate(228 0) scale(.18 1) translate(-228 0)');
	} else {
		g.querySelectorAll('.db').forEach(b => b.setAttribute('opacity', '0'));
		q('.dcross')?.setAttribute('opacity', '0');
	}
	q('.dseal')?.setAttribute('opacity', '0');
	q('.dglow')?.setAttribute('opacity', '.9');
}
// 小电车停在铁轨中段（要等画进页面才量得出铁轨）
function parkTram(root) {
	root.querySelectorAll('.railPath').forEach(p => {
		const L = p.getTotalLength(), at = f => p.getPointAtLength(Math.max(0, Math.min(L, L * f)));
		const q = at(TRAM1), a = at(TRAM1 - 2 / L), b = at(TRAM1 + 2 / L);
		const t = p.parentNode.querySelector('.tram2');
		if (t) t.setAttribute('transform', `translate(${q.x} ${q.y - 10}) rotate(${Math.atan2(b.y - a.y, b.x - a.x) * 57.3})`);
	});
}

const SEALS = { 2: '三', 3: '四' };
window.QuestArt = {
	STYLE,
	land: no => (LAND[no] ? LAND[no]() : ''),
	door: (k, y, sign, works) => (k === 1 ? door1(y, sign, works) : doorArch(k, y, sign, SEALS[k] ?? String(k + 1))),
	openDoor,
	parkTram,
};
})();
