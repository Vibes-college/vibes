/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type Logger from '@/logger.js';

// The parts of a DeepSeek chat completion the Vibes services read.
export type ChatCompletion = {
	model?: string;
	choices?: { finish_reason?: string; message?: { content?: string | null } }[];
	usage?: { prompt_cache_hit_tokens?: number; prompt_cache_miss_tokens?: number; completion_tokens?: number };
};

// One line per model call: what the cache saved (prompt_cache_hit_tokens are billed at about 1/50 of a miss).
// grep "model usage" in the web logs to see the real hit rate per caller.
export function logModelUsage(logger: Logger, source: string, json: ChatCompletion, ms: number): void {
	const u = json.usage ?? {};
	logger.info(`model usage source=${source} model=${json.model ?? '?'} hit=${u.prompt_cache_hit_tokens ?? 0} miss=${u.prompt_cache_miss_tokens ?? 0} out=${u.completion_tokens ?? 0} ms=${ms}`);
}
