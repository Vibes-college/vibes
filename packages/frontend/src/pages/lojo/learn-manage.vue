<!--
SPDX-FileCopyrightText: Vibes
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 交 / 管理毕业作品（/my/learn，2026-11-17）：资料页「学习」标签的本人管理页。之前是单独的个人主页小程序（/apps/works/），
创始人定为社区自己的功能（「跟社区是一体的」），搬进社区，样子跟设置页一样。
上面一块管「学习」标签：公开不公开、「信息」里写哪些频道、联系方式；下面每个专业一份毕业作品（现在只有雅思）。
「怎么学出来的」由后端按学习记录生成，这里不填。从「学习」标签点「去交雅思毕业作品」来的带 #work，直接滚到作品那块。 -->
<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<MkLoading v-if="data == null && !failed"/>
		<MkError v-else-if="data == null" @retry="load()"/>
		<div v-else class="_gaps_m">
			<MkInfo v-if="data.settings.takenDown" warn>{{ L.meTakenDown }}</MkInfo>

			<FormSection first>
				<template #label>{{ M.tabTitle }}</template>
				<template #description>{{ M.tabIntro }}</template>
				<div class="_gaps_m">
					<MkSwitch v-model="isPublic">
						<template #label>{{ M.isPublic }}</template>
						<template #caption>{{ isPublic ? M.publicOn : M.publicOff }}</template>
					</MkSwitch>

					<div class="_gaps_s">
						<div :class="$style.label">{{ M.sources }}</div>
						<div :class="$style.caption">{{ M.sourcesHint }}</div>
						<p v-if="channelChoices.length === 0" :class="$style.caption">{{ M.noChannels }}</p>
						<MkSwitch v-for="c in channelChoices" :key="c" :modelValue="sources.includes(c)" @update:modelValue="v => toggleSource(c, v)">
							<template #label>{{ c }}</template>
						</MkSwitch>
					</div>

					<MkInput v-model="contact" :placeholder="M.contactPlaceholder">
						<template #label>{{ M.contact }}</template>
						<template #prefix><i class="ti ti-mail"></i></template>
						<template #caption>{{ M.contactHint }}</template>
					</MkInput>

					<div class="_buttons">
						<MkButton primary rounded :disabled="busy" @click="saveSettings()"><i class="ti ti-check"></i> {{ M.saveSettings }}</MkButton>
						<MkButton v-if="$i" rounded type="routerLink" :to="`/@${$i.username}/learn`"><i class="ti ti-school"></i> {{ M.seeIt }}</MkButton>
					</div>
				</div>
			</FormSection>

			<FormSection v-for="f in forms" :id="f.major === 'ielts' ? 'work' : `work-${f.major}`" :key="f.major">
				<template #label>
					{{ M.workTitle(f.labels.name) }}
					<span v-if="f.handedIn" :class="$style.badge"><i class="ti ti-certificate"></i> {{ M.handedIn }}</span>
				</template>
				<template #description>{{ M.need(f.labels.capstone) }}</template>
				<div class="_gaps_m">
					<MkInput v-model="f.title" :placeholder="M.titlePlaceholder">
						<template #label>{{ M.title }}</template>
					</MkInput>
					<MkInput v-model="f.oneLine" :placeholder="M.oneLinePlaceholder">
						<template #label>{{ M.oneLine }}</template>
					</MkInput>

					<div class="_gaps_s">
						<div :class="$style.label">{{ M.items }}</div>
						<div :class="$style.caption">{{ M.itemsHint }}</div>
						<div v-for="(it, k) in f.items" :key="k" :class="$style.item" class="_panel">
							<div :class="$style.itemRow">
								<MkSelect v-model="it.kind" :items="kindItems" small :class="$style.kind"/>
								<MkInput v-model="it.url" small placeholder="https://" :class="$style.grow">
									<template #prefix><i class="ti ti-link"></i></template>
								</MkInput>
							</div>
							<MkInput v-model="it.label" small :placeholder="M.itemLabel"/>
							<div class="_buttons">
								<MkButton small rounded @click="ev => uploadItem(ev, it)"><i class="ti ti-upload"></i> {{ M.upload }}</MkButton>
								<MkButton small rounded danger @click="f.items.splice(k, 1)"><i class="ti ti-x"></i> {{ M.removeItem }}</MkButton>
							</div>
						</div>
						<div>
							<MkButton small rounded :disabled="f.items.length >= 8" @click="f.items.push({ kind: 'link', url: '', label: '' })"><i class="ti ti-plus"></i> {{ M.addItem }}</MkButton>
						</div>
					</div>

					<MkTextarea v-model="f.reflection" tall>
						<template #label>{{ f.labels.reflection }}</template>
						<template #caption>{{ f.labels.reflectionHint }}</template>
					</MkTextarea>

					<div class="_gaps_s">
						<div :class="$style.label">{{ f.labels.score }}</div>
						<div :class="$style.caption">{{ f.labels.scoreHint }}</div>
						<MkInput v-model="f.score.text" :placeholder="M.scoreTextPlaceholder">
							<template #label>{{ M.scoreText }}</template>
						</MkInput>
						<XImage v-model="f.score.image" :label="M.image" :uploadLabel="M.uploadImage"/>
					</div>

					<div class="_gaps_s">
						<div :class="$style.label">{{ L.beforeAfter }}</div>
						<div :class="$style.caption">{{ M.beforeAfterHint }}</div>
						<template v-for="side in (['before', 'after'] as const)" :key="side">
							<MkTextarea v-model="f[side].text">
								<template #label>{{ side === 'before' ? L.before : L.after }}</template>
							</MkTextarea>
							<XImage v-model="f[side].image" :label="M.image" :uploadLabel="M.uploadImage"/>
						</template>
					</div>

					<MkInfo>{{ M.journeyHint }}</MkInfo>

					<div class="_buttons">
						<MkButton primary rounded :disabled="busy" @click="saveWork(f)"><i class="ti ti-check"></i> {{ f.handedIn ? M.saveWork : M.submit }}</MkButton>
						<MkButton v-if="f.handedIn" danger rounded :disabled="busy" @click="deleteWork(f)"><i class="ti ti-trash"></i> {{ M.deleteWork }}</MkButton>
					</div>
				</div>
			</FormSection>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, nextTick, reactive, ref } from 'vue';
import XImage from './learn-manage.image.vue';
import { majorText } from '@/lojo/learn/learn.js';
import type { LearnItem, LearnSide } from '@/lojo/learn/learn.js';
import { learnText as L } from '@/lojo/locales/learn.js';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import { definePage } from '@/page.js';
import { selectFile } from '@/utility/drive.js';
import { misskeyApi } from '@/utility/misskey-api.js';

const M = L.m;

type Kind = 'link' | 'image' | 'video' | 'file';
type WorkIn = {
	major: string; title: string; oneLine: string; reflection: string;
	items: LearnItem[]; score: LearnSide | null; before: LearnSide | null; after: LearnSide | null;
};
type MeData = {
	url: string | null;
	majors: { id: string; reflectionRequired: boolean }[];
	settings: { isPublic: boolean; sources: string[]; contact: string; takenDown: boolean };
	works: WorkIn[];
	channels: string[];
};
type Form = {
	major: string; reflectionRequired: boolean; handedIn: boolean;
	labels: ReturnType<typeof majorText> & { reflectionHint: string; scoreHint: string };
	title: string; oneLine: string; reflection: string;
	items: { kind: Kind; url: string; label: string }[];
	score: LearnSide; before: LearnSide; after: LearnSide;
};

const data = ref<MeData | null>(null);
const failed = ref(false);
const busy = ref(false);
const isPublic = ref(true);
const sources = ref<string[]>([]);
const contact = ref('');
const forms = reactive<Form[]>([]);

const kindItems = computed(() => (['link', 'image', 'video', 'file'] as const).map(k => ({ label: L.itemKinds[k], value: k })));
// 订阅着的频道，加上以前勾过、现在退订了的（不偷偷丢掉）
const channelChoices = computed(() => [...new Set([...(data.value?.channels ?? []), ...sources.value])]);

const side = (s: LearnSide | null): LearnSide => ({ text: s?.text ?? '', image: s?.image ?? '' });

function fill(d: MeData): void {
	data.value = d;
	isPublic.value = d.settings.isPublic;
	sources.value = [...d.settings.sources];
	contact.value = d.settings.contact;
	forms.splice(0, forms.length, ...d.majors.map(m => {
		const w = d.works.find(x => x.major === m.id);
		const t = L.majors[m.id] as typeof L.majors[string] | undefined;
		return {
			major: m.id, reflectionRequired: m.reflectionRequired, handedIn: w != null,
			labels: { ...majorText(m.id), reflectionHint: t?.reflectionHint ?? '', scoreHint: t?.scoreHint ?? '' },
			title: w?.title ?? '', oneLine: w?.oneLine ?? '', reflection: w?.reflection ?? '',
			items: (w?.items ?? []).map(it => ({ kind: (['link', 'image', 'video', 'file'].includes(it.kind) ? it.kind : 'link') as Kind, url: it.url, label: it.label ?? '' })),
			score: side(w?.score ?? null), before: side(w?.before ?? null), after: side(w?.after ?? null),
		};
	}));
	if (forms.length > 0 && forms[0].items.length === 0) forms[0].items.push({ kind: 'link', url: '', label: '' });
}

async function load(): Promise<void> {
	failed.value = false;
	try {
		fill(await misskeyApi('lojo/learn/me', {}) as unknown as MeData);
	} catch {
		failed.value = true;
		return;
	}
	if (window.location.hash === '#work') {
		await nextTick();
		window.document.getElementById('work')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
	}
}

function toggleSource(name: string, on: boolean): void {
	sources.value = on ? [...sources.value, name] : sources.value.filter(s => s !== name);
}

async function saveSettings(): Promise<void> {
	const c = contact.value.trim();
	if (c.length > 256) return void os.alert({ type: 'error', text: M.tooLong(M.contact, 256) });
	busy.value = true;
	try {
		fill(await misskeyApi('lojo/learn/update', { isPublic: isPublic.value, sources: sources.value.slice(0, 12), contact: c }) as unknown as MeData);
		os.toast(M.saved);
	} catch {
		os.alert({ type: 'error', text: M.failed });
	} finally {
		busy.value = false;
	}
}

const LINK = /^https?:\/\/[^\s<>"']+$/;

// 先在这边挑一遍，给看得懂的提示；后端还会再挡一道
function check(f: Form): string | null {
	if (f.title.trim() === '' || f.oneLine.trim() === '') return M.needTitle;
	if (f.title.trim().length > 40) return M.tooLong(M.title, 40);
	if (f.oneLine.trim().length > 80) return M.tooLong(M.oneLine, 80);
	if (f.reflectionRequired && f.reflection.trim() === '') return M.needReflection(f.labels.reflection);
	if (f.reflection.length > 6000) return M.tooLong(f.labels.reflection, 6000);
	for (const it of f.items) {
		if (it.url.trim() !== '' && !LINK.test(it.url.trim())) return M.badLink;
		if (it.label.trim().length > 60) return M.tooLong(M.itemLabel, 60);
	}
	for (const s of [f.score, f.before, f.after]) if (s.image.trim() !== '' && !LINK.test(s.image.trim())) return M.badLink;
	if (f.score.text.length > 600) return M.tooLong(f.labels.score, 600);
	if (f.before.text.length > 2000) return M.tooLong(L.before, 2000);
	if (f.after.text.length > 2000) return M.tooLong(L.after, 2000);
	if (f.items.every(it => it.url.trim() === '') && f.reflection.trim() === '') return M.emptyWork;
	return null;
}

async function saveWork(f: Form): Promise<void> {
	const bad = check(f);
	if (bad != null) return void os.alert({ type: 'error', text: bad });
	busy.value = true;
	try {
		const trimSide = (s: LearnSide) => ({ text: s.text.trim(), image: s.image.trim() });
		fill(await misskeyApi('lojo/learn/save-work', {
			major: f.major,
			title: f.title.trim(),
			oneLine: f.oneLine.trim(),
			reflection: f.reflection.trim(),
			items: f.items.filter(it => it.url.trim() !== '').map(it => ({ kind: it.kind, url: it.url.trim(), label: it.label.trim() })),
			score: trimSide(f.score),
			before: trimSide(f.before),
			after: trimSide(f.after),
		}) as unknown as MeData);
		os.toast(M.workSaved);
	} catch (err) {
		const code = (err as { code?: string } | null)?.code;
		os.alert({
			type: 'error',
			text: code === 'NEED_TITLE' ? M.needTitle
				: code === 'NEED_REFLECTION' ? M.needReflection(f.labels.reflection)
				: code === 'EMPTY_WORK' ? M.emptyWork
				: M.failed,
		});
	} finally {
		busy.value = false;
	}
}

async function deleteWork(f: Form): Promise<void> {
	const { canceled } = await os.confirm({ type: 'warning', text: M.deleteConfirm });
	if (canceled) return;
	busy.value = true;
	try {
		fill(await misskeyApi('lojo/learn/delete-work', { major: f.major }) as unknown as MeData);
		os.toast(M.deleted);
	} catch {
		os.alert({ type: 'error', text: M.failed });
	} finally {
		busy.value = false;
	}
}

// 作品一项：从网盘选或上传，链接填进去，类型跟着文件走
async function uploadItem(ev: PointerEvent, it: Form['items'][number]): Promise<void> {
	const file = await selectFile({ anchorElement: ev.currentTarget ?? ev.target, multiple: false, label: M.upload });
	it.url = file.url;
	it.kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
	if (it.label.trim() === '') it.label = file.name.slice(0, 60);
}

void load();

definePage(() => ({ title: L.manage, icon: 'ti ti-certificate' }));
</script>

<style lang="scss" module>
.label {
	font-size: 0.85em;
	font-weight: bold;
}

.caption {
	font-size: 0.85em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent);
	margin: 0;
}

.badge {
	margin-left: 8px;
	padding: 2px 10px;
	border-radius: 999px;
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 0.8em;
	font-weight: normal;
}

.item {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px;
}

.itemRow {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.kind {
	width: 110px;
	flex-shrink: 0;
}

.grow {
	flex: 1;
	min-width: 180px;
}
</style>
