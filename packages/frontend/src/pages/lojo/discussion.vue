<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" preferType="dialog" @closed="emit('closed')" @esc="close" @click="close">
	<section class="_panel" :class="$style.root" role="dialog" :aria-label="entity?.title ?? lojoLabels.discussion">
		<header :class="$style.header">
			<div><strong>{{ entity?.title ?? lojoLabels.discussion }}</strong></div>
			<button class="_button" :class="$style.icon" :aria-label="i18n.ts.close" @click="close"><i class="ti ti-x"></i></button>
		</header>
		<div :class="$style.actions">
			<MkButton primary rounded :disabled="!entity" @click="compose"><i class="ti ti-pencil"></i> {{ lojoLabels.share }}</MkButton>
			<MkButton rounded :disabled="loading" :aria-label="i18n.ts.reload" @click="load(false)"><i class="ti ti-refresh"></i></MkButton>
		</div>
		<div v-if="error" :class="$style.message" role="alert">{{ i18n.ts.somethingHappened }} <button class="_textButton" @click="load(false)">{{ i18n.ts.retry }}</button></div>
		<MkLoading v-if="loading && notes.length === 0"/>
		<div v-else-if="!error && notes.length === 0" :class="$style.message">{{ i18n.ts.noNotes }}</div>
		<div :class="$style.notes">
			<MkNote v-for="note in notes" :key="note.id" :note="note"/>
		</div>
		<MkButton v-if="hasMore" :class="$style.more" :disabled="loading" rounded @click="load(true)">{{ i18n.ts.loadMore }}</MkButton>
	</section>
</MkModal>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef, watch } from 'vue';
import type * as Misskey from 'misskey-js';
import type { LojoEntity } from '@/lojo/api.js';
import { lojoApi } from '@/lojo/api.js';
import { lojoLabels } from '@/lojo/labels.js';
import { composeLojoNote, lojoNotesRevision } from '@/lojo/community.js';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import MkNote from '@/components/MkNote.vue';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';

const props = defineProps<{ entityId: string }>();
const emit = defineEmits<{ (ev: 'closed'): void }>();
const modal = useTemplateRef('modal');
const router = useRouter();
const entity = ref<LojoEntity | null>(null);
const notes = ref<Misskey.entities.Note[]>([]);
const loading = ref(false);
const error = ref(false);
const hasMore = ref(false);
let refreshQueued = false;

function close() {
	modal.value?.close();
}

async function load(append: boolean) {
	if (loading.value) { if (!append) refreshQueued = true; return; }
	loading.value = true;
	error.value = false;
	try {
		const [details, result] = await Promise.all([
			entity.value ? Promise.resolve(entity.value) : lojoApi.entity(props.entityId),
			lojoApi.notes(props.entityId, append ? notes.value.at(-1)?.id : undefined),
		]);
		entity.value = details;
		const existingIds = new Set(append ? notes.value.map(note => note.id) : []);
		notes.value = [...(append ? notes.value : []), ...result.filter(note => !existingIds.has(note.id))];
		hasMore.value = result.length === 30;
	} catch (err) {
		error.value = true;
	} finally {
		loading.value = false;
		if (refreshQueued) { refreshQueued = false; void load(false); }
	}
}

async function compose() {
	await composeLojoNote({ entityKey: props.entityId });
	await load(false);
}

watch(lojoNotesRevision, () => { void load(false); });
router.useListener('change', close);
router.useListener('same', close);
onMounted(() => { void load(false); });
</script>

<style lang="scss" module>
.root {
	width: min(640px, calc(100vw - 24px));
	max-height: min(860px, calc(100dvh - 32px));
	overflow-y: auto;
}
.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 16px 20px;
	border-bottom: 1px solid var(--MI_THEME-divider);
}
.icon { padding: 8px; }
.actions { display: flex; gap: 8px; padding: 16px 20px; }
.message { padding: 24px 20px; color: var(--MI_THEME-fg); }
.notes > * + * { border-top: 1px solid var(--MI_THEME-divider); }
.more { margin: 16px auto; }
</style>
