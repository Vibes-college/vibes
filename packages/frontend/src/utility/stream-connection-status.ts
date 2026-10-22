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

/** A shared warning state that gives automatic reconnection time to recover. */
export function createStreamConnectionStatus(stream: ConnectionEvents, gracePeriod = 5000) {
	const isDisconnected = ref(false);
	let timer: number | null = null;
	let dismissed = false;

	function clearTimer() {
		if (timer !== null) window.clearTimeout(timer);
		timer = null;
	}

	function onDisconnected() {
		if (timer !== null || isDisconnected.value || dismissed) return;
		timer = window.setTimeout(() => {
			timer = null;
			isDisconnected.value = stream.state === 'reconnecting';
		}, gracePeriod);
	}

	function onConnected() {
		clearTimer();
		dismissed = false;
		isDisconnected.value = false;
	}

	stream.on('_disconnected_', onDisconnected);
	stream.on('_connected_', onConnected);
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
		},
	};
}
