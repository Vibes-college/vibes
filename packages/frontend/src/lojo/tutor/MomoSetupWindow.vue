<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 私信 ⋯ 菜单里的「换个样子 / 改名字」：「认识你的 Momo」的挑脸、起名两步（MomoSetup.vue edit），存好就关。 -->

<template>
<MkModalWindow
	ref="dialog"
	:width="460"
	:height="600"
	@close="dialog?.close()"
	@closed="emit('closed')"
>
	<template #header>{{ L.editTitle }}</template>
	<div style="height: 100cqh; overflow: auto;">
		<XMomoSetup mode="edit" @saved="dialog?.close()"/>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import XMomoSetup from './MomoSetup.vue';
import { momoLabels as L } from './momo-labels.js';
import MkModalWindow from '@/components/MkModalWindow.vue';

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');
</script>
