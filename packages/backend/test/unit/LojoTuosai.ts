/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { tuosai, tuosaiHead, tuosaiTraits } from '@/misc/lojo-tuosai.js';

const hash = (svg: string) => createHash('sha256').update(svg).digest('hex').slice(0, 16);

// tuosai() as it drew before the head-only drawing was added (2026-11-17, f638868): every learner's avatar must stay
// exactly the same, with and without the background.
const BEFORE: [string, string, string][] = [
	['a', '4d1f3dca99fef59f', 'ad40c6ebfc460163'],
	['tutor_mia@app.vibes.college', '5bad15a9f090dcd6', 'f5a21e10767eca69'],
	['momo:9xyz01abcd', '966bbd47908a43e1', '15ec69103fe9d63e'],
	['alice@vibes.college', 'c3bcb22d529bd53d', '05e95a5d5baf91bc'],
	['bob', '68ee1141557b80ac', 'e90314aee967acf6'],
	['Q7k2', '73a2f48fdd273a7f', '994b9b3ebb8938b1'],
	['seed-3', '455ab50e3a6f059c', '70c85d35622c2e69'],
	['中文种子', '7b0718e8d0cf902e', '2278258ec1eac652'],
	['long-hair-maybe', 'd68145f7e9593d94', 'eba4f27f28618473'],
	['x', '18bf27201de2dacc', '1b086b431e58100b'],
	['y', '7771122b7744ae31', 'e1fcccb2d62437f1'],
	['z', '327fb14ad582bc3d', '241f680f85cde51c'],
	['10', '389b03e4cd7dc00a', '22b7b13177239012'],
	['11', '78e61e1106046ef3', '83860aa6f945af89'],
	['12', '44ce7299578996f1', '9cd0bfc4ccec2409'],
	['13', 'b515fe830abfd437', '74b37dd39e0fc301'],
	['14', 'cdfccad4d0e9db43', '5a22380874f097be'],
	['15', 'e694bf36dfaaa8b3', '320c22c461484dc1'],
	['16', 'cfb2592c35f5773a', 'a2107bec46e1a9a4'],
	['17', '7c1af2810754da0f', '00b2002967121e8d'],
	['18', '5050d8cd952bb390', '45b38267b05c44e4'],
	['19', '40aedf6601e9a577', 'bb8c830c3703849e'],
	['20', '298f74c518c2df1c', '16e71886a04ae5b8'],
	['21', 'eb0b7c0a8176e66d', 'bc0d80c51470a114'],
];

// the first seed (momo:1, momo:2 …) for each hair style, so every style is drawn as a head at least once
const seedWithHair = (hair: string) => {
	for (let i = 0; i < 2000; i++) if (tuosaiTraits(`momo:${i}`).hair === hair) return `momo:${i}`;
	throw new Error(`no seed with ${hair}`);
};

describe('tuosai avatar', () => {
	test.each(BEFORE)('%s draws the same as before', (seed, full, bare) => {
		expect(hash(tuosai(seed))).toBe(full);
		expect(hash(tuosai(seed, { size: 96, background: false }))).toBe(bare);
	});
});

describe('tuosaiHead (Momo, head only)', () => {
	test('the same face as the full avatar: every shape from the face outline to the freckles, only shaded', () => {
		for (const [seed] of BEFORE) {
			const full = tuosai(seed);
			const face = full.slice(full.indexOf('<ellipse cx="105" cy="108"'), full.indexOf('<path d="M36 210')); // up to the sleeve
			const head = tuosaiHead(seed);
			expect(head).toContain('<path d="M109 80 L109 120 Q109 132 96 130" fill="none" stroke="#E8603F" stroke-width="7"'); // the J nose
			const shapes = face.match(/d="[^"]+"|<circle cx="[^"]+" cy="[^"]+" r="[^"]+"|<ellipse cx="[^"]+" cy="[^"]+" rx="[^"]+" ry="[^"]+"(?! fill="#FF8FA3")/g) ?? [];
			expect(shapes.length).toBeGreaterThan(5);
			for (const shape of shapes) expect(head).toContain(shape);
		}
	});

	test('everything but the head is cut away', () => {
		for (const [seed] of BEFORE) {
			const head = tuosaiHead(seed);
			expect(head).not.toContain('<rect width="200" height="200"'); // background
			expect(head).not.toContain('M58 210'); // shoulders
			expect(head).not.toContain('<rect x="94" y="148"'); // neck
			expect(head).not.toContain('M36 210'); // sleeve
			expect(head).not.toContain('M62 104 L62 156'); // the L hand
			expect(head).not.toContain('translate(166 36)'); // thought bubble
			expect(head).toContain('viewBox="4 -6 202 196"');
		}
	});

	test('long hair stops under the chin instead of running off the bottom', () => {
		const head = tuosaiHead(seedWithHair('long'));
		expect(head).toContain('L166 158 Q166 176 148 176');
		expect(head).not.toContain('L168 190 L40 190Z');
	});

	test.each(['bob', 'crop', 'buzz', 'sidepart', 'long', 'bun', 'ponytail', 'curly', 'beanie'])('%s hair draws as a head', hair => {
		const head = tuosaiHead(seedWithHair(hair));
		expect(head.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
		expect(head.endsWith('</svg>')).toBe(true);
	});

	test('sticker adds a white outline, drawn without an SVG filter (Safari blurs filters); size sets the width', () => {
		for (const [seed] of BEFORE) {
			const plain = tuosaiHead(seed, { size: 80 });
			const sticker = tuosaiHead(seed, { size: 80, sticker: true });
			expect(plain + sticker).not.toContain('<filter');
			expect(plain).not.toContain('stroke="#fff" stroke-width="12"');
			expect(sticker).toContain('<g fill="#fff" stroke="#fff" stroke-width="12" stroke-linejoin="round">');
			expect(plain).toContain('width="80" height="77.6"');
		}
	});

	test('shaded: gradients on skin and hair, catchlights in the eyes', () => {
		const head = tuosaiHead(seedWithHair('bob'));
		expect(head).toContain('<radialGradient id="mSkin"');
		expect(head).toContain('fill="url(#mHair)"');
		expect(head).toContain('fill="#fff"'); // the catchlights
		expect(tuosaiHead(seedWithHair('curly'))).toContain('fill="url(#mCurl)"');
		expect(tuosaiHead(seedWithHair('beanie'))).toContain('fill="url(#mHat)"');
	});

	test('the same seed always draws the same head', () => {
		expect(tuosaiHead('momo:abc', { sticker: true })).toBe(tuosaiHead('momo:abc', { sticker: true }));
		expect(tuosaiHead('momo:abc')).not.toBe(tuosaiHead('momo:abd'));
	});
});
