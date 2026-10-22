/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Keep direction changes deliberate and ignore elastic overscroll on touch devices.
export function createScrollChromeTracker() {
	let previous = 0;
	let distance = 0;
	let hidden = false;
	return {
		reset(top = 0) {
			previous = Math.max(0, top);
			distance = 0;
			hidden = false;
		},
		update(top: number, maximum: number): boolean {
			const y = Math.max(0, Math.min(top, Math.max(0, maximum)));
			const delta = y - previous;
			previous = y;
			if (y <= 12 || maximum <= 96) {
				hidden = false;
				distance = 0;
			} else if (delta !== 0) {
				distance = delta > 0 ? Math.max(0, distance) + delta : Math.min(0, distance) + delta;
				if (y > 96 && distance >= 56) hidden = true;
				if (distance <= -24) hidden = false;
			}
			return hidden;
		},
	};
}
