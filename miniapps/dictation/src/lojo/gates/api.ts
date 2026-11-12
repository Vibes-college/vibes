// SPDX-License-Identifier: AGPL-3.0-only
// 攻略的标题（「看攻略《…》」链接用），问社区 lojo/guides/show。和社区 lojo/gates/api.ts 的 guideTitle 一样。
import { misskeyApi } from '@/utility/misskey-api.js';

const isGuideSlug = (ref: string): boolean => /^[a-z0-9]+(-[a-z0-9]+)+$/.test(ref);

export function guideTitle(guide: string): Promise<string> {
	return misskeyApi<{ title: string }>('lojo/guides/show', isGuideSlug(guide) ? { slug: guide } : { guideId: guide }).then(found => found.title);
}
