<!-- SPDX-License-Identifier: AGPL-3.0-only -->
<template><a :href="to"><slot/></a></template>
<script lang="ts" setup>defineProps<{ to: string }>();</script>
