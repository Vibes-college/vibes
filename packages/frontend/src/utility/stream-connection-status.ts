/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readonly, ref } from 'vue';
import type { IStream } from 'misskey-js';

type ConnectionEvents = {
	state: IStream['state'];
	on(event: '_connected_' | '_disconnected_', listener: () => void): unknown;
	off(event: '_connected_' | '_disconnected_', listener: () => void): unknown;
};

/**
 * A shared warning state that gives automatic reconnection time to recover.
 * Vibes: the grace period counts only while the page is in front. A phone freezes a page in the background and the
 * server then closes its connection; a timer started there fired the moment the page came back, so the warning showed
 * while the connection was simply being made again. From mainland China that takes a few seconds, hence 12 s.
 */
export function createStreamConnectionStatus(stream: ConnectionEvents, gracePeriod = 12000) {
	const isDisconnected = ref(false);
	let timer: number | null = null;
	let dismissed = false;

	function clearTimer() {
		if (timer !== null) window.clearTimeout(timer);
		timer = null;
	}

	function isVisible() {
		return window.document.visibilityState === 'visible';
	}

	function onDisconnected() {
		if (timer !== null || isDisconnected.value || dismissed || !isVisible()) return;
		timer = window.setTimeout(() => {
			timer = null;
			isDisconnected.value = stream.state === 'reconnecting' && isVisible();
		}, gracePeriod);
	}

	function onConnected() {
		clearTimer();
		dismissed = false;
		isDisconnected.value = false;
	}

	function onVisibilityChange() {
		if (isVisible()) {
			if (stream.state === 'reconnecting') onDisconnected();
		} else {
			clearTimer();
		}
	}

	stream.on('_disconnected_', onDisconnected);
	stream.on('_connected_', onConnected);
	window.document.addEventListener('visibilitychange', onVisibilityChange);
	if (stream.state === 'reconnecting') onDisconnected();

	return {
		isDisconnected: readonly(isDisconnected),
		dismiss() {
			clearTimer();
			dismissed = true;
			isDisconnected.value = false;
		},
		dispose() {
			clearTimer();
			stream.off('_disconnected_', onDisconnected);
			stream.off('_connected_', onConnected);
			window.document.removeEventListener('visibilitychange', onVisibilityChange);
		},
	};
}
