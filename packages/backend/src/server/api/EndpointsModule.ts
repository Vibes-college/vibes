/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';

import { CoreModule } from '@/core/CoreModule.js';
import { LojoGuideService } from '@/core/LojoGuideService.js';
import { LojoService } from '@/core/LojoService.js';
import { LojoEnglishService } from '@/core/LojoEnglishService.js';
import { LojoSpeechService } from '@/core/LojoSpeechService.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import * as endpointsObject from './endpoint-list.js';
import { GetterService } from './GetterService.js';
import { ApiLoggerService } from './ApiLoggerService.js';
import type { Provider } from '@nestjs/common';

const endpoints = Object.entries(endpointsObject);
const endpointProviders = endpoints.map(([path, endpoint]): Provider => ({ provide: `ep:${path}`, useClass: endpoint.default }));

@Module({
	imports: [
		CoreModule,
	],
	providers: [
		LojoService,
		LojoGuideService,
		LojoEnglishService,
		LojoSpeechService,
		LojoTutorService,
		GetterService,
		ApiLoggerService,
		...endpointProviders,
	],
	exports: [
		...endpointProviders,
	],
})
export class EndpointsModule {}
