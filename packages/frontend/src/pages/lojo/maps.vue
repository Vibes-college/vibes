<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- All route maps: every course, grouped by subject, filterable by system, searchable. Courses not built yet show as planned. -->
<template>
<div :class="$style.root">
	<MkPageHeader :canOmitTitle="false" :class="$style.header"/>
	<div :class="$style.body">
		<MkInput v-model="q" type="search" :placeholder="lojoLabels.mapsSearch" autocapitalize="off">
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
		<div :class="$style.filters">
			<button v-for="f in filters" :key="f.id" class="_button" :class="[$style.filter, { [$style.on]: system === f.id }]" @click="system = f.id">{{ f.label }}</button>
		</div>

		<section v-if="!q && system === 'all'" :class="$style.section">
			<h2 :class="$style.h2">{{ lojoLabels.mapsMine }}</h2>
			<p v-if="mine.length === 0" :class="$style.muted">{{ lojoLabels.mapsMineEmpty }}</p>
			<div v-else :class="$style.grid">
				<MkA v-for="c in mine" :key="c.id" :to="coursePath(c.id)" :class="[$style.card, $style.ready]" :style="{ '--c': subjectOf(c).color }">
					<span :class="$style.badge">{{ systemLabel(c.system) }}</span>
					<b :class="$style.title">{{ c.title[lc] }}</b>
					<span :class="$style.meta">{{ progress(c) }}</span>
					<i :class="$style.bar"><i :style="{ width: pct(c) }"></i></i>
				</MkA>
			</div>
		</section>

		<section v-for="g in groups" :key="g.subject.id" :class="$style.section">
			<h2 :class="$style.h2">
				<svg v-if="g.subject.dot && dots[g.subject.dot]" :class="$style.dot" viewBox="-110 -110 220 220" aria-hidden="true" v-html="dots[g.subject.dot]"></svg>
				<i v-else :class="$style.dot0" :style="{ background: g.subject.color }"></i>
				{{ g.subject[lc] }}<small>{{ g.courses.length }}</small>
			</h2>
			<div :class="$style.grid">
				<template v-for="c in g.courses" :key="c.id">
					<div v-if="c.ready" :class="[$style.card, $style.ready]" :style="{ '--c': g.subject.color }">
						<MkA :to="coursePath(c.id)" :class="$style.cardLink">
							<span :class="$style.badge">{{ systemLabel(c.system) }}</span>
							<b :class="$style.title">{{ c.title[lc] }}</b>
							<span :class="$style.meta">{{ progress(c) }}</span>
						</MkA>
						<button class="_button" :class="[$style.pin, { [$style.pinned]: mineIds.includes(c.id) }]" :aria-label="mineIds.includes(c.id) ? lojoLabels.mapsRemove : lojoLabels.mapsAdd" :title="mineIds.includes(c.id) ? lojoLabels.mapsRemove : lojoLabels.mapsAdd" @click="toggleMine(c.id)">
							<i :class="mineIds.includes(c.id) ? 'ti ti-check' : 'ti ti-plus'"></i>
						</button>
					</div>
					<div v-else :class="$style.card" :style="{ '--c': g.subject.color }">
						<span :class="$style.badge">{{ systemLabel(c.system) }}</span>
						<b :class="$style.title">{{ c.title[lc] }}</b>
						<span :class="$style.meta">{{ lojoLabels.mapsPlanned }}</span>
					</div>
				</template>
			</div>
		</section>

		<p v-if="groups.length === 0" :class="$style.muted">{{ lojoLabels.mapsEmpty }}</p>
		<p v-else :class="$style.note">{{ lojoLabels.mapsNote }}</p>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { lang } from '@@/js/config.js';
import { lojoLabels } from '@/lojo/labels.js';
import { CATALOG, SUBJECTS, SYSTEMS, MY_MAX } from '@/lojo/route/courses/index.js';
import { coursePath, doneCount, loadRouteRegistry, myMaps, saveMyMaps } from '@/lojo/route/my-maps.js';
import type { RouteRegistry } from '@/lojo/route/my-maps.js';
import { VIBES_DOTS } from '@/lojo/vibes-logo.js';
import MkInput from '@/components/MkInput.vue';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import { definePage } from '@/page.js';

type Course = typeof CATALOG[number];
const lc = lang.startsWith('zh') ? 'zh' : 'en';
const dots = VIBES_DOTS;
const q = ref('');
const system = ref('all');
const registry = ref<RouteRegistry>({});
const mineIds = ref<string[]>([]);

const filters = [{ id: 'all', label: lojoLabels.mapsAll }, ...SYSTEMS.map(s => ({ id: s.id, label: s[lc] }))];
const systemLabel = (id: string) => SYSTEMS.find(s => s.id === id)?.[lc] ?? id;
const FALLBACK_SUBJECT: typeof SUBJECTS[number] = { id: 'other', zh: '其他', en: 'Other', color: '#4A4E63' };
const subjectOf = (c: Course) => SUBJECTS.find(s => s.id === c.subject) ?? FALLBACK_SUBJECT;
const done = (c: Course) => 'storeKey' in c ? doneCount(registry.value, c.storeKey) : 0;
const total = (c: Course): number => ('stations' in c ? c.stations : 0) ?? 0;
const progress = (c: Course) => {
	const d = done(c), n = total(c);
	return lc === 'zh' ? `${n} 站${d ? ` · 已到 ${d} 站` : ''}` : `${n} stops${d ? ` · ${d} reached` : ''}`;
};
const pct = (c: Course) => `${total(c) ? Math.round(done(c) / total(c) * 100) : 0}%`;
const mine = computed(() => mineIds.value.map(id => CATALOG.find(c => c.id === id)).filter((c): c is Course => c != null));

// search matches course names, subject names and system names, in both languages
const groups = computed(() => {
	const k = q.value.trim().toLowerCase();
	const hit = (c: Course) => {
		if (system.value !== 'all' && c.system !== system.value) return false;
		if (!k) return true;
		const s = subjectOf(c);
		return [c.title.zh, c.title.en, c.short.zh, c.short.en, s.zh, s.en, systemLabel(c.system)].some(t => t.toLowerCase().includes(k));
	};
	const order = SYSTEMS.map(s => s.id);
	return SUBJECTS.map(subject => ({
		subject,
		courses: CATALOG.filter(c => c.subject === subject.id && hit(c))
			.sort((a, b) => Number(b.ready) - Number(a.ready) || order.indexOf(a.system) - order.indexOf(b.system)),
	})).filter(g => g.courses.length > 0);
});

async function toggleMine(id: string) {
	const was = mineIds.value;
	let next = was.includes(id) ? was.filter(x => x !== id) : [...was, id];
	if (next.length > MY_MAX) next = next.slice(next.length - MY_MAX);
	mineIds.value = next;
	try {
		await saveMyMaps(next);
	} catch {
		mineIds.value = was;
		os.toast(lojoLabels.stateFailed);
	}
}

onMounted(async () => {
	if (!$i) return;
	registry.value = await loadRouteRegistry();
	mineIds.value = myMaps(registry.value);
});

definePage(() => ({ title: lojoLabels.mapsTitle, icon: 'ti ti-layout-grid' }));
</script>

<style lang="scss" module>
.root { min-height: 100%; background: var(--MI_THEME-bg); color: var(--MI_THEME-fg); }
.body { max-width: 980px; margin: 0 auto; padding: 20px 20px 48px; display: flex; flex-direction: column; gap: 14px; }
.filters { display: flex; flex-wrap: wrap; gap: 8px; }
.filter {
	padding: 8px 16px; border-radius: 999px; font-size: 0.92em; font-weight: 600;
	background: var(--MI_THEME-buttonBg); color: var(--MI_THEME-fg);
	&:hover { background: var(--MI_THEME-buttonHoverBg); }
}
.on { background: var(--MI_THEME-accent); color: var(--MI_THEME-fgOnAccent); &:hover { background: var(--MI_THEME-accent); } }
.section { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
.h2 {
	display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.05em; font-weight: 700;
	small { margin-left: 2px; font-weight: 500; opacity: 0.55; font-size: 0.85em; }
}
.dot { width: 26px; height: 26px; flex: none; }
.dot0 { width: 14px; height: 14px; margin: 6px; border-radius: 50%; flex: none; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; }
.card {
	position: relative; display: flex; flex-direction: column; gap: 6px; min-height: 104px; padding: 14px 16px 14px 20px;
	border-radius: 16px; background: var(--MI_THEME-panel); color: var(--MI_THEME-fg); overflow: hidden;
	border: 1px solid var(--MI_THEME-divider);
	&::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: var(--c); opacity: 0.35; }
}
.ready {
	box-shadow: 0 1px 2px rgba(20, 32, 79, 0.06), 0 8px 22px -14px rgba(20, 32, 79, 0.35);
	&::before { opacity: 1; }
	&:hover { border-color: var(--c); }
}
.cardLink { display: flex; flex-direction: column; gap: 6px; color: inherit; text-decoration: none; padding-right: 30px; flex: 1; }
.badge {
	align-self: flex-start; padding: 2px 9px; border-radius: 999px; font-size: 0.75em; font-weight: 700;
	background: color-mix(in srgb, var(--c) 16%, transparent); color: color-mix(in srgb, var(--c) 70%, var(--MI_THEME-fg));
}
.title { font-size: 1.02em; line-height: 1.35; }
.meta { font-size: 0.84em; opacity: 0.62; margin-top: auto; }
.card:not(.ready) .title { opacity: 0.62; }
.bar { display: block; height: 4px; border-radius: 4px; background: var(--MI_THEME-divider); overflow: hidden; > i { display: block; height: 100%; background: var(--c); } }
.pin {
	position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; border-radius: 50%;
	display: grid; place-items: center; background: var(--MI_THEME-buttonBg); color: var(--MI_THEME-fg);
	&:hover { background: var(--MI_THEME-buttonHoverBg); }
}
.pinned { background: var(--c); color: #fff; &:hover { background: var(--c); } }
.muted { margin: 0; opacity: 0.6; font-size: 0.92em; }
.note { margin: 12px 0 0; opacity: 0.55; font-size: 0.85em; text-align: center; }
</style>
