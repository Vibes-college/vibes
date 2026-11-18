/*
 * SPDX-FileCopyrightText: Vibes
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 「保存分享图」：在浏览器里画一张 1080×1440 的图（作品标题、专业、名字、Vibes College、二维码），扫码打开 /@<用户名>/learn。
// 跟原来个人主页小程序里的分享图同一个排版；二维码用社区自带的（utility/qr-code.ts），不另装库。
// 图要拿出去发，不跟着看的人的主题走：底色固定浅色，字用社区的字体，强调色用社区的。
import { majorText } from './learn.js';
import type { LearnMe } from './learn.js';
import { learnText as learnLabels } from '@/lojo/locales/learn.js';
import { qrcodeImageBitmap } from '@/utility/qr-code.js';

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
	const out: string[] = [];
	let cur = '';
	for (const ch of text) {
		if (ctx.measureText(cur + ch).width > max && cur !== '') {
			out.push(cur);
			cur = ch;
		} else {
			cur += ch;
		}
	}
	if (cur !== '') out.push(cur);
	return out;
}

export async function drawShareImage(share: LearnMe['share']): Promise<HTMLCanvasElement> {
	const W = 1080, H = 1440;
	const c = window.document.createElement('canvas');
	c.width = W;
	c.height = H;
	const x = c.getContext('2d');
	if (x == null) return c;
	const family = window.getComputedStyle(window.document.body).fontFamily || 'sans-serif';
	const accent = window.getComputedStyle(window.document.documentElement).getPropertyValue('--MI_THEME-accent').trim() || '#3b82f6';
	const font = (size: number, weight = 400) => `${weight} ${size}px ${family}`;
	const FG = '#1d1d1f', MUTE = '#6e6e73';

	x.fillStyle = '#f5f5f7';
	x.fillRect(0, 0, W, H);
	x.fillStyle = '#ffffff';
	x.beginPath();
	x.roundRect(60, 60, W - 120, H - 120, 40);
	x.fill();

	x.fillStyle = accent;
	x.font = font(36, 700);
	x.fillText(learnLabels.shareMajorLine(majorText(share.major).name, share.title !== ''), 120, 190);

	x.fillStyle = FG;
	x.font = font(76, 700);
	let y = 300;
	for (const l of wrap(x, share.title || learnLabels.shareTitleFallback(share.name), W - 240).slice(0, 3)) {
		x.fillText(l, 120, y);
		y += 96;
	}
	if (share.line) {
		x.fillStyle = MUTE;
		x.font = font(40);
		y += 10;
		for (const l of wrap(x, share.line, W - 240).slice(0, 3)) {
			x.fillText(l, 120, y);
			y += 58;
		}
	}
	x.fillStyle = FG;
	x.font = font(40, 700);
	x.fillText(share.name, 120, Math.max(y + 60, 760));

	// 二维码（扫码打开「学习」标签）
	const Q = 360;
	const qx = 120, qy = H - 120 - 60 - Q;
	try {
		const qr = await qrcodeImageBitmap(share.url, { size: Q, margin: 0, color: FG, background: '#ffffff' });
		x.drawImage(qr, qx, qy, Q, Q);
	} catch {
		// 画不出二维码就不画，图照样能存
	}
	x.fillStyle = MUTE;
	x.font = font(30);
	x.fillText(learnLabels.shareScan, qx + Q + 40, qy + Q - 60);
	x.fillStyle = FG;
	x.font = font(44, 700);
	x.fillText('Vibes College', qx + Q + 40, qy + Q);
	return c;
}

export function shareFileName(share: LearnMe['share']): string {
	return `vibes-${(share.title || share.name).replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 40)}.png`;
}
