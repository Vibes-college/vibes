<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions">
	<div ref="pageRoot" :class="$style.layout" data-testid="guide-detail">
		<MkLoading v-if="loading"/>
		<div v-else-if="failed" :class="$style.empty" role="alert"><p>攻略暂时无法加载</p><MkButton @click="load">{{ i18n.ts.retry }}</MkButton></div>
		<template v-else-if="guide">
			<article :class="$style.article" class="_panel">
				<header :class="$style.articleHeader">
					<div :class="$style.badges"><span>{{ guideCategoryLabel(guide.category) }}</span><span v-if="guide.city">{{ guide.city }}</span><span v-if="guide.status === 'draft'">草稿</span><span v-if="guide.isDemo">示例</span></div>
					<h1>{{ guide.title }}</h1>
					<p v-if="guide.summary" :class="$style.summary">{{ guide.summary }}</p>
					<div :class="$style.authorLine">
						<MkAvatar :user="guide.author" :class="$style.avatar" link preview/>
						<div :class="$style.author"><MkUserName :user="guide.author"/><span>更新于 <MkTime :time="guide.updatedAt" mode="absolute"/></span></div>
						<button class="_button" :class="[$style.bookmark, { [$style.saved]: guide.isSaved }]" :aria-label="guide.isSaved ? '取消收藏' : '收藏攻略'" :aria-pressed="guide.isSaved" :disabled="saving" data-testid="guide-bookmark" @click="bookmark"><i :class="guide.isSaved ? 'ti ti-bookmark-filled' : 'ti ti-bookmark'"></i></button>
					</div>
				</header>
				<MkGuideAnnotatedText ref="annotated" :blocks="guide.blocks" :revision="guide.revision" :threads="displayThreads" :activeThreadId="activeThreadId" :class="$style.reading" @selection="onSelection" @open="openThreads">
					<GuideBody :blocks="guide.blocks"/>
				</MkGuideAnnotatedText>
				<footer :class="$style.articleFooter">
					<MkButton rounded :primary="wholeThread?.isLiked" :disabled="liking" @click="likeWhole"><i class="ti ti-heart"></i> {{ wholeThread?.likeCount || '喜欢' }}</MkButton>
					<MkButton rounded data-testid="guide-comments-open" @click="openDiscussion()"><i class="ti ti-message-circle"></i> 讨论 {{ guide.commentCount || '' }}</MkButton>
					<MkButton rounded @click="copyLink"><i class="ti ti-share"></i> {{ i18n.ts.share }}</MkButton>
				</footer>
				<section v-if="activeThreads.length" :class="$style.discussions" aria-label="字句讨论">
					<h2>字句讨论</h2>
					<button v-for="thread in activeThreads" :key="thread.id" class="_button" :class="$style.quoteRow" @click="openDiscussion(thread)">
						<span>{{ thread.anchor?.exact }}</span><span :class="$style.counts"><i class="ti ti-heart"></i> {{ thread.likeCount }} <i class="ti ti-message-circle"></i> {{ thread.commentCount }}</span>
					</button>
				</section>
			</article>
			<aside v-if="headings.length" :class="$style.contents" aria-label="目录"><strong>目录</strong><button v-for="heading in headings" :key="heading.id" class="_button" @click="goToHeading(heading.id)">{{ heading.text }}</button></aside>
		</template>
	</div>
	<Teleport to="body">
		<div v-if="selection" :style="toolbarStyle" :class="$style.selectionToolbar" data-testid="guide-selection-toolbar" role="toolbar" aria-label="选中文字操作" @pointerdown.stop @keydown.esc="clearSelection">
			<button class="_button" @pointerdown.prevent @click="copySelection"><i class="ti ti-copy"></i><span>复制</span></button>
			<button class="_button" :class="{ [$style.saved]: selectionThread?.isLiked }" :disabled="liking" :aria-pressed="selectionThread?.isLiked ?? false" data-testid="guide-selection-like" @pointerdown.prevent @click="likeSelection"><i :class="selectionThread?.isLiked ? 'ti ti-heart-filled' : 'ti ti-heart'"></i><span>{{ selectionThread?.likeCount || '喜欢' }}</span></button>
			<button class="_button" data-testid="guide-selection-comment" @pointerdown.prevent @click="commentSelection"><i class="ti ti-message-circle"></i><span>评论</span></button>
		</div>
	</Teleport>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, ref, useTemplateRef, watch } from 'vue';
import type { CSSProperties } from 'vue';
import type { PageHeaderItem } from '@/types/page-header.js';
import type { Guide, GuideAnchor, GuideThread } from '@/lojo/guides/types.js';
import { guideApi } from '@/lojo/guides/api.js';
import { guideCategoryLabel } from './labels.js';
import GuideBody from './components/GuideBody.vue';
import MkGuideAnnotatedText from '@/components/lojo/MkGuideAnnotatedText.vue';
import MkGuideDiscussion from '@/components/lojo/MkGuideDiscussion.vue';
import MkButton from '@/components/MkButton.vue';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';
import { pleaseLogin } from '@/utility/please-login.js';
import { prefer } from '@/preferences.js';
import * as os from '@/os.js';

const props = defineProps<{ guideId: string }>();
const router = useRouter();
const pageRoot = useTemplateRef('pageRoot');
const annotated = useTemplateRef('annotated');
const guide = ref<Guide | null>(null);
const threads = ref<GuideThread[]>([]);
const loading = ref(true);
const failed = ref(false);
const saving = ref(false);
const liking = ref(false);
const activeThreadId = ref<string>();
const pendingAnchor = ref<GuideAnchor | null>(null);
const selection = ref<{ anchor: GuideAnchor; rect: DOMRect } | null>(null);
let generation = 0;
let dialogDispose: (() => void) | undefined;
const headings = computed(() => guide.value?.blocks.filter(block => block.type === 'heading') ?? []);
const activeThreads = computed(() => threads.value.filter(thread => thread.anchor && (thread.commentCount || thread.likeCount)));
const wholeThread = computed(() => threads.value.find(thread => !thread.anchor));
const displayThreads = computed<GuideThread[]>(() => pendingAnchor.value ? [...threads.value, {
	id: 'pending-selection', guideId: props.guideId, anchor: pendingAnchor.value,
	likeCount: 0, isLiked: false, commentCount: 0, createdAt: new Date().toISOString(),
}] : threads.value);
const selectionThread = computed(() => threads.value.find(thread => thread.anchor && selection.value && sameAnchor(thread.anchor, selection.value.anchor)));
const headerActions = computed<PageHeaderItem[]>(() => [
	{ icon: 'ti ti-list', text: '目录', handler: showContents },
	{ icon: 'ti ti-message-circle', text: '讨论', handler: () => openDiscussion() },
	...(guide.value?.author.id === $i?.id ? [{ icon: 'ti ti-pencil', text: '编辑攻略', handler: () => router.pushByPath(`/lojo/guides/${props.guideId}/edit`) }] : []),
	...($i?.isAdmin || $i?.isModerator ? [{ icon: 'ti ti-star', text: guide.value?.featured ? '移出精选' : '加入精选', highlighted: !!guide.value?.featured, handler: feature }] : []),
]);
const toolbarStyle = computed<CSSProperties>(() => {
	if (!selection.value) return {};
	if (window.innerWidth < 600) return { left: '50%', bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))', transform: 'translateX(-50%)' };
	const rect = selection.value.rect;
	return { left: `${Math.max(12, Math.min(window.innerWidth - 230, rect.left + rect.width / 2 - 110))}px`, top: `${Math.max(70, Math.min(window.innerHeight - 74, rect.bottom + 10))}px` };
});

function sameAnchor(a: GuideAnchor, b: GuideAnchor) {
	return a.revision === b.revision && a.startBlockId === b.startBlockId && a.startOffset === b.startOffset && a.endBlockId === b.endBlockId && a.endOffset === b.endOffset;
}

async function load() {
	const current = ++generation;
	loading.value = true;
	failed.value = false;
	clearSelection();
	try {
		const [value, marks] = await Promise.all([guideApi.show(props.guideId), guideApi.threads(props.guideId)]);
		if (current !== generation) return;
		guide.value = value;
		threads.value = marks;
	} catch {
		if (current === generation) failed.value = true;
	} finally {
		if (current === generation) loading.value = false;
	}
}

function onSelection(anchor: GuideAnchor | null, rect: DOMRect | null) {
	selection.value = anchor && rect ? { anchor, rect } : null;
}

function clearSelection() {
	selection.value = null;
	annotated.value?.clearSelection();
}

function changed(thread: GuideThread) {
	const index = threads.value.findIndex(item => item.id === thread.id);
	if (index < 0) threads.value.push(thread);
	else threads.value[index] = thread;
	if (pendingAnchor.value && thread.anchor && sameAnchor(pendingAnchor.value, thread.anchor)) {
		pendingAnchor.value = null;
		activeThreadId.value = thread.id;
	}
	if (guide.value) guide.value.commentCount = threads.value.reduce((count, item) => count + item.commentCount, 0);
}

function openDiscussion(thread?: GuideThread, anchor?: GuideAnchor, initialCompose = false) {
	if (!guide.value || dialogDispose) return;
	const frozenAnchor = anchor ?? thread?.anchor ?? undefined;
	clearSelection();
	pendingAnchor.value = !thread && frozenAnchor ? frozenAnchor : null;
	activeThreadId.value = thread?.id ?? (pendingAnchor.value ? 'pending-selection' : undefined);
	const { dispose } = os.popup(MkGuideDiscussion, { guide: guide.value, thread: thread ?? null, anchor: frozenAnchor ?? null, initialCompose }, {
		changed,
		locate: (target: GuideAnchor) => { annotated.value?.scrollToAnchor(target); },
		closed: () => { dispose(); dialogDispose = undefined; activeThreadId.value = undefined; pendingAnchor.value = null; void refreshThreads(); },
	});
	dialogDispose = dispose;
}

async function refreshThreads() {
	const id = props.guideId;
	try {
		const marks = await guideApi.threads(id);
		if (props.guideId === id) {
			threads.value = marks;
			if (guide.value) guide.value.commentCount = marks.reduce((total, item) => total + item.commentCount, 0);
		}
	} catch { /* Keep the visible discussion state if a refresh fails. */ }
}

async function refreshGuide() {
	const current = ++generation;
	try {
		const [value, marks] = await Promise.all([guideApi.show(props.guideId), guideApi.threads(props.guideId)]);
		if (current !== generation) return;
		clearSelection();
		guide.value = value;
		threads.value = marks;
	} catch { /* A cached article remains readable while temporarily offline. */ }
}

async function openThreads(ids: string[]) {
	ids = ids.filter(id => id !== 'pending-selection');
	if (!ids.length) return;
	if (ids.length === 1) { openDiscussion(threads.value.find(thread => thread.id === ids[0])); return; }
	const choices = ids.map(id => threads.value.find(thread => thread.id === id)).filter((thread): thread is GuideThread => !!thread);
	clearSelection();
	const result = await os.select({ title: '选择讨论', items: choices.map(thread => ({ value: thread.id, label: `${thread.anchor?.exact.slice(0, 60)} · ${thread.commentCount} 条评论` })) });
	if (!result.canceled && result.result) openDiscussion(threads.value.find(thread => thread.id === result.result));
}

async function bookmark() {
	if (!guide.value || saving.value || !await pleaseLogin()) return;
	const target = guide.value;
	saving.value = true;
	try { const result = await guideApi.bookmark(target.id, !target.isSaved); if (guide.value?.id === target.id) guide.value.isSaved = result.saved; } catch { await os.alert({ type: 'error', text: '收藏未能更新，请重试。' }); } finally { saving.value = false; }
}

async function feature() {
	if (!guide.value) return;
	const target = guide.value;
	try {
		const result = await guideApi.feature(target.id, !target.featured);
		if (guide.value?.id === target.id) guide.value = result;
	} catch { await os.alert({ type: 'error', text: '精选状态未能更新，请重试。' }); }
}

async function likeSelection() {
	const target = selection.value;
	const thread = selectionThread.value;
	if (!target || !guide.value || liking.value || !await pleaseLogin()) return;
	const guideId = guide.value.id;
	liking.value = true;
	try {
		const result = await guideApi.like({ guideId, ...(thread ? { threadId: thread.id } : { anchor: target.anchor }), liked: !thread?.isLiked });
		if (guide.value?.id !== guideId) return;
		changed(result);
		clearSelection();
	} catch { await os.alert({ type: 'error', text: '操作未能保存，请重试。' }); } finally { liking.value = false; }
}

async function likeWhole() {
	if (!guide.value || liking.value || !await pleaseLogin()) return;
	const guideId = guide.value.id;
	liking.value = true;
	try { const result = await guideApi.like({ guideId, ...(wholeThread.value ? { threadId: wholeThread.value.id } : {}), liked: !wholeThread.value?.isLiked }); if (guide.value?.id === guideId) changed(result); } catch { await os.alert({ type: 'error', text: '操作未能保存，请重试。' }); } finally { liking.value = false; }
}

function commentSelection() {
	if (!selection.value) return;
	openDiscussion(selectionThread.value, selection.value.anchor, true);
}

async function copyText(text: string) {
	try {
		if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
		else {
			const area = window.document.createElement('textarea');
			area.value = text;
			area.style.cssText = 'position:fixed;top:0;left:-10000px';
			window.document.body.append(area);
			area.select();
			const copied = window.document.execCommand('copy');
			area.remove();
			if (!copied) throw new Error('COPY_FAILED');
		}
		os.toast(i18n.ts.copiedToClipboard);
	} catch { await os.alert({ type: 'error', text: '未能复制，请使用系统复制菜单。' }); }
}

function copySelection() { if (selection.value) { void copyText(selection.value.anchor.exact); clearSelection(); } }

function copyLink() { void copyText(`${window.location.origin}/lojo/guides/${props.guideId}`); }

function goToHeading(id: string) {
	const node = pageRoot.value?.querySelector(`[data-guide-block="${CSS.escape(id)}"]`);
	node?.scrollIntoView({ behavior: prefer.s.animation ? 'smooth' : 'instant', block: 'start' });
}

async function showContents() {
	const result = await os.select({ title: '目录', items: headings.value.map(block => ({ value: block.id, label: block.text ?? '' })) });
	if (!result.canceled && result.result) goToHeading(result.result);
}

watch(() => props.guideId, () => { dialogDispose?.(); dialogDispose = undefined; void load(); }, { immediate: true });
onActivated(() => { if (guide.value) void refreshGuide(); });
onDeactivated(() => { dialogDispose?.(); dialogDispose = undefined; pendingAnchor.value = null; activeThreadId.value = undefined; clearSelection(); });
onBeforeUnmount(() => { generation++; dialogDispose?.(); clearSelection(); });
definePage(() => ({ title: guide.value?.title ?? '攻略', icon: 'ti ti-book', path: `/lojo/guides/${props.guideId}` }));
</script>

<style lang="scss" module>
.layout { max-width: 1080px; margin: 0 auto; padding: 24px; display: grid; grid-template-columns: minmax(0, 760px) minmax(130px, 190px); gap: 24px; align-items: start; }
.article { min-width: 0; overflow: visible; }
.articleHeader { padding: 36px 40px 30px; }
.articleHeader h1 { margin: 15px 0; line-height: 1.45; font-size: 28px; letter-spacing: -.025em; }
.badges { display: flex; gap: 12px; color: var(--MI_THEME-fgTransparentWeak); font-size: 12px; }
.badges span:first-child { color: var(--MI_THEME-accent); font-weight: 700; }
.summary { font-size: 15px; line-height: 1.75; color: var(--MI_THEME-fgTransparentWeak); margin: 0 0 22px; }
.authorLine { display: flex; gap: 10px; align-items: center; }
.avatar { width: 34px; height: 34px; }
.author { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.author > span { color: var(--MI_THEME-fgTransparentWeak); font-size: 11px; }
.bookmark { margin-left: auto; padding: 10px; font-size: 20px; border-radius: 50%; }
.saved { color: var(--MI_THEME-accent) !important; }
.reading { padding: 0 40px 16px; }
.articleFooter { display: flex; gap: 10px; flex-wrap: wrap; padding: 20px 40px 28px; }
.discussions { border-top: 1px solid var(--MI_THEME-divider); padding: 24px 40px 32px; }
.discussions h2 { font-size: 16px; margin: 0 0 16px; }
.quoteRow { display: flex; flex-direction: column; text-align: left; gap: 10px; padding: 14px 0; width: 100%; border-bottom: 1px solid var(--MI_THEME-divider); }
.quoteRow > span:first-child { border-left: 2px solid var(--MI_THEME-accent); padding-left: 12px; line-height: 1.7; font-size: 14px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.counts { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--MI_THEME-fgTransparentWeak); }
.counts i + i { margin-left: 12px; }
.contents { position: sticky; top: calc(var(--MI-stickyTop, 60px) + 24px); display: flex; flex-direction: column; gap: 16px; padding: 14px 0; font-size: 12px; }
.contents > strong { font-size: 13px; }
.contents > button { text-align: left; line-height: 1.6; color: var(--MI_THEME-fgTransparentWeak); }
.contents > button:hover { color: var(--MI_THEME-accent); }
.empty { padding: 48px 20px; grid-column: 1 / -1; text-align: center; }
.selectionToolbar { position: fixed; z-index: 2000000; display: flex; padding: 4px 8px; gap: 2px; background: var(--MI_THEME-panel); color: var(--MI_THEME-fg); border: 1px solid var(--MI_THEME-divider); box-shadow: 0 6px 30px var(--MI_THEME-shadow); border-radius: var(--MI-radius); user-select: none; -webkit-user-select: none; }
.selectionToolbar button { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px 10px; font-size: 13px; border-radius: calc(var(--MI-radius) / 2); }
.selectionToolbar button:hover { background: var(--MI_THEME-buttonBg); }
.selectionToolbar i { font-size: 18px; }
@media (max-width: 1150px) { .layout { display: block; max-width: 800px; padding: 20px; } .contents { display: none; } }
@media (max-width: 600px) {
	.layout { padding: 0; }
	.article { border-radius: 0; }
	.articleHeader { padding: 24px 22px; }
	.articleHeader h1 { font-size: 24px; }
	.reading { padding: 0 22px 12px; }
	.articleFooter { padding: 20px 22px 26px; gap: 8px; }
	.discussions { padding: 24px 22px; }
	.selectionToolbar button { padding: 12px 14px; }
}
</style>
