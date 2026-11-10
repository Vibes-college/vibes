<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 闯关: the chapter map game. The game itself is a static page (backend/assets/lojo/quest/) shown in a frame; this page
lends it the community login (api) and the community router (go) through window.__vibesQuest. -->
<template>
<div :class="$style.root">
	<iframe ref="frame" :class="$style.frame" :src="src" title="闯关" allow="autoplay"></iframe>
</div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, ref } from 'vue';
import { definePage } from '@/page.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useRouter } from '@/router.js';
import { markFromQuest } from '@/lojo/quest-refill.js';

const props = defineProps<{
	book?: string;
	level?: string;
}>();

const router = useRouter();
const frame = ref<HTMLIFrameElement | null>(null);
const src = '/lojo-assets/quest/index.html?v=1';

type Bridge = {
	api: (endpoint: string, params?: Record<string, unknown>) => Promise<unknown>;
	go: (path: string) => void;
	query: { book?: string; level?: string };
};

const bridge: Bridge = {
	api(endpoint, params = {}) {
		// Only the game's own endpoints go through the frame.
		if (!/^lojo\/quest\/[a-z-]+$/.test(endpoint)) return Promise.reject({ code: 'NOT_ALLOWED', message: endpoint });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return misskeyApi(endpoint as any, { ...params } as any);
	},
	go(path) {
		if (/^https?:\/\//.test(path)) {
			window.open(path, '_blank', 'noopener');
			return;
		}
		if (!path.startsWith('/')) return;
		if (!path.startsWith('/quest')) markFromQuest();
		router.pushByPath(path);
	},
	query: { book: props.book, level: props.level },
};

(window as unknown as { __vibesQuest?: Bridge }).__vibesQuest = bridge;

onBeforeUnmount(() => {
	const w = window as unknown as { __vibesQuest?: Bridge };
	if (w.__vibesQuest === bridge) delete w.__vibesQuest;
});

definePage(() => ({ title: '闯关', icon: 'ti ti-flag-3' }));
</script>

<style lang="scss" module>
.root {
	height: 100%;
	min-height: calc(100dvh - var(--MI-stickyTop, 0px) - var(--MI-stickyBottom, 0px));
	display: flex;
}

.frame {
	flex: 1;
	width: 100%;
	min-height: inherit;
	border: 0;
	display: block;
	background: #f6efe0;
}
</style>
