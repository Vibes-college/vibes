// SPDX-License-Identifier: AGPL-3.0-only
import { computed, isRef, watchEffect } from 'vue';
import type { ComputedRef, Ref } from 'vue';
type PageMeta = { title: string | Ref<string> | ComputedRef<string>; icon?: string; needWideArea?: boolean };
export const pageTitle = computed(() => document.title);
export function definePage(fn: () => PageMeta) {
	watchEffect(() => { const t = fn().title; const s = isRef(t) ? t.value : t; document.title = s ? `${s} · Vibes` : 'Vibes'; });
}
