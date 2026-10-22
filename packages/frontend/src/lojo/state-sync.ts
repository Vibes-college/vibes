/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type LojoState = Record<string, unknown>;
export type StateSnapshot = { revision: number; state: LojoState | null };

/** Serializes complete snapshots. A conflict blocks writes until an explicit reload. */
export class LojoStateSync {
	private revision: number;
	private queue: Promise<void> = Promise.resolve();
	private failure: unknown = null;
	private latest: LojoState | null = null;
	private disposed = false;
	private pending = 0;

	constructor(
		snapshot: StateSnapshot,
		private readonly write: (state: LojoState, expectedRevision: number) => Promise<StateSnapshot>,
		private readonly isCurrentAccount: () => boolean,
		private readonly onError: (error: unknown) => void,
		private readonly onSaved: () => void,
	) {
		this.revision = snapshot.revision;
	}

	get hasPendingChanges(): boolean {
		return this.pending > 0 || this.failure != null;
	}

	save(state: LojoState): Promise<void> {
		const snapshot = JSON.parse(JSON.stringify(state)) as LojoState;
		this.latest = snapshot;
		return this.enqueue(snapshot);
	}

	retry(): Promise<void> {
		if (this.latest == null) return Promise.resolve();
		this.failure = null;
		return this.enqueue(this.latest);
	}

	dispose(): void {
		this.disposed = true;
	}

	private enqueue(snapshot: LojoState): Promise<void> {
		this.pending++;
		const operation = this.queue.then(async () => {
			if (this.disposed || !this.isCurrentAccount()) throw new Error('ACCOUNT_CHANGED');
			if (this.failure != null) throw this.failure;
			const result = await this.write(snapshot, this.revision);
			if (this.disposed || !this.isCurrentAccount()) throw new Error('ACCOUNT_CHANGED');
			this.revision = result.revision;
			this.onSaved();
		}).catch((error: unknown) => {
			this.failure = error;
			if (!this.disposed) this.onError(error);
			throw error;
		}).finally(() => {
			this.pending--;
		});
		this.queue = operation.catch(() => {});
		return operation;
	}
}
