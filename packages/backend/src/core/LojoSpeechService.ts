/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository } from '@/models/_.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { DriveService } from '@/core/DriveService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { createTemp } from '@/misc/create-temp.js';
import type Logger from '@/logger.js';
import { ApiError } from '@/server/api/error.js';
import { lojoEnglishErrors } from '@/server/api/lojo-schemas.js';
import { lojoDefaultVoice, lojoVoices, speechText } from '@/misc/lojo-voices.js';

const ENDPOINT = 'https://api.fish.audio/v1/tts';
const MAX_CHARS = 1500;

@Injectable()
export class LojoSpeechService {
	private readonly apiKey = process.env.FISH_AUDIO_API_KEY ?? '';
	// drama-3 while its launch price lasts; switch with LOJO_TTS_MODEL=s2.1-pro afterwards.
	private readonly model = process.env.LOJO_TTS_MODEL || 'drama-3';
	private readonly latency = process.env.LOJO_TTS_LATENCY || 'low';
	// Site-wide ceiling on text sent for synthesis per UTC day, in UTF-8 bytes (the unit Fish Audio bills).
	private readonly dailyBytes = Number(process.env.LOJO_TTS_DAILY_BYTES) || 300000;
	private inflight = new Map<string, Promise<string>>();
	private logger: Logger;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
		private httpRequestService: HttpRequestService,
		private loggerService: LoggerService,
		private driveService: DriveService,
		private driveFileEntityService: DriveFileEntityService,
	) {
		this.logger = this.loggerService.getLogger('lojo-speech');
	}

	public get available(): boolean {
		return this.apiKey !== '';
	}

	public voices() {
		return { defaultVoice: lojoDefaultVoice, voices: lojoVoices.map(({ id, name, accent, label }) => ({ id, name, accent, label })) };
	}

	// Each (voice, text) is synthesized once and kept as a drive file that every listener shares.
	// The model is not part of the key, so audio made with drama-3 keeps being served after switching models.
	public async speak(text: string, voiceId: string | undefined): Promise<string> {
		if (!this.available) throw new ApiError(lojoEnglishErrors.unavailable);
		const voice = lojoVoices.find(v => v.id === voiceId) ?? lojoVoices.find(v => v.id === lojoDefaultVoice)!;
		const clean = speechText(text).slice(0, MAX_CHARS);
		if (clean === '') throw new ApiError(lojoEnglishErrors.emptyNote);

		const hash = createHash('sha256').update(clean).digest('hex');
		const key = `lojoSpeech:1:${voice.referenceId}:${hash}`;
		const known = await this.cachedUrl(key);
		if (known) return known;

		const pending = this.inflight.get(key);
		if (pending) return pending;
		const promise = this.synthesize(clean, voice.referenceId, hash, key).finally(() => {
			if (this.inflight.get(key) === promise) this.inflight.delete(key);
		});
		this.inflight.set(key, promise);
		return promise;
	}

	private async cachedUrl(key: string): Promise<string | null> {
		const fileId = await this.redisClient.get(key).catch(() => null);
		if (fileId == null) return null;
		const file = await this.driveFilesRepository.findOneBy({ id: fileId });
		return file ? this.driveFileEntityService.getPublicUrl(file) : null;
	}

	private async synthesize(text: string, referenceId: string, hash: string, key: string): Promise<string> {
		await this.spendBudget(Buffer.byteLength(text, 'utf8'));

		let audio: Buffer;
		try {
			const res = await this.httpRequestService.send(ENDPOINT, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json',
					'model': this.model,
				},
				body: JSON.stringify({ text, reference_id: referenceId, format: 'mp3', mp3_bitrate: 64, normalize: true, latency: this.latency }),
				timeout: 90 * 1000,
				// ENDPOINT is a fixed constant; allowing private addresses keeps it working behind fake-IP proxies (198.18.0.0/15).
				isLocalAddressAllowed: true,
			}, { throwErrorWhenResponseNotOk: false });
			if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text().catch(() => '')).slice(0, 300)}`);
			audio = Buffer.from(await res.arrayBuffer());
			if (audio.length < 1000) throw new Error(`audio too short (${audio.length} bytes)`);
		} catch (err) {
			this.logger.warn(`Fish Audio request failed: ${err instanceof Error ? err.message : String(err)}`);
			throw new ApiError(lojoEnglishErrors.failed);
		}

		const [path, cleanup] = await createTemp();
		try {
			await fs.writeFile(path, audio);
			const file = await this.driveService.addFile({ user: null, path, name: `vibes-voice-${hash.slice(0, 16)}.mp3`, ext: 'mp3' });
			await this.redisClient.set(key, file.id).catch(err => this.logger.warn(`cache write failed: ${err}`));
			return this.driveFileEntityService.getPublicUrl(file);
		} finally {
			cleanup();
		}
	}

	private async spendBudget(bytes: number) {
		const key = `lojoSpeech:budget:${new Date().toISOString().slice(0, 10)}`;
		const used = await this.redisClient.multi().incrby(key, bytes).expire(key, 60 * 60 * 48).exec()
			.then(res => Number(res?.[0]?.[1] ?? 0), () => 0);
		if (used > this.dailyBytes) {
			this.logger.warn(`daily read-aloud limit of ${this.dailyBytes} bytes reached`);
			throw new ApiError(lojoEnglishErrors.quotaExceeded);
		}
	}
}
