<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- Vibes: Vibi's allowance as a card, from the ⋯ menu of a chat with Vibi (founder, 2026-11-11 23:29). On a phone it
slides up from the bottom; on a computer it sits in the middle. No top-up button: there is no way to buy gems yet. -->
<template>
<MkModal ref="modal" v-slot="{ type, maxHeight }" :preferType="modalType" :transparentBg="false" @click="modal?.close()" @closed="emit('closed')" @esc="modal?.close()">
	<div :class="[$style.root, { [$style.asDrawer]: type === 'drawer' }]" :style="{ maxHeight: maxHeight ? maxHeight + 'px' : '' }" data-vibi-usage-sheet role="dialog" :aria-label="t.title">
		<div v-if="type === 'drawer'" :class="$style.grabber"></div>
		<div :class="$style.title">{{ t.title }}</div>
		<MkLoading v-if="usage == null && !failed"/>
		<div v-else-if="failed" :class="$style.note">{{ t.failed }}</div>
		<template v-else-if="usage">
			<div v-for="m in meters" :key="m.key" :class="$style.meter" :data-meter="m.key" :data-level="level(m.pct)">
				<div :class="$style.meterHead">
					<span :class="$style.meterName">{{ m.name }}</span>
					<span :class="[$style.pct, $style[level(m.pct)]]">{{ m.pct }}%</span>
				</div>
				<div :class="$style.track"><div :class="[$style.fill, $style[level(m.pct)]]" :style="{ width: `${Math.min(100, m.pct)}%` }"></div></div>
				<div :class="$style.sub">{{ m.sub }}</div>
			</div>
			<div v-if="usage.gems > 0" :class="$style.gems" data-gems>
				<i class="ti ti-diamond"></i>
				<span>{{ zh ? `宝石 ${gemsText(usage.gems)} 颗` : `${gemsText(usage.gems)} gems` }}</span>
			</div>
			<div :class="$style.note">{{ t.note }}</div>
		</template>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue';
import { lang } from '@@/js/config.js';
import MkModal from '@/components/MkModal.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { deviceKind } from '@/utility/device-kind.js';
import { fiveBackText, gemsText, weekBackText } from '@/lojo/tutor/usage-text.js';
import type { VibiUsage } from '@/lojo/tutor/usage-text.js';

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const zh = lang.startsWith('zh');
const t = zh
	? { title: '用量', five: '5 小时额度', week: '本周额度', note: '额度按实际用量算，用完会自动恢复。', failed: '暂时没取到用量，稍后再看。' }
	: { title: 'Usage', five: '5-hour allowance', week: 'Weekly allowance', note: 'Your allowance follows what you actually use, and comes back on its own.', failed: "Couldn't load your usage. Try again in a moment." };
// A phone (or any narrow window) gets the sheet from the bottom; a computer gets it in the middle.
const modalType = deviceKind === 'smartphone' || window.innerWidth < 600 ? 'drawer' : 'dialog';
const modal = useTemplateRef('modal');
const usage = ref<VibiUsage | null>(null);
const failed = ref(false);
const now = new Date();

misskeyApi('lojo/usage/show', {}).then(u => { usage.value = u as VibiUsage; }, () => { failed.value = true; });

const meters = computed(() => usage.value == null ? [] : [
	{ key: 'five', name: t.five, pct: usage.value.fivePct, sub: fiveBackText(usage.value, now, zh) },
	{ key: 'week', name: t.week, pct: usage.value.weekPct, sub: weekBackText(usage.value, zh) },
]);

// Site colour normally, amber from 80%, a soft red when used up.
function level(pct: number): 'ok' | 'high' | 'full' {
	return pct >= 100 ? 'full' : pct >= 80 ? 'high' : 'ok';
}
</script>

<style lang="scss" module>
.root {
	--vibiAmber: #D9962B;
	--vibiRed: #D9675B;
	width: min(400px, calc(100vw - 32px));
	margin: auto;
	box-sizing: border-box;
	overflow: auto;
	overscroll-behavior: contain;
	padding: 22px 24px 20px;
	border-radius: 20px;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);

	&.asDrawer {
		width: 100%;
		padding: 10px 24px calc(20px + env(safe-area-inset-bottom, 0px));
		border-radius: 24px 24px 0 0;
		box-shadow: 0 -6px 30px rgba(0, 0, 0, 0.1);
	}
}

.grabber {
	width: 36px;
	height: 4px;
	margin: 0 auto 14px;
	border-radius: 2px;
	background: color-mix(in srgb, var(--MI_THEME-fg) 18%, transparent);
}

.title {
	font-size: 17px;
	font-weight: 700;
	margin-bottom: 18px;
}

.meter {
	margin-bottom: 20px;
}

.meterHead {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	margin-bottom: 8px;
}

.meterName {
	font-size: 14px;
	font-weight: 600;
}

.pct {
	font-size: 14px;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
	color: var(--MI_THEME-accent);

	&.high { color: var(--vibiAmber); }
	&.full { color: var(--vibiRed); }
}

.track {
	height: 6px;
	border-radius: 3px;
	background: color-mix(in srgb, var(--MI_THEME-fg) 9%, transparent);
	overflow: hidden;
}

.fill {
	height: 100%;
	min-width: 0;
	border-radius: 3px;
	background: var(--MI_THEME-accent);
	transition: width 0.4s ease;

	&.high { background: var(--vibiAmber); }
	&.full { background: var(--vibiRed); }
}

.sub {
	margin-top: 6px;
	font-size: 12px;
	font-variant-numeric: tabular-nums;
	color: color-mix(in srgb, var(--MI_THEME-fg) 60%, transparent);
}

.gems {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: -4px 0 18px;
	padding: 10px 14px;
	border-radius: 12px;
	font-size: 14px;
	font-variant-numeric: tabular-nums;
	background: color-mix(in srgb, var(--MI_THEME-accent) 8%, transparent);

	> i {
		color: var(--MI_THEME-accent);
	}
}

.note {
	font-size: 12px;
	line-height: 1.5;
	color: color-mix(in srgb, var(--MI_THEME-fg) 60%, transparent);
}
</style>
