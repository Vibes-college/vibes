<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA v-if="route" :to="route" :class="$style.link" @click.stop><i class="ti ti-map-pin"></i> {{ lojoLabels.backToMap }}</MkA>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { url as instanceUrl } from '@@/js/config.js';
import { lojoLabels } from '@/lojo/labels.js';
import { mapRouteFromText } from '@/lojo/entity-link.js';

const props = defineProps<{ text?: string | null }>();
const route = computed(() => mapRouteFromText(props.text, new URL(instanceUrl).origin) ?? mapRouteFromText(props.text, window.location.origin));
</script>

<style lang="scss" module>
.link {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	margin-top: 10px;
	padding: 7px 12px;
	border-radius: 999px;
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-accent);
	font-size: 0.85em;
}
</style>
