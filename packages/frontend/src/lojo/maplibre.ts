/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

let loading: Promise<void> | undefined;

export function loadLojoMapLibre(): Promise<void> {
	if ('maplibregl' in window) return Promise.resolve();
	if (loading) return loading;
	loading = new Promise<void>((resolve, reject) => {
		const script = window.document.createElement('script');
		script.src = '/lojo-assets/vendor/maplibre-gl.js';
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => {
			script.remove();
			loading = undefined;
			reject(new Error('MAP_ENGINE_LOAD_FAILED'));
		};
		window.document.head.appendChild(script);
	});
	return loading;
}
