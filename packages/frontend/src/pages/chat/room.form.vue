<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- Vibes: one rounded box, text on top, tools and a round send button below (founder 2026-11-11 23:30: "没有框框"). -->
<div
	:class="[$style.root, { [$style.focused]: focused }]"
	data-chat-form
	@dragover.stop="onDragover"
	@drop.stop="onDrop"
>
	<textarea
		ref="textareaEl"
		v-model="text"
		:class="$style.textarea"
		rows="1"
		:placeholder="placeholder ?? i18n.ts.inputMessageHere"
		:readonly="textareaReadOnly"
		@keydown="onKeydown"
		@paste="onPaste"
		@focus="focused = true"
		@blur="focused = false"
	></textarea>
	<div v-if="englishPanel" :class="$style.english">
		<MkLojoEnglishCompose mode="compose" :text="text" @use="useEnglish" @close="englishPanel = false"/>
	</div>
	<div v-if="file" :class="$style.file" @click="file = null"><i class="ti ti-photo"></i> {{ file.name }} <i class="ti ti-x"></i></div>
	<footer :class="$style.footer">
		<div :class="$style.buttons">
			<button class="_button" :class="$style.button" :aria-label="i18n.ts.attachFile" @click="chooseFile"><i class="ti ti-photo-plus"></i></button>
			<button class="_button" :class="$style.button" :aria-label="i18n.ts.emoji" @click="insertEmoji"><i class="ti ti-mood-happy"></i></button>
			<button v-if="englishStatus.available" v-tooltip="englishLabels.composeButton" class="_button" :class="[$style.button, { [$style.buttonActive]: englishPanel }]" :aria-label="englishLabels.composeButton" :aria-expanded="englishPanel" @click="toggleEnglish"><i class="ti ti-language"></i></button>
			<button class="_button" :class="$style.send" data-chat-send :disabled="!canSend || sending" :title="i18n.ts.send" :aria-label="i18n.ts.send" @click="send">
				<template v-if="!sending"><i class="ti ti-arrow-up"></i></template><template v-if="sending"><MkLoading :em="true"/></template>
			</button>
		</div>
	</footer>
	<input ref="fileEl" style="display: none;" type="file" @change="onChangeFile"/>
</div>
</template>

<script lang="ts" setup>
import { onMounted, watch, ref, shallowRef, computed, nextTick, readonly, onBeforeUnmount } from 'vue';
import * as Misskey from 'misskey-js';
//import insertTextAtCursor from 'insert-text-at-cursor';
import { formatTimeString } from '@/utility/format-time-string.js';
import { selectFile } from '@/utility/drive.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { prefer } from '@/preferences.js';
import { Autocomplete } from '@/utility/autocomplete.js';
import { emojiPicker } from '@/utility/emoji-picker.js';
import { checkDragDataType, getDragData } from '@/drag-and-drop.js';
import MkLojoEnglishCompose from '@/components/MkLojoEnglishCompose.vue';
import { englishLabels } from '@/lojo/english/labels.js';
import { englishStatus, loadEnglishStatus } from '@/lojo/english/api.js';

const props = defineProps<{
	user?: Misskey.entities.UserDetailed | null;
	room?: Misskey.entities.ChatRoom | null;
	placeholder?: string; // Vibes: "跟 Vibi 说点什么…" in a chat with Vibi
}>();

const textareaEl = shallowRef<HTMLTextAreaElement>();
const fileEl = shallowRef<HTMLInputElement>();

const text = ref<string>('');
const file = ref<Misskey.entities.DriveFile | null>(null);
const sending = ref(false);
const textareaReadOnly = ref(false);
const focused = ref(false);
let autocompleteInstance: Autocomplete | null = null;

const canSend = computed(() => (text.value != null && text.value !== '') || file.value != null);

// Vibes: the same "turn it into English" panel as the post form, for the message being written.
const englishPanel = ref(false);
loadEnglishStatus();

function toggleEnglish() {
	if (englishPanel.value) {
		englishPanel.value = false;
		return;
	}
	const body = text.value.trim();
	if (body === '') {
		os.toast(englishLabels.composeEmpty);
		return;
	}
	if (body.length > 1000) {
		os.toast(englishLabels.composeTooLong);
		return;
	}
	englishPanel.value = true;
}

function useEnglish(english: string) {
	text.value = english;
	englishPanel.value = false;
	nextTick(() => textareaEl.value?.focus());
}

function getDraftKey() {
	return props.user ? 'user:' + props.user.id : 'room:' + props.room?.id;
}

watch([text, file], saveDraft);

// Vibes: one line when empty, taller as the text grows, up to about five lines, then it scrolls inside the box
// (field-sizing is not in every Safari yet, so size it by hand; the cap is max-height in the style).
function fitHeight() {
	const el = textareaEl.value;
	if (el == null) return;
	el.style.height = 'auto';
	el.style.height = `${el.scrollHeight}px`;
}

watch(text, () => nextTick(fitHeight));

async function onPaste(ev: ClipboardEvent) {
	if (!ev.clipboardData) return;

	const pastedFileName = 'yyyy-MM-dd HH-mm-ss [{{number}}]';

	const clipboardData = ev.clipboardData;
	const items = clipboardData.items;

	if (items.length === 1) {
		if (items[0].kind === 'file') {
			const pastedFile = items[0].getAsFile();
			if (!pastedFile) return;
			const lio = pastedFile.name.lastIndexOf('.');
			const ext = lio >= 0 ? pastedFile.name.slice(lio) : '';
			const formattedName = formatTimeString(new Date(pastedFile.lastModified), pastedFileName).replace(/{{number}}/g, '1') + ext;
			const renamedFile = new File([pastedFile], formattedName, { type: pastedFile.type });
			os.launchUploader([renamedFile], { multiple: false }).then(driveFiles => {
				file.value = driveFiles[0];
			});
		}
	} else {
		if (items[0].kind === 'file') {
			os.alert({
				type: 'error',
				text: i18n.ts.onlyOneFileCanBeAttached,
			});
		}
	}
}

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	const isFile = ev.dataTransfer.items[0].kind === 'file';
	if (isFile || checkDragDataType(ev, ['driveFiles'])) {
		ev.preventDefault();
		switch (ev.dataTransfer.effectAllowed) {
			case 'all':
			case 'uninitialized':
			case 'copy':
			case 'copyLink':
			case 'copyMove':
				ev.dataTransfer.dropEffect = 'copy';
				break;
			case 'linkMove':
			case 'move':
				ev.dataTransfer.dropEffect = 'move';
				break;
			default:
				ev.dataTransfer.dropEffect = 'none';
				break;
		}
	}
}

function onDrop(ev: DragEvent): void {
	if (!ev.dataTransfer) return;

	// ファイルだったら
	if (ev.dataTransfer.files.length === 1) {
		ev.preventDefault();
		os.launchUploader([Array.from(ev.dataTransfer.files)[0]], { multiple: false });
		return;
	} else if (ev.dataTransfer.files.length > 1) {
		ev.preventDefault();
		os.alert({
			type: 'error',
			text: i18n.ts.onlyOneFileCanBeAttached,
		});
		return;
	}

	//#region ドライブのファイル
	{
		const droppedData = getDragData(ev, 'driveFiles');
		if (droppedData != null) {
			file.value = droppedData[0];
			ev.preventDefault();
		}
	}
	//#endregion
}

function onKeydown(ev: KeyboardEvent) {
	if (ev.isComposing || ev.key === 'Process' || ev.keyCode === 229) return;
	if (ev.key === 'Enter') {
		if (prefer.s['chat.sendOnEnter']) {
			if (!(ev.ctrlKey || ev.metaKey || ev.shiftKey)) {
				send();
			}
		} else {
			if ((ev.ctrlKey || ev.metaKey)) {
				send();
			}
		}
	}
}

function chooseFile(ev: PointerEvent) {
	selectFile({
		anchorElement: ev.currentTarget ?? ev.target,
		multiple: false,
		label: i18n.ts.selectFile,
	}).then(selectedFile => {
		file.value = selectedFile;
	});
}

function onChangeFile() {
	if (fileEl.value == null || fileEl.value.files == null) return;

	if (fileEl.value.files[0]) {
		os.launchUploader(Array.from(fileEl.value.files), { multiple: false }).then(driveFiles => {
			file.value = driveFiles[0];
		});
	}
}

function send() {
	if (!canSend.value) return;

	sending.value = true;

	if (props.user) {
		misskeyApi('chat/messages/create-to-user', {
			toUserId: props.user.id,
			text: text.value ? text.value : undefined,
			fileId: file.value ? file.value.id : undefined,
		}).then(message => {
			clear();
		}).catch(err => {
			console.error(err);
		}).then(() => {
			sending.value = false;
		});
	} else if (props.room) {
		misskeyApi('chat/messages/create-to-room', {
			toRoomId: props.room.id,
			text: text.value ? text.value : undefined,
			fileId: file.value ? file.value.id : undefined,
		}).then(message => {
			clear();
		}).catch(err => {
			console.error(err);
		}).then(() => {
			sending.value = false;
		});
	}
}

function clear() {
	text.value = '';
	file.value = null;
	englishPanel.value = false;
	deleteDraft();
}

function saveDraft() {
	const drafts = JSON.parse(miLocalStorage.getItem('chatMessageDrafts') || '{}');

	drafts[getDraftKey()] = {
		updatedAt: new Date(),
		data: {
			text: text.value,
			file: file.value,
		},
	};

	miLocalStorage.setItem('chatMessageDrafts', JSON.stringify(drafts));
}

function deleteDraft() {
	const drafts = JSON.parse(miLocalStorage.getItem('chatMessageDrafts') || '{}');

	delete drafts[getDraftKey()];

	miLocalStorage.setItem('chatMessageDrafts', JSON.stringify(drafts));
}

async function insertEmoji(ev: MouseEvent) {
	textareaReadOnly.value = true;
	const target = ev.currentTarget ?? ev.target;
	if (target == null) return;

	// emojiPickerはダイアログが閉じずにtextareaとやりとりするので、
	// focustrapをかけているとinsertTextAtCursorが効かない
	// そのため、投稿フォームのテキストに直接注入する
	// See: https://github.com/misskey-dev/misskey/pull/14282
	//      https://github.com/misskey-dev/misskey/issues/14274

	let pos = textareaEl.value?.selectionStart ?? 0;
	let posEnd = textareaEl.value?.selectionEnd ?? text.value.length;
	emojiPicker.show(
		target as HTMLElement,
		emoji => {
			const textBefore = text.value.substring(0, pos);
			const textAfter = text.value.substring(posEnd);
			text.value = textBefore + emoji + textAfter;
			pos += emoji.length;
			posEnd += emoji.length;
		},
		() => {
			textareaReadOnly.value = false;
			nextTick(() => focus());
		},
	);
}

onMounted(() => {
	if (textareaEl.value != null) {
		autocompleteInstance = new Autocomplete(textareaEl.value, text);
	}

	// 書きかけの投稿を復元
	const draft = JSON.parse(miLocalStorage.getItem('chatMessageDrafts') || '{}')[getDraftKey()];
	if (draft) {
		text.value = draft.data.text;
		file.value = draft.data.file;
	}
	nextTick(fitHeight);
});

onBeforeUnmount(() => {
	if (autocompleteInstance) {
		autocompleteInstance.detach();
		autocompleteInstance = null;
	}
});
</script>

<style lang="scss" module>
// Vibes: the message box (founder 2026-11-11 23:30). 12px from the sides, 8px from the bottom; the page footer adds the
// home indicator (room.vue / PageWithHeader.vue) so this stays the same with the bottom bar folded, out, or the keyboard up.
.root {
	position: relative;
	box-sizing: border-box;
	width: calc(100% - 24px);
	max-width: 676px;
	margin: 0 auto 8px;
	border-radius: 22px;
	border: 1px solid color-mix(in srgb, var(--MI_THEME-fg) 9%, transparent);
	background: var(--MI_THEME-panel);
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
	overflow: clip;
	transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.focused {
	border-color: color-mix(in srgb, var(--MI_THEME-accent) 55%, transparent);
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--MI_THEME-accent) 14%, transparent), 0 2px 10px rgba(0, 0, 0, 0.05);
}

.textarea {
	cursor: auto;
	display: block;
	width: 100%;
	min-width: 100%;
	max-width: 100%;
	// One line empty; about five lines at most, then it scrolls inside the box.
	min-height: 0;
	max-height: calc(1.45em * 5 + 12px);
	overflow-y: auto;
	margin: 0;
	padding: 10px 16px 2px;
	resize: none;
	font-size: 1em;
	line-height: 1.45;
	font-family: inherit;
	outline: none;
	border: none;
	border-radius: 0;
	box-shadow: none;
	box-sizing: border-box;
	background: transparent;
	color: var(--MI_THEME-fg);

	&::placeholder {
		color: color-mix(in srgb, var(--MI_THEME-fg) 45%, transparent);
	}
}

// Vibes: not sticky (founder's iPhone, 2026-11-11: after the keyboard closed, the send row was gone until she
// scrolled). The form already sits in the page's sticky footer; a second sticky inside it, in a box with overflow: clip,
// was placed below the box by iOS Safari after the keyboard changed the page height, and clipped away.
.footer {
	padding: 0 6px 6px;
}

.file {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	margin: 4px 12px 0;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 12px;
	background: color-mix(in srgb, var(--MI_THEME-fg) 6%, transparent);
	cursor: pointer;
}

.buttons {
	display: flex;
	align-items: center;
}

// (.buttons > so it wins over the global _button colour)
.buttons > .button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 18px;
	font-size: 20px;
	color: color-mix(in srgb, var(--MI_THEME-fg) 55%, transparent);

	&:hover {
		color: var(--MI_THEME-accent);
		background: color-mix(in srgb, var(--MI_THEME-accent) 8%, transparent);
	}
}

.buttons > .send {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-left: auto;
	width: 34px;
	height: 34px;
	border-radius: 50%;
	font-size: 18px;
	color: #fff;
	background: var(--MI_THEME-accent);
	transition: background 0.15s ease, transform 0.1s ease;

	> i {
		-webkit-text-stroke: 0.6px currentColor;
	}

	&:active:not(:disabled) {
		transform: scale(0.94);
	}

	&:disabled {
		cursor: default;
		color: #fff;
		background: color-mix(in srgb, var(--MI_THEME-fg) 16%, transparent);
	}
}

// Dark mode: the light text colour at 16% reads as a lit button on navy, so the greyed-out send is dimmed further
// (faint fill, grey arrow) to look as unclickable as the grey one in light mode.
html[data-color-scheme=dark] .buttons > .send:disabled {
	color: color-mix(in srgb, var(--MI_THEME-fg) 38%, transparent);
	background: color-mix(in srgb, var(--MI_THEME-fg) 8%, transparent);
}

// Vibes: the English button while its panel is open, and the panel between the textarea and the buttons.
.buttons > .buttonActive {
	color: var(--MI_THEME-accent);
}

.english {
	margin: 6px 10px 0;
	// The form lives in the sticky page footer; a long result must not push the textarea off a small screen.
	max-height: 40vh;
	overflow-y: auto;
}
</style>
