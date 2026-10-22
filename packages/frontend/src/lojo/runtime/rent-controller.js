/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// The 租房 layer (#map/housing): live AMap commute, 片区 -> 城中村/小区, and who shows you around.
// Legacy deep links (#building/…) still go to the older housing controller.
import { mountRentMap } from './rentmap.js';
import rentCss from './rentmap.css?inline';

export function createRentController() {
	let host = null, api = null;
	return {
		render(container) {
			if (host?.isConnected) return;
			container.innerHTML = '<div class="housing-screen rent-screen"></div>';
			host = container.firstElementChild;
			const target = host;
			void mountRentMap(target, { css: rentCss, media: '/lojo-assets/assets/rent/' })
				.then(result => { if (host === target) api = result; else result?.destroy(); })
				.catch(() => { if (host === target) target.innerHTML = '<p style="padding:24px">租房地图暂时无法加载，请稍后重试。</p>'; });
		},
		leave() { api?.destroy(); api = null; host = null; },
		resize() { api?.resize(); },
	};
}
