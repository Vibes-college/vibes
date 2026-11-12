// SPDX-License-Identifier: AGPL-3.0-only
// 社区路由的小替身。小程序只有一页；去社区别的页面（闯关、定级、别的小程序）就是整页跳过去。
// getCurrentFullPath 返回「/dictation?…」的样子，好让从社区抄来的代码照旧解析 ?gate=、?from=quest。
export const APP_BASE = import.meta.env.BASE_URL; // '/apps/dictation/'
const NAME = APP_BASE.replace(/^\/apps\/|\/$/g, '');
const router = {
	getCurrentFullPath: () => `/${NAME}${location.search}${location.hash}`,
	pushByPath: (path: string) => { location.assign(path); },
	push: (path: string) => { location.assign(path); },
};
export const useRouter = () => router;
export const mainRouter = router;
