/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'eventemitter3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IStream, StreamEvents } from 'misskey-js';
import { createStreamConnectionStatus } from '@/utility/stream-connection-status.js';

class StreamStub extends EventEmitter<StreamEvents> {
	public state: IStream['state'] = 'connected';

	public disconnect(): void {
		this.state = 'reconnecting';
		this.emit('_disconnected_');
	}

	public reconnect(): void {
		this.state = 'connected';
		this.emit('_connected_');
	}
}

const cleanups: (() => void)[] = [];

function fixture(initialState: IStream['state'] = 'connected', gracePeriod?: number) {
	const stream = new StreamStub();
	stream.state = initialState;
	const status = createStreamConnectionStatus(stream, gracePeriod);
	cleanups.push(() => status.dispose());
	return { stream, status };
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	cleanups.splice(0).forEach(cleanup => cleanup());
	vi.clearAllTimers();
	vi.useRealTimers();
});

describe('stream connection status', () => {
	it.each(['initializing', 'connected'] as const)('does not show a warning while initially %s', (initialState) => {
		const { status } = fixture(initialState);

		vi.advanceTimersByTime(60_000);

		expect(status.isDisconnected.value).toBe(false);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('does not show a warning for a disconnect that recovers within five seconds', () => {
		const { stream, status } = fixture();

		stream.disconnect();
		vi.advanceTimersByTime(4_999);
		expect(status.isDisconnected.value).toBe(false);

		stream.reconnect();
		vi.advanceTimersByTime(60_000);

		expect(status.isDisconnected.value).toBe(false);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('shows a sustained disconnect after five seconds and clears it on recovery', () => {
		const { stream, status } = fixture();

		stream.disconnect();
		vi.advanceTimersByTime(4_999);
		expect(status.isDisconnected.value).toBe(false);

		vi.advanceTimersByTime(1);
		expect(status.isDisconnected.value).toBe(true);

		stream.reconnect();
		expect(status.isDisconnected.value).toBe(false);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('keeps a dismissed warning hidden until recovery and warns on a later disconnect', () => {
		const { stream, status } = fixture();

		stream.disconnect();
		vi.advanceTimersByTime(5_000);
		expect(status.isDisconnected.value).toBe(true);

		status.dismiss();
		expect(status.isDisconnected.value).toBe(false);

		stream.disconnect();
		vi.advanceTimersByTime(60_000);
		expect(status.isDisconnected.value).toBe(false);
		expect(vi.getTimerCount()).toBe(0);

		stream.reconnect();
		stream.disconnect();
		vi.advanceTimersByTime(5_000);
		expect(status.isDisconnected.value).toBe(true);
	});

	it('can dismiss a pending warning without leaving a timer', () => {
		const { stream, status } = fixture();

		stream.disconnect();
		vi.advanceTimersByTime(1_000);
		status.dismiss();

		expect(vi.getTimerCount()).toBe(0);
		vi.advanceTimersByTime(60_000);
		expect(status.isDisconnected.value).toBe(false);
	});

	it('does not retain timers across repeated disconnect and reconnect events', () => {
		const { stream, status } = fixture();

		stream.disconnect();
		stream.disconnect();
		expect(vi.getTimerCount()).toBe(1);
		vi.advanceTimersByTime(3_000);

		stream.reconnect();
		expect(vi.getTimerCount()).toBe(0);
		stream.disconnect();

		vi.advanceTimersByTime(2_000);
		expect(status.isDisconnected.value).toBe(false);
		vi.advanceTimersByTime(3_000);
		expect(status.isDisconnected.value).toBe(true);
		expect(vi.getTimerCount()).toBe(0);

		stream.reconnect();
		expect(status.isDisconnected.value).toBe(false);
	});

	it('starts the grace period when created while already reconnecting', () => {
		const { stream, status } = fixture('reconnecting');

		vi.advanceTimersByTime(4_999);
		expect(status.isDisconnected.value).toBe(false);
		vi.advanceTimersByTime(1);
		expect(status.isDisconnected.value).toBe(true);

		stream.reconnect();
		expect(status.isDisconnected.value).toBe(false);
	});

	it('uses the configured grace period', () => {
		const { stream, status } = fixture('connected', 1_000);

		stream.disconnect();
		vi.advanceTimersByTime(999);
		expect(status.isDisconnected.value).toBe(false);
		vi.advanceTimersByTime(1);
		expect(status.isDisconnected.value).toBe(true);
	});

	it('disposes its listeners and pending timer without removing other subscribers', () => {
		const { stream, status } = fixture();
		const onDisconnected = vi.fn();
		const onConnected = vi.fn();
		stream.on('_disconnected_', onDisconnected);
		stream.on('_connected_', onConnected);
		expect(stream.listenerCount('_disconnected_')).toBe(2);
		expect(stream.listenerCount('_connected_')).toBe(2);

		stream.disconnect();
		vi.advanceTimersByTime(1_000);
		status.dispose();

		expect(stream.listenerCount('_disconnected_')).toBe(1);
		expect(stream.listenerCount('_connected_')).toBe(1);
		expect(vi.getTimerCount()).toBe(0);

		stream.reconnect();
		stream.disconnect();
		vi.advanceTimersByTime(60_000);
		expect(status.isDisconnected.value).toBe(false);
		expect(vi.getTimerCount()).toBe(0);
		expect(onDisconnected).toHaveBeenCalledTimes(2);
		expect(onConnected).toHaveBeenCalledOnce();
	});
});
