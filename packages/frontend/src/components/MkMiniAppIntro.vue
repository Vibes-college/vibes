<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type, maxHeight }" :preferType="preferedModalType" :anchor="anchor" :transparentBg="true" :anchorElement="anchorElement" @click="modal?.close()" @closed="emit('closed')" @esc="modal?.close()">
	<div class="_popup _shadow" :class="[$style.root, { [$style.asDrawer]: type === 'drawer' }]" :style="{ maxHeight: maxHeight ? maxHeight + 'px' : '' }">
		<div :class="$style.main">
			<div :class="$style.header">
				<i :class="[$style.headerIcon, app.icon]"></i>
				<div :class="$style.headerName">{{ app.name }}</div>
			</div>
			<p :class="$style.summary">{{ app.intro.summary }}</p>
			<p :class="$style.audience">{{ miniAppsLabels.audiencePrefix }}{{ app.intro.audience }}</p>
			<div :class="$style.sectionTitle">{{ miniAppsLabels.stepsTitle }}</div>
			<ol :class="$style.steps">
				<li v-for="(step, i) in app.intro.steps" :key="i">{{ step }}</li>
			</ol>
			<template v-if="app.intro.caveats.length > 0">
				<div :class="$style.sectionTitle">{{ miniAppsLabels.caveatsTitle }}</div>
				<ul :class="$style.caveats">
					<li v-for="(caveat, i) in app.intro.caveats" :key="i">{{ caveat }}</li>
				</ul>
			</template>
		</div>
		<div :class="$style.footer">
			<MkButton primary rounded gradate full @click="open">{{ miniAppsLabels.openButton }}</MkButton>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import { openMiniAppLink } from '@/lojo/miniapps/manifest.js';
import type { MiniAppDef } from '@/lojo/miniapps/manifest.js';
import { miniAppsLabels } from '@/lojo/miniapps/labels.js';
import { markMiniAppSeen } from '@/lojo/miniapps/state.js';
import { deviceKind } from '@/utility/device-kind.js';
import { useRouter } from '@/router.js';

const props = withDefaults(defineProps<{
	app: MiniAppDef;
	anchorElement?: HTMLElement | null;
	anchor?: { x: string; y: string; };
}>(), {
	anchorElement: null,
	anchor: () => ({ x: 'right', y: 'center' }),
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const preferedModalType = (deviceKind === 'desktop' && props.anchorElement != null) ? 'popup' :
	deviceKind === 'smartphone' ? 'drawer' :
	'dialog';

const modal = useTemplateRef('modal');
const router = useRouter();

async function open(): Promise<void> {
	// A failed write just means the intro shows again next time; still open the app now.
	await markMiniAppSeen(props.app.id).catch(() => {});
	openMiniAppLink(props.app.link, router);
	modal.value?.close();
}
</script>

<style lang="scss" module>
.root {
	max-height: 100%;
	width: min(460px, 100vw);
	margin: auto;
	box-sizing: border-box;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	border-radius: 16px;

	&.asDrawer {
		width: 100%;
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
	}
}

.main {
	padding: 24px;
	overflow: auto;
	overscroll-behavior: contain;
	line-height: 1.6;
}

.header {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 12px;
}

.headerIcon {
	font-size: 24px;
	color: var(--MI_THEME-accent);
}

.headerName {
	font-size: 1.1em;
	font-weight: bold;
}

.summary {
	margin: 0 0 8px 0;
}

.audience {
	margin: 0 0 16px 0;
	color: var(--MI_THEME-fgTransparentWeak);
}

.sectionTitle {
	font-weight: bold;
	margin: 16px 0 8px 0;
}

.steps,
.caveats {
	margin: 0;
	padding-left: 1.4em;
}

.steps > li,
.caveats > li {
	margin-bottom: 6px;
}

.footer {
	position: sticky;
	z-index: 1;
	bottom: 0;
	left: 0;
	flex-shrink: 0;
	padding: 12px 16px max(env(safe-area-inset-bottom, 0px), 12px) 16px;
	border-top: solid 0.5px var(--MI_THEME-divider);
	-webkit-backdrop-filter: blur(15px);
	backdrop-filter: blur(15px);
}
</style>
