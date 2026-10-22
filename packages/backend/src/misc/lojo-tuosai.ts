/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * LOJO 06 托腮 avatar generator (design notes: lojo-ip/avatars/persona.md).
 * tuosai(seed) returns a 200×200 SVG. The same seed always draws the same person.
 * The L is always the hand propping the chin and the J is always the coral nose;
 * hair, skin, gaze, brows, mouth, extras, clothes and background come from a seeded RNG
 * over the LOJO palette. Pure string output, no fonts, no dependencies.
 */

const INK = '#1C1A22', CREAM = '#FFF6E8', CORAL = '#E8603F', COBALT = '#2340A3', NIGHT = '#14204F', MUSTARD = '#F2C14E';

type Rng = { f: () => number; i: (n: number) => number; pick: <T>(arr: T[]) => T; chance: (p: number) => boolean; range: (lo: number, hi: number) => number };

function rng(seed: string): Rng {
	let h = 1779033703 ^ seed.length;
	for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
	let a = h >>> 0;
	const next = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
	return { f: next, i: n => Math.floor(next() * n), pick: arr => arr[Math.floor(next() * arr.length)], chance: p => next() < p, range: (lo, hi) => lo + next() * (hi - lo) };
}
const P = (d: string, s: string, w: number, x = '') => `<path d="${d}" fill="none" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${x}/>`;
const F = (d: string, f: string, x = '') => `<path d="${d}" fill="${f}" ${x}/>`;
const C = (x: number, y: number, r: number, f: string, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${extra}/>`;
const n = (v: number) => +v.toFixed(1);
const lum = (hex: string) => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

const SKINS = ['#FBE0C8', '#F6D3B3', '#EBB98F', '#D49A6A', '#B57A4E', '#8D5A3B', '#5E3B26'];
const HAIR_NATURAL = ['#1C1A22', '#1C1A22', '#2B1D14', '#2B1D14', '#3B2A20', '#5A3A24', '#7A4A2A', '#A8763E', '#C9A27A'];
const HAIR_DYED = [COBALT, CORAL, MUSTARD, '#7B5EA7', '#3F8F86'];
const CLOTHES = [COBALT, CORAL, NIGHT, MUSTARD, '#3F8F86', '#F2EBDD', '#7B5EA7'];
const BGS = [COBALT, MUSTARD, '#FF7A59', '#F2EBDD', '#BFD0F2', '#F7D9C9', '#F3E3A6', NIGHT, '#CDE3D6', '#E4D7F2'];

// Hair: back layer (behind the face) + front layer (over the forehead). Face ellipse is (105,108) 46×52.
const HAIR: Record<string, { back?: string; front?: string; curly?: true; beanie?: true }> = {
	bob: { front: 'M40 112 Q34 30 104 28 Q164 30 160 100 L160 126 L142 126 L142 74 Q108 56 70 72 L64 126 L44 126Z' },
	crop: { front: 'M52 96 Q44 32 104 30 Q162 32 156 96 L150 96 Q148 68 124 64 Q100 72 72 64 Q58 72 58 96Z' },
	buzz: { front: 'M58 84 Q58 40 104 38 Q152 40 152 84 Q138 62 104 60 Q72 62 58 84Z' },
	sidepart: { front: 'M48 104 Q40 30 108 28 Q166 32 158 96 L152 96 Q146 64 112 60 Q84 62 64 86 L58 104Z' },
	long: { back: 'M42 96 Q40 28 104 28 Q168 28 164 96 L168 190 L40 190Z', front: 'M46 100 Q42 30 104 28 Q164 30 160 98 Q152 66 122 60 Q96 72 66 66 Q52 78 46 100Z' },
	bun: { back: 'M104 18 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0', front: 'M40 150 Q34 32 104 32 Q168 32 164 150 L146 150 L142 74 Q108 58 70 72 L62 150Z' },
	ponytail: { back: 'M150 60 Q196 70 184 150 Q176 120 156 104Z', front: 'M50 98 Q44 30 104 30 Q160 30 158 92 Q146 62 112 62 Q86 70 66 66 Q54 78 50 98Z' },
	curly: { curly: true },
	beanie: { beanie: true },
};
const weighted = <T extends string>(r: Rng, list: [T, number][]): T => {
	let t = r.f() * list.reduce((s, [, w]) => s + w, 0);
	for (const [k, w] of list) { if ((t -= w) < 0) return k; }
	return list[0][0];
};

function curly(c: string) {
	let s = `<ellipse cx="104" cy="58" rx="54" ry="30" fill="${c}"/>`;
	for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.02 + i * 0.096); s += C(n(104 + 58 * Math.cos(a)), n(84 + 50 * Math.sin(a)), 15, c); }
	return s + C(50, 104, 13, c) + C(158, 104, 13, c);
}
function beanie(c: string, band: string) {
	return F('M50 86 Q50 24 104 24 Q158 24 158 86Z', c) + `<rect x="46" y="74" width="116" height="18" rx="9" fill="${band}"/>` + C(104, 20, 10, band);
}
function eyes(look: number[], kind: string) {
	let s = '';
	for (const x of [88, 130]) {
		const ry = kind === 'tall' ? 17 : 15;
		s += `<ellipse cx="${x}" cy="96" rx="15" ry="${ry}" fill="${CREAM}" stroke="${INK}" stroke-width="6"/>`;
		if (kind === 'smile') s += P(`M${x - 7} 99 Q${x} 89 ${x + 7} 99`, INK, 4.5);
		else if (kind === 'sleepy') s += `<clipPath id="lid${x}"><ellipse cx="${x}" cy="96" rx="15" ry="${ry}"/></clipPath><rect x="${x - 17}" y="78" width="34" height="17" fill="${INK}" clip-path="url(#lid${x})"/>` + C(n(x + look[0] * 0.6), 101, 4.5, INK);
		else s += C(n(x + look[0]), n(96 + look[1]), kind === 'small' ? 4.5 : 6, INK);
	}
	return s;
}
function mouth(kind: string, curve: number) {
	const x1 = 110, y1 = 140, x2 = 128, y2 = 136, mx = 119, my = 138;
	switch (kind) {
		case 'smile': return P(`M${x1} ${y1} Q${mx} ${n(my + curve)} ${x2} ${y2}`, INK, 5);
		case 'grin': return F(`M${x1} ${y1} Q${mx} ${my + 13} ${x2} ${y2}Z`, CORAL) + P(`M${x1} ${y1} L${x2} ${y2}`, INK, 3.5);
		case 'flat': return P(`M${x1 + 1} ${my + 1} L${x2 - 1} ${my - 1}`, INK, 5);
		case 'o': return `<ellipse cx="${mx}" cy="${my + 3}" rx="4.5" ry="5.5" fill="${INK}"/>`;
		case 'smirk': return P(`M${x1} ${my + 2} Q${mx + 2} ${my + 3} ${x2 + 2} ${y2 - 4}`, INK, 5);
		case 'wavy': return P(`M${x1 - 2} ${my} q4 -4 8 0 q4 4 8 0 q4 -4 8 0`, INK, 4);
		default: return P(`M${x1} ${y1} Q${mx} ${my + 6} ${x2} ${y2}`, INK, 5);
	}
}
const BUBBLE_ICONS: Record<string, string> = {
	pin: F('M180 34 C176 29 172 26 172 21 A8 8 0 1 1 188 21 C188 26 184 29 180 34Z', CORAL) + C(180, 21, 3, CREAM),
	heart: F('M180 32 C171 25 173 16 180 20 C187 16 189 25 180 32Z', CORAL),
	house: F('M172 25 L180 17 L188 25 L188 32 L172 32Z', COBALT) + `<rect x="178" y="26" width="4" height="6" fill="${CREAM}"/>`,
	star: F('M180 15 L182.5 21.5 L189 22 L184 26.5 L185.5 33 L180 29.5 L174.5 33 L176 26.5 L171 22 L177.5 21.5Z', MUSTARD),
	q: P('M175.5 19.5 Q176 15 180.5 15 Q185 15.5 185 19.5 Q185 22.5 181 24 L180.5 26.5', COBALT, 3) + C(180.5, 31, 1.8, COBALT),
	dot: C(180, 24, 4, CORAL),
};

export type TuosaiTraits = {
	skin: string; hair: string; hairColor: string; look: number[]; eyeKind: string; brow: number | null; mouthKind: string; smileCurve: number;
	clothes: string; sleeve: string; beanieColor: string; glasses: boolean; freckles: boolean; blush: boolean; earring: boolean; bubble: string | null; bg: string;
};

export function tuosaiTraits(seed: string): TuosaiTraits {
	const r = rng(String(seed));
	const skin = r.pick(SKINS);
	const hair = weighted(r, [['bob', 3], ['crop', 3], ['buzz', 1.5], ['sidepart', 2.5], ['long', 2.5], ['bun', 2], ['ponytail', 2], ['curly', 2.5], ['beanie', 1.2]]);
	const hairColor = r.chance(0.14) ? r.pick(HAIR_DYED) : r.chance(0.05) ? '#8A8A90' : r.pick(HAIR_NATURAL);
	const ang = r.range(-Math.PI, Math.PI), mag = r.range(2.5, 6);
	// about half keep the signature up-right "still thinking" gaze
	const look = r.chance(0.55) ? [n(3 + r.range(-1, 1)), n(-5 + r.range(-1, 1))] : [n(Math.cos(ang) * mag), n(Math.sin(ang) * mag)];
	const eyeKind = weighted(r, [['round', 6], ['small', 2], ['tall', 1.5], ['smile', 1.2], ['sleepy', 1]]);
	const brow = r.chance(0.5) ? r.range(-3.5, 5) : null;
	const mouthKind = weighted(r, [['soft', 4], ['smile', 4], ['grin', 1.5], ['flat', 1.5], ['o', 1], ['smirk', 1.5], ['wavy', 0.8]]);
	const smileCurve = r.range(5, 9);
	const clothes = r.pick(CLOTHES);
	const sleeve = r.chance(0.6) ? clothes : r.pick(CLOTHES);
	const beanieColor = r.pick([CORAL, COBALT, MUSTARD, NIGHT]);
	const glasses = r.chance(0.16), freckles = r.chance(0.16), blush = r.chance(0.3), earring = r.chance(0.14) && !['long', 'bob', 'curly'].includes(hair);
	const bubble = r.chance(0.28) ? r.pick(Object.keys(BUBBLE_ICONS)) : null;
	// the background must separate from skin, hair and clothes
	const avoid = [skin, hairColor, clothes].map(lum);
	const ok = BGS.filter(b => avoid.every(l => Math.abs(lum(b) - l) > 0.12) && b !== hairColor && b !== clothes);
	const pool = ok.length ? ok : BGS;
	const bg = pool[r.i(pool.length)];
	return { skin, hair, hairColor, look, eyeKind, brow, mouthKind, smileCurve, clothes, sleeve, beanieColor, glasses, freckles, blush, earring, bubble, bg };
}

function draw(t: TuosaiTraits, background: boolean) {
	const h = HAIR[t.hair] ?? HAIR.bob;
	const bubbleRing = lum(t.bg) < 0.25 ? '' : `stroke="${INK}" stroke-width="2"`;
	let s = background ? `<rect width="200" height="200" fill="${t.bg}"/>` : '';
	s += '<g transform="translate(-10 4) scale(1.05)">';
	s += F('M58 210 Q60 172 106 168 Q150 172 156 210Z', t.clothes); // shoulders
	if (h.back) s += F(h.back, t.hairColor);
	s += `<rect x="94" y="148" width="22" height="22" fill="${t.skin}"/>`; // neck
	s += `<ellipse cx="105" cy="108" rx="46" ry="52" fill="${t.skin}"/>`;
	if (h.curly) s += curly(t.hairColor);
	else if (h.beanie) s += beanie(t.beanieColor, t.beanieColor === NIGHT ? MUSTARD : NIGHT) + F('M56 92 L56 112 L62 112 L64 92Z', t.hairColor) + F('M150 92 L152 112 L158 112 L156 92Z', t.hairColor);
	else if (h.front) s += F(h.front, t.hairColor);
	if (t.earring) s += C(152, 132, 4.5, MUSTARD, `stroke="${INK}" stroke-width="2"`);
	if (t.brow != null) {
		const browColor = lum(t.hairColor) > 0.55 ? '#5A3A24' : t.hairColor;
		for (const x of [88, 130]) s += P(`M${x - 11} ${n(73 - t.brow * 0.5)} L${x + 9} ${n(73 + t.brow * 0.5)}`, browColor, 5);
	}
	s += eyes(t.look, t.eyeKind);
	if (t.glasses) {
		const g = lum(t.skin) < 0.3 ? MUSTARD : INK;
		s += `<circle cx="88" cy="96" r="21" fill="none" stroke="${g}" stroke-width="3.5"/><circle cx="130" cy="96" r="21" fill="none" stroke="${g}" stroke-width="3.5"/>` + P('M67 92 L58 88 M151 92 L156 88', g, 3.5);
	}
	s += P('M109 80 L109 120 Q109 132 96 130', CORAL, 7); // the J nose
	s += mouth(t.mouthKind, t.smileCurve);
	if (t.blush) s += '<ellipse cx="78" cy="124" rx="9" ry="5" fill="#FF8FA3" opacity=".6"/><ellipse cx="140" cy="122" rx="8" ry="5" fill="#FF8FA3" opacity=".6"/>';
	if (t.freckles) s += [[136, 116], [142, 120], [130, 120], [80, 118], [74, 122]].map(([x, y]) => C(x, y, 1.8, '#8A4E2E', 'opacity=".55"')).join('');
	s += F('M36 210 L48 166 L92 166 L84 210Z', t.sleeve); // sleeve
	s += P('M62 104 L62 156 Q62 164 70 164 L120 164', INK, 17) + P('M62 104 L62 156 Q62 164 70 164 L120 164', t.skin, 11); // the L hand
	if (t.bubble) s += '<g transform="translate(166 36) scale(.78) translate(-180 -25)">' + C(180, 25, 13, CREAM, bubbleRing) + C(168, 47, 5, CREAM) + C(165, 60, 2.6, CREAM) + BUBBLE_ICONS[t.bubble] + '</g>';
	return s + '</g>';
}

export function tuosai(seed: string, opts: { size?: number; background?: boolean; traits?: Partial<TuosaiTraits> } = {}): string {
	const t = { ...tuosaiTraits(seed), ...opts.traits };
	const size = opts.size ?? 200;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}">${draw(t, opts.background ?? true)}</svg>`;
}
