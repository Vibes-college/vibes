<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :preferType="mobile ? 'drawer' : 'dialog'" :returnFocusTo="returnFocus" @click="requestClose" @esc="requestClose" @closed="onClosed" @opened="onOpened">
	<section
		ref="panel"
		role="dialog"
		aria-modal="true"
		:aria-label="ui.discussion"
		:class="[$style.panel, { [$style.mobile]: mobile, [$style.dragging]: dragging }]"
		:style="panelStyle"
		data-testid="guide-discussion"
	>
		<button v-if="mobile" class="_button" :class="$style.handle" :aria-label="expanded ? ui.collapse : ui.expand" :aria-expanded="expanded" @pointerdown="startDrag" @pointermove="moveDrag" @pointerup="endDrag" @pointercancel="cancelDrag" @click="toggleHeight"><span></span></button>
		<header :class="$style.header">
			<strong>{{ ui.discussion }}<span v-if="commentCount" :class="$style.count">{{ commentCount }}</span></strong>
			<button class="_button" :class="$style.close" :aria-label="i18n.ts.close" :disabled="posting || uploading" @click="requestClose"><i class="ti ti-x"></i></button>
		</header>
		<div v-if="activeAnchor" :class="$style.quoteHeader">
			<blockquote :class="[$style.quote, { [$style.quoteExpanded]: quoteExpanded }]">{{ activeAnchor.exact }}</blockquote>
			<div :class="$style.quoteActions">
				<button v-if="activeAnchor.exact.length > 110" class="_button" @click="quoteExpanded = !quoteExpanded">{{ quoteExpanded ? ui.collapse : ui.expand }}</button>
				<button class="_button" :disabled="isHistorical(activeAnchor)" @click="locate(activeAnchor)">{{ isHistorical(activeAnchor) ? ui.oldQuote : ui.viewSource }}<i v-if="!isHistorical(activeAnchor)" class="ti ti-arrow-up-right"></i></button>
			</div>
			<div :class="$style.quoteStats">
				<button class="_button" :class="{ [$style.liked]: activeThread?.isLiked }" :aria-pressed="activeThread?.isLiked ?? false" :disabled="!$i || liking || loading" data-testid="guide-thread-like" @click="toggleLike"><i :class="activeThread?.isLiked ? 'ti ti-heart-filled' : 'ti ti-heart'"></i>{{ activeThread?.likeCount || ui.like }}</button>
				<button class="_button" :disabled="!$i" @click="focusComposer"><i class="ti ti-message-circle"></i>{{ ui.writeComment }}</button>
			</div>
		</div>
		<div ref="list" :class="$style.list" :aria-busy="loading">
			<MkLoading v-if="loading && !comments.length"/>
			<div v-else-if="loadError" :class="$style.empty" role="alert"><p>{{ ui.loadFailed }}</p><MkButton small @click="retryLoad">{{ i18n.ts.retry }}</MkButton></div>
			<div v-else-if="!comments.length" :class="$style.empty"><i class="ti ti-message-circle"></i><p>{{ ui.empty }}</p></div>
			<template v-for="comment in comments" :key="comment.id">
				<button v-if="!activeAnchor && comment.anchor" class="_button" :class="$style.commentQuote" :disabled="isHistorical(comment.anchor)" @click="locate(comment.anchor)"><i class="ti ti-quote"></i><span>{{ comment.anchor.exact }}</span><small v-if="isHistorical(comment.anchor)">{{ ui.oldQuote }}</small><i v-else class="ti ti-arrow-up-right"></i></button>
				<MkGuideComment :comment="comment" :replyName="replyName(comment)" :deleting="deleting.has(comment.id)" @reply="reply" @delete="deleteComment"/>
			</template>
			<MkButton v-if="hasMore && !loadError" small :wait="loading" :class="$style.more" @click="loadComments(true)">{{ ui.more }}</MkButton>
		</div>
		<form :class="$style.composer" @submit.prevent="publish">
			<div v-if="replyTo" :class="$style.replyTarget"><span>{{ i18n.ts.reply }} {{ replyTo.note.user.name || replyTo.note.user.username }}</span><button type="button" class="_button" :disabled="posting" :aria-label="i18n.ts.cancel" @click="replyTo = null"><i class="ti ti-x"></i></button></div>
			<div v-if="files.length" :class="$style.attachments">
				<div v-for="file in files" :key="file.id" :class="$style.attachment">
					<img v-if="file.type.startsWith('image/')" :src="file.thumbnailUrl || file.url" :alt="file.name"/>
					<span v-else :class="$style.fileName"><i class="ti ti-file"></i>{{ file.name }}</span>
					<button type="button" class="_button" :aria-label="i18n.ts.remove" :disabled="posting" @click="removeFile(file.id)"><i class="ti ti-x"></i></button>
				</div>
			</div>
			<textarea ref="input" v-model="text" :class="$style.input" :aria-label="ui.writeComment" :placeholder="$i ? ui.writeComment : ui.signIn" :disabled="!$i || posting" :readonly="emojiOpen" rows="2" :maxlength="maxLength" data-testid="guide-comment-input" @keydown="onKeydown" @paste="onPaste" @input="resizeInput" @focus="expanded = true"></textarea>
			<div :class="$style.composerTools">
				<button type="button" class="_button" :class="$style.tool" :aria-label="i18n.ts.emoji" :disabled="!$i || posting" @click="insertEmoji"><i class="ti ti-mood-smile"></i></button>
				<button type="button" class="_button" :class="$style.tool" :aria-label="i18n.ts.attachFile" :disabled="!$i || posting || uploading || files.length >= 4" @click="fileInput?.click()"><i class="ti ti-photo"></i></button>
				<input ref="fileInput" :class="$style.hidden" type="file" accept="image/*,video/*,audio/*" multiple :aria-label="i18n.ts.attachFile" @change="onFilesChosen"/>
				<span v-if="uploading" :class="$style.uploadProgress" role="status">{{ ui.uploading }} {{ uploadProgress }}%</span>
				<MkButton small primary :disabled="!canPublish" :wait="posting" :class="$style.publish" type="submit" data-testid="guide-comment-submit">{{ ui.publish }}</MkButton>
			</div>
			<p v-if="error" :class="$style.error" role="alert">{{ error }}</p>
		</form>
	</section>
</MkModal>
</template>

<script lang="ts">
import type * as Misskey from 'misskey-js';
import type { GuideComment } from '@/lojo/guides/types.js';

type CommentDraft = { text: string; files: Misskey.entities.DriveFile[]; replyTo: GuideComment | null };
// Keep unsent comments separate for every account and quoted range, including reopened sheets.
const drafts = new Map<string, CommentDraft>();
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import type { CSSProperties } from 'vue';
import type { Guide, GuideAnchor, GuideThread } from '@/lojo/guides/types.js';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import MkGuideComment from '@/components/lojo/MkGuideComment.vue';
import { guideApi } from '@/lojo/guides/api.js';
import { uploadFile } from '@/utility/drive.js';
import { emojiPicker } from '@/utility/emoji-picker.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import { instance } from '@/instance.js';

const props = withDefaults(defineProps<{
	guide: Guide;
	thread?: GuideThread | null;
	anchor?: GuideAnchor | null;
	initialCompose?: boolean;
}>(), { thread: null, anchor: null, initialCompose: false });
const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'changed', thread: GuideThread): void;
	(ev: 'locate', anchor: GuideAnchor): void;
}>();
const ui = {
	discussion: '讨论', like: '喜欢', writeComment: '写评论', publish: '发布', signIn: '登录后评论',
	empty: '还没有评论', more: '查看更多', viewSource: '查看原文', oldQuote: '旧版原文', expand: '展开', collapse: '收起',
	loadFailed: '评论加载失败', publishFailed: '发布失败，请重试', actionFailed: '操作失败，请重试',
	uploading: '上传中', uploadFailed: '上传失败，请重试', fileLimit: '最多添加 4 个附件',
	draftTitle: '保留草稿并关闭？', keepAndClose: '保留并关闭', keepEditing: '继续编辑', deleteTitle: '删除这条评论？',
};
const modal = useTemplateRef('modal');
const panel = useTemplateRef('panel');
const list = useTemplateRef('list');
const input = useTemplateRef('input');
const fileInput = useTemplateRef('fileInput');
const returnFocus = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
const activeAnchor = computed(() => props.thread?.anchor ?? props.anchor ?? null);
const scopeKey = computed(() => JSON.stringify([$i?.id ?? 'guest', props.guide.id, activeAnchor.value]));
const activeThread = ref<GuideThread | null>(props.thread);
const comments = ref<GuideComment[]>([]);
const allCommentCount = ref(props.guide.commentCount);
const commentCount = computed(() => activeAnchor.value ? activeThread.value?.commentCount ?? 0 : allCommentCount.value);
const text = ref('');
const files = ref<Misskey.entities.DriveFile[]>([]);
const replyTo = ref<GuideComment | null>(null);
const loading = ref(false);
const loadError = ref(false);
const hasMore = ref(false);
const posting = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const liking = ref(false);
const deleting = ref(new Set<string>());
const error = ref('');
const quoteExpanded = ref(false);
const emojiOpen = ref(false);
const maxLength = computed(() => Math.min(instance.maxNoteTextLength ?? 3000, 3000));
const canPublish = computed(() => Boolean($i) && !posting.value && !uploading.value && !loading.value && !loadError.value && (text.value.trim().length > 0 || files.value.length > 0));
const mobile = ref(window.innerWidth < 700);
const viewportHeight = ref(window.visualViewport?.height ?? window.innerHeight);
const keyboardInset = ref(0);
const expanded = ref(false);
const dragging = ref(false);
const dragHeight = ref<number | null>(null);
const panelStyle = computed<CSSProperties>(() => mobile.value ? {
	height: `${dragHeight.value ?? (viewportHeight.value * (expanded.value || keyboardInset.value > 100 ? .94 : .63))}px`,
	transform: `translateY(-${keyboardInset.value}px)`,
} : { maxHeight: `${viewportHeight.value - 48}px` });
let requestVersion = 0;
let closePending = false;
let closing = false;
let dragOrigin: { y: number; height: number; moved: boolean } | null = null;
let suppressHandleClick = false;
let abortUpload: (() => void) | null = null;
let pendingLocate: GuideAnchor | null = null;

function rememberDraft(key = scopeKey.value) {
	if (text.value || files.value.length) {
		drafts.set(key, { text: text.value, files: [...files.value], replyTo: replyTo.value });
	} else {
		drafts.delete(key);
	}
}

async function initialize() {
	const version = ++requestVersion;
	activeThread.value = props.thread;
	comments.value = [];
	quoteExpanded.value = false;
	hasMore.value = false;
	error.value = '';
	loadError.value = false;
	const draft = drafts.get(scopeKey.value);
	text.value = draft?.text ?? '';
	files.value = [...(draft?.files ?? [])];
	replyTo.value = draft?.replyTo ?? null;
	loading.value = true;
	try {
		const threads = await guideApi.threads(props.guide.id);
		if (version !== requestVersion || closing) return;
		activeThread.value = threads.find(thread => thread.id === props.thread?.id) ?? threads.find(thread => sameAnchor(thread.anchor, activeAnchor.value)) ?? null;
		allCommentCount.value = threads.reduce((sum, thread) => sum + thread.commentCount, 0);
		await loadComments(false, version);
	} catch {
		if (version === requestVersion) loadError.value = true;
	} finally {
		if (version === requestVersion) loading.value = false;
	}
	await nextTick();
	resizeInput();
}

function sameAnchor(a: GuideAnchor | null, b: GuideAnchor | null) {
	if (!a || !b) return a === b;
	return a.revision === b.revision && a.startBlockId === b.startBlockId && a.endBlockId === b.endBlockId && a.startOffset === b.startOffset && a.endOffset === b.endOffset && a.exact === b.exact;
}

function retryLoad() {
	rememberDraft();
	initialize();
}

async function loadComments(more = false, version = requestVersion) {
	// An unposted selection has no thread. Never fall back to the article's comments.
	if (activeAnchor.value && !activeThread.value) {
		comments.value = [];
		loading.value = false;
		return;
	}
	loading.value = true;
	loadError.value = false;
	try {
		const rows = await guideApi.comments({
			guideId: props.guide.id,
			...(activeAnchor.value && activeThread.value ? { threadId: activeThread.value.id } : {}),
			limit: 30,
			...(more && comments.value.length ? { untilId: comments.value.at(-1)!.id } : {}),
		});
		if (version !== requestVersion || closing) return;
		comments.value = more ? [...comments.value, ...rows.filter(row => !comments.value.some(existing => existing.id === row.id))] : rows;
		hasMore.value = rows.length === 30;
	} catch {
		if (version === requestVersion) loadError.value = true;
	} finally {
		if (version === requestVersion) loading.value = false;
	}
}

async function toggleLike() {
	if (!$i || liking.value || loading.value || closing) return;
	const version = requestVersion;
	liking.value = true;
	error.value = '';
	try {
		const thread = await guideApi.like({
			guideId: props.guide.id,
			...(activeThread.value ? { threadId: activeThread.value.id } : { anchor: activeAnchor.value ?? undefined }),
			liked: !activeThread.value?.isLiked,
		});
		emit('changed', thread);
		if (version === requestVersion) activeThread.value = thread;
	} catch {
		if (version === requestVersion) error.value = ui.actionFailed;
	} finally {
		liking.value = false;
	}
}

function replyName(comment: GuideComment) {
	const target = comments.value.find(item => item.id === comment.replyToId);
	return target ? target.note.user.name || target.note.user.username : undefined;
}

function reply(comment: GuideComment) {
	if (!$i || posting.value) return;
	replyTo.value = comment;
	focusComposer();
}

async function publish() {
	if (!canPublish.value || closing) return;
	const version = requestVersion;
	const key = scopeKey.value;
	posting.value = true;
	error.value = '';
	try {
		const threadId = replyTo.value?.threadId ?? activeThread.value?.id;
		const result = await guideApi.comment({
			guideId: props.guide.id,
			...(threadId ? { threadId } : { anchor: activeAnchor.value ?? undefined }),
			text: text.value.trim(),
			fileIds: files.value.map(file => file.id),
			replyToId: replyTo.value?.id,
		});
		drafts.delete(key);
		emit('changed', result.thread);
		if (version !== requestVersion) return;
		if (activeAnchor.value || !result.thread.anchor) activeThread.value = result.thread;
		allCommentCount.value += 1;
		comments.value = [{ ...result.comment, anchor: result.thread.anchor }, ...comments.value];
		text.value = '';
		files.value = [];
		replyTo.value = null;
		await nextTick();
		resizeInput();
		list.value?.scrollTo({ top: 0, behavior: 'smooth' });
	} catch {
		if (version === requestVersion) {
			error.value = ui.publishFailed;
			rememberDraft();
		}
	} finally {
		posting.value = false;
	}
}

async function deleteComment(comment: GuideComment) {
	if ($i?.id !== comment.note.userId || deleting.value.has(comment.id)) return;
	const { canceled } = await os.confirm({ type: 'warning', title: ui.deleteTitle, okText: i18n.ts.delete });
	if (canceled) return;
	const version = requestVersion;
	const guideId = props.guide.id;
	const previousThread = activeThread.value?.id === comment.threadId ? activeThread.value : null;
	deleting.value.add(comment.id);
	try {
		await guideApi.deleteComment(comment.id);
		const threads = await guideApi.threads(guideId);
		// Empty threads are omitted by the list API. Explicitly clear their public counts.
		const changed: GuideThread = threads.find(thread => thread.id === comment.threadId) ?? {
			id: comment.threadId,
			guideId,
			anchor: previousThread?.anchor ?? comment.anchor ?? null,
			likeCount: 0,
			isLiked: false,
			commentCount: 0,
			createdAt: previousThread?.createdAt ?? comment.note.createdAt,
		};
		if (props.guide.id === guideId) emit('changed', changed);
		if (version !== requestVersion) return;
		comments.value = comments.value.filter(row => row.id !== comment.id);
		allCommentCount.value = threads.reduce((sum, thread) => sum + thread.commentCount, 0);
		if (changed.id === activeThread.value?.id) activeThread.value = changed;
		if (replyTo.value?.id === comment.id) replyTo.value = null;
	} catch {
		if (version === requestVersion) error.value = ui.actionFailed;
	} finally {
		deleting.value.delete(comment.id);
	}
}

function resizeInput() {
	if (!input.value) return;
	input.value.style.height = 'auto';
	input.value.style.height = `${Math.min(input.value.scrollHeight, Math.max(80, viewportHeight.value * .23))}px`;
}

function focusComposer() {
	if (!$i) return;
	input.value?.focus({ preventScroll: true });
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.isComposing) {
		event.preventDefault();
		publish();
	}
}

function insertEmoji(event: PointerEvent) {
	if (!$i || posting.value) return;
	const target = event.currentTarget;
	if (!(target instanceof HTMLElement)) return;
	let start = input.value?.selectionStart ?? text.value.length;
	let end = input.value?.selectionEnd ?? start;
	emojiOpen.value = true;
	emojiPicker.show(target, emoji => {
		text.value = text.value.slice(0, start) + emoji + text.value.slice(end);
		start += emoji.length;
		end = start;
	}, () => {
		emojiOpen.value = false;
		nextTick(() => {
			focusComposer();
			input.value?.setSelectionRange(start, end);
			resizeInput();
		});
	});
}

async function addFiles(selected: File[]) {
	if (!$i || posting.value || uploading.value || !selected.length) return;
	const available = 4 - files.value.length;
	if (selected.length > available) error.value = ui.fileLimit;
	else error.value = '';
	uploading.value = true;
	const version = requestVersion;
	try {
		for (const file of selected.slice(0, available)) {
			uploadProgress.value = 0;
			const upload = uploadFile(file, { onProgress: ({ total, loaded }) => { uploadProgress.value = Math.round(loaded / total * 100); } });
			abortUpload = upload.abort;
			const uploaded = await upload.filePromise;
			if (version !== requestVersion || closing) return;
			files.value.push(uploaded);
			rememberDraft();
		}
	} catch {
		if (version === requestVersion && !closing) error.value = ui.uploadFailed;
	} finally {
		abortUpload = null;
		uploading.value = false;
	}
}

function onFilesChosen(event: Event) {
	const target = event.target as HTMLInputElement;
	const selected = Array.from(target.files ?? []);
	target.value = '';
	addFiles(selected);
}

function onPaste(event: ClipboardEvent) {
	const selected = Array.from(event.clipboardData?.files ?? []);
	if (selected.length) {
		event.preventDefault();
		addFiles(selected);
	}
}

function removeFile(id: string) {
	if (posting.value) return;
	files.value = files.value.filter(file => file.id !== id);
}

async function requestClose() {
	if (closing || closePending || posting.value || uploading.value || emojiOpen.value) return false;
	closePending = true;
	if (text.value.trim() || files.value.length) {
		const { canceled } = await os.confirm({ type: 'question', title: ui.draftTitle, okText: ui.keepAndClose, cancelText: ui.keepEditing });
		if (canceled) {
			closePending = false;
			pendingLocate = null;
			return false;
		}
	}
	rememberDraft();
	closing = true;
	modal.value?.close();
	return true;
}

function isHistorical(anchor: GuideAnchor) {
	return anchor.revision !== props.guide.revision;
}

async function locate(anchor: GuideAnchor) {
	if (isHistorical(anchor)) return;
	pendingLocate = anchor;
	if (!(await requestClose())) pendingLocate = null;
}

function onClosed() {
	if (pendingLocate) emit('locate', pendingLocate);
	emit('closed');
}

function onOpened() {
	if (props.initialCompose) focusComposer();
}

function updateViewport() {
	mobile.value = window.innerWidth < 700;
	const viewport = window.visualViewport;
	viewportHeight.value = viewport?.height ?? window.innerHeight;
	keyboardInset.value = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
	resizeInput();
}

function startDrag(event: PointerEvent) {
	if (event.button !== 0 || !mobile.value || !panel.value) return;
	dragOrigin = { y: event.clientY, height: panel.value.getBoundingClientRect().height, moved: false };
	(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function moveDrag(event: PointerEvent) {
	if (!dragOrigin) return;
	const delta = dragOrigin.y - event.clientY;
	if (Math.abs(delta) < 5 && !dragOrigin.moved) return;
	dragOrigin.moved = true;
	dragging.value = true;
	dragHeight.value = Math.max(viewportHeight.value * .4, Math.min(viewportHeight.value * .96, dragOrigin.height + delta));
}

function endDrag(event: PointerEvent) {
	if (!dragOrigin) return;
	if (dragOrigin.moved) {
		suppressHandleClick = true;
		expanded.value = (dragHeight.value ?? dragOrigin.height) > viewportHeight.value * .77;
	}
	(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
	dragOrigin = null;
	dragging.value = false;
	dragHeight.value = null;
}

function cancelDrag() {
	dragOrigin = null;
	dragging.value = false;
	dragHeight.value = null;
}

function toggleHeight() {
	if (suppressHandleClick) {
		suppressHandleClick = false;
		return;
	}
	expanded.value = !expanded.value;
}

watch(scopeKey, (_value, previous) => {
	if (previous) rememberDraft(previous);
	initialize();
}, { immediate: true });
watch(() => props.thread, thread => {
	if (thread && sameAnchor(thread.anchor, activeAnchor.value)) activeThread.value = thread;
});

onMounted(() => {
	window.addEventListener('resize', updateViewport);
	window.visualViewport?.addEventListener('resize', updateViewport);
	window.visualViewport?.addEventListener('scroll', updateViewport);
	updateViewport();
	// Keep the initial focus in the opening interaction, before the modal animation finishes.
	if (props.initialCompose) nextTick(focusComposer);
});
onBeforeUnmount(() => {
	rememberDraft();
	closing = true;
	requestVersion++;
	abortUpload?.();
	window.removeEventListener('resize', updateViewport);
	window.visualViewport?.removeEventListener('resize', updateViewport);
	window.visualViewport?.removeEventListener('scroll', updateViewport);
});
</script>

<style lang="scss" module>
.panel {
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	width: min(480px, 100%);
	height: min(760px, 86dvh);
	margin: auto;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	box-shadow: 0 12px 40px var(--MI_THEME-shadow);
	overflow: hidden;
	container-type: inline-size;
	@media (min-width: 1200px) { margin: auto 0 auto auto; }
}
.mobile { width: 100%; margin: 0; max-height: none; border-radius: var(--MI-radius) var(--MI-radius) 0 0; border-bottom: 0; transition: height .2s ease; }
.dragging { transition: none; }
.handle { width: 100%; min-height: 24px; flex-shrink: 0; display: grid; place-items: center; touch-action: none; }
.handle span { width: 32px; height: 4px; border-radius: 4px; background: var(--MI_THEME-divider); }
.header { display: flex; flex-shrink: 0; align-items: center; justify-content: space-between; padding: 15px 20px 10px; font-size: .95em; }
.mobile .header { padding-top: 0; }
.count { margin-left: 8px; font-size: .85em; font-weight: 400; color: var(--MI_THEME-fgTransparentWeak); }
.close { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; color: var(--MI_THEME-fgTransparentWeak); }
.close:hover { background: var(--MI_THEME-panelHighlight); }
.quoteHeader { flex-shrink: 0; padding: 6px 20px 12px; border-bottom: 1px solid var(--MI_THEME-divider); }
.quote { margin: 0; padding: 0 0 0 12px; border-left: 3px solid var(--MI_THEME-accent); font-size: .94em; line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; white-space: pre-wrap; }
.quoteExpanded { display: block; max-height: 20dvh; overflow: auto; }
.quoteActions { display: flex; justify-content: flex-end; gap: 14px; margin-top: 5px; font-size: .74em; color: var(--MI_THEME-fgTransparentWeak); }
.quoteActions button { display: flex; align-items: center; gap: 3px; min-height: 30px; }
.quoteStats { display: flex; gap: 26px; margin-top: 3px; font-size: .88em; }
.quoteStats button { display: flex; align-items: center; gap: 7px; min-height: 32px; }
.liked { color: var(--MI_THEME-love); }
.list { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 2px 20px 18px; }
.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 120px; height: 100%; color: var(--MI_THEME-fgTransparentWeak); font-size: .88em; }
.empty > i { font-size: 26px; opacity: .6; }
.empty p { margin: 8px 0; }
.more { margin: 12px auto; }
.commentQuote { display: flex; gap: 7px; width: 100%; padding: 10px 12px; border-radius: 8px; background: var(--MI_THEME-bg); color: var(--MI_THEME-fgTransparentWeak); font-size: .78em; text-align: left; line-height: 1.6; }
.commentQuote span { flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.commentQuote small { flex-shrink: 0; font-size: .9em; }
.composer { flex-shrink: 0; border-top: 1px solid var(--MI_THEME-divider); padding: 12px 18px max(12px, env(safe-area-inset-bottom)); background: var(--MI_THEME-panel); }
.input { box-sizing: border-box; display: block; width: 100%; min-height: 54px; max-height: 200px; resize: none; padding: 9px 12px; border: 1px solid transparent; border-radius: 10px; background: var(--MI_THEME-bg); color: var(--MI_THEME-fg); font: inherit; font-size: max(16px, .94em); line-height: 1.6; outline: none; }
.input:focus { border-color: var(--MI_THEME-accent); }
.input::placeholder { color: var(--MI_THEME-fgTransparentWeak); }
.composerTools { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
.tool { width: 34px; height: 34px; border-radius: 8px; font-size: 20px; color: var(--MI_THEME-fgTransparentWeak); }
.publish { margin-left: auto; min-width: 68px; }
.uploadProgress { font-size: .72em; color: var(--MI_THEME-fgTransparentWeak); }
.hidden { display: none; }
.replyTarget { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: .79em; color: var(--MI_THEME-accent); }
.replyTarget button { min-width: 32px; min-height: 28px; }
.attachments { display: flex; gap: 8px; margin-bottom: 9px; overflow-x: auto; }
.attachment { position: relative; width: 58px; height: 58px; flex-shrink: 0; border-radius: 8px; overflow: hidden; background: var(--MI_THEME-bg); }
.attachment img { width: 100%; height: 100%; object-fit: cover; }
.attachment button { position: absolute; right: 0; top: 0; width: 25px; height: 25px; background: var(--MI_THEME-panel); border-radius: 0 0 0 7px; }
.fileName { display: block; padding: 8px 4px; overflow: hidden; font-size: .65em; }
.error { margin: 8px 0 0; color: var(--MI_THEME-error); font-size: .8em; }
@media (prefers-reduced-motion: reduce) { .mobile { transition: none; } }
</style>
