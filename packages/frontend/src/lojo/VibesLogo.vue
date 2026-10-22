<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- The Vibes logo: the full wordmark, or just the i (for narrow places). Letters follow the theme's brand ink. -->
<template>
<svg v-if="variant === 'i'" :viewBox="VIBES_I.viewBox" role="img" aria-label="Vibes" v-html="VIBES_I.body"></svg>
<svg v-else :viewBox="VIBES_WORDMARK.viewBox" role="img" aria-label="Vibes"><path :d="VIBES_WORDMARK.d" fill="currentColor"/><g v-html="VIBES_WORDMARK.dot"></g></svg>
</template>

<script lang="ts" setup>
import { VIBES_I, VIBES_WORDMARK } from '@/lojo/vibes-logo.js';

withDefaults(defineProps<{ variant?: 'wordmark' | 'i' }>(), { variant: 'wordmark' });
</script>
