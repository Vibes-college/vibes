<!--
SPDX-FileCopyrightText: Vibes
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 「保存分享图」画好以后弹出来：手机上长按图片保存；电脑上已经直接下载了，这里给看一眼。 -->
<template>
<MkModal ref="modal" :preferType="'dialog'" @click="modal?.close()" @closed="emit('closed')" @esc="modal?.close()">
	<div :class="$style.root" class="_panel">
		<div :class="$style.title">{{ learnLabels.shareTitle }}</div>
		<img :class="$style.img" :src="src" :alt="learnLabels.shareTitle">
		<p :class="$style.text">{{ downloaded ? learnLabels.shareDownloaded : learnLabels.shareSave }}</p>
		<p v-if="!isPublic" :class="$style.text">{{ learnLabels.sharePrivate }}</p>
		<MkButton rounded :class="$style.close" @click="modal?.close()">{{ learnLabels.shareClose }}</MkButton>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import { learnText as learnLabels } from '@/lojo/locales/learn.js';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';

defineProps<{
	src: string;
	isPublic: boolean;
	downloaded: boolean;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const modal = useTemplateRef('modal');
</script>

<style lang="scss" module>
.root {
	box-sizing: border-box;
	margin: auto;
	width: min(400px, calc(100vw - 32px));
	max-height: calc(100dvh - 32px);
	overflow: auto;
	padding: 20px;
	text-align: center;
}

.title {
	font-weight: bold;
	margin-bottom: 12px;
}

.img {
	display: block;
	width: 100%;
	max-height: 60dvh;
	object-fit: contain;
	border-radius: var(--MI-radius);
	-webkit-touch-callout: default;
}

.text {
	margin: 12px 0 0;
	font-size: 0.9em;
}

.close {
	margin: 16px auto 0;
}
</style>
