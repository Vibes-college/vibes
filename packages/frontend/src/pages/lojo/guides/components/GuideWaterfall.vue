<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.grid" data-testid="guide-waterfall">
	<div v-for="(guide, i) in guides" :key="guide.id" :data-guide-card="guide.id" :data-scroll-anchor="guide.id" :class="$style.item">
		<GuideBook :guide="guide" :look="looks[i]" :index="i" :busy="bookmarkBusy.has(guide.id)" @bookmark="emit('bookmark', $event)"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import GuideBook from './GuideBook.vue';
import { bookLooks } from '../shelves.js';
import type { Guide } from '@/lojo/guides/types.js';

const props = defineProps<{ guides: Guide[]; bookmarkBusy: Set<string> }>();
const emit = defineEmits<{ (ev: 'bookmark', guide: Guide): void }>();
// Same cloth as on the bookshelf, so a book looks the same in both places.
const looks = computed(() => bookLooks(props.guides));
</script>

<style lang="scss" module>
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 46px 22px; align-items: start; padding: 18px 10px 24px; }
.item { min-width: 0; }
@container (min-width: 580px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 56px 34px; padding: 26px 18px 32px; } }
@container (min-width: 1000px) { .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@container (max-width: 360px) { .grid { column-gap: 16px; } }
</style>
