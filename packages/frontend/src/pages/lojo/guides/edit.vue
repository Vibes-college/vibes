<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="false">
	<div class="_spacer" style="--MI_SPACER-w: 780px;" :class="$style.root">
		<div v-if="loading" :class="$style.empty"><MkLoading/></div>
		<div v-else-if="loadError" :class="$style.empty" role="alert">
			<p>{{ loadError }}</p><MkButton @click="load">{{ i18n.ts.retry }}</MkButton>
		</div>
		<template v-else>
			<div v-if="backupFailed" :class="$style.error" role="alert">{{ guideLabels.backupFailed }}</div>
			<div v-if="saveError" :class="$style.error" role="alert">{{ saveError }}</div>
			<template v-if="tab === 'edit'">
				<section class="_panel _gaps_m" :class="$style.settings">
					<MkInput v-model="title" data-testid="guide-editor-title"><template #label>{{ guideLabels.articleTitle }}</template></MkInput>
					<MkTextarea v-model="summary" data-testid="guide-editor-summary"><template #label>{{ guideLabels.summary }}</template></MkTextarea>
					<div :class="$style.fields">
						<MkSelect v-model="category" :items="categoryItems"><template #label>{{ guideLabels.category }}</template></MkSelect>
						<MkInput v-model="city"><template #label>{{ guideLabels.city }}</template></MkInput>
					</div>
					<div :class="$style.cover">
						<img v-if="guideSafeUrl(coverUrl)" :src="guideSafeUrl(coverUrl)" alt=""/>
						<div class="_buttons">
							<MkButton small @click="chooseCover"><i class="ti ti-photo"></i> {{ coverUrl ? guideLabels.changeCover : guideLabels.addCover }}</MkButton>
							<MkButton v-if="coverUrl" small @click="coverUrl = ''">{{ guideLabels.removeCover }}</MkButton>
						</div>
					</div>
				</section>
				<div class="_gaps_m" :class="$style.blocks">
					<GuideEditorBlock v-for="(block, index) in blocks" :key="block.id" :modelValue="block" :first="index === 0" :last="index === blocks.length - 1" @update:modelValue="updateBlock(index, $event)" @move="moveBlock(index, $event)" @remove="removeBlock(index)"/>
				</div>
				<MkButton :class="$style.add" full @click="addBlockMenu"><i class="ti ti-plus"></i> {{ guideLabels.addBlock }}</MkButton>
			</template>
			<article v-else class="_panel _selectable" :class="$style.preview">
				<div :class="$style.previewMeta">{{ guideCategoryLabel(category) }}<span v-if="city"> · {{ city }}</span></div>
				<h1>{{ title || guideLabels.untitled }}</h1>
				<p v-if="summary" :class="$style.summary">{{ summary }}</p>
				<img v-if="guideSafeUrl(coverUrl)" :src="guideSafeUrl(coverUrl)" alt="" :class="$style.previewCover"/>
				<GuideBody :blocks="blocks"/>
			</article>
		</template>
	</div>
	<template #footer>
		<div :class="$style.footer">
			<span v-show="!loading && !loadError" :class="[$style.state, { [$style.dirty]: dirty }]" role="status">{{ dirty ? guideLabels.unsaved : guideId ? guideLabels.savedStatus : guideLabels.draft }}</span>
			<MkButton v-if="status === 'draft'" small :wait="saving" :disabled="loading || !!loadError" data-testid="guide-editor-save-draft" @click="save('draft')">{{ guideLabels.saveDraft }}</MkButton>
			<MkButton small primary :wait="saving" :disabled="loading || !!loadError" data-testid="guide-editor-publish" @click="save('published')">{{ status === 'published' ? guideLabels.saveChanges : guideLabels.publish }}</MkButton>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue';
import type { Guide, GuideBlock } from '@/lojo/guides/types.js';
import type { PageHeaderItem } from '@/types/page-header.js';
import GuideEditorBlock from './components/GuideEditorBlock.vue';
import GuideBody from './components/GuideBody.vue';
import { guideCategories, guideCategoryLabel, guideLabels, guideSafeUrl } from './labels.js';
import { clearGuideDraft, readGuideDraft, writeGuideDraft } from './editor-draft.js';
import type { GuideEditorContent } from './editor-draft.js';
import { guideApi } from '@/lojo/guides/api.js';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import { genId } from '@/utility/id.js';
import { selectFile } from '@/utility/drive.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import { pleaseLogin } from '@/utility/please-login.js';
import * as os from '@/os.js';

const props = defineProps<{ guideId?: string; category?: string }>();
const router = useRouter();
const tab = ref('edit');
const guideId = ref<string | undefined>(props.guideId);
const revision = ref<number | undefined>();
const title = ref('');
const summary = ref('');
const category = ref(guideCategories.some(item => item.value === props.category) ? props.category! : 'housing');
const city = ref('深圳');
const coverUrl = ref('');
const blocks = ref<GuideBlock[]>([{ id: genId(), type: 'paragraph', text: '' }]);
const status = ref<Guide['status']>('draft');
const isDemo = ref(false);
const loading = ref(Boolean(props.guideId));
const loadError = ref('');
const saving = ref(false);
const saveError = ref('');
const backupFailed = ref(false);
const accountId = $i?.id;
let alive = true;
let active = true;
let draftReady = false;
let activationSeen = false;
let backupTimer: number | undefined;
let retainExistingBackup = false;
let navigationConfirmed = false;

// Older guides may still sit in a retired category; keep it selectable for them only.
const categoryItems = computed(() => {
	const items = guideCategories.map(item => ({ value: item.value as string, label: item.label as string }));
	if (!items.some(item => item.value === category.value)) items.push({ value: category.value, label: guideCategoryLabel(category.value) });
	return items;
});
const initialCategory = guideCategories.some(item => item.value === props.category) ? props.category! : 'housing';
const snapshot = computed(() => JSON.stringify({ title: title.value, summary: summary.value, category: category.value, city: city.value, coverUrl: coverUrl.value, blocks: blocks.value }));
const savedSnapshot = ref(snapshot.value);
const dirty = computed(() => snapshot.value !== savedSnapshot.value);

function applyContent(content: GuideEditorContent) {
	title.value = content.title;
	summary.value = content.summary;
	category.value = content.category;
	city.value = content.city;
	coverUrl.value = content.coverUrl;
	blocks.value = content.blocks;
}

function backupDraft() {
	window.clearTimeout(backupTimer);
	if (!accountId || !draftReady) return;
	if (!dirty.value) {
		if (!retainExistingBackup) clearGuideDraft(accountId, guideId.value);
		return;
	}
	retainExistingBackup = false;
	backupFailed.value = !writeGuideDraft({
		accountId,
		guideId: guideId.value ?? null,
		revision: revision.value ?? null,
		updatedAt: Date.now(),
		content: JSON.parse(snapshot.value) as GuideEditorContent,
	});
}

async function restoreDraft() {
	if (!accountId) return;
	const draft = readGuideDraft(accountId, guideId.value);
	if (!draft) return;
	if (JSON.stringify(draft.content) === snapshot.value) {
		clearGuideDraft(accountId, guideId.value);
		return;
	}
	const { canceled } = await os.confirm({ type: 'question', text: guideLabels.restoreDraft });
	if (!alive || !active) return;
	if (canceled) {
		// Dismissing the recovery prompt must not silently delete the recoverable draft.
		retainExistingBackup = true;
		return;
	}
	applyContent(draft.content);
	// Keep the revision this local edit was based on, so the server rejects stale overwrites.
	revision.value = draft.revision ?? undefined;
}

watch(snapshot, () => {
	if (!draftReady || !active) return;
	window.clearTimeout(backupTimer);
	backupTimer = window.setTimeout(backupDraft, 350);
});

const headerTabs = [{ key: 'edit', title: i18n.ts.edit, icon: 'ti ti-pencil' }, { key: 'preview', title: i18n.ts.preview, icon: 'ti ti-eye' }];
const headerActions: PageHeaderItem[] = [{ icon: 'ti ti-arrow-left', text: guideLabels.backToGuides, handler: back }];

async function back() {
	if (saving.value) return;
	if (dirty.value) {
		const { canceled } = await os.confirm({ type: 'warning', text: guideLabels.leaving });
		if (canceled) return;
	}
	navigationConfirmed = true;
	router.pushByPath('/lojo/guides');
}

async function load() {
	draftReady = false;
	retainExistingBackup = false;
	loadError.value = '';
	saveError.value = '';
	backupFailed.value = false;
	if (!props.guideId) {
		guideId.value = undefined;
		revision.value = undefined;
		status.value = 'draft';
		isDemo.value = false;
		applyContent({ title: '', summary: '', category: initialCategory, city: '深圳', coverUrl: '', blocks: [{ id: genId(), type: 'paragraph', text: '' }] });
		savedSnapshot.value = snapshot.value;
		await restoreDraft();
		draftReady = true;
		return;
	}
	loading.value = true;
	loadError.value = '';
	try {
		const guide = await guideApi.show(props.guideId);
		if (!alive || !active) return;
		if (guide.author.id !== $i?.id) { loadError.value = guideLabels.notAuthor; return; }
		guideId.value = guide.id;
		revision.value = guide.revision;
		title.value = guide.title;
		summary.value = guide.summary;
		category.value = guide.category;
		city.value = guide.city;
		coverUrl.value = guide.coverUrl || '';
		blocks.value = structuredClone(guide.blocks);
		status.value = guide.status;
		isDemo.value = guide.isDemo;
		savedSnapshot.value = snapshot.value;
		await restoreDraft();
		draftReady = true;
	} catch {
		if (alive) loadError.value = guideLabels.loadFailed;
	} finally {
		if (alive) loading.value = false;
	}
}

function updateBlock(index: number, block: GuideBlock) {
	blocks.value.splice(index, 1, block);
}

function moveBlock(index: number, direction: number) {
	const destination = index + direction;
	if (destination < 0 || destination >= blocks.value.length) return;
	const [block] = blocks.value.splice(index, 1);
	blocks.value.splice(destination, 0, block);
}

async function removeBlock(index: number) {
	const block = blocks.value[index];
	if (block.text?.trim() || block.url || block.items?.some(item => item.trim()) || block.resource?.title) {
		const { canceled } = await os.confirm({ type: 'warning', text: guideLabels.removeBlock });
		if (canceled) return;
	}
	const currentIndex = blocks.value.findIndex(item => item.id === block.id);
	if (currentIndex >= 0) blocks.value.splice(currentIndex, 1);
}

function addBlockMenu(event: PointerEvent) {
	if (blocks.value.length >= 200) { os.alert({ type: 'warning', text: guideLabels.tooManyBlocks }); return; }
	const types: GuideBlock['type'][] = ['paragraph', 'heading', 'image', 'video', 'audio', 'checklist', 'resource'];
	const icons = ['ti ti-align-left', 'ti ti-heading', 'ti ti-photo', 'ti ti-video', 'ti ti-music', 'ti ti-list-check', 'ti ti-link'];
	os.popupMenu(types.map((type, index) => ({
		text: guideLabels[type], icon: icons[index],
		action: () => {
			const block: GuideBlock = { id: genId(), type };
			if (type === 'paragraph' || type === 'heading') block.text = '';
			if (type === 'heading') block.level = 2;
			if (type === 'checklist') block.items = [''];
			if (type === 'resource') block.resource = { kind: 'tool', title: '', description: '', url: '' };
			blocks.value.push(block);
		},
	})), event.currentTarget ?? event.target);
}

async function chooseCover(event: PointerEvent) {
	try {
		const file = await selectFile({ anchorElement: event.currentTarget ?? event.target, label: guideLabels.cover, multiple: false });
		if (!file.type.startsWith('image/')) {
			os.alert({ type: 'warning', text: guideLabels.chooseImage });
			return;
		}
		coverUrl.value = file.url;
	} catch {
		os.alert({ type: 'error', text: i18n.ts.failedToUpload });
	}
}

function getValidBlocks(): GuideBlock[] | null {
	const content = JSON.parse(JSON.stringify(blocks.value)) as GuideBlock[];
	for (const block of content) {
		if (block.items) block.items = block.items.map(item => item.trim()).filter(Boolean);
		if (block.text && block.text.length > 20000 || block.caption && block.caption.length > 1000 || block.items && (block.items.length > 100 || block.items.some(item => item.length > 2000))) {
			saveError.value = guideLabels.contentTooLong; return null;
		}
		if (block.url) block.url = block.url.trim();
		if (block.resource) block.resource.url = block.resource.url.trim();
		if (block.url && !guideSafeUrl(block.url)) { saveError.value = guideLabels.invalidUrl; return null; }
		if (block.resource?.url && !guideSafeUrl(block.resource.url)) { saveError.value = guideLabels.invalidUrl; return null; }
		if (block.type === 'resource' && block.resource && (block.resource.title.trim() || block.resource.url) && (!block.resource.title.trim() || !block.resource.url)) { saveError.value = guideLabels.invalidResource; return null; }
		if (block.resource && (block.resource.title.length > 200 || block.resource.description.length > 2000 || (block.resource.meta?.length ?? 0) > 500)) { saveError.value = guideLabels.contentTooLong; return null; }
	}
	return content.filter(block => block.text?.trim() || block.url?.trim() || block.items?.length || block.resource?.title.trim());
}

async function save(nextStatus: Guide['status']) {
	if (loading.value || loadError.value || saving.value || !await pleaseLogin()) return;
	if (accountId !== $i?.id) { saveError.value = guideLabels.accountChanged; return; }
	saveError.value = '';
	if (!title.value.trim()) { saveError.value = guideLabels.titleRequired; return; }
	if (title.value.trim().length > 160) { saveError.value = guideLabels.titleTooLong; return; }
	if (summary.value.trim().length > 600) { saveError.value = guideLabels.summaryTooLong; return; }
	if (city.value.trim().length > 80) { saveError.value = guideLabels.cityTooLong; return; }
	const content = getValidBlocks();
	if (!content) return;
	if (nextStatus === 'published' && !content.length) { saveError.value = guideLabels.bodyRequired; return; }
	const submittedSnapshot = snapshot.value;
	const isNew = !guideId.value;
	const previousId = guideId.value;
	saving.value = true;
	try {
		const result = await guideApi.save({
			guideId: guideId.value,
			expectedRevision: revision.value,
			title: title.value.trim(), summary: summary.value.trim(),
			category: category.value, city: city.value.trim(), coverUrl: coverUrl.value || null,
			blocks: content, status: nextStatus, isDemo: isDemo.value,
		});
		guideId.value = result.id;
		revision.value = result.revision;
		status.value = result.status;
		savedSnapshot.value = submittedSnapshot;
		retainExistingBackup = false;
		if (accountId) clearGuideDraft(accountId, previousId);
		backupDraft();
		os.toast(nextStatus === 'draft' ? guideLabels.draftSaved : guideLabels.changesSaved);
		if (active && nextStatus === 'published' && !dirty.value) {
			navigationConfirmed = true;
			router.pushByPath(`/lojo/guides/${result.id}`);
		} else if (active && isNew && !dirty.value) {
			router.replaceByPath(`/lojo/guides/${result.id}/edit`);
		}
	} catch (error) {
		const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
		saveError.value = code === 'STALE_GUIDE' || code.includes('CONFLICT') ? guideLabels.saveConflict : guideLabels.saveFailed;
	} finally {
		saving.value = false;
	}
}

function onBeforeUnload(event: BeforeUnloadEvent) {
	if (!active) return;
	backupDraft();
	if ((!dirty.value && !saving.value) || navigationConfirmed) return;
	event.preventDefault();
	event.returnValue = '';
}

function onPageHide() {
	if (active) backupDraft();
}

onMounted(() => {
	window.addEventListener('beforeunload', onBeforeUnload);
	window.addEventListener('pagehide', onPageHide);
});
onActivated(() => {
	active = true;
	navigationConfirmed = false;
	if (!activationSeen) { activationSeen = true; return; }
	if (!saving.value) load();
});
onDeactivated(() => { backupDraft(); active = false; });
onBeforeUnmount(() => {
	backupDraft();
	alive = false;
	active = false;
	window.clearTimeout(backupTimer);
	window.removeEventListener('beforeunload', onBeforeUnload);
	window.removeEventListener('pagehide', onPageHide);
});
load();
definePage(() => ({ title: guideId.value ? guideLabels.edit : guideLabels.write, icon: 'ti ti-pencil' }));
</script>

<style lang="scss" module>
.root { padding-top: 20px; padding-bottom: 30px; }
.settings { padding: 24px; }
.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.cover { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.cover img { width: 112px; height: 74px; object-fit: cover; border-radius: var(--MI-radius); }
.blocks { margin-top: 20px; }
.add { margin-top: 16px; }
.error { padding: 14px 18px; margin-bottom: 16px; border-radius: var(--MI-radius); background: var(--MI_THEME-infoWarnBg); color: var(--MI_THEME-infoWarnFg); line-height: 1.7; }
.footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 12px max(16px, calc((100% - 740px) / 2)); background: var(--MI_THEME-panel); border-top: 1px solid var(--MI_THEME-divider); }
.state { margin-right: auto; font-size: 12px; color: var(--MI_THEME-fgTransparentWeak); white-space: nowrap; }
.dirty { color: var(--MI_THEME-warn); }
.preview { padding: 36px; }
.preview h1 { margin: 12px 0 20px; font-size: 28px; line-height: 1.45; }
.previewMeta { color: var(--MI_THEME-accent); font-size: 13px; }
.summary { line-height: 1.8; color: var(--MI_THEME-fgTransparentWeak); margin-bottom: 28px; }
.previewCover { display: block; width: 100%; max-height: 360px; object-fit: cover; border-radius: var(--MI-radius); margin-bottom: 28px; }
.empty { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px; min-height: 260px; }
@media (max-width: 550px) {
	.root { padding-top: 10px; }
	.settings { padding: 18px 16px; }
	.fields { gap: 12px; }
	.preview { padding: 24px 18px; }
	.preview h1 { font-size: 24px; }
	.footer { padding: 10px 12px; gap: 8px; }
}
</style>
