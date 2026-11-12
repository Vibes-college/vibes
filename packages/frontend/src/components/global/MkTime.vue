<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<time :title="absolute" :class="{ [$style.old1]: colored && (ago > 60 * 60 * 24 * 90), [$style.old2]: colored && (ago > 60 * 60 * 24 * 180) }">
	<template v-if="invalid">{{ i18n.ts._ago.invalid }}</template>
	<template v-else-if="mode === 'relative'">{{ relative }}</template>
	<template v-else-if="mode === 'absolute'">{{ absolute }}</template>
	<template v-else-if="mode === 'detail'">{{ absolute }} ({{ relative }})</template>
</time>
</template>

<script lang="ts" setup>
import isChromatic from 'chromatic/isChromatic';
import { computed } from 'vue';
import { i18n } from '@/i18n.js';
import { dateTimeFormat } from '@@/js/intl-const.js';
import { useLowresTime } from '@/composables/use-lowres-time.js';

const props = withDefaults(defineProps<{
	time: Date | string | number | null;
	origin?: Date | null;
	mode?: 'relative' | 'absolute' | 'detail';
	colored?: boolean;
}>(), {
	origin: isChromatic() ? () => new Date('2023-04-01T00:00:00Z') : null,
	mode: 'relative',
});

function getDateSafe(n: Date | string | number) {
	try {
		if (n instanceof Date) {
			return n;
		}
		return new Date(n);
	} catch (err) {
		return {
			getTime: () => NaN,
		};
	}
}

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const _time = props.time == null ? NaN : getDateSafe(props.time).getTime();
const invalid = Number.isNaN(_time);
const absolute = !invalid ? dateTimeFormat.format(_time) : i18n.ts._ago.invalid;

const actualNow = useLowresTime();
const now = computed(() => (props.origin ? props.origin.getTime() : actualNow.value));

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const ago = computed(() => (now.value - _time) / 1000/*ms*/);

const relative = computed<string>(() => {
	if (props.mode === 'absolute') return ''; // absoluteではrelativeを使わないので計算しない
	if (invalid) return i18n.ts._ago.invalid;

	// Vibes: relative times are always in Chinese, like the rest of the site. Phones set to English got the boot
	// loader's en-US and showed "34s ago" under Chinese messages (founder, 2026-11-11).
	const n = (x: number) => x.toString();
	return (
		ago.value >= 31536000 ? `${n(Math.round(ago.value / 31536000))} 年前` :
		ago.value >= 2592000 ? `${n(Math.round(ago.value / 2592000))} 个月前` :
		ago.value >= 604800 ? `${n(Math.round(ago.value / 604800))} 周前` :
		ago.value >= 86400 ? `${n(Math.round(ago.value / 86400))} 天前` :
		ago.value >= 3600 ? `${n(Math.round(ago.value / 3600))} 小时前` :
		ago.value >= 60 ? `${n(~~(ago.value / 60))} 分钟前` :
		ago.value >= 10 ? `${n(~~(ago.value % 60))} 秒前` :
		ago.value >= -3 ? '刚刚' :
		ago.value < -31536000 ? `${n(Math.round(-ago.value / 31536000))} 年后` :
		ago.value < -2592000 ? `${n(Math.round(-ago.value / 2592000))} 个月后` :
		ago.value < -604800 ? `${n(Math.round(-ago.value / 604800))} 周后` :
		ago.value < -86400 ? `${n(Math.round(-ago.value / 86400))} 天后` :
		ago.value < -3600 ? `${n(Math.round(-ago.value / 3600))} 小时后` :
		ago.value < -60 ? `${n(~~(-ago.value / 60))} 分钟后` :
		`${n(~~(-ago.value % 60))} 秒后`
	);
});
</script>

<style lang="scss" module>
.old1 {
	color: var(--MI_THEME-warn);
}

.old1.old2 {
	color: var(--MI_THEME-error);
}
</style>
