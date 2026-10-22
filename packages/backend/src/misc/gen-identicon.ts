/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Default avatar generator.
 * LOJO replaces the upstream identicon with a 06 托腮 portrait seeded by the account
 * (see ./lojo-tuosai.ts); the same account always gets the same person.
 */

import sharp from 'sharp';
import { tuosai } from './lojo-tuosai.js';

const size = 256; // px

/**
 * Generate buffer of an identicon by seed
 */
export async function genIdenticon(seed: string): Promise<Buffer> {
	return await sharp(Buffer.from(tuosai(seed, { size }))).png().toBuffer();
}
