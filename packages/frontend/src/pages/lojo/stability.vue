<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
Vibes stability report (admin → 稳定性日报): one card per day, Beijing time, made from the anonymous start-up records
(src/lojo/boot-report.ts, kept 14 days; what is kept: packages/backend/src/misc/lojo-boot-report.ts).
-->

<template>
<PageWithHeader :actions="headerActions">
	<div class="_spacer" style="--MI_SPACER-w: 760px;">
		<p :class="$style.note">{{ labels.note }}</p>
		<MkLoading v-if="loading"/>
		<p v-else-if="failed" :class="$style.note" role="alert">{{ labels.failed }}</p>
		<div v-else class="_gaps">
			<section v-for="day in days" :key="day.day" :class="$style.day" data-testid="stability-day">
				<header :class="$style.head">
					<b>{{ day.day }}</b>
					<span :class="$style.muted">{{ labels.loads(day.loads) }}</span>
				</header>
				<p v-if="day.loads === 0" :class="$style.muted">{{ labels.none }}</p>
				<dl v-else :class="$style.rows">
					<dt>{{ labels.failedStarts }}</dt>
					<dd :class="{ [$style.bad]: day.failed > 0 }">{{ day.failed }}<template v-if="day.failed > 0">（{{ counts(day.errors) }}）</template></dd>
					<dt>{{ labels.retried }}</dt>
					<dd>{{ day.retried }}</dd>
					<dt>{{ labels.boot }}</dt>
					<dd>{{ spread(day.bootMs) }}</dd>
					<dt>{{ labels.bootWarm }}</dt>
					<dd>{{ spread(day.bootMsWarm) }}</dd>
					<dt>{{ labels.bootCold }}</dt>
					<dd>{{ spread(day.bootMsCold) }}</dd>
					<dt>{{ labels.content }}</dt>
					<dd>{{ spread(day.contentMs) }}<template v-if="day.contentMs.n > 0">；{{ labels.kept(day.keptContent, day.contentMs.n) }}</template></dd>
					<dt>{{ labels.firstApi }}</dt>
					<dd>{{ spread(day.firstApiMs) }}</dd>
					<dt>{{ labels.devices }}</dt>
					<dd>{{ counts(day.os) }}；{{ counts(day.browser) }}；{{ labels.standalone(day.standalone) }}</dd>
					<template v-if="day.slowestPages.length > 0">
						<dt>{{ labels.slowest }}</dt>
						<dd>{{ day.slowestPages.map(p => `${p.page} ${seconds(p.p90BootMs)}`).join('，') }}</dd>
					</template>
				</dl>
			</section>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { definePage } from '@/page.js';
import { misskeyApi } from '@/utility/misskey-api.js';

type Spread = { p50: number | null; p90: number | null; n: number };
type Day = {
	day: string; loads: number; started: number; failed: number; errors: Record<string, number>; retried: number;
	bootMs: Spread; bootMsWarm: Spread; bootMsCold: Spread; contentMs: Spread; keptContent: number; firstApiMs: Spread;
	os: Record<string, number>; browser: Record<string, number>; standalone: number;
	slowestPages: { page: string; n: number; p90BootMs: number | null }[];
};

const labels = {
	title: '稳定性日报',
	note: '每次打开网页留一条匿名记录（不含账号、IP 和具体网址），按北京时间每天汇总，保留 14 天。"一般"是中位数，"慢的时候"是最慢的 10%。',
	failed: '日报暂时拿不到，稍后再试。',
	none: '这天没有记录。',
	loads: (n: number) => `打开 ${n} 次`,
	failedStarts: '没打开成功',
	retried: '自动重试过',
	boot: '打开到能用',
	bootWarm: '　程序已在手机上',
	bootCold: '　要下载程序',
	content: '看到内容（时间线、通知）',
	kept: (kept: number, n: number) => `${Math.round(kept / n * 100)}% 先显示手机里存的`,
	firstApi: '服务器第一次回应',
	devices: '设备',
	standalone: (n: number) => `从主屏幕打开 ${n} 次`,
	slowest: '最慢的页面',
	reload: '刷新',
};

const days = ref<Day[]>([]);
const loading = ref(true);
const failed = ref(false);

function seconds(ms: number | null): string {
	return ms == null ? '—' : `${(ms / 1000).toFixed(1)} 秒`;
}

function spread(s: Spread): string {
	if (s.n === 0) return '—';
	return `一般 ${seconds(s.p50)}，慢的时候 ${seconds(s.p90)}（${s.n} 次）`;
}

function counts(map: Record<string, number>): string {
	return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join('、');
}

async function load() {
	loading.value = true;
	failed.value = false;
	try {
		days.value = await misskeyApi('lojo/admin/boot-report', { days: 14 }) as unknown as Day[];
	} catch {
		failed.value = true;
	} finally {
		loading.value = false;
	}
}

onMounted(load);

const headerActions = computed(() => [{
	icon: 'ti ti-refresh',
	text: labels.reload,
	handler: load,
}]);

definePage(() => ({
	title: labels.title,
	icon: 'ti ti-activity-heartbeat',
}));
</script>

<style lang="scss" module>
.note {
	margin: 0 0 16px;
	color: var(--MI_THEME-fgTransparentWeak);
	font-size: 0.9em;
}

.day {
	padding: 14px 16px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
}

.head {
	display: flex;
	justify-content: space-between;
	margin-bottom: 8px;
}

.muted {
	color: var(--MI_THEME-fgTransparentWeak);
}

.rows {
	display: grid;
	grid-template-columns: max-content 1fr;
	gap: 6px 14px;
	margin: 0;
	font-size: 0.92em;

	dt {
		color: var(--MI_THEME-fgTransparentWeak);
	}

	dd {
		margin: 0;
	}
}

.bad {
	color: var(--MI_THEME-error);
	font-weight: bold;
}
</style>
