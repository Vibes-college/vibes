<!--
SPDX-FileCopyrightText: Vibes
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 交 / 管理毕业作品里的一张图（成绩单、做之前、做之后）：贴链接，或者从网盘选 / 上传；只收图片。 -->
<template>
<div class="_gaps_s">
	<MkInput v-model="model" small placeholder="https://">
		<template #label>{{ label }}</template>
		<template #prefix><i class="ti ti-photo"></i></template>
	</MkInput>
	<div class="_buttons">
		<MkButton small rounded @click="upload"><i class="ti ti-upload"></i> {{ uploadLabel }}</MkButton>
		<MkButton v-if="model !== ''" small rounded danger @click="model = ''"><i class="ti ti-x"></i></MkButton>
	</div>
	<img v-if="safe" :class="$style.preview" :src="safe" alt="" loading="lazy" referrerpolicy="no-referrer">
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { learnText as L } from '@/lojo/locales/learn.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import * as os from '@/os.js';
import { selectFile } from '@/utility/drive.js';

defineProps<{
	label: string;
	uploadLabel: string;
}>();

const model = defineModel<string>({ required: true });
const safe = computed(() => (/^https?:\/\/[^\s<>"']+$/.test(model.value.trim()) ? model.value.trim() : null));

async function upload(ev: PointerEvent): Promise<void> {
	const file = await selectFile({ anchorElement: ev.currentTarget ?? ev.target, multiple: false });
	if (!file.type.startsWith('image/')) return void os.alert({ type: 'error', text: L.m.chooseImage });
	model.value = file.url;
}
</script>

<style lang="scss" module>
.preview {
	display: block;
	max-width: 100%;
	max-height: 240px;
	border-radius: var(--MI-radius);
	object-fit: contain;
}
</style>
