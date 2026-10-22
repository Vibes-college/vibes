/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, watch } from 'vue';
import { url as instanceUrl } from '@@/js/config.js';
import type * as Misskey from 'misskey-js';
import { lojoApi } from './api.js';
import { lojoLabels } from './labels.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import MkPostFormDialog from '@/components/MkPostFormDialog.vue';
import { pleaseLogin } from '@/utility/please-login.js';
import { uploadFile } from '@/utility/drive.js';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';

export type MapContribution = {
	entityKey?: string;
	title?: string;
	url?: string;
	text?: string;
	image?: string;
};

type PendingLink = { entityId: string; noteId: string; userId: string; status: 'linking' | 'failed' };

function restorePendingLinks(): PendingLink[] {
	if (!$i) return [];
	try {
		const records: unknown = miLocalStorage.getItemAsJson(`lojoPendingLinks:${$i.id}`);
		if (!Array.isArray(records)) return [];
		return records.filter((item): item is PendingLink => item != null && item.userId === $i?.id && typeof item.entityId === 'string' && typeof item.noteId === 'string').map(item => ({ ...item, status: 'failed' }));
	} catch { return []; }
}

export const pendingLojoLinks = ref<PendingLink[]>(restorePendingLinks());
export const lojoNotesRevision = ref(0);

watch(pendingLojoLinks, links => {
	if (!$i) return;
	try {
		miLocalStorage.setItemAsJson(`lojoPendingLinks:${$i.id}`, links.filter(link => link.userId === $i?.id));
	} catch { /* In private browsing the in-memory retry and unload guard still apply. */ }
}, { deep: true, flush: 'sync' });

async function attachImage(source: string, ownerId: string): Promise<Misskey.entities.DriveFile> {
	const imageUrl = new URL(source, window.location.origin);
	if (!source.startsWith('data:image/') && !(imageUrl.origin === window.location.origin && imageUrl.pathname.startsWith('/lojo-assets/'))) {
		throw new Error('INVALID_IMAGE_SOURCE');
	}
	const response = await window.fetch(imageUrl.href);
	if (!response.ok) throw new Error('IMAGE_LOAD_FAILED');
	const blob = await response.blob();
	if (!blob.type.startsWith('image/') || blob.size > 12 * 1024 * 1024) throw new Error('INVALID_IMAGE');
	// Re-encode camera photos before Drive stores the original, removing GPS/EXIF.
	const bitmap = await createImageBitmap(blob);
	const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
	const canvas = window.document.createElement('canvas');
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	const cleanBlob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(result => result ? resolve(result) : reject(new Error('IMAGE_ENCODE_FAILED')), 'image/jpeg', 0.9);
	});
	if ($i?.id !== ownerId) throw new Error('ACCOUNT_CHANGED');
	const upload = uploadFile(cleanBlob, { name: `lojo-${Date.now()}.jpg` });
	const timeout = window.setTimeout(upload.abort, 60_000);
	try {
		return await upload.filePromise;
	} finally {
		window.clearTimeout(timeout);
	}
}

export async function retryLojoLink(link: PendingLink): Promise<void> {
	if ($i?.id !== link.userId) throw new Error('ACCOUNT_CHANGED');
	link.status = 'linking';
	try {
		await lojoApi.link(link.entityId, link.noteId, $i.token);
		pendingLojoLinks.value = pendingLojoLinks.value.filter(item => item.noteId !== link.noteId || item.entityId !== link.entityId);
		lojoNotesRevision.value++;
	} catch (error) {
		link.status = 'failed';
		throw error;
	}
}

export async function composeLojoNote(contribution: MapContribution): Promise<void> {
	if (!await pleaseLogin() || !$i) return;
	const ownerId = $i.id;
	let canonicalUrl = '';
	if (contribution.entityKey) {
		try {
			const entity = await lojoApi.entity(contribution.entityKey);
			canonicalUrl = new URL(entity.route.startsWith('#') ? `/lojo/map${entity.route}` : entity.route, instanceUrl).href;
		} catch (error) {
			await os.alert({ type: 'error', text: lojoLabels.unsupportedEntity });
			return;
		}
	}
	let initialFiles: Misskey.entities.DriveFile[] = [];
	if (contribution.image) {
		try {
			initialFiles = [await attachImage(contribution.image, ownerId)];
		} catch (error) {
			await os.alert({ type: 'error', text: i18n.ts.failedToUpload });
			return;
		}
	}
	if ($i?.id !== ownerId) return;
	const text = [contribution.text ?? contribution.title ?? '', canonicalUrl].filter(Boolean).join('\n\n');
	await new Promise<void>(resolve => {
		const { dispose } = os.popup(MkPostFormDialog, {
			initialText: text,
			initialFiles,
			initialLocalOnly: true,
			initialVisibility: 'public',
			lockAccount: true,
			instant: true,
			disableDrafts: true,
		}, {
			posted: (note: Misskey.entities.Note) => {
				if (!contribution.entityKey) { lojoNotesRevision.value++; return; }
				pendingLojoLinks.value.push({ entityId: contribution.entityKey, noteId: note.id, userId: note.userId, status: 'linking' });
				const link = pendingLojoLinks.value.at(-1)!;
				void retryLojoLink(link).catch(() => {});
			},
			closed: () => {
				dispose();
				resolve();
			},
		});
	});
}
