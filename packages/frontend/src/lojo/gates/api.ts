/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { gateLabels } from './labels.js';
import type { GateAnswer, GateAttempt, GateResult } from './player.js';
import { misskeyApi } from '@/utility/misskey-api.js';

// The first start of a set can take ~40 s: the server synthesizes the recording, once for everyone.
export function startGate(course: string, station: string): Promise<GateAttempt> {
	return misskeyApi('lojo/gates/start', { course, station });
}

// Handing in the same attempt twice returns the stored result.
export function submitGate(attemptId: string, answers: GateAnswer[]): Promise<GateResult> {
	return misskeyApi('lojo/gates/submit', { attemptId, answers });
}

export function guideTitle(guideId: string): Promise<string> {
	return misskeyApi('lojo/guides/show', { guideId }).then(guide => guide.title);
}

export function gateErrorCode(err: unknown): string | null {
	const code = (err as { code?: unknown } | null)?.code;
	return typeof code === 'string' ? code : null;
}

export function gateErrorText(err: unknown): string {
	switch (gateErrorCode(err)) {
		case 'NO_SUCH_COURSE':
		case 'NO_SUCH_STATION': return gateLabels.noStation;
		case 'GATE_NOT_READY': return gateLabels.notReady;
		case 'NO_SUCH_ATTEMPT': return gateLabels.attemptGone;
		case 'LOJO_ENGLISH_UNAVAILABLE': return gateLabels.speechUnavailable;
		case 'LOJO_ENGLISH_FAILED': return gateLabels.speechFailed;
		case 'LOJO_ENGLISH_QUOTA_EXCEEDED': return gateLabels.speechQuota;
		case 'RATE_LIMIT_EXCEEDED': return gateLabels.rateLimited;
		default: return gateLabels.networkFailed;
	}
}
