<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<article :class="[$style.root, { [$style.reply]: comment.replyToId }]" :data-comment-id="comment.id" data-testid="guide-comment">
	<MkAvatar :user="note.user" :class="$style.avatar" link preview/>
	<div :class="$style.body">
		<div :class="$style.header">
			<MkA :to="userPage(note.user)" :class="$style.name"><MkUserName :user="note.user"/></MkA>
			<MkTime :time="note.createdAt" :class="$style.time"/>
		</div>
		<div v-if="replyName" :class="$style.replyTo">{{ i18n.ts.reply }} {{ replyName }}</div>
		<div v-if="note.text" class="_selectable" :class="$style.text"><Mfm :text="note.text" :author="note.user" :emojiUrls="note.emojis" :nyaize="'respect'"/></div>
		<MkMediaList v-if="note.files?.length" :mediaList="note.files" :user="note.user" :class="$style.media"/>
		<div :class="$style.actions">
			<button class="_button" :disabled="!$i" @click="emit('reply', comment)">{{ i18n.ts.reply }}</button>
			<button class="_button" :class="{ [$style.liked]: isLiked }" :disabled="!$i || reacting" :aria-pressed="isLiked" :aria-label="ui.like" @click="toggleLike">
				<i :class="isLiked ? 'ti ti-heart-filled' : 'ti ti-heart'"></i><span v-if="likeCount">{{ likeCount }}</span>
			</button>
			<button v-if="$i?.id === note.userId" class="_button" :class="$style.remove" :disabled="deleting" :aria-label="i18n.ts.delete" @click="emit('delete', comment)"><i class="ti ti-trash"></i></button>
		</div>
		<p v-if="error" :class="$style.error" role="alert">{{ error }}</p>
	</div>
</article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { GuideComment } from '@/lojo/guides/types.js';
import MkMediaList from '@/components/MkMediaList.vue';
import { userPage } from '@/filters/user.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	comment: GuideComment;
	replyName?: string;
	deleting?: boolean;
}>();
const emit = defineEmits<{
	(ev: 'reply', comment: GuideComment): void;
	(ev: 'delete', comment: GuideComment): void;
}>();
const ui = { like: '喜欢', failed: '操作失败，请重试' };
const note = ref(props.comment.note);
watch(() => props.comment.note, value => { note.value = value; });
const reacting = ref(false);
const error = ref('');
const isLiked = computed(() => ['❤', '❤️'].includes(note.value.myReaction ?? ''));
const likeCount = computed(() => (note.value.reactions['❤'] ?? 0) + (note.value.reactions['❤️'] ?? 0));

async function toggleLike() {
	if (!$i || reacting.value) return;
	reacting.value = true;
	error.value = '';
	try {
		if (isLiked.value) {
			await misskeyApi('notes/reactions/delete', { noteId: note.value.id });
		} else {
			await misskeyApi('notes/reactions/create', { noteId: note.value.id, reaction: '❤' });
		}
		note.value = await misskeyApi('notes/show', { noteId: note.value.id });
	} catch {
		error.value = ui.failed;
	} finally {
		reacting.value = false;
	}
}
</script>

<style lang="scss" module>
.root { display: flex; gap: 12px; padding: 18px 0; }
.reply { padding-left: 22px; }
.avatar { flex-shrink: 0; width: 34px; height: 34px; }
.body { min-width: 0; flex: 1; }
.header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 7px; }
.name { font-size: .91em; font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.time { flex-shrink: 0; font-size: .76em; color: var(--MI_THEME-fgTransparentWeak); }
.text { font-size: .95em; line-height: 1.7; overflow-wrap: anywhere; }
.replyTo { margin: 0 0 5px; font-size: .78em; color: var(--MI_THEME-fgTransparentWeak); }
.media { margin-top: 10px; }
.actions { display: flex; gap: 18px; align-items: center; margin-top: 8px; color: var(--MI_THEME-fgTransparentWeak); font-size: .8em; }
.actions button { display: flex; align-items: center; gap: 5px; min-height: 32px; }
.actions .liked { color: var(--MI_THEME-love); }
.remove { margin-left: auto; }
.error { color: var(--MI_THEME-error); font-size: .8em; }
</style>
