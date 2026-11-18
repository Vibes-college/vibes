<!--
SPDX-FileCopyrightText: Vibes
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 资料页第二个标签「学习」（2026-11-17，创始人「把学习格子和毕业作品放进个人资料页」）：学习格子、置顶的毕业作品、「我是怎么学的」。
数据和「谁能看到什么」由社区后端给（lojo/learn/show），这里只管画；本人多看到公开状态、「交 / 管理毕业作品」（/my/learn）和「保存分享图」。
从旧地址 /apps/works/u/<用户名>/<专业> 跳来的带 ?work=<专业>，那份作品直接展开。 -->
<template>
<div class="_spacer" style="--MI_SPACER-w: 700px;">
	<MkLoading v-if="view == null && failed == null"/>
	<MkError v-else-if="view == null" @retry="load()"/>
	<div v-else-if="!view.owner && nothingToShow(view)" :class="$style.empty" class="_panel">
		<i class="ti ti-school"></i> {{ learnLabels.empty }}
	</div>
	<div v-else class="_gaps">
		<div v-if="me" :class="$style.mine" class="_panel">
			<MkInfo :warn="me.takenDown">{{ status }}</MkInfo>
			<div :class="$style.buttons">
				<MkButton type="routerLink" to="/my/learn" rounded primary><i class="ti ti-pencil"></i> {{ learnLabels.manage }}</MkButton>
				<MkButton rounded @click="share()"><i class="ti ti-photo-down"></i> {{ learnLabels.share }}</MkButton>
			</div>
		</div>

		<div v-if="me && works.length === 0" :class="$style.start" class="_panel">
			<div :class="$style.startTitle"><i class="ti ti-certificate"></i> {{ learnLabels.startTitle }}</div>
			<p>{{ learnLabels.start(myMajor.name, myMajor.capstone) }}</p>
			<MkButton type="routerLink" to="/my/learn#work" rounded primary>{{ learnLabels.startButton(myMajor.name) }}</MkButton>
			<p :class="$style.hint">{{ learnLabels.startHint }} <MkA to="/quest" class="_link">{{ learnLabels.startHintLink }}</MkA></p>
		</div>

		<div v-if="studying.length > 0 || graduated.length > 0 || contactHref" :class="$style.majors">
			<span v-if="studying.length > 0" :class="$style.chip"><i class="ti ti-book"></i> {{ learnLabels.studying }}{{ studying.join(learnLabels.listSep) }}</span>
			<span v-if="graduated.length > 0" :class="$style.chip"><i class="ti ti-certificate"></i> {{ learnLabels.graduated }}{{ graduated.join(learnLabels.listSep) }}</span>
			<MkButton v-if="contactHref" type="a" :href="contactHref" target="_blank" rel="noopener nofollow" small rounded><i class="ti ti-mail"></i> {{ learnLabels.contact }}</MkButton>
		</div>

		<MkContainer v-if="works.length > 0">
			<template #icon><i class="ti ti-pin"></i></template>
			<template #header>{{ learnLabels.works }}</template>
			<div :class="$style.works">
				<XWork v-for="w in works" :key="w.major" v-model:open="opened[w.major]" :work="w" :data-major="w.major"/>
			</div>
		</MkContainer>

		<MkContainer v-if="view.grid && view.today">
			<template #icon><i class="ti ti-calendar"></i></template>
			<template #header>{{ learnLabels.grid }}</template>
			<div :class="$style.pad">
				<XGrid :days="view.grid" :today="view.today"/>
			</div>
		</MkContainer>

		<MkContainer v-if="(view.how ?? []).length > 0">
			<template #icon><i class="ti ti-route"></i></template>
			<template #header>{{ learnLabels.how }}</template>
			<dl :class="[$style.pad, $style.rows]" class="_selectable">
				<template v-for="[k, v] in view.how" :key="k">
					<dt>{{ k }}</dt>
					<dd>{{ v }}</dd>
				</template>
			</dl>
		</MkContainer>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, reactive, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import XGrid from './LearnGrid.vue';
import XWork from './LearnWork.vue';
import { fetchLearn, halfYear, majorText, nothingToShow, safeHref } from './learn.js';
import type { LearnView } from './learn.js';
import { learnText as learnLabels } from '@/lojo/locales/learn.js';
import { drawShareImage, shareFileName } from './share-image.js';
import MkButton from '@/components/MkButton.vue';
import MkContainer from '@/components/MkContainer.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os.js';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const view = ref<LearnView | null>(null);
const failed = ref<unknown>(null);
const opened = reactive<Record<string, boolean>>({});
const me = computed(() => view.value?.me ?? null);
const works = computed(() => view.value?.works ?? []);
const contactHref = computed(() => safeHref(view.value?.contact?.href));
const myMajor = computed(() => majorText(me.value?.major ?? 'ielts'));
const studying = computed(() => (view.value?.studying ?? []).map(m => majorText(m).name));
// 「已毕业」：交了哪个专业的作品、哪半年交的（北京时间）
const graduated = computed(() => works.value.map(w => learnLabels.graduatedItem(majorText(w.major).name, halfYear(w.createdAt))));

const status = computed(() => {
	const m = me.value;
	if (m == null) return '';
	if (m.takenDown) return learnLabels.meTakenDown;
	if (!m.isPublic) return learnLabels.mePrivate;
	return learnLabels.mePublic;
});

let seq = 0;

async function load(): Promise<void> {
	const n = ++seq;
	failed.value = null;
	// 别的站的人：「学习」标签只有本站用户有，同名的本站用户不是 TA
	if (props.user.host != null) {
		view.value = { owner: false, visible: false };
		return;
	}
	try {
		const v = await fetchLearn(props.user.username);
		if (n !== seq) return;
		view.value = v;
	} catch (err) {
		if (n !== seq) return;
		view.value = null;
		failed.value = err;
	}
}

// 从旧地址跳来的：那份作品展开，滚到它
const wanted = new URLSearchParams(window.location.search).get('work');
watch(view, async v => {
	if (wanted == null || v == null || !(v.works ?? []).some(w => w.major === wanted) || opened[wanted] != null) return;
	opened[wanted] = true;
	await nextTick();
	window.document.querySelector(`[data-major="${CSS.escape(wanted)}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
});

watch(() => props.user.id, () => {
	view.value = null;
	void load();
}, { immediate: true });

async function share(): Promise<void> {
	const m = me.value;
	if (m == null) return;
	const url = (await drawShareImage(m.share)).toDataURL('image/png');
	const download = !window.matchMedia('(pointer: coarse)').matches;
	if (download) {
		const a = window.document.createElement('a');
		a.href = url;
		a.download = shareFileName(m.share);
		window.document.body.appendChild(a);
		a.click();
		a.remove();
	}
	const { dispose } = os.popup(defineAsyncComponent(() => import('./LearnShareDialog.vue')), { src: url, isPublic: m.public, downloaded: download }, {
		closed: () => dispose(),
	});
}
</script>

<style lang="scss" module>
.empty {
	padding: 24px 16px;
	text-align: center;
	color: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent);
}

.mine {
	padding: 12px;
}

.buttons {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 12px;
}

.start {
	padding: 16px;

	> p {
		margin: 8px 0 12px;
		line-height: 1.7;
	}
}

.startTitle {
	font-weight: bold;
}

.hint {
	font-size: 0.85em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent);
}

.majors {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.chip {
	padding: 4px 12px;
	border-radius: 999px;
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 0.9em;
}

.works {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
}

.pad {
	padding: 16px;
}

.rows {
	display: grid;
	grid-template-columns: max-content 1fr;
	gap: 8px 16px;
	margin: 0;

	> dt {
		font-weight: bold;
		color: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
	}

	> dd {
		margin: 0;
		overflow-wrap: anywhere;
		line-height: 1.6;
	}
}
</style>
