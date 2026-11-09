/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { markRaw } from 'vue';
import { $i } from '@/i.js';
import { wsOrigin } from '@@/js/config.js';
import { createStreamConnectionStatus } from '@/utility/stream-connection-status.js';
import { trackStream } from '@/lojo/boot-report.js';

// heart beat interval in ms
const HEART_BEAT_INTERVAL = 1000 * 60;

let stream: Misskey.IStream | null = null;
let timeoutHeartBeat: number | null = null;
let lastHeartbeatCall = 0;
let connectionStatus: ReturnType<typeof createStreamConnectionStatus> | null = null;

export function useStreamConnectionStatus() {
	if (connectionStatus) return connectionStatus;
	connectionStatus = createStreamConnectionStatus(useStream());
	return connectionStatus;
}

export function useStream(): Misskey.IStream {
	if (stream) return stream;

	stream = markRaw(new Misskey.Stream(wsOrigin, $i ? {
		token: $i.token,
	} : null, {
		// Vibes: from mainland China the handshake alone is 3 round trips of 0.2–0.6 s with packet loss at peak (measured
		// 2026-10-31); the default 4 s cut slow attempts off halfway, so reconnecting kept failing.
		connectionTimeout: 10 * 1000,
	}));

	// Vibes: how long the live connection takes to connect and how often it drops, for the speed records.
	trackStream(stream);

	if (timeoutHeartBeat) window.clearTimeout(timeoutHeartBeat);
	timeoutHeartBeat = window.setTimeout(heartbeat, HEART_BEAT_INTERVAL);

	// send heartbeat right now when last send time is over HEART_BEAT_INTERVAL
	window.document.addEventListener('visibilitychange', () => {
		if (
			!stream
			|| window.document.visibilityState !== 'visible'
			|| Date.now() - lastHeartbeatCall < HEART_BEAT_INTERVAL
		) return;
		heartbeat();
	});

	return stream;
}

function heartbeat(): void {
	if (stream != null && window.document.visibilityState === 'visible') {
		stream.heartbeat();
	}
	lastHeartbeatCall = Date.now();
	if (timeoutHeartBeat) window.clearTimeout(timeoutHeartBeat);
	timeoutHeartBeat = window.setTimeout(heartbeat, HEART_BEAT_INTERVAL);
}
