/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Two short blips for right and wrong (and a softer one for a wrong letter), made on the spot: no audio files.
// They follow the site's sound settings (muted means none) and the switch on the practice screen.
import { isMute } from '@/utility/sound.js';

let ctx: AudioContext | null = null;

// Call inside a tap: browsers only start an AudioContext after one.
export function unlockSfx(): void {
	try {
		ctx ??= new window.AudioContext();
		if (ctx.state === 'suspended') void ctx.resume();
	} catch {
		ctx = null;
	}
}

export type Blip = 'ok' | 'bad' | 'slip';

export function blip(kind: Blip): void {
	if (ctx == null || isMute()) return;
	try {
		const t0 = ctx.currentTime + 0.01;
		const notes: [number, number][] = kind === 'ok' ? [[784, 0], [1175, 0.09]] : kind === 'bad' ? [[330, 0], [247, 0.11]] : [[415, 0]];
		for (const [freq, delay] of notes) {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = kind === 'ok' ? 'sine' : 'triangle';
			osc.frequency.setValueAtTime(freq, t0 + delay);
			gain.gain.setValueAtTime(0.0001, t0 + delay);
			gain.gain.exponentialRampToValueAtTime(kind === 'slip' ? 0.035 : 0.075, t0 + delay + 0.015);
			gain.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + 0.24);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(t0 + delay);
			osc.stop(t0 + delay + 0.26);
		}
	} catch {
		// no blip; practice goes on
	}
}
