<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- The chat with Vibi inside the corner panel (LojoAgent.vue): the same page as /chat/user/<Vibi>, run by its own router,
the way MkPageWindow runs a page in a window. Links to anywhere else open in the main page. -->
<template>
<RouterView :router="panelRouter"/>
</template>

<script lang="ts" setup>
import { provide, ref } from 'vue';
import type { PageMetadata } from '@/page.js';
import RouterView from '@/components/global/RouterView.vue';
import { DI } from '@/di.js';
import { createRouter, mainRouter } from '@/router.js';
import { provideMetadataReceiver, provideReactiveMetadata } from '@/page.js';

const props = defineProps<{
	path: string;
}>();

const emit = defineEmits<{
	(ev: 'left'): void;
}>();

const panelRouter = createRouter(props.path);
panelRouter.navHook = fullPath => {
	if (fullPath.startsWith(props.path)) return false;
	mainRouter.pushByPath(fullPath);
	emit('left');
	return true;
};
panelRouter.init(true);

const pageMetadata = ref<PageMetadata | null>(null);
provide(DI.router, panelRouter);
provideMetadataReceiver(getter => { pageMetadata.value = getter(); });
provideReactiveMetadata(pageMetadata);
provide('shouldOmitHeaderTitle', true);
provide('shouldHeaderThin', true);
</script>
