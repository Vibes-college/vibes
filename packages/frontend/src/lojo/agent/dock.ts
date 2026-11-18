/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Where the corner Momo sits (founder 11-17 20:53 PT: 「Momo 的小头像弄成可以移动的那种，这样的话挡住东西了就能移动开」).
// The head can be dragged with a finger or a mouse. On release it goes to the nearer side, left or right, and stays at
// the height where it was let go. The spot is kept on this device only (localStorage), like 「在首页显示 Momo」
// (./state.ts). Never moved: the default, the right side just above the phone's bottom bar.

export type Side = 'left' | 'right';
// y: from the bottom of the screen to the bottom of the head, in px.
export type Spot = { side: Side; y: number };

const KEY = 'vibes:vibi-spot';

// A press that moves less than this is a tap and opens the chat.
export const DRAG_SLOP = 6;

// Room kept above the head for the speech bubble, which opens upward from the head's face.
export const TOP_GAP = 40;

export function loadSpot(): Spot | null {
	try {
		const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
		if (typeof v !== 'object' || v == null) return null;
		const { side, y } = v as Partial<Spot>;
		if ((side !== 'left' && side !== 'right') || typeof y !== 'number' || !Number.isFinite(y)) return null;
		return { side, y: Math.max(0, Math.round(y)) };
	} catch {
		return null;
	}
}

export function saveSpot(spot: Spot): void {
	try {
		localStorage.setItem(KEY, JSON.stringify({ side: spot.side, y: Math.round(spot.y) }));
	} catch { /* private mode or full: it stays put until the page reloads */ }
}

export function isDrag(dx: number, dy: number): boolean {
	return Math.hypot(dx, dy) >= DRAG_SLOP;
}

// The nearer side for a head whose middle is at x on a screen this wide.
export function sideFor(centerX: number, screenWidth: number): Side {
	return centerX < screenWidth / 2 ? 'left' : 'right';
}

// Keep a head of this size on the screen while it is dragged: never past the sides, never into the room kept for the
// bubble at the top, never over the bottom bar (minBottom: the bar's height plus a margin, or the corner margin when
// the bar is hidden).
export function clampDrag(
	pos: { left: number; top: number },
	size: { width: number; height: number },
	screen: { width: number; height: number; minTop: number; minBottom: number },
): { left: number; top: number } {
	const maxLeft = Math.max(0, screen.width - size.width);
	const maxTop = Math.max(screen.minTop, screen.height - screen.minBottom - size.height);
	return {
		left: Math.min(Math.max(pos.left, 0), maxLeft),
		top: Math.min(Math.max(pos.top, screen.minTop), maxTop),
	};
}
