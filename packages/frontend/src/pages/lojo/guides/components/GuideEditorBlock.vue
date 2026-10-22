<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section class="_panel" :class="$style.block" :data-guide-editor-block="block.id">
	<header :class="$style.header">
		<span><i :class="blockIcons[block.type]"></i> {{ guideLabels[block.type] }}</span>
		<div :class="$style.actions">
			<button class="_button" :aria-label="guideLabels.moveUp" :disabled="first" @click="emit('move', -1)"><i class="ti ti-arrow-up"></i></button>
			<button class="_button" :aria-label="guideLabels.moveDown" :disabled="last" @click="emit('move', 1)"><i class="ti ti-arrow-down"></i></button>
			<button class="_button" :aria-label="guideLabels.removeBlock" @click="emit('remove')"><i class="ti ti-x"></i></button>
		</div>
	</header>
	<div class="_gaps">
		<template v-if="block.type === 'heading'">
			<MkSelect v-model="level" :items="headingLevels"><template #label>{{ guideLabels.headingLevel }}</template></MkSelect>
			<MkInput v-model="text"><template #label>{{ guideLabels.heading }}</template></MkInput>
		</template>
		<MkTextarea v-else-if="block.type === 'paragraph'" v-model="text" tall><template #label>{{ guideLabels.paragraph }}</template></MkTextarea>
		<template v-else-if="['image', 'video', 'audio'].includes(block.type)">
			<img v-if="block.type === 'image' && safeUrl" :src="safeUrl" :alt="block.caption || ''" :class="$style.image"/>
			<video v-else-if="block.type === 'video' && safeUrl" :src="safeUrl" :class="$style.video" controls preload="metadata" playsinline></video>
			<audio v-else-if="block.type === 'audio' && safeUrl" :src="safeUrl" :class="$style.audio" controls preload="metadata"></audio>
			<MkButton @click="chooseMedia"><i class="ti ti-upload"></i> {{ guideLabels.uploadMedia }}</MkButton>
			<MkInput v-model="url" type="url"><template #label>{{ guideLabels.mediaUrl }}</template></MkInput>
			<MkInput v-model="caption"><template #label>{{ guideLabels.caption }}</template></MkInput>
		</template>
		<MkTextarea v-else-if="block.type === 'checklist'" v-model="items" :placeholder="guideLabels.checklistPlaceholder" tall><template #label>{{ guideLabels.checklistItems }}</template></MkTextarea>
		<template v-else-if="block.type === 'resource'">
			<MkSelect v-model="resourceKind" :items="resourceKinds"><template #label>{{ guideLabels.resourceKind }}</template></MkSelect>
			<MkInput v-model="resourceTitle"><template #label>{{ guideLabels.resourceTitle }}</template></MkInput>
			<MkTextarea v-model="resourceDescription"><template #label>{{ guideLabels.resourceDescription }}</template></MkTextarea>
			<MkInput v-model="resourceUrl" type="url"><template #label>{{ guideLabels.resourceUrl }}</template></MkInput>
			<MkInput v-model="resourceMeta"><template #label>{{ guideLabels.resourceMeta }}</template></MkInput>
		</template>
	</div>
</section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { GuideBlock } from '@/lojo/guides/types.js';
import { guideLabels, guideSafeUrl } from '../labels.js';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import { selectFile } from '@/utility/drive.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

defineProps<{ first: boolean; last: boolean }>();
const block = defineModel<GuideBlock>({ required: true });
const emit = defineEmits<{
	(ev: 'move', direction: number): void;
	(ev: 'remove'): void;
}>();

const blockIcons = {
	heading: 'ti ti-heading', paragraph: 'ti ti-align-left', image: 'ti ti-photo',
	video: 'ti ti-video', audio: 'ti ti-music', checklist: 'ti ti-list-check', resource: 'ti ti-link',
};
const headingLevels = [{ value: 2, label: guideLabels.heading2 }, { value: 3, label: guideLabels.heading3 }];
const resourceKinds = ['tool', 'service', 'map', 'guide'].map(value => ({ value, label: guideLabels[value as 'tool' | 'service' | 'map' | 'guide'] }));
const text = computed({ get: () => block.value.text ?? '', set: value => { block.value = { ...block.value, text: value }; } });
const caption = computed({ get: () => block.value.caption ?? '', set: value => { block.value = { ...block.value, caption: value }; } });
const url = computed({ get: () => block.value.url ?? '', set: value => { block.value = { ...block.value, url: value }; } });
const level = computed({ get: () => block.value.level ?? 2, set: value => { block.value = { ...block.value, level: value as 2 | 3 }; } });
const items = computed({ get: () => (block.value.items ?? []).join('\n'), set: value => { block.value = { ...block.value, items: value.split('\n') }; } });
const safeUrl = computed(() => guideSafeUrl(block.value.url));

function updateResource(patch: Partial<NonNullable<GuideBlock['resource']>>) {
	block.value = {
		...block.value,
		resource: { kind: 'tool', title: '', description: '', url: '', ...block.value.resource, ...patch },
	};
}

const resourceKind = computed({ get: () => block.value.resource?.kind ?? 'tool', set: value => updateResource({ kind: value as NonNullable<GuideBlock['resource']>['kind'] }) });
const resourceTitle = computed({ get: () => block.value.resource?.title ?? '', set: value => updateResource({ title: value }) });
const resourceDescription = computed({ get: () => block.value.resource?.description ?? '', set: value => updateResource({ description: value }) });
const resourceUrl = computed({ get: () => block.value.resource?.url ?? '', set: value => updateResource({ url: value }) });
const resourceMeta = computed({ get: () => block.value.resource?.meta ?? '', set: value => updateResource({ meta: value }) });

async function chooseMedia(event: PointerEvent) {
	try {
		const file = await selectFile({ anchorElement: event.currentTarget ?? event.target, label: guideLabels.uploadMedia, multiple: false });
		if (!file.type.startsWith(`${block.value.type}/`)) {
			os.alert({ type: 'warning', text: guideLabels.chooseMedia });
			return;
		}
		block.value = { ...block.value, url: file.url, caption: block.value.caption || file.comment || '' };
	} catch {
		os.alert({ type: 'error', text: i18n.ts.failedToUpload });
	}
}
</script>

<style lang="scss" module>
.block { padding: 18px 20px 22px; }
.header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; color: var(--MI_THEME-fgTransparentWeak); font-size: 13px; }
.header > span { display: flex; gap: 8px; align-items: center; }
.actions { display: flex; gap: 4px; }
.actions button { width: 32px; height: 32px; border-radius: 50%; }
.actions button:not(:disabled):hover { background: var(--MI_THEME-buttonHoverBg); }
.actions button:disabled { opacity: 0.3; }
.image, .video { display: block; max-width: 100%; max-height: 360px; margin: 0 auto; border-radius: var(--MI-radius); }
.audio { width: 100%; }
@media (max-width: 550px) { .block { padding: 14px 16px 18px; } }
</style>
