/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';

import { CoreModule } from '@/core/CoreModule.js';
import { LojoGuideService } from '@/core/LojoGuideService.js';
import { LojoEnglishService } from '@/core/LojoEnglishService.js';
import { LojoCreateService } from '@/core/LojoCreateService.js';
import { LojoSpeechService } from '@/core/LojoSpeechService.js';
import { LojoTutorService } from '@/core/LojoTutorService.js';
import { LojoGateService } from '@/core/LojoGateService.js';
import { LojoWordService } from '@/core/LojoWordService.js';
import { LojoAppsService } from '@/core/LojoAppsService.js';
import { LojoPlanService } from '@/core/LojoPlanService.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';
import { LojoLearnService } from '@/core/LojoLearnService.js';
import { LojoContentService } from '@/core/LojoContentService.js';
import { LojoUsageService } from '@/core/LojoUsageService.js';
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
		LojoGuideService,
		LojoEnglishService,
		LojoCreateService,
		LojoSpeechService,
		LojoTutorService,
		LojoGateService,
		LojoWordService,
		LojoAppsService,
		LojoPlanService,
		LojoContentService,
		LojoQuestService,
		LojoLearnService,
		LojoUsageService,
		GetterService,
		ApiLoggerService,
		...endpointProviders,
	],
	exports: [
		...endpointProviders,
	],
})
export class EndpointsModule {}
